// Makes public/og.png (1200×630) and public/apple-touch-icon.png (180×180).
// Run by hand after a brand change: `node scripts/brand-images.mjs`. Commit the PNG files.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const font = (f) => `data:font/woff2;base64,${readFileSync(new URL(`../src/styles/fonts/${f}`, import.meta.url)).toString('base64')}`;
const icon = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8');
const ring = icon.replace(/<rect[^>]*\/>/, ''); // the gold ring without the coal tile

const og = `<!doctype html><style>
@font-face { font-family: Lato; font-weight: 300; src: url(${font('lato-300.woff2')}); }
@font-face { font-family: Lato; font-weight: 700; src: url(${font('lato-700.woff2')}); }
@font-face { font-family: Slab; font-weight: 400 720; src: url(${font('bitter-var.woff2')}); }
body { margin: 0; width: 1200px; height: 630px; box-sizing: border-box; padding: 88px 96px; display: flex; flex-direction: column; justify-content: space-between;
  background: #403f4c; color: #f8f8fb; font-family: Lato; }
body::after { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .07;
  background: repeating-linear-gradient(45deg, #f8f8fb 0 1px, transparent 1px 36px), repeating-linear-gradient(-45deg, #f8f8fb 0 1px, transparent 1px 36px); }
.ring { width: 120px; height: 120px; }
h1 { margin: 0; font-size: 104px; line-height: .95; letter-spacing: -.02em; }
h1 .l { font-weight: 300; display: block; } h1 .b { font-weight: 700; }
p { margin: 28px 0 0; font-family: Slab; font-weight: 715; font-size: 38px; color: #ffa400; }
</style><body><div class="ring">${ring}</div><div><h1><span class="l">Łukasz</span><span class="b">Datkowski</span></h1><p>Frontend · UX · Design systems</p></div></body>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(og);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'public/og.png' });
  await page.setViewportSize({ width: 180, height: 180 });
  // iOS rounds the corners itself, so the touch icon is a full square.
  const square = icon.replace('rx="32"', 'rx="0"').replace('<svg ', '<svg width="180" height="180" ');
  await page.setContent(`<body style="margin:0">${square}</body>`);
  await page.screenshot({ path: 'public/apple-touch-icon.png' });
  console.log('og.png, apple-touch-icon.png: done');
} finally {
  await browser.close();
}
