import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localeDirectory = path.join(projectRoot, "locales");
const englishFile = path.join(localeDirectory, "en.json");
const georgianFile = path.join(localeDirectory, "ka.json");

const pages = [
  { key: "home", file: path.join(projectRoot, "index.html") },
  {
    key: "privacyPolicy",
    file: path.join(projectRoot, "privacy-policy/index.html"),
  },
  {
    key: "termsOfUse",
    file: path.join(projectRoot, "terms-and-use/index.html"),
  },
];

const voidElements = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);
const textExcludedElements = new Set(["script", "style", "svg"]);
const translatedAttributes = new Set([
  "alt",
  "aria-label",
  "placeholder",
  "data-invalid-message",
  "data-loading-label",
  "data-error-message",
  "data-preview-fallback-alt",
  "data-expanded-label",
  "data-collapsed-label",
]);

const decodeHtml = (value) =>
  value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(
      /&(amp|quot|apos|lt|gt|nbsp|copy|rsquo|lsquo|rdquo|ldquo|ndash|mdash|hellip);/g,
      (_, entity) =>
        ({
          amp: "&",
          quot: '"',
          apos: "'",
          lt: "<",
          gt: ">",
          nbsp: " ",
          copy: "©",
          rsquo: "’",
          lsquo: "‘",
          rdquo: "”",
          ldquo: "“",
          ndash: "–",
          mdash: "—",
          hellip: "…",
        })[entity],
    );

const normalizeText = (value) => decodeHtml(value).replace(/\s+/g, " ").trim();
const translatableShortTokens = new Set(["F", "M", "W", "S", "T"]);
const isFixedToken = (value) =>
  !translatableShortTokens.has(value) &&
  (!/[\p{L}]{2,}/u.test(value) ||
    /^[A-Z]{1,3}$/.test(value) ||
    /^[\d\s.,/%:+-]+(?:kcal|g|kg|lb|cm)?$/i.test(value) ||
    /^(?:[^\s@]+@[^\s@]+|(?:https?:\/\/)?[\w.-]+\.[a-z]{2,})$/i.test(value));
const isContent = (value) =>
  value &&
  !value.includes("{{") &&
  !isFixedToken(value);

const encodeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getTagName = (token) => token.match(/^<\/?\s*([\w-]+)/)?.[1]?.toLowerCase();
const isClosingTag = (token) => /^<\//.test(token);
const isOpeningTag = (token) =>
  /^<[\w-]/.test(token) && !/^<\//.test(token) && !/^<!/.test(token);

