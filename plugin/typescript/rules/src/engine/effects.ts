/* Effect interpreter (SPEC §5.2). Opcodes are append-only: an existing op never changes meaning. */

import { rollExpr } from '../dice.ts';
import type { Character, Effect, Target } from '../types.ts';
import { resolveSave } from './checks.ts';
import { checkCleared, damageChar, healChar, monsterAttack } from './combat.ts';
import { type Ctx, addItem, drawBudget, hostiles, isPresent, roomOf, roomTargets } from './context.ts';

function targets(ctx: Ctx, t: Target | undefined): Character[] {
    if (t === 'room') return roomTargets(ctx.scene, ctx.actor, ctx.actor.room);
    return [ctx.actor];
}

/** Apply the level's loot scaling (treasury running low) to a budgeted amount. */
function scaled(ctx: Ctx, amount: number): number {
    return Math.floor((amount * ctx.scene.level.scaleBp) / 10_000);
}

export function grantLoot(ctx: Ctx, tableId: string, to: 'actor' | 'pile' = 'actor'): void {
    const table = ctx.lvl.def.lootTables[tableId];
    const level = ctx.scene.level;
    if (table.once && level.lootTaken.includes(tableId)) {
        ctx.events.push({ t: 'loot', table: tableId, gold: 0, items: [], already: true });
        return;
    }
    if (table.once) level.lootTaken.push(tableId);
    const room = roomOf(ctx);
    const gold = table.gold ? drawBudget(ctx, scaled(ctx, rollExpr(ctx.dice, table.gold, 'pc'))) : 0;
    const itemIds: string[] = [];
    if (to === 'pile') room.pileGold += gold;
    else if (gold > 0) {
        ctx.actor.carriedGold += gold;
        ctx.events.push({ t: 'gold', char: ctx.actor.id, delta: gold, source: `loot:${tableId}` });
    }
    for (const template of table.items ?? []) {
        const sale = ctx.content.registry.items[template].sellPrice ?? 0;
        const item = { id: ctx.newId(), template, sourceLevel: level.id, escrow: drawBudget(ctx, scaled(ctx, sale)) };
        itemIds.push(item.id);
        if (to === 'pile') room.pile.push(item);
        else addItem(ctx, ctx.actor, item, room);
    }
    ctx.events.push({ t: 'loot', table: tableId, gold, items: itemIds });
}

