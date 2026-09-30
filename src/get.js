import { getAppStoreUrl } from "./app-stores.js";

// Also support static hosting and the localized download pages.
const destination = getAppStoreUrl(navigator.userAgent);
if (destination) {
  window.location.replace(destination);
} else if (/^\/get\/?$/.test(window.location.pathname)) {
  const language = (navigator.languages?.[0] || navigator.language || "").toLowerCase();
  if (language === "ka" || language.startsWith("ka-")) {
    window.location.replace(`/ka/get/${window.location.search}${window.location.hash}`);
  }
}
