/* @abbey/rules: the pure, deterministic rules package shared byte-for-byte by the plugin and the client. */

export * from './types.ts';
export * from './dice.ts';
export * from './content.ts';
export * from './camp.ts';
export * from './season.ts';
export * from './timing.ts';
export { type Ctx, type GameEvent, DOWNED_BLOCKS, INVENTORY_SLOTS, LIE_LOW_BLOCKS, ROOM_WIDE_MAX, STASH_SLOTS, MAX_LIVING_CHARACTERS, abilityMod, charAC } from './engine/context.ts';
export { type Intent, type Resolution, type Exit, ABILITY_KEYS, PARTY_MAX, exits, legal, needsRoll, options, partyOf, resolve } from './engine/resolve.ts';
export { type Odds, d20Bp, oddsFor } from './engine/odds.ts';
