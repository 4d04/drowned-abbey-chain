/* Balance simulator (SPEC §9.3): scripted bot parties delve level 1 through the real engine with seeded dice. */

import { sha256 } from '@noble/hashes/sha2.js';
import { concatBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { assignStats, enterDungeon, extract, newCharacter } from './camp.ts';
import type { Content } from './content.ts';
import { SeededDice, rollStats, u64be } from './dice.ts';
import { DOWNED_BLOCKS, hostiles } from './engine/context.ts';
import { blocksFor } from './timing.ts';

/**
 * How long one round of the party takes in real time. Timers are in seconds, so this sets how many rounds they last.
 * 12s is the pace every M1 result was measured at (two 6s blocks per exchange); SIM_ROUND_SECONDS tries others.
 */
const ROUND_SECONDS = Number(globalThis.process?.env?.SIM_ROUND_SECONDS ?? 12);
const ROUND_BLOCKS = blocksFor(ROUND_SECONDS);
import { type Intent, type Resolution, exits, legal, options, resolve } from './engine/resolve.ts';
import { ferryDowned, initialRoom, newSeason } from './season.ts';
import type { Ability, Character, Scene } from './types.ts';

const PRIORITY: Record<string, Ability[]> = {
    fighter: ['STR', 'CON', 'DEX', 'WIS', 'CHA', 'INT'],
    rogue: ['DEX', 'CON', 'WIS', 'INT', 'CHA', 'STR'],
    cleric: ['WIS', 'CON', 'STR', 'CHA', 'DEX', 'INT'],
    wizard: ['INT', 'CON', 'DEX', 'WIS', 'CHA', 'STR']
};
const ORDER: Ability[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

/** The bot's route through level 1: rooms to finish, in order. Room 2/4 is a detour parties take, solos skip. */
const ROUTE_PARTY = [2, 4, 3, 6, 7, 10, 9, 11, 12];
const ROUTE_SOLO = [3, 6, 7, 10, 9, 11, 12];
/** Room actions the bot wants done (in priority order) before leaving a room. */
const WANTED = [
    'sacristy.loot', 'scriptorium.pick_lock', 'reliquary.search_walls', 'reliquary.investigate', // investigate: parties only
    'bell.spot', 'bell.disarm', 'bridge.tie_rope', 'sepulchre.present_signet', 'narthex.search_silt'
];
const MAX_TRIES = 3;
const TRACE = typeof process !== 'undefined' && !!process.env?.SIM_TRACE;

export interface SimConfig {
    classes: string[];
    potionsEach: number; // bought before every trip
    rope: boolean;
    maxRounds: number;
    maxTrips: number; // trips into the dungeon per season (extract, heal at camp, go back in)
}

export interface DelveResult {
    bossKilled: boolean;
    survivors: number; // alive and back at camp at the end
    trips: number;
    ferries: number; // Ferryman rescues (a character can be ferried more than once)
    ferried: number; // characters ferried at least once
    toll: number; // carried gold lost to the Ferryman's toll
    goldExtracted: number[]; // per extracted survivor
    rounds: number;
    deepestRouteStep: number;
    ferryRooms: number[];
}

class Rng {
    private n = 0;
    private readonly seed: Uint8Array;
    constructor(seed: string) {
        this.seed = utf8ToBytes(seed);
    }
    dice(): SeededDice {
        return new SeededDice(sha256(concatBytes(this.seed, u64be(this.n++))));
    }
}

interface Bot {
    id: string;
    tries: Record<string, number>;
    extracted: boolean;
    gold: number;
}

function assignFor(classId: string, rolled: number[]): number[] {
    // best roll to the class's top ability, and so on
    const byValue = rolled.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).map((x) => x[1]);
    const perm = new Array<number>(6);
    PRIORITY[classId].forEach((ab, rank) => (perm[ORDER.indexOf(ab)] = byValue[rank]));
    return perm;
}

function hpPct(c: Character): number {
    return Math.floor((c.hp * 100) / Math.max(1, c.maxHp));
}

/** Shortest path over currently-open exits to `target`; returns the next room or null. */
function nextHop(content: Content, scene: Scene, ch: Character, target: number): number | null {
    const prev = new Map<number, number>([[ch.room, -1]]);
    const q = [ch.room];
    while (q.length) {
        const r = q.shift()!;
        if (r === target) break;
        for (const x of exits(content, 1, r)) {
            if (typeof x.to !== 'number' || prev.has(x.to)) continue;
            // evaluate the edge as if standing in r
            const probe = { ...ch, room: r, prevRoom: -2 };
            const s2 = { ...scene, chars: { ...scene.chars, [ch.id]: probe } };
            if (hostiles(scene.rooms[r]).length === 0 && legal(content, s2, ch.id, { kind: 'move', to: x.to }) !== null) continue;
            prev.set(x.to, r);
            q.push(x.to);
        }
    }
    if (!prev.has(target)) return null;
    let cur = target;
    while (prev.get(cur) !== ch.room && prev.get(cur) !== -1) cur = prev.get(cur)!;
    return cur === ch.room ? null : cur;
}

function decide(content: Content, scene: Scene, bot: Bot, party: Bot[], plan: { step: number; retreat: boolean; route: number[] }): Intent | null {
    const ch = scene.chars[bot.id];
    const opts = options(content, scene, ch.id);
    const has = (p: (i: Intent) => boolean) => opts.find(p);
    const room = scene.rooms[ch.room];
    const mates = party.map((b) => scene.chars[b.id]).filter((c) => c.room === ch.room);

    // 1. downed allies first
    for (const m of mates) {
        if (m.status !== 'downed') continue;
        const o =
            has((i) => i.kind === 'ability' && i.ability === 'heal' && i.target === m.id) ??
            has((i) => i.kind === 'useItem' && i.target === m.id) ??
            has((i) => i.kind === 'stabilize' && i.target === m.id);
        if (o) return o;
    }
    // 2. heal self or the weakest ally when low
    const weakest = mates.filter((c) => c.status === 'delving').sort((a, b) => hpPct(a) - hpPct(b))[0];
    if (weakest && hpPct(weakest) <= 40) {
        const o = has((i) => i.kind === 'ability' && i.ability === 'heal' && i.target === weakest.id);
        if (o) return o;
    }
    if (hpPct(ch) <= 40) {
        const o = has((i) => i.kind === 'ability' && i.ability === 'second_wind') ?? has((i) => i.kind === 'useItem' && i.target === undefined);
        if (o) return o;
    }
    const hs = hostiles(room);
    // 3. fight (or flee when retreating)
    if (hs.length > 0) {
        // flee only toward a room that is not itself hostile (fleeing goes back where you came from);
        // a character close to dropping with no healing left runs on their own
        const desperate = hpPct(ch) <= 30 && !opts.some((i) => (i.kind === 'ability' && (i.ability === 'heal' || i.ability === 'second_wind')) || i.kind === 'useItem');
        if ((plan.retreat || desperate) && hostiles(scene.rooms[ch.prevRoom] ?? room).length === 0) {
            const flee = has((i) => i.kind === 'move');
            if (flee) return flee;
        }
        const turnable = hs.filter((i) => {
            const d = content.registry.monsters[room.monsters[i].template];
            return d.tags.includes('undead') && !d.turnImmune;
        });
        if (turnable.length >= 2) {
            const o = has((i) => i.kind === 'ability' && i.ability === 'turn_undead');
            if (o) return o;
        }
        const signet = has((i) => i.kind === 'action' && i.actionId === 'sepulchre.present_signet');
        if (signet && (bot.tries['sepulchre.present_signet'] ?? 0) < 1) return signet;
        const target = [...hs].sort((a, b) => room.monsters[a].hp - room.monsters[b].hp || a - b)[0];
        if (room.monsters[target].hp >= 8) {
            const mm = has((i) => i.kind === 'ability' && i.ability === 'magic_missile' && i.target === target);
            if (mm) return mm;
        }
        // best weapon against this target
        const undead = content.registry.monsters[room.monsters[target].template].tags.includes('undead');
        let best: Intent = { kind: 'attack', target };
        let bestScore = -1;
        for (const o of opts) {
            if (o.kind !== 'attack' || o.target !== target) continue;
            const w: { bonus: number; damage: string; bonusDamageVs?: Record<string, string> } = o.weapon
                ? content.registry.items[ch.inventory.find((x) => x.id === o.weapon)!.template].weapon!
                : content.registry.classes[ch.classId].attack;
            const score = w.bonus * 10 + (undead && w.bonusDamageVs?.undead ? 25 : 0) + (w.damage.includes('d8') ? 5 : 0);
            if (score > bestScore) (best = o), (bestScore = score);
        }
        return best;
    }
    // 4. wanted room actions
    if (!plan.retreat) {
        for (const id of WANTED) {
            if (id === 'reliquary.investigate' && party.length === 1) continue; // solos leave the coffer alone
            const o = has((i) => i.kind === 'action' && i.actionId === id);
            if (o && (bot.tries[id] ?? 0) < MAX_TRIES) return o;
        }
        // the coffer: study it once, then open it if healthy
        const open = has((i) => i.kind === 'action' && i.actionId === 'reliquary.open_coffer');
        if (open && party.length > 1 && hpPct(ch) >= 60) return open;
        const pile = has((i) => i.kind === 'take');
        if (pile) return pile;
    }
    // 5. short rest when hurt
    if (hpPct(ch) <= 60) {
        const rest = has((i) => i.kind === 'rest');
        if (rest) return rest;
    }
    // 6. movement: follow the route, or head home
    if (plan.retreat || plan.step >= plan.route.length) {
        if (ch.room === 0) return null; // ready to extract
        if (ch.room === 1) return has((i) => i.kind === 'action' && i.actionId === 'narthex.wade_out') ?? null;
        const hop = nextHop(content, scene, ch, 1);
        return hop === null ? null : (has((i) => i.kind === 'move' && i.to === hop) ?? null);
    }
    const target = plan.route[plan.step];
    if (ch.room === target) return null; // room finished; the planner advances
    // special crossings
    if (ch.room === 6) {
        const walk = has((i) => i.kind === 'action' && i.actionId === 'bell.walk_blind');
        if (walk) return walk;
    }
    if (ch.room === 9 && target !== 9) {
        const viaRope = has((i) => i.kind === 'action' && i.actionId === 'bridge.use_rope');
        const cross = has((i) => i.kind === 'action' && i.actionId === 'bridge.cross');
        if (viaRope) return viaRope;
        if (cross && nextHop(content, scene, ch, target) === null) return cross;
    }
    const hop = nextHop(content, scene, ch, target);
    if (hop !== null) return has((i) => i.kind === 'move' && i.to === hop) ?? null;
    // the way is shut (secret door not found, bridge): skip this step
    return null;
}

/** One resolved step, for golden replays. */
export interface SimStep {
    round: number;
    char: string;
    intent: Intent;
    res: Resolution;
}

export function simulateDelve(content: Content, cfg: SimConfig, seed: string, record?: (s: SimStep) => void): DelveResult {
    const rng = new Rng(seed);
    let ids = 0;
    const newId = () => `i${ids++}`;
    let height = 1000;
    const level = newSeason(content, 1, 1, height, 1_000_000);
    const rooms: Scene['rooms'] = {};
    for (const r of content.levels.get(1)!.def.rooms) rooms[r.id] = initialRoom(content, 1, r.id);
    const chars: Record<string, Character> = {};
    const party: Bot[] = cfg.classes.map((cls, n) => {
        const id = `c${n}`;
        const ch = newCharacter(content, id, `owner${n}`, `${cls}${n}`, cls);
        const rolled = rollStats(rng.dice());
        assignStats(content, ch, rolled, assignFor(cls, rolled));
        if (cfg.rope && n === 0) ch.inventory.push({ id: newId(), template: 'rope', sourceLevel: 0, escrow: 0 });
        chars[id] = ch;
        return { id, tries: {}, extracted: true, gold: 0 };
    });
    const startTrip = () => {
        for (const b of party) {
            const ch = chars[b.id];
            if (ch.status !== 'camp') continue;
            const potions = ch.inventory.filter((i) => i.template === 'healing_potion').length;
            for (let p = potions; p < cfg.potionsEach; p++) ch.inventory.push({ id: newId(), template: 'healing_potion', sourceLevel: 0, escrow: 0 });
            enterDungeon(content, ch);
            ch.lastActionHeight = height; // as the plugin does: entering counts as acting
            b.extracted = false;
            b.tries = {};
        }
    };
    let trips = 0;
    const ferryRooms: number[] = [];
    const ferriedIds = new Set<string>();
    let toll = 0;
    const scene: Scene = { height, level, rooms, chars, activeLevels: [1] };
    const plan = { step: 0, retreat: false, route: cfg.classes.length > 1 ? ROUTE_PARTY : ROUTE_SOLO };
    let rounds = 0;
    let idleRounds = 0;

    for (; rounds < cfg.maxRounds; rounds++) {
        scene.height = height;
        let living = party.filter((b) => !b.extracted && (chars[b.id].status === 'delving' || chars[b.id].status === 'downed'));
        if (living.length === 0) {
            const alive = party.some((b) => chars[b.id].status === 'camp');
            if (!alive || level.bossKilledAt > 0 || trips >= cfg.maxTrips) break;
            startTrip();
            trips++;
            plan.step = 0;
            plan.retreat = false;
            living = party.filter((b) => !b.extracted);
        }
        const up = living.filter((b) => chars[b.id].status === 'delving');
        // retreat when the party is badly hurt with no healing left, unless the boss is nearly dead
        const totalPct = Math.floor(up.reduce((s, b) => s + hpPct(chars[b.id]), 0) / Math.max(1, up.length));
        const healing = up.some((b) => {
            const c = chars[b.id];
            return (c.abilityUses.heal ?? 0) > 0 || (c.abilityUses.second_wind ?? 0) > 0 || c.inventory.some((i) => i.template === 'healing_potion');
        });
        const boss = rooms[12].monsters[0];
        const finishingBoss = up.some((b) => chars[b.id].room === 12) && boss.status === 'hostile' && boss.hp <= 15;
        if (!plan.retreat && totalPct < 35 && !healing && !finishingBoss) plan.retreat = true;
        // smart play: don't walk into a fight hurt when you can go heal at camp and come back
        if (!plan.retreat && trips < cfg.maxTrips && totalPct < 80 && up.length > 0 && plan.step < plan.route.length) {
            const lead = chars[up[0].id];
            const hop = nextHop(content, scene, lead, plan.route[plan.step]);
            const need = hop === content.levels.get(1)!.def.bossRoom ? 80 : 60;
            if (hop !== null && totalPct < need && hostiles(rooms[lead.room]).length === 0 && hostiles(rooms[hop]).length > 0) plan.retreat = true;
        }
        if (level.bossKilledAt > 0 && rooms[12].pile.length === 0 && rooms[12].pileGold === 0) plan.step = plan.route.length;

        let acted = false;
        for (const b of living) {
            const ch = chars[b.id];
            if (ch.status !== 'delving') continue;
            const intent = decide(content, scene, b, living, plan);
            if (!intent) continue;
            if (intent.kind === 'action') b.tries[intent.actionId] = (b.tries[intent.actionId] ?? 0) + 1;
            const res = resolve(content, scene, b.id, intent, rng.dice(), newId);
            record?.({ round: rounds, char: b.id, intent, res });
            if (res.ok) acted = true;
            // a wanted action that succeeded is done
            if (res.ok && intent.kind === 'action' && res.success !== false) b.tries[intent.actionId] = MAX_TRIES;
            if (TRACE) console.log(`r${rounds} ${b.id}@${ch.room} hp${ch.hp} ${JSON.stringify(intent)} -> ${res.ok ? res.events.map((e) => e.t + ('success' in e ? ':' + e.success : '') + ('hit' in e ? ':' + e.hit : '')).join(',') : 'FIZZLE ' + res.fizzled}`);
        }
        // extraction
        for (const b of living) {
            const ch = chars[b.id];
            if (ch.status === 'delving' && ch.room === 0) {
                b.gold += extract(content, ch, 0).gold;
                b.extracted = true;
            }
        }
        // planner: advance once everyone standing is in the target room with nothing left to do
        if (!plan.retreat && plan.step < plan.route.length) {
            const target = plan.route[plan.step];
            const ups = party.filter((b) => chars[b.id].status === 'delving');
            const idle = ups.every((b) => decide(content, scene, b, living, plan) === null);
            const here = ups.some((b) => chars[b.id].room === target);
            if (idle && (here || !acted)) plan.step++;
        }
        idleRounds = acted || living.some((b) => chars[b.id].status === 'downed') ? 0 : idleRounds + 1;
        if (idleRounds >= 3) break; // nobody can make progress
        height += ROUND_BLOCKS; // one exchange: commit + reveal, plus the players' own pace
        for (const b of party) {
            const ch = chars[b.id];
            const room = ch.room;
            const carried = ch.carriedGold;
            const f = ferryDowned(content, ch, rooms[room], height, DOWNED_BLOCKS, Object.values(chars));
            if (f) {
                ferryRooms.push(room);
                ferriedIds.add(ch.id);
                toll += carried - f.kept;
            }
        }
    }
    const survivors = party.filter((b) => b.extracted && chars[b.id].status === 'camp');
    return {
        bossKilled: level.bossKilledAt > 0,
        survivors: survivors.length,
        trips,
        ferries: ferryRooms.length,
        ferried: ferriedIds.size,
        toll,
        goldExtracted: survivors.map((b) => b.gold),
        rounds,
        deepestRouteStep: plan.step,
        ferryRooms
    };
}

export interface SimSummary {
    label: string;
    delves: number;
    bossKillPct: number;
    ferriedPct: number; // characters ferried at least once
    ferriesPerRun: number;
    tollPerRun: number;
    survivorRatePct: number;
    goldPerSurvivor: number;
    avgRounds: number;
}

export function summarize(label: string, size: number, rs: DelveResult[]): SimSummary {
    const pct = (n: number, d: number) => Math.round((n * 1000) / Math.max(1, d)) / 10;
    const gold = rs.flatMap((r) => r.goldExtracted);
    return {
        label,
        delves: rs.length,
        bossKillPct: pct(rs.filter((r) => r.bossKilled).length, rs.length),
        ferriedPct: pct(rs.reduce((s, r) => s + r.ferried, 0), rs.length * size),
        ferriesPerRun: Math.round((rs.reduce((s, r) => s + r.ferries, 0) * 100) / Math.max(1, rs.length)) / 100,
        tollPerRun: Math.round(rs.reduce((s, r) => s + r.toll, 0) / Math.max(1, rs.length)),
        survivorRatePct: pct(rs.reduce((s, r) => s + r.survivors, 0), rs.length * size),
        goldPerSurvivor: Math.round(gold.reduce((s, g) => s + g, 0) / Math.max(1, gold.length)),
        avgRounds: Math.round(rs.reduce((s, r) => s + r.rounds, 0) / Math.max(1, rs.length))
    };
}

export const CLASSES = ['fighter', 'rogue', 'cleric', 'wizard'];

/** Deterministic party composition for run i of a given size. */
export function partyFor(size: number, i: number): string[] {
    const h = sha256(concatBytes(utf8ToBytes(`party.${size}`), u64be(i)));
    return Array.from({ length: size }, (_, k) => CLASSES[h[k] % CLASSES.length]);
}
