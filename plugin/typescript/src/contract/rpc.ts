/* Read-only plugin RPC (SPEC §7.8). Every route takes ?height= for a consistent snapshot (0 = latest committed). */

import * as http from 'http';
import Long from 'long';

import { type Intent, needsRoll, oddsFor, options } from '@abbey/rules';
import { type BeaconRecord, type FaucetRecord, type RollRecord, GAME } from '../abbey/config.js';
import { MICRO, balance } from '../abbey/core.js';
import * as G from '../abbey/game.js';
import * as K from '../abbey/keys.js';
import { type Backend, type Entry, Store } from '../abbey/store.js';
import { Plugin, PLUGIN_BUILD } from './plugin.js';

/** Detached reads at a fixed height: not tied to any in-flight FSM request. */
class QueryBackend implements Backend {
    private readonly plugin: Plugin;
    private readonly height: number;
    constructor(plugin: Plugin, height: number) {
        this.plugin = plugin;
        this.height = height;
    }
    async read(keys: Uint8Array[]): Promise<(Uint8Array | null)[]> {
        const [resp, err] = await this.plugin.queryState(this.height, { keys: keys.map((key, i) => ({ queryId: Long.fromNumber(i + 1), key })) });
        if (err) throw new Error(err.msg);
        const out: (Uint8Array | null)[] = keys.map(() => null);
        for (const r of resp?.results || []) {
            const v = r.entries?.[0]?.value;
            out[Long.fromValue(r.queryId).toNumber() - 1] = v && v.length ? v : null;
        }
        return out;
    }
    async range(prefix: Uint8Array, limit = 0, reverse = false): Promise<Entry[]> {
        const [resp, err] = await this.plugin.queryState(this.height, { ranges: [{ queryId: Long.fromNumber(1), prefix, limit: Long.fromNumber(limit), reverse }] });
        if (err) throw new Error(err.msg);
        return resp?.results?.[0]?.entries || [];
    }
    async readBatch(keys: Uint8Array[], prefixes: Uint8Array[]): Promise<[(Uint8Array | null)[], Entry[][]]> {
        return [await this.read(keys), await Promise.all(prefixes.map((p) => this.range(p)))];
    }
    async write(): Promise<void> {
        throw new Error('read-only');
    }
}

export function StartRPCServer(plugin: Plugin): void {
    const addr = plugin.config.rpcAddress;
    if (!addr) {
        console.log('plugin RPC server disabled (no rpcAddress configured)');
        return;
    }
    const server = http.createServer((req, res) => {
        // read-only public data: any web page may read it (the browser client is served from another origin)
        res.setHeader('Access-Control-Allow-Origin', '*');
        if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Max-Age', '600');
            res.statusCode = 204;
            res.end();
            return;
        }
        route(new Store(new QueryBackend(plugin, Number(new URL(req.url || '/', 'http://x').searchParams.get('height') || 0))), req.url || '/')
            .then(([status, body]) => writeJSON(res, status, body))
            .catch((e) => writeJSON(res, 500, { error: String((e as Error).message ?? e) }));
    });
    const idx = addr.lastIndexOf(':');
    const host = idx >= 0 ? addr.slice(0, idx) : '127.0.0.1';
    const port = idx >= 0 ? Number(addr.slice(idx + 1)) : Number(addr);
    server.listen(port, host, () => console.log(`plugin RPC server (${PLUGIN_BUILD}) listening on ${addr}`));
    server.on('error', (err) => console.log(`plugin RPC server error: ${err.message}`));
}

type Reply = [number, unknown];
const hexBytes = (s: string | null): Uint8Array => new Uint8Array(Buffer.from((s || '').replace(/^0x/, ''), 'hex'));
const notFound: Reply = [404, { error: 'not found' }];

