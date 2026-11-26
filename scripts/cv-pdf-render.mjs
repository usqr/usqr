// Renders the print CV page to a PDF. Used by the build (cv-pdf.mjs) and by the dev server.
// Size, margins, and the running footer come from @page in src/styles/print.css.

/** The file name of the PDF CV, at the site root. The links use `download`, so the browser saves the file. */
export const CV_PDF = 'Datkowski_Lukasz_CV.pdf';

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

/** The CV page URL on a server at `origin`, for example http://localhost:4321. */
export function cvUrl(origin, base = process.env.BASE ?? '/usqr') {
  return new URL(`${trim(base)}/cv/`, origin).href;
}

/** True for a request to the PDF path that the build makes: <base>/CV_PDF, with or without a query. */
export function isCvPdfPath(url, base) {
  return (url ?? '').split('?')[0] === `${trim(base)}/${CV_PDF}`;
}

/** Connect middleware for the dev server: render the PDF from the live /cv/ page. */
function cvPdfHandler(getBase, https) {
  return async (req, res, next) => {
    // Vite removes the base from req.url. originalUrl keeps the full path.
    if (!isCvPdfPath(req.originalUrl ?? req.url, getBase())) return next();
    try {
      const origin = `http${https ? 's' : ''}://${req.headers.host ?? 'localhost'}`;
      const pdf = await renderCvPdf(cvUrl(origin, getBase()));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Cache-Control', 'no-store');
      res.end(pdf);
    } catch (err) {
      next(err);
    }
  };
}

/** Astro integration: in `astro dev`, serve <base>/CV_PDF as the build does. */
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
