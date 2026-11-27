# M1 Report: Rules Engine + Level 1 Content

**Date:** 2026-11-04 · **Package:** `rules/` (`@abbey/rules` 0.1.0) · **Runtime:** Node 26 (native TS type stripping), TypeScript 5.9.3, `@noble/hashes` 2.0.1 · **Level 1 contentHash:** `32551737e503cbed9a2eb60af4f5883511fee2992f5a10424455d2dffeea4807`

## Verdict

**Every M1 exit criterion in SPEC §10 is met.** The engine is pure and deterministic. Level 1 is entirely data, and the linter passes on it. 57 tests are green. The numbers are tuned against the simulator targets, with one row at the edge of its tolerance (solo, below).

| Exit criterion | Result |
|---|---|
| Data-driven engine | ✅ Level 1 is 13 rooms, 14 edges, 26 actions and 8 loot tables in `levels/01-drowned-abbey/level.json`. It has no level-specific code. Room logic uses a closed set of 20 effect ops, 13 condition kinds and 3 monster traits (SPEC §5.2) |
| Linter | ✅ `npm run lint:content` checks references, the DC range, settable flags and counters, reachability, a path back to the exit, the season budget (697/700g), unbounded payouts, and text-pack coverage. Each check has a mutation test |
| Simulator | ✅ `npm run sim`: scripted bot parties run seasons through the real engine with seeded dice. A 2,000-expedition sweep of every row takes about 17s |
| Tests green | ✅ 63/63 (`npm test`, ~0.8s) |
| Tuned numbers | ✅ With the Ferryman rescue: solo 26.5% boss kill (target ~25%), party of 3 67.5% (target ~65%), 141g extracted per party-of-3 member (target ~150g) |

## Simulator results (N=2000 per row, seed `abbey.sim.v1`)

Unit = one **expedition**: a party gets one season and up to 3 trips, extracting between trips to heal and buying 2 potions per trip. Monsters stay dead between trips, as the season rules say. Downed characters who aren't saved within 20 blocks are **ferried** to camp (SPEC §3.4) and keep playing on later trips.

| Party | Boss kill | Ferried at least once | Ferries / expedition | Toll / expedition | Gold / member |
|---|---|---|---|---|---|
| solo fighter | 30.4% | 70.4% | 1.06 | 21g | 205g |
| solo rogue | 17.9% | 76.0% | 1.15 | 23g | 170g |
| solo cleric | 28.3% | 80.8% | 1.44 | 27g | 196g |
| solo wizard | 28.9% | 82.3% | 1.39 | 37g | 205g |
| **solo (all)** | **26.5%** | 77.5% | 1.27 | 26g | 193g |
| party of 2 | 64.1% | 48.5% | 1.29 | 15g | 206g |
| **party of 3** | **67.5%** | 53.6% | 2.44 | 16g | **141g** |
| party of 4 | 66.2% | 59.6% | 3.96 | 23g | 105g |

The bots never retreat from a fight once committed, so real players should be ferried less. The toll is small because most falls happen at the ghouls or the Abbot, before the 300g hoard is picked up. In parties the toll mostly lands with the bot's own party members, who count as other accounts.

**Before the Ferryman** (permanent death, same table otherwise): solo 18.6% boss kill with about 76% of solo expeditions ending in death, party of 3 67.5%.

## What changed from SPEC v0.4 (all now reflected in SPEC.md)

