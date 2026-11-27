import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Chain, K, Player, auditOccupancy, must } from './harness.ts';

/* Parties on chain (SPEC §3.6): party_set is consent, and a move within the level takes the party along. */

const id = (hex: string) => Buffer.from(hex, 'hex');

async function both(chain: Chain): Promise<{ p: Player; q: Player; a: string; b: string }> {
    const p = new Player(chain, 'party-p');
    const q = new Player(chain, 'party-q');
    const a = await p.newDelver('fighter', 'Ana');
    const b = await q.newDelver('rogue', 'Bo');
    return { p, q, a, b };
}

async function deliver(chain: Chain, ...txs: Promise<unknown>[]): Promise<void> {
    await chain.block();
    for (const t of txs) must((await t) as never);
}

describe('parties on chain', () => {
    it("joining is consent: Bo joins Ana's party and comes along when Ana moves; Ana, who never joined, doesn't follow Bo", async () => {
        const chain = new Chain();
        const { p, q, a, b } = await both(chain);
        await deliver(chain, q.tx('party_set', { charId: id(b), with: id(a) }));
        assert.equal((await q.char(b)).char.party, a);
        assert.deepEqual((await chain.store().page(K.PrefixParty(a), 10)).map((e) => K.lastSegmentHex(e.key)), [b], 'the party index lists Bo');

        const [, mv] = await p.act(a, { kind: 'move', toRoom: 3 }, { noCommit: true });
        await deliver(chain, mv);
        assert.deepEqual([(await p.char(a)).char.room, (await q.char(b)).char.room], [3, 3]);
        await auditOccupancy(chain);

        const [, back] = await q.act(b, { kind: 'move', toRoom: 1 }, { noCommit: true });
        await deliver(chain, back);
        assert.deepEqual([(await p.char(a)).char.room, (await q.char(b)).char.room], [3, 1], 'Bo moving alone: Ana never joined');
        await auditOccupancy(chain);
    });

    it("only a character's owner can put it in a party, and only while standing together", async () => {
        const chain = new Chain();
        const { p, q, a, b } = await both(chain);
        const forced = p.tx('party_set', { charId: id(b), with: id(a) });
        await chain.block();
        assert.ok((await forced).error, "Ana's player can't sign for Bo");
        const [, mv] = await p.act(a, { kind: 'move', toRoom: 3 }, { noCommit: true });
        await deliver(chain, mv);
        const apart = q.tx('party_set', { charId: id(b), with: id(a) });
        await chain.block();
        assert.match((await apart).error?.msg ?? '', /standing together/);
    });

    it("a player's own characters can band together from anywhere", async () => {
        const chain = new Chain();
        const p = new Player(chain, 'party-solo');
        const a = await p.newDelver('fighter', 'Ana');
        const c = await p.newDelver('cleric', 'Cy');
        const [, mv] = await p.act(a, { kind: 'move', toRoom: 3 }, { noCommit: true });
        await deliver(chain, mv);
        await deliver(chain, p.tx('party_set', { charId: id(a), with: id(a) }), p.tx('party_set', { charId: id(c), with: id(a) }));
        assert.deepEqual([(await p.char(a)).char.party, (await p.char(c)).char.party], [a, a]);
    });

    it('leaving takes a character out of the party and its index', async () => {
        const chain = new Chain();
        const { q, a, b } = await both(chain);
        await deliver(chain, q.tx('party_set', { charId: id(b), with: id(a) }));
        await deliver(chain, q.tx('party_set', { charId: id(b), with: new Uint8Array() }));
        assert.equal((await q.char(b)).char.party, undefined);
        assert.equal((await chain.store().page(K.PrefixParty(a), 10)).length, 0);
    });

    it('a member with a sealed roll of their own stays behind', async () => {
        const chain = new Chain();
        const { p, q, a, b } = await both(chain);
        await deliver(chain, q.tx('party_set', { charId: id(b), with: id(a) }));
        const [, rest] = await q.act(b, { kind: 'rest' }); // commits, not revealed: Bo is locked
        await deliver(chain, rest);
        const [, mv] = await p.act(a, { kind: 'move', toRoom: 3 }, { noCommit: true });
        await deliver(chain, mv);
        assert.deepEqual([(await p.char(a)).char.room, (await q.char(b)).char.room], [3, 1]);
    });

    it('a party holds at most 6', async () => {
        const chain = new Chain();
        const { q, a, b } = await both(chain);
        for (let i = 0; i < 6; i++) await chain.put(K.KeyPartyMember(a, `${'0'.repeat(30)}0${i}`), 1);
        const full = q.tx('party_set', { charId: id(b), with: id(a) });
        await chain.block();
        assert.match((await full).error?.msg ?? '', /at most 6/);
    });
});