const collectPage = (html, pageKey) => {
  const values = [];
  const stack = [];
  const tokens = html.match(/<!--[\s\S]*?-->|<![^>]*>|<\/?[^>]+>|[^<]+/g) || [];

  for (const token of tokens) {
    if (token.startsWith("<")) {
      const tagName = getTagName(token);

      if (isClosingTag(token) && tagName) {
        const matchingIndex = stack.lastIndexOf(tagName);
        if (matchingIndex >= 0) stack.splice(matchingIndex);
        continue;
      }

      if (!isOpeningTag(token) || !tagName) continue;

      const isDescriptionMeta =
        tagName === "meta" && /\bname\s*=\s*["']description["']/i.test(token);
      const isAltMeta =
        tagName === "meta" &&
        /\b(?:property|name)\s*=\s*["'](?:og:image:alt|twitter:image:alt)["']/i.test(
          token,
        );

      token.replace(
        /\b([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g,
        (_, attributeName, _quote, rawValue) => {
          const name = attributeName.toLowerCase();
          const shouldTranslate =
            translatedAttributes.has(name) ||
            (name === "content" && (isDescriptionMeta || isAltMeta));
          const value = normalizeText(rawValue);
          if (shouldTranslate && isContent(value)) {
            values.push({ value, pageKey });
          }
          return "";
        },
      );

      if (!voidElements.has(tagName) && !/\/\s*>$/.test(token)) {
        stack.push(tagName);
      }
      continue;
    }

    if (stack.some((tagName) => textExcludedElements.has(tagName))) continue;
    const value = normalizeText(token);
    if (isContent(value)) values.push({ value, pageKey });
  }

  return values;
};

const flattenCatalog = (catalog, prefix = "", result = new Map()) => {
  for (const [key, value] of Object.entries(catalog || {})) {
    const pathKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") result.set(value, pathKey);
    else if (value && typeof value === "object") flattenCatalog(value, pathKey, result);
  }
  return result;
};

const setCatalogValue = (catalog, key, value) => {
  const segments = key.split(".");
  const leaf = segments.pop();
  let target = catalog;
  for (const segment of segments) {
    target[segment] ||= {};
    target = target[segment];
  }
  target[leaf] = value;
};

const deleteCatalogValue = (catalog, key) => {
  const segments = key.split(".");
  const leaf = segments.pop();
  let target = catalog;
  for (const segment of segments) {
    target = target?.[segment];
    if (!target || typeof target !== "object") return;
  }
  delete target[leaf];
};

const slugify = (value) => {
  const slug = value
    .normalize("NFKD")
    .replace(/[’']/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 56)
    .replace(/_+$/g, "");
  return slug || "text";
};

const loadCatalog = async (file) =>
  existsSync(file) ? JSON.parse(await readFile(file, "utf8")) : {};

const englishCatalog = await loadCatalog(englishFile);
const hardcodedByKey = new Map(
  [...flattenCatalog(englishCatalog)].flatMap(([value, key]) =>
    isContent(value) ? [] : [[key, value]],
  ),
);

for (const key of hardcodedByKey.keys()) deleteCatalogValue(englishCatalog, key);

const restoreHardcodedValues = (html) =>
  html.replace(/\{\{([\w.]+)\}\}/g, (placeholder, key) =>
    hardcodedByKey.has(key) ? encodeHtml(hardcodedByKey.get(key)) : placeholder,
  );

const sources = await Promise.all(
  pages.map(async (page) => ({
    ...page,
    html: restoreHardcodedValues(await readFile(page.file, "utf8")),
  })),
);
const occurrences = sources.flatMap(({ html, key }) => collectPage(html, key));
const stats = new Map();

for (const occurrence of occurrences) {
  const entry = stats.get(occurrence.value) || { count: 0, pages: new Set() };
  entry.count += 1;
  entry.pages.add(occurrence.pageKey);
  stats.set(occurrence.value, entry);
}

const existingKeysByValue = flattenCatalog(englishCatalog);
const usedKeys = new Set(existingKeysByValue.values());
const keyByValue = new Map(existingKeysByValue);

for (const { value, pageKey } of occurrences) {
  if (keyByValue.has(value)) continue;
  const stat = stats.get(value);
  const scope = stat.count > 1 || stat.pages.size > 1 ? "common" : `pages.${pageKey}`;
  const baseKey = `${scope}.${slugify(value)}`;
  let key = baseKey;
  let suffix = 2;
  while (usedKeys.has(key)) key = `${baseKey}_${suffix++}`;
  usedKeys.add(key);
  keyByValue.set(value, key);
  setCatalogValue(englishCatalog, key, value);
}

const localizeRoutes = (html) =>
  html
    .replace(/href="\/terms-and-use\/"/g, 'href="{{routes.termsOfUse}}"')
    .replace(/href="\/terms-of-use\/"/g, 'href="{{routes.termsOfUse}}"')
    .replace(/href="\/privacy-policy\/"/g, 'href="{{routes.privacyPolicy}}"')
    .replace(/href="\/"/g, 'href="{{routes.home}}"');

const transformPage = (html) => {
  const stack = [];
  const tokens = localizeRoutes(html).match(
    /<!--[\s\S]*?-->|<![^>]*>|<\/?[^>]+>|[^<]+/g,
  ) || [];

  return tokens
    .map((token) => {
      if (token.startsWith("<")) {
        const tagName = getTagName(token);

        if (isClosingTag(token) && tagName) {
          const matchingIndex = stack.lastIndexOf(tagName);
          if (matchingIndex >= 0) stack.splice(matchingIndex);
          return token;
        }

        if (!isOpeningTag(token) || !tagName) return token;

        const isDescriptionMeta =
          tagName === "meta" && /\bname\s*=\s*["']description["']/i.test(token);
        const isAltMeta =
          tagName === "meta" &&
          /\b(?:property|name)\s*=\s*["'](?:og:image:alt|twitter:image:alt)["']/i.test(
            token,
          );
        const transformedTag = token.replace(
          /\b([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g,
          (attribute, attributeName, quote, rawValue) => {
            const name = attributeName.toLowerCase();
            const shouldTranslate =
              translatedAttributes.has(name) ||
              (name === "content" && (isDescriptionMeta || isAltMeta));
            const value = normalizeText(rawValue);
            const key = shouldTranslate ? keyByValue.get(value) : undefined;
            return key ? `${attributeName}=${quote}{{${key}}}${quote}` : attribute;
          },
        );

        if (!voidElements.has(tagName) && !/\/\s*>$/.test(token)) {
          stack.push(tagName);
        }
        return transformedTag;
      }

      if (stack.some((tagName) => textExcludedElements.has(tagName))) return token;
      const value = normalizeText(token);
      const key = keyByValue.get(value);
      if (!key || !isContent(value)) return token;
      const leadingWhitespace = token.match(/^\s*/)?.[0] || "";
      const trailingWhitespace = token.match(/\s*$/)?.[0] || "";
      return `${leadingWhitespace}{{${key}}}${trailingWhitespace}`;
    })
    .join("");
};

await mkdir(localeDirectory, { recursive: true });
for (const source of sources) {
  await writeFile(source.file, transformPage(source.html));
}
await writeFile(englishFile, `${JSON.stringify(englishCatalog, null, 2)}\n`);

if (!existsSync(georgianFile)) {
  await writeFile(georgianFile, `${JSON.stringify(englishCatalog, null, 2)}\n`);
} else {
  const georgianCatalog = await loadCatalog(georgianFile);
  for (const key of hardcodedByKey.keys()) deleteCatalogValue(georgianCatalog, key);
  for (const [value, key] of keyByValue) {
    const existingValue = key
      .split(".")
      .reduce((catalogValue, segment) => catalogValue?.[segment], georgianCatalog);
    if (typeof existingValue !== "string") setCatalogValue(georgianCatalog, key, value);
  }
  await writeFile(georgianFile, `${JSON.stringify(georgianCatalog, null, 2)}\n`);
}

console.log(
  `Extracted ${keyByValue.size} localized strings; kept ${hardcodedByKey.size} fixed tokens in HTML.`,
);
