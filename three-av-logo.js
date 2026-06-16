/* ==========================================================================
   three-av-logo.js — Charge et affiche le cristal AV en interactif.
   L'utilisateur fait tourner le logo à la souris (réactif + fluidité).
   ========================================================================== */

(function () {
  const canvas = document.getElementById("next-gen-scene");
  const stage = document.querySelector(".three-stage");

  if (!canvas || !window.THREE) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 720px)").matches;

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

  const sceneShift = isMobile ? 0 : 1.5;
  camera.position.set(0, 0.4, isMobile ? 9 : 7);

  const root = new THREE.Group();
  root.position.set(sceneShift, 0.2, 0);
  scene.add(root);

  const ambient = new THREE.AmbientLight(0xffffff, 0.82);
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
  keyLight.position.set(3, 5, 6);
  const rimLight = new THREE.PointLight(0x3157d5, 1.4, 18);
  rimLight.position.set(-3, 1.5, 3);
  scene.add(ambient, keyLight, rimLight);

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const clock = new THREE.Clock();
  let logoGroup = null;
  let gltfScene = null;

  // Charger le GLB
  const loader = new THREE.GLTFLoader();
  loader.load("assets/av-logo.glb", (gltf) => {
    gltfScene = gltf.scene;
    logoGroup = new THREE.Group();
    logoGroup.add(gltfScene);
    root.add(logoGroup);

    // Appliquer des matériaux lumineux
    gltfScene.traverse((node) => {
      if (node.isMesh) {
        node.material = new THREE.MeshStandardMaterial({
          color: 0x3157d5,
          emissive: 0x5d8bff,
          emissiveIntensity: 0.4,
          roughness: 0.28,
          metalness: 0.2
        });
        node.castShadow = false;
        node.receiveShadow = false;
      }
    });

    stage.classList.add("is-loaded");
  });

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

    if (logoGroup) {
      // Interaction souris fluide
      pointer.targetX += (pointer.x - pointer.targetX) * 0.06;
      pointer.targetY += (pointer.y - pointer.targetY) * 0.06;

      logoGroup.rotation.y = pointer.targetX * 0.8 + (reducedMotion ? 0 : time * 0.2);
      logoGroup.rotation.x = pointer.targetY * 0.5 + (reducedMotion ? 0 : Math.sin(time * 0.15) * 0.08);

      // Battement subtil
      if (!reducedMotion) {
        logoGroup.position.y = Math.sin(time * 1.2) * 0.12;
      }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (event) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  resize();
  animate();
})();
