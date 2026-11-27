/* In-memory chain for plugin tests: drives the real CheckTx / DeliverTx / EndBlock against a MemoryBackend. */

import { createHash } from 'node:crypto';
import Long from 'long';

// the params authority is fixed per release; tests use a known key (must be set before the plugin loads)
export const AUTHORITY = createHash('sha256').update('test.authority').digest().subarray(0, 20);
process.env.ABBEY_PARAMS_AUTHORITY = AUTHORITY.toString('hex');

const { Contract, ContractAsync, MESSAGES } = await import('../dist/contract/contract.js');
const { MemoryBackend, Store } = await import('../dist/abbey/store.js');
const { types } = await import('../dist/proto/types.js');
const K = await import('../dist/abbey/keys.js');
const G = await import('../dist/abbey/game.js');
const { GAME } = await import('../dist/abbey/config.js');
const { route } = await import('../dist/contract/rpc.js');
const R = await import('@abbey/rules');

export { G, GAME, K, R, Store, route, types };

export const CHAIN_ID = 2;
export const SEND_FEE = 10_000n;
export const MICRO = 1_000_000n;

const sha = (...p: Uint8Array[]) => {
    const h = createHash('sha256');
    for (const x of p) h.update(x);
    return new Uint8Array(h.digest());
};
const hex = (b: Uint8Array) => Buffer.from(b).toString('hex');

export interface Result {
    error?: { code: number; msg: string };
    events: { kind: string; data: any }[];
}

export class Chain {
    readonly mem = new MemoryBackend();
    height = 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly contract: any;
    private queued: { signer: Uint8Array; type: string; msg: Record<string, unknown>; fee: bigint; resolve: (r: Result) => void }[] = [];

    constructor(opts: { treasury?: bigint; faucet?: bigint } = {}) {
        this.contract = new Contract({ ChainId: CHAIN_ID, DataDirPath: '', rpcAddress: '' }, null, null, Long.ZERO);
        this.contract.backend = this.mem;
        this.mem.data.set(hex(K.KeyForFeeParams()), types.FeeParams.encode(types.FeeParams.create({ sendFee: Long.fromString(SEND_FEE.toString(), true) })).finish());
        this.setBalance(GAME.treasury, opts.treasury ?? 1_000_000n * MICRO);
        this.setBalance(GAME.faucet, opts.faucet ?? 10_000n * MICRO);
    }

    setBalance(addr: Uint8Array, amount: bigint): void {
        this.mem.data.set(hex(K.KeyForAccount(addr)), types.Account.encode(types.Account.create({ address: addr, amount: Long.fromString(amount.toString(), true) })).finish());
    }

    balance(addr: Uint8Array): bigint {
        const bz = this.mem.data.get(hex(K.KeyForAccount(addr)));
        return bz ? BigInt(types.Account.decode(bz).amount.toString()) : 0n;
    }

    pool(): bigint {
        const bz = this.mem.data.get(hex(K.KeyForPool(CHAIN_ID)));
        return bz ? BigInt(types.Pool.decode(bz).amount.toString()) : 0n;
    }

    store() {
        return new Store(this.mem);
    }

    async json<T = any>(key: Uint8Array): Promise<T | null> {
        return this.store().getJSON<T>(key);
    }

    /** Write a JSON record straight into state (test setup). */
    async put(key: Uint8Array, value: unknown): Promise<void> {
        const s = this.store();
        s.setJSON(key, value);
        await s.flush();
    }

    /** Queue a tx for the next block. Never await the result before calling block(): it resolves when delivered. */
    tx(signer: Uint8Array, type: string, msg: Record<string, unknown>, fee: bigint = type === 'faucet_claim' ? 0n : SEND_FEE): Promise<Result> {
        return new Promise((resolve) => this.queued.push({ signer, type, msg, fee, resolve }));
    }

    /** Deliver queued txs in order at the current height, run EndBlock, advance the height. */
    async block(proposer: Uint8Array = new Uint8Array(20).fill(9)): Promise<Result> {
        const q = this.queued;
        this.queued = [];
        for (const t of q) t.resolve(await this.deliverNow(t.signer, t.type, t.msg, t.fee));
        const end = await ContractAsync.EndBlock(this.contract, { height: Long.fromNumber(this.height), proposerAddress: proposer });
        this.height++;
        return { error: end.error, events: decodeEvents(end.events) };
    }

    async blocks(n: number): Promise<Result[]> {
        const out = [];
        for (let i = 0; i < n; i++) out.push(await this.block());
        return out;
    }

