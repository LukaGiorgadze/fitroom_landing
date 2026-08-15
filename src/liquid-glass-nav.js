const nav = document.querySelector("[data-liquid-nav]");

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const REFRACTION_CONFIG = Object.freeze({
  glassThickness: 80,
  bezelWidth: 40,
  ior: 1.52,
  scaleRatio: 0.78,
  blur: 1.6,
  specularOpacity: 0.42,
  specularSaturation: 0.9,
  tintColor: "238,244,255",
  tintOpacity: 0.3,
  innerShadow: "rgba(255,255,255,0.28)",
  innerShadowBlur: 14,
  innerShadowSpread: -6,
});

let refractionDefs;

const surfaceProfile = (x) => Math.pow(1 - Math.pow(1 - x, 4), 0.25);

const calculateRefractionProfile = (
  glassThickness,
  bezelWidth,
  ior,
  samples = 128,
) => {
  const eta = 1 / ior;
  const profile = new Float64Array(samples);

  const refract = (normalX, normalY) => {
    const dot = normalY;
    const k = 1 - eta * eta * (1 - dot * dot);
    if (k < 0) return null;
    const root = Math.sqrt(k);
    return [
      -(eta * dot + root) * normalX,
      eta - (eta * dot + root) * normalY,
    ];
  };

  for (let index = 0; index < samples; index += 1) {
    const x = index / samples;
    const y = surfaceProfile(x);
    const delta = x < 1 ? 0.0001 : -0.0001;
    const derivative = (surfaceProfile(x + delta) - y) / delta;
    const magnitude = Math.sqrt(derivative * derivative + 1);
    const ray = refract(-derivative / magnitude, -1 / magnitude);
    profile[index] = ray
      ? ray[0] * ((y * bezelWidth + glassThickness) / ray[1])
      : 0;
  }

  return profile;
};

const createDisplacementMap = (
  width,
  height,
  radius,
  bezelWidth,
  profile,
  maxDisplacement,
) => {
  const map = document.createElement("canvas");
  map.width = width;
  map.height = height;
  const context = map.getContext("2d");
  if (!context) return "";

  const image = context.createImageData(width, height);
  const pixels = image.data;
  for (let index = 0; index < pixels.length; index += 4) {
    pixels[index] = 128;
    pixels[index + 1] = 128;
    pixels[index + 2] = 0;
    pixels[index + 3] = 255;
  }

  const radiusSquared = radius * radius;
  const outerRadiusSquared = (radius + 1) ** 2;
  const innerRadiusSquared = Math.max(radius - bezelWidth, 0) ** 2;
  const horizontalBridge = width - radius * 2;
  const verticalBridge = height - radius * 2;

  for (let yPosition = 0; yPosition < height; yPosition += 1) {
    for (let xPosition = 0; xPosition < width; xPosition += 1) {
      const x =
        xPosition < radius
          ? xPosition - radius
          : xPosition >= width - radius
            ? xPosition - radius - horizontalBridge
            : 0;
      const y =
        yPosition < radius
          ? yPosition - radius
          : yPosition >= height - radius
            ? yPosition - radius - verticalBridge
            : 0;
      const distanceSquared = x * x + y * y;

      if (
        distanceSquared > outerRadiusSquared ||
        distanceSquared < innerRadiusSquared
      ) {
        continue;
      }

      const distance = Math.sqrt(distanceSquared);
      if (distance === 0) continue;
      const distanceFromEdge = radius - distance;
      const opacity =
        distanceSquared < radiusSquared
          ? 1
          : 1 -
            (distance - Math.sqrt(radiusSquared)) /
              (Math.sqrt(outerRadiusSquared) - Math.sqrt(radiusSquared));
      if (opacity <= 0) continue;

      const sample = Math.min(
        Math.floor((distanceFromEdge / bezelWidth) * profile.length),
        profile.length - 1,
      );
      const displacement = profile[Math.max(0, sample)] || 0;
      const displacementX =
        (-(x / distance) * displacement) / maxDisplacement;
      const displacementY =
        (-(y / distance) * displacement) / maxDisplacement;
      const pixelIndex = (yPosition * width + xPosition) * 4;

      pixels[pixelIndex] = 128 + displacementX * 127 * opacity;
      pixels[pixelIndex + 1] = 128 + displacementY * 127 * opacity;
    }
  }

  context.putImageData(image, 0, 0);
  return map.toDataURL();
};

