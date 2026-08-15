const modal = document.querySelector("#waitlist-modal");
const dialog = modal?.querySelector(".waitlist-dialog");
const form = document.querySelector("#waitlist-form");
const emailInput = document.querySelector("#waitlist-email");
const statusMessage = document.querySelector("#waitlist-status");
const submitButton = form?.querySelector('button[type="submit"]');
const successMessage = document.querySelector("#waitlist-success");
const featuredPreview = document.querySelector("#waitlist-featured-preview");
const nextFeaturedPreview = document.querySelector("#waitlist-featured-preview-next");
const previewStage = featuredPreview?.parentElement;
const previewThumbnails = [...document.querySelectorAll(".waitlist-previews img")];

if (
  modal &&
  dialog &&
  form &&
  emailInput &&
  statusMessage &&
  submitButton &&
  successMessage
) {
  let autoOpenTimer;
  let lastFocusedElement;
  let closeTimer;

  const clearAutoOpen = () => {
    if (autoOpenTimer) {
      window.clearTimeout(autoOpenTimer);
      autoOpenTimer = undefined;
    }
  };

  const openModal = () => {
    clearAutoOpen();
    window.clearTimeout(closeTimer);
    lastFocusedElement = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");

    window.requestAnimationFrame(() => {
      modal.classList.add("is-open");
      emailInput.focus();
    });
  };

  const closeModal = () => {
    clearAutoOpen();
    modal.classList.remove("is-open");
    document.body.classList.remove("modal-open");

    closeTimer = window.setTimeout(() => {
      modal.hidden = true;
      if (lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus();
      }
    }, 340);
  };

  const setStatus = (message, state = "") => {
    statusMessage.textContent = message;
    statusMessage.dataset.state = state;
  };

  document.querySelectorAll("[data-waitlist-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openModal();
    });
  });

  modal.querySelectorAll("[data-waitlist-close]").forEach((trigger) => {
    trigger.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (modal.hidden) return;

    if (event.key === "Escape") {
      closeModal();
      return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = [
      ...dialog.querySelectorAll('button, input, [tabindex="0"]'),
    ].filter((element) => !element.disabled);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("");

    if (!emailInput.checkValidity()) {
      setStatus("Please enter a valid email address.", "error");
      emailInput.focus();
      return;
    }

    const originalButtonLabel = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Joining…";

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.value.trim() }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Unable to join right now.");
      }

      form.reset();
      form.hidden = true;
      successMessage.hidden = false;
      setStatus("");
    } catch (error) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonLabel;
      setStatus(error.message || "Unable to join right now. Please try again.", "error");
    }
  });

  let previewSwapTimer;
  let previewTransitionId = 0;

  const commitPreview = (source, alt) => {
    previewStage.classList.add("is-resetting");
    featuredPreview.src = source;
    featuredPreview.alt = alt;
    previewStage.classList.remove("is-crossfading");
    void previewStage.offsetWidth;
    previewStage.classList.remove("is-resetting");
  };

  const selectPreview = (thumbnail) => {
    if (
      !featuredPreview ||
      !nextFeaturedPreview ||
      !previewStage ||
      thumbnail.classList.contains("is-active")
    ) {
      return;
    }

    window.clearTimeout(previewSwapTimer);
    const transitionId = ++previewTransitionId;
    const nextSource = thumbnail.getAttribute("src");
    const nextAlt = thumbnail.getAttribute("alt") || "Fitroom app preview";

    previewThumbnails.forEach((item) => {
      const isSelected = item === thumbnail;
      item.classList.toggle("is-active", isSelected);
      item.setAttribute("aria-pressed", String(isSelected));
    });

    if (previewStage.classList.contains("is-crossfading")) {
      commitPreview(
        nextFeaturedPreview.src,
        nextFeaturedPreview.dataset.alt || nextAlt,
      );
    }

    nextFeaturedPreview.src = nextSource;
    nextFeaturedPreview.dataset.alt = nextAlt;

    const beginCrossfade = () => {
      if (transitionId !== previewTransitionId) return;

      window.requestAnimationFrame(() => {
        previewStage.classList.add("is-crossfading");
      });

      previewSwapTimer = window.setTimeout(() => {
        commitPreview(nextSource, nextAlt);
      }, 340);
    };

    if (nextFeaturedPreview.complete && nextFeaturedPreview.naturalWidth) {
      beginCrossfade();
    } else {
      nextFeaturedPreview.addEventListener("load", beginCrossfade, { once: true });
    }
  };

  previewThumbnails.forEach((thumbnail) => {
    thumbnail.addEventListener("click", () => selectPreview(thumbnail));
    thumbnail.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectPreview(thumbnail);
      }
    });
  });

  const scheduleAutoOpen = () => {
    autoOpenTimer = window.setTimeout(openModal, 5000);
  };

  if (document.readyState === "complete") {
    scheduleAutoOpen();
  } else {
    window.addEventListener("load", scheduleAutoOpen, { once: true });
  }
}
