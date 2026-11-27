/* Intents: legality (checked at commit and again at reveal), resolution of one exchange, and option listing. */

import type { Content } from '../content.ts';
import { type DiceSource, type DieRoll, rollExpr } from '../dice.ts';
import type { Character, EdgeDef, RoomRef, Scene } from '../types.ts';
import { resolveCheck } from './checks.ts';
import { answerer, charAttack, checkCleared, counterattack, damageMonster, healChar, monsterAttack, provokeGroup, recoverIdle, strikesFirst, tickRoomTraits, weaponFor } from './combat.ts';
import { allHold } from './conditions.ts';
import { type Ctx, type GameEvent, DOWNED_BLOCKS, INVENTORY_SLOTS, charMod, hostiles, isPresent, roomOf } from './context.ts';
import { runEffects } from './effects.ts';

export type Intent =
    | { kind: 'action'; actionId: string }
    | { kind: 'attack'; target: number; weapon?: string }
    | { kind: 'ability'; ability: string; target?: number | string }
    | { kind: 'useItem'; itemId: string; target?: string }
    | { kind: 'move'; to: RoomRef }
    | { kind: 'rest' }
    | { kind: 'take'; lootRef: string }
    | { kind: 'stabilize'; target: string };

export type Resolution =
    | { ok: true; events: GameEvent[]; dice: DieRoll[]; success: boolean | null }
    | { ok: false; fizzled: string };

export const ABILITY_KEYS = ['second_wind', 'heal', 'turn_undead', 'magic_missile'] as const;

function makeCtx(content: Content, scene: Scene, charId: string, dice: DiceSource, newId: () => string): Ctx {
    const actor = scene.chars[charId];
    if (!actor) throw new Error(`character ${charId} not in scene`);
    const lvl = content.levels.get(actor.levelId);
    if (!lvl) throw new Error(`level ${actor.levelId} not loaded`);
    return { content, lvl, scene, actor, dice, events: [], newId, lastAttacked: -1 };
}

function sameRef(a: RoomRef, b: RoomRef, levelId: number): boolean {
    const na = typeof a === 'number' ? { level: levelId, room: a } : a;
    const nb = typeof b === 'number' ? { level: levelId, room: b } : b;
    return na.level === nb.level && na.room === nb.room;
}

export interface Exit {
    to: RoomRef;
    edge: EdgeDef;
    reverse: boolean;
}

/** Every edge touching the character's room, in either direction. Conditions are not evaluated here. */
export function exits(content: Content, levelId: number, roomId: number): Exit[] {
    const out: Exit[] = [];
    for (const [lid, lvl] of [...content.levels.entries()].sort((a, b) => a[0] - b[0])) {
        for (const e of lvl.def.edges) {
            if (lid === levelId && e.from === roomId) out.push({ to: e.to, edge: e, reverse: false });
            // the way back never seals: every edge (incl. stairs) has an unconditional reverse unless oneWay
            else if (!e.oneWay && sameRef(e.to, { level: levelId, room: roomId }, lid)) {
                out.push({ to: lid === levelId ? e.from : { level: lid, room: e.from }, edge: e, reverse: true });
            }
        }
    }
    return out;
}

function exitOpen(ctx: Ctx, x: Exit): string | null {
    if (x.reverse) return null;
    if (typeof x.to !== 'number' && !ctx.scene.activeLevels.includes(x.to.level)) return 'stairs are flooded (level not active)';
    if (x.edge.hidden && !roomOf(ctx).flags[`revealed:${typeof x.to === 'number' ? x.to : x.to.room}`]) return 'no such exit';
    if (!allHold(ctx, x.edge.requires)) return 'the way is blocked';
    return null;
}

function moveError(ctx: Ctx, to: RoomRef): string | null {
    const a = ctx.actor;
    const xs = exits(ctx.content, a.levelId, a.room).filter((x) => sameRef(x.to, to, a.levelId));
    if (xs.length === 0) return 'no such exit';
    if (hostiles(roomOf(ctx)).length > 0) {
        // with hostiles present the only way out is fleeing back the way you came
        return typeof to === 'number' && to === a.prevRoom ? null : 'hostiles block the way; you can only flee back';
    }
    const errs = xs.map((x) => exitOpen(ctx, x));
    return errs.includes(null) ? null : errs[0];
}

