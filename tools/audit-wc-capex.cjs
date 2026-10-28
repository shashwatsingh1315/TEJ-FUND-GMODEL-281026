/* Working-capital and capex review of the live dashboard model.
   Runs the dashboard's own scripts in a Node VM (no browser), then re-runs its raise
   engine with one assumption changed at a time. Nothing in the dashboard is modified:
   the two audit levers (channel-driven WC, plants built ahead of sales) wrap capModel
   inside the VM only.
   Usage: node tools/audit-wc-capex.cjs [dashboard.html]
   Default: workspace-2026-10-28/outputs/Tejas_Revenue_Dashboard_1041_Updated.html */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const file=process.argv[2]||path.join(__dirname,'..','workspace-2026-10-28','outputs','Tejas_Revenue_Dashboard_1041_Updated.html');

function load(f){
 const html=fs.readFileSync(f,'utf8'),defaults=html.match(/<script type="application\/json" id="inputs-default">([\s\S]*?)<\/script>/)[1],noop=()=>{},elements={};
 const el=()=>({innerHTML:'',textContent:'',classList:{add:noop,remove:noop,toggle:noop},querySelectorAll:()=>[],style:{},dataset:{},setAttribute:noop});
 const ctx=vm.createContext({structuredClone,console,document:{getElementById:id=>id==='inputs-default'?{textContent:defaults}:elements[id]??=(el()),addEventListener:noop,querySelector:()=>null},localStorage:{getItem:()=>null,setItem:noop},innerWidth:1384,addEventListener:noop,window:{innerHeight:988},MutationObserver:class{observe(){}},setTimeout:()=>1,clearTimeout:noop,requestAnimationFrame:f=>f()});
 for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(m[1].replace(/^routeApp\(\);$/m,''),ctx,{timeout:3000});
 return s=>vm.runInContext(s,ctx,{timeout:15000});
}
const run=load(file);

/* o.wcMode='channel': WC = stock days on all sales + dealer credit days on dealer-zone (DD) sales − supplier days on cost of goods.
   Defaults are the figures the dashboard itself quotes: ~21 days of stock, ~52 days of dealer credit, direct orders prepaid.
   o.capexLead: plant spend arrives n quarters earlier than the sales it serves (end state held at the Q16 budget). */
run(`
const auditCap=capModel;
capModel=function(o={}){
 const K=auditCap(o),N=K.N,lag=o.lateQ||0;
 if(o.wcMode==='channel'){
  const a={stock:21,credit:52,supplier:0,...(o.wcAssump||{})},dd=view(SCOPE.core,'dist').T,S=operatingModel().S,ddToday=0.41,cogsToday=0.535;
  const ddW=K.T.map((_,q)=>q-lag>=0?dd[q-lag]:K.m0*ddToday),cogs=K.T.map((_,q)=>q-lag>=0?S[q-lag].cogs:K.m0*cogsToday);
  const lvl=(m,d,c)=>12*(m*a.stock+d*a.credit-c*a.supplier)/365,opening=lvl(K.m0,K.m0*ddToday,K.m0*cogsToday);
  K.wcTotal=K.Tw.map((m,q)=>lvl(m,ddW[q],cogs[q]));K.openingWC=opening;K.wc=K.wcTotal.map(v=>v-opening);K.cum.forEach((c,q)=>c.wc=K.wc[q]);
 }
 if(o.capexLead){
  (o.leadKeys||['tileP5','wood','upvc']).forEach(k=>{const s=K.items[k];K.items[k]=s.map((_,q)=>s[Math.min(N-1,q+o.capexLead)]);});
  K.cum.forEach((c,q)=>{c.factory=0;c.pp=0;c.misc=0;CAPEX_ITEMS.forEach(([k,,bk])=>c[bk]+=K.items[k][q]);c.capex=c.factory+c.misc;});
 }
 return K;
};`);

const f1=v=>v.toFixed(1),pad=(s,n)=>String(s).padEnd(n),rs=v=>(v<0?'−₹':'₹')+Math.abs(v).toFixed(1);

/* 1 · the live base case */
const base=run(`(()=>{const R=raisePlan(),G=R.G,K=G.K,c=K.cum[15];return {T:K.T,wcTotal:K.wcTotal,wc:K.wc,opening:K.openingWC,days:K.C.wcDays,
 capex:c.capex,pp:c.pp,peak:G.peak,peakQ:G.peakQ+1,equity:R.equity,rounds:R.rounds.map(r=>'Q'+(r.q+1)+' ₹'+r.amt),minCash:R.minCash,minQ:R.minQ+1,cash16:R.cash[15]};})()`);
console.log('LIVE BASE CASE');
console.log(`  WC rule: ${base.days}/365 of annualised exit-month revenue; opening ₹${f1(base.opening)} Cr treated as already funded`);
console.log(`  Q16: WC ₹${f1(base.wcTotal[15])} Cr (additional ₹${f1(base.wc[15])} Cr) · capex ₹${f1(base.capex)} Cr · intangibles ₹${f1(base.pp)} Cr`);
console.log(`  Peak gap ₹${f1(base.peak)} Cr in Q${base.peakQ} · equity ₹${base.equity} Cr (${base.rounds.join(' + ')}) · lowest cash ₹${f1(base.minCash)} Cr in Q${base.minQ} · cash Q16 ₹${f1(base.cash16)} Cr`);

