/* Page 03 funding model, 28 Oct 2026 (four rounds).
   Six steps; one money chart (steps 1-4 on a shared 0-based axis, step 3 on its own axis that runs below zero);
   a static right-hand panel that explains the logic (formula, inputs, rules, one fold); three takeaways per step.
   Round 1 = the ask in Q1 (16x today's ARR). Round 2 = fixed amount (round2) at a fixed quarter (round2Q, default Q4).
   Rounds 3 and 4 = US$ amounts (r3Usd, r4Usd) at fixed quarters (r3Q Q8, r4Q Q12), for acquisitions; Rs Cr = $M x fx / 10.
   Rounds 2-4 are priced at roundMult x ARR (12 x quarter-end monthly revenue). All four rounds count in cash and dilution.
   Exit is Q16 at 10x ARR or 100x annual operating profit. The lead investor's cheque (valuation.lead) sits inside round 1.
   Debt stays off and its bar is hidden. */

/* ---------- raise policy: inputs, engine, pricing, exit, notes ---------- */
const pcPolicy=fundPolicy;
fundPolicy=function(o={}){
  const P=pcPolicy(o),F=INP.funding,num=(v,d,lo=0)=>Number.isFinite(+v)&&v!==null&&v!==''&&+v>=lo?+v:d,qi=(v,d)=>{const n=Math.round(+v);return Number.isFinite(n)&&v!==null&&v!==''&&n>=0?Math.min(15,n):d;};
  return {...P,cadenceQ:Math.max(1,Math.min(16,Math.round(num(P.cadenceQ??F.cadenceQ,2,1)))),round2:num(P.round2??F.round2,200),round2Q:qi(P.round2Q??F.round2Q,3),
    r3Q:qi(P.r3Q??F.r3Q,7),r3Usd:num(P.r3Usd??F.r3Usd,50),r4Q:qi(P.r4Q??F.r4Q,11),r4Usd:num(P.r4Usd??F.r4Usd,175),fx:num(P.fx??F.fx,88,1e-9)||88,roundMult:num(P.roundMult??F.roundMult,10,1e-9)||10};
};
/* Four rounds. Round 1 = the ask (Q1). Round 2 = fixed amount at a fixed quarter (round2 = 0 sizes it by the cash rule instead).
   Rounds 3-4 = acquisition rounds in US$. o.rounds (stress runs) overrides the list; the cash rule never moves a round. */
