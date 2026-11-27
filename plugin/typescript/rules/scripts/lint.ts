/* Content linter CLI: exits non-zero on any issue. */

import { readFileSync } from 'node:fs';
import { loadContent } from '../src/content.ts';
import { type TextPack, lintLevel, lintRegistry, maxSeasonPayout } from '../src/lint.ts';

const content = loadContent();
const issues = lintRegistry(content);
for (const lvl of content.levels.values()) {
    const dir = new URL(`../levels/${String(lvl.def.id).padStart(2, '0')}-${lvl.def.key}/`, import.meta.url);
    const text = JSON.parse(readFileSync(new URL('text.en.json', dir), 'utf8')) as TextPack;
    const found = lintLevel(content, lvl, text);
    issues.push(...found);
    console.log(`level ${lvl.def.id} ${lvl.def.key}: ${lvl.def.rooms.length} rooms, ${lvl.def.actions.length} actions, max payout ${maxSeasonPayout(content, lvl.def)}/${lvl.def.budget}g, contentHash ${lvl.contentHash.slice(0, 16)}… ${found.length ? `${found.length} issue(s)` : 'ok'}`);
}
for (const i of issues) console.log(`  L${i.level} ${i.where}: ${i.message}`);
process.exit(issues.length ? 1 : 0);
