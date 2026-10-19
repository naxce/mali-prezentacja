import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const media = JSON.parse(readFileSync('src/content/media.json', 'utf8')) as { key: string; kind: string; author: string; license: string; sourceUrl: string }[];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
}

test('every media key used in slides exists', () => {
  const keys = new Set(media.map((m) => m.key));
  for (const f of readdirSync('src/slides').filter((x) => x.endsWith('.ts'))) {
    const src = readFileSync(`src/slides/${f}`, 'utf8');
    for (const m of src.matchAll(/(?:img|videoTag|flag)\('([a-z0-9-]+)'/g)) assert.ok(keys.has(m[1]), `${f}: ${m[1]}`);
  }
});

test('every shipped media item is used by a slide', () => {
  const src = readdirSync('src/slides').filter((x) => x.endsWith('.ts')).map((f) => readFileSync(`src/slides/${f}`, 'utf8')).join('\n');
  const quoted = new Set(Array.from(src.matchAll(/'([a-z0-9-]+)'/g), (m) => m[1]));
  for (const m of media) assert.ok(quoted.has(m.key), `unused media ${m.key}`);
});

test('every media item has author, license and source', () => {
  for (const m of media) {
    assert.ok(m.author.trim(), `${m.key} author`);
    assert.ok(m.license.trim(), `${m.key} license`);
    assert.match(m.sourceUrl, /^https:\/\//, `${m.key} source`);
  }
});

test('media budgets', () => {
  const files = walk('public/media');
  let total = 0;
  for (const f of files) {
    const size = statSync(f).size;
    total += size;
    if (f.endsWith('.mp4')) assert.ok(size <= 800 * 1024, `${f} ${size}`);
    if (f.endsWith('.webp')) assert.ok(size <= 350 * 1024, `${f} ${size}`);
  }
  assert.ok(total <= 25 * 1024 * 1024, `total ${total}`);
});
