/* Transaction handlers (SPEC §7.6). Each runs against a Store; the caller flushes it only if the handler succeeds. */

import { createHash } from 'crypto';
import {
    type Character, type Content, type DiceSource, type GameEvent, type Intent, type Item, type Scene, type RoomState,
    DOWNED_BLOCKS, ForfeitDice, INVENTORY_SLOTS, LIE_LOW_BLOCKS, MAX_LIVING_CHARACTERS, PARTY_MAX, ROOM_WIDE_MAX, STASH_SLOTS, SeededDice,
    LEVELS, LIVE_VARIANTS, REGISTRY, assignStats, commitment, enterDungeon, extract, initialRoom, legal, loadContent, partyOf,
    newCharacter, resolve, rollId as computeRollId, rollSeed, rollStats, shopBuyCost, shopSellPayout
} from '@abbey/rules';
import {
    type AcctRecord, type BeaconRecord, type CharRecord, type FaucetRecord, type Ledger, type LevelRecord, type Params,
    type RollRecord, DEFAULT_PARAMS, GAME
} from './config.js';
import { MICRO, balance, transfer } from './core.js';
import * as K from './keys.js';
import { type Store, TxError } from './store.js';

export const content: Content = loadContent(LEVELS, REGISTRY, LIVE_VARIANTS);

export interface AbbeyEventOut {
    kind: string;
    address: Uint8Array;
    data: unknown;
}

/** Everything a handler needs about the transaction it is applying. */
export interface TxCtx {
    store: Store;
    height: number;
    chainId: number;
    signer: Uint8Array;
    fee: bigint;
    events: AbbeyEventOut[];
}

const hex = (b: Uint8Array): string => Buffer.from(b).toString('hex');
const unhex = (s: string): Uint8Array => new Uint8Array(Buffer.from(s, 'hex'));
const sha = (...parts: Uint8Array[]): Uint8Array => {
    const h = createHash('sha256');
    for (const p of parts) h.update(p);
    return new Uint8Array(h.digest());
};
const fail = (msg: string): never => {
    throw new TxError(msg);
};
const emit = (tx: TxCtx, kind: string, data: unknown, address: Uint8Array = tx.signer): void => {
    tx.events.push({ kind, address, data });
};

// ---------------------------------------------------------------- records

export async function getParams(store: Store): Promise<Params> {
    const stored = await store.getJSON<Params>(K.KeyParams());
    // a fresh copy every time: mutating a shared default would leak into later txs and break determinism
    return { ...DEFAULT_PARAMS, ...stored, fees: { ...DEFAULT_PARAMS.fees, ...stored?.fees } };
}

export async function getLedger(store: Store): Promise<Ledger> {
    return (await store.getJSON<Ledger>(K.KeyLedger())) ?? { outstanding: 0 };
}

export async function addOutstanding(store: Store, delta: number): Promise<void> {
    const l = await getLedger(store);
    l.outstanding += delta;
    if (l.outstanding < 0) throw new Error(`ledger underflow: ${l.outstanding}`);
    store.setJSON(K.KeyLedger(), l);
}

export async function getAcct(store: Store, addr: Uint8Array): Promise<AcctRecord> {
    return (await store.getJSON<AcctRecord>(K.KeyAcct(addr))) ?? { stash: [], chars: [], nextChar: 0, nextItem: 0 };
}

export async function getCharRec(store: Store, charId: string): Promise<CharRecord> {
    return (await store.getJSON<CharRecord>(K.KeyChar(charId))) ?? fail('no such character');
}

async function ownChar(tx: TxCtx, charIdBytes: Uint8Array): Promise<CharRecord> {
    const rec = await getCharRec(tx.store, hex(charIdBytes));
    if (rec.char.owner !== hex(tx.signer)) fail('not your character');
    return rec;
}

export async function getLevel(store: Store, levelId: number): Promise<LevelRecord | null> {
    return store.getJSON<LevelRecord>(K.KeyLevel(levelId));
}

/** Levels in this release that have activated, by id. The candidates are known statically, so this is one batched read. */
export async function activeLevels(store: Store): Promise<LevelRecord[]> {
    const ids = [...GAME.activation.keys()].filter((id) => content.levels.has(id)).sort((a, b) => a - b);
    return (await store.getManyJSON<LevelRecord>(ids.map((id) => K.KeyLevel(id)))).filter((l): l is LevelRecord => l !== null);
}

/** The keys nearly every tx touches, fetched in one round trip before the handler runs. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function prefetch(store: Store, signer: Uint8Array, chainId: number, m: any): Promise<void> {
    const keys = [K.KeyParams(), K.KeyForFeeParams(), K.KeyForAccount(signer), K.KeyForPool(chainId), K.KeyTxAcc(), K.KeyLedger(), K.KeyAcct(signer)];
    for (const id of GAME.activation.keys()) keys.push(K.KeyLevel(id));
    if (m.charId?.length === 16) keys.push(K.KeyChar(hex(m.charId)));
    if (m.toCharId?.length === 16) keys.push(K.KeyChar(hex(m.toCharId)));
    if (m.rollId?.length === 32) keys.push(K.KeyRoll(hex(m.rollId)));
    await store.getMany(keys);
}

export const BLOCK_FULL = 'block is full: resubmit (higher fees are taken first)';

/**
 * The per-block cap (params.maxTxPerBlock), checked first in DeliverTx from the block's tx accumulator, which counts
 * the game txs this block has applied (failed ones roll back, so they don't count). The core drops a failed tx from its
 * mempool, so the client resubmits. set_params is exempt so the cap can always be changed.
 */
