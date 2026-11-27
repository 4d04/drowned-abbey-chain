import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { canonicalJSON, indexLevel, loadContent, LEVELS } from '../src/content.ts';
import { type TextPack, lintLevel, lintRegistry, maxSeasonPayout } from '../src/lint.ts';
import { replayDigest } from '../src/replay.ts';
import type { LevelDef } from '../src/types.ts';
import { content } from './helpers.ts';

const text = JSON.parse(readFileSync(new URL('../levels/01-drowned-abbey/text.en.json', import.meta.url), 'utf8')) as TextPack;
const l1 = LEVELS[0];

function lintMutated(mutate: (d: LevelDef) => void, withText = false): string[] {
    const d = structuredClone(l1);
    mutate(d);
    return lintLevel(content, indexLevel(d, content.registry), withText ? text : undefined).map((i) => `${i.where}: ${i.message}`);
}

describe('content linter', () => {
    it('level 1 and the registry are clean', () => {
        assert.deepEqual(lintRegistry(content), []);
        assert.deepEqual(lintLevel(content, content.levels.get(1)!, text), []);
    });

    it('level 1 fits its season budget (SPEC §4: 547g + Signet 150)', () => {
        assert.equal(maxSeasonPayout(content, l1), 697);
        assert.ok(maxSeasonPayout(content, l1) <= l1.budget);
    });

    it('catches unreachable rooms and dead ends', () => {
        const errs = lintMutated((d) => {
            d.rooms.push({ id: 13, key: 'void' });
            d.edges.push({ from: 13, to: 12, oneWay: true });
        });
        assert.ok(errs.includes('room 13: unreachable'), errs.join('\n'));
        const dead = lintMutated((d) => {
            d.rooms.push({ id: 13, key: 'pit' });
            d.edges.push({ from: 12, to: 13, oneWay: true });
        });
        assert.ok(dead.includes('room 13: dead end: no way back to the exit'), dead.join('\n'));
    });

    it('catches DCs off the ladder, unknown ids, unset flags, bad dice and budget overflow', () => {
        const errs = lintMutated((d) => {
            d.actions[0].check!.dc = 25;
            d.actions[1].onSuccess!.push({ op: 'grantItem', item: 'vorpal_sword' });
            d.actions[2].when = [{ roomFlag: 'never_set' }];
            d.lootTables.abbot_hoard.gold = '3d';
            d.lootTables.sacristy_hoard.gold = '500';
            d.rooms[2].monsters!.push({ template: 'dragon' });
        });
        const has = (s: string) => assert.ok(errs.some((e) => e.includes(s)), `missing "${s}" in\n${errs.join('\n')}`);
        has('DC 25 outside the ladder');
        has('unknown item vorpal_sword');
        has('flag never_set is never set');
        has('bad dice expression "3d"');
        has('exceeds budget 700');
        has('unknown monster dragon');
    });

    it('catches unbounded payouts and missing text', () => {
        const errs = lintMutated((d) => {
            d.lootTables.silt_purse.once = false;
            d.actions.push({ id: 'narthex.new', room: 1, effects: [{ op: 'narrate', outcome: 'untranslated' }] });
        }, true);
        assert.ok(errs.some((e) => e.includes('payout is unbounded')), errs.join('\n'));
        assert.ok(errs.includes('text: no label for action narthex.new'));
        assert.ok(errs.includes('text: no text for outcome untranslated'));
    });
});

describe('content hash and replay', () => {
    it('canonicalJSON sorts keys lexicographically, integer-like keys included', () => {
        assert.equal(canonicalJSON({ 10: 1, 2: 1, b: { z: [1, { y: 2, x: 1 }], a: null }, a: undefined }), '{"10":1,"2":1,"b":{"a":null,"z":[1,{"x":1,"y":2}]}}');
    });

    it('contentHash is canonical: key order does not matter', () => {
        const reverseKeys = (v: unknown): unknown =>
            Array.isArray(v) ? v.map(reverseKeys) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).reverse().map(([k, x]) => [k, reverseKeys(x)])) : v;
        const shuffled = reverseKeys(l1) as LevelDef;
        assert.notEqual(JSON.stringify(shuffled), JSON.stringify(l1));
        assert.equal(canonicalJSON(shuffled), canonicalJSON(l1));
        assert.equal(indexLevel(shuffled, content.registry).contentHash, content.levels.get(1)!.contentHash);
    });

    it('the golden replay is byte-identical (run `npm run fixtures` only for an intended rules change)', () => {
        const fixture = JSON.parse(readFileSync(new URL('./fixtures/replay-l1.json', import.meta.url), 'utf8'));
        assert.deepEqual(replayDigest(loadContent()), fixture);
    });
});
