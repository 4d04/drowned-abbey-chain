# M2 Report: The Plugin

**Date:** 2026-11-04 · **Core:** canopy `83af2a0` (Go 1.26.0) · **Plugin:** `plugin/` (TS template + `@abbey/rules` 0.1.0) · **Level 1 contentHash:** `32551737e503cbed…`

## Verdict

**M2 is done (closed 2026-11-05).** Every functional exit criterion in SPEC §10 is met, and the liveness gap that load testing found (finding 6) is closed:
- every read an action makes is bounded;
- each block's work is capped (`maxTxPerBlock`, default 150);
- every EndBlock sweep is bounded with carry-over.

A 500-player overload with 1,500 characters in one room held 6s blocks with no failed actions (findings 7–10). Two core-side liveness risks remain; they're drafted for the Canopy team in [UPSTREAM-NOTES.md](UPSTREAM-NOTES.md) (finding 11).

The sections below are from the first M2 pass; the findings carry the follow-ups.
- **In-memory suite:** 27 tests passed at the first pass; 39 pass now. They drive the real CheckTx, DeliverTx and EndBlock handlers.
- **End to end:** 20 of 20 checks pass on the nested localnet. That's root chain 1 plus game chain 2 running this plugin, with one player going through every message type.

| Exit criterion | Result |
|---|---|
| All txs | ✅ 12 messages: `faucet_claim`, `set_params`, `create_character`, `assign_stats`, `enter_dungeon`, `act`, `reveal`, `give`, `extract`, `shop_buy`, `shop_sell`, `stash_move`. `act` carries every engine intent (see Changes) |
| Commit-reveal | ✅ Verified on chain:<br>• dice actions commit in block *h* and resolve on reveal in *h+1*;<br>• click-to-result was about 12.1s on chain;<br>• the dice can be recomputed from the event plus `/abbey/beacon`;<br>• unrevealed rolls are forfeited at *h+10* (committed at 44, resolved at 54). |
| Beacon | ✅ Written every EndBlock, chained, and pruned after 1,000 blocks |
| Treasury | ✅ Extraction is treasury → wallet, shop purchases are wallet → treasury, and sales pay the item's escrow.<br>The new `ledger.outstanding` tracks what the treasury owes, and tests recompute it from scratch.<br>New season budgets reserve only free treasury gold, and they top up if the treasury is funded late. |
| Level registry | ✅ Level 1 activates at its height with its `contentHash` and 700g budget, and the stairs to level 2 stay sealed.<br>Seasons run on chain: the warning bell, the flood, then a fresh season with a new budget. |
| Events | ✅ 17 kinds (`abbey.ActionResolved`, `abbey.CharacterFerried`, …) with payload `AbbeyEvent{kind, data}`.<br>**The core indexes them by address**, so `events-by-address` returned them on the localnet. |
| RPC | ✅ 11 read-only routes on `127.0.0.1:50010`, all with `?height=`. They include `/abbey/options`: the legal intents with exact odds and whether each needs commit-reveal. |
| Test suite | ✅ The 27 in-memory tests below and the 20 end-to-end checks |

## End-to-end run (`spike/client/src/m2.ts`, log in `spike/client/m2-run.log`)

All 20 checks passed:
- level 1 active (700g, contentHash);
- faucet from a zero-balance account with fee 0, and a fee on the faucet rejected;
- the stat roll revealed;
- entering the Narthex;
- options with odds;
- a plain move resolving at once;
- commit-reveal of the silt search, using the beacon of its commit block;
- a forfeit after 10 blocks;
- an attack with its counterattack;
- fleeing the Ossuary (2 tries);
- an exact treasury → wallet transfer on extract;
- shop_buy wallet → treasury;
- the authority enabling a faucet cooldown, with the next claim rejected;
- `set_params` rejected from a non-authority;
- the core indexing plugin events;
- the treasury invariant holding;
- the faucet balance matching.