export async function checkBlockRoom(store: Store, type: string): Promise<void> {
    if (type === 'set_params') return;
    const acc = await store.getJSON<BeaconRecord>(K.KeyTxAcc());
    if ((acc?.txCount ?? 0) >= (await getParams(store)).maxTxPerBlock) fail(BLOCK_FULL);
}

/**
 * Cheap state checks for CheckTx (one prefetched read): the common reasons a game tx would fail, refused at submission.
 * The full rules still run in DeliverTx; this only has to be right, not complete.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function precheck(tx: TxCtx, type: string, m: any): Promise<void> {
    const own = async (bz: Uint8Array): Promise<CharRecord> => {
        const rec = await getCharRec(tx.store, hex(bz));
        if (rec.char.owner !== hex(tx.signer)) fail('not your character');
        return rec;
    };
    if ((await balance(tx.store, tx.signer)) < tx.fee) fail('insufficient funds for fee');
    switch (type) {
        case 'faucet_claim': {
            const p = await getParams(tx.store);
            if (!p.faucetEnabled) fail('faucet is disabled');
            const rec = await tx.store.getJSON<FaucetRecord>(K.KeyFaucet(tx.signer));
            if (rec && p.faucetCooldownBlocks > 0 && tx.height - rec.lastClaimHeight < p.faucetCooldownBlocks) fail('faucet cooldown');
            return;
        }
        case 'set_params':
            if (hex(tx.signer) !== hex(GAME.paramsAuthority)) fail('signer is not the params authority');
            return;
        case 'act': {
            const rec = await own(m.charId);
            if (rec.char.status !== 'delving') fail(`character is ${rec.char.status}`);
            if (rec.pending) fail('a roll is already pending for this character');
            return;
        }
        case 'reveal': {
            const roll = (await tx.store.getJSON<RollRecord>(K.KeyRoll(hex(m.rollId)))) ?? fail('no such roll');
            if (roll.owner !== hex(tx.signer)) fail('not your roll');
            if (roll.resolved) fail('roll already resolved');
            if (tx.height <= roll.committedAt) fail('reveal must land after the commit block');
            return;
        }
        case 'assign_stats':
            if (!(await own(m.charId)).rolled) fail('stats have not been rolled yet');
            return;
        case 'enter_dungeon':
        case 'shop_buy':
        case 'shop_sell':
        case 'stash_move':
            if ((await own(m.charId)).char.status !== 'camp') fail('only at camp');
            return;
        case 'extract': {
            const rec = await own(m.charId);
            if (rec.pending) fail('a roll is pending for this character');
            if (rec.char.status !== 'delving' || rec.char.room !== content.levels.get(1)!.def.camp) fail('must be at the Lychgate to extract');
            return;
        }
        case 'give': {
            const rec = await own(m.charId);
            if (rec.pending) fail('a roll is pending for this character');
            return;
        }
        case 'party_set':
            await own(m.charId);
            return;
    }
}

export async function getRoom(store: Store, lvl: LevelRecord, roomId: number): Promise<RoomState> {
    return (await store.getJSON<RoomState>(K.KeyRoom(lvl.id, lvl.season, roomId))) ?? initialRoom(content, lvl.id, roomId);
}

/** Treasury gold that is neither owed (ledger) nor reserved by a level's season budget (whole GOLD). */
export async function treasuryFree(store: Store, excludeLevel = 0): Promise<number> {
    const whole = Number((await balance(store, GAME.treasury)) / MICRO);
    const reserved = (await activeLevels(store)).filter((l) => l.id !== excludeLevel).reduce((s, l) => s + (l.budgetReserved - l.budgetPaid), 0);
    return whole - reserved - (await getLedger(store)).outstanding;
}

/** Deterministic item ids for anything created while resolving an exchange: sha256(rollId ‖ u64be(n))[:16]. */
function itemIds(rollId: string): () => string {
    let n = 0;
    return () => hex(sha(Buffer.from('abbey.item.v1'), unhex(rollId), K.u64(n++)).subarray(0, 16));
}

// ---------------------------------------------------------------- scenes

interface LoadedScene {
    scene: Scene;
    recs: Map<string, CharRecord>;
    before: Map<string, string>; // char id -> JSON.stringify(record) before resolution
    actorId: string;
    budgetPaidBefore: number;
}

/**
 * Load exactly what a resolution may touch: the level, the actor's room plus touched rooms, the room's headcount, a
 * character the intent names, and for a room-wide exchange the room's most recently active characters. Every read is
 * bounded, so a crowded room costs no more than an empty one.
 */
