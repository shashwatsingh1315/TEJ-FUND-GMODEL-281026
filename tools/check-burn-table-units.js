const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('file://'+process.argv[2]);await p.waitForTimeout(1200);
const o=await p.evaluate(()=>{const r=v=>Math.round(v*100)/100;const K=capModel();const inc=incomeFin();
return {burnAt45:burnAt(4.5),burnAt10:burnAt(10),burnAt25:burnAt(25),breakevenMRR:breakevenMRR(),burnQ:K.burn.map((v,i)=>r(v-(i?K.burn[i-1]:0))),fixedPerMonthQ4:r(inc.Q[3].fixed/3),fixedY1:r(inc.Q.slice(0,4).reduce((s,x)=>s+x.fixed,0)),grossY1:r(inc.Q.slice(0,4).reduce((s,x)=>s+x.gross,0)),mrrQ4:r(inc.Q[3].mrr),STEPS:typeof STEPS!=='undefined'?STEPS.finance:null,DAYS_PM:typeof DAYS_PM!=='undefined'?DAYS_PM:null};});
console.log(JSON.stringify(o));await b.close();})().catch(e=>{console.error('ERR',e.message);process.exit(1)});
