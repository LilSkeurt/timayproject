/* ==========================================================================
   hub.js — Hub de navigation immersif.
   Un couloir holographique dans lequel on avance (molette / flèches / glissé /
   boutons). Chaque page du site est un PORTAIL : on s'en approche, il s'illumine,
   puis on « entre » (plongée cinématique) et la transition warp prend le relais.

   Tout est défensif :
   - sans Three.js, en reduced-motion ou sur mobile → repli galerie (.is-fallback),
     les portails restent de simples liens accessibles.
   - la position courante est mémorisée (sessionStorage "hub_focus") pour revenir
     au même endroit depuis une page.
   ========================================================================== */

(function () {
  const experience = document.querySelector("[data-hub-experience]");
  if (!experience) return;

  const canvas = experience.querySelector("#hub-scene");
  const portals = Array.from(experience.querySelectorAll("[data-hub-portal]"));
  if (!portals.length) return;

  const prevButton = experience.querySelector("[data-hub-prev]");
  const nextButton = experience.querySelector("[data-hub-next]");
  const hudIndex = experience.querySelector("[data-hub-index]");
  const hudTotal = experience.querySelector("[data-hub-total]");
  const hudName = experience.querySelector("[data-hub-name]");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 760px)").matches;
  const total = portals.length;

  if (hudTotal) hudTotal.textContent = String(total).padStart(2, "0");

  /* --- Position mémorisée (retour depuis une page) --- */
  let activeIndex = 0;
  let returning = false;
  try {
    const saved = parseInt(sessionStorage.getItem("hub_focus"), 10);
    if (!Number.isNaN(saved) && saved >= 0 && saved < total) {
      activeIndex = saved;
      returning = true;
    }
  } catch (error) { /* noop */ }

  function portalData(anchor) {
    return {
      title: anchor.querySelector(".hub-portal-title")?.textContent.trim() || anchor.textContent.trim(),
      tag: anchor.querySelector(".hub-portal-index")?.textContent.trim() || "",
      desc: anchor.dataset.desc || anchor.querySelector(".hub-portal-desc")?.textContent.trim() || "",
      href: anchor.getAttribute("href"),
      color: anchor.dataset.color || "#3157d5",
      accent: anchor.dataset.accent || "#16b8a6"
    };
  }

  function persistFocus() {
    try { sessionStorage.setItem("hub_focus", String(activeIndex)); } catch (error) { /* noop */ }
  }

  function setActiveDom(index) {
    portals.forEach((portal, idx) => {
      const on = idx === index;
      portal.classList.toggle("is-active", on);
      portal.setAttribute("aria-current", on ? "true" : "false");
    });
    const data = portalData(portals[index]);
    if (hudIndex) hudIndex.textContent = String(index + 1).padStart(2, "0");
    if (hudName) hudName.textContent = data.title;
    experience.style.setProperty("--hub-color", data.color);
    experience.style.setProperty("--hub-accent", data.accent);
  }

  function navigateTo(href) {
    if (!href) return;
    if (window.AtelierTransition && typeof window.AtelierTransition.warpTo === "function") {
      window.AtelierTransition.warpTo(href);
    } else {
      window.location.href = href;
    }
  }

  /* =========================================================================
     REPLI léger : pas de WebGL, reduced-motion ou mobile.
     Le rail devient une galerie défilante ; les portails sont de vrais liens.
     ========================================================================= */
  const use3D = Boolean(window.THREE) && Boolean(canvas) && !reducedMotion && !isMobile;

  if (!use3D) {
    experience.classList.add("is-fallback", "is-loaded");
    setActiveDom(activeIndex);

    function focusFallback(index) {
      activeIndex = (index + total) % total;
      setActiveDom(activeIndex);
      persistFocus();
      portals[activeIndex].scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        inline: "center",
        block: "nearest"
      });
    }

    prevButton?.addEventListener("click", () => focusFallback(activeIndex - 1));
    nextButton?.addEventListener("click", () => focusFallback(activeIndex + 1));

    portals.forEach((portal, idx) => {
      // Lien réel : on mémorise simplement la position avant de partir.
      portal.addEventListener("click", () => { activeIndex = idx; persistFocus(); });
      portal.addEventListener("focus", () => { activeIndex = idx; setActiveDom(idx); });
    });

    experience.tabIndex = 0;
    experience.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); focusFallback(activeIndex + 1); }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); focusFallback(activeIndex - 1); }
    });

    portals[activeIndex].scrollIntoView({ behavior: "auto", inline: "center", block: "nearest" });
    return;
  }

  /* =========================================================================
     COULOIR 3D
     ========================================================================= */
  const data = portals.map(portalData);

  const scene = new THREE.Scene();
  const fogColor = new THREE.Color(0x070b12);
  scene.fog = new THREE.FogExp2(fogColor.getHex(), 0.04);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
  camera.position.set(0, 1.2, 8);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  if ("outputEncoding" in renderer) renderer.outputEncoding = THREE.sRGBEncoding;

  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pointerEase = { x: 0, y: 0 };
  const world = new THREE.Group();
  scene.add(world);

  const spacing = 11;
  const camStandoff = 7.6;
  const railWidth = 4.4;
  const corridorDepth = spacing * total + 64;

  let camZ = camera.position.z;
  let camX = 0;
  let camY = 1.2;
  let targetZ = -activeIndex * spacing + camStandoff;
  let diving = false;
  let pulse = 0;
  const lookTarget = new THREE.Vector3(0, 1, 0);

  // Couleurs d'ambiance qui « respirent » vers le portail actif (émotion).
  const themeColor = new THREE.Color(data[activeIndex].color);
  const themeAccent = new THREE.Color(data[activeIndex].accent);
  const targetColor = new THREE.Color(data[activeIndex].color);
  const targetAccent = new THREE.Color(data[activeIndex].accent);
  const targetFog = new THREE.Color(data[activeIndex].color).multiplyScalar(0.16);

  const ambient = new THREE.AmbientLight(0xb9ccff, 0.5);
  const key = new THREE.DirectionalLight(0xffffff, 0.85);
  key.position.set(2.5, 6, 6);
  const moodLight = new THREE.PointLight(themeColor.getHex(), 2.4, 48);
  moodLight.position.set(0, 2.6, 4);
  const fillLight = new THREE.PointLight(themeAccent.getHex(), 1.5, 44);
  fillLight.position.set(0, 1, -8);
  scene.add(ambient, key, moodLight, fillLight);

  function neonMaterial(color, intensity = 2.2, opacity = 1) {
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

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines.slice(0, 2);
  }

  function createLabelTexture(item, index) {
    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 700;
    labelCanvas.height = 320;
    const ctx = labelCanvas.getContext("2d");
    ctx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);

    roundRect(ctx, 12, 12, 676, 296, 26);
    ctx.fillStyle = "rgba(7, 11, 18, 0.74)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = item.accent;
    ctx.stroke();

    // coins type HUD
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 3;
    [[32, 32, 1, 1], [668, 32, -1, 1], [32, 288, 1, -1], [668, 288, -1, -1]].forEach(([cx, cy, sx, sy]) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy + 22 * sy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + 22 * sx, cy);
      ctx.stroke();
    });

    ctx.fillStyle = item.accent;
    ctx.font = "700 30px Manrope, sans-serif";
    ctx.fillText(`PORTAIL ${String(index + 1).padStart(2, "0")}`, 52, 88);

    ctx.shadowColor = item.color;
    ctx.shadowBlur = 26;
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 70px 'Plus Jakarta Sans', Manrope, sans-serif";
    ctx.fillText(item.title, 50, 162);
    ctx.shadowBlur = 0;

    ctx.fillStyle = item.color;
    ctx.fillRect(52, 182, 250, 6);

    ctx.fillStyle = "rgba(230, 237, 245, 0.82)";
    ctx.font = "500 26px Manrope, sans-serif";
    wrapText(ctx, item.desc, 600).forEach((line, i) => {
      ctx.fillText(line, 52, 232 + i * 34);
    });

    const texture = new THREE.CanvasTexture(labelCanvas);
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }

  /* --- Le couloir (sol, plafond, rails, piliers, barres défilantes) --- */
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
  floor.position.set(0, -1.6, -corridorDepth / 2 + 12);
  corridor.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(railWidth * 2.7, corridorDepth),
    new THREE.MeshStandardMaterial({ color: 0x05080e, roughness: 0.9, metalness: 0.1, transparent: true, opacity: 0.5 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 4.8, -corridorDepth / 2 + 12);
  corridor.add(ceiling);

  const railMatColor = neonMaterial(themeColor.getHex(), 2.6);
  const railMatAccent = neonMaterial(themeAccent.getHex(), 2.6);

  function addRail(material, x, y) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, corridorDepth), material);
    rail.position.set(x, y, -corridorDepth / 2 + 12);
    corridor.add(rail);
  }
  addRail(railMatColor, -railWidth, -1.5);
  addRail(railMatAccent, railWidth, -1.5);
  addRail(railMatAccent, -railWidth, 3.6);
  addRail(railMatColor, railWidth, 3.6);

  const pillarMat = neonMaterial(themeColor.getHex(), 1.8);
  for (let i = 0; i < total + 4; i += 1) {
    const z = 6 - i * spacing;
    [-railWidth, railWidth].forEach((x) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.09, 5.2, 0.09), pillarMat);
      pillar.position.set(x, 1.05, z);
      corridor.add(pillar);
    });
  }

  // Barres au sol qui défilent vers nous → sensation d'avancer.
  const rungMat = neonMaterial(themeAccent.getHex(), 2.2, 0.92);
  const rungs = [];
  const rungCount = 28;
  const rungGap = 2.3;
  for (let i = 0; i < rungCount; i += 1) {
    const rung = new THREE.Mesh(new THREE.BoxGeometry(railWidth * 2 - 0.3, 0.05, 0.14), rungMat);
    rung.position.set(0, -1.55, (camZ + 8) - i * rungGap);
    corridor.add(rung);
    rungs.push(rung);
  }

  /* --- Les portails (un par page) --- */
  const hitTargets = [];
  const gateways = data.map((item, index) => {
    const group = new THREE.Group();
    const color = new THREE.Color(item.color);
    const accent = new THREE.Color(item.accent);

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.5, 0.22, 56),
      new THREE.MeshStandardMaterial({ color: 0x0b121d, emissive: accent.clone(), emissiveIntensity: 0.6, roughness: 0.5, metalness: 0.62 })
    );
    pedestal.position.y = -1.48;
    group.add(pedestal);

    // Arche du portail.
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.75, 0.075, 20, 90),
      neonMaterial(color.getHex(), 2.6)
    );
    ring.position.y = 1.25;
    group.add(ring);

    const ringInner = new THREE.Mesh(
      new THREE.TorusGeometry(1.28, 0.03, 14, 80),
      new THREE.MeshBasicMaterial({ color: accent.clone(), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    ringInner.position.y = 1.25;
    group.add(ringInner);

    // Le « seuil » lumineux que l'on franchit.
    const doorway = new THREE.Mesh(
      new THREE.CircleGeometry(1.68, 56),
      new THREE.MeshBasicMaterial({ color: color.clone(), transparent: true, opacity: 0.16, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    doorway.position.y = 1.25;
    group.add(doorway);

    const floorHalo = new THREE.Mesh(
      new THREE.TorusGeometry(2.05, 0.02, 12, 80),
      new THREE.MeshBasicMaterial({ color: accent.clone(), transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    floorHalo.position.y = -1.4;
    floorHalo.rotation.x = Math.PI / 2;
    group.add(floorHalo);

    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: createLabelTexture(item, index), transparent: true, depthWrite: false }));
    label.scale.set(4, 1.83, 1);
    label.position.set(0, 3.2, 0);
    group.add(label);

    // Onde au sol au passage du focus.
    const burst = new THREE.Mesh(
      new THREE.RingGeometry(0.86, 1, 64),
      new THREE.MeshBasicMaterial({ color: accent.clone(), transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    burst.rotation.x = -Math.PI / 2;
    burst.position.y = -1.44;
    group.add(burst);

    const hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(4, 5, 2.2),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hitBox.position.y = 1.1;
    hitBox.userData.index = index;
    group.add(hitBox);
    hitTargets.push(hitBox);

    group.position.set(0, 0, -index * spacing);
    world.add(group);

    return { group, ring, ringInner, doorway, floorHalo, label, burst, pedestal, color, accent, burstT: 1 };
  });

  /* --- Champ d'étoiles filantes --- */
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 240;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    starPositions[i * 3] = -railWidth * 1.7 + Math.random() * railWidth * 3.4;
    starPositions[i * 3 + 1] = -1.4 + Math.random() * 6.4;
    starPositions[i * 3 + 2] = (camZ + 6) - Math.random() * corridorDepth;
  }
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({
    color: themeAccent.clone(),
    size: 0.06,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const stars = new THREE.Points(starGeometry, starMaterial);
  world.add(stars);

  /* --- Focus / déplacement / plongée --- */
  function focusPortal(index, withBurst) {
    const clamped = Math.max(0, Math.min(total - 1, index));
    if (withBurst && clamped !== activeIndex) {
      gateways[clamped].burstT = 0;
      pulse = 1;
    }
    activeIndex = clamped;
    setActiveDom(activeIndex);
    persistFocus();
    // Garde la pastille active visible si le rail déborde (écran étroit).
    portals[activeIndex].scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    targetColor.set(data[activeIndex].color);
    targetAccent.set(data[activeIndex].accent);
    targetFog.set(data[activeIndex].color).multiplyScalar(0.16);
    targetZ = -activeIndex * spacing + camStandoff;
  }

  function step(direction) {
    if (diving) return;
    focusPortal(activeIndex + direction, true);
  }

  function dive() {
    if (diving) return;
    diving = true;
    pulse = 1;
    persistFocus();
    const href = data[activeIndex].href;
    window.setTimeout(() => navigateTo(href), 520);
  }

  /* --- Contrôles --- */
  prevButton?.addEventListener("click", () => step(-1));
  nextButton?.addEventListener("click", () => step(1));

  // Molette : on accumule puis on avance d'un portail (anti rebond).
  let wheelAccum = 0;
  let wheelCooldown = 0;
  experience.addEventListener("wheel", (event) => {
    event.preventDefault();
    if (diving) return;
    const now = performance.now();
    wheelAccum += event.deltaY;
    if (now < wheelCooldown) return;
    if (Math.abs(wheelAccum) > 60) {
      step(wheelAccum > 0 ? 1 : -1);
      wheelAccum = 0;
      wheelCooldown = now + 430;
    }
  }, { passive: false });

  // Glissé tactile (tablettes / écrans tactiles desktop).
  let touchStartX = 0;
  let touchStartY = 0;
  let touchActive = false;
  experience.addEventListener("touchstart", (event) => {
    if (diving) return;
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchActive = true;
  }, { passive: true });
  experience.addEventListener("touchend", (event) => {
    if (!touchActive || diving) return;
    touchActive = false;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    if (Math.abs(dx) < 42 && Math.abs(dy) < 42) return;
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const direction = horizontal ? (dx < 0 ? 1 : -1) : (dy < 0 ? 1 : -1);
    step(direction);
  }, { passive: true });

  // Clavier.
  window.addEventListener("keydown", (event) => {
    if (diving) return;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); step(1); }
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); step(-1); }
    else if (event.key === "Enter") {
      if (document.activeElement && document.activeElement.closest("[data-hub-portal]")) return;
      event.preventDefault();
      dive();
    }
  });

  // Liens du rail : 1er clic → on s'approche, 2e clic (portail actif) → on entre.
  portals.forEach((portal, idx) => {
    portal.addEventListener("click", (event) => {
      event.preventDefault();
      if (idx !== activeIndex) focusPortal(idx, true);
      else dive();
    });
  });

  // Pointeur sur le canvas : léger parallaxe + clic sur un portail 3D.
  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointerEase.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerEase.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  }, { passive: true });

  canvas.addEventListener("click", (event) => {
    if (diving) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(hitTargets, false)[0];
    if (!hit) return;
    const index = hit.object.userData.index;
    if (index === activeIndex) dive();
    else focusPortal(index, true);
  });

  /* --- Dimensionnement --- */
  function resize() {
    const rect = experience.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  /* --- Entrée : plongée d'arrivée (ou recul si l'on revient) --- */
  setActiveDom(activeIndex);
  if (returning) {
    camZ = targetZ - 5.5;
    camY = 1.2;
  } else {
    camZ = targetZ + 20;
    camY = 3.8;
    lookTarget.set(0, 1, -spacing);
  }

  function animate() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;
    const sway = reducedMotion ? 0 : 1;

    // Cible de caméra : pendant la plongée on franchit le seuil du portail actif.
    const effectiveTargetZ = diving ? (-activeIndex * spacing + 0.6) : targetZ;
    const followEase = diving ? 0.12 : 0.06;
    camZ += (effectiveTargetZ - camZ) * followEase;
    camX += ((pointerEase.x * 0.7) * sway - camX) * 0.06;
    camY += ((1.2 - pointerEase.y * 0.3 * sway) - camY) * 0.06;
    camera.position.set(camX, camY, camZ);

    lookTarget.x += ((pointerEase.x * 0.6) * sway - lookTarget.x) * 0.06;
    lookTarget.y += (0.95 - lookTarget.y) * 0.06;
    lookTarget.z += ((-activeIndex * spacing) - lookTarget.z) * 0.06;
    camera.lookAt(lookTarget);

    // L'univers respire la couleur du portail actif.
    themeColor.lerp(targetColor, 0.05);
    themeAccent.lerp(targetAccent, 0.05);
    fogColor.lerp(targetFog, 0.05);
    scene.fog.color.copy(fogColor);

    railMatColor.emissive.copy(themeColor);
    railMatAccent.emissive.copy(themeAccent);
    rungMat.emissive.copy(themeAccent);
    pillarMat.emissive.copy(themeColor);
    floorMat.emissive.copy(themeColor);
    starMaterial.color.copy(themeAccent);
    fillLight.color.copy(themeAccent);

    pulse *= 0.92;
    const breathe = reducedMotion ? 0 : (Math.sin(time * 1.1) * 0.5 + 0.5);
    moodLight.color.copy(themeColor);
    moodLight.intensity = 2.1 + breathe * 0.7 + pulse * 4 + (diving ? 6 : 0);

    if (!reducedMotion) {
      rungs.forEach((rung) => {
        rung.position.z += 4.4 * dt;
        if (rung.position.z > camZ + 8) rung.position.z -= rungCount * rungGap;
      });
      const starPos = starGeometry.attributes.position.array;
      for (let i = 0; i < starCount; i += 1) {
        starPos[i * 3 + 2] += (5 + (i % 5)) * dt;
        if (starPos[i * 3 + 2] > camZ + 6) starPos[i * 3 + 2] -= corridorDepth;
      }
      starGeometry.attributes.position.needsUpdate = true;
    }

    gateways.forEach((gate, index) => {
      const isActive = index === activeIndex;
      const targetScale = isActive ? 1.12 : 0.92;
      const floatY = reducedMotion ? 0 : Math.sin(time * 0.8 + index) * 0.06;

      gate.group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.09);
      gate.group.position.y += (floatY - gate.group.position.y) * 0.08;

      if (!reducedMotion) {
        gate.ring.rotation.z += isActive ? 0.01 : 0.004;
        gate.ringInner.rotation.z -= isActive ? 0.02 : 0.008;
      }

      const glow = isActive ? (diving ? 0.5 : 0.32) : 0.16;
      gate.doorway.material.opacity += (glow - gate.doorway.material.opacity) * 0.12;
      gate.floorHalo.material.opacity = isActive ? 0.7 : 0.3;
      gate.ringInner.material.opacity = isActive ? 0.85 : 0.45;
      gate.label.material.opacity = isActive ? 1 : 0.62;
      gate.pedestal.material.emissiveIntensity = isActive ? 1 : 0.5;

      if (gate.burstT < 1) {
        gate.burstT = Math.min(1, gate.burstT + dt * 1.5);
        const eased = 1 - Math.pow(1 - gate.burstT, 3);
        gate.burst.scale.setScalar(0.6 + eased * 5.2);
        gate.burst.material.opacity = (1 - gate.burstT) * 0.85;
      }
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  themeColor.copy(targetColor);
  themeAccent.copy(targetAccent);
  fogColor.copy(targetFog);
  experience.classList.add("is-loaded");
  animate();
})();
