/*
 * Game time (SPEC §7.2). Timers about players' real-time reactions (revealing a roll, rescuing a downed ally, lying low,
 * the Ferryman's "recently active", the bell, seasons, how long rolls stay verifiable) are written in seconds and turned
 * into blocks with the chain's block time. The block time is fixed per release, like every other rule: changing it is
 * this one constant (and an activation height), not a hunt through the content.
 */

/** The game chain's block time: 200ms (canopy-network/canopy#648's fast mode with roundRobinBlockIntervalMS 200; was 500ms until 2026-11-12, spike/FAST-BLOCKS-REPORT.md). */
export const BLOCK_MS = 200;

/** Whole blocks covering `seconds` (rounded up, so a window is never shorter than written). */
export const blocksFor = (seconds: number): number => Math.ceil((seconds * 1000) / BLOCK_MS);

/** Roughly how long `blocks` blocks take, for telling players. */
export const secondsFor = (blocks: number): number => (blocks * BLOCK_MS) / 1000;

/** How long a roll can wait for its reveal before it is forfeited (R). */
export const REVEAL_SECONDS = 60;
/** How long a downed character waits for a rescue before the Ferryman takes them. */
export const DOWNED_SECONDS = 120;
/** How long without acting before a character lies low (SPEC §3.3). */
export const LIE_LOW_SECONDS = 120;
/** "Recently active" for sharing a Ferryman's toll (SPEC §3.4). */
export const FERRY_ACTIVE_SECONDS = 600;
/** How long beacons, and so resolved rolls, are kept: a roll can be verified for this long. */
export const HISTORY_SECONDS = 6000;