const createSpecularMap = (width, height, radius, bezelWidth) => {
  const map = document.createElement("canvas");
  map.width = width;
  map.height = height;
  const context = map.getContext("2d");
  if (!context) return "";

  const image = context.createImageData(width, height);
  const pixels = image.data;
  const radiusSquared = radius * radius;
  const outerRadiusSquared = (radius + 1) ** 2;
  const innerRadiusSquared = Math.max(radius - bezelWidth, 0) ** 2;
  const horizontalBridge = width - radius * 2;
  const verticalBridge = height - radius * 2;
  const lightAngle = Math.PI / 3;
  const light = [Math.cos(lightAngle), Math.sin(lightAngle)];

  for (let yPosition = 0; yPosition < height; yPosition += 1) {
    for (let xPosition = 0; xPosition < width; xPosition += 1) {
      const x =
        xPosition < radius
          ? xPosition - radius
          : xPosition >= width - radius
            ? xPosition - radius - horizontalBridge
            : 0;
      const y =
        yPosition < radius
          ? yPosition - radius
          : yPosition >= height - radius
            ? yPosition - radius - verticalBridge
            : 0;
      const distanceSquared = x * x + y * y;

      if (
        distanceSquared > outerRadiusSquared ||
        distanceSquared < innerRadiusSquared
      ) {
        continue;
      }

      const distance = Math.sqrt(distanceSquared);
      if (distance === 0) continue;
      const distanceFromEdge = radius - distance;
      const opacity =
        distanceSquared < radiusSquared
          ? 1
          : 1 -
            (distance - Math.sqrt(radiusSquared)) /
              (Math.sqrt(outerRadiusSquared) - Math.sqrt(radiusSquared));
      if (opacity <= 0) continue;

      const lightAmount = Math.abs(
        (x / distance) * light[0] + (-y / distance) * light[1],
      );
      const edge = Math.sqrt(
        Math.max(0, 1 - Math.pow(1 - distanceFromEdge, 2)),
      );
      const coefficient = lightAmount * edge;
      const color = 255 * coefficient;
      const alpha = color * coefficient * opacity;
      const pixelIndex = (yPosition * width + xPosition) * 4;

      pixels[pixelIndex] = color;
      pixels[pixelIndex + 1] = color;
      pixels[pixelIndex + 2] = color;
      pixels[pixelIndex + 3] = alpha;
    }
  }

  context.putImageData(image, 0, 0);
  return map.toDataURL();
};

const createSvgElement = (tag, attributes) => {
  const element = document.createElementNS(SVG_NAMESPACE, tag);
  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, String(value));
  });
  return element;
};

const ensureRefractionDefs = () => {
  if (refractionDefs?.isConnected) return refractionDefs;

  const svg = createSvgElement("svg", { width: 0, height: 0 });
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText =
    "position:fixed;inset:0;width:0;height:0;pointer-events:none;z-index:-1";
  refractionDefs = createSvgElement("defs", { id: "liquid-nav-defs" });
  svg.appendChild(refractionDefs);
  document.documentElement.appendChild(svg);
  return refractionDefs;
};

