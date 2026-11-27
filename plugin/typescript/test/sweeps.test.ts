/* Bounded block work: the per-block tx cap, EndBlock sweeps with carry-over, and the paged flood (SPEC §7.4). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AUTHORITY, Chain, G, GAME, K, MICRO, Player, R, auditOccupancy, auditTreasury, must, teleport } from './harness.ts';

const fullErr = (r: { error?: { msg: string } }) => r.error?.msg.includes('block is full') ?? false;

describe('per-block tx cap', () => {
    it('txs past maxTxPerBlock fail "block is full" and get in when resubmitted; set_params is exempt', async () => {
        const chain = new Chain();
        await chain.put(K.KeyParams(), { maxTxPerBlock: 2 });
        const ps = [0, 1, 2, 3].map((i) => new Player(chain, `cap.${i}`));
        const first = ps.map((p) => p.tx('faucet_claim'));
        chain.setBalance(AUTHORITY, 1n * MICRO);
        const params = chain.tx(AUTHORITY, 'set_params', { paramsJson: JSON.stringify({ faucetEnabled: true }) });
        await chain.block();
        const rs = await Promise.all(first);
        assert.deepEqual(rs.map((r) => (r.error ? (fullErr(r) ? 'full' : r.error.msg) : 'ok')), ['ok', 'ok', 'full', 'full']);
        must(await params);
        // a rejected tx paid nothing and changed nothing; resubmitted, it fits in the next block
        assert.equal(chain.balance(ps[2].address), 0n);
        const again = [ps[2].tx('faucet_claim'), ps[3].tx('faucet_claim')];
        await chain.block();
        for (const r of await Promise.all(again)) must(r);
        assert.equal(chain.balance(ps[3].address), 100n * MICRO);
    });
});

describe('EndBlock sweeps carry over', () => {
    it('forfeits run at most sweepPerBlock per block, oldest first, the rest the next blocks', async () => {
        const chain = new Chain();
        await chain.put(K.KeyParams(), { sweepPerBlock: 2 });
        const rolls: string[] = [];
        const pending = [];
        for (let i = 0; i < 5; i++) {
            const p = new Player(chain, `forfeit.${i}`);
            pending.push(p.tx('faucet_claim'));
            const [, rid, created] = await p.create(`f${i}`, 'fighter');
            rolls.push(rid);
            pending.push(created);
        }
        const committedAt = chain.height;
        await chain.block();
        for (const r of await Promise.all(pending)) must(r);
        await chain.blocks(GAME.revealWindow + 3); // nobody reveals: due at committedAt + R
        const heights = [];
        for (const rid of rolls) {
            const roll = await chain.json(K.KeyRoll(rid));
            assert.equal(roll.resolved?.outcome, 'forfeited');
            heights.push(roll.resolved.height);
        }
        const due = committedAt + GAME.revealWindow;
        assert.deepEqual(heights.sort((a, b) => a - b), [due, due, due + 1, due + 1, due + 2]);
        assert.deepEqual(await chain.store().range(K.PrefixExpiryAll()), []);
    });

    it('ferries past sweepPerBlock wait a block; a late ferry still happens', async () => {
        const chain = new Chain();
        const a = new Player(chain, 'ferry.a');
        const b = new Player(chain, 'ferry.b');
        const ca = await a.newDelver('wizard');
        const cb = await b.newDelver('wizard');
        await chain.put(K.KeyParams(), { sweepPerBlock: 1 });
        const downedAt = chain.height;
        for (const c of [ca, cb]) {
            await teleport(chain, c, 4, { status: 'downed', hp: 0, downedAt });
            await chain.put(K.KeyFerry(downedAt + R.DOWNED_BLOCKS + 1, c), { at: downedAt + R.DOWNED_BLOCKS + 1 });
        }
        const at = new Map<string, number>();
        for (let i = 0; i < R.DOWNED_BLOCKS + 5 && at.size < 2; i++) {
            const h = chain.height;
            for (const e of (await chain.block()).events) if (e.kind === 'CharacterFerried') at.set(e.data.charId, h);
        }
        assert.deepEqual([...at.values()].sort((x, y) => x - y), [downedAt + R.DOWNED_BLOCKS + 1, downedAt + R.DOWNED_BLOCKS + 2]);
        for (const c of [ca, cb]) assert.deepEqual([(await a.char(c)).char.room, (await a.char(c)).char.hp], [0, 1]);
    });

    it('the activity index tracks each character at exactly its last-action height', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'active');
        const c = await p.newDelver('fighter');
        await chain.blocks(3);
        const [, committed] = await p.act(c, { kind: 'action', actionId: 'narthex.search_silt' });
        await chain.block();
        must(await committed);
        const entries = await chain.store().range(K.PrefixActive(1));
        const ch = (await p.char(c)).char;
        assert.deepEqual(entries.map((e) => [K.segmentU64(e.key, 3), K.lastSegmentHex(e.key)]), [[ch.lastActionHeight, c]]);
    });
});

describe('roll pruning', () => {
    it('resolved and forfeited rolls are deleted GAME.rollRetention blocks after they resolve, and not before', async () => {
        const chain = new Chain();
        const a = new Player(chain, 'prune.a');
        const b = new Player(chain, 'prune.b');
        const claims = [a.tx('faucet_claim'), b.tx('faucet_claim')];
        const [, ra, ca] = await a.create('a', 'fighter');
        const [, rb, cb] = await b.create('b', 'fighter');
        await chain.block();
        for (const r of [...claims, ca, cb]) must(await r);
        const revealed = a.reveal(ra);
        await chain.block();
        must(await revealed);
        const resolvedAt = chain.height - 1;
        await chain.blocks(GAME.revealWindow + 2); // b never reveals: forfeited at its expiry
        const forfeitedAt = (await chain.json(K.KeyRoll(rb))).resolved.height;
        assert.equal((await chain.json(K.KeyRoll(rb))).resolved.outcome, 'forfeited');
        while (chain.height <= resolvedAt + GAME.rollRetention - 1) await chain.block();
        assert.ok(await chain.json(K.KeyRoll(ra)), 'kept through its retention');
        await chain.block();
        assert.equal(await chain.json(K.KeyRoll(ra)), null);
        assert.ok(await chain.json(K.KeyRoll(rb)));
        while (chain.height <= forfeitedAt + GAME.rollRetention) await chain.block();
        assert.equal(await chain.json(K.KeyRoll(rb)), null);
        assert.deepEqual(await chain.store().range(K.PrefixRollPruneAll()), []);
    });
});

describe('the paged flood', () => {
    it('washes out sweepPerBlock characters a block, closes the level meanwhile, then starts the new season', async () => {
        const chain = new Chain();
        const players = [0, 1, 2, 3, 4].map((i) => new Player(chain, `flood.${i}`));
        const chars = [];
        for (const p of players) chars.push(await p.newDelver('rogue'));
        await teleport(chain, chars[0], 1, { carriedGold: 30 });
        await chain.put(K.KeyLedger(), { outstanding: 30 });
        const afterBoss = R.blocksFor(R.loadContent().levels.get(1)!.def.season.resetAfterBossSeconds);
        await chain.blocks(afterBoss);
        await chain.put(K.KeyParams(), { sweepPerBlock: 2 });
        const lvl = (await G.getLevel(chain.store(), 1))!;
        await chain.put(K.KeyLevel(1), { ...lvl, bossKilledAt: chain.height - afterBoss, budgetPaid: 30 }); // endsAt = the next block
        const kinds: string[] = [];
        let ended;
        let closedMsg = '';
        for (let i = 0; i < 6 && !ended; i++) {
            let mv;
            if (i === 1) {
                // mid-flood, a character still on the level can't act
                const left = [];
                for (const c of chars) if ((await players[0].char(c)).char.status === 'delving') left.push(c);
                mv = (await players[chars.indexOf(left[0])].act(left[0], { kind: 'move', toRoom: 2 }, { noCommit: true }))[1];
            }
            const end = await chain.block();
            assert.equal(end.error, undefined, JSON.stringify(end.error));
            if (mv) closedMsg = (await mv).error?.msg ?? '';
            for (const e of end.events) kinds.push(e.kind === 'FloodSwept' ? `swept${e.data.charIds.length}` : e.kind);
            ended = end.events.find((e) => e.kind === 'SeasonEnded');
        }
        assert.match(closedMsg, /flooding/);
        assert.deepEqual(kinds.filter((k) => k !== 'SeasonStarted'), ['FloodBegan', 'swept2', 'swept2', 'swept1', 'SeasonEnded']);
        assert.equal(ended.data.swept, 5);
        assert.equal(ended.data.returned, 700 - 30 + 30);
        for (const c of chars) {
            const ch = (await players[0].char(c)).char;
            assert.deepEqual([ch.status, ch.carriedGold, ch.hp], ['camp', 0, ch.maxHp]);
        }
        assert.deepEqual(await chain.store().range(K.PrefixWhereLevel(1)), []);
        assert.deepEqual(await chain.store().range(K.PrefixActive(1)), []);
        const next = (await G.getLevel(chain.store(), 1))!;
        assert.deepEqual([next.season, next.flood, next.budgetReserved], [2, undefined, 700]);
        await auditOccupancy(chain);
        const audit = await auditTreasury(chain);
        assert.equal(audit.ledger, audit.owed);
    });
});
