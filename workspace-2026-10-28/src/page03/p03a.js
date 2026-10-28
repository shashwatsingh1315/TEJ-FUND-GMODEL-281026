/* Page 03 funding model, 28 Oct 2026 (four rounds).
   Six steps; one money chart (steps 1-4 on a shared 0-based axis, step 3 on its own axis that runs below zero);
   a static right-hand panel that explains the logic (formula, inputs, rules, one fold); three takeaways per step.
   Round 1 = the ask in Q1. Round 2 = fixed amount (round2) at a fixed quarter (round2Q, default Q6).
   Rounds 3 and 4 = Rs Cr amounts (r3, r4) at fixed quarters (r3Q Q10, r4Q Q15), organic growth & acquisition.
   Round 1 is set at valuation.r1Post (Rs 300 Cr post-money; 0 = price it at the multiple). Rounds 2-4 are priced at valuation.multiple x ARR, post-money (12 x quarter-end monthly revenue). All four rounds count in cash and dilution.
   Exit is Q16 at the round ARR multiple (12x by default) or 100x annual operating profit. The lead investor's cheque (valuation.lead) sits inside round 1.
   Debt stays off and its bar is hidden. */

/* ---------- raise policy: inputs, engine, pricing, exit, notes ---------- */
const pcPolicy=fundPolicy;
fundPolicy=function(o={}){
  const P=pcPolicy(o),F=INP.funding,num=(v,d,lo=0)=>Number.isFinite(+v)&&v!==null&&v!==''&&+v>=lo?+v:d,qi=(v,d)=>{const n=Math.round(+v);return Number.isFinite(n)&&v!==null&&v!==''&&n>=0?Math.min(15,n):d;};
  return {...P,cadenceQ:Math.max(1,Math.min(16,Math.round(num(P.cadenceQ??F.cadenceQ,2,1)))),round2:num(P.round2??F.round2,200),round2Q:qi(P.round2Q??F.round2Q,5),
    r3Q:qi(P.r3Q??F.r3Q,9),r3:num(P.r3??F.r3,500),r4Q:qi(P.r4Q??F.r4Q,14),r4:num(P.r4??F.r4,1750)};
};
/* Four rounds. Round 1 = the ask (Q1). Round 2 = fixed amount at a fixed quarter (round2 = 0 sizes it by the cash rule instead).
   Rounds 3-4 = organic growth & acquisition rounds in Rs Cr. o.rounds (stress runs) overrides the list; the cash rule never moves a round. */
raisePlan=function(o={}){
  const G=gapFin(o),N=G.N,P=fundPolicy(o),D=debtFin(G,P),base=G.gap.map((g,q)=>-g+D.bal[q]-D.cumInt[q]);
  const up=x=>Math.max(P.roundTo,Math.ceil(x/P.roundTo-1e-9)*P.roundTo),cl=q=>Math.max(0,Math.min(N-1,q));
  let rounds;
  if(o.rounds)rounds=o.rounds.map((r,i)=>({n:r.n??i+1,q:r.q,amt:r.amt,kind:r.kind||(i===0?'ask':'organic')}));
  else{
    const r1={n:1,q:0,amt:P.e1,kind:'ask'},only1=q=>q>=0?P.e1:0;
    /* diagnostic only: what the cash rule alone would ask for round 2 */
    let raw=0,trig=-1,need=0,needQ=-1;
    for(let q=0;q<N;q++)if(only1(q)+base[q]<P.buffer-1e-9){trig=q;break;}
    if(trig>=0){const close=Math.max(trig-P.lead,1);let m=Infinity,t=close;for(let q=close;q<=Math.min(close+P.window-1,N-1);q++){const c=only1(q)+base[q];if(c<m-1e-12){m=c;t=q;}}raw=P.buffer-m;need=-base[t];needQ=t;}
    rounds=[r1,{n:2,q:cl(P.round2Q),amt:P.round2>0?P.round2:(raw>0?up(raw):0),kind:'organic',raw,trigger:trig,need,needQ},
      {n:3,q:cl(P.r3Q),amt:P.r3,kind:'acq'},{n:4,q:cl(P.r4Q),amt:P.r4,kind:'acq'}];
  }
  const eqOf=(rs,q)=>sum(rs.filter(r=>r.q<=q).map(r=>r.amt)),eq=q=>eqOf(rounds,q);
  const cash=base.map((v,q)=>eq(q)+v);
  rounds.forEach((r,i)=>{const e=q=>eqOf(rounds.slice(0,i+1),q);r.breach=-1;for(let q=r.q;q<N;q++)if(e(q)+base[q]<P.buffer-1e-9){r.breach=q;break;}r.next=rounds[i+1]?rounds[i+1].q:null;});
  const minCash=Math.min(...cash),minQ=cash.indexOf(minCash);
  const org=rounds.filter(r=>r.kind!=='acq'),oc=base.map((v,q)=>eqOf(org,q)+v),om=Math.min(...oc),acqR=rounds.filter(r=>r.kind==='acq');
  return {G,D,P,N,rounds,base,cash,eq,equity:sum(rounds.map(r=>r.amt)),minCash,minQ,short:cash.map((c,q)=>c<0?q:-1).filter(q=>q>=0),later:[],
    organic:{equity:sum(org.map(r=>r.amt)),cash:oc,minCash:om,minQ:oc.indexOf(om)},acq:{amt:sum(acqR.map(r=>r.amt))}};
};
/* Round 1 is set at valuation.r1Post post-money (0 or blank = multiple x today's ARR, 12 x todayMRR); mArr = post / ARR. Rounds 2-4 are priced at valuation.multiple x ARR, post-money, on 12 x the quarter-end monthly revenue.
   pre = post - amount. stake = the round-1 holder's stake after the round; stepUp = post / previous post; arrUp = arr / previous arr (they differ for round 2 because round 1 is not on the multiple).
   over[k] overrides a pre-money (what-if), then post = pre + amount. */
