/* ==========================================================================
   welcome-gate.js — Page d'accueil portail.
   Le logo AV (Blender) flotte en grand, se fait tourner à la souris,
   et après N touches ouvre un passage dimensionnel vers accueil.html.
   ========================================================================== */

(function () {
  const stage = document.querySelector("[data-welcome-stage]");
  const canvas = document.getElementById("welcome-logo");
  const fallback = document.querySelector("[data-welcome-fallback]");
  const ringProgress = document.querySelector("[data-welcome-ring]");
  const countLabel = document.querySelector("[data-welcome-count]");
  const hint = document.querySelector("[data-welcome-hint]");
  const portal = document.querySelector("[data-welcome-portal]");

  if (!stage || !portal) return;

  // On a déjà vécu l'intro ici : on évite que la page suivante rejoue son écran
  // d'initialisation juste après (même clé de session que futuristic-fx.js).
  try { sessionStorage.setItem("fx_boot_seen", "1"); } catch (error) { /* noop */ }

  const REQUIRED_TAPS = Number(stage.dataset.welcomeRequired) || 5;
  const DESTINATION = "accueil.html";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const RING_CIRCUMFERENCE = 2 * Math.PI * 54;

  let taps = 0;
  let transitioning = false;
  const warpState = { v: 0 };

  if (ringProgress) {
    ringProgress.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;
    ringProgress.style.strokeDashoffset = `${RING_CIRCUMFERENCE}`;
  }

  function updateHud() {
    if (countLabel) {
      countLabel.childNodes[0].textContent = String(taps);
    }
    if (ringProgress) {
      const ratio = Math.min(1, taps / REQUIRED_TAPS);
      ringProgress.style.strokeDashoffset = `${RING_CIRCUMFERENCE * (1 - ratio)}`;
    }
    if (hint) {
      const remaining = REQUIRED_TAPS - taps;
      hint.textContent = remaining > 0
        ? `Touchez le cœur lumineux — encore ${remaining}`
        : "Ouverture du passage…";
    }
  }

  let audioCtx = null;
  function playTick(step) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();

      const t = audioCtx.currentTime;
      const base = 480 + step * 70;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * 1.9, t + 0.16);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.055, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    } catch (error) {
      // silencieux : l'audio n'est qu'un bonus sensoriel
    }
  }

  function goToSite() {
    window.location.href = DESTINATION;
  }

  function triggerPortal() {
    if (transitioning) return;
    transitioning = true;
    stage.disabled = true;
    document.documentElement.classList.add("welcome-leaving");

    if (reducedMotion || !window.gsap) {
      portal.classList.add("is-active");
      setTimeout(goToSite, reducedMotion ? 360 : 900);
      return;
    }

    // Saut dans l'hyperespace : on fonce dans le logo, tout s'illumine,
    // puis le voile de lumière s'ouvre.
    const tl = gsap.timeline({ onComplete: goToSite });
    tl.to(warpState, { v: 1, duration: 1.15, ease: "power2.in" }, 0);
    tl.add(() => portal.classList.add("is-active"), 0.55);
  }

  let pulseT = 0;

  function registerTap() {
    if (transitioning) return;
    taps += 1;
    updateHud();
    pulseT = 1;
    playTick(taps);
    if (taps >= REQUIRED_TAPS) triggerPortal();
  }

  /* --- Rotation à la souris / au doigt + détection tap vs glissé --- */
  let pointerActive = false;
  let dragged = false;
  let lastX = 0;
  let lastY = 0;
  let totalMove = 0;
  const rotationVelocity = { x: 0, y: 0 };
  const targetRotation = { x: 0, y: 0 };
  const dragRotation = { x: 0, y: 0 };

  stage.addEventListener("pointerdown", (event) => {
    if (transitioning) return;
    pointerActive = true;
    dragged = false;
    totalMove = 0;
    lastX = event.clientX;
    lastY = event.clientY;
  });

  stage.addEventListener("pointermove", (event) => {
    if (!pointerActive || transitioning) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    totalMove += Math.abs(dx) + Math.abs(dy);
    if (totalMove > 6) dragged = true;

    if (dragged) {
      targetRotation.y += dx * 0.0009;
      targetRotation.x += dy * 0.0009;
      rotationVelocity.x = dy * 0.00014;
      rotationVelocity.y = dx * 0.00014;
    }
  });

  window.addEventListener("pointerup", () => { pointerActive = false; });
  window.addEventListener("pointercancel", () => { pointerActive = false; });

  stage.addEventListener("click", () => {
    if (dragged) {
      dragged = false;
      return;
    }
    registerTap();
  });

  if (!window.THREE) {
    fallback?.classList.add("is-visible");
    return;
  }

  /* --- Scène Three.js plein écran --- */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 9);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });

  if ("outputEncoding" in renderer) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(3, 5, 6);
  const rim = new THREE.PointLight(0x2fe0c8, 1.6, 22);
  rim.position.set(-3, 1, 4);
  scene.add(ambient, key, rim);

  const logoGroup = new THREE.Group();
  scene.add(logoGroup);

  let logoMesh = null;

  function applyFuturisticMaterial(root) {
    root.traverse((node) => {
      if (node.isMesh) {
        node.material = new THREE.MeshPhysicalMaterial({
          color: 0x3157d5,
          emissive: 0x5d8bff,
          emissiveIntensity: 0.5,
          roughness: 0.22,
          metalness: 0.3,
          clearcoat: 0.8,
          clearcoatRoughness: 0.16
        });
        node.castShadow = false;
        node.receiveShadow = false;
      }
    });
  }

  function frameLogo(object) {
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 3.6 / maxDim;
    object.scale.setScalar(scale);
    object.userData.baseScale = scale;
    const center = box.getCenter(new THREE.Vector3()).multiplyScalar(scale);
    object.position.sub(center);
  }

  function buildFallbackLogo() {
    fallback?.classList.add("is-visible");

    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.5, 0),
      new THREE.MeshPhysicalMaterial({
        color: 0x3157d5,
        emissive: 0x5d8bff,
        emissiveIntensity: 0.55,
        roughness: 0.2,
        metalness: 0.3,
        clearcoat: 0.85,
        clearcoatRoughness: 0.15
      })
    );
    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.56, 0),
      new THREE.MeshBasicMaterial({ color: 0x2fe0c8, wireframe: true, transparent: true, opacity: 0.4 })
    );

    logoMesh = new THREE.Group();
    logoMesh.userData.baseScale = 1;
    logoMesh.add(mesh, wire);
    logoGroup.add(logoMesh);
    stage.classList.add("is-loaded");
  }

  if (window.THREE.GLTFLoader) {
    const loader = new THREE.GLTFLoader();
    loader.load(
      "assets/av-logo.glb",
      (gltf) => {
        logoMesh = gltf.scene;
        applyFuturisticMaterial(logoMesh);
        frameLogo(logoMesh);
        logoGroup.add(logoMesh);
        stage.classList.add("is-loaded");

        if (window.gsap && !reducedMotion) {
          gsap.from(logoGroup.scale, { x: 0.5, y: 0.5, z: 0.5, duration: 1.5, ease: "power3.out" });
          gsap.from(logoGroup.rotation, { y: -2, duration: 1.8, ease: "power3.out" });
        }
      },
      undefined,
      buildFallbackLogo
    );
  } else {
    buildFallbackLogo();
  }

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(2.3, 0.02, 16, 120),
    new THREE.MeshBasicMaterial({ color: 0xd99a32, transparent: true, opacity: 0.5 })
  );
  halo.rotation.x = Math.PI / 2.4;
  logoGroup.add(halo);

  const particleCount = window.matchMedia("(max-width: 720px)").matches ? 110 : 220;
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i += 1) {
    const r = 3 + Math.random() * 4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }

  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({ color: 0x5d8bff, size: 0.035, transparent: true, opacity: 0.55 })
  );
  scene.add(particles);

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const clock = new THREE.Clock();
  let warpSpinExtra = 0;

  function animate() {
    const time = clock.getElapsedTime();
    const w = warpState.v;

    dragRotation.x += (targetRotation.x - dragRotation.x) * 0.12;
    dragRotation.y += (targetRotation.y - dragRotation.y) * 0.12;

    if (!pointerActive) {
      targetRotation.x += rotationVelocity.x;
      targetRotation.y += rotationVelocity.y;
      rotationVelocity.x *= 0.94;
      rotationVelocity.y *= 0.94;
    }

    warpSpinExtra += w * 0.09;
    const idle = reducedMotion ? 0 : time * 0.12;
    logoGroup.rotation.y = dragRotation.y + idle + warpSpinExtra;
    logoGroup.rotation.x = dragRotation.x;

    if (!reducedMotion) {
      logoGroup.position.y = Math.sin(time * 0.9) * 0.12;
      halo.rotation.z += 0.004;
      particles.rotation.y += 0.0006 + w * 0.05;
    }

    // Saut dans l'hyperespace : on fonce dans le logo, tout converge et s'illumine.
    camera.position.z = 9 - w * 6.6;
    halo.scale.setScalar(1 + w * 1.8);
    halo.material.opacity = 0.5 * (1 - w);
    particles.scale.setScalar(1 - w * 0.6);
    particles.material.opacity = 0.55 + w * 0.4;

    pulseT *= 0.9;
    if (logoMesh) {
      const beat = (logoMesh.userData.baseScale || 1) * (1 + pulseT * 0.18 + w * 0.55);
      logoMesh.scale.setScalar(beat);
    }
    rim.intensity = 1.6 + pulseT * 2.2 + w * 7;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize);
  resize();
  updateHud();
  animate();
})();
