# Fitroom landing page

A lightweight static landing page built with Vite and Tailwind CSS.

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

## Cloudflare Pages

Use `npm run build` as the build command and `dist` as the output directory.
The waitlist endpoint is provided by the root `functions/api/waitlist.js`
Pages Function, so deploy the project through Cloudflare Pages Git integration.
No Wrangler dependency is required.

Set `DISCORD_WAITLIST_WEBHOOK_BASE64` in the Pages project's environment
variables to override the bundled webhook configuration.
