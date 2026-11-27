/* Combat exchange (SPEC §3.3): character attacks, the single counterattack, monster traits, downing. */

import { rollExpr } from '../dice.ts';
import type { Character, MonsterState, RoomState } from '../types.ts';
import { blocksFor } from '../timing.ts';
import { rollCharAttack, rollD20, resolveSave } from './checks.ts';
import { type Ctx, charMod, charAC, charsInRoom, hostiles, isPresent, roomOf, roomTargets } from './context.ts';
import { runEffects } from './effects.ts';

export function damageChar(ctx: Ctx, ch: Character, amount: number): void {
    if (ch.status !== 'delving' || amount <= 0) return;
    ch.hp = Math.max(0, ch.hp - amount);
    ctx.events.push({ t: 'damage', target: ch.id, amount, hp: ch.hp });
    if (ch.hp === 0) {
        ch.status = 'downed';
        ch.downedAt = ctx.scene.height;
        ctx.events.push({ t: 'downed', char: ch.id });
    }
}

/** Heals a living character; healing a downed character brings them back up. */
export function healChar(ctx: Ctx, ch: Character, amount: number): void {
    if (ch.status !== 'delving' && ch.status !== 'downed') return;
    if (ch.status === 'downed') {
        ch.status = 'delving';
        ch.downedAt = 0;
        ctx.events.push({ t: 'stabilized', char: ch.id, by: ctx.actor.id });
    }
    ch.hp = Math.min(ch.maxHp, ch.hp + Math.max(0, amount));
    ctx.events.push({ t: 'heal', target: ch.id, amount, hp: ch.hp });
}

/** Wary or friendly monsters turn hostile, as a group, when one of them is attacked. */
export function provokeGroup(ctx: Ctx, room: RoomState, m: MonsterState): void {
    if (m.status === 'hostile') return;
    const from = m.status;
    room.monsters.forEach((x, i) => {
        if (x.template === m.template && x.status === from) {
            x.status = 'hostile';
            ctx.events.push({ t: 'monster', room: room.roomId, index: i, status: 'hostile' });
        }
    });
}

/** Fires the room's onCleared effects once, when nothing remains but the dead and the fled. */
export function checkCleared(ctx: Ctx, room: RoomState): void {
    if (room.flags.cleared || room.monsters.length === 0 || room.monsters.some(isPresent)) return;
    room.flags.cleared = true;
    ctx.events.push({ t: 'flag', room: room.roomId, flag: 'cleared', value: true });
    const def = ctx.lvl.rooms.get(room.roomId);
    if (def?.onCleared && room.roomId === ctx.actor.room) runEffects(ctx, def.onCleared);
}

export function damageMonster(ctx: Ctx, room: RoomState, index: number, amount: number): void {
    const m = room.monsters[index];
    m.engaged = true;
    m.lastEngagedAt = ctx.scene.height;
    m.hp = Math.max(0, m.hp - amount);
    ctx.events.push({ t: 'damage', target: `m${index}`, amount, hp: m.hp });
    if (m.hp === 0) {
        m.status = 'dead';
        ctx.events.push({ t: 'monster', room: room.roomId, index, status: 'dead' });
        if (ctx.content.registry.monsters[m.template].tags.includes('boss') && room.roomId === ctx.lvl.def.bossRoom) {
            ctx.scene.level.bossKilledAt = ctx.scene.height;
            ctx.events.push({ t: 'bossDefeated', level: ctx.scene.level.id, by: ctx.actor.id });
        }
        checkCleared(ctx, room);
    }
}

export interface WeaponProfile {
    bonus: number;
    damage: string;
    bonusDamageVs?: Record<string, string>;
}

export function weaponFor(ctx: Ctx, ch: Character, itemId?: string): WeaponProfile {
    if (itemId) {
        const it = ch.inventory.find((i) => i.id === itemId);
        const w = it && ctx.content.registry.items[it.template].weapon;
        if (w) return w;
    }
    return ctx.content.registry.classes[ch.classId].attack;
}

/** A character attacks monster `index` in their room. */
export function charAttack(ctx: Ctx, index: number, weapon: WeaponProfile, extraAdv = false): void {
    const room = roomOf(ctx);
    const m = room.monsters[index];
    const def = ctx.content.registry.monsters[m.template];
    provokeGroup(ctx, room, m);
    ctx.lastAttacked = index;
    const unaware = !m.engaged;
    const r = rollCharAttack(ctx, ctx.actor, weapon.bonus, def.ac, extraAdv);
    ctx.events.push({ t: 'attack', attacker: ctx.actor.id, target: `m${index}`, d20: r.d20, kept: r.kept, total: r.total, ac: def.ac, hit: r.hit });
    m.engaged = true;
    m.lastEngagedAt = ctx.scene.height;
    if (!r.hit) return;
    let dmg = rollExpr(ctx.dice, weapon.damage, 'pc');
    for (const tag of Object.keys(weapon.bonusDamageVs ?? {}).sort()) {
        if (def.tags.includes(tag)) dmg += rollExpr(ctx.dice, weapon.bonusDamageVs![tag], 'pc');
    }
    if (ctx.actor.classId === 'rogue') {
        const ally = (ctx.scene.othersStanding ?? 0) > 0 || charsInRoom(ctx.scene, ctx.actor.levelId, ctx.actor.room).some((c) => c.id !== ctx.actor.id);
        if (ally || unaware) dmg += rollExpr(ctx.dice, '2d6', 'pc');
    }
    damageMonster(ctx, room, index, dmg);
}

