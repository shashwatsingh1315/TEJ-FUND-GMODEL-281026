/* Page 03, right-hand panels for steps 1 (Revenue), 2 (Margins) and 5 (Investor return).
   Each panel explains the idea in two or three cards (one big figure or one small visual, two short lines at most) and keeps the detail in one fold.
   The charts and their data tables carry the numbers; every number here comes from the model, and none depends on a selected quarter.
   Class prefix: pnb-. */
{
const pnbWords=['no','one','two','three','four','five','six','seven'];
const pnbCap=s=>s.replace(/^./,x=>x.toUpperCase());
const pnbN=(v,d=2)=>String(+(+v).toFixed(d));                                    /* 1 -> "1", 1.72 -> "1.72" */
const pnbPc=v=>Math.abs(v)>=9.95?fd(v,0)+'%':fd(v,1)+'%';                       /* in a card: 10 and over whole, under 10 one decimal */
const pnbP=v=>fd(v,1)+'%';                                                         /* a % of revenue, always one decimal inside a list */
const pnbR=v=>`₹${fd(v,Math.abs(v%1)>1e-9?1:0)} Cr`;
const pnbCr=s=>`${s}<small>&thinsp;Cr</small>`;
const pnbW=(s,fs,wt)=>typeof pcW==='function'?pcW(s,fs,wt):String(s).length*fs*.6;   /* text width, from the page's own measure */
const pnbCard=(title,body,col,meta='')=>`<section class="pc-card pnb-card" style="--c:${col};--ct:${pcTint(col,.2)}"><h4><span>${title}</span>${meta?`<em>${meta}</em>`:''}</h4>${body}</section>`;
const pnbText=t=>`<p class="pnb-p">${t}</p>`;
const pnbChip=(k,v,o={})=>`<span class="pnb-chip${o.res?' res':''}${o.grow?' grow':''}"${o.col?` style="--cc:${o.col};--ct:${pcTint(o.col,.14)}"`:''}><small>${k}</small><b>${v}</b></span>`;
const pnbOp=s=>`<i class="pnb-op">${s}</i>`;
const pnbEq=(a,cls='')=>`<div class="pnb-eq${cls?' '+cls:''}">${a.join('')}</div>`;
const pnbF=h=>h.replace('<details class="whyd"','<details class="whyd pnb-fold"');   /* the one fold, tagged so it can sit a little tighter under the cards */
const pnbCards=a=>`<div class="pc-cards pnb-cards">${a.join('')}</div>`;
/* a line inside a fold: name left, Q1 to Q16 right, an optional reason under it (only where the model's own text gives one) */
const pnbLine=(name,a,b,why='')=>`<li><div class="pnb-fh"><span>${name}</span><b>${pnbP(a)} → ${pnbP(b)}</b></div>${why?`<small>${why}</small>`:''}</li>`;

/* ---------------------------------------------------------------- step 1: Revenue ---------------------------------------------------------------- */
/* the share a line wins by its age: six points on one line, each labelled */
function pnbRamp(ramp){
  const w=280,h=68,x0=16,x1=w-16,base=46,top=19,hi=Math.max(...ramp),X=i=>x0+(x1-x0)*i/(ramp.length-1),Y=v=>base-(base-top)*v/hi,ord=['1st','2nd','3rd','4th','5th','6th'];
  const d=ramp.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join('');
  let s=`<line x1="${x0-8}" x2="${x1+8}" y1="${base}" y2="${base}" stroke="${PC.line}"/>`
   +`<path d="${d}L${X(ramp.length-1).toFixed(1)} ${base}L${X(0).toFixed(1)} ${base}Z" fill="${PC.revBg}"/>`
   +`<path d="${d}" fill="none" stroke="${PC.rev}" stroke-width="2.6" stroke-linejoin="round"/>`;
  ramp.forEach((v,i)=>{const e=i===0||i===ramp.length-1;
    s+=`<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="${e?4.6:3.4}" fill="${e?PC.rev:'#fff'}" stroke="${PC.rev}" stroke-width="2"/>`
     +T(X(i),Y(v)-8,`${fd(v*100,0)}%`,'slab-b','middle',`font-size:${e?13.5:12.5}px;font-weight:${e?700:600};fill:${PC.rev}`)
     +T(X(i),base+16,ord[i]||String(i+1),'smut','middle','font-size:12px');});
  return `<svg class="pc-svg pnb-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Share of a unit's market a line wins by its age, in quarters: ${ramp.map(v=>fd(v*100,0)+'%').join(', ')}">${s}</svg>`;
}
/* the product lines on the 16 quarters; each name sits above or below the line, whichever is clear of its neighbour */
function pnbLaunch(){
  const w=280,h=56,x0=8,x1=w-8,ax=28,X=q=>x0+(x1-x0)*q/15,nm={tile:'Tile',niche:'Niche',wood:'Wood',upvc:'uPVC',p5:'Waterproofing'},fs=12.5,placed={u:[],d:[]};
  let s=`<line x1="${x0}" x2="${x1}" y1="${ax}" y2="${ax}" stroke="${PC.line}" stroke-width="1.6"/>`;
  for(let q=0;q<16;q++)s+=`<line x1="${X(q).toFixed(1)}" x2="${X(q).toFixed(1)}" y1="${ax-3}" y2="${ax+3}" stroke="${PC.line}"/>`;
  const order=[...P].sort((a,b)=>MODEL.products[a].launch-MODEL.products[b].launch),lab=[];let alt='u';
  order.forEach(p=>{const q=MODEL.products[p].launch-1,t=q===0?(nm[p]||SH[p]):`${nm[p]||SH[p]} ${qName(q)}`,tw=pnbW(t,fs,600),x=X(q);
    const spans={middle:[x-tw/2,x+tw/2],start:[x-5,x-5+tw],end:[x+5-tw,x+5]},fit=a=>spans[a][0]>=1&&spans[a][1]<=w-1,free=(k,a)=>fit(a)&&placed[k].every(b=>spans[a][1]+6<=b[0]||spans[a][0]-6>=b[1]);
    const rows=[alt,alt==='u'?'d':'u'];let pick=null;
    for(const k of rows){for(const a of ['middle','start','end'])if(free(k,a)){pick=[k,a];break;}if(pick)break;}
    if(!pick)pick=[alt,fit('middle')?'middle':'start'];
    const [row,a]=pick;placed[row].push(spans[a]);alt=row==='u'?'d':'u';
    lab.push({p,q,t,x,a,row,tx:a==='middle'?x:a==='start'?x-5:x+5});});
  lab.forEach(o=>{s+=`<circle cx="${o.x.toFixed(1)}" cy="${ax}" r="5.2" fill="${PC.rev}" stroke="#fff" stroke-width="1.4"/>`+T(o.tx,o.row==='u'?ax-10:ax+22,o.t,'slab-b',o.a,`font-size:${fs}px;font-weight:600;fill:${PC.ink}`);});
  return `<svg class="pc-svg pnb-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Launch quarters of the product lines: ${lab.map(o=>o.t).join(', ')}">${s}</svg>`;
}

CX.rev=D=>{
  const m=MODEL,Q=operatingModel().S,T15=D.T[15],w=Q[15],rt=view(SCOPE.core,'city'),dd=view(SCOPE.core,'dist'),uc=unitsBy('city',15),ud=unitsBy('dist',15),ramp=m.ramp.med,
    mk=m.market.medCity,sz=m.products.tile.size,sh=ramp[ramp.length-1],one=mk*sz*sh,n=P.length,late=Q[13].net,
    lines=P.map(p=>({p,v:sum(w.rows.filter(r=>r.p===p).map(r=>r.rev))})),mx=Math.max(...lines.map(l=>l.v)),mc=Math.max(rt.T[15],dd.T[15]),
    pc=v=>`${fd(v/T15*100,0)}%`,waits=['wood','upvc','p5'].map(p=>m.products[p].wait);
  const c1=pnbCard('How revenue is built',
    pnbEq([pnbChip('Units open','1'),pnbOp('×'),pnbChip('Market size',`₹${pnbN(mk)}${pnbCr('')}`),pnbOp('×'),pnbChip('Product size',`${pnbN(sz)}×`),pnbOp('×'),pnbChip('Share at age',`${fd(sh*100,0)}%`)])
    +`<div class="pnb-res"><i class="pnb-op">=</i><b>₹${fd(one,2)}<small>&thinsp;Cr a month</small></b></div>`
    +pnbText(`One medium city, tile adhesive, fully ramped. Add up ${uc+ud} units and ${n} lines: <b>${rc(T15)}</b> at Q16.`),PC.rev);
  const c2=pnbCard('Share builds with age',pnbRamp(ramp)+pnbText('Contractors try, repeat, then switch.'),PC.rev);
  const c3=pnbCard(`${pnbCap(pnbWords[n]||String(n))} lines, launched in turn`,pnbLaunch(),PC.rev);
  const rows=a=>a.map(([l,v,mxv])=>`<div class="pnb-hb"><span>${l}</span><i style="width:${Math.max(v/mxv,.02)*100}%;background:${PC.rev}"></i><b>${pc(v)}</b></div>`).join('');
  const fold=pnbF(whyD('Q16 mix and what if revenue slips',
    `<p class="pnb-fk">Share of Q16 revenue</p>${rows(lines.map(l=>[SH[l.p],l.v,mx]))}<div class="pnb-sep"></div>${rows([['Cities',rt.T[15],mc],['Dealer zones',dd.T[15],mc]])}`
    +`<p class="pnb-fn">${uc} cities and ${ud} dealer zones are open by Q16. A new line waits ${Math.min(...waits)}–${Math.max(...waits)} quarters in a city before it sells. GST is ignored.</p>`
    +cxLev('Q16 revenue a month if…',[['Revenue runs two quarters late',rc(late),dlt(late,w.net)],['70% of the plan is achieved',rc(w.net*.7),dlt(w.net*.7,w.net)]],`${capLink('basis','Model basis · 01')}${capLink('cities','Cities and DD zones · 04')}${capLink('products','Products · 05')}`)));
  return {lead:'',body:pnbCards([c1,c2,c3])+fold};
};

/* ---------------------------------------------------------------- step 2: Margins ---------------------------------------------------------------- */
const pnbShort={influencer:'influencer schemes',brand:'brand payout',rm:'RM salaries',lastMile:'last-mile',discount:'discounts',npa:'NPAs / returns',software:'software',salary:'salaries',cac:'customer acquisition',office:'office',godown:'godown rent',marketing:'marketing',legal:'finance and legal'};
/* the reasons the model's own text gives for a line; a line with none here has none in the file and is left without one */
const pnbWhy={
  influencer:'Rewards paid to contractors and distributors, which bring dealer and distributor orders.',
  brand:'A partner brand on entry-level adhesive lets distributors in new zones say yes on day one.',
  rm:'Falls as RMs mature and carry more lines per contractor.',
  lastMile:'Falls as stores fill up and each delivery carries more value.'};

CX.mar=D=>{
  const Q=operatingModel().S,f=Q[0],l=Q[15],cm1=l.cm1P,cm2=l.cm2P,pat=l.patP,cost=f.cogsP+f.varP+f.fixP;
  /* one step of the waterfall: lo and hi are % of revenue; subtotals are outlined, costs hang from the level above */
  const row=(name,lo,hi,col,val,kind='')=>`<div class="pnb-wf ${kind}"><span>${name}</span><span class="t"><i style="left:${Math.max(lo,0)}%;width:${Math.max(hi-lo,.8)}%;${col?`background:${col}`:`box-shadow:inset 0 0 0 1.5px ${PC.mute}`}"></i></span><b${kind.includes('tot')?` style="color:${col}"`:''}>${val}</b></div>`;
  const wf=row('Revenue',0,100,PC.rev,'100%')
   +row('Cost of goods',cm1,100,PC.cogs,'−'+pctR(l.cogsP))+row('CM1',0,cm1,'',pctR(cm1),'sub')
   +row('Selling costs',cm2,cm1,PC.sell,'−'+pctR(l.varP))+row('CM2',0,cm2,'',pctR(cm2),'sub')
   +row('Common overhead',Math.max(pat,0),cm2,PC.oh,'−'+pctR(l.fixP))+row('Operating profit',0,Math.abs(pat),pat<0?PC.loss:PC.profit,pctR(pat),pat<0?'tot loss':'tot');
  const c1=pnbCard('From revenue to profit · Q16',`<div class="pnb-wfs">${wf}</div>`+pnbText(`Q1: costs ${pctR(cost)} of revenue, margin ${pctR(f.patP)}.`),PC.profit);
  /* each cost group: its Q1 → Q16 share and the two lines that weigh most at Q16 */
  const top=(lines,get)=>lines.map(([k])=>({k,b:get(l,k)})).sort((x,y)=>y.b-x.b).slice(0,2).map(x=>`${pnbShort[x.k]} ${pnbPc(x.b)}`).join(' · ');
  const grp=[
   ['Cost of goods',PC.cogs,f.cogsP,l.cogsP,'Materials and inbound freight'],
   ['Selling costs',PC.sell,f.varP,l.varP,pnbCap(top(OP_LINES,(r,k)=>r.amount[k]/r.net*100))],
   ['Common overhead',PC.oh,f.fixP,l.fixP,pnbCap(top(OP_COSTS,(r,k)=>r.overhead.by[k]/r.net*100))]];
  const c2=pnbCard('What each cost holds',`<div class="pnb-gr">${grp.map(([n,col,a,b,it])=>`<div class="pnb-g"><div class="pnb-gh"><span>${swc(col)}${n}</span><b>${pctR(a)} → ${pctR(b)}</b></div><small>${it}</small></div>`).join('')}</div>`,PC.sell,'Q1 → Q16');
  const c3=pnbCard('Why the margin rises',pnbText(`Revenue grows ${fd(l.net/f.net,0)}×; overhead only ${fd(l.fixed/f.fixed,0)}×.`)+pnbText('RMs mature and stores fill up.'),PC.profit);
  const sellL=OP_LINES.map(([k,lb])=>pnbLine(lb,f.amount[k]/f.net*100,l.amount[k]/l.net*100,pnbWhy[k]||'')).join('');
  const ohL=OP_COSTS.map(([k,lb])=>pnbLine(lb,f.overhead.by[k]/f.net*100,l.overhead.by[k]/l.net*100)).join('');
  const fold=pnbF(whyD('Every cost line and why it moves',
    `<p class="pnb-fk">${swc(PC.cogs)}Cost of goods · ${pctR(f.cogsP)} → ${pctR(l.cogsP)}</p><p class="pnb-fn">Materials and inbound freight. Volume buying and own-label formulations lower it, and the mix of sales moves it.</p>`
    +`<p class="pnb-fk">${swc(PC.sell)}Selling costs · ${pctR(f.varP)} → ${pctR(l.varP)}</p><ul class="pnb-fl">${sellL}</ul>`
    +`<p class="pnb-fk">${swc(PC.oh)}Common overhead · ${pctR(f.fixP)} → ${pctR(l.fixP)}</p><ul class="pnb-fl">${ohL}</ul><p class="pnb-fn">Overhead is a budget set by revenue level, so it grows far slower than revenue: salaries, office, software and store rent are absorbed over a bigger base. Operating profit is before tax, interest and depreciation.</p>`
    +cxLev('Q16 operating profit a month if…',[['Cost of goods is 1 point higher',sr(l.pat-l.net*.01),dlt(l.pat-l.net*.01,l.pat)],['Common overhead is 20% higher',sr(l.pat-l.fixed*.2),dlt(l.pat-l.fixed*.2,l.pat)]])
    +`<p class="pnb-fn">Cost rates move in a straight line from Q1 to Q16, weighted by revenue. GST is ignored. ${capLink('audit','All 16 monthly snapshots · 06')}</p>`));
  return {lead:'',body:pnbCards([c1,c2,c3])+fold};
};

/* ---------------------------------------------------------------- step 5: Investor return ---------------------------------------------------------------- */
CX.ret=D=>{
  const R=D.R,X=D.X,ret=D.ret,pr=ret.pr,q=X.q,e=pr[0],Fd=INP.funding,cur=X.m==='arr'?`arr-${X.mult}`:X.m,held=pr.filter(r=>r.q<=q),last=held[held.length-1],n=held.length;
  const lb=k=>k==='pat'?`${f0(Fd.multPat)}× profit`:k==='model'?'Round-pricing method':(RET_M.find(x=>x[0]===k)||[0,`${X.mult}× ARR`])[1];
  const pre=`<div class="pnb-ctl"><div class="pnb-cr"><span>Exit valued at</span>${seg(RET_M.map(([k])=>[k,lb(k)]),cur,'exitm','Exit valued at')}</div><div class="pnb-cr" title="Changes exit valuation only; funding and operating cash stay fixed."><span>Exit revenue vs plan</span>${seg([[1,'100%'],[0.7,'70%'],[0.5,'50%']],X.ach,'ach','Share of the revenue plan achieved')}</div></div>`;
  /* card 1: the stake after round 1, and what is left of it after the last round counted (solid = kept, pale = sold on) */
  const kept=last.stake/e.stake;
  const c1=pnbCard('Your stake',`<div class="pnb-st"><div><small>round 1</small><b>${pct2(e.stake)}</b></div><div class="pnb-bar" title="${fd(kept*100,0)}% of the round 1 stake is kept"><i style="width:${kept*100}%"></i></div><div class="r"><small>after round ${n}</small><b>${pct2(last.stake)}</b></div></div>`,PC.value,n>1?`round ${n} sells ${fd(last.sold*100,0)}% of Tejas`:'');
  /* card 2: ARR × multiple + cash − debt = equity value; × stake = value of the first ₹40 Cr; and the multiple on it (₹ Cr) */
  const arr=12*D.T[q]*X.ach,pat4=12*R.G.patMonthly[q]*X.ach,base=X.m==='pat'?['Profit a year',pat4]:['ARR',arr],mult=base[1]>0?ret.ev/base[1]:0;
  const c2=pnbCard(`Potential proceeds · ${pnbR(ret.val)}`,
    pnbEq([pnbChip(base[0],fd(base[1],0)),pnbOp('×'),pnbChip('Multiple',xS(mult)),pnbOp('+'),pnbChip('Cash',fd(ret.cash,0)),pnbOp('−'),pnbChip('Debt',fd(ret.debt,0))],'fit')
    +pnbEq([pnbOp('='),pnbChip('Equity value',fd(ret.eqv,0),{grow:1}),pnbOp('×'),pnbChip('Your stake',pct2(ret.s),{grow:1})],'fit')
    +pnbEq([pnbOp('='),pnbChip(`First ${pnbR(e.amt)} becomes`,fd(ret.val,0),{res:1,col:PC.value,grow:1}),pnbChip('Times the money',xS(ret.mult),{res:1,col:PC.value})])
    +pnbText(`${qName(q)} exit at ${cur==='model'?'the round-pricing method':lb(cur)}, after dilution.`),PC.value,`${xS(ret.mult)} on ${pnbR(e.amt)} invested.`);
  const c3=pnbCard('Not counted',pnbText(`Later ${R.P.cadenceQ*3}-monthly rounds dilute further.`),PC.fund);
  const others=RET_M.filter(([k])=>k!==cur).map(([k])=>{const [m,x]=k.split('-'),r=investorReturn(R,{q,m,mult:x?+x:undefined,ach:X.ach});return [k==='model'?'On the round method':`At ${lb(k)}`,rc(r.val),`${xS(r.mult)} · IRR ${pct1(r.irr*100)}`];});
  const fold=pnbF(whyD('How the stake and the value are worked out',
    `<p class="pnb-fn">Round 1 buys ${pct2(e.stake)}: ${pnbR(e.amt)} at ${rc(e.post)} post-money, ${xS(e.mArr)} ARR.${held[1]?` Round 2 sells ${fd(held[1].sold*100,1)}% of the company at ${rc(held[1].post)} post-money, so the stake is multiplied by pre ÷ post = ${fd(held[1].pre/held[1].post*100,1)}%.`:''}${fn(NOTE_PRICE)}</p>`
    +`<p class="pnb-fn">The exit is fixed at ${qName(q)} (${EXIT[q]}, the last quarter): ${rc(ret.val)} is ${xS(ret.mult)} the money, an IRR of ${pct1(ret.irr*100)} a year. Each bar in the chart values the stake as if Tejas exited in that quarter.${fn(NOTE_RET)}</p>`
    +cxLev(`The same ${qName(q)} exit, valued other ways`,others)
    +`<p class="pnb-fn">Round 1 is priced at ${xS(INP.valuation.multiple)} today’s ARR; later rounds at the ARR multiple for their quarter (${xS(Fd.multQ4)} at Q4, ${xS(Fd.multQ8)} at Q8, ${xS(Fd.multQ16)} at Q16), blended into ${f0(Fd.multPat)}× annualised operating profit as the margin rises from ${f0(Fd.blendLo)}% to ${f0(Fd.blendHi)}%.</p>`));
  return {lead:'',pre,body:pnbCards([c1,c2,c3])+fold};
};
}
