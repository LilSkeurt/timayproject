/* ==========================================================================
   animations.js — Scroll reveals, count-up, animated gradient title,
   particle cursor trail, nav scroll-shrink, offer cards parallax glow
   ========================================================================== */

(function () {
  'use strict';

  /* -------------------------------------------------------------------------
   * 1. INTERSECTION OBSERVER — Scroll Reveals
   * ---------------------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal-element');
  if (revealEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => revealObserver.observe(el));
  }

  /* -------------------------------------------------------------------------
   * 2. HERO TITLE — Animated Gradient
   * ---------------------------------------------------------------------- */
  const heroTitle = document.querySelector('.hero-title-animated');
  if (heroTitle) {
    heroTitle.classList.add('is-revealed');
  }

  /* -------------------------------------------------------------------------
   * 3. COUNT-UP — Stats in hero-proof
   * ---------------------------------------------------------------------- */
  function animateCountUp(el) {
    const target = parseInt(el.dataset.countUp, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(eased * target);
      el.textContent = value + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    el.textContent = '0' + suffix;
    requestAnimationFrame(tick);
  }

  const countEls = document.querySelectorAll('[data-count-up]');
  if (countEls.length) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCountUp(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    countEls.forEach(el => countObserver.observe(el));
  }

  /* -------------------------------------------------------------------------
   * 4. HEADER — Shrink on scroll
   * ---------------------------------------------------------------------- */
  const header = document.querySelector('.site-header');
  if (header) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 60) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
      // Hide header when scrolling down fast, show on scroll up
      if (y > lastScroll + 8 && y > 200) {
        header.classList.add('is-hidden-scroll');
      } else if (y < lastScroll - 4) {
        header.classList.remove('is-hidden-scroll');
      }
      lastScroll = y;
    }, { passive: true });
  }

  /* -------------------------------------------------------------------------
   * 5. OFFER CARDS — Spotlight glow on hover
   * ---------------------------------------------------------------------- */
  document.querySelectorAll('.offer-card').forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--card-mouse-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--card-mouse-y', `${e.clientY - rect.top}px`);
    });
  });

  /* -------------------------------------------------------------------------
   * 6. SECTION KICKERS — Animated underline reveal
   * ---------------------------------------------------------------------- */
  document.querySelectorAll('.section-kicker, .eyebrow').forEach(el => {
    el.classList.add('kicker-animate');
  });

  /* -------------------------------------------------------------------------
   * 7. CUSTOM INTERACTIVE CURSOR (desktop only)
   * ---------------------------------------------------------------------- */
  if (!window.matchMedia('(pointer: coarse)').matches) {
    const cursorDot = document.createElement('div');
    cursorDot.className = 'custom-cursor-dot';
    document.body.appendChild(cursorDot);

    const cursorRing = document.createElement('div');
    cursorRing.className = 'custom-cursor-ring';
    document.body.appendChild(cursorRing);

    let mouseX = 0, mouseY = 0;
    let dotX = 0, dotY = 0;
    let ringX = 0, ringY = 0;
    let isCursorVisible = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isCursorVisible) {
        cursorDot.style.opacity = '1';
        cursorRing.style.opacity = '1';
        isCursorVisible = true;
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      cursorDot.style.opacity = '0';
      cursorRing.style.opacity = '0';
      isCursorVisible = false;
    });

    function cursorLoop() {
      dotX += (mouseX - dotX) * 0.28;
      dotY += (mouseY - dotY) * 0.28;
      cursorDot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0)`;

      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;

      requestAnimationFrame(cursorLoop);
    }
    requestAnimationFrame(cursorLoop);

    const hoverElements = '.button, .nav-action, .filter-button, .offer-action, .form-submit, a, button, input, select, textarea, [role="button"], .service-card, .example-card, .offer-card';
    
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverElements)) {
        cursorRing.classList.add('is-hovered');
        cursorDot.classList.add('is-hovered');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (!e.relatedTarget || !e.relatedTarget.closest(hoverElements)) {
        cursorRing.classList.remove('is-hovered');
        cursorDot.classList.remove('is-hovered');
      }
    });

    // Parallax background blobs
    const blobWrap = document.querySelector('.bg-blob-wrap');
    let blobX = 0, blobY = 0;
    
    function blobParallaxLoop() {
      if (blobWrap) {
        const targetX = (mouseX - window.innerWidth / 2) * -0.04;
        const targetY = (mouseY - window.innerHeight / 2) * -0.04;
        
        blobX += (targetX - blobX) * 0.05;
        blobY += (targetY - blobY) * 0.05;
        
        blobWrap.style.transform = `translate3d(${blobX}px, ${blobY}px, 0)`;
      }
      requestAnimationFrame(blobParallaxLoop);
    }
    requestAnimationFrame(blobParallaxLoop);

    // Magnetic buttons
    const magneticEls = document.querySelectorAll('.button, .nav-action, .filter-button, .offer-action, .form-submit');
    magneticEls.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        const force = 0.28;
        el.style.transform = `translate3d(${x * force}px, ${y * force}px, 0)`;
        el.style.rotate = `${(x * 0.04).toFixed(2)}deg`;
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        el.style.rotate = '';
        el.style.transition = 'transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275), rotate 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      });
      
      el.addEventListener('mouseenter', () => {
        el.style.transition = 'transform 0.1s ease-out, rotate 0.1s ease-out';
      });
    });
  }

  /* -------------------------------------------------------------------------
   * 8. SECTION TRANSITIONS — Colour-cycling section dividers
   * ---------------------------------------------------------------------- */
  document.querySelectorAll('section').forEach((section, i) => {
    section.style.setProperty('--section-index', i);
  });

  /* -------------------------------------------------------------------------
   * 9. SCROLL PROGRESS BAR
   * ---------------------------------------------------------------------- */
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress-bar';
  document.body.appendChild(progressBar);

  window.addEventListener('scroll', () => {
    const winScroll = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    progressBar.style.width = `${scrolled}%`;
  }, { passive: true });

})();
