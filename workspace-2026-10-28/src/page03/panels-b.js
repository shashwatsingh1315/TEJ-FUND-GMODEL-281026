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
const pnbW=(s,fs,wt)=>typeof pcW==='function'?pcW(s,fs,wt):String(s).length*fs*.6;   /* text width, from the page's own measure */
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
  const w=264,h=80,x0=8,x1=w-8,ax=38,X=q=>x0+(x1-x0)*q/15,nm={tile:'Tile',niche:'Niche',wood:'Wood',upvc:'uPVC',p5:'Waterproofing'},fs=13,placed={u:[],d:[]};
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
  lab.forEach(o=>{s+=`<circle cx="${o.x.toFixed(1)}" cy="${ax}" r="5.2" fill="${PC.rev}" stroke="#fff" stroke-width="1.4"/>`+T(o.tx,o.row==='u'?ax-13:ax+27,o.t,'slab-b',o.a,`font-size:${fs}px;font-weight:600;fill:${PC.ink}`);});
  return `<svg class="pc-svg pnb-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Launch quarters of the product lines: ${lab.map(o=>o.t).join(', ')}">${s}</svg>`;
}

CX.rev=D=>{
  const m=MODEL,Q=operatingModel().S,T15=D.T[15],w=Q[15],rt=view(SCOPE.core,'city'),dd=view(SCOPE.core,'dist'),uc=unitsBy('city',15),ud=unitsBy('dist',15),ramp=m.ramp.med,
    mk=m.market.medCity,sz=m.products.tile.size,sh=ramp[ramp.length-1],one=mk*sz*sh,n=P.length,late=Q[13].net,
    lines=P.map(p=>({p,v:sum(w.rows.filter(r=>r.p===p).map(r=>r.rev))})),mx=Math.max(...lines.map(l=>l.v)),mc=Math.max(rt.T[15],dd.T[15]),
    pc=v=>`${fd(v/T15*100,0)}%`,waits=['wood','upvc','p5'].map(p=>m.products[p].wait);
  const m0=INP.valuation.todayMRR,g=Math.pow(D.T[7]/m0,1/23)-1;   /* monthly growth from today's MRR to the Q8 quarter-end month: 23 months */
  const c0=PK.card({col:PC.rev,title:`${fd(T15/m0,0)}× in ${pnbWords[16/4]} years`,hero:[`₹${fd(m0,1)} → ₹${fd(T15,1)} Cr`,'a month'],
    note:`About <b>${fd(g*100,0)}% a month</b> for the first two years`});
  const op=c=>`<i class="pk-op">${c}</i>`;
  const c1=PK.card({col:PC.rev,title:'How one unit’s revenue is built',
    body:PK.led([{l:op('')+'Units open',v:'1'},{l:op('×')+'Market size',v:`₹${pnbN(mk)} Cr`},{l:op('×')+'Product size',v:`${pnbN(sz)}×`},{l:op('×')+'Share at age',v:`${fd(sh*100,0)}%`},{l:op('=')+'Revenue a month',v:`₹${fd(one,2)} Cr`,tot:1}]),
    note:`${uc+ud} units, ${n} lines: <b>${rc(T15)}</b> at Q16`});
  /* the lines in launch order, as chips: HTML, so the type stays one size on every screen */
  const order=[...P].sort((a,b)=>m.products[a].launch-m.products[b].launch),lname={tile:'Tile',niche:'Niche',wood:'Wood',upvc:'uPVC',p5:'Waterproofing'};
  const chips=`<div class="pnb-lc">${order.map(p=>{const q=m.products[p].launch-1;return `<span><i></i>${lname[p]||SH[p]}<em>${q>0?qName(q):'now'}</em></span>`;}).join('')}</div>`;
  const c3=PK.card({col:PC.rev,title:`${pnbCap(pnbWords[n]||String(n))} lines, launched in turn`,body:PK.vis(chips)});
  const rows=a=>a.map(([l,v,mxv])=>`<div class="pnb-hb"><span>${l}</span><i style="width:${Math.max(v/mxv,.02)*100}%;background:${PC.rev}"></i><b>${pc(v)}</b></div>`).join('');
  const fold=pnbF(whyD('Share by age, mix, what-ifs',
    `<p class="pnb-fk">Share builds with age</p>${pnbRamp(ramp)}<p class="pnb-fn">Contractors try, repeat, then switch.</p>`
    +`<p class="pnb-fk" style="margin-top:12px">Share of Q16 revenue</p>${rows(lines.map(l=>[SH[l.p],l.v,mx]))}<div class="pnb-sep"></div>${rows([['Cities',rt.T[15],mc],['Dealer zones',dd.T[15],mc]])}`
    +`<p class="pnb-fn">${uc} cities and ${ud} dealer zones are open by Q16. A new line waits ${Math.min(...waits)}–${Math.max(...waits)} quarters in a city before it sells. GST is ignored.</p>`
    +cxLev('Q16 revenue a month if…',[['Revenue runs two quarters late',rc(late),dlt(late,w.net)],['70% of the plan is achieved',rc(w.net*.7),dlt(w.net*.7,w.net)]],`${capLink('basis','Model basis · 01')}${capLink('cities','Cities and DD zones · 04')}${capLink('products','Products · 05')}`)));
  return {lead:'',body:pnbCards([c0,c1,c3])+fold};
};

