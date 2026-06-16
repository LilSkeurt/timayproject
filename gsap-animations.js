(function () {
  const header = document.querySelector(".site-header");
  const revealElements = document.querySelectorAll(".reveal-element, .quote-form");
  const countElements = document.querySelectorAll("[data-count-up]");

  const progressBar = document.createElement("div");
  progressBar.className = "scroll-progress-bar";
  document.body.appendChild(progressBar);

  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? (window.scrollY / max) * 100 : 0;
    progressBar.style.width = `${progress}%`;
    header?.classList.toggle("is-scrolled", window.scrollY > 48);
  }

  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  function countUp(element) {
    const target = Number.parseInt(element.dataset.countUp, 10);
    const suffix = element.dataset.suffix || "";

    if (!Number.isFinite(target)) return;

    const state = { value: 0 };

    if (window.gsap) {
      gsap.to(state, {
        value: target,
        duration: 1.35,
        ease: "power3.out",
        onUpdate: () => {
          element.textContent = `${Math.round(state.value)}${suffix}`;
        }
      });
    } else {
      element.textContent = `${target}${suffix}`;
    }
  }

  if (window.gsap) {
    gsap.set(revealElements, { y: 28, opacity: 0 });
    gsap.set(".hero-title-animated", { y: 28, opacity: 0 });
    gsap.set(".site-header", { y: -22, opacity: 0 });

    gsap.to(".site-header", {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power3.out"
    });

    gsap.to(".hero .reveal-element, .hero-title-animated", {
      y: 0,
      opacity: 1,
      duration: 0.85,
      stagger: 0.08,
      ease: "power3.out",
      delay: 0.15
    });
  } else {
    revealElements.forEach((element) => element.classList.add("is-revealed"));
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("is-revealed");

      if (window.gsap) {
        gsap.to(entry.target, {
          y: 0,
          opacity: 1,
          duration: 0.75,
          ease: "power3.out"
        });
      }

      if (entry.target.matches("[data-count-up]")) {
        countUp(entry.target);
      }

      observer.unobserve(entry.target);
    });
  }, { threshold: 0.16 });

  revealElements.forEach((element) => observer.observe(element));
  countElements.forEach((element) => observer.observe(element));

  document.querySelectorAll(".button, .offer-action, .filter-button").forEach((button) => {
    button.addEventListener("pointerenter", () => {
      if (window.gsap) {
        gsap.to(button, { y: -3, duration: 0.22, ease: "power2.out" });
      }
    });

    button.addEventListener("pointerleave", () => {
      if (window.gsap) {
        gsap.to(button, { y: 0, duration: 0.24, ease: "power2.out" });
      }
    });
  });
})();
