import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FixedDice } from '../src/dice.ts';
import { blocksFor } from '../src/timing.ts';
import { legal, needsRoll, options, resolve, type Intent } from '../src/engine/resolve.ts';
import { type GameEvent, LIE_LOW_BLOCKS, ROOM_WIDE_MAX, roomTargets } from '../src/engine/context.ts';
import { ferryDowned } from '../src/season.ts';
import type { Scene } from '../src/types.ts';
import { char, content, events, item, newId, scene } from './helpers.ts';

function run(s: Scene, id: string, intent: Intent, dice: number[]) {
    const d = new FixedDice(dice);
    const r = resolve(content, s, id, intent, d, newId);
    if (!r.ok) throw new Error(`fizzled: ${r.fizzled}`);
    return r;
}
const attacks = (evs: GameEvent[]) => events(evs, 'attack') as Extract<GameEvent, { t: 'attack' }>[];

describe('combat exchange', () => {
    it('attack, then the attacked monster counterattacks; after a kill the lowest-index hostile does', () => {
        const f = char('f', 'fighter', 2);
        const s = scene(f);
        let r = run(s, 'f', { kind: 'attack', target: 0 }, [10, 8, 1]); // hit 15 vs 13, 8+3 dmg; skeleton nat 1
        assert.equal(s.rooms[2].monsters[0].hp, 2);
        assert.deepEqual(attacks(r.events).map((a) => [a.attacker, a.target, a.hit]), [['f', 'm0', true], ['m0', 'f', false]]);
        r = run(s, 'f', { kind: 'attack', target: 0 }, [10, 5, 20, 6]); // kill; m1 nat 20 for 6+2
        assert.equal(s.rooms[2].monsters[0].status, 'dead');
        assert.deepEqual(attacks(r.events).map((a) => [a.attacker, a.target, a.hit]), [['f', 'm0', true], ['m1', 'f', true]]);
        assert.equal(f.hp, f.maxHp - 8);
    });

    it('natural 1 always misses and natural 20 always hits on attacks', () => {
        const f = char('f', 'fighter', 12);
        const s = scene(f);
        const miss = run(s, 'f', { kind: 'attack', target: 0 }, [1, 1]);
        assert.equal(attacks(miss.events)[0].hit, false);
        f.statuses = [{ id: 'chilled', charges: 3 }]; // -1
        const hit = run(s, 'f', { kind: 'attack', target: 0 }, [20, 1, 1]);
        assert.equal(attacks(hit.events)[0].hit, true);
    });

    it('giant rats get +1 to hit per other living rat', () => {
        const f = char('f', 'fighter', 5);
        const s = scene(f);
        const r = run(s, 'f', { kind: 'attack', target: 0 }, [2, 10]); // miss; rat d20 10 + 4 + 1
        assert.equal(attacks(r.events)[1].total, 15);
    });

    it('a ghoul hit can slow (CON save), and slowed means disadvantage on the next roll', () => {
        const f = char('f', 'fighter', 11, [14, 14, 6, 14, 14, 14]); // CON 6: -2, +2 proficient = +0
        const s = scene(f);
        run(s, 'f', { kind: 'attack', target: 0 }, [2, 15, 3, 3, 9]); // miss; ghoul hits 3+3+2; save 9 < 10
        assert.deepEqual(f.statuses, [{ id: 'slowed', charges: 1 }]);
        const r = run(s, 'f', { kind: 'attack', target: 0 }, [18, 4, 2]); // disadvantage: keeps 4 → miss; ghoul misses
        assert.deepEqual(attacks(r.events)[0].d20, [18, 4]);
        assert.equal(attacks(r.events)[0].hit, false);
        assert.deepEqual(f.statuses, []);
    });

    it("the Abbot's Tide Wail hits everyone in the room every third exchange", () => {
        const a = char('a', 'fighter', 12);
        const b = char('b', 'fighter', 12);
        const s = scene(a, b);
        run(s, 'a', { kind: 'attack', target: 0 }, [2, 2]);
        run(s, 'b', { kind: 'attack', target: 0 }, [2, 2]);
        const r = run(s, 'a', { kind: 'attack', target: 0 }, [2, 2, 8, 4, 5, 8, 4, 20]); // tide 2d8: a takes 12 (save 5 fails), b saves (20) → 6
        assert.equal(events(r.events, 'tideWail').length, 1);
        assert.equal(a.hp, a.maxHp - 12);
        assert.equal(b.hp, b.maxHp - 6);
    });

    it('the Tide Wail passes over characters who have not acted for LIE_LOW_BLOCKS (they lie low)', () => {
        const a = char('a', 'fighter', 12);
        const b = char('b', 'fighter', 12);
        const idle = char('c', 'fighter', 12);
        const s = scene(a, b, idle);
        b.lastActionHeight = s.height - LIE_LOW_BLOCKS; // just inside the window: still in the fight
        idle.lastActionHeight = s.height - LIE_LOW_BLOCKS - 1;
        run(s, 'a', { kind: 'attack', target: 0 }, [2, 2]);
        run(s, 'a', { kind: 'attack', target: 0 }, [2, 2]);
        const r = run(s, 'a', { kind: 'attack', target: 0 }, [2, 2, 8, 4, 5, 8, 4, 5]); // a and b each fail and take 12
        assert.equal(events(r.events, 'tideWail').length, 1);
        assert.equal(a.hp, a.maxHp - 12);
        assert.equal(b.hp, b.maxHp - 12);
        assert.equal(idle.hp, idle.maxHp);
    });

    it('a room-wide effect reaches at most ROOM_WIDE_MAX others, the most recently active', () => {
        const a = char('a', 'fighter', 12);
        const crowd = Array.from({ length: ROOM_WIDE_MAX + 2 }, (_, i) => char(`c${String(i).padStart(2, '0')}`, 'fighter', 12));
        crowd.forEach((c, i) => (c.lastActionHeight = 100 - Math.floor(i / 2))); // pairs share a height
        const s = scene(a, ...crowd);
        const hit = roomTargets(s, a, 12).map((c) => c.id);
        assert.equal(hit.length, ROOM_WIDE_MAX + 1);
        assert.ok(hit.includes('a'));
        // the two least recent miss out; within a height the higher id ranks first
        assert.deepEqual(crowd.filter((c) => !hit.includes(c.id)).map((c) => c.id), [`c${ROOM_WIDE_MAX}`, `c${ROOM_WIDE_MAX + 1}`]);
    });

    it('the Abbot recovers to full HP if nobody fights him for a minute', () => {
        const a = char('a', 'fighter', 12);
        const s = scene(a);
        const quiet = blocksFor(60);
        run(s, 'a', { kind: 'attack', target: 0 }, [15, 8, 1]); // 11 damage at height 100
        assert.equal(s.rooms[12].monsters[0].hp, 37);
        s.height = 100 + quiet;
        run(s, 'a', { kind: 'attack', target: 0 }, [1, 1]); // within the window: no recovery
        assert.equal(s.rooms[12].monsters[0].hp, 37);
        s.height = 100 + 2 * quiet + 1;
        const r = run(s, 'a', { kind: 'attack', target: 0 }, [1, 1, 1, 1, 20]); // third exchange also brings the Tide Wail
        assert.equal(events(r.events, 'recovered').length, 1);
        assert.equal(s.rooms[12].monsters[0].hp, 48);
    });

    it('you cannot rest at the Lychgate', () => {
        const a = char('a', 'fighter', 0);
        a.hp = 5;
        assert.equal(legal(content, scene(a), 'a', { kind: 'rest' }), 'at camp you extract instead');
    });

    it('downed characters cannot act, can be stabilized, and after 20 blocks the Ferryman takes them to camp', () => {
        const a = char('a', 'wizard', 2);
        const b = char('b', 'fighter', 2);
        a.hp = 1;
        a.carriedGold = 30;
        a.inventory.push(item('rope'));
        const s = scene(a, b);
        run(s, 'a', { kind: 'attack', target: 0 }, [2, 20, 6]);
        assert.equal(a.status, 'downed');
        assert.match(legal(content, s, 'a', { kind: 'rest' })!, /downed/);
        const st = run(s, 'b', { kind: 'stabilize', target: 'a' }, [10, 2]); // WIS 14 (+2) → 12 ≥ 10; skeleton misses
        assert.equal(st.success, true);
        assert.equal(a.status, 'delving');
        assert.equal(a.hp, 1);
        run(s, 'a', { kind: 'attack', target: 0 }, [2, 20, 6]);
        assert.equal(a.status, 'downed');
        const all = Object.values(s.chars);
        assert.equal(ferryDowned(content, a, s.rooms[2], s.height + 20, 20, all), null);
        const f = ferryDowned(content, a, s.rooms[2], s.height + 21, 20, all)!;
        // a wakes at the Lychgate at 1 HP with half the gold; b (active, same level) gets the toll; the rope stays
        assert.deepEqual([a.status, a.levelId, a.room, a.hp, a.carriedGold], ['delving', 1, 0, 1, 15]);
        assert.deepEqual(f.shares, [{ charId: 'b', owner: 'owner-b', amount: 15 }]);
        assert.equal(b.carriedGold, 15);
        assert.deepEqual(s.rooms[2].corpses.map((c) => [c.charId, c.gold, c.items.length]), [['a', 0, 1]]);
        b.room = 1; // monsters out of the way for the loot
        s.rooms[1].corpses = s.rooms[2].corpses;
        run(s, 'b', { kind: 'take', lootRef: 'corpse:a' }, []);
        assert.equal(b.inventory.length, 1);
        assert.equal(s.rooms[1].corpses.length, 0);
    });

    it('fleeing: only back the way you came, at DC 10 + 2 per hostile', () => {
        const f = char('f', 'fighter', 2); // came from 1
        const s = scene(f);
        assert.match(legal(content, s, 'f', { kind: 'move', to: 4 })!, /flee/);
        const fail = run(s, 'f', { kind: 'move', to: 1 }, [13, 1]); // 13+2 = 15 < 16; skeleton misses
        assert.equal(fail.success, false);
        assert.equal(f.room, 2);
        const ok = run(s, 'f', { kind: 'move', to: 1 }, [14]);
        assert.equal(ok.success, true);
        assert.equal(f.room, 1);
    });

    it('fizzles with no dice when the target died between commit and reveal', () => {
        const a = char('a', 'fighter', 5);
        const b = char('b', 'fighter', 5);
        const s = scene(a, b);
        const intent: Intent = { kind: 'attack', target: 0 };
        assert.equal(legal(content, s, 'b', intent), null); // b commits
        run(s, 'a', intent, [15, 8, 1]); // a kills rat 0
        const r = resolve(content, s, 'b', intent, new FixedDice([]), newId);
        assert.deepEqual(r, { ok: false, fizzled: 'no such target' });
    });
});

