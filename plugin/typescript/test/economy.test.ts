/* Faucet, params, fees, extraction, shop and stash: every move of real gold (SPEC §6). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AUTHORITY, CHAIN_ID, Chain, G, GAME, K, MICRO, Player, SEND_FEE, auditOccupancy, auditTreasury, must, teleport } from './harness.ts';

const id = (h: string) => Buffer.from(h, 'hex');

async function setParams(chain: Chain, patch: unknown) {
    const r = chain.tx(AUTHORITY, 'set_params', { paramsJson: JSON.stringify(patch) });
    chain.setBalance(AUTHORITY, 1n * MICRO);
    await chain.block();
    return r;
}

describe('faucet', () => {
    it('a brand-new account with 0 balance claims 100 GOLD with fee 0; a fee on a claim is rejected', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'new');
        assert.equal(chain.balance(p.address), 0n);
        const ok = p.tx('faucet_claim');
        const withFee = p.tx('faucet_claim', {}, 5n);
        await chain.block();
        assert.deepEqual((await ok).events.map((e) => e.kind), ['FaucetClaimed']);
        assert.match((await withFee).error!.msg, /fee 0/);
        assert.equal(chain.balance(p.address), 100n * MICRO);
        assert.equal(chain.balance(GAME.faucet), 9_900n * MICRO);
    });

    it('limits switch on with one set_params: cooldown, lifetime cap, per-block cap, kill switch', async () => {
        const chain = new Chain();
        const a = new Player(chain, 'a');
        const b = new Player(chain, 'b');
        must(await setParams(chain, { faucetCooldownBlocks: 5, faucetMaxPerBlock: 1 }));
        const a1 = a.tx('faucet_claim');
        const b1 = b.tx('faucet_claim');
        await chain.block();
        must(await a1);
        assert.match((await b1).error!.msg, /block limit/);
        const a2 = a.tx('faucet_claim');
        await chain.block();
        assert.match((await a2).error!.msg, /cooldown/);
        must(await setParams(chain, { faucetCooldownBlocks: 0, faucetMaxPerBlock: 0, faucetMaxPerAccount: '150000000' }));
        const a3 = a.tx('faucet_claim');
        await chain.block();
        assert.match((await a3).error!.msg, /lifetime/);
        must(await setParams(chain, { faucetEnabled: false }));
        const b2 = b.tx('faucet_claim');
        await chain.block();
        assert.match((await b2).error!.msg, /disabled/);
    });

    it('set_params: only the authority, only whitelisted fields, never a fee on the faucet', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'p');
        p.tx('faucet_claim');
        await chain.block();
        const stranger = p.tx('set_params', { paramsJson: JSON.stringify({ faucetEnabled: false }) });
        await chain.block();
        assert.match((await stranger).error!.msg, /authority/);
        assert.match((await setParams(chain, { treasury: 'mine' })).error!.msg, /not settable/);
        assert.match((await setParams(chain, { fees: { faucet_claim: '1' } })).error!.msg, /always free/);
        assert.match((await setParams(chain, { faucetAmount: 5 })).error!.msg, /decimal strings/);
        must(await setParams(chain, { fees: { act: '20000' } }));
        assert.equal((await G.getParams(chain.store())).fees.act, '20000');
    });
});

describe('CheckTx', () => {
    it('rejects malformed messages statelessly: bad ids, commits, secrets, addresses', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'p');
        p.tx('faucet_claim');
        await chain.block();
        const cases = [
            p.tx('act', { charId: new Uint8Array(15), kind: 'rest' }),
            p.tx('act', { charId: new Uint8Array(16), kind: 'rest', commit: new Uint8Array(31) }),
            p.tx('reveal', { rollId: new Uint8Array(32), secret: new Uint8Array(8) }),
            p.tx('create_character', { name: 'x', classId: 'fighter' }),
            p.tx('assign_stats', { charId: new Uint8Array(16), permutation: [0, 1, 2] }),
            chain.tx(new Uint8Array(19), 'faucet_claim', {})
        ];
        await chain.block();
        const msgs = await Promise.all(cases);
        for (const r of msgs) assert.ok(r.error, 'expected a CheckTx rejection');
        assert.deepEqual(msgs.slice(0, 5).map((r) => r.error!.msg.replace(/^abbey: /, '').split(' ')[0]), ['charId', 'commit', 'rollId', 'commit', 'permutation']);
        assert.match(msgs[5].error!.msg, /address/);
    });
});

describe('CheckTx: game rules at submission', () => {
    it('refuses txs that would fail a game rule, and writes nothing while checking', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'p');
        const q = new Player(chain, 'q');
        const c = await p.newDelver('fighter');
        q.tx('faucet_claim');
        await chain.block();
        const before = { log: chain.mem.log.length, data: JSON.stringify([...chain.mem.data.entries()].sort()) };
        const cid = id(c);
        const cases: [string, Promise<{ error?: { msg: string } }>][] = [
            ['not your character', chain.checkOnly(q.address, 'act', { charId: cid, kind: 'move', toRoom: 3 })],
            ['no such character', chain.checkOnly(p.address, 'act', { charId: new Uint8Array(16), kind: 'rest' })],
            ['extract away from camp', chain.checkOnly(p.address, 'extract', { charId: cid })],
            ['shop away from camp', chain.checkOnly(p.address, 'shop_buy', { charId: cid, template: 'rope', qty: 1 })],
            ['no such roll', chain.checkOnly(p.address, 'reveal', { rollId: new Uint8Array(32), secret: new Uint8Array(32) })],
            ['not the authority', chain.checkOnly(q.address, 'set_params', { paramsJson: '{"faucetEnabled":false}' })],
            ['cannot pay the fee', chain.checkOnly(new Uint8Array(20).fill(7), 'act', { charId: cid, kind: 'rest' })]
        ];
        for (const [what, r] of cases) assert.ok((await r).error, `${what} passed CheckTx`);
        assert.equal((await chain.checkOnly(p.address, 'act', { charId: cid, kind: 'move', toRoom: 3 })).error, undefined);
        // full move legality is DeliverTx's job: an illegal move passes the cheap check, then fails (free, out of the block)
        assert.equal((await chain.checkOnly(p.address, 'act', { charId: cid, kind: 'move', toRoom: 12 })).error, undefined);
        assert.equal(chain.mem.log.length, before.log, 'CheckTx wrote state');
        assert.equal(JSON.stringify([...chain.mem.data.entries()].sort()), before.data);
    });

    it('the second of two racing txs is refused when the block applies it, at no cost', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'p');
        const c = await p.newDelver('fighter');
        // two acts for the same character in one block: on a node both pass mempool admission (pre-block state),
        // but applying the block re-checks each against the state so far, and the first left a roll pending
        const [, first] = await p.act(c, { kind: 'action', actionId: 'narthex.search_silt' });
        const [, second] = await p.act(c, { kind: 'action', actionId: 'narthex.search_silt' });
        const wallet = chain.balance(p.address);
        await chain.block();
        must(await first);
        assert.match((await second).error!.msg, /pending/);
        assert.equal(chain.balance(p.address), wallet - SEND_FEE, 'only the successful tx paid');
    });
});

describe('fees', () => {
    it('paid messages need at least the fee floor; the fee goes to pools[chainId]', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'p');
        p.tx('faucet_claim');
        await chain.block();
        const [, , cheap] = await p.create('x', 'fighter');
        await chain.block();
        // create() sends the default fee; resend one below the floor directly
        must(await cheap);
        const low = chain.tx(p.address, 'create_character', { name: 'y', classId: 'rogue', commit: new Uint8Array(32) }, SEND_FEE - 1n);
        await chain.block();
        assert.ok((await low).error);
        assert.equal(chain.balance(p.address), 100n * MICRO - SEND_FEE);
        assert.equal(chain.pool(), SEND_FEE);
        void CHAIN_ID;
    });
});

describe('extraction, shop and stash', () => {
    it('extract pays carried gold treasury → wallet exactly; items go to the stash; the ledger follows', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'p');
        const c = await p.newDelver('rogue');
        const treasuryBefore = chain.balance(GAME.treasury);
        await teleport(chain, c, 0, { carriedGold: 50, inventory: [{ id: 'cd'.repeat(16), template: 'abbots_signet', sourceLevel: 1, escrow: 150 }] });
        await chain.put(K.KeyLedger(), { outstanding: 200 }); // what the treasury owes for that gold and escrow
        const wallet = chain.balance(p.address);
        const ex = p.tx('extract', { charId: id(c) });
        await chain.block();
        assert.equal(must(await ex).events[0].kind, 'GoldExtracted');
        assert.equal(chain.balance(p.address), wallet + 50n * MICRO - SEND_FEE);
        assert.equal(chain.balance(GAME.treasury), treasuryBefore - 50n * MICRO);
        const acct = await chain.json(K.KeyAcct(p.address));
        assert.deepEqual(acct.stash.map((i: any) => i.template), ['abbots_signet']);
        assert.equal((await p.char(c)).char.status, 'camp');
        assert.equal((await G.getLedger(chain.store())).outstanding, 150);

        // stash → pack, sell the signet for its escrow
        const back = p.tx('stash_move', { charId: id(c), itemId: 'cd'.repeat(16), toStash: false });
        await chain.block();
        must(await back);
        const sell = p.tx('shop_sell', { charId: id(c), itemId: 'cd'.repeat(16) });
        await chain.block();
        must(await sell);
        assert.equal(chain.balance(GAME.treasury), treasuryBefore - 200n * MICRO);
        assert.equal((await G.getLedger(chain.store())).outstanding, 0);

        // buy potions: wallet → treasury
        const w2 = chain.balance(p.address);
        const buy = p.tx('shop_buy', { charId: id(c), template: 'healing_potion', qty: 2 });
        const notForSale = p.tx('shop_buy', { charId: id(c), template: 'abbots_crozier', qty: 1 });
        await chain.block();
        must(await buy);
        assert.match((await notForSale).error!.msg, /not sold/);
        // a rejected tx is not charged: the plugin only flushes (fee included) on success
        assert.equal(chain.balance(p.address), w2 - 50n * MICRO - SEND_FEE);
        assert.equal((await p.char(c)).char.inventory.filter((i: any) => i.template === 'healing_potion').length, 2);
    });

    it('extraction only at the Lychgate, shop only at camp', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'p');
        const c = await p.newDelver('rogue');
        const ex = p.tx('extract', { charId: id(c) });
        const buy = p.tx('shop_buy', { charId: id(c), template: 'rope', qty: 1 });
        await chain.block();
        assert.match((await ex).error!.msg, /Lychgate/);
        assert.match((await buy).error!.msg, /camp/);
    });

    it('give hands gold or an item to another standing character in the same room', async () => {
        const chain = new Chain();
        const a = new Player(chain, 'a');
        const b = new Player(chain, 'b');
        const ca = await a.newDelver('fighter');
        const cb = await b.newDelver('cleric');
        await teleport(chain, ca, 3, { carriedGold: 20 });
        await teleport(chain, cb, 3);
        const g = a.tx('give', { charId: id(ca), toCharId: id(cb), gold: 7 });
        await chain.block();
        must(await g);
        assert.equal((await b.char(cb)).char.carriedGold, 7);
        await teleport(chain, cb, 6);
        const far = a.tx('give', { charId: id(ca), toCharId: id(cb), gold: 1 });
        await chain.block();
        assert.match((await far).error!.msg, /same room/);
    });

    it('a normal session keeps the treasury invariant: the ledger equals what is actually owed', async () => {
        const chain = new Chain();
        const p = new Player(chain, 'p');
        const c = await p.newDelver('cleric');
        // search the silt a few times (WIS 12): a success pays the 15g purse from the budget
        for (let i = 0; i < 4; i++) {
            const [rid, committed] = await p.act(c, { kind: 'action', actionId: 'narthex.search_silt' });
            await chain.block();
            must(await committed);
            const r = p.reveal(rid);
            await chain.block();
            must(await r);
        }
        await auditOccupancy(chain);
        const audit = await auditTreasury(chain);
        assert.equal(audit.ledger, audit.owed);
        assert.ok(audit.free >= 0);
        const lvl = await G.getLevel(chain.store(), 1);
        assert.equal(lvl!.budgetPaid, audit.owed);
    });
});
