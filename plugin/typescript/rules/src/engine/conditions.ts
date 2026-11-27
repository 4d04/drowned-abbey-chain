/* Condition evaluator (SPEC §5.2). New condition kinds are appended; existing ones never change meaning. */

import type { Condition } from '../types.ts';
import { type Ctx, abilityIndex, hasItem, isHostile, roomOf } from './context.ts';

export function evalCondition(ctx: Ctx, c: Condition): boolean {
    if ('roomFlag' in c) return (roomOf(ctx, c.room).flags[c.roomFlag] ?? false) === (c.is ?? true);
    if ('roomCounter' in c) {
        const v = roomOf(ctx, c.room).counters[c.roomCounter] ?? 0;
        return (c.atLeast === undefined || v >= c.atLeast) && (c.below === undefined || v < c.below);
    }
    if ('charFlag' in c) return ctx.actor.flags.includes(c.charFlag) === (c.is ?? true);
    if ('hasItem' in c) return hasItem(ctx.actor, c.hasItem);
    if ('class' in c) return ctx.actor.classId === c.class;
    if ('abilityAtLeast' in c) return ctx.actor.stats[abilityIndex(c.abilityAtLeast.ability)] >= c.abilityAtLeast.score;
    if ('monstersAlive' in c) return roomOf(ctx).monsters.some(isHostile) === c.monstersAlive;
    if ('monsterStatus' in c) {
        const { template, status } = c.monsterStatus;
        return roomOf(ctx).monsters.some((m) => m.status === status && (template === undefined || m.template === template));
    }
    if ('levelBossDefeated' in c) return ctx.scene.level.id === c.levelBossDefeated && ctx.scene.level.bossKilledAt > 0;
    if ('goldAtLeast' in c) return ctx.actor.carriedGold >= c.goldAtLeast;
    if ('lootAvailable' in c) return !ctx.scene.level.lootTaken.includes(c.lootAvailable);
    if ('not' in c) return !evalCondition(ctx, c.not);
    if ('any' in c) return c.any.some((x) => evalCondition(ctx, x));
    throw new Error(`unknown condition ${JSON.stringify(c)}`);
}

export function allHold(ctx: Ctx, cs: Condition[] | undefined): boolean {
    return (cs ?? []).every((c) => evalCondition(ctx, c));
}

export function anyHolds(ctx: Ctx, cs: Condition[] | undefined): boolean {
    return (cs ?? []).some((c) => evalCondition(ctx, c));
}