describe('room actions', () => {
    it('parley success makes the goblins friendly with no counterattack; attacking them makes them all hostile', () => {
        const a = char('a', 'fighter', 8);
        const s = scene(a);
        const r = run(s, 'a', { kind: 'action', actionId: 'kitchens.parley' }, [10]);
        assert.equal(r.success, true);
        assert.deepEqual(s.rooms[8].monsters.map((m) => m.status), ['friendly', 'friendly', 'friendly']);
        assert.equal(attacks(r.events).length, 0);
        assert.ok(a.flags.includes('bridge_warning'));
        run(s, 'a', { kind: 'attack', target: 1 }, [2, 2]);
        assert.deepEqual(s.rooms[8].monsters.map((m) => m.status), ['hostile', 'hostile', 'hostile']);
    });

    it('intimidating the goblins clears the room and pays the goblin purse once', () => {
        const a = char('a', 'fighter', 8, [16, 10, 10, 10, 10, 10]);
        const s = scene(a);
        run(s, 'a', { kind: 'action', actionId: 'kitchens.intimidate' }, [11, 4, 5]); // STR +3 +2 = 16 ≥ 14; purse 2d6
        assert.equal(a.carriedGold, 9);
        assert.ok(s.level.lootTaken.includes('goblin_purse'));
        assert.equal(s.level.budgetPaid, 9);
    });

    it('opening the coffer uninspected gives the mimic a surprise attack with advantage', () => {
        const a = char('a', 'fighter', 7);
        const s = scene(a);
        const r = run(s, 'a', { kind: 'action', actionId: 'reliquary.open_coffer' }, [3, 17, 8]);
        const atk = attacks(r.events)[0];
        assert.deepEqual([atk.attacker, atk.d20, atk.kept, atk.hit], ['m0', [3, 17], 17, true]);
        assert.equal(a.hp, a.maxHp - 10);
    });

    it('the tome makes the secret door an auto-success, which opens the hidden edge for everyone', () => {
        const a = char('a', 'wizard', 7);
        a.flags.push('tome_lore');
        const b = char('b', 'fighter', 7);
        const s = scene(a, b);
        assert.equal(legal(content, s, 'b', { kind: 'move', to: 10 }), 'no such exit');
        const r = run(s, 'a', { kind: 'action', actionId: 'reliquary.search_walls' }, []);
        assert.equal(r.success, true);
        assert.equal(legal(content, s, 'b', { kind: 'move', to: 10 }), null);
    });

    it('rubble needs two successes from anyone; then the shortcut opens', () => {
        const a = char('a', 'fighter', 5);
        const b = char('b', 'fighter', 5);
        const s = scene(a, b);
        s.rooms[5].monsters.forEach((m) => (m.status = 'dead'));
        run(s, 'a', { kind: 'action', actionId: 'cloister.clear_rubble' }, [10]);
        assert.equal(legal(content, s, 'a', { kind: 'move', to: 8 }), 'the way is blocked');
        run(s, 'b', { kind: 'action', actionId: 'cloister.clear_rubble' }, [10]);
        assert.equal(legal(content, s, 'a', { kind: 'move', to: 8 }), null);
        assert.match(legal(content, s, 'a', { kind: 'action', actionId: 'cloister.clear_rubble' })!, /conditions/);
    });

    it('walking the bell stair blind tolls the bell and wakes the choir', () => {
        const a = char('a', 'fighter', 6);
        const s = scene(a);
        run(s, 'a', { kind: 'action', actionId: 'bell.walk_blind' }, [3, 4, 4]); // save fails: 2d6 = 8
        assert.equal(a.room, 7);
        assert.equal(a.hp, a.maxHp - 8);
        assert.ok(s.rooms[11].monsters.every((m) => m.alert));
        assert.ok(s.rooms[6].flags.trap_triggered);
    });

    it('a tied rope makes the bridge an ordinary exit for everyone and consumes the rope', () => {
        const a = char('a', 'fighter', 9);
        a.inventory.push(item('rope'));
        const s = scene(a);
        assert.equal(legal(content, s, 'a', { kind: 'move', to: 11 }), 'the way is blocked');
        run(s, 'a', { kind: 'action', actionId: 'bridge.tie_rope' }, [10]);
        assert.equal(a.inventory.length, 0);
        assert.equal(legal(content, s, 'a', { kind: 'move', to: 11 }), null);
    });

    it('failing the bridge sweeps you back to the Narthex', () => {
        const a = char('a', 'wizard', 9, [10, 8, 10, 10, 10, 10]);
        const s = scene(a);
        run(s, 'a', { kind: 'action', actionId: 'bridge.cross' }, [5, 3]);
        assert.equal(a.room, 1);
        assert.equal(a.hp, a.maxHp - 3);
    });

    it('wading out may drop gold into the silt; searching the silt claims it plus the purse once', () => {
        const a = char('a', 'fighter', 1, [10, 8, 10, 10, 10, 10]);
        a.carriedGold = 10;
        const s = scene(a);
        run(s, 'a', { kind: 'action', actionId: 'narthex.wade_out' }, [2, 4]);
        assert.equal(a.carriedGold, 6);
        assert.equal(a.room, 0);
        assert.equal(s.rooms[1].pools.silt, 4);
        const b = char('b', 'cleric', 1);
        s.chars.b = b;
        run(s, 'b', { kind: 'action', actionId: 'narthex.search_silt' }, [10]);
        assert.equal(b.carriedGold, 4 + 15);
        run(s, 'b', { kind: 'action', actionId: 'narthex.search_silt' }, [10]);
        assert.equal(b.carriedGold, 19); // purse is once per season
    });

    it('offerings feed the altar pool; desecration takes it and wakes a ghoul for everyone', () => {
        const a = char('a', 'fighter', 3);
        a.carriedGold = 25;
        const s = scene(a);
        run(s, 'a', { kind: 'action', actionId: 'chapel.offer' }, []);
        assert.equal(s.rooms[3].pools.altar, 10);
        assert.deepEqual(a.statuses, [{ id: 'blessed', charges: 3 }]);
        run(s, 'a', { kind: 'action', actionId: 'chapel.desecrate' }, [10, 5, 2, 1]); // 10+2+2+1(blessed) ≥ 12; ghoul alert counterattack misses
        assert.equal(a.carriedGold, 25);
        assert.equal(s.rooms[3].monsters.length, 1);
        assert.ok(a.inventory.some((i) => i.template === 'saints_ward'));
        assert.equal(a.statuses[0].charges, 2);
    });

    it('killing the Abbot records the boss, drops the hoard into the pile, and the stairs stay sealed until level 2 activates', () => {
        const a = char('a', 'fighter', 12);
        const s = scene(a);
        s.rooms[12].monsters[0].hp = 5;
        run(s, 'a', { kind: 'attack', target: 0 }, [15, 4]);
        assert.equal(s.level.bossKilledAt, s.height);
        assert.equal(s.rooms[12].pileGold, 300);
        assert.equal(s.rooms[12].pile[0].template, 'abbots_crozier');
        assert.match(legal(content, s, 'a', { kind: 'move', to: { level: 2, room: 0 } })!, /flooded/);
        run(s, 'a', { kind: 'take', lootRef: 'pile' }, []);
        assert.equal(a.carriedGold, 300);
        assert.equal(a.abilityUses.turn_undead, 1); // the Crozier grants Turn Undead to any class
    });

    it('presenting the signet emboldens the whole party: advantage on their next two attacks', () => {
        const a = char('a', 'fighter', 12);
        const b = char('b', 'rogue', 12);
        a.inventory.push(item('abbots_signet', 150));
        const s = scene(a, b);
        run(s, 'a', { kind: 'action', actionId: 'sepulchre.present_signet' }, [3, 14, 1]); // advantage from the signet itself
        assert.deepEqual(b.statuses, [{ id: 'emboldened', charges: 2 }]);
        const r = run(s, 'b', { kind: 'attack', target: 0 }, [2, 15, 3, 1, 1, 1]);
        assert.deepEqual(attacks(r.events)[0].d20, [2, 15]);
    });
});

