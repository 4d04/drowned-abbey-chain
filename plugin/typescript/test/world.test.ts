/* EndBlock duties, the Ferryman, seasons, determinism, persistence and RPC (SPEC §7.4, §9.4–9.5). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import Long from 'long';
import { Chain, G, GAME, K, MICRO, Player, R, auditOccupancy, auditTreasury, editRoom, must, route, teleport } from './harness.ts';

const id = (h: string) => Buffer.from(h, 'hex');

describe('levels and the beacon', () => {
    it('level 1 activates at its height with its season budget; the beacon chains every block', async () => {
        const chain = new Chain();
        const end = await chain.block();
        const act = end.events.find((e) => e.kind === 'LevelActivated')!;
        assert.equal(act.data.levelId, 1);
        assert.equal(act.data.contentHash, R.loadContent().levels.get(1)!.contentHash);
        assert.equal(act.data.budget, 700);
        await chain.block();
        const b1 = await chain.json(K.KeyBeacon(1));
        const b2 = await chain.json(K.KeyBeacon(2));
        assert.notEqual(b1.value, b2.value);
        assert.equal(b2.txCount, 0);
    });

    it('activated before the treasury is funded, a level reserves its budget once gold arrives', async () => {
        const chain = new Chain({ treasury: 0n });
        await chain.block();
        assert.equal((await G.getLevel(chain.store(), 1))!.budgetReserved, 0);
        chain.setBalance(GAME.treasury, 1000n * MICRO); // a core send to the treasury address
        const end = await chain.block();
        assert.ok(end.events.some((e) => e.kind === 'BudgetReserved'));
        const lvl = await G.getLevel(chain.store(), 1);
        assert.deepEqual([lvl!.budgetReserved, lvl!.scaleBp], [700, 10_000]);
    });

    it('the stairs to level 2 stay sealed: the level is not in this release', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'p');
        const c = await p.newDelver('fighter');
        await teleport(chain, c, 12);
        await editRoom(chain, 12, (r) => (r.monsters[0].status = 'dead'));
        const s = chain.store();
        const lvl = await G.getLevel(s, 1);
        await chain.put(K.KeyLevel(1), { ...lvl, bossKilledAt: chain.height - 1 });
        const [, mv] = await p.act(c, { kind: 'move', toLevel: 2, toRoom: 0 }, { noCommit: true });
        await chain.block();
        assert.match((await mv).error!.msg, /flooded/);
    });
});

describe('the Ferryman', () => {
    it('after 20 blocks downed: wake at camp, items stay in the room, half the gold to an active player on the level', async () => {
        const chain = new Chain();
        const a = new Player(chain, 'a');
        const b = new Player(chain, 'b');
        const ca = await a.newDelver('wizard');
        const cb = await b.newDelver('fighter'); // entered just now: active on level 1
        const downedAt = chain.height;
        await teleport(chain, ca, 11, { status: 'downed', hp: 0, downedAt, carriedGold: 31, inventory: [{ id: 'ef'.repeat(16), template: 'rope', sourceLevel: 0, escrow: 0 }] });
        await chain.put(K.KeyLedger(), { outstanding: 31 });
        const due = downedAt + R.DOWNED_BLOCKS + 1;
        await chain.put(K.KeyFerry(due, ca), { at: due });
        let ferried;
        while (!ferried && chain.height <= due) ferried = (await chain.block()).events.find((e) => e.kind === 'CharacterFerried');
        assert.ok(ferried);
        const rec = (await a.char(ca)).char;
        assert.deepEqual([rec.status, rec.levelId, rec.room, rec.hp, rec.carriedGold], ['delving', 1, 0, 1, 15]);
        assert.equal((await b.char(cb)).char.carriedGold, 16);
        assert.deepEqual(ferried.data.shares.map((s: any) => [s.charId, s.amount]), [[cb, 16]]);
        const room = await G.getRoom(chain.store(), (await G.getLevel(chain.store(), 1))!, 11);
        assert.deepEqual(room.corpses.map((x: any) => [x.charId, x.gold, x.items.length]), [[ca, 0, 1]]);
        await auditOccupancy(chain);
        const audit = await auditTreasury(chain);
        assert.equal(audit.ledger, audit.owed);
        // the occupancy index followed: a is at the Lychgate now
        const there = await chain.store().range(K.PrefixWhere(1, 0));
        assert.ok(there.some((e) => K.lastSegmentHex(e.key) === ca));
    });

    it('a stabilized character is not ferried by a stale schedule', async () => {
        const chain = new Chain();
        const a = new Player(chain, 'a');
        const ca = await a.newDelver('wizard');
        const downedAt = chain.height;
        await teleport(chain, ca, 4, { status: 'delving', hp: 1, downedAt: 0 });
        await chain.put(K.KeyFerry(downedAt + R.DOWNED_BLOCKS + 1, ca), { at: downedAt + R.DOWNED_BLOCKS + 1 });
        const ends = await chain.blocks(R.DOWNED_BLOCKS + 5);
        assert.ok(!ends.some((e) => e.events.some((x) => x.kind === 'CharacterFerried')));
        assert.equal((await a.char(ca)).char.room, 4);
    });
});

describe('seasons', () => {
    it('the bell warns 100 blocks out; at the end the flood sweeps the level and a fresh season starts', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'p');
        const c = await p.newDelver('fighter');
        const season = R.loadContent().levels.get(1)!.def.season;
        const afterBoss = R.blocksFor(season.resetAfterBossSeconds);
        const warning = R.blocksFor(season.bellWarningSeconds);
        await chain.blocks(afterBoss - warning); // the boss must have died at a real height
        await teleport(chain, c, 9, { carriedGold: 40 });
        await editRoom(chain, 1, (r) => (r.pools.silt = 6));
        await chain.put(K.KeyLedger(), { outstanding: 46 });
        const s = chain.store();
        const lvl = (await G.getLevel(s, 1))!;
        // boss died 200 blocks ago: the bell now (300 − 100), the flood 100 blocks later
        await chain.put(K.KeyLevel(1), { ...lvl, bossKilledAt: chain.height - (afterBoss - warning), budgetPaid: 46 });
        const bell = await chain.block();
        assert.ok(bell.events.some((e) => e.kind === 'BellTolled'));
        let ended;
        for (let i = 0; i <= warning && !ended; i++) {
            const end = await chain.block();
            assert.equal(end.error, undefined, JSON.stringify(end.error));
            ended = end.events.find((e) => e.kind === 'SeasonEnded');
        }
        assert.ok(ended);
        assert.equal(ended.data.returned, 700 - 46 + 6 + 40);
        const next = (await G.getLevel(chain.store(), 1))!;
        assert.deepEqual([next.season, next.bossKilledAt, next.budgetPaid, next.budgetReserved], [2, 0, 0, 700]);
        const rec = (await p.char(c)).char;
        assert.deepEqual([rec.room, rec.carriedGold], [0, 0]);
        assert.equal((await G.getLedger(chain.store())).outstanding, 0);
        // the new season's rooms start fresh
        const silt = await G.getRoom(chain.store(), next, 1);
        assert.equal(silt.pools.silt, 0);
    });
});

/** A fixed scenario: two players, several rolls, a forfeit. */
async function scenario(chain: Chain): Promise<void> {
    const a = new Player(chain, 'det-a');
    const b = new Player(chain, 'det-b');
    const ca = await a.newDelver('fighter');
    const cb = await b.newDelver('cleric');
    for (const [pl, ch] of [[a, ca], [b, cb]] as const) {
        // into the Ossuary: initiative against the skeletons waiting there
        const [rid, mv] = await pl.act(ch, { kind: 'move', toRoom: 2 });
        await chain.block();
        must(await mv);
        const arrived = pl.reveal(rid);
        await chain.block();
        must(await arrived);
    }
    for (let i = 0; i < 4; i++) {
        const [ra, xa] = await a.act(ca, { kind: 'attack', target: String(i % 3) });
        const [rb, xb] = await b.act(cb, { kind: 'attack', target: '0' });
        await chain.block();
        const okA = !(await xa).error;
        const okB = !(await xb).error;
        if (okA) a.reveal(ra);
        if (okB && i !== 2) b.reveal(rb); // b skips one reveal: a forfeit
        await chain.block();
    }
    await chain.blocks(GAME.revealWindow + 2);
}

