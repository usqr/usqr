// Renders the print CV page to a PDF. Used by the build (cv-pdf.mjs) and by the dev server (/cv.pdf).
// Size, margins, and the running footer come from @page in src/styles/print.css.

const trim = (base) => base.replace(/\/$/, '');

/** Open the print CV at `url` and return the PDF bytes. */
export async function renderCvPdf(url) {
  // Lazy import: astro.config loads this file, and playwright is only a dev dependency.
  const { chromium } = await import('playwright');
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

/** The CV page URL on a server at `origin` (or on localhost:`origin` when it is a port). */
export function cvUrl(origin, base = process.env.BASE ?? '/usqr') {
  const root = typeof origin === 'number' ? `http://localhost:${origin}` : origin;
  return new URL(`${trim(base)}/cv/`, root).href;
}

/** True for a request to the PDF path that the build makes: <base>/cv.pdf, with or without a query. */
export function isCvPdfPath(url, base) {
  return (url ?? '').split('?')[0] === `${trim(base)}/cv.pdf`;
}

/** Connect middleware for the dev server: render /cv.pdf from the live /cv/ page. */
function cvPdfHandler(getBase, https) {
  return async (req, res, next) => {
    // Vite removes the base from req.url. originalUrl keeps the full path.
    if (!isCvPdfPath(req.originalUrl ?? req.url, getBase())) return next();
    try {
      const origin = `http${https ? 's' : ''}://${req.headers.host}`;
      const pdf = await renderCvPdf(cvUrl(origin, getBase()));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Cache-Control', 'no-store');
      res.end(pdf);
    } catch (err) {
      next(err);
    }
  };
}

/** Astro integration: in `astro dev`, serve <base>/cv.pdf as the build does. */
export function cvPdfDev() {
  let base = '/';
  return {
    name: 'cv-pdf-dev',
    hooks: {
      'astro:config:done': ({ config }) => {
        base = config.base;
      },
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(cvPdfHandler(() => base, Boolean(server.config.server.https)));
      },
    },
  };
}
