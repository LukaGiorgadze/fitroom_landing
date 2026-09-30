export const appStores = Object.freeze({
  appStore: "https://apps.apple.com/app/fitroom-calorie-tracker/id6785002301",
  googlePlay: "https://play.google.com/store/apps/details?id=ge.fitroom.app",
});

export function getAppStoreUrl(userAgent = "") {
  // Older Windows phones can advertise both Android and iPhone compatibility.
  if (/Windows Phone/i.test(userAgent)) return null;
  if (/iPhone/i.test(userAgent)) return appStores.appStore;
  if (/Android/i.test(userAgent)) return appStores.googlePlay;
  return null;
}
