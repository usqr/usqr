import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cvUrl, isCvPdfPath } from '../scripts/cv-pdf-render.mjs';

test('cvUrl points at the print CV under the base path', () => {
  assert.equal(cvUrl('http://localhost:4321', '/usqr'), 'http://localhost:4321/usqr/cv/');
  assert.equal(cvUrl('http://localhost:4321', '/usqr/'), 'http://localhost:4321/usqr/cv/');
  assert.equal(cvUrl('http://localhost:8080', '/'), 'http://localhost:8080/cv/');
  assert.equal(cvUrl('https://localhost:4321', '/usqr/'), 'https://localhost:4321/usqr/cv/');
});

test('isCvPdfPath matches only <base>/cv.pdf', () => {
  assert.ok(isCvPdfPath('/usqr/cv.pdf', '/usqr/'));
  assert.ok(isCvPdfPath('/usqr/cv.pdf?x=1', '/usqr'));
  assert.ok(isCvPdfPath('/cv.pdf', '/'));
  assert.ok(!isCvPdfPath('/usqr/blog/cv.pdf', '/usqr/'));
  assert.ok(!isCvPdfPath('/cv.pdf', '/usqr/'));
  assert.ok(!isCvPdfPath(undefined, '/usqr/'));
});
