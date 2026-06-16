/* ==========================================================================
   three-contact.js — Hologramme "réseau" dans la section contact.
   Un globe filaire avec des nœuds qui pulsent : connectons votre projet.
   Tourne uniquement quand il est visible (IntersectionObserver).
   ========================================================================== */

(function () {
  const wrap = document.querySelector("[data-contact-hologram]");
  const canvas = document.getElementById("contact-globe");

  if (!wrap || !canvas || !window.THREE) {
    wrap?.classList.add("is-fallback");
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const BLUE = 0x5d8bff;
  const TEAL = 0x2fe0c8;
  const GOLD = 0xf0b75a;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 50);
  camera.position.set(0, 0, 4.3);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power"
  });

  if ("outputEncoding" in renderer) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  const clock = new THREE.Clock();
  const globe = new THREE.Group();
  scene.add(globe);

  const radius = 1.32;

  // Sphère filaire (le réseau).
  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius, 1),
    new THREE.MeshBasicMaterial({ color: TEAL, wireframe: true, transparent: true, opacity: 0.32 })
  );
  globe.add(wire);

  const wire2 = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius * 0.66, 1),
    new THREE.MeshBasicMaterial({ color: BLUE, wireframe: true, transparent: true, opacity: 0.22 })
  );
  globe.add(wire2);

  // Nœuds répartis sur la sphère (spirale de Fibonacci).
  const nodeCount = 18;
  const nodes = [];
  const nodePositions = [];
  const palette = [BLUE, TEAL, GOLD];

  for (let i = 0; i < nodeCount; i += 1) {
    const y = 1 - (i / (nodeCount - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const phi = i * Math.PI * (3 - Math.sqrt(5));
    const pos = new THREE.Vector3(Math.cos(phi) * r, y, Math.sin(phi) * r).multiplyScalar(radius);
    nodePositions.push(pos);

    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 12, 12),
      new THREE.MeshBasicMaterial({
        color: palette[i % palette.length],
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      })
    );
    node.position.copy(pos);
    node.userData = { phase: Math.random() * Math.PI * 2, base: 1 };
    globe.add(node);
    nodes.push(node);
  }

  // Connexions entre nœuds proches.
  const linkPoints = [];
  for (let i = 0; i < nodePositions.length; i += 1) {
    for (let j = i + 1; j < nodePositions.length; j += 1) {
      if (nodePositions[i].distanceTo(nodePositions[j]) < radius * 0.95) {
        linkPoints.push(nodePositions[i], nodePositions[j]);
      }
    }
  }

  const linkGeometry = new THREE.BufferGeometry().setFromPoints(linkPoints);
  const links = new THREE.LineSegments(
    linkGeometry,
    new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending })
  );
  globe.add(links);

  // Un signal qui orbite (un point de lumière qui voyage).
  const signal = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 16, 16),
    new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending })
  );
  globe.add(signal);

  globe.rotation.x = 0.35;

  function resize() {
    const rect = wrap.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  let running = false;
  let rafId = null;

  function frame() {
    const time = clock.getElapsedTime();

    if (!reducedMotion) {
      globe.rotation.y += 0.0035;
      wire2.rotation.y -= 0.006;
      wire2.rotation.x += 0.003;

      nodes.forEach((node) => {
        const pulse = 1 + Math.sin(time * 2 + node.userData.phase) * 0.4;
        node.scale.setScalar(pulse);
        node.material.opacity = 0.55 + Math.sin(time * 2 + node.userData.phase) * 0.35;
      });

      const orbit = time * 0.6;
      signal.position.set(
        Math.cos(orbit) * radius,
        Math.sin(orbit * 1.3) * radius * 0.5,
        Math.sin(orbit) * radius
      );
    }

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    clock.getDelta();
    frame();
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  window.addEventListener("resize", resize);
  resize();
  wrap.classList.add("is-loaded");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? start() : stop()));
    }, { threshold: 0.05 });
    observer.observe(wrap);
  } else {
    start();
  }
})();
