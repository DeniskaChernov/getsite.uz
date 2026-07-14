(function () {
  const STORAGE_KEY = "getsite-cookie-consent";
  let loaded = false;

  function readConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function loadYandexMetrika(id) {
    if (!id || loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    (function (m, e, t, r, i, k, a) {
      m[i] =
        m[i] ||
        function () {
          (m[i].a = m[i].a || []).push(arguments);
        };
      m[i].l = 1 * new Date();
      for (var j = 0; j < document.scripts.length; j++) {
        if (document.scripts[j].src === r) return;
      }
      (k = e.createElement(t)), (a = e.getElementsByTagName(t)[0]);
      k.async = 1;
      k.src = r;
      a.parentNode.insertBefore(k, a);
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

    window.ym(Number(id), "init", {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: false,
    });
  }

  function applyAnalytics() {
    const consent = readConsent();
    const id = window.GETSITE_CONFIG && window.GETSITE_CONFIG.yandexMetrikaId;
    if (!consent || !consent.performance || !id) return;
    loadYandexMetrika(String(id).trim());
  }

  window.GETSITE_APPLY_ANALYTICS = applyAnalytics;
  applyAnalytics();
})();
