
/* ---------- page 03 colour system: one colour per meaning, the same on every step; defined once, used everywhere below ---------- */
const PC={
 rev:CX_REV,revBg:'#D3E2F2',                           /* revenue: strong when it is the focus, a light tint when it is background */
 cogs:LAYER.cm1,sell:LAYER.cm2,oh:LAYER.pat,           /* costs: one warm grey, darker = deeper in the P&L (the guide's Depth and amount key) */
 profit:CX_PAT,loss:CX_NEG,                            /* operating profit, earnings and return on capital; red means a loss and nothing else */
 capex:'#8C5A34',labs:'#C08A5B',wc:'#E6CFAE',int:'#5E4026', /* capital and growth spending: one brown family, darker = longer-lived */
 fund:ACCENT,fundTxt:ACCENT_TXT,fundBg:'#FBECE5',      /* funding: equity rounds, the cash floor, the cash required */
 cash:CX_CASH,                                         /* cash in the bank, nothing else */
 value:CX_VALUE,                                       /* the investor's stake, nothing else */
 ink:'#3D3C38',mute:'#5F5E58',line:'#C9C6BC'           /* general notes, rules */
};
/* the guide's capital buckets and the financials sheet follow the same browns */
Object.assign(CAP4C,{capex:PC.capex,pp:PC.labs,wc:PC.wc,interest:PC.int,loss:PC.loss});
/* a colour mixed with white, for a quiet fill behind a coloured edge */
const pcTint=(hex,a)=>{const n=parseInt(hex.slice(1),16),m=k=>Math.round(255-(255-((n>>k)&255))*a).toString(16).padStart(2,'0');return '#'+m(16)+m(8)+m(0);};

/* ---------- six steps: growth spending and funding need are one ---------- */
CAP_BEATS.splice(0,CAP_BEATS.length,[['rev','Revenue']],[['mar','Margins']],[['spend','Growth spending &amp; funding need']],[['raise','Raises and cash']],[['ret','Investor return']],[['roce','Return on capital']]);
STEPS.finance=['Revenue','Margins','Growth spending &amp; funding need','Raises and cash','Investor return','Return on capital'];
CX_KEYS.splice(0,CX_KEYS.length,'rev','mar','spend','raise','ret','roce');
A.cap.beat=[0,0,0,0,0,0];
A.cap.exitQ=15;
if(A.steps.finance>5)A.steps.finance=5;