priceRounds=function(R,over){
  const T=baseData().V.T,mult=+INP.valuation.multiple;let stake=0,prev=null;
  return R.rounds.map((r,k)=>{
    const n=r.n??k+1,kind=r.kind||(k?'organic':'ask');let e;
    if(!k){const arr=INP.valuation.todayMRR*12,r1=+INP.valuation.r1Post||0,post=r1>0?r1:mult*arr,pre=over&&over[0]!=null?over[0]:post-r.amt,pst=pre+r.amt;stake=r.amt/pst;
      e={...r,k,n,kind,name:'E1',arr,mArr:pst/arr,w:0,marg:null,arrVal:pst,patVal:0,pre,post:pst,sold:stake,dil:0,stake,stepUp:null,arrUp:null,method:r1>0?'₹'+fd(post,0)+' Cr set':fd(mult,0)+'× ARR'};}
    else{const q=r.q,arr=12*T[q],pre=over&&over[k]!=null?over[k]:mult*arr-r.amt,post=pre+r.amt,dil=r.amt/post;stake*=pre/post;
      e={...r,k,n,kind,name:'E'+(k+1),arr,mArr:mult,w:0,marg:R.G.patMonthly[q]/T[q]*100,arrVal:post,patVal:0,pre,post,sold:dil,dil,stake,stepUp:post/prev.post,arrUp:arr/prev.arr,method:fd(mult,0)+'× ARR'};}
    prev=e;return e;});
};
/* Exit value: the round ARR multiple (INP.valuation.multiple, 12x by default; X.mult, 'arr') or the profit multiple x annual operating profit (12 x monthly operating profit, 'pat'). No revenue-vs-plan factor. */
exitEV=function(q,X,R){const F=INP.funding;return Math.max(0,X.m==='pat'?12*R.G.patMonthly[q]*F.multPat:(X.mult??+INP.valuation.multiple)*12*baseData().V.T[q]);};
/* capX is a const in the base, so capData is redefined: only the two methods are reachable and the achievement factor is always 1 */
capData=function(){const R=raisePlan(),X={q:A.cap.exitQ,m:A.cap.exitM==='pat'?'pat':'arr',mult:+INP.valuation.multiple,ach:1},ret=investorReturn(R,X),B=baseData();return {R,G:R.G,X,ret,pr:ret.pr,B,I:B.I,T:B.V.T,F:B.F};};
investorReturn=function(R,X,over){
  const pr=priceRounds(R,over),q=X.q,stakeAt=t=>{let s=0;pr.forEach(r=>{if(r.q<=t)s=r.stake;});return s;},T=baseData().V.T;
  const s=stakeAt(q),ev=exitEV(q,X,R),cash=R.cash[q],debt=R.D.bal[q],eqv=ev+cash-debt,val=s*eqv,mult=val/pr[0].amt,yrs=(q+1)/4,irr=Math.pow(Math.max(mult,1e-9),1/yrs)-1;
  const growth=12*T[q]/pr[0].arr,mchg=X.m==='pat'?null:(X.mult??+INP.valuation.multiple)/pr[0].mArr,kept=s/pr[0].stake,netc=ev>0?eqv/ev:null;
  const eqvAt=t=>exitEV(t,X,R)+R.cash[t]-R.D.bal[t],path=R.cash.map((c,t)=>stakeAt(t)*eqvAt(t));
  /* the lead's cheque is inside round 1: same dilution, scaled by lead / round-1 amount */
  const L=+INP.valuation.lead||0,f=L/pr[0].amt,ls=stakeAt(q)*f,lval=ls*eqv,lm=L>0?lval/L:0;
  const lead={amt:L,stake0:pr[0].stake*f,stake:ls,val:lval,mult:lm,irr:Math.pow(Math.max(lm,1e-9),1/yrs)-1,path:R.cash.map((c,t)=>stakeAt(t)*f*eqvAt(t)),
    marks:pr.filter((r,k)=>k>0&&r.q<=q).map(r=>({k:r.k,n:r.n,q:r.q,post:r.post,stake:r.stake*f,val:r.stake*f*r.post,mult:L>0?r.stake*f*r.post/L:0}))};
  return {pr,s,ev,cash,debt,eqv,val,mult,irr,yrs,growth,mchg,kept,netc,path,lead};
};
RET_M.splice(0,RET_M.length,['arr',null],['pat',null]);
NOTES[NOTE_FUND-1]='Assumption · funding rounds: round 1 is the ₹40 Cr ask, closed in Q1. Round 2 (₹200 Cr) closes in Q6 and funds organic growth. Round 3 (₹500 Cr, Q10) and round 4 (₹1,750 Cr, Q15) are for organic growth & acquisition; the acquisitions themselves are not modelled, so their cash sits on the balance sheet. All four rounds are counted in cash and in every return shown. Round dates and sizes are placeholders for the founders to set.';
NOTES[NOTE_PRICE-1]='Illustrative round pricing: round 1 is set at ₹300 Cr post-money (about 15.6× today’s ARR). Rounds 2 to 4 are priced at 12× ARR post-money, where ARR is 12 × the quarter-end monthly revenue, so from round 2 the valuation rises in step with ARR. Returns count each later round at its own price (pre-money ÷ post-money). Scenario inputs, not verified market valuations or term sheets.';
NOTES[NOTE_RET-1]='Exit is at the end of Q16, valued at 12× ARR (the same multiple as the funding rounds) or at 100× annual operating profit (12 × the quarter-end monthly operating profit, before tax, interest and depreciation). Exit equity value adds closing cash, including unspent round 3 and 4 money at face value, and subtracts modelled debt. The lead investor’s cheque is part of round 1 and is valued on the same basis.';
{const g=INPUT_SCHEMA.find(x=>x.title==='Funding plan');
 if(g){const at=g.fields.findIndex(f=>f[0]==='funding.window')+1;
  g.fields=g.fields.filter(f=>f[0]!=='funding.cadenceQ');
  g.fields.splice(at,0,['funding.round2','Round 2 amount','₹ Cr · organic growth · 0 = size it by the cash rule'],['funding.round2Q','Round 2 quarter','quarter index, 0-based · 0 = Q1, 5 = Q6'],
   ['funding.r3Q','Round 3 quarter','quarter index, 0-based · 9 = Q10'],['funding.r3','Round 3 amount','₹ Cr · organic growth & acquisition'],['funding.r4Q','Round 4 quarter','quarter index, 0-based · 14 = Q15'],['funding.r4','Round 4 amount','₹ Cr · organic growth & acquisition']);
  g.intro='Equity policy and illustrative loan terms. Round 1 is the ask in Valuation; rounds 2 to 4 are fixed amounts at fixed quarters. Round 1 is set at its own post-money (Valuation › Round 1 post-money); rounds 2 to 4 are priced at the ARR multiple, post-money. All four rounds count in cash and in the valuation. Debt is off in this plan. Working capital uses days / 365 of annualised revenue.';}
 /* the exit group: the ARR multiple per quarter and the profit blend are gone (every round is priced at valuation.multiple x ARR, the exit is valuation.multiple x ARR or multPat x profit) */
 const h=INPUT_SCHEMA.find(x=>x.title==='Later-round valuation');
 if(h){h.fields=h.fields.filter(f=>!['funding.multQ4','funding.multQ8','funding.multQ16','funding.blendLo','funding.blendHi'].includes(f[0]));
  const m=h.fields.find(f=>f[0]==='funding.multPat');if(m){m[1]='Exit profit multiple';m[2]='× annual operating profit at the Q16 exit';}
  h.title='Exit multiple and depreciation';h.intro='The Q16 exit is valued at the round ARR multiple (Valuation › ARR multiple) or at this multiple of annual operating profit. Rounds 2 to 4 are priced at that same multiple. Keep depreciation lives under capital-return assumptions.';}
 const v=INPUT_SCHEMA.find(x=>x.title==='First-round assumptions');if(v&&!v.fields.some(f=>f[0]==='valuation.lead'))v.fields.push(['valuation.lead','Lead investor cheque','₹ Cr · inside the ask']);
 if(v&&!v.fields.some(f=>f[0]==='valuation.r1Post')){const i=v.fields.findIndex(f=>f[0]==='valuation.multiple');v.fields.splice(i>=0?i+1:v.fields.length,0,['valuation.r1Post','Round 1 post-money','₹ Cr · 0 = price at the ARR multiple']);}}
