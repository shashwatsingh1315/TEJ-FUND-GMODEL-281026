import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createClerkClient } from '@clerk/backend';

const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
};

function settings(env) {
  // Vercel supplies this deployment hostname. Never use a request header to
  // decide where an authentication redirect may return.
  const origin = new URL(env.VERCEL_ENV === 'preview' && env.VERCEL_URL
    ? `https://${env.VERCEL_URL}` : env.APP_ORIGIN);
  const signIn = new URL(env.CLERK_SIGN_IN_URL);
  for (const url of [origin, signIn]) {
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.hostname === 'localhost')) {
      throw new Error('Authentication URLs must use HTTPS.');
    }
    if (url.username || url.password) throw new Error('Invalid authentication URL.');
  }
  if (origin.href !== `${origin.origin}/`) throw new Error('APP_ORIGIN must be an origin.');
  if (signIn.origin === origin.origin) throw new Error('Use the hosted Clerk sign-in URL.');
  const publishableKey = env.CLERK_PUBLISHABLE_KEY || env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!env.CLERK_SECRET_KEY || !publishableKey) throw new Error('Missing Clerk keys.');
  const authorizedParties = (env.CLERK_AUTHORIZED_PARTIES || origin.origin)
    .split(',').map(value => new URL(value.trim()).origin);
  const allowedEmails = new Set((env.DASHBOARD_ALLOWED_EMAILS || '')
    .split(',').map(value => value.trim().toLowerCase()).filter(Boolean));
  // Opt in per project; other deployments retain their existing access rules.
  const accessMode = env.DASHBOARD_ACCESS_MODE || 'restricted';
  if (!['restricted', 'authenticated'].includes(accessMode)) {
    throw new Error('Invalid dashboard access mode.');
  }
  return { origin: origin.origin, signIn, authorizedParties, publishableKey, allowedEmails, accessMode };
}

function response(body, status, extraHeaders, method = 'GET') {
  const headers = new Headers(extraHeaders);
  for (const [key, value] of Object.entries(privateHeaders)) headers.set(key, value);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'text/plain; charset=utf-8');
  return new Response(method === 'HEAD' ? null : body, { status, headers });
}

// Dependencies are injected by the tests; deployed requests always use Clerk's
// signature verification and its server-only user metadata API.
export function createDashboardHandler({
  env = process.env,
  client,
  getDashboard = () => readFile(join(process.cwd(), '.private/dashboard.html')),
} = {}) {
  return async function dashboard(request) {
    if (!['GET', 'HEAD'].includes(request.method)) {
      return response('Method not allowed.', 405, { Allow: 'GET, HEAD' });
    }
    try {
      const config = settings(env);
      const clerk = client ?? createClerkClient({
        secretKey: env.CLERK_SECRET_KEY,
        publishableKey: config.publishableKey,
        ...(env.CLERK_JWT_KEY ? { jwtKey: env.CLERK_JWT_KEY } : {}),
      });
      const state = await clerk.authenticateRequest(request, {
        acceptsToken: 'session_token',
        authorizedParties: config.authorizedParties,
        signInUrl: config.signIn.href,
        afterSignInUrl: `${config.origin}/`,
      });

      // Clerk may need to refresh or synchronize its session cookies before it
      // can decide whether this browser is signed in. Preserve all its headers.
      if (state.status === 'handshake') {
        if (!state.headers.get('location')) throw new Error('Incomplete Clerk handshake.');
        return response(null, 307, state.headers, request.method);
      }
      const auth = state.toAuth();
      if (!state.isAuthenticated || !auth?.userId || !auth?.sessionId) {
        const location = new URL(config.signIn);
        location.searchParams.set('redirect_url', `${config.origin}/`);
        const headers = new Headers(state.headers);
        headers.set('Location', location.href);
        return response(null, 303, headers, request.method);
      }

      // Never trust browser-editable unsafeMetadata or a client-supplied email.
      // Check administrative blocks live, even in open-registration mode.
      const user = await clerk.users.getUser(auth.userId);
      // A server-configured email allowlist can bootstrap owner access without
      // sending an invitation. Match only Clerk's verified primary address.
      // An explicit administrative revocation always overrides this allowlist.
      const primaryEmail = user.emailAddresses?.find(email => email.id === user.primaryEmailAddressId);
      const allowedEmail = primaryEmail?.verification?.status === 'verified'
        && config.allowedEmails.has(primaryEmail.emailAddress.trim().toLowerCase());
      const blocked = user.banned || user.locked || user.publicMetadata?.dashboardAccess === false;
      const allowed = config.accessMode === 'authenticated' || user.publicMetadata?.dashboardAccess === true || allowedEmail;
      if (blocked || !allowed) {
        const message = blocked ? 'Dashboard access is disabled for this account. Contact the dashboard owner.'
          : 'Access is by invitation only. Contact the dashboard owner.';
        return response(message, 403, state.headers, request.method);
      }
      const html = await getDashboard();
      const headers = new Headers(state.headers);
      headers.set('Content-Type', 'text/html; charset=utf-8');
      return response(html, 200, headers, request.method);
    } catch {
      // Missing keys, backend outages, and verification failures must never
      // fall back to publishing the financial model or exposing SDK errors.
      return response('Dashboard access is temporarily unavailable. Please try again later.', 503, undefined, request.method);
    }
  };
}