/* ---------- chart toolkit: one label scheme per chart, callouts that dodge each other ---------- */
const pcKey=[0,3,7,11,15],pcMuted=PC.mute;
/* data labels: 10 and over with no decimals, under 10 with one, never a trailing .0 */
const pcL=v=>{const a=Math.abs(v),s=v<-0.049?'−':'';if(a>=9.95)return s+fd(a,0);const r=Math.round(a*10)/10;return r<0.05?'0':s+(Number.isInteger(r)?String(r):fd(r,1));};
/* data-table values: one decimal under 100, none from 100 up, the same rule on every row */
const pcTV=v=>{if(v==null||!Number.isFinite(v))return '–';const a=Math.abs(v);return a<0.05?'–':(v<0?'−':'')+(a<99.95?fd(a,1):fd(a,0));};
let pcCv=null,pcFam='';
function pcW(s,fs=11,wt=500){const t=String(s).replace(/<[^>]*>/g,'').replace(/&amp;/g,'&');try{pcCv=pcCv||document.createElement('canvas').getContext('2d');pcFam=pcFam||getComputedStyle(document.body).fontFamily;pcCv.font=`${wt} ${fs}px ${pcFam}`;return pcCv.measureText(t).width*1.05+1;}catch(e){return t.length*fs*.6;}}
function pcOcc(){const R=[];return {R,add:r=>(R.push(r),r),n:(r,p=6)=>R.filter(b=>r.x<b.x+b.w+p&&r.x+r.w+p>b.x&&r.y<b.y+b.h+p&&r.y+r.h+p>b.y).length};}
function pcTrace(o,pts,t=3){for(let i=1;i<pts.length;i++){const [x0,y0]=pts[i-1],[x1,y1]=pts[i],n=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)/5));for(let k=0;k<=n;k++)o.add({x:x0+(x1-x0)*k/n-t,y:y0+(y1-y0)*k/n-t,w:2*t,h:2*t});}}
/* the plot slot in the chart card is the same on every step, so every chart is drawn in the same frame: pcPlotH is what the slot measures (see fitCharts) */
let pcPlotH=0;
const pcH=()=>Math.max(200,(pcPlotH||440)-98);
function pcFrame(W,o={}){const ml=50,mr=o.mr??70,top=34,h=o.h||pcH(),pw=W-ml-mr,slot=pw/16;return {ml,mr,pw,slot,top,h,W,x:q=>ml+(q+.5)*slot,axT:top+h+18,H:top+h+18+40,bw:Math.min(36,slot*.62)};}
function pcScale(lo,hi,n=7){const ST=[1,2,2.5,5,10,20,25,50,100,200,250,500,1000,2000,2500,5000,10000,20000],st=ST.find(s=>Math.ceil(hi/s-1e-9)-Math.floor(lo/s+1e-9)<=n)||ST.at(-1);return {st,a:Math.floor(lo/st+1e-9)*st,b:Math.ceil(hi/st-1e-9)*st};}
function pcAxis(c,lo,hi,o={}){
  const sc=pcScale(lo,hi,o.n||7),{st,b}=sc,a=o.half?Math.max(sc.a,Math.floor(lo/(st/2)+1e-9)*(st/2)):sc.a,y=v=>c.top+c.h-(v-a)/(b-a||1)*c.h,fmt=o.fmt||(v=>(v<0?'−':'')+fd(Math.abs(v),0));let s='';
  for(let v=Math.ceil(a/st-1e-9)*st;v<=b+1e-9;v+=st)s+=`<line class="${Math.abs(v)<1e-9?'saxis':'sgrid'}" x1="${c.ml}" x2="${c.ml+c.pw}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/>`+T(c.ml-8,y(v)+4,fmt(v),'smono','end');
  return {y,svg:s,lo:a,hi:b,st};
}
/* quarter labels under the plot; the month under each is dropped when the slots are too narrow for it */
const pcAxisX=c=>{let s='';for(let q=0;q<16;q++)s+=T(c.x(q),c.axT+13,qName(q),'slab-b','middle','font-size:12px')+(c.slot>=34?T(c.x(q),c.axT+27,EXIT[q],'smut','middle','font-size:11px'):'');return s;};
const pcTitle=(t,own)=>own?`<text x="4" y="18" class="smut" text-anchor="start" style="font-size:11.5px"><tspan style="font-weight:700;fill:${PC.ink}">Own scale</tspan> · ${t}</text>`:T(4,18,t,'smut','start','font-size:11.5px');
const pcRect=(o,x,y,w,h,fill,title,extra='')=>{if(o&&h>0)o.add({x,y,w,h});return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(h,.5).toFixed(1)}" fill="${fill}"${extra}>${title?`<title>${title}</title>`:''}</rect>`;};
/* a font size that lets the longest label of a series fit its slot */
const pcFs=(c,labs,base=10.5)=>Math.max(8.5,Math.min(base,base*(c.slot-3)/Math.max(...labs.map(l=>pcW(l,base,600)))));
/* a value printed on a bar or point; registered so callouts keep clear of it */
function pcVal(o,x,y,s,on,col,fs,o2){fs=fs||(on?12:11);const w=pcW(s,fs,600);o.add({x:x-w/2,y:y-fs,w,h:fs+2});if(o2)o2.add({x:x-w/2,y:y-fs,w,h:fs+2});return T(x,y,s,'smono','middle',`font-size:${fs.toFixed(1)}px;font-weight:${on?700:600};fill:${col||(on?PC.fundTxt:PC.ink)};${halo}`);}
/* a callout: first line bold, an optional second line; tries positions near the point until one is clear (text and stem) */
function pcPlace(o,c,p){
  const fs=p.fs||12,lh=fs+2,L=p.lines,w=Math.max(...L.map((s,i)=>pcW(s,i?fs-.5:fs,i?(p.w2||500):700))),h=L.length*lh,px=p.px,py=p.py,col=p.col||PC.ink;
  const G={u:g=>[-w/2,-(h+g)],ur:g=>[-3,-(h+g)],ul:g=>[-w+3,-(h+g)],d:g=>[-w/2,g],dr:g=>[-3,g],dl:g=>[-w+3,g],r:g=>[g+3,-h/2],l:g=>[-w-g-3,-h/2]},AN={u:'middle',d:'middle',ur:'start',dr:'start',r:'start',ul:'end',dl:'end',l:'end'};
  const x0=p.xmin??c.ml+2,x1=p.xmax??c.ml+c.pw-1,y0=p.ymin??c.top-10,y1=p.ymax??c.top+c.h-1;
  const stem=r=>{const qx=Math.max(r.x,Math.min(px,r.x+r.w)),qy=Math.max(r.y,Math.min(py,r.y+r.h)),d=Math.hypot(qx-px,qy-py);return {qx,qy,d,box:d>10&&p.leader!==false?{x:Math.min(qx,px+(qx-px)*6/d)-1,y:Math.min(qy,py+(qy-py)*6/d)-1,w:Math.abs(qx-px-(qx-px)*6/d)+2,h:Math.abs(qy-py-(qy-py)*6/d)+2}:null};};
  let best=null;
  for(const g of p.gaps||[5,14,26,40,56,74,94,120,150])for(const k of p.pref||['u','ur','ul','r','l','d','dr','dl']){const [dx,dy]=G[k](g),r={x:px+dx,y:py+dy,w,h};
    if(r.x<x0||r.x+r.w>x1||r.y<y0||r.y+r.h>y1)continue;const st=stem(r),n=o.n(r)+(st.box?o.n(st.box,0):0);if(!best||n<best.n)best={r,n,k};if(n===0)break;}
  if(best&&best.n>0&&p.optional)return '';
  if(!best){if(p.optional)return '';const k=(p.pref||['u'])[0],[dx,dy]=G[k](8),r={x:Math.max(x0,Math.min(x1-w,px+dx)),y:Math.max(y0,Math.min(y1-h,py+dy)),w,h};best={r,n:9,k};}
  const r=best.r,an=AN[best.k],tx=an==='end'?r.x+r.w:an==='middle'?r.x+r.w/2:r.x,st=stem(r);o.add(r);let s='';
  if(p.leader!==false&&st.d>10){const l=`x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${(st.qx-(st.qx-px)/st.d*2).toFixed(1)}" y2="${(st.qy-(st.qy-py)/st.d*2).toFixed(1)}"`;s+=`<line ${l} stroke="#fff" stroke-width="3.4"/><line ${l} stroke="${col}" stroke-width="1.3"/>`;if(st.box)o.add(st.box);}
  if(p.dot)s+=`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4" fill="#fff" stroke="${col}" stroke-width="1.8"/>`;
  L.forEach((t,i)=>{s+=T(tx,r.y+fs*.92+i*lh,t,'slab-b',an,`font-size:${i?fs-.5:fs}px;font-weight:${i?(p.w2||500):700};fill:${i?(p.c2||pcMuted):col};${halo}`);});
  return s;
}

