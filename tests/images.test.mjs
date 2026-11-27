import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { AVIF, avifPath, hash, plan, run } from '../scripts/images.mjs';

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

test('plan refuses two originals that make the same AVIF file, also when only the case differs', () => {
  assert.throws(() => plan({ 'a.png': '1', 'a.jpg': '2' }, {}, all), /a\.avif/);
  assert.throws(() => plan({ 'A.png': '1', 'a.jpg': '2' }, {}, all), /\.avif/);
});

test('plan refuses to delete all outputs when the originals are gone but the lock lists some', () => {
  assert.throws(() => plan({}, { 'a.png': '1' }, all), /no originals/);
  assert.deepEqual(plan({}, {}, all), { encode: [], remove: [] });
});

const png = (color) => sharp({ create: { width: 8, height: 8, channels: 3, background: color } }).png().toBuffer();

test('run encodes, skips, encodes again, and deletes real files', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'images test '));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  t.mock.method(console, 'log', () => {});
  const src = join(dir, 'images');
  const out = join(dir, 'public');
  mkdirSync(join(src, 'sub'), { recursive: true });
  mkdirSync(out);
  writeFileSync(join(src, 'sub', 'a.png'), await png('#f00'));
  writeFileSync(join(out, 'hand.avif'), 'by hand');

  assert.deepEqual(await run(src, out), { encoded: 1, removed: 0, unchanged: 0 });
  assert.equal((await sharp(join(out, 'sub', 'a.avif')).metadata()).format, 'heif');
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(join(src, 'avif-lock.json'), 'utf8'))), ['sub/a.png']);

  assert.deepEqual(await run(src, out), { encoded: 0, removed: 0, unchanged: 1 });

  writeFileSync(join(src, 'sub', 'a.png'), await png('#00f'));
  assert.deepEqual(await run(src, out), { encoded: 1, removed: 0, unchanged: 0 });

  rmSync(join(out, 'sub', 'a.avif'));
  assert.deepEqual(await run(src, out), { encoded: 1, removed: 0, unchanged: 0 });

  writeFileSync(join(src, 'b.png'), await png('#0f0'));
  rmSync(join(src, 'sub', 'a.png'));
  assert.deepEqual(await run(src, out), { encoded: 1, removed: 1, unchanged: 0 });
  assert.ok(!existsSync(join(out, 'sub', 'a.avif')));
  assert.ok(existsSync(join(out, 'b.avif')));
  assert.equal(readFileSync(join(out, 'hand.avif'), 'utf8'), 'by hand');
});

test('run keeps the AVIF original when it is smaller than a new encode', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'images-avif-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  t.mock.method(console, 'log', () => {});
  mkdirSync(join(dir, 'images'));
  const tiny = await sharp(await png('#888')).avif({ quality: 1, effort: 9 }).toBuffer();
  writeFileSync(join(dir, 'images', 'x.avif'), tiny);
  await run(join(dir, 'images'), join(dir, 'public'));
  const written = readFileSync(join(dir, 'public', 'x.avif'));
  assert.ok(written.length <= tiny.length);
});
