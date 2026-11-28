// LatoVar sidequest: the figure data (scripts/latovar-figures.py) and the CSS-only specimen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const figures = JSON.parse(readFileSync(new URL('../src/data/latovar-figures.json', import.meta.url), 'utf8'));
const css = readFileSync(new URL('../src/styles/latovar.css', import.meta.url), 'utf8');

test('the interpolation figure has the two masters and Regular, with one move for each point', () => {
  const { weights, moves } = figures.interpolation;
  assert.deepEqual(weights.map((w: { wght: number }) => w.wght), [100, 400, 900]);
  assert.ok(moves.length > 10);
  for (const m of moves) assert.equal(m.length, 4);
  for (const w of weights) assert.match(w.d, /^M/);
});

test('the hinting fix adds ink: the second pixel row has more ink than the first', () => {
  const [before, after] = figures.hinting.rows;
  assert.ok(after.ink > before.ink, `${before.ink} -> ${after.ink}`);
  for (const r of [before, after]) for (const p of r.paths) assert.ok(p.opacity > 0 && p.opacity <= 1);
});

test('the specimen stops at each named instance: one :has() rule for each weight from 100 to 900', () => {
  for (let w = 100; w <= 900; w += 100) assert.match(css, new RegExp(`input\\[value="${w}"\\]:checked\\) \\{ --wght: ${w}; --wn: ${w}; \\}`));
});

test('the specimen has no animation when the user prefers reduced motion', () => {
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reduced, /\.vs, \.vs-wave > span\[aria-hidden\] \{ animation: none; \}/);
});