function allyInRoom(ctx: Ctx, id: string | undefined, allowDowned: boolean): Character | null {
    const c = id === undefined ? ctx.actor : ctx.scene.chars[id];
    if (!c || c.levelId !== ctx.actor.levelId || c.room !== ctx.actor.room) return null;
    if (c.status === 'delving' || (allowDowned && c.status === 'downed')) return c;
    return null;
}

function targetable(ctx: Ctx, index: number): boolean {
    const m = roomOf(ctx).monsters[index];
    return !!m && (m.status === 'hostile' || m.status === 'wary' || m.status === 'friendly');
}

function legalIn(ctx: Ctx, intent: Intent): string | null {
    const a = ctx.actor;
    if (a.status !== 'delving') return `character is ${a.status}`;
    if (a.levelId !== ctx.scene.level.id) return 'scene level mismatch';
    const room = roomOf(ctx);
    switch (intent.kind) {
        case 'action': {
            const def = ctx.lvl.actions.get(intent.actionId);
            if (!def || def.room !== a.room) return 'action not available here';
            return allHold(ctx, def.when) ? null : 'conditions not met';
        }
        case 'attack': {
            if (!targetable(ctx, intent.target)) return 'no such target';
            if (intent.weapon && !a.inventory.some((i) => i.id === intent.weapon && ctx.content.registry.items[i.template].weapon)) return 'no such weapon';
            return null;
        }
        case 'ability': {
            if ((a.abilityUses[intent.ability] ?? 0) <= 0) return 'no uses left';
            switch (intent.ability) {
                case 'second_wind':
                    return null;
                case 'heal':
                    return allyInRoom(ctx, typeof intent.target === 'string' ? intent.target : undefined, true) ? null : 'no such ally';
                case 'magic_missile':
                    return typeof intent.target === 'number' && targetable(ctx, intent.target) ? null : 'no such target';
                case 'turn_undead':
                    return room.monsters.some((m) => turnable(ctx, m.template) && (m.status === 'hostile' || m.status === 'wary'))
                        ? null
                        : 'no undead to turn';
                default:
                    return 'unknown ability';
            }
        }
        case 'useItem': {
            const it = a.inventory.find((i) => i.id === intent.itemId);
            if (!it || !ctx.content.registry.items[it.template].use) return 'no such usable item';
            return allyInRoom(ctx, intent.target, true) ? null : 'no such ally';
        }
        case 'move':
            return moveError(ctx, intent.to);
        case 'rest':
            if (a.room === ctx.lvl.def.camp) return 'at camp you extract instead';
            if (hostiles(room).length > 0) return 'not with hostiles about';
            if (a.rested || a.hitDice <= 0) return 'already rested this delve';
            return null;
        case 'take': {
            if (intent.lootRef === 'pile') return room.pile.length > 0 || room.pileGold > 0 ? null : 'nothing here';
            if (intent.lootRef.startsWith('corpse:')) return room.corpses.some((c) => c.charId === intent.lootRef.slice(7)) ? null : 'nothing here';
            return 'unknown loot';
        }
        case 'stabilize': {
            const t = ctx.scene.chars[intent.target];
            if (!t || t.id === a.id || t.status !== 'downed' || t.levelId !== a.levelId || t.room !== a.room) return 'no downed ally here';
            return ctx.scene.height - t.downedAt <= DOWNED_BLOCKS ? null : 'too late';
        }
    }
}

function turnable(ctx: Ctx, template: string): boolean {
    const d = ctx.content.registry.monsters[template];
    return d.tags.includes('undead') && !d.turnImmune;
}

/** Commit-time and reveal-time legality. null = legal. */
export function legal(content: Content, scene: Scene, charId: string, intent: Intent): string | null {
    const ctx = makeCtx(content, scene, charId, { roll: () => 0, log: [] }, () => '');
    return legalIn(ctx, intent);
}

function take(ctx: Ctx, lootRef: string): void {
    const room = roomOf(ctx);
    const a = ctx.actor;
    let gold: number;
    let items;
    if (lootRef === 'pile') {
        gold = room.pileGold;
        room.pileGold = 0;
        items = room.pile;
        room.pile = [];
    } else {
        const i = room.corpses.findIndex((c) => c.charId === lootRef.slice(7));
        const [cache] = room.corpses.splice(i, 1);
        gold = cache.gold;
        items = cache.items;
    }
    a.carriedGold += gold;
    ctx.events.push({ t: 'gold', char: a.id, delta: gold, source: `take:${lootRef}` });
    for (const it of items) {
        if (a.inventory.length >= INVENTORY_SLOTS) {
            room.pile.push(it); // no room: it stays on the floor
            continue;
        }
        a.inventory.push(it);
        const grants = ctx.content.registry.items[it.template].grantsAbility ?? {};
        for (const k of Object.keys(grants).sort()) a.abilityUses[k] = (a.abilityUses[k] ?? 0) + grants[k];
        ctx.events.push({ t: 'item', char: a.id, item: it.id, template: it.template, to: 'taken' });
    }
}

