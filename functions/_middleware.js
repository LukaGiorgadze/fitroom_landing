export function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === "www.app.fitroom.ge") {
    url.hostname = "app.fitroom.ge";
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