/* ---------- steps 1-4: one chart, one axis, one set of bars ----------
   The chart is drawn once. A step only changes how each part is shown, by CSS on the card's data-layer:
   .mv-rev (the revenue bars) turns from blue to outline to light tint, .gr / .gd grow a bar from its own base or top,
   .cl draws the cash line, .ly fades labels and callouts. Nothing is redrawn when the step changes. */
const pcLy=(show,body,dl)=>`<g class="ly" data-show="${show}"${dl?` style="--dl:${dl}s"`:''}>${body}</g>`;
/* a bar that grows into place on the steps listed in `show` (up = grows from its base, else from its top) */
const pcBar=(o,up,show,x,y,w,h,fill,title,dl)=>{if(o&&h>0)o.add({x,y,w,h});return `<rect class="${up?'gr':'gd'}" data-in="${show}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(h,.5).toFixed(1)}" fill="${fill}"${dl?` style="--dl:${dl}s"`:''}>${title?`<title>${title}</title>`:''}</rect>`;};
/* the colours the CSS needs (from PC, so there is one list) */
const pcVars=()=>`--pc-rev:${PC.rev};--pc-revbg:${PC.revBg}`;
cxMoney=function(W,D){
  const S=cxSeries(D),R=D.R,c=pcFrame(W),id=++cxN,Q=operatingModel().S,bw=c.bw,PL=R.P;
  /* the top covers revenue, cash and the peak cash required; the bottom covers the largest quarterly growth-spending bar */
  const down=S.pat.map((e,q)=>Math.max(0,-e)+S.sp[q]),ax=pcAxis(c,-Math.max(...down,-Math.min(...S.cash)),Math.max(...S.net,...S.cash,S.peak)*1.05,{n:8,half:1}),y=ax.y,y0=y(0);
  const o=[0,1,2,3].map(()=>pcOcc()),xl=q=>c.x(q)-bw/2;
  const defs=`<defs><marker id="pcarr${id}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${PC.fund}"/></marker></defs>`;
  const top1=Q.map(w=>Math.max(w.net,w.cogs+w.variable+w.fixed));   /* the top of a step-2 bar: revenue, or the costs when a month makes a loss */

  /* ---- the revenue bars: blue (step 1), an outline round the cost bars (step 2), a light tint behind everything else (steps 3-4) ---- */
  let rev='',revo='';
  Q.forEach((w,q)=>{const h=y0-y(w.net),t=`${qLong(q)} · revenue ${rc(w.net)} a month`;
    rev+=`<rect class="mv-rev" x="${xl(q).toFixed(1)}" y="${y(w.net).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(h,.5).toFixed(1)}"><title>${t}</title></rect>`;
    revo+=`<rect class="mv-revo" x="${xl(q).toFixed(1)}" y="${y(w.net).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(h,.5).toFixed(1)}"/>`;
    o[0].add({x:xl(q),y:y(w.net),w:bw,h});o[1].add({x:xl(q),y:y(top1[q]),w:bw,h:y0-y(top1[q])});});

  /* ---- labels on every bar: the revenue total in steps 1 and 2 (blue), the operating margin above it in step 2 ---- */
  const labT=Q.map(w=>pcL(w.net)),labM=Q.map(w=>pctR(w.patP)),fs1=pcFs(c,[...labT,...labM],11);let L0='',L1='',tot='';
  Q.forEach((w,q)=>{tot+=pcVal(o[0],c.x(q),y(top1[q])-5,labT[q],false,PC.rev,fs1,o[1]);
    L1+=pcVal(o[1],c.x(q),y(top1[q])-5-fs1-3,labM[q],false,w.pat<0?PC.loss:PC.profit,fs1);});
  [['p5','Waterproofing'],['upvc','uPVC'],['wood','Wood adhesive']].forEach(([p,n])=>{const q=MODEL.products[p].launch-1;if(q>=0&&q<16)L0+=pcPlace(o[0],c,{px:c.x(q),py:y(top1[q])-19,lines:[`${n} launches · Q${q+1}`],col:PC.ink,pref:['ur','u']});});

  /* ---- step 2: the bar split into cost of goods, selling costs, common overhead and operating profit ---- */
  let seg='',tops=[];
  Q.forEach((w,q)=>{const a=w.cogs,b=a+w.variable,d=b+w.fixed,parts=[[0,a,PC.cogs,'Cost of goods',w.cogs],[a,b,PC.sell,'Selling costs',w.variable],[b,d,PC.oh,'Common overhead',w.fixed]];
    if(w.pat>0)parts.push([d,d+w.pat,PC.profit,'Operating profit',w.pat]);
    parts.forEach(([p0,p1,col,l,v],i)=>{seg+=pcBar(null,true,'1',xl(q),y(p1),bw,y(p0)-y(p1),col,`${qLong(q)} · ${l}: ${rc(v)}`,i*.06);});
    if(w.pat<0){const h=Math.max(3,Math.min(12,-w.pat/(ax.hi-ax.lo)*c.h));seg+=pcBar(null,true,'1',xl(q),y0-h,bw,h,PC.loss,`${qLong(q)} · operating loss ${sr(w.pat)} a month`,.2);}
    tops[q]=y(d+Math.max(w.pat,0));});
  {const pos=Q.findIndex(r=>r.pat>=0.005),worst=-Math.min(0,...Q.map(r=>r.pat)),f=Q[0],l=Q[15],q2=9,mid=y(Q[q2].cogs+Q[q2].variable+Q[q2].fixed/2);
   L1+=pcPlace(o[1],c,{px:c.x(15),py:y(top1[15])-5-2*fs1-8,lines:[`Q16: ${pctR(l.patP)} operating margin`,`${rc(l.pat)} profit on ${rc(l.net)} a month`],col:PC.profit,pref:['ul','u','l'],ymin:c.top-22});
   if(pos>=0)L1+=pcPlace(o[1],c,{px:c.x(pos),py:y(top1[pos])-5-2*fs1-8,lines:[pos?`Operating profit turns positive in Q${pos+1}`:'Operating profit positive from Q1',worst>0.005?`after a worst month of −${rc(worst)}`:'every month'],col:PC.profit,pref:['ul','u','ur','l']});
   else L1+=pcPlace(o[1],c,{px:c.x(15),py:y(top1[15])-60,lines:['Operating loss through Q16'],col:PC.loss});
   L1+=pcPlace(o[1],c,{px:c.x(q2)-bw/2-3,py:mid,lines:[`Common overhead: ${pctR(f.fixP)} → ${pctR(l.fixP)} of revenue`],col:PC.oh,dot:true,pref:['ul','u','l','dl']});}

  /* ---- step 3: earnings up, growth spending down, the cash required (minus the running total) shaded behind, revenue as light bars ---- */
  const sp=[['capex','Capex',PC.capex],['pp','Labs / systems',PC.labs],['wc','Increase in working capital',PC.wc],...(R.D.on?[['interest','Loan interest',PC.int]]:[])];
  const req=S.cum.map(v=>Math.max(0,-v)),rp=[[c.x(0)-c.slot/2,y0],...req.map((v,q)=>[c.x(q),y(v)])],bot=[];
  const need=`<path class="gr" data-in="2" d="${capPath(rp)}L${c.x(15).toFixed(1)} ${y0.toFixed(1)}Z" fill="${PC.fundBg}"/>`;
  let needEdge=`<path d="${capPath(rp)}" fill="none" stroke="${PC.fund}" stroke-width="1.6" stroke-linejoin="round"/>`;
  req.forEach((v,q)=>{needEdge+=`<circle cx="${c.x(q).toFixed(1)}" cy="${y(v).toFixed(1)}" r="2.8" fill="${PC.fund}" stroke="#fff" stroke-width="1"><title>${qLong(q)} · cash required ${rc(v)}</title></circle>`;});
  pcTrace(o[2],rp,3);Q.forEach((w,q)=>o[2].add({x:xl(q),y:y(w.net),w:bw,h:y0-y(w.net)}));
  let sh='';
  S.pat.forEach((e,q)=>{let d=0;
    if(e>=0.005)sh+=pcBar(o[2],true,'2',xl(q),y(e),bw,y0-y(e),PC.profit,`${qLong(q)} · operating earnings ${sr(e)}`);
    else if(e<=-0.005){sh+=pcBar(o[2],false,'2',xl(q),y0,bw,y(e)-y0,PC.loss,`${qLong(q)} · operating loss ${sr(e)}`);d+=-e;}
    sp.forEach(([key,l,col],i)=>{const v=Math.max(0,S.fl[key][q]);if(v>0.0005){sh+=pcBar(o[2],false,'2',xl(q),y(-d),bw,y(-d-v)-y(-d),col,`${qLong(q)} · ${l}: ${rc(v)}`,.05+i*.06);d+=v;}});bot[q]=y(-d);});
  const le=S.pat.map(pcL),ls=S.sp.map(v=>pcL(-v)),fs3=pcFs(c,[...le,...ls],10.5);let L2='';
  S.pat.forEach((e,q)=>{L2+=pcVal(o[2],c.x(q),(e>=0.005?y(e):y0)-4,le[q],false,e>=0.005?PC.profit:PC.loss,fs3);L2+=pcVal(o[2],c.x(q),bot[q]+12,ls[q],false,PC.capex,fs3);});
  [3,7,11,15].forEach(q=>{L2+=pcVal(o[2],c.x(q),y(req[q])-7,pcL(req[q]),false,PC.fundTxt,11);});
  {const pk=S.pk;
   L2+=pcPlace(o[2],c,{px:c.x(pk),py:y(req[pk]),lines:[`Cash required peaks at ₹${f0(S.peak)} Cr in ${qName(pk)}`],col:PC.fundTxt,dot:true,pref:['ul','u','l','dl'],ymin:c.top-24});
   if(S.cross>=0){const q=S.cross;L2+=pcPlace(o[2],c,{px:c.x(q),py:y(S.pat[q])-16,lines:[`Earnings pass spending in ${qName(q)}`,`${rc(S.pat[q])} against ${rc(S.sp[q])}`],col:PC.profit,pref:['ul','u','l']});}
   if(S.back>=0)L2+=pcPlace(o[2],c,{px:c.x(S.back),py:y(0),lines:[`Cash required back to zero in ${qName(S.back)}`],col:PC.fundTxt,dot:true,pref:['ur','u','r']});}

  /* ---- step 4: the cash line draws in; a round lands at the start of its quarter, so cash steps up there ---- */
  const labN=S.cash.map(pcL),fs4=pcFs(c,labN,11),raised=q=>sum(R.rounds.filter(r=>r.q===q).map(r=>r.amt));
  Q.forEach((w,q)=>o[3].add({x:xl(q),y:y(w.net),w:bw,h:y0-y(w.net)}));
  const x0=c.x(0)-c.slot/2,pts=[[x0,y0]],arrows=[];let prev=0;
  for(let q=0;q<16;q++){const a=raised(q),v=S.cash[q];
    if(a>0){const xs=q?c.x(q)-c.slot/2:x0+8;if(!q)pts.push([xs,y(0)]);else pts.push([xs,y(prev)]);pts.push([xs,y(prev+a)]);arrows.push([q,xs,prev,prev+a,a]);}
    pts.push([c.x(q),y(v)]);prev=v;}
  const pth=capPath(pts),line=`<path class="cl" pathLength="1" fill="none" d="${pth}" stroke="#fff" stroke-width="5.5" stroke-linejoin="round" opacity=".9"/><path class="cl" pathLength="1" fill="none" d="${pth}" stroke="${PC.cash}" stroke-width="2.6" stroke-linejoin="round"/>`;
  let dots='',L3='',arr='';
  S.cash.forEach((v,q)=>{dots+=`<circle cx="${c.x(q).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3.3" fill="${PC.cash}" stroke="#fff" stroke-width="1.2"><title>${qLong(q)} · cash at the end ${sr(v)}</title></circle>`;});
  pcTrace(o[3],pts,3);
  S.cash.forEach((v,q)=>{L3+=pcVal(o[3],c.x(q),y(v)-8,labN[q],false,PC.cash,fs4);});
  arrows.forEach(([q,xs,from,to])=>o[3].add({x:xs-4,y:y(to),w:8,h:y(from)-y(to)}));
  arrows.forEach(([q,xs,from,to,a])=>{const i=R.rounds.findIndex(r=>r.q===q);
    arr+=`<line x1="${xs.toFixed(1)}" x2="${xs.toFixed(1)}" y1="${y(from).toFixed(1)}" y2="${(y(to)+4).toFixed(1)}" stroke="${PC.fund}" stroke-width="3.6" marker-end="url(#pcarr${id})"/>`;
    arr+=pcPlace(o[3],c,{px:xs,py:y(to)-4,lines:[`Round ${i+1}`,pcR(a)],c2:PC.fundTxt,w2:700,col:PC.fundTxt,leader:false,gaps:[3,10,20,32],pref:['ur','u','ul','r','l']});});

  const titles=['₹ Cr a month, total revenue','₹ Cr a month · the full bar is revenue','₹ Cr in the quarter · cash required shaded · revenue a month, light bars','₹ Cr · cash at quarter end · revenue a month, light bars'].map((t,i)=>pcLy(String(i),pcTitle(t)));
  return `<svg class="s-svg cx-svg" viewBox="0 0 ${c.W} ${c.H}" style="${pcVars()}" role="img" aria-label="Revenue, margins, growth spending with the cash required, and cash with the funding rounds, by quarter">${defs}${ax.svg}${need}<g>${rev}</g>${pcLy('2',needEdge)}${seg}<g>${revo}</g>${sh}${line}${titles.join('')}${pcLy('0 1',tot)}${pcLy('0',L0)}${pcLy('1',L1)}${pcLy('2',L2)}${pcLy('3',dots,.45)}${pcLy('3',L3,.5)}${pcLy('3',arr,.2)}${pcAxisX(c)}</svg>`;
};
/* where the lowest closing cash sits: below zero, under the floor, or above it (the floor stays in the model; it is not drawn) */
const pcCashLevel=R=>R.minCash<-1e-9?'short':R.minCash<R.P.buffer-1e-9?'under':'ok';

