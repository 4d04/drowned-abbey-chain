/* EndBlock (SPEC §7.4): beacon, level activation, reveal timeouts, the Ferryman, roll pruning, seasons. Dice-free except forfeits. */

import { createHash } from 'crypto';
import { DOWNED_BLOCKS, FERRY_ACTIVE_BLOCKS, FERRY_MAX_RECIPIENTS, type Character, blocksFor, ferryDowned, floodRooms, newSeason, seasonEndsAt, washOut } from '@abbey/rules';
import { type BeaconRecord, type CharRecord, type LevelRecord, type RollRecord, GAME } from './config.js';
import { type Placement, type TxCtx, activeLevels, addOutstanding, content, forfeitDice, getLevel, getParams, getRoom, moveIndex, settleRoll, treasuryFree } from './game.js';
import * as K from './keys.js';

const hex = (b: Uint8Array): string => Buffer.from(b).toString('hex');
const sha = (...parts: Uint8Array[]): Uint8Array => {
    const h = createHash('sha256');
    for (const p of parts) h.update(p);
    return new Uint8Array(h.digest());
};

/** Fold a delivered transaction into this block's accumulator (SPEC §7.3, ingredient 1). */
export async function foldTx(tx: TxCtx, txBytes: Uint8Array): Promise<void> {
    const acc = (await tx.store.getJSON<BeaconRecord>(K.KeyTxAcc())) ?? { height: 0, value: '', proposer: '', txCount: 0 };
    tx.store.setJSON(K.KeyTxAcc(), { ...acc, value: hex(sha(Buffer.from(acc.value, 'hex'), sha(txBytes))), txCount: acc.txCount + 1 });
}

export async function endBlock(tx: TxCtx, proposer: Uint8Array): Promise<void> {
    const h = tx.height;
    const store = tx.store;

    // 1. beacon_h = sha256("abbey.beacon.v1" ‖ beacon_{h−1} ‖ u64be(h) ‖ proposer_h ‖ txAcc_h)
    const latest = await store.getJSON<BeaconRecord>(K.KeyBeaconLatest());
    const acc = await store.getJSON<BeaconRecord>(K.KeyTxAcc());
    const prev = latest ? Buffer.from(latest.value, 'hex') : new Uint8Array(32);
    const value = sha(Buffer.from('abbey.beacon.v1'), prev, K.u64(h), proposer, Buffer.from(acc?.value ?? '', 'hex'));
    const beacon: BeaconRecord = { height: h, value: hex(value), proposer: hex(proposer), txCount: acc?.txCount ?? 0 };
    store.setJSON(K.KeyBeacon(h), beacon);
    store.setJSON(K.KeyBeaconLatest(), beacon);
    store.del(K.KeyTxAcc());
    if (h > GAME.beaconRetention) store.del(K.KeyBeacon(h - GAME.beaconRetention));

    // 2. level activation: a new level is inert until its height, so old and new releases agree before it
    for (const [levelId, at] of [...GAME.activation.entries()].sort((a, b) => a[0] - b[0])) {
        if (h < at || !content.levels.has(levelId) || (await getLevel(store, levelId))) continue;
        const lvl: LevelRecord = { ...newSeason(content, levelId, 1, h, await treasuryFree(store)), activatedAt: h };
        store.setJSON(K.KeyLevel(levelId), lvl);
        tx.events.push({ kind: 'LevelActivated', address: GAME.treasury, data: { levelId, contentHash: content.levels.get(levelId)!.contentHash, budget: lvl.budgetReserved } });
    }

    // Each sweep below handles at most sweepPerBlock items, oldest first; the rest carry over to the next block.
    const budget = (await getParams(store)).sweepPerBlock;

    // 3. reveal timeouts: forfeit outcome (player dice minimum, monster dice maximum)
    for (const e of await store.page(K.PrefixExpiryAll(), budget)) {
        if (K.segmentU64(e.key, 2) > h) break;
        const roll = await store.getJSON<RollRecord>(K.KeyRoll(K.lastSegmentHex(e.key)));
        store.del(e.key);
        if (roll && !roll.resolved) await settleRoll(tx, roll, forfeitDice(), null);
    }

    // 4. the Ferryman: downed characters whose 20 blocks ran out without a rescue
    for (const e of await store.page(K.PrefixFerryAll(), budget)) {
        const due = K.segmentU64(e.key, 2);
        if (due > h) break;
        store.del(e.key);
        const rec = await store.getJSON<CharRecord>(K.KeyChar(K.lastSegmentHex(e.key)));
        // a stale schedule (stabilized, or downed again later) is skipped; so is a flooding level (the flood takes them)
        if (!rec || rec.char.status !== 'downed' || rec.char.downedAt + DOWNED_BLOCKS + 1 !== due) continue;
        if ((await getLevel(store, rec.char.levelId))?.flood) continue;
        await ferry(tx, rec);
    }

    // 5. pruning: resolved rolls past their retention (the beacon they were seeded from is gone too)
    for (const e of await store.page(K.PrefixRollPruneAll(), budget)) {
        if (K.segmentU64(e.key, 2) > h) break;
        store.del(e.key);
        store.del(K.KeyRoll(K.lastSegmentHex(e.key)));
    }

    // 6. seasons: warning bell, then the flood (a page per block) and a fresh season
    for (const lvl of await activeLevels(store)) {
        const def = content.levels.get(lvl.id)!.def;
        const endsAt = seasonEndsAt(content, lvl);
        if (h === endsAt - blocksFor(def.season.bellWarningSeconds)) tx.events.push({ kind: 'BellTolled', address: GAME.treasury, data: { levelId: lvl.id, season: lvl.season, endsAt } });
        if (h >= endsAt) await flood(tx, lvl, budget);
        else await topUp(tx, lvl);
    }
}