describe('class abilities', () => {
    it('Second Wind heals 1d10+3', () => {
        const f = char('f', 'fighter', 4);
        f.hp = 5;
        run(scene(f), 'f', { kind: 'ability', ability: 'second_wind' }, [6]);
        assert.equal(f.hp, 14);
        assert.equal(f.abilityUses.second_wind, 0);
    });

    it('Heal brings a downed ally back up', () => {
        const c = char('c', 'cleric', 4);
        const w = char('w', 'wizard', 4);
        w.status = 'downed';
        w.hp = 0;
        run(scene(c, w), 'c', { kind: 'ability', ability: 'heal', target: 'w' }, [2, 3]);
        assert.equal(w.status, 'delving');
        assert.equal(w.hp, 7);
    });

    it('Turn Undead makes undead flee on a failed WIS save; the Abbot is immune', () => {
        const c = char('c', 'cleric', 2);
        const s = scene(c);
        run(s, 'c', { kind: 'ability', ability: 'turn_undead' }, [2, 20, 5, 1]); // saves 1, 19, 4 vs 13; the one that stayed misses
        assert.deepEqual(s.rooms[2].monsters.map((m) => m.status), ['fled', 'hostile', 'fled']);
        const c2 = char('c2', 'cleric', 12);
        assert.equal(legal(content, scene(c2), 'c2', { kind: 'ability', ability: 'turn_undead' }), 'no undead to turn');
    });

    it('Magic Missile never misses: 3 × (1d4+1)', () => {
        const w = char('w', 'wizard', 12);
        const s = scene(w);
        run(s, 'w', { kind: 'ability', ability: 'magic_missile', target: 0 }, [4, 4, 4, 1]);
        assert.equal(s.rooms[12].monsters[0].hp, 48 - 15);
    });

    it('Sneak Attack adds 2d6 against an unaware target', () => {
        const r = char('r', 'rogue', 2);
        const s = scene(r);
        run(s, 'r', { kind: 'attack', target: 0 }, [15, 1, 1, 1, 1]); // 1+3 +2 = 6
        assert.equal(s.rooms[2].monsters[0].hp, 13 - 6);
        run(s, 'r', { kind: 'attack', target: 0 }, [15, 1, 1]); // engaged now, no ally: 4
        assert.equal(s.rooms[2].monsters[0].hp, 13 - 10);
    });

    it('Sneak Attack counts an ally the plugin did not load (othersStanding)', () => {
        const r = char('r', 'rogue', 2);
        const s = scene(r);
        s.rooms[2].monsters[0].engaged = true; // aware: only an ally can enable Sneak Attack
        run(s, 'r', { kind: 'attack', target: 0 }, [15, 1, 1]);
        assert.equal(s.rooms[2].monsters[0].hp, 13 - 4); // no ally loaded or counted: 1+3
        s.othersStanding = 1;
        run(s, 'r', { kind: 'attack', target: 0 }, [15, 1, 1, 1, 1]);
        assert.equal(s.rooms[2].monsters[0].hp, 13 - 4 - 6); // 1+3 + 2d6 (1+1)
    });

    it('the Silvered Dagger adds 1d4 against undead', () => {
        const r = char('f', 'fighter', 11);
        const dagger = item('silvered_dagger');
        r.inventory.push(dagger);
        const s = scene(r);
        run(s, 'f', { kind: 'attack', target: 0, weapon: dagger.id }, [15, 2, 3, 1]);
        assert.equal(s.rooms[11].monsters[0].hp, 18 - 8);
    });
});

