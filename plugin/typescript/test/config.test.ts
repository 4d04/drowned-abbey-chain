// The plugin's chain id: ABBEY_CHAIN_ID, else the node's config.json (found from CANOPY_PLUGIN_HOME), else 1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const { chainIdFromNode } = await import('../dist/contract/plugin.js');

function nodeDir(config: unknown): string {
    const data = mkdtempSync(join(tmpdir(), 'abbey-cfg-'));
    mkdirSync(join(data, 'plugin', 'typescript'), { recursive: true });
    if (config !== undefined) writeFileSync(join(data, 'config.json'), JSON.stringify(config));
    return join(data, 'plugin', 'typescript');
}

test('reads the chain id from the node config.json the core points to', () => {
    assert.equal(chainIdFromNode({ CANOPY_PLUGIN_HOME: nodeDir({ chainId: 88, networkID: 1 }) }), 88);
});

test('ABBEY_CHAIN_ID overrides the node config', () => {
    assert.equal(chainIdFromNode({ ABBEY_CHAIN_ID: '7', CANOPY_PLUGIN_HOME: nodeDir({ chainId: 88 }) }), 7);
});

test('falls back to 1 with no config, or an unreadable one', () => {
    assert.equal(chainIdFromNode({}), 1);
    assert.equal(chainIdFromNode({ CANOPY_PLUGIN_HOME: nodeDir(undefined) }), 1);
    assert.equal(chainIdFromNode({ CANOPY_PLUGIN_HOME: nodeDir({ chainId: 'x' }) }), 1);
});
