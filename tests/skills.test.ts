import { test } from 'node:test';
import assert from 'node:assert/strict';
import { areas, getSkill, skills } from '../src/data/skills.ts';

test('skill ids and names are unique', () => {
  assert.equal(new Set(skills.map((s) => s.id)).size, skills.length);
  assert.equal(new Set(skills.map((s) => s.name)).size, skills.length);
});

test('no skill has the name of an area (05-surface.md, F2)', () => {
  const areaNames = new Set(areas.map((a) => a.name.toLowerCase()));
  for (const s of skills) assert.ok(!areaNames.has(s.name.toLowerCase()), s.name);
});

test('each area has at least one skill', () => {
  for (const a of areas) assert.ok(skills.some((s) => s.area === a.id), a.id);
});

test('getSkill fails on an unknown id', () => {
  // @ts-expect-error: the test uses an id that is not in the list.
  assert.throws(() => getSkill('workflow'), /Unknown skill/);
});