const pcInput=onInput;
onInput=function(el){const p=el.dataset.input,v=Number(el.value);
  const bad=m=>{el.setCustomValidity?.(m);},blank=el.value.trim()==='',F=INP.funding;
  if(['funding.round2Q','funding.r3Q','funding.r4Q'].includes(p)){
    if(blank||!Number.isInteger(v)||v<0||v>15){bad('Enter a quarter index from 0 (Q1) to 15 (Q16).');return;}
    const q2=p==='funding.round2Q'?v:+F.round2Q,q3=p==='funding.r3Q'?v:+F.r3Q,q4=p==='funding.r4Q'?v:+F.r4Q;
    if(q2>q3||q3>q4){bad('Rounds 2, 3 and 4 must close in that order: round 2 quarter ≤ round 3 quarter ≤ round 4 quarter.');return;}}
  if(p==='funding.round2'&&(blank||!Number.isFinite(v)||v<0)){bad('Enter an amount of 0 or more.');return;}
  if(['funding.r3','funding.r4'].includes(p)&&(blank||!Number.isFinite(v)||v<0)){bad('Enter an amount of 0 or more.');return;}
  if(['funding.multPat'].includes(p)&&(blank||!Number.isFinite(v)||v<=0)){bad('Enter a number above 0.');return;}
  if(p==='valuation.lead'&&(blank||!Number.isFinite(v)||v<0||v>+INP.valuation.ask)){bad('Enter the lead’s cheque: 0 up to the round 1 ask.');return;}
  if(p==='valuation.r1Post'&&(blank||!Number.isFinite(v)||v<0||(v>0&&v<=+INP.valuation.ask))){bad('Enter round 1 post-money above the ask, or 0 to use the ARR multiple.');return;}
  if(p==='valuation.ask'&&Number.isFinite(v)&&v>=0&&v<+INP.valuation.lead){bad('The ask cannot be below the lead’s cheque.');return;}
  pcInput(el);
  /* the base check gives one generic message; name the rule this field broke instead */
  if(el.validationMessage==='Enter a number of 0 or more.'){const q=['funding.tenor','funding.window'].includes(p),n=['funding.moratorium','funding.lead'].includes(p),pct=p==='capital.firstPhase'||p.startsWith('operating.products.'),pos=['funding.roundTo','funding.lifePlant','funding.lifeOther','valuation.todayMRR','valuation.multiple'].includes(p);
    el.setCustomValidity?.(q?'Enter at least 1 whole quarter.':n?'Enter a whole number of quarters, 0 or more.':pct?'Enter a percentage from 0 to 100.':pos?'Enter a number above 0.':p.startsWith('operating.anchors.')?'Enter anchors that increase from left to right.':p.startsWith('funding.blend')?'Enter a blend range where the low end is below the high end.':'Enter a number of 0 or more.');}};
