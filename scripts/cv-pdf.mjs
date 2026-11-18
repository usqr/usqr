// Makes dist/cv.pdf from the CV page (/) with the print stylesheet.
// Runs after `astro build`. Needs Chromium: `pnpm exec playwright install chromium`.
import { preview } from 'astro';
import { chromium } from 'playwright';

const server = await preview({ logLevel: 'warn' });
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage();
  const base = process.env.BASE ?? '/usqr';
  const url = new URL(`${base.replace(/\/$/, '')}/`, `http://localhost:${server.port}`);
  const response = await page.goto(url.href, { waitUntil: 'networkidle' });
  if (!response?.ok()) throw new Error(`CV page failed: ${response?.status()} ${url}`);
  await page.emulateMedia({ media: 'print' });
  // Tokens use font-display: optional. Without this wait the PDF can fall back from Lato and Roboto Slab.
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: 'dist/cv.pdf', format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '16mm', right: '16mm' } });
  console.log('cv.pdf: done');
} finally {
  await browser?.close();
  await server.stop();
}
