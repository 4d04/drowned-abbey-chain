# Initiative prototype

**Date:** 2026-11-06 · **Branch:** `initiative-prototype` · **Status:** ambush and quick are **live** (`LIVE_VARIANTS` in `rules/src/content.ts`, used by the plugin and the clients); per-round initiative stays off.

The game has no initiative by design (SPEC §3.3). Every action is one *exchange*: you act, then one monster answers. Monsters never act on their own clock. This prototype tries three ways to bring back some of what initiative adds, each as a switch in `content.variants`:

| Variant | Rule |
|---|---|
| `ambush` | Walking into a room with hostiles rolls initiative: your d20 + DEX against the first hostile's d20 + its `initiative`. If it wins (strictly higher), it strikes as you arrive. |
| `quick` | A monster with the `quick` trait (giant rats, for now) answers *before* your action instead of after it. |
| `initiative` | Every exchange in a fight rolls initiative between you and the monster that would answer. If it wins, it strikes first. |

Shared rules:
- **One answer per exchange:** a monster that strikes first doesn't strike again.
- **Downed before acting:** if a first strike downs you, your action is lost.
- **Recovery before ambush:** monsters left alone recover (the Abbot heals) *before* an ambush, so an ambush can't count as the fight that keeps him from healing. The first sim run, without that rule, made the boss *easier* (solo 37%, party of 3 86.5%).

Monster initiative bonuses: skeleton +0, giant rat +3, goblin +2, mimic −2, ghoul +1, Drowned Abbot +0. A new `initiative` engine event records the call (the d20s and totals, or simply "quick"), so a client can narrate who went first and the dice still verify.

## Balance (`VARIANTS=… npm run sim`, N=2,000 per row, 12s rounds)

| Variant | Solo boss kills | Party of 3 boss kills | Solo ferried | Gold per survivor (party of 3) |
|---|---|---|---|---|
| none (today) | 26.5% | 67.5% | 77.5% | 141g |
| ambush | 22.2% | 64.8% | 78.3% | 138g |
| quick | 26.2% | 67.1% | 78.1% | 140g |
| per-round initiative | 22.2% | 63.6% | 87.3% | 139g |
| ambush + quick | 22.1% | 64.0% | 78.7% | 137g |
| all three | 18.9% | 58.0% | 87.9% | 133g |

The targets (SPEC §9.3) are solo ~25% ± 7, party of 3 ~65% ± 10, and 100–220g per survivor. Every combination is within them; all three together is at the edge for solo play.

## Reading

- **Ambush** gives fights a dangerous first moment and DEX a real job. It costs a little balance (about −4 points of boss kills) and adds a roll only when you enter a room. It's the best value of the three.
- **Quick** barely moves the balance. With one answer per exchange, going first only matters when you're fleeing (the rat bites as you turn) or when the bite downs you before you act. It's mostly about feel, and per-monster, so it suits a few creatures that should feel fast.
- **Per-round initiative** is the most punishing: solo characters are ferried 87% of the time, against 78% today. That's because losing initiative while low on HP now costs your action, often the potion that would have saved you. It also adds two d20s and a line to every round, which works against the readable rounds we just built.

**Suggestion:** ambush plus quick, with per-round initiative left out. If it goes live: narrate the `initiative` event in the clients ("The skeletons were waiting: a rusted blade catches you as you step in."), switch the variants on in a release, and nudge the boss back up a few points if solo kills settle near 22%.

## Going live

- **Switches:** `LIVE_VARIANTS = { ambush: true, quick: true, initiative: false }`. The plugin and the clients both load content with it, so options, odds and "needs a roll" agree.
- **Ambush is for moves only.** An action that carries you to another room (wading out to camp) rolls nothing; the first live run caught that case trying to read a room it hadn't loaded.
- **The plugin loads the destination** of a move within the level, so the engine can see who's waiting there. A move into a room with hostiles is now a roll (commit-reveal), and the menu marks it 🎲.
- **Narration:**
  - The story tells the call ("The Skeleton was waiting: it strikes as you step in!", "You step in ready, before the Skeleton can strike.", "The Giant Rat darts in before you can act!").
  - The d20s go on the math line ("Initiative: you d20 17 + 0 = 17 vs the Skeleton d20 6 + 0 = 6: success").
  - A first strike is told *before* your action, and a move is told against the room you arrived in. The feed marks "walked into an ambush".
- **Balance re-check** (N=2,000, after the moves-only fix): solo 22.2%, party of 3 64.5%, solo ferried 78.5%, 138g per survivor (party of 3). That's within targets, unchanged from the table.

## Re-run

```bash
cd rules && npm run sim                      # the live variants (ambush + quick)
cd rules && VARIANTS=none npm run sim        # every variant off
```

The tests are `test/initiative.test.ts`: the call order for each variant, ties going to the player, a downed character losing the action, and nothing changing with the variants off.
