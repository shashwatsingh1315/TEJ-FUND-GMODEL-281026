/* Reproduce the receivable timing problem in the real dashboard engine.
   No business terms are invented or written into the dashboard by this script. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('outputs/Tejas_Revenue_Dashboard_1041_Updated.html','utf8'),defaults=html.match(/<script type="application\/json" id="inputs-default">([\s\S]*?)<\/script>/)[1],noop=()=>{},el={classList:{add:noop,remove:noop},querySelectorAll:()=>[],style:{},dataset:{}};
function load(){const c=vm.createContext({structuredClone,document:{getElementById:id=>id==='inputs-default'?{textContent:defaults}:el,addEventListener:noop},localStorage:{getItem:()=>null,setItem:noop},innerWidth:1384,addEventListener:noop,window:{innerHeight:988},MutationObserver:class{observe(){}}});for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(m[1].replace(/^routeApp\(\);$/m,''),c,{timeout:2500});return s=>JSON.parse(JSON.stringify(vm.runInContext(s,c,{timeout:10000})));}
const run=load(),q=15,before=run(`(()=>{const O=operatingModel(),R=raisePlan();return {O,R,inputs:INP};})()`),O=before.O,R=before.R;
// In a 30-day monthly model, 60 days means the latest TWO months of uncollected
// invoices. The current program substitutes two copies of the closing month.
const current=R.G.K.wc[q],invoices=O.months[46].net+O.months[47].net,opening=before.inputs.valuation.todayMRR*2,expected=invoices-opening;
const diagnosis={unitConvention:'INR crore; monthly schedule; 30 days per model month',sixtyDaysInMonths:60/30,oldFormula:'(quarter-end monthly revenue - opening monthly revenue) * 60 / 30',oldQ16AdditionalReceivables:current,conditionalAllSalesCredit60Days:{augustSales:O.months[46].net,septemberSales:O.months[47].net,closingReceivables:invoices,assumedOpeningReceivables:opening,additionalReceivables:expected,overstatement:current-expected}};
fs.mkdirSync('work/wc-review',{recursive:true});
fs.writeFileSync('work/wc-review/reproduction.json',JSON.stringify(diagnosis,null,2));
console.log(JSON.stringify(diagnosis,null,2));
if(process.argv.includes('--check')){assert.ok(Math.abs(current-expected)<1e-9,`60-day receivables should follow the two-month invoice schedule: actual ${current.toFixed(6)} vs expected ${expected.toFixed(6)}. This checks the existing all-credit assumption only.`);}
// Alternative terms are deliberately scenarios, never silently substituted.
const monthly=s=>O.months.map(r=>r.rows.filter(x=>s==='all'||x.ch===s).reduce((a,x)=>a+x.rev,0)),start={all:before.inputs.valuation.todayMRR,city:O.initial?.net};
const scenario=(name,scope,days)=>{
 const get=load();
 get(`(()=>{const prior=capModel;capModel=function(o={}){const k=prior(o),O=operatingModel(),lag=o.lateQ||0,days=(o.capital||{}).wcDays??${days},base=O.initial.rows.filter(r=>${scope==='all'?'true':`r.ch==='${scope}'`}).reduce((a,r)=>a+r.rev,0),m=O.months.map(r=>r.rows.filter(x=>${scope==='all'?'true':`x.ch==='${scope}'`}).reduce((a,x)=>a+x.rev,0)),series=Array.from({length:Math.ceil(days/30)},()=>base).concat(m);const at=n=>n<0?base:m[n]??base,bal=(end)=>{let x=0,left=days/30;for(let j=end;left>1e-10;j--){const f=Math.min(1,left);x+=f*at(j);left-=f;}return x;};k.wc=k.T.map((_,q)=>bal(q*3+2-lag*3)-base*days/30);k.cum.forEach((c,q)=>c.wc=k.wc[q]);return k;};return true;})()`);
 return get(`(()=>{const R=raisePlan(),G=R.G,ro=roceFin(G);return {name:${JSON.stringify(name)},q16AdditionalReceivables:G.K.wc[15],peakFundingGap:G.peak,peakQuarter:G.peakQ+1,equity:R.equity,rounds:R.rounds.map(r=>({q:r.q+1,amount:r.amt})),cashQ16:R.cash[15],q16ReturnProxyBeforeDep:ro[15].pre*100,quarterRows:G.K.wc.map((v,q)=>({q:q+1,receivables:v,change:G.flows.wc[q],gap:G.gap[q],cash:R.cash[q]}))};})()`);
};
const all=scenario('Conditional: all RT and DD sales collected after 60 days','all',60),dd=scenario('Illustration only: DD 60-day credit; RT collected immediately','dist',60);
diagnosis.scenarios=[all,dd];
fs.writeFileSync('work/wc-review/diagnosis.json',JSON.stringify(diagnosis,null,2));
console.log(JSON.stringify({conditionalScenarios:diagnosis.scenarios.map(({quarterRows,...x})=>x)},null,2));