describe('statuses, rest and potions', () => {
    it('Blessed adds +1 to the next three d20 rolls', () => {
        const a = char('a', 'fighter', 4);
        a.statuses = [{ id: 'blessed', charges: 3 }];
        const s = scene(a);
        for (let i = 0; i < 3; i++) run(s, 'a', { kind: 'action', actionId: 'scriptorium.read_tome' }, [1]);
        assert.deepEqual(a.statuses, []);
    });

    it('short rest heals 1d8+CON once per delve; a 4 on the wandering die spawns an alert monster', () => {
        const a = char('a', 'fighter', 4);
        a.hp = 5;
        const s = scene(a);
        const r = run(s, 'a', { kind: 'rest' }, [3, 4, 1, 1, 1]); // heal 3+2; wandering d4 = 4; d2 = 1 → giant rat; alert: advantage, both 1s
        assert.equal(a.hp, 10);
        assert.equal(s.rooms[4].monsters[0].template, 'giant_rat');
        assert.equal(events(r.events, 'attack').length, 1);
        assert.match(legal(content, s, 'a', { kind: 'rest' })!, /hostiles|rested/);
    });

    it('a potion can be fed to a downed ally', () => {
        const a = char('a', 'fighter', 4);
        const b = char('b', 'rogue', 4);
        const p = item('healing_potion');
        a.inventory.push(p);
        b.status = 'downed';
        b.hp = 0;
        run(scene(a, b), 'a', { kind: 'useItem', itemId: p.id, target: 'b' }, [1, 1]);
        assert.equal(b.status, 'delving');
        assert.equal(b.hp, 4);
        assert.equal(a.inventory.length, 0);
    });
});

