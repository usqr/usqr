// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages target. Set SITE and BASE in CI when the URL changes
// (for example, a custom domain: SITE=https://example.com BASE=/).
export default defineConfig({
  site: process.env.SITE ?? 'https://usqr.github.io',
  base: process.env.BASE ?? '/usqr',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
