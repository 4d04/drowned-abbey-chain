/* Per-level seasons (SPEC §4.3): fresh room state, budget reservation, and the end-of-season flood. */

import { refresh } from './camp.ts';
import type { Content } from './content.ts';
import { FERRY_ACTIVE_SECONDS, blocksFor } from './timing.ts';
import type { Character, LevelState, RoomState } from './types.ts';

export function initialRoom(content: Content, levelId: number, roomId: number): RoomState {
    const def = content.levels.get(levelId)!.rooms.get(roomId)!;
    const pools: Record<string, number> = {};
    for (const p of def.pools ?? []) pools[p] = 0;
    return {
        levelId,
        roomId,
        monsters: (def.monsters ?? []).map((m) => ({
            template: m.template,
            hp: content.registry.monsters[m.template].hp,
            status: m.status ?? 'hostile',
            alert: false,
            engaged: false,
            lastEngagedAt: 0
        })),
        flags: {},
        counters: {},
        pools,
        pile: [],
        pileGold: 0,
        corpses: []
    };
}

/** Start a season. `treasuryFree` is treasury gold not already backing other obligations. */
export function newSeason(content: Content, levelId: number, season: number, height: number, treasuryFree: number): LevelState {
    const budget = content.levels.get(levelId)!.def.budget;
    const reserved = Math.max(0, Math.min(budget, treasuryFree));
    return {
        id: levelId,
        season,
        seasonStart: height,
        bossKilledAt: 0,
        budgetReserved: reserved,
        budgetPaid: 0,
        // a short treasury scales every table down proportionally instead of failing
        scaleBp: Math.floor((reserved * 10_000) / budget),
        lootTaken: []
    };
}

export function seasonEndsAt(content: Content, lvl: LevelState): number {
    const s = content.levels.get(lvl.id)!.def.season;
    const cap = lvl.seasonStart + blocksFor(s.capSeconds);
    return lvl.bossKilledAt > 0 ? Math.min(cap, lvl.bossKilledAt + blocksFor(s.resetAfterBossSeconds)) : cap;
}

export interface Flood {
    toTreasury: number; // gold released back to the unreserved treasury
    swept: string[]; // character ids washed out to camp
}

/** Gold the flood returns from a level's rooms: pools, piles, corpse caches and their item escrow, plus the unspent budget. */
export function floodRooms(lvl: LevelState, rooms: RoomState[]): number {
    let toTreasury = lvl.budgetReserved - lvl.budgetPaid;
    for (const r of rooms) {
        for (const k of Object.keys(r.pools)) toTreasury += r.pools[k];
        toTreasury += r.pileGold;
        for (const it of r.pile) toTreasury += it.escrow;
        for (const c of r.corpses) {
            toTreasury += c.gold;
            for (const it of c.items) toTreasury += it.escrow;
        }
    }
    return toTreasury;
}

/**
 * The flood washes one character on the level out through the Lychgate: they keep their items, lose their carried
 * gold (returned), and come round at camp healed, as if they had left. Returns the gold, or null if they aren't on it.
 */
export function washOut(content: Content, lvl: LevelState, ch: Character): number | null {
    if (ch.levelId !== lvl.id || (ch.status !== 'delving' && ch.status !== 'downed')) return null;
    const l1 = content.levels.get(1)!.def;
    const gold = ch.carriedGold;
    ch.carriedGold = 0;
    ch.status = 'camp';
    ch.downedAt = 0;
    ch.levelId = 1;
    ch.room = l1.camp!;
    ch.prevRoom = l1.camp!;
    refresh(content, ch);
    return gold;
}

/**
 * End a level's season in one go (the simulator and tests; the plugin pages through characters with washOut):
 * room gold and the unspent budget return to the treasury, and every character on the level is washed out.
 */
export function endSeason(content: Content, lvl: LevelState, rooms: RoomState[], chars: Character[]): Flood {
    let toTreasury = floodRooms(lvl, rooms);
    const swept: string[] = [];
    for (const ch of [...chars].sort((a, b) => (a.id < b.id ? -1 : 1))) {
        const gold = washOut(content, lvl, ch);
        if (gold === null) continue;
        toTreasury += gold;
        swept.push(ch.id);
    }
    return { toTreasury, swept };
}

export const FERRY_TOLL_BP = 5000; // half of carried gold
export const FERRY_ACTIVE_BLOCKS = blocksFor(FERRY_ACTIVE_SECONDS); // "online": acted within ~10 min
export const FERRY_MAX_RECIPIENTS = 10;

export interface Ferry {
    kept: number; // carried gold the rescued character keeps
    shares: { charId: string; owner: string; amount: number }[]; // toll paid into other players' carried gold
    toTreasury: number; // rounding remainder of the split
    toCache: number; // toll left in the room when nobody qualifies
    items: number; // items left behind in the room
}

/**
 * Who shares a toll: other accounts with a standing character on the same level that acted in the last
 * FERRY_ACTIVE_BLOCKS. One share per account (its most recently active character), most recent first, capped.
 */
export function tollRecipients(downed: Character, candidates: Character[], height: number): Character[] {
    const best = new Map<string, Character>();
    for (const c of candidates) {
        if (c.owner === downed.owner || c.status !== 'delving' || c.levelId !== downed.levelId) continue;
        if (height - c.lastActionHeight > FERRY_ACTIVE_BLOCKS) continue;
        const cur = best.get(c.owner);
        if (!cur || c.lastActionHeight > cur.lastActionHeight || (c.lastActionHeight === cur.lastActionHeight && c.id < cur.id)) best.set(c.owner, c);
    }
    return [...best.values()]
        .sort((a, b) => b.lastActionHeight - a.lastActionHeight || (a.owner < b.owner ? -1 : a.owner > b.owner ? 1 : 0))
        .slice(0, FERRY_MAX_RECIPIENTS);
}

/**
 * The Ferryman (SPEC §3.4): a character downed for longer than `downedBlocks` wakes at the Lychgate at 1 HP.
 * Items stay behind as a cache in the room; half the carried gold is the toll, split among recently active
 * players on the same level (into their carried gold), or left in the cache if nobody qualifies.
 * Returns null if the character isn't due. Deterministic and dice-free: it runs in EndBlock.
 */
export function ferryDowned(content: Content, ch: Character, room: RoomState, height: number, downedBlocks: number, candidates: Character[]): Ferry | null {
    if (ch.status !== 'downed' || height - ch.downedAt <= downedBlocks) return null;
    const toll = ch.carriedGold - Math.floor((ch.carriedGold * (10_000 - FERRY_TOLL_BP)) / 10_000);
    const kept = ch.carriedGold - toll;
    const recipients = toll > 0 ? tollRecipients(ch, candidates, height) : [];
    const each = recipients.length ? Math.floor(toll / recipients.length) : 0;
    const shares = recipients.map((r) => {
        r.carriedGold += each;
        return { charId: r.id, owner: r.owner, amount: each };
    });
    const toCache = recipients.length ? 0 : toll;
    const items = ch.inventory.length;
    if (items > 0 || toCache > 0) room.corpses.push({ charId: ch.id, gold: toCache, items: ch.inventory });
    const l1 = content.levels.get(1)!.def;
    ch.inventory = [];
    ch.carriedGold = kept;
    ch.status = 'delving';
    ch.hp = 1;
    ch.downedAt = 0;
    ch.statuses = [];
    ch.levelId = 1;
    ch.room = l1.camp!;
    ch.prevRoom = l1.camp!;
    return { kept, shares, toTreasury: toll - toCache - each * recipients.length, toCache, items };
}