export async function loadScene(tx: Pick<TxCtx, 'store' | 'height'>, rec: CharRecord, intent: Intent | null): Promise<LoadedScene> {
    const ch = rec.char;
    const lvl = (await getLevel(tx.store, ch.levelId)) ?? fail('level is not active');
    if (lvl.flood) fail(FLOODING);
    const levels = await activeLevels(tx.store);
    const roomIds = new Set([ch.room]);
    if (intent?.kind === 'action') for (const r of content.levels.get(ch.levelId)!.touches.get(intent.actionId) ?? []) roomIds.add(r);
    // a move within the level arrives somewhere: whoever waits there may strike first (the ambush variant)
    if (intent?.kind === 'move' && typeof intent.to === 'number') roomIds.add(intent.to);
    const rooms: Scene['rooms'] = {};
    const roomList = [...roomIds].sort((a, b) => a - b);
    const roomKeys = roomList.map((r) => K.KeyRoom(lvl.id, lvl.season, r));
    const target = intent ? intentTarget(intent) : undefined;
    // rooms, headcount and a named target in one round trip
    const countKey = K.KeyRoomCount(ch.levelId, ch.room);
    await tx.store.getMany([...roomKeys, countKey, ...(target && target !== ch.id ? [K.KeyChar(target)] : [])]);
    const gotRooms = await tx.store.getManyJSON<RoomState>(roomKeys);
    roomList.forEach((r, i) => (rooms[r] = gotRooms[i] ?? initialRoom(content, lvl.id, r)));
    const ids = await matesNeeded(tx, ch, rooms[ch.room], intent, target);
    // a move within the level takes the mover's party along (SPEC §3.6): load its members (at most PARTY_MAX, from the
    // party index); the engine keeps those standing here and free
    if (intent?.kind === 'move' && typeof intent.to === 'number') {
        for (const e of await tx.store.page(K.PrefixParty(partyOf(ch)), PARTY_MAX)) {
            const id = K.lastSegmentHex(e.key);
            if (id !== ch.id && !ids.includes(id)) ids.push(id);
        }
    }
    const mates = await tx.store.getManyJSON<CharRecord>(ids.map((id) => K.KeyChar(id)));
    const recs = new Map<string, CharRecord>([[ch.id, rec]]);
    ids.forEach((id, i) => {
        if (mates[i]) recs.set(id, mates[i]!);
    });
    const chars: Scene['chars'] = {};
    const before = new Map<string, string>();
    for (const [id, r] of recs) {
        chars[id] = r.char;
        // native stringify is a cheap change detector; canonical encoding only happens for records actually written
        before.set(id, JSON.stringify(r));
    }
    // others standing here who weren't loaded: the headcount, less the actor and the loaded ones (the rogue's ally check)
    const count = (await tx.store.getJSON<RoomCount>(countKey)) ?? { standing: 0, downed: 0 };
    const loaded = [...recs.values()].filter((r) => r.char.status === 'delving' && r.char.levelId === ch.levelId && r.char.room === ch.room).length;
    const othersStanding = Math.max(0, count.standing - loaded);
    return {
        scene: {
            height: tx.height, level: lvl, rooms, chars, activeLevels: levels.map((l) => l.id), othersStanding,
            // locked by a sealed roll of their own: a party move leaves them behind (the actor is mid-roll by design)
            busy: [...recs.values()].filter((r) => r.pending && r.char.id !== ch.id).map((r) => r.char.id)
        },
        recs,
        before,
        actorId: ch.id,
        budgetPaidBefore: lvl.budgetPaid
    };
}

function intentTarget(intent: Intent): string | undefined {
    if (intent.kind === 'stabilize' || intent.kind === 'useItem') return intent.target;
    return intent.kind === 'ability' && typeof intent.target === 'string' ? intent.target : undefined;
}

/** How many occupancy entries listing options reads (RPC only, never in consensus). */
const OPTIONS_SCAN = 64;

/**
 * Which room-mates a resolution can affect: a character the intent names; and when something hits the whole room (a
 * hostile with a room-wide trait, an action targeting the room) the room's standing characters by recency, from a
 * reverse page of ROOM_WIDE_MAX + 1 entries (the actor may be one), stopping at those who lie low. That is a superset
 * of the rules' roomTargets. Listing options (intent null, RPC only) reads a bounded page of everyone.
 */
async function matesNeeded(tx: Pick<TxCtx, 'store' | 'height'>, ch: Character, room: RoomState, intent: Intent | null, target: string | undefined): Promise<string[]> {
    if (intent === null) {
        return (await tx.store.page(K.PrefixWhere(ch.levelId, ch.room), OPTIONS_SCAN)).map((e) => K.lastSegmentHex(e.key)).filter((id) => id !== ch.id);
    }
    const out = target && target !== ch.id ? [target] : [];
    const roomWideMonster = room.monsters.some((m) => m.status === 'hostile' && content.registry.monsters[m.template].traits.some((t) => t.kind === 'aoeEvery'));
    if (roomWideMonster || (intent.kind === 'action' && content.levels.get(ch.levelId)!.roomWide.has(intent.actionId))) {
        for (const e of await tx.store.page(K.PrefixWhereKind(ch.levelId, ch.room, WHERE_STANDING), ROOM_WIDE_MAX + 1, true)) {
            if (tx.height - K.segmentU64(e.key, 5) > LIE_LOW_BLOCKS) break;
            const id = K.lastSegmentHex(e.key);
            if (id !== ch.id && id !== target) out.push(id);
        }
    }
    return out;
}

export const FLOODING = 'the abbey is flooding: the level reopens with the new season';

/** Occupancy kinds (a key segment): standing characters are paged for room-wide effects, downed ones aren't hit by them. */
export const WHERE_STANDING = 1;
export const WHERE_DOWNED = 2;

export interface RoomCount {
    standing: number;
    downed: number;
}

export type Placement = Pick<Character, 'levelId' | 'room' | 'lastActionHeight' | 'status'>;

const indexed = (c: Placement | null): c is Placement => !!c && (c.status === 'delving' || c.status === 'downed');
const kindOf = (c: Placement): number => (c.status === 'downed' ? WHERE_DOWNED : WHERE_STANDING);

