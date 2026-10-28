/* Opens every page of the dashboard in Chromium and fails on any console error, page error,
   or "NaN"/"undefined" in the visible text. Page 03 is checked step by step.
   Run from workspace-2026-10-28: node work/smoke-test.cjs [dashboard.html] */
const {chromium}=require('playwright'),path=require('node:path');
const file=path.resolve(process.argv[2]||path.join(__dirname,'..','outputs','Tejas_Revenue_Dashboard_1041_Updated.html'));
const routes=['guide','basis','revenue','finance/s1','finance/s2','finance/s3','finance/s4','finance/s5','finance/s6','cities','products','audit','inputs'];
const viewports=[[1536,864],[1366,768],[1920,1080]];   // 16:9 laptop screens the dashboard is designed for
(async()=>{
  const browser=await chromium.launch(),problems=[];
  for(const [width,height] of viewports){
    const page=await browser.newPage({viewport:{width,height}});let route='';
    page.on('console',m=>{if(m.type()==='error')problems.push(`${width}×${height} #${route}: console error: ${m.text()}`);});
    page.on('pageerror',e=>problems.push(`${width}×${height} #${route}: page error: ${e.message}`));
    for(route of routes){
      await page.goto('file://'+file+'#'+route);await page.waitForTimeout(300);
      const text=await page.evaluate(()=>document.getElementById('main-content').innerText);
      if(/\bNaN\b|\bundefined\b/.test(text))problems.push(`${width}×${height} #${route}: NaN or undefined on screen`);
      if(route.startsWith('finance')){
        const steps=await page.evaluate(()=>document.querySelectorAll('.stepbar li').length);
        if(steps!==6)problems.push(`${width}×${height} #${route}: expected 6 steps, found ${steps}`);
      }
    }
    await page.close();
  }
  await browser.close();
  if(problems.length){console.error(problems.join('\n'));process.exit(1);}
  console.log(`Smoke test passed: ${routes.length} pages × ${viewports.length} screen sizes, no errors.`);
})();
