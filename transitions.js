/* ==========================================================================
   transitions.js — Transitions de page "warp hyperspace".
   - L'ARRIVÉE est gérée en CSS (.px joue px-out au chargement) : robuste,
     aucun flash même si ce script échoue.
   - Le DÉPART est géré ici : au clic sur un lien interne, on rejoue le warp
     puis on navigue. Expose window.AtelierTransition.warpTo(url).
   ========================================================================== */

(function () {
  const px = document.querySelector("[data-px]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const WARP_MS = 520;
  let leaving = false;

  function warpTo(url) {
    if (!url) return;
    if (leaving) return;
    leaving = true;

    if (!px || reduceMotion) {
      window.location.href = url;
      return;
    }

    px.classList.remove("is-arriving");
    px.classList.add("is-warping");
    document.documentElement.classList.add("is-leaving");
    window.setTimeout(() => { window.location.href = url; }, WARP_MS);
  }

  window.AtelierTransition = { warpTo };

  function isInternalNavigable(anchor) {
    if (!anchor) return false;
    const href = anchor.getAttribute("href");
    if (!href) return false;
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
    if (anchor.target === "_blank" || anchor.hasAttribute("download")) return false;
    if (anchor.dataset.noWarp !== undefined) return false;

    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return false;
      // même page (juste une ancre) → on laisse le navigateur gérer
      if (url.pathname === window.location.pathname && url.hash) return false;
      return true;
    } catch (error) {
      return false;
    }
  }

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const anchor = event.target.closest("a[href]");
    if (!isInternalNavigable(anchor)) return;

    event.preventDefault();
    warpTo(new URL(anchor.getAttribute("href"), window.location.href).href);
  });

  // Si l'utilisateur revient via l'historique (bfcache), on réaffiche proprement.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted && px) {
      leaving = false;
      px.classList.remove("is-warping");
      document.documentElement.classList.remove("is-leaving");
    }
  });
})();
