const modal = document.querySelector("#waitlist-modal");
const dialog = modal?.querySelector(".waitlist-dialog");
const form = document.querySelector("#waitlist-form");
const emailInput = document.querySelector("#waitlist-email");
const statusMessage = document.querySelector("#waitlist-status");
const submitButton = form?.querySelector('button[type="submit"]');
const successMessage = document.querySelector("#waitlist-success");
const previewStages = [...document.querySelectorAll("[data-waitlist-stage]")]
  .map((stage) => ({
    stage,
    current: stage.querySelector(".waitlist-preview-current"),
    next: stage.querySelector(".waitlist-preview-next"),
  }))
  .filter(({ current, next }) => current && next);
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
  const joinedStorageKey = "fitroom.waitlist.joinedAt";
  let autoOpenTimer;
  let lastFocusedElement;
  let closeTimer;
  let submissionSource = "automatic-modal";

  const hasJoinedWaitlist = () => {
    try {
      return Boolean(window.localStorage.getItem(joinedStorageKey));
    } catch {
      return false;
    }
  };

  const rememberWaitlistSignup = () => {
    try {
      window.localStorage.setItem(joinedStorageKey, new Date().toISOString());
    } catch {
      // The signup still succeeds when storage is unavailable or disabled.
    }
  };

  const clearAutoOpen = () => {
    if (autoOpenTimer) {
      window.clearTimeout(autoOpenTimer);
      autoOpenTimer = undefined;
    }
  };

  const openModal = (source = "automatic-modal") => {
    clearAutoOpen();
    window.clearTimeout(closeTimer);
    submissionSource = source;
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

  const setEmailError = (hasError) => {
    emailInput.classList.toggle("is-error", hasError);
    emailInput.setAttribute("aria-invalid", String(hasError));
  };

  emailInput.addEventListener("input", () => {
    setEmailError(false);
    setStatus("");
  });

  document.querySelectorAll("[data-waitlist-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openModal(trigger.dataset.waitlistSource || "manual-modal");
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
    setEmailError(false);

    if (!emailInput.checkValidity()) {
      setStatus("Please enter a valid email address.", "error");
      setEmailError(true);
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
        body: JSON.stringify({
          email: emailInput.value.trim(),
          source: submissionSource,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Unable to join right now.");
      }

      rememberWaitlistSignup();
      setEmailError(false);
      form.reset();
      form.hidden = true;
      successMessage.hidden = false;
      setStatus("");
    } catch (error) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonLabel;
      setEmailError(true);
      setStatus(error.message || "Unable to join right now. Please try again.", "error");
    }
  });

  let previewSwapTimer;
  let previewTransitionId = 0;

  const commitPreview = (source, alt) => {
    previewStages.forEach(({ stage, current }) => {
      stage.classList.add("is-resetting");
      current.src = source;
      current.alt = alt;
      stage.classList.remove("is-crossfading");
    });
    void document.body.offsetWidth;
    previewStages.forEach(({ stage }) => stage.classList.remove("is-resetting"));
  };

  const selectPreview = (thumbnail) => {
    if (!previewStages.length || thumbnail.classList.contains("is-active")) {
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

    const transitioningStage = previewStages.find(({ stage }) =>
      stage.classList.contains("is-crossfading"),
    );

    if (transitioningStage) {
      commitPreview(
        transitioningStage.next.src,
        transitioningStage.next.dataset.alt || nextAlt,
      );
    }

    previewStages.forEach(({ next }) => {
      next.src = nextSource;
      next.dataset.alt = nextAlt;
    });

    const beginCrossfade = () => {
      if (transitionId !== previewTransitionId) return;

      window.requestAnimationFrame(() => {
        previewStages.forEach(({ stage }) => stage.classList.add("is-crossfading"));
      });

      previewSwapTimer = window.setTimeout(() => {
        commitPreview(nextSource, nextAlt);
      }, 340);
    };

    Promise.all(
      previewStages.map(({ next }) =>
        typeof next.decode === "function" ? next.decode().catch(() => {}) : Promise.resolve(),
      ),
    ).then(beginCrossfade);
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
    if (hasJoinedWaitlist()) return;
    autoOpenTimer = window.setTimeout(
      () => openModal("automatic-modal"),
      15000,
    );
  };

  if (document.readyState === "complete") {
    scheduleAutoOpen();
  } else {
    window.addEventListener("load", scheduleAutoOpen, { once: true });
  }
}

const phoneScene = document.querySelector(".phone-scene");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

if (phoneScene && !reducedMotionQuery.matches) {
  document.documentElement.classList.add("has-phone-assembly");

  const assemblyField = document.createElement("div");
  assemblyField.className = "assembly-field";
  assemblyField.setAttribute("aria-hidden", "true");

  phoneScene.prepend(assemblyField);

  let bootTimer;
  let brandTimer;
  let assemblyTimer;
  let guideTimer;

  const addMealButton = phoneScene.querySelector(".reference-add");

  const finishAssembly = () => {
    phoneScene.classList.remove(
      "is-booting",
      "is-branding",
      "is-assembling",
      "is-pending",
    );
    phoneScene.classList.add("is-assembled");
    guideTimer = window.setTimeout(() => {
      phoneScene.classList.add("is-plus-guided");
    }, 350);
  };

  const playAssembly = () => {
    window.clearTimeout(bootTimer);
    window.clearTimeout(brandTimer);
    window.clearTimeout(assemblyTimer);
    window.clearTimeout(guideTimer);
    phoneScene.classList.remove(
      "is-pending",
      "is-assembled",
      "is-booting",
      "is-branding",
      "is-assembling",
      "is-plus-guided",
    );
    void phoneScene.offsetWidth;
    phoneScene.classList.add("is-booting");

    bootTimer = window.setTimeout(() => {
      phoneScene.classList.remove("is-booting");
      phoneScene.classList.add("is-branding");

      brandTimer = window.setTimeout(() => {
        phoneScene.classList.remove("is-branding");
        void phoneScene.offsetWidth;
        phoneScene.classList.add("is-assembling");
        assemblyTimer = window.setTimeout(finishAssembly, 3200);
      }, 1100);
    }, 850);
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        playAssembly();
      },
      { threshold: 0.28 },
    );
    observer.observe(phoneScene);
  } else {
    playAssembly();
  }

  addMealButton?.addEventListener("click", () => {
    window.clearTimeout(guideTimer);
    phoneScene.classList.remove("is-plus-guided");
  });
}