| What | v0.4 | M1 | Why |
|---|---|---|---|
| Rogue | 18 HP, AC 14, 1d6+3 | 20 HP, AC 15, rapier 1d8+3 | Solo rogue rarely gets Sneak Attack (no ally, targets become aware): 4% boss kills before the change |
| Cleric | 20 HP, +4 1d6+2, Heal 2× | 22 HP, +5 1d8+2, Heal 3× | Solo cleric: 8% boss kills before the change |
| Wizard | 14 HP, AC 12, 1d10, Missile 2× | 18 HP, AC 13, 1d10+2, Missile 3× | Solo wizard died in about 97% of runs |
| Mimic | 30 HP, +5 1d8+3 | 24 HP, +4 1d8+2 | It was the main solo killer, though it's optional loot |
| Ghoul | 22 HP, 2d6+2 | 18 HP, 2d4+2 | Two ghouls killed most characters before they reached the boss |
| Abbot | 60 HP, +5 2d6+3, Wail 1d8 | 48 HP, +4 1d8, Wail 2d8, **recovers** to full after 20 blocks unfought | Damage moved from his melee to the Wail, which closes the solo/party gap (finding 1). Recovery keeps him from being worn down across trips now that nobody dies (finding 9) |
| DC ladder | 10/13/16/19 only | Anchors kept; linter allows 10–19 | The room table already used DCs 12, 14 and 15 |
| Narthex | "Wade carefully" was flavor | Wading is the only way from room 1 to room 0 (`oneWay` edge) | Makes the silt gold-loss mechanic matter: you wade out carrying loot |
| Rubble | "STR 12, or two successes" (ambiguous) | Two STR 12 successes from any players | Rewards cooperation |
| Goblins | Implicitly hostile | Start *wary*: no counterattacks until provoked; parley turns them *friendly* | Parley would make no sense if they were already attacking |
| Death | Permanent; everything drops into a corpse cache | **Ferryman rescue**: wake at the Lychgate at 1 HP. Items stay in the room; half the carried gold is a toll split among other recently active accounts on the same level | Your call after M1: about 76% of solo expeditions ended in permadeath |
| Resting at camp | Allowed (spawned wandering monsters into camp) | Not allowed: at camp you extract | Bug found while tuning the Ferryman |
| Item sale value | Budgeted at sale | Escrowed from the budget **when the item drops** | A sale in a later season never draws on that season's budget, and the treasury invariant includes item escrow |

## Findings that matter for M2 and beyond

1. **Per-action counterattacks split across a party, but area attacks don't.** Each action gets one counterattack. A fight takes roughly the same number of exchanges whatever the party size, so a party of N shares the boss's counterattack damage N ways. That's why parties ran ~85% against solo ~20%. Tide Wail hits every character, so each one takes the same Wail damage whatever the party size. Moving the Abbot's damage from melee into the Wail closed the gap. **Future bosses should be designed the same way:** an area effect hits every character the same, so it's the only lever that pressures a party as hard as a solo player.
2. **"Forfeit is never better" has to be stated branch-wise.** Desecrating the altar *successfully* spawns an alert ghoul that counterattacks. The failure (forfeit) branch has no ghoul, so the forfeiting player can end with more HP. The precise property, now tested over every option in every room for all four classes with 40 seeds each, is:
   - a forfeit never succeeds where a real roll could fail;
   - within the same branch, the forfeit's HP and gold are ≤ the real roll's, and monster HP is ≥.
3. **The plugin preloads a Scene.** The engine reads and writes only `Scene{level, rooms, chars}`. `LevelIndex.touches` lists, for each action, the rooms it touches besides its own. For example, the bell wakes room 11 and smashing the chest spawns into rooms 2 and 5. The plugin should load exactly those rooms plus the actor's own room and the characters in it.
4. **`needsRoll` is exact.** It resolves a scratch copy with dice that throw, so the plugin can resolve plain moves and dice-free actions immediately, and use commit-reveal only when a die is actually rolled (SPEC §7.6 "commit?").
5. **The plugin owns two inputs.** It must supply the `newId()` item-ID generator (suggest `sha256(rollId ‖ u32be(n))[:16]`) and the block height. Everything else comes from the Scene and the dice.
6. **Units.** The engine works in whole GOLD (safe JS integers). The plugin converts to µGOLD (×1,000,000, `bigint`) only when it moves a core account balance (`extract`, `shop_*`, `faucet_claim`).
7. **Dice match M0 exactly.** `SeededDice` produces the same stream as the M0 plugin's `RollDie` (tested), and `rollSeed`/`rollId`/`commitment` follow SPEC §7.3. In forfeit, the wandering-monster die is a monster die, so a forfeited rest always draws the monster.
8. **Shareability.** The source runs directly under Node 26 type stripping. `npm run build` emits `dist/` JS plus `.d.ts` for the plugin (the TS template compiles with `tsc`) and for a bundler client. Registry and level JSON are bundled through imports, so no files are read at runtime.