/** Route handling over any Store, so tests can drive it with a MemoryBackend. */
export async function route(store: Store, rawUrl: string): Promise<Reply> {
    const url = new URL(rawUrl, 'http://localhost');
    const q = (k: string) => url.searchParams.get(k);
    switch (url.pathname) {
        case '/abbey/levels': {
            const levels = await G.activeLevels(store);
            return [200, levels.map((l) => ({ ...l, contentHash: G.content.levels.get(l.id)?.contentHash }))];
        }
        case '/abbey/world': {
            const lvl = await G.getLevel(store, Number(q('level') || 1));
            if (!lvl) return notFound;
            const rooms = [];
            for (const r of G.content.levels.get(lvl.id)!.def.rooms) rooms.push(await G.getRoom(store, lvl, r.id));
            return [200, { level: lvl, rooms }];
        }
        case '/abbey/room': {
            const lvl = await G.getLevel(store, Number(q('level') || 1));
            if (!lvl) return notFound;
            const roomId = Number(q('room') || 0);
            const ids = (await store.range(K.PrefixWhere(lvl.id, roomId))).map((e) => K.lastSegmentHex(e.key));
            const chars = [];
            for (const id of ids) chars.push((await G.getCharRec(store, id)).char);
            return [200, { room: await G.getRoom(store, lvl, roomId), characters: chars }];
        }
        case '/abbey/character': {
            const rec = await store.getJSON(K.KeyChar(q('id') || ''));
            return rec ? [200, rec] : notFound;
        }
        case '/abbey/account': {
            const addr = hexBytes(q('address'));
            const acct = await G.getAcct(store, addr);
            const chars = [];
            for (const id of acct.chars) chars.push((await G.getCharRec(store, id)).char);
            return [200, { ...acct, characters: chars, balance: (await balance(store, addr)).toString() }];
        }
        case '/abbey/options': {
            // the legal options for a character right now, with exact odds and whether each needs commit-reveal
            const rec = await G.getCharRec(store, q('char') || '');
            if (rec.char.status !== 'delving') return [200, { status: rec.char.status, options: [] }];
            const ls = await G.loadScene({ store, height: Number(q('at') || 0) }, rec, null);
            const out: { intent: Intent; needsRoll: boolean; odds: unknown }[] = [];
            for (const intent of options(G.content, ls.scene, rec.char.id)) {
                // intents that touch other rooms need them loaded to probe precisely
                const scene = intent.kind === 'action' || intent.kind === 'move' ? (await G.loadScene({ store, height: ls.scene.height }, rec, intent)).scene : ls.scene;
                out.push({ intent, needsRoll: needsRoll(G.content, scene, rec.char.id, intent), odds: oddsFor(G.content, scene, rec.char.id, intent) });
            }
            return [200, { status: rec.char.status, pending: rec.pending, options: out }];
        }
        case '/abbey/roll': {
            const roll = await store.getJSON<RollRecord>(K.KeyRoll(q('id') || ''));
            return roll ? [200, roll] : notFound;
        }
        case '/abbey/beacon': {
            const at = q('at');
            const b = await store.getJSON<BeaconRecord>(at ? K.KeyBeacon(Number(at)) : K.KeyBeaconLatest());
            return b ? [200, b] : notFound;
        }
        case '/abbey/treasury': {
            const levels = await G.activeLevels(store);
            return [200, {
                address: Buffer.from(GAME.treasury).toString('hex'),
                balance: (await balance(store, GAME.treasury)).toString(),
                free: await G.treasuryFree(store),
                ledger: await G.getLedger(store),
                budgets: levels.map((l) => ({ levelId: l.id, season: l.season, reserved: l.budgetReserved, paid: l.budgetPaid, scaleBp: l.scaleBp }))
            }];
        }
        case '/abbey/stats': {
            // the numbers to watch for liveness (M2 report, finding 10): fullness of recent blocks, sweep backlogs, crowds
            const params = await G.getParams(store);
            const latest = await store.getJSON<BeaconRecord>(K.KeyBeaconLatest());
            const h = latest?.height ?? 0;
            const n = Math.min(Number(q('blocks') || 20), 200, h);
            const beacons = await store.getManyJSON<BeaconRecord>(Array.from({ length: n }, (_, i) => K.KeyBeacon(h - i)));
            const txs = beacons.map((b) => b?.txCount ?? 0);
            const due = async (prefix: Uint8Array) => {
                const page = await store.page(prefix, params.sweepPerBlock + 1);
                const d = page.filter((e) => K.segmentU64(e.key, 2) <= h).length;
                return d > params.sweepPerBlock ? `>${params.sweepPerBlock}` : d;
            };
            const levels = [];
            for (const l of await G.activeLevels(store)) {
                const rooms = (await store.range(K.PrefixRoomCount(l.id)))
                    .map((e) => ({ room: K.segmentU64(e.key, 3), ...(JSON.parse(Buffer.from(e.value).toString()) as G.RoomCount) }))
                    .filter((r) => r.standing + r.downed > 0)
                    .sort((a, b) => b.standing + b.downed - (a.standing + a.downed));
                levels.push({ levelId: l.id, season: l.season, flood: l.flood ?? null, delving: rooms.reduce((s, r) => s + r.standing + r.downed, 0), busiestRooms: rooms.slice(0, 5) });
            }
            return [200, {
                height: h,
                maxTxPerBlock: params.maxTxPerBlock,
                sweepPerBlock: params.sweepPerBlock,
                recentBlocks: { blocks: n, txsPerBlock: txs, max: Math.max(0, ...txs), full: txs.filter((t) => t >= params.maxTxPerBlock).length },
                backlog: { forfeitsDue: await due(K.PrefixExpiryAll()), ferriesDue: await due(K.PrefixFerryAll()) },
                levels
            }];
        }
        case '/abbey/params':
            return [200, { params: await G.getParams(store), paramsAuthority: Buffer.from(GAME.paramsAuthority).toString('hex') }];
        case '/abbey/faucet': {
            const addr = q('address');
            const rec = addr ? await store.getJSON<FaucetRecord>(K.KeyFaucet(hexBytes(addr))) : null;
            return [200, {
                address: Buffer.from(GAME.faucet).toString('hex'),
                balance: (await balance(store, GAME.faucet)).toString(),
                balanceGold: Number((await balance(store, GAME.faucet)) / MICRO),
                record: rec
            }];
        }
    }
    return notFound;
}

function writeJSON(res: http.ServerResponse, status: number, body: unknown): void {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
}
