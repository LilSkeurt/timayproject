/* ==========================================================================
   futuristic-fx.js — Couche d'émotion futuriste pour tout le site :
   - écran d'initialisation immersif (une fois par session)
   - cadres "cockpit" (coins HUD) + halo réactif sur les cartes
   - titres holographiques
   - projecteur qui suit le curseur sur les cartes premium
   ========================================================================== */

(function () {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  /* ---------------------------------------------------------------------
   * 1. Écran d'initialisation — "on entre dans l'expérience"
   * ------------------------------------------------------------------- */
  function bootSequence() {
    if (sessionStorage.getItem("fx_boot_seen")) return;
    sessionStorage.setItem("fx_boot_seen", "1");

    const boot = document.createElement("div");
    boot.className = "fx-boot";
    boot.innerHTML = `
      <div class="fx-boot-core">
        <span class="fx-boot-emblem">
          <span class="fx-boot-ring"></span>
          <span class="fx-boot-mark">AV</span>
        </span>
        <span class="fx-boot-line"></span>
        <p class="fx-boot-text">Initialisation de l'expérience</p>
      </div>`;
    document.body.appendChild(boot);
    document.documentElement.classList.add("fx-booting");

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      boot.classList.add("is-done");
      document.documentElement.classList.remove("fx-booting");
      setTimeout(() => boot.remove(), 900);
    };

    boot.addEventListener("click", close);

    if (reducedMotion) {
      close();
    } else {
      requestAnimationFrame(() => boot.classList.add("is-active"));
      setTimeout(close, 1850);
    }
  }

  /* ---------------------------------------------------------------------
   * 2. Cadres cockpit (coins HUD) sur les cartes clés
   * ------------------------------------------------------------------- */
  function addBrackets() {
    const targets = document.querySelectorAll(
      "[data-service-card], [data-offer-card], .example-card, .service-detail, .price-highlight"
    );

    targets.forEach((el) => {
      if (el.querySelector(":scope > .fx-corners")) return;
      const corners = document.createElement("span");
      corners.className = "fx-corners";
      corners.setAttribute("aria-hidden", "true");
      corners.innerHTML = "<i></i><i></i><i></i><i></i>";
      el.appendChild(corners);
    });
  }

  /* ---------------------------------------------------------------------
   * 3. Titres holographiques
   * ------------------------------------------------------------------- */
  function holographicHeadings() {
    document
      .querySelectorAll(".hero-title-animated, .intro-heading h2, #gallery-title, #offers-title, #quote-title")
      .forEach((el) => el.classList.add("fx-holo"));
  }

  /* ---------------------------------------------------------------------
   * 4. Projecteur réactif qui suit le curseur (émotion / matière)
   * ------------------------------------------------------------------- */
  function reactiveSpotlight() {
    if (coarsePointer) return;

    const cards = document.querySelectorAll(
      ".offer-card, [data-service-card], .example-card, .service-detail"
    );

    cards.forEach((card) => {
      card.classList.add("fx-spotlight");
      if (!card.querySelector(":scope > .fx-glow")) {
        const glow = document.createElement("span");
        glow.className = "fx-glow";
        glow.setAttribute("aria-hidden", "true");
        card.appendChild(glow);
      }
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--fx-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
        card.style.setProperty("--fx-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
        card.style.setProperty("--fx-glow", "1");
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--fx-glow", "0");
      });
    });
  }

  /* ---------------------------------------------------------------------
   * 5. Lueur émotionnelle quand une inspiration est ajoutée
   * ------------------------------------------------------------------- */
  function emotionalPulse() {
    window.addEventListener("inspirations-changed", () => {
      if (reducedMotion) return;
      document.documentElement.classList.remove("fx-pulse");
      // reflow pour relancer l'animation
      void document.documentElement.offsetWidth;
      document.documentElement.classList.add("fx-pulse");
    });
  }

  function init() {
    // L'intro est désormais portée par le portail (index.html) et les
    // transitions warp entre pages — on ne rejoue plus l'écran d'init ici.
    void bootSequence;
    addBrackets();
    holographicHeadings();
    reactiveSpotlight();
    emotionalPulse();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
