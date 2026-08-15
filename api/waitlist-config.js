export const fallbackWebhookBase64 =
  "aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTUzODE2ODgwNjE4OTMxMDAyMy9QaVpLRTg0eWpjV01hNlp5MzNyeTBlSkpmOTlfcjdFX3EyU0xuWXoxdG1qOG5YWDltSnZZMDloV2t0cHlWc29kWmlZZQ==";

export const waitlistEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validWaitlistSources = new Set([
  "automatic-modal",
  "appstore-header",
  "appstore-footer",
  "camera-modal",
  "googleplay-header",
  "googleplay-footer",
  "manual-modal",
]);
