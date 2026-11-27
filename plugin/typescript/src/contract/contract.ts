/* The Drowned Abbey contract: message registry, CheckTx (stateless + fees), DeliverTx and EndBlock dispatch. */

import Long from 'long';

import { types } from '../proto/types.js';
import { fileDescriptorProtos } from '../proto/descriptors.js';
import { type MessageType, GAME, MESSAGE_TYPES } from '../abbey/config.js';
import { chargeFee, sendFee, toBig } from '../abbey/core.js';
import { endBlock, foldTx } from '../abbey/endblock.js';
import * as G from '../abbey/game.js';
import { ABBEY_PREFIX } from '../abbey/keys.js';
import { type Backend, type Entry, Store, TxError } from '../abbey/store.js';
import { type IPluginError, ErrAbbey, ErrInvalidAddress, ErrInvalidMessageCast, ErrTxFeeBelowStateLimit } from './error.js';
import type { Config, Plugin } from './plugin.js';
import { FromAny } from './plugin.js';

/** message type name (tx.messageType) -> protobuf message name */
export const MESSAGES: Record<MessageType, string> = {
    faucet_claim: 'MessageFaucetClaim',
    set_params: 'MessageSetParams',
    create_character: 'MessageCreateCharacter',
    assign_stats: 'MessageAssignStats',
    enter_dungeon: 'MessageEnterDungeon',
    act: 'MessageAct',
    reveal: 'MessageReveal',
    give: 'MessageGive',
    extract: 'MessageExtract',
    shop_buy: 'MessageShopBuy',
    shop_sell: 'MessageShopSell',
    stash_move: 'MessageStashMove',
    party_set: 'MessagePartySet'
};
const BY_PROTO = new Map(Object.entries(MESSAGES).map(([k, v]) => [v, k as MessageType]));
export const EVENT_TYPE_URL = 'type.googleapis.com/types.AbbeyEvent';

// NOTE: 'send' is intentionally NOT registered so the core handles native transfers (SPEC §7.6)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ContractConfig: any = {
    name: 'drowned_abbey',
    id: 1,
    version: 2,
    supportedTransactions: [...MESSAGE_TYPES],
    transactionTypeUrls: MESSAGE_TYPES.map((t) => `type.googleapis.com/types.${MESSAGES[t]}`),
    eventTypeUrls: [EVENT_TYPE_URL],
    customStatePrefixes: [ABBEY_PREFIX],
    fileDescriptorProtos
};

/** State over the plugin socket, for one in-flight FSM request. */
class PluginBackend implements Backend {
    private readonly c: Contract;
    constructor(c: Contract) {
        this.c = c;
    }
    async read(keys: Uint8Array[]): Promise<(Uint8Array | null)[]> {
        const [resp, err] = await this.c.plugin.StateRead(this.c, { keys: keys.map((key, i) => ({ queryId: Long.fromNumber(i + 1), key })) });
        if (err || resp?.error) throw new BackendError(err || resp.error);
        const out: (Uint8Array | null)[] = keys.map(() => null);
        for (const r of resp?.results || []) {
            const v = r.entries?.[0]?.value;
            out[Long.fromValue(r.queryId).toNumber() - 1] = v && v.length ? v : null;
        }
        return out;
    }
    async range(prefix: Uint8Array, limit = 0, reverse = false): Promise<Entry[]> {
        const [resp, err] = await this.c.plugin.StateRead(this.c, { ranges: [{ queryId: Long.fromNumber(1), prefix, limit: Long.fromNumber(limit), reverse }] });
        if (err || resp?.error) throw new BackendError(err || resp.error);
        return (resp?.results?.[0]?.entries || []).map((e: Entry) => ({ key: e.key, value: e.value }));
    }
    async readBatch(keys: Uint8Array[], prefixes: Uint8Array[]): Promise<[(Uint8Array | null)[], Entry[][]]> {
        // one StateRead: keys get query ids 1..n, ranges n+1..n+m
        const [resp, err] = await this.c.plugin.StateRead(this.c, {
            keys: keys.map((key, i) => ({ queryId: Long.fromNumber(i + 1), key })),
            ranges: prefixes.map((prefix, j) => ({ queryId: Long.fromNumber(keys.length + j + 1), prefix }))
        });
        if (err || resp?.error) throw new BackendError(err || resp.error);
        const vals: (Uint8Array | null)[] = keys.map(() => null);
        const ranges: Entry[][] = prefixes.map(() => []);
        for (const r of resp?.results || []) {
            const id = Long.fromValue(r.queryId).toNumber() - 1;
            if (id < keys.length) {
                const v = r.entries?.[0]?.value;
                vals[id] = v && v.length ? v : null;
            } else ranges[id - keys.length] = (r.entries || []).map((e: Entry) => ({ key: e.key, value: e.value }));
        }
        return [vals, ranges];
    }
    async write(sets: Entry[], deletes: Uint8Array[]): Promise<void> {
        const [resp, err] = await this.c.plugin.StateWrite(this.c, { sets, deletes: deletes.map((key) => ({ key })) });
        if (err || resp?.error) throw new BackendError(err || resp.error);
    }
}

