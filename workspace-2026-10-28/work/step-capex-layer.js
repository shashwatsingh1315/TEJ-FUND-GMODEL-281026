/* Capex in whole phases, 29 Oct 2026.
   The spend to Q16 is fixed: plants 40 + 30 + 50, centres 10, labs 10, systems 20, misc 10 (₹170 Cr).
   What is modelled is when each phase is bought. A phase adds capacity in proportion to its cost,
   so an item's full budget serves exactly its Q16 demand. A phase is paid leadQ quarters before
   demand would pass the capacity already built:
     phases in place (q) = fewest phases whose capacity covers demand(q + leadQ)
     spend to date (q)   = cost of the phases in place
   Demand is measured in what each item serves. Labs follow the plant phases in the same quarter.
   Revenue running late keeps the planned dates. */
const STEP_ITEMS={
 tileP5:{driver:'tile adhesive + waterproofing sales above today’s',measure:'tile + waterproofing sales above today',money:1},
 wood:{driver:'wood adhesive sales',measure:'wood adhesive sales',money:1},
 upvc:{driver:'uPVC sales',measure:'uPVC sales',money:1},
 centres:{driver:'cities and dealer zones opened after today’s 4',measure:'units opened',money:0},
 labs:{driver:'plant phases bought',measure:'plant bought',money:1},
 systems:{driver:'monthly revenue above today’s',measure:'revenue above today',money:1},
 misc:{driver:'monthly revenue above today’s',measure:'revenue above today',money:1}};
function stepCosts(k,C,X){
 const n=Math.max(1,Math.round(finNum(k==='centres'?C.centresN:(C.phases||{})[k],1,1))),B=X[k],f=finPct(C.firstPhase)/100;
 if(k==='wood'||k==='upvc'){if(f>=1||n===1)return [B];if(f>0)return [B*f,...Array(n-1).fill(B*(1-f)/(n-1))];}
 return Array(n).fill(B/n);
}
function stepBuild(costs,D,lead){
 const N=D.length,B=sum(costs),top=D[N-1],cap=[];let c=0;costs.forEach(x=>cap.push((c+=x)/B*top));
 let j=0,spent=0;const cum=[],buys=[];
 const buy=(q,need,needQ)=>{buys.push({q,i:j,cost:costs[j],capFrom:j?cap[j-1]:0,cap:cap[j],need,needQ});spent+=costs[j];j++;};
 for(let q=0;q<N;q++){
  const needQ=Math.min(N-1,q+lead),need=D[needQ];
  while(j<costs.length&&need>(j?cap[j-1]:0)+1e-9)buy(q,need,needQ);
  if(q===N-1)while(j<costs.length)buy(q,need,needQ); /* the Q16 end state is fixed */
  cum.push(spent);
 }
 return {cum,buys,cap,costs};
}
const stepPrevCapModel=capModel;
capModel=function(o={}){
 const K=stepPrevCapModel(o),C=K.C,X=K.X,M=K.M,T=K.T,lead=Math.max(0,Math.round(finNum(C.leadQ,1)));
 const D={tileP5:T.map((_,q)=>Math.max(0,M.tile[q]+M.p5[q]-K.tile0)),wood:M.wood.slice(),upvc:M.upvc.slice(),centres:K.units.map(u=>Math.max(0,u-4)),systems:T.map(v=>Math.max(0,v-K.m0))};
 D.misc=D.systems;
 const steps={};
 ['tileP5','wood','upvc','centres','systems','misc'].forEach(k=>steps[k]={...stepBuild(stepCosts(k,C,X),D[k],lead),D:D[k],lead});
 D.labs=T.map((_,q)=>steps.tileP5.cum[q]+steps.wood.cum[q]+steps.upvc.cum[q]);
 steps.labs={...stepBuild(stepCosts('labs',C,X),D.labs,0),D:D.labs,lead:0};
 K.items=Object.fromEntries(CAPEX_ITEMS.map(([k])=>[k,steps[k].cum]));K.steps=steps;K.leadQ=lead;
 K.cum.forEach((c,q)=>{c.factory=0;c.pp=0;c.misc=0;CAPEX_ITEMS.forEach(([k,,bk])=>c[bk]+=K.items[k][q]);c.capex=c.factory+c.misc;});
 return K;
};

