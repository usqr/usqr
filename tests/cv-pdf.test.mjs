import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cvUrl } from '../scripts/cv-pdf-render.mjs';

test('cvUrl points at the print CV under the base path', () => {
  assert.equal(cvUrl(4321, '/usqr'), 'http://localhost:4321/usqr/cv/');
  assert.equal(cvUrl(4321, '/usqr/'), 'http://localhost:4321/usqr/cv/');
  assert.equal(cvUrl(8080, '/'), 'http://localhost:8080/cv/');
});