class BackendError extends Error {
    readonly pluginError: IPluginError;
    constructor(e: IPluginError) {
        super(e.msg);
        this.pluginError = e;
    }
}

export class Contract {
    Config: Config;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    FSMConfig: any;
    plugin: Plugin;
    fsmId: Long;
    /** tests swap this for a MemoryBackend */
    backend: Backend;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(config: Config, fsmConfig: any, plugin: Plugin, fsmId: Long) {
        this.Config = config;
        this.FSMConfig = fsmConfig;
        this.plugin = plugin;
        this.fsmId = fsmId;
        this.backend = new PluginBackend(this);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    Genesis(_request: any): any {
        return {};
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    BeginBlock(_request: any): any {
        return {};
    }
}

const len = (b: Uint8Array | undefined | null): number => (b ? b.length : 0);

/** Stateless shape checks; null = fine. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function checkShape(type: MessageType, m: any): string | null {
    if (len(m.address) !== 20) return 'address must be 20 bytes';
    const charId = () => (len(m.charId) === 16 ? null : 'charId must be 16 bytes');
    switch (type) {
        case 'faucet_claim':
            return null;
        case 'set_params':
            return m.paramsJson && m.paramsJson.length <= 4096 ? null : 'paramsJson required (≤4096 chars)';
        case 'create_character':
            return len(m.commit) === 32 ? null : 'commit must be 32 bytes';
        case 'assign_stats':
            return charId() ?? ((m.permutation || []).length === 6 ? null : 'permutation must have 6 entries');
        case 'act':
            return charId() ?? ([0, 32].includes(len(m.commit)) ? null : 'commit must be empty or 32 bytes');
        case 'reveal':
            return len(m.rollId) === 32 && len(m.secret) === 32 ? null : 'rollId and secret must be 32 bytes';
        case 'give':
            return charId() ?? (len(m.toCharId) === 16 ? null : 'toCharId must be 16 bytes');
        case 'shop_buy':
            return charId() ?? (m.template ? null : 'template required');
        case 'extract':
        case 'enter_dungeon':
        case 'shop_sell':
        case 'stash_move':
            return charId();
        case 'party_set':
            return charId() ?? ([0, 16].includes(len(m.with)) ? null : 'with must be empty or 16 bytes');
    }
}

function decodeTx(request: { tx?: { msg?: unknown } }): [MessageType, unknown] | IPluginError {
    const [msg, name, err] = FromAny(request.tx?.msg);
    if (err) return err;
    const type = name ? BY_PROTO.get(name) : undefined;
    if (!msg || !type) return ErrInvalidMessageCast();
    return [type, msg];
}

/** The minimum fee for a message: params override, else the governance send fee. faucet_claim is always 0. */
async function minFee(store: Store, type: MessageType): Promise<bigint> {
    if (type === 'faucet_claim') return 0n;
    const p = await G.getParams(store);
    return p.fees[type] !== undefined ? BigInt(p.fees[type]) : sendFee(store);
}

function toEvents(evs: G.AbbeyEventOut[]): unknown[] {
    return evs.map((e) =>
        types.Event.create({
            eventType: `abbey.${e.kind}`,
            custom: { msg: { type_url: EVENT_TYPE_URL, value: types.AbbeyEvent.encode(types.AbbeyEvent.create({ kind: e.kind, data: JSON.stringify(e.data) })).finish() } },
            address: e.address
        })
    );
}

function failure(e: unknown): { error: IPluginError } {
    if (e instanceof TxError) return { error: ErrAbbey(e.message) };
    if (e instanceof BackendError) return { error: e.pluginError };
    console.error('abbey: unexpected error', e);
    return { error: ErrAbbey(`internal: ${(e as Error).message}`) };
}

export class ContractAsync {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static async CheckTx(contract: Contract, request: any): Promise<any> {
        const decoded = decodeTx(request);
        if (!Array.isArray(decoded)) return { error: decoded };
        const [type, msg] = decoded;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = msg as any;
        if (len(m.address) !== 20) return { error: ErrInvalidAddress() };
        const shape = checkShape(type, m);
        if (shape) return { error: ErrAbbey(shape) };
        try {
            const fee = toBig(request.tx?.fee);
            const store = new Store(contract.backend);
            await G.prefetch(store, m.address, contract.Config.ChainId, m);
            const min = await minFee(store, type);
            // the core never collects plugin-message fees, so a fee on a free message would be signed and silently lost
            if (type === 'faucet_claim' && fee !== 0n) return { error: ErrAbbey('faucet_claim must have fee 0') };
            if (fee < min) return { error: ErrTxFeeBelowStateLimit() };
            // cheap state checks so most bad txs are refused at submission (SPEC §11 decision 10). Not a full dry run:
            // the core runs CheckTx twice per tx while applying a block, so it must stay at one prefetched read.
            await G.precheck({ store, height: Number(toBig(request.height)), chainId: contract.Config.ChainId, signer: m.address, fee, events: [] }, type, m);
        } catch (e) {
            return failure(e);
        }
        return { authorizedSigners: [m.address] };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static async DeliverTx(contract: Contract, request: any): Promise<any> {
        const decoded = decodeTx(request);
        if (!Array.isArray(decoded)) return { error: decoded };
        const [type, msg] = decoded;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = msg as any;
        const shape = checkShape(type, m);
        if (shape) return { error: ErrAbbey(shape) };
        const store = new Store(contract.backend);
        const tx: G.TxCtx = { store, height: Number(toBig(request.height)), chainId: contract.Config.ChainId, signer: m.address, fee: toBig(request.tx?.fee), events: [] };
        try {
            await G.prefetch(store, tx.signer, tx.chainId, m);
            await G.checkBlockRoom(store, type);
            if (tx.fee < (await minFee(store, type))) throw new TxError('fee below minimum');
            await chargeFee(store, tx.signer, tx.chainId, tx.fee);
            await dispatch(tx, type, m);
            await foldTx(tx, types.Transaction.encode(request.tx).finish());
            await store.flush();
        } catch (e) {
            return failure(e);
        }
        return { events: toEvents(tx.events) };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static async EndBlock(contract: Contract, request: any): Promise<any> {
        const store = new Store(contract.backend);
        const tx: G.TxCtx = { store, height: Number(toBig(request.height)), chainId: contract.Config.ChainId, signer: GAME.treasury, fee: 0n, events: [] };
        try {
            await endBlock(tx, request.proposerAddress || new Uint8Array());
            await store.flush();
        } catch (e) {
            // EndBlock must not fail silently: an error here halts the block, which beats diverging state
            return failure(e);
        }
        return { events: toEvents(tx.events) };
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function dispatch(tx: G.TxCtx, type: MessageType, m: any): Promise<void> {
    const b = (v: Uint8Array | undefined) => (v ? new Uint8Array(v) : new Uint8Array());
    switch (type) {
        case 'faucet_claim':
            return G.faucetClaim(tx);
        case 'set_params':
            return G.setParams(tx, m.paramsJson);
        case 'create_character':
            await G.createCharacter(tx, m.name || '', m.classId || '', b(m.commit));
            return;
        case 'assign_stats':
            return G.assignStatsTx(tx, b(m.charId), (m.permutation || []).map(Number));
        case 'enter_dungeon':
            return G.enterDungeonTx(tx, b(m.charId));
        case 'act':
            return G.act(tx, b(m.charId), {
                kind: m.kind || '', actionId: m.actionId, target: m.target, itemId: m.itemId, ability: m.ability,
                toLevel: Number(m.toLevel || 0), toRoom: Number(m.toRoom || 0), lootRef: m.lootRef
            }, b(m.commit));
        case 'reveal':
            return G.reveal(tx, b(m.rollId), b(m.secret));
        case 'give':
            return G.give(tx, b(m.charId), b(m.toCharId), m.itemId || '', toBig(m.gold));
        case 'extract':
            return G.extractTx(tx, b(m.charId));
        case 'shop_buy':
            return G.shopBuy(tx, b(m.charId), m.template, Number(m.qty || 1));
        case 'shop_sell':
            return G.shopSell(tx, b(m.charId), m.itemId || '');
        case 'stash_move':
            return G.stashMove(tx, b(m.charId), m.itemId || '', !!m.toStash);
        case 'party_set':
            return G.partySet(tx, b(m.charId), b(m.with));
    }
}