On the nested chain, blocks averaged **6.63s** (6.02s median, 9.86s max) over 72 blocks, with the root chain at **20s** blocks. That's the same profile M0 measured under a 20s root. Two things weren't exercised on the chain itself, because they depend on the dice:
- **The Ferryman:** the character fled successfully, so it never went down.
- **A non-zero extraction:** the character found no gold, so the extract transferred 0.

Both are covered deterministically in the in-memory suite.

## Changes from the spec (SPEC.md updated)

1. **`move`, `take` and `stabilize` were folded into `act`.** `act` now carries any engine intent. The plugin asks the engine's `needsRoll`: dice-free intents resolve at once and must not carry a commit, and anything that rolls must. The client and the plugin share that decision.
2. **Game records are canonical JSON, not protobuf.** The engine's types are the schema. Sorted-key encoding keeps writes byte-identical across nodes, which is tested. Core records stay protobuf, with unknown fields preserved.
3. **New indexes** (needed to make §3.4 and §7.3 cheap):
   - `where/{level}/{room}`: room occupancy;
   - `active/{level}`: Ferryman toll recipients;
   - `ferry/{h}`: downed timers;
   - `reserve/…`: take reservations;
   - `ledger`: what the treasury owes.
4. **Budget top-up.** A level that activates before the treasury is funded, or whose treasury runs low, reserves more as gold arrives, and its loot scale rises. Anyone can top up the treasury with a core send (§6.8).
5. **Route shapes.** RPC routes take query parameters (`/abbey/room?level=1&room=2`). The feed is the core's `events-by-height` and `events-by-address` rather than a plugin route.

## Findings

1. **A real determinism bug, caught by the suite.** `getParams` shallow-copied the defaults, so `set_params` changed the shared default `fees` object in process memory. A `set_params` that later failed would still have left that node's defaults changed: silent divergence. Fixed by copying on every read and freezing the defaults. **Rule for the codebase: never mutate module-level data in a handler.**
2. **Failed transactions: decided, match the core** (SPEC §11, decision 10). The core rolls back every write of a failed tx, its own `send` included, leaves it out of the block, and deletes it from the mempool. So failed txs are free and take no block space.
   - CheckTx now refuses the common failures at submission with one prefetched read: not your character, no such character or roll, a roll already pending, the wrong place for extract/shop/stash, not the params authority, can't pay the fee, the faucet limits.
   - Full move legality still runs in DeliverTx.
   - A first version ran the whole handler as a dry run in CheckTx. That was dropped because **the core calls CheckTx twice per tx while applying a block**, so the dry run tripled the per-block work and helped stall the chain (finding 6).
3. **EndBlock sweeps aren't bounded yet.** Forfeits, ferries and the flood each process everything that's due. SPEC §7.4's `MAX_SWEEP_PER_BLOCK` with carry-over is still to do. A season flood with hundreds of characters on a level is the realistic risk.
4. **Root block time.** M0 left the root chain configured for 20s. The nested chain still made 6s blocks at the median, with the occasional ~8–10s block when it picks up a new root height. That's consistent with M0, and SPEC §12.1 still needs a multi-validator measurement.
5. **The M0 client scripts are retired.** `spike/client/src/chain.ts` now speaks the M2 messages (bytes fields signed raw and sent as hex, strings left as strings). `m0.ts` and `load.ts` target spike-only messages; point `ABBEY_PROTO` at `spike/abbey-plugin/src/proto/index.cjs` to rerun them against the spike plugin.

