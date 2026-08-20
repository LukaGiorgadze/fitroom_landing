import * as THREE from "three";

const TAU = Math.PI * 2;
const MAX_DEVICE_PIXEL_RATIO = 1.5;
const DEFAULT_PARTICLE_COUNT = 68;

const DEFAULT_PALETTE = Object.freeze({
  ice: "#d9fbff",
  violet: "#bdb8ff",
  blush: "#f4d5ff",
  particle: "#eefcff",
});

const RIBBON_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uMotion;

  attribute float aArc;
  attribute float aAcross;

  varying float vArc;
  varying float vAcross;
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    float ripple = sin(aArc * 18.8495559 + uTime * 0.42) * 0.012 * uMotion;
    vec3 transformed = position + normal * ripple;
    vec4 viewPosition = modelViewMatrix * vec4(transformed, 1.0);

    vArc = aArc;
    vAcross = aAcross;
    vNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(-viewPosition.xyz);

    gl_Position = projectionMatrix * viewPosition;
  }
`;

const RIBBON_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uOpacity;
  uniform float uIntensity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;

  varying float vArc;
  varying float vAcross;
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = normalize(vViewDirection);
    float facing = abs(dot(normal, viewDirection));
    float fresnel = pow(1.0 - facing, 1.75);
    float edge = smoothstep(0.42, 1.0, abs(vAcross));
    float travel = 0.5 + 0.5 * sin(vArc * 25.1327412 - uTime * 0.32);
    float glint = pow(travel, 9.0) * (0.35 + fresnel * 0.65);

    vec3 spectral = 0.56 + 0.44 * cos(
      6.2831853 * (vec3(0.04, 0.36, 0.69) + vArc * 0.32 + fresnel * 0.08)
    );
    vec3 base = mix(uColorA, uColorB, 0.5 + 0.5 * sin(vArc * 6.2831853));
    base = mix(base, uColorC, fresnel * 0.34);
    vec3 color = mix(base, spectral, 0.12 + fresnel * 0.14);
    color += vec3(0.09, 0.11, 0.14) * glint;

    float alpha = uOpacity * uIntensity;
    alpha *= 0.18 + fresnel * 0.5 + edge * 0.17 + glint * 0.34;
    alpha *= 0.84 + 0.16 * sin(vArc * 12.5663706 + uTime * 0.12);

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.72));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const PARTICLE_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uMotion;
  uniform float uPixelRatio;

  attribute float aSize;
  attribute float aPhase;
  attribute float aMix;

  varying float vPhase;
  varying float vMix;

  void main() {
    vec3 transformed = position;
    transformed.x += sin(uTime * 0.14 + aPhase) * 0.045 * uMotion;
    transformed.y += cos(uTime * 0.11 + aPhase * 1.37) * 0.055 * uMotion;
    transformed.z += sin(uTime * 0.09 + aPhase * 0.73) * 0.035 * uMotion;

    vec4 viewPosition = modelViewMatrix * vec4(transformed, 1.0);
    float perspective = clamp(8.5 / max(1.0, -viewPosition.z), 0.58, 1.28);

    vPhase = aPhase;
    vMix = aMix;
    gl_PointSize = max(1.0, aSize * uPixelRatio * perspective);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const PARTICLE_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uOpacity;
  uniform float uIntensity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying float vPhase;
  varying float vMix;

  void main() {
    vec2 point = gl_PointCoord - 0.5;
    float distanceFromCenter = length(point);
    float body = 1.0 - smoothstep(0.08, 0.5, distanceFromCenter);
    float core = 1.0 - smoothstep(0.0, 0.13, distanceFromCenter);
    float twinkle = 0.68 + 0.32 * sin(uTime * 0.72 + vPhase);
    float alpha = body * (0.38 + core * 0.62) * twinkle;
    vec3 color = mix(uColorA, uColorB, vMix) + core * 0.08;

    if (alpha < 0.01) discard;
    gl_FragColor = vec4(color, alpha * uOpacity * uIntensity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const FIELD_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FIELD_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying vec2 vUv;

  void main() {
    vec2 point = (vUv - 0.5) * vec2(1.0, 0.78);
    float radius = length(point);
    float center = exp(-radius * radius * 8.5);
    float halo = exp(-pow((radius - 0.34) * 6.5, 2.0));
    float pulse = 0.94 + 0.06 * sin(uTime * 0.18);
    float sweep = 0.5 + 0.5 * sin(atan(point.y, point.x) * 2.0 - uTime * 0.08);
    vec3 color = mix(uColorA, uColorB, sweep);
    float alpha = (center * 0.028 + halo * 0.025) * pulse * uIntensity;
    alpha *= 1.0 - smoothstep(0.54, 0.69, radius);

    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const clampNumber = (value, minimum, maximum, fallback) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? THREE.MathUtils.clamp(number, minimum, maximum)
    : fallback;
};

const toColor = (value, fallback) => {
  const color = new THREE.Color();

  try {
    color.set(value ?? fallback);
  } catch {
    color.set(fallback);
  }

  return color;
};

const createUnavailableController = (reason) =>
  Object.freeze({
    supported: false,
    reason,
    get paused() {
      return true;
    },
    get running() {
      return false;
    },
    pause() {},
    resume() {},
    resize() {},
    setPointer() {},
    destroy() {},
  });

const createSeededRandom = (seed = 0x6d2b79f5) => {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const createRibbonGeometry = ({
  radiusX,
  radiusY,
  width,
  depth,
  phase,
  segments = 208,
}) => {
  const positions = new Float32Array((segments + 1) * 2 * 3);
  const arc = new Float32Array((segments + 1) * 2);
  const across = new Float32Array((segments + 1) * 2);
  const indices = new Uint16Array(segments * 6);
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();
  const position = new THREE.Vector3();

  for (let index = 0; index <= segments; index += 1) {
    const progress = index / segments;
    const angle = progress * TAU;
    const sine = Math.sin(angle);
    const cosine = Math.cos(angle);

    position.set(
      cosine * radiusX,
      sine * radiusY,
      Math.sin(angle * 2 + phase) * depth + Math.sin(angle * 3 - phase) * 0.045,
    );
    tangent
      .set(
        -sine * radiusX,
        cosine * radiusY,
        Math.cos(angle * 2 + phase) * depth * 2,
      )
      .normalize();
    side.set(tangent.y, -tangent.x, 0).normalize();
    side.applyAxisAngle(tangent, Math.sin(angle + phase) * 0.72 + phase * 0.08);

    for (let edge = 0; edge < 2; edge += 1) {
      const edgeSign = edge === 0 ? -1 : 1;
      const vertexIndex = index * 2 + edge;
      const positionIndex = vertexIndex * 3;

      positions[positionIndex] = position.x + side.x * width * 0.5 * edgeSign;
      positions[positionIndex + 1] =
        position.y + side.y * width * 0.5 * edgeSign;
      positions[positionIndex + 2] =
        position.z + side.z * width * 0.5 * edgeSign;
      arc[vertexIndex] = progress;
      across[vertexIndex] = edgeSign;
    }

    if (index < segments) {
      const offset = index * 6;
      const lowerLeft = index * 2;
      const lowerRight = lowerLeft + 1;
      const upperLeft = lowerLeft + 2;
      const upperRight = lowerLeft + 3;

      indices[offset] = lowerLeft;
      indices[offset + 1] = lowerRight;
      indices[offset + 2] = upperLeft;
      indices[offset + 3] = lowerRight;
      indices[offset + 4] = upperRight;
      indices[offset + 5] = upperLeft;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aArc", new THREE.BufferAttribute(arc, 1));
  geometry.setAttribute("aAcross", new THREE.BufferAttribute(across, 1));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
};

const createParticleGeometry = (count) => {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const mixes = new Float32Array(count);
  const random = createSeededRandom();

  for (let index = 0; index < count; index += 1) {
    const angle = random() * TAU;
    const radius = 0.84 + random() * 0.34;
    const radiusX = (2.2 + random() * 0.62) * radius;
    const radiusY = (2.62 + random() * 0.72) * radius;
    const positionIndex = index * 3;

    positions[positionIndex] = Math.cos(angle) * radiusX;
    positions[positionIndex + 1] = Math.sin(angle) * radiusY;
    positions[positionIndex + 2] = (random() - 0.5) * 2.6;
    sizes[index] = 1.35 + Math.pow(random(), 2.2) * 3.15;
    phases[index] = random() * TAU;
    mixes[index] = random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aMix", new THREE.BufferAttribute(mixes, 1));
  geometry.computeBoundingSphere();
  return geometry;
};

/**
 * Creates a transparent, pointer-passive Three.js atmosphere for a DOM phone.
 *
 * The canvas is treated as a decorative layer. Position it behind the phone in
 * CSS and give it explicit dimensions. All options are optional:
 *
 * - intensity: visual strength from 0 to 1.5 (default 0.82)
 * - motionScale: animation speed from 0 to 2 (default 1)
 * - particleCount: number of halo particles from 0 to 160 (default 68)
 * - maxDpr: render pixel ratio, always capped at 1.5
 * - pointerTarget: element receiving pointer input, false to disable it
 * - paused: start in a manually paused state
 * - respectReducedMotion: disable continuous motion when requested (default true)
 * - palette: optional ice, violet, blush, and particle CSS colors
 *
 * @param {HTMLCanvasElement} canvas
 * @param {object} [options]
 * @returns {{supported: boolean, paused: boolean, running: boolean, pause: Function,
 * resume: Function, resize: Function, setPointer: Function, destroy: Function}}
 */
export function createPhoneAtmosphere(canvas, options = {}) {
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    !canvas ||
    typeof canvas.getContext !== "function" ||
    typeof canvas.getBoundingClientRect !== "function" ||
    typeof canvas.getAttribute !== "function" ||
    !canvas.style
  ) {
    return createUnavailableController("A browser canvas is required.");
  }

  const config = options && typeof options === "object" ? options : {};
  const intensity = clampNumber(config.intensity, 0, 1.5, 0.82);
  const motionScale = clampNumber(config.motionScale, 0, 2, 1);
  const particleCount = Math.round(
    clampNumber(config.particleCount, 0, 160, DEFAULT_PARTICLE_COUNT),
  );
  const maxDpr = clampNumber(
    config.maxDpr,
    0.5,
    MAX_DEVICE_PIXEL_RATIO,
    MAX_DEVICE_PIXEL_RATIO,
  );
  const palette = { ...DEFAULT_PALETTE, ...(config.palette ?? {}) };
  const originalCanvasState = {
    pointerEvents: canvas.style.pointerEvents,
    ariaHidden: canvas.getAttribute("aria-hidden"),
    hadAriaHidden: canvas.hasAttribute("aria-hidden"),
    width: canvas.getAttribute("width"),
    height: canvas.getAttribute("height"),
  };

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: "low-power",
    });
  } catch (error) {
    return createUnavailableController(error);
  }

  canvas.style.pointerEvents = "none";
  canvas.setAttribute("aria-hidden", "true");

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, maxDpr, MAX_DEVICE_PIXEL_RATIO),
  );
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.03;
  if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 40);
  const atmosphere = new THREE.Group();
  atmosphere.rotation.x = -0.025;
  scene.add(atmosphere);

  const timeUniform = { value: clampNumber(config.timeOffset, 0, 1000, 2.4) };
  const motionUniform = { value: motionScale };
  const intensityUniform = { value: intensity };
  const pixelRatioUniform = { value: renderer.getPixelRatio() };
  const ice = toColor(palette.ice, DEFAULT_PALETTE.ice);
  const violet = toColor(palette.violet, DEFAULT_PALETTE.violet);
  const blush = toColor(palette.blush, DEFAULT_PALETTE.blush);
  const particleColor = toColor(palette.particle, DEFAULT_PALETTE.particle);

  const fieldMaterial = new THREE.ShaderMaterial({
    vertexShader: FIELD_VERTEX_SHADER,
    fragmentShader: FIELD_FRAGMENT_SHADER,
    uniforms: {
      uTime: timeUniform,
      uIntensity: intensityUniform,
      uColorA: { value: ice.clone() },
      uColorB: { value: violet.clone() },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: true,
  });
  const field = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 7.4), fieldMaterial);
  field.position.z = -2.2;
  field.renderOrder = -10;
  atmosphere.add(field);

  const ribbonDefinitions = [
    {
      radiusX: 2.28,
      radiusY: 2.7,
      width: 0.17,
      depth: 0.38,
      phase: 0.15,
      opacity: 0.34,
      rotation: [-0.31, 0.17, -0.18],
      drift: [0.016, 0.022, 0.013],
      colors: [ice, violet, blush],
    },
    {
      radiusX: 2.02,
      radiusY: 2.91,
      width: 0.115,
      depth: 0.5,
      phase: 2.1,
      opacity: 0.27,
      rotation: [0.36, -0.22, 0.25],
      drift: [-0.018, 0.015, -0.011],
      colors: [violet, ice, blush],
    },
    {
      radiusX: 2.48,
      radiusY: 2.18,
      width: 0.085,
      depth: 0.32,
      phase: 4.25,
      opacity: 0.2,
      rotation: [0.58, 0.12, 0.08],
      drift: [0.012, -0.018, 0.016],
      colors: [blush, ice, violet],
    },
  ];

  const ribbons = ribbonDefinitions.map((definition, index) => {
    const material = new THREE.ShaderMaterial({
      vertexShader: RIBBON_VERTEX_SHADER,
      fragmentShader: RIBBON_FRAGMENT_SHADER,
      uniforms: {
        uTime: timeUniform,
        uMotion: motionUniform,
        uOpacity: { value: definition.opacity },
        uIntensity: intensityUniform,
        uColorA: { value: definition.colors[0].clone() },
        uColorB: { value: definition.colors[1].clone() },
        uColorC: { value: definition.colors[2].clone() },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      toneMapped: true,
    });
    const geometry = createRibbonGeometry(definition);
    const ribbon = new THREE.Mesh(geometry, material);
    ribbon.rotation.set(...definition.rotation);
    ribbon.renderOrder = index + 1;
    ribbon.userData.baseRotation = new THREE.Euler(...definition.rotation);
    ribbon.userData.drift = definition.drift;
    ribbon.userData.phase = definition.phase;
    atmosphere.add(ribbon);
    return ribbon;
  });

  const particleMaterial = new THREE.ShaderMaterial({
    vertexShader: PARTICLE_VERTEX_SHADER,
    fragmentShader: PARTICLE_FRAGMENT_SHADER,
    uniforms: {
      uTime: timeUniform,
      uMotion: motionUniform,
      uPixelRatio: pixelRatioUniform,
      uOpacity: { value: 0.46 },
      uIntensity: intensityUniform,
      uColorA: { value: particleColor.clone() },
      uColorB: { value: violet.clone() },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: true,
  });
  const particles = new THREE.Points(
    createParticleGeometry(particleCount),
    particleMaterial,
  );
  particles.rotation.z = -0.08;
  particles.renderOrder = 10;
  particles.frustumCulled = false;
  atmosphere.add(particles);

  const pointer = new THREE.Vector2();
  const pointerTarget = new THREE.Vector2();
  const pointerEventTarget =
    config.pointerTarget === false
      ? null
      : config.pointerTarget ?? canvas.parentElement ?? window;
  const reducedMotionQuery =
    config.respectReducedMotion === false || !window.matchMedia
      ? null
      : window.matchMedia("(prefers-reduced-motion: reduce)");

  let reducedMotion = Boolean(reducedMotionQuery?.matches);
  let manuallyPaused = Boolean(config.paused);
  let documentVisible = document.visibilityState !== "hidden";
  let inViewport = true;
  let hasSize = true;
  let contextLost = false;
  let destroyed = false;
  let animationFrame = 0;
  let lastFrameTime = 0;
  let elapsedTime = timeUniform.value;
  let resizeObserver;
  let intersectionObserver;

  const shouldAnimate = () =>
    !destroyed &&
    !manuallyPaused &&
    !reducedMotion &&
    documentVisible &&
    inViewport &&
    hasSize &&
    !contextLost &&
    motionScale > 0;

  const renderScene = (deltaTime = 0) => {
    if (
      destroyed ||
      contextLost ||
      !hasSize ||
      !documentVisible ||
      !inViewport
    ) {
      return;
    }

    const damping = 1 - Math.exp(-Math.max(deltaTime, 1 / 120) * 4.6);
    pointer.lerp(pointerTarget, damping);
    timeUniform.value = elapsedTime;

    atmosphere.rotation.x = -0.025 - pointer.y * 0.075;
    atmosphere.rotation.y = pointer.x * 0.11;
    atmosphere.rotation.z = pointer.x * pointer.y * -0.018;
    atmosphere.position.x = pointer.x * 0.105;
    atmosphere.position.y = -pointer.y * 0.065;

    ribbons.forEach((ribbon) => {
      const base = ribbon.userData.baseRotation;
      const drift = ribbon.userData.drift;
      const phase = ribbon.userData.phase;
      ribbon.rotation.x =
        base.x + Math.sin(elapsedTime * drift[0] + phase) * 0.035 * motionScale;
      ribbon.rotation.y =
        base.y + Math.cos(elapsedTime * drift[1] + phase) * 0.04 * motionScale;
      ribbon.rotation.z =
        base.z + Math.sin(elapsedTime * drift[2] - phase) * 0.03 * motionScale;
    });

    particles.rotation.z = -0.08 + elapsedTime * 0.0045 * motionScale;
    particles.rotation.y = Math.sin(elapsedTime * 0.035) * 0.035 * motionScale;
    renderer.render(scene, camera);
  };

  const stopAnimation = () => {
    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
    lastFrameTime = 0;
  };

  const animate = (timestamp) => {
    animationFrame = 0;
    if (!shouldAnimate()) return;

    const deltaTime = lastFrameTime
      ? Math.min((timestamp - lastFrameTime) / 1000, 0.05)
      : 0;
    lastFrameTime = timestamp;
    elapsedTime += deltaTime * motionScale;
    renderScene(deltaTime);
    animationFrame = window.requestAnimationFrame(animate);
  };

  const syncAnimation = () => {
    if (shouldAnimate()) {
      if (!animationFrame) {
        lastFrameTime = 0;
        animationFrame = window.requestAnimationFrame(animate);
      }
      return;
    }

    stopAnimation();
    if (!destroyed && !contextLost && hasSize) renderScene();
  };

  const resize = () => {
    if (destroyed || contextLost) return;

    const bounds = canvas.getBoundingClientRect();
    const width = Math.round(bounds.width || canvas.clientWidth || 0);
    const height = Math.round(bounds.height || canvas.clientHeight || 0);
    hasSize = width > 0 && height > 0;

    if (!hasSize) {
      syncAnimation();
      return;
    }

    const pixelRatio = Math.min(
      window.devicePixelRatio || 1,
      maxDpr,
      MAX_DEVICE_PIXEL_RATIO,
    );
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    pixelRatioUniform.value = pixelRatio;

    camera.aspect = width / height;
    const visibleHeight = Math.max(6.75, 5.55 / Math.max(camera.aspect, 0.35));
    camera.position.set(
      0,
      0,
      visibleHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5))),
    );
    camera.updateProjectionMatrix();
    renderScene();
    syncAnimation();
  };

  const setPointer = (x = 0, y = 0) => {
    pointerTarget.set(
      clampNumber(x, -1, 1, 0),
      clampNumber(y, -1, 1, 0),
    );

    if (!shouldAnimate()) {
      pointer.copy(pointerTarget);
      renderScene();
    }
  };

  const handlePointerMove = (event) => {
    if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) {
      return;
    }

    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    setPointer(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -(((event.clientY - bounds.top) / bounds.height) * 2 - 1),
    );
  };

  const handlePointerLeave = () => setPointer(0, 0);

  const handleVisibilityChange = () => {
    documentVisible = document.visibilityState !== "hidden";
    syncAnimation();
  };

  const handleReducedMotionChange = (event) => {
    reducedMotion = event.matches;
    syncAnimation();
  };

  const handleContextLost = (event) => {
    event.preventDefault();
    contextLost = true;
    stopAnimation();
  };

  const handleContextRestored = () => {
    contextLost = false;
    resize();
  };

  if (pointerEventTarget?.addEventListener) {
    pointerEventTarget.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    pointerEventTarget.addEventListener("pointerleave", handlePointerLeave, {
      passive: true,
    });
  }
  document.addEventListener("visibilitychange", handleVisibilityChange);
  canvas.addEventListener("webglcontextlost", handleContextLost, false);
  canvas.addEventListener("webglcontextrestored", handleContextRestored, false);

  if (reducedMotionQuery) {
    if (reducedMotionQuery.addEventListener) {
      reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
    } else {
      reducedMotionQuery.addListener(handleReducedMotionChange);
    }
  }

  if ("ResizeObserver" in window) {
    resizeObserver = new window.ResizeObserver(resize);
    resizeObserver.observe(canvas);
  } else {
    window.addEventListener("resize", resize, { passive: true });
  }

  if ("IntersectionObserver" in window) {
    intersectionObserver = new window.IntersectionObserver(
      ([entry]) => {
        inViewport = Boolean(entry?.isIntersecting);
        syncAnimation();
      },
      { rootMargin: "160px" },
    );
    intersectionObserver.observe(canvas);
  }

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    stopAnimation();

    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    if (!resizeObserver) {
      window.removeEventListener("resize", resize);
    }

    if (pointerEventTarget?.removeEventListener) {
      pointerEventTarget.removeEventListener("pointermove", handlePointerMove);
      pointerEventTarget.removeEventListener("pointerleave", handlePointerLeave);
    }
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    canvas.removeEventListener("webglcontextlost", handleContextLost);
    canvas.removeEventListener("webglcontextrestored", handleContextRestored);

    if (reducedMotionQuery) {
      if (reducedMotionQuery.removeEventListener) {
        reducedMotionQuery.removeEventListener(
          "change",
          handleReducedMotionChange,
        );
      } else {
        reducedMotionQuery.removeListener(handleReducedMotionChange);
      }
    }

    const geometries = new Set();
    const materials = new Set();
    scene.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => materials.add(material));
      } else if (object.material) {
        materials.add(object.material);
      }
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());

    try {
      renderer.setClearColor(0x000000, 0);
      renderer.clear(true, true, true);
    } catch {
      // A lost context is already visually empty.
    }
    renderer.renderLists?.dispose();
    renderer.dispose();

    canvas.style.pointerEvents = originalCanvasState.pointerEvents;
    if (originalCanvasState.hadAriaHidden) {
      canvas.setAttribute("aria-hidden", originalCanvasState.ariaHidden);
    } else {
      canvas.removeAttribute("aria-hidden");
    }
    if (originalCanvasState.width === null) canvas.removeAttribute("width");
    else canvas.setAttribute("width", originalCanvasState.width);
    if (originalCanvasState.height === null) canvas.removeAttribute("height");
    else canvas.setAttribute("height", originalCanvasState.height);
  };

  resize();

  return Object.freeze({
    supported: true,
    get paused() {
      return manuallyPaused;
    },
    get running() {
      return shouldAnimate();
    },
    pause() {
      if (destroyed || manuallyPaused) return;
      manuallyPaused = true;
      syncAnimation();
    },
    resume() {
      if (destroyed || !manuallyPaused) return;
      manuallyPaused = false;
      syncAnimation();
    },
    resize,
    setPointer,
    destroy,
  });
}

export default createPhoneAtmosphere;
