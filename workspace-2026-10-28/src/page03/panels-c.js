/* Page 03, right-hand panels for steps 3, 4 and 6 (CX.spend, CX.raise, CX.roce).
   Two or three PK.card cards each (panel-kit.js), one fold per panel.
   The panels are static: they never read a selected quarter. Every figure comes from the model (capData, roceFin, stressCases).
   Everything sits inside one function so its names cannot clash with the other panel files. */
(function(){
const NB=' ',add=a=>a.reduce((s,v)=>s+v,0);
/* ₹ figures: one decimal only when there is one (140, 248.6) */
const F=v=>{const r=Math.round(v*10)/10;return (r<0?'−':'')+fd(Math.abs(r),Number.isInteger(r)?0:1);};
const Rs=v=>`₹${F(v)}${NB}Cr`,R0=v=>`₹${fd(v,0)}${NB}Cr`;
const pc0=v=>(v<-0.5?'−':'')+fd(Math.abs(v),0)+'%',pc1=v=>(v<0?'−':'')+fd(Math.abs(v),1)+'%';
const sw=c=>`<i class="pnc-sw" style="background:${c}"></i>`;
/* the cards, then the panel's one fold (the fold follows .pnc-cards, which is how the larger fold type is reached) */
const panel=(cards,fold,mod)=>`<div class="pc-cards pnc-cards${mod?' '+mod:''}" style="flex:${cards.length} 1 auto">${cards.join('')}</div>${fold}`;
/* a stacked bar. A segment may carry a full label (t) and a short one (s); the stylesheet shows the longest that fits the segment.
   The bucket number is the label's width in 8 px steps, matching the container queries in panels-c.css. */
const tw=t=>[...String(t)].reduce((w,c)=>w+(c>='0'&&c<='9'?7.2:c===' '?3.3:c==='·'?4:6.4),0);
const bk=(t,short)=>Math.min(32,Math.max(1,Math.ceil((tw(t)+(short?1:8))/8)));
const bar=(parts)=>`<div class="pnc-bar" role="img" aria-label="${parts.filter(p=>p.v>1e-9&&p.n).map(p=>p.n).join(', ')}">${parts.filter(p=>p.v>1e-9).map(p=>`<i style="flex:${p.v} 1 0;background:${p.c};color:${p.tc||'#fff'}${p.o?`;box-shadow:inset 0 0 0 1px ${p.o}`:''}" title="${p.n||''}">${p.t?`<span class="pnc-f pnc-f${bk(p.t)}">${p.t}</span>`:''}${p.s?`<span class="pnc-s pnc-s${bk(p.s,1)}">${p.s}</span>`:''}</i>`).join('')}</div>`;
/* the three growth-spending parts, as figures under a bar; each column's top rule carries its segment colour */
const partsRow=parts=>`<div class="pnc-parts">${parts.map(p=>`<div class="pnc-part" style="--pc:${p.c}"><b>₹${F(p.v)}</b><span>${p.l}</span></div>`).join('')}</div>`;

/* ---------------- step 3: growth spending and the funding need ---------------- */
CX.spend=D=>{
  const G=D.G,K=G.K,S=cxSeries(D),L=G.N-1,c=K.cum[L],lead=K.leadQ,days=K.days(),C=INP.capital;
  /* card 1: what a rupee of capital carries, at the last quarter */
  const arr=12*D.T[L],ce=roceFin(G)[L].ce,turns=ce>0?arr/ce:0;
  const t1=v=>fd(Math.round(v*10)/10,Number.isInteger(Math.round(v*10)/10)?0:1);
  const cmp=(lab,v,col)=>`<div class="pnc-cm"><span>${lab}</span><div class="pnc-cm-t"><i style="width:${(100*v/Math.max(arr,ce,1e-9)).toFixed(1)}%;background:${col}"></i></div><b>${R0(v)}</b></div>`;
  const c1=PK.card({title:'A capital-absorption machine',hero:[`₹${t1(turns)}`,'of yearly revenue for every ₹1 of capital'],body:PK.vis(`<div class="pnc-cmp">${cmp('ARR',arr,PC.rev)}${cmp('Capital',ce,PC.capex)}</div>`),col:PC.capex});
  /* card 2: three triggers pace the whole growth spending to the last quarter (capex + working capital) */
  const St=K.steps,item=k=>add(St[k].costs),plants=item('tileP5')+item('wood')+item('upvc');
  const nLab=St.labs.costs.length,nCen=St.centres.costs.length,nSys=St.systems.costs.length,nMis=St.misc.costs.length;
  const perPlant=plants/nLab,perCity=(K.units[L]-4)/nCen,dRev=D.T[L]-K.m0;
  const plantRule=lead>1?`Plants: expand ${lead} quarters before sales need it`:lead===1?'Plants: expand a quarter before sales need it':'Plants: expand when sales need it';
  const before=lead>1?`${lead} quarters before`:lead===1?'a quarter before':'when';
  const seg=(v,col,n)=>({v,c:col,n:`${n} · ${Rs(v)}`});
  const trig=[
    {sh:'▲',h:'Plants and labs',rule:[plantRule,`Labs: one per ${Rs(perPlant)} of plant`],
      seg:[seg(plants,PC.capex,'Plants'),seg(item('labs'),PC.labs,'Labs')]},
    {sh:'●',h:'Experience centres',rule:[`One per ~${fd(perCity,0)} new cities or dealer zones`],
      seg:[seg(item('centres'),PC.capex,'Experience centres')]},
    {sh:'■',h:'Working capital, systems, misc',rule:[`Working capital: ${fd(days,0)} days of revenue`,'Systems, misc: added as revenue grows'],
      seg:[seg(item('misc'),PC.capex,'Misc'),seg(item('systems'),PC.labs,'Systems'),seg(c.wc,PC.wc,'Working capital')]}];
  trig.forEach(t=>t.v=add(t.seg.map(x=>x.v)));
  const tot=add(trig.map(t=>t.v)),tmax=Math.max(...trig.map(t=>t.v),1e-9);
  const trow=t=>`<div class="pnc-tg"><div class="pnc-tg-h"><span><i>${t.sh}</i>${t.h}</span><b>${Rs(t.v)}</b></div>${t.rule.map(r=>`<p>${r}</p>`).join('')}`
    +`<div class="pnc-tr"><div class="pnc-tb" role="img" aria-label="${t.seg.map(x=>x.n).join(', ')}" style="width:${(100*t.v/tmax).toFixed(1)}%">${t.seg.map(x=>`<i style="flex:${x.v} 1 0;background:${x.c}" title="${x.n}"></i>`).join('')}</div></div></div>`;
  const c2=PK.card({title:`What triggers the ${Rs(tot)}`,body:PK.vis(trig.map(trow).join('')),col:PC.capex});
  const rule={tileP5:`bought ${before} sales need it`,wood:`bought ${before} sales need it`,upvc:`bought ${before} sales need it`,
    centres:`one per ~${fd(perCity,0)} new cities or dealer zones`,labs:`one per ${Rs(perPlant)} of plant, same quarter`,
    systems:`one per ~${Rs(dRev/nSys)} of added monthly revenue`,misc:`one per ~${Rs(dRev/nMis)} of added monthly revenue`};
  /* the fold: the per-item rules and phase plan, and what moves the peak */
  const plan=CAPEX_ITEMS.map(([k,l,bk])=>{const s=St[k];return `<div class="pnc-ph"><div class="pnc-ph-h"><span>${sw(stepCol(bk))}${l}</span><b>${Rs(add(s.costs))}</b></div><small>${stepCostText(s.costs)}, ${rule[k]} · ${stepWhen(s.buys)}</small></div>`;}).join('')
    +`<div class="pnc-ph"><div class="pnc-ph-h"><span>${sw(PC.wc)}Working capital</span><b>${Rs(c.wc)}</b></div><small>${fd(days,0)} days of the revenue added, topped up every quarter</small></div>`;
  const pk=o=>{const r=raisePlan(o);return Math.max(...r.G.gap.map((v,i)=>v+r.D.cumInt[i]));},a=pk({capital:{wcDays:45}}),b=pk({capital:{wcDays:90}}),p=pk({plantMult:1.2}),l=pk({lateQ:2});
  const more=whyD('Timing, phases, what-ifs',
    `<p class="cx-sub">Phase plan to ${qName(L)}</p>${plan}`
    +`<p class="cx-note">Each phase is paid ${lead} quarter${lead===1?'':'s'} before demand passes the capacity built. Centres open with new cities and dealer zones (${C.centresN} × ${rc(K.X.centres/C.centresN)}). Dark stores and distribution points carry no capex of their own: set-up sits in misc, rent in overhead.${fn(NOTE_PLANT)}</p>`
    +cxLev('Peak cash required if…',[['Working-capital target is 45 days',rc(a),dlt(a,S.peak)],['Working-capital target is 90 days',rc(b),dlt(b,S.peak)],['Plants cost 20% more',rc(p),dlt(p,S.peak)],['Revenue is two quarters late',rc(l),dlt(l,S.peak)]]));
  return {lead:'',body:panel([c1,c2],more,'pnc-c2')};
};

/* ---------------- step 4: the funding flywheel ---------------- */
/* a round's size as the founders state it, in ₹ Cr; a quarter with its months ("Q4, Jul–Sep 2027") */
const amtS=r=>Rs(r.amt);
const qWhen=q=>{const d=QD[q];return `${qName(q)}, ${d.ya===d.yz?`${d.a}–${d.z} ${d.ya}`:`${d.a} ${d.ya}–${d.z} ${d.yz}`}`;};
/* one step of the cycle: a numbered dot, a thin line down to the next dot */
const fstep=(n,html)=>`<li><i class="pnc-fd">${n}</i><span>${html}</span></li>`;
CX.raise=D=>{
  const R=D.R,P=R.P,pr=D.pr,S=cxSeries(D),col=PC.fund,r1=pr[0],org=pr.filter(r=>r.kind!=='acq'),acq=pr.filter(r=>r.kind==='acq'),r2=pr.find((r,i)=>i>0&&r.kind!=='acq');
  const rng=a=>a.length<2?`${a.length?a[0].n:''}`:`${a[0].n}–${a.at(-1).n}`,orgAmt=R.organic.equity,acqAmt=R.acq.amt;
  /* card 1: the first turn of the cycle, all computed: money in, ARR up, valuation up, the next round */
  let c1;
  if(r2){const up=r2.stepUp,g=r2.arrUp;
    c1=PK.card({title:'Each round buys the next',body:PK.vis(`<ol class="pnc-fl">${fstep(1,`Raise <b>${Rs(r1.amt)}</b> now`)}${fstep(2,`ARR <b>₹${fd(r1.arr,0)} → ₹${fd(r2.arr,0)}${NB}Cr</b> by ${qName(r2.q)} (${pcX(g)})`)}${fstep(3,`Valuation <b>${pcX(up)}</b> the round-1 price`)}${fstep(4,`Raise <b>${Rs(r2.amt)}</b> in round ${r2.n}`)}</ol>`),col});
  }else c1=PK.card({title:'Each round buys the next',note:`Round 1 (${Rs(r1.amt)}) funds the plan; there is no organic round 2.`,col});
  /* card 2: the ladder, grouped organic then acquisitions */
  const lrow=r=>`<div class="pnc-lr"><span>R${r.n} · ${qName(r.q)}</span><b>${amtS(r)}</b><span>${R0(r.post)}</span><b class="pnc-su">${r.stepUp?pcX(r.stepUp):'–'}</b></div>`;
  const lgrp=(name,tot,a)=>a.length?`<div class="pnc-lg">${name} · ${tot}</div>${a.map(lrow).join('')}`:'';
  const c2=PK.card({title:'Four rounds, rising prices',body:PK.vis(`<div class="pnc-ld"><div class="pnc-lh"><span>Round</span><span>Raise</span><span>Post-money</span><span>Step-up</span></div>`
    +lgrp('Organic growth',Rs(orgAmt),org)+lgrp('Organic growth & acquisition',Rs(acqAmt),acq)+`</div>`),col});
  /* card 3: what rounds 3 and 4 are for */
  const c3=acq.length?PK.card({title:`Rounds ${rng(acq)}: buy and plug in`,hero:[Rs(acqAmt),'for organic growth & acquisition'],note:'Regional brands and plants.',col}):'';
  /* the fold: how the rounds are priced and the cash they leave */
  const peak=S.peak,low=R.organic.minCash,lowQ=R.organic.minQ,before=r2&&lowQ<r2.q,enough=orgAmt>=peak-1e-9;
  const more=whyD('Pricing and cash',
    `<p class="cx-note">Round 1 is priced at ${fd(INP.valuation.multiple,0)}× today’s ARR (${R0(r1.post)} post-money). Every later round is priced at the same ${fd(INP.valuation.multiple,0)}× on the ARR of its quarter (12 × the quarter’s last month), so the valuation rises in step with ARR.${fn(NOTE_PRICE)}</p>`
    +cxLev(`Rounds ${rng(org)} and the organic plan`,[['Cash required, at its peak',Rs(peak),qName(S.pk)],[`Raised in rounds ${rng(org)}`,Rs(orgAmt),enough?`${Rs(orgAmt-peak)} above`:`${Rs(peak-orgAmt)} short`],['Lowest cash',low<0?`−${Rs(-low)}`:Rs(low),`${qName(lowQ)}${before?`, before round ${r2.n} lands`:''}`]])
    +`<p class="cx-note">Lowest cash is ${low>=P.buffer-1e-9?'above':'under'} the ${Rs(P.buffer)} floor.${acq.length?` Rounds ${rng(acq)} (${Rs(acqAmt)}) sit in the model as cash and count at face value at the exit; the acquisitions and their revenue are not modelled.`:''} ${R.D.on?`Debt is on: ${rc(R.D.bal[R.N-1])} outstanding at ${qName(R.N-1)}.`:'Debt is off.'}${fn(NOTE_FUND)}</p>`);
  return {lead:'',body:panel([c1,c2,c3].filter(Boolean),more,'pnc-c4')};
};
/* ---------------- step 6: return on capital ---------------- */
CX.roce=D=>{
  const G=D.G,K=G.K,ro=roceFin(G),L=G.N-1,l=ro[L],Fd=INP.funding,c=K.cum[L],m=G.patMonthly[L],wcT=K.wcTotal[L];
  const cell=(op,fig,lab,col)=>`<div class="pnc-mx-c"><i>${op}</i><div><b style="color:${col}">${fig}</b><span>${lab}</span></div></div>`;
  const cr=v=>`₹${F(v)}<small>${NB}Cr</small>`;
  /* card 1: the headline figure, and the equation behind it */
  const c1=PK.card({title:'A ROCE machine',hero:[pc0(l.pre*100),`return on capital by ${qName(L)}`],note:`${pc0(l.post*100)} after depreciation.`,col:PC.profit});
  /* card 2: the return before depreciation, every quarter, and when it passes three marks */
  const v=ro.map(x=>x.pre*100),lo2=-20,hi=Math.max(...v,1),rg=hi-lo2;
  const zero=100*hi/rg;
  const bars=v.map((x,q)=>{const h=100*Math.abs(Math.max(x,lo2))/rg;return `<i class="${x<0?'neg':''}" title="${qName(q)} · ${pc0(x)}" style="${x<0?`top:${zero.toFixed(1)}%`:`bottom:${(100-zero).toFixed(1)}%`};height:${h.toFixed(1)}%;left:${(100*q/16+.7).toFixed(2)}%;background:${x<0?PC.loss:PC.profit}"></i>`;}).join('');
  const first=t=>v.findIndex(x=>x>=t),f0=first(1e-9);
  const ms=[[f0,'Positive in'],[first(20),'20%+ by'],[first(40),'40%+ by']].filter(m=>m[0]>=0).map(m=>`${m[1]} ${qName(m[0])}`);
  const c2=PK.card({title:f0<0?'Fast: the return climbs':f0<=3?'Fast: positive within a year':`Fast: positive in ${qName(f0)}`,body:PK.vis(`<div class="pnc-mc" role="img" aria-label="Return on capital before depreciation, by quarter"><div class="pnc-mc-p">${bars}<u style="top:${zero.toFixed(1)}%"></u></div><div class="pnc-mc-x"><span>${qName(0)}</span><span>${qName(L)}</span></div></div>`),note:ms.join(' · '),col:PC.profit});
  /* card 3: margin x capital turns = return */
  const arr=12*D.T[L],mg=arr>0?12*m/arr:0,turns=l.ce>0?arr/l.ce:0,t1=Math.round(turns*10)/10,tt=fd(t1,Number.isInteger(t1)?0:1);
  const c3=PK.card({title:'Efficient: margin × capital turns',body:PK.vis(`<div class="pnc-mx">${cell('',pc0(mg*100),'operating margin',PC.profit)}${cell('×',tt,'capital turns',PC.capex)}${cell('=',pc0(l.pre*100),'return',PC.profit)}</div>`),
    note:`Each ₹1 of capital turns over ₹${tt} of sales a year.`,col:PC.profit});
  /* the fold: what capital is included, the depreciation-adjusted figure, what moves it, and what it leaves out */
  const parts=[{l:'Capex',v:c.capex,c:PC.capex},{l:'Labs / systems',v:c.pp,c:PC.labs,tc:PC.ink},{l:'Working capital',v:wcT,c:PC.wc,tc:PC.ink}];
  const rq=o=>roceFin(gapFin(o))[L].pre*100,v45=rq({capital:{wcDays:45}}),v90=rq({capital:{wcDays:90}}),vp=rq({plantMult:1.2}),pts=x=>fd(x,1)+' pts';
  const more=whyD('Capital and what-ifs',
    `<p class="cx-sub">How the return is measured</p><div class="pnc-mx" style="margin:0 0 10px">${cell('',cr(12*m),'profit a year',PC.profit)}${cell('÷',cr(l.ce),'capital',PC.capex)}${cell('=',pc0(l.pre*100),'return',PC.profit)}</div><p class="cx-sub">Capital included · ₹ Cr at ${qName(L)}</p>`+bar(parts.map(p=>({v:p.v,c:p.c,n:`${p.l} · ${Rs(p.v)}`})))+partsRow(parts)
    +cxLev(`${qName(L)} return, before and after depreciation`,[['Before depreciation',pc1(l.pre*100),''],[`Depreciation a year<small>straight line: plants and centres over ${fd(Fd.lifePlant,0)} years; labs, systems and misc over ${fd(Fd.lifeOther,0)}</small>`,rc(4*l.dep),''],['After depreciation',pc1(l.post*100),'']])
    +cxLev(`${qName(L)} return before depreciation if…`,[['Working-capital target is 45 days',pc1(v45),dlt(v45,l.pre*100,pts)],['Working-capital target is 90 days',pc1(v90),dlt(v90,l.pre*100,pts)],['Plants cost 20% more',pc1(vp),dlt(vp,l.pre*100,pts)]])
    +`<p class="cx-note">Forecast assets and the full working-capital target. Existing fixed assets are excluded. This is not complete company ROCE. Working capital is the full ${fd(K.days(),0)}-day target, including its ${rc(K.openingWC)} opening balance.${fn(NOTE_RET)}</p>`);
  return {lead:'',body:panel([c1,c2,c3],more,'pnc-c6')};
};
})();
