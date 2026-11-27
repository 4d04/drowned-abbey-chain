/* Boss-room crowd benchmark: one attacker in the Sanctum with N other characters, idle or all in the fight. */
import { Chain, G, K, Player, R, editRoom, must, teleport } from './harness.ts';

async function run(n: number, idle: boolean): Promise<string> {
    const chain = new Chain();
    const p = new Player(chain, 'p');
    const c = await p.newDelver('fighter');
    await chain.blocks(R.LIE_LOW_BLOCKS + 5);
    await teleport(chain, c, 12, { lastActionHeight: chain.height, hp: 999, maxHp: 999 });
    const tmpl = (await p.char(c)) as any;
    const s = chain.store();
    for (let i = 0; i < n; i++) {
        const id = Buffer.from(K.u64(i)).toString('hex') + 'aa'.repeat(8);
        const ch = { ...tmpl.char, id, owner: 'bb'.repeat(20), hp: 999, maxHp: 999, lastActionHeight: idle ? 0 : chain.height };
        s.setJSON(K.KeyChar(id), { ...tmpl, char: ch, pending: null });
        await G.moveIndex(s, id, null, ch);
    }
    await s.flush();
    let ms = 0;
    let bytes = 0;
    const read = chain.mem.read.bind(chain.mem);
    chain.mem.read = async (keys: Uint8Array[]) => {
        const v = await read(keys);
        for (const x of v) bytes += x?.length ?? 0;
        return v;
    };
    let idx = 0;
    const range = chain.mem.range.bind(chain.mem);
    chain.mem.range = async (prefix: Uint8Array, limit?: number, reverse?: boolean) => {
        const es = await range(prefix, limit, reverse);
        for (const e of es) idx += e.key.length + e.value.length;
        return es;
    };
    for (let k = 0; k < 6; k++) {
        await editRoom(chain, 12, (r) => (r.counters['aoe:0'] = 2)); // every measured exchange brings the Wail
        const t0 = performance.now();
        const [rid, committed] = await p.act(c, { kind: 'attack', target: '0' });
        await chain.block();
        must(await committed);
        const r = p.reveal(rid);
        await chain.block();
        must(await r);
        ms += performance.now() - t0;
    }
    return `${String(n).padStart(4)} ${idle ? 'idle    ' : 'fighting'}: ${(bytes / 6 / 1024).toFixed(1).padStart(7)} KB records + ${(idx / 6 / 1024).toFixed(1).padStart(5)} KB index, ${(ms / 6).toFixed(1).padStart(5)} ms per commit+reveal`;
}

for (const n of [0, 100, 1000]) for (const idle of [true, false]) console.log(await run(n, idle));
