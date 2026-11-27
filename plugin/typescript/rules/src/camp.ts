/* Out-of-dungeon rules: character creation, entering, extraction and the Lychgate shop. No dice except stat rolls. */

import type { Content } from './content.ts';
import { MAX_LIVING_CHARACTERS, STASH_SLOTS, abilityMod } from './engine/context.ts';
import type { Character, Item } from './types.ts';

export const NAME_MAX = 24;

export function validateName(name: string): string | null {
    if (name.length < 1 || name.length > NAME_MAX) return `name must be 1-${NAME_MAX} characters`;
    if (!/^[\x20-\x7e]+$/.test(name)) return 'name must be printable ascii';
    return null;
}

export function canCreate(living: number): string | null {
    return living >= MAX_LIVING_CHARACTERS ? `at most ${MAX_LIVING_CHARACTERS} living characters per account` : null;
}

/** New character in `rolling` state; stats arrive with assignStats once the stat roll is revealed. */
export function newCharacter(content: Content, id: string, owner: string, name: string, classId: string): Character {
    if (!content.registry.classes[classId]) throw new Error(`unknown class ${classId}`);
    const nameErr = validateName(name);
    if (nameErr) throw new Error(nameErr);
    return {
        id, owner, name, classId,
        stats: [], hp: 0, maxHp: 0, levelId: 1, room: 0, prevRoom: 0, carriedGold: 0,
        inventory: [], statuses: [], abilityUses: {}, hitDice: 0, rested: false, flags: [],
        status: 'rolling', downedAt: 0, lastActionHeight: 0, xp: 0, charLevel: 1, features: []
    };
}

/** Full heal and refreshed abilities: what leaving through the Lychgate does. */
export function refresh(content: Content, ch: Character): void {
    const cls = content.registry.classes[ch.classId];
    ch.maxHp = cls.hpBase + abilityMod(ch.stats[2]);
    ch.hp = ch.maxHp;
    ch.abilityUses = { ...cls.abilities };
    for (const it of ch.inventory) {
        const g = content.registry.items[it.template].grantsAbility ?? {};
        for (const k of Object.keys(g).sort()) ch.abilityUses[k] = (ch.abilityUses[k] ?? 0) + g[k];
    }
    ch.hitDice = cls.hitDice;
    ch.rested = false;
    ch.statuses = [];
}

/** Assign the six rolled scores (fixed before assignment) to STR..CHA. permutation[i] = index into rolled for ability i. */
export function assignStats(content: Content, ch: Character, rolled: number[], permutation: number[]): void {
    if (ch.status !== 'rolling') throw new Error('stats already assigned');
    if (rolled.length !== 6 || permutation.length !== 6 || [...permutation].sort().join() !== '0,1,2,3,4,5') throw new Error('permutation must be a reordering of 0..5');
    ch.stats = permutation.map((i) => rolled[i]);
    refresh(content, ch);
    ch.status = 'camp';
}

export function enterDungeon(content: Content, ch: Character): void {
    if (ch.status !== 'camp') throw new Error(`character is ${ch.status}`);
    const l1 = content.levels.get(1)!.def;
    ch.status = 'delving';
    ch.levelId = 1;
    ch.room = l1.entry;
    ch.prevRoom = l1.camp ?? 0;
}

export interface Extraction {
    gold: number; // treasury -> owner account
    toStash: Item[];
}

/** Extract at the Lychgate: carried gold becomes a real balance, items go to the stash, full heal. */
export function extract(content: Content, ch: Character, stashUsed: number): Extraction {
    const l1 = content.levels.get(1)!.def;
    if (ch.status !== 'delving' || ch.levelId !== 1 || ch.room !== l1.camp) throw new Error('must be at the Lychgate to extract');
    const free = STASH_SLOTS - stashUsed;
    const toStash = ch.inventory.slice(0, Math.max(0, free));
    ch.inventory = ch.inventory.slice(toStash.length); // overflow stays carried
    const gold = ch.carriedGold;
    ch.carriedGold = 0;
    ch.status = 'camp';
    ch.room = l1.camp!;
    ch.prevRoom = l1.camp!;
    refresh(content, ch);
    return { gold, toStash };
}

/** Shop purchase: owner account -> treasury. Returns the cost; the caller checks the balance and creates items. */
export function shopBuyCost(content: Content, template: string, qty: number): number {
    const price = content.registry.items[template]?.price;
    if (price === undefined) throw new Error(`${template} is not sold here`);
    if (!Number.isInteger(qty) || qty < 1 || qty > 8) throw new Error('qty must be 1-8');
    return price * qty;
}

/** Shop sale: pays the gold escrowed from the source level's budget when the item dropped. */
export function shopSellPayout(content: Content, item: Item): number {
    if (content.registry.items[item.template].sellPrice === undefined) throw new Error(`${item.template} cannot be sold`);
    return item.escrow;
}
