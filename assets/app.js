(() => {
  const doc = document;
  const body = doc.body;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

  function initPreloader() {
    const preloader = doc.querySelector("[data-preloader]");
    const bar = doc.querySelector("[data-loader-bar]");
    const value = doc.querySelector("[data-loader-value]");
    const pf = doc.querySelector("pf-scene");
    if (!preloader || !bar || !value) return;

    let fontsReady = false;
    let particlesReady = false;
    let visualPct = 0;
    let finished = false;
    const deepLinked = Boolean(window.location.hash);

    const setParticlesReady = () => {
      particlesReady = true;
    };

    doc.addEventListener("pf-ready", setParticlesReady, { once: true });

    if (doc.fonts && doc.fonts.ready) {
      doc.fonts.ready.then(() => {
        fontsReady = true;
      }).catch(() => {
        fontsReady = true;
      });
    } else {
      fontsReady = true;
    }

    const fallback = window.setTimeout(() => {
      fontsReady = true;
      particlesReady = true;
    }, deepLinked ? 900 : 2200);

    const hardFinish = window.setTimeout(() => {
      visualPct = 100;
      bar.style.width = "100%";
      value.textContent = "100";
      finish({ immediate: true });
    }, deepLinked ? 1800 : 4200);

    const finish = (options = {}) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(fallback);
      window.clearTimeout(hardFinish);
      if (pf && typeof pf.startIntro === "function") pf.startIntro();
      body.classList.toggle("skip-intro", Boolean(options.immediate));
      body.classList.add("is-ready");
      if (options.immediate) {
        preloader.remove();
        return;
      }
      preloader.classList.add("is-hidden");
      window.setTimeout(() => preloader.remove(), 980);
    };

    const tick = () => {
      const target = 12 + (fontsReady ? 38 : 0) + (particlesReady ? 50 : 0);
      visualPct = Math.min(100, visualPct + Math.max(1, (target - visualPct) * 0.14));
      const rounded = Math.min(100, Math.round(visualPct));
      bar.style.width = `${rounded}%`;
      value.textContent = String(rounded);
      if (rounded >= 100) {
        finish();
        return;
      }
      window.requestAnimationFrame(tick);
    };

    tick();
  }

  function initMenu() {
    const menu = doc.querySelector("[data-menu]");
    const open = doc.querySelector("[data-menu-open]");
    const close = doc.querySelector("[data-menu-close]");
    const links = doc.querySelectorAll("[data-menu-link]");
    if (!menu || !open || !close) return;

    const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
    let previousFocus = null;

    const setOpen = (state) => {
      menu.classList.toggle("is-open", state);
      menu.setAttribute("aria-hidden", String(!state));
      open.setAttribute("aria-expanded", String(state));
      body.classList.toggle("menu-open", state);
      if (state) {
        previousFocus = doc.activeElement;
        window.setTimeout(() => close.focus(), 0);
      } else if (previousFocus && typeof previousFocus.focus === "function") {
        previousFocus.focus();
      }
    };

    open.addEventListener("click", () => setOpen(true));
    close.addEventListener("click", () => setOpen(false));
    links.forEach((link) => link.addEventListener("click", () => setOpen(false)));
    doc.addEventListener("keydown", (event) => {
      if (!menu.classList.contains("is-open")) return;
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...menu.querySelectorAll(focusableSelector)];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  function initCursor() {
    const dot = doc.querySelector("[data-cursor-dot]");
    const ring = doc.querySelector("[data-cursor-ring]");
    if (!dot || !ring || !finePointer || reduced) return;

    body.classList.add("has-custom-cursor");
    let cx = -100;
    let cy = -100;
    let rx = -100;
    let ry = -100;
    let active = false;

    window.addEventListener("mousemove", (event) => {
      cx = event.clientX;
      cy = event.clientY;
    }, { passive: true });

    window.addEventListener("pointerover", (event) => {
      active = Boolean(event.target.closest("a, button, input, textarea, .service-row"));
    }, { passive: true });

    const loop = () => {
      rx += (cx - rx) * 0.16;
      ry += (cy - ry) * 0.16;
      dot.style.transform = `translate(${cx}px, ${cy}px)`;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      const size = active ? 56 : 36;
      ring.style.width = `${size}px`;
      ring.style.height = `${size}px`;
      ring.style.margin = `${-size / 2}px 0 0 ${-size / 2}px`;
      ring.style.borderColor = active ? "#d8ff3d" : "rgba(242, 240, 234, 0.52)";
      window.requestAnimationFrame(loop);
    };

    loop();
  }

  function initReveal() {
    const items = doc.querySelectorAll(".reveal");
    if (!items.length) return;
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    items.forEach((item) => observer.observe(item));
  }

  function initLineReveal() {
    const lines = doc.querySelectorAll(".line-reveal > span");
    lines.forEach((line, index) => {
      line.style.setProperty("--line-delay", `${0.15 + index * 0.08}s`);
    });
  }

  function initScrollState() {
    const header = doc.querySelector("[data-header]");
    const route = doc.querySelector("[data-route]");
    const routeFill = doc.querySelector("[data-route-fill]");
    const routeSteps = route ? [...route.querySelectorAll(".route-step")] : [];
    const sections = [...doc.querySelectorAll("section[data-shape]")];
    const pf = doc.querySelector("pf-scene");
    let lastShape = -1;
    let lastSide = "";
    let sectionTops = [];

    const measure = () => {
      const scrollY = window.scrollY || doc.documentElement.scrollTop;
      sectionTops = sections.map((section) => ({
        shape: Number(section.dataset.shape),
        side: section.dataset.side || "left",
        top: section.getBoundingClientRect().top + scrollY,
      }));
    };

    const applyScene = (shape, side) => {
      if (!pf) return;
      if (shape !== lastShape && typeof pf.setShape === "function") {
        lastShape = shape;
        pf.setShape(shape);
      }
      if (side !== lastSide && typeof pf.setSide === "function") {
        lastSide = side;
        pf.setSide(side);
      }
    };

    let activeIndex = 0;

    const shapeForScroll = (scrollY, viewport) => {
      const pivot = scrollY + viewport * 0.45;
      let nextIndex = 0;

      sectionTops.forEach((entry, index) => {
        if (pivot >= entry.top) nextIndex = index;
      });

      const hysteresis = viewport * 0.14;
      if (nextIndex > activeIndex) {
        const boundary = sectionTops[nextIndex]?.top ?? 0;
        if (pivot < boundary + hysteresis) nextIndex = activeIndex;
      } else if (nextIndex < activeIndex) {
        const hold = sectionTops[activeIndex]?.top ?? 0;
        if (pivot > hold - hysteresis) nextIndex = activeIndex;
      }

      activeIndex = nextIndex;
      return sectionTops[activeIndex] || { shape: 0, side: "left" };
    };

    const update = () => {
      const scrollY = window.scrollY || doc.documentElement.scrollTop;
      const viewport = window.innerHeight || 1;

      if (header) header.classList.toggle("is-scrolled", scrollY > 40);

      if (sectionTops.length) {
        const { shape, side } = shapeForScroll(scrollY, viewport);
        applyScene(shape, side);
      }

      if (route && routeFill) {
        const rect = route.getBoundingClientRect();
        const progress = clamp((viewport * 0.72 - rect.top) / Math.max(1, rect.height));
        routeFill.style.height = `${Math.round(progress * 100)}%`;
        const done = Math.floor(progress * routeSteps.length + 0.5);
        routeSteps.forEach((step, index) => {
          step.classList.toggle("is-done", index < done);
        });
      }
    };

    const requestUpdate = () => window.requestAnimationFrame(update);

    measure();
    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", () => {
      measure();
      requestUpdate();
    });
    if ("ResizeObserver" in window) {
      const ro = new ResizeObserver(() => {
        measure();
        requestUpdate();
      });
      sections.forEach((section) => ro.observe(section));
    }
  }

  function initAnchorScroll() {
    doc.querySelectorAll("a[href^='#']").forEach((link) => {
      link.addEventListener("click", (event) => {
        const hash = link.getAttribute("href");
        if (!hash || hash === "#") return;
        const target = doc.querySelector(hash);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        if (history.pushState) history.pushState(null, "", hash);
      });
    });
  }

  function initForm() {
    const form = doc.querySelector("[data-form]");
    if (!form) return;

    const success = form.querySelector("[data-form-success]");
    const bodyEl = form.querySelector("[data-form-body]");
    const taskButtons = [...form.querySelectorAll("[data-task-type]")];
    const taskInput = form.querySelector("[data-task-input]");
    const honeypot = form.querySelector("input[name='website']");
    const submit = form.querySelector(".lead-form__submit");

    taskButtons.forEach((button) => {
      button.addEventListener("click", () => {
        taskButtons.forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        if (taskInput) taskInput.value = button.textContent.trim();
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (honeypot && honeypot.value.trim()) return;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (submit) submit.disabled = true;
      if (bodyEl) bodyEl.hidden = true;
      if (success) {
        success.hidden = false;
        success.focus();
      }
    });
  }

  initPreloader();
  initMenu();
  initCursor();
  initReveal();
  initLineReveal();
  initScrollState();
  initAnchorScroll();
  initForm();
})();
