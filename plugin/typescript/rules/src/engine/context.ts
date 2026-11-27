/* Resolution context, events, and small state helpers shared by the engine modules. */

import type { Content, LevelIndex } from '../content.ts';
import type { DiceSource } from '../dice.ts';
import type { Ability, Character, Item, MonsterState, RoomState, Scene } from '../types.ts';
import { ABILITIES } from '../types.ts';
import { DOWNED_SECONDS, LIE_LOW_SECONDS, blocksFor } from '../timing.ts';

export const INVENTORY_SLOTS = 8;
export const STASH_SLOTS = 32;
/** Blocks a downed character waits for a rescue (DOWNED_SECONDS). */
export const DOWNED_BLOCKS = blocksFor(DOWNED_SECONDS);
export const PROFICIENCY = 2;
export const MAX_LIVING_CHARACTERS = 5;

/** Engine events: everything a client needs to narrate and verify an outcome. */
export type GameEvent =
    | { t: 'check'; char: string; ability: Ability; d20: number[]; kept: number; mod: number; total: number; dc: number; success: boolean; auto?: boolean }
    | { t: 'attack'; attacker: string; target: string; d20: number[]; kept: number; total: number; ac: number; hit: boolean }
    | { t: 'damage'; target: string; amount: number; hp: number }
    | { t: 'heal'; target: string; amount: number; hp: number }
    | { t: 'save'; who: string; ability: Ability; d20: number[]; kept: number; total: number; dc: number; success: boolean }
    | { t: 'monster'; room: number; index: number; status: string }
    | { t: 'spawn'; room: number; template: string; index: number }
    | { t: 'downed'; char: string }
    | { t: 'died'; char: string; room: number }
    | { t: 'stabilized'; char: string; by: string }
    | { t: 'gold'; char: string; delta: number; source: string }
    | { t: 'item'; char: string; item: string; template: string; to: 'inventory' | 'pile' | 'consumed' | 'taken' }
    | { t: 'flag'; room: number; flag: string; value: boolean }
    | { t: 'counter'; room: number; counter: string; value: number }
    | { t: 'pool'; room: number; pool: string; value: number }
    | { t: 'status'; char: string; status: string; charges: number }
    | { t: 'charFlag'; char: string; flag: string }
    | { t: 'move'; char: string; level: number; room: number }
    | { t: 'loot'; table: string; gold: number; items: string[]; already?: boolean }
    | { t: 'bossDefeated'; level: number; by: string }
    | { t: 'tideWail'; room: number }
    | { t: 'recovered'; room: number; index: number; hp: number }
    | { t: 'narrate'; outcome: string }
    | { t: 'outcome'; action: string; success: boolean | null }
    // who struck first (prototype variants): the d20s and totals, or no dice when a quick monster simply goes first
    | { t: 'initiative'; char: string; monster: string; reason: 'ambush' | 'quick' | 'round'; first: 'you' | 'them'; you?: { d20: number; total: number }; them?: { d20: number; total: number } };

export interface Ctx {
    content: Content;
    lvl: LevelIndex;
    scene: Scene;
    actor: Character;
    dice: DiceSource;
    events: GameEvent[];
    newId: () => string;
    lastAttacked: number; // monster index in the actor's room, -1 = none
}

export function abilityIndex(a: Ability): number {
    return ABILITIES.indexOf(a);
}

export function abilityMod(score: number): number {
    return Math.floor((score - 10) / 2);
}

export function charMod(ch: Character, a: Ability): number {
    return abilityMod(ch.stats[abilityIndex(a)]);
}

export function roomOf(ctx: Ctx, roomId?: number): RoomState {
    const id = roomId ?? ctx.actor.room;
    const r = ctx.scene.rooms[id];
    if (!r) throw new Error(`room ${id} not loaded into scene`);
    return r;
}

/** Monsters that block, counterattack, and keep a room uncleared. */
export function isHostile(m: MonsterState): boolean {
    return m.status === 'hostile';
}

/** Still in the room in some form (not dead, not fled). */
export function isPresent(m: MonsterState): boolean {
    return m.status !== 'dead' && m.status !== 'fled';
}

export function hostiles(room: RoomState): number[] {
    const out: number[] = [];
    room.monsters.forEach((m, i) => isHostile(m) && out.push(i));
    return out;
}

/** Characters standing in a room, in a deterministic order (by id). Only those loaded into the scene (see othersStanding). */
export function charsInRoom(scene: Scene, levelId: number, roomId: number, includeDowned = false): Character[] {
    return Object.values(scene.chars)
        .filter((c) => c.levelId === levelId && c.room === roomId && (c.status === 'delving' || (includeDowned && c.status === 'downed')))
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** Blocks without acting after which a character lies low: room-wide effects pass over them (SPEC §3.3). */
export const LIE_LOW_BLOCKS = blocksFor(LIE_LOW_SECONDS);
/** Most characters besides the actor a room-wide effect reaches: the most recently active (SPEC §3.3). */
export const ROOM_WIDE_MAX = 32;

/**
 * Who a room-wide effect hits, in id order: the actor, plus up to ROOM_WIDE_MAX others standing there who acted within
 * LIE_LOW_BLOCKS, most recent first (ties: higher id first). Idle characters are hidden in the shadows. The bound keeps a
 * room-wide exchange's cost fixed however crowded the room is; the plugin reads exactly this page of its index.
 */
export function roomTargets(scene: Scene, actor: Character, roomId: number): Character[] {
    const here = charsInRoom(scene, actor.levelId, roomId);
    const others = here
        .filter((c) => c.id !== actor.id && scene.height - c.lastActionHeight <= LIE_LOW_BLOCKS)
        .sort((a, b) => b.lastActionHeight - a.lastActionHeight || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0))
        .slice(0, ROOM_WIDE_MAX);
    const hit = new Set([...others.map((c) => c.id), actor.id]);
    return here.filter((c) => hit.has(c.id));
}

export function hasItem(ch: Character, template: string): boolean {
    return ch.inventory.some((i) => i.template === template);
}

export function charAC(content: Content, ch: Character): number {
    const base = content.registry.classes[ch.classId].ac;
    let bonus = 0;
    for (const it of ch.inventory) bonus = Math.max(bonus, content.registry.items[it.template].acBonus ?? 0);
    return base + bonus;
}

export function addItem(ctx: Ctx, ch: Character, item: Item, room: RoomState): void {
    if (ch.inventory.length >= INVENTORY_SLOTS) {
        room.pile.push(item);
        ctx.events.push({ t: 'item', char: ch.id, item: item.id, template: item.template, to: 'pile' });
        return;
    }
    ch.inventory.push(item);
    const grants = ctx.content.registry.items[item.template].grantsAbility ?? {};
    for (const k of Object.keys(grants).sort()) ch.abilityUses[k] = (ch.abilityUses[k] ?? 0) + grants[k];
    ctx.events.push({ t: 'item', char: ch.id, item: item.id, template: item.template, to: 'inventory' });
}

export function budgetRemaining(ctx: Ctx): number {
    return ctx.scene.level.budgetReserved - ctx.scene.level.budgetPaid;
}

/** Pay budgeted gold (or escrow) out of the level's season budget; never more than remains. */
export function drawBudget(ctx: Ctx, amount: number): number {
    const pay = Math.max(0, Math.min(amount, budgetRemaining(ctx)));
    ctx.scene.level.budgetPaid += pay;
    return pay;
}
