import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareRoles, countLabel, formatDate, formatMonth, isoDate, withBase } from '../src/lib/format.ts';

test('formatDate uses day, short month, year in UTC', () => {
  assert.equal(formatDate(new Date('2027-01-05')), '5 Jan 2027');
});

test('isoDate gives YYYY-MM-DD', () => {
  assert.equal(isoDate(new Date('2026-12-01')), '2026-12-01');
});

test('formatMonth turns YYYY-MM into MM.YYYY', () => {
  assert.equal(formatMonth('2025-09'), '09.2025');
});

test('withBase joins without double or missing slashes', () => {
  assert.equal(withBase('/usqr/', '/blog/'), '/usqr/blog/');
  assert.equal(withBase('/usqr', 'blog/'), '/usqr/blog/');
  assert.equal(withBase('/', '/'), '/');
});

test('countLabel uses the plural for 0 and 2+', () => {
  assert.equal(countLabel(1, 'post'), '1 post');
  assert.equal(countLabel(2, 'post'), '2 posts');
});

test('compareRoles puts current roles first, then the newest end, then the newest start', () => {
  const roles = [
    { id: 'old', start: '2014-04', end: '2018-05' },
    { id: 'self', start: '2019-05' },
    { id: 'senior', start: '2025-09' },
    { id: 'mid', start: '2020-07', end: '2025-08' },
  ];
  assert.deepEqual(roles.sort(compareRoles).map((r) => r.id), ['senior', 'self', 'mid', 'old']);
});
