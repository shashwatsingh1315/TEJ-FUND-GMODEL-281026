/* Independent check of the whole-phase capex layer. Re-derives every item's phases from the
   inputs (not from the layer's own functions), reconciles each quarter with the dashboard, and
   runs the stress cases, debt modes and the page-03 / Edit-inputs renderers.
   Run from workspace-2026-10-28: node work/verify-step-capex.cjs */
const assert=require('node:assert/strict'),load=require('./load-dashboard.cjs');
const {run}=load();let checks=0;
const near=(a,b,l,tol=1e-9)=>{assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol,`${l}: ${a} ≠ ${b}`);checks++;};
const ok=(c,l)=>{assert.ok(c,l);checks++;};
const sum=a=>a.reduce((s,v)=>s+v,0);

const src=JSON.parse(JSON.stringify(run(`(()=>{const V=view(SCOPE.core);let u=4;const units=V.T.map((_,q)=>u+=UNIT_TYPES.reduce((s,t)=>s+MODEL.openings[t.id][q],0));
 return {T:V.T,M:V.M,units,live:MODEL.live,ramp:MODEL.ramp.med,launch:Object.fromEntries(Object.entries(MODEL.products).map(([k,v])=>[k,v.launch])),C:INP.capital,m0:INP.valuation.todayMRR};})()`)));

/* the rule, written out again from its definition */
function derive(C,mult=1){
 const X={...C.capex};['tileP5','wood','upvc'].forEach(k=>X[k]*=mult);
 const N=16,lead=C.leadQ,f=C.firstPhase/100,tile0=sum(src.live.map(l=>l.market))*src.ramp[5];
 const costs=k=>{const n=k==='centres'?C.centresN:C.phases[k];if((k==='wood'||k==='upvc')&&f>0&&n>1&&f<1)return [X[k]*f,...Array(n-1).fill(X[k]*(1-f)/(n-1))];if((k==='wood'||k==='upvc')&&f>=1)return [X[k]];return Array(n).fill(X[k]/n);};
 const build=(cs,D,ld)=>{const top=D[N-1],B=sum(cs);const out=[];for(let q=0;q<N;q++){const need=D[Math.min(N-1,q+ld)];let j=0,acc=0;while(j<cs.length&&need>acc/B*top+1e-9){acc+=cs[j];j++;}out.push(q===N-1?B:acc);}for(let q=1;q<N;q++)out[q]=Math.max(out[q],out[q-1]);return out;};
 const T=src.T,M=src.M,D={tileP5:T.map((_,q)=>Math.max(0,M.tile[q]+M.p5[q]-tile0)),wood:M.wood,upvc:M.upvc,centres:src.units.map(u=>Math.max(0,u-4)),systems:T.map(v=>Math.max(0,v-src.m0))};D.misc=D.systems;
 const it={};['tileP5','wood','upvc','centres','systems','misc'].forEach(k=>it[k]=build(costs(k),D[k],lead));
 it.labs=build(costs('labs'),T.map((_,q)=>it.tileP5[q]+it.wood[q]+it.upvc[q]),0);
 return {it,costs,D};
}

const K=JSON.parse(JSON.stringify(run(`(()=>{const K=capModel();return {items:K.items,cum:K.cum,leadQ:K.leadQ,steps:K.steps};})()`)));
const ref=derive(src.C),keys=Object.keys(ref.it);
for(const k of keys)for(let q=0;q<16;q++)near(K.items[k][q],ref.it[k][q],`${k} Q${q+1}`);
/* fixed end state, whole phases, never falling, capacity ahead of demand */
for(const k of keys){
 near(K.items[k][15],src.C.capex[k],`${k} reaches its fixed Q16 budget`);
 const cs=ref.costs(k);
 for(let q=0;q<16;q++){const add=K.items[k][q]-(q?K.items[k][q-1]:0);ok(add>=-1e-12,`${k} Q${q+1} never falls`);
  let left=add;const steps=K.steps[k].buys.filter(b=>b.q===q);left-=sum(steps.map(b=>b.cost));near(left,0,`${k} Q${q+1} is whole phases`,1e-9);}
}
for(const k of ['tileP5','wood','upvc','centres','systems','misc']){const top=ref.D[k][15],B=src.C.capex[k];
 for(let q=0;q<16;q++){const need=ref.D[k][Math.min(15,q+K.leadQ)];ok(K.items[k][q]/B*top>=need-1e-9,`${k} Q${q+1} capacity covers demand ${K.leadQ} quarter ahead`);}}
