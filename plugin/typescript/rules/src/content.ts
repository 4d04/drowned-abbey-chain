/* Content loading and indexing. The pack is bundled with the code; nothing is read from disk or network at runtime. */

import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import classes from '../registry/classes.json' with { type: 'json' };
import monsters from '../registry/monsters.json' with { type: 'json' };
import items from '../registry/items.json' with { type: 'json' };
import statuses from '../registry/statuses.json' with { type: 'json' };
import level1 from '../levels/01-drowned-abbey/level.json' with { type: 'json' };
import type { ActionDef, Effect, LevelDef, Registry, RoomDef } from './types.ts';

export interface LevelIndex {
    def: LevelDef;
    rooms: Map<number, RoomDef>;
    actionsByRoom: Map<number, ActionDef[]>;
    actions: Map<string, ActionDef>;
    /** rooms other than its own that an action's effects read or write (the plugin preloads these) */
    touches: Map<string, number[]>;
    /** actions with an effect that targets every character in the room (they need all room-mates loaded) */
    roomWide: Set<string>;
    contentHash: string;
}

/**
 * Rule variants being prototyped (all off in the live game): who strikes first in a fight.
 * - ambush: entering a room with hostiles rolls initiative; if they win, the first hostile strikes as you arrive.
 * - quick: monsters with the `quick` trait answer before your action instead of after it.
 * - initiative: every exchange in a fight rolls initiative; if the answering monster wins, it strikes first.
 * A monster that strikes first doesn't strike again that exchange, and if it downs you, your action is lost.
 */
export interface Variants {
    ambush: boolean;
    quick: boolean;
    initiative: boolean;
}

export const NO_VARIANTS: Readonly<Variants> = Object.freeze({ ambush: false, quick: false, initiative: false });

/** The variants the live game plays with (INITIATIVE-PROTOTYPE.md): ambush on arrival and quick monsters. */
export const LIVE_VARIANTS: Readonly<Variants> = Object.freeze({ ambush: true, quick: true, initiative: false });

export interface Content {
    registry: Registry;
    levels: Map<number, LevelIndex>;
    variants: Readonly<Variants>;
}

export const REGISTRY: Registry = { classes, monsters, items, statuses } as unknown as Registry;
export const LEVELS: LevelDef[] = [level1 as unknown as LevelDef];

/**
 * Deterministic JSON: object keys sorted lexicographically (UTF-16 code units, as Array.prototype.sort), no whitespace,
 * undefined object values dropped. Hand-written rather than native stringify + sorted copies: JS objects enumerate
 * integer-like keys ("2", "10") in numeric order, which would silently break lexicographic order.
 */
export function canonicalJSON(v: unknown): string {
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) {
        let out = '[';
        for (let i = 0; i < v.length; i++) out += (i ? ',' : '') + canonicalJSON(v[i]);
        return out + ']';
    }
    const o = v as Record<string, unknown>;
    const keys = Object.keys(o).sort();
    let out = '{';
    let first = true;
    for (const k of keys) {
        const x = o[k];
        if (x === undefined) continue;
        out += (first ? '' : ',') + JSON.stringify(k) + ':' + canonicalJSON(x);
        first = false;
    }
    return out + '}';
}

export function hashJSON(v: unknown): string {
    return bytesToHex(sha256(utf8ToBytes(canonicalJSON(v))));
}

function effectRooms(effects: Effect[] | undefined, own: number, out: Set<number>): void {
    for (const e of effects ?? []) {
        if ('room' in e && typeof e.room === 'number' && e.room !== own && e.op !== 'moveTo') out.add(e.room);
    }
}

export function indexLevel(def: LevelDef, registry: Registry): LevelIndex {
    const rooms = new Map(def.rooms.map((r) => [r.id, r]));
    const actionsByRoom = new Map<number, ActionDef[]>();
    const actions = new Map<string, ActionDef>();
    const touches = new Map<string, number[]>();
    const roomWide = new Set<string>();
    for (const a of def.actions) {
        if (actions.has(a.id)) throw new Error(`duplicate action id ${a.id}`);
        actions.set(a.id, a);
        if (!actionsByRoom.has(a.room)) actionsByRoom.set(a.room, []);
        actionsByRoom.get(a.room)!.push(a);
        const t = new Set<number>();
        effectRooms(a.effects, a.room, t);
        effectRooms(a.onSuccess, a.room, t);
        effectRooms(a.onFailure, a.room, t);
        touches.set(a.id, [...t].sort((x, y) => x - y));
        if ([...(a.effects ?? []), ...(a.onSuccess ?? []), ...(a.onFailure ?? [])].some((e) => 'target' in e && e.target === 'room')) roomWide.add(a.id);
    }
    // the hash covers the level and the registry it was authored against
    return { def, rooms, actionsByRoom, actions, touches, roomWide, contentHash: hashJSON({ level: def, registry }) };
}

export function loadContent(levels: LevelDef[] = LEVELS, registry: Registry = REGISTRY, variants: Readonly<Variants> = NO_VARIANTS): Content {
    return { registry, levels: new Map(levels.map((l) => [l.id, indexLevel(l, registry)])), variants };
}
