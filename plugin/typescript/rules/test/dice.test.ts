import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';
import { FixedDice, ForfeitDice, SeededDice, commitment, exprMax, exprMin, parseDice, rollExpr, rollId, rollSeed, rollStats } from '../src/dice.ts';

const sha = (...parts: Uint8Array[]) => {
    const h = createHash('sha256');
    for (const p of parts) h.update(p);
    return new Uint8Array(h.digest());
};
const seed = sha(Buffer.from('abbey.test.seed'));

// the M0 plugin's die (spike/abbey-plugin RollDie / client rollDie): scan counters from `counter`
function m0RollDie(s: Uint8Array, counter: number, sides: number): { value: number; next: number } {
    const limit = Math.floor(2 ** 32 / sides) * sides;
    for (let i = counter; ; i++) {
        const ctr = Buffer.alloc(4);
        ctr.writeUInt32BE(i);
        const x = Buffer.from(sha(s, ctr)).readUInt32BE(0);
        if (x < limit) return { value: (x % sides) + 1, next: i + 1 };
    }
}

describe('dice', () => {
    it('golden vectors are stable', () => {
        const d = new SeededDice(seed);
        const got = [20, 20, 20, 6, 6, 8, 4, 12, 10, 100].map((s) => d.roll(s, 'pc'));
        assert.deepEqual(got, GOLDEN);
    });

    it('matches the M0 plugin die stream', () => {
        const d = new SeededDice(seed);
        let ctr = 0;
        for (const sides of [20, 6, 7, 3, 20, 12, 100, 2]) {
            const ref = m0RollDie(seed, ctr, sides);
            ctr = ref.next;
            assert.equal(d.roll(sides, 'npc'), ref.value);
        }
    });

    it('seed, rollId and commitment follow SPEC §7.3', () => {
        const charId = new Uint8Array(16).fill(7);
        const id = rollId(charId, 3n);
        const nonce = Buffer.alloc(8);
        nonce.writeBigUInt64BE(3n);
        assert.deepEqual(id, sha(charId, nonce));
        const secret = new Uint8Array(32).fill(1);
        assert.deepEqual(commitment(secret, id), sha(secret, id));
        const beacon = new Uint8Array(32).fill(9);
        assert.deepEqual(rollSeed(secret, beacon, id), sha(Buffer.from('abbey.roll.v1'), secret, beacon, id));
    });

    it('rejection sampling is unbiased (chi-square, d6 and d20)', () => {
        for (const sides of [6, 20]) {
            const d = new SeededDice(sha(Buffer.from(`dist.${sides}`)));
            const n = 60_000;
            const counts = new Array(sides).fill(0);
            for (let i = 0; i < n; i++) counts[d.roll(sides, 'pc') - 1]++;
            const e = n / sides;
            const chi = counts.reduce((s, c) => s + ((c - e) * (c - e)) / e, 0);
            // p = 0.001 critical values: df 5 -> 20.5, df 19 -> 43.8
            assert.ok(chi < (sides === 6 ? 20.5 : 43.8), `chi-square ${chi.toFixed(1)} for d${sides}`);
            assert.ok(counts.every((c) => c > 0));
        }
    });

    it('forfeit: player dice minimum, monster dice maximum', () => {
        const f = new ForfeitDice();
        assert.equal(f.roll(20, 'pc'), 1);
        assert.equal(f.roll(20, 'npc'), 20);
        assert.equal(rollExpr(f, '2d6+3', 'pc'), 5);
        assert.equal(rollExpr(f, '2d6+3', 'npc'), 15);
    });

    it('parses dice expressions', () => {
        assert.deepEqual(parseDice('2d6+3'), { count: 2, sides: 6, bonus: 3 });
        assert.deepEqual(parseDice('1d10'), { count: 1, sides: 10, bonus: 0 });
        assert.deepEqual(parseDice('40'), { count: 0, sides: 0, bonus: 40 });
        assert.deepEqual(parseDice('1d4-1'), { count: 1, sides: 4, bonus: -1 });
        assert.equal(exprMax('2d6+3'), 15);
        assert.equal(exprMin('2d6+3'), 5);
        assert.throws(() => parseDice('d6'));
        assert.throws(() => parseDice('2x6'));
    });

    it('stats are 4d6 drop lowest', () => {
        const stats = rollStats(new FixedDice([1, 6, 6, 6, 2, 3, 4, 5, 1, 1, 1, 1, 6, 6, 6, 6, 3, 3, 3, 3, 4, 2, 5, 1]));
        assert.deepEqual(stats, [18, 12, 3, 18, 9, 11]);
    });
});

// recorded once; the algorithm is cross-checked independently by the M0-compatibility test
const GOLDEN = [2, 6, 1, 6, 4, 3, 1, 8, 9, 62];
