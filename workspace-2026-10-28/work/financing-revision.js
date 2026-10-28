/* Working-capital policy and financing choices, 28 Oct 2026.
   A 60-day planning target is 60/365 of annualised sales. It is NOT a claim
   that every customer has 60-day credit. Cash uses changes in the target. */
const FIN_DAYS_YEAR=365;
const finPct=v=>Math.max(0,Math.min(100,Number.isFinite(+v)?+v:0));
const finNum=(v,fallback,min=0)=>Number.isFinite(+v)?Math.max(min,+v):fallback;
const finOriginalCapModel=capModel;
capModel=function(o={}){
 const K=finOriginalCapModel(o),days=finNum(K.C.wcDays,60),opening=K.m0*12*days/FIN_DAYS_YEAR;
 K.days=()=>days;K.cyc=0;K.openingWC=opening;
 K.wcTotal=K.Tw.map(m=>m*12*days/FIN_DAYS_YEAR);
 K.wc=K.wcTotal.map(v=>v-opening);K.cum.forEach((c,q)=>c.wc=K.wc[q]);
 return K;
};
/* Loan principal is a funding source, never operating income. Plant debt covers
   only the three factories; labs, centres, systems and misc stay equity-funded.
   Interest uses the average opening/closing quarterly outstanding balance. */
debtFin=function(G,P){
 const N=G.N,K=G.K,sc=finPct(P.debtCapex)/100,sw=finPct(P.debtWC)/100,rc=finNum(P.rateCapex,11)/100/4,rw=finNum(P.rateWC,10.5)/100/4,tenor=Math.max(1,Math.round(finNum(P.tenor,16,1))),moratorium=Math.max(0,Math.round(finNum(P.moratorium,4)));
 const pc=Array.from({length:N},(_,q)=>['tileP5','wood','upvc'].reduce((s,k)=>s+K.items[k][q]-(q?K.items[k][q-1]:0),0));
 const draw=pc.map(v=>Math.max(0,v)*sc),repay=Array(N).fill(0);
 draw.forEach((d,t)=>{for(let j=0;d>0&&j<tenor;j++){const q=t+moratorium+1+j;if(q<N)repay[q]+=d/tenor;}});
 const capBal=[],intC=[];let balance=0;
 for(let q=0;q<N;q++){const old=balance;balance=Math.max(0,old+draw[q]-repay[q]);capBal.push(balance);intC.push((old+balance)/2*rc);}
 const wcBal=K.wc.map(v=>Math.max(0,v)*sw),intW=wcBal.map((v,q)=>((q?wcBal[q-1]:0)+v)/2*rw);
 let ci=0;const cumInt=intC.map((v,q)=>ci+=v+intW[q]);
 return {draw,repay,capBal,wcBal,bal:capBal.map((v,q)=>v+wcBal[q]),cumInt,intC,intW,on:sc>0||sw>0,plantSpend:pc};
};
const finOriginalPolicy=fundPolicy;
fundPolicy=function(o={}){const P=finOriginalPolicy(o);return {...P,buffer:finNum(P.buffer,10),lead:Math.round(finNum(P.lead,1)),window:Math.max(1,Math.min(16,Math.round(finNum(P.window,8,1)))),roundTo:finNum(P.roundTo,5,.01),e1:finNum(P.e1,40)};};
Object.assign(CAP4C,{interest:'#B87545'});
const finOriginalSeries=cxSeries;
cxSeries=function(D){const S=finOriginalSeries(D),interest=D.R.D.intC.map((v,q)=>v+D.R.D.intW[q]),fl={...S.fl,interest},sp=S.sp.map((v,q)=>v+interest[q]),ncf=S.pat.map((v,q)=>v-sp[q]);let a=0;const cum=ncf.map(v=>a+=v),pk=cum.indexOf(Math.min(...cum));return {...S,fl,sp,ncf,cum,pk,peak:-cum[pk],back:cum.findIndex((v,q)=>q>pk&&v>=0),cross:ncf.findIndex((v,q)=>q>0&&v>0&&ncf[q-1]<=0)};};
/* Capital returns use the FULL working-capital target, including the modelled
   opening balance. Funding uses only additional capital above that opening. */
roceFin=function(G){const F=INP.funding;return G.K.cum.map((c,q)=>{const wc=G.K.wcTotal[q],ce=c.capex+c.pp+wc,dep=c.factory/(4*F.lifePlant)+(c.pp+c.misc)/(4*F.lifeOther),p=G.patMonthly[q];return {ce,dep,pre:ce?12*p/ce:0,post:ce?(12*p-4*dep)/ce:0};});};