/**
 * Index bookkeeping whenever a character's level, room, status or last-action height changes: room occupancy and its
 * headcount, and the level's activity index (by last-action height). All of them hold exactly the characters delving
 * or downed on a level.
 */
export async function moveIndex(store: Store, id: string, from: Placement | null, to: Placement | null): Promise<void> {
    const bump = async (c: Placement, d: number) => {
        const key = K.KeyRoomCount(c.levelId, c.room);
        const n = (await store.getJSON<RoomCount>(key)) ?? { standing: 0, downed: 0 };
        if (c.status === 'downed') n.downed += d;
        else n.standing += d;
        store.setJSON(key, n);
    };
    if (indexed(from)) {
        store.del(K.KeyWhere(from.levelId, from.room, kindOf(from), from.lastActionHeight, id));
        store.del(K.KeyActive(from.levelId, from.lastActionHeight, id));
        await bump(from, -1);
    }
    if (indexed(to)) {
        store.set(K.KeyWhere(to.levelId, to.room, kindOf(to), to.lastActionHeight, id), new Uint8Array([1]));
        store.set(K.KeyActive(to.levelId, to.lastActionHeight, id), new Uint8Array([1]));
        await bump(to, 1);
    }
}

export function scheduleFerry(store: Store, ch: Character): void {
    store.set(K.KeyFerry(ch.downedAt + DOWNED_BLOCKS + 1, ch.id), new Uint8Array([1]));
}

/** Persist a resolved scene: rooms, level, changed characters, indexes, ledger. */
async function saveScene(tx: TxCtx, ls: LoadedScene, events: GameEvent[]): Promise<void> {
    const { scene } = ls;
    const lvl = scene.level as LevelRecord;
    for (const [r, room] of Object.entries(scene.rooms)) tx.store.setJSON(K.KeyRoom(lvl.id, lvl.season, Number(r)), room);
    tx.store.setJSON(K.KeyLevel(lvl.id), lvl);
    for (const [id, rec] of ls.recs) {
        const snapshot = ls.before.get(id)!;
        // untouched room-mates aren't rewritten; the actor always is (its lock and nonce may change outside the scene)
        if (id !== ls.actorId && snapshot === JSON.stringify(rec)) continue;
        const prev = (JSON.parse(snapshot) as CharRecord).char;
        const ch = rec.char;
        tx.store.setJSON(K.KeyChar(id), rec);
        if (prev.levelId !== ch.levelId || prev.room !== ch.room || prev.status !== ch.status || prev.lastActionHeight !== ch.lastActionHeight) {
            await moveIndex(tx.store, id, prev, ch);
        }
        if (prev.status !== 'downed' && ch.status === 'downed') scheduleFerry(tx.store, ch);
    }
    // the ledger follows the budget: new budgeted gold is owed; gold paid back to the treasury no longer is
    const paidBack = events.reduce((s, e) => (e.t === 'gold' && e.source === 'treasury' ? s - e.delta : s), 0);
    const delta = lvl.budgetPaid - ls.budgetPaidBefore - paidBack;
    if (delta !== 0) await addOutstanding(tx.store, delta);
}

// ---------------------------------------------------------------- intents

export interface ActMsg {
    kind: string;
    actionId?: string;
    target?: string;
    itemId?: string;
    ability?: string;
    toLevel?: number;
    toRoom?: number;
    lootRef?: string;
}

export function intentFrom(m: ActMsg, ch: Character): Intent {
    const num = (s: string | undefined): number => (s && /^\d{1,3}$/.test(s) ? Number(s) : fail('target must be a monster index'));
    const opt = (s: string | undefined): string | undefined => (s ? s : undefined);
    switch (m.kind) {
        case 'action':
            return { kind: 'action', actionId: m.actionId || fail('actionId required') };
        case 'attack':
            return { kind: 'attack', target: num(m.target), weapon: opt(m.itemId) };
        case 'ability':
            return { kind: 'ability', ability: m.ability || fail('ability required'), target: m.ability === 'magic_missile' ? num(m.target) : opt(m.target) };
        case 'useItem':
            return { kind: 'useItem', itemId: m.itemId || fail('itemId required'), target: opt(m.target) };
        case 'move': {
            const toLevel = m.toLevel || ch.levelId;
            const toRoom = m.toRoom ?? 0;
            return { kind: 'move', to: toLevel === ch.levelId ? toRoom : { level: toLevel, room: toRoom } };
        }
        case 'rest':
            return { kind: 'rest' };
        case 'take':
            return { kind: 'take', lootRef: m.lootRef || fail('lootRef required') };
        case 'stabilize':
            return { kind: 'stabilize', target: m.target || fail('target required') };
        default:
            return fail(`unknown act kind ${m.kind}`);
    }
}

// ---------------------------------------------------------------- handlers

