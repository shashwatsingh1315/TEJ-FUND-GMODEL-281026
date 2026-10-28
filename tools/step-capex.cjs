/* Step-based capex for the Tejas model, compared with the live smooth spread.
   Each asset is bought in whole steps. A step is paid `lead` quarters before the demand it serves:
     capacity per step  = demand at Q16 ÷ number of steps        (the spec budget still buys exactly Q16 demand)
     steps in place (q) = ceil( demand(q + lead) ÷ capacity per step ), never falling
     spend (q)          = new steps in q × budget ÷ number of steps
   Results are run through the dashboard's own raise engine (60-day WC, same P&L, same policy).
   Usage: node tools/step-capex.cjs [dashboard.html]  ·  edit PLAN below to change the steps. */
const load=require('./load-dashboard.cjs');
const run=load(process.argv[2]);

/* PLACEHOLDERS, except centres (spec: 20 centres for ₹10 Cr). Budgets are the spec's end states.
   driver: what the asset's capacity is measured in
     tileP5 · tile + waterproofing sales above today's (today's plant taken as full)
     wood, upvc · that line's sales   units · cities + dealer zones opened after today's 4
     plants · plant capacity already bought (labs come with plant phases)   mrr · MRR above today's */
const PLAN={
 tileP5: {label:'Tile + waterproofing plant',budget:40,steps:4, lead:1,driver:'tileP5'},
 wood:   {label:'Wood adhesive plant',       budget:30,steps:3, lead:1,driver:'wood'},
 upvc:   {label:'uPVC plant',                budget:50,steps:5, lead:1,driver:'upvc'},
 centres:{label:'Experience centres',        budget:10,steps:20,lead:1,driver:'units'},
 labs:   {label:'Labs',                      budget:10,steps:4, lead:0,driver:'plants'},
 systems:{label:'Systems',                   budget:20,steps:4, lead:1,driver:'mrr'},
 misc:   {label:'Misc capex',                budget:10,steps:4, lead:1,driver:'mrr'},
};

const base=run(`(()=>{const K=capModel(),M=K.M,T=K.T,cityT=view(SCOPE.core,'city').T;
 return {T,tp:T.map((_,q)=>M.tile[q]+M.p5[q]-K.tile0),wood:M.wood,upvc:M.upvc,units:K.units.map(u=>u-4),mrr:T.map(v=>v-K.m0),
  smooth:K.items,cityT,storeL:INP.cash.storeThroughput,godown:operatingModel().S.map(s=>s.overhead.by.godown)};})()`);
const N=16,sum=a=>a.reduce((s,v)=>s+v,0);

function steps(plan){
 const demand={tileP5:base.tp,wood:base.wood,upvc:base.upvc,units:base.units,mrr:base.mrr},out={},events=[];
 const build=(k,D)=>{const p=plan[k],cap=D[N-1]/p.steps,cost=p.budget/p.steps;let have=0;const cum=[];
  for(let q=0;q<N;q++){const need=Math.min(p.steps,Math.max(0,Math.ceil(D[Math.min(N-1,q+p.lead)]/cap-1e-9))),add=Math.max(0,need-have);
   if(add)events.push({q,k,add,from:have,cost:add*cost});have+=add;cum.push(have*cost);}
  out[k]=cum;};
 ['tileP5','wood','upvc','centres','systems','misc'].forEach(k=>build(k,demand[plan[k].driver]));
 demand.plants=Array.from({length:N},(_,q)=>out.tileP5[q]+out.wood[q]+out.upvc[q]);build('labs',demand.plants);
 return {items:out,events};
}

/* replace the live capex items with a given set inside the dashboard, then run its raise engine */
run(`const stepBaseCap=capModel;capModel=function(o={}){const K=stepBaseCap(o);if(o.items){K.items=o.items;
 K.cum.forEach((c,q)=>{c.factory=0;c.pp=0;c.misc=0;CAPEX_ITEMS.forEach(([k,,bk])=>c[bk]+=K.items[k][q]);c.capex=c.factory+c.misc;});}return K;};`);
