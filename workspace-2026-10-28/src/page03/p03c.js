
/* ---------- headings, keys, takeaways ---------- */
const pcS=v=>`<span class="nw">${sr(v)}</span>`,pcR=v=>`₹${fd(v,Math.abs(v%1)>1e-9?1:0)} Cr`,pcN=(v,d=1)=>Math.abs(v)<Math.pow(10,-d)/2?'–':(v<0?'−':'')+fd(Math.abs(v),d);
const pcRound=(r,P)=>Math.max(P.roundTo,Math.ceil(r.raw/P.roundTo-1e-9)*P.roundTo);   /* what the cash rule alone would size round 2 at */
cxHeads=function(D){
  return [
   ['Monthly revenue','Revenue in the final month of each quarter.'],
   ['Costs and operating profit','Revenue split into product costs, selling costs, overhead and profit.'],
   ['Quarterly cash flow','Operating earnings less growth investment, before financing. Shaded: funding gap before financing.'],
   ['Projected cash balance','Cash remaining after investment, equity and debt.'],
   ['Potential investor return','Exit equity value × ownership after dilution. Exit equity value includes projected cash less outstanding debt.'],
   ['Operating return on capital','Annualised monthly operating profit ÷ modelled capital. Dots show return after depreciation.']];
};
cxLegends=function(D){
  const i=(c,l,x='')=>`<span>${swc(c,x)}${l}</span>`,ln=(st,l)=>`<span><i class="ln" style="${st}"></i>${l}</span>`,R=D.R;
  return [
   i(PC.rev,'Revenue a month, all product lines')+'<span class="lg-n">label: total a month · product lines in the table</span>',
   i(PC.cogs,'Cost of goods')+i(PC.sell,'Selling costs')+i(PC.oh,'Common overhead')+i(PC.profit,'Operating profit')+i(PC.loss,'Operating loss')+i('#fff','Revenue',`box-shadow:inset 0 0 0 2px ${PC.rev}`)+'<span class="lg-n">labels: revenue, operating margin</span>',
   i(PC.profit,'Operating earnings (up)')+i(PC.capex,'Capex (down)')+i(PC.labs,'Labs / systems')+i(PC.wc,'Increase in working capital')+(R.D.on?i(PC.int,'Loan interest'):'')+i(PC.fundBg,'Cash required (running total)',`outline:1px solid ${PC.fund}`)+i(PC.revBg,'Revenue a month (background)'),
   i(PC.revBg,'Revenue a month (background)')+ln(`border-top:2.5px solid ${PC.cash}`,'Closing cash (label: each quarter end)')+i(PC.fund,'Equity round'),
   i(PC.value,'Stake value at that exit')+i('#fff','Exit used',`outline:2px solid ${INK};outline-offset:-2px`)+ln(`border-top:1.5px dashed ${PC.fund}`,`${pcR(D.pr[0].amt)} put in`),
   i(PC.profit,'Return before depreciation')+`<span><i class="dot o" style="border-color:${PC.profit}"></i>After depreciation</span>`+i(PC.loss,'Below zero')+'<span class="lg-n">axis stops at −20%</span>'];
};
/* three takeaways per step, every figure computed from the model */
/* the colour of each takeaway: [edge, figure] */
const pcTc={rev:[PC.rev,PC.rev],profit:[PC.profit,PC.profit],oh:[PC.oh,PC.oh],fund:[PC.fund,PC.fundTxt],capex:[PC.capex,PC.capex],cash:[PC.cash,PC.cash],value:[PC.value,PC.value]};
const pcTk=[['rev','rev','rev'],['profit','profit','oh'],['fund','capex','profit'],['fund','cash','fund'],['value','value','value'],['profit','profit','profit']];
function pcTakes(D){
  const S=cxSeries(D),O=operatingModel().S,R=D.R,P2=R.P,G=D.G,K=G.K,T=D.T,m0=INP.valuation.todayMRR,X=D.X,ret=D.ret,e=D.pr[0],ro=roceFin(G),f=O[0],l=O[15],c15=K.cum[15],M=D.B.V.M,t15=T[15];
  const newLines=['wood','upvc','p5'].filter(p=>MODEL.products[p].launch>1),newShare=sum(newLines.map(p=>M[p][15]))/t15,dz=view(SCOPE.core,'dist').T[15]/t15,uc=unitsBy('city',15),ud=unitsBy('dist',15);
  const pos=O.findIndex(r=>r.pat>=0.005),burn=sum(operatingModel().months.map(r=>Math.max(0,-r.pat))),tot=c15.capex+c15.pp+c15.wc;
  const rs=R.rounds,r2=rs[1],back=ret.path.findIndex(v=>v>=e.amt),mod=D.pr.filter(r=>r.q<=X.q),rp=ro.findIndex(r=>r.pre>0),lv=pcCashLevel(R);
  const T3=[
   [[`${rc(t15)} a month by Q16`,`${fd(t15/m0,0)}× today’s ${rc(m0)}`],[`${fd(newShare*100,0)}% from new lines`,`of Q16 revenue comes from lines launched after today: ${newLines.map(p=>SH[p].toLowerCase()).join(', ').replace('upvc','uPVC')}`],[`${fd(dz*100,0)}% through dealer zones`,`of Q16 revenue; cities bring the other ${fd((1-dz)*100,0)}% (${uc} cities and ${ud} dealer zones open)`]],
   [[`${pctR(f.patP)} → ${pctR(l.patP)} margin`,`operating profit goes from ${pcS(f.pat)} to ${rc(l.pat)} a month`],[pos>=0?`Profit turns positive in Q${pos+1}`:'Operating loss through Q16',`monthly operating losses before then add up to ${rc(burn)} across the intervening months`],[`Overhead ${pctR(f.fixP)} → ${pctR(l.fixP)}`,`common overhead grows ${fd(l.fixed/f.fixed,1)}× while revenue grows ${fd(l.net/f.net,0)}×`]],
   [[`Cash required peaks at ${rc(S.peak)}`,`in ${qName(S.pk)}: accumulated earnings less growth spending, before any equity`],[`${rc(tot)} growth spending to Q16`,`capex ${fd(c15.capex/tot*100,0)}%, labs and systems ${fd(c15.pp/tot*100,0)}%, working capital ${fd(c15.wc/tot*100,0)}%`],[S.cross>=0?`Earnings pass spending in ${qName(S.cross)}`:'Spending leads through Q16',S.cross>=0?`${rc(S.pat[S.cross])} of earnings against ${rc(S.sp[S.cross])} of spending that quarter`:`Q16 earnings ${rc(S.pat[15])} against ${rc(S.sp[15])} of spending`]],
   [[`${pcR(R.equity)} in ${rs.length} round${rs.length>1?'s':''}`,rs.map((r,i)=>`round ${i+1} ${pcR(r.amt)} in ${qName(r.q)}`).join(', ')+'; then a round every '+P2.cadenceQ*3+' months, not sized'],[{short:`${pcR(R.equity)} falls ${rc(-R.minCash)} short of the ₹${f0(S.peak)} Cr peak`,under:`${pcR(R.equity)} covers the ₹${f0(S.peak)} Cr peak, with only ${rc(R.minCash)} to spare`,ok:`${pcR(R.equity)} covers the ₹${f0(S.peak)} Cr peak`}[lv],{short:`the gap opens in ${qName(R.minQ)}: the 6-monthly rounds (not sized here) must cover it`,under:`the tightest point is ${qName(R.minQ)}, under the ${pcR(P2.buffer)} the plan holds back: the 6-monthly rounds (not sized here) would lift it`,ok:`${rc(R.minCash)} to spare at the tightest point (${qName(R.minQ)}); the 6-monthly rounds (not sized here) are extra cushion`}[lv]],[r2?`Round 2 is ${pcR(r2.amt)} in ${qName(r2.q)}`:'No round 2 needed',r2?`placed a quarter before cash would fall under ${pcR(P2.buffer)}; the cash rule alone would size it at ${pcR(pcRound(r2,P2))}`:`round 1 keeps cash above ${pcR(P2.buffer)} to Q16`]],
   [[`${xS(ret.mult)} at a ${qName(X.q)} exit`,`${pcR(e.amt)} becomes ${rc(ret.val)}, ${pct1(ret.irr*100)} a year, before later rounds`],[`Stake ${pct2(e.stake)} → ${pct2(ret.s)}`,`after rounds 1–${mod.length} only; the later 6-monthly rounds are not sized, so not in the dilution`],[back>=0?`Above cost from ${qName(back)}`:'Below cost through Q16',`the exit value of the stake ${back>=0?'passes':'stays under'} the ${pcR(e.amt)} put in`]],
   [[`${pctR(ro[15].pre*100)} at Q16`,`annualised operating profit of ${rc(12*l.pat)} on ${rc(ro[15].ce)} of capital employed`],[rp>=0?`Positive from ${qName(rp)}`:'Negative through Q16',`early quarters carry plants and working capital built ahead of sales`],[`${pctR(ro[15].post*100)} after depreciation`,`capex ${rc(c15.capex)}, labs and systems ${rc(c15.pp)}, working-capital target ${rc(K.wcTotal[15])}`]]];
  return T3.map((st,i)=>st.map((t,jx)=>[...t,...pcTc[pcTk[i][jx]]]));
}

