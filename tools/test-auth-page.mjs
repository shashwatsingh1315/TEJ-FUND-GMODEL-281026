import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { createAuthPageHandler } from '../server/auth-page.mjs';

const template = await readFile(new URL('../site-assets/auth.html', import.meta.url), 'utf8');
const env = {
  APP_ORIGIN: 'https://tejas-growth-model.vercel.app',
  CLERK_SIGN_IN_URL: 'https://accounts.example.com/sign-in',
  CLERK_PUBLISHABLE_KEY: `pk_test_${Buffer.from('clerk.example.com$').toString('base64')}`,
  CLERK_SECRET_KEY: 'sk_test_NEVER_EXPOSE_THIS',
};
const handler = config => createAuthPageHandler({ env: config || env, getTemplate: async () => template });
const request = (path, method = 'GET') => new Request(env.APP_ORIGIN + path, { method });
function configuration(html) {
  return JSON.parse(html.match(/<script id="auth-config" type="application\/json">([\s\S]*?)<\/script>/)[1]);
}

test('account page puts sign-up first and exposes only the publishable key', async () => {
  const response = await handler()(request('/sign-up?redirect_url=https://attacker.example/'));
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /href="\/sign-up" aria-current="page">Create account/);
  assert.ok(html.indexOf('>Create account</a>') < html.indexOf('>Sign in</a>'));
  const config = configuration(html);
  assert.equal(config.flow, 'sign-up');
  assert.equal(config.returnUrl, env.APP_ORIGIN + '/');
  assert.equal(config.publishableKey, env.CLERK_PUBLISHABLE_KEY);
  assert.equal(config.scriptUrl, 'https://clerk.example.com/npm/@clerk/clerk-js@6/dist/clerk.browser.js');
  assert.doesNotMatch(html, /sk_test_NEVER_EXPOSE_THIS|attacker\.example|PRIVATE FINANCIAL MODEL/);
  assert.match(response.headers.get('cache-control'), /no-store/);
});

test('sign-in subpaths and Vercel rewrite parameters preserve the chosen form', async () => {
  for (const path of ['/sign-in', '/sign-in/factor-one', '/api/auth?flow=sign-in']) {
    const html = await (await handler()(request(path))).text();
    assert.equal(configuration(html).flow, 'sign-in');
    assert.match(html, /href="\/sign-in" aria-current="page">Sign in/);
  }
});

test('every project returns to its own configured dashboard, never a request-provided origin', async () => {
  for (const name of ['tejas-growth-model', 'tejas-fin-model', 'tejas-growth-plan']) {
    const origin = `https://${name}.vercel.app`;
    const html = await (await handler({ ...env, APP_ORIGIN: origin })(request('/sign-up?return_url=https://attacker.example'))).text();
    const config = configuration(html);
    assert.equal(config.returnUrl, origin + '/');
    assert.equal(config.signInUrl, origin + '/sign-in');
    assert.equal(config.signUpUrl, origin + '/sign-up');
  }
});

test('preview pages use the platform deployment origin', async () => {
  const config = { ...env, VERCEL_ENV: 'preview', VERCEL_URL: 'preview.example.com' };
  const html = await (await handler(config)(request('/sign-up'))).text();
  assert.equal(configuration(html).returnUrl, 'https://preview.example.com/');
});

test('invalid keys or missing configuration never leak details or model data', async () => {
  for (const config of [{}, { ...env, CLERK_PUBLISHABLE_KEY: 'pk_test_invalid' }]) {
    const result = await handler(config)(request('/sign-up'));
    assert.equal(result.status, 503);
    assert.doesNotMatch(await result.text(), /sk_test|Invalid|PRIVATE/);
  }
});

test('auth entry supports HEAD and rejects unsupported methods and forms', async () => {
  const head = await handler()(request('/sign-up', 'HEAD'));
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  const post = await handler()(request('/sign-up', 'POST'));
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET, HEAD');
  assert.equal((await handler()(request('/api/auth?flow=other'))).status, 404);
});

async function clientFixture({ flow = 'sign-up', active = false, failLoad = false, failScript = false } = {}) {
  const html = await (await handler()(request('/' + flow))).text();
  const calls = [];
  const nodes = Object.fromEntries(['auth-config', 'clerk-root', 'loading', 'auth-error', 'retry'].map(id => [id, {
    hidden: id === 'auth-error', textContent: id === 'auth-config' ? JSON.stringify(configuration(html)) : '',
    setAttribute(name, value) { this[name] = value; }, addEventListener() {},
  }]));
  const clerk = {
    session: active ? { status: 'active' } : null,
    async load(options) { calls.push(['load', options]); if (failLoad) throw new Error('offline'); },
    mountSignUp(root, options) { calls.push(['sign-up', options]); },
    mountSignIn(root, options) { calls.push(['sign-in', options]); },
  };
  const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  await runInNewContext(script, {
    URL, setTimeout, clearTimeout, window: { Clerk: clerk, __internal_ClerkUICtor: {} },
    location: { replace(url) { calls.push(['redirect', url]); }, reload() {} },
    document: {
      getElementById(id) { return nodes[id]; },
      createElement() { return { dataset: {} }; },
      head: { appendChild(script) { failScript ? script.onerror() : script.onload(); } },
    },
  });
  return { calls, nodes };
}

for (const flow of ['sign-up', 'sign-in']) {
  test(`${flow} mounts Clerk with fixed return URLs and social buttons upfront`, async () => {
    const { calls, nodes } = await clientFixture({ flow });
    const options = calls.find(call => call[0] === flow)[1];
    assert.equal(options.forceRedirectUrl, env.APP_ORIGIN + '/');
    assert.equal(options.path, '/' + flow);
    const load = calls.find(call => call[0] === 'load')[1];
    assert.equal(load.appearance.options.socialButtonsPlacement, 'top');
    assert.equal(load.appearance.options.socialButtonsVariant, 'blockButton');
    assert.notEqual(load.appearance.elements.headerTitle.display, 'none');
    assert.notEqual(load.appearance.elements.headerSubtitle.display, 'none');
    assert.equal(nodes.loading.hidden, true);
    assert.equal(nodes['clerk-root']['aria-busy'], 'false');
  });
}

test('active signed-in users go straight back to the dashboard', async () => {
  const { calls } = await clientFixture({ active: true });
  assert.equal(calls.find(call => call[0] === 'redirect')[1], env.APP_ORIGIN + '/');
  assert.ok(!calls.some(call => ['sign-in', 'sign-up'].includes(call[0])));
});

test('network and SDK failures expose a recovery path instead of an endless spinner', async () => {
  for (const failure of [{ failLoad: true }, { failScript: true }]) {
    const { nodes } = await clientFixture(failure);
    assert.equal(nodes.loading.hidden, true);
    assert.equal(nodes['auth-error'].hidden, false);
    assert.equal(nodes['clerk-root']['aria-busy'], 'false');
  }
});
