/* Exact success odds for the client's option list, in basis points, computed with the same modifiers resolution uses. */

import type { Content } from '../content.ts';
import type { CheckDef, Scene } from '../types.ts';
import { attackMods, checkMods } from './checks.ts';
import { weaponFor } from './combat.ts';
import { anyHolds } from './conditions.ts';
import { type Ctx, hostiles, roomOf } from './context.ts';
import type { Intent } from './resolve.ts';

/** P(d20 + mod >= target) in basis points. natRules: natural 20 always succeeds, natural 1 always fails (attacks). */
export function d20Bp(mod: number, target: number, adv: boolean, dis: boolean, natRules: boolean): number {
    let c = 0;
    for (let f = 1; f <= 20; f++) {
        const ok = natRules ? f === 20 || (f !== 1 && f + mod >= target) : f + mod >= target;
        if (ok) c++;
    }
    if (adv === dis) return Math.floor((c * 10_000) / 20);
    const n = adv ? 400 - (20 - c) * (20 - c) : c * c;
    return Math.floor((n * 10_000) / 400);
}

export interface Odds {
    kind: 'check' | 'attack';
    bp: number; // 0..10000
    mod: number;
    target: number; // DC or AC
    advantage: boolean;
    disadvantage: boolean;
}

function ctxFor(content: Content, scene: Scene, charId: string): Ctx {
    const actor = scene.chars[charId];
    return { content, lvl: content.levels.get(actor.levelId)!, scene, actor, dice: { roll: () => 0, log: [] }, events: [], newId: () => '', lastAttacked: -1 };
}

function checkOdds(ctx: Ctx, def: CheckDef): Odds {
    if (anyHolds(ctx, def.autoSuccessIf)) return { kind: 'check', bp: 10_000, mod: 0, target: def.dc, advantage: false, disadvantage: false };
    const m = checkMods(ctx, ctx.actor, def);
    const mod = m.mod + m.statusBonus;
    return { kind: 'check', bp: d20Bp(mod, def.dc, m.advantage, m.disadvantage, false), mod, target: def.dc, advantage: m.advantage, disadvantage: m.disadvantage };
}

/** Odds for an intent, or null when it involves no success roll. */
export function oddsFor(content: Content, scene: Scene, charId: string, intent: Intent): Odds | null {
    const ctx = ctxFor(content, scene, charId);
    switch (intent.kind) {
        case 'action': {
            const def = ctx.lvl.actions.get(intent.actionId);
            return def?.check ? checkOdds(ctx, def.check) : null;
        }
        case 'attack': {
            const m = roomOf(ctx).monsters[intent.target];
            const ac = content.registry.monsters[m.template].ac;
            const w = weaponFor(ctx, ctx.actor, intent.weapon);
            const am = attackMods(ctx, ctx.actor, w.bonus);
            return { kind: 'attack', bp: d20Bp(am.mod, ac, am.adv, am.dis, true), mod: am.mod, target: ac, advantage: am.adv, disadvantage: am.dis };
        }
        case 'move': {
            const n = hostiles(roomOf(ctx)).length;
            return n > 0 ? checkOdds(ctx, { ability: 'DEX', dc: 10 + 2 * n }) : null;
        }
        case 'stabilize':
            return checkOdds(ctx, { ability: 'WIS', dc: 10 });
        default:
            return null;
    }
}