const buildRefractionFilter = (id, width, height, radius, config) => {
  const bezelWidth = Math.min(
    config.bezelWidth,
    radius - 1,
    Math.min(width, height) / 2 - 1,
  );
  const profile = calculateRefractionProfile(
    config.glassThickness,
    bezelWidth,
    config.ior,
  );
  const maxDisplacement =
    Math.max(...Array.from(profile, (value) => Math.abs(value))) || 1;
  const displacementMap = createDisplacementMap(
    width,
    height,
    radius,
    bezelWidth,
    profile,
    maxDisplacement,
  );
  const specularMap = createSpecularMap(
    width,
    height,
    radius,
    bezelWidth * 2.5,
  );

  const filter = createSvgElement("filter", {
    id,
    x: 0,
    y: 0,
    width,
    height,
    filterUnits: "userSpaceOnUse",
    primitiveUnits: "userSpaceOnUse",
    "color-interpolation-filters": "sRGB",
  });
  const blurred = createSvgElement("feGaussianBlur", {
    in: "SourceGraphic",
    stdDeviation: config.blur,
    result: "blurred",
  });
  const displacementImage = createSvgElement("feImage", {
    href: displacementMap,
    x: 0,
    y: 0,
    width,
    height,
    result: "displacement-map",
  });
  const displaced = createSvgElement("feDisplacementMap", {
    in: "blurred",
    in2: "displacement-map",
    scale: maxDisplacement * config.scaleRatio,
    xChannelSelector: "R",
    yChannelSelector: "G",
    result: "displaced",
  });
  const saturated = createSvgElement("feColorMatrix", {
    in: "displaced",
    type: "saturate",
    values: config.specularSaturation,
    result: "displaced-saturated",
  });
  const specularImage = createSvgElement("feImage", {
    href: specularMap,
    x: 0,
    y: 0,
    width,
    height,
    result: "specular-map",
  });
  const specularMask = createSvgElement("feComposite", {
    in: "displaced-saturated",
    in2: "specular-map",
    operator: "in",
    result: "specular-masked",
  });
  const fadedSpecular = createSvgElement("feComponentTransfer", {
    in: "specular-map",
    result: "specular-faded",
  });
  fadedSpecular.appendChild(
    createSvgElement("feFuncA", {
      type: "linear",
      slope: config.specularOpacity,
    }),
  );
  const saturatedBlend = createSvgElement("feBlend", {
    in: "specular-masked",
    in2: "displaced",
    mode: "normal",
    result: "with-saturation",
  });
  const finalBlend = createSvgElement("feBlend", {
    in: "specular-faded",
    in2: "with-saturation",
    mode: "normal",
  });

  filter.append(
    blurred,
    displacementImage,
    displaced,
    saturated,
    specularImage,
    specularMask,
    fadedSpecular,
    saturatedBlend,
    finalBlend,
  );
  return filter;
};

const mountRefraction = (element) => {
  const refractionLayer = document.createElement("span");
  refractionLayer.className = "liquid-nav__refraction";
  refractionLayer.setAttribute("aria-hidden", "true");
  const tintLayer = document.createElement("span");
  tintLayer.className = "liquid-nav__tint";
  tintLayer.setAttribute("aria-hidden", "true");
  element.prepend(tintLayer);
  element.prepend(refractionLayer);

  let filterNode;
  let rebuildTimer;

  const rebuild = () => {
    const width = Math.round(element.offsetWidth);
    const height = Math.round(element.offsetHeight);
    if (width < 4 || height < 4) return;

    const radius = Math.max(2, Math.min(height / 2, width / 2));
    filterNode?.remove();
    const filterId = `liquid-nav-refraction-${Math.random()
      .toString(36)
      .slice(2, 9)}`;
    filterNode = buildRefractionFilter(
      filterId,
      width,
      height,
      radius,
      REFRACTION_CONFIG,
    );
    ensureRefractionDefs().appendChild(filterNode);

    refractionLayer.style.backdropFilter = `url(#${filterId})`;
    refractionLayer.style.webkitBackdropFilter = `url(#${filterId})`;
    tintLayer.style.backgroundColor = `rgba(${REFRACTION_CONFIG.tintColor}, ${REFRACTION_CONFIG.tintOpacity})`;
    tintLayer.style.boxShadow = `inset 0 0 ${REFRACTION_CONFIG.innerShadowBlur}px ${REFRACTION_CONFIG.innerShadowSpread}px ${REFRACTION_CONFIG.innerShadow}`;
  };

  const scheduleRebuild = () => {
    window.clearTimeout(rebuildTimer);
    rebuildTimer = window.setTimeout(rebuild, 32);
  };

  if ("ResizeObserver" in window) {
    new ResizeObserver(scheduleRebuild).observe(element);
  }
  window.addEventListener("load", scheduleRebuild, { once: true });
  rebuild();
};