raisePlan=function(o={}){
  const G=gapFin(o),N=G.N,P=fundPolicy(o),D=debtFin(G,P),base=G.gap.map((g,q)=>-g+D.bal[q]-D.cumInt[q]),fx=P.fx;
  const up=x=>Math.max(P.roundTo,Math.ceil(x/P.roundTo-1e-9)*P.roundTo),cl=q=>Math.max(0,Math.min(N-1,q));
  let rounds;
  if(o.rounds)rounds=o.rounds.map((r,i)=>({n:r.n??i+1,q:r.q,amt:r.amt,kind:r.kind||(i===0?'ask':'organic'),...(r.usd!=null?{usd:r.usd}:{})}));
  else{
    const r1={n:1,q:0,amt:P.e1,kind:'ask'},only1=q=>q>=0?P.e1:0;
    /* diagnostic only: what the cash rule alone would ask for round 2 */
    let raw=0,trig=-1,need=0,needQ=-1;
    for(let q=0;q<N;q++)if(only1(q)+base[q]<P.buffer-1e-9){trig=q;break;}
    if(trig>=0){const close=Math.max(trig-P.lead,1);let m=Infinity,t=close;for(let q=close;q<=Math.min(close+P.window-1,N-1);q++){const c=only1(q)+base[q];if(c<m-1e-12){m=c;t=q;}}raw=P.buffer-m;need=-base[t];needQ=t;}
    rounds=[r1,{n:2,q:cl(P.round2Q),amt:P.round2>0?P.round2:(raw>0?up(raw):0),kind:'organic',raw,trigger:trig,need,needQ},
      {n:3,q:cl(P.r3Q),amt:P.r3Usd*fx/10,usd:P.r3Usd,kind:'acq'},{n:4,q:cl(P.r4Q),amt:P.r4Usd*fx/10,usd:P.r4Usd,kind:'acq'}];
  }
  const eqOf=(rs,q)=>sum(rs.filter(r=>r.q<=q).map(r=>r.amt)),eq=q=>eqOf(rounds,q);
  const cash=base.map((v,q)=>eq(q)+v);
  rounds.forEach((r,i)=>{const e=q=>eqOf(rounds.slice(0,i+1),q);r.breach=-1;for(let q=r.q;q<N;q++)if(e(q)+base[q]<P.buffer-1e-9){r.breach=q;break;}r.next=rounds[i+1]?rounds[i+1].q:null;});
  const minCash=Math.min(...cash),minQ=cash.indexOf(minCash);
  const org=rounds.filter(r=>r.kind!=='acq'),oc=base.map((v,q)=>eqOf(org,q)+v),om=Math.min(...oc),acqR=rounds.filter(r=>r.kind==='acq');
  return {G,D,P,N,rounds,base,cash,eq,equity:sum(rounds.map(r=>r.amt)),minCash,minQ,short:cash.map((c,q)=>c<0?q:-1).filter(q=>q>=0),later:[],
    organic:{equity:sum(org.map(r=>r.amt)),cash:oc,minCash:om,minQ:oc.indexOf(om)},acq:{amt:sum(acqR.map(r=>r.amt)),usd:sum(acqR.map(r=>r.usd||0))},fx};
};
/* Round 1 = 16x today's ARR post-money. Rounds 2-4: pre-money = roundMult x ARR at the round's quarter (12 x quarter-end monthly revenue).
   stake = the round-1 holder's stake after the round; stepUp = pre / previous post. over[k] overrides a pre-money (what-if). */