function financeMode(){const f=INP.funding;return ['none','wc','plant','both'].includes(f.debtMode)?f.debtMode:f.debtCapex>0?(f.debtWC>0?'both':'plant'):f.debtWC>0?'wc':'none';}
function setFinanceMode(mode,coverage){
 if(!['none','wc','plant','both'].includes(mode))throw Error('Unknown financing choice');
 const f=INP.funding,s=finPct(coverage??f.debtCoverage??50);f.debtMode=mode;f.debtCoverage=s;
 f.debtCapex=mode==='plant'||mode==='both'?s:0;f.debtWC=mode==='wc'||mode==='both'?s:0;
}
if(INP.funding.debtMode==='none'&&(INP.funding.debtCapex>0||INP.funding.debtWC>0))INP.funding.debtMode=INP.funding.debtCapex>0?(INP.funding.debtWC>0?'both':'plant'):'wc';
INP.funding.debtCoverage??=Math.max(INP.funding.debtCapex,INP.funding.debtWC,50);
function financeSummary(R){return `<span>Planned equity <b>${rc(R.equity)}</b></span><span>Debt at Q16 <b>${rc(R.D.bal[15])}</b></span><span>Interest over plan <b>${rc(R.D.cumInt[15])}</b></span>`;}
function financingControls(D){
 const m=financeMode(),share=finPct(INP.funding.debtCoverage??50),days=INP.capital.wcDays;
 return `<section class="finance-choice" aria-label="Growth financing"><div class="finance-choice-main"><div class="finance-options"><h3>Debt financing</h3><div class="finance-modes" role="group" aria-label="Assets financed with debt">${[['none','No debt'],['wc','Working capital'],['plant','Plants'],['both','Both']].map(([k,l])=>`<button type="button" data-finance-mode="${k}" aria-pressed="${m===k}">${l}</button>`).join('')}</div></div><div class="finance-coverage"><label for="finance-debt-share">Debt coverage <output id="finance-share-output" for="finance-debt-share">${m==='none'?'Off':fd(share,0)+'%'}</output></label><input id="finance-debt-share" data-finance-share type="range" min="0" max="100" step="5" value="${share}" aria-valuetext="${fd(share,0)} percent of eligible growth capital"${m==='none'?' disabled':''}><div class="finance-range-ends"><span>0%</span><span>100%</span></div></div></div><div class="finance-choice-foot"><div data-finance-summary role="status" aria-live="polite" aria-atomic="true">${financeSummary(D.R)}</div><span class="finance-wc-basis">WC target: ${fd(days,0)} / 365 = <b>${fd(days/365*100,2)}% of ARR</b> · pre-tax plan</span></div></section>`;
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-finance-mode]');if(!b||A.page!=='finance')return;setFinanceMode(b.dataset.financeMode);saveInputs();refreshFinance();});
document.addEventListener('input',e=>{const el=e.target;if(!el.matches?.('[data-finance-share]')||A.page!=='finance')return;setFinanceMode(financeMode(),el.value);saveInputs();const v=$('finance-share-output');if(v)v.textContent=fd(INP.funding.debtCoverage,0)+'%';el.setAttribute('aria-valuetext',fd(INP.funding.debtCoverage,0)+' percent of eligible growth capital');const host=document.querySelector('[data-finance-summary]');if(host)host.innerHTML=financeSummary(raisePlan());});
document.addEventListener('change',e=>{if(e.target.matches?.('[data-finance-share]')&&A.page==='finance')refreshFinance();});