describe('intents', () => {
    it('needsRoll is exact: a plain move needs no roll, a potion purchase with no hostiles needs none, attacks do', () => {
        const a = char('a', 'fighter', 3);
        const s = scene(a);
        assert.equal(needsRoll(content, s, 'a', { kind: 'move', to: 6 }), false);
        const g = char('g', 'fighter', 8);
        g.carriedGold = 30;
        const s2 = scene(g);
        s2.rooms[8].monsters.forEach((m) => (m.status = 'friendly'));
        assert.equal(needsRoll(content, s2, 'g', { kind: 'action', actionId: 'kitchens.buy_potion' }), false);
        assert.equal(needsRoll(content, s2, 'g', { kind: 'attack', target: 0 }), true);
        assert.equal(g.carriedGold, 30); // the probe ran on a copy
    });

    it('options lists only legal intents', () => {
        const a = char('a', 'fighter', 2);
        const s = scene(a);
        const opts = options(content, s, 'a');
        assert.ok(opts.every((o) => legal(content, s, 'a', o) === null));
        const kinds = opts.map((o) => (o.kind === 'action' ? o.actionId : o.kind === 'move' ? `move:${JSON.stringify(o.to)}` : o.kind));
        assert.deepEqual(kinds.sort(), ['attack', 'attack', 'attack', 'move:1', 'ossuary.sneak_cloister', 'ossuary.sneak_scriptorium', 'ability'].sort());
    });
});
