import { createAuthPageHandler } from '../server/auth-page.mjs';

const authPage = createAuthPageHandler();

export default async function handler(req, res) {
  const host = req.headers.host || 'localhost';
  const protocol = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
  const url = new URL(req.url, `${protocol}://${host}`);
  if (req.query?.flow) url.searchParams.set('flow', req.query.flow);
  const result = await authPage(new Request(url, { method: req.method }));
  res.statusCode = result.status;
  for (const [key, value] of result.headers) res.setHeader(key, value);
  res.end(Buffer.from(await result.arrayBuffer()));
}