fundDrawer=function(){
 const field=(p,l,u,min=0,step='any')=>`<label class="s-in"><span class="l">${l}<small>${u}</small></span><input type="number" min="${min}" step="${step}" data-input="${p}" value="${getPath(INP,p)}"><span class="d">plan ${getPath(INPUT_DEFAULT,p)}</span></label>`;
 return `<details class="cap-drawer"${A.cap.drawer?' open':''}><summary>Assumptions &amp; loan terms</summary><div class="cap-drawer-b"><p class="note"><b>Debt eligibility</b><br>Added working capital and the three factories.<br><small>Other investment stays equity-funded.</small></p><div class="s-ingrid cap-ingrid">${[['capital.wcDays','Working-capital target','days of annualised revenue'],['funding.rateCapex','Plant loan rate','% per year · assumption'],['funding.rateWC','Working-capital rate','% per year · assumption'],['funding.moratorium','Plant principal grace','full quarters after draw',0,1],['funding.tenor','Plant amortisation','quarterly instalments after grace',1,1],['funding.buffer','Minimum closing cash','₹ Cr · quarter-end target'],['funding.lead','Equity lead time','quarters before cash threshold',0,1],['funding.window','Equity sizing window','quarters',1,1],['capital.firstPhase','Pre-launch plant build','% of wood and uPVC budgets']].map(x=>field(...x)).join('')}</div>${whyD('Unverified assumptions',financeAssumptions())}</div></details>`;
};
function financeAssumptions(){return `<ul class="finance-assumptions"><li>Working capital is a planning target expressed as days of annualised sales. Receivables, inventory and supplier credit are not separately forecast.</li><li>The opening working-capital target is assumed already funded. No opening free cash is added.</li><li>Capex timing follows product sales, with the selected pre-launch portion of wood/uPVC. It is not a capacity or vendor-payment schedule.</li><li>Monthly sales between quarter-end targets are estimated; operating cash is before income tax. Returns include modelled depreciation but no existing fixed-asset book values.</li><li>Above ₹20 Cr monthly revenue, common overhead extends the ₹10–20 Cr marginal slope. Q16 overhead is an extrapolation, not a supplied budget.</li><li>Debt rates, repayment terms, equity buffer, round timing and valuations are planning assumptions. Quarter-end cash does not establish the lowest cash within a quarter.</li></ul>`;}
const finStressCases=stressCases;
stressCases=function(){return finStressCases().filter(c=>!['c41','c336','glide'].includes(c.k)).map(c=>({...c,label:c.k==='base'?`${fd(INP.capital.wcDays,0)}-day WC target`:c.label.replace(/Receivables/g,'Working-capital target')}));};
const finLegends=cxLegends;
cxLegends=function(D){const L=finLegends(D);if(D.R.D.on)L[2]+=`<span>${swc(CAP4C.interest)}Loan interest</span>`;return L;};
const financeHeads=cxHeads;
cxHeads=function(D){const h=financeHeads(D);h[2][1]='Operating earnings less growth investment, before financing.';h[3][1]='Growth investment less accumulated operating earnings.';h[4][1]='Cash remaining after investment, equity and debt.';return h;};

