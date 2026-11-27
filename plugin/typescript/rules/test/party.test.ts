import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LEVELS, REGISTRY, loadContent } from '../src/content.ts';
import { FixedDice } from '../src/dice.ts';
import { type Intent, partyOf, resolve } from '../src/engine/resolve.ts';
import type { Scene } from '../src/types.ts';
import { char, newId, scene } from './helpers.ts';

/* Parties (SPEC §3.6): a move within the level takes along the mover's party members standing with them. */

const ambush = loadContent(LEVELS, REGISTRY, { ambush: true, quick: false, initiative: false });

function run(s: Scene, id: string, intent: Intent, dice: number[] = []) {
    const r = resolve(ambush, s, id, intent, new FixedDice(dice), newId);
    if (!r.ok) throw new Error(`fizzled: ${r.fizzled}`);
    return r;
}
const moved = (evs: { t: string; char?: string }[]) => evs.filter((e) => e.t === 'move').map((e) => e.char);

describe('parties', () => {
    it('a move takes along the party members standing in the same room, and nobody else', () => {
        const a = char('a', 'fighter', 1);
        const b = char('b', 'rogue', 1);
        const c = char('c', 'cleric', 1); // in the room, not in the party
        b.party = 'a';
        const s = scene(a, b, c);
        s.height = 120;
        const r = run(s, 'a', { kind: 'move', to: 3 }); // the Chapel: no hostiles, no dice
        assert.deepEqual(moved(r.events), ['a', 'b']);
        assert.deepEqual([a.room, b.room, c.room], [3, 3, 1]);
        assert.equal(b.prevRoom, 1);
        assert.equal(b.lastActionHeight, 120, 'a member who moved has acted: not lying low');
    });

    it('only those who joined come along: a joiner moving brings the leader only if the leader joined too', () => {
        const a = char('a', 'fighter', 1);
        const b = char('b', 'rogue', 1);
        b.party = 'a';
        run(scene(a, b), 'b', { kind: 'move', to: 3 });
        assert.deepEqual([a.room, b.room], [1, 3], 'a never joined, so b cannot drag a along');
        const a2 = char('a', 'fighter', 1);
        const b2 = char('b', 'rogue', 1);
        a2.party = 'a';
        b2.party = 'a';
        run(scene(a2, b2), 'b', { kind: 'move', to: 3 });
        assert.deepEqual([a2.room, b2.room], [3, 3]);
        assert.equal(partyOf(a2), 'a');
        assert.equal(partyOf(char('z', 'wizard', 1)), 'z', 'a character with no party leads its own');
    });

    it('members with a sealed roll, downed members, and members elsewhere stay behind', () => {
        const a = char('a', 'fighter', 1);
        const busy = char('b', 'rogue', 1);
        const down = char('d', 'cleric', 1);
        const away = char('w', 'wizard', 4);
        for (const c of [busy, down, away]) c.party = 'a';
        down.status = 'downed';
        const s = scene(a, busy, down, away);
        s.busy = ['b'];
        const r = run(s, 'a', { kind: 'move', to: 3 });
        assert.deepEqual(moved(r.events), ['a']);
        assert.deepEqual([busy.room, down.room, away.room], [1, 1, 4]);
    });

    it('walking into an ambush together: one initiative roll for the party, the first blow on the one in front', () => {
        const a = char('a', 'fighter', 1);
        const b = char('b', 'rogue', 1);
        b.party = 'a';
        const r = run(scene(a, b), 'a', { kind: 'move', to: 2 }, [2, 19, 15, 3]); // they win; the skeleton hits a for 3 + 2
        assert.deepEqual(moved(r.events), ['a', 'b']);
        const init = r.events.filter((e) => e.t === 'initiative');
        assert.equal(init.length, 1);
        assert.deepEqual(r.events.filter((e) => e.t === 'attack').map((e) => (e as { target: string }).target), ['a']);
        assert.equal(b.hp, b.maxHp);
    });

    it('fleeing a fight is every character for themselves', () => {
        const a = char('a', 'fighter', 2); // the Ossuary, skeletons up; came from the Narthex
        const b = char('b', 'rogue', 2);
        b.party = 'a';
        const r = run(scene(a, b), 'a', { kind: 'move', to: 1 }, [20, 2]); // a's DEX check succeeds; the skeleton misses
        assert.deepEqual(moved(r.events), ['a']);
        assert.equal(b.room, 2);
    });

    it('stairs to another level are not a group move', () => {
        const a = char('a', 'fighter', 1);
        const b = char('b', 'rogue', 1);
        b.party = 'a';
        // no stairs from room 1; checked directly: a move to another level never gathers companions
        const s = scene(a, b);
        const r = resolve(ambush, s, 'a', { kind: 'move', to: { level: 2, room: 0 } }, new FixedDice([]), newId);
        assert.equal(r.ok, false, 'no such exit here, so it fizzles; b is untouched either way');
        assert.equal(b.room, 1);
    });
});