/* ---------- the data table under each chart: every series the chart draws, Q1 to Q16 ---------- */
function pcDT(unit,rows){
  const row=r=>r.sub?`<tr class="pc-dsub"><th colspan="17">${r.sub}</th></tr>`:`<tr class="${r.cls||''}"><th>${r.sw?`<i class="sw" style="${r.sw}"></i>`:''}${r.l}</th>${r.v.map(v=>`<td${r.neg&&v<-1e-9?' class="neg"':''}>${(r.f||pcTV)(v)}</td>`).join('')}</tr>`;
  return `<div class="cx-dt"><p class="pc-dth">${unit}</p><div class="pc-dtw"><table class="cx-cols pc-dt"><thead><tr><th></th>${Array.from({length:16},(_,q)=>`<th>${qName(q)}</th>`).join('')}</tr></thead><tbody>${rows.map(row).join('')}</tbody></table></div></div>`;
}
const pcP=v=>Number.isFinite(v)?(Math.abs(v)<0.05?'0.0%':(v<0?'−':'')+fd(Math.abs(v),1)+'%'):'–';
function pcTables(D){
  const S=cxSeries(D),O=operatingModel().S,R=D.R,ret=D.ret,e=D.pr[0],ro=roceFin(D.G),sw=c=>`background:${c}`,rs=q=>sum(R.rounds.filter(r=>r.q===q).map(r=>r.amt)),req=S.cum.map(v=>Math.max(0,-v));
  const lines=P.map(p=>({l:SH[p],cls:'ind',v:O.map(w=>sum(w.rows.filter(r=>r.p===p).map(r=>r.rev)))}));
  const spend=[['capex','Capex',PC.capex],['pp','Labs / systems',PC.labs],['wc','Increase in working capital',PC.wc],...(R.D.on?[['interest','Loan interest',PC.int]]:[])].map(([k,l,c])=>({l,sw:sw(c),v:S.fl[k].map(v=>-v)}));
  return [
   pcDT('₹ Cr a month at each quarter end, by product line',[...lines,{l:'Total revenue',sw:sw(PC.rev),v:S.net,cls:'tot'}]),
   pcDT('₹ Cr a month, margins in % of revenue',[{l:'Cost of goods',sw:sw(PC.cogs),v:O.map(w=>w.cogs)},{l:'Selling costs',sw:sw(PC.sell),v:O.map(w=>w.variable)},{l:'Direct costs',v:O.map(w=>w.cogs+w.variable),cls:'sub'},{l:'Common overhead',sw:sw(PC.oh),v:O.map(w=>w.fixed)},{l:'Operating profit',sw:sw(PC.profit),v:O.map(w=>w.pat),neg:1,cls:'sub'},{l:'Revenue',sw:`background:#fff;box-shadow:inset 0 0 0 2px ${PC.rev}`,v:S.net,cls:'tot'},{l:'Operating margin',v:O.map(w=>w.patP),f:pcP,neg:1}]),
   pcDT('₹ Cr in the quarter; spending shown as negatives',[{l:'Operating earnings',sw:sw(PC.profit),v:S.pat,neg:1},...spend,{l:'Net cash flow',v:S.ncf,cls:'tot'},{l:'Cash required',sw:`background:${PC.fundBg};outline:1px solid ${PC.fund}`,v:req,cls:'tot'},{l:'Revenue a month',sw:sw(PC.revBg),v:S.net}]),
   pcDT('₹ Cr; cash and revenue at quarter end, equity in the quarter',[{l:'Revenue a month',sw:sw(PC.revBg),v:S.net},{l:'Planned equity',sw:sw(PC.fund),v:S.net.map((_,q)=>rs(q)||null)},{l:'Closing cash',sw:sw(PC.cash),v:S.cash,cls:'tot'}]),
   pcDT('₹ Cr; the stake as it stands after the rounds closed by each quarter',[{l:'Stake value at exit',sw:sw(PC.value),v:ret.path,cls:'tot'},{l:`Multiple of the ${pcR(e.amt)}`,v:ret.path.map(v=>v/e.amt),f:v=>fd(v,1)+'×'},{l:'Stake held',v:ret.path.map((_,q)=>{let s=0;D.pr.forEach(r=>{if(r.q<=q)s=r.stake;});return s*100;}),f:v=>fd(v,1)+'%'}]),
   pcDT('₹ Cr a year and %, at each quarter end',[{l:'Operating profit a year',v:ro.map((r,q)=>12*D.G.patMonthly[q]),neg:1},{l:'Capital employed',v:ro.map(r=>r.ce)},{l:'Return before depreciation',sw:sw(PC.profit),v:ro.map(r=>r.pre*100),f:pcP,cls:'tot',neg:1},{l:'Return after depreciation',sw:`background:#fff;box-shadow:inset 0 0 0 2px ${PC.profit};border-radius:50%`,v:ro.map(r=>r.post*100),f:pcP,neg:1}])];
}