export async function faucetClaim(tx: TxCtx): Promise<void> {
    const p = await getParams(tx.store);
    if (!p.faucetEnabled) fail('faucet is disabled');
    const rec = (await tx.store.getJSON<FaucetRecord>(K.KeyFaucet(tx.signer))) ?? { lastClaimHeight: 0, totalClaimed: '0', count: 0 };
    const amount = BigInt(p.faucetAmount);
    if (p.faucetCooldownBlocks > 0 && rec.count > 0 && tx.height - rec.lastClaimHeight < p.faucetCooldownBlocks) fail('faucet cooldown');
    if (BigInt(p.faucetMaxPerAccount) > 0n && BigInt(rec.totalClaimed) + amount > BigInt(p.faucetMaxPerAccount)) fail('faucet lifetime limit reached');
    if (p.faucetMaxPerBlock > 0) {
        const blk = (await tx.store.getJSON<{ height: number; count: number }>(K.KeyFaucetBlock())) ?? { height: 0, count: 0 };
        const count = blk.height === tx.height ? blk.count : 0;
        if (count >= p.faucetMaxPerBlock) fail('faucet block limit reached');
        tx.store.setJSON(K.KeyFaucetBlock(), { height: tx.height, count: count + 1 });
    }
    await transfer(tx.store, GAME.faucet, tx.signer, amount);
    tx.store.setJSON(K.KeyFaucet(tx.signer), { lastClaimHeight: tx.height, totalClaimed: (BigInt(rec.totalClaimed) + amount).toString(), count: rec.count + 1 });
    emit(tx, 'FaucetClaimed', { address: hex(tx.signer), amount: amount.toString() });
}

const PARAM_KEYS: Record<keyof Params, 'boolean' | 'uint' | 'positive' | 'micro' | 'fees'> = {
    faucetEnabled: 'boolean',
    faucetAmount: 'micro',
    faucetCooldownBlocks: 'uint',
    faucetMaxPerAccount: 'micro',
    faucetMaxPerBlock: 'uint',
    fees: 'fees',
    maxTxPerBlock: 'positive',
    sweepPerBlock: 'positive'
};

export async function setParams(tx: TxCtx, json: string): Promise<void> {
    if (hex(tx.signer) !== hex(GAME.paramsAuthority)) fail('signer is not the params authority');
    let patch: Record<string, unknown>;
    try {
        patch = JSON.parse(json);
    } catch {
        return fail('params_json is not JSON');
    }
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) fail('params_json must be an object');
    const p = await getParams(tx.store);
    const micro = (v: unknown) => (typeof v === 'string' && /^\d{1,20}$/.test(v) ? v : fail('µGOLD amounts are decimal strings'));
    for (const [k, v] of Object.entries(patch)) {
        const kind = PARAM_KEYS[k as keyof Params] ?? fail(`param ${k} is not settable`);
        if (kind === 'boolean') p.faucetEnabled = typeof v === 'boolean' ? v : fail(`${k} must be a boolean`);
        else if (kind === 'uint') (p as unknown as Record<string, number>)[k] = Number.isSafeInteger(v) && (v as number) >= 0 ? (v as number) : fail(`${k} must be a non-negative integer`);
        else if (kind === 'positive') (p as unknown as Record<string, number>)[k] = Number.isSafeInteger(v) && (v as number) >= 1 ? (v as number) : fail(`${k} must be a positive integer`);
        else if (kind === 'micro') (p as unknown as Record<string, string>)[k] = micro(v);
        else {
            if (!v || typeof v !== 'object') fail('fees must be an object');
            for (const [msgType, amount] of Object.entries(v as Record<string, unknown>)) {
                if (msgType === 'faucet_claim') fail('faucet_claim is always free');
                p.fees[msgType] = micro(amount);
            }
        }
    }
    tx.store.setJSON(K.KeyParams(), p);
    emit(tx, 'ParamsSet', { params: p });
}

export async function createCharacter(tx: TxCtx, name: string, classId: string, commit: Uint8Array): Promise<string> {
    const acct = await getAcct(tx.store, tx.signer);
    const living = (await tx.store.getManyJSON<CharRecord>(acct.chars.map((id) => K.KeyChar(id)))).filter((r) => r && r.char.status !== 'dead').length;
    if (living >= MAX_LIVING_CHARACTERS) fail(`at most ${MAX_LIVING_CHARACTERS} living characters per account`);
    const id = hex(sha(tx.signer, K.u64(acct.nextChar)).subarray(0, 16));
    let ch: Character;
    try {
        ch = newCharacter(content, id, hex(tx.signer), name, classId);
    } catch (e) {
        return fail((e as Error).message);
    }
    const rid = hex(computeRollId(unhex(id), 0));
    const roll: RollRecord = {
        id: rid, kind: 'stats', owner: hex(tx.signer), charId: id, intent: null, commit: hex(commit),
        committedAt: tx.height, expiresAt: tx.height + GAME.revealWindow, reservation: null, resolved: null
    };
    acct.chars.push(id);
    acct.nextChar++;
    tx.store.setJSON(K.KeyAcct(tx.signer), acct);
    tx.store.setJSON(K.KeyChar(id), { char: ch, rolled: null, actionNonce: 1, pending: rid } satisfies CharRecord);
    tx.store.setJSON(K.KeyRoll(rid), roll);
    tx.store.set(K.KeyExpiry(roll.expiresAt, rid), new Uint8Array([1]));
    emit(tx, 'CharacterCreated', { charId: id, name, classId, rollId: rid });
    return id;
}

export async function assignStatsTx(tx: TxCtx, charId: Uint8Array, permutation: number[]): Promise<void> {
    const rec = await ownChar(tx, charId);
    const rolled = rec.rolled ?? fail('stats have not been rolled yet');
    try {
        assignStats(content, rec.char, rolled, permutation);
    } catch (e) {
        fail((e as Error).message);
    }
    rec.rolled = null;
    tx.store.setJSON(K.KeyChar(rec.char.id), rec);
    emit(tx, 'StatsAssigned', { charId: rec.char.id, stats: rec.char.stats });
}