/** How far back the Ferryman looks through a level's activity index for toll recipients (most recent first). */
export const FERRY_SCAN = 64;

/**
 * Toll candidates: characters on the level from the most recent entries of its activity index, loaded a height at a
 * time until FERRY_MAX_RECIPIENTS other accounts qualify (so ties at the last height are all seen), the entries are
 * older than FERRY_ACTIVE_BLOCKS, or FERRY_SCAN entries have been read. Matches tollRecipients over everyone unless
 * the scan runs out first.
 */
async function tollCandidates(tx: TxCtx, ch: Character): Promise<Map<string, CharRecord>> {
    const page = await tx.store.page(K.PrefixActive(ch.levelId), FERRY_SCAN, true);
    const recs = new Map<string, CharRecord>();
    const owners = new Set<string>();
    for (let i = 0; i < page.length && owners.size < FERRY_MAX_RECIPIENTS; ) {
        const at = K.segmentU64(page[i].key, 3);
        if (tx.height - at > FERRY_ACTIVE_BLOCKS) break;
        let j = i;
        while (j < page.length && K.segmentU64(page[j].key, 3) === at) j++;
        const ids = page.slice(i, j).map((e) => K.lastSegmentHex(e.key)).filter((id) => id !== ch.id);
        const got = await tx.store.getManyJSON<CharRecord>(ids.map((id) => K.KeyChar(id)));
        ids.forEach((id, n) => {
            const r = got[n];
            if (!r) return;
            recs.set(id, r);
            if (r.char.status === 'delving' && r.char.levelId === ch.levelId && r.char.owner !== ch.owner) owners.add(r.char.owner);
        });
        i = j;
    }
    return recs;
}

/**
 * A level short of its budget (e.g. activated before the treasury was funded, or the treasury ran low) reserves more as
 * gold arrives, and its loot scale rises to match. Anyone may top up the treasury with a core send (SPEC §6.8).
 */
async function topUp(tx: TxCtx, lvl: LevelRecord): Promise<void> {
    const budget = content.levels.get(lvl.id)!.def.budget;
    if (lvl.budgetReserved >= budget) return;
    const free = await treasuryFree(tx.store);
    if (free <= 0) return;
    lvl.budgetReserved = Math.min(budget, lvl.budgetReserved + free);
    lvl.scaleBp = Math.floor((lvl.budgetReserved * 10_000) / budget);
    tx.store.setJSON(K.KeyLevel(lvl.id), lvl);
    tx.events.push({ kind: 'BudgetReserved', address: GAME.treasury, data: { levelId: lvl.id, season: lvl.season, reserved: lvl.budgetReserved, scaleBp: lvl.scaleBp } });
}