/* ---------- how the phases read on page 03 and in Edit inputs ---------- */
const stepCol=bk=>bk==='pp'?CAP4C.pp:CAP4C.capex;
function stepCostText(costs){
 const g=[];costs.forEach(c=>{const l=g.at(-1);if(l&&Math.abs(l[0]-c)<1e-9)l[1]++;else g.push([c,1]);});
 return g.map(([c,n])=>n>1?`${n} × ${rc(c)}`:rc(c)).join(' + ');
}
function stepWhen(buys){
 const g=[];buys.forEach(b=>{const l=g.at(-1);if(l&&l[0]===b.q)l[1]++;else g.push([b.q,1]);});
 return g.map(([q,n])=>qName(q)+(n>1?` ×${n}`:'')).join(' · ');
}
function stepReason(k,b){
 const S=STEP_ITEMS[k],v=x=>S.money?rc(x):`${fd(x,x%1?1:0)} units`,L=p=>MODEL.products[p].launch,serve=b.i>1?`${b.i} phases serve`:'1 phase serves';
 if(k==='labs')return b.i?`plant bought ${rc(b.need)}, past the ${rc(b.capFrom)} that ${b.i>1?`${b.i} labs serve`:'1 lab serves'}`:'with the first plant phase';
 if(!b.i&&(k==='wood'||k==='upvc'))return `first phase, before the Q${L(k)} launch`;
 if(!b.i)return `first phase · ${qName(b.needQ)} ${S.measure} ${v(b.need)}`;
 return `${qName(b.needQ)} ${S.measure} ${v(b.need)}, past the ${v(b.capFrom)} that ${serve}`;
}
function stepSections(K,q){
 const lead=K.leadQ,all=CAPEX_ITEMS.flatMap(([k,l,bk])=>K.steps[k].buys.filter(b=>b.q===q).map(b=>({k,l,bk,b,n:K.steps[k].costs.length})));
 const now=all.length?`<table class="cx-rules">${all.map(({k,l,bk,b,n})=>`<tr><th>${swc(stepCol(bk))}${l}${n>1?` · ${b.i+1} of ${n}`:''}</th><td>${stepReason(k,b)}</td><td>${rc(b.cost)}</td></tr>`).join('')}</table>`
  :`<p class="cx-note">No phase is bought in ${qName(q)}. The capacity already built covers ${qName(Math.min(15,q+lead))}.</p>`;
 const plan=`<table class="cx-rules">${CAPEX_ITEMS.map(([k,l,bk])=>{const s=K.steps[k];return `<tr><th>${swc(stepCol(bk))}${l}</th><td>${stepCostText(s.costs)}<br><small>${stepWhen(s.buys)}</small></td><td>${rc(sum(s.costs))}</td></tr>`;}).join('')}</table>`;
 const total=sum(CAPEX_ITEMS.map(([k])=>sum(K.steps[k].costs)));
 return `<section class="review-capital-plan step-capex"><h4>Capex bought in ${qName(q)}</h4><p>Whole phases, each paid ${lead} quarter${lead===1?'':'s'} before demand passes the capacity already built</p>${now}</section>`+
  `<section class="review-capital-plan step-capex"><h4>Phases to Q16</h4><p>${rc(total)} to Q16 is fixed; phase sizes are assumptions${fn(NOTE_PLANT)}</p>${plan}<div class="review-formula">Capacity per phase = Q16 demand × phase cost ÷ item budget</div></section>`;
}
const stepPrevSpend=CX.spend;
CX.spend=D=>{
 const r=stepPrevSpend(D),K=D.G.K,q=selQ();
 r.body=r.body.replace('three plants, experience centres and misc','three plants, experience centres and misc, bought in phases').replace('cumulative investment target','labs with plant phases, systems in phases');
 const i=r.body.indexOf('</section>',r.body.indexOf('Capital balances at Q16'));
 r.body=i<0?r.body+stepSections(K,q):r.body.slice(0,i+10)+stepSections(K,q)+r.body.slice(i+10);
 return r;
};