if (nav) {
  mountRefraction(nav);
  const menu = nav.querySelector("[data-liquid-nav-menu]");
  const indicator = nav.querySelector("[data-liquid-nav-indicator]");
  const items = [...nav.querySelectorAll("[data-liquid-nav-item]")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let activeItem = items[0];
  let scrollFrame = 0;
  let engagedTimer = 0;

  const moveIndicator = (item, animate = true) => {
    if (!menu || !indicator || !item) return;

    const menuRect = menu.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();

    if (!animate) indicator.style.transition = "none";
    menu.style.setProperty(
      "--liquid-indicator-x",
      `${itemRect.left - menuRect.left}px`,
    );
    menu.style.setProperty("--liquid-indicator-w", `${itemRect.width}px`);

    if (!animate) {
      void indicator.offsetWidth;
      indicator.style.removeProperty("transition");
    }
  };

  const setActiveItem = (item, animate = true) => {
    if (!item) return;
    activeItem = item;

    items.forEach((candidate) => {
      const isActive = candidate === item;
      candidate.classList.toggle("is-active", isActive);
      if (isActive) candidate.setAttribute("aria-current", "location");
      else candidate.removeAttribute("aria-current");
    });

    moveIndicator(item, animate);
  };

  const syncActiveSection = () => {
    scrollFrame = 0;
    const marker = window.scrollY + Math.min(window.innerHeight * 0.28, 240);
    let nextItem = items[0];

    items.forEach((item) => {
      const section = document.getElementById(item.dataset.section || "");
      if (section && section.offsetTop <= marker) nextItem = item;
    });

    setActiveItem(nextItem);
  };

  const scheduleSectionSync = () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(syncActiveSection);
  };

  const engage = (duration = 420) => {
    window.clearTimeout(engagedTimer);
    nav.classList.add("is-engaged");
    engagedTimer = window.setTimeout(() => {
      nav.classList.remove("is-engaged");
    }, duration);
  };

  items.forEach((item) => {
    item.addEventListener("pointerenter", () => moveIndicator(item));
    item.addEventListener("focus", () => moveIndicator(item));
    item.addEventListener("click", () => {
      setActiveItem(item);
      engage(520);
    });
  });

  menu?.addEventListener("pointerleave", () => moveIndicator(activeItem));
  menu?.addEventListener("focusout", (event) => {
    if (!menu.contains(event.relatedTarget)) moveIndicator(activeItem);
  });

  nav.addEventListener("pointermove", (event) => {
    const rect = nav.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    nav.style.setProperty("--liquid-pointer-x", `${x}%`);
    nav.style.setProperty("--liquid-pointer-y", `${y}%`);
  });
  nav.addEventListener("pointerdown", () => engage(620));
  nav.addEventListener("pointerleave", () => {
    nav.style.setProperty("--liquid-pointer-x", "50%");
    nav.style.setProperty("--liquid-pointer-y", "50%");
  });

  window.addEventListener("scroll", scheduleSectionSync, { passive: true });
  window.addEventListener("resize", () => moveIndicator(activeItem, false));

  if ("ResizeObserver" in window && menu) {
    new ResizeObserver(() => moveIndicator(activeItem, false)).observe(menu);
  }

  document.fonts?.ready.then(() => moveIndicator(activeItem, false));
  syncActiveSection();

  const canvas = nav.querySelector("[data-liquid-nav-canvas]");

  if (canvas && !reducedMotion.matches) {
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
    });

    if (gl) {
      const vertexSource = `
        attribute vec2 a_position;
        varying vec2 v_uv;

        void main() {
          v_uv = a_position * 0.5 + 0.5;
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;

      const fragmentSource = `
        precision highp float;

        varying vec2 v_uv;
        uniform vec2 u_resolution;
        uniform vec2 u_pointer;
        uniform float u_time;
        uniform float u_energy;

        float roundedBoxSdf(vec2 point, vec2 halfSize, float radius) {
          vec2 q = abs(point) - halfSize + radius;
          return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
        }

        void main() {
          vec2 uv = v_uv;
          float aspect = u_resolution.x / max(u_resolution.y, 1.0);
          vec2 pointerDelta = (uv - u_pointer) * vec2(aspect, 1.0);
          float pointerGlow = exp(-dot(pointerDelta, pointerDelta) * 5.5);
          float edgeDistance = roundedBoxSdf(
            (uv - 0.5) * vec2(aspect, 1.0),
            vec2(aspect * 0.5 - 0.015, 0.485),
            0.47
          );
          float edge = 1.0 - smoothstep(0.0, 0.018, abs(edgeDistance));
          float innerEdge = 1.0 - smoothstep(0.0, 0.022, abs(edgeDistance + 0.038));
          float topLight = smoothstep(0.18, 0.92, uv.y);
          float movingGlint = 0.5 + 0.5 * sin(uv.x * 18.0 - u_time * 1.15);

          float alpha = edge * (0.08 + topLight * 0.15);
          alpha += edge * pointerGlow * (0.12 + u_energy * 0.2);
          alpha += innerEdge * pointerGlow * movingGlint * 0.045;
          alpha = clamp(alpha, 0.0, 0.38);

          gl_FragColor = vec4(vec3(alpha), alpha);
        }
      `;

      const compileShader = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          gl.deleteShader(shader);
          return null;
        }

        return shader;
      };

      const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
      const program = gl.createProgram();

      if (vertexShader && fragmentShader && program) {
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
          const positionBuffer = gl.createBuffer();
          const positionLocation = gl.getAttribLocation(program, "a_position");
          const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
          const pointerLocation = gl.getUniformLocation(program, "u_pointer");
          const timeLocation = gl.getUniformLocation(program, "u_time");
          const energyLocation = gl.getUniformLocation(program, "u_energy");
          const pointer = { x: 0.5, y: 0.5 };
          const pointerTarget = { x: 0.5, y: 0.5 };
          let energy = 0;
          let energyTarget = 0;
          let animationFrame = 0;
          let startTime = performance.now();

          gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            gl.STATIC_DRAW,
          );
          gl.useProgram(program);
          gl.enableVertexAttribArray(positionLocation);
          gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
          gl.clearColor(0, 0, 0, 0);

          const resizeCanvas = () => {
            const rect = nav.getBoundingClientRect();
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            const width = Math.max(1, Math.round(rect.width * ratio));
            const height = Math.max(1, Math.round(rect.height * ratio));

            if (canvas.width !== width || canvas.height !== height) {
              canvas.width = width;
              canvas.height = height;
            }

            gl.viewport(0, 0, width, height);
          };

          const render = (now) => {
            resizeCanvas();
            pointer.x += (pointerTarget.x - pointer.x) * 0.09;
            pointer.y += (pointerTarget.y - pointer.y) * 0.09;
            energy += (energyTarget - energy) * 0.075;

            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
            gl.uniform2f(pointerLocation, pointer.x, pointer.y);
            gl.uniform1f(timeLocation, (now - startTime) / 1000);
            gl.uniform1f(energyLocation, energy);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            animationFrame = window.requestAnimationFrame(render);
          };

          nav.addEventListener("pointerenter", () => {
            energyTarget = 1;
          });
          nav.addEventListener("pointermove", (event) => {
            const rect = nav.getBoundingClientRect();
            pointerTarget.x = (event.clientX - rect.left) / rect.width;
            pointerTarget.y = 1 - (event.clientY - rect.top) / rect.height;
          });
          nav.addEventListener("pointerleave", () => {
            pointerTarget.x = 0.5;
            pointerTarget.y = 0.5;
            energyTarget = 0;
          });
          nav.addEventListener("pointerdown", () => {
            energy = Math.min(1.35, energy + 0.42);
          });

          document.addEventListener("visibilitychange", () => {
            window.cancelAnimationFrame(animationFrame);
            if (!document.hidden) {
              startTime = performance.now();
              animationFrame = window.requestAnimationFrame(render);
            }
          });

          nav.classList.add("has-webgl");
          animationFrame = window.requestAnimationFrame(render);
        } else {
          nav.classList.add("no-webgl");
        }
      } else {
        nav.classList.add("no-webgl");
      }
    } else {
      nav.classList.add("no-webgl");
    }
  } else {
    nav.classList.add("no-webgl");
  }
}
