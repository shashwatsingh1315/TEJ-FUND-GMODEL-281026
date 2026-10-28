const fs=require('node:fs'),assert=require('node:assert/strict'),load=require('./load-dashboard.cjs');
const {run,events,elements,ctx,html}=load(),sum=a=>a.reduce((s,v)=>s+v,0);let comparisons=0;
const eq=(a,b,label)=>{assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-7,`${label}: ${a} != ${b}`);comparisons++;};
const query=`(()=>{const D=capData();return {R:D.R,S:operatingModel().S,O:operatingModel().Q,M:operatingModel().months,ro:roceFin(D.G),ser:cxSeries(D),ret:D.ret,I:INP,items:D.G.K.items,controls:financingControls(D)};})()`;
const first=JSON.parse(JSON.stringify(run(query))),baseS=first.S;
// Explicit dimensional test: 60-day WC is 60/365 OF ANNUALISED REVENUE.
for(let q=0;q<16;q++){const K=first.R.G.K,full=baseS[q].net*12*60/365,opening=1.6*12*60/365;eq(K.wcTotal[q],full,`Q${q+1} full annual-sales WC target`);eq(K.wc[q],full-opening,`Q${q+1} additional WC`);eq(first.ro[q].ce,K.cum[q].capex+K.cum[q].pp+full,'Return denominator includes opening WC');}
eq(60/365*100,16.43835616438356,'Annual revenue percentage');eq(first.R.G.K.wc[15],248.6268493150685,'Q16 additional working capital');
const out=[];
for(const mode of ['none','wc','plant','both'])for(const share of [0,25,50,75,100]){
 run(`setFinanceMode('${mode}',${share})`);const d=JSON.parse(JSON.stringify(run(query))),{R,I,items}=d,D=R.D,G=R.G,sc=['plant','both'].includes(mode)?share/100:0,sw=['wc','both'].includes(mode)?share/100:0;let priorPlant=0,priorWC=0,totalInterest=0,netCum=0,opCum=0;
 for(let q=0;q<16;q++){
  const plantAdd=['tileP5','wood','upvc'].reduce((s,p)=>s+items[p][q]-(q?items[p][q-1]:0),0),draw=plantAdd*sc;
  let repay=0;for(let t=0;t<=q;t++){const age=q-t-I.funding.moratorium-1;if(age>=0&&age<I.funding.tenor){const a=['tileP5','wood','upvc'].reduce((s,p)=>s+items[p][t]-(t?items[p][t-1]:0),0);repay+=a*sc/I.funding.tenor;}}
  const plant=priorPlant+draw-repay,wc=G.K.wc[q]*sw,interest=(priorPlant+plant)/2*I.funding.rateCapex/100/4+(priorWC+wc)/2*I.funding.rateWC/100/4;totalInterest+=interest;
  eq(D.draw[q],draw,'Plant borrowing uses factories only');eq(D.repay[q],repay,'Repayment by draw vintage');eq(D.capBal[q],plant,'Plant loan principal');eq(D.wcBal[q],wc,'WC debt stock');eq(D.cumInt[q],totalInterest,'Interest on average balances');
  const cap=G.flows.capex[q]+G.flows.pp[q]+G.flows.wc[q],op=d.O[q].pat;netCum+=op-cap-interest;opCum+=op;
  const equity=sum(R.rounds.filter(r=>r.q<=q).map(r=>r.amt)),netDebt=plant+wc;
  eq(R.cash[q],equity+opCum-G.capx[q]+netDebt-totalInterest,'Cash source/use identity');eq(d.ser.cum[q],netCum,'Chart running total includes interest once');eq(d.ser.ncf[q],op-cap-interest,'Quarter cash includes interest once');
  eq(G.K.wc[q]-(q?G.K.wc[q-1]:0),G.flows.wc[q],'Only change in WC is a cash use');eq(d.S[q].pat,baseS[q].pat,'Financing does not change pre-interest operating profit');eq(d.ro[q].pre,first.ro[q].pre,'Financing does not change operating capital return');
  priorPlant=plant;priorWC=wc;
 }
 eq(sum(G.flows.capex),140,'End-state capex paid once');eq(sum(G.flows.pp),30,'Labs/systems paid once');eq(sum(G.flows.wc),G.K.wc[15],'WC cash flows telescope');
 eq(d.ret.eqv,12*baseS[15].net*10+R.cash[15]-D.bal[15],'Exit equity subtracts remaining debt');eq(d.ret.val,d.ret.eqv*d.ret.s,'Investor value accounts for debt and dilution');
 assert.equal(d.controls,'','The debt financing bar is hidden on page 03');
 out.push({mode,coverage:share,equity:R.equity,debtQ16:D.bal[15],interest:totalInterest,cashQ16:R.cash[15],minCash:R.minCash,rounds:R.rounds.map(r=>({quarter:r.q+1,amount:r.amt}))});
}
// Exercise the actual event handlers, including the zero-coverage recovery case.
run("A.page='finance';A.steps.finance=4;var financingRenders=0;refreshFinance=function(){financingRenders++;renderFinance();};setFinanceMode('none',50)");
const click=events.click.find(f=>f.toString().includes("closest('[data-finance-mode]')"));assert.ok(click);
click({target:{closest:()=>({dataset:{financeMode:'both'}})}});assert.equal(run('financeMode()'),'both');assert.equal(run('INP.funding.debtCapex'),50);assert.ok(!elements['main-content'].innerHTML.includes('data-finance-mode'));
const input=events.input.find(f=>f.toString().includes("matches?.('[data-finance-share]')")),change=events.change.find(f=>f.toString().includes("matches?.('[data-finance-share]')"));assert.ok(input&&change);
const target={value:'0',matches:()=>true,setAttribute:()=>{}};input({target});change({target});assert.equal(run('financeMode()'),'both');assert.equal(run('INP.funding.debtCapex'),0);target.value='75';input({target});change({target});assert.equal(run('INP.funding.debtWC'),75);click({target:{closest:()=>({dataset:{financeMode:'none'}})}});assert.equal(run('INP.funding.debtWC'),0);
// Actual data-entry handler rejects invalid financial terms without corrupting INP.
run(`(()=>{const el={value:'-1',dataset:{input:'funding.tenor'},setCustomValidity(){},closest(){return {classList:{toggle(){}}}}};onInput(el);if(INP.funding.tenor!==INPUT_DEFAULT.funding.tenor)throw Error('Invalid tenor accepted');return true;})()`);
// All six actual panels and all charts at all quarters under each borrowing mode.
const rendered=run(`(()=>{let n=0;for(const mode of ['none','wc','plant','both']){setFinanceMode(mode,50);const D=capData();for(let q=0;q<16;q++){A.cap.selQ=q;for(const key of CX_KEYS){const r=CX[key](D),s=r.body+r.lead+(r.pre||'');if(/NaN|undefined|Infinity/.test(s))throw Error(key+' invalid');n++;}for(const w of [560,900,1300])for(const fn of [cxMoney,cxRet,cxRoce])if(/NaN|undefined|Infinity/.test(fn(w,D)))throw Error('Invalid chart');}}setFinanceMode('none',50);A.cap.selQ=10;return n;})()`);
assert.equal(rendered,4*16*run('CX_KEYS.length'));
const modes=out.filter(x=>x.coverage===50),summary={status:'passed',arithmeticComparisons:comparisons,panelsRendered:rendered,scenariosChecked:out.length,annualWCPercent:60/365*100,workingCapital:{full:first.R.G.K.wcTotal[15],opening:first.R.G.K.openingWC,additional:first.R.G.K.wc[15]},modesAt50Percent:modes};
fs.writeFileSync('work/wc-review/financing-checks.json',JSON.stringify(summary,null,2));
const d=JSON.parse(JSON.stringify(run(query)));fs.writeFileSync('work/wc-review/updated-model.json',JSON.stringify(d,null,2));
console.log(JSON.stringify(summary,null,2));
