# Fitroom landing page

A lightweight static landing page built with Vite and Tailwind CSS.

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

## Localization

The site is rendered as static, indexable HTML for English and Georgian:

- `/en/` and `/ka/`
- `/en/privacy-policy/` and `/ka/privacy-policy/`
- `/en/terms-of-use/` and `/ka/terms-of-use/`

English copy lives in `locales/en.json`, and Georgian copy lives in
`locales/ka.json`. The build renders both catalogs into their language-specific
routes and adds canonical, `hreflang`, sitemap, and language-switcher links.

When new text is added to an HTML template, run `npm run i18n:extract`. This
adds new English keys and copies only missing keys into the Georgian catalog,
without overwriting existing Georgian translations.

## Cloudflare Pages

Use `npm run build` as the build command and `dist` as the output directory.
The waitlist endpoint is provided by the root `functions/api/waitlist.js`
Pages Function, so deploy the project through Cloudflare Pages Git integration.
No Wrangler dependency is required.

Set `DISCORD_WAITLIST_WEBHOOK_BASE64` in the Pages project's environment
variables to override the bundled webhook configuration.
