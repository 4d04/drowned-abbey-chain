/* Property (SPEC §7.3, §9.1): the forfeit outcome is never better for the player than any real outcome. */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';
import { ForfeitDice, SeededDice } from '../src/dice.ts';
import { type Intent, options, resolve } from '../src/engine/resolve.ts';
import type { Scene } from '../src/types.ts';
import { char, content, item, newId, scene } from './helpers.ts';

interface Outcome {
    success: boolean | null;
    hp: number;
    gold: number;
    monsterHp: number;
    room: number;
}

function outcome(s: Scene, id: string, intent: Intent, dice: SeededDice | ForfeitDice): Outcome | null {
    const copy = structuredClone(s);
    const r = resolve(content, copy, id, intent, dice, newId);
    if (!r.ok) return null;
    const a = copy.chars[id];
    const start = s.chars[id].room;
    const monsterHp = copy.rooms[start].monsters.filter((m) => m.status === 'hostile').reduce((t, m) => t + m.hp, 0);
    return { success: r.success, hp: a.hp, gold: a.carriedGold, monsterHp, room: a.room };
}

const seed = (i: number) => new Uint8Array(createHash('sha256').update(`forfeit.${i}`).digest());

describe('forfeit outcome', () => {
    it('is no better than any real outcome, for every option in every room', () => {
        let compared = 0;
        for (const cls of ['fighter', 'rogue', 'cleric', 'wizard']) {
            for (const room of content.levels.get(1)!.def.rooms.map((r) => r.id)) {
                const a = char('a', cls, room);
                a.carriedGold = 40;
                a.hp = a.maxHp - 3;
                a.inventory.push(item('healing_potion'), item('rope'), item('abbots_signet', 150));
                const s = scene(a);
                for (const intent of options(content, s, 'a')) {
                    const f = outcome(s, 'a', intent, new ForfeitDice());
                    assert.ok(f, `forfeit fizzled for ${JSON.stringify(intent)}`);
                    for (let i = 0; i < 40; i++) {
                        const r = outcome(s, 'a', intent, new SeededDice(seed(i)))!;
                        const where = `${cls} room ${room} ${JSON.stringify(intent)} seed ${i}`;
                        // a forfeit never succeeds where a real roll could fail…
                        if (f.success === true) assert.equal(r.success, true, where);
                        // …and within the same branch, every die went against the player
                        if (f.success === r.success && f.room === r.room) {
                            assert.ok(f.hp <= r.hp, `${where}: hp ${f.hp} > ${r.hp}`);
                            assert.ok(f.gold <= r.gold, `${where}: gold ${f.gold} > ${r.gold}`);
                            assert.ok(f.monsterHp >= r.monsterHp, `${where}: monster hp ${f.monsterHp} < ${r.monsterHp}`);
                        }
                        compared++;
                    }
                }
            }
        }
        assert.ok(compared > 5000, `only ${compared} comparisons`);
    });

    it('fails every check that can fail', () => {
        for (const def of content.levels.get(1)!.def.actions) {
            if (!def.check || def.check.autoSuccessIf) continue;
            const a = char('a', 'fighter', def.room, [20, 20, 20, 20, 20, 20]);
            a.carriedGold = 40;
            a.inventory.push(item('rope'), item('abbots_signet', 150));
            const s = scene(a);
            s.rooms[7].monsters[0].status = 'disguised';
            if (def.room === 6 && def.id === 'bell.disarm') s.rooms[6].flags.trap_spotted = true;
            const f = outcome(s, 'a', { kind: 'action', actionId: def.id }, new ForfeitDice());
            if (f) assert.equal(f.success, false, def.id);
        }
    });
});
