/*
 * Balance simulator CLI. env: N (expeditions per row, default 2000), SEED, TRIPS, POTIONS, SIM_ROUND_SECONDS,
 * VARIANTS (rule variants: unset plays the live ones, "none" none, or a list of ambush, quick, initiative). With TARGETS=1, exits non-zero if a
 * SPEC §9.3 target is missed.
 */

import { LEVELS, LIVE_VARIANTS, NO_VARIANTS, REGISTRY, type Variants, loadContent } from '../src/content.ts';
import { CLASSES, type SimSummary, partyFor, simulateDelve, summarize } from '../src/sim.ts';

const N = Number(process.env.N || 2000);
const SEED = process.env.SEED || 'abbey.sim.v1';
// unset: the live game's variants; "none": every variant off; otherwise a comma-separated list
const raw = process.env.VARIANTS;
const picked = (raw ?? '').split(',').map((x) => x.trim()).filter((x) => x && x !== 'none');
for (const v of picked) if (!(v in NO_VARIANTS)) throw new Error(`unknown variant ${v}: use ${Object.keys(NO_VARIANTS).join(', ')} or none`);
const variants: Variants = raw === undefined ? { ...LIVE_VARIANTS } : { ...NO_VARIANTS, ...Object.fromEntries(picked.map((v) => [v, true])) };
const content = loadContent(LEVELS, REGISTRY, variants);
const cfg = { potionsEach: Number(process.env.POTIONS ?? 2), rope: true, maxRounds: 600, maxTrips: Number(process.env.TRIPS ?? 3) };
const rows: SimSummary[] = [];

for (const cls of CLASSES) {
    const rs = Array.from({ length: N }, (_, i) => simulateDelve(content, { ...cfg, classes: [cls] }, `${SEED}.solo.${cls}.${i}`));
    rows.push(summarize(`solo ${cls}`, 1, rs));
}
const solo = Array.from({ length: N }, (_, i) => simulateDelve(content, { ...cfg, classes: [CLASSES[i % 4]] }, `${SEED}.solo.${i}`));
rows.push(summarize('solo (all classes)', 1, solo));
for (const size of [2, 3, 4]) {
    const rs = Array.from({ length: N }, (_, i) => simulateDelve(content, { ...cfg, classes: partyFor(size, i) }, `${SEED}.p${size}.${i}`));
    rows.push(summarize(`party of ${size}`, size, rs));
}

console.log(`N=${N} seed=${SEED} trips=${cfg.maxTrips} potions/trip=${cfg.potionsEach} variants=${(Object.keys(variants) as (keyof Variants)[]).filter((k) => variants[k]).join('+') || 'none'}`);
console.log('| Party | Boss kill | Ferried (chars) | Ferries / run | Toll / run | Back at camp | Gold / survivor | Rounds |');
console.log('|---|---|---|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r.label} | ${r.bossKillPct}% | ${r.ferriedPct}% | ${r.ferriesPerRun} | ${r.tollPerRun}g | ${r.survivorRatePct}% | ${r.goldPerSurvivor}g | ${r.avgRounds} |`);

if (process.env.TARGETS) {
    const soloRow = rows.find((r) => r.label === 'solo (all classes)')!;
    const p3 = rows.find((r) => r.label === 'party of 3')!;
    const misses: string[] = [];
    if (Math.abs(soloRow.bossKillPct - 25) > 7) misses.push(`solo boss kill ${soloRow.bossKillPct}% (target ~25%)`);
    if (Math.abs(p3.bossKillPct - 65) > 10) misses.push(`3-player boss kill ${p3.bossKillPct}% (target ~65%)`);
    if (p3.goldPerSurvivor < 100 || p3.goldPerSurvivor > 220) misses.push(`3-player gold per survivor ${p3.goldPerSurvivor}g (target ~150g)`);
    for (const m of misses) console.log(`MISS: ${m}`);
    process.exit(misses.length ? 1 : 0);
}
