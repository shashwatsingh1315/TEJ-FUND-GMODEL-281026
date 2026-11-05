import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { dashboardSettings } from './dashboard.mjs';

function reply(body, status, method) {
  return new Response(method === 'HEAD' ? null : body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store, max-age=0',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin',
      ...(status === 405 ? { Allow: 'GET, HEAD' } : {}),
    },
  });
}

export function createAuthPageHandler({ env = process.env,
  getTemplate = () => readFile(join(process.cwd(), '.private/auth.html'), 'utf8'),
} = {}) {
  return async request => {
    if (!['GET', 'HEAD'].includes(request.method)) return reply('Method not allowed.', 405, request.method);
    const url = new URL(request.url);
    const flow = url.searchParams.get('flow') || (url.pathname.startsWith('/sign-in') ? 'sign-in' : 'sign-up');
    if (!['sign-up', 'sign-in'].includes(flow)) return reply('Not found.', 404, request.method);
    try {
      const config = dashboardSettings(env);
      const encoded = config.publishableKey.match(/^pk_(?:test|live)_([A-Za-z0-9+/=_-]+)$/)?.[1];
      const decoded = encoded && Buffer.from(encoded, 'base64').toString('utf8');
      if (!decoded || !/^[a-z0-9.-]+\$$/i.test(decoded)) throw new Error('Invalid publishable key.');
      const frontendOrigin = new URL(`https://${decoded.slice(0, -1)}`).origin;
      const returnUrl = `${config.origin}/`;
      const hosted = new URL(config.signIn);
      if (flow === 'sign-up') hosted.pathname = '/sign-up';
      hosted.searchParams.set('redirect_url', returnUrl);
      // Explicit public-only payload. Never serialize the environment or Clerk client.
      const clientConfig = {
        flow, publishableKey: config.publishableKey,
        scriptUrl: `${frontendOrigin}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`,
        uiScriptUrl: `${frontendOrigin}/npm/@clerk/ui@1/dist/ui.browser.js`,
        signInUrl: `${config.origin}/sign-in`, signUpUrl: `${config.origin}/sign-up`, returnUrl,
      };
      const replacements = {
        '{{TITLE}}': flow === 'sign-up' ? 'Create your account' : 'Welcome back',
        '{{SIGNUP_CURRENT}}': flow === 'sign-up' ? 'aria-current="page"' : '',
        '{{SIGNIN_CURRENT}}': flow === 'sign-in' ? 'aria-current="page"' : '',
        '{{HOSTED_URL}}': hosted.href.replaceAll('&', '&amp;').replaceAll('"', '&quot;'),
        '{{CONFIG}}': JSON.stringify(clientConfig).replaceAll('<', '\\u003c'),
      };
      let html = await getTemplate();
      for (const [placeholder, value] of Object.entries(replacements)) html = html.replaceAll(placeholder, value);
      return reply(html, 200, request.method);
    } catch {
      return reply('Account access is temporarily unavailable. Please try again later.', 503, request.method);
    }
  };
}
