(function () {
  var KEY = 'getsite-scroll-y';

  function readCachedScroll() {
    try {
      var raw = sessionStorage.getItem(KEY);
      var y = raw ? parseInt(raw, 10) : 0;
      return Number.isFinite(y) && y > 0 ? y : 0;
    } catch (error) {
      return 0;
    }
  }

  var cached = readCachedScroll();
  window.__GETSITE_CACHED_SCROLL__ = cached;

  if (cached > 0) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, cached);
  }
})();