/* ---------------------------------------------------------------- step 2: Margins ---------------------------------------------------------------- */
/* the founders' names for the cost lines; the base arrays OP_LINES / OP_COSTS carry the same names, so every page matches */
const pnbNames={influencer:'Influencer payouts / distributor schemes',brand:'Brand payout',rm:'RM costs (salary, TA/DA, bonus)',lastMile:'Last-mile logistics overheads',discount:'Discounts',npa:'NPAs / returns',
  software:'3rd-party software, subscriptions & reports',salary:'Employees’ salaries & tours',cac:'Customer acquisition cost (CAC)',office:'Office & administrative expenses',godown:'Godown rent & expenses',marketing:'Marketing / promotion expenses',legal:'Finance & legal fees'};
OP_LINES.forEach(r=>{if(pnbNames[r[0]])r[1]=pnbNames[r[0]];});OP_COSTS.forEach(r=>{if(pnbNames[r[0]])r[1]=pnbNames[r[0]];});
/* the reasons the model's own text gives for a line; a line with none here has none in the file and is left without one */
const pnbWhy={
  influencer:'Rewards paid to contractors and distributors, which bring dealer and distributor orders.',
  brand:'A partner brand on entry-level adhesive lets distributors in new zones say yes on day one.',
  rm:'AI-enabled workflow and multi-category focus.',
  lastMile:'Falls as stores fill up and each delivery carries more value.'};

