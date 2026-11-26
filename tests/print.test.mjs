// Checks the print layout in Chromium. Run `pnpm build` first.
// Chromium writes PDF text in paint order. Positioned, transformed, and floated boxes paint
// after the normal flow, so their text moves to the end of the PDF and ATS tools read it out of order.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { preview } from 'astro';
import { chromium } from 'playwright';
import { CV_PDF } from '../scripts/cv-pdf-render.mjs';

const base = (process.env.BASE ?? '/usqr').replace(/\/$/, '');
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

const at = (path) => `http://localhost:${server.port}${base}${path}`;

/** Elements in <main> that paint visible text out of the normal flow. */
function layeredTextBoxes() {
  const layered = (el) => {
    const s = getComputedStyle(el);
    return s.position !== 'static' || s.transform !== 'none' || s.float !== 'none';
  };
  const visible = (el) => el.getClientRects().length > 0;
  const out = new Set();
  const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim() || !visible(n.parentElement)) continue;
    for (let el = n.parentElement; el && el.tagName !== 'MAIN'; el = el.parentElement) {
      if (layered(el)) out.add(`${el.tagName.toLowerCase()}.${el.className}`);
    }
  }
  return [...out];
}

for (const path of ['/', '/cv/']) {
  test(`print ${path}: text paints in source order (no positioned, transformed, or floated text boxes)`, async () => {
    const page = await browser.newPage();
    await page.goto(at(path));
    await page.emulateMedia({ media: 'print' });
    assert.deepEqual(await page.evaluate(layeredTextBoxes), []);
  });
}

test('print CV: the visible text starts with the name, then the sections in order', async () => {
  const page = await browser.newPage();
  await page.goto(at('/cv/'));
  await page.emulateMedia({ media: 'print' });
  const text = await page.evaluate(() => document.querySelector('main').innerText);
  const order = ['Łukasz Datkowski', 'What I do', 'Experience', 'Education', 'Languages'].map((s) => text.indexOf(s));
  assert.equal(order[0], 0, text.slice(0, 80));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
});

test('print CV: the sheets stay light in the dark theme, on screen and in print', async () => {
  const page = await browser.newPage({ colorScheme: 'dark' });
  await page.goto(at('/cv/'));
  const colors = () => {
    const s = getComputedStyle(document.querySelector('.sheet'));
    const body = getComputedStyle(document.body);
    return { color: s.color, bg: body.getPropertyValue('--bg').trim(), bodyBg: body.backgroundColor };
  };
  const screen = await page.evaluate(colors);
  assert.equal(screen.color, 'rgb(64, 63, 76)'); // coal text on the sheet
  assert.notEqual(screen.bodyBg, 'rgb(248, 248, 251)'); // the page around the sheets follows the theme
  await page.emulateMedia({ media: 'print' });
  const print = await page.evaluate(colors);
  assert.deepEqual([print.color, print.bg], ['rgb(64, 63, 76)', '#fff']);
});

test('the PDF CV has two A4 pages at most', () => {
  const pdf = readFileSync(new URL(`../dist/${CV_PDF}`, import.meta.url), 'latin1');
  const pages = pdf.match(/\/Type\s*\/Page\b(?!s)/g)?.length ?? 0;
  assert.ok(pages >= 1 && pages <= 2, `${pages} pages`);
  assert.match(pdf, /\/MediaBox\s*\[0 0 59[45]\.\d+ 841\.\d+\]/);
});

test('the PDF CV embeds Lato and Bitter and no other font', () => {
  const pdf = readFileSync(new URL(`../dist/${CV_PDF}`, import.meta.url), 'latin1');
  const fonts = [...new Set([...pdf.matchAll(/\/FontName\s*\/(?:[A-Z]{6}\+)?([\w-]+)/g)].map((m) => m[1]))];
  assert.ok(fonts.some((f) => /^Lato/.test(f)), fonts.join());
  assert.ok(fonts.some((f) => /^Bitter/.test(f)), fonts.join());
  for (const f of fonts) assert.match(f, /^(Lato|Bitter)/, fonts.join());
  assert.match(pdf, /\/FontFile2|\/FontFile3/);
});
