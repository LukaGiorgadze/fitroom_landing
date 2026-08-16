import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { readFile } from "node:fs/promises";
import waitlistHandler from "./api/waitlist.js";
import {
  createRootRedirect,
  createSitemap,
  findLocalizedRoute,
  localeFiles,
  localizedRoutes,
  pages,
  reloadCatalogs,
  renderLocalizedHtml,
  siteUrl,
} from "./i18n/build.js";

function waitlistApi() {
  const middleware = (request, response, next) => {
    Promise.resolve(waitlistHandler(request, response)).catch(next);
  };

  return {
    name: "fitroom-waitlist-api",
    configureServer(server) {
      server.middlewares.use("/api/waitlist", middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/waitlist", middleware);
    },
  };
}

function prioritizeStylesheets(html) {
  const stylesheetPattern =
    /    (?:<style>[\s\S]*?<\/style>|<link rel="stylesheet"[^>]*>)\n?/g;
  const stylesheets = html.match(stylesheetPattern);
  if (!stylesheets?.length) return html;

  const withoutStylesheets = html.replace(stylesheetPattern, "");
  return withoutStylesheets.replace(
    "    <script type=\"module\"",
    `${stylesheets.map((tag) => tag.trimEnd()).join("\n")}\n    <script type=\"module\"`,
  );
}

function staticLocalization() {
  const developmentRedirects = new Map([
    ["/", "/en/"],
    ["/index.html", "/en/"],
    ["/terms", "/en/terms-of-use/"],
    ["/terms/", "/en/terms-of-use/"],
    ["/terms-and-use", "/en/terms-of-use/"],
    ["/terms-and-use/", "/en/terms-of-use/"],
    ["/terms-of-use", "/en/terms-of-use/"],
    ["/terms-of-use/", "/en/terms-of-use/"],
    ["/privacy", "/en/privacy-policy/"],
    ["/privacy/", "/en/privacy-policy/"],
    ["/privacy-policy", "/en/privacy-policy/"],
    ["/privacy-policy/", "/en/privacy-policy/"],
    ["/en/terms-and-use", "/en/terms-of-use/"],
    ["/en/terms-and-use/", "/en/terms-of-use/"],
    ["/ka/terms-and-use", "/ka/terms-of-use/"],
    ["/ka/terms-and-use/", "/ka/terms-of-use/"],
  ]);

  return {
    name: "fitroom-static-localization",
    enforce: "post",
    configureServer(server) {
      server.watcher.add(localeFiles);
      server.watcher.on("change", async (file) => {
        if (!localeFiles.includes(file)) return;
        try {
          await reloadCatalogs();
          server.ws.send({ type: "full-reload" });
        } catch (error) {
          server.config.logger.error(`Unable to reload locale catalogs: ${error.message}`);
        }
      });

      server.middlewares.use(async (request, response, next) => {
        if (request.method !== "GET" && request.method !== "HEAD") return next();

        const pathname = new URL(request.url, "http://localhost").pathname;
        const redirect = developmentRedirects.get(pathname);
        if (redirect) {
          response.statusCode = 302;
          response.setHeader("Location", redirect);
          response.end();
          return;
        }

        const route = findLocalizedRoute(pathname);
        if (!route) return next();

        if (pathname !== route.pathname) {
          response.statusCode = 302;
          response.setHeader("Location", route.pathname);
          response.end();
          return;
        }

        try {
          const template = await readFile(pages[route.pageKey].sourceFile, "utf8");
          const html = renderLocalizedHtml(template, route.locale, route.pageKey);
          const transformed = await server.transformIndexHtml(pathname, html);
          response.statusCode = 200;
          response.setHeader("Content-Type", "text/html; charset=utf-8");
          response.end(request.method === "HEAD" ? undefined : transformed);
        } catch (error) {
          next(error);
        }
      });
    },
    generateBundle(_outputOptions, bundle) {
      const builtTemplates = new Map();
      const i18nStylesheet = Object.values(bundle).find(
        (asset) =>
          asset.type === "asset" &&
          /^assets\/i18n-[^/]+\.css$/.test(asset.fileName),
      );

      for (const [pageKey, page] of Object.entries(pages)) {
        const asset = bundle[page.bundleFile];
        if (!asset || asset.type !== "asset") {
          throw new Error(`Missing built HTML template: ${page.bundleFile}`);
        }
        let builtTemplate = String(asset.source);
        if (pageKey === "home" && i18nStylesheet) {
          builtTemplate = builtTemplate.replace(
            /<link rel="stylesheet" crossorigin href="\/assets\/i18n-[^"]+\.css">/,
            `<style>${String(i18nStylesheet.source)}</style>`,
          );
        }
        builtTemplate = prioritizeStylesheets(builtTemplate);
        builtTemplates.set(pageKey, builtTemplate);
        if (pageKey === "home") asset.source = createRootRedirect();
        else delete bundle[page.bundleFile];
      }

      for (const route of localizedRoutes) {
        this.emitFile({
          type: "asset",
          fileName: route.outputFile,
          source: renderLocalizedHtml(
            builtTemplates.get(route.pageKey),
            route.locale,
            route.pageKey,
          ),
        });
      }

      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: createSitemap() });
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: `# AI search and model crawlers are allowed.
User-agent: OAI-SearchBot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`,
      });
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), waitlistApi(), staticLocalization()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        privacyPolicy: "privacy-policy/index.html",
        termsAndUse: "terms-and-use/index.html",
      },
    },
  },
});
