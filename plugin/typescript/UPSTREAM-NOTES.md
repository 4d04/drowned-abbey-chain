# Notes for the Canopy core team

Two liveness issues found while load-testing a nested-chain plugin (M2 report, findings 9–10). They're drafted as issues for [canopy-network/canopy](https://github.com/canopy-network/canopy), and nothing has been filed. Observed at commit `83af2a0c` on a single-validator localnet: root and nested chains both at 6s blocks, PROPOSE 750ms, the TypeScript plugin template.

A third item is a documentation note. A fourth asks for randomness plugins can use: our game's dice need it once more than one validator runs, and more so under canopy-network/canopy#648's predictable proposer schedule.

---

## 1. A proposal that can't be built within the PROPOSE window wedges the chain for good

> **Update:** [canopy-network/canopy#648](https://github.com/canopy-network/canopy/pull/648) (open) builds proposals from a block-sized slice of the mempool and lets consensus cancel a slow build. In our trial (`spike/FAST-BLOCKS-REPORT.md`), saturating load made blocks late but never wedged the chain. Issue 2 is mostly moot in that PR's fast mode, where a round lasts about 500ms.

**What happens.** `Mempool.CheckMempool` (`controller/tx.go`) builds every proposal by applying the **whole** mempool:

```go
Transactions: m.GetTransactions(math.MaxUint64), // get all transactions in mempool - but apply block will only keep 'max-block' amount
```

Txs past the block size still run (ephemerally, as `Oversized`). Any mempool change bumps `dirtyVersion`, which invalidates the cached proposal. So the build time scales with the mempool, not the block.

Once that build takes longer than the propose window, the proposer misses PROPOSE every round. Nothing in the core then builds a smaller proposal. The txs that remain are valid and stay in the mempool, so every later round fails the same way. In our test the chain sat at one height for about an hour with no load at all. Only restarting the node cleared the mempool and got it moving.

**Seen as** this repeating every round:

```
Validating mempool and caching a new proposal block
(..., P:PROPOSE)
(..., P:PROPOSE_VOTE)
WARN: no valid message received from Proposer
WARN: Starting next round in 3.00 secs
Done checking mempool        # ~1.0–1.1s after the build started
```

**Suggestions** (any one would restore liveness):
- Build from a bounded, fee-ordered prefix of the mempool, about one block's worth by bytes or count, rather than applying all of it.
- If the build for a round is still running when PROPOSE starts, propose the last valid cached proposal, or an empty block, rather than nothing.
- Make the propose window grow with the round when the previous round failed for lack of a proposal. That needs item 2 too.

---

## 2. Each root-chain block resets a nested chain's round to 0, so its timeouts never grow

**What happens.** On every root-chain update, `bft/bft.go` (around line 171) does:

```go
b.log.Info("Reset BFT (NEW_COMMITTEE)")
//if b.LoadIsOwnRoot() {
b.NewHeight(true)
//} else if b.Round != 0 {
//	b.NewHeight(true)
```

With both chains at 6s blocks, a nested round that hasn't committed by the next root block starts over at round 0. Round-based timeout growth never kicks in, so every nested round has to finish within one root-block interval.

We confirmed it directly. Raising the nested node's PROPOSE timeout to 2s made each round outlive the 6s root interval, and nothing committed: valid 0-tx proposals reached PRECOMMIT and were then reset.

**Suggestion.** The commented-out branch looks like the intended fix: on a root-chain update, keep the current round, or skip the reset when the committee is unchanged. Then a slow round can still finish, and later rounds can lengthen their timeouts.

---

## 3. Doc note: plugin range reads stop at 5,000 entries when no limit is given

`fsm/state.go` sets `defaultPluginStateReadLimit = 5000`. A `PluginRangeRead` with `limit = 0` returns at most 5,000 entries, with nothing to say it was truncated. Ranges also can't start mid-prefix: there's a prefix, a limit and a direction, but no start key. Both facts shape how a plugin has to page its indexes. They'd be worth stating in the plugin docs, and a `truncated` flag on the result would also help.

---

## 4. Feature request: per-block randomness a proposer can't steer, for plugins

**Why we need it.** Plugins get `EndBlock{height, proposer_address}` and the block's txs, but no block hash, VRF output, VDF output or signatures (`PluginEndRequest` in `plugin.proto`). So a plugin's randomness has to come from what it can see. Our dice use commit-reveal: a player seals a secret before block *h*, and the plugin keeps a beacon,

```
beacon_h = sha256(beacon_{h-1} ‖ height ‖ proposer ‖ hash of block h's txs)
seed     = sha256(secret ‖ beacon_h ‖ rollId)
```

Neither the player nor the proposer can steer a roll alone. But **a player colluding with the proposer of *h*** can: the proposer tries candidate tx sets until the beacon gives a good roll. Under VRF election the colluder has to win the election at the right moment. Under #648's `stakeWeightedRoundRobin`, the proposer of every height is computable in advance, so a player can time a commit for a friendly validator's block. Using a later block's beacon doesn't help, since that block's proposer can tune it just the same. Anything a single proposer influences through its choice of txs has this property, so a plugin can't fix it.

**What would fix it.** Per-block randomness that the proposer can't vary, passed to plugins, for example:
- **A BLS signature chain**, as in drand and DFINITY: `rand_h = BLS_sign(proposer_key, rand_{h-1} ‖ h)`, verified by every validator against the proposer's public key, with `rand_h` (or its hash) added to `PluginEndRequest`. BLS signatures are unique for a given key and message, so the proposer can't grind. Its only move is to withhold the block, which costs it the slot and is visible. Validators already have BLS keys.
- Or, under VRF election, the elected proposer's VRF output for that height, which is likewise unique.

**What we'd do with it.** Fold `rand_h` into the beacon: `beacon_h = sha256(beacon_{h-1} ‖ rand_h ‖ …)`. Then a colluding proposer could no longer tune the dice, only skip its slot.

