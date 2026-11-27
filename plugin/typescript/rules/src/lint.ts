/* Content linter (SPEC §5.4, §9.2): the CI gate every level pack must pass. */

import type { Content, LevelIndex } from './content.ts';
import { exprMax, parseDice } from './dice.ts';
import { ABILITIES, type Condition, type Effect, type LevelDef } from './types.ts';

export const DC_MIN = 10;
export const DC_MAX = 19;

export interface TextPack {
    rooms: Record<string, { title: string; prose: string }>;
    actions: Record<string, string>;
    outcomes: Record<string, string>;
    monsters: Record<string, string>;
    items: Record<string, string>;
}

export interface LintIssue {
    level: number;
    where: string;
    message: string;
}

const EFFECT_OPS = new Set([
    'damage', 'heal', 'grantGold', 'grantLoot', 'grantItem', 'setRoomFlag', 'incRoomCounter', 'setCharFlag', 'applyStatus',
    'spawnMonster', 'moveTo', 'revealEdge', 'narrate', 'dropGold', 'payGold', 'claimPool', 'setMonsters', 'monsterAttack',
    'alertMonsters', 'consumeItem'
]);
const CONDITION_KEYS = new Set([
    'roomFlag', 'roomCounter', 'charFlag', 'hasItem', 'class', 'abilityAtLeast', 'monstersAlive', 'monsterStatus',
    'levelBossDefeated', 'goldAtLeast', 'lootAvailable', 'not', 'any'
]);
// flags the engine itself sets
const ENGINE_FLAGS = new Set(['cleared']);

function allEffects(def: LevelDef): { where: string; room: number; e: Effect }[] {
    const out: { where: string; room: number; e: Effect }[] = [];
    for (const a of def.actions) {
        for (const k of ['effects', 'onSuccess', 'onFailure'] as const) for (const e of a[k] ?? []) out.push({ where: `action ${a.id}.${k}`, room: a.room, e });
    }
    for (const r of def.rooms) for (const e of r.onCleared ?? []) out.push({ where: `room ${r.id}.onCleared`, room: r.id, e });
    return out;
}

function allConditions(def: LevelDef): { where: string; room: number; c: Condition }[] {
    const out: { where: string; room: number; c: Condition }[] = [];
    const walk = (where: string, room: number, cs: Condition[] | undefined) => {
        for (const c of cs ?? []) {
            out.push({ where, room, c });
            if ('not' in c) walk(where, room, [c.not]);
            if ('any' in c) walk(where, room, c.any);
        }
    };
    for (const a of def.actions) {
        walk(`action ${a.id}.when`, a.room, a.when);
        walk(`action ${a.id}.check`, a.room, a.check?.advantageIf);
        walk(`action ${a.id}.check`, a.room, a.check?.autoSuccessIf);
    }
    for (const e of def.edges) walk(`edge ${e.from}->${JSON.stringify(e.to)}`, e.from, e.requires);
    return out;
}

function checkDice(issues: LintIssue[], lvl: number, where: string, expr: string): void {
    try {
        parseDice(expr);
    } catch {
        issues.push({ level: lvl, where, message: `bad dice expression "${expr}"` });
    }
}

/** Max budgeted payout of a level for one season: once-tables' gold and item escrow. */
export function maxSeasonPayout(content: Content, def: LevelDef): number {
    const max = (e: string) => {
        try {
            return exprMax(e);
        } catch {
            return 0; // reported separately as a bad dice expression
        }
    };
    let total = 0;
    for (const t of Object.values(def.lootTables)) {
        if (t.gold) total += max(t.gold);
        for (const it of t.items ?? []) total += content.registry.items[it]?.sellPrice ?? 0;
    }
    for (const { e } of allEffects(def)) if (e.op === 'grantGold') total += max(e.dice);
    return total;
}

