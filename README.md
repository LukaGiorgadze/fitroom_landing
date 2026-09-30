# Fitroom landing page

A lightweight static landing page built with Vite and Tailwind CSS.

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

## App download link

Share `https://app.fitroom.ge/get` to send iPhone visitors directly to the
App Store and Android visitors directly to Google Play. Other devices see the
same download badges as the homepage and can choose a store. The chooser is
available in English and Georgian, with Georgian selected for browsers whose
primary language is Georgian. The buttons also work without JavaScript.

Store URLs are shared by the homepage, chooser and redirect in
`src/app-stores.js`. Cloudflare Pages uses `functions/get.js` for temporary,
non-cacheable mobile redirects, and Vite dev/preview uses the same handler.
The chooser includes a client-side redirect for static hosting as well.

Run `npm test` for device routing, response headers, localization and fallback
checks. Run `npm run test:routes` to build the production output and test actual
HTTP responses in Vite dev and preview, including the exact `/get` path.

## Localization

The site is rendered as static, indexable HTML for English and Georgian:

- `/en/` and `/ka/`
- `/en/privacy-policy/` and `/ka/privacy-policy/`
- `/en/terms-of-use/` and `/ka/terms-of-use/`
- `/en/get/` and `/ka/get/`

The root page uses the browser's primary language to send Georgian (`ka` or
`ka-*`) users to `/ka/`; all other users are sent to `/en/`.

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
