const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('/Users/shashwat/Downloads/tejas-revenue-dashboard9-27.html', 'utf8');
const defaults = html.match(/<script type="application\/json" id="inputs-default">([\s\S]*?)<\/script>/)[1];
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const noop = () => {};
const element = { classList: {add:noop,remove:noop}, querySelectorAll:()=>[], style:{}, dataset:{} };
const ctx = vm.createContext({
  structuredClone,
  document:{getElementById:id=>id==='inputs-default'?{textContent:defaults}:element,addEventListener:noop},
  localStorage:{getItem:()=>null,setItem:noop},
  innerWidth:1280, addEventListener:noop, window:{},
  MutationObserver:class {observe(){}},
});
scripts.forEach(s => vm.runInContext(s.replace(/^routeApp\(\);$/m, ''), ctx, {timeout:1000}));
if (process.argv[2] === 'channels') {
  const channels = vm.runInContext(`(() => {
    const all=view(SCOPE.core),rt=view(SCOPE.core,'city'),dd=view(SCOPE.core,'dist');
    return {
      maxReconciliationDifference:Math.max(...P.flatMap(p=>all.M[p].map((v,q)=>Math.abs(v-rt.M[p][q]-dd.M[p][q])))),
      q16:P.map(p=>({product:NAME[p],retailMRR:rt.M[p][15],dealerMRR:dd.M[p][15],totalMRR:all.M[p][15]})),
      totalQ16:{retail:rt.T[15],dealer:dd.T[15],total:all.T[15]},
      quarterlyMRR:all.T
    };
  })()`, ctx, {timeout:1000});
  console.log(JSON.stringify(channels, null, 2));
  process.exit(0);
}
const output = vm.runInContext(`(() => {
 const R=raisePlan(),G=R.G,K=G.K,ret=investorReturn(R,capX());
 return {
  end:K.cum[15],capital:G.cumTot[15],cumulativeOperatingProfit:G.cumPat[15],
  peakGap:G.peak,peakQuarter:G.peakQ+1,selfQuarter:G.selfQ+1,
  equity:R.equity,minCash:R.minCash,rounds:ret.pr,
  rows:K.T.map((m,q)=>({q:q+1,mrr:m,operatingProfit:G.pat[q],costPlanBurn:3*K.burnM[q].burn/100,growthSpend:G.flows.capex[q]+G.flows.pp[q]+G.flows.wc[q],cumulativeGap:G.gap[q],cash:R.cash[q]})),
  investorReturn:{multiple:ret.mult,value:ret.val,stake:ret.s,enterpriseValue:ret.ev,equityValue:ret.eqv,cash:ret.cash},
  roce:roceFin(G)[15],
  costPlanChange:(()=>{const old=INP.capital.burn.salary[0];INP.capital.burn.salary[0]+=100;const r=raisePlan();INP.capital.burn.salary[0]=old;return {extraMonthlySalaryLakhs:100,capitalChange:r.G.cumTot[15]-G.cumTot[15],profitChange:r.G.cumPat[15]-G.cumPat[15],equityChange:r.equity-R.equity};})()
 };
})()`, ctx, {timeout:5000});
console.log(JSON.stringify(output, null, 2));
