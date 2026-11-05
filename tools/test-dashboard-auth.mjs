import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { createClerkClient } from '@clerk/backend';
import { createDashboardHandler } from '../server/dashboard.mjs';

const origin = 'https://tejas-growth-model.vercel.app';
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const env = {
  APP_ORIGIN: origin,
  CLERK_SIGN_IN_URL: 'https://accounts.example.com/sign-in',
  CLERK_PUBLISHABLE_KEY: `pk_test_${Buffer.from('clerk.example.com$').toString('base64')}`,
  CLERK_SECRET_KEY: 'sk_test_local_fixture',
};

function token(overrides = {}, signingKey = privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT', kid: 'local-test' })}.${encode({
    sub: 'user_invited', sid: 'sess_active', sts: 'active',
    iss: 'https://clerk.example.com', azp: origin,
    iat: now - 1, nbf: now - 1, exp: now + 60, v: 2,
    ...overrides,
  })}`;
  return `${unsigned}.${sign('RSA-SHA256', Buffer.from(unsigned), signingKey).toString('base64url')}`;
}

function fixture({ user = { publicMetadata: { dashboardAccess: true } }, client, config = env } = {}) {
  let reads = 0;
  const clerk = client ?? createClerkClient({
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
    jwtKey: publicKey.export({ type: 'spki', format: 'pem' }),
    telemetry: { disabled: true },
  });
  clerk.users.getUser = async () => {
    if (user instanceof Error) throw user;
    return user;
  };
  const handler = createDashboardHandler({
    env: config, client: clerk,
    getDashboard: async () => { reads++; return '<html>PRIVATE FINANCIAL MODEL</html>'; },
  });
  const request = (jwt, method = 'GET') => handler(new Request(`${origin}/?redirect_url=https://attacker.example`, {
    method, headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
  }));
  return { request, reads: () => reads };
}

test('valid Clerk-signed session with an invitation grant receives private HTML without caching', async () => {
  const f = fixture();
  const result = await f.request(token());
  assert.equal(result.status, 200);
  assert.match(await result.text(), /PRIVATE FINANCIAL MODEL/);
  assert.equal(f.reads(), 1);
  for (const name of ['cache-control', 'cdn-cache-control', 'vercel-cdn-cache-control']) {
    assert.match(result.headers.get(name), /no-store/);
  }
});

test('anonymous visitors receive no financial model and return only to the configured origin', async () => {
  const f = fixture();
  const result = await f.request();
  assert.ok([303, 307].includes(result.status));
  assert.equal(f.reads(), 0);
  assert.doesNotMatch(await result.text(), /PRIVATE FINANCIAL MODEL/);
  if (result.status === 303) {
    const location = new URL(result.headers.get('location'));
    assert.equal(location.origin, 'https://accounts.example.com');
    assert.equal(location.searchParams.get('redirect_url'), `${origin}/`);
  }
});

for (const [name, jwt] of [
  ['forged signature', token({}, generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey)],
  ['expired session', token({ exp: Math.floor(Date.now() / 1000) - 60 })],
  ['unauthorized origin', token({ azp: 'https://attacker.example' })],
  ['pending session', token({ sts: 'pending' })],
]) {
  test(`${name} never receives the dashboard`, async () => {
    const f = fixture();
    const result = await f.request(jwt);
    assert.notEqual(result.status, 200);
    assert.equal(f.reads(), 0);
  });
}

for (const [name, user] of [
  ['ordinary signed-in user', { publicMetadata: {} }],
  ['browser-editable access flag', { unsafeMetadata: { dashboardAccess: true } }],
  ['non-boolean grant', { publicMetadata: { dashboardAccess: 'true' } }],
  ['banned invited user', { banned: true, publicMetadata: { dashboardAccess: true } }],
  ['locked invited user', { locked: true, publicMetadata: { dashboardAccess: true } }],
]) {
  test(`${name} is denied even with a valid session`, async () => {
    const f = fixture({ user });
    const result = await f.request(token());
    assert.equal(result.status, 403);
    assert.equal(f.reads(), 0);
  });
}

test('revoking the user grant blocks an existing session on its next request', async () => {
  const user = { publicMetadata: { dashboardAccess: true } };
  const f = fixture({ user });
  const jwt = token();
  assert.equal((await f.request(jwt)).status, 200);
  user.publicMetadata.dashboardAccess = false;
  assert.equal((await f.request(jwt)).status, 403);
  assert.equal(f.reads(), 1);
});

test('backend failure and missing configuration fail closed', async () => {
  for (const options of [{ user: new Error('sensitive upstream error') }, { config: {} }]) {
    const f = fixture(options);
    const result = await f.request(token());
    assert.equal(result.status, 503);
    assert.equal(f.reads(), 0);
    assert.doesNotMatch(await result.text(), /sensitive|PRIVATE/);
  }
});

test('Clerk handshake preserves redirects and separate cookie headers', async () => {
  const headers = new Headers({ Location: 'https://clerk.example.com/handshake' });
  headers.append('Set-Cookie', '__session=one; HttpOnly');
  headers.append('Set-Cookie', '__client_uat=two; Secure');
  const client = { authenticateRequest: async () => ({ status: 'handshake', headers }), users: {} };
  const f = fixture({ client });
  const result = await f.request();
  assert.equal(result.status, 307);
  assert.equal(result.headers.getSetCookie().length, 2);
  assert.equal(f.reads(), 0);
});

