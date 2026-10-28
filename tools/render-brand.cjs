/* Rebuild the public Tejas link-preview assets. Requires Playwright + Chromium.
   NODE_PATH=<your node modules> node tools/render-brand.cjs */
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const base = fs.readFileSync(path.join(root, 'workspace-2026-10-28/src/base/dashboard-base.html'), 'utf8');
const logo = fs.readFileSync(path.join(root, 'workspace-2026-10-28/src/brand/tejas-logo.svg'), 'utf8');
const fonts = [...base.matchAll(/@font-face\s*\{[^}]*\}/g)].map(m => m[0]).filter(s => /font-family:\s*'Poppins'/.test(s)).join('\n');
const out = path.join(root, 'site-assets');
(async () => {
  fs.mkdirSync(out, {recursive:true});
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
    await page.setContent(`<!doctype html><meta charset="utf-8"><style>
      ${fonts}
      *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#FAF9F5;color:#141413;font-family:Poppins,sans-serif}
      main{height:100%;padding:48px 64px 42px;border-top:8px solid #0851A3;display:flex;flex-direction:column}
      header{display:flex;align-items:center;justify-content:space-between}header svg{width:126px;height:69px}
      .eyebrow{font-size:17px;letter-spacing:2px;font-weight:500;color:#6B6963;text-transform:uppercase}
      h1{font-size:76px;line-height:1.13;letter-spacing:-2px;font-weight:500;margin:43px 0 23px}
      h1 span{color:#0851A3}p{font-size:22px;line-height:1.55;margin:0;color:#55544F}
      footer{margin-top:auto;padding-top:21px;border-top:1px solid #D6D3C8;display:flex;align-items:center;justify-content:space-between;font-size:17px;color:#6B6963}
      .period{font-size:20px;color:#0851A3;font-weight:500}.dot{display:inline-block;width:8px;height:8px;background:#F34312;border-radius:50%;margin-right:10px}
    </style><main><header>${logo}<div class="eyebrow">Investor dashboard</div></header><h1>Growth &amp;<br><span>funding model.</span></h1><p>Revenue. Capital. Funding rounds. Investor returns.</p><footer><span><i class="dot"></i>The four-year growth plan</span><span class="period">2026 — 2030</span></footer></main>`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({path:path.join(out,'tejas-preview.png')});
    await page.setViewportSize({width:180,height:180});
    await page.setContent(`<style>body{margin:0;width:180px;height:180px;background:white;display:grid;place-items:center}svg{width:158px;height:auto}</style>${logo}`);
    await page.screenshot({path:path.join(out,'tejas-icon.png')});
    console.log('Rendered Tejas preview (1200×630) and icon (180×180).');
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});
