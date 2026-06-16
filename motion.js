/* ==========================================================================
   motion.js — Esprit "high-tech" sur tout le site :
   - défilement fluide à inertie (Lenis, optionnel)
   - révélations au scroll (GSAP ScrollTrigger) via [data-reveal] / [data-reveal-group]
   - marquage du lien de navigation actif
   Tout est défensif : si une lib manque, le contenu reste visible.
   ========================================================================== */

(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Lien de navigation actif --- */
  const current = (window.location.pathname.split("/").pop() || "accueil.html").toLowerCase();
  document.querySelectorAll(".main-nav a[href], .footer-nav a[href]").forEach((link) => {
    const target = (link.getAttribute("href") || "").toLowerCase();
    if (target === current || (current === "" && target === "accueil.html")) {
      link.classList.add("is-current");
      link.setAttribute("aria-current", "page");
    }
  });

  /* --- Défilement fluide (Lenis) --- */
  let lenis = null;
  if (window.Lenis && !reduceMotion) {
    try {
      lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.6 });
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      document.documentElement.classList.add("has-lenis");
    } catch (error) {
      lenis = null;
    }
  }

  /* --- Révélations au scroll (GSAP ScrollTrigger) --- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
    }

    if (reduceMotion) {
      gsap.set("[data-reveal], [data-reveal-group] > *", { autoAlpha: 1, y: 0 });
    } else {
      gsap.utils.toArray("[data-reveal]").forEach((el) => {
        const delay = parseFloat(el.dataset.reveal) || 0;
        gsap.fromTo(
          el,
          { y: 46, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.95,
            delay,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 86%" }
          }
        );
      });

      gsap.utils.toArray("[data-reveal-group]").forEach((group) => {
        gsap.fromTo(
          group.children,
          { y: 50, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.85,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: { trigger: group, start: "top 84%" }
          }
        );
      });

      // Parallaxe douce sur les éléments marqués.
      gsap.utils.toArray("[data-parallax]").forEach((el) => {
        const strength = parseFloat(el.dataset.parallax) || 60;
        gsap.to(el, {
          yPercent: -strength * 0.1,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true }
        });
      });
    }

    window.addEventListener("load", () => ScrollTrigger.refresh());

    // Filet de sécurité : si une révélation ne se déclenche pas, on rend
    // le contenu visible après 2 s (jamais de bloc invisible).
    window.setTimeout(() => {
      document.querySelectorAll("[data-reveal], [data-reveal-group] > *").forEach((el) => {
        if (parseFloat(window.getComputedStyle(el).opacity) < 0.05) {
          gsap.set(el, { autoAlpha: 1, y: 0 });
        }
      });
    }, 2000);
  }
})();