CX.mar=D=>{
  const Q=operatingModel().S,f=Q[0],l=Q[15];
  /* one step of the waterfall: lo and hi are % of revenue; subtotals are outlined, costs hang from the level above */
  const row=(name,lo,hi,col,val,kind='')=>`<div class="pnb-wf ${kind}"><span>${name}</span><span class="t"><i style="left:${Math.max(lo,0)}%;width:${Math.max(hi-lo,.8)}%;${col?`background:${col}`:`box-shadow:inset 0 0 0 1.5px ${PC.mute}`}"></i></span><b${kind.includes('tot')?` style="color:${col}"`:''}>${val}</b></div>`;
  const cm1=l.cm1P,cm2=l.cm2P,pat=l.patP;
  /* revenue less the three cost groups gives operating profit; CM1 and CM2 are in the table under the chart */
  const wf=row('Revenue',0,100,PC.rev,'100%')
   +row('Cost of goods',cm1,100,PC.cogs,'−'+pctR(l.cogsP))
   +row('Selling costs',cm2,cm1,PC.sell,'−'+pctR(l.varP))
   +row('Fixed costs',Math.max(pat,0),cm2,PC.oh,'−'+pctR(l.fixP))+row('Operating profit',0,Math.abs(pat),pat<0?PC.loss:PC.profit,pctR(pat),pat<0?'tot loss':'tot');
  /* card A: the three levers, each as its share of revenue at Q1 and Q16 with the reason */
  const sh=(w,k)=>w.amount[k]/w.net*100,fx=(w,ks)=>sum(ks.map(k=>w.overhead.by[k]))/w.net*100,A=(a,b)=>`${pnbPc(a)} → ${pnbPc(b)}`;
  const rel=(l.cogsP/f.cogsP-1)*100;
  /* the headline: the monthly growth over the first two years (as on step 1), and whether the operating margin never falls */
  const g=Math.pow(D.T[7]/INP.valuation.todayMRR,1/23)-1,up=Q.every((w,i)=>!i||w.patP>=Q[i-1].patP-0.05);
  const c1=PK.card({col:PC.profit,title:up?'Margins improve every quarter':'Margins improve as we grow',sub:`as revenue grows about ${fd(g*100,0)}% a month`,
    body:PK.rows([
      {sw:PC.cogs,name:'Cost of goods',fig:A(f.cogsP,l.cogsP),why:`${fd(-rel,0)}% lower: buying at scale, own-label formulations, plant utilisation`},
      {sw:PC.sell,name:'RM costs',fig:A(sh(f,'rm'),sh(l,'rm')),why:pnbWhy.rm.replace(/\.$/,'')},
      {sw:PC.oh,name:'Fixed costs',fig:A(f.fixP,l.fixP),why:`Salaries ${pnbP(fx(f,['salary']))} → ${pnbP(fx(l,['salary']))} · marketing + CAC ${pnbP(fx(f,['marketing','cac']))} → ${pnbP(fx(l,['marketing','cac']))}`}])});
  const c2=PK.card({col:PC.profit,title:'From revenue to profit · Q16',body:PK.vis(`<div class="pnb-wfs">${wf}</div>`)});
  const disc=Q.some(w=>Math.abs(w.amount.discount)>1e-9),sellKs=OP_LINES.filter(([k])=>k!=='discount'||disc);
  const sellL=sellKs.map(([k,lb])=>pnbLine(lb,sh(f,k),sh(l,k),pnbWhy[k]||'')).join('');
  const ohL=OP_COSTS.map(([k,lb])=>pnbLine(lb,f.overhead.by[k]/f.net*100,l.overhead.by[k]/l.net*100)).join('');
  const fold=pnbF(whyD('Every cost line',
    `<p class="pnb-fk">${swc(PC.cogs)}Cost of goods · ${pctR(f.cogsP)} → ${pctR(l.cogsP)}</p><p class="pnb-fn">Materials and inbound freight. Volume buying and own-label formulations lower it, and the mix of sales moves it.</p>`
    +`<p class="pnb-fk">${swc(PC.sell)}Selling costs · ${pctR(f.varP)} → ${pctR(l.varP)}</p><ul class="pnb-fl">${sellL}</ul>`
    +`<p class="pnb-fk">${swc(PC.oh)}Fixed costs · ${pctR(f.fixP)} → ${pctR(l.fixP)}</p><ul class="pnb-fl">${ohL}</ul><p class="pnb-fn">Fixed costs are a budget set by revenue level, so they grow far slower than revenue: salaries, office, software and store rent are absorbed over a bigger base. Operating profit is before tax, interest and depreciation.</p>`
    +cxLev('Q16 operating profit a month if…',[['Cost of goods is 1 point higher',sr(l.pat-l.net*.01),dlt(l.pat-l.net*.01,l.pat)],['Fixed costs are 20% higher',sr(l.pat-l.fixed*.2),dlt(l.pat-l.fixed*.2,l.pat)]])
    +`<p class="pnb-fn">Cost rates move in a straight line from Q1 to Q16, weighted by revenue. GST is ignored. ${capLink('audit','All 16 monthly snapshots · 06')}</p>`));
  return {lead:'',body:pnbCards([c1,c2])+fold};
};

