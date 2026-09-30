import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { onRequest } from "../functions/get.js";
import { findLocalizedRoute, renderLocalizedHtml } from "../i18n/build.js";
import { appStores, getAppStoreUrl } from "../src/app-stores.js";

const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";
const android = "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36";
const desktop = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36";

for (const [name, agent, expected] of [
  ["iPhone Safari", iphone, appStores.appStore],
  ["iPhone Chrome", iphone.replace("Version/18.0", "CriOS/130.0.0.0"), appStores.appStore],
  ["iPhone in-app browser", `${iphone} [FBAN/FBIOS]`, appStores.appStore],
  ["Android Chrome", android, appStores.googlePlay],
  ["Android Firefox", "Mozilla/5.0 (Android 15; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0", appStores.googlePlay],
  ["lowercase user agent", "iphone", appStores.appStore],
  ["Mac", desktop, null],
  ["Windows", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0", null],
  ["Linux", "Mozilla/5.0 (X11; Linux x86_64) Firefox/130.0", null],
  ["Windows Phone with compatibility tokens", "Windows Phone 10.0; Android 4.2.1; Microsoft; like iPhone", null],
  ["unrecognized device", "ExampleBrowser/1.0", null],
  ["missing user agent", undefined, null],
]) {
  test(`${name} selects the expected store or manual choice`, () => {
    assert.equal(getAppStoreUrl(agent), expected);
  });
}

for (const path of ["/get", "/get/", "/get?utm_source=qr"]) {
  for (const [agent, destination] of [[iphone, appStores.appStore], [android, appStores.googlePlay]]) {
    test(`${path} sends mobile GET and HEAD directly to ${destination}`, () => {
      for (const method of ["GET", "HEAD"]) {
        const response = onRequest({
          request: new Request(`https://app.fitroom.ge${path}`, {
            method,
            headers: { "User-Agent": agent },
          }),
          next: () => assert.fail("Mobile request must not serve the chooser"),
        });
        assert.equal(response.status, 302);
        assert.equal(response.headers.get("Location"), destination);
        assert.equal(response.headers.get("Cache-Control"), "no-store");
        assert.equal(response.headers.get("Vary"), "User-Agent");
        assert.equal(response.body, null);
      }
    });
  }
}

test("desktop, missing user agent and non-navigation methods fall through", () => {
  const fallback = new Response("Choose a store");
  for (const options of [
    {},
    { headers: { "User-Agent": desktop } },
    { method: "POST", headers: { "User-Agent": iphone } },
  ]) {
    assert.equal(onRequest({
      request: new Request("https://app.fitroom.ge/get", options),
      next: () => fallback,
    }), fallback);
  }
});

const browserScript = (await readFile(new URL("../src/get.js", import.meta.url), "utf8"))
  .replace(/^import .*;\n/m, "");

function browserDestination({ userAgent = desktop, language = "en-US", pathname = "/get", search = "", hash = "" } = {}) {
  let result;
  vm.runInNewContext(browserScript, {
    getAppStoreUrl,
    navigator: { userAgent, languages: [language], language },
    window: { location: { pathname, search, hash, replace: (url) => { result = url; } } },
  });
  return result;
}

test("static hosts and localized pages also redirect mobile visitors", () => {
  for (const pathname of ["/get", "/get/", "/en/get/", "/ka/get/"]) {
    assert.equal(browserDestination({ pathname, userAgent: iphone }), appStores.appStore);
    assert.equal(browserDestination({ pathname, userAgent: android }), appStores.googlePlay);
  }
});

test("desktop chooser uses Georgian primary language without a redirect loop", () => {
  assert.equal(browserDestination({ language: "ka-GE", search: "?source=qr", hash: "#download" }), "/ka/get/?source=qr#download");
  assert.equal(browserDestination({ language: "ka", pathname: "/ka/get/" }), undefined);
  assert.equal(browserDestination({ language: "ka", pathname: "/en/get/" }), undefined);
  assert.equal(browserDestination(), undefined);
  assert.equal(browserDestination({ language: "fr-FR" }), undefined);
});

for (const locale of ["en", "ka"]) {
  test(`${locale} chooser and homepage share usable store badges without JavaScript`, async () => {
    for (const [pageKey, file] of [["home", "../index.html"], ["get", "../get/index.html"]]) {
      const template = await readFile(new URL(file, import.meta.url), "utf8");
      const html = renderLocalizedHtml(template, locale, pageKey);
      assert.ok(!html.includes("{{"));
      assert.ok(html.includes(`lang="${locale}"`));
      for (const url of Object.values(appStores)) assert.ok(html.includes(`href="${url}"`));
      for (const badge of ["appstore", "playstore"]) assert.ok(html.includes(`src="/${badge}.svg"`));
      if (pageKey === "get") {
        assert.ok(html.includes(locale === "ka" ? "აირჩიე App Store" : "Choose the App Store"));
        assert.ok(html.includes(`href="/${locale}/"`));
      }
    }
    assert.equal(findLocalizedRoute(`/${locale}/get`).pageKey, "get");
    assert.equal(findLocalizedRoute(`/${locale}/get/`).locale, locale);
  });
}
