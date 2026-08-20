import { gsap } from "gsap";

const DESKTOP_ATMOSPHERE_QUERY =
  "(min-width: 768px) and (min-height: 650px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

const canRenderAtmosphere = () => {
  if (!window.WebGL2RenderingContext) return false;
  if (navigator.connection?.saveData) return false;
  if (navigator.deviceMemory && navigator.deviceMemory < 4) return false;
  return true;
};

const RING_TARGETS = new Map([
  ["progress-35", "126deg"],
  ["progress-36", "129.6deg"],
  ["progress-40", "144deg"],
  ["progress-41", "147.6deg"],
  ["progress-56", "201.6deg"],
  ["progress-63", "226.8deg"],
]);

const getRingTarget = (ring) => {
  for (const className of ring.classList) {
    if (RING_TARGETS.has(className)) return RING_TARGETS.get(className);
  }
  return ring.classList.contains("reference-ring-large") ? "169.2deg" : "0deg";
};

const setupContentAnimation = (scene) => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const status = scene.querySelector(".reference-status");
  const island = scene.querySelector(".phone-island");
  const wordmark = scene.querySelector(".phone-wordmark");
  const week = scene.querySelector(".reference-week");
  const calorieCard = scene.querySelector(".reference-calorie-card");
  const macroCards = [...scene.querySelectorAll(".reference-macro-card")];
  const pages = scene.querySelector(".reference-pages");
  const nutritionTitle = scene.querySelector(".reference-nutrition-title");
  const nutritionCard = scene.querySelector(".reference-nutrition-card");
  const tabBar = scene.querySelector(".reference-tab-bar");
  const rail = scene.querySelector(".reference-week-rail path");
  const rings = [...scene.querySelectorAll(".reference-ring")];
  const animatedParts = [
    status,
    island,
    wordmark,
    week,
    calorieCard,
    ...macroCards,
    pages,
    nutritionTitle,
    nutritionCard,
    tabBar,
  ].filter(Boolean);
  let timeline;
  let observer;
  let glintCall;
  let guideCall;
  let guideHideCall;
  let started = false;
  let demoEngaged = false;

  const onDemoEngaged = () => {
    demoEngaged = true;
    guideCall?.kill();
    guideHideCall?.kill();
    scene.classList.remove("is-plus-guided");
  };

  const clearTransientState = () => {
    timeline?.kill();
    glintCall?.kill();
    guideCall?.kill();
    guideHideCall?.kill();
    gsap.set(animatedParts, {
      clearProps: "transform,opacity,visibility,willChange",
    });
    gsap.set(rings, { clearProps: "transform,--ring-progress" });
    if (rail) {
      gsap.set(rail, { clearProps: "strokeDasharray,strokeDashoffset" });
    }
    scene.classList.remove(
      "is-content-pending",
      "is-content-animating",
      "is-content-glinting",
      "is-plus-guided",
    );
  };

  const play = () => {
    if (started) return;
    started = true;
    observer?.disconnect();

    if (reducedMotion.matches) {
      clearTransientState();
      return;
    }

    scene.classList.add("is-content-animating");
    gsap.set([status, island], {
      autoAlpha: 0,
      y: -10,
      z: 24,
      scale: 0.96,
      force3D: true,
    });
    gsap.set(wordmark, { autoAlpha: 0, x: -18, z: 28, force3D: true });
    gsap.set(week, {
      autoAlpha: 0,
      y: -12,
      z: 30,
      rotationX: -5,
      force3D: true,
    });
    gsap.set(calorieCard, {
      autoAlpha: 0,
      x: 24,
      y: 8,
      z: 42,
      rotationY: -6,
      scale: 0.97,
      force3D: true,
    });
    gsap.set(macroCards, {
      autoAlpha: 0,
      y: 20,
      z: 34,
      rotationX: -7,
      scale: 0.95,
      force3D: true,
    });
    gsap.set([pages, nutritionTitle], {
      autoAlpha: 0,
      y: 13,
      z: 24,
      force3D: true,
    });
    gsap.set(nutritionCard, {
      autoAlpha: 0,
      y: 24,
      z: 38,
      rotationX: -5,
      force3D: true,
    });
    gsap.set(tabBar, {
      autoAlpha: 0,
      y: 28,
      z: 44,
      rotationX: -7,
      scale: 0.97,
      force3D: true,
    });
    gsap.set(rings, { "--ring-progress": "0deg", rotation: -14, scale: 0.92 });

    if (rail) {
      const length = Math.ceil(rail.getTotalLength?.() || 210);
      gsap.set(rail, { strokeDasharray: length, strokeDashoffset: length });
    }

    timeline = gsap.timeline({ defaults: { ease: "expo.out", force3D: true } });
    timeline
      .to([status, island], { autoAlpha: 1, y: 0, z: 0, scale: 1, duration: 0.52 }, 0)
      .to(wordmark, { autoAlpha: 1, x: 0, z: 0, duration: 0.56 }, 0.08)
      .to(week, { autoAlpha: 1, y: 0, z: 0, rotationX: 0, duration: 0.62 }, 0.14)
      .to(
        calorieCard,
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          z: 0,
          rotationY: 0,
          scale: 1,
          duration: 0.68,
        },
        0.23,
      )
      .to(
        macroCards,
        {
          autoAlpha: 1,
          y: 0,
          z: 0,
          rotationX: 0,
          scale: 1,
          duration: 0.58,
          stagger: 0.07,
        },
        0.34,
      )
      .to([pages, nutritionTitle], { autoAlpha: 1, y: 0, z: 0, duration: 0.48 }, 0.52)
      .to(
        nutritionCard,
        { autoAlpha: 1, y: 0, z: 0, rotationX: 0, duration: 0.58 },
        0.58,
      )
      .to(
        tabBar,
        {
          autoAlpha: 1,
          y: 0,
          z: 0,
          rotationX: 0,
          scale: 1,
          duration: 0.58,
        },
        0.66,
      );

    rings.forEach((ring, index) => {
      timeline.to(
        ring,
        {
          "--ring-progress": getRingTarget(ring),
          rotation: 0,
          scale: 1,
          duration: 0.62,
          ease: "power3.out",
        },
        0.35 + index * 0.05,
      );
    });

    if (rail) {
      timeline.to(
        rail,
        { strokeDashoffset: 0, duration: 0.62, ease: "power2.out" },
        0.22,
      );
    }

    timeline.eventCallback("onComplete", () => {
      scene.classList.remove("is-content-pending", "is-content-animating");
      scene.classList.add("is-content-glinting");
      gsap.set(animatedParts, {
        clearProps: "transform,opacity,visibility,willChange",
      });
      gsap.set(rings, { clearProps: "transform,--ring-progress" });
      if (rail) {
        gsap.set(rail, { clearProps: "strokeDasharray,strokeDashoffset" });
      }
      glintCall = gsap.delayedCall(0.9, () => {
        scene.classList.remove("is-content-glinting");
      });
      if (!demoEngaged) {
        guideCall = gsap.delayedCall(0.25, () => {
          if (demoEngaged) return;
          scene.classList.add("is-plus-guided");
          guideHideCall = gsap.delayedCall(2.2, () => {
            scene.classList.remove("is-plus-guided");
          });
        });
      }
    });
  };

  const onReducedMotionChange = (event) => {
    if (!event.matches) return;
    started = true;
    observer?.disconnect();
    clearTransientState();
  };

  if (reducedMotion.matches) {
    started = true;
    clearTransientState();
    return () => clearTransientState();
  }

  window.addEventListener("fitroom:demo-engaged", onDemoEngaged);
  reducedMotion.addEventListener?.("change", onReducedMotionChange);
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.35) play();
      },
      { rootMargin: "0px", threshold: 0.35 },
    );
    observer.observe(scene);

    const bounds = scene.getBoundingClientRect();
    const visibleHeight = Math.max(
      0,
      Math.min(bounds.bottom, window.innerHeight) - Math.max(bounds.top, 0),
    );
    const visibleRatio = visibleHeight / Math.min(bounds.height, window.innerHeight);
    if (visibleRatio >= 0.35) play();
  } else {
    play();
  }

  return () => {
    observer?.disconnect();
    window.removeEventListener("fitroom:demo-engaged", onDemoEngaged);
    reducedMotion.removeEventListener?.("change", onReducedMotionChange);
    clearTransientState();
  };
};