async function ferry(tx: TxCtx, rec: CharRecord): Promise<void> {
    const store = tx.store;
    const ch = rec.char;
    const lvl = (await getLevel(store, ch.levelId))!;
    const room = await getRoom(store, lvl, ch.room);
    const recs = await tollCandidates(tx, ch);
    const candidates = [...recs.values()].map((r) => r.char);
    const from: Placement = { levelId: ch.levelId, room: ch.room, lastActionHeight: ch.lastActionHeight, status: ch.status };
    const carried = ch.carriedGold;
    const f = ferryDowned(content, ch, room, tx.height, DOWNED_BLOCKS, candidates)!;
    store.setJSON(K.KeyRoom(lvl.id, lvl.season, from.room), room);
    for (const s of f.shares) store.setJSON(K.KeyChar(s.charId), recs.get(s.charId)!);
    store.setJSON(K.KeyChar(ch.id), rec);
    await moveIndex(store, ch.id, from, ch);
    if (f.toTreasury) await addOutstanding(store, -f.toTreasury);
    tx.events.push({ kind: 'CharacterFerried', address: Buffer.from(ch.owner, 'hex'), data: { charId: ch.id, ...from, carried, ...f } });
}

/**
 * The season's flood, a page of characters per block: the first block returns the rooms' gold and the unspent budget
 * and closes the level; each block then washes out up to `budget` characters still on it (they leave the occupancy
 * index, so the next page starts with whoever is left); the block that finds fewer starts the fresh season.
 */
async function flood(tx: TxCtx, lvl: LevelRecord, budget: number): Promise<void> {
    const store = tx.store;
    if (!lvl.flood) {
        const def = content.levels.get(lvl.id)!.def;
        const rooms = [];
        for (const r of def.rooms) rooms.push(await getRoom(store, lvl, r.id));
        const fromRooms = floodRooms(lvl, rooms);
        // old room records stay at their season's keys (history); the new season starts from content
        await addOutstanding(store, -(fromRooms - (lvl.budgetReserved - lvl.budgetPaid)));
        lvl.flood = { since: tx.height, returned: fromRooms, swept: 0 };
        tx.events.push({ kind: 'FloodBegan', address: GAME.treasury, data: { levelId: lvl.id, season: lvl.season, fromRooms } });
    }
    const page = await store.page(K.PrefixWhereLevel(lvl.id), budget);
    const recs = await store.getManyJSON<CharRecord>(page.map((e) => K.KeyChar(K.lastSegmentHex(e.key))));
    const swept: string[] = [];
    let gold = 0;
    for (const [i, e] of page.entries()) {
        const r = recs[i];
        const before: Placement | null = r && { ...r.char };
        const g = r ? washOut(content, lvl, r.char) : null;
        if (g === null) {
            store.del(e.key); // an index entry with no character on the level: drop it so the flood always advances
            continue;
        }
        gold += g;
        store.setJSON(K.KeyChar(r!.char.id), r);
        await moveIndex(store, r!.char.id, before, r!.char);
        swept.push(r!.char.id);
    }
    if (gold) await addOutstanding(store, -gold);
    lvl.flood.returned += gold;
    lvl.flood.swept += swept.length;
    if (swept.length) tx.events.push({ kind: 'FloodSwept', address: GAME.treasury, data: { levelId: lvl.id, season: lvl.season, charIds: swept, gold } });
    if (page.length === budget) {
        store.setJSON(K.KeyLevel(lvl.id), lvl);
        return;
    }
    // the new budget is reserved from what's free once this season's obligations are gone
    const fresh: LevelRecord = { ...newSeason(content, lvl.id, lvl.season + 1, tx.height, await treasuryFree(store, lvl.id)), activatedAt: lvl.activatedAt };
    store.setJSON(K.KeyLevel(lvl.id), fresh);
    tx.events.push({ kind: 'SeasonEnded', address: GAME.treasury, data: { levelId: lvl.id, season: lvl.season, returned: lvl.flood.returned, swept: lvl.flood.swept, blocks: tx.height - lvl.flood.since + 1 } });
    tx.events.push({ kind: 'SeasonStarted', address: GAME.treasury, data: { levelId: lvl.id, season: fresh.season, budget: fresh.budgetReserved } });
}
