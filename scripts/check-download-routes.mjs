import assert from "node:assert/strict";
import http from "node:http";
import { createServer, preview } from "vite";
import { appStores } from "../src/app-stores.js";

const dev = await createServer({ server: { host: "127.0.0.1", port: 0 } });
await dev.listen();
const production = await preview({ preview: { host: "127.0.0.1", port: 0 } });
let checks = 0;

try {
  for (const server of [dev.httpServer, production.httpServer]) {
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const path of ["/get", "/get/", "/get?utm_source=qr"]) {
      for (const [userAgent, destination] of [
        ["iPhone", appStores.appStore],
        ["Android", appStores.googlePlay],
      ]) {
        for (const method of ["GET", "HEAD"]) {
          const response = await fetch(base + path, {
            method,
            headers: { "User-Agent": userAgent },
            redirect: "manual",
          });
          assert.equal(response.status, 302);
          assert.equal(response.headers.get("location"), destination);
          assert.equal(response.headers.get("cache-control"), "no-store");
          assert.equal(response.headers.get("vary"), "User-Agent");
          checks++;
        }
      }
    }

    for (const path of [
      "/get", "/get/", "/get?utm_source=qr", "/en/get/", "/ka/get/",
      "/en/", "/ka/", "/en/privacy-policy/", "/ka/terms-of-use/",
    ]) {
      const response = await fetch(base + path);
      assert.equal(response.status, 200, path);
      const html = await response.text();
      assert.ok(!html.includes("{{"), path);
      assert.ok(html.includes("<html"), path);
      if (path.includes("get")) {
        assert.ok(html.includes("/appstore.svg"), path);
        assert.ok(html.includes("/playstore.svg"), path);
      }
      checks++;
    }

    await new Promise((resolve, reject) => {
      const request = http.request(base + "/get", { method: "TRACE" }, (response) => {
        response.resume();
        response.on("end", resolve);
      });
      request.on("error", reject);
      request.end();
    });
    assert.equal((await fetch(base + "/get")).status, 200);
    checks++;
  }
  console.log(`${checks} HTTP checks passed across Vite dev and production preview.`);
} finally {
  await dev.close();
  await new Promise((resolve) => production.httpServer.close(resolve));
}