for(const k of ['wood','upvc']){const fq=src.launch[k]-2;near(K.items[k][fq],src.C.capex[k]*src.C.firstPhase/100,`${k} first phase the quarter before launch`);near(fq?K.items[k][fq-1]:0,0,`${k} nothing before its first phase`);}
/* capex buckets and the gap still reconcile */
const G=JSON.parse(JSON.stringify(run(`(()=>{const G=gapFin();return {cum:G.K.cum,capx:G.capx,cumPat:G.cumPat,gap:G.gap};})()`)));
for(let q=0;q<16;q++){const c=G.cum[q];near(c.capex,K.items.tileP5[q]+K.items.wood[q]+K.items.upvc[q]+K.items.centres[q]+K.items.misc[q],`capex bucket Q${q+1}`);near(c.pp,K.items.labs[q]+K.items.systems[q],`intangibles bucket Q${q+1}`);near(G.gap[q],G.capx[q]-G.cumPat[q],`gap Q${q+1}`);}
near(sum(keys.map(k=>K.items[k][15])),170,'total capex + intangibles to Q16 stays ₹170 Cr');

/* stresses, other phase settings and debt modes: totals fixed, no gaps in the arithmetic */
const variants=[['plants +20%',{plantMult:1.2},1.2],['first phase 100%',{capital:{firstPhase:100}}],['equal phases',{capital:{firstPhase:0}}],['paid 2 quarters ahead',{capital:{leadQ:2}}],['paid in the quarter needed',{capital:{leadQ:0}}],['revenue two quarters late',{lateQ:2}],['one phase each',{capital:{phases:{tileP5:1,wood:1,upvc:1,labs:1,systems:1,misc:1},centresN:1}}]];
for(const [l,o,mult=1] of variants){
 const r=JSON.parse(JSON.stringify(run(`(()=>{const R=raisePlan(${JSON.stringify(o)});return {items:R.G.K.items,equity:R.equity,cash:R.cash};})()`)));
 const C={...src.C,...(o.capital||{})};if(o.capital&&o.capital.phases)C.phases={...src.C.phases,...o.capital.phases};
 const d=derive(C,mult);for(const k of keys)for(let q=0;q<16;q++)near(r.items[k][q],d.it[k][q],`${l}: ${k} Q${q+1}`);
 near(sum(keys.map(k=>r.items[k][15])),170+50*(mult-1)*120/50,`${l}: fixed total`,1e-6);ok(r.cash.every(Number.isFinite)&&Number.isFinite(r.equity),`${l}: cash path is finite`);
}
for(const mode of ['none','wc','plant','both']){const r=run(`(()=>{setFinanceMode('${mode}',50);const R=raisePlan();return [R.equity,R.D.bal[15],R.cash.every(Number.isFinite)];})()`);ok(r[2]&&Number.isFinite(r[0])&&Number.isFinite(r[1]),`debt mode ${mode} runs`);}
run(`setFinanceMode('none',50)`);

/* renderers: page 03 growth-spending panel for every quarter, stress list, Edit inputs */
for(let q=0;q<16;q++){const h=run(`(()=>{A.cap.selQ=${q};const D=capData();return CX.spend(D).body;})()`);ok(h.includes(`Capex bought in Q${q+1}`)&&h.includes('Phases to Q16')&&!/NaN|undefined/.test(h),`page 03 spend panel Q${q+1}`);}
const inputs=run(`capitalInputs(f=>'<i data-f="'+f[0]+'"></i>')`);ok(inputs.includes('data-input="capital.phases.tileP5"')&&inputs.includes('capital.leadQ')&&inputs.includes('Product and income-stream margins')&&inputs.includes('Common monthly overhead anchors')&&(inputs.match(/Cost of revenue · capex/g)||[]).length===1&&!inputs.includes('in step with what it is built with')&&!/NaN|undefined/.test(inputs),'Edit inputs: capex panel replaced, other panels kept');
ok(run(`stressCases().find(c=>c.k==='pre0').label`)==='Wood and uPVC in equal phases','stress label for equal phases');

/* schedule and funding, for the record */
const R=JSON.parse(JSON.stringify(run(`(()=>{const R=raisePlan(),G=R.G;return {rounds:R.rounds.map(r=>'Q'+(r.q+1)+' ₹'+r.amt+' Cr').join(' + '),equity:R.equity,peak:G.peak,peakQ:G.peakQ+1,minCash:R.minCash,minQ:R.minQ+1};})()`)));
console.log(`All ${checks} checks passed.`);
console.log('Capex + intangibles bought per quarter, ₹ Cr: '+Array.from({length:16},(_,q)=>`Q${q+1} ${sum(keys.map(k=>K.items[k][q]-(q?K.items[k][q-1]:0))).toFixed(2)}`).join(' · '));
console.log(`Funding (60-day WC, no debt): equity ₹${R.equity} Cr (${R.rounds}) · peak gap ₹${R.peak.toFixed(1)} Cr in Q${R.peakQ} · lowest cash ₹${R.minCash.toFixed(1)} Cr in Q${R.minQ}`);