export function lintLevel(content: Content, lvl: LevelIndex, text?: TextPack): LintIssue[] {
    const def = lvl.def;
    const reg = content.registry;
    const issues: LintIssue[] = [];
    const add = (where: string, message: string) => issues.push({ level: def.id, where, message });
    const roomIds = new Set(def.rooms.map((r) => r.id));

    // ---- ids and references
    if (new Set(def.rooms.map((r) => r.id)).size !== def.rooms.length) add('rooms', 'duplicate room id');
    for (const k of ['entry', 'bossRoom'] as const) if (!roomIds.has(def[k])) add(k, `unknown room ${def[k]}`);
    if (def.camp !== undefined && !roomIds.has(def.camp)) add('camp', `unknown room ${def.camp}`);
    for (const w of def.wandering) if (!reg.monsters[w]) add('wandering', `unknown monster ${w}`);
    for (const r of def.rooms) for (const m of r.monsters ?? []) if (!reg.monsters[m.template]) add(`room ${r.id}`, `unknown monster ${m.template}`);
    for (const a of def.actions) if (!roomIds.has(a.room)) add(`action ${a.id}`, `unknown room ${a.room}`);
    for (const e of def.edges) {
        if (!roomIds.has(e.from)) add(`edge ${e.from}`, 'unknown from room');
        if (typeof e.to === 'number' && !roomIds.has(e.to)) add(`edge ${e.from}->${e.to}`, 'unknown to room');
    }
    for (const [id, t] of Object.entries(def.lootTables)) {
        if (t.gold) checkDice(issues, def.id, `loot ${id}`, t.gold);
        for (const it of t.items ?? []) if (!reg.items[it]) add(`loot ${id}`, `unknown item ${it}`);
        if (!t.once && (t.gold || (t.items ?? []).some((i) => reg.items[i]?.sellPrice))) add(`loot ${id}`, 'repeatable table pays budgeted value: payout is unbounded');
    }
    for (const { where, room, e } of allEffects(def)) {
        if (!EFFECT_OPS.has(e.op)) {
            add(where, `unknown effect op ${e.op}`);
            continue;
        }
        if ('dice' in e) checkDice(issues, def.id, where, e.dice);
        if ('room' in e && typeof e.room === 'number' && !roomIds.has(e.room)) add(where, `unknown room ${e.room}`);
        if (e.op === 'grantLoot' && !def.lootTables[e.table]) add(where, `unknown loot table ${e.table}`);
        if ((e.op === 'grantItem' || e.op === 'consumeItem') && !reg.items[e.item]) add(where, `unknown item ${e.item}`);
        if (e.op === 'applyStatus' && !reg.statuses[e.status]) add(where, `unknown status ${e.status}`);
        if (e.op === 'spawnMonster' && !reg.monsters[e.template]) add(where, `unknown monster ${e.template}`);
        if (e.op === 'setMonsters' && e.template && !reg.monsters[e.template]) add(where, `unknown monster ${e.template}`);
        if ((e.op === 'dropGold' || e.op === 'claimPool' || (e.op === 'payGold' && e.pool)) && !(lvl.rooms.get(room)?.pools ?? []).includes((e as { pool: string }).pool)) {
            add(where, `room ${room} has no pool ${(e as { pool: string }).pool}`);
        }
        if (e.op === 'revealEdge' && !def.edges.some((x) => x.from === room && x.to === e.to && x.hidden)) add(where, `no hidden edge ${room}->${e.to}`);
        if (e.op === 'grantGold') add(where, 'grantGold is unbounded per season; use a once loot table');
    }
    for (const { where, c } of allConditions(def)) {
        const key = Object.keys(c)[0];
        if (!CONDITION_KEYS.has(key)) add(where, `unknown condition ${key}`);
        if ('hasItem' in c && !reg.items[c.hasItem]) add(where, `unknown item ${c.hasItem}`);
        if ('class' in c && !reg.classes[c.class]) add(where, `unknown class ${c.class}`);
        if ('lootAvailable' in c && !def.lootTables[c.lootAvailable]) add(where, `unknown loot table ${c.lootAvailable}`);
        if ('monsterStatus' in c && c.monsterStatus.template && !reg.monsters[c.monsterStatus.template]) add(where, `unknown monster ${c.monsterStatus.template}`);
        if ('levelBossDefeated' in c && c.levelBossDefeated !== def.id) add(where, 'levelBossDefeated may only refer to its own level');
    }

    // ---- DCs and abilities
    for (const a of def.actions) {
        if (!a.check) continue;
        const abs = Array.isArray(a.check.ability) ? a.check.ability : [a.check.ability];
        for (const ab of abs) if (!ABILITIES.includes(ab)) add(`action ${a.id}`, `unknown ability ${ab}`);
        if (a.check.dc < DC_MIN || a.check.dc > DC_MAX) add(`action ${a.id}`, `DC ${a.check.dc} outside the ladder ${DC_MIN}-${DC_MAX}`);
    }
    for (const { where, e } of allEffects(def)) {
        if (e.op === 'damage' && e.save && (e.save.dc < DC_MIN || e.save.dc > DC_MAX)) add(where, `save DC ${e.save.dc} outside the ladder`);
    }

    // ---- flags and counters that gate something must be settable
    const setFlags = new Set<string>(ENGINE_FLAGS);
    const setCounters = new Set<string>();
    const setCharFlags = new Set<string>();
    for (const { room, e } of allEffects(def)) {
        if (e.op === 'setRoomFlag') setFlags.add(`${e.room ?? room}:${e.flag}`);
        if (e.op === 'revealEdge') setFlags.add(`${room}:revealed:${e.to}`);
        if (e.op === 'incRoomCounter') setCounters.add(`${e.room ?? room}:${e.counter}`);
        if (e.op === 'setCharFlag') setCharFlags.add(e.flag);
    }
    for (const { where, room, c } of allConditions(def)) {
        if ('roomFlag' in c && (c.is ?? true) && !ENGINE_FLAGS.has(c.roomFlag) && !setFlags.has(`${c.room ?? room}:${c.roomFlag}`)) add(where, `flag ${c.roomFlag} is never set`);
        if ('roomCounter' in c && c.atLeast !== undefined && !setCounters.has(`${c.room ?? room}:${c.roomCounter}`)) add(where, `counter ${c.roomCounter} is never incremented`);
        if ('charFlag' in c && (c.is ?? true) && !setCharFlags.has(c.charFlag)) add(where, `char flag ${c.charFlag} is never set`);
    }

    // ---- reachability (edges + moveTo effects, conditions ignored) and a way back to the exit
    const fwd = new Map<number, Set<number>>();
    const link = (a: number, b: number) => {
        if (!fwd.has(a)) fwd.set(a, new Set());
        fwd.get(a)!.add(b);
    };
    for (const e of def.edges) {
        if (typeof e.to !== 'number') continue;
        link(e.from, e.to);
        if (!e.oneWay) link(e.to, e.from);
    }
    for (const { room, e } of allEffects(def)) if (e.op === 'moveTo') link(room, e.room);
    const bfs = (start: number, step: (n: number) => Iterable<number>) => {
        const seen = new Set([start]);
        const q = [start];
        while (q.length) for (const m of step(q.shift()!)) if (!seen.has(m)) (seen.add(m), q.push(m));
        return seen;
    };
    const start = def.camp ?? def.entry;
    const reach = bfs(start, (n) => fwd.get(n) ?? []);
    for (const r of def.rooms) if (!reach.has(r.id)) add(`room ${r.id}`, 'unreachable');
    const back = new Map<number, number[]>();
    for (const [a, bs] of fwd) for (const b of bs) back.set(b, [...(back.get(b) ?? []), a]);
    const canReturn = bfs(start, (n) => back.get(n) ?? []);
    for (const r of def.rooms) if (!canReturn.has(r.id) && def.camp !== undefined) add(`room ${r.id}`, 'dead end: no way back to the exit');

    // ---- budget
    const payout = maxSeasonPayout(content, def);
    if (payout > def.budget) add('budget', `max season payout ${payout} exceeds budget ${def.budget}`);

    // ---- text pack
    if (text) {
        for (const r of def.rooms) if (!text.rooms[r.key]) add(`text`, `no text for room ${r.key}`);
        for (const a of def.actions) if (!text.actions[a.id]) add('text', `no label for action ${a.id}`);
        for (const { e } of allEffects(def)) if (e.op === 'narrate' && !text.outcomes[e.outcome]) add('text', `no text for outcome ${e.outcome}`);
        const monsters = new Set([...def.rooms.flatMap((r) => (r.monsters ?? []).map((m) => m.template)), ...def.wandering]);
        for (const { e } of allEffects(def)) if (e.op === 'spawnMonster') monsters.add(e.template);
        for (const m of monsters) if (!text.monsters[m]) add('text', `no name for monster ${m}`);
        for (const it of Object.keys(reg.items)) if (!text.items[it]) add('text', `no name for item ${it}`);
    }
    return issues;
}

export function lintRegistry(content: Content): LintIssue[] {
    const issues: LintIssue[] = [];
    for (const [kind, table] of Object.entries(content.registry)) {
        const ids = Object.values(table as Record<string, { id: number }>).map((x) => x.id);
        if (new Set(ids).size !== ids.length) issues.push({ level: 0, where: `registry ${kind}`, message: 'duplicate numeric id' });
    }
    for (const [id, m] of Object.entries(content.registry.monsters)) {
        for (const tr of m.traits) if (tr.kind === 'onHitSave' && !content.registry.statuses[tr.status]) issues.push({ level: 0, where: `monster ${id}`, message: `unknown status ${tr.status}` });
    }
    return issues;
}
