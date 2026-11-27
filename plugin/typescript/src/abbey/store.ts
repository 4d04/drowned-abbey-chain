/* Transactional view over plugin state: batched reads, buffered writes flushed once per tx/EndBlock. */

import { canonicalJSON } from '@abbey/rules';

export interface Entry {
    key: Uint8Array;
    value: Uint8Array;
}

/** Where state actually lives: the Canopy FSM over the plugin socket, or a Map in tests. */
export interface Backend {
    read(keys: Uint8Array[]): Promise<(Uint8Array | null)[]>;
    /**
     * Entries under a prefix in key order (reversed if asked), at most `limit`. Without a limit the core still stops at
     * 5,000 entries (fsm/state.go defaultPluginStateReadLimit). Ranges can't start mid-prefix, so paging is from the front.
     */
    range(prefix: Uint8Array, limit?: number, reverse?: boolean): Promise<Entry[]>;
    write(sets: Entry[], deletes: Uint8Array[]): Promise<void>;
    /** keys and prefix ranges in one round trip */
    readBatch(keys: Uint8Array[], prefixes: Uint8Array[]): Promise<[(Uint8Array | null)[], Entry[][]]>;
}

const hex = (b: Uint8Array): string => Buffer.from(b).toString('hex');
const unhex = (s: string): Uint8Array => new Uint8Array(Buffer.from(s, 'hex'));

/** A rejected transaction: nothing is written and the message is returned to the submitter. */
export class TxError extends Error {}

export class Store {
    private readonly cache = new Map<string, Uint8Array | null>();
    private readonly dirty = new Map<string, Uint8Array | null>(); // null = delete
    private readonly ranges = new Map<string, Entry[]>(); // backend range results fetched ahead, by prefix
    private readonly backend: Backend;

    constructor(backend: Backend) {
        this.backend = backend;
    }

    async getMany(keys: Uint8Array[]): Promise<(Uint8Array | null)[]> {
        const missing = [...new Set(keys.map(hex).filter((k) => !this.cache.has(k)))];
        if (missing.length) {
            const vals = await this.backend.read(missing.map(unhex));
            missing.forEach((k, i) => this.cache.set(k, vals[i] && vals[i]!.length ? vals[i] : null));
        }
        return keys.map((k) => this.cache.get(hex(k)) ?? null);
    }

    /** Fetch keys and ranges together (one round trip); later get()/range() calls are served from the cache. */
    async fetch(keys: Uint8Array[], prefixes: Uint8Array[]): Promise<void> {
        const missing = [...new Set(keys.map(hex).filter((k) => !this.cache.has(k)))];
        const pending = [...new Set(prefixes.map(hex).filter((p) => !this.ranges.has(p)))];
        if (!missing.length && !pending.length) return;
        const [vals, rs] = await this.backend.readBatch(missing.map(unhex), pending.map(unhex));
        missing.forEach((k, i) => this.cache.set(k, vals[i] && vals[i]!.length ? vals[i] : null));
        pending.forEach((p, i) => this.ranges.set(p, rs[i]));
    }

    async get(key: Uint8Array): Promise<Uint8Array | null> {
        return (await this.getMany([key]))[0];
    }

    set(key: Uint8Array, value: Uint8Array): void {
        const k = hex(key);
        this.cache.set(k, value);
        this.dirty.set(k, value);
    }

    del(key: Uint8Array): void {
        const k = hex(key);
        this.cache.set(k, null);
        this.dirty.set(k, null);
    }

    /** Every entry under a prefix, with this store's pending writes applied, sorted by key bytes. */
    async range(prefix: Uint8Array): Promise<Entry[]> {
        const p = hex(prefix);
        const merged = new Map<string, Uint8Array | null>();
        for (const e of this.ranges.get(p) ?? (await this.backend.range(prefix))) merged.set(hex(e.key), e.value);
        for (const [k, v] of this.dirty) if (k.startsWith(p)) merged.set(k, v);
        return [...merged.entries()]
            .filter((e): e is [string, Uint8Array] => e[1] !== null && e[1].length > 0)
            .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
            .map(([k, v]) => ({ key: unhex(k), value: v }));
    }