CX.spend=D=>{
 const q=selQ(),G=D.G,K=G.K,S=cxSeries(D),days=K.days(),last=15,pct=days/365*100,open=K.openingWC,full=K.wcTotal[last],prev=q?K.cum[q-1].wc:0,c=K.cum[q],before=q?K.cum[q-1]:{capex:0,pp:0,wc:0};
 const calc=cxCalc([['',CX_PAT,'Estimated quarter operating earnings','before tax and financing cost',sr(S.pat[q])],['−',CAP4C.capex,'Capex additions','',rc(S.fl.capex[q])],['−',CAP4C.pp,'Labs / systems additions','',rc(S.fl.pp[q])],['−',CAP4C.wc,'Increase in working capital','closing target − opening target',sr(S.fl.wc[q])],...(D.R.D.on?[['−',CAP4C.interest,'Loan interest','average quarterly debt balances',rc(S.fl.interest[q])]]:[]),['=',S.ncf[q]<0?CX_NEG:CX_PAT,`${qName(q)} cash ${S.ncf[q]<0?'deficit':'surplus'}`,'before equity and net loan proceeds',sr(S.ncf[q]),'tot']]);
 const working=`<div class="finance-wc-equation"><h4>Working capital at Q16</h4><div><span>Monthly revenue × 12</span><b>${rc(K.Tw[last])} × 12 = ${rc(K.Tw[last]*12)}</b></div><div><span>Target ratio</span><b>${fd(days,0)} / 365 = ${fd(pct,2)}%</b></div><div><span>Full working-capital target</span><b>${rc(full)}</b></div><div><span>Less opening target, assumed funded</span><b>−${rc(open)}</b></div><div class="total"><span>Additional working capital by Q16</span><b>${rc(full-open)}</b></div></div><p class="cx-note">In ${qName(q)}, additional WC changes from ${rc(prev)} to ${rc(K.cum[q].wc)}: cash required is ${sr(G.flows.wc[q])}.</p>`;
 const rules=`<section class="review-capital-plan"><h4>Capital balances at Q16</h4><p>Accumulated by the end of the plan</p><table class="cx-rules">${[['capex','Capex','three plants, experience centres and misc'],['pp','Labs / systems','cumulative investment target'],['wc','Additional working capital',`${fd(days,0)} / 365 × ARR, less opening target`]].map(([k,l,t])=>`<tr><th>${swc(CAP4C[k])}${l}</th><td>${t}</td><td>${rc(K.cum[last][k])}</td></tr>`).join('')}</table></section>`;
 const method=`<table class="cx-cols review-balances"><thead><tr><th>₹ Cr</th><th>Opening</th><th>Closing</th><th>Cash used</th></tr></thead><tbody>${[['capex','Capex'],['pp','Labs / systems'],['wc','Additional WC']].map(([k,l])=>`<tr><th>${l}</th><td>${fd(before[k],2)}</td><td>${fd(c[k],2)}</td><td>${fd(c[k]-before[k],2)}</td></tr>`).join('')}</tbody></table><div class="review-formula">Quarter capital cash used = closing balance − opening balance</div><p class="cx-note">Operating losses already sit in earnings. They are not charged a second time. Loan principal appears in financing; interest is a cash expense.</p>`;
 const total=G.capx[last],tf=o=>gapFin(o).capx[last],a=tf({capital:{wcDays:45}}),b=tf({capital:{wcDays:90}}),p=tf({plantMult:1.2});
 return {lead:'',body:cxQ(q)+`<section class="review-quarter"><h4>Cash flow in ${qName(q)}</h4>${calc}</section>`+working+rules+reviewScenarios(cxLev('Capital by Q16 if…',[['WC target is 45 days',rc(a),dlt(a,total)],['WC target is 90 days',rc(b),dlt(b,total)],['Plants cost 20% more',rc(p),dlt(p,total)]]))+whyD('Cash calculation and balance reconciliation',method)};
};
CX.need=D=>{const q=selQ(),G=D.G,S=cxSeries(D),R=D.R,calc=cxCalc([['',CAP4C.capex,'Growth capital deployed to date','capex + labs/systems + additional WC',rc(G.capx[q])],['−',CX_PAT,'Operating earnings to date','includes operating losses once',sr(G.cumPat[q])],...(R.D.on?[['+',CAP4C.interest,'Interest paid to date','',rc(R.D.cumInt[q])]]:[]),['=',S.cum[q]<0?CX_NEG:CX_PAT,S.cum[q]<0?'Cash shortfall before financing':'Surplus before financing','before equity and net loan principal',rc(Math.abs(S.cum[q])),'tot']]),pk=o=>{const r=raisePlan(o);return Math.max(...r.G.gap.map((v,i)=>v+r.D.cumInt[i]));},a=pk({capital:{wcDays:45}}),b=pk({capital:{wcDays:90}}),p=pk({plantMult:1.2}),l=pk({lateQ:2});return {lead:'',body:cxQ(q)+calc+reviewScenarios(cxLev('Peak shortfall if…',[['WC target is 45 days',rc(a),dlt(a,S.peak)],['WC target is 90 days',rc(b),dlt(b,S.peak)],['Plants cost 20% more',rc(p),dlt(p,S.peak)],['Revenue is two quarters late',rc(l),dlt(l,S.peak)]]))};};
const finRaise=CX.raise;
CX.raise=D=>{
 const r=finRaise(D),R=D.R,q=selQ(),p=q?R.D.bal[q-1]:0,dp=R.D.draw[q]-R.D.repay[q]+R.D.wcBal[q]-(q?R.D.wcBal[q-1]:0),interest=R.D.intC[q]+R.D.intW[q];
 const detail=`<p class="cx-note"><b>Debt funding</b><br>Borrowing reduces the equity required and adds repayment costs.</p><table class="cx-cols"><tbody><tr><th>Debt entering ${qName(q)}</th><td>${rc(p)}</td></tr><tr><th>Net new borrowing during quarter</th><td>${sr(dp)}</td></tr><tr><th>Interest paid during quarter</th><td>${rc(interest)}</td></tr><tr><th>Debt at ${qName(q)} end</th><td>${rc(R.D.bal[q])}</td></tr><tr><th>Interest paid through Q16</th><td>${rc(R.D.cumInt[15])}</td></tr></tbody></table>`;
 r.body=r.body.replaceAll('Receivables at','WC target at').replaceAll('plants and receivables','plants and additional WC');if(R.D.on)r.body=r.body.replaceAll('estimated quarter earnings less growth spending','operating cash less capital additions and interest');r.body+=whyD('Borrowing and interest calculation',detail);return r;
};
const finRoce=CX.roce;
CX.roce=D=>{
 const r=finRoce(D),q=selQ(),K=D.G.K;
 r.body=r.body.replace(`working capital ${rc(K.cum[q].wc)}`,`full working-capital target ${rc(K.wcTotal[q])}`);
 r.body=r.body.replace('Gross modelled capital = cumulative capex + labs/systems + additional working capital.','Gross modelled capital = cumulative capex + labs/systems + the full working-capital target, including its modelled opening balance.');
 return r;
};
const finCapitalInputs=capitalInputs;
capitalInputs=function(fld){return finCapitalInputs(fld).replace('Receivable days','Working-capital days').replace('working capital = days ÷ 30 × revenue a month added','working capital target = days ÷ 365 × annualised revenue; cash uses changes');};
const financingInput=onInput;
onInput=function(el){const p=el.dataset.input,v=Number(el.value),integer=['funding.tenor','funding.moratorium','funding.window','funding.lead'].includes(p),nonnegative=p.startsWith('capital.')||p.startsWith('operating.')||p.startsWith('funding.')||p.startsWith('valuation.'),positive=['funding.tenor','funding.window','funding.roundTo','funding.lifePlant','funding.lifeOther','valuation.todayMRR','valuation.multiple'].includes(p),percent=p==='capital.firstPhase'||p.startsWith('operating.products.');let bad=nonnegative&&(el.value.trim()===''||!Number.isFinite(v)||v<0||(integer&&!Number.isInteger(v))||(positive&&v<=0)||(percent&&v>100));let msg=!bad?'':(integer&&positive)?'Enter at least 1 whole quarter.':integer?'Enter 0 or more whole quarters.':percent?'Enter a percentage from 0 to 100.':positive?'Enter a value above 0.':'Enter 0 or more.';if(p.startsWith('operating.anchors.')){const i=+p.split('.').at(-1),a=INP.operating.anchors;if(!bad&&i>0&&v<=a[i-1]){bad=true;msg='Enter a value higher than the previous one.';}if(!bad&&i<a.length-1&&v>=a[i+1]){bad=true;msg='Enter a value lower than the next one.';}}if(!bad&&p==='funding.blendLo'&&v>=INP.funding.blendHi){bad=true;msg='Enter a value lower than the full-profit threshold.';}if(!bad&&p==='funding.blendHi'&&v<=INP.funding.blendLo){bad=true;msg='Enter a value higher than the blend start.';}if(bad){el.setCustomValidity?.(msg);return;}el.setCustomValidity?.('');financingInput(el);};
const financeGroup=INPUT_SCHEMA.find(g=>g.title==='Funding plan');
if(financeGroup){financeGroup.fields=financeGroup.fields.filter(f=>!['funding.wcBasis','funding.debtCapex','funding.debtWC'].includes(f[0]));financeGroup.intro='Equity policy and illustrative loan terms. Choose which assets use debt, and the coverage, on page 03. Working capital uses days / 365 of annualised revenue.';}
NOTES[NOTE_WC-1]='<b>Working-capital target</b><br>Cash tied up in growth increases the funding need.<br><small>Calculation: ARR × days ÷ 365. Opening WC is assumed funded. This is a planning ratio, not customer credit terms.</small>';
NOTES[NOTE_DEBT-1]='<b>Illustrative loan terms</b><br>11% plant interest · 10.5% WC interest.<br><small>Plant principal: four-quarter grace, then 16 quarterly instalments. Lender terms are unverified.</small>';
NOTES[NOTE_PRICE-1]='Illustrative round pricing retained from the supplied dashboard: round 1 uses 16× today’s ARR as post-money; later rounds use the configured ARR-multiple glide, blended with 15× annualised operating profit at the configured margin thresholds. Exit defaults to the user-selected 10× ARR. These are scenario inputs, not verified market valuations or term sheets.';
NOTES.forEach((s,i)=>{if(s.startsWith('Capital return basis:'))NOTES[i]='Capital return basis: annualised quarter-end monthly operating profit / (cumulative forecast capex + labs/systems + the full working-capital target). Opening working capital is included in this denominator; existing fixed-asset book values are unavailable and excluded. This remains an indicative gross-capital return, not complete company ROCE.';});
NOTES.push('The former 200% represented 60/30 of monthly revenue, not 200% of annual revenue. The revised 365-day annual-sales rule uses 60/365 = 16.4384% of ARR, equivalent to 1.9726 months of the current sales rate. Changing the percentage base alone does not reduce capital twelvefold.');
window.__dash={...window.__dash,capModel,debtFin,roceFin,financingControls,setFinanceMode};
