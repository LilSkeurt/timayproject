const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
const exampleCards = Array.from(document.querySelectorAll("[data-example-card]"));
const exampleDetailTitle = document.querySelector("#example-detail-title");
const exampleDetailSummary = document.querySelector("#example-detail-summary");
const exampleDetailPlan = document.querySelector("#example-detail-plan");
const exampleDetailAction = document.querySelector("#example-detail-action");
let selectedExampleCard = exampleCards[0] || null;
let syncInspirationExperience = () => {};
let syncInspirationVisibility = () => {};
let syncInspirationSelectedState = () => {};
let pulseInspirationScene = () => {};

function getSelectedInspirations() {
  return JSON.parse(sessionStorage.getItem("selected_inspirations") || "[]");
}

function setSelectedInspirations(list) {
  sessionStorage.setItem("selected_inspirations", JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("inspirations-changed", { detail: list }));
}

function getExampleData(card) {
  return {
    title: card?.dataset.exampleTitle || card?.querySelector("h3")?.textContent.trim() || "",
    summary: card?.dataset.exampleSummary || card?.querySelector(".example-content p")?.textContent.trim() || "",
    tag: card?.dataset.exampleTag || card?.querySelector(".example-tag")?.textContent.trim() || "",
    color: card?.dataset.exampleColor || "#3157d5",
    accent: card?.dataset.exampleAccent || "#0f9f8f"
  };
}

