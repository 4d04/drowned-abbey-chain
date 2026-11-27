import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assignStats, canCreate, enterDungeon, extract, newCharacter, shopBuyCost, shopSellPayout, validateName } from '../src/camp.ts';
import { d20Bp, oddsFor } from '../src/engine/odds.ts';
import { resolve } from '../src/engine/resolve.ts';
import { BLOCK_MS, blocksFor } from '../src/timing.ts';
import { FERRY_ACTIVE_BLOCKS, FERRY_MAX_RECIPIENTS, endSeason, ferryDowned, newSeason, seasonEndsAt, tollRecipients } from '../src/season.ts';
import type { Character } from '../src/types.ts';
import { simulateDelve } from '../src/sim.ts';
import { char, content, item, scene } from './helpers.ts';

describe('camp', () => {
    it('creates, assigns stats by permutation, and enters at the Narthex', () => {
        const ch = newCharacter(content, 'x', 'o', 'Brannoc', 'fighter');
        assert.equal(ch.status, 'rolling');
        assert.throws(() => assignStats(content, ch, [8, 10, 12, 13, 15, 16], [0, 0, 1, 2, 3, 4]));
        assignStats(content, ch, [8, 10, 12, 13, 15, 16], [5, 4, 3, 0, 1, 2]); // STR 16 DEX 15 CON 13 …
        assert.deepEqual(ch.stats, [16, 15, 13, 8, 10, 12]);
        assert.equal(ch.maxHp, 25);
        assert.throws(() => assignStats(content, ch, [8, 10, 12, 13, 15, 16], [0, 1, 2, 3, 4, 5]));
        enterDungeon(content, ch);
        assert.deepEqual([ch.status, ch.room], ['delving', 1]);
    });

    it('validates names and the living-character cap', () => {
        assert.equal(validateName('Brannoc the Wet'), null);
        assert.ok(validateName(''));
        assert.ok(validateName('x'.repeat(25)));
        assert.ok(validateName('naïve'));
        assert.equal(canCreate(4), null);
        assert.ok(canCreate(5));
    });

    it('extracts only at the Lychgate: gold out, items to the stash, full heal', () => {
        const a = char('a', 'fighter', 1);
        a.carriedGold = 123;
        a.hp = 3;
        a.inventory.push(item('rope'));
        assert.throws(() => extract(content, a, 0));
        a.room = 0;
        const out = extract(content, a, 31);
        assert.equal(out.gold, 123);
        assert.equal(out.toStash.length, 1);
        assert.equal(a.carriedGold, 0);
        assert.equal(a.hp, a.maxHp);
        assert.equal(a.status, 'camp');
    });

    it('shop: buy prices, and sales pay exactly the escrow reserved when the item dropped', () => {
        assert.equal(shopBuyCost(content, 'healing_potion', 2), 50);
        assert.throws(() => shopBuyCost(content, 'abbots_crozier', 1));
        assert.equal(shopSellPayout(content, item('abbots_signet', 150)), 150);
        assert.equal(shopSellPayout(content, item('abbots_signet', 90)), 90);
        assert.throws(() => shopSellPayout(content, item('rope')));
    });
});

describe('seasons and the treasury', () => {
    it('a short treasury scales loot down proportionally', () => {
        const lvl = newSeason(content, 1, 2, 500, 350);
        assert.equal(lvl.budgetReserved, 350);
        assert.equal(lvl.scaleBp, 5000);
        const a = char('a', 'fighter', 10);
        const s = scene(a);
        s.level = lvl;
        // grantLoot via the sacristy: 120g → 60g, signet escrow 150 → 75
        const r = resolve(content, s, 'a', { kind: 'action', actionId: 'sacristy.loot' }, { roll: () => 1, log: [] }, () => 'id');
        assert.ok(r.ok);
        assert.equal(a.carriedGold, 60);
        assert.equal(a.inventory[0].escrow, 75);
        assert.equal(lvl.budgetPaid, 135);
    });

    it('season ends 30 minutes after the boss dies, or at the cap (~3.5 days), counted in blocks of BLOCK_MS', () => {
        const lvl = newSeason(content, 1, 1, 1000, 10_000);
        assert.equal(seasonEndsAt(content, lvl), 1000 + blocksFor(300_000));
        lvl.bossKilledAt = 2000;
        assert.equal(seasonEndsAt(content, lvl), 2000 + blocksFor(1800));
        assert.equal(blocksFor(1800), (1800 * 1000) / BLOCK_MS);
    });

    it('the flood returns pools, piles, corpses, carried gold and unspent budget, and washes characters out to camp', () => {
        const lvl = newSeason(content, 1, 1, 0, 10_000);
        lvl.budgetPaid = 400;
        const a = char('a', 'fighter', 11);
        a.carriedGold = 50;
        const s = scene(a);
        s.rooms[1].pools.silt = 7;
        s.rooms[3].pools.altar = 20;
        s.rooms[12].pileGold = 300;
        s.rooms[12].corpses.push({ charId: 'dead', gold: 12, items: [item('abbots_signet', 150)] });
        const flood = endSeason(content, lvl, Object.values(s.rooms), [a]);
        assert.equal(flood.toTreasury, 300 + 7 + 20 + 300 + 12 + 150 + 50);
        assert.deepEqual(flood.swept, ['a']);
        assert.deepEqual([a.status, a.levelId, a.room, a.carriedGold, a.hp], ['camp', 1, 0, 0, a.maxHp]);
        assert.equal(a.inventory.length, 0);
    });

    it('simulated seasons never pay out more than the reserved budget', () => {
        for (let i = 0; i < 30; i++) {
            const r = simulateDelve(content, { classes: ['fighter', 'cleric', 'rogue'], potionsEach: 2, rope: true, maxRounds: 600, maxTrips: 3 }, `budget.${i}`);
            const paid = r.goldExtracted.reduce((x, y) => x + y, 0);
            assert.ok(paid <= 700, `extracted ${paid}`);
        }
    });
});

