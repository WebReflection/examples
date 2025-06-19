// I could've used a staic import from a CDN but Firefox would break 🤷
// @see breaks-in-firefox.js to understand how this SW should be instead
// thans Firefox 🤦

let defaultValue = null;

const dflt = (_, value) => {
  defaultValue = value.trim();
};

const named = (_, values) => {
  const literal = [`default:${defaultValue ?? 'null'}`];
  for (const exports of values.split(',')) {
    const [ref, name] = exports.split('as');
    literal.push(`${name.trim()}:${ref.trim()}`);
  }
  return `\nreturn {${literal.join(',')}};`;
};

const amaro = fetch('https://esm.run/@webreflection/amaro').then(r => r.text()).then(
  // ... oh Firefox ... the *horror* ...
  code => Function(
    code
      .replace(/\/\/# sourceMappingURL=.*$/, '')
      .replace(/export\s+default\s*(.+?);/, dflt)
      .replace(/export\s*\{(.+?)\}/, named)
  )()
);

addEventListener('install', () => skipWaiting());

addEventListener('activate', e => e.waitUntil(clients.claim()));

addEventListener('fetch', event => {
  const { request } = event;
  if (request.url.endsWith('.ts')) {
    event.respondWith(fetch(request).then(async response => {
      const [{ transformSync }, text] = await Promise.all([amaro, response.text()]);
      const headers = new Headers(response.headers);
      headers.set('Content-Type', 'text/javascript');
      return new Response(transformSync(text).code, { headers });
    }));
  }
});
