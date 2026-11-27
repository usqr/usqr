import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AVIF, avifPath, hash, plan } from '../scripts/images.mjs';

const all = () => true;

test('avifPath keeps the folder and changes the extension to .avif', () => {
  assert.equal(avifPath('sidequests/vitraj/gallery.png'), 'sidequests/vitraj/gallery.avif');
  assert.equal(avifPath('brand/portrait.JPEG'), 'brand/portrait.avif');
  assert.equal(avifPath('brand/portrait.avif'), 'brand/portrait.avif');
});

test('hash changes when the bytes or the encoder settings change', () => {
  const a = Buffer.from('a');
  assert.equal(hash(a), hash(Buffer.from('a')));
  assert.notEqual(hash(a), hash(Buffer.from('b')));
  assert.notEqual(hash(a), hash(a, { ...AVIF, quality: AVIF.quality + 1 }));
});

test('plan encodes only new and changed originals', () => {
  const { encode, remove } = plan({ 'a.png': '1', 'b.png': '2', 'c.png': '3' }, { 'a.png': '1', 'b.png': 'old' }, all);
  assert.deepEqual(encode, ['b.png', 'c.png']);
  assert.deepEqual(remove, []);
});

test('plan encodes an unchanged original when its AVIF file is missing', () => {
  const { encode } = plan({ 'a.png': '1' }, { 'a.png': '1' }, () => false);
  assert.deepEqual(encode, ['a.png']);
});

test('plan removes the AVIF file of a deleted original, but not of a renamed extension', () => {
  const { encode, remove } = plan({ 'b.jpg': '9' }, { 'a.png': '1', 'b.png': '2' }, all);
  assert.deepEqual(encode, ['b.jpg']);
  assert.deepEqual(remove, ['a.avif']);
});

test('plan refuses two originals that make the same AVIF file', () => {
  assert.throws(() => plan({ 'a.png': '1', 'a.jpg': '2' }, {}, all), /a\.avif/);
});
