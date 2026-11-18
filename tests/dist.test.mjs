// Checks the built site in dist/. Run `pnpm build` first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const base = (process.env.BASE ?? '/usqr').replace(/\/$/, '');

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const htmlFiles = existsSync(dist) ? files(dist).filter((f) => f.endsWith('.html')) : [];
const pages = htmlFiles.map((f) => ({ name: relative(dist, f), html: readFileSync(f, 'utf8') }));

test('dist exists with the places from the flow', () => {
  for (const p of ['index.html', 'blog/index.html', 'skills/index.html', 'colophon/index.html', '404.html', 'rss.xml', 'cv.pdf']) {
    assert.ok(existsSync(join(dist, p)), `missing ${p}`);
  }
});

test('pages ship no JavaScript (NoLoJS)', () => {
  for (const { name, html } of pages) assert.doesNotMatch(html, /<script\b/i, name);
});

test('pages contain no email address and no phone number (private data)', () => {
  for (const { name, html } of pages) {
    assert.doesNotMatch(html, /[\w.+-]+@[\w-]+\.[a-z]{2,}/i, `${name}: email`);
    assert.doesNotMatch(html, /\+?\d{2,3}[ -]?\d{3}[ -]?\d{3}[ -]?\d{3}\b/, `${name}: phone`);
  }
});

test('draft posts are not built', () => {
  const drafts = readdirSync(new URL('../src/content/blog/', import.meta.url))
    .filter((f) => /^draft:\s*true/m.test(readFileSync(new URL(`../src/content/blog/${f}`, import.meta.url), 'utf8')))
    .map((f) => f.replace(/\.md$/, ''));
  for (const slug of drafts) assert.ok(!existsSync(join(dist, 'blog', slug)), slug);
});

test('every internal link and fragment resolves', () => {
  const ids = new Map(pages.map(({ name, html }) => [name, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]));
  for (const { name, html } of pages) {
    for (const [, href] of html.matchAll(/\shref="([^"]+)"/g)) {
      if (/^(https?:|mailto:)/.test(href)) continue;
      const [path, hash] = href.split('#');
      const target = path ? relative(dist, join(dist, path.replace(base, ''), path.endsWith('/') ? 'index.html' : '')) : name;
      assert.ok(existsSync(join(dist, target)), `${name} → ${href}`);
      if (hash && target.endsWith('.html')) assert.ok(ids.get(target)?.has(hash), `${name} → ${href} (no #${hash})`);
    }
  }
});