/* ---------- the right-hand panel: how the chart is built, as small visual cards; it does not change with a quarter ---------- */
const pcSvg=(w,h,body,label)=>`<svg class="pc-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label||'')}">${body}</svg>`;
/* a chip; col = the colour of what it is (an edge, or the fill of a result chip) */
const pcChip=(k,v,cls='',col='')=>`<span class="pc-chip${cls?' '+cls:''}${col?' cc':''}"${col?` style="--c:${col};--ct:${pcTint(col,.12)}"`:''}>${k?`<small>${k}</small>`:''}${v!==''?`<b>${v}</b>`:''}</span>`;
const pcEq=parts=>{let h='',op='';parts.forEach(p=>{if(typeof p==='string'){op=p;return;}h+=`<span class="pc-term">${op?`<i class="pc-op">${op}</i>`:''}${pcChip(p[0],p[1],p[2],p[3])}</span>`;op='';});return `<div class="pc-eq">${h}</div>`;};
const pcCard=(title,body,text,col='',cls='')=>`<section class="pc-card${cls?' '+cls:''}"${col?` style="--c:${col}"`:''}><h4>${title}</h4>${body||''}${text?`<p>${text}</p>`:''}</section>`;
const pcCards=a=>`<div class="pc-cards" style="flex:${a.length} 1 auto">${a.join('')}</div>`;
const pcFold=(label,html)=>whyD(label,html);
/* a small line chart: marks = [{i,col,t,dy}], floor = a dashed level */
function pcSpark(vals,o={}){
  const w=320,h=o.h||56,px=10,py=11,lo=o.lo??Math.min(...vals),hi=o.hi??Math.max(...vals),X=i=>px+(w-2*px)*i/(vals.length-1),Y=v=>h-py-(v-lo)/(hi-lo||1)*(h-2*py);let s='';
  if(lo<0&&hi>0)s+=`<line x1="${px}" x2="${w-px}" y1="${Y(0).toFixed(1)}" y2="${Y(0).toFixed(1)}" stroke="${PC.line}"/>`;
  if(o.floor!=null)s+=`<line x1="${px}" x2="${w-px}" y1="${Y(o.floor).toFixed(1)}" y2="${Y(o.floor).toFixed(1)}" stroke="${PC.fund}" stroke-width="1.2" stroke-dasharray="4 3"/>`;
  const d=vals.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join('');
  if(o.area)s+=`<path d="${d}L${X(vals.length-1).toFixed(1)} ${Y(Math.max(lo,0)).toFixed(1)}L${X(0).toFixed(1)} ${Y(Math.max(lo,0)).toFixed(1)}Z" fill="${o.area}"/>`;
  s+=`<path d="${d}" fill="none" stroke="${o.col||PC.cash}" stroke-width="2" stroke-linejoin="round"/>`;
  (o.marks||[]).forEach(m=>{s+=`<circle cx="${X(m.i).toFixed(1)}" cy="${Y(vals[m.i]).toFixed(1)}" r="3.6" fill="${m.fill||'#fff'}" stroke="${m.sc||m.col||PC.cash}" stroke-width="1.8"/>`+(m.t?T(X(m.i)+(m.dx||0),Y(vals[m.i])+(m.dy??-8),m.t,'slab-b',m.a||'middle',`font-size:9.5px;fill:${m.col||PC.cash}`):'');});
  if(o.axis)s+=o.axis.map(([i,t])=>T(X(i),h-1,t,'smut','middle','font-size:8.5px')).join('');
  return pcSvg(w,h,s,o.label);
}
/* a timeline of 16 quarters: filled diamonds = {q,t}, open diamonds, plain dots */
function pcTimeline(o){
  const w=320,h=o.h||44,px=12,X=q=>px+(w-2*px)*q/15,ry=o.ry||19;let s=`<line x1="${X(0)}" x2="${X(15)}" y1="${ry}" y2="${ry}" stroke="${PC.line}" stroke-width="1.5"/>`;
  for(let q=0;q<16;q++)s+=`<line x1="${X(q).toFixed(1)}" x2="${X(q).toFixed(1)}" y1="${ry-2.5}" y2="${ry+2.5}" stroke="#C9C6BC"/>`;
  const dm=(x,r,f,st)=>`<path d="M${x.toFixed(1)} ${ry-r}L${(x+r).toFixed(1)} ${ry}L${x.toFixed(1)} ${ry+r}L${(x-r).toFixed(1)} ${ry}Z" fill="${f}" stroke="${st}" stroke-width="1.4"/>`;
  (o.open||[]).forEach(m=>{s+=dm(X(m.q),4.5,'#fff',m.col||PC.fundTxt)+(m.t?T(X(m.q),ry+17,m.t,'smut','middle','font-size:9px'):'');});
  (o.filled||[]).forEach(m=>{s+=dm(X(m.q),6,m.col||PC.fund,m.sc||m.col||PC.fundTxt)+(m.t?T(X(m.q),ry-10,m.t,'slab-b','middle',`font-size:9.5px;fill:${m.sc||PC.fundTxt}`):'');});
  (o.dots||[]).forEach(m=>{s+=`<circle cx="${X(m.q).toFixed(1)}" cy="${ry}" r="4.6" fill="${m.col}"/>`+(m.t?T(X(m.q),ry+(m.up?-9:20),m.t,'slab-b','middle',`font-size:9.5px;fill:${m.tc||PC.ink}`):'');});
  if(o.axis)[0,3,7,11,15].forEach(q=>{s+=T(X(q),h-1,qName(q),'smut','middle','font-size:9px');});
  return pcSvg(w,h,s,o.label);
}
/* phases bought: one row per item, a block at each quarter a phase is paid */
function pcPhaseRow(K,k,lb,bk,nm){
  const st=K.steps[k],w=320,cw=w/16,col=stepCol(bk),stack={};st.buys.forEach(x=>{stack[x.q]=(stack[x.q]||0)+x.cost;});
  const mx=Math.max(...Object.values(stack)),sc=11/mx;let b=`<line x1="0" x2="${w}" y1="13.5" y2="13.5" stroke="${PC.line}"/>`;const acc={};
  st.buys.forEach(x=>{const hh=Math.max(2.5,x.cost*sc),a=acc[x.q]||0;acc[x.q]=a+hh;b+=`<rect x="${(x.q*cw+2).toFixed(1)}" y="${(13-a-hh).toFixed(1)}" width="${(cw-4).toFixed(1)}" height="${hh.toFixed(1)}" fill="${col}" rx="1.5"><title>${qName(x.q)} · ${rc(x.cost)}</title></rect>`;});
  return `<div class="pc-ph"><div class="hd"><span class="nm">${swc(col)}${nm||lb} <small>${stepCostText(st.costs)}</small></span><b>${rc(sum(st.costs))}</b></div>${pcSvg(w,14,b,lb+' phases bought by quarter')}</div>`;
}
const pcPhaseAxis=()=>`<div class="pc-ph pc-ax">${pcSvg(320,10,[0,3,7,11,15].map(q=>T(q*20+10,8,qName(q),'smut','middle','font-size:9px')).join(''),'quarters')}</div>`;
/* a stacked horizontal strip: parts = [{v,c,t}] */
const pcStrip=parts=>{const tot=sum(parts.map(p=>p.v));return `<div class="pc-strip">${parts.filter(p=>p.v>0).map(p=>`<i style="flex:${p.v/tot};background:${p.c};color:${p.tc||'#fff'}" title="${p.n||''}">${p.v/tot>=(p.min??.09)?p.t:''}</i>`).join('')}</div>`;};
/* a row of bars: one bar per label, all one colour; value on the right */
const pcHB=(rows,col,lw)=>rows.map(([l,share,v])=>`<div class="pc-hb"${lw?` style="--lw:${lw}px"`:''}><span>${l}</span><i style="width:${Math.max(share,.02)*100}%;background:${col}"></i><b>${v}</b></div>`).join('');
/* columns, one per quarter, in one colour; the last one carries its value */
function pcBars(vals,o={}){
  const w=320,h=o.h||44,px=10,n=vals.length,sl=(w-2*px)/n,bw=sl*.64,hi=Math.max(...vals,1e-9),y0=h-(o.axis?12:3),H=y0-14;let s=`<line x1="${px}" x2="${w-px}" y1="${y0}" y2="${y0}" stroke="${PC.line}"/>`;
  vals.forEach((v,i)=>{const bh=Math.max(v/hi*H,v>0?1:0);s+=`<rect x="${(px+i*sl+(sl-bw)/2).toFixed(1)}" y="${(y0-bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${o.col}"${o.edge?` stroke="${o.edge}" stroke-width=".7"`:''} rx="1"><title>${qName(i)} · ${o.fmt?o.fmt(v):rc(v)}</title></rect>`;});
  if(o.t)s+=T(px+(n-1)*sl+sl/2,y0-Math.max(vals[n-1]/hi*H,1)-3,o.t,'slab-b','end',`font-size:9.5px;fill:${o.tc||PC.ink}`);
  if(o.axis)s+=o.axis.map(([i,t])=>T(px+i*sl+sl/2,h-1,t,'smut','middle','font-size:8.5px')).join('');
  return pcSvg(w,h,s,o.label);
}
const pcLg=a=>`<div class="pc-lg">${a.map(([c,l])=>`<span>${swc(c)}${l}</span>`).join('')}</div>`;

