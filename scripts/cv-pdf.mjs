// Makes dist/cv.pdf from the print CV page (/cv/) with its print stylesheet.
// Runs after `astro build`. Needs Chromium: `pnpm exec playwright install chromium`.
import { writeFile } from 'node:fs/promises';
import { preview } from 'astro';
import { cvUrl, renderCvPdf } from './cv-pdf-render.mjs';

const server = await preview({ logLevel: 'warn' });
try {
  await writeFile('dist/cv.pdf', await renderCvPdf(cvUrl(`http://localhost:${server.port}`)));
  console.log('cv.pdf: done');
} finally {
  await server.stop();
}
