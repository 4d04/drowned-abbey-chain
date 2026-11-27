# The Drowned Abbey on Canopy

This is a fork of [canopy-network/canopy](https://github.com/canopy-network/canopy) that runs **The Drowned Abbey**, an
on-chain text dungeon game, as a nested Canopy chain. The game itself (the browser and terminal clients, the design spec, and the
deploy notes) is at [4d04/Sunken-Abbey-public](https://github.com/4d04/Sunken-Abbey-public).

What differs from upstream:

| | |
|---|---|
| `plugin/typescript/` | The game's state-machine plugin, in place of the TypeScript template. Its rules engine is in `plugin/typescript/rules/` (`file:./rules`). `chain.json` declares the plugin RPC port, 50010. |
| `.github/workflows/release-plugin-typescript.yml` | Follows the `rules` symlink when packing the release tarball (`tar -h`), so the tarball carries the built rules. |
| `bft/`, `controller/`, `lib/`, ... | canopy-network/canopy#648's fast deterministic BFT mode, as its author's commit, for sub-second blocks. |
| `plugin/`, `controller/` | `CANOPY_PLUGIN_SOCKET_DIR`: move the plugin socket folder, so two nodes can share a machine. |
| `bft/msg.go` | Read the max block size under the controller lock (a `pebble: closed` crash at 200ms blocks). |

The plugin reads its chain id from the node's `config.json` (through `CANOPY_PLUGIN_HOME`), or `ABBEY_CHAIN_ID` if set.

**Block time.** The game's rules are built for 200ms blocks (`BLOCK_MS` in `plugin/typescript/rules/src/timing.ts`),
which needs the fast mode in this fork's core. On a stock Canopy core the blocks are far slower, and `BLOCK_MS` must
match the chain's real block time, or every game timer runs slow.