CX.rev=D=>{
  const Q=operatingModel().S,rt=view(SCOPE.core,'city'),dd=view(SCOPE.core,'dist'),w=Q[15],T15=D.T[15],uc=unitsBy('city',15),ud=unitsBy('dist',15),late=Q[13].net,m=MODEL;
  const open=UNITS.filter(u=>u.live||u.activation.length),mk=open.map(u=>u.market),sz=P.map(p=>m.products[p].size),ramp=m.ramp.med,lines=P.map(p=>({p,v:sum(w.rows.filter(r=>r.p===p).map(r=>r.rev))}));
  const wait=p=>m.products[p].wait,sh=v=>`${fd(v/T15*100,0)}%`,mxl=Math.max(...lines.map(l=>l.v)),mxc=Math.max(rt.T[15],dd.T[15]);
  const build=pcCard('How monthly revenue is built',pcEq([['Units open',`${fd(uc+ud,0)}`],'×',['Market per unit',`₹${fd(Math.min(...mk),2)}–${fd(Math.max(...mk),0)} Cr`],'×',['Product size',`${fd(Math.min(...sz),2)}–${fd(Math.max(...sz),2)}×`],'×',['Share at the line’s age',`${fd(ramp[0]*100,0)}% → ${fd(ramp[5]*100,0)}%`],'=',['Revenue a month',rc(T15),'res',PC.rev]])
    +pcSpark(ramp,{h:50,col:PC.rev,area:PC.revBg,lo:0,hi:Math.max(...ramp)*1.08,marks:[{i:0,t:`${fd(ramp[0]*100,0)}%`,col:PC.rev,dy:-8},{i:5,t:`${fd(ramp[5]*100,0)}%`,col:PC.rev,dy:-8}],axis:[[0,'age 1'],[5,'age 6 quarters']],label:'Share of the market a line wins by its age'}),
    `Summed over the five lines, cities (RT) and dealer zones (DD), at the quarter’s last month; GST ignored. A line’s share climbs with its age in each city.`,PC.rev);
  const mix=pcCard('What Q16 is made of',pcHB(lines.map(l=>[SH[l.p],l.v/mxl,sh(l.v)]),PC.rev,96)+'<div class="pc-sep"></div>'+pcHB([['Cities',rt.T[15]/mxc,sh(rt.T[15])],['Dealer zones',dd.T[15]/mxc,sh(dd.T[15])]],PC.rev,96),`${fd(sum(['wood','upvc','p5'].map(p=>lines.find(l=>l.p===p).v))/T15*100,0)}% comes from lines launched after today; ${uc} cities and ${ud} dealer zones are open by Q16. Share of Q16 revenue, product lines above, channels below.`,PC.rev);
  const lau=pcCard('When lines launch',pcTimeline({h:54,ry:22,axis:1,dots:P.map((p,i)=>({q:m.products[p].launch-1,col:PC.rev,t:p==='tile'?'':{niche:'Niche',wood:'Wood',upvc:'uPVC',p5:'Waterproof'}[p],up:i%2===1,tc:PC.ink})).filter(d=>d.t),label:'Launch quarters'}),`Tile adhesive is live today. A new line then waits in each city before it sells: wood ${wait('wood')} quarter, uPVC ${wait('upvc')}, waterproofing ${wait('p5')}.`,PC.rev);
  return {lead:'',body:pcCards([build,mix,lau])
   +pcFold('If revenue slips',cxLev('Q16 revenue a month if…',[['Revenue runs two quarters late',rc(late),dlt(late,w.net)],['70% of the plan is achieved',rc(w.net*.7),dlt(w.net*.7,w.net)]],`${capLink('basis','Model basis · 01')}${capLink('cities','Cities and DD zones · 04')}${capLink('products','Products · 05')}`))};
};
CX.mar=D=>{
  const Q=operatingModel().S,f=Q[0],l=Q[15],a=(g)=>`${pctR(g(f))} → ${pctR(g(l))}`,pp=v=>fd(v,1)+'%';
  /* a mini waterfall at Q16, as % of revenue */
  const cm1=100-l.cogsP,cm2=l.cm2P,pat=l.patP,H=76,y0=88,Y=v=>y0-v/100*H,col=[['Revenue',0,100,PC.rev,''],['Goods',cm1,100,PC.cogs,'−'],['CM1',0,cm1,null,''],['Selling',cm2,cm1,PC.sell,'−'],['CM2',0,cm2,null,''],['Overhead',Math.max(pat,0),cm2,PC.oh,'−'],['Profit',Math.min(0,pat),Math.max(pat,0),pat<0?PC.loss:PC.profit,'']];
  let wf='';col.forEach(([n,lo,hi,c,sg],i)=>{const x=8+i*44.5,top=Y(hi),h=Math.max(Y(lo)-top,1.2);wf+=`<rect x="${x}" y="${top.toFixed(1)}" width="32" height="${h.toFixed(1)}" ${c?`fill="${c}"`:`fill="#fff" stroke="${PC.mute}" stroke-width="1.2"`} rx="1.5"/>`+T(x+16,top-3,`${sg}${fd(Math.abs(hi-lo),0)}%`,'slab-b','middle',`font-size:10px;fill:${PC.ink}`)+T(x+16,y0+11,n,'smut','middle','font-size:9px');});
  const walk=pcCard('From revenue to profit · Q16',pcSvg(320,104,wf,'Revenue less cost of goods, selling costs and common overhead gives operating profit, as % of revenue'),`Q1: goods ${pctR(f.cogsP)}, selling ${pctR(f.varP)}, overhead ${pctR(f.fixP)}, so profit ${pctR(f.patP)}. Outlined bars are what is left: CM1, then CM2.`);
  const goods=pcCard(`${swc(PC.cogs)}Cost of goods → CM1 · ${a(r=>r.cogsP)}`,'',`Materials and inbound freight. Freight already fell from 8.4% to 1.0% of net revenue; the rest is mix (dealer orders at wholesale prices are 41% of billing). Volume buying and own-label formulations lower it. CM1 = ${pctR(f.cm1P)} → ${pctR(l.cm1P)}.`,PC.cogs);
  const why={influencer:'Rewards paid to contractors and distributors; dealer and distributor orders were 41% of Apr–Aug billing.',brand:'A partner brand on entry-level adhesive lets distributors in new zones say yes on day one.',rm:'Falls as RMs mature (₹8–20 L a month each) and carry more lines per contractor.',lastMile:'Falls with store density: 10.2% → 6.3% by July as order value rose 54%.'};
  const sell=pcCard(`${swc(PC.sell)}Selling costs → CM2 · ${a(r=>r.varP)}`,`<ul class="pc-lines">${OP_LINES.map(([k,lb])=>`<li><div class="hd"><span>${lb}</span><b>${pp(f.amount[k]/f.net*100)} → ${pp(l.amount[k]/l.net*100)}</b></div>${why[k]?`<small>${why[k]}</small>`:''}</li>`).join('')}</ul>`,`CM2 = CM1 less these, ${pctR(f.cm2P)} → ${pctR(l.cm2P)}; it excludes common overhead.`,PC.sell);
  const over=pcCard(`${swc(PC.oh)}Common overhead → operating profit · ${a(r=>r.fixP)}`,`<ul class="pc-lines">${OP_COSTS.map(([k,lb])=>`<li><div class="hd"><span>${lb}</span><b>${pp(f.overhead.by[k]/f.net*100)} → ${pp(l.overhead.by[k]/l.net*100)}</b></div></li>`).join('')}</ul>`,`A budget set by revenue level, so it grows far slower than revenue: salaries, office, software and store rent are absorbed over a bigger base. Operating profit is before tax, interest and depreciation.`,PC.oh);
  return {lead:'',body:pcCards([walk,goods,sell,over])
   +pcFold('Sensitivities and the overhead budget',cxLev('Q16 operating profit a month if…',[['Cost of goods is 1 point higher',sr(l.pat-l.net*.01),dlt(l.pat-l.net*.01,l.pat)],['Common overhead is 20% higher',sr(l.pat-l.fixed*.2),dlt(l.pat-l.fixed*.2,l.pat)]])+cxLev('Q16 common overhead a month',OP_COSTS.map(([k,lb])=>[lb,rc(l.overhead.by[k]),'']))+`<p class="cx-note">Product and city/dealer-zone cost rates move in a straight line from Q1 to Q16, weighted by revenue. GST is ignored.</p>${capLink('audit','All 16 monthly snapshots · 06')}`)};
};
CX.spend=D=>{
  const G=D.G,K=G.K,S=cxSeries(D),X=K.X,C=INP.capital,days=K.days(),R=D.R,lead=K.leadQ,total=sum(CAPEX_ITEMS.map(([k])=>sum(K.steps[k].costs))),it=Object.fromEntries(CAPEX_ITEMS.map(([k,l,bk])=>[k,[k,l,bk]]));
  const pk=o=>{const r=raisePlan(o);return Math.max(...r.G.gap.map((v,i)=>v+r.D.cumInt[i]));},a=pk({capital:{wcDays:45}}),b=pk({capital:{wcDays:90}}),p=pk({plantMult:1.2}),l=pk({lateQ:2});
  const row=(k,nm)=>pcPhaseRow(K,k,it[k][1],it[k][2],nm);
  const eq=pcCard('How the cash required builds',pcEq([['','Earnings','',PC.profit],'−',['','Capex','',PC.capex],'−',['','Labs / systems','',PC.labs],'−',['','Working capital','',PC.wc],'=',['','Net cash flow']])+pcEq([['Net cash flow, added up from Q1','deepest '+sr(-S.peak)],'→',['Cash required',`${rc(S.peak)} · ${qName(S.pk)}`,'res',PC.fundTxt]]),`Earnings less spending each quarter, added up from Q1. Its deepest point is the funding need before any equity or debt.`,PC.fund);
  const plants=pcCard(`Plants · ${rc(X.tileP5+X.wood+X.upvc)}`,pcPhaseAxis()+row('tileP5','Tile adhesive + waterproofing')+row('wood','Wood adhesive')+row('upvc','uPVC'),`Whole phases, each paid ${lead} quarter${lead===1?'':'s'} before demand passes the capacity built; a phase adds capacity in proportion to its cost.${fn(NOTE_PLANT)}`,PC.capex);
  const rest=pcCard(`Centres, labs, systems and misc · ${rc(X.centres+X.labs+X.systems+X.misc)}`,row('centres','Experience centres')+row('labs','Labs')+row('systems','Systems')+row('misc','Misc capex'),`Centres open with new cities and dealer zones (${C.centresN} × ${rc(X.centres/C.centresN)}); labs follow the plant phases, systems and misc follow revenue. Dark stores and distribution points carry no capex of their own: any set-up sits in misc, and godown rent is in common overhead.`,PC.capex);
  const wcAdd=K.wc[15],wc=pcCard(`Working capital · ${rc(wcAdd)}, the biggest piece`,pcEq([['Annualised revenue',rc(K.Tw[15]*12),'',PC.rev],'×',['Days / 365',`${fd(days,0)} / 365`],'−',['Opening target',rc(K.openingWC)]])+pcBars(K.wc,{h:46,col:PC.wc,edge:'rgba(140,90,52,.5)',t:rc(wcAdd),tc:PC.capex,axis:[[0,'Q1'],[7,'Q8'],[15,'Q16']],label:'Additional working capital target by quarter'}),`Sized on the revenue added since today; a quarter’s cash is the increase in the target.${fn(NOTE_WC)}`,PC.wc);
  return {lead:'',body:pcCards([eq])+`<p class="pc-h">Phase plan to Q16 · ${rc(total)} in all</p>`+pcCards([plants,rest,wc])
   +pcFold('Peak cash required if…',cxLev('Peak cash required if…',[['Working-capital target is 45 days',rc(a),dlt(a,S.peak)],['Working-capital target is 90 days',rc(b),dlt(b,S.peak)],['Plants cost 20% more',rc(p),dlt(p,S.peak)],['Revenue is two quarters late',rc(l),dlt(l,S.peak)]])+`<p class="cx-note">The spend to Q16 is fixed; phase counts and sizes are assumptions, not vendor quotes. Operating losses sit inside earnings and are not charged twice.</p>`)};
};
CX.raise=D=>{
  const R=D.R,P2=R.P,rs=R.rounds,r1=rs[0],r2=rs[1],S=cxSeries(D),lv=pcCashLevel(R),m=P2.cadenceQ*3;
  const SL={d90:'Working-capital target 90 days',pl20:'Plants cost 20% more',pre100:'Plants fully built before launch',late2:'Revenue two quarters late'};
  const cases=stressCases().filter(c=>c.toggle).map(c=>{const x=stressRun(c,R).fixed;return [SL[c.k]||c.label,sr(x.minCash),`in ${qName(x.minQ)}`];});
  let debt='';if(R.D.on)debt=`<p class="cx-note">Debt is on: ${rc(R.D.bal[15])} outstanding at Q16, ${rc(R.D.cumInt[15])} of interest over the plan, both inside closing cash.</p>`;
  const only1=R.base.map((v,q)=>r1.amt+v).slice(0,8),b=r2?r2.trigger:-1;
  const c1=pcCard(`Round 1 · ${pcR(r1.amt)} in ${qName(r1.q)}`,pcTimeline({h:42,ry:24,axis:1,filled:[{q:r1.q,t:'Round 1'}],label:'Round 1 timing'}),`The ask in Valuation. It lands at the start of ${qName(r1.q)}, so the plan opens with cash in hand.`,PC.fund);
  const c2=r2?pcCard(`Round 2 · ${pcR(r2.amt)} in ${qName(r2.q)}`,pcSpark(only1,{h:66,col:PC.cash,floor:P2.buffer,lo:Math.min(...only1,0),marks:[...(b>=0&&b<8?[{i:b,col:PC.cash,t:`under ${pcR(P2.buffer)} in ${qName(b)}`,dy:16,a:'end',dx:-4}]:[]),{i:r2.q,col:PC.fundTxt,fill:PC.fund,t:`round 2 lands in ${qName(r2.q)}`,dy:-8,a:'end',dx:-3}],axis:[[0,'Q1'],[3,'Q4'],[7,'Q8']],label:'Cash with round 1 only'}),`Placed a quarter before cash would fall under the ${pcR(P2.buffer)} floor (the line shows cash with round 1 alone). The amount is fixed at ${pcR(r2.amt)}; the cash rule alone would size it at ${pcR(pcRound(r2,P2))}.`,PC.fund):pcCard('Round 2',null,`Not needed: round 1 keeps cash above the ${pcR(P2.buffer)} floor to Q16.`,PC.fund);
  const c3=pcCard(`Every ${m} months after that`,pcTimeline({h:46,ry:22,filled:rs.map((r,i)=>({q:r.q,t:`R${i+1}`})),open:R.later.map(q=>({q,t:qName(q)})),label:'Later rounds every six months'}),`From round 2 the plan raises every ${m} months. These rounds are not sized, so they sit in no cash line, equity total or dilution.${fn(NOTE_FUND)}`,PC.fund);
  const lowTxt={short:`Cash is short by ${rc(-R.minCash)} in ${qName(R.minQ)}: the ${m}-monthly rounds, once sized, must cover it.`,under:`Cash dips to ${rc(R.minCash)} in ${qName(R.minQ)}, under the floor: sizing the ${m}-monthly rounds closes that gap.`,ok:`Lowest cash is ${rc(R.minCash)} in ${qName(R.minQ)}, above the floor; the ${m}-monthly rounds, once sized, are extra cushion.`}[lv];
  const c4=pcCard(`The ${pcR(P2.buffer)} floor and the lowest cash`,pcSpark(R.cash,{h:70,col:PC.cash,floor:P2.buffer,lo:Math.min(0,...R.cash)-0.2*Math.max(...R.cash),marks:[{i:R.minQ,col:PC.cash,fill:lv==='ok'?'#fff':PC.cash,t:`lowest ${rc(R.minCash)} · ${qName(R.minQ)}`,dy:15,a:R.minQ>10?'end':'middle',dx:R.minQ>10?8:0}],axis:[[0,'Q1'],[7,'Q8'],[15,'Q16']],label:'Closing cash by quarter'}),lowTxt,PC.cash);
  return {lead:'',body:pcCards([c1,c2,c3,c4])
   +pcFold('Caveats and what-ifs',cxLev('Lowest closing cash with these rounds if…',[['The plan as modelled',sr(R.minCash),`in ${qName(R.minQ)}`],...cases],'A negative figure means the rounds as set run out of cash that quarter.')+debt)};
};
CX.ret=D=>{
  const R=D.R,X=D.X,ret=D.ret,pr=ret.pr,q=X.q,e=pr[0],Fd=INP.funding,cur=X.m==='arr'?`arr-${X.mult}`:X.m,lbl=k=>k==='pat'?`${f0(Fd.multPat)}× operating profit`:(RET_M.find(x=>x[0]===k)||[0,`${X.mult}× ARR`])[1];
  const ctl=`<div class="cx-ctl pc-ctl"><span>Exit valued at</span>${seg(RET_M.map(([k])=>[k,lbl(k)]),cur,'exitm','Exit valued at')}<span>Exit revenue vs plan</span>${seg([[1,'100%'],[0.7,'70%'],[0.5,'50%']],X.ach,'ach','Share of the revenue plan achieved')}</div>`;
  const arr=12*D.T[q]*X.ach,pat4=12*R.G.patMonthly[q]*X.ach,held=pr.filter(r=>r.q<=q),n=held.length,mx=Math.max(...held.map(r=>r.stake));
  const val=X.m==='pat'?[['Operating profit a year',rc(pat4)],'×',['Multiple',`${f0(Fd.multPat)}×`]]:X.m==='model'?[['ARR',rc(arr)],'×',['Round-pricing method',xS(multArrAt(q))]]:[['ARR',rc(arr)],'×',['Multiple',`${X.mult}×`]];
  const others=RET_M.filter(([k])=>k!==cur).map(([k])=>{const [m,x]=k.split('-'),r=investorReturn(R,{q,m,mult:x?+x:undefined,ach:X.ach});return [k==='model'?'On the round method':`At ${lbl(k)}`,rc(r.val),`${xS(r.mult)} · IRR ${pct1(r.irr*100)}`];});
  const bar=(r,i)=>`<div class="pc-hb"><span>${i?`After round ${i+1}`:'Round 1'}</span><i style="width:${r.stake/mx*100}%;background:${PC.value}"></i><b>${pct2(r.stake)}</b></div>`;
  const c1=pcCard('The stake path',held.map(bar).join(''),`Round 1 buys ${pct2(e.stake)} (${pcR(e.amt)} at ${rc(e.post)} post-money, ${xS(e.mArr)} ARR). ${held[1]?`Round 2 sells ${pct1(held[1].sold*100)} of the company at ${rc(held[1].post)} post-money, so the stake is multiplied by pre ÷ post = ${pct1(held[1].pre/held[1].post*100)}.`:''}${fn(NOTE_PRICE)}`,PC.value);
  const c2=pcCard(`How the exit value is built · ${qName(q)}`,pcEq([...val,'+',['Cash',rc(ret.cash)],'−',['Debt',rc(ret.debt)],'=',['Tejas',rc(ret.eqv)]])+pcEq([['Tejas',rc(ret.eqv)],'×',['Stake',pct2(ret.s)],'=',[`First ${pcR(e.amt)} becomes`,rc(ret.val),'res',PC.value],['Multiple · IRR',`${xS(ret.mult)} · ${pct1(ret.irr*100)}`]]),`The exit is fixed at ${qName(q)} (${EXIT[q]}, the last quarter); each bar in the chart values the stake as if Tejas exited in that quarter.${fn(NOTE_RET)}`,PC.value);
  const c3=pcCard('What is not counted',pcTimeline({h:46,ry:22,filled:held.filter(r=>r.q<=q).map((r,i)=>({q:r.q,t:`R${i+1}`})),open:R.later.map(x=>({q:x,t:qName(x)})),label:'Rounds counted and not counted'}),`Dilution covers round${n>1?`s 1–${n}`:' 1'} only (solid markers). The later ${R.P.cadenceQ*3}-monthly rounds (open markers) are not sized, so the stake and the multiple are before them.`,PC.fund);
  return {lead:'',pre:ctl,body:pcCards([c1,c2,c3])+pcFold('Other ways to value this exit',cxLev(`The same ${qName(q)} exit, valued other ways`,others)+`<p class="cx-note">Round 1 is priced at ${xS(INP.valuation.multiple)} today’s ARR; later rounds at the ARR multiple for their quarter (${xS(Fd.multQ4)} at Q4, ${xS(Fd.multQ8)} at Q8, ${xS(Fd.multQ16)} at Q16), blended into ${f0(Fd.multPat)}× annualised operating profit as the margin rises from ${f0(Fd.blendLo)}% to ${f0(Fd.blendHi)}%.</p>`)};
};
CX.roce=D=>{
  const G=D.G,K=G.K,ro=roceFin(G),l=ro[15],F=INP.funding,m=G.patMonthly[15],c=K.cum[15],first=ro.findIndex(r=>r.pre>0);
  const rq=o=>roceFin(gapFin(o))[15].pre*100,v45=rq({capital:{wcDays:45}}),v90=rq({capital:{wcDays:90}}),vp=rq({plantMult:1.2}),pts=x=>fd(x,1)+' pts';
  const c1=pcCard('How the return is measured · Q16',pcEq([['Operating profit a year',rc(12*m),'',PC.profit],'÷',['Capital employed',rc(l.ce),'',PC.capex],'=',['Return',pctR(l.pre*100),'res',PC.profit]])+pcEq([['− Depreciation a year',rc(4*l.dep)],'→',['After depreciation',pctR(l.post*100),'res',PC.profit]]),`Annual operating profit is 12 × the quarter’s monthly profit. Depreciation is straight line: plants and centres over ${f0(F.lifePlant)} years, labs, systems and misc over ${f0(F.lifeOther)}.${fn(NOTE_RET)}`,PC.profit);
  const c2=pcCard('What counts as capital employed',pcStrip([{v:c.capex,c:PC.capex,t:`Capex ${fd(c.capex,0)}`,min:.12},{v:c.pp,c:PC.labs,tc:PC.ink,t:`${fd(c.pp,0)}`,min:.05},{v:K.wcTotal[15],c:PC.wc,tc:PC.ink,t:`Working capital ${fd(K.wcTotal[15],0)}`,min:.12}])+pcLg([[PC.capex,'Capex: plants, centres, misc'],[PC.labs,'Labs / systems'],[PC.wc,`Working-capital target (${fd(K.days(),0)} days)`]]),`₹ Cr at Q16: the cumulative spend to date plus the full working-capital target, including its opening balance. Existing fixed assets are not in the books supplied, so they are left out.`,PC.capex);
  const c3=pcCard('Why it starts low',pcSpark(ro.map(r=>r.pre*100),{h:58,col:PC.profit,area:pcTint(PC.profit,.14),lo:Math.max(-20,Math.min(...ro.map(r=>r.pre*100))),hi:Math.max(...ro.map(r=>r.pre*100)),marks:[...(first>0?[{i:first,t:`positive in ${qName(first)}`,col:PC.profit,dy:-9,a:'start',dx:-6}]:[]),{i:15,t:pctR(l.pre*100),col:PC.profit,dy:-8,dx:-10}],axis:[[0,'Q1'],[7,'Q8'],[15,'Q16']],label:'Return before depreciation by quarter'}),`Plants and working capital are paid ahead of the sales they serve, so capital employed leads profit. Small early balances also give large negative percentages; the chart stops at −20%.`,PC.profit);
  return {lead:'',body:pcCards([c1,c2,c3])
   +pcFold('Sensitivities and caveats',cxLev('Q16 return before depreciation if…',[['Working-capital target is 45 days',pct1(v45),dlt(v45,l.pre*100,pts)],['Working-capital target is 90 days',pct1(v90),dlt(v90,l.pre*100,pts)],['Plants cost 20% more',pct1(vp),dlt(vp,l.pre*100,pts)]])+`<p class="cx-note">A gross-capital proxy, pre-tax, not a complete company ROCE.${fn(NOTE_RET)}</p>`)};
};

