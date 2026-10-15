// Exact assets bypass this handler. Preserve Caddy's directory and .html fallback
// without redirecting the existing canonical .html URLs.
export default {
  async fetch(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const url = new URL(request.url);
    const candidates = url.pathname.endsWith('/')
      ? [`${url.pathname}index.html`]
      : [`${url.pathname}.html`, `${url.pathname}/index.html`];

    for (const pathname of candidates) {
      const target = new URL(url);
      target.pathname = pathname;
      const response = await env.ASSETS.fetch(new Request(target, request));
      if (response.status !== 404) {
        if (pathname.endsWith('/index.html') && !url.pathname.endsWith('/')) {
          url.pathname += '/';
          return Response.redirect(url, 301);
        }
        return response;
      }
    }
    return env.ASSETS.fetch(request);
  },
};
