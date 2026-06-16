(function () {
  const canvas = document.getElementById("next-gen-scene");
  const stage = document.querySelector(".three-stage");

  if (!canvas || !window.THREE) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 720px)").matches;

  const BLUE = 0x3157d5;
  const TEAL = 0x14b8a6;
  const GOLD = 0xd99a32;
  const NAVY = 0x101828;
  const cBlue = new THREE.Color(BLUE);
  const cTeal = new THREE.Color(TEAL);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });

  if ("outputEncoding" in renderer) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  const pointer = { x: 0, y: 0 };
  const clock = new THREE.Clock();
  const sceneShift = isMobile ? 0 : 1.5;

  camera.position.set(0, 0.4, isMobile ? 9 : 7);

  const root = new THREE.Group();
  root.position.set(sceneShift, 0.2, 0);
  scene.add(root);

  const ambient = new THREE.AmbientLight(0xffffff, 0.82);
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
  keyLight.position.set(3, 5, 6);
  const rimLight = new THREE.PointLight(BLUE, 1.4, 18);
  rimLight.position.set(-3, 1.5, 3);
  scene.add(ambient, keyLight, rimLight);

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.42,
    roughness: 0.18,
    metalness: 0.05,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
    side: THREE.DoubleSide
  });

  function litMaterial(color, options = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      emissive: new THREE.Color(options.emissive ?? color),
      emissiveIntensity: options.emissiveIntensity ?? 0.35,
      roughness: options.roughness ?? 0.32,
      metalness: options.metalness ?? 0.2,
      transparent: options.opacity != null,
      opacity: options.opacity ?? 1
    });
  }

  function wireMaterial(color, opacity) {
    return new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity });
  }

  /* ----------------------------------------------------------------------
   * Cœur cristallin : un réacteur qui "bat" (l'émotion du site).
   * -------------------------------------------------------------------- */
  const coreGroup = new THREE.Group();
  root.add(coreGroup);

  const glassCore = new THREE.Mesh(new THREE.IcosahedronGeometry(1.16, 0), glassMaterial);
  const wireCore = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 0), wireMaterial(BLUE, 0.55));
  const wireShell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.78, 1), wireMaterial(TEAL, 0.26));
  const nucleus = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.46, 0),
    litMaterial(GOLD, { emissive: GOLD, emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.3 })
  );
  coreGroup.add(glassCore, wireCore, wireShell, nucleus);

  /* ----------------------------------------------------------------------
   * Anneaux gyroscopiques.
   * -------------------------------------------------------------------- */
  const rings = [];

  function addRing(radius, tube, color, rotation, axis, speed) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, tube, 16, 140),
      litMaterial(color, { emissive: color, emissiveIntensity: 0.5, opacity: 0.92, roughness: 0.3 })
    );
    ring.rotation.set(rotation[0], rotation[1], rotation[2]);
    ring.userData = { axis, speed };
    coreGroup.add(ring);
    rings.push(ring);
    return ring;
  }

  addRing(1.98, 0.022, BLUE, [Math.PI / 2, 0, 0], "z", 0.4);
  addRing(2.36, 0.02, TEAL, [0.62, 0.42, 0], "y", -0.32);
  addRing(2.74, 0.018, GOLD, [1.2, -0.5, 0.3], "x", 0.26);

  /* ----------------------------------------------------------------------
   * Sites en verre qui orbitent autour du cœur (le métier).
   * -------------------------------------------------------------------- */
  function createSitePanel(scale) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.5 * scale, 0.98 * scale, 0.05), glassMaterial);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.5 * scale, 0.14 * scale, 0.07), litMaterial(NAVY, { emissiveIntensity: 0.1 }));
    const hero = new THREE.Mesh(new THREE.BoxGeometry(0.5 * scale, 0.34 * scale, 0.08), litMaterial(BLUE, { emissiveIntensity: 0.45 }));
    const cta = new THREE.Mesh(new THREE.BoxGeometry(0.32 * scale, 0.1 * scale, 0.09), litMaterial(TEAL, { emissiveIntensity: 0.5 }));

    top.position.y = 0.42 * scale;
    hero.position.set(-0.38 * scale, 0.04 * scale, 0.05);
    cta.position.set(0.36 * scale, -0.26 * scale, 0.06);
    group.add(base, top, hero, cta);

    [0.2, 0.04, -0.12].forEach((y, i) => {
      const line = new THREE.Mesh(
        new THREE.BoxGeometry((0.56 - i * 0.12) * scale, 0.035 * scale, 0.06),
        litMaterial(0x8aa0c8, { emissiveIntensity: 0.08 })
      );
      line.position.set(0.28 * scale, y * scale, 0.05);
      group.add(line);
    });

    for (let i = 0; i < 3; i += 1) {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.022 * scale, 12, 12),
        litMaterial([BLUE, TEAL, GOLD][i], { emissiveIntensity: 0.6 })
      );
      dot.position.set((-0.66 + i * 0.07) * scale, 0.42 * scale, 0.08);
      group.add(dot);
    }

    return group;
  }

  const panels = [];
  const panelCount = isMobile ? 2 : 3;
  for (let i = 0; i < panelCount; i += 1) {
    const panel = createSitePanel(0.96);
    panel.userData = {
      a0: (i / panelCount) * Math.PI * 2,
      radius: 2.85,
      speed: 0.16,
      bob: 0.4 + i * 0.3
    };
    root.add(panel);
    panels.push(panel);
  }

  /* ----------------------------------------------------------------------
   * Particules.
   * -------------------------------------------------------------------- */
  const particleCount = isMobile ? 90 : 170;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i += 1) {
    const r = 2.4 + Math.random() * 2.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    particlePositions[i * 3 + 1] = (r * Math.cos(phi)) * 0.6;
    particlePositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
  }

  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({ color: BLUE, size: isMobile ? 0.03 : 0.038, transparent: true, opacity: 0.5 })
  );
  root.add(particles);

  function resize() {
    const rect = stage.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function animate() {
    const time = clock.getElapsedTime();

    if (!reducedMotion) {
      coreGroup.rotation.y += 0.0035;
      coreGroup.rotation.x = Math.sin(time * 0.2) * 0.12;
      wireShell.rotation.y -= 0.006;
      wireShell.rotation.z += 0.003;

      rings.forEach((ring) => {
        ring.rotation[ring.userData.axis] += ring.userData.speed * 0.016;
      });

      // Battement de cœur : pulsation nette ~ toutes les ~2.4 s.
      const beat = Math.pow(Math.max(0, Math.sin(time * 1.35)), 6);
      const breathe = 1 + beat * 0.42;
      nucleus.scale.setScalar(breathe);
      nucleus.material.emissiveIntensity = 0.7 + beat * 1.6;
      glassCore.scale.setScalar(1 + beat * 0.06);
      rimLight.intensity = 1.2 + beat * 1.4;

      // Émotion : la teinte du cœur oscille bleu ↔ turquoise.
      const mix = Math.sin(time * 0.16) * 0.5 + 0.5;
      wireCore.material.color.copy(cBlue).lerp(cTeal, mix);

      particles.rotation.y += 0.0009;
      particles.rotation.x = Math.sin(time * 0.16) * 0.05;

      panels.forEach((panel) => {
        const u = panel.userData;
        const a = u.a0 + time * u.speed;
        panel.position.set(
          Math.cos(a) * u.radius,
          0.15 + Math.sin(time * 0.9 + u.bob) * 0.18,
          Math.sin(a) * u.radius * 0.62
        );
        panel.rotation.y = -a + Math.PI / 2;
        panel.rotation.z = Math.sin(time * 0.6 + u.bob) * 0.06;
      });
    }

    root.rotation.y += (pointer.x * 0.22 - root.rotation.y) * 0.05;
    root.rotation.x += (-pointer.y * 0.12 - root.rotation.x) * 0.05;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (event) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  resize();
  stage.classList.add("is-loaded");

  if (window.gsap && !reducedMotion) {
    gsap.from(root.position, { y: -0.6, duration: 1.5, ease: "power3.out" });
    gsap.from(root.scale, { x: 0.7, y: 0.7, z: 0.7, duration: 1.5, ease: "power3.out" });
    gsap.from(coreGroup.rotation, { y: -1.4, duration: 1.7, ease: "power3.out" });
  }

  animate();
})();