/** The most characters a party can hold, so a group move loads a bounded number of them (SPEC §3.6). */
export const PARTY_MAX = 6;

/** The party a character moves with: the one it joined, or its own id (a leader who never joined their own party). */
export const partyOf = (c: Pick<Character, 'id' | 'party'>): string => c.party ?? c.id;

/**
 * Who comes along when the actor moves to another room of the level (SPEC §3.6): every other member of the actor's
 * party standing in the same room, not locked by a sealed roll, who could take that exit themselves. In id order.
 * Fleeing a fight isn't a group move: each character flees on their own check.
 */
function companions(ctx: Ctx, to: RoomRef): Character[] {
    const a = ctx.actor;
    if (typeof to !== 'number') return []; // stairs to another level: on your own
    const key = partyOf(a);
    const busy = new Set(ctx.scene.busy ?? []);
    return Object.values(ctx.scene.chars)
        .filter((c) => c.id !== a.id && c.party === key && c.status === 'delving' && c.levelId === a.levelId && c.room === a.room && !busy.has(c.id))
        .sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0))
        .filter((c) => legalIn({ ...ctx, actor: c }, { kind: 'move', to }) === null);
}

function moveChar(ctx: Ctx, to: RoomRef): void {
    const a = ctx.actor;
    if (typeof to === 'number') {
        a.prevRoom = a.room;
        a.room = to;
    } else {
        a.levelId = to.level;
        a.room = to.room;
        a.prevRoom = -1;
    }
    ctx.events.push({ t: 'move', char: a.id, level: a.levelId, room: a.room });
}

function useAbility(ctx: Ctx, ability: string, target: number | string | undefined): void {
    const a = ctx.actor;
    a.abilityUses[ability] -= 1;
    const room = roomOf(ctx);
    switch (ability) {
        case 'second_wind':
            healChar(ctx, a, rollExpr(ctx.dice, '1d10+3', 'pc'));
            return;
        case 'heal':
            healChar(ctx, allyInRoom(ctx, typeof target === 'string' ? target : undefined, true)!, rollExpr(ctx.dice, '2d4+2', 'pc'));
            return;
        case 'magic_missile': {
            const idx = target as number;
            provokeGroup(ctx, room, room.monsters[idx]);
            ctx.lastAttacked = idx;
            let dmg = 0;
            for (let i = 0; i < 3; i++) dmg += rollExpr(ctx.dice, '1d4+1', 'pc');
            damageMonster(ctx, room, idx, dmg);
            return;
        }
        case 'turn_undead':
            room.monsters.forEach((m, i) => {
                if (!turnable(ctx, m.template) || (m.status !== 'hostile' && m.status !== 'wary')) return;
                const mod = ctx.content.registry.monsters[m.template].saves.WIS ?? 0;
                const d = ctx.dice.roll(20, 'npc');
                const success = d + mod >= 13;
                ctx.events.push({ t: 'save', who: `m${i}`, ability: 'WIS', d20: [d], kept: d, total: d + mod, dc: 13, success });
                if (!success) {
                    m.status = 'fled';
                    ctx.events.push({ t: 'monster', room: room.roomId, index: i, status: 'fled' });
                }
            });
            checkCleared(ctx, room);
            return;
    }
}

/**
 * Resolve one exchange. Mutates `scene` in place (callers that need the old state clone it first).
 * Legality is re-checked first: if the action no longer makes sense it fizzles with no dice and no counterattack.
 */