const setInteractive = (element, isInteractive) => {
  if (!element) return;
  element.inert = !isInteractive;
  element.setAttribute("aria-hidden", String(!isInteractive));
};

const setupChoiceGroups = (root) => {
  const cleanups = [];

  root.querySelectorAll("[data-phone-choice-group]").forEach((group) => {
    const choices = [...group.querySelectorAll("[data-phone-choice]")];
    choices.forEach((choice) => {
      const onClick = () => {
        choices.forEach((candidate) => {
          const selected = candidate === choice;
          candidate.classList.toggle("is-selected", selected);
          candidate.setAttribute("aria-pressed", String(selected));
        });
        const galleryScreen = group.closest("[data-gallery-section]");
        if (galleryScreen && choice.dataset.gallerySectionChoice) {
          galleryScreen.dataset.gallerySection = choice.dataset.gallerySectionChoice;
        }
      };
      choice.addEventListener("click", onClick);
      cleanups.push(() => choice.removeEventListener("click", onClick));
    });
  });

  return () => cleanups.forEach((cleanup) => cleanup());
};

const setupAtmosphere = (scene) => {
  const canvas = scene.querySelector("[data-phone-atmosphere]");
  if (!canvas || !window.matchMedia) return () => {};

  const desktopMedia = window.matchMedia(DESKTOP_ATMOSPHERE_QUERY);
  let atmosphere;
  let requestGeneration = 0;
  let sceneIsVisible = true;

  const destroyAtmosphere = () => {
    requestGeneration += 1;
    atmosphere?.destroy?.();
    atmosphere = undefined;
    scene.classList.remove("has-webgl");
  };

  const syncPlayback = () => {
    if (!atmosphere) return;
    if (sceneIsVisible && !document.hidden) atmosphere.resume?.();
    else atmosphere.pause?.();
  };

  const syncAtmosphere = () => {
    if (!desktopMedia.matches || !canRenderAtmosphere()) {
      destroyAtmosphere();
      return;
    }
    if (atmosphere) {
      syncPlayback();
      return;
    }

    const generation = ++requestGeneration;
    import("./phone-atmosphere.js")
      .then(({ createPhoneAtmosphere }) => {
        if (generation !== requestGeneration || !desktopMedia.matches) return;
        atmosphere = createPhoneAtmosphere(canvas, {
          maxDpr: 1.25,
          motionScale: 0.62,
          particleCount: 42,
          pointerTarget: false,
          paused: !sceneIsVisible || document.hidden,
          palette: {
            ice: "#d7fbf8",
            violet: "#aebcff",
            blush: "#f0c9e8",
            particle: "#f4ffff",
          },
        });
        if (!atmosphere?.supported) {
          atmosphere = undefined;
          return;
        }
        scene.classList.add("has-webgl");
        syncPlayback();
      })
      .catch(() => destroyAtmosphere());
  };

  const onVisibilityChange = () => syncPlayback();
  const onMediaChange = () => syncAtmosphere();
  let visibilityObserver;

  if ("IntersectionObserver" in window) {
    visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        sceneIsVisible = Boolean(entry?.isIntersecting);
        syncPlayback();
      },
      { rootMargin: "120px 0px", threshold: 0.04 },
    );
    visibilityObserver.observe(scene);
  }

  document.addEventListener("visibilitychange", onVisibilityChange);
  desktopMedia.addEventListener?.("change", onMediaChange);
  syncAtmosphere();

  return () => {
    visibilityObserver?.disconnect();
    document.removeEventListener("visibilitychange", onVisibilityChange);
    desktopMedia.removeEventListener?.("change", onMediaChange);
    destroyAtmosphere();
  };
};

