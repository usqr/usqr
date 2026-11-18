// Makes dist/cv.pdf from the print CV page (/cv/) with its print stylesheet.
// Runs after `astro build`. Needs Chromium: `pnpm exec playwright install chromium`.
// Size, margins, and the running footer come from @page in src/styles/print.css.
import { preview } from 'astro';
import { chromium } from 'playwright';

const server = await preview({ logLevel: 'warn' });
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage();
  const base = process.env.BASE ?? '/usqr';
  const url = new URL(`${base.replace(/\/$/, '')}/cv/`, `http://localhost:${server.port}`);
  const response = await page.goto(url.href, { waitUntil: 'networkidle' });
  if (!response?.ok()) throw new Error(`CV page failed: ${response?.status()} ${url}`);
  await page.emulateMedia({ media: 'print' });
  // Wait for the fonts, so that the PDF uses Lato and Bitter and not the fallback.
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: 'dist/cv.pdf', preferCSSPageSize: true, printBackground: true });
  console.log('cv.pdf: done');
} finally {
  await browser?.close();
  await server.stop();
}
