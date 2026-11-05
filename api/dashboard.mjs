import { createDashboardHandler } from '../server/dashboard.mjs';

const dashboard = createDashboardHandler();

export default async function handler(req, res) {
  const host = req.headers.host || 'localhost';
  const protocol = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }
  const result = await dashboard(new Request(new URL(req.url, `${protocol}://${host}`), {
    method: req.method, headers,
  }));
  res.statusCode = result.status;
  for (const [key, value] of result.headers) {
    if (key !== 'set-cookie') res.setHeader(key, value);
  }
  const cookies = result.headers.getSetCookie();
  if (cookies.length) res.setHeader('Set-Cookie', cookies);
  res.end(Buffer.from(await result.arrayBuffer()));
}