priceRounds=function(R,over){
  const F=INP.funding,T=baseData().V.T,mult=R.P?.roundMult??+F.roundMult??10;let stake=0,prev=null;
  return R.rounds.map((r,k)=>{
    const n=r.n??k+1,kind=r.kind||(k?'organic':'ask');let e;
    if(!k){const arr=INP.valuation.todayMRR*12,post=INP.valuation.multiple*arr,pre=post-r.amt;stake=r.amt/post;
      e={...r,k,n,kind,name:'E1',arr,mArr:INP.valuation.multiple,w:0,marg:null,arrVal:post,patVal:0,pre,post,sold:stake,dil:0,stake,stepUp:null,method:fd(INP.valuation.multiple,0)+'× ARR'};}
    else{const q=r.q,arr=12*T[q],pre=over&&over[k]!=null?over[k]:mult*arr,post=pre+r.amt,dil=r.amt/post;stake*=pre/post;
      e={...r,k,n,kind,name:'E'+(k+1),arr,mArr:mult,w:0,marg:R.G.patMonthly[q]/T[q]*100,arrVal:pre,patVal:0,pre,post,sold:dil,dil,stake,stepUp:pre/prev.post,method:fd(mult,0)+'× ARR'};}
    prev=e;return e;});
};
/* Exit value: 10x ARR (X.mult, 'arr') or the profit multiple x annual operating profit (12 x monthly operating profit, 'pat'). No revenue-vs-plan factor. */
exitEV=function(q,X,R){const F=INP.funding;return Math.max(0,X.m==='pat'?12*R.G.patMonthly[q]*F.multPat:(X.mult??10)*12*baseData().V.T[q]);};
/* capX is a const in the base, so capData is redefined: only the two methods are reachable and the achievement factor is always 1 */
capData=function(){const R=raisePlan(),X={q:A.cap.exitQ,m:A.cap.exitM==='pat'?'pat':'arr',mult:10,ach:1},ret=investorReturn(R,X),B=baseData();return {R,G:R.G,X,ret,pr:ret.pr,B,I:B.I,T:B.V.T,F:B.F};};
investorReturn=function(R,X,over){
  const pr=priceRounds(R,over),q=X.q,stakeAt=t=>{let s=0;pr.forEach(r=>{if(r.q<=t)s=r.stake;});return s;},T=baseData().V.T;
  const s=stakeAt(q),ev=exitEV(q,X,R),cash=R.cash[q],debt=R.D.bal[q],eqv=ev+cash-debt,val=s*eqv,mult=val/pr[0].amt,yrs=(q+1)/4,irr=Math.pow(Math.max(mult,1e-9),1/yrs)-1;
  const growth=12*T[q]/pr[0].arr,mchg=X.m==='pat'?null:(X.mult??10)/pr[0].mArr,kept=s/pr[0].stake,netc=ev>0?eqv/ev:null;
  const eqvAt=t=>exitEV(t,X,R)+R.cash[t]-R.D.bal[t],path=R.cash.map((c,t)=>stakeAt(t)*eqvAt(t));
  /* the lead's cheque is inside round 1: same dilution, scaled by lead / round-1 amount */
  const L=+INP.valuation.lead||0,f=L/pr[0].amt,ls=stakeAt(q)*f,lval=ls*eqv,lm=L>0?lval/L:0;
  const lead={amt:L,stake0:pr[0].stake*f,stake:ls,val:lval,mult:lm,irr:Math.pow(Math.max(lm,1e-9),1/yrs)-1,path:R.cash.map((c,t)=>stakeAt(t)*f*eqvAt(t)),
    marks:pr.filter((r,k)=>k>0&&r.q<=q).map(r=>({k:r.k,n:r.n,q:r.q,post:r.post,stake:r.stake*f,val:r.stake*f*r.post,mult:L>0?r.stake*f*r.post/L:0}))};
  return {pr,s,ev,cash,debt,eqv,val,mult,irr,yrs,growth,mchg,kept,netc,path,lead};
};
RET_M.splice(0,RET_M.length,['arr-10','10× ARR'],['pat',null]);
NOTES[NOTE_FUND-1]='Assumption · funding rounds: round 1 is the ₹40 Cr ask, closed in Q1. Round 2 (₹200 Cr) closes in Q4 and funds organic growth. Round 3 ($50M, Q8) and round 4 ($175M, Q12) are for strategic acquisitions, converted at ₹88 to the dollar; the acquisitions themselves are not modelled, so their cash sits on the balance sheet. All four rounds are counted in cash and in every return shown. Round dates and sizes are placeholders for the founders to set.';
NOTES[NOTE_PRICE-1]='Illustrative round pricing: round 1 uses 16× today’s ARR as post-money. Rounds 2 to 4 are priced at 10× ARR before the money comes in, where ARR is 12 × the quarter-end monthly revenue. Returns count each later round at its own price (pre-money ÷ post-money). Scenario inputs, not verified market valuations or term sheets.';
NOTES[NOTE_RET-1]='Exit is at the end of Q16, valued at 10× ARR or at 100× annual operating profit (12 × the quarter-end monthly operating profit, before tax, interest and depreciation). Exit equity value adds closing cash, including unspent round 3 and 4 money at face value, and subtracts modelled debt. The lead investor’s cheque is part of round 1 and is valued on the same basis.';
{const g=INPUT_SCHEMA.find(x=>x.title==='Funding plan');
 if(g){const at=g.fields.findIndex(f=>f[0]==='funding.window')+1;
  g.fields=g.fields.filter(f=>f[0]!=='funding.cadenceQ');
  g.fields.splice(at,0,['funding.round2','Round 2 amount','₹ Cr · organic growth · 0 = size it by the cash rule'],['funding.round2Q','Round 2 quarter','quarter index, 0-based · 0 = Q1, 3 = Q4'],
   ['funding.r3Q','Round 3 quarter','quarter index, 0-based · 7 = Q8'],['funding.r3Usd','Round 3 amount','US$ M · acquisitions'],['funding.r4Q','Round 4 quarter','quarter index, 0-based · 11 = Q12'],['funding.r4Usd','Round 4 amount','US$ M · acquisitions'],
   ['funding.fx','Rupees per US$','₹ per $ · ₹ Cr = $M × this ÷ 10'],['funding.roundMult','Round 2-4 ARR multiple','× ARR at the round’s quarter (pre-money)']);
  g.intro='Equity policy and illustrative loan terms. Round 1 is the ask in Valuation; round 2 is a fixed amount at a fixed quarter; rounds 3 and 4 are in US$ for acquisitions. All four rounds count in cash and in the valuation. Debt is off in this plan. Working capital uses days / 365 of annualised revenue.';}
 /* the exit group: the ARR multiple per quarter and the profit blend are gone (rounds 2-4 use funding.roundMult, the exit is 10x ARR or multPat x profit) */
 const h=INPUT_SCHEMA.find(x=>x.title==='Later-round valuation');
 if(h){h.fields=h.fields.filter(f=>!['funding.multQ4','funding.multQ8','funding.multQ16','funding.blendLo','funding.blendHi'].includes(f[0]));
  const m=h.fields.find(f=>f[0]==='funding.multPat');if(m){m[1]='Exit profit multiple';m[2]='× annual operating profit at the Q16 exit';}
  h.title='Exit multiple and depreciation';h.intro='The Q16 exit is valued at 10× ARR or at this multiple of annual operating profit. Rounds 2 to 4 are priced at the round ARR multiple under Funding plan. Keep depreciation lives under capital-return assumptions.';}
 const v=INPUT_SCHEMA.find(x=>x.title==='First-round assumptions');if(v&&!v.fields.some(f=>f[0]==='valuation.lead'))v.fields.push(['valuation.lead','Lead investor cheque','₹ Cr · inside the ask']);}