/* 2 · sensitivities through the dashboard's own raise engine */
const cases=[
 ['Live base: flat 60 days',{}],
 ['Flat 90 days',{capital:{wcDays:90}}],
 ['Flat 45 days',{capital:{wcDays:45}}],
 ['Flat 41 days (file: cash cycle today)',{capital:{wcDays:41}}],
 ['Flat 33.6 days (file: target cycle)',{capital:{wcDays:33.6}}],
 ['Channel: 21d stock + 52d dealer credit',{wcMode:'channel'}],
 ['Channel + 30d supplier credit',{wcMode:'channel',wcAssump:{supplier:30}}],
 ['Channel: 30d stock + 75d dealer credit',{wcMode:'channel',wcAssump:{stock:30,credit:75}}],
 ['Plants built 1Q ahead of sales',{capexLead:1}],
 ['Plants built 2Q ahead of sales',{capexLead:2}],
 ['Plants, centres, labs 2Q ahead',{capexLead:2,leadKeys:['tileP5','wood','upvc','centres','labs']}],
 ['Plants +20%',{plantMult:1.2}],
];
const res=run(`(${JSON.stringify(cases)}).map(([l,o])=>{const R=raisePlan(o),G=R.G,K=G.K;return {l,wc16:K.wcTotal[15],days16:K.wcTotal[15]/(12*K.T[15])*365,cap5:K.cum[4].capex+K.cum[4].pp,peak:G.peak,peakQ:G.peakQ+1,rounds:R.rounds.map(r=>'Q'+(r.q+1)+' '+r.amt).join(' + '),equity:R.equity,minCash:R.minCash};})`);
console.log('\nSENSITIVITIES (same P&L, same raise policy, one input changed)');
console.log('  '+pad('Case',40)+pad('WC Q16',8)+pad('Days',6)+pad('Capex Q5',9)+pad('Peak gap',12)+pad('Equity',8)+pad('Min cash',9)+'Rounds (₹ Cr)');
res.forEach(r=>console.log('  '+pad(r.l,40)+pad(f1(r.wc16),8)+pad(f1(r.days16),6)+pad(f1(r.cap5),9)+pad(f1(r.peak)+' Q'+r.peakQ,12)+pad(r.equity,8)+pad(f1(r.minCash),9)+r.rounds));

const ch=run(`(()=>{const K=capModel({wcMode:'channel'}),dd=view(SCOPE.core,'dist').T;return K.wcTotal.map((w,q)=>[w/(12*K.T[q])*365,dd[q]/K.T[q]*100]);})()`);
console.log('\n  Channel-driven days by quarter (dealer share of revenue): '+ch.map((x,q)=>`Q${q+1} ${f1(x[0])}d (${x[1].toFixed(0)}%)`).join(' · '));

/* 3 · capex sanity: asset turnover, the file's own line economics, headroom at Q16 */
const cx=run(`(()=>{const K=capModel(),X=K.X,M=K.M,T=K.T,I=INP.cash,arr=ks=>12*ks.reduce((s,k)=>s+M[k][15],0),line=I.lineCapacity*1000*I.realisation/1e7;
 return {tile:[X.tileP5,arr(['tile','p5'])],wood:[X.wood,arr(['wood'])],upvc:[X.upvc,arr(['upvc'])],niche:arr(['niche']),line,cost:I.costPerLine,cap:I.lineCapacity,real:I.realisation,
  lines:(M.tile[15]+M.p5[15]+M.niche[15])/line,g16:T[15]/T[14]-1,share:K.sh.upvc[15],mixWU:(M.wood[15]+M.upvc[15])/T[15]};})()`);
console.log('\nCAPEX SANITY AT Q16');
for(const k of ['tile','wood','upvc'])console.log(`  ${pad(k==='tile'?'Tile + waterproofing plant':k==='wood'?'Wood adhesive plant':'uPVC doors/windows/façades',30)} ₹${cx[k][0]} Cr supports ARR ₹${f1(cx[k][1])} Cr → ${f1(cx[k][1]/cx[k][0])}× revenue per ₹ of plant`);
console.log(`  Niche adhesive: ARR ₹${f1(cx.niche)} Cr with no plant line of its own`);
console.log(`  File's own line economics: ${cx.cap} T/month per line × ₹${cx.real}/kg = ₹${cx.line.toFixed(2)} Cr/month per ₹${cx.cost} Cr line (one shift)`);
console.log(`  → tile + waterproofing + niche at Q16 need ~${f1(cx.lines)} lines one shift (₹${f1(cx.lines*cx.cost)} Cr), ~${f1(cx.lines/2)} on two shifts, inside the ₹${cx.tile[0]} Cr budget`);
console.log(`  Revenue still growing ${(cx.g16*100).toFixed(1)}% a quarter at Q16, while every plant reaches exactly its Q16 budget (share ${cx.share.toFixed(2)}): no headroom, no capex after Q16`);

/* 4 · outside WC/capex but in the same cash line: income tax */
const tx=run(`(()=>{const R=raisePlan(),G=R.G,K=G.K,F=INP.funding,rate=0.2517;let cf=0,ct=0;
 const dep=K.cum.map(c=>c.factory/(4*F.lifePlant)+(c.pp+c.misc)/(4*F.lifeOther));
 const tax=G.pat.map((p,q)=>{let b=p-dep[q];if(b<0){cf-=b;return 0;}const u=Math.min(cf,b);cf-=u;return rate*(b-u);}),cum=tax.map(v=>ct+=v),cash=R.cash.map((c,q)=>c-cum[q]);
 return {cum16:cum[15],first:tax.findIndex(v=>v>0)+1,neg:cash.findIndex(v=>v<0)+1,cash16:cash[15],min:Math.min(...cash)};})()`);
console.log('\nINCOME TAX (not in the model; 25.17% on operating profit less depreciation, losses carried forward)');
console.log(`  First tax in Q${tx.first}; ₹${f1(tx.cum16)} Cr paid by Q16. On the live ₹${base.equity} Cr plan, cash goes below zero in Q${tx.neg} and ends Q16 at ${rs(tx.cash16)} Cr`);