function showToast(message) {
  let toast = document.querySelector(".toast-notification");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast-notification";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toast.timeoutId);
  toast.timeoutId = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function updateExampleDetail(card) {
  if (!card) return;

  selectedExampleCard = card;
  exampleCards.forEach((item) => item.classList.toggle("is-active", item === card));

  if (!exampleDetailTitle || !exampleDetailSummary || !exampleDetailPlan || !exampleDetailAction) {
    syncInspirationExperience(card);
    return;
  }

  const { title, summary, tag } = getExampleData(card);
  const selected = getSelectedInspirations();
  const actionLabel = exampleDetailAction.querySelector("span");

  exampleDetailTitle.textContent = title;
  exampleDetailSummary.textContent = summary;
  exampleDetailPlan.textContent = `Style : ${tag}`;

  if (actionLabel) {
    actionLabel.textContent = selected.includes(title)
      ? "Retirer des inspirations"
      : "Ajouter aux inspirations";
  }

  syncInspirationExperience(card);
}

function toggleExample(card) {
  const { title } = getExampleData(card);
  const selected = getSelectedInspirations();
  const index = selected.indexOf(title);
  const isAdding = index < 0;

  if (index >= 0) {
    selected.splice(index, 1);
    card.classList.remove("is-selected");
    showToast(`"${title}" retiré des inspirations.`);
  } else {
    selected.push(title);
    card.classList.add("is-selected");
    showToast(`"${title}" ajouté à votre univers d'inspiration.`);
  }

  setSelectedInspirations(selected);
  updateExampleDetail(card);
  syncInspirationSelectedState();
  pulseInspirationScene(card, isAdding);
}

function filterExamples(category) {
  exampleCards.forEach((card) => {
    const categories = card.dataset.category.split(" ");
    const shouldShow = category === "all" || categories.includes(category);
    card.classList.toggle("is-hidden", !shouldShow);
  });

  const firstVisible = exampleCards.find((card) => !card.classList.contains("is-hidden"));
  updateExampleDetail(firstVisible);
  syncInspirationVisibility();
}

function setupInspirationExperience() {
  const experience = document.querySelector("[data-inspiration-experience]");
  const canvas = document.querySelector("#inspiration-scene");
  const prevButton = document.querySelector("[data-inspiration-prev]");
  const nextButton = document.querySelector("[data-inspiration-next]");

  if (!experience) return;

  const experienceCards = exampleCards.filter((card) => experience.contains(card));

  if (!experienceCards.length) return;

  const isMobile = window.matchMedia("(max-width: 720px)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // HUD readout elements (optional)
  const hudIndex = experience.querySelector("[data-inspiration-index]");
  const hudTotal = experience.querySelector("[data-inspiration-total]");
  const hudName = experience.querySelector("[data-inspiration-name]");

  if (hudTotal) hudTotal.textContent = String(experienceCards.length).padStart(2, "0");

  function getVisibleCards() {
    return experienceCards.filter((card) => !card.classList.contains("is-hidden"));
  }

  function browseInspirations(direction) {
    const visibleCards = getVisibleCards();
    if (!visibleCards.length) return;

    const currentIndex = Math.max(0, visibleCards.indexOf(selectedExampleCard));
    const nextIndex = (currentIndex + direction + visibleCards.length) % visibleCards.length;
    updateExampleDetail(visibleCards[nextIndex]);
  }

  prevButton?.addEventListener("click", () => browseInspirations(-1));
  nextButton?.addEventListener("click", () => browseInspirations(1));
  experience.tabIndex = 0;
  experience.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      browseInspirations(-1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      browseInspirations(1);
    }
  });

  syncInspirationExperience = (card) => {
    if (!experienceCards.includes(card)) return;
    experienceCards.forEach((item) => item.classList.toggle("is-active", item === card));
  };

  if (!canvas || !window.THREE) {
    experience.classList.add("is-fallback");
    return;
  }

  /* ---------------------------------------------------------------------
   * Scène : une galerie/couloir holographique dans lequel on se balade.
   * La caméra avance le long d'un corridor néon ; chaque inspiration est
   * un pavillon de lumière. Tout l'univers prend la couleur (l'émotion)
   * de l'inspiration sélectionnée.
   * ------------------------------------------------------------------- */
  const scene = new THREE.Scene();
  const fogColor = new THREE.Color(0x070b12);
  scene.fog = new THREE.FogExp2(fogColor.getHex(), isMobile ? 0.05 : 0.044);

  const camera = new THREE.PerspectiveCamera(isMobile ? 64 : 58, 1, 0.1, 160);
  camera.position.set(0, 1.1, 8);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });

  if ("outputEncoding" in renderer) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pointerEase = { x: 0, y: 0 };
  const world = new THREE.Group();
  const panelItems = [];
  const hitTargets = [];

  const spacing = isMobile ? 8 : 9;
  const camStandoff = isMobile ? 8.4 : 7.4;
  const railWidth = isMobile ? 3.1 : 4.6;
  const corridorDepth = spacing * experienceCards.length + 48;

  let activeIndex = 0;
  let camZ = camera.position.z;
  let camX = 0;
  let camY = 1.1;
  let targetZ = camStandoff;
  let moodPulse = 0;
  const lookTarget = new THREE.Vector3(0, 0.85, 0);

  // Couleurs d'ambiance qui "respirent" vers l'inspiration active.
  const themeColor = new THREE.Color(0x3157d5);
  const themeAccent = new THREE.Color(0x16b8a6);
  const targetColor = new THREE.Color(0x3157d5);
  const targetAccent = new THREE.Color(0x16b8a6);
  const targetFog = new THREE.Color(0x070b12);

  scene.add(world);

  const ambient = new THREE.AmbientLight(0xb9ccff, 0.5);
  const key = new THREE.DirectionalLight(0xffffff, 0.85);
  key.position.set(2.5, 6, 6);
  const moodLight = new THREE.PointLight(0x3157d5, 2.4, 44);
  moodLight.position.set(0, 2.6, 4);
  const fillLight = new THREE.PointLight(0x16b8a6, 1.5, 40);
  fillLight.position.set(0, 1, -8);
  scene.add(ambient, key, moodLight, fillLight);

  function makeMaterial(color, options = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: options.roughness ?? 0.42,
      metalness: options.metalness ?? 0.12,
      transparent: options.transparent ?? false,
      opacity: options.opacity ?? 1,
      side: options.side
    });
  }

  function neonMaterial(color, intensity = 2, opacity = 1) {
    return new THREE.MeshStandardMaterial({
      color: 0x05080e,
      emissive: new THREE.Color(color),
      emissiveIntensity: intensity,
      roughness: 0.4,
      metalness: 0.2,
      transparent: opacity < 1,
      opacity
    });
  }

  const materials = {
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.66,
      roughness: 0.22,
      metalness: 0.05,
      clearcoat: 0.85,
      clearcoatRoughness: 0.14,
      side: THREE.DoubleSide
    }),
    frame: makeMaterial(0x0c1320, { roughness: 0.34, metalness: 0.28 }),
    textLine: makeMaterial(0xe6edf5, { transparent: true, opacity: 0.74 }),
    lightLine: makeMaterial(0xffffff, { transparent: true, opacity: 0.5 }),
    hit: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  };

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function createLabelTexture(data) {
    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 640;
    labelCanvas.height = 220;
    const context = labelCanvas.getContext("2d");

    context.clearRect(0, 0, labelCanvas.width, labelCanvas.height);

    roundRect(context, 10, 10, 620, 200, 22);
    context.fillStyle = "rgba(7, 11, 18, 0.72)";
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = data.accent;
    context.stroke();

    // petits coins type HUD
    context.strokeStyle = data.color;
    context.lineWidth = 3;
    [[26, 26, 1, 1], [614, 26, -1, 1], [26, 194, 1, -1], [614, 194, -1, -1]].forEach(([cx, cy, sx, sy]) => {
      context.beginPath();
      context.moveTo(cx, cy + 18 * sy);
      context.lineTo(cx, cy);
      context.lineTo(cx + 18 * sx, cy);
      context.stroke();
    });

    context.fillStyle = data.accent;
    context.font = "700 30px Manrope, sans-serif";
    context.fillText(data.tag.toUpperCase(), 46, 78);

    context.shadowColor = data.color;
    context.shadowBlur = 24;
    context.fillStyle = "#ffffff";
    context.font = "800 58px 'Plus Jakarta Sans', Manrope, sans-serif";
    context.fillText(data.title, 46, 150);
    context.shadowBlur = 0;

    context.fillStyle = data.color;
    context.fillRect(46, 170, 230, 6);

    const texture = new THREE.CanvasTexture(labelCanvas);
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }

  function addBox(parent, width, height, depth, x, y, z, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function addSiteMock(parent, data, index) {
    const color = new THREE.Color(data.color);
    const accent = new THREE.Color(data.accent);
    const colorMaterial = makeMaterial(color, { roughness: 0.3, metalness: 0.16 });
    const accentMaterial = makeMaterial(accent, { roughness: 0.34, metalness: 0.14 });
    const glowMaterial = makeMaterial(color, { transparent: true, opacity: 0.22, side: THREE.DoubleSide });

    const frame = addBox(parent, 2.76, 1.88, 0.1, 0, 0.1, 0, materials.glass);
    const topBar = addBox(parent, 2.76, 0.24, 0.13, 0, 0.92, 0.05, materials.frame);
    const hero = addBox(parent, 1.04, 0.68, 0.16, -0.64, 0.34, 0.12, colorMaterial);
    const cta = addBox(parent, 0.58, 0.18, 0.18, 0.72, -0.52, 0.16, accentMaterial);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(3.34, 2.4), glowMaterial);

    halo.position.set(0, 0.1, -0.08);
    halo.userData.isHalo = true;
    parent.add(halo);

    addBox(parent, 1.05, 0.08, 0.13, 0.58, 0.46, 0.14, materials.frame);
    addBox(parent, 1.22, 0.055, 0.12, 0.66, 0.22, 0.14, materials.textLine);
    addBox(parent, 0.9, 0.055, 0.12, 0.5, 0.02, 0.14, materials.textLine);

    if (index % 3 === 1) {
      for (let i = 0; i < 3; i += 1) {
        addBox(parent, 0.48, 0.52, 0.13, -0.68 + i * 0.55, -0.58, 0.14, i === 1 ? colorMaterial : materials.lightLine);
      }
    } else if (index % 3 === 2) {
      const circle = new THREE.Mesh(new THREE.SphereGeometry(0.34, 28, 28), colorMaterial);
      circle.position.set(-0.66, -0.46, 0.18);
      parent.add(circle);
      addBox(parent, 0.88, 0.06, 0.12, 0.58, -0.28, 0.14, materials.textLine);
      addBox(parent, 0.68, 0.06, 0.12, 0.48, -0.48, 0.14, materials.lightLine);
    } else {
      addBox(parent, 0.48, 0.38, 0.13, -0.72, -0.54, 0.14, materials.lightLine);
      addBox(parent, 0.48, 0.38, 0.13, -0.1, -0.54, 0.14, materials.lightLine);
    }

    for (let i = 0; i < 3; i += 1) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), i === 0 ? colorMaterial : i === 1 ? accentMaterial : materials.textLine);
      dot.position.set(-1.17 + i * 0.12, 0.92, 0.14);
      parent.add(dot);
    }

    return { frame, topBar, hero, cta, halo };
  }

  /* --- Le corridor néon (sol, plafond, rails, barres lumineuses) --- */
  const corridor = new THREE.Group();
  world.add(corridor);

  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x080c14,
    emissive: themeColor.clone(),
    emissiveIntensity: 0.12,
    roughness: 0.46,
    metalness: 0.6
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(railWidth * 2.7, corridorDepth), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -1.62, -corridorDepth / 2 + 12);
  corridor.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(railWidth * 2.7, corridorDepth),
    new THREE.MeshStandardMaterial({ color: 0x05080e, roughness: 0.9, metalness: 0.1, transparent: true, opacity: 0.55 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 4.6, -corridorDepth / 2 + 12);
  corridor.add(ceiling);

  const railMatColor = neonMaterial(themeColor.getHex(), 2.6);
  const railMatAccent = neonMaterial(themeAccent.getHex(), 2.6);

  function addRail(material, x, y) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, corridorDepth), material);
    rail.position.set(x, y, -corridorDepth / 2 + 12);
    corridor.add(rail);
    return rail;
  }

  addRail(railMatColor, -railWidth, -1.5);
  addRail(railMatAccent, railWidth, -1.5);
  addRail(railMatAccent, -railWidth, 3.4);
  addRail(railMatColor, railWidth, 3.4);
  const ceilingStrip = addRail(railMatColor, 0, 4.5);

  // Piliers lumineux le long des murs.
  const pillarMat = neonMaterial(themeColor.getHex(), 1.8);
  const pillarCount = experienceCards.length + 4;
  for (let i = 0; i < pillarCount; i += 1) {
    const z = 6 - i * spacing;
    [-railWidth, railWidth].forEach((x) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 5, 0.08), pillarMat);
      pillar.position.set(x, 0.95, z);
      corridor.add(pillar);
    });
  }

  // Barres lumineuses au sol qui défilent vers nous (sensation d'avancer).
  const rungMat = neonMaterial(themeAccent.getHex(), 2.2, 0.92);
  const rungs = [];
  const rungCount = isMobile ? 18 : 26;
  const rungGap = 2.3;
  for (let i = 0; i < rungCount; i += 1) {
    const rung = new THREE.Mesh(new THREE.BoxGeometry(railWidth * 2 - 0.3, 0.05, 0.14), rungMat);
    rung.position.set(0, -1.57, (camZ + 8) - i * rungGap);
    corridor.add(rung);
    rungs.push(rung);
  }

  /* --- Les pavillons d'inspiration --- */
  function buildPavilion(card, data, index) {
    const group = new THREE.Group();
    const color = new THREE.Color(data.color);
    const accent = new THREE.Color(data.accent);

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(2.05, 2.4, 0.2, 56),
      new THREE.MeshStandardMaterial({ color: 0x0b121d, emissive: accent.clone(), emissiveIntensity: 0.65, roughness: 0.5, metalness: 0.62 })
    );
    pedestal.position.y = -1.5;
    group.add(pedestal);

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.55, 2.25, 6.6, 36, 1, true),
      new THREE.MeshBasicMaterial({
        color: color.clone(),
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    beam.position.y = 1.7;
    group.add(beam);

    const screen = new THREE.Group();
    const panel = addSiteMock(screen, data, index);
    screen.position.y = 1.05;
    screen.scale.setScalar(0.96);
    group.add(screen);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.95, 0.022, 14, 96),
      new THREE.MeshBasicMaterial({ color: accent.clone(), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    halo.position.y = 1.05;
    halo.rotation.x = Math.PI / 2;
    group.add(halo);

    const haloInner = new THREE.Mesh(
      new THREE.TorusGeometry(1.45, 0.014, 12, 80),
      new THREE.MeshBasicMaterial({ color: color.clone(), transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    haloInner.position.y = -1.4;
    haloInner.rotation.x = Math.PI / 2;
    group.add(haloInner);

    const label = new THREE.Sprite(new THREE.SpriteMaterial({
      map: createLabelTexture(data),
      transparent: true,
      depthWrite: false
    }));
    label.scale.set(3.6, 1.24, 1);
    label.position.set(0, 3.05, 0);
    group.add(label);

    const burst = new THREE.Mesh(
      new THREE.RingGeometry(0.86, 1, 64),
      new THREE.MeshBasicMaterial({
        color: accent.clone(),
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    burst.rotation.x = -Math.PI / 2;
    burst.position.y = -1.46;
    group.add(burst);

    const hitBox = new THREE.Mesh(new THREE.BoxGeometry(4.6, 5, 2.4), materials.hit);
    hitBox.position.y = 1;
    hitBox.userData.card = card;
    group.add(hitBox);

    group.position.set(0, 0, -index * spacing);
    group.userData.card = card;
    group.userData.index = index;
    world.add(group);

    hitTargets.push(hitBox);

    return { card, data, group, panel, beam, halo, haloInner, label, burst, pedestal, color, accent, burstT: 1 };
  }

  experienceCards.forEach((card, index) => {
    panelItems.push(buildPavilion(card, getExampleData(card), index));
  });

  /* --- Champ d'étoiles qui file vers la caméra --- */
  const starGeometry = new THREE.BufferGeometry();
  const starCount = isMobile ? 120 : 240;
  const starPositions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i += 1) {
    starPositions[i * 3] = -railWidth * 1.6 + Math.random() * railWidth * 3.2;
    starPositions[i * 3 + 1] = -1.4 + Math.random() * 6;
    starPositions[i * 3 + 2] = (camZ + 6) - Math.random() * corridorDepth;
  }

  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));

  const starMaterial = new THREE.PointsMaterial({
    color: 0xe7d6a8,
    size: isMobile ? 0.05 : 0.06,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  world.add(stars);

  function getCardIndex(card) {
    return Math.max(0, experienceCards.indexOf(card));
  }

  function updateSceneTarget(card) {
    activeIndex = getCardIndex(card);
    const data = getExampleData(card);
    targetZ = -activeIndex * spacing + camStandoff;
    targetColor.set(data.color);
    targetAccent.set(data.accent);
    targetFog.set(data.color).multiplyScalar(0.16);

    if (hudIndex) hudIndex.textContent = String(activeIndex + 1).padStart(2, "0");
    if (hudName) hudName.textContent = data.title;

    syncInspirationSelectedState();
  }

  function resize() {
    const rect = experience.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.6 : 1.8));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  syncInspirationExperience = (card) => {
    if (!experienceCards.includes(card)) return;
    experienceCards.forEach((item) => item.classList.toggle("is-active", item === card));
    updateSceneTarget(card);
  };

  syncInspirationVisibility = () => {
    panelItems.forEach((item) => {
      item.group.visible = !item.card.classList.contains("is-hidden");
    });
  };

  syncInspirationSelectedState = () => {
    const selected = getSelectedInspirations();

    panelItems.forEach((item, index) => {
      const isActive = index === activeIndex;
      const isSelected = selected.includes(item.data.title);
      item.panel.halo.material.opacity = isSelected ? 0.46 : isActive ? 0.3 : 0.16;
      item.halo.material.opacity = isSelected ? 0.85 : isActive ? 0.6 : 0.28;
      item.pedestal.material.emissiveIntensity = isSelected ? 1.1 : isActive ? 0.8 : 0.45;
    });
  };

  pulseInspirationScene = (card, isAdding) => {
    const index = getCardIndex(card);
    const item = panelItems[index];
    if (!item) return;
    item.burstT = 0;
    moodPulse = isAdding ? 1 : 0.55;
  };

  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointerEase.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerEase.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  }, { passive: true });

  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    raycaster.setFromCamera(pointer, camera);

    const hit = raycaster.intersectObjects(hitTargets, false)
      .find((item) => !item.object.userData.card.classList.contains("is-hidden"));

    if (!hit) {
      const activeCard = experienceCards[activeIndex];

      if (!activeCard || activeCard.classList.contains("is-hidden")) return;

      updateExampleDetail(activeCard);
      toggleExample(activeCard);
      return;
    }

    updateExampleDetail(hit.object.userData.card);
    toggleExample(hit.object.userData.card);
  });

  function animate() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    // Déplacement de caméra : on se balade dans le couloir.
    const sway = reducedMotion ? 0 : 1;
    camZ += (targetZ - camZ) * 0.06;
    camX += ((pointerEase.x * 0.7) * sway - camX) * 0.06;
    camY += ((1.1 - pointerEase.y * 0.32 * sway) - camY) * 0.06;
    camera.position.set(camX, camY, camZ);

    lookTarget.x += ((pointerEase.x * 0.6) * sway - lookTarget.x) * 0.06;
    lookTarget.y += (0.85 - lookTarget.y) * 0.06;
    lookTarget.z += ((-activeIndex * spacing) - lookTarget.z) * 0.06;
    camera.lookAt(lookTarget);

    // L'univers respire la couleur de l'inspiration (émotion).
    themeColor.lerp(targetColor, 0.045);
    themeAccent.lerp(targetAccent, 0.045);
    fogColor.lerp(targetFog, 0.045);
    scene.fog.color.copy(fogColor);

    railMatColor.emissive.copy(themeColor);
    railMatAccent.emissive.copy(themeAccent);
    rungMat.emissive.copy(themeAccent);
    pillarMat.emissive.copy(themeColor);
    floorMat.emissive.copy(themeColor);
    starMaterial.color.copy(themeAccent);
    fillLight.color.copy(themeAccent);

    moodPulse *= 0.92;
    const breathe = reducedMotion ? 0 : (Math.sin(time * 1.1) * 0.5 + 0.5);
    moodLight.color.copy(themeColor);
    moodLight.intensity = 2.1 + breathe * 0.8 + moodPulse * 4.2;

    // Barres au sol qui défilent (avancée).
    if (!reducedMotion) {
      rungs.forEach((rung) => {
        rung.position.z += 4.6 * dt;
        if (rung.position.z > camZ + 8) {
          rung.position.z -= rungCount * rungGap;
        }
      });

      const starPos = starGeometry.attributes.position.array;
      for (let i = 0; i < starCount; i += 1) {
        starPos[i * 3 + 2] += (5 + (i % 5)) * dt;
        if (starPos[i * 3 + 2] > camZ + 6) {
          starPos[i * 3 + 2] -= corridorDepth;
        }
      }
      starGeometry.attributes.position.needsUpdate = true;
    }

    panelItems.forEach((item, index) => {
      const isActive = index === activeIndex;
      const targetScale = item.card.classList.contains("is-hidden") ? 0.001 : isActive ? 1.08 : 0.92;
      const floatY = reducedMotion ? 0 : Math.sin(time * 0.8 + index) * 0.06;

      item.group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.09);
      item.group.position.y += (floatY - item.group.position.y) * 0.08;

      if (!reducedMotion) {
        item.halo.rotation.z += isActive ? 0.012 : 0.005;
        item.haloInner.rotation.z -= isActive ? 0.018 : 0.008;
        item.group.rotation.y = Math.sin(time * 0.3 + index) * 0.05 + pointerEase.x * 0.02;
      }

      const beamPulse = reducedMotion ? 0.12 : 0.1 + Math.sin(time * 1.6 + index) * 0.03;
      item.beam.material.opacity = (isActive ? 0.2 : 0.09) + beamPulse * 0.4;
      item.label.material.opacity = isActive ? 1 : 0.6;

      if (item.burstT < 1) {
        item.burstT = Math.min(1, item.burstT + dt * 1.5);
        const p = item.burstT;
        const eased = 1 - Math.pow(1 - p, 3);
        item.burst.scale.setScalar(0.6 + eased * 5.4);
        item.burst.material.opacity = (1 - p) * 0.85;
      }
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize);
  resize();
  syncInspirationVisibility();
  updateSceneTarget(selectedExampleCard);
  themeColor.copy(targetColor);
  themeAccent.copy(targetAccent);
  fogColor.copy(targetFog);
  experience.classList.add("is-loaded");

  // Vol d'approche : on entre dans la galerie.
  if (!reducedMotion) {
    camZ = targetZ + 16;
    camY = 3.4;
    lookTarget.set(0, 0.85, -1 * spacing);
  }

  animate();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    filterExamples(button.dataset.filter);
  });
});

