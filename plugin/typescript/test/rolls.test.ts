/* Characters, commit-reveal, forfeits, fizzles, locks and loot races (SPEC §7.3, §9.4). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Chain, G, GAME, K, Player, R, auditOccupancy, editRoom, must, teleport } from './harness.ts';

const id = (h: string) => Buffer.from(h, 'hex');
const kinds = (r: { events: { kind: string }[] }) => r.events.map((e) => e.kind);

describe('characters', () => {
    it('create commits to the stat roll, reveal rolls 4d6-drop-lowest, assign and enter', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'a');
        p.tx('faucet_claim');
        const [charId, rid, created] = await p.create('Brannoc', 'fighter');
        await chain.block();
        assert.deepEqual(kinds(must(await created)), ['CharacterCreated']);
        const early = p.reveal(rid);
        const revealed = await chain.block().then(() => early);
        const ev = must(revealed).events[0];
        assert.equal(ev.kind, 'StatsRolled');
        // anyone can verify the roll from the event and the beacon of the commit block
        const beacon = await chain.json(K.KeyBeacon(1));
        assert.equal(ev.data.beacon, beacon.value);
        const dice = new R.SeededDice(R.rollSeed(id(ev.data.secret), id(ev.data.beacon), id(rid)));
        assert.deepEqual(R.rollStats(dice), ev.data.rolled);
        const bad = p.tx('assign_stats', { charId: id(charId), permutation: [0, 0, 1, 2, 3, 4] });
        const good = p.tx('assign_stats', { charId: id(charId), permutation: [5, 4, 3, 2, 1, 0] });
        const enter = p.tx('enter_dungeon', { charId: id(charId) });
        await chain.block();
        assert.match((await bad).error!.msg, /permutation/);
        must(await good);
        must(await enter);
        const rec = await p.char(charId);
        assert.deepEqual([rec.char.status, rec.char.room], ['delving', 1]);
        assert.deepEqual(rec.char.stats, [...ev.data.rolled].reverse());
    });

    it('at most 5 living characters per account; names and classes are validated', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'a');
        p.tx('faucet_claim');
        await chain.block();
        for (let i = 0; i < 5; i++) {
            const [, , r] = await p.create(`c${i}`, 'rogue');
            await chain.block();
            must(await r);
        }
        const [, , sixth] = await p.create('c5', 'rogue');
        const [, , badClass] = await p.create('x', 'bard');
        await chain.block();
        assert.match((await sixth).error!.msg, /at most 5/);
        assert.match((await badClass).error!.msg, /5|class/);
    });
});

describe('commit-reveal', () => {
    it('a plain move resolves at once; sending a commit with it is rejected', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'a');
        const c = await p.newDelver('fighter');
        const [, withCommit] = await p.act(c, { kind: 'move', toRoom: 3 });
        await chain.block();
        assert.match((await withCommit).error!.msg, /needs no roll/);
        const [, plain] = await p.act(c, { kind: 'move', toRoom: 3 }, { noCommit: true });
        await chain.block();
        assert.deepEqual(kinds(must(await plain)), ['ActionResolved']);
        assert.equal((await p.char(c)).char.room, 3);
    });

    it('an attack commits in block h and resolves on reveal in h+1 with verifiable dice', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'a');
        const c = await p.newDelver('fighter');
        // walking into the Ossuary rolls initiative against its skeletons (the ambush variant): a roll of its own
        const [mid, mv] = await p.act(c, { kind: 'move', toRoom: 2 });
        await chain.block();
        must(await mv);
        const arrived = p.reveal(mid);
        await chain.block();
        assert.ok(must(await arrived).events[0].data.events.some((e: { t: string }) => e.t === 'initiative'));
        const [rid, committed] = await p.act(c, { kind: 'attack', target: '0' });
        const commitHeight = chain.height;
        await chain.block();
        assert.deepEqual(kinds(must(await committed)), ['ActionCommitted']);
        assert.equal((await p.char(c)).pending, rid);
        const revealed = p.reveal(rid);
        await chain.block();
        const ev = must(await revealed).events[0];
        assert.equal(ev.kind, 'ActionResolved');
        assert.equal(ev.data.committedAt, commitHeight);
        const dice = new R.SeededDice(R.rollSeed(id(ev.data.secret), id(ev.data.beacon), id(rid)));
        for (const d of ev.data.dice) assert.equal(dice.roll(d.sides, d.owner), d.value);
        assert.equal((await p.char(c)).pending, null);
    });

    it('rejects: a second act while pending, a wrong secret, a same-block reveal, and someone else revealing', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'a');
        const q = new Player(chain, 'b');
        const c = await p.newDelver('fighter');
        await teleport(chain, c, 2);
        const [rid, committed] = await p.act(c, { kind: 'attack', target: '0' });
        const sameBlock = p.reveal(rid);
        await chain.block();
        must(await committed);
        assert.match((await sameBlock).error!.msg, /after the commit block/);
        const [, again] = await p.act(c, { kind: 'attack', target: '1' });
        const wrong = p.reveal(rid, new Uint8Array(32));
        q.tx('faucet_claim');
        const theirs = q.reveal(rid, p.secretOf(rid));
        await chain.block();
        assert.match((await again).error!.msg, /pending/);
        assert.match((await wrong).error!.msg, /does not match/);
        assert.match((await theirs).error!.msg, /not your roll/);
    });

    it('checks legality at commit and ownership', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'a');
        const q = new Player(chain, 'b');
        const c = await p.newDelver('fighter');
        q.tx('faucet_claim');
        const [, far] = await p.act(c, { kind: 'move', toRoom: 12 }, { noCommit: true });
        const [, notMine] = await q.act(c, { kind: 'move', toRoom: 3 }, { noCommit: true });
        const [, noCommit] = await p.act(c, { kind: 'action', actionId: 'narthex.search_silt' }, { noCommit: true });
        await chain.block();
        assert.match((await far).error!.msg, /no such exit/);
        assert.match((await notMine).error!.msg, /not your character/);
        assert.match((await noCommit).error!.msg, /commit/);
    });

    it('a crowded room costs no more than an empty one: idle room-mates are counted, not loaded', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'p');
        const c = await p.newDelver('fighter');
        const idle: string[] = [];
        for (let i = 0; i < 20; i++) {
            const q = new Player(chain, `idle.${i}`);
            idle.push(await q.newDelver('rogue'));
        }
        // the 21 delvers are all in the Narthex; count character records read while p searches the silt
        const charPrefix = Buffer.from(K.lenPrefix(K.ABBEY_PREFIX, Buffer.from('char'))).toString('hex');
        let charReads = 0;
        const read = chain.mem.read.bind(chain.mem);
        chain.mem.read = async (keys: Uint8Array[]) => {
            charReads += keys.filter((k) => Buffer.from(k).toString('hex').startsWith(charPrefix)).length;
            return read(keys);
        };
        const [rid, committed] = await p.act(c, { kind: 'action', actionId: 'narthex.search_silt' });
        await chain.block();
        must(await committed);
        const r = p.reveal(rid);
        await chain.block();
        must(await r);
        // CheckTx twice + DeliverTx for commit and reveal: the actor's record only, never the 20 idle room-mates
        assert.ok(charReads <= 6, `read ${charReads} character records`);
        assert.equal(idle.length, 20);
    });

    it("in the boss room the Tide Wail loads only room-mates still in the fight; idle ones lie low, unread and unhurt", async () => {
        const chain = new Chain();
        const p = new Player(chain, 'p');
        const c = await p.newDelver('fighter');
        const ally = await new Player(chain, 'ally').newDelver('cleric');
        const idle: string[] = [];
        for (let i = 0; i < 10; i++) idle.push(await new Player(chain, `idle.${i}`).newDelver('rogue'));
        await chain.blocks(R.LIE_LOW_BLOCKS + 2); // long enough ago to have lain low
        for (const id of idle) await teleport(chain, id, 12, { lastActionHeight: chain.height - R.LIE_LOW_BLOCKS - 1 });
        await teleport(chain, c, 12, { lastActionHeight: chain.height });
        await teleport(chain, ally, 12, { lastActionHeight: chain.height });
        await editRoom(chain, 12, (r) => (r.counters['aoe:0'] = 2)); // the next exchange brings the Wail
        const charPrefix = Buffer.from(K.lenPrefix(K.ABBEY_PREFIX, Buffer.from('char'))).toString('hex');
        const readIds = new Set<string>();
        const read = chain.mem.read.bind(chain.mem);
        chain.mem.read = async (keys: Uint8Array[]) => {
            for (const k of keys) {
                const h = Buffer.from(k).toString('hex');
                if (h.startsWith(charPrefix)) readIds.add(h.slice(-32));
            }
            return read(keys);
        };
        const [rid, committed] = await p.act(c, { kind: 'attack', target: '0' });
        await chain.block();
        must(await committed);
        const r = p.reveal(rid);
        await chain.block();
        const res = must(await r);
        assert.ok(res.events.some((e: any) => e.kind === 'ActionResolved' && e.data.events.some((x: any) => x.t === 'tideWail')));
        assert.ok(readIds.has(ally));
        assert.deepEqual(idle.filter((id) => readIds.has(id)), []);
        const allyCh = (await p.char(ally)).char;
        assert.ok(allyCh.hp < allyCh.maxHp, 'the ally in the fight takes the Wail');
        for (const id of idle) {
            const ch = (await p.char(id)).char;
            assert.equal(ch.hp, ch.maxHp);
        }
    });

    it('a crowd still in the fight: the Wail reaches the actor and the ROOM_WIDE_MAX most recent, and reads only them', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'p');
        const c = await p.newDelver('fighter');
        await chain.blocks(5);
        const crowd: string[] = [];
        const s = chain.store();
        const tmpl = await p.char(c);
        for (let i = 0; i < R.ROOM_WIDE_MAX + 8; i++) {
            const id = Buffer.from(K.u64(i)).toString('hex') + 'aa'.repeat(8);
            // all recent; the first 8 a block staler than the rest, so they're the ones left out
            const ch = { ...tmpl.char, id, owner: 'bb'.repeat(20), room: 12, hp: 99, maxHp: 99, lastActionHeight: chain.height - (i < 8 ? 2 : 1) };
            s.setJSON(K.KeyChar(id), { ...tmpl, char: ch, pending: null });
            await G.moveIndex(s, id, null, ch);
            crowd.push(id);
        }
        await s.flush();
        await teleport(chain, c, 12, { lastActionHeight: chain.height, hp: 99, maxHp: 99 });
        await editRoom(chain, 12, (r) => (r.counters['aoe:0'] = 2));
        const charPrefix = Buffer.from(K.lenPrefix(K.ABBEY_PREFIX, Buffer.from('char'))).toString('hex');
        const readIds = new Set<string>();
        const read = chain.mem.read.bind(chain.mem);
        chain.mem.read = async (keys: Uint8Array[]) => {
            for (const k of keys) {
                const h = Buffer.from(k).toString('hex');
                if (h.startsWith(charPrefix)) readIds.add(h.slice(-32));
            }
            return read(keys);
        };
        const [rid, committed] = await p.act(c, { kind: 'attack', target: '0' });
        await chain.block();
        must(await committed);
        const r = p.reveal(rid);
        await chain.block();
        must(await r);
        assert.deepEqual(crowd.slice(0, 8).filter((id) => readIds.has(id)), []);
        const hurt = [];
        for (const id of crowd) if ((await p.char(id)).char.hp < 99) hurt.push(id);
        assert.deepEqual(hurt, crowd.slice(8));
        await auditOccupancy(chain);
    });

    it('a change to a room-mate is persisted (only changed characters are rewritten)', async () => {
        const chain = new Chain();
        const a = new Player(chain, 'healer');
        const b = new Player(chain, 'hurt');
        const ca = await a.newDelver('cleric');
        const cb = await b.newDelver('fighter');
        await teleport(chain, ca, 4);
        await teleport(chain, cb, 4, { hp: 3 });
        const [rid, committed] = await a.act(ca, { kind: 'ability', ability: 'heal', target: cb });
        await chain.block();
        must(await committed);
        const r = a.reveal(rid);
        await chain.block();
        must(await r);
        assert.ok((await b.char(cb)).char.hp >= 3 + 4, 'heal of 2d4+2 on a room-mate was not persisted');
    });

    it('a roll nobody reveals is forfeited R blocks later: player dice at their minimum', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'a');
        const c = await p.newDelver('fighter');
        await teleport(chain, c, 2);
        const [rid, committed] = await p.act(c, { kind: 'attack', target: '0' });
        const commitHeight = chain.height;
        await chain.block();
        must(await committed);
        let forfeited;
        while (chain.height <= commitHeight + GAME.revealWindow) {
            const end = await chain.block();
            forfeited ??= end.events.find((e) => e.kind === 'ActionForfeited');
        }
        assert.ok(forfeited, 'no ActionForfeited event');
        assert.equal(forfeited.data.rollId, rid);
        assert.ok(forfeited.data.dice.filter((d: any) => d.owner === 'pc').every((d: any) => d.value === 1));
        assert.ok(forfeited.data.dice.filter((d: any) => d.owner === 'npc').every((d: any) => d.value === d.sides));
        assert.equal((await p.char(c)).pending, null);
        const late = p.reveal(rid);
        await chain.block();
        assert.match((await late).error!.msg, /already resolved/);
    });

    it('fizzles with no dice when the target is gone by the reveal', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'a');
        const c = await p.newDelver('fighter');
        await teleport(chain, c, 5);
        const [rid, committed] = await p.act(c, { kind: 'attack', target: '0' });
        await chain.block();
        must(await committed);
        await editRoom(chain, 5, (r) => (r.monsters[0].status = 'dead')); // someone else killed it in between
        const revealed = p.reveal(rid);
        await chain.block();
        const ev = must(await revealed).events[0];
        assert.equal(ev.kind, 'ActionFizzled');
        assert.equal(ev.data.reason, 'no such target');
        assert.equal((await p.char(c)).pending, null);
    });

    it('loot race: the pile is reserved at commit; a second take is rejected until the reservation is released', async () => {
        const chain = new Chain();
        const a = new Player(chain, 'a');
        const b = new Player(chain, 'b');
        const ca = await a.newDelver('fighter');
        const cb = await b.newDelver('fighter');
        await teleport(chain, ca, 12);
        await teleport(chain, cb, 12);
        await editRoom(chain, 12, (r) => {
            r.pile.push({ id: 'ab'.repeat(16), template: 'rope', sourceLevel: 1, escrow: 0 });
        });
        const [rid, first] = await a.act(ca, { kind: 'take', lootRef: 'pile' }); // the Abbot is alive: it needs a roll
        await chain.block();
        must(await first);
        const [, second] = await b.act(cb, { kind: 'take', lootRef: 'pile' });
        await chain.block();
        assert.match((await second).error!.msg, /already taking/);
        // a never reveals: the forfeit releases the reservation
        await chain.blocks(GAME.revealWindow);
        assert.equal((await a.char(ca)).pending, null);
        const roll = await chain.json(K.KeyRoll(rid));
        assert.equal(roll.resolved.outcome, 'forfeited');
        const [, retry] = await b.act(cb, { kind: 'take', lootRef: 'pile' });
        await chain.block();
        const ok = await retry;
        // the forfeited take still happened (forfeit is an outcome, not a cancellation), so the pile may be empty now
        assert.ok(!ok.error || /nothing here/.test(ok.error.msg), ok.error?.msg);
    });
});
