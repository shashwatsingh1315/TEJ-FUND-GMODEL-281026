const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch(); const p=await b.newPage();
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+process.argv[2]); await p.waitForTimeout(1500);
 const out=await p.evaluate(()=>{
  const r1=v=>Math.round(v*100)/100, r0=v=>Math.round(v*10)/10;
  const inc=incomeFin(); const pat=inc.Q.map(x=>x.pat); let c=0; const cp=pat.map(v=>c+=v);
  const f0=capFin(); const K0=f0.K;
  const info={cumKeys:Object.keys(K0.cum[0]), rowNames:f0.rows.map(x=>x[0]), incKeys:Object.keys(inc.Q[0]), valuation:INP.valuation, marginKeys:Object.keys(INP.margins), launches:Object.fromEntries(Object.entries(MODEL.products).map(([k,v])=>[k,v.launch]))};
  const buckets=i=>Object.fromEntries(Object.entries(K0.cum[i]).map(([k,v])=>[k,r1(v)]));
  const run=(label,fn)=>{
   const save=JSON.parse(JSON.stringify(INP.capital)); fn(INP.capital);
   const g=capFin(); INP.capital=save;
   const burn=g.K.cum.map(x=>x.loss||0);
   const nd=g.cumTot.map((v,q)=>v-cp[q]);
   const ndx=nd.map((v,q)=>v-burn[q]);
   const pk=a=>{const m=Math.max(...a);return [r0(m),a.indexOf(m)+1]};
   const eng=(a,buf)=>{let raised=40, rounds=[[1,40]]; let t=1, guard=0;
     while(guard++<6){ let bq=-1; for(let q=t;q<=16;q++){ if(raised-a[q-1]<buf){bq=q;break;} } if(bq<0)break;
       const at=Math.max(bq-1,t); const win=a.slice(at-1,Math.min(16,at+7)); const need=Math.max(...win)+buf-raised;
       if(need<=0){t=bq+1;continue;} const size=Math.ceil(need/5)*5; rounds.push([at,size]); raised+=size; t=at+1; }
     return {rounds, totalEq:raised, minCash:r0(Math.min(...a.map(v=>raised-v)))}; };
   return {label,peak:pk(nd),peakX:pk(ndx),q4:r0(nd[3]),q5:r0(nd[4]),q4x:r0(ndx[3]),q5x:r0(ndx[4]),total:r0(g.total),engineX:eng(ndx,10)};
  };
  const results=[run('base 60d',()=>{}),run('cycle 41d',C=>{C.wcDays=41}),run('cycle 33.6d',C=>{C.wcDays=33.6}),run('recv 45d',C=>{C.wcDays=45}),run('recv 90d',C=>{C.wcDays=90}),run('plants +20%',C=>{for(const k of ['tileP5','wood','upvc'])C.capex[k]*=1.2}),run('prebuild 100%',C=>{C.firstPhase=100}),run('prebuild 0%',C=>{C.firstPhase=0})];
  const q5=inc.Q[4];
  return {info,results,cap:[3,4,7,10,15].map(i=>({q:i+1,...buckets(i)})),needBase:f0.cumTot.map((v,q)=>r1(v-cp[q])),needBaseX:f0.cumTot.map((v,q)=>r1(v-(K0.cum[q].loss||0)-cp[q])),patQ:pat.map(r1),cumPat16:r1(cp[15]),q5:{mrr:r1(q5.mrr),arr:r1(q5.arr),cm2P:r1(q5.cm2P),patP:r1(q5.patP)},units:[K0.units[0],K0.units[3],K0.units[4]],m0:r1(K0.m0)};
 });
 console.log(JSON.stringify(out));
 console.log('errors',JSON.stringify(errs));
 await b.close();
})().catch(e=>{console.error('ERR',e.message);process.exit(1)});
