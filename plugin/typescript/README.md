# The Drowned Abbey: Canopy plugin

A Canopy state-machine plugin, built from the TypeScript template (`plugin/typescript` at canopy `83af2a0`), that runs the game on a nested chain. Every game rule comes from [`@abbey/rules`](../rules), the same code the client uses to preview odds and verify rolls. See [SPEC.md](../SPEC.md) §7.

## Layout

| Path | What it is |
|---|---|
| `proto/tx.proto` | The 12 game messages and the `AbbeyEvent` payload (SPEC §7.6–7.7) |
| `src/abbey/game.ts` | Transaction handlers: characters, `act` (commit or immediate), `reveal`, give, extract, shop, stash, faucet, params |
| `src/abbey/endblock.ts` | Beacon, level activation and budget top-up, reveal timeouts (forfeit), the Ferryman, the season bell and flood |
| `src/abbey/store.ts` | Per-tx state view: batched reads, buffered writes flushed once on success, plus a `MemoryBackend` for tests |
| `src/abbey/keys.ts` · `core.ts` · `config.ts` | Key layout · core accounts, pools and fees · release constants, params and record shapes |
| `src/contract/contract.ts` | Message registry, CheckTx (shape, fee floor, then a dry run of the handler), DeliverTx and EndBlock dispatch, events |
| `src/contract/rpc.ts` | Read-only HTTP routes on `127.0.0.1:50010`, all with `?height=` |
| `src/contract/plugin.ts` | Template socket plumbing. Changes: EndBlock is awaited, `ChainId` comes from `ABBEY_CHAIN_ID`, exact-name `FromAny` |
| `test/` | In-memory chain harness and 27 tests (see below) |

## How a turn works

1. The client reads `/abbey/options?char=<id>`, which lists every legal intent with exact odds and `needsRoll`.
2. **No dice** (a plain move, buying from friendly goblins): `act` without a commit resolves in that block.
3. **Dice**: `act` carries `commit = sha256(secret ‖ rollId)`, where `rollId = sha256(charId ‖ u64be(actionNonce))` and the client reads `actionNonce` from `/abbey/character`.
   - DeliverTx checks legality, locks the character, and stores the pending roll.
   - A contested `take` reserves its loot here, so the proposer of the reveal block can't decide who wins.
4. In the next block the client sends `reveal{rollId, secret}`.
   - The seed is `sha256("abbey.roll.v1" ‖ secret ‖ beacon_commitHeight ‖ rollId)`, and the engine resolves the exchange.
   - If the action no longer makes sense (the target died, the character was ferried), it fizzles.
5. If no reveal arrives within 10 blocks, EndBlock applies the forfeit outcome: player dice at their minimum and monster dice at their maximum.

## State

- Everything lives under the multi-byte prefix `abbey` (declared in `customStatePrefixes`).
- Game records are **canonical JSON** (sorted keys) rather than protobuf. The engine's shapes grow with content, JSON keeps the schema in one place (`rules/src/types.ts`), and canonical encoding keeps writes byte-identical across nodes, which the determinism test checks.
- Core records (accounts in prefix 1, the fee pool in prefix 2) stay protobuf, with unknown fields preserved.

The key families, all in `keys.ts`:

| Family | What it holds |
|---|---|
| `params`, `ledger`, `faucet/*`, `faucetblk` | Configuration and economy |
| `beacon/*`, `beacon-latest`, `txacc`, `roll/*`, `expiry/{h}/*` | Randomness and pending rolls |
| `level/*`, `room/{level}/{season}/{room}`, `reserve/*` | The world |
| `acct/*`, `char/*` | Accounts and characters |
| `where/{level}/{room}/{standing\|downed}/{height}/*` | Room occupancy by last-action height: a room-wide exchange reads a reverse page of the most recent |
| `roomcount/{level}/{room}` | Room headcount, so presence checks never scan the room |
| `active/{level}/{height}/*` | Activity by last-action height, used to pick Ferryman toll recipients |
| `ferry/{h}/*` | When each downed character's 20 blocks run out |

**Treasury ledger.** `ledger.outstanding` tracks the gold the treasury owes: carried gold, room pools, piles, caches and item escrow. Free treasury is `balance − unspent season budgets − outstanding`. New seasons and budget top-ups reserve only free gold, and the tests recompute the ledger from scratch to check it.

## Run

```bash
npm ci
npm run build:all
```

`npm run build:all` builds the protos, the descriptors and the TypeScript. It builds the rules engine in `rules/` first (`npm run build:rules`), which the plugin depends on as `file:./rules`.

```bash
npm test
```

`npm test` builds, then runs the in-memory suite in about 0.3s.

To run on a localnet, use `spike/localnet.sh` (the node's `plugin/abbey` link points here):

```bash
ABBEY_CHAIN_ID=2 ABBEY_PARAMS_AUTHORITY=<hex> DATA_DIR=$PWD/data-nested PLUGIN=abbey PORT=300 P2P_PORT=9002 ./localnet.sh start
```

**Release constants** live in `src/abbey/config.ts` (`GAME`): the treasury and faucet addresses, R = 10, level activation heights, and the params authority. Every validator must run identical values. `ABBEY_PARAMS_AUTHORITY` and `ABBEY_CHAIN_ID` are overrides for localnets.

## Tests

The in-memory harness (`test/harness.ts`) drives the real CheckTx, DeliverTx and EndBlock handlers. Players compute ids and commits the way the client does.

- **Characters:** create, stat-roll verification against the beacon, assign, enter, the 5-character cap.
- **Commit-reveal:**
  - plain moves resolve without a roll, and a commit on one is rejected;
  - reveal checks: the same block, a wrong secret, and someone else's roll are all rejected;
  - a second act while one is pending is rejected, and legality and ownership are checked at commit;
  - forfeit after R blocks, with player dice at minimum and monster dice at maximum;
  - fizzle with no dice;
  - loot race: the reservation rejects a second take until it's released.
- **Economy:**
  - faucet with fee 0 from an empty account, and each limit once enabled;
  - `set_params`: authority only, whitelisted fields only, no fee on the faucet;
  - malformed messages rejected in CheckTx, and the fee floor charged to `pools[chainId]`;
  - extract, shop buy and sell, stash, give;
  - the treasury ledger equals what's actually owed.
- **World:**
  - level activation and the beacon chain;
  - budget top-up after late treasury funding;
  - sealed stairs;
  - the Ferryman (toll split, cache, index), and a stale ferry schedule being ignored;
  - the bell warning, the flood, and the next season;
  - **two instances replaying the same blocks write byte-identical state**;
  - a restarted plugin carries on;
  - the RPC routes.

## Known limits

- **Per-block work isn't bounded yet.** About 200 game txs in one block stall a 6s chain (`M2-REPORT.md`, finding 6).
- **EndBlock sweeps aren't bounded per block yet.** That covers forfeits, ferries and the flood. SPEC §7.4 calls for `MAX_SWEEP_PER_BLOCK` with carry-over.
- **Failed transactions are free and stay out of blocks**, like the core's own (SPEC §11, decision 10). CheckTx runs the real handler as a dry run against a scratch view of state that's never written, so a tx that breaks a game rule is refused at submission. The cost is that each tx runs its handler twice: once in CheckTx, once in DeliverTx.
- **Rolls are never pruned.** Resolved rolls stay in state so they can be verified forever. Archiving them is future work.
- **Leaderboards and a `/abbey/feed` route aren't built.** The feed comes from the core's `events-by-height` and `events-by-address` instead.