const pcInput=onInput;
onInput=function(el){const p=el.dataset.input,v=Number(el.value);
  const bad=m=>{el.setCustomValidity?.(m);},blank=el.value.trim()==='',F=INP.funding;
  if(['funding.round2Q','funding.r3Q','funding.r4Q'].includes(p)){
    if(blank||!Number.isInteger(v)||v<0||v>15){bad('Enter a quarter index from 0 (Q1) to 15 (Q16).');return;}
    const q2=p==='funding.round2Q'?v:+F.round2Q,q3=p==='funding.r3Q'?v:+F.r3Q,q4=p==='funding.r4Q'?v:+F.r4Q;
    if(q2>q3||q3>q4){bad('Rounds 2, 3 and 4 must close in that order: round 2 quarter ≤ round 3 quarter ≤ round 4 quarter.');return;}}
  if(p==='funding.round2'&&(blank||!Number.isFinite(v)||v<0)){bad('Enter an amount of 0 or more.');return;}
  if(['funding.r3Usd','funding.r4Usd'].includes(p)&&(blank||!Number.isFinite(v)||v<0)){bad('Enter an amount in US$ M, 0 or more.');return;}
  if(['funding.fx','funding.roundMult','funding.multPat'].includes(p)&&(blank||!Number.isFinite(v)||v<=0)){bad('Enter a number above 0.');return;}
  if(p==='valuation.lead'&&(blank||!Number.isFinite(v)||v<0||v>+INP.valuation.ask)){bad('Enter the lead’s cheque: 0 up to the round 1 ask.');return;}
  if(p==='valuation.ask'&&Number.isFinite(v)&&v>=0&&v<+INP.valuation.lead){bad('The ask cannot be below the lead’s cheque.');return;}
  pcInput(el);
  /* the base check gives one generic message; name the rule this field broke instead */
  if(el.validationMessage==='Enter a number of 0 or more.'){const q=['funding.tenor','funding.window'].includes(p),n=['funding.moratorium','funding.lead'].includes(p),pct=p==='capital.firstPhase'||p.startsWith('operating.products.'),pos=['funding.roundTo','funding.lifePlant','funding.lifeOther','valuation.todayMRR','valuation.multiple'].includes(p);
    el.setCustomValidity?.(q?'Enter at least 1 whole quarter.':n?'Enter a whole number of quarters, 0 or more.':pct?'Enter a percentage from 0 to 100.':pos?'Enter a number above 0.':p.startsWith('operating.anchors.')?'Enter anchors that increase from left to right.':p.startsWith('funding.blend')?'Enter a blend range where the low end is below the high end.':'Enter a number of 0 or more.');}};
