// Checks the print layout of the CV page in Chromium. Run `pnpm build` first.
// Chromium writes PDF text in paint order. Positioned, transformed, and floated boxes paint
// after the normal flow, so their text moves to the end of /cv.pdf and ATS tools read it out of order.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { preview } from 'astro';
import { chromium } from 'playwright';

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

test('print CV text paints in source order (no positioned, transformed, or floated text boxes)', async () => {
  const page = await browser.newPage();
  await page.goto(`http://localhost:${server.port}${base}/`);
  await page.emulateMedia({ media: 'print' });
  const offenders = await page.evaluate(() => {
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
  });
  assert.deepEqual(offenders, []);
});