export async function enterDungeonTx(tx: TxCtx, charId: Uint8Array): Promise<void> {
    const rec = await ownChar(tx, charId);
    const l1 = (await getLevel(tx.store, 1)) ?? fail('the abbey is not open yet');
    if (l1.flood) fail(FLOODING);
    try {
        enterDungeon(content, rec.char);
    } catch (e) {
        fail((e as Error).message);
    }
    rec.char.lastActionHeight = tx.height;
    tx.store.setJSON(K.KeyChar(rec.char.id), rec);
    await moveIndex(tx.store, rec.char.id, null, rec.char);
    emit(tx, 'EnteredDungeon', { charId: rec.char.id });
}

/** One exchange. Dice-free intents resolve now; anything that rolls is committed and resolved by reveal. */
export async function act(tx: TxCtx, charId: Uint8Array, m: ActMsg, commit: Uint8Array): Promise<void> {
    const rec = await ownChar(tx, charId);
    if (rec.pending) fail('a roll is already pending for this character');
    const intent = intentFrom(m, rec.char);
    const ls = await loadScene(tx, rec, intent);
    const err = legal(content, ls.scene, rec.char.id, intent);
    if (err) fail(err);
    const nonce = rec.actionNonce;
    const rid = hex(computeRollId(unhex(rec.char.id), nonce));
    const from = { levelId: rec.char.levelId, roomId: rec.char.room };
    rec.actionNonce = nonce + 1;
    // probe on the live scene with dice that refuse to roll: if it completes, that is the real result (no clone, one
    // resolve). If a die is needed the scene is half-mutated, so it is discarded and the record restored from its snapshot.
    let res: ReturnType<typeof resolve> | null = null;
    try {
        res = resolve(content, ls.scene, rec.char.id, intent, new NoDice(), itemIds(rid));
    } catch (e) {
        if (!(e instanceof NoDiceError)) throw e;
    }
    if (res) {
        if (commit.length) fail('this action needs no roll; send it without a commit');
        if (!res.ok) return fail(res.fizzled);
        await saveScene(tx, ls, res.events);
        emit(tx, 'ActionResolved', { charId: rec.char.id, rollId: rid, intent, ...from, dice: [], events: res.events, success: res.success });
        return;
    }
    if (commit.length !== 32) fail('this action rolls dice: commit (32 bytes) required');
    Object.assign(rec, JSON.parse(ls.before.get(rec.char.id)!) as CharRecord, { actionNonce: nonce + 1 });
    const lvl = ls.scene.level as LevelRecord;
    let reservation: string | null = null;
    if (intent.kind === 'take') {
        // contested loot is reserved at commit so the reveal block's proposer cannot pick the winner (SPEC §7.3)
        const key = K.KeyReserve(lvl.id, lvl.season, rec.char.room, intent.lootRef);
        if (await tx.store.get(key)) fail('someone is already taking that');
        tx.store.set(key, unhex(rid));
        reservation = hex(key);
    }
    const roll: RollRecord = {
        id: rid, kind: 'act', owner: hex(tx.signer), charId: rec.char.id, intent, commit: hex(commit),
        committedAt: tx.height, expiresAt: tx.height + GAME.revealWindow, reservation, resolved: null
    };
    rec.pending = rid;
    // committing counts as acting: a character mid-roll doesn't lie low (SPEC §3.3)
    const placed: Placement = { ...rec.char };
    rec.char.lastActionHeight = tx.height;
    tx.store.setJSON(K.KeyChar(rec.char.id), rec);
    await moveIndex(tx.store, rec.char.id, placed, rec.char);
    tx.store.setJSON(K.KeyRoll(rid), roll);
    tx.store.set(K.KeyExpiry(roll.expiresAt, rid), new Uint8Array([1]));
    emit(tx, 'ActionCommitted', { charId: rec.char.id, rollId: rid, intent, expiresAt: roll.expiresAt });
}

export async function reveal(tx: TxCtx, rollIdBytes: Uint8Array, secret: Uint8Array): Promise<void> {
    const rid = hex(rollIdBytes);
    const roll = (await tx.store.getJSON<RollRecord>(K.KeyRoll(rid))) ?? fail('no such roll');
    if (roll.owner !== hex(tx.signer)) fail('not your roll');
    if (roll.resolved) fail('roll already resolved');
    if (tx.height <= roll.committedAt) fail('reveal must land after the commit block');
    if (hex(commitment(secret, rollIdBytes)) !== roll.commit) fail('secret does not match commitment');
    await tx.store.fetch([K.KeyBeacon(roll.committedAt), K.KeyChar(roll.charId)], []); // one round trip for both
    const beacon = (await tx.store.getJSON<BeaconRecord>(K.KeyBeacon(roll.committedAt))) ?? fail('beacon for the commit block not found');
    const dice = new SeededDice(rollSeed(secret, unhex(beacon.value), rollIdBytes));
    await settleRoll(tx, roll, dice, { secret: hex(secret), beacon: beacon.value });
}

