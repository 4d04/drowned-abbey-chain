import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LEVELS, REGISTRY, type Variants, loadContent } from '../src/content.ts';
import { FixedDice } from '../src/dice.ts';
import type { GameEvent } from '../src/engine/context.ts';
import { type Intent, resolve } from '../src/engine/resolve.ts';
import type { Scene } from '../src/types.ts';
import { char, newId, scene } from './helpers.ts';

/* The initiative prototype (content.variants): ambush on arrival, quick monsters, per-round initiative. */

const withVariants = (v: Partial<Variants>) => loadContent(LEVELS, REGISTRY, { ambush: false, quick: false, initiative: false, ...v });

function run(v: Partial<Variants>, s: Scene, id: string, intent: Intent, dice: number[]) {
    const r = resolve(withVariants(v), s, id, intent, new FixedDice(dice), newId);
    if (!r.ok) throw new Error(`fizzled: ${r.fizzled}`);
    return r;
}

/** The order things happened in: who attacked whom, and initiative calls. */
const order = (evs: GameEvent[]) =>
    evs.flatMap((e) => (e.t === 'attack' ? [`${e.attacker}>${e.target}`] : e.t === 'initiative' ? [`init:${e.reason}:${e.first}`] : []));

describe('initiative prototype', () => {
    it('with every variant off, nothing changes: you act, then one monster answers', () => {
        const f = char('f', 'fighter', 2);
        const r = run({}, scene(f), 'f', { kind: 'attack', target: 0 }, [2, 2]); // miss; skeleton misses
        assert.deepEqual(order(r.events), ['f>m0', 'm0>f']);
    });

    it('quick: a giant rat bites before your action resolves, and does not answer again', () => {
        const f = char('f', 'fighter', 5);
        const r = run({ quick: true }, scene(f), 'f', { kind: 'attack', target: 0 }, [2, 2]); // rat misses; you miss
        assert.deepEqual(order(r.events), ['init:quick:them', 'm0>f', 'f>m0']);
    });

    it('quick only applies to quick monsters: skeletons still answer after you', () => {
        const f = char('f', 'fighter', 2);
        const r = run({ quick: true }, scene(f), 'f', { kind: 'attack', target: 0 }, [2, 2]);
        assert.deepEqual(order(r.events), ['f>m0', 'm0>f']);
    });

    it('per-round initiative: the answering monster strikes first only on a strictly higher total', () => {
        const f = char('f', 'fighter', 2); // DEX 14: +2; skeleton initiative +0
        const lose = run({ initiative: true }, scene(f), 'f', { kind: 'attack', target: 0 }, [3, 18, 2, 2]); // 5 vs 18: it goes first
        assert.deepEqual(order(lose.events), ['init:round:them', 'm0>f', 'f>m0']);
        const tie = run({ initiative: true }, scene(char('g', 'fighter', 2)), 'g', { kind: 'attack', target: 0 }, [8, 10, 2, 2]); // 10 vs 10: you
        assert.deepEqual(order(tie.events), ['init:round:you', 'g>m0', 'm0>g']);
    });

    it('struck down before acting: your action is lost', () => {
        const f = char('f', 'fighter', 2);
        f.hp = 1;
        const r = run({ initiative: true }, scene(f), 'f', { kind: 'attack', target: 0 }, [1, 20, 15, 6]); // it wins, hits for 6+2
        assert.equal(f.status, 'downed');
        assert.deepEqual(order(r.events), ['init:round:them', 'm0>f']);
    });

    it('ambush: walking into a room with hostiles rolls initiative; if they win, the first one strikes as you arrive', () => {
        const f = char('f', 'fighter', 1); // the Narthex: no hostiles; the Ossuary next door has three skeletons
        const caught = run({ ambush: true }, scene(f), 'f', { kind: 'move', to: 2 }, [2, 19, 15, 3]);
        assert.deepEqual(order(caught.events), ['init:ambush:them', 'm0>f']);
        assert.equal(f.room, 2);
        const g = char('g', 'fighter', 1);
        const ready = run({ ambush: true }, scene(g), 'g', { kind: 'move', to: 2 }, [19, 2]);
        assert.deepEqual(order(ready.events), ['init:ambush:you']);
        // without the variant the same move rolls nothing
        const h = char('h', 'fighter', 1);
        assert.deepEqual(order(run({}, scene(h), 'h', { kind: 'move', to: 2 }, []).events), []);
    });

    it('ambush: an action that carries you to another room (wading out to camp) rolls no initiative', () => {
        const f = char('f', 'fighter', 1);
        const s = scene(f);
        delete s.rooms[0]; // as the plugin loads it: only the room you act in
        const r = run({ ambush: true }, s, 'f', { kind: 'action', actionId: 'narthex.wade_out' }, [15]);
        assert.deepEqual(order(r.events), []);
    });
});
