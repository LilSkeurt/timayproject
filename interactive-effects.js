(function () {
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const interactiveSelector = [
    "a",
    "button",
    "[role='button']",
    "[data-service-orb]",
    "[data-service-card]",
    "[data-example-card]",
    "[data-offer-card]",
    ".filter-button"
  ].join(",");
  const cursorHoverSelector = [
    "button",
    "[role='button']",
    "[data-service-orb]",
    "[data-service-card]",
    "[data-example-card]",
    "[data-offer-card]",
    ".filter-button"
  ].join(",");

  let audioContext = null;
  let masterGain = null;
  let ambientGain = null;
  let ambientStarted = false;
  let soundEnabled = true;
  let lastHoverSoundAt = 0;
  let soundToggle = null;
  let activeInteractiveTarget = null;

  function getAudioContext() {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return null;

    if (!audioContext) {
      audioContext = new AudioContextConstructor();
      masterGain = audioContext.createGain();
      masterGain.gain.value = 0.68;
      masterGain.connect(audioContext.destination);
    }

    return audioContext;
  }

  function updateSoundToggle() {
    if (!soundToggle) return;
    soundToggle.classList.toggle("is-active", soundEnabled && ambientStarted);
    soundToggle.classList.toggle("is-muted", !soundEnabled);
    soundToggle.setAttribute("aria-label", soundEnabled && ambientStarted ? "Couper le son" : "Activer le son");
    soundToggle.dataset.label = soundEnabled && ambientStarted ? "Son activé" : "Activer le son";
  }

  async function unlockAudio() {
    if (!soundEnabled) return null;

    const context = getAudioContext();
    if (!context) return null;

    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch (error) {
        return null;
      }
    }

    if (context.state === "running") {
      startAmbientSound();
      updateSoundToggle();
    }

    return context;
  }

  function startAmbientSound() {
    const context = getAudioContext();
    if (!context || ambientStarted || !masterGain) return;

    ambientStarted = true;
    ambientGain = context.createGain();
    ambientGain.gain.setValueAtTime(0.0001, context.currentTime);
    ambientGain.gain.exponentialRampToValueAtTime(0.014, context.currentTime + 1.8);

    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 860;
    filter.Q.value = 0.55;

    const shimmerFilter = context.createBiquadFilter();
    shimmerFilter.type = "highpass";
    shimmerFilter.frequency.value = 1450;
    shimmerFilter.Q.value = 0.42;

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -34;
    compressor.knee.value = 18;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.02;
    compressor.release.value = 0.38;

    [110, 164.81, 246.94, 329.63].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const voiceGain = context.createGain();
      oscillator.type = index % 2 ? "triangle" : "sine";
      oscillator.frequency.value = frequency;
      voiceGain.gain.value = index === 0 ? 0.2 : 0.12;
      oscillator.connect(voiceGain);
      voiceGain.connect(filter);
      oscillator.start();
    });

    [987.77, 1318.51].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const voiceGain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      voiceGain.gain.value = index === 0 ? 0.025 : 0.018;
      oscillator.connect(voiceGain);
      voiceGain.connect(shimmerFilter);
      oscillator.start();
    });

    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.075;
    lfoGain.gain.value = 0.004;
    lfo.connect(lfoGain);
    lfoGain.connect(ambientGain.gain);
    lfo.start();

    filter.connect(ambientGain);
    shimmerFilter.connect(ambientGain);
    ambientGain.connect(compressor);
    compressor.connect(masterGain);
  }

  function setSoundEnabled(enabled) {
    soundEnabled = enabled;
    if (masterGain && audioContext) {
      const target = enabled ? 0.68 : 0.0001;
      masterGain.gain.cancelScheduledValues(audioContext.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(target, audioContext.currentTime + 0.28);
    }

    if (enabled) {
      unlockAudio();
    }

    updateSoundToggle();
  }

  function playHoverSound() {
    const context = getAudioContext();
    const now = Date.now();

    if (!soundEnabled || !context || context.state !== "running" || now - lastHoverSoundAt < 110 || !masterGain) return;
    lastHoverSoundAt = now;

    const startTime = context.currentTime;
    const oscillator = context.createOscillator();
    const secondOscillator = context.createOscillator();
    const gain = context.createGain();
    const secondGain = context.createGain();
    const filter = context.createBiquadFilter();

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(880, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(1320, startTime + 0.032);

    secondOscillator.type = "sine";
    secondOscillator.frequency.setValueAtTime(1760, startTime);
    secondOscillator.frequency.exponentialRampToValueAtTime(980, startTime + 0.075);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1900, startTime);
    filter.frequency.exponentialRampToValueAtTime(1250, startTime + 0.095);
    filter.Q.value = 1.6;

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.018, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.105);

    secondGain.gain.setValueAtTime(0.0001, startTime);
    secondGain.gain.exponentialRampToValueAtTime(0.012, startTime + 0.018);
    secondGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.085);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    secondOscillator.connect(secondGain);
    secondGain.connect(masterGain);
    oscillator.start(startTime);
    secondOscillator.start(startTime);
    oscillator.stop(startTime + 0.12);
    secondOscillator.stop(startTime + 0.1);
  }

  function setupSoundControl() {
    soundToggle = document.createElement("button");
    soundToggle.className = "sound-toggle";
    soundToggle.type = "button";
    soundToggle.setAttribute("aria-label", "Activer le son");
    soundToggle.dataset.label = "Activer le son";
    document.body.appendChild(soundToggle);

    soundToggle.addEventListener("click", () => {
      if (!ambientStarted) {
        setSoundEnabled(true);
        unlockAudio().then(playHoverSound);
        return;
      }

      setSoundEnabled(!soundEnabled);
      if (soundEnabled) playHoverSound();
    });

    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    const context = getAudioContext();
    if (context?.state === "running") {
      startAmbientSound();
    }

    updateSoundToggle();
  }

  function setupHoverSounds() {
    if (!finePointer) return;

    document.querySelectorAll(interactiveSelector).forEach((element) => {
      element.addEventListener("pointerenter", () => {
        unlockAudio().then(playHoverSound);
      });
    });
  }

  function setupCursor() {
    setupSoundControl();

    if (!finePointer || reducedMotion) {
      setupHoverSounds();
      return;
    }

    const cursor = document.createElement("div");
    const dot = document.createElement("div");
    cursor.className = "custom-cursor";
    dot.className = "custom-cursor-dot";
    document.body.append(cursor, dot);
    document.documentElement.classList.add("custom-cursor-enabled");

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let cursorX = pointerX;
    let cursorY = pointerY;

    function moveCursor() {
      cursorX += (pointerX - cursorX) * 0.2;
      cursorY += (pointerY - cursorY) * 0.2;

      cursor.style.left = `${cursorX}px`;
      cursor.style.top = `${cursorY}px`;
      dot.style.left = `${pointerX}px`;
      dot.style.top = `${pointerY}px`;

      window.requestAnimationFrame(moveCursor);
    }

    function showCursor() {
      cursor.classList.add("is-visible");
      dot.classList.add("is-visible");
    }

    function hideCursor() {
      cursor.classList.remove("is-visible", "is-hover", "is-pressed");
      dot.classList.remove("is-visible", "is-hover");
      if (activeInteractiveTarget) {
        activeInteractiveTarget.classList.remove("is-interactive-hover");
        activeInteractiveTarget = null;
      }
    }

    function updateHoverState(x, y) {
      const element = document.elementFromPoint(x, y);
      const target = element?.closest?.(cursorHoverSelector);
      cursor.classList.toggle("is-hover", Boolean(target));
      dot.classList.toggle("is-hover", Boolean(target));

      if (activeInteractiveTarget && activeInteractiveTarget !== target) {
        activeInteractiveTarget.classList.remove("is-interactive-hover");
      }

      if (target) {
        target.classList.add("is-interactive-hover");
      }

      activeInteractiveTarget = target || null;
    }

    window.addEventListener("pointermove", (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      showCursor();
      updateHoverState(pointerX, pointerY);
    }, { passive: true });

    window.addEventListener("pointerdown", () => {
      cursor.classList.add("is-pressed");
    }, { passive: true });

    window.addEventListener("pointerup", () => {
      cursor.classList.remove("is-pressed");
    }, { passive: true });

    document.addEventListener("mouseleave", hideCursor);
    moveCursor();
    setupHoverSounds();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupCursor);
  } else {
    setupCursor();
  }
})();
