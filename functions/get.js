import { getAppStoreUrl } from "../src/app-stores.js";

export function onRequest(context) {
  if (!["GET", "HEAD"].includes(context.request.method)) return context.next();

  const destination = getAppStoreUrl(
    context.request.headers.get("User-Agent") || "",
  );
  if (!destination) return context.next();

  return new Response(null, {
    status: 302,
    headers: {
      Location: destination,
      "Cache-Control": "no-store",
      Vary: "User-Agent",
    },
  });
}
