// Converts the original images in images/ to optimized AVIF files in public/.
// images/sidequests/vitraj/gallery.png -> public/sidequests/vitraj/gallery.avif
// The script encodes a file only when the original is new or changed, or when the AVIF file is missing.
// images/avif-lock.json records the hash of each original. Commit it with the AVIF files.
// Run: `pnpm images`. `pnpm dev` and `pnpm build` run it first.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

// Strong compression. effort 9 is the slowest and smallest. 4:2:0 halves the color data.
export const AVIF = { quality: 50, effort: 9, chromaSubsampling: '4:2:0' };
export const SOURCE = /\.(png|jpe?g|webp|avif|tiff?|gif)$/i;

const root = new URL('../', import.meta.url).pathname;
const srcDir = join(root, 'images');
const outDir = join(root, 'public');
const lockPath = join(srcDir, 'avif-lock.json');

/** The public path of the AVIF file for an original, both relative and with forward slashes. */
export const avifPath = (rel) => rel.replace(SOURCE, '.avif');

/** The hash of the original bytes and the encoder settings. A settings change encodes all files again. */
export const hash = (bytes, settings = AVIF) =>
  createHash('sha256').update(JSON.stringify(settings)).update(bytes).digest('hex').slice(0, 16);

/**
 * Decides what to do. Pure: no file access.
 * @param {Record<string, string>} sources original path -> hash
 * @param {Record<string, string>} lock original path -> hash from the last run
 * @param {(avif: string) => boolean} exists
 * @returns {{ encode: string[], remove: string[] }} originals to encode, AVIF paths to delete
 */
export function plan(sources, lock, exists) {
  const outputs = Object.keys(sources).map(avifPath);
  const twin = outputs.find((p, i) => outputs.indexOf(p) !== i);
  if (twin) throw new Error(`two originals make ${twin}. Keep one.`);
  const encode = Object.keys(sources).filter((rel) => lock[rel] !== sources[rel] || !exists(avifPath(rel)));
  const remove = Object.keys(lock).filter((rel) => !(rel in sources)).map(avifPath).filter((p) => !outputs.includes(p));
  return { encode, remove };
}

function files(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

async function encode(rel) {
  const { default: sharp } = await import('sharp');
  const input = readFileSync(join(srcDir, rel));
  const output = await sharp(input, { animated: true }).avif(AVIF).toBuffer();
  // An AVIF original can already be smaller than a new encode. Then keep the original bytes.
  const best = rel.endsWith('.avif') && input.length <= output.length ? input : output;
  const out = join(outDir, avifPath(rel));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, best);
  console.log(`images: ${rel} ${Math.round(input.length / 1024)} kB -> ${Math.round(best.length / 1024)} kB`);
}

async function main() {
  const sources = Object.fromEntries(
    files(srcDir)
      .filter((f) => SOURCE.test(f))
      .map((f) => [relative(srcDir, f).split(sep).join('/'), hash(readFileSync(f))]),
  );
  const lock = existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, 'utf8')) : {};
  const { encode: todo, remove } = plan(sources, lock, (p) => existsSync(join(outDir, p)));
  for (const rel of todo) await encode(rel);
  for (const p of remove) rmSync(join(outDir, p), { force: true });
  if (todo.length || remove.length || Object.keys(lock).length !== Object.keys(sources).length) {
    const sorted = Object.fromEntries(Object.entries(sources).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(lockPath, `${JSON.stringify(sorted, null, 2)}\n`);
  }
  console.log(`images: ${todo.length} encoded, ${remove.length} removed, ${Object.keys(sources).length - todo.length} unchanged`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
