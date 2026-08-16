(function initializeAnalytics() {
  const googleMeasurementId = "G-WN60T53PZM";
  const clarityProjectId = "y394crqsgh";

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  window.gtag("js", new Date());
  window.gtag("config", googleMeasurementId);

  const googleTag = document.createElement("script");
  googleTag.async = true;
  googleTag.src = `https://www.googletagmanager.com/gtag/js?id=${googleMeasurementId}`;
  document.head.append(googleTag);

  window.clarity =
    window.clarity ||
    function clarity() {
      window.clarity.q = window.clarity.q || [];
      window.clarity.q.push(arguments);
    };

  const clarityTag = document.createElement("script");
  clarityTag.async = true;
  clarityTag.src = `https://www.clarity.ms/tag/${clarityProjectId}`;
  document.head.append(clarityTag);
})();
