/* Debug: trace one simulated delve. env: CLASSES=fighter,cleric SEED=x */
import { loadContent } from '../src/content.ts';
import { simulateDelve } from '../src/sim.ts';
const content = loadContent();
const classes = (process.env.CLASSES || 'fighter').split(',');
process.env.SIM_TRACE = '1';
console.log(JSON.stringify(simulateDelve(content, { classes, potionsEach: 1, rope: true, maxRounds: 600, maxTrips: Number(process.env.TRIPS ?? 3) }, process.env.SEED || 'trace')));