const setupPhoneDemo = (scene) => {
  const addMealButton = scene.querySelector(".reference-add");
  const cameraScreen = scene.querySelector(".meal-camera-screen");
  const closeCameraButton = scene.querySelector(".meal-camera-close");
  const shutterButton = scene.querySelector(".meal-camera-shutter");
  const cameraModes = [...scene.querySelectorAll(".meal-camera-mode")];
  const flashlightButton = scene.querySelector("[data-camera-flashlight]");
  const guideButton = scene.querySelector("[data-camera-guide]");
  const demoScreens = new Map(
    [...scene.querySelectorAll("[data-phone-demo-screen]")].map((screen) => [
      screen.dataset.phoneDemoScreen,
      screen,
    ]),
  );
  const galleryTiles = [...scene.querySelectorAll("[data-gallery-photo]")];
  const manualGenerateButton = scene.querySelector("[data-manual-generate]");
  const resultFixButton = scene.querySelector("[data-result-fix]");
  const resultDoneButton = scene.querySelector("[data-result-done]");
  const feedbackButtons = [...scene.querySelectorAll("[data-result-feedback]")];
  const actionButtons = [...scene.querySelectorAll("[data-phone-demo-action]")];
  const phoneScreen = scene.querySelector(".phone-screen");
  const overlayElements = new Set([cameraScreen, ...demoScreens.values()]);
  const dashboardElements = phoneScreen
    ? [...phoneScreen.children].filter((element) => !overlayElements.has(element))
    : [];
  const dashboardState = new Map(
    dashboardElements.map((element) => [
      element,
      {
        inert: element.inert,
        ariaHidden: element.getAttribute("aria-hidden"),
        hadAriaHidden: element.hasAttribute("aria-hidden"),
      },
    ]),
  );
  const modeHandlers = [];
  const actionHandlers = [];
  const galleryHandlers = [];
  const feedbackHandlers = [];
  let viewStack = [];
  let focusTimer;

  if (!addMealButton || !cameraScreen || !closeCameraButton || !shutterButton) {
    return () => {};
  }

  setInteractive(cameraScreen, false);
  demoScreens.forEach((screen) => setInteractive(screen, false));
  flashlightButton?.setAttribute("aria-pressed", "false");
  guideButton?.setAttribute("aria-pressed", "true");

  const selectCameraMode = (selectedIndex = 0) => {
    cameraModes.forEach((button, index) => {
      const selected = index === selectedIndex;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  };
  selectCameraMode();

  const setDashboardCovered = (isCovered) => {
    dashboardState.forEach((state, element) => {
      if (isCovered) {
        element.inert = true;
        element.setAttribute("aria-hidden", "true");
        return;
      }
      element.inert = state.inert;
      if (state.hadAriaHidden) {
        element.setAttribute("aria-hidden", state.ariaHidden);
      } else {
        element.removeAttribute("aria-hidden");
      }
    });
  };

  const focusView = (viewName) => {
    window.clearTimeout(focusTimer);
    focusTimer = window.setTimeout(() => {
      const activeRoot =
        viewName === "camera" ? cameraScreen : demoScreens.get(viewName);
      activeRoot
        ?.querySelector("[data-phone-initial-focus], button, textarea")
        ?.focus({ preventScroll: true });
    }, 190);
  };

  const activateView = (viewName, shouldFocus = true) => {
    const cameraIsActive = viewName === "camera";
    setInteractive(cameraScreen, cameraIsActive);
    cameraScreen.classList.toggle("is-demo-active", cameraIsActive);

    demoScreens.forEach((screen, name) => {
      const active = name === viewName;
      setInteractive(screen, active);
      screen.classList.toggle("is-active", active);
    });

    scene.dataset.phoneView = viewName;
    if (cameraIsActive) selectCameraMode();
    if (shouldFocus) focusView(viewName);
  };

  const openCamera = () => {
    window.dispatchEvent(new CustomEvent("fitroom:demo-engaged"));
    scene.classList.remove("is-plus-guided");
    scene.classList.add("is-camera-open");
    setDashboardCovered(true);
    addMealButton.tabIndex = -1;
    viewStack = [{ name: "camera", trigger: addMealButton }];
    activateView("camera", false);
    focusView("camera");
  };

  const closeCamera = () => {
    window.clearTimeout(focusTimer);
    scene.classList.remove("is-camera-open");
    delete scene.dataset.phoneView;
    setInteractive(cameraScreen, false);
    cameraScreen.classList.remove("is-demo-active");
    demoScreens.forEach((screen) => {
      setInteractive(screen, false);
      screen.classList.remove("is-active");
    });
    viewStack = [];
    setDashboardCovered(false);
    addMealButton.removeAttribute("tabindex");
    addMealButton.focus({ preventScroll: true });
  };

  const pushView = (name, trigger) => {
    if (!demoScreens.has(name)) return;
    viewStack.push({ name, trigger });
    activateView(name);
  };

  const popView = () => {
    if (viewStack.length <= 1) {
      closeCamera();
      return;
    }
    const leaving = viewStack.pop();
    const destination = viewStack.at(-1);
    activateView(destination.name, false);
    window.clearTimeout(focusTimer);
    focusTimer = window.setTimeout(() => {
      leaving.trigger?.focus?.({ preventScroll: true });
    }, 190);
  };

  const openResult = (trigger) => pushView("result", trigger);
  const onShutter = () => openResult(shutterButton);
  const onCloseCamera = () => closeCamera();
  const onToggleFlashlight = () => {
    const active = cameraScreen.classList.toggle("is-flash-on");
    flashlightButton?.setAttribute("aria-pressed", String(active));
  };
  const onToggleGuide = () => {
    const hidden = cameraScreen.classList.toggle("is-guide-hidden");
    guideButton?.setAttribute("aria-pressed", String(!hidden));
  };
  const onKeydown = (event) => {
    if (event.key !== "Escape" || !scene.classList.contains("is-camera-open")) {
      return;
    }
    const waitlistModal = document.querySelector("#waitlist-modal");
    if (waitlistModal && !waitlistModal.hidden) return;
    event.preventDefault();
    if (viewStack.length > 1) popView();
    else closeCamera();
  };
  const onManualGenerate = () => openResult(manualGenerateButton);
  const onResultFix = () => pushView("manual", resultFixButton);
  const onResultDone = () => closeCamera();

  addMealButton.addEventListener("click", openCamera);
  closeCameraButton.addEventListener("click", onCloseCamera);
  shutterButton.addEventListener("click", onShutter);
  flashlightButton?.addEventListener("click", onToggleFlashlight);
  guideButton?.addEventListener("click", onToggleGuide);
  document.addEventListener("keydown", onKeydown);

  cameraModes.forEach((button, index) => {
    const handler = () => {
      selectCameraMode(index);
      if (index === 1) pushView("manual", button);
      if (index === 2) pushView("gallery", button);
    };
    modeHandlers.push(handler);
    button.addEventListener("click", handler);
  });

  actionButtons.forEach((button) => {
    const handler = () => {
      const action = button.dataset.phoneDemoAction;
      if (action === "back") popView();
      if (action === "close") closeCamera();
    };
    actionHandlers.push(handler);
    button.addEventListener("click", handler);
  });

  galleryTiles.forEach((tile) => {
    const handler = () => openResult(tile);
    galleryHandlers.push(handler);
    tile.addEventListener("click", handler);
  });

  feedbackButtons.forEach((button) => {
    const handler = () => {
      feedbackButtons.forEach((candidate) => {
        const selected = candidate === button;
        candidate.classList.toggle("is-selected", selected);
        candidate.setAttribute("aria-pressed", String(selected));
      });
    };
    feedbackHandlers.push(handler);
    button.addEventListener("click", handler);
  });

  manualGenerateButton?.addEventListener("click", onManualGenerate);
  resultFixButton?.addEventListener("click", onResultFix);
  resultDoneButton?.addEventListener("click", onResultDone);
  const cleanupChoices = setupChoiceGroups(scene);

  return () => {
    window.clearTimeout(focusTimer);
    addMealButton.removeEventListener("click", openCamera);
    closeCameraButton.removeEventListener("click", onCloseCamera);
    shutterButton.removeEventListener("click", onShutter);
    flashlightButton?.removeEventListener("click", onToggleFlashlight);
    guideButton?.removeEventListener("click", onToggleGuide);
    document.removeEventListener("keydown", onKeydown);
    cameraModes.forEach((button, index) =>
      button.removeEventListener("click", modeHandlers[index]),
    );
    actionButtons.forEach((button, index) =>
      button.removeEventListener("click", actionHandlers[index]),
    );
    galleryTiles.forEach((tile, index) =>
      tile.removeEventListener("click", galleryHandlers[index]),
    );
    feedbackButtons.forEach((button, index) =>
      button.removeEventListener("click", feedbackHandlers[index]),
    );
    manualGenerateButton?.removeEventListener("click", onManualGenerate);
    resultFixButton?.removeEventListener("click", onResultFix);
    resultDoneButton?.removeEventListener("click", onResultDone);
    setDashboardCovered(false);
    cleanupChoices();
  };
};

export const initPhoneExperience = (scene) => {
  if (!scene) return () => {};

  scene.classList.remove("is-enhancement-pending", "is-magnetizing", "is-glinting");
  scene.classList.add("is-enhanced", "is-ready");

  const cleanupContentAnimation = setupContentAnimation(scene);
  const cleanupDemo = setupPhoneDemo(scene);
  const cleanupAtmosphere = setupAtmosphere(scene);

  return () => {
    cleanupContentAnimation();
    cleanupDemo();
    cleanupAtmosphere();
  };
};