describe('the Ferryman', () => {
    const downedWith = (gold: number): Character => {
        const d = char('d', 'rogue', 11);
        d.status = 'downed';
        d.hp = 0;
        d.downedAt = 100;
        d.carriedGold = gold;
        return d;
    };
    const active = (id: string, owner: string, last: number, level = 1): Character => {
        const c = char(id, 'fighter', 5);
        c.owner = owner;
        c.lastActionHeight = last;
        c.levelId = level;
        return c;
    };

    it('recipients: other accounts on the same level, recently active, one share per account, most recent first', () => {
        const d = downedWith(0);
        const h = 200;
        const cands = [
            active('own-alt', d.owner, h), // the downed player's own account: excluded
            active('stale', 'o1', h - FERRY_ACTIVE_BLOCKS - 1), // idle too long
            active('deeper', 'o2', h, 2), // another level
            active('x1', 'o3', h - 50),
            active('x2', 'o3', h - 5), // same account: only its most recent character counts
            active('y', 'o4', h - 10)
        ];
        assert.deepEqual(tollRecipients(d, cands, h).map((c) => c.id), ['x2', 'y']);
        const many = Array.from({ length: 15 }, (_, i) => active(`m${i}`, `p${i}`, h - i));
        assert.equal(tollRecipients(d, many, h).length, FERRY_MAX_RECIPIENTS);
    });

    it('the toll is half the carried gold (rounded against the player); the split remainder returns to the treasury', () => {
        const d = downedWith(25);
        const cands = [active('a', 'oa', 120), active('b', 'ob', 121)];
        const f = ferryDowned(content, d, scene(d).rooms[11], 121, 20, cands)!;
        assert.equal(f.kept, 12);
        assert.deepEqual(f.shares.map((x) => [x.charId, x.amount]), [['b', 6], ['a', 6]]);
        assert.equal(f.toTreasury, 1);
        assert.equal(f.toCache, 0);
    });

    it('with nobody around, the toll stays in the room for whoever finds it', () => {
        const d = downedWith(40);
        const s = scene(d);
        d.inventory.push(item('abbots_signet', 150));
        const f = ferryDowned(content, d, s.rooms[11], 121, 20, [d])!;
        assert.deepEqual([f.kept, f.toCache, f.items, f.shares.length], [20, 20, 1, 0]);
        assert.deepEqual(s.rooms[11].corpses.map((c) => [c.charId, c.gold, c.items.length]), [['d', 20, 1]]);
        assert.equal(d.inventory.length, 0);
    });

    it('nothing is due before the timer runs out, and standing characters are never ferried', () => {
        const d = downedWith(10);
        assert.equal(ferryDowned(content, d, scene(d).rooms[11], 120, 20, []), null);
        const up = char('u', 'fighter', 11);
        assert.equal(ferryDowned(content, up, scene(up).rooms[11], 10_000, 20, []), null);
    });
});

describe('odds', () => {
    it('d20 odds are exact', () => {
        assert.equal(d20Bp(5, 13, false, false, true), 6500); // the sample session's 65%
        assert.equal(d20Bp(0, 21, false, false, true), 500); // only a natural 20
        assert.equal(d20Bp(0, 21, false, false, false), 0);
        assert.equal(d20Bp(20, 2, false, false, true), 9500); // natural 1 still misses
        assert.equal(d20Bp(2, 14, true, false, false), 6975); // 1 - 0.55²
        assert.equal(d20Bp(2, 14, false, true, false), 2025);
        assert.equal(d20Bp(2, 14, true, true, false), 4500);
    });

    it('option odds use the same modifiers as resolution', () => {
        const r = char('r', 'rogue', 4, [10, 16, 10, 10, 10, 10]);
        const s = scene(r);
        const o = oddsFor(content, s, 'r', { kind: 'action', actionId: 'scriptorium.pick_lock' })!;
        assert.deepEqual([o.mod, o.target, o.advantage], [5, 14, true]); // DEX +3, proficient +2, rogue advantage
        const flee = oddsFor(content, scene(char('f', 'fighter', 2)), 'f', { kind: 'move', to: 1 })!;
        assert.equal(flee.target, 16);
    });
});
