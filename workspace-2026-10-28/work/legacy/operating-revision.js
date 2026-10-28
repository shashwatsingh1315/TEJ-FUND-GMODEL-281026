/* User-confirmed operating model, 28 Oct 2026.
   All S rows are quarter-end MONTHLY snapshots in INR crore.
   Q rows sum three estimated intervening months and are used only for cash.
   RT = cities; DD = dealer zones. GST is ignored by user instruction. */
const OP_LINES=[['influencer','Influencer / distributor schemes'],['brand','Brand payout'],['rm','RM salaries, travel and bonus'],['lastMile','Last-mile logistics'],['discount','Discounts'],['npa','NPAs / returns']];
const OP_COSTS=[['software','Software, subscriptions and reports'],['salary','Employees’ salaries and tours'],['cac','Customer acquisition'],['office','Office and administration'],['godown','Godown rent and expenses'],['marketing','Marketing and promotion'],['legal','Finance and legal fees']];
let OP_MEMO={key:null};
function opRates(p,ch,q){
  const source=p==='p5'?'wood':p,c=ch==='city'?'rt':'dd',d=INP.operating.products[source][c],t=Math.max(0,Math.min(1,q/15));
  const r=Object.fromEntries(Object.entries(d).map(([k,v])=>[k,v[0]+(v[1]-v[0])*t]));
  r.variable=sum(OP_LINES.map(([k])=>r[k]));r.cm2=r.cm1-r.variable;return r;
}
function opOverheads(mrr){
  const O=INP.operating,A=O.anchors,x=mrr*100,first=A[0],last=A.at(-1),ref=O.extrapolateFrom;
  const by={};
  OP_COSTS.forEach(([k])=>{
    const v=O.costs[k];let n=v[0];
    if(x>A.at(-1))n=v.at(-1)+Math.max(0,(v.at(-1)-v[ref])/(last-A[ref]))*(x-last);
    else if(x>first)for(let j=1;j<A.length;j++)if(x<=A[j]){n=v[j-1]+(v[j]-v[j-1])*(x-A[j-1])/(A[j]-A[j-1]);break;}
    by[k]=n/100;
  });
  return {by,total:sum(Object.values(by)),basis:x<first?'budget floor':x>last?'extended from upper anchors':'interpolated anchor'};
}
function opOpening(){
  const m0=INP.valuation.todayMRR,tile0=sum(MODEL.live.map(l=>l.market*MODEL.ramp.med[5])),tile=Math.min(m0,tile0),niche=Math.max(0,m0-tile),markets=sum(MODEL.live.map(l=>l.market));
  return Object.fromEntries(['city','dist'].map(ch=>{const w=sum(MODEL.live.filter(l=>UNIT_META[l.type].channel===ch).map(l=>l.market))/markets;return [ch,Object.fromEntries(P.map(p=>[p,p==='tile'?tile*w:p==='niche'?niche*w:0]))];}));
}
function opRow(streams,q){
  const rows=[],amount={};let revenue=0,cm1=0,cm2=0;
  OP_LINES.forEach(([k])=>amount[k]=0);
  for(const p of P)for(const ch of ['city','dist']){
    const rev=streams[ch][p],r=opRates(p,ch,q),a=Object.fromEntries(OP_LINES.map(([k])=>[k,rev*r[k]/100]));
    const row={p,ch,rev,r,cm1:rev*r.cm1/100,cm2:rev*r.cm2/100,variable:rev*r.variable/100,amount:a};rows.push(row);
    revenue+=rev;cm1+=row.cm1;cm2+=row.cm2;OP_LINES.forEach(([k])=>amount[k]+=a[k]);
  }
  const overhead=opOverheads(revenue),pat=cm2-overhead.total,ratio=v=>revenue?v/revenue*100:0;
  return {q,rows,amount,revenue,mrr:revenue,arr:12*revenue,gross:revenue,net:revenue,gst:0,cogs:revenue-cm1,cm1,variable:cm1-cm2,cm2,fixed:overhead.total,overhead,pat,
    cogsP:ratio(revenue-cm1),cm1P:ratio(cm1),varP:ratio(cm1-cm2),cm2P:ratio(cm2),fixP:ratio(overhead.total),patP:ratio(pat)};
}
function operatingModel(){
  const key=JSON.stringify(INP);if(OP_MEMO.key===key)return OP_MEMO.value;
  const rt=view(SCOPE.core,'city'),dd=view(SCOPE.core,'dist'),opening=opOpening(),streams=q=>({city:Object.fromEntries(P.map(p=>[p,rt.M[p][q]])),dist:Object.fromEntries(P.map(p=>[p,dd.M[p][q]]))});
  const S=Array.from({length:16},(_,q)=>({...opRow(streams(q),q),units:unitsBy('city',q)+unitsBy('dist',q),set:SETQ.includes(q)}));
  const months=[];
  for(let q=0;q<16;q++)for(let j=1;j<=3;j++){
    const a=q?streams(q-1):opening,b=streams(q),t=j/3;
    const x=Object.fromEntries(['city','dist'].map(ch=>[ch,Object.fromEntries(P.map(p=>[p,a[ch][p]+(b[ch][p]-a[ch][p])*t]))]));
    months.push({...opRow(x,Math.max(0,q-1+t)),quarter:q,month:q*3+j-1});
  }
  const keys=['gross','net','gst','cogs','cm1','variable','cm2','fixed','pat'];
  const Q=S.map((s,q)=>{const m=months.slice(q*3,q*3+3),r={...s};keys.forEach(k=>r[k]=sum(m.map(x=>x[k])));r.burn=sum(m.map(x=>Math.max(0,-x.pat)));r.cm1P=r.cm1/r.net*100;r.cm2P=r.cm2/r.net*100;r.patP=r.pat/r.net*100;return r;});
  const value={S,Q,months,opening,initial:opRow(opening,0)};OP_MEMO={key,value};return value;
}
const opLegacyIncome=incomeFin;
incomeFin=function(){const old=opLegacyIncome(),O=operatingModel();return {...old,Q:O.Q,S:O.S,months:O.months,patTurn:O.S.findIndex(r=>r.pat>=0)};};
const opLegacyFin=fin;
fin=function(){
  const F=opLegacyFin(),O=operatingModel(),rows=[O.initial,...[0,3,7,15].map(q=>O.S[q])],labels=['Opening plan','Q1','Q4','Q8','Q16'];
  F.cols=rows.map((r,i)=>({k:i?['q1','q4','q8','q16'][i-1]:'jul',label:labels[i],net:r.revenue,cogs:r.cogsP,cm1:r.cm1P,variable:r.varP,cm2:r.cm2P,fixed:r.fixP,pat:r.patP}));
  const a=F.cols[0],b=F.cols[4];F.bridge=[{k:'start',label:'Opening profit',kind:'total',layer:'pat',v:a.pat},{k:'cm1',label:'CM1 and mix',kind:'step',layer:'cm1',v:b.cm1-a.cm1},{k:'variable',label:'Variable costs and mix',kind:'step',layer:'cm2',v:a.variable-b.variable},{k:'fixed',label:'Common overheads',kind:'step',layer:'pat',v:a.fixed-b.fixed}];
  F.cm2Gain=b.cm2-a.cm2;F.fixedGain=a.fixed-b.fixed;return F;
};
const opLegacyCapModel=capModel;
capModel=function(o={}){
  const K=opLegacyCapModel(o),O=operatingModel(),lag=o.lateQ||0;let burn=0;
  K.burnM=K.T.map((_,q)=>{const r=q-lag>=0?O.Q[q-lag]:{fixed:3*O.initial.fixed,cm2:3*O.initial.cm2,burn:3*Math.max(0,-O.initial.pat)};return {costs:r.fixed*100/3,cm2:r.cm2*100/3,burn:r.burn*100/3};});
  K.burn=K.burnM.map(r=>burn+=r.burn*3/100);K.cum.forEach((r,q)=>r.loss=K.burn[q]);return K;
};
gapFin=function(o={}){
  const K=capModel(o),O=operatingModel(),N=K.N,lag=o.lateQ||0,pat=O.Q.map((_,q)=>q-lag>=0?O.Q[q-lag].pat:3*O.initial.pat),patMonthly=O.S.map((_,q)=>q-lag>=0?O.S[q-lag].pat:O.initial.pat);let cp=0;
  const cumPat=pat.map(v=>cp+=v),capx=K.cum.map(c=>c.capex+c.pp+c.wc),cumTot=K.cum.map(c=>c.capex+c.pp+c.wc+c.loss),gap=capx.map((v,q)=>v-cumPat[q]);
  const fl=k=>K.cum.map((c,q)=>c[k]-(q?K.cum[q-1][k]:0)),flows={capex:fl('capex'),pp:fl('pp'),wc:fl('wc'),loss:fl('loss')},peak=Math.max(...gap),peakQ=gap.indexOf(peak),selfQ=gap.findIndex((g,q)=>q>peakQ&&g<=0);
  return {K,N,pat,patMonthly,cumPat,capx,cumTot,gap,flows,peak,peakQ,selfQ};
};
blendW=function(q,R){const F=INP.funding,m=R.G.patMonthly[q]/baseData().V.T[q]*100;return Math.max(0,Math.min(1,(m-F.blendLo)/(F.blendHi-F.blendLo)));};
priceRounds=function(R,over){
  const F=INP.funding,T=baseData().V.T;let stake=0;
  return R.rounds.map((r,k)=>{
    if(!k){const arr=INP.valuation.todayMRR*12,post=INP.valuation.multiple*arr,pre=post-r.amt;stake=r.amt/post;return {...r,k,name:'E1',arr,mArr:INP.valuation.multiple,w:0,marg:null,arrVal:post,patVal:0,pre,post,sold:stake,dil:0,stake,method:fd(INP.valuation.multiple,0)+'× ARR'};}
    const q=r.q,arr=12*T[q],m=multArrAt(q),marg=R.G.patMonthly[q]/T[q]*100,w=blendW(q,R),arrVal=arr*m,patVal=12*R.G.patMonthly[q]*F.multPat,pre=over&&over[k]!=null?over[k]:(1-w)*arrVal+w*patVal,post=pre+r.amt,dil=r.amt/post;stake*=pre/post;
    return {...r,k,name:'E'+(k+1),arr,mArr:m,w,marg,arrVal,patVal,pre,post,sold:dil,dil,stake,method:w<=0?fd(m,1)+'× ARR':w>=1?fd(F.multPat,0)+'× annualised operating profit':fd(m,1)+'× ARR blended with operating profit'};
  });
};
exitEV=function(q,X,R){const Tq=baseData().V.T[q],p=R.G.patMonthly[q],F=INP.funding,w=blendW(q,R);return Math.max(0,(X.m==='pat'?12*p*F.multPat:X.m==='model'?(1-w)*12*Tq*multArrAt(q)+w*12*p*F.multPat:X.mult*12*Tq)*X.ach);};
roceFin=function(G){const F=INP.funding;return G.K.cum.map((c,q)=>{const ce=c.capex+c.pp+c.wc,dep=c.factory/(4*F.lifePlant)+(c.pp+c.misc)/(4*F.lifeOther),p=G.patMonthly[q];return {ce,dep,pre:ce?12*p/ce:0,post:ce?(12*p-4*dep)/ce:0};});};
stats=function(V){
  const T=V.T,O=opOpening(),m0=sum(['city','dist'].filter(ch=>V.ch==='all'||V.ch===ch).flatMap(ch=>P.filter(p=>V.on[p]).map(p=>O[ch][p]))),flow=T.map((v,q)=>(q?T[q-1]:m0)+2*v);let c=0;
  const cum=flow.map(v=>c+=v),net=T.map((v,i)=>v-(i?T[i-1]:0)),qoq=T.map((v,i)=>i&&T[i-1]>1e-9?v/T[i-1]-1:null),mom=qoq.map(g=>g==null?null:Math.cbrt(1+g)-1),yr=[0,1,2,3].map(y=>sum(flow.slice(y*4,y*4+4)));
  return {T,cum,net,qoq,mom,yr,tot:cum[15],arr:T[15]*12};
};
const opMoney=v=>(v<0?'−':'')+rc(v);
function opBasis(){return '<p class="note"><b>Basis:</b> quarter-end figures are monthly snapshots. RT = cities; DD = dealer zones. Margins interpolate from Q1 to Q16. Common overheads are additional to CM2 costs. GST is ignored. Operating profit excludes tax, interest and depreciation.</p>';}
function opAssumptions(){const O=INP.operating,A=O.anchors,ref=O.extrapolateFrom,low=sum(OP_COSTS.map(([k])=>O.costs[k][0])),marginal=sum(OP_COSTS.map(([k])=>O.costs[k].at(-1)-O.costs[k][ref]))/(A.at(-1)-A[ref])*100;return `<p class="note"><b>Cost assumptions:</b> ₹${fd(low,1)} L/month budget floor below ₹${fd(A[0]/100,1)} Cr MRR; line-by-line interpolation between supplied anchors; above ₹${fd(A.at(-1)/100,1)} Cr, each line continues at its marginal growth from ₹${fd(A[ref]/100,1)} Cr to ₹${fd(A.at(-1)/100,1)} Cr (₹${fd(marginal,2)} of additional overhead per ₹100 additional revenue). Waterproofing copies wood’s RT/DD costs. Blank discounts are zero. Component calculations retain the 0.5 percentage points rounded in the supplied CM2 display.</p>`;}
function opProductTable(q){
  const r=operatingModel().S[q];return `<div class="s-tw"><table class="s-table"><thead><tr><th>Product / income stream</th><th class="r">MRR, ₹ Cr</th><th class="r">CM1 %</th><th class="r">Variable %</th><th class="r">CM2 %</th><th class="r">CM2 / month, ₹ Cr</th></tr></thead><tbody>${r.rows.map(x=>`<tr><td>${SH[x.p]} · ${x.ch==='city'?'RT':'DD'}${x.p==='p5'?' (wood proxy)':''}</td><td class="r">${fd(x.rev,3)}</td><td class="r">${pct1(x.r.cm1)}</td><td class="r">${pct1(x.r.variable)}</td><td class="r">${pct1(x.r.cm2)}</td><td class="r">${fd(x.cm2,3)}</td></tr>`).join('')}<tr class="b"><td>Company · revenue weighted</td><td class="r">${fd(r.revenue,2)}</td><td class="r">${pct1(r.cm1P)}</td><td class="r">${pct1(r.varP)}</td><td class="r">${pct1(r.cm2P)}</td><td class="r">${fd(r.cm2,2)}</td></tr></tbody></table></div>`;
}
function opMonthlyChart(W0){
  const Q=operatingModel().S,W=W0||1000,H=300,ml=62,mr=20,top=22,bottom=52,pw=W-ml-mr,ph=H-top-bottom,lo=Math.min(0,...Q.map(r=>r.pat)),hi=Math.max(...Q.map(r=>r.cm2))*1.1,y=v=>top+(hi-v)/(hi-lo)*ph,x=q=>ml+(q+.5)*pw/16,bw=Math.min(16,pw/16*.23);let s='';
  for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4;s+=`<line class="sgrid" x1="${ml}" x2="${W-mr}" y1="${y(v)}" y2="${y(v)}"/>`+T(ml-8,y(v)+4,(v<0?'−':'')+fd(v,1),'smono','end');}
  Q.forEach((r,q)=>{[[r.cm2,CASHC.wc,-1],[r.fixed,CASHC.capex,0],[r.pat,r.pat<0?ACCENT:'#141413',1]].forEach(([v,c,k])=>s+=`<rect x="${x(q)+k*(bw+2)-bw/2}" y="${y(Math.max(0,v))}" width="${bw}" height="${Math.max(1,Math.abs(y(v)-y(0)))}" fill="${c}"><title>Q${q+1}: ${rc(v)} / month</title></rect>`);s+=T(x(q),H-28,'Q'+(q+1),'smono','middle','font-size:11px');});
  s+=`<line class="saxis" x1="${ml}" x2="${W-mr}" y1="${y(0)}" y2="${y(0)}"/>`;
  if(W0)return S(W,H,s,'CM2, common overhead and operating profit per month at each quarter end');return cbox('op-monthly',w=>opMonthlyChart(w),720);
}
CAP_RENDER.earn=D=>{
  const q=A.cap.earnQ,r=operatingModel().S[q],cash=operatingModel().Q[q],controls=seg(Array.from({length:16},(_,i)=>[i,'Q'+(i+1)]),q,'earnq','Quarter');
  const cards=opProductTable(q)+eqRow('Monthly result at '+qLong(q),[{k:'Revenue / month',v:rc(r.revenue)},{k:'Weighted company CM2',v:pct1(r.cm2P)},{k:'CM2 / month',v:rc(r.cm2),res:1}],['×','='])+eqRow('Shared overhead is deducted once',[{k:'CM2 / month',v:rc(r.cm2)},{k:'Common overhead / month',v:rc(r.fixed)},{k:'Operating profit / month',v:opMoney(r.pat),res:1}],['−','='])+`<div class="s-tw"><table class="s-table"><tbody>${OP_COSTS.map(([k,l])=>`<tr><td>${l}</td><td class="r">₹${fd(r.overhead.by[k]*100,2)} L / month</td></tr>`).join('')}<tr class="b"><td>Total common overhead</td><td class="r">₹${fd(r.fixed*100,2)} L / month</td></tr></tbody></table></div>`+opAssumptions()+`<p class="note"><b>Cash calculation kept separate:</b> estimated operating earnings during Q${q+1} are ${opMoney(cash.pat)}, from the three estimated months. The quarter-end monthly profit above is not multiplied by three.</p>`;
  return {title:'Monthly earnings at each quarter end',chart:opMonthlyChart(),after:legendRow([[capSw('wc'),'CM2 / month'],[capSw('capex'),'Shared overhead / month'],[swc('#141413'),'Operating profit / month']]),how:'All three bars show one month: the last month of each quarter. They are not quarterly totals.',why:`At Q16, company CM2 is ${pct1(operatingModel().S[15].cm2P)}, determined by the product and RT/DD revenue mix.`,cardsTitle:'Monthly calculation for '+qLong(q),cardsCtl:controls,cards};
};
const opOldConsume=CAP_RENDER.consume;
CAP_RENDER.consume=D=>{
  const r=opOldConsume(D),G=D.G,c=G.K.cum[15];r.title='Assets, receivables and operating losses needed by Q16';r.how='The narrow bars show capital required to date. The pale bars show ARR, the annualised exit-month revenue rate. These compare capital with a run rate, not with revenue earned during a year.';
  r.why=`Q16 includes ${rc(c.capex)} of capex, ${rc(c.pp)} of labs and systems, ${rc(c.wc)} held in additional receivables, and ${rc(c.loss)} of operating losses estimated month by month.`;
  r.cardsTitle='What the capital comprises';r.cards=eqRow('Q16 capital requirement',[{k:'Capex',v:rc(c.capex)},{k:'Labs and systems',v:rc(c.pp)},{k:'Receivables tied up',v:rc(c.wc)},{k:'Operating losses',v:rc(c.loss)},{k:'Total',v:rc(G.cumTot[15]),res:1}],['+','+','+','='])+opAssumptions()+`<p class="note">Receivables = added monthly revenue × ${fd(INP.capital.wcDays,0)} ÷ 30 under the receivable-days basis. Capex timing and working-capital assumptions retain the supplied dashboard settings. Burn uses the same monthly CM2 and overhead calculation as earnings.</p>`;return r;
};
const opOldGap=CAP_RENDER.gap;
CAP_RENDER.gap=D=>{const r=opOldGap(D),G=D.G,q=A.cap.gapQ==null?G.peakQ:A.cap.gapQ;r.title='The accumulated funding shortfall';r.how='This is a cumulative cash estimate. It compares growth investment with operating earnings accumulated through the estimated months. Orange includes operating deficits where earnings are negative.';r.why=`The largest outside funding need before equity or debt is ${rc(G.peak)} in ${qLong(G.peakQ)}.`;r.cards=eqRow('Funding gap at '+qLong(q),[{k:'Growth investment to date',w:'capex + intangibles + additional receivables',v:rc(G.capx[q])},{k:'Estimated operating earnings to date',w:'sum of intervening monthly earnings, including losses',v:opMoney(G.cumPat[q])},{k:G.gap[q]>=0?'Outside funding needed':'Surplus earned',v:rc(Math.abs(G.gap[q])),res:1}],['−','='])+`<p class="note">Equity and debt are added in Funding plan. Quarterly closing balances do not establish the lowest cash balance within a quarter. Interest and tax are excluded from operating earnings; modelled loan interest is deducted in the funding schedule.</p>`;return r;};
const opOldR1=CAP_RENDER.r1;
CAP_RENDER.r1=D=>{
  const r=opOldR1(D),R=D.R,G=D.G,c=G.K.cum[4],spend=c.capex+c.pp+c.wc,months=operatingModel().months.slice(0,15),earned=sum(months.map(m=>Math.max(0,m.pat))),loss=sum(months.map(m=>Math.max(0,-m.pat))),rounds=R.rounds.filter(x=>x.q<=4),eq=sum(rounds.map(x=>x.amt)),netDebt=R.cash[4]+spend-eq-G.cumPat[4];
  const uses=[['Capex',CAP4C.capex,c.capex,1],['Receivables',CAP4C.wc,c.wc],['Labs and systems',CAP4C.pp,c.pp],['Operating losses',CAP4C.loss,loss],...(netDebt<-.005?[['Debt cost',GREY,-netDebt]]:[]),['Cash at Q5','#fff',R.cash[4],0,1]],sources=[...rounds.map((x,i)=>['Round '+(i+1),ACCENT,x.amt,1]),['Positive operating earnings','#3D3C38',earned,1],...(netDebt>.005?[['Debt net of interest',GREY,netDebt]]:[])];
  r.chart=suChart({qn:'Q5',spend,r1p:R.rounds[0].amt+G.cumPat[4],uses,sources});r.after=legendRow([[capSw('capex'),'Capex'],[capSw('wc'),'Receivables'],[capSw('pp'),'Labs and systems'],[capSw('loss'),'Operating losses'],[swc(ACCENT),'Equity'],[swc('#3D3C38'),'Positive operating earnings'],[swc('#fff','outline:1px dashed #3D3C38'),'Closing cash']]);
  r.how='Sources are equity, positive monthly operating earnings and any net debt. Uses are growth investment, negative monthly operating earnings and the cash retained at Q5. Losses are shown as a use of cash, rather than as a negative funding source.';
  r.why=`Through Q5, growth investment is ${rc(spend)}; operating losses are ${rc(loss)} and positive operating earnings are ${rc(earned)}. The planned rounds leave ${rc(R.cash[4])} in the bank at Q5.`;r.cardsTitle='The first five quarters';return r;
};
const opOldFund=CAP_RENDER.fund;
CAP_RENDER.fund=D=>{const r=opOldFund(D),R=D.R;r.why=`The complete plan raises ${rc(R.equity)} in ${R.rounds.length} rounds. The lowest quarter-end cash balance is ${rc(R.minCash)} in ${qLong(R.minQ)}, against the ${rc(R.P.buffer)} target buffer. All scheduled rounds are included.`;return r;};
const opOldRet=CAP_RENDER.ret;
CAP_RENDER.ret=D=>{const r=opOldRet(D);r.cards=r.cards.replace(/4 × /g,'12 × ').replace(/Annualised Operating profit/g,'Annualised operating profit').replace(/4 ×/g,'12 ×');r.why='Exit values are scenarios using the selected valuation multiple, dilution and estimated closing cash. The achievement slider changes the exit valuation; operating costs and funding rounds are held at the base plan.';return r;};
const opOldRoce=CAP_RENDER.roce;
CAP_RENDER.roce=D=>{const r=opOldRoce(D),G=D.G,c=G.K.cum[15],v=roceFin(G)[15],p=G.patMonthly[15];r.title='Annualised operating return on capital at each quarter end';r.how='The bars annualise the final month’s operating profit (×12) and divide it by capex, intangibles and receivables at that quarter end. Dots deduct modelled annual depreciation.';r.cards=eqRow('Q16 annualised operating return',[{k:'Operating profit / month',v:rc(p)},{k:'Months',v:'12'},{k:'Annualised operating profit',v:rc(p*12),res:1}],['×','='])+eqRow('Capital put to work',[{k:'Capex',v:rc(c.capex)},{k:'Intangibles',v:rc(c.pp)},{k:'Receivables',v:rc(c.wc)},{k:'Capital employed',v:rc(v.ce),res:1}],['+','+','='])+eqRow('Return before tax and interest',[{k:'Annualised operating profit',v:rc(p*12)},{k:'Capital employed',v:rc(v.ce)},{k:'Return before depreciation',v:pct1(v.pre*100),res:1}],['÷','='])+`<p class="note">After depreciation: ${pct1(v.post*100)}. This is a simple return on gross capital employed, not a full statutory ROCE calculation.</p>`;return r;};
capKPI=function(D){const r=operatingModel().S[15];return `<div class="b-metrics cap-kpi"><div class="ans-k"><span>Q16 revenue / month</span><strong>₹${fd(r.revenue,1)}<small>Cr</small></strong></div><div><span>Q16 weighted CM2</span><strong>${pct1(r.cm2P)}</strong></div><div><span>Q16 overhead / month</span><strong>₹${fd(r.fixed,2)}<small>Cr</small></strong></div><div><span>Q16 operating profit / month</span><strong>${opMoney(r.pat)}</strong></div><div><span>Equity required · ${D.R.rounds.length} rounds</span><strong>₹${f0(D.R.equity)}<small>Cr</small></strong></div></div><p class="note">The first four figures describe the final month of Q16. Equity funds the accumulated cash shortfall and the chosen buffer through the plan. <a href="#audit">See all 16 monthly snapshots →</a></p>`;};
STEPS.finance[1]='Earnings and cash';STEPS.finance[3]='First five quarters';
CAP_BEATS[1][0][1]='Monthly earnings';CAP_BEATS[1][1][1]='Cumulative cash gap';
function opSheetRows(){
  const O=operatingModel(),R=raisePlan(),D=capFin(),rows=[],add=(label,values,kind='money')=>rows.push({label,values,kind});
  add('MONTHLY SNAPSHOTS AT QUARTER END',[],'section');
  P.forEach(p=>{['city','dist'].forEach(ch=>add(SH[p]+' · '+(ch==='city'?'RT':'DD')+' MRR',O.S.map(r=>r.rows.find(x=>x.p===p&&x.ch===ch).rev)));});
  add('Revenue / month',O.S.map(r=>r.revenue),'total');add('Cost of goods / month',O.S.map(r=>-r.cogs));add('CM1 / month',O.S.map(r=>r.cm1),'total');add('CM1 %',O.S.map(r=>r.cm1P),'pct');
  OP_LINES.forEach(([k,l])=>add(l+' / month',O.S.map(r=>-r.amount[k])));
  add('CM2 / month',O.S.map(r=>r.cm2),'total');add('Weighted CM2 %',O.S.map(r=>r.cm2P),'pct');OP_COSTS.forEach(([k,l])=>add(l+' / month',O.S.map(r=>-r.overhead.by[k])));
  add('Common overhead / month',O.S.map(r=>-r.fixed),'total');add('Operating profit / month',O.S.map(r=>r.pat),'total');add('Operating profit margin',O.S.map(r=>r.patP),'pct');add('ARR · annualised exit month',O.S.map(r=>r.arr));
  add('CASH ESTIMATES AND QUARTER-END BALANCES',[],'section');add('Estimated revenue earned during quarter',O.Q.map(r=>r.gross));add('Estimated operating earnings during quarter',O.Q.map(r=>r.pat));
  add('Growth investment during quarter',O.Q.map((_,q)=>-(R.G.flows.capex[q]+R.G.flows.pp[q]+R.G.flows.wc[q])));add('Operating losses incurred during quarter',R.G.flows.loss.map(v=>-v));
  add('Growth investment deployed to date',R.G.capx);add('Funding shortfall before equity / debt',R.G.gap);add('Equity raised during quarter',O.Q.map((_,q)=>sum(R.rounds.filter(r=>r.q===q).map(r=>r.amt))));
  add('Debt outstanding at quarter end',R.D.bal);add('Cash at quarter end',R.cash,'total');return rows;
}
finSheet=function(){
  const rows=opSheetRows(),yearEnds=[3,7,11,15],N=21,f=v=>(v<0?'−':'')+fd(v,Math.abs(v)<10?2:1);
  const head=`<thead><tr><th class="lbl">₹ Cr unless %</th>${Array.from({length:16},(_,q)=>`<th>Q${q+1}<small>${EXIT[q]}</small></th>`).join('')}${yearEnds.map((q,i)=>`<th class="yr">Year ${i+1} end<small>Q${q+1} snapshot</small></th>`).join('')}</tr></thead>`;
  const body=rows.map(r=>r.kind==='section'?`<tr class="sec"><td colspan="${N}"><b>${r.label}</b><span>${r.label.startsWith('MONTHLY')?'Each column is the final month of its quarter. Year-end columns repeat Q4, Q8, Q12 and Q16.':'Period flows and closing balances use their stated basis. Estimated quarterly earnings sum three interpolated months.'}</span></td></tr>`:`<tr class="${r.kind==='total'?'b':r.kind==='pct'?'pc':''}"><td class="lbl">${r.label}</td>${r.values.map(v=>`<td>${r.kind==='pct'?pct1(v):f(v)}</td>`).join('')}${yearEnds.map(q=>`<td class="yr">${r.kind==='pct'?pct1(r.values[q]):f(r.values[q])}</td>`).join('')}</tr>`).join('');
  return `<div class="s-panel"><div class="sheet-h"><div><h3>Financials at each quarter end</h3><p class="meta">Monthly revenue, margins, overheads and operating profit · ₹ Cr · GST ignored</p></div><button type="button" data-action="download-sheet">Download CSV</button></div>${opBasis()}<div class="sheet-w"><table class="sheet">${head}<tbody>${body}</tbody></table></div>${opAssumptions()}<p class="note">Cash estimates interpolate every product/channel’s monthly revenue between quarter-end targets. The opening mix uses the dashboard’s existing live units. Monthly margins follow the same Q1–Q16 calendar path. Quarterly cash earnings sum these months; they are not three times the closing monthly profit.</p></div>`;
};
sheetCSV=function(){const esc=s=>'"'+String(s).replace(/"/g,'""')+'"',head=['Basis: monthly snapshots; separate cash section uses period flows and closing balances','Unit: INR crore unless %','GST ignored'],rows=opSheetRows();return head.map(esc).join('\n')+'\n'+['Metric',...EXIT.map((e,q)=>'Q'+(q+1)+' '+e)].map(esc).join(',')+'\n'+rows.map(r=>[esc(r.label),...r.values.map(v=>v.toFixed(6))].join(',')).join('\n');};
renderAudit=function(){const r=operatingModel().S[15];$('main-content').innerHTML=pageHead('06 · Financials','Financials at quarter end','','',`<a class="s-edit" href="#inputs">Edit inputs</a>`)+`<p>At Q16: ${rc(r.revenue)} monthly revenue, ${pct1(r.cm2P)} weighted CM2, ${rc(r.fixed)} monthly common overhead and ${opMoney(r.pat)} monthly operating profit.</p>`+finSheet()+notesBlock();};
PAGES.audit=renderAudit;
function opInputTables(fld){
  const cell=(p,v)=>`<input type="number" step="any" data-input="${p}" value="${v}" aria-label="${p}">`;
  const margin=['tile','wood','upvc','niche'].map(p=>['dd','rt'].map(ch=>`<tr><td>${SH[p]} · ${ch.toUpperCase()}</td>${['cm1',...OP_LINES.map(x=>x[0])].map(k=>[0,1].map(i=>`<td class="r">${cell('operating.products.'+p+'.'+ch+'.'+k+'.'+i,INP.operating.products[p][ch][k][i])}</td>`).join('')).join('')}</tr>`).join('')).join('');
  return `<div class="s-panel"><h3>Product and income-stream margins</h3><p class="meta">Percent of revenue · each pair is Q1, Q16 · CM2 is calculated from these components at full precision. Waterproofing follows wood.</p><div class="s-tw"><table class="s-table s-intable"><thead><tr><th>Product / stream</th>${['CM1',...OP_LINES.map(x=>x[1])].map(l=>`<th colspan="2">${l}<small>Q1 / Q16</small></th>`).join('')}</tr></thead><tbody>${margin}</tbody></table></div></div><div class="s-panel"><h3>Common monthly overhead anchors</h3><p class="meta">₹ lakh · revenue anchors drive costs, independent of dates · retained ₹128 L total at ₹600 L revenue</p><div class="s-tw"><table class="s-table s-intable"><thead><tr><th>₹ L / month</th>${INP.operating.anchors.map((v,i)=>`<th>${cell('operating.anchors.'+i,v)}</th>`).join('')}</tr></thead><tbody>${OP_COSTS.map(([k,l])=>`<tr><td>${l}</td>${INP.operating.costs[k].map((v,i)=>`<td>${cell('operating.costs.'+k+'.'+i,v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${opAssumptions()}</div>`;
}
const opLegacyCapitalInputs=capitalInputs;
capitalInputs=function(fld){const old=opLegacyCapitalInputs(fld),first=old.indexOf('<div class="s-panel"><h3>Cost of revenue · cost plan and burn');return opInputTables(fld)+(first>=0?old.slice(0,first):old);};
INPUT_SCHEMA.splice(INPUT_SCHEMA.findIndex(g=>g.title==='Margins'),1);
NOTES[14]='User instruction, 28 Oct 2026: all supplied revenue and costs use the same basis; GST is ignored in this model.';
NOTES[15]='Operating profit = revenue-weighted product/channel CM2 less common company overheads. RM salaries, schemes and brand costs inside CM2 are separate from the supplied common overhead budget. Tax, interest and depreciation are excluded from operating profit.';
NOTES[21]='Monthly product/channel earnings and operating losses use the same calculation. Funding sums the estimated intervening monthly earnings. Burn is the sum of negative monthly earnings and is not deducted twice.';
NOTES[22]='Investment and exit dates retain the supplied quarter calendar. Profit valuation and operating return annualise the quarter-end monthly operating profit ×12. This is before tax, interest and depreciation. Exit equity value adds estimated cash and subtracts modelled debt.';
NOTES.push('User-confirmed model, 28 Oct 2026: RT = city revenue; DD = dealer-zone revenue. Starting and Q16 product cost percentages interpolate evenly across calendar Q1–Q16. Missing channel splits use the available product rates. Waterproofing uses wood’s DD/RT structure as a planning proxy.');
NOTES.push('Common overhead source: the user’s ₹ lakh/month revenue-anchor table, retaining the ₹128 L column at ₹600 L revenue. Below ₹250 L revenue keep the first ₹61 L budget. Above ₹2,000 L extend each line at its marginal growth from the ₹1,000 L to ₹2,000 L anchors. These extensions are planning assumptions, not validated future budgets.');
NOTES.push('Cash timing assumption: monthly product/channel revenues are linearly interpolated between quarter-end targets. Quarter-end operating views remain monthly snapshots. Cumulative revenue and operating cash earnings sum the interpolated months. Tax and intra-quarter funding timing are not separately modelled.');
window.__dash={...window.__dash,fin,stats,operatingModel,opRates,opOverheads,raisePlan,sheetCSV};
