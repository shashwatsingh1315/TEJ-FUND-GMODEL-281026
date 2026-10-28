/* Page 03, right-hand panels for steps 3, 4 and 6 (CX.spend, CX.raise, CX.roce).
   Two or three plain cards each, bigger text, one visual at most per idea, one fold per panel.
   The panels are static: they never read a selected quarter. Every figure comes from the model (capData, roceFin, stressCases).
   Everything sits inside one function so its names cannot clash with the other panel files. */
(function(){
const NB=' ',add=a=>a.reduce((s,v)=>s+v,0);
/* ₹ figures: one decimal only when there is one (140, 248.6) */
const F=v=>{const r=Math.round(v*10)/10;return (r<0?'−':'')+fd(Math.abs(r),Number.isInteger(r)?0:1);};
const Rs=v=>`₹${F(v)}${NB}Cr`,R0=v=>`₹${fd(v,0)}${NB}Cr`;
const big=(v,col)=>`<span class="pnc-big"${col?` style="color:${col}"`:''}>₹${F(v)}<small>${NB}Cr</small></span>`;
const big0=(v,col)=>`<span class="pnc-big"${col?` style="color:${col}"`:''}>₹${fd(v,0)}<small>${NB}Cr</small></span>`;
const pc0=v=>(v<-0.5?'−':'')+fd(Math.abs(v),0)+'%',pc1=v=>(v<0?'−':'')+fd(Math.abs(v),1)+'%';
const sw=c=>`<i class="pnc-sw" style="background:${c}"></i>`;
/* a card: coloured edge by meaning, a title, an optional big figure at the right of the title */
const card=(title,body,col,fig)=>`<section class="pc-card pnc-card" style="--c:${col}">${fig?`<div class="pnc-th"><h4 class="pnc-t">${title}</h4>${fig}</div>`:`<h4 class="pnc-t">${title}</h4>`}${body}</section>`;
const tx=s=>`<p class="pnc-x">${s}</p>`;
/* the cards, then the panel's one fold (the fold follows .pnc-cards, which is how the larger fold type is reached) */
const panel=(cards,fold,mod)=>`<div class="pc-cards pnc-cards${mod?' '+mod:''}" style="flex:${cards.length} 1 auto">${cards.join('')}</div>${fold}`;
/* a stacked bar. A segment may carry a full label (t) and a short one (s); the stylesheet shows the longest that fits the segment.
   The bucket number is the label's width in 8 px steps, matching the container queries in panels-c.css. */
const tw=t=>[...String(t)].reduce((w,c)=>w+(c>='0'&&c<='9'?7.2:c===' '?3.3:c==='·'?4:6.4),0);
const bk=(t,short)=>Math.min(32,Math.max(1,Math.ceil((tw(t)+(short?1:8))/8)));
const bar=(parts)=>`<div class="pnc-bar" role="img" aria-label="${parts.filter(p=>p.v>1e-9&&p.n).map(p=>p.n).join(', ')}">${parts.filter(p=>p.v>1e-9).map(p=>`<i style="flex:${p.v} 1 0;background:${p.c};color:${p.tc||'#fff'}${p.o?`;box-shadow:inset 0 0 0 1px ${p.o}`:''}" title="${p.n||''}">${p.t?`<span class="pnc-f pnc-f${bk(p.t)}">${p.t}</span>`:''}${p.s?`<span class="pnc-s pnc-s${bk(p.s,1)}">${p.s}</span>`:''}</i>`).join('')}</div>`;
/* the three growth-spending parts, as figures under a bar */
const partsRow=parts=>`<div class="pnc-parts">${parts.map(p=>`<div class="pnc-part"><b>₹${F(p.v)}</b><span>${sw(p.c)}${p.l}</span></div>`).join('')}</div>`;

/* ---------------- step 3: growth spending and the funding need ---------------- */
CX.spend=D=>{
  const G=D.G,K=G.K,S=cxSeries(D),L=G.N-1,c=K.cum[L],lead=K.leadQ,days=K.days(),C=INP.capital;
  const parts=[{l:'Capex',v:c.capex,c:PC.capex},{l:'Labs / systems',v:c.pp,c:PC.labs,tc:PC.ink},{l:'Working capital',v:c.wc,c:PC.wc,tc:PC.ink}];
  const tot=add(parts.map(p=>p.v)),top=parts.reduce((a,p)=>p.v>a.v?p:a,parts[0]);
  const c1=card('Where the growth money goes',
    `<div class="pnc-tot">${big(tot)}<span class="pnc-to"> to ${qName(L)}</span></div>`+bar(parts.map(p=>({v:p.v,c:p.c,n:`${p.l} · ${Rs(p.v)}`})))+partsRow(parts)
    +tx(`${top.l} is the biggest piece.`),PC.capex);
  const ahead=lead>1?`${lead} quarters ahead`:lead===1?'a quarter ahead':'as demand needs it';
  const c2=card('How each is timed',`<div class="pnc-rows">
    <div class="pnc-row">${sw(PC.capex)}<span><b>Plants</b> in whole phases, ${ahead}</span></div>
    <div class="pnc-row">${sw(PC.labs)}<span><b>Centres, labs, systems</b> follow cities, plants and revenue</span></div>
    <div class="pnc-row">${sw(PC.wc)}<span><b>Working capital:</b> ${fd(days,0)} days of new revenue</span></div></div>`,PC.capex);
  const c3=card(`Cash required peaks in ${qName(S.pk)}`,`<div class="pnc-tot">${big0(S.peak,PC.fundTxt)}</div>`+tx('Earnings less spending, added up: the gap the raises fill.'),PC.fund);
  /* the fold: the per-item phase plan, and what moves the peak */
  const total=add(CAPEX_ITEMS.map(([k])=>add(K.steps[k].costs)));
  const plan=CAPEX_ITEMS.map(([k,l,bk])=>{const s=K.steps[k];return `<div class="pnc-ph"><div class="pnc-ph-h"><span>${sw(stepCol(bk))}${l}</span><b>${Rs(add(s.costs))}</b></div><small>${stepCostText(s.costs)} · bought ${stepWhen(s.buys)}</small></div>`;}).join('');
  const pk=o=>{const r=raisePlan(o);return Math.max(...r.G.gap.map((v,i)=>v+r.D.cumInt[i]));},a=pk({capital:{wcDays:45}}),b=pk({capital:{wcDays:90}}),p=pk({plantMult:1.2}),l=pk({lateQ:2});
  const more=whyD(`Phase plan to Q16 · ${Rs(total)}`,
    `<p class="cx-sub">Each item: cost × phases, and the quarters it is bought</p>${plan}`
    +`<p class="cx-note">Each phase is paid ${lead} quarter${lead===1?'':'s'} before demand passes the capacity built. Centres open with new cities and dealer zones (${C.centresN} × ${rc(K.X.centres/C.centresN)}). Dark stores and distribution points carry no capex of their own: set-up sits in misc, rent in overhead.${fn(NOTE_PLANT)}</p>`
    +cxLev('Peak cash required if…',[['Working-capital target is 45 days',rc(a),dlt(a,S.peak)],['Working-capital target is 90 days',rc(b),dlt(b,S.peak)],['Plants cost 20% more',rc(p),dlt(p,S.peak)],['Revenue is two quarters late',rc(l),dlt(l,S.peak)]]));
  return {lead:'',body:panel([c1,c2,c3],more,'pnc-c3')};
};

/* ---------------- step 4: raises and cash ---------------- */
/* a timeline of the 16 quarters: round markers, solid when sized and open when not */
const timeline=(marks)=>{const X=q=>(3+94*q/15).toFixed(2);
  let h='<div class="pnc-tl"><i class="pnc-tl-l"></i>';
  for(let q=0;q<16;q++)h+=`<i class="pnc-tl-k" style="left:${X(q)}%"></i>`;
  /* with many markers only the solid ones and every fourth quarter are named, so the labels never touch */
  const few=marks.length<=9;
  marks.forEach(m=>{h+=`<i class="pnc-dm ${m.on?'on':'off'}" style="left:${X(m.q)}%"></i>`+(m.t?`<span class="pnc-tl-a" style="left:${X(m.q)}%">${m.t}</span>`:'')+(few||m.on||(m.q+1)%4===0?`<span class="pnc-tl-b${m.on?' on':''}" style="left:${X(m.q)}%">${qName(m.q)}</span>`:'');});
  return h+'</div>';};
CX.raise=D=>{
  const R=D.R,G=D.G,K=G.K,P=R.P,rs=R.rounds,r1=rs[0],r2=rs[1],S=cxSeries(D),pk=S.pk,m=P.cadenceQ*3,col=PC.fund;
  const c1=card(`Round 1 · ${qName(r1.q)}`,`<p class="pnc-when">${roundWhen(R,0).text}</p>`+tx('The ask; it funds the start.'),col,big(r1.amt,PC.fundTxt));
  let c2;
  if(r2){
    const b=r2.trigger;
    const note=b>=0?`Without this round, projected cash breaches the floor in ${qName(b)}.`:`Round 2 closes in ${qName(r2.q)}.`;
    /* to the peak quarter: what was spent, what paid for it, what is left */
    const cp=K.cum[pk],eq=add(rs.filter(r=>r.q<=pk).map(r=>r.amt)),earn=G.cumPat[pk]-(R.D.on?R.D.cumInt[pk]:0),loan=R.D.on?R.D.bal[pk]:0,left=R.cash[pk],raised=eq;
    const uses=[{v:cp.capex,c:PC.capex,t:`Capex ${fd(cp.capex,0)}`,s:fd(cp.capex,0),n:`Capex · ${Rs(cp.capex)}`},{v:cp.pp,c:PC.labs,tc:PC.ink,s:fd(cp.pp,0),n:`Labs / systems · ${Rs(cp.pp)}`},{v:cp.wc,c:PC.wc,tc:PC.ink,t:`Working capital ${fd(cp.wc,0)}`,s:fd(cp.wc,0),n:`Working capital · ${Rs(cp.wc)}`}];
    if(earn<0)uses.push({v:-earn,c:PC.loss,t:`Losses ${fd(-earn,0)}`,s:fd(-earn,0),n:`Operating losses · ${Rs(-earn)}`});
    if(left>0)uses.push({v:left,c:PC.cash,n:`Cash left · ${Rs(left)}`});
    const src=[];
    if(earn>0)src.push({v:earn,c:PC.profit,t:`Earned ${fd(earn,0)}`,s:fd(earn,0),n:`Operating earnings · ${Rs(earn)}`});
    rs.filter(r=>r.q<=pk).forEach((r,i)=>src.push({v:r.amt,c:i?PC.fund:pcTint(PC.fund,.45),tc:PC.ink,t:`Round ${i+1} · ${fd(r.amt,0)}`,s:fd(r.amt,0),n:`Round ${i+1} · ${Rs(r.amt)}`}));
    if(loan>0)src.push({v:loan,c:PC.int,t:`Loans ${fd(loan,0)}`,s:fd(loan,0),n:`Loans · ${Rs(loan)}`});
    if(left<0)src.push({v:-left,c:PC.fundBg,tc:PC.fundTxt,o:PC.fund,t:`Short ${fd(-left,0)}`,s:fd(-left,0),n:`Short · ${Rs(-left)}`});
    c2=card(`Round 2 · ${Rs(r2.amt)} in ${qName(r2.q)}`,`<p class="pnc-when">${roundWhen(R,1).text}</p>`+tx(`Protects the ${Rs(P.buffer)} cash floor. ${note}`)
      +`<div class="pnc-st"><span>Spent</span>${bar(uses)}</div><div class="pnc-st"><span>Paid by</span>${bar(src)}</div>`,col);
  }else c2=card('Round 2',tx(`Not needed: round 1 keeps cash above ${Rs(P.buffer)} to ${qName(G.N-1)}.`),col);
  const noMore=!r2;
  const marks=rs.map((r,i)=>({q:r.q,t:`R${i+1}`,on:1})).concat((R.later||[]).map(q=>({q,t:'',on:0})));
  const c3=card(`Then a round every ${m} months`,timeline(marks)+tx(R.later&&R.later.length?'Not sized here; they add cushion and dilution later.':`No further round falls inside ${qName(G.N-1)}.`),col);
  const cards=noMore?[c1,c2]:[c1,c2,c3];
  /* the fold: what moves the peak, and why round 2 is the size it is */
  const SL={d90:'Working-capital target is 90 days',pl20:'Plants cost 20% more',pre100:'Plants fully built before launch',late2:'Revenue is two quarters late'};
  const raisedAll=R.equity,hr=pkv=>{const h=raisedAll-pkv;return h>=0?`${Rs(h)} to spare`:`${Rs(-h)} short`;};
  const cases=stressCases().filter(x=>x.toggle).map(x=>{const r=stressRun(x,R);return [SL[x.k]||x.label,Rs(r.peak),hr(r.peak)];});
  const rule=r2?Math.max(P.roundTo,Math.ceil(r2.raw/P.roundTo-1e-9)*P.roundTo):0;
  const ruleTxt=r2&&Math.abs(rule-r2.amt)>1e-9?`<p class="cx-note">The cash rule alone, covering the next ${P.window} quarters, would ask for ${Rs(rule)} in round 2. The plan sets ${Rs(r2.amt)}, which with round 1 ${raisedAll>=S.peak-1e-9?'covers the whole peak':'leaves part of the peak to the later rounds'}.${fn(NOTE_FUND)}</p>`:`<p class="cx-note">Round 2 is sized by the cash rule.${fn(NOTE_FUND)}</p>`;
  const debt=R.D.on?`<p class="cx-note">Debt is on: ${rc(R.D.bal[G.N-1])} outstanding at ${qName(G.N-1)}, ${rc(R.D.cumInt[G.N-1])} of interest over the plan.</p>`:'';
  const more=whyD('Caveats and what-ifs',
    cxLev(`Peak cash required, against ${Rs(raisedAll)} raised`,[['The plan as modelled',Rs(S.peak),hr(S.peak)],...cases],'A shortfall would be met by the later rounds, once sized.')+ruleTxt+debt);
  return {lead:'',body:panel(cards,more,'pnc-c4')};
};

/* ---------------- step 6: return on capital ---------------- */
CX.roce=D=>{
  const G=D.G,K=G.K,ro=roceFin(G),L=G.N-1,l=ro[L],Fd=INP.funding,c=K.cum[L],m=G.patMonthly[L],wcT=K.wcTotal[L];
  const eqRow=(op,fig,lab,col,cls='')=>`<div class="pnc-er${cls}" style="--c:${col};--ct:${pcTint(col,.14)}"><i>${op}</i><b>${fig}</b><span>${lab}</span></div>`;
  const c1=card(`How return is measured, ${qName(L)}`,`<div class="pnc-eq">`
    +eqRow('',`₹${F(12*m)}<small>${NB}Cr</small>`,'operating profit, annualised',PC.profit)
    +eqRow('÷',`₹${F(l.ce)}<small>${NB}Cr</small>`,'capital employed',PC.capex)
    +eqRow('=',pc0(l.pre*100),'return on capital',PC.profit,' res')+`</div>`,PC.profit);
  const parts=[{l:'Capex',v:c.capex,c:PC.capex},{l:'Labs / systems',v:c.pp,c:PC.labs,tc:PC.ink},{l:'Working capital',v:wcT,c:PC.wc,tc:PC.ink}];
  const c2=card('Capital included',bar(parts.map(p=>({v:p.v,c:p.c,n:`${p.l} · ${Rs(p.v)}`})))+partsRow(parts),PC.capex,`<span class="pnc-to">₹ Cr at ${qName(L)}</span>`);
  const c3=card('Why it starts low',`<div class="pnc-tot"><span class="pnc-big" style="color:${PC.profit}">${pc0(ro[0].pre*100)} → ${pc0(l.pre*100)}<small>${NB}${qName(0)} to ${qName(L)}</small></span></div>`+tx('Capital goes in ahead of the sales it serves.'),PC.profit);
  /* the fold: the depreciation-adjusted figure, what moves it, and what it leaves out */
  const rq=o=>roceFin(gapFin(o))[L].pre*100,v45=rq({capital:{wcDays:45}}),v90=rq({capital:{wcDays:90}}),vp=rq({plantMult:1.2}),pts=x=>fd(x,1)+' pts';
  const more=whyD('After depreciation, and what-ifs',
    cxLev(`${qName(L)} return, before and after depreciation`,[['Before depreciation',pc1(l.pre*100),''],[`Depreciation a year<small>straight line: plants and centres over ${fd(Fd.lifePlant,0)} years; labs, systems and misc over ${fd(Fd.lifeOther,0)}</small>`,rc(4*l.dep),''],['After depreciation',pc1(l.post*100),'']])
    +cxLev(`${qName(L)} return before depreciation if…`,[['Working-capital target is 45 days',pc1(v45),dlt(v45,l.pre*100,pts)],['Working-capital target is 90 days',pc1(v90),dlt(v90,l.pre*100,pts)],['Plants cost 20% more',pc1(vp),dlt(vp,l.pre*100,pts)]])
    +`<p class="cx-note">Forecast assets and the full working-capital target. Existing fixed assets are excluded. This is not complete company ROCE. Working capital is the full ${fd(K.days(),0)}-day target, including its ${rc(K.openingWC)} opening balance.${fn(NOTE_RET)}</p>`);
  return {lead:'',body:panel([c1,c2,c3],more,'pnc-c6')};
};
})();
