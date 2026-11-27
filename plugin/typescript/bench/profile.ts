/* Per-transaction cost of the plugin, in-process (no socket): time and state round trips per message type and stage. */

import { performance } from 'node:perf_hooks';
import { Chain, Player, must } from '../test/harness.ts';

const PLAYERS = Number(process.env.PLAYERS || 100);
const ROUNDS = Number(process.env.ROUNDS || 5);

const chain = new Chain();
const mem = chain.mem;
// count backend round trips (each one is a socket round trip on a real node)
let trips = 0;
let nested = 0; // readBatch is one round trip even though the in-memory version calls read() and range()
for (const m of ['read', 'range', 'write', 'readBatch'] as const) {
    const orig = mem[m].bind(mem);
    (mem as any)[m] = async (...a: any[]) => {
        if (!nested) trips++;
        if (m === 'readBatch') nested++;
        try {
            return await (orig as any)(...a);
        } finally {
            if (m === 'readBatch') nested--;
        }
    };
}

// time CheckTx and DeliverTx separately, as the core calls them (CheckTx twice per tx while applying a block)
const { ContractAsync } = await import('../dist/contract/contract.js');
const stats = new Map<string, { n: number; checkMs: number; deliverMs: number; checkTrips: number; deliverTrips: number }>();
const origCheck = ContractAsync.CheckTx;
const origDeliver = ContractAsync.DeliverTx;
let current = '';
ContractAsync.CheckTx = async (c: any, r: any) => {
    const s = stats.get(current)!;
    const t0 = performance.now();
    const k0 = trips;
    const out = await origCheck(c, r);
    s.checkMs += performance.now() - t0;
    s.checkTrips += trips - k0;
    return out;
};
ContractAsync.DeliverTx = async (c: any, r: any) => {
    const s = stats.get(current)!;
    const t0 = performance.now();
    const k0 = trips;
    const out = await origDeliver(c, r);
    s.deliverMs += performance.now() - t0;
    s.deliverTrips += trips - k0;
    s.n++;
    return out;
};
const origDeliverNow = chain.deliverNow.bind(chain);
chain.deliverNow = async (signer, type, msg, fee) => {
    current = type === 'act' ? `act:${(msg as any).kind}${(msg as any).commit?.length ? '+commit' : ''}` : type;
    if (!stats.has(current)) stats.set(current, { n: 0, checkMs: 0, deliverMs: 0, checkTrips: 0, deliverTrips: 0 });
    return origDeliverNow(signer, type, msg, fee);
};

console.log(`setting up ${PLAYERS} delvers…`);
const players = Array.from({ length: PLAYERS }, (_, i) => new Player(chain, `bench.${i}`));
const chars: string[] = [];
for (const p of players) chars.push(await p.newDelver('cleric'));
stats.clear();

let endMs = 0;
const timeBlock = async () => {
    const t0 = performance.now();
    await chain.block();
    endMs += performance.now() - t0;
};
for (let r = 0; r < ROUNDS; r++) {
    const commits = [];
    for (let i = 0; i < PLAYERS; i++) commits.push(await players[i].act(chars[i], { kind: 'action', actionId: 'narthex.search_silt' }));
    await timeBlock();
    const reveals = [];
    for (let i = 0; i < PLAYERS; i++) {
        must(await commits[i][1]);
        reveals.push(players[i].reveal(commits[i][0]));
    }
    await timeBlock();
    for (const rv of reveals) must(await rv);
}

console.log(`\n${PLAYERS} players × ${ROUNDS} rounds of commit + reveal (silt search), in-process MemoryBackend\n`);
console.log('| tx | n | CheckTx ms | DeliverTx ms | CheckTx trips | DeliverTx trips | block-apply ms (2×Check + Deliver) |');
console.log('|---|---|---|---|---|---|---|');
for (const [k, s] of stats) {
    if (!s.n) continue;
    const c = s.checkMs / s.n;
    const d = s.deliverMs / s.n;
    console.log(`| ${k} | ${s.n} | ${c.toFixed(2)} | ${d.toFixed(2)} | ${(s.checkTrips / s.n).toFixed(1)} | ${(s.deliverTrips / s.n).toFixed(1)} | ${(2 * c + d).toFixed(2)} |`);
}
console.log(`\nEndBlock + harness per block: ${(endMs / (ROUNDS * 2)).toFixed(1)} ms`);
