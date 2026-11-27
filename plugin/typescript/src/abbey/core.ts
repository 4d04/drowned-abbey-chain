/* Core records the plugin may touch: accounts (prefix 1), the committee reward pool (prefix 2), and fee params (read-only). */

import Long from 'long';
import protobuf from 'protobufjs/minimal.js';
import { types } from '../proto/types.js';
import { KeyForAccount, KeyForFeeParams, KeyForPool } from './keys.js';
import { type Store, TxError } from './store.js';

const { Reader } = protobuf;
const ACCOUNT_FIELDS = new Set([1, 2, 7]);
const POOL_FIELDS = new Set([1, 2]);

/** 1 GOLD = 1,000,000 µGOLD; the engine works in whole GOLD. */
export const MICRO = 1_000_000n;

export function toBig(v: unknown): bigint {
    if (v === undefined || v === null) return 0n;
    if (Long.isLong(v)) return BigInt((v as Long).toUnsigned().toString());
    return BigInt(v as number | string | bigint);
}

export function toLong(v: bigint): Long {
    if (v < 0n || v > 2n ** 64n - 1n) throw new Error(`uint64 overflow: ${v}`);
    return Long.fromString(v.toString(), true);
}

// protobufjs drops unknown fields; keep any field outside our local schema byte-for-byte
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function encodePreserving(MessageType: any, message: unknown, original: Uint8Array | null, known: Set<number>): Uint8Array {
    const parts: Uint8Array[] = [MessageType.encode(message).finish()];
    const reader = Reader.create(original || new Uint8Array());
    while (reader.pos < reader.len) {
        const start = reader.pos;
        const tag = reader.uint32();
        reader.skipType(tag & 7);
        if (!known.has(tag >>> 3)) parts.push(reader.buf.subarray(start, reader.pos));
    }
    return Buffer.concat(parts);
}

export async function balance(store: Store, addr: Uint8Array): Promise<bigint> {
    const bz = await store.get(KeyForAccount(addr));
    return bz ? toBig(types.Account.decode(bz).amount) : 0n;
}

async function setBalance(store: Store, addr: Uint8Array, amount: bigint): Promise<void> {
    const key = KeyForAccount(addr);
    const original = await store.get(key);
    const acc = original ? types.Account.decode(original) : null;
    const updated = types.Account.create({ address: addr, amount: toLong(amount), nonce: acc?.nonce });
    store.set(key, encodePreserving(types.Account, updated, original, ACCOUNT_FIELDS));
}

/** Move µGOLD between core accounts. Supply is untouched: the game never mints (SPEC §6.2). */
export async function transfer(store: Store, from: Uint8Array, to: Uint8Array, amount: bigint): Promise<void> {
    if (amount === 0n) return;
    if (amount < 0n) throw new Error('negative transfer');
    const fb = await balance(store, from);
    if (fb < amount) throw new TxError(`insufficient funds: have ${fb}, need ${amount}`);
    await setBalance(store, from, fb - amount);
    await setBalance(store, to, (await balance(store, to)) + amount);
}

/** Charge a fee into pools[chainId], the committee reward pool the core pays out every block. */
export async function chargeFee(store: Store, payer: Uint8Array, chainId: number, fee: bigint): Promise<void> {
    if (fee === 0n) return;
    const pb = await balance(store, payer);
    if (pb < fee) throw new TxError('insufficient funds for fee');
    await setBalance(store, payer, pb - fee);
    const key = KeyForPool(chainId);
    const original = await store.get(key);
    const pool = original ? types.Pool.decode(original) : null;
    const updated = types.Pool.create({ id: toLong(BigInt(chainId)), amount: toLong(toBig(pool?.amount) + fee) });
    store.set(key, encodePreserving(types.Pool, updated, original, POOL_FIELDS));
}

/** The governance send fee: the default minimum for every paid game message. */
export async function sendFee(store: Store): Promise<bigint> {
    const bz = await store.get(KeyForFeeParams());
    return bz ? toBig(types.FeeParams.decode(bz).sendFee) : 0n;
}
