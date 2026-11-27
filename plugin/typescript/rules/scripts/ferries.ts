/* Debug: where are characters ferried out? env: N, SIZE, CLASS */
import { loadContent } from '../src/content.ts';
import { partyFor, simulateDelve } from '../src/sim.ts';
const content = loadContent();
const N = Number(process.env.N || 300);
const size = Number(process.env.SIZE || 1);
const hist: Record<number, number> = {};
let boss = 0;
for (let i = 0; i < N; i++) {
    const r = simulateDelve(content, { classes: process.env.CLASS ? [process.env.CLASS] : size === 1 ? [['fighter', 'rogue', 'cleric', 'wizard'][i % 4]] : partyFor(size, i), potionsEach: 2, rope: true, maxRounds: 600, maxTrips: Number(process.env.TRIPS ?? 3) }, `ferries.${size}.${i}`);
    for (const d of r.ferryRooms) hist[d] = (hist[d] ?? 0) + 1;
    if (r.bossKilled) boss++;
}
console.log(`size ${size}: boss ${boss}/${N}; ferries by room`, hist);
