import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const siteUrl = "https://app.fitroom.ge";

export const languages = Object.freeze({
  en: { locale: "en", ogLocale: "en_US" },
  ka: { locale: "ka", ogLocale: "ka_GE" },
});

export const localeFiles = Object.freeze(
  Object.keys(languages).map((locale) =>
    path.join(projectRoot, `locales/${locale}.json`),
  ),
);

export const pages = Object.freeze({
  home: {
    sourceFile: path.join(projectRoot, "index.html"),
    bundleFile: "index.html",
    slug: "",
  },
  privacyPolicy: {
    sourceFile: path.join(projectRoot, "privacy-policy/index.html"),
    bundleFile: "privacy-policy/index.html",
    slug: "privacy-policy",
  },
  termsOfUse: {
    sourceFile: path.join(projectRoot, "terms-and-use/index.html"),
    bundleFile: "terms-and-use/index.html",
    slug: "terms-of-use",
  },
});

let catalogs;

export const reloadCatalogs = async () => {
  catalogs = Object.fromEntries(
    await Promise.all(
      Object.keys(languages).map(async (locale, index) => [
        locale,
        JSON.parse(await readFile(localeFiles[index], "utf8")),
      ]),
    ),
  );
};

await reloadCatalogs();

const routeFor = (locale, pageKey) => {
  const page = pages[pageKey];
  return `/${locale}/${page.slug ? `${page.slug}/` : ""}`;
};

const outputFileFor = (locale, pageKey) => {
  const page = pages[pageKey];
  return `${locale}/${page.slug ? `${page.slug}/` : ""}index.html`;
};

