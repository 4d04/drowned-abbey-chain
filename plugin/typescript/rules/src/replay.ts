/* Golden replay (SPEC §9.2): a fixed set of simulated delves whose full event log must stay byte-identical. */

import { type Content, canonicalJSON, hashJSON } from './content.ts';
import { type SimStep, simulateDelve } from './sim.ts';

export const REPLAY_PARTIES = [['fighter'], ['rogue'], ['cleric'], ['wizard'], ['fighter', 'cleric'], ['rogue', 'wizard', 'cleric'], ['fighter', 'rogue', 'cleric', 'wizard']];
export const REPLAY_SEEDS = ['golden.0', 'golden.1', 'golden.2'];

export interface ReplayDigest {
    levels: Record<number, string>; // contentHash per level
    runs: number;
    steps: number;
    hash: string;
}

export function replayDigest(content: Content): ReplayDigest {
    const steps: SimStep[] = [];
    let runs = 0;
    for (const party of REPLAY_PARTIES) {
        for (const seed of REPLAY_SEEDS) {
            const result = simulateDelve(content, { classes: party, potionsEach: 2, rope: true, maxRounds: 600, maxTrips: 3 }, `${seed}.${party.join('+')}`, (s) => steps.push(s));
            steps.push({ round: -1, char: 'result', intent: { kind: 'rest' }, res: { ok: false, fizzled: canonicalJSON(result) } });
            runs++;
        }
    }
    const levels: Record<number, string> = {};
    for (const [id, l] of content.levels) levels[id] = l.contentHash;
    return { levels, runs, steps: steps.length, hash: hashJSON(steps) };
}