9. **Without permadeath, persistent monster HP made bosses trivial.** Ferried characters return, and the Abbot's HP lasted the whole season, so parties wore him down trip after trip: solo kills went to 58% and party-of-3 kills to 97%. The new `recovers` trait restores him to full HP 20 blocks after his last fight. A boss now has to be beaten in one push, though fleeing briefly to drink a potion still works. **Any future boss needs this trait.**
10. **Ferry recipients need an activity index.** The engine picks recipients from a candidate list using `lastActionHeight`, which it now stamps on every resolved exchange. The plugin has to supply the candidates cheaply, e.g. an `abbey/active/{levelId}/{charId}` index that's updated on each resolve and pruned after 100 blocks. Scanning every character in EndBlock won't scale.
11. **The toll goes to carried gold, not wallets.** Recipients get their share as escrow and have to extract it, so EndBlock never writes core accounts for a ferry. It's still treasury-backed escrow, so the treasury invariant is unchanged.

## Not covered by M1

- These are plugin or client work, not the engine: the transactions themselves (`give`, `stash_move`, `shop_*` as txs), loot reservations for contested `take`, the actual season clock (EndBlock reset scheduling, the bell warning), leaderboards, and events as protos.
- Treasury runway simulation at 1/10/100 daily players (SPEC §9.3) is deferred to M4, when seasons run on-chain.
- Multiple parties sharing a season (contested loot, caches and tolls from strangers). The simulator runs one party per season, so toll recipients are always party members.
- The text pack is English only and minimal. It's lint-checked for coverage, not for quality.

## Open items for you

- **Solo lethality: resolved** with the Ferryman rescue (SPEC §3.4).
- **Toll griefing.** Players gain when others fall, so ringing the bell or desecrating the altar now has a small payoff. Watch for it in the M4 playtest. The levers are the toll share, the 100-block window and the 10-recipient cap.
- **Party of 4 ≈ party of 3.** That's a side effect of finding 1 and probably fine. It also means a 4th player doesn't make the boss easier.

## Layout

| Path | What it is |
|---|---|
| `src/engine/` | `checks` (d20, statuses, advantage), `combat` (attacks, counterattack, traits, downing), `effects` (op interpreter), `conditions`, `resolve` (intents, legality, exchange, options, `needsRoll`), `odds` (exact basis points for the UI) |
| `src/dice.ts` | Seeded, forfeit and fixed dice; seed, rollId and commitment; dice expressions; 4d6-drop-lowest |
| `src/content.ts` · `src/lint.ts` | Content loading, indexing and canonical `contentHash` · linter |
| `src/camp.ts` · `src/season.ts` | Create, assign stats, enter, extract, shop · season start/end, flood, Ferryman (toll split) |
| `src/sim.ts` · `src/replay.ts` | Bot simulator · golden replay digest |
| `registry/*.json` · `levels/01-drowned-abbey/` | Classes, monsters, items and statuses · `level.json` + `text.en.json` |
| `test/` | dice, engine, forfeit property, content/linter/replay, camp/season/odds; `fixtures/replay-l1.json` |
| `scripts/` | `lint.ts`, `sim.ts`, `fixtures.ts`, plus debug `trace.ts` and `ferries.ts` |

## Re-run

```bash
cd rules
npm ci
npm run check
```

`npm run check` runs the typecheck, the tests, the content linter, and the simulator with its target gate. To trace a single expedition:

```bash
SIM_TRACE=1 CLASSES=fighter,cleric SEED=x node scripts/trace.ts
```

Regenerate the golden replay **only** for an intended rules or content change:

```bash
npm run fixtures
```
