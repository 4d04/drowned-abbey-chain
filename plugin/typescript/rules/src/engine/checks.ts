/* Character d20 rolls: checks, saves and attack rolls, with statuses and advantage (SPEC §3.1). */

import type { Ability, CheckDef, Character } from '../types.ts';
import { type Ctx, PROFICIENCY, charMod } from './context.ts';
import { anyHolds } from './conditions.ts';

export type RollKind = 'check' | 'save' | 'attack';

export interface RollMods {
    ability: Ability;
    mod: number; // ability modifier + proficiency (+ attack bonus for attacks)
    statusBonus: number;
    advantage: boolean;
    disadvantage: boolean;
}

/** Status effects on the next d20 a character rolls; pure (does not consume charges). */
function statusMods(ctx: Ctx, ch: Character, kind: RollKind): { bonus: number; adv: boolean; dis: boolean } {
    let bonus = 0;
    let adv = false;
    let dis = false;
    for (const s of ch.statuses) {
        const def = ctx.content.registry.statuses[s.id];
        bonus += def.rollBonus ?? 0;
        if (def.disadvantage) dis = true;
        if (def.attackAdvantage && kind === 'attack') adv = true;
    }
    return { bonus, adv, dis };
}

/** Use up one charge of every status that applied to this roll. */
function consumeStatuses(ctx: Ctx, ch: Character, kind: RollKind): void {
    for (const s of ch.statuses) {
        const def = ctx.content.registry.statuses[s.id];
        const applied = def.rollBonus !== undefined || def.disadvantage || (def.attackAdvantage && kind === 'attack');
        if (applied) {
            s.charges -= 1;
            ctx.events.push({ t: 'status', char: ch.id, status: s.id, charges: s.charges });
        }
    }
    ch.statuses = ch.statuses.filter((s) => s.charges > 0);
}

function bestAbility(ch: Character, a: Ability | Ability[]): Ability {
    const list = Array.isArray(a) ? a : [a];
    let best = list[0];
    for (const x of list) if (charMod(ch, x) > charMod(ch, best)) best = x;
    return best;
}

export function checkMods(ctx: Ctx, ch: Character, def: CheckDef): RollMods {
    const ability = bestAbility(ch, def.ability);
    const cls = ctx.content.registry.classes[ch.classId];
    const prof = cls.proficient.includes(ability) ? PROFICIENCY : 0;
    const st = statusMods(ctx, ch, def.save ? 'save' : 'check');
    const itemAdv = ch.inventory.some((i) => (ctx.content.registry.items[i.template].advantageOn ?? []).includes(ability));
    return {
        ability,
        mod: charMod(ch, ability) + prof,
        statusBonus: st.bonus,
        advantage: st.adv || itemAdv || anyHolds({ ...ctx, actor: ch }, def.advantageIf),
        disadvantage: st.dis || (def.disadvantage ?? false)
    };
}

/** Roll 1 or 2 d20 for a character; advantage and disadvantage cancel out. */
export function rollD20(ctx: Ctx, adv: boolean, dis: boolean, owner: 'pc' | 'npc'): { d20: number[]; kept: number } {
    if (adv === dis) {
        const v = ctx.dice.roll(20, owner);
        return { d20: [v], kept: v };
    }
    const a = ctx.dice.roll(20, owner);
    const b = ctx.dice.roll(20, owner);
    return { d20: [a, b], kept: adv ? Math.max(a, b) : Math.min(a, b) };
}

/** Ability check or save against a DC. Natural 20/1 are flavor only on checks. */
export function resolveCheck(ctx: Ctx, ch: Character, def: CheckDef): boolean {
    if (anyHolds({ ...ctx, actor: ch }, def.autoSuccessIf)) {
        const ability = bestAbility(ch, def.ability);
        ctx.events.push({ t: 'check', char: ch.id, ability, d20: [], kept: 0, mod: 0, total: 0, dc: def.dc, success: true, auto: true });
        return true;
    }
    const m = checkMods(ctx, ch, def);
    const r = rollD20(ctx, m.advantage, m.disadvantage, 'pc');
    consumeStatuses(ctx, ch, def.save ? 'save' : 'check');
    const total = r.kept + m.mod + m.statusBonus;
    const success = total >= def.dc;
    ctx.events.push({ t: 'check', char: ch.id, ability: m.ability, d20: r.d20, kept: r.kept, mod: m.mod + m.statusBonus, total, dc: def.dc, success });
    return success;
}

export function resolveSave(ctx: Ctx, ch: Character, ability: Ability, dc: number): boolean {
    return resolveCheck(ctx, ch, { ability, dc, save: true });
}

export function attackMods(ctx: Ctx, ch: Character, bonus: number): { mod: number; adv: boolean; dis: boolean } {
    const st = statusMods(ctx, ch, 'attack');
    return { mod: bonus + st.bonus, adv: st.adv, dis: st.dis };
}

/** Character attack roll: natural 20 always hits, natural 1 always misses. */
export function rollCharAttack(ctx: Ctx, ch: Character, bonus: number, ac: number, extraAdv: boolean): { d20: number[]; kept: number; total: number; hit: boolean } {
    const m = attackMods(ctx, ch, bonus);
    const r = rollD20(ctx, m.adv || extraAdv, m.dis, 'pc');
    consumeStatuses(ctx, ch, 'attack');
    const total = r.kept + m.mod;
    const hit = r.kept === 20 || (r.kept !== 1 && total >= ac);
    return { ...r, total, hit };
}