export function resolve(content: Content, scene: Scene, charId: string, intent: Intent, dice: DiceSource, newId: () => string): Resolution {
    const ctx = makeCtx(content, scene, charId, dice, newId);
    const err = legalIn(ctx, intent);
    if (err) return { ok: false, fizzled: err };
    const a = ctx.actor;
    a.lastActionHeight = scene.height;
    recoverIdle(ctx);
    const startLevel = a.levelId;
    const startRoom = a.room;
    let success: boolean | null = null;
    let provokes = true;

    // prototype variants: the monster that would answer may strike before the action instead of after it
    const v = content.variants;
    let struckFirst = false;
    if ((v.quick || v.initiative) && answerer(ctx, preferredTarget(intent)) >= 0 && provokesBefore(ctx, intent)) {
        const idx = answerer(ctx, preferredTarget(intent));
        const room = roomOf(ctx);
        const quick = v.quick && content.registry.monsters[room.monsters[idx].template].traits.some((t) => t.kind === 'quick');
        if (quick ? strikesFirst(ctx, idx, 'quick') : v.initiative && strikesFirst(ctx, idx, 'round')) {
            monsterAttack(ctx, room, idx, a);
            struckFirst = true;
            // downed before acting: the action is lost; the room still ticks
            if (a.status !== 'delving') {
                if (hostiles(room).length > 0) tickRoomTraits(ctx);
                return { ok: true, events: ctx.events, dice: dice.log, success: null };
            }
        }
    }

    switch (intent.kind) {
        case 'action': {
            const def = ctx.lvl.actions.get(intent.actionId)!;
            runEffects(ctx, def.effects);
            if (def.check && a.status === 'delving') {
                success = resolveCheck(ctx, a, def.check);
                runEffects(ctx, success ? def.onSuccess : def.onFailure);
            } else if (!def.check) {
                runEffects(ctx, def.onSuccess);
            }
            provokes = def.provokes === undefined ? true : def.provokes === 'onFailure' ? success === false : def.provokes;
            ctx.events.push({ t: 'outcome', action: def.id, success });
            break;
        }
        case 'attack':
            charAttack(ctx, intent.target, weaponFor(ctx, a, intent.weapon));
            break;
        case 'ability':
            useAbility(ctx, intent.ability, intent.target);
            break;
        case 'useItem': {
            const i = a.inventory.findIndex((x) => x.id === intent.itemId);
            const [it] = a.inventory.splice(i, 1);
            ctx.events.push({ t: 'item', char: a.id, item: it.id, template: it.template, to: 'consumed' });
            const target = allyInRoom(ctx, intent.target, true)!;
            healChar(ctx, target, rollExpr(ctx.dice, content.registry.items[it.template].use!.heal, 'pc'));
            break;
        }
        case 'move': {
            const n = hostiles(roomOf(ctx)).length;
            if (n > 0) {
                success = resolveCheck(ctx, a, { ability: 'DEX', dc: 10 + 2 * n });
                if (success) moveChar(ctx, intent.to);
            } else {
                // the party comes along in the same exchange, so nobody walks into a waiting room alone
                const party = companions(ctx, intent.to);
                moveChar(ctx, intent.to);
                for (const c of party) {
                    c.lastActionHeight = scene.height;
                    moveChar({ ...ctx, actor: c }, intent.to);
                }
            }
            break;
        }
        case 'rest': {
            a.rested = true;
            a.hitDice -= 1;
            healChar(ctx, a, Math.max(1, rollExpr(ctx.dice, '1d8', 'pc') + charMod(a, 'CON')));
            // wandering monster on a 4 (a monster die, so a forfeit always draws one)
            if (ctx.dice.roll(4, 'npc') === 4 && ctx.lvl.def.wandering.length > 0) {
                const w = ctx.lvl.def.wandering;
                const template = w[ctx.dice.roll(w.length, 'npc') - 1];
                runEffects(ctx, [{ op: 'spawnMonster', template, alert: true }]);
            }
            break;
        }
        case 'take':
            take(ctx, intent.lootRef);
            break;
        case 'stabilize': {
            success = resolveCheck(ctx, a, { ability: 'WIS', dc: 10 });
            if (success) {
                const t = scene.chars[intent.target];
                t.status = 'delving';
                t.downedAt = 0;
                t.hp = 1;
                ctx.events.push({ t: 'stabilized', char: t.id, by: a.id });
            }
            break;
        }
    }

    // the exchange: one counterattack and room-wide ticks, unless the actor left the room
    if (a.levelId === startLevel && a.room === startRoom) {
        if (provokes && !struckFirst) counterattack(ctx);
        if (hostiles(roomOf(ctx)).length > 0) tickRoomTraits(ctx);
    } else if (v.ambush && intent.kind === 'move' && a.status === 'delving' && a.levelId === startLevel) {
        // ambush variant: walking into a room with hostiles (a move, not an action that carries you off) rolls initiative; if they win, the first one strikes.
        // A party arriving together rolls once, as the actor (at the front): the first blow, if any, lands on them.
        // Monsters left alone recover first: an ambush must not count as the fight that keeps the Abbot from healing.
        recoverIdle(ctx);
        const hs = hostiles(roomOf(ctx));
        if (hs.length > 0 && strikesFirst(ctx, hs[0], 'ambush')) monsterAttack(ctx, roomOf(ctx), hs[0], a);
    }
    return { ok: true, events: ctx.events, dice: dice.log, success };
}

