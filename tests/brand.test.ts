import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { palette } from '../src/data/brand.ts';

const tokens = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

test('each brandbook swatch matches its --usqr-* token in tokens.css', () => {
  for (const s of palette.flatMap((g) => g.swatches)) {
    const m = tokens.match(new RegExp(`--usqr-${s.id}:\\s*(#[0-9a-f]{6})`, 'i'));
    assert.ok(m, `no token --usqr-${s.id}`);
    assert.equal(m[1].toLowerCase(), s.hex, s.id);
  }
});

test('each swatch RGB value matches its HEX value', () => {
  for (const s of palette.flatMap((g) => g.swatches)) {
    const rgb = [1, 3, 5].map((i) => parseInt(s.hex.slice(i, i + 2), 16)).join(' ');
    assert.equal(s.rgb, rgb, s.id);
  }
});
