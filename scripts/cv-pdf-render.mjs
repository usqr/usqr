// Renders the print CV page to a PDF. Used by the build (cv-pdf.mjs) and by the dev server (/cv.pdf).
// Size, margins, and the running footer come from @page in src/styles/print.css.
import { chromium } from 'playwright';

/** Open the print CV at `url` and return the PDF bytes. */
export async function renderCvPdf(url) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    if (!response?.ok()) throw new Error(`CV page failed: ${response?.status()} ${url}`);
    await page.emulateMedia({ media: 'print' });
    // Wait for the fonts, so that the PDF uses Lato and Bitter and not the fallback.
    await page.evaluate(() => document.fonts.ready);
    return await page.pdf({ preferCSSPageSize: true, printBackground: true });
  } finally {
    await browser.close();
  }
}

/** The CV page URL on a local server. */
export function cvUrl(port, base = process.env.BASE ?? '/usqr') {
  return new URL(`${base.replace(/\/$/, '')}/cv/`, `http://localhost:${port}`).href;
}

/** Astro integration: in `astro dev`, serve /cv.pdf from the live /cv/ page. */
export function cvPdfDev() {
  return {
    name: 'cv-pdf-dev',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.split('?')[0].endsWith('/cv.pdf')) return next();
          try {
            const pdf = await renderCvPdf(cvUrl(server.httpServer.address().port));
            res.setHeader('Content-Type', 'application/pdf');
            res.end(pdf);
          } catch (err) {
            next(err);
          }
        });
      },
    },
  };
}