/* ---------- the page: no debt bar, six static panels, the takeaways above the assumptions ---------- */
financingControls=function(){return '';};
capKPI=function(D){
  const T=D.T,ret=D.ret,R=D.R,G=D.G,ro=roceFin(G)[G.N-1],n=R.rounds.length;
  return `<div class="b-metrics cap-kpi"><div class="ans-k"><span>Revenue a month, today → Q16</span><strong>₹${fd(INP.valuation.todayMRR,1)} → ₹${fd(T[15],1)}<small>Cr</small></strong></div>
   <div title="Total investment and early losses through Q16."><span>Growth investment + operating losses</span><strong>₹${f0(G.cumTot[G.N-1])}<small>Cr</small></strong></div>
   <div><span>Planned equity · ${n} round${n>1?'s':''}</span><strong>₹${f0(R.equity)}<small>Cr${pcCashLevel(R)==='short'?`, cash short in ${qName(R.minQ)}`:pcCashLevel(R)==='under'?`, cash under floor in ${qName(R.minQ)}`:R.later.length?`, then every ${R.P.cadenceQ*3} months`:''}</small></strong></div>
   <div><span>First ₹${f0(INP.valuation.ask)} Cr at a ${qName(D.X.q)} exit</span><strong>${xS(ret.mult)}<small>₹${f0(ret.val)} Cr</small></strong></div>
   <div title="Existing fixed assets are excluded."><span>Q16 operating return</span><strong>${fd(ro.pre*100,0)}%<small>Forecast assets + full working capital</small></strong></div></div>`;
};
fundDrawer=function(){
  const field=(p,l,u,min=0,step='any')=>`<label class="s-in"><span class="l">${l}<small>${u}</small></span><input type="number" min="${min}" step="${step}" data-input="${p}" value="${getPath(INP,p)}"><span class="d">plan ${getPath(INPUT_DEFAULT,p)}</span></label>`;
  const grid=a=>`<div class="s-ingrid cap-ingrid">${a.map(x=>field(...x)).join('')}</div>`;
  return `<details class="cap-drawer"${A.cap.drawer?' open':''}><summary>Assumptions &amp; loan terms</summary><div class="cap-drawer-b"><p class="note">Round 1 is the ask. Round 2 is a fixed amount placed by the cash trigger. From round 2 the plan raises every ${INP.funding.cadenceQ*3} months, but those later rounds are not sized: they are timeline markers only and sit in no cash line or dilution. Every change re-runs the model and redraws the chart, the panel and the key figures.${fn(NOTE_FUND)}</p>
  <p class="pc-grp">Funding rounds</p>${grid([['funding.buffer','Minimum closing cash','₹ Cr · quarter-end floor'],['funding.lead','Equity lead time','quarters before cash threshold',0,1],['funding.round2','Round 2 amount','₹ Cr · 0 = size it by the cash rule'],['funding.cadenceQ','Later rounds every','quarters · timeline markers only',1,1],['capital.wcDays','Working-capital target','days of annualised revenue'],['capital.firstPhase','Pre-launch plant build','% of wood and uPVC budgets']])}
  <p class="pc-grp">Loan terms <span>(debt is off in this plan; these apply only if it is switched on)</span></p>${grid([['funding.rateCapex','Plant loan rate','% per year · assumption'],['funding.rateWC','Working-capital rate','% per year · assumption'],['funding.moratorium','Plant principal grace','full quarters after draw',0,1],['funding.tenor','Plant amortisation','quarterly instalments after grace',1,1]])}
  ${whyD('Unverified assumptions',financeAssumptions())}</div></details>`;
};
renderFinance=function(){
  const D=capData(),cur=A.steps.finance,heads=cxHeads(D),legs=cxLegends(D),tk=pcTakes(D),tb=pcTables(D),st=STEPS.finance,nx=PAGE_ORDER[PAGE_ORDER.indexOf('finance')+1];
  /* short labels on the Next button so the kicker row stays one line in a narrow panel; the full name is its title */
  const short=['Revenue','Margins','Growth & funding','Raises & cash','Investor return','Return on capital'],nav=i=>`<span class="cx-nav">${i>0?`<button type="button" class="cx-pv" data-step="${i-1}" aria-label="Back to ${st[i-1]}" title="Back to ${st[i-1]}">←</button>`:''}${i<st.length-1?`<button type="button" class="cx-nx" data-step="${i+1}" title="Next: ${st[i+1]}">Next: ${short[i+1]} →</button>`:`<button type="button" class="cx-nx" data-goto="${nx}" title="Next page: ${PAGE_NAME[nx]}">Next page →</button>`}</span>`;
  const side=CX_KEYS.map((k,i)=>{const p=CX[k](D);return `<section class="step cx-step${i===cur?' on':''}" data-step-panel="${i}"${i===cur?'':' hidden'}><div class="s-panel cx-side-p"><div class="cx-kickrow"><p class="cx-kick" title="${st[i]}">Step ${i+1} of ${st.length}</p>${nav(i)}</div>${p.pre||''}${p.body}</div></section>`;}).join('');
  /* the chart card: heading, the plot (one slot, the same size on every step), the key; its data table is the card below it */
  const chart=`<div class="s-panel cx-chart" data-layer="${cur}"><div class="cx-heads">${heads.map(([t,s],i)=>`<div class="cx-head" data-l="${i}"><h3>${t}</h3>${s?`<p>${s}</p>`:''}</div>`).join('')}</div>
   <div class="cx-plot"><div class="cx-s cx-s-m">${cbox('cx-money',W=>cxMoney(W,D),660)}</div><div class="cx-s cx-s-r">${cbox('cx-ret',W=>cxRet(W,D),660)}</div><div class="cx-s cx-s-o">${cbox('cx-roce',W=>cxRoce(W,D),660)}</div></div>
   <div class="cx-legs">${legs.map((h,i)=>`<div class="cap-legend static cx-leg" data-l="${i}">${h}</div>`).join('')}</div></div>`;
  const dcard=`<div class="s-panel cx-dtcard" data-layer="${cur}"><h3 class="pc-dtt">Data behind the chart</h3><div class="cx-dts">${tb.map((h,i)=>h.replace('class="cx-dt"',`class="cx-dt" data-l="${i}"`)).join('')}</div></div>`;
  const takes=tk.map((t,i)=>`<section class="pc-takes" data-take="${i}"${i===cur?'':' hidden'} aria-label="Key takeaways: ${st[i]}">${t.map(([f,x,c,ct])=>`<article class="pc-take" style="--c:${c};--ct:${ct}"><b>${f}</b><p>${x}</p></article>`).join('')}</section>`).join('');
  $('main-content').innerHTML=editedBanner()+pageHead('03 · Funding & returns','Funding & returns','','',`<a class="s-edit" href="#inputs">Edit inputs</a>`)+capKPI(D)
   +`<div class="step-host cx-host" data-steps="finance">${financingControls(D)}${stepBar('finance')}<div class="cx-grid">${chart}${dcard}<div class="cx-side">${side}</div></div>${takes}${fundDrawer()}</div>`+notesBlock();
};
PAGES.finance=renderFinance;
/* a step change swaps the layer on the chart card and the data card, the panel and the takeaways; the chart itself is not redrawn */
const pcSetStep=setStep;
setStep=function(i){
  /* when the stepper and the chart card are already on screen, a step change leaves the page where it is (the base code scrolls the stepper to the top) */
  const f=A.page==='finance',c=f&&document.querySelector('.cx-chart'),sb=f&&document.querySelector('.cx-host .stepbar'),r=c&&c.getBoundingClientRect(),sr=sb&&sb.getBoundingClientRect(),stay=!!(r&&sr&&sr.top>=0&&r.bottom<=innerHeight),y=scrollY;
  pcSetStep(i);
  if(stay)scrollTo({top:y,behavior:'instant'});
  if(A.page==='finance'){document.querySelectorAll('.pc-takes').forEach(t=>{t.hidden=+t.dataset.take!==A.steps.finance;});const d=document.querySelector('.cx-dtcard');if(d)d.dataset.layer=A.steps.finance;}
};
/* the address keeps the step after a load or a jump (#finance/s3), as it does after a step change */
const pcGo=go;
go=function(hash){pcGo(hash);try{if(STEPS[A.page]&&A.steps[A.page]>0&&!A.anchor)history.replaceState(null,'','#'+A.page+'/s'+(A.steps[A.page]+1));}catch(e){}};

/* ---------- one frame for every chart ----------
   The chart card has a fixed height and its plot slot (.cx-plot) takes what is left after the heading and the key, so every step
   gets the same plot area. The charts are drawn to that slot; they are redrawn only when the slot's width or height changes. */
const pcFit=fitCharts;
fitCharts=function(){
  if(typeof document!=='undefined'&&typeof document.querySelector==='function'){
    const pl=document.querySelector('.cx-plot');
    if(pl){const h=Math.floor(pl.clientHeight)-(innerWidth<=1100?24:6);if(h>150&&h!==pcPlotH){pcPlotH=h;document.querySelectorAll('.cx-chart .cbox').forEach(el=>{el.dataset.w=0;});}}
  }
  pcFit();
};
window.__dash={...window.__dash,raisePlan,cxSeries,pcTakes,renderFinance,PC};
