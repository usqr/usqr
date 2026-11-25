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

test('pages ship no JavaScript except count.js, the print shortcut, and the theme switch (NoLoJS)', () => {
  for (const { name, html } of pages) {
    const scripts = html.match(/<script\b[^>]*>/gi) ?? [];
    for (const tag of scripts) assert.match(tag, /src="https:\/\/gc\.zgo\.at\/count\.js"|data-print-shortcut|data-theme-init|data-theme-script/, `${name}: ${tag}`);
  }
});

test('every page has one print shortcut script that points to the print CV', () => {
  for (const { name, html } of pages) {
    const shortcut = html.match(/<script\b[^>]*data-print-shortcut[^>]*>([\s\S]*?)<\/script>/gi) ?? [];
    assert.equal(shortcut.length, 1, name);
    assert.ok(shortcut[0].includes(`"${base}/cv/"`), `${name}: print CV URL`);
  }
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

test('Bitter is the only serif in the font stacks', () => {
  const css = files(dist).filter((f) => f.endsWith('.css')).map((f) => readFileSync(f, 'utf8')).join('\n');
  const stacks = [...css.matchAll(/(?:font-family|--font-[\w-]+)\s*:\s*([^;}]+)/g)].map((m) => m[1]);
  assert.ok(stacks.length > 0);
  for (const stack of stacks) {
    assert.doesNotMatch(stack, /Georgia|Times|Cambria|Palatino|ui-serif|(?<![\w-])serif\b/i, stack);
  }
});

// Bitter has no tabular oldstyle figures: with tabular-nums, its tnum changes the figures back to lining.
test('the serif numerals use oldstyle figures without tabular-nums', () => {
  const css = files(dist).filter((f) => f.endsWith('.css')).map((f) => readFileSync(f, 'utf8')).join('\n');
  for (const sel of ['.num', '.year', '.pnum']) {
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => m[1].split(',').some((s) => s.trim() === sel));
    const decl = rules.map((m) => m[2]).join(';');
    assert.match(decl, /font-variant-numeric:\s*oldstyle-nums/, sel);
    assert.doesNotMatch(decl, /tabular-nums/, sel);
  }
});

test('the main nav links to Sidequests on every page', () => {
  for (const { name, html } of pages) {
    const nav = html.match(/<nav aria-label="Main">[\s\S]*?<\/nav>/)?.[0] ?? '';
    assert.ok(nav.includes(`href="${base}/sidequests/"`), name);
  }
  for (const p of ['sidequests/index.html', 'sidequests/brandbook/index.html', 'sidequests/font-analysis/index.html', 'sidequests/vitraj/index.html', 'sidequests/precog/index.html', 'sidequests/kindle-writer/index.html']) assert.ok(existsSync(join(dist, p)), `missing ${p}`);
});

test('the header logo and the favicon are the fat brandmark', () => {
  const fat = 'M60.3,12.5C73.9,12.6';
  const icon = readFileSync(join(dist, 'favicon.svg'), 'utf8');
  assert.ok(icon.includes(fat), 'favicon');
  assert.doesNotMatch(icon, /<rect/, 'favicon has no tile');
  for (const { name, html } of pages) {
    const brand = html.match(/<a class="brand"[\s\S]*?<\/a>/)?.[0];
    if (brand) assert.ok(brand.includes(fat), name);
  }
});

test('every page has the theme switch, hidden until JS shows it', () => {
  for (const { name, html } of pages) {
    const sw = html.match(/<button\b[^>]*data-theme-switch[^>]*>/gi) ?? [];
    assert.equal(sw.length, 1, name);
    assert.match(sw[0], /\shidden[\s>]/, `${name}: hidden`);
    assert.match(sw[0], /role="switch"/, `${name}: role`);
    const head = html.slice(0, html.indexOf('</head>'));
    assert.ok(head.includes('data-theme-init'), `${name}: saved theme applies in <head>`);
  }
});
