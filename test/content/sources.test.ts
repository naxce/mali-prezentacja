import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { SOURCES } from '../../src/content/sources.ts';

const slideIds = (): string[] => {
  const ids: string[] = [];
  for (const f of readdirSync('src/slides').filter((x) => /^s\d\d-.*\.ts$/.test(x))) {
    const src = readFileSync(`src/slides/${f}`, 'utf8');
    for (const m of src.matchAll(/cite\(([^)]*)\)/g)) for (const id of m[1].matchAll(/'([^']+)'/g)) ids.push(id[1]);
  }
  return ids;
};

test('source ids are unique and https', () => {
  assert.equal(new Set(SOURCES.map((s) => s.id)).size, SOURCES.length);
  for (const s of SOURCES) assert.match(s.url, /^https:\/\//, s.id);
});

test('every cited id exists and every source is cited', () => {
  const used = new Set(slideIds());
  const known = new Set(SOURCES.map((s) => s.id));
  for (const id of used) assert.ok(known.has(id), `unknown source ${id}`);
  for (const id of known) assert.ok(used.has(id), `uncited source ${id}`);
});
