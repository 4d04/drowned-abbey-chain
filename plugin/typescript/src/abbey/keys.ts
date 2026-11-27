/* State keys (SPEC §7.5). Core keys use the template's layout; game keys live under the multi-byte "abbey" prefix. */

export const ABBEY_PREFIX = Buffer.from('abbey');

/** Length-prefixed segments (same encoding as the template's JoinLenPrefix); a prefix of segments is a byte prefix. */
export function lenPrefix(...parts: Uint8Array[]): Uint8Array {
    let n = 0;
    for (const p of parts) {
        if (p.length > 255) throw new Error('key segment too long');
        n += 1 + p.length;
    }
    const out = new Uint8Array(n);
    let i = 0;
    for (const p of parts) {
        out[i++] = p.length;
        out.set(p, i);
        i += p.length;
    }
    return out;
}

export function u64(v: number | bigint): Uint8Array {
    const b = Buffer.alloc(8);
    b.writeBigUInt64BE(BigInt(v));
    return b;
}

const s = (x: string): Uint8Array => Buffer.from(x, 'utf8');
const h = (x: string): Uint8Array => Buffer.from(x, 'hex');
const K = (...parts: Uint8Array[]): Uint8Array => lenPrefix(ABBEY_PREFIX, ...parts);

// ---- core (template layout)
export const KeyForAccount = (addr: Uint8Array): Uint8Array => lenPrefix(Buffer.from([1]), addr);
export const KeyForPool = (id: number | bigint): Uint8Array => lenPrefix(Buffer.from([2]), u64(id));
export const KeyForFeeParams = (): Uint8Array => lenPrefix(Buffer.from([7]), s('/f/'));

// ---- configuration and economy
export const KeyParams = (): Uint8Array => K(s('params'));
export const KeyLedger = (): Uint8Array => K(s('ledger'));
export const KeyFaucet = (addr: Uint8Array): Uint8Array => K(s('faucet'), addr);
export const KeyFaucetBlock = (): Uint8Array => K(s('faucetblk'));

// ---- randomness
export const KeyBeacon = (height: number): Uint8Array => K(s('beacon'), u64(height));
export const KeyBeaconLatest = (): Uint8Array => K(s('beacon-latest'));
export const KeyTxAcc = (): Uint8Array => K(s('txacc'));
export const KeyRoll = (rollIdHex: string): Uint8Array => K(s('roll'), h(rollIdHex));
/** every open roll's expiry, oldest first: the forfeit sweep pages through this */
export const PrefixExpiryAll = (): Uint8Array => K(s('expiry'));
export const KeyExpiry = (height: number, rollIdHex: string): Uint8Array => K(s('expiry'), u64(height), h(rollIdHex));

// ---- world
export const PrefixLevels = (): Uint8Array => K(s('level'));
export const KeyLevel = (levelId: number): Uint8Array => K(s('level'), u64(levelId));
export const KeyRoom = (levelId: number, season: number, roomId: number): Uint8Array => K(s('room'), u64(levelId), u64(season), u64(roomId));
export const KeyReserve = (levelId: number, season: number, roomId: number, lootRef: string): Uint8Array =>
    K(s('reserve'), u64(levelId), u64(season), u64(roomId), s(lootRef));

// ---- characters and accounts
export const KeyAcct = (addr: Uint8Array): Uint8Array => K(s('acct'), addr);
export const KeyChar = (charIdHex: string): Uint8Array => K(s('char'), h(charIdHex));
/** Party membership: party/{party char id}/{member char id}, so a party move loads exactly its members (SPEC §3.6). */
export const PrefixParty = (partyHex: string): Uint8Array => K(s('party'), h(partyHex));
export const KeyPartyMember = (partyHex: string, charIdHex: string): Uint8Array => K(s('party'), h(partyHex), h(charIdHex));
/** Room occupancy index: who is standing (or downed) in a room. */
export const PrefixWhereLevel = (levelId: number): Uint8Array => K(s('where'), u64(levelId));
export const PrefixWhere = (levelId: number, roomId: number): Uint8Array => K(s('where'), u64(levelId), u64(roomId));
/**
 * Occupancy: where/{level}/{room}/{1 standing | 2 downed}/{u64 lastActionHeight}/{char}. A reverse page of a room's
 * standing entries is its most recently active characters first, which is all a room-wide exchange needs to read.
 */
export const PrefixWhereKind = (levelId: number, roomId: number, kind: number): Uint8Array => K(s('where'), u64(levelId), u64(roomId), Buffer.from([kind]));
export const KeyWhere = (levelId: number, roomId: number, kind: number, height: number, charIdHex: string): Uint8Array =>
    K(s('where'), u64(levelId), u64(roomId), Buffer.from([kind]), u64(height), h(charIdHex));
/** a room's headcount {standing, downed}, so presence checks never read the occupancy index */
export const KeyRoomCount = (levelId: number, roomId: number): Uint8Array => K(s('roomcount'), u64(levelId), u64(roomId));
export const PrefixRoomCount = (levelId: number): Uint8Array => K(s('roomcount'), u64(levelId));
/** Recent activity per level, for Ferryman toll recipients (value: last action height). */
/** characters on a level by last-action height, so a reverse page is most recent first (Ferryman recipients) */
export const PrefixActive = (levelId: number): Uint8Array => K(s('active'), u64(levelId));
export const KeyActive = (levelId: number, height: number, charIdHex: string): Uint8Array => K(s('active'), u64(levelId), u64(height), h(charIdHex));
/** Ferryman schedule: characters whose downed timer runs out at a height. */
/** resolved rolls due for deletion at a height: rollprune/{h}/{roll} */
export const PrefixRollPruneAll = (): Uint8Array => K(s('rollprune'));
export const KeyRollPrune = (height: number, rollIdHex: string): Uint8Array => K(s('rollprune'), u64(height), h(rollIdHex));
export const PrefixFerryAll = (): Uint8Array => K(s('ferry'));
export const KeyFerry = (height: number, charIdHex: string): Uint8Array => K(s('ferry'), u64(height), h(charIdHex));

/** The last segment of a key, hex (the id at the end of an index key). */
export function lastSegmentHex(key: Uint8Array): string {
    let i = 0;
    let last: Uint8Array = new Uint8Array();
    while (i < key.length) {
        const n = key[i];
        last = key.subarray(i + 1, i + 1 + n);
        i += 1 + n;
    }
    return Buffer.from(last).toString('hex');
}

/** Segment i of a key (0 = the "abbey" prefix) read as a big-endian u64: the height in an expiry, ferry or active key. */
export function segmentU64(key: Uint8Array, i: number): number {
    let at = 0;
    for (let n = 0; n < i; n++) at += 1 + key[at];
    return Number(Buffer.from(key.subarray(at + 1, at + 1 + key[at])).readBigUInt64BE(0));
}