const stepPrevCapitalInputs=capitalInputs;
capitalInputs=function(fld){
 const html=stepPrevCapitalInputs(fld),C=INP.capital,Df=INPUT_DEFAULT.capital,K=capModel(),mark='<div class="s-panel"><h3>Cost of revenue · capex',at=html.indexOf(mark),next=at<0?-1:html.indexOf('<div class="s-panel">',at+mark.length);
 const cell=(path,v,d,step='any')=>`<td class="r"><input type="number" step="${step}" min="0" data-input="${path}" value="${v}" class="${v!==d?'changed':''}" title="plan ${d}"></td>`;
 const bucket=bk=>({factory:'Capex',misc:'Capex',pp:'Intangibles'})[bk];
 const rows=CAPEX_ITEMS.map(([k,l,bk])=>`<tr><td>${l}</td><td>${bucket(bk)}</td><td>${STEP_ITEMS[k].driver}</td>${k==='centres'?cell('capital.centresN',C.centresN,Df.centresN,1):cell('capital.phases.'+k,C.phases[k],Df.phases[k],1)}<td>${stepCostText(K.steps[k].costs)}</td>${cell('capital.capex.'+k,C.capex[k],Df.capex[k])}</tr>`).join('');
 const panel=`<div class="s-panel"><h3>Cost of revenue · capex</h3><p class="meta">Spend to Q16, ₹ Cr, is fixed. Each item is bought in whole phases. A phase adds capacity in proportion to its cost and is paid ${K.leadQ} quarter${K.leadQ===1?'':'s'} before demand would pass the capacity already built. Labs follow the plant phases.</p>
  <div class="s-tw"><table class="s-table s-intable"><thead><tr><th>Item</th><th>Bucket</th><th>Sized on</th><th class="r">Phases</th><th>Phase costs</th><th class="r">₹ Cr to Q16</th></tr></thead><tbody>${rows}</tbody></table></div>
  <div class="s-ingrid">${fld(['capital.firstPhase','First phase of wood and uPVC','% of the plant, paid before launch'])}${fld(['capital.leadQ','Paid ahead of need','quarters before demand passes capacity'])}${fld(['capital.wcDays','Working-capital days','working capital target = days ÷ 365 × annualised revenue; cash uses changes'])}</div></div>`;
 return at<0?html+panel:html.slice(0,at)+panel+(next<0?'':html.slice(next));
};
const stepPrevOnInput=onInput;
onInput=function(el){
 const p=el.dataset.input||'',v=Number(el.value);
 if(p.startsWith('capital.phases.')||p==='capital.centresN'||p==='capital.leadQ'){
  const lo=p==='capital.leadQ'?0:1,hi=p==='capital.leadQ'?4:40;
  if(el.value.trim()===''||!Number.isInteger(v)||v<lo||v>hi){el.setCustomValidity?.(`Enter a whole number from ${lo} to ${hi}.`);return;}
 }
 return stepPrevOnInput(el);
};
const stepPrevAssumptions=financeAssumptions;
financeAssumptions=function(){return stepPrevAssumptions().replace(/Capex timing follows product sales[^<]*/,'Capex is bought in whole phases, each paid ahead of the demand it serves. The spend to Q16 is fixed; the number and size of phases are assumptions, not vendor quotes or a tonnage plan.');};
const stepPrevStress=stressCases;
stressCases=function(){return stepPrevStress().map(c=>c.k==='pre0'?{...c,label:'Wood and uPVC in equal phases'}:c);};
NOTES[NOTE_PLANT-1]='Assumption · capex phasing: the spend to Q16 is fixed (₹170 Cr, as the founders set it). Each item is bought in whole phases; a phase adds capacity in proportion to its cost and is paid one quarter before demand would pass the capacity already built. Plan phases: tile adhesive and waterproofing plant 8 × ₹5 Cr (modular dry-mix lines, about ₹1.65 Cr each on the ledger); wood ₹9 Cr before launch then 2 × ₹10.5 Cr; uPVC ₹15 Cr before launch then 2 × ₹17.5 Cr; 20 experience centres at ₹50 L; labs 4 × ₹2.5 Cr, one with each ₹30 Cr of plant; systems 4 × ₹5 Cr and misc 10 × ₹1 Cr on revenue. Phase counts are placeholders until vendor quotes and capacity per phase are in. Dark-store set-up, if any, has to sit inside misc.';
