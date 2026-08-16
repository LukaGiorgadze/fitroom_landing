document.querySelectorAll("[data-language-switch]").forEach((link) => {
  link.addEventListener("click", () => {
    if (!window.location.hash) return;

    const destination = new URL(link.href, window.location.origin);
    destination.hash = window.location.hash;
    link.href = destination.toString();
  });
});
