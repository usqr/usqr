// Checks every page on a phone in Chromium: reflow, landmarks, text size, and target size. Run `pnpm build` first.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { preview } from 'astro';
import { chromium } from 'playwright';

const base = (process.env.BASE ?? '/usqr').replace(/\/$/, '');
const dist = new URL('../dist/', import.meta.url).pathname;

const pages = readdirSync(dist, { recursive: true })
  .filter((f) => f.endsWith('.html'))
  .map((f) => '/' + relative(dist, join(dist, f)).replace(/index\.html$/, ''));

let server;
let browser;

before(async () => {
  server = await preview({ logLevel: 'warn' });
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await server?.stop();
});

// Opens each page at the given width and collects the problems that `find` returns in the page.
async function eachPage(width, find) {
  const page = await browser.newPage({ viewport: { width, height: 640 } });
  const problems = [];
  for (const path of pages) {
    const res = await page.goto(`http://localhost:${server.port}${base}${path}`);
    assert.ok(res?.ok(), `${path}: HTTP ${res?.status()}`);
    for (const p of await page.evaluate(find)) problems.push(`${path} ${p}`);
  }
  await page.close();
  return problems;
}

const landmarkRoles = ['banner', 'navigation', 'main', 'contentinfo', 'complementary', 'region', 'search']
  .map((r) => `[role=${r}]`).join(', ');

// Visible elements that contain text of their own, with a short label for the messages.
const textElements = () => [...document.body.querySelectorAll('*')]
  .filter((el) => el.checkVisibility() && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
  .map((el) => ({ el, label: `${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 30)}"` }));

test('no page scrolls horizontally at 320px (WCAG 1.4.10)', async () => {
  const wide = await eachPage(320, () => {
    const extra = document.documentElement.scrollWidth - innerWidth;
    return extra > 0 ? [`+${extra}px`] : [];
  });
  assert.deepEqual(wide, []);
});

test('all visible text is inside a landmark', async () => {
  const outside = await eachPage(390, `(${textElements})()
    .filter(({ el }) => !el.closest('header, nav, main, footer, aside, .skip, ' + ${JSON.stringify(landmarkRoles)}))
    .map(({ label }) => label)`);
  assert.deepEqual(outside, []);
});

test('text on a phone is 12px or larger', async () => {
  const small = await eachPage(390, `(${textElements})()
    .filter(({ el }) => parseFloat(getComputedStyle(el).fontSize) < 12)
    .map(({ el, label }) => label + ' ' + getComputedStyle(el).fontSize)`);
  assert.deepEqual(small, []);
});

test('links and buttons outside sentences are 24px or larger (WCAG 2.5.8)', async () => {
  // A link inside a sentence is exempt: its parent has more text than the link.
  const small = await eachPage(390, () => [...document.querySelectorAll('a[href], button, summary')]
    .filter((el) => el.checkVisibility() && el.parentElement.textContent.trim().length <= el.textContent.trim().length)
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.width < 24 || r.height < 24)
    .map(({ el, r }) => `"${el.textContent.trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`));
  assert.deepEqual(small, []);
});