describe('determinism and persistence', () => {
    it('two plugin instances replaying the same blocks write byte-identical state', async () => {
        const x = new Chain();
        const y = new Chain();
        await scenario(x);
        await scenario(y);
        assert.ok(x.mem.log.length > 30);
        assert.deepEqual(x.mem.log, y.mem.log);
        assert.deepEqual([...x.mem.data.entries()].sort(), [...y.mem.data.entries()].sort());
    });

    it('state lives entirely in the backend: a restarted plugin carries on', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'p');
        const c = await p.newDelver('rogue');
        // a fresh contract instance over the same state, as after a plugin restart
        const Contract = chain.contract.constructor;
        const restarted = new Contract({ ChainId: 2, DataDirPath: '', rpcAddress: '' }, null, null, Long.ZERO);
        restarted.backend = chain.mem;
        (chain as any).contract = restarted;
        const [, mv] = await p.act(c, { kind: 'move', toRoom: 3 }, { noCommit: true });
        await chain.block();
        must(await mv);
        assert.equal((await p.char(c)).char.room, 3);
    });
});

describe('read-only RPC', () => {
    it('serves levels, options with odds and roll needs, rolls, treasury and params', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'p');
        const c = await p.newDelver('fighter');
        await teleport(chain, c, 2);
        const s = chain.store();
        const [st, levels] = await route(s, '/abbey/levels');
        assert.equal(st, 200);
        assert.equal((levels as any)[0].contentHash, R.loadContent().levels.get(1)!.contentHash);
        const [, stats] = (await route(s, '/abbey/stats?blocks=2')) as [number, any];
        assert.equal(stats.maxTxPerBlock, 150);
        assert.equal(stats.recentBlocks.blocks, 2);
        assert.deepEqual(stats.levels[0].busiestRooms, [{ room: 2, standing: 1, downed: 0 }]);
        assert.deepEqual(stats.backlog, { forfeitsDue: 0, ferriesDue: 0 });
        const [, opts] = (await route(s, `/abbey/options?char=${c}`)) as [number, any];
        const flee = opts.options.find((o: any) => o.intent.kind === 'move');
        assert.deepEqual([flee.needsRoll, flee.odds.target], [true, 16]);
        assert.ok(opts.options.some((o: any) => o.intent.kind === 'attack' && o.odds.kind === 'attack'));
        const [, room] = (await route(s, '/abbey/room?level=1&room=2')) as [number, any];
        assert.deepEqual(room.characters.map((x: any) => x.id), [c]);
        const [, treasury] = (await route(s, '/abbey/treasury')) as [number, any];
        assert.equal(treasury.budgets[0].reserved, 700);
        const [, params] = (await route(s, '/abbey/params')) as [number, any];
        assert.equal(params.params.faucetAmount, '100000000');
        assert.equal((await route(s, '/abbey/nope'))[0], 404);
        const [rid, committed] = await p.act(c, { kind: 'attack', target: '0' });
        await chain.block();
        must(await committed);
        const [, roll] = (await route(chain.store(), `/abbey/roll?id=${rid}`)) as [number, any];
        assert.equal(roll.resolved, null);
        void id;
    });
});
