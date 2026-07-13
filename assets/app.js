(() => {
  const doc = document;
  const body = doc.body;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const mobileMq = window.matchMedia("(max-width: 700px)");

  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

  let siteIntroDone = false;

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

    let heroBooted = false;
    const prepareHeroParticles = () => {
      if (heroBooted) return;
      heroBooted = true;
      setParticlesReady();
      if (pf && typeof pf.prepareIntro === "function") {
        pf.prepareIntro();
      } else {
        if (pf && typeof pf.setShape === "function") pf.setShape(0);
        if (pf && typeof pf.setSide === "function") pf.setSide("left");
      }
    };

    const launchSiteIntro = () => {
      if (reduced) {
        if (pf && typeof pf.skipIntro === "function") pf.skipIntro();
        body.classList.add("is-ready", "skip-intro");
        siteIntroDone = true;
        return;
      }

      body.classList.add("intro-lock", "is-entering");
      if (pf && typeof pf.startIntro === "function") pf.startIntro();
      window.setTimeout(() => body.classList.add("is-ready"), 220);
      window.setTimeout(() => body.classList.remove("is-entering"), 1800);
      window.setTimeout(() => {
        body.classList.remove("intro-lock");
        siteIntroDone = true;
      }, 2800);
    };

    doc.addEventListener("pf-ready", prepareHeroParticles, { once: true });
    queueMicrotask(() => {
      if (pf?.hasAttribute("data-ready")) prepareHeroParticles();
    });

    doc.addEventListener("pf-intro-complete", () => {
      siteIntroDone = true;
      body.classList.remove("intro-lock");
    }, { once: true });

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
      body.classList.toggle("skip-intro", Boolean(options.immediate));
      if (options.immediate) {
        if (pf && typeof pf.skipIntro === "function") pf.skipIntro();
        body.classList.add("is-ready");
        siteIntroDone = true;
        preloader.remove();
        return;
      }
      preloader.classList.add("is-exiting", "is-hidden");
      launchSiteIntro();
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
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    items.forEach((item) => observer.observe(item));
  }

  function initStaggerReveal() {
    const groups = doc.querySelectorAll("[data-stagger]");
    if (!groups.length) return;

    groups.forEach((group) => {
      const children = [...group.children];
      children.forEach((child, index) => {
        child.classList.add("reveal", "reveal--stagger");
        child.style.setProperty("--reveal-delay", `${index * 0.09}s`);
      });
    });
  }

  function initLineReveal() {
    const lines = doc.querySelectorAll(".line-reveal > span");
    lines.forEach((line, index) => {
      line.style.setProperty("--line-delay", `${0.15 + index * 0.08}s`);
    });
  }

  function initServiceRows() {
    const rows = [...doc.querySelectorAll(".service-row")];
    if (!rows.length) return;

    const syncMode = () => {
      const touchMode = mobileMq.matches || !finePointer;
      rows.forEach((row) => {
        row.classList.toggle("is-touch", touchMode);
        if (!touchMode) row.classList.remove("is-open");
      });
    };

    rows.forEach((row) => {
      row.addEventListener("click", () => {
        if (!row.classList.contains("is-touch")) return;
        const open = row.classList.contains("is-open");
        rows.forEach((item) => item.classList.remove("is-open"));
        if (!open) row.classList.add("is-open");
      });
    });

    syncMode();
    if (typeof mobileMq.addEventListener === "function") {
      mobileMq.addEventListener("change", syncMode);
    } else if (typeof mobileMq.addListener === "function") {
      mobileMq.addListener(syncMode);
    }
  }

  function initMobileCta() {
    const cta = doc.querySelector("[data-mobile-cta]");
    const hero = doc.querySelector(".hero");
    if (!cta || !hero) return;

    const show = () => {
      const rect = hero.getBoundingClientRect();
      const visible = rect.bottom < window.innerHeight * 0.35;
      cta.classList.toggle("is-visible", visible);
    };

    show();
    window.addEventListener("scroll", () => window.requestAnimationFrame(show), { passive: true });
    window.addEventListener("resize", show);
  }

  function applyLang(lang) {
    const dict = window.GETSITE_I18N?.[lang] || window.GETSITE_I18N?.ru;
    if (!dict) return;

    doc.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      const value = dict[key];
      if (value == null) return;
      if (el.dataset.i18nHtml === "true") el.innerHTML = value;
      else el.textContent = value;
    });

    doc.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const key = el.dataset.i18nAria;
      const value = dict[key];
      if (value != null) el.setAttribute("aria-label", value);
    });

    const title = dict["meta.title"];
    if (title) doc.title = title;

    const metaDesc = doc.querySelector('meta[name="description"]');
    if (metaDesc && dict["meta.description"]) metaDesc.setAttribute("content", dict["meta.description"]);

    const ogTitle = doc.querySelector('meta[property="og:title"]');
    if (ogTitle && title) ogTitle.setAttribute("content", title);

    const ogDesc = doc.querySelector('meta[property="og:description"]');
    if (ogDesc && dict["meta.description"]) ogDesc.setAttribute("content", dict["meta.description"]);

    doc.documentElement.lang = lang === "uz" ? "uz" : lang === "en" ? "en" : "ru";
  }

  function initLangSwitch() {
    const groups = doc.querySelectorAll("[data-lang-switch]");
    if (!groups.length) return;

    groups.forEach((group) => {
      const buttons = [...group.querySelectorAll("[data-lang]")];
      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          const lang = button.dataset.lang;
          buttons.forEach((item) => {
            const active = item === button;
            item.classList.toggle("is-active", active);
            item.setAttribute("aria-pressed", String(active));
          });
          applyLang(lang);
          try {
            localStorage.setItem("getsite-lang", lang);
          } catch (_) {
            /* ignore */
          }
        });
      });

      try {
        const saved = localStorage.getItem("getsite-lang");
        if (saved) {
          const savedBtn = buttons.find((item) => item.dataset.lang === saved);
          if (savedBtn) savedBtn.click();
        }
      } catch (_) {
        /* ignore */
      }
    });
  }

  function initBlogPage() {
    if (!doc.body.classList.contains("page-blog")) return;
    doc.body.classList.add("is-ready");
  }

  function initGetdesignPage() {
    if (!doc.body.classList.contains("page-getdesign")) return;
    doc.body.classList.add("is-ready");
    const pf = doc.querySelector("pf-scene");
    const boot = () => {
      if (pf && typeof pf.setShape === "function") pf.setShape(1);
      if (pf && typeof pf.setSide === "function") pf.setSide("left");
      if (pf && typeof pf.startIntro === "function") pf.startIntro();
    };
    doc.addEventListener("pf-ready", boot, { once: true });
  }

  function initMagneticButtons() {
    if (reduced || !finePointer) return;
    const buttons = doc.querySelectorAll(".btn, .contact__actions a");
    buttons.forEach((button) => {
      button.addEventListener("mousemove", (event) => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.14;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.14;
        button.style.setProperty("--magnet-x", `${x}px`);
        button.style.setProperty("--magnet-y", `${y}px`);
      });
      button.addEventListener("mouseleave", () => {
        button.style.setProperty("--magnet-x", "0px");
        button.style.setProperty("--magnet-y", "0px");
      });
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

    const shapeForScroll = (viewport) => {
      const switchLine = viewport * (mobileMq.matches ? 0.48 : 0.58);
      let nextIndex = 0;

      sections.forEach((section, index) => {
        if (section.getBoundingClientRect().top < switchLine) nextIndex = index;
      });

      const hysteresis = viewport * (mobileMq.matches ? 0.03 : 0.05);
      if (nextIndex > activeIndex) {
        const boundary = sections[nextIndex].getBoundingClientRect().top;
        if (boundary > switchLine - hysteresis) nextIndex = activeIndex;
      } else if (nextIndex < activeIndex) {
        const boundary = sections[activeIndex].getBoundingClientRect().top;
        if (boundary < switchLine + hysteresis) nextIndex = activeIndex;
      }

      activeIndex = nextIndex;
      return sectionTops[activeIndex] || { shape: 0, side: "left" };
    };

    const update = () => {
      const scrollY = window.scrollY || doc.documentElement.scrollTop;
      const viewport = window.innerHeight || 1;

      if (header) header.classList.toggle("is-scrolled", scrollY > 40);

      if (sectionTops.length) {
        const { shape, side } = shapeForScroll(viewport);
        applyScene(shape, side);
      }

      if (route && routeFill) {
        const rect = route.getBoundingClientRect();
        const progress = clamp((viewport * 0.72 - rect.top) / Math.max(1, rect.height));
        routeFill.style.height = `${Math.round(progress * 100)}%`;
        const done = Math.floor(progress * routeSteps.length);
        const active = Math.min(routeSteps.length - 1, done);
        routeSteps.forEach((step, index) => {
          step.classList.toggle("is-done", index < done);
          step.classList.toggle("is-active", index === active && rect.top < viewport * 0.9 && rect.bottom > viewport * 0.1);
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

  function initCasesRail() {
    const stage = doc.querySelector("[data-cases-rail]");
    if (!stage) return;

    const cards = [...stage.querySelectorAll(".cases-card")];
    const focalRatio = 0.16;
    let raf = 0;

    const updateCards = () => {
      const vw = window.innerWidth || 1;
      const focusX = vw * focalRatio;

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width * 0.38;
        const dist = Math.max(0, cx - focusX);
        const t = Math.min(1, dist / (vw * 0.78));
        const scale = 1 - t * 0.38;
        const lift = t * 34;
        const opacity = 1 - t * 0.58;
        const blur = t * 1.2;
        card.style.setProperty("--cases-scale", scale.toFixed(3));
        card.style.setProperty("--cases-lift", `${lift.toFixed(1)}px`);
        card.style.setProperty("--cases-opacity", opacity.toFixed(3));
        card.style.setProperty("--cases-blur", `${blur.toFixed(2)}px`);
      });
    };

    const requestUpdate = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        updateCards();
      });
    };

    stage.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    let drag = false;
    let startX = 0;
    let startLeft = 0;

    stage.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") return;
      drag = true;
      startX = event.clientX;
      startLeft = stage.scrollLeft;
      stage.classList.add("is-dragging");
      stage.setPointerCapture(event.pointerId);
    });

    stage.addEventListener("pointermove", (event) => {
      if (!drag) return;
      stage.scrollLeft = startLeft - (event.clientX - startX);
      requestUpdate();
    });

    const endDrag = (event) => {
      if (!drag) return;
      drag = false;
      stage.classList.remove("is-dragging");
      if (event.pointerId) stage.releasePointerCapture(event.pointerId);
    };

    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    if (!reduced) {
      stage.addEventListener("wheel", (event) => {
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        stage.scrollLeft += event.deltaY * 0.9;
        event.preventDefault();
        requestUpdate();
      }, { passive: false });
    }

    requestUpdate();
  }

  function initCookies() {
    const widget = doc.querySelector("[data-cookie-widget]");
    const panel = doc.querySelector("[data-cookie-panel]");
    if (!widget || !panel) return;

    const STORAGE_KEY = "getsite-cookie-consent";
    const trigger = widget.querySelector("[data-cookie-open]");
    const closeButtons = doc.querySelectorAll("[data-cookie-close]");
    const acceptBtn = doc.querySelector("[data-cookie-accept]");
    const declineBtn = doc.querySelector("[data-cookie-decline]");
    const saveBtn = doc.querySelector("[data-cookie-save]");
    const tabButtons = panel.querySelectorAll("[data-cookie-tab]");
    const panes = panel.querySelectorAll("[data-cookie-pane]");
    const showButtons = panel.querySelectorAll("[data-cookie-show]");
    const perfInput = doc.querySelector("#cookie-performance");
    const targetInput = doc.querySelector("#cookie-targeting");

    const readConsent = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (_) {
        return null;
      }
    };

    const writeConsent = (value) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch (_) {
        /* ignore */
      }
    };

    const syncToggleTracks = () => {
      panel.querySelectorAll(".cookie-toggle input[type='checkbox']").forEach((input) => {
        const track = input.nextElementSibling;
        if (track) track.classList.toggle("is-on", input.checked);
      });
    };

    const setPanelOpen = (open) => {
      panel.classList.toggle("is-open", open);
      panel.setAttribute("aria-hidden", String(!open));
      if (open) {
        const focusTarget = panel.querySelector("[data-cookie-save]") || panel.querySelector(".cookie-panel__close");
        window.setTimeout(() => focusTarget?.focus(), 0);
      } else if (trigger) {
        trigger.focus();
      }
    };

    const setTab = (name) => {
      tabButtons.forEach((button) => {
        const active = button.dataset.cookieTab === name;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
      });
      panes.forEach((pane) => {
        const active = pane.dataset.cookiePane === name;
        pane.classList.toggle("is-active", active);
        if (active) pane.removeAttribute("hidden");
        else pane.setAttribute("hidden", "");
      });
    };

    const applyConsentToForm = (consent) => {
      if (!consent) return;
      if (perfInput) perfInput.checked = Boolean(consent.performance);
      if (targetInput) targetInput.checked = Boolean(consent.targeting);
      syncToggleTracks();
    };

    const saveConsent = (performance, targeting) => {
      writeConsent({
        essential: true,
        performance,
        targeting,
        ts: Date.now(),
      });
      setPanelOpen(false);
    };

    const readForm = () => ({
      performance: perfInput ? perfInput.checked : false,
      targeting: targetInput ? targetInput.checked : false,
    });

    trigger?.addEventListener("click", () => setPanelOpen(true));
    closeButtons.forEach((button) => button.addEventListener("click", () => setPanelOpen(false)));

    acceptBtn?.addEventListener("click", () => {
      if (perfInput) perfInput.checked = true;
      if (targetInput) targetInput.checked = true;
      syncToggleTracks();
      saveConsent(true, true);
    });

    declineBtn?.addEventListener("click", () => {
      if (perfInput) perfInput.checked = false;
      if (targetInput) targetInput.checked = false;
      syncToggleTracks();
      saveConsent(false, false);
    });

    saveBtn?.addEventListener("click", () => {
      const form = readForm();
      saveConsent(form.performance, form.targeting);
    });

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => setTab(button.dataset.cookieTab));
    });

    showButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.cookieShow;
        const list = panel.querySelector(`[data-cookie-list="${key}"]`);
        if (!list) return;
        const open = list.hasAttribute("hidden");
        if (open) list.removeAttribute("hidden");
        else list.setAttribute("hidden", "");
        button.setAttribute("aria-expanded", String(open));
        button.classList.toggle("is-open", open);
      });
    });

    panel.querySelectorAll(".cookie-toggle input[type='checkbox']").forEach((input) => {
      input.addEventListener("change", syncToggleTracks);
    });

    doc.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && panel.classList.contains("is-open")) {
        setPanelOpen(false);
      }
    });

    widget.addEventListener("mouseenter", () => widget.classList.add("is-expanded"));
    widget.addEventListener("mouseleave", () => widget.classList.remove("is-expanded"));
    trigger?.addEventListener("focus", () => widget.classList.add("is-expanded"));
    trigger?.addEventListener("blur", () => widget.classList.remove("is-expanded"));

    syncToggleTracks();
    const saved = readConsent();
    applyConsentToForm(saved);
    if (!saved) {
      window.setTimeout(() => setPanelOpen(true), 2000);
    }
  }

  initPreloader();
  initBlogPage();
  initGetdesignPage();
  initMenu();
  initCursor();
  initStaggerReveal();
  initReveal();
  initLineReveal();
  initServiceRows();
  initMobileCta();
  initLangSwitch();
  initMagneticButtons();
  initScrollState();
  initCasesRail();
  initAnchorScroll();
  initForm();
  initCookies();
})();
