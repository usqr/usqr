import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chartPoints } from '../src/lib/chart.ts';

test('chartPoints scales each value to the largest value', () => {
  const p = chartPoints([{ label: 'a', value: 30 }, { label: 'b', value: 60 }, { label: 'c', value: 0 }]);
  assert.deepEqual(p.map((x) => x.ratio), [0.5, 1, 0]);
});

test('chartPoints marks the largest value when no mark is given', () => {
  const p = chartPoints([{ label: 'a', value: 1 }, { label: 'b', value: 9 }]);
  assert.deepEqual(p.map((x) => x.marked), [false, true]);
});

test('chartPoints marks the given indexes only', () => {
  const p = chartPoints([{ label: 'a', value: 1 }, { label: 'b', value: 9 }, { label: 'c', value: 2 }], [0, 2]);
  assert.deepEqual(p.map((x) => x.marked), [true, false, true]);
});

test('chartPoints writes values with a thousands separator', () => {
  assert.equal(chartPoints([{ label: 'a', value: 204272 }])[0].text, '204,272');
});

test('chartPoints gives ratio 0 when all values are 0', () => {
  assert.deepEqual(chartPoints([{ label: 'a', value: 0 }]).map((x) => x.ratio), [0]);
});

test('every sidequest has a page', async () => {
  const { sidequests } = await import('../src/data/sidequests.ts');
  const { existsSync } = await import('node:fs');
  for (const q of sidequests) {
    assert.ok(existsSync(new URL(`../src/pages/sidequests/${q.id}.astro`, import.meta.url)), q.id);
  }
});