    /** CheckTx alone, as at mempool admission. */
    async checkOnly(signer: Uint8Array, type: string, msg: Record<string, unknown>, fee: bigint = SEND_FEE): Promise<{ error?: { msg: string } }> {
        return ContractAsync.CheckTx(this.contract, { tx: this.buildTx(signer, type, msg, fee), height: Long.fromNumber(this.height) });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private buildTx(signer: Uint8Array, type: string, msg: Record<string, unknown>, fee: bigint): any {
        const name = (MESSAGES as Record<string, string>)[type];
        const value = types[name].encode(types[name].create({ address: signer, ...msg })).finish();
        return types.Transaction.create({
            messageType: type,
            msg: { type_url: `type.googleapis.com/types.${name}`, value },
            fee: Long.fromString(fee.toString(), true),
            createdHeight: Long.fromNumber(this.height),
            chainId: Long.fromNumber(CHAIN_ID),
            networkId: Long.fromNumber(1)
        });
    }

    async deliverNow(signer: Uint8Array, type: string, msg: Record<string, unknown>, fee: bigint): Promise<Result> {
        const name = (MESSAGES as Record<string, string>)[type];
        const value = types[name].encode(types[name].create({ address: signer, ...msg })).finish();
        const tx = types.Transaction.create({
            messageType: type,
            msg: { type_url: `type.googleapis.com/types.${name}`, value },
            fee: Long.fromString(fee.toString(), true),
            createdHeight: Long.fromNumber(this.height),
            chainId: Long.fromNumber(CHAIN_ID),
            networkId: Long.fromNumber(1)
        });
        const check = await ContractAsync.CheckTx(this.contract, { tx, height: Long.fromNumber(this.height) });
        if (check.error) return { error: check.error, events: [] };
        if (hex(check.authorizedSigners[0]) !== hex(signer)) throw new Error('authorized signer mismatch');
        const res = await ContractAsync.DeliverTx(this.contract, { tx, height: Long.fromNumber(this.height) });
        return { error: res.error, events: decodeEvents(res.events) };
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decodeEvents(evs: any[] | undefined): { kind: string; data: any }[] {
    return (evs || []).map((e) => {
        const ev = types.AbbeyEvent.decode(e.custom.msg.value);
        return { kind: ev.kind, data: JSON.parse(ev.data) };
    });
}

/** A player the way the client behaves: computes ids and rollIds from state, keeps secrets, reveals. */
export class Player {
    readonly address: Uint8Array;
    readonly chain: Chain;
    private readonly secrets = new Map<string, Uint8Array>();
    private readonly seed: string;
    private n = 0;

    constructor(chain: Chain, seed: string) {
        this.chain = chain;
        this.seed = seed;
        this.address = new Uint8Array(sha(Buffer.from(`player.${seed}`)).subarray(0, 20));
    }

    get hex(): string {
        return hex(this.address);
    }

    tx(type: string, msg: Record<string, unknown> = {}, fee?: bigint): Promise<Result> {
        return this.chain.tx(this.address, type, msg, fee);
    }

    private commitFor(rollIdHex: string): Uint8Array {
        // deterministic per player so test runs (and the determinism replay) are reproducible
        const secret = sha(Buffer.from(`secret.${this.seed}.${this.n++}`));
        this.secrets.set(rollIdHex, secret);
        return R.commitment(secret, Buffer.from(rollIdHex, 'hex'));
    }

    secretOf(rollIdHex: string): Uint8Array {
        return this.secrets.get(rollIdHex)!;
    }

    async nextCharId(): Promise<string> {
        const acct = await this.chain.json(K.KeyAcct(this.address));
        return hex(sha(this.address, K.u64(acct?.nextChar ?? 0)).subarray(0, 16));
    }

    async char(id: string): Promise<any> {
        return this.chain.json(K.KeyChar(id));
    }

    /** create_character with a commit to the stat roll; returns [charId, rollId]. */
    async create(name: string, classId: string): Promise<[string, string, Promise<Result>]> {
        const id = await this.nextCharId();
        const rid = hex(R.rollId(Buffer.from(id, 'hex'), 0));
        return [id, rid, this.tx('create_character', { name, classId, commit: this.commitFor(rid) })];
    }

    reveal(rollIdHex: string, secret?: Uint8Array): Promise<Result> {
        return this.tx('reveal', { rollId: Buffer.from(rollIdHex, 'hex'), secret: secret ?? this.secretOf(rollIdHex) });
    }

    /** act: commits when the engine says it needs dice (the client does the same check). Returns the rollId. */
    async act(charId: string, intent: Record<string, unknown>, opts: { forceCommit?: boolean; noCommit?: boolean } = {}): Promise<[string, Promise<Result>]> {
        const rec = await this.char(charId);
        const rid = hex(R.rollId(Buffer.from(charId, 'hex'), rec.actionNonce));
        const commit = opts.noCommit ? new Uint8Array() : this.commitFor(rid);
        const msg = { charId: Buffer.from(charId, 'hex'), commit, ...intent };
        return [rid, this.tx('act', msg)];
    }

    /** Full new character: create, reveal stats, assign in order, enter. Takes 3 blocks. */
    async newDelver(classId: string, name = classId): Promise<string> {
        const claimed = this.tx('faucet_claim');
        const [id, rid, created] = await this.create(name, classId);
        await this.chain.block();
        must(await claimed);
        must(await created);
        const revealed = this.reveal(rid);
        await this.chain.block();
        must(await revealed);
        const assigned = this.tx('assign_stats', { charId: Buffer.from(id, 'hex'), permutation: [0, 1, 2, 3, 4, 5] });
        const entered = this.tx('enter_dungeon', { charId: Buffer.from(id, 'hex') });
        await this.chain.block();
        must(await assigned);
        must(await entered);
        return id;
    }
}

export function must(r: Result): Result {
    if (r.error) throw new Error(`tx failed: ${r.error.msg}`);
    return r;
}

/** Put a character somewhere directly (test setup), keeping the occupancy index right. */
export async function teleport(chain: Chain, charId: string, room: number, patch: Record<string, unknown> = {}): Promise<void> {
    const s = chain.store();
    const rec = await s.getJSON<any>(K.KeyChar(charId));
    const prev = rec.char;
    rec.char = { ...rec.char, room, prevRoom: rec.char.room, ...patch };
    s.setJSON(K.KeyChar(charId), rec);
    await G.moveIndex(s, charId, prev, rec.char);
    await s.flush();
}

/** Edit the current season's state of a room (test setup). */
export async function editRoom(chain: Chain, roomId: number, edit: (r: any) => void): Promise<void> {
    const s = chain.store();
    const lvl = await G.getLevel(s, 1);
    const room = await G.getRoom(s, lvl!, roomId);
    edit(room);
    s.setJSON(K.KeyRoom(1, lvl!.season, roomId), room);
    await s.flush();
}

/** Recompute everything the treasury owes from scratch and compare with the ledger (SPEC §6.3 invariant). */
export async function auditTreasury(chain: Chain): Promise<{ owed: number; ledger: number; free: number; balance: number }> {
    const s = chain.store();
    let owed = 0;
    for (const e of await s.range(K.lenPrefix(K.ABBEY_PREFIX, Buffer.from('char')))) {
        const rec = JSON.parse(Buffer.from(e.value).toString());
        owed += rec.char.carriedGold + rec.char.inventory.reduce((t: number, i: any) => t + i.escrow, 0);
    }
    for (const e of await s.range(K.lenPrefix(K.ABBEY_PREFIX, Buffer.from('acct')))) {
        owed += JSON.parse(Buffer.from(e.value).toString()).stash.reduce((t: number, i: any) => t + i.escrow, 0);
    }
    for (const lvl of await G.activeLevels(s)) {
        for (const r of R.loadContent().levels.get(lvl.id)!.def.rooms) {
            const room = await G.getRoom(s, lvl, r.id);
            owed += Object.values(room.pools as Record<string, number>).reduce((a, b) => a + b, 0) + room.pileGold;
            owed += room.pile.reduce((t: number, i: any) => t + i.escrow, 0);
            for (const c of room.corpses) owed += c.gold + c.items.reduce((t: number, i: any) => t + i.escrow, 0);
        }
    }
    const ledger = (await G.getLedger(s)).outstanding;
    return { owed, ledger, free: await G.treasuryFree(s), balance: Number(chain.balance(GAME.treasury) / MICRO) };
}

/** Occupancy invariant: every room's headcount equals its index entries, and the activity index matches. */
export async function auditOccupancy(chain: Chain): Promise<void> {
    const s = chain.store();
    const tally = new Map<string, { standing: number; downed: number }>();
    const where = await s.range(K.lenPrefix(K.ABBEY_PREFIX, Buffer.from('where')));
    for (const e of where) {
        const key = `${K.segmentU64(e.key, 2)}/${K.segmentU64(e.key, 3)}`;
        const t = tally.get(key) ?? { standing: 0, downed: 0 };
        if (e.key[e.key.length - 16 - 1 - 8 - 1 - 1] === G.WHERE_DOWNED) t.downed++;
        else t.standing++;
        tally.set(key, t);
    }
    for (const e of await s.range(K.lenPrefix(K.ABBEY_PREFIX, Buffer.from('roomcount')))) {
        const key = `${K.segmentU64(e.key, 2)}/${K.segmentU64(e.key, 3)}`;
        const n = JSON.parse(Buffer.from(e.value).toString());
        const t = tally.get(key) ?? { standing: 0, downed: 0 };
        if (n.standing !== t.standing || n.downed !== t.downed) throw new Error(`room ${key}: headcount ${JSON.stringify(n)} but index ${JSON.stringify(t)}`);
        tally.delete(key);
    }
    if (tally.size) throw new Error(`rooms indexed without a headcount: ${[...tally.keys()]}`);
    const active = await s.range(K.lenPrefix(K.ABBEY_PREFIX, Buffer.from('active')));
    if (active.length !== where.length) throw new Error(`activity index has ${active.length} entries, occupancy ${where.length}`);
}
