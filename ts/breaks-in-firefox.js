// watch out redirects here, not allowed in service workers so ... long URL it is!
import { transformSync } from 'https://cdn.jsdelivr.net/npm/@webreflection/amaro/+esm';

addEventListener('install', () => skipWaiting());

addEventListener('activate', e => e.waitUntil(clients.claim()));

addEventListener('fetch', event => {
  const { request } = event;
  if (request.url.endsWith('.ts')) {
    event.respondWith(fetch(request).then(async response => {
      const { code } = transformSync(await response.text());
      const headers = new Headers(response.headers);
      headers.set('Content-Type', 'text/javascript');
      return new Response(code, { headers });
    }));
  }
});