function packBonus(room: RoomState, index: number, perAlly: number): number {
    const m = room.monsters[index];
    return perAlly * room.monsters.filter((x, i) => i !== index && x.template === m.template && x.status === 'hostile').length;
}

/** Monster `index` attacks character `ch`. */
export function monsterAttack(ctx: Ctx, room: RoomState, index: number, ch: Character, advantage = false): void {
    const m = room.monsters[index];
    const def = ctx.content.registry.monsters[m.template];
    let bonus = def.attack.bonus;
    for (const tr of def.traits) if (tr.kind === 'pack') bonus += packBonus(room, index, tr.bonusPerAlly);
    const adv = advantage || m.alert;
    m.alert = false;
    m.engaged = true;
    m.lastEngagedAt = ctx.scene.height;
    const r = rollD20(ctx, adv, false, 'npc');
    const ac = charAC(ctx.content, ch);
    const total = r.kept + bonus;
    const hit = r.kept === 20 || (r.kept !== 1 && total >= ac);
    ctx.events.push({ t: 'attack', attacker: `m${index}`, target: ch.id, d20: r.d20, kept: r.kept, total, ac, hit });
    if (!hit) return;
    damageChar(ctx, ch, rollExpr(ctx.dice, def.attack.damage, 'npc'));
    for (const tr of def.traits) {
        if (tr.kind === 'onHitSave' && ch.status === 'delving' && !resolveSave(ctx, ch, tr.ability, tr.dc)) {
            const charges = ctx.content.registry.statuses[tr.status].charges;
            ch.statuses = ch.statuses.filter((s) => s.id !== tr.status).concat({ id: tr.status, charges });
            ctx.events.push({ t: 'status', char: ch.id, status: tr.status, charges });
        }
    }
}

/** The one counterattack per exchange: the monster just attacked, else the lowest-index hostile. */
/** The monster that answers this exchange: the one just attacked if it's still hostile, else the lowest-index hostile. */
export function answerer(ctx: Ctx, preferred: number): number {
    const hs = hostiles(roomOf(ctx));
    if (hs.length === 0) return -1;
    return hs.includes(preferred) ? preferred : hs[0];
}

/**
 * Who strikes first between the actor and a monster (prototype variants): a quick monster always does; otherwise each
 * rolls d20 (the actor + DEX, the monster + its initiative) and the monster goes first only on a strictly higher total.
 */
export function strikesFirst(ctx: Ctx, index: number, reason: 'ambush' | 'quick' | 'round'): boolean {
    const room = roomOf(ctx);
    const m = room.monsters[index];
    const def = ctx.content.registry.monsters[m.template];
    if (reason === 'quick') {
        ctx.events.push({ t: 'initiative', char: ctx.actor.id, monster: `m${index}`, reason, first: 'them' });
        return true;
    }
    const you = ctx.dice.roll(20, 'pc');
    const them = ctx.dice.roll(20, 'npc');
    const yourTotal = you + charMod(ctx.actor, 'DEX');
    const theirTotal = them + (def.initiative ?? 0);
    const first = theirTotal > yourTotal ? 'them' : 'you';
    ctx.events.push({ t: 'initiative', char: ctx.actor.id, monster: `m${index}`, reason, first, you: { d20: you, total: yourTotal }, them: { d20: them, total: theirTotal } });
    return first === 'them';
}

export function counterattack(ctx: Ctx): void {
    const ch = ctx.actor;
    if (ch.status !== 'delving') return;
    const room = roomOf(ctx);
    const hs = hostiles(room);
    if (hs.length === 0) return;
    const idx = hs.includes(ctx.lastAttacked) ? ctx.lastAttacked : hs[0];
    monsterAttack(ctx, room, idx, ch);
}

/** Monsters that recover when left alone (the Abbot): a party that retreats to camp faces him at full HP again. */
export function recoverIdle(ctx: Ctx): void {
    const room = roomOf(ctx);
    room.monsters.forEach((m, i) => {
        if (m.status !== 'hostile' || m.lastEngagedAt === 0) return;
        const def = ctx.content.registry.monsters[m.template];
        for (const tr of def.traits) {
            if (tr.kind !== 'recovers' || m.hp >= def.hp || ctx.scene.height - m.lastEngagedAt <= blocksFor(tr.afterSeconds)) continue;
            m.hp = def.hp;
            m.engaged = false;
            ctx.events.push({ t: 'recovered', room: room.roomId, index: i, hp: m.hp });
        }
    });
}

/** Room-wide traits that tick once per exchange (the Abbot's Tide Wail). */
export function tickRoomTraits(ctx: Ctx): void {
    const room = roomOf(ctx);
    room.monsters.forEach((m, i) => {
        if (m.status !== 'hostile') return;
        for (const tr of ctx.content.registry.monsters[m.template].traits) {
            if (tr.kind !== 'aoeEvery') continue;
            const key = `aoe:${i}`;
            room.counters[key] = (room.counters[key] ?? 0) + 1;
            ctx.events.push({ t: 'counter', room: room.roomId, counter: key, value: room.counters[key] });
            if (room.counters[key] % tr.every !== 0) continue;
            ctx.events.push({ t: 'tideWail', room: room.roomId });
            for (const c of roomTargets(ctx.scene, ctx.actor, room.roomId)) {
                const dmg = rollExpr(ctx.dice, tr.damage, 'npc');
                const saved = resolveSave(ctx, c, tr.save.ability, tr.save.dc);
                damageChar(ctx, c, saved ? (tr.save.half ? Math.floor(dmg / 2) : 0) : dmg);
            }
        }
    });
}