/** Resolve a pending roll with real dice (reveal) or forfeit dice (EndBlock timeout). Shared by both paths. */
export async function settleRoll(tx: TxCtx, roll: RollRecord, dice: DiceSource, seedInputs: { secret: string; beacon: string } | null): Promise<void> {
    const rec = await getCharRec(tx.store, roll.charId);
    const outcomeBase = { height: tx.height, secret: seedInputs?.secret ?? null, beacon: seedInputs?.beacon ?? null };
    const forfeited = seedInputs === null;
    tx.store.del(K.KeyExpiry(roll.expiresAt, roll.id));
    if (roll.reservation) tx.store.del(unhex(roll.reservation));
    rec.pending = null;
    const owner = unhex(roll.owner);

    if (roll.kind === 'stats') {
        rec.rolled = rollStats(dice);
        roll.resolved = { ...outcomeBase, outcome: forfeited ? 'forfeited' : 'resolved', dice: dice.log, success: null };
        tx.store.setJSON(K.KeyChar(rec.char.id), rec);
        saveResolved(tx, roll);
        emit(tx, 'StatsRolled', { charId: rec.char.id, rollId: roll.id, rolled: rec.rolled, ...roll.resolved }, owner);
        return;
    }

    const intent = roll.intent!;
    const from = { levelId: rec.char.levelId, roomId: rec.char.room };
    // a roll on a flooding level is void: only the flood moves characters there until the new season
    const closed = rec.char.status !== 'delving' ? `character is ${rec.char.status}` : (await getLevel(tx.store, rec.char.levelId))?.flood ? FLOODING : null;
    const ls = closed ? null : await loadScene(tx, rec, intent);
    const res = ls ? resolve(content, ls.scene, rec.char.id, intent, dice, itemIds(roll.id)) : ({ ok: false, fizzled: closed! } as const);
    if (!res.ok) {
        roll.resolved = { ...outcomeBase, outcome: 'fizzled', dice: [], success: null, fizzled: res.fizzled };
        tx.store.setJSON(K.KeyChar(rec.char.id), rec);
        saveResolved(tx, roll);
        emit(tx, 'ActionFizzled', { charId: rec.char.id, rollId: roll.id, intent, reason: res.fizzled, ...from }, owner);
        return;
    }
    roll.resolved = { ...outcomeBase, outcome: forfeited ? 'forfeited' : 'resolved', dice: res.dice, success: res.success, events: res.events };
    await saveScene(tx, ls!, res.events);
    saveResolved(tx, roll);
    emit(tx, forfeited ? 'ActionForfeited' : 'ActionResolved', { charId: rec.char.id, rollId: roll.id, intent, committedAt: roll.committedAt, ...from, ...roll.resolved }, owner);
}

/**
 * Write a resolved roll and schedule its pruning: it stays readable (for verifying the dice) as long as the beacon it
 * was seeded from, GAME.rollRetention blocks, then an EndBlock sweep deletes it. The events keep the history.
 */
function saveResolved(tx: TxCtx, roll: RollRecord): void {
    tx.store.setJSON(K.KeyRoll(roll.id), roll);
    tx.store.set(K.KeyRollPrune(tx.height + GAME.rollRetention, roll.id), new Uint8Array([1]));
}

export async function give(tx: TxCtx, charId: Uint8Array, toCharId: Uint8Array, itemId: string, gold: bigint): Promise<void> {
    const rec = await ownChar(tx, charId);
    const to = await getCharRec(tx.store, hex(toCharId));
    const a = rec.char;
    const b = to.char;
    if (a.id === b.id) fail('cannot give to yourself');
    if (rec.pending) fail('a roll is pending for this character');
    if (a.status !== 'delving' || b.status !== 'delving' || a.levelId !== b.levelId || a.room !== b.room) fail('both characters must be standing in the same room');
    if ((await getLevel(tx.store, a.levelId))?.flood) fail(FLOODING);
    if ((itemId === '') === (gold === 0n)) fail('give exactly one item or some gold');
    if (itemId) {
        const i = a.inventory.findIndex((x) => x.id === itemId);
        if (i < 0) fail('no such item');
        if (b.inventory.length >= INVENTORY_SLOTS) fail('their pack is full');
        b.inventory.push(...a.inventory.splice(i, 1));
    } else {
        if (gold > BigInt(a.carriedGold)) fail('not carrying that much gold');
        a.carriedGold -= Number(gold);
        b.carriedGold += Number(gold);
    }
    tx.store.setJSON(K.KeyChar(a.id), rec);
    tx.store.setJSON(K.KeyChar(b.id), to);
    emit(tx, 'ItemMoved', { from: a.id, to: b.id, itemId: itemId || null, gold: gold.toString() });
}

function inCamp(rec: CharRecord): void {
    if (rec.char.status !== 'camp') fail('only at camp');
}

export async function extractTx(tx: TxCtx, charId: Uint8Array): Promise<void> {
    const rec = await ownChar(tx, charId);
    if (rec.pending) fail('a roll is pending for this character');
    if ((await getLevel(tx.store, rec.char.levelId))?.flood) fail(FLOODING);
    const acct = await getAcct(tx.store, tx.signer);
    const from: Placement = { ...rec.char };
    let out;
    try {
        out = extract(content, rec.char, acct.stash.length);
    } catch (e) {
        return fail((e as Error).message);
    }
    acct.stash.push(...out.toStash);
    await transfer(tx.store, GAME.treasury, tx.signer, BigInt(out.gold) * MICRO);
    await addOutstanding(tx.store, -out.gold);
    tx.store.setJSON(K.KeyChar(rec.char.id), rec);
    tx.store.setJSON(K.KeyAcct(tx.signer), acct);
    await moveIndex(tx.store, rec.char.id, from, null);
    emit(tx, 'GoldExtracted', { charId: rec.char.id, gold: out.gold, stashed: out.toStash.map((i) => i.id) });
}

