/* Game configuration (fixed per release, SPEC §6.8), mutable params (SPEC §6.6), and the shapes of game records. */

import { createHash } from 'crypto';
import { type Character, type DieRoll, type GameEvent, type Intent, type Item, type LevelState, HISTORY_SECONDS, REVEAL_SECONDS, blocksFor } from '@abbey/rules';

const derive = (label: string): Uint8Array => new Uint8Array(createHash('sha256').update(label).digest().subarray(0, 20));

/** Constants every validator must agree on. Changing any of them needs a release and an activation height. */
export const GAME = {
    treasury: derive('abbey.treasury.v1'),
    faucet: derive('abbey.faucet.v1'),
    revealWindow: blocksFor(REVEAL_SECONDS), // R: blocks to reveal before the roll is forfeited (~1 min)
    beaconRetention: blocksFor(HISTORY_SECONDS),
    rollRetention: blocksFor(HISTORY_SECONDS), // resolved rolls are kept as long as beacons, so any kept roll can still be verified
    /** level id -> activation height (SPEC §5.4) */
    activation: new Map<number, number>([[1, 1]]),
    /**
     * Who may sign set_params. Fixed per release; ABBEY_PARAMS_AUTHORITY (hex) overrides it for localnets only —
     * every validator must run the same value or they diverge on set_params.
     */
    paramsAuthority: new Uint8Array(Buffer.from(process.env.ABBEY_PARAMS_AUTHORITY || '00'.repeat(20), 'hex'))
};

export interface Params {
    faucetEnabled: boolean;
    faucetAmount: string; // µGOLD (decimal string: exact beyond 2^53)
    faucetCooldownBlocks: number; // 0 = no limit; in blocks (500ms each: 7200 = 1 hour)
    faucetMaxPerAccount: string; // µGOLD lifetime, "0" = no limit
    faucetMaxPerBlock: number; // claims per block chain-wide, 0 = no limit
    fees: Record<string, string>; // message type -> minimum fee in µGOLD; absent = the core send fee
    maxTxPerBlock: number; // game txs per block (set_params exempt); later ones fail "block is full" and are resubmitted
    sweepPerBlock: number; // EndBlock items per sweep per block (forfeits, ferries, flood), the rest carry over
}

export const DEFAULT_PARAMS: Readonly<Params> = Object.freeze({
    faucetEnabled: true,
    faucetAmount: '100000000', // 100 GOLD
    faucetCooldownBlocks: 0,
    faucetMaxPerAccount: '0',
    faucetMaxPerBlock: 0,
    fees: Object.freeze({}) as Record<string, string>,
    maxTxPerBlock: 150, // headroom: a 400-tx block took 0.8–1.1s to build vs a ~0.9s propose window at 6s blocks (M2 report, findings 9–10)
    sweepPerBlock: 100
});

export const MESSAGE_TYPES = [
    'faucet_claim', 'set_params', 'create_character', 'assign_stats', 'enter_dungeon', 'act', 'reveal',
    'give', 'extract', 'shop_buy', 'shop_sell', 'stash_move', 'party_set'
] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

// ---- records (canonical JSON in state)

export interface CharRecord {
    char: Character;
    rolled: number[] | null; // stat roll, until assigned
    actionNonce: number; // rollId = sha256(charId ‖ u64be(actionNonce))
    pending: string | null; // rollId of the pending roll: the character is locked until it resolves
}

export interface AcctRecord {
    stash: Item[];
    chars: string[];
    nextChar: number;
    nextItem: number;
}

export interface RollRecord {
    id: string;
    kind: 'stats' | 'act';
    owner: string;
    charId: string;
    intent: Intent | null;
    commit: string;
    committedAt: number;
    expiresAt: number;
    reservation: string | null; // hex key of a take reservation
    resolved: null | {
        height: number;
        outcome: 'resolved' | 'fizzled' | 'forfeited';
        secret: string | null;
        beacon: string | null;
        dice: DieRoll[];
        success: boolean | null;
        fizzled?: string;
        events?: GameEvent[];
    };
}

export interface FaucetRecord {
    lastClaimHeight: number;
    totalClaimed: string;
    count: number;
}

export interface BeaconRecord {
    height: number;
    value: string;
    proposer: string;
    txCount: number;
}

/** Gold the treasury owes (whole GOLD): carried, room pools, piles, caches and item escrow (SPEC §6.3). */
export interface Ledger {
    outstanding: number;
}

export interface LevelRecord extends LevelState {
    activatedAt: number;
    /** set while the season's flood washes characters out, a page per block; the level is closed until it's done */
    flood?: { since: number; returned: number; swept: number };
}