6. **Liveness: nothing bounds a block's work, so enough load halts the chain.** Under steady load (every player doing back-to-back commit-reveal searches):

   | Run | Tx/block | Block apply | Result |
   |---|---|---|---|
   | 100 players, first build (with the CheckTx dry run) | 100 | 2.0–2.3s | **Stalled at height 88**: every round missed the ~1.2s propose-vote window ("quorum not reached") |
   | 100 players, batched reads + cheap precheck | 100 | under 2s (below the core's slow-apply log threshold) | ✅ 32 blocks at 6.01s mean (6.27s max), 1,451 rolls, 0 failures (`spike/client/m2-load-100.log`) |
   | 200 players, same build | 200 | ~1.8s | **Stalled at height 148** |
   | 200 players, **10s blocks** (all phases 0.5×) | 185–200 | 2.1–2.7s | **Stalled at height 162**. Blocks of up to 84 txs had committed normally just before (`spike/client/m2-load-200-10s.log` is empty: the run was stopped once it stalled) |

   **Why longer blocks barely help.** Consensus doesn't fail on the total block time. It fails on individual phases:
   - **PROPOSE** (0.75s at 6s, 1.25s at 10s). Under load, new txs keep arriving, so the proposer's cached block is always stale and it rebuilds it inside the phase. That fails with "no valid message received from Proposer".
   - **PROPOSE_VOTE** (1.2s at 6s, 2.0s at 10s). The proposer validates its own block inside this phase. That fails with "quorum not reached".
   - A heavy block is applied up to three times per round: the mempool cache, the rebuild, and validation.
   - Every phase scales with block time, so **transactions per block scale with block time while transactions per second stay about the same**, at very roughly 15 game txs/s. A 10s chain fits more per block, but players wait longer and the chain halts at about the same load per second.
   - The real cost is DeliverTx at **~12ms per game tx**, about 4× M0's spike plugin. The cheap CheckTx is now negligible (~0.4ms/tx).

   - M0's spike plugin handled 200 tx/block. The M2 handlers do much more per tx (scene loads, the engine, indexes), and the plugin socket costs about 1ms per state round trip.
   - Batching cut round trips to roughly 3–5 per DeliverTx and 1 per CheckTx, and halved the block apply time.
   - The core caps the mempool but not the transactions in a block, so a full mempool of game txs can push a block past the consensus timeouts. Every node then keeps re-proposing the same block.
   - **This needs a bound in the plugin before mainnet**, and it's a design decision (SPEC §12, Q7).

7. **Liveness, root cause (follow-up).** The stalls in finding 6 were mostly a test artifact that exposed a real design issue. Every load run left its characters in the Narthex, 1,000 of them by the end, and every action loaded every character in the room, about 475KB per transaction through the socket.
   - **Fixes:**
     - the plugin loads only the room-mates an action can affect: a named target, or everyone when a room-wide effect can hit them;
     - the occupancy index records standing or downed, so the rogue's ally check counts instead of loading (new `Scene.othersStanding` in the rules);
     - faster serialization and key building, writing only changed characters, and a `needsRoll` probe without a scene clone;
     - per-message plugin logs are now behind `ABBEY_TRACE`.
   - **Plugin compute:** about 0.7ms per commit and 0.8ms per reveal in-process, down from 1.5–2.2ms.
   - **On a fresh chain at 6s blocks:**

   | Players | Tx/block | Blocks mean / p95 / max | Proposal build p50 / max | Failed rounds | Rolls |
   |---|---|---|---|---|---|
   | 200 | 200 | 6.01 / 6.77 / 6.85s | 0.12 / 0.40s | 0 | 1,681, 0 failures |
   | 300 | 300 | 6.19 / 6.70 / 11.20s | 0.08 / 0.69s | 0 | 2,019; 35 reveals failed "no such roll" (likely the load client's commit-confirmation heuristic sending reveals early; unverified) |

   - A per-block cap is still worth having as a safety net, sized well above 300.
   - The localnet databases from these runs are kept in `data-*/canopy.m2-load`.

8. **Idle characters lie low (follow-up, 2026-11-04).** Finding 7 still loaded everyone in a room when a room-wide effect could hit them, so a crowded boss room (the Tide Wail fires on every 3rd exchange) cost one character record per occupant.
   - **Rule (SPEC §3.3):** room-wide effects reach the actor and the characters standing in the room who acted (committed, resolved or entered) within `LIE_LOW_BLOCKS` = 20. Idle characters are passed over, which spares them the Wail and also denies them the signet's blessing. This lives in the rules (`roomTargets`), so the simulator and the plugin agree. Sim results are unchanged, since parties in the sim act every round.
   - **Plugin:** the occupancy index value is now `[standing|downed, u64be(lastActionHeight)]`, rewritten whenever that height changes. Committing a roll now sets `lastActionHeight`, so a player mid-roll doesn't lie low. Room-wide exchanges load only the occupants whose index says they're in the fight.
   - **Boss-room crowd benchmark** (`test/bench-crowd.ts`, in-process; bytes read per commit+reveal):

   | Others in the Sanctum | Character records | Occupancy index |
   |---|---|---|
   | 0 | 5.3 KB | 0.1 KB |
   | 1,000 idle | 5.3 KB | 110 KB |
   | 1,000 all fighting | 923 KB | 110 KB |

     The index scan is the term that remains linear, at about 110 bytes per occupant per exchange.
   - **The "no such roll" failures were the load client.** `waitTx` treats a tx as committed when tx-by-hash shows a height below the current one. But a mempool tx is stamped with the *next* height, so a tx that misses that block (likely at 300 tx/block) looks committed once the chain moves on. Waiting for the roll record moved the same failure to the next `act` ("a roll is already pending", 69 times), which confirmed the cause. The load client now confirms commits and reveals from plugin state (`/abbey/roll` exists, then shows `resolved`). **M3 client rule: confirm game actions from plugin state, not from tx-by-hash.** Polling twice a second per player also slowed blocks (7.7s mean), so the client polls once a second.
   - **Re-measured on a reset chain at 6s blocks** (`spike/client/m2-load-{300,200}-lielow.log`):

   | Players | Tx/block | Blocks mean / p95 / max | Rolls | Failures |
   |---|---|---|---|---|
   | 300 (fresh chain) | 300 | 5.98 / 6.63 / 6.65s | 2,230 | 0 |
   | 200 (300 already in the room) | 200 | 5.96 / 7.02 / 7.25s | 1,600 | 0 |

     The end-to-end script passes 20/20 on the reset chain (`spike/client/m2-run-lielow.log`). The databases from these runs are kept in `data-*/canopy.m2-fresh` (finding 7's runs) and `data-*/canopy.m2-lielow-1` (the first 200/300 runs here, with the old client).
   - **Still open:** a per-block tx cap as a safety net, and the bounded EndBlock sweeps (finding 3).

9. **Per-block cap and bounded sweeps (2026-11-05).** Both are built; the overload test found a liveness failure the cap can't prevent on its own.
   - **Built:**
     - `maxTxPerBlock` (param, default 250): later game txs fail "block is full" without loading anything (it reuses the block's tx accumulator, which is already prefetched). Failed txs pay nothing and the core drops them from its mempool, so clients resubmit. The mempool is fee-ordered, so a higher fee gets in first. `set_params` is exempt.
     - `sweepPerBlock` (param, default 100) bounds forfeits, ferries and the flood with carry-over, oldest first. Toll recipients come from an activity index keyed by last-action height, so a ferry reads about a dozen records, not the whole level. The flood is paged and closes the level until it's done (SPEC §7.4, §4.3).
     - Rule change: the flood now washes characters out to camp (healed, items kept, carried gold lost). It used to leave them delving at the Lychgate. The change was needed so that washed-out characters leave the level's index and paging can move forward.
     - Tests: plugin 37/37 (cap, forfeit and ferry carry-over, activity index, paged flood with the level closed), rules 66/66. The e2e passes 20/20 on a reset chain.
   - **Core facts that shape this:**
     - A range read can't start mid-prefix, and the core stops an unlimited range at 5,000 entries (`fsm/state.go`, `defaultPluginStateReadLimit`). Every sweep now reads a limited page from the front of its index.
     - Every proposal build applies **the whole mempool** (`controller/tx.go`, `GetTransactions(math.MaxUint64)`; txs past the block size run ephemerally). Any mempool change invalidates the cached proposal.
     - Each new root block resets the nested chain's round to 0 (`Reset BFT (NEW_COMMITTEE)`). So the nested round timeouts never grow, and a nested round has to finish within one root block interval. Widening PROPOSE to 2s made every round outlive the 6s root block and nothing committed.
   - **Overload runs (500 players, demand above the cap):**

   | Cap | Client on "block is full" | Result |
   |---|---|---|
   | 400 | resubmit at once | Blocks held at 400 txs, but there were 47s and 77s stalls. 400-tx builds took 0.8–1.1s against a ~0.9s propose window (`m2-load-500-cap.log`) |
   | 250 | resubmit at once | 59s and 84s stalls; 3,234 resubmits kept the mempool churning (`m2-load-500-cap250.log`) |
   | 250 | back off 6–12s | **Stuck for good at height 185.** The mempool kept the 250 valid txs it could hold, but by then building them took 1.0–1.1s, even after the load stopped. Only a node restart, which cleared the mempool, got it moving |

   - **Why 250 txs got slower:** about 1,500 characters had piled up in the Narthex over the runs. Each action still reads the room's whole occupancy index (about 110 bytes per occupant, finding 8), and CheckTx runs twice plus DeliverTx once per tx. So the cost per tx grows with room occupancy, and a cap sized on a quiet chain stops being safe as rooms fill.
   - **What it means:**
     1. Liveness needs the worst-case build of a full block (cap × the per-tx worst case) to fit the propose window, with margin. If a full block's build ever exceeds it, the chain wedges, because the core never builds a smaller proposal.
     2. Per-tx cost has to be O(1) in state size. The occupancy range is the last read that isn't: it's needed for a count (`othersStanding`) and for room-wide targets. A per-room counter plus an occupancy index keyed by recency (a reverse page of recent occupants only) would remove it.
     3. The core side is worth raising upstream: build proposals from a bounded prefix of the fee-ordered mempool, and don't reset nested rounds on every root block.

10. **Bounded room reads, cap 150, stats route (2026-11-05).** This fixes the wedge in finding 9.
   - **Every read an action makes is now bounded, however crowded the room:**
     - The occupancy index is keyed `where/{level}/{room}/{standing|downed}/{lastActionHeight}/{char}`.
     - A `roomcount/{level}/{room}` headcount replaces the room scan for presence (the rogue's ally check).
     - A named target is loaded directly.
     - A room-wide exchange reads a reverse page of `ROOM_WIDE_MAX + 1` standing entries, stopping at those who lie low.
   - **Rule (SPEC §3.3):** a room-wide effect reaches the actor plus at most **32** others, the most recently active. The rule lives in the rules (`roomTargets`), so the sim and the plugin agree. Sim balance is unchanged.
   - **Default cap lowered to 150.**
   - **`/abbey/stats`:** fullness of recent blocks against the cap, forfeit and ferry backlogs, characters per level, and the busiest rooms.
   - **Tests:** plugin 38/38 (new: a 40-strong crowd still in the fight, where the Wail hits and reads only the 32 most recent; a headcount/index audit in the session, Ferryman, flood and crowd tests; the stats route). Rules 67/67.
   - **Bench** (`test/bench-crowd.ts`, bytes per commit+reveal, Sanctum):

   | Others in the room | Records | Index |
   |---|---|---|
   | 100 or 1,000 idle | 5.3 KB | 3.9 KB |
   | 100 or 1,000 fighting | 34.7 KB | 3.9 KB |

     Before this change, 1,000 fighting cost 923 KB of records plus 115 KB of index.
   - **Overload re-run** on a fresh 6s chain at cap 150: three back-to-back 500-player runs, so the Narthex crowd grows to 1,500, the size that wedged finding 9's chain. The load client backs off 6–12s on "block is full" (`spike/client/m2-load-500-cap150-run{1,2,3}.log`).

   | Run | Crowd | Blocks mean / p95 / max | Proposal build p50 / p99 / max | Failed rounds | Rolls | Resubmits |
   |---|---|---|---|---|---|---|
   | 1 | 500 | 5.96 / 6.30 / 7.35s | 0.12 / 0.37 / 0.66s | 1 | 1,748 | 3,651 |
   | 2 | 1,000 | 5.98 / 6.71 / 6.86s | 0.12 / 0.46 / 0.68s | 0 | 1,674 | 3,143 |
   | 3 | 1,500 | 5.99 / 6.20 / 6.28s | 0.11 / 0.36 / 0.61s | 0 | 1,678 | 3,539 |

     Every block was full (150 txs), 0 game actions failed, and build time stays flat as the crowd triples.
   - **Still true (core-side, finding 9):** a block whose build exceeds the propose window still wedges the chain. The cap now gives about 2× headroom on this machine. Watch `/abbey/stats` and the node's build time, and raise these upstream: proposals built from a bounded mempool prefix, and nested rounds that survive root blocks.

11. **Closing M2 (2026-11-05).**
   - **Resolved rolls are pruned.** A roll resolves by reveal, forfeit or fizzle. It stays readable for `GAME.rollRetention` = 1,000 blocks, as long as the beacon it was seeded from, so any roll still on chain can be verified. Then a bounded EndBlock sweep deletes it (`rollprune/{h}/{roll}`, sharing `sweepPerBlock`). The events keep the history. Before this, every roll stayed in state forever.
   - **Upstream notes:** [UPSTREAM-NOTES.md](UPSTREAM-NOTES.md) drafts two issues for the Canopy core: proposals are built from the whole mempool, and every root block resets nested rounds. The core's own source has the second fix commented out. The file also has a doc note on the 5,000-entry default range limit. Nothing has been filed.
   - **Plugin tests:** 39/39 (new: roll pruning).

## Localnet changes

- The M0 chain databases were moved aside to `data-root/canopy.m0` and `data-nested/canopy.m0`. They weren't deleted.
- Both chains replayed from their genesis, where the staking and the treasury and faucet funding are defined.
- `spike/canopy/plugin/abbey` now links to `plugin/` instead of `spike/abbey-plugin/`.
- The params authority for this localnet is a throwaway key in `spike/client/.m2-authority.json` (mode 600, local only), passed to the node as `ABBEY_PARAMS_AUTHORITY`.
- Both nodes are stopped.

## Re-run

Build:

```bash
cd rules && npm run build
cd ../plugin && npm run build:all
```

Run the in-memory suite (~0.3s):

```bash
cd plugin && npm test
```

Start the localnet (from `spike/`), then the end-to-end script. The game chain is its own root since 2026-11-11 (`spike/single-chain.py`), so it's one node; M2 itself was measured with root chain 1 alongside.

```bash
ABBEY_CHAIN_ID=2 ABBEY_PARAMS_AUTHORITY=$(python3 -c "import json;print(json.load(open('client/.m2-authority.json'))['address'])") DATA_DIR=$PWD/data-nested PLUGIN=abbey PORT=300 P2P_PORT=9002 ./localnet.sh start
```

```bash
cd client && PORT=300 CHAIN_ID=2 npx tsx src/m2.ts
```

## Not covered by M2

- Multi-validator consensus and two plugin processes on different machines. Determinism is tested in-process: two instances replaying the same blocks write byte-identical state.
- Historical queries at past heights on a real node. The routes accept `?height=` and pass it to the core's detached query.
- Leaderboards (M4).
- Multiple players sharing a season on chain. The 4-player playtest is M4.
