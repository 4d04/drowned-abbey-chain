/* Seeded dice (SPEC §7.3): unbiased dN from sha256(seed ‖ u32be(counter)), plus the forfeit source. */

import { sha256 } from '@noble/hashes/sha2.js';
import { concatBytes, utf8ToBytes } from '@noble/hashes/utils.js';

/** Who a die belongs to: forfeit rolls every player die at its minimum and every monster die at its maximum. */
export type DieOwner = 'pc' | 'npc';

export interface DieRoll {
    sides: number;
    value: number;
    owner: DieOwner;
}

export interface DiceSource {
    roll(sides: number, owner: DieOwner): number;
    readonly log: DieRoll[];
}

export function u64be(v: bigint | number): Uint8Array {
    const b = new Uint8Array(8);
    new DataView(b.buffer).setBigUint64(0, BigInt(v));
    return b;
}

export function u32be(v: number): Uint8Array {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, v >>> 0);
    return b;
}

/** rollId = sha256(charId ‖ u64be(actionNonce)) */
export function rollId(charId: Uint8Array, nonce: bigint | number): Uint8Array {
    return sha256(concatBytes(charId, u64be(nonce)));
}

/** commit = sha256(secret ‖ rollId) */
export function commitment(secret: Uint8Array, id: Uint8Array): Uint8Array {
    return sha256(concatBytes(secret, id));
}

/** seed = sha256("abbey.roll.v1" ‖ secret ‖ beacon_h ‖ rollId) */
export function rollSeed(secret: Uint8Array, beacon: Uint8Array, id: Uint8Array): Uint8Array {
    return sha256(concatBytes(utf8ToBytes('abbey.roll.v1'), secret, beacon, id));
}

export class SeededDice implements DiceSource {
    readonly log: DieRoll[] = [];
    private counter = 0;
    private readonly seed: Uint8Array;

    constructor(seed: Uint8Array) {
        this.seed = seed;
    }

    roll(sides: number, owner: DieOwner): number {
        if (!Number.isInteger(sides) || sides < 1 || sides > 0xffff) throw new Error(`bad die d${sides}`);
        // rejection sampling: reject x >= floor(2^32 / N) * N so dN has no modulo bias
        const limit = Math.floor(0x1_0000_0000 / sides) * sides;
        for (;;) {
            const h = sha256(concatBytes(this.seed, u32be(this.counter++)));
            const x = new DataView(h.buffer, h.byteOffset, 4).getUint32(0);
            if (x < limit) {
                const value = (x % sides) + 1;
                this.log.push({ sides, value, owner });
                return value;
            }
        }
    }
}

/** Timeout outcome: never better for the player than any real roll. */
export class ForfeitDice implements DiceSource {
    readonly log: DieRoll[] = [];

    roll(sides: number, owner: DieOwner): number {
        const value = owner === 'pc' ? 1 : sides;
        this.log.push({ sides, value, owner });
        return value;
    }
}

/** Replays a fixed list of values (tests and the client's "what if" previews). */
export class FixedDice implements DiceSource {
    readonly log: DieRoll[] = [];
    private i = 0;
    private readonly values: number[];

    constructor(values: number[]) {
        this.values = values;
    }

    roll(sides: number, owner: DieOwner): number {
        if (this.i >= this.values.length) throw new Error('FixedDice exhausted');
        const value = this.values[this.i++];
        if (value < 1 || value > sides) throw new Error(`FixedDice value ${value} out of range for d${sides}`);
        this.log.push({ sides, value, owner });
        return value;
    }
}

export interface DiceExpr {
    count: number;
    sides: number;
    bonus: number;
}

const DICE_RE = /^(?:(\d+)d(\d+))?([+-]\d+)?$/;

/** "2d6+3", "1d8", "40", "-1" */
export function parseDice(expr: string): DiceExpr {
    const m = DICE_RE.exec(expr.replace(/\s+/g, ''));
    if (!m || (m[1] === undefined && m[3] === undefined)) {
        // a bare integer like "40"
        if (/^\d+$/.test(expr)) return { count: 0, sides: 0, bonus: Number(expr) };
        throw new Error(`bad dice expression "${expr}"`);
    }
    return { count: m[1] ? Number(m[1]) : 0, sides: m[2] ? Number(m[2]) : 0, bonus: m[3] ? Number(m[3]) : 0 };
}

export function rollExpr(dice: DiceSource, expr: string, owner: DieOwner): number {
    const d = parseDice(expr);
    let total = d.bonus;
    for (let i = 0; i < d.count; i++) total += dice.roll(d.sides, owner);
    return total;
}

export function exprMax(expr: string): number {
    const d = parseDice(expr);
    return d.count * d.sides + d.bonus;
}

export function exprMin(expr: string): number {
    const d = parseDice(expr);
    return d.count + d.bonus;
}

/** 4d6 drop lowest, six times (SPEC §3.1). */
export function rollStats(dice: DiceSource): number[] {
    const out: number[] = [];
    for (let i = 0; i < 6; i++) {
        const r = [dice.roll(6, 'pc'), dice.roll(6, 'pc'), dice.roll(6, 'pc'), dice.roll(6, 'pc')];
        r.sort((a, b) => a - b);
        out.push(r[1] + r[2] + r[3]);
    }
    return out;
}
