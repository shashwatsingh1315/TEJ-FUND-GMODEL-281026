/* Verify the actual publish directory over HTTP, or a live deployment URL.
   node tools/smoke-site.cjs http://127.0.0.1:8000/ */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require('playwright');
const target = new URL(process.argv[2] || 'http://127.0.0.1:8000/');
const routes = ['guide','basis','revenue','finance/s1','finance/s2','finance/s3','finance/s4','finance/s5','finance/s6','cities','products','audit','inputs'];
(async () => {
  const executablePath = process.env.TEJ_CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  const browser = await chromium.launch({executablePath});
  try {
    const problems = [];
    for (const [width,height] of [[1536,864],[1366,768],[1920,1080]]) {
      const page = await browser.newPage({viewport:{width,height}});
      page.on('pageerror', e => problems.push(e.message));
      page.on('console', m => { if (m.type() === 'error') problems.push(m.text()); });
      for (const route of routes) {
        const url = new URL(target); url.hash = route;
        const response = await page.goto(url.href, {waitUntil:'load'});
        // Hash-only navigation reuses the document and has no HTTP response.
        if (response) assert.ok(response.ok(), `${url}: HTTP ${response.status()}`);
        await page.waitForFunction(expected => A.page === expected, route.split('/')[0]);
        if (route.startsWith('finance/')) {
          await page.waitForFunction(expected => A.steps.finance === expected, Number(route.split('/s')[1]) - 1);
        }
        const content = page.locator('#main-content');
        await content.waitFor({state:'visible'});
        const text = await content.innerText();
        assert.ok(text.trim().length > 100 && !/\bNaN\b|\bundefined\b/.test(text), `Invalid content: ${route}`);
        if (route.startsWith('finance')) {
          assert.equal(await page.locator('.stepbar li').count(), 6);
        }
      }
      const version = await page.request.get(new URL('version.json', target).href);
      assert.ok(version.ok());
      assert.match((await version.json()).dashboardSha256, /^[a-f0-9]{64}$/);
      for (const privatePath of ['README.md','docs/context/codex-grill-me-transcript.txt','workspace-2026-10-28/src/base/dashboard-base.html']) {
        const response = await page.request.get(new URL(privatePath, target).href);
        assert.equal(response.status(), 404, `Source file is public: ${privatePath}`);
      }
      await page.close();
    }
    assert.deepEqual(problems, []);
    console.log('Publish smoke test passed: 13 routes × 3 laptop sizes; version present; private source paths return 404.');
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