/* ---------------------------------------------------------------- step 5: Investor return ---------------------------------------------------------------- */
CX.ret=D=>{
  const R=D.R,X=D.X,ret=D.ret,ld=ret.lead,pr=ret.pr,q=X.q,e=pr[0],Fd=INP.funding,L=ld.amt,cur=X.m==='pat'?'pat':`arr-${X.mult}`;
  const n0=v=>`₹${fd(v,0)} Cr`,lb=k=>k==='pat'?`${f0(Fd.multPat)}× operating profit`:`${f0(+String(k).split('-')[1]||X.mult)}× ARR`,lbs=k=>k==='pat'?`${f0(Fd.multPat)}× profit`:lb(k);
  /* the one control: how the Q16 exit is valued (the labels come from the inputs; short on the buttons so the row stays one line) */
  const pre=`<div class="pnb-ctl"><div class="pnb-cr"><span>Exit valued at</span>${seg(RET_M.map(([k])=>[k,lbs(k)]),cur,'exitm','Exit valued at')}</div></div>`;
  const c1=PK.card({col:PC.value,title:`${n0(L)} in this round`,hero:[pcXh(ld.mult),`at a ${qName(q)} exit`],note:`${n0(ld.val)} · ${pctR(ld.irr*100)} a year · valued at ${lb(cur)}`});
  /* card 2: the value of the cheque at each round's post-money price, then at the exit */
  const rows=[...ld.marks.map(m=>({l:`Round ${m.n} · ${qName(m.q)}`,v:m.val,x:m.mult})),{l:`Exit · ${qName(q)}`,v:ld.val,x:ld.mult,end:1}],mx=Math.max(...rows.map(r=>r.v),1e-9);
  const c2=PK.card({col:PC.value,title:'Marked up at every round',body:PK.vis(`<div class="pnr-rows">${rows.map(r=>`<div class="pnr-r${r.end?' end':''}"><span>${r.l}</span><i><u style="width:${(Math.max(r.v/mx,.03)*100).toFixed(1)}%"></u></i><b>${n0(r.v)}</b><em>${pcX(r.x)}</em></div>`).join('')}</div>`)});
  /* card 3: Tejas's equity value at the exit: EV (ARR or profit times the multiple) plus cash */
  const arr=12*D.T[q],pat4=12*R.G.patMonthly[q],basis=X.m==='pat'?`Operating profit ${n0(pat4)} × ${f0(Fd.multPat)}`:`ARR ${n0(arr)} × ${f0(X.mult)}`,led=[{l:basis,v:n0(ret.ev)},{l:'Cash on hand',v:n0(ret.cash)}];
  if(ret.debt>1e-9)led.push({l:'Debt',v:'−'+n0(ret.debt)});
  led.push({l:'Equity value',v:n0(ret.eqv),tot:1});
  const c3=PK.card({col:PC.value,title:'Tejas at exit',body:PK.led(led),note:'Acquired revenue not included: upside.'});
  const others=RET_M.filter(([k])=>k!==cur).map(([k])=>{const [m,x]=k.split('-'),r=investorReturn(R,{q,m,mult:x?+x:undefined,ach:1}).lead;return [`At ${lb(k)}`,n0(r.val),`${pcXh(r.mult)} · IRR ${pctR(r.irr*100)}`];});
  const fold=pnbF(whyD('How the value is worked out',
    `<p class="pnb-fn">The ${n0(L)} goes in at round 1’s price: ${n0(e.post)} post-money, ${f0(INP.valuation.multiple)}× today’s ARR of ${n0(e.arr)}. Rounds 2 to ${pr.at(-1).n} are priced at ${f0(R.P.roundMult)}× the ARR of their quarter, and all ${pr.length} rounds are counted. Each round row in the panel is the ${n0(L)} at that round’s post-money price.</p>`
    +`<p class="pnb-fn">The exit is fixed at ${qName(q)} (${QD[q].a}–${QD[q].z} ${QD[q].yz}, the last quarter): ${n0(ld.val)} is ${pcXh(ld.mult)} the money, ${pctR(ld.irr*100)} a year. Each bar in the chart is the same ${n0(L)} valued as if Tejas exited in that quarter.</p>`
    +cxLev(`The same ${qName(q)} exit, valued the other way`,others)
    +`<p class="pnb-fn">Acquisitions are counted at cost: ${R.acq.usd>0?`$${fd(R.acq.usd,0)}M (${n0(R.acq.amt)}) `:''}is held as cash at face value, and the revenue it may bring is upside, left out.</p>`));
  return {lead:'',pre,body:pnbCards([c1,c2,c3])+fold};
};
}
