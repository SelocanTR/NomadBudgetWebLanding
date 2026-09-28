// @ts-check
import { defineConfig } from 'astro/config';

// Static site for GitHub Pages at the custom domain in public/CNAME.
export default defineConfig({
  site: 'https://nomadbudget.rubeeks.co',
  trailingSlash: 'always',
  build: { format: 'directory' },
  compressHTML: true,
  devToolbar: { enabled: false },
});