test('HEAD still requires invitation access and non-read methods are rejected', async () => {
  const f = fixture();
  const head = await f.request(token(), 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  const post = await f.request(token(), 'POST');
  assert.equal(post.status, 405);
  assert.equal(f.reads(), 1);
});

test('Vercel Marketplace publishable key name is supported', async () => {
  const config = { ...env, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: env.CLERK_PUBLISHABLE_KEY };
  delete config.CLERK_PUBLISHABLE_KEY;
  assert.equal((await fixture({ config }).request(token())).status, 200);
});

test('previews accept sessions only for their Vercel-supplied deployment origin', async () => {
  const previewOrigin = 'https://tejas-auth-preview.vercel.app';
  const config = { ...env, VERCEL_ENV: 'preview', VERCEL_URL: new URL(previewOrigin).host };
  const f = fixture({ config });
  assert.equal((await f.request(token({ azp: previewOrigin }))).status, 200);
  assert.notEqual((await f.request(token())).status, 200);
  assert.equal(f.reads(), 1);
});

const emailUser = {
  primaryEmailAddressId: 'email_primary',
  emailAddresses: [{
    id: 'email_primary', emailAddress: 'owner@example.com',
    verification: { status: 'verified' },
  }],
};

test('an allowlisted verified primary email can open the model without a metadata grant', async () => {
  const f = fixture({ user: structuredClone(emailUser), config: { ...env, DASHBOARD_ALLOWED_EMAILS: ' OWNER@EXAMPLE.COM ' } });
  assert.equal((await f.request(token())).status, 200);
});

for (const [name, mutate] of [
  ['unverified email', user => { user.emailAddresses[0].verification.status = 'unverified'; }],
  ['unlisted email', user => { user.emailAddresses[0].emailAddress = 'outsider@example.com'; }],
  ['secondary email', user => { user.primaryEmailAddressId = 'different_primary'; }],
  ['explicit revocation', user => { user.publicMetadata = { dashboardAccess: false }; }],
  ['banned owner', user => { user.banned = true; }],
  ['locked owner', user => { user.locked = true; }],
]) {
  test(`email allowlist denies ${name}`, async () => {
    const user = structuredClone(emailUser);
    mutate(user);
    const f = fixture({ user, config: { ...env, DASHBOARD_ALLOWED_EMAILS: 'owner@example.com' } });
    assert.equal((await f.request(token())).status, 403);
    assert.equal(f.reads(), 0);
  });
}

const openConfig = { ...env, DASHBOARD_ACCESS_MODE: 'authenticated' };

for (const [name, user] of [
  ['ordinary registered account', { publicMetadata: {} }],
  ['account without metadata', {}],
  ['account outside the email allowlist', {
    primaryEmailAddressId: 'email_new',
    emailAddresses: [{ id: 'email_new', emailAddress: 'new@example.com', verification: { status: 'verified' } }],
  }],
]) {
  test(`authenticated access mode serves the dashboard to ${name}`, async () => {
    const f = fixture({ user, config: openConfig });
    const result = await f.request(token());
    assert.equal(result.status, 200);
    assert.match(await result.text(), /PRIVATE FINANCIAL MODEL/);
    assert.match(result.headers.get('cache-control'), /no-store/);
  });
}

for (const [name, user] of [
  ['explicitly blocked account', { publicMetadata: { dashboardAccess: false } }],
  ['banned account with a grant', { banned: true, publicMetadata: { dashboardAccess: true } }],
  ['locked account', { locked: true }],
  ['blocked account with a browser-editable grant', { publicMetadata: { dashboardAccess: false }, unsafeMetadata: { dashboardAccess: true } }],
]) {
  test(`authenticated access mode still denies ${name}`, async () => {
    const f = fixture({ user, config: openConfig });
    const result = await f.request(token());
    assert.equal(result.status, 403);
    assert.equal(f.reads(), 0);
  });
}

for (const [name, jwt] of [
  ['anonymous visitor', undefined],
  ['forged signature', token({}, generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey)],
  ['expired session', token({ exp: Math.floor(Date.now() / 1000) - 60 })],
  ['unauthorized origin', token({ azp: 'https://attacker.example' })],
  ['pending session', token({ sts: 'pending' })],
]) {
  test(`authenticated access mode rejects ${name}`, async () => {
    const f = fixture({ config: openConfig });
    assert.notEqual((await f.request(jwt)).status, 200);
    assert.equal(f.reads(), 0);
  });
}

test('unrecognized access mode fails closed instead of making the dashboard public', async () => {
  const f = fixture({ config: { ...env, DASHBOARD_ACCESS_MODE: 'public' } });
  assert.equal((await f.request(token())).status, 503);
  assert.equal(f.reads(), 0);
});

test('blocking a user stops an existing session in authenticated access mode', async () => {
  const user = { publicMetadata: {} };
  const f = fixture({ user, config: openConfig });
  const jwt = token();
  assert.equal((await f.request(jwt)).status, 200);
  user.publicMetadata.dashboardAccess = false;
  assert.equal((await f.request(jwt)).status, 403);
});
