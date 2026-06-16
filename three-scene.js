(function () {
  const canvas = document.getElementById("next-gen-scene");
  const stage = document.querySelector(".three-stage");

  if (!canvas || !window.THREE) {
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });

  const pointer = { x: 0, y: 0 };
  const mainGroup = new THREE.Group();
  const panels = new THREE.Group();
  const particlesGroup = new THREE.Group();
  const clock = new THREE.Clock();
  const isMobile = window.matchMedia("(max-width: 720px)").matches;
  const sceneShift = isMobile ? 0 : 1.45;

  camera.position.set(0, 0.6, isMobile ? 9.5 : 7.2);
  scene.add(mainGroup);
  scene.add(particlesGroup);
  mainGroup.position.x = sceneShift;
  particlesGroup.position.x = sceneShift;

  const ambient = new THREE.AmbientLight(0xffffff, 0.86);
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
  keyLight.position.set(3, 5, 6);
  scene.add(ambient, keyLight);

  const materials = {
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.66,
      roughness: 0.28,
      metalness: 0.04,
      clearcoat: 0.65,
      clearcoatRoughness: 0.22,
      side: THREE.DoubleSide
    }),
    navy: new THREE.MeshStandardMaterial({ color: 0x101828, roughness: 0.35, metalness: 0.18 }),
    blue: new THREE.MeshStandardMaterial({ color: 0x3157d5, roughness: 0.28, metalness: 0.18 }),
    teal: new THREE.MeshStandardMaterial({ color: 0x0f9f8f, roughness: 0.3, metalness: 0.12 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xd99a32, roughness: 0.4, metalness: 0.2 }),
    line: new THREE.MeshStandardMaterial({ color: 0x667085, roughness: 0.45, metalness: 0.02 }),
    sphereBlue: new THREE.MeshPhysicalMaterial({
      color: 0x5d7cf0,
      transparent: true,
      opacity: 0.34,
      roughness: 0.12,
      metalness: 0.02,
      clearcoat: 1,
      clearcoatRoughness: 0.08
    }),
    sphereTeal: new THREE.MeshPhysicalMaterial({
      color: 0x35d0bd,
      transparent: true,
      opacity: 0.28,
      roughness: 0.14,
      metalness: 0.02,
      clearcoat: 1,
      clearcoatRoughness: 0.1
    })
  };

  function roundedPanel(width, height, depth, material) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    return mesh;
  }

  function addBar(parent, x, y, width, material, z = 0.05) {
    const bar = roundedPanel(width, 0.08, 0.045, material);
    bar.position.set(x, y, z);
    parent.add(bar);
    return bar;
  }

  function createBrowserPanel(scale = 1) {
    const group = new THREE.Group();
    const base = roundedPanel(3.3 * scale, 2.08 * scale, 0.06, materials.glass);
    const top = roundedPanel(3.3 * scale, 0.28 * scale, 0.08, materials.navy);
    const hero = roundedPanel(1.1 * scale, 0.72 * scale, 0.09, materials.blue);
    const cta = roundedPanel(0.62 * scale, 0.2 * scale, 0.1, materials.teal);

    top.position.y = 0.9 * scale;
    hero.position.set(-0.83 * scale, 0.23 * scale, 0.09);
    cta.position.set(0.8 * scale, -0.52 * scale, 0.11);

    group.add(base, top, hero, cta);
    addBar(group, 0.64 * scale, 0.42 * scale, 1.28 * scale, materials.navy, 0.1);
    addBar(group, 0.58 * scale, 0.17 * scale, 1.16 * scale, materials.line, 0.1);
    addBar(group, 0.44 * scale, -0.07 * scale, 0.88 * scale, materials.line, 0.1);

    for (let i = 0; i < 3; i += 1) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.045 * scale, 16, 16), [
        materials.blue,
        materials.teal,
        materials.gold
      ][i]);
      dot.position.set((-1.42 + i * 0.14) * scale, 0.9 * scale, 0.11);
      group.add(dot);
    }

    return group;
  }

  const desktop = createBrowserPanel(1.18);
  desktop.position.set(1.52, 0.25, 0);
  desktop.rotation.set(-0.07, -0.42, 0.04);
  panels.add(desktop);

  const tablet = createBrowserPanel(0.74);
  tablet.position.set(3.0, -0.74, -0.46);
  tablet.rotation.set(0.08, -0.68, 0.06);
  panels.add(tablet);

  const mobile = createBrowserPanel(0.48);
  mobile.position.set(0.2, -0.96, 0.26);
  mobile.rotation.set(0.13, -0.18, -0.05);
  panels.add(mobile);

  const sphereGroup = new THREE.Group();

  function addSphere(radius, material, x, y, z) {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 36, 36), material);
    sphere.position.set(x, y, z);
    sphereGroup.add(sphere);
    return sphere;
  }

  const sphereLarge = addSphere(0.44, materials.sphereBlue, 3.78, 0.88, -0.92);
  const sphereMedium = addSphere(0.28, materials.sphereTeal, 2.38, -1.22, 0.28);
  const sphereSmall = addSphere(0.16, materials.gold, 0.92, 1.15, -0.46);
  panels.add(sphereGroup);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.92, 0.012, 16, 140),
    new THREE.MeshStandardMaterial({ color: 0x3157d5, transparent: true, opacity: 0.36 })
  );
  ring.position.set(1.55, -0.05, -0.72);
  ring.rotation.set(1.05, 0.3, -0.24);
  panels.add(ring);

  const grid = new THREE.GridHelper(5.6, 12, 0x3157d5, 0xb9c3d6);
  grid.material.transparent = true;
  grid.material.opacity = 0.16;
  grid.position.set(1.54, -1.58, -1.25);
  grid.rotation.z = 0.02;
  panels.add(grid);

  mainGroup.add(panels);

  const particleCount = isMobile ? 80 : 150;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i += 1) {
    particlePositions[i * 3] = 0.1 + Math.random() * 5.2;
    particlePositions[i * 3 + 1] = -2 + Math.random() * 4.2;
    particlePositions[i * 3 + 2] = -2.2 + Math.random() * 2.6;
  }

  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

  const particleMaterial = new THREE.PointsMaterial({
    color: 0x3157d5,
    size: isMobile ? 0.025 : 0.032,
    transparent: true,
    opacity: 0.48
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  particlesGroup.add(particles);

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
    panels.rotation.y = Math.sin(time * 0.28) * 0.12 + pointer.x * 0.16;
    panels.rotation.x = Math.sin(time * 0.22) * 0.035 - pointer.y * 0.06;
    panels.position.y = Math.sin(time * 0.8) * 0.05;
    sphereLarge.position.y = 0.88 + Math.sin(time * 0.72) * 0.08;
    sphereMedium.position.y = -1.22 + Math.sin(time * 0.94 + 1.2) * 0.06;
    sphereSmall.position.y = 1.15 + Math.sin(time * 1.12 + 0.4) * 0.05;
    sphereGroup.rotation.y = Math.sin(time * 0.26) * 0.16;
    ring.rotation.z += 0.0025;
    particles.rotation.y += 0.0008;
    particles.rotation.x = Math.sin(time * 0.18) * 0.04;

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

  if (window.gsap) {
    gsap.from(panels.position, { x: 1.2, y: -0.18, duration: 1.35, ease: "power3.out" });
    gsap.from(panels.rotation, { y: -0.9, z: -0.1, duration: 1.45, ease: "power3.out" });
    gsap.from(panels.scale, { x: 0.82, y: 0.82, z: 0.82, duration: 1.35, ease: "power3.out" });
    gsap.to(desktop.position, { y: desktop.position.y + 0.1, duration: 3.1, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(tablet.position, { y: tablet.position.y - 0.08, duration: 3.6, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(mobile.position, { y: mobile.position.y + 0.12, duration: 2.8, repeat: -1, yoyo: true, ease: "sine.inOut" });
  }

  animate();
})();