export function runEffect(ctx: Ctx, e: Effect): void {
    const actor = ctx.actor;
    switch (e.op) {
        case 'damage':
            for (const c of targets(ctx, e.target)) {
                const dmg = rollExpr(ctx.dice, e.dice, 'npc');
                const saved = e.save ? resolveSave(ctx, c, e.save.ability, e.save.dc) : false;
                damageChar(ctx, c, saved ? (e.save!.half ? Math.floor(dmg / 2) : 0) : dmg);
            }
            return;
        case 'heal':
            for (const c of targets(ctx, e.target)) healChar(ctx, c, rollExpr(ctx.dice, e.dice, 'pc'));
            return;
        case 'grantGold': {
            const gold = drawBudget(ctx, scaled(ctx, rollExpr(ctx.dice, e.dice, 'pc')));
            actor.carriedGold += gold;
            ctx.events.push({ t: 'gold', char: actor.id, delta: gold, source: 'grant' });
            return;
        }
        case 'grantLoot':
            grantLoot(ctx, e.table, e.to);
            return;
        case 'grantItem':
            addItem(ctx, actor, { id: ctx.newId(), template: e.item, sourceLevel: ctx.scene.level.id, escrow: 0 }, roomOf(ctx));
            return;
        case 'setRoomFlag': {
            const room = roomOf(ctx, e.room);
            room.flags[e.flag] = e.value ?? true;
            ctx.events.push({ t: 'flag', room: room.roomId, flag: e.flag, value: e.value ?? true });
            return;
        }
        case 'incRoomCounter': {
            const room = roomOf(ctx, e.room);
            room.counters[e.counter] = (room.counters[e.counter] ?? 0) + (e.by ?? 1);
            ctx.events.push({ t: 'counter', room: room.roomId, counter: e.counter, value: room.counters[e.counter] });
            return;
        }
        case 'setCharFlag':
            if (!actor.flags.includes(e.flag)) {
                actor.flags.push(e.flag);
                actor.flags.sort();
                ctx.events.push({ t: 'charFlag', char: actor.id, flag: e.flag });
            }
            return;
        case 'applyStatus': {
            const charges = e.charges ?? ctx.content.registry.statuses[e.status].charges;
            for (const c of targets(ctx, e.target)) {
                c.statuses = c.statuses.filter((s) => s.id !== e.status).concat({ id: e.status, charges });
                ctx.events.push({ t: 'status', char: c.id, status: e.status, charges });
            }
            return;
        }
        case 'spawnMonster': {
            const room = roomOf(ctx, e.room);
            const def = ctx.content.registry.monsters[e.template];
            room.monsters.push({ template: e.template, hp: def.hp, status: 'hostile', alert: e.alert ?? false, engaged: false, lastEngagedAt: 0 });
            room.flags.cleared = false;
            ctx.events.push({ t: 'spawn', room: room.roomId, template: e.template, index: room.monsters.length - 1 });
            return;
        }
        case 'moveTo':
            actor.prevRoom = actor.room;
            actor.room = e.room;
            ctx.events.push({ t: 'move', char: actor.id, level: actor.levelId, room: e.room });
            return;
        case 'revealEdge': {
            const room = roomOf(ctx);
            room.flags[`revealed:${e.to}`] = true;
            ctx.events.push({ t: 'flag', room: room.roomId, flag: `revealed:${e.to}`, value: true });
            return;
        }
        case 'narrate':
            ctx.events.push({ t: 'narrate', outcome: e.outcome });
            return;
        case 'dropGold': {
            const room = roomOf(ctx);
            const lost = Math.min(actor.carriedGold, rollExpr(ctx.dice, e.dice, 'npc'));
            actor.carriedGold -= lost;
            room.pools[e.pool] = (room.pools[e.pool] ?? 0) + lost;
            ctx.events.push({ t: 'gold', char: actor.id, delta: -lost, source: `pool:${e.pool}` });
            ctx.events.push({ t: 'pool', room: room.roomId, pool: e.pool, value: room.pools[e.pool] });
            return;
        }
        case 'payGold': {
            const paid = Math.min(actor.carriedGold, e.amount);
            actor.carriedGold -= paid;
            ctx.events.push({ t: 'gold', char: actor.id, delta: -paid, source: e.pool ? `pool:${e.pool}` : 'treasury' });
            if (e.pool) {
                const room = roomOf(ctx);
                room.pools[e.pool] = (room.pools[e.pool] ?? 0) + paid;
                ctx.events.push({ t: 'pool', room: room.roomId, pool: e.pool, value: room.pools[e.pool] });
            }
            return;
        }
        case 'claimPool': {
            const room = roomOf(ctx);
            const v = room.pools[e.pool] ?? 0;
            room.pools[e.pool] = 0;
            actor.carriedGold += v;
            ctx.events.push({ t: 'gold', char: actor.id, delta: v, source: `pool:${e.pool}` });
            ctx.events.push({ t: 'pool', room: room.roomId, pool: e.pool, value: 0 });
            return;
        }
        case 'setMonsters': {
            const room = roomOf(ctx);
            room.monsters.forEach((m, i) => {
                if (isPresent(m) && (e.template === undefined || m.template === e.template) && m.status !== e.status) {
                    m.status = e.status;
                    ctx.events.push({ t: 'monster', room: room.roomId, index: i, status: e.status });
                }
            });
            checkCleared(ctx, room);
            return;
        }
        case 'monsterAttack': {
            const room = roomOf(ctx);
            const hs = hostiles(room);
            if (hs.length > 0) {
                monsterAttack(ctx, room, hs[0], actor, e.advantage ?? false);
                ctx.lastAttacked = hs[0];
            }
            return;
        }
        case 'alertMonsters': {
            const room = roomOf(ctx, e.room);
            for (const m of room.monsters) if (isPresent(m)) m.alert = true;
            return;
        }
        case 'consumeItem': {
            const i = actor.inventory.findIndex((x) => x.template === e.item);
            if (i >= 0) {
                const [it] = actor.inventory.splice(i, 1);
                ctx.events.push({ t: 'item', char: actor.id, item: it.id, template: it.template, to: 'consumed' });
            }
            return;
        }
    }
}

export function runEffects(ctx: Ctx, effects: Effect[] | undefined): void {
    for (const e of effects ?? []) {
        // a character downed mid-sequence stops acting; later effects (e.g. a moveTo) do not apply
        if (ctx.actor.status !== 'delving') return;
        runEffect(ctx, e);
    }
}