const getValue = (source, key) =>
  key.split(".").reduce((value, segment) => value?.[segment], source);

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const createHomepageStructuredData = (locale, canonical) => {
  const catalog = catalogs[locale];
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const webpageId = `${canonical}#webpage`;
  const faqKeys = [
    "faq_what_is_a_calorie_tracker",
    "faq_how_photo_counting_works",
    "faq_accuracy",
    "faq_macros",
    "faq_corrections",
  ];
  const faqItems = faqKeys.map((key) => ({
    "@type": "Question",
    name: getValue(catalog, `pages.home.${key}_question`),
    acceptedAnswer: {
      "@type": "Answer",
      text: getValue(catalog, `pages.home.${key}_answer`),
    },
  }));

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "Fitroom",
        url: "https://fitroom.ge/",
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/assets/fitroom-logo-dark.png`,
        },
        image: `${siteUrl}/assets/og-image.webp`,
        email: "contact@fitroom.ge",
        address: {
          "@type": "PostalAddress",
          streetAddress: "24 Alexander Kazbegi Avenue",
          addressLocality: "Tbilisi",
          addressCountry: "GE",
        },
        sameAs: [
          "https://www.facebook.com/fitroom.ge",
          "https://www.instagram.com/fitroom.ge/",
          "https://www.tiktok.com/@fitroom.ge",
          "https://x.com/fitroomge",
          "https://www.linkedin.com/company/74479027/",
        ],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: `${siteUrl}/`,
        name: getValue(catalog, "common.fitroom_calorie_tracker"),
        publisher: { "@id": organizationId },
        inLanguage: ["en", "ka"],
      },
      {
        "@type": ["WebPage", "FAQPage"],
        "@id": webpageId,
        url: canonical,
        name: getValue(catalog, "pages.home.seo_title"),
        description: getValue(catalog, "pages.home.seo_description"),
        isPartOf: { "@id": websiteId },
        about: { "@id": organizationId },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: `${siteUrl}/assets/og-image.webp`,
          width: 1536,
          height: 1024,
        },
        inLanguage: locale,
        mainEntity: faqItems,
      },
    ],
  };

  return JSON.stringify(structuredData).replace(/</g, "\\u003c");
};

const pageContext = (locale, pageKey) => {
  const routes = Object.fromEntries(
    Object.keys(pages).map((key) => [key, routeFor(locale, key)]),
  );
  const alternates = Object.fromEntries(
    Object.keys(languages).map((language) => [
      language,
      `${siteUrl}${routeFor(language, pageKey)}`,
    ]),
  );
  const alternateLocale = locale === "en" ? "ka" : "en";
  const switchRoutes = Object.fromEntries(
    Object.keys(languages).map((language) => [
      language,
      routeFor(language, pageKey),
    ]),
  );
  const canonical = `${siteUrl}${routeFor(locale, pageKey)}`;

  return {
    locale,
    routes,
    alternates,
    switchRoutes,
    fonts: {
      criticalMedium:
        locale === "ka"
          ? "/fonts/fira-go/FiraGO-Medium-Georgian.woff2"
          : "/fonts/fira-go/FiraGO-Medium-Latin.woff2",
    },
    seo: {
      canonical,
      ogLocale: languages[locale].ogLocale,
      alternateOgLocale: languages[alternateLocale].ogLocale,
      structuredData:
        pageKey === "home" ? createHomepageStructuredData(locale, canonical) : "{}",
    },
  };
};

export const renderLocalizedHtml = (html, locale, pageKey) => {
  if (!languages[locale]) throw new Error(`Unsupported locale: ${locale}`);
  if (!pages[pageKey]) throw new Error(`Unknown page: ${pageKey}`);

  const context = pageContext(locale, pageKey);
  const catalog = catalogs[locale];
  let rendered = html.replace(/\{\{([\w.]+)\}\}/g, (placeholder, key) => {
    const contextValue = getValue(context, key);
    const catalogValue = getValue(catalog, key);
    const value = contextValue ?? catalogValue;
    if (typeof value !== "string") {
      throw new Error(`Missing ${locale} translation for ${key} in ${pageKey}`);
    }
    if (key === "seo.structuredData") return value;
    return escapeHtml(value);
  });

  rendered = rendered.replace(
    /(<a\b(?=[^>]*\bdata-language="([^"]+)")[^>]*)(>)/g,
    (link, start, language, end) => {
      if (language !== locale) return link;
      const trimmedStart = start.trimEnd();
      return `${trimmedStart} aria-current="page"${start.slice(trimmedStart.length)}${end}`;
    },
  );

  const unresolvedPlaceholder = rendered.match(/\{\{[\w.]+\}\}/)?.[0];
  if (unresolvedPlaceholder) {
    throw new Error(`Unresolved placeholder ${unresolvedPlaceholder} in ${pageKey}`);
  }

  return rendered;
};

export const localizedRoutes = Object.freeze(
  Object.keys(languages).flatMap((locale) =>
    Object.keys(pages).map((pageKey) => ({
      locale,
      pageKey,
      pathname: routeFor(locale, pageKey),
      outputFile: outputFileFor(locale, pageKey),
    })),
  ),
);

export const findLocalizedRoute = (pathname) =>
  localizedRoutes.find(
    (route) =>
      route.pathname === pathname ||
      (route.pathname.endsWith("/") && route.pathname.slice(0, -1) === pathname),
  );

export const createSitemap = () => {
  const urls = Object.keys(pages)
    .flatMap((pageKey) =>
      Object.keys(languages).map(
        (locale) => `  <url>
    <loc>${siteUrl}${routeFor(locale, pageKey)}</loc>
  </url>`,
      ),
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
};

export const createRootRedirect = () => {
  const title = escapeHtml(getValue(catalogs.en, "common.fitroom_calorie_tracker"));
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="robots" content="noindex,follow" />
    <meta http-equiv="refresh" content="0;url=/en/" />
    <link rel="canonical" href="${siteUrl}/en/" />
    <title>${title}</title>
    <script>window.location.replace("/en/" + window.location.hash);</script>
  </head>
  <body><a href="/en/">${title}</a></body>
</html>
`;
};
