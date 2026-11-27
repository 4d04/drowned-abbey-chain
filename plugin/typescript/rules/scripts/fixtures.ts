/* Regenerate golden fixtures. Only run this when a rules or content change is intended to alter outcomes. */

import { writeFileSync } from 'node:fs';
import { loadContent } from '../src/content.ts';
import { replayDigest } from '../src/replay.ts';

const digest = replayDigest(loadContent());
writeFileSync(new URL('../test/fixtures/replay-l1.json', import.meta.url), JSON.stringify(digest, null, 2) + '\n');
console.log(digest);