exampleCards.forEach((card) => {
  if (card.classList.contains("example-card") && !card.querySelector(".example-select-badge")) {
    const badge = document.createElement("div");
    badge.className = "example-select-badge";
    card.appendChild(badge);
  }

  card.addEventListener("click", () => {
    updateExampleDetail(card);
    toggleExample(card);
  });

  if (!card.classList.contains("example-card")) return;

  card.addEventListener("pointermove", (event) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty("--example-tilt-x", `${(-y * 7).toFixed(2)}deg`);
    card.style.setProperty("--example-tilt-y", `${(x * 8).toFixed(2)}deg`);
  });

  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--example-tilt-x", "0deg");
    card.style.setProperty("--example-tilt-y", "0deg");
  });
});

exampleDetailAction?.addEventListener("click", () => {
  if (selectedExampleCard) toggleExample(selectedExampleCard);
});

window.addEventListener("remove-inspiration", (event) => {
  const name = event.detail;
  const selected = getSelectedInspirations().filter((item) => item !== name);
  const card = exampleCards.find((item) => getExampleData(item).title === name);

  card?.classList.remove("is-selected");
  setSelectedInspirations(selected);
  showToast(`"${name}" retiré des inspirations.`);
  updateExampleDetail(selectedExampleCard);
  syncInspirationSelectedState();
});

setupInspirationExperience();

const initialSelected = getSelectedInspirations();
exampleCards.forEach((card) => {
  const { title } = getExampleData(card);
  card.classList.toggle("is-selected", initialSelected.includes(title));
});
setSelectedInspirations(initialSelected);
updateExampleDetail(selectedExampleCard);
syncInspirationVisibility();
syncInspirationSelectedState();