    /**
     * The first `limit` entries under a prefix (the last, if reverse), with this store's pending writes applied. Meant for
     * reading a sweep's page before changing it: a pending delete can leave the page short of entries the backend has past it.
     */
    async page(prefix: Uint8Array, limit: number, reverse = false): Promise<Entry[]> {
        const p = hex(prefix);
        const merged = new Map<string, Uint8Array | null>();
        for (const e of await this.backend.range(prefix, limit, reverse)) merged.set(hex(e.key), e.value);
        for (const [k, v] of this.dirty) if (k.startsWith(p)) merged.set(k, v);
        const out = [...merged.entries()]
            .filter((e): e is [string, Uint8Array] => e[1] !== null && e[1].length > 0)
            .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
        if (reverse) out.reverse();
        return out.slice(0, limit).map(([k, v]) => ({ key: unhex(k), value: v }));
    }

    async getJSON<T>(key: Uint8Array): Promise<T | null> {
        const v = await this.get(key);
        return v ? (JSON.parse(Buffer.from(v).toString('utf8')) as T) : null;
    }

    async getManyJSON<T>(keys: Uint8Array[]): Promise<(T | null)[]> {
        return (await this.getMany(keys)).map((v) => (v ? (JSON.parse(Buffer.from(v).toString('utf8')) as T) : null));
    }

    setJSON(key: Uint8Array, value: unknown): void {
        this.set(key, new Uint8Array(Buffer.from(canonicalJSON(value), 'utf8')));
    }

    /** Write everything in one round trip, in key order so every node sends identical requests. */
    async flush(): Promise<void> {
        const keys = [...this.dirty.keys()].sort();
        const sets: Entry[] = [];
        const deletes: Uint8Array[] = [];
        for (const k of keys) {
            const v = this.dirty.get(k)!;
            if (v === null) deletes.push(unhex(k));
            else sets.push({ key: unhex(k), value: v });
        }
        this.dirty.clear();
        if (sets.length || deletes.length) await this.backend.write(sets, deletes);
    }

    /** The pending writes, for determinism tests. */
    pending(): [string, string | null][] {
        return [...this.dirty.entries()].sort().map(([k, v]) => [k, v ? hex(v) : null]);
    }
}

/** In-memory backend for tests and replays. */
export class MemoryBackend implements Backend {
    readonly data = new Map<string, Uint8Array>();
    readonly log: string[] = []; // every write batch, for determinism comparisons

    async read(keys: Uint8Array[]): Promise<(Uint8Array | null)[]> {
        return keys.map((k) => this.data.get(hex(k)) ?? null);
    }

    async range(prefix: Uint8Array, limit = 5000, reverse = false): Promise<Entry[]> {
        const p = hex(prefix);
        const es = [...this.data.entries()].filter(([k]) => k.startsWith(p)).sort((a, b) => (a[0] < b[0] ? -1 : 1));
        if (reverse) es.reverse();
        return es.slice(0, limit).map(([k, v]) => ({ key: unhex(k), value: v }));
    }

    async readBatch(keys: Uint8Array[], prefixes: Uint8Array[]): Promise<[(Uint8Array | null)[], Entry[][]]> {
        return [await this.read(keys), await Promise.all(prefixes.map((p) => this.range(p)))];
    }

    async write(sets: Entry[], deletes: Uint8Array[]): Promise<void> {
        for (const s of sets) this.data.set(hex(s.key), s.value);
        for (const d of deletes) this.data.delete(hex(d));
        this.log.push(JSON.stringify([sets.map((s) => [hex(s.key), hex(s.value)]), deletes.map(hex)]));
    }
}
