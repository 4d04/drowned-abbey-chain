/* Test helpers: build characters and scenes on level 1 without going through dice. */

import { assignStats, enterDungeon, newCharacter } from '../src/camp.ts';
import { loadContent } from '../src/content.ts';
import { initialRoom, newSeason } from '../src/season.ts';
import type { Character, Item, Scene } from '../src/types.ts';

export const content = loadContent();

let ids = 0;
export const newId = (): string => `t${ids++}`;

/** A level-1 character standing in `room`. Default stats: every ability 14 (+2). */
export function char(id: string, classId: string, room: number, stats = [14, 14, 14, 14, 14, 14]): Character {
    const ch = newCharacter(content, id, `owner-${id}`, id, classId);
    assignStats(content, ch, stats, [0, 1, 2, 3, 4, 5]);
    enterDungeon(content, ch);
    ch.room = room;
    ch.prevRoom = room === 1 ? 0 : 1;
    ch.lastActionHeight = 100; // the scene helper's height: everyone starts in the fight
    return ch;
}

export function item(template: string, escrow = 0): Item {
    return { id: newId(), template, sourceLevel: 1, escrow };
}

export function scene(...chars: Character[]): Scene {
    const rooms: Scene['rooms'] = {};
    for (const r of content.levels.get(1)!.def.rooms) rooms[r.id] = initialRoom(content, 1, r.id);
    return {
        height: 100,
        level: newSeason(content, 1, 1, 0, 1_000_000),
        rooms,
        chars: Object.fromEntries(chars.map((c) => [c.id, c])),
        activeLevels: [1]
    };
}

export function events<T extends { t: string }>(evs: T[], t: string): T[] {
    return evs.filter((e) => e.t === t);
}
