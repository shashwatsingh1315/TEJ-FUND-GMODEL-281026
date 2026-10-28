/* Page 03 review, 28 Oct 2026 (rounds 1 and 2).
   Six steps; one money chart (steps 1-4 on a shared 0-based axis, step 3 on its own axis that runs below zero);
   a static right-hand panel that explains the logic (formula, inputs, rules, one fold); three takeaways per step.
   Raise policy: round 1 = the ask in Q1; round 2 = a fixed amount (round2, 200 Cr) in the quarter the cash trigger picks;
   from round 2 the plan raises every cadenceQ quarters (every 6 months), but those later rounds are NOT sized and sit
   in no cash line or dilution: the chart marks them on the timeline only. Debt stays off and its bar is hidden. */

/* ---------- raise policy: inputs, engine, note ---------- */
const pcPolicy=fundPolicy;
fundPolicy=function(o={}){
  const P=pcPolicy(o),F=INP.funding,c=Math.round(+(P.cadenceQ??F.cadenceQ??2)),r2=+(P.round2??F.round2??200);
  return {...P,cadenceQ:Number.isFinite(c)&&c>=1?Math.min(16,c):2,round2:Number.isFinite(r2)&&r2>=0?r2:200};
};
/* Round 1 = the ask. Round 2 is placed by the cash trigger (one quarter before cash would fall under the floor) and is a fixed
   amount (round2; 0 = size it by the cash rule). Nothing else is modelled: R.later lists the quarters of the 6-monthly rounds
   that follow, for the timeline only. A quarter can end under the floor; nothing tops it up. */
raisePlan=function(o={}){
  const G=gapFin(o),N=G.N,P=fundPolicy(o),D=debtFin(G,P),base=G.gap.map((g,q)=>-g+D.bal[q]-D.cumInt[q]);
  const rounds=o.rounds?o.rounds.map(r=>({q:r.q,amt:r.amt})):[{q:0,amt:P.e1,kind:'ask'}];
  const eq=q=>sum(rounds.filter(r=>r.q<=q).map(r=>r.amt)),up=x=>Math.max(P.roundTo,Math.ceil(x/P.roundTo-1e-9)*P.roundTo);
  const breach=a=>{for(let q=a;q<N;q++)if(eq(q)+base[q]<P.buffer-1e-9)return q;return -1;};
  if(!o.rounds){
    const b=breach(0),close=b<0?N:Math.max(b-P.lead,1);
    if(close<N){
      let m=Infinity,t=close;for(let q=close;q<=Math.min(close+P.window-1,N-1);q++){const c=eq(q)+base[q];if(c<m-1e-12){m=c;t=q;}}
      const raw=P.buffer-m;   /* what the cash rule alone would ask for; round 2 is the fixed round2 amount instead */
      rounds.push({q:close,amt:P.round2>0?P.round2:up(raw),need:-base[t],needQ:t,raised:eq(t),raw,trigger:b,kind:'trigger'});
    }
  }
  const cash=base.map((v,q)=>eq(q)+v);
  rounds.forEach((r,i)=>{const e=q=>sum(rounds.slice(0,i+1).filter(x=>x.q<=q).map(x=>x.amt));r.breach=-1;for(let q=r.q;q<N;q++)if(e(q)+base[q]<P.buffer-1e-9){r.breach=q;break;}r.next=rounds[i+1]?rounds[i+1].q:null;});
  const minCash=Math.min(...cash),minQ=cash.indexOf(minCash),later=[];
  if(!o.rounds&&rounds[1])for(let q=rounds[1].q+P.cadenceQ;q<N;q+=P.cadenceQ)later.push(q);
  return {G,D,P,N,rounds,base,cash,eq,equity:sum(rounds.map(r=>r.amt)),minCash,minQ,short:cash.map((c,q)=>c<0?q:-1).filter(q=>q>=0),later};
};
NOTES[NOTE_FUND-1]='Assumption · raise policy: round 1 is the ask, closed in Q1. Round 2 is a fixed amount (₹200 Cr in the plan), closed in the quarter before cash would fall under the minimum cash (₹10 Cr). From round 2 the plan raises every six months, but those later rounds are not sized: they are shown on the timeline only and sit in no cash line, equity total or dilution. With a smaller round 2, cash can end a quarter under the minimum or below zero until they are sized; with the plan’s round 2 the later rounds are extra cushion. Placeholders for the founders to set.';
{const g=INPUT_SCHEMA.find(x=>x.title==='Funding plan');
 if(g){const at=g.fields.findIndex(f=>f[0]==='funding.window')+1;
  g.fields.splice(at,0,['funding.round2','Round 2 amount','₹ Cr · 0 = size it by the cash rule'],['funding.cadenceQ','Later rounds every','quarters · timeline markers only, not sized']);
  g.intro='Equity policy and illustrative loan terms. Round 1 is the ask in Valuation; round 2 is a fixed amount placed by the cash trigger; later six-monthly rounds are not sized or included in cash. Debt is off in this plan. Working capital uses days / 365 of annualised revenue.';}}
const pcInput=onInput;
onInput=function(el){const p=el.dataset.input,v=Number(el.value);
  if(p==='funding.cadenceQ'&&(el.value.trim()===''||!Number.isInteger(v)||v<1||v>16)){el.setCustomValidity?.('Enter a whole number from 1 to 16.');return;}
  if(p==='funding.round2'&&(el.value.trim()===''||!Number.isFinite(v)||v<0)){el.setCustomValidity?.('Enter an amount of 0 or more.');return;}
  pcInput(el);};