export async function shopBuy(tx: TxCtx, charId: Uint8Array, template: string, qty: number): Promise<void> {
    const rec = await ownChar(tx, charId);
    inCamp(rec);
    let cost: number;
    try {
        cost = shopBuyCost(content, template, qty);
    } catch (e) {
        return fail((e as Error).message);
    }
    if (rec.char.inventory.length + qty > INVENTORY_SLOTS) fail('not enough room in the pack');
    const acct = await getAcct(tx.store, tx.signer);
    await transfer(tx.store, tx.signer, GAME.treasury, BigInt(cost) * MICRO);
    const items: Item[] = [];
    for (let i = 0; i < qty; i++) {
        items.push({ id: hex(sha(Buffer.from('abbey.shop.v1'), tx.signer, K.u64(acct.nextItem++)).subarray(0, 16)), template, sourceLevel: 0, escrow: 0 });
    }
    rec.char.inventory.push(...items);
    tx.store.setJSON(K.KeyChar(rec.char.id), rec);
    tx.store.setJSON(K.KeyAcct(tx.signer), acct);
    emit(tx, 'GoldSpent', { charId: rec.char.id, template, qty, gold: cost, items: items.map((i) => i.id) });
}

export async function shopSell(tx: TxCtx, charId: Uint8Array, itemId: string): Promise<void> {
    const rec = await ownChar(tx, charId);
    inCamp(rec);
    const i = rec.char.inventory.findIndex((x) => x.id === itemId);
    if (i < 0) fail('no such item');
    let payout: number;
    try {
        payout = shopSellPayout(content, rec.char.inventory[i]);
    } catch (e) {
        return fail((e as Error).message);
    }
    rec.char.inventory.splice(i, 1);
    await transfer(tx.store, GAME.treasury, tx.signer, BigInt(payout) * MICRO);
    await addOutstanding(tx.store, -payout);
    tx.store.setJSON(K.KeyChar(rec.char.id), rec);
    emit(tx, 'ItemSold', { charId: rec.char.id, itemId, gold: payout });
}

export async function stashMove(tx: TxCtx, charId: Uint8Array, itemId: string, toStash: boolean): Promise<void> {
    const rec = await ownChar(tx, charId);
    inCamp(rec);
    const acct = await getAcct(tx.store, tx.signer);
    const [src, dst, cap] = toStash ? [rec.char.inventory, acct.stash, STASH_SLOTS] : [acct.stash, rec.char.inventory, INVENTORY_SLOTS];
    const i = src.findIndex((x) => x.id === itemId);
    if (i < 0) fail('no such item');
    if (dst.length >= cap) fail('no room');
    dst.push(...src.splice(i, 1));
    tx.store.setJSON(K.KeyChar(rec.char.id), rec);
    tx.store.setJSON(K.KeyAcct(tx.signer), acct);
    emit(tx, 'ItemMoved', { charId: rec.char.id, itemId, toStash });
}

class NoDiceError extends Error {}
/** Dice that refuse to roll: probing whether an intent needs commit-reveal. */
class NoDice implements DiceSource {
    readonly log = [];
    roll(): number {
        throw new NoDiceError('needs dice');
    }
}

/** Forfeit dice for EndBlock timeouts. */
/** Two characters stand in the same place: both at camp, or both in the dungeon in the same room. */
const samePlace = (a: Character, b: Character): boolean =>
    a.status === 'camp' ? b.status === 'camp' : (a.status === 'delving' || a.status === 'downed') && (b.status === 'delving' || b.status === 'downed') && a.levelId === b.levelId && a.room === b.room;

/**
 * Join a party, or leave one (SPEC §3.6). The owner joins `with`'s party (`with` = the character itself leads its own);
 * `with` must stand in the same place, unless it's one of the owner's own characters. Membership is consent to be moved along by the party's other members; nobody
 * else can put a character in a party. Parties hold at most PARTY_MAX.
 */
export async function partySet(tx: TxCtx, charId: Uint8Array, withId: Uint8Array): Promise<void> {
    const rec = await ownChar(tx, charId);
    const ch = rec.char;
    if (ch.status === 'rolling') fail('assign stats first');
    const old = ch.party;
    let party: string | undefined;
    if (withId.length > 0) {
        const wid = Buffer.from(withId).toString('hex');
        if (wid === ch.id) party = ch.id;
        else {
            const other = (await tx.store.getJSON<CharRecord>(K.KeyChar(wid)))?.char ?? fail('no such character');
            // your own characters can band together from anywhere (party mode); another player's party, only side by side
            if (other.owner !== ch.owner && !samePlace(ch, other)) fail('you must be standing together to join');
            party = partyOf(other);
        }
        if (party !== old) {
            const members = await tx.store.page(K.PrefixParty(party!), PARTY_MAX + 1);
            if (members.filter((e) => K.lastSegmentHex(e.key) !== ch.id).length >= PARTY_MAX) fail(`a party is at most ${PARTY_MAX}`);
        }
    }
    if (party === old) return; // already so: nothing to change
    if (old) tx.store.del(K.KeyPartyMember(old, ch.id));
    if (party) {
        ch.party = party;
        tx.store.set(K.KeyPartyMember(party, ch.id), new Uint8Array([1]));
    } else delete ch.party;
    tx.store.setJSON(K.KeyChar(ch.id), rec);
    emit(tx, party ? 'PartyJoined' : 'PartyLeft', { charId: ch.id, party: party ?? old ?? '' });
}

export const forfeitDice = (): DiceSource => new ForfeitDice();
