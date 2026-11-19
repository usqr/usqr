// Checks the theme switch in Chromium. Run `pnpm build` first.
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

const at = (path) => `http://localhost:${server.port}${base}${path}`;

async function open(options = {}) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await page.goto(at('/'));
  return { context, page, sw: page.locator('[data-theme-switch]') };
}

const state = (page) => page.evaluate(() => ({
  theme: document.documentElement.dataset.theme ?? null,
  saved: localStorage.getItem('theme'),
  bg: getComputedStyle(document.body).backgroundColor,
}));

for (const scheme of ['light', 'dark']) {
  test(`the switch starts in the system position (${scheme})`, async () => {
    const { context, sw } = await open({ colorScheme: scheme });
    await assert.doesNotReject(sw.waitFor({ state: 'visible' }));
    assert.equal(await sw.getAttribute('aria-checked'), String(scheme === 'dark'));
    await context.close();
  });
}

test('a choice persists, and the system choice clears the saved value', async () => {
  const { context, page, sw } = await open({ colorScheme: 'light' });
  const light = (await state(page)).bg;

  await sw.click();
  const dark = await state(page);
  assert.deepEqual([dark.theme, dark.saved], ['dark', 'dark']);
  assert.notEqual(dark.bg, light);

  await page.reload();
  assert.equal((await state(page)).theme, 'dark', 'saved theme applies before the switch script');
  assert.equal(await sw.getAttribute('aria-checked'), 'true');

  await sw.click();
  const back = await state(page);
  assert.deepEqual([back.theme, back.saved, back.bg], [null, null, light]);
  await context.close();
});

test('the switch follows a system change when no theme is saved', async () => {
  const { context, page, sw } = await open({ colorScheme: 'light' });
  await page.emulateMedia({ colorScheme: 'dark' });
  // The media change event fires asynchronously.
  await page.waitForFunction(() => document.querySelector('[data-theme-switch]').ariaChecked === 'true', null, { timeout: 2000 });
  assert.equal(await sw.getAttribute('aria-checked'), 'true');
  await context.close();
});

test('without JavaScript the switch stays hidden', async () => {
  const { context, sw } = await open({ javaScriptEnabled: false });
  assert.equal(await sw.isVisible(), false);
  await context.close();
});

test('the brandbook logotype keeps gold-text in the two themes', async () => {
  const colors = [];
  for (const colorScheme of ['light', 'dark']) {
    const context = await browser.newContext({ colorScheme });
    const page = await context.newPage();
    await page.goto(at('/sidequests/brandbook/'));
    colors.push(await page.locator('.bb-title .sq').evaluate((el) => getComputedStyle(el).color));
    await context.close();
  }
  assert.deepEqual(colors, ['rgb(158, 102, 0)', 'rgb(158, 102, 0)']);
});