const fund=items=>run(`(()=>{const R=raisePlan(${items?`{items:${JSON.stringify(items)}}`:''}),G=R.G;
 return {peak:G.peak,peakQ:G.peakQ+1,equity:R.equity,rounds:R.rounds.map(r=>'Q'+(r.q+1)+' '+r.amt).join(' + '),minCash:R.minCash,minQ:R.minQ+1};})()`);

const f2=v=>v.toFixed(2),f1=v=>v.toFixed(1),pad=(s,n)=>String(s).padEnd(n),keys=Object.keys(PLAN);
const S=steps(PLAN),flow=(a,q)=>a[q]-(q?a[q-1]:0);

console.log('STEP PLAN (placeholders except centres)');
keys.forEach(k=>{const p=PLAN[k];console.log(`  ${pad(p.label,28)} ₹${p.budget} Cr = ${p.steps} × ₹${f2(p.budget/p.steps)} Cr · paid ${p.lead} qtr ahead · sized on ${p.driver}`);});

console.log('\nWHEN EACH STEP IS BOUGHT');
for(let q=0;q<N;q++){const ev=S.events.filter(e=>e.q===q);if(ev.length)console.log(`  Q${q+1}: `+ev.map(e=>`${PLAN[e.k].label} ${e.add>1?`steps ${e.from+1}–${e.from+e.add}`:`step ${e.from+1}`} ₹${f2(e.cost)}`).join(' · '));}

console.log('\nCAPEX BY QUARTER, ₹ Cr: step plan (live smooth spread in brackets)');
console.log('  '+pad('Qtr',5)+keys.map(k=>pad(k,15)).join('')+'Total');
for(let q=0;q<N;q++)console.log('  '+pad('Q'+(q+1),5)+keys.map(k=>pad(`${f2(flow(S.items[k],q))} (${f2(flow(base.smooth[k],q))})`,15)).join('')+`${f2(sum(keys.map(k=>flow(S.items[k],q))))} (${f2(sum(keys.map(k=>flow(base.smooth[k],q))))})`);
console.log('  '+pad('Sum',5)+keys.map(k=>pad(f2(S.items[k][N-1]),15)).join('')+f2(sum(keys.map(k=>S.items[k][N-1]))));

const cases=[['Live: smooth spread',null],['Steps as above',S.items],
 ['Steps, plants paid 2 qtrs ahead',steps({...PLAN,tileP5:{...PLAN.tileP5,lead:2},wood:{...PLAN.wood,lead:2},upvc:{...PLAN.upvc,lead:2}}).items],
 ['Half as many steps (bigger phases)',steps(Object.fromEntries(keys.map(k=>[k,{...PLAN[k],steps:k==='centres'?20:Math.max(1,Math.round(PLAN[k].steps/2))}]))).items],
 ['Twice as many steps (smaller phases)',steps(Object.fromEntries(keys.map(k=>[k,{...PLAN[k],steps:k==='centres'?20:PLAN[k].steps*2}]))).items]];
console.log('\nFUNDING EFFECT (60-day WC, same P&L, same raise policy)');
console.log('  '+pad('Case',38)+pad('Capex Q1–Q5',13)+pad('Peak gap',13)+pad('Equity',8)+'Rounds (₹ Cr)');
cases.forEach(([l,items])=>{const r=fund(items),it=items||base.smooth;console.log('  '+pad(l,38)+pad(f1(sum(keys.map(k=>it[k][4]))),13)+pad(`${f1(r.peak)} Q${r.peakQ}`,13)+pad(r.equity,8)+r.rounds);});

const tp=base.storeL/100,stores=base.cityT.map(v=>Math.ceil(v/tp-1e-9));
console.log(`\nDISTRIBUTION POINTS: not in capex anywhere in the live model`);
console.log(`  The file's dark-store figure (₹${base.storeL} L a month through each store) applied to city revenue gives stores open at quarter end:`);
console.log('  '+stores.map((s,q)=>`Q${q+1} ${s}`).join(' · '));
console.log(`  Their rent sits in operating cost ("Godown rent and expenses": ₹${f2(base.godown[0]*100)} L a month at Q1, ₹${f2(base.godown[N-1]*100)} L at Q16). Set-up cost per store and any dealer-zone depots are not modelled.`);