/* step 5: what the first investor's stake is worth at an exit in each quarter (dilution from the rounds modelled only); one label a bar */
cxRet=function(W,D){
  const c=pcFrame(W,{kind:'r'}),ret=D.ret,path=ret.path,q0=D.X.q,e=D.pr[0],ask=e.amt,o=pcOcc(),bw=c.bw,ax=pcAxis(c,0,Math.max(...path,ask)*1.12,{n:6}),y=ax.y,y0=y(0),labs=path.map(pcL),fs=pcFs(c,labs,10.5);
  let s=ax.svg+pcTitle('₹ Cr, value of the first investor’s stake (not the ₹ axis of steps 1–4)',true);
  path.forEach((v,q)=>{s+=pcRect(o,c.x(q)-bw/2,y(v),bw,y0-y(v),PC.value,`${qLong(q)} · stake worth ${rc(v)} (${xS(v/ask)})`,q===q0?` stroke="${INK}" stroke-width="2.2"`:'');});
  const yl=y(ask);s+=`<line x1="${c.ml}" x2="${c.ml+c.pw+4}" y1="${yl.toFixed(1)}" y2="${yl.toFixed(1)}" stroke="${PC.fund}" stroke-width="1.4" stroke-dasharray="6 4"/>`+T(c.ml+c.pw+8,yl-2,`₹${f0(ask)} Cr`,'slab-b','start',`font-size:11.5px;fill:${PC.fundTxt}`)+T(c.ml+c.pw+8,yl+11,'put in','slab-b','start',`font-size:11.5px;fill:${PC.fundTxt}`);
  pcTrace(o,[[c.ml,yl],[c.ml+c.pw,yl]],2);
  path.forEach((v,q)=>{s+=pcVal(o,c.x(q),y(v)-5,labs[q],q===q0,PC.value,q===q0?Math.min(12,fs+1):fs);});
  const back=path.findIndex(v=>v>=ask),mod=D.pr.filter(r=>r.q<=q0).length;
  s+=pcPlace(o,c,{px:c.x(q0),py:y(path[q0])-22,lines:[`Exit in ${qName(q0)}: ${rc(ret.val)}`,`${xS(ret.mult)} the money · ${pct1(ret.irr*100)} a year`],col:PC.value,pref:['ul','u','l'],ymin:c.top-22});
  if(back>=0&&back!==q0)s+=pcPlace(o,c,{px:c.x(back),py:y(path[back])-19,lines:[`Stake worth more than the ${pcR(ask)} put in from ${qName(back)}`],col:PC.value,pref:['ul','u','ur','l']});
  s+=pcPlace(o,c,{px:c.ml+6,py:c.top+4,lines:[`Stake ${pct2(e.stake)} at round 1 → ${pct2(ret.s)} at exit`,`dilution covers rounds 1–${mod} only; later 6-monthly rounds not included`],col:PC.ink,leader:false,pref:['dr'],gaps:[2,14,28]});
  s+=pcAxisX(c);
  return `<svg class="s-svg cx-svg" viewBox="0 0 ${W} ${c.H}" role="img" aria-label="Value of the first investor's stake by exit quarter">${s}</svg>`;
};