/** The monster an intent goes after (so the right one answers), or -1. */
function preferredTarget(intent: Intent): number {
    if (intent.kind === 'attack') return intent.target;
    if (intent.kind === 'ability' && typeof intent.target === 'number') return intent.target;
    return -1;
}

/** Whether an intent would draw an answer at all, known before it resolves (an onFailure action can't strike first). */
function provokesBefore(ctx: Ctx, intent: Intent): boolean {
    if (intent.kind !== 'action') return true;
    const p = ctx.lvl.actions.get(intent.actionId)!.provokes;
    return p === undefined || p === true;
}

class NoDice implements DiceSource {
    readonly log: DieRoll[] = [];
    roll(): number {
        throw new NoDiceError();
    }
}
class NoDiceError extends Error {}

/** Whether resolving needs commit-reveal. Exact: resolves a scratch copy with dice that refuse to roll. */
export function needsRoll(content: Content, scene: Scene, charId: string, intent: Intent): boolean {
    try {
        resolve(content, structuredClone(scene), charId, intent, new NoDice(), () => 'probe');
        return false;
    } catch (e) {
        if (e instanceof NoDiceError) return true;
        throw e;
    }
}

/** Every legal intent for a character right now, in a stable order. */
export function options(content: Content, scene: Scene, charId: string): Intent[] {
    const ctx = makeCtx(content, scene, charId, { roll: () => 0, log: [] }, () => '');
    const a = ctx.actor;
    if (a.status !== 'delving') return [];
    const room = roomOf(ctx);
    const cands: Intent[] = [];
    for (const def of ctx.lvl.actionsByRoom.get(a.room) ?? []) cands.push({ kind: 'action', actionId: def.id });
    room.monsters.forEach((m, i) => {
        if (!isPresent(m)) return;
        cands.push({ kind: 'attack', target: i });
        for (const it of a.inventory) if (content.registry.items[it.template].weapon) cands.push({ kind: 'attack', target: i, weapon: it.id });
    });
    for (const ab of ABILITY_KEYS) {
        if ((a.abilityUses[ab] ?? 0) <= 0) continue;
        if (ab === 'magic_missile') room.monsters.forEach((_, i) => cands.push({ kind: 'ability', ability: ab, target: i }));
        else if (ab === 'heal') for (const c of Object.values(scene.chars).sort((x, y) => (x.id < y.id ? -1 : 1))) cands.push({ kind: 'ability', ability: ab, target: c.id });
        else cands.push({ kind: 'ability', ability: ab });
    }
    const seenItems = new Set<string>();
    for (const it of a.inventory) {
        if (!content.registry.items[it.template].use || seenItems.has(it.template)) continue;
        seenItems.add(it.template); // one option per item kind
        cands.push({ kind: 'useItem', itemId: it.id });
        for (const c of Object.values(scene.chars)) if (c.id !== a.id && c.status === 'downed') cands.push({ kind: 'useItem', itemId: it.id, target: c.id });
    }
    const seenExits = new Set<string>();
    for (const x of exits(content, a.levelId, a.room)) {
        const key = JSON.stringify(x.to);
        if (seenExits.has(key)) continue;
        seenExits.add(key);
        cands.push({ kind: 'move', to: x.to });
    }
    cands.push({ kind: 'rest' });
    cands.push({ kind: 'take', lootRef: 'pile' });
    for (const c of room.corpses) cands.push({ kind: 'take', lootRef: `corpse:${c.charId}` });
    for (const c of Object.values(scene.chars)) if (c.status === 'downed') cands.push({ kind: 'stabilize', target: c.id });
    return cands.filter((i) => legalIn(ctx, i) === null);
}
