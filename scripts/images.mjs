// Converts the original images in images/ to optimized AVIF files in public/.
// images/sidequests/vitraj/gallery.png -> public/sidequests/vitraj/gallery.avif
// The script encodes a file only when one of these conditions is true:
// the original is new or changed, the AVIF file is missing, or the encoder settings or the libvips version changed.
// images/avif-lock.json records the hash of each original. Commit it with the AVIF files.
// When you delete an original, the script deletes its AVIF file. It does not touch other files in public/.
// Animated images are not supported: the script keeps only the first frame.
// Run: `pnpm images`. `pnpm dev` and `pnpm build` run it first. `pnpm dev` does not watch images/: restart it after a change.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Strong compression. effort 9 is the slowest and smallest. 4:2:0 halves the color data.
export const AVIF = { quality: 50, effort: 9, chromaSubsampling: '4:2:0' };
export const SOURCE = /\.(png|jpe?g|webp|avif|tiff?)$/i;

const root = fileURLToPath(new URL('../', import.meta.url));

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
  if (!Object.keys(sources).length && Object.keys(lock).length) {
    throw new Error('images/ has no originals, but avif-lock.json lists some. Restore images/ or delete the lock.');
  }
  const outputs = Object.keys(sources).map(avifPath);
  const keys = outputs.map((p) => p.toLowerCase());
  const twin = outputs.find((p, i) => keys.indexOf(p.toLowerCase()) !== i);
  if (twin) throw new Error(`two originals make ${twin}. Keep one.`);
  const encode = Object.keys(sources)
    .filter((rel) => lock[rel] !== sources[rel] || !exists(avifPath(rel)));
  const remove = Object.keys(lock)
    .filter((rel) => !(rel in sources))
    .map(avifPath)
    .filter((p) => !keys.includes(p.toLowerCase()));
  return { encode, remove };
}

function files(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

async function encode(sharp, srcDir, outDir, rel) {
  const input = readFileSync(join(srcDir, rel));
  const output = await sharp(input).avif(AVIF).toBuffer();
  // An AVIF original can already be smaller than a new encode. Then keep the original bytes.
  const best = rel.endsWith('.avif') && input.length <= output.length ? input : output;
  const out = join(outDir, avifPath(rel));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, best);
  console.log(`images: ${rel} ${Math.round(input.length / 1024)} kB -> ${Math.round(best.length / 1024)} kB`);
}

/** Encodes the new and changed originals in srcDir to outDir. Returns the counts. */
export async function run(srcDir = join(root, 'images'), outDir = join(root, 'public')) {
  const { default: sharp } = await import('sharp');
  const settings = { ...AVIF, vips: sharp.versions.vips };
  const lockPath = join(srcDir, 'avif-lock.json');
  const sources = Object.fromEntries(
    files(srcDir)
      .filter((f) => SOURCE.test(f))
      .map((f) => [relative(srcDir, f).split(sep).join('/'), hash(readFileSync(f), settings)])
      .sort(([a], [b]) => a.localeCompare(b)),
  );
  const lock = existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, 'utf8')) : {};
  const { encode: todo, remove } = plan(sources, lock, (p) => existsSync(join(outDir, p)));
  for (const rel of todo) await encode(sharp, srcDir, outDir, rel);
  for (const p of remove) rmSync(join(outDir, p), { force: true });
  const text = `${JSON.stringify(sources, null, 2)}\n`;
  if (!existsSync(lockPath) || readFileSync(lockPath, 'utf8') !== text) writeFileSync(lockPath, text);
  const counts = { encoded: todo.length, removed: remove.length, unchanged: Object.keys(sources).length - todo.length };
  console.log(`images: ${counts.encoded} encoded, ${counts.removed} removed, ${counts.unchanged} unchanged`);
  return counts;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await run();