/* step 6: return on capital employed; the axis stops at -20% and bars below it are marked; one label a bar */
cxRoce=function(W,D){
  const c=pcFrame(W,{kind:'o'}),ro=roceFin(D.G),o=pcOcc(),bw=c.bw,pre=ro.map(r=>r.pre*100),post=ro.map(r=>r.post*100),FL=-20;
  const ax=pcAxis(c,Math.max(FL,Math.min(0,...pre)),Math.max(...pre,5)*1.12,{n:9,fmt:v=>(v<0?'−':'')+fd(Math.abs(v),0)+'%'}),y=ax.y,y0=y(0),yf=y(ax.lo),labs=pre.map(pctR),off=pre.map(v=>v<ax.lo-1e-9),fs=pcFs(c,labs,10.5);
  let s=ax.svg+pcTitle('Annualised operating profit ÷ capital employed, in %',true);
  pre.forEach((v,q)=>{const x=c.x(q),vv=Math.max(v,ax.lo),neg=v<0;
    s+=pcRect(o,x-bw/2,neg?y0:y(vv),bw,Math.abs(y(vv)-y0),neg?PC.loss:PC.profit,`${qLong(q)} · ${pct1(v)} before depreciation, ${pct1(post[q])} after${off[q]?' (below the scale shown)':''}`);
    if(off[q])s+=`<path d="M${(x-bw/2-1).toFixed(1)} ${(yf-9).toFixed(1)}l${(bw/2+1).toFixed(1)} -4l${(bw/2+1).toFixed(1)} 4v4l-${(bw/2+1).toFixed(1)} -4l-${(bw/2+1).toFixed(1)} 4z" fill="#fff"/>`;
    if(post[q]>=ax.lo)s+=`<circle cx="${x.toFixed(1)}" cy="${y(post[q]).toFixed(1)}" r="3.6" fill="#fff" stroke="${PC.profit}" stroke-width="1.6"><title>${qLong(q)} · ${pct1(post[q])} after depreciation</title></circle>`;});
  pre.forEach((v,q)=>{s+=pcVal(o,c.x(q),(v<0?y0:y(v))-5,labs[q],false,v<0?PC.loss:PC.profit,fs);});
  const l=pre[15],first=pre.findIndex(v=>v>0),ofs=pre.map((v,q)=>off[q]?q:-1).filter(q=>q>=0);
  s+=pcPlace(o,c,{px:c.x(15),py:y(l)-19,lines:[`Q16: ${pctR(l)} before depreciation`,`${pctR(post[15])} after depreciation`],col:PC.profit,pref:['ul','u','l'],ymin:c.top-22});
  if(first>0)s+=pcPlace(o,c,{px:c.x(first),py:y(pre[first])-19,lines:[`Return turns positive in ${qName(first)}`],col:PC.profit,pref:['ur','u','ul']});
  if(ofs.length)s+=pcPlace(o,c,{px:c.x(ofs.at(-1))+bw/2,py:yf-6,lines:[`Off scale: ${ofs.map(q=>`${qName(q)} ${pctR(pre[q])}`).join(', ')}`,'capital is built ahead of sales'],col:PC.loss,pref:['r','dr','ur'],ymax:c.top+c.h+2});
  s+=pcAxisX(c);
  return `<svg class="s-svg cx-svg" viewBox="0 0 ${W} ${c.H}" role="img" aria-label="Annualised operating return on gross modelled capital by quarter">${s}</svg>`;
};
