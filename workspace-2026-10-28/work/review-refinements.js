/* Review annotations, 28 Oct 2026. Presentation changes only; the cash engine
   continues to charge changes in cumulative capital balances. */
Object.assign(CAP4C,{capex:'#36518A',pp:'#9B72A6',wc:'#43A3AD',loss:CX_NEG});
A.cap.exitM='arr';A.cap.exitMult=10;

function reviewScenarios(html){return whyD('Sensitivity analysis','<p class="cx-note">Changes in assumptions and their effect on the result.</p>'+html);}
function reviewCollapseLast(body){const i=body.lastIndexOf('<div class="cx-lev">');return i<0?body:body.slice(0,i)+reviewScenarios(body.slice(i));}
const reviewRow=cxRow;
cxRow=function(c,vals,label,sel,col){let svg=reviewRow(c,vals,label,sel,col);if(label[0]==='Op. profit'){const size=Math.min(15,Math.max(12.5,c.slot*.34));svg=svg.replaceAll('font-size:11.5px',`font-size:${size}px`).replaceAll('font-size:12.5px',`font-size:${size+1}px`).replaceAll('font-size:11px','font-size:12px');}return svg;};

const reviewHeads=cxHeads;
cxHeads=function(D){const h=reviewHeads(D);h[0][1]='Revenue in the final month of each quarter.';h[1][1]='Revenue split into product costs, selling costs, overhead and profit.';h[2]=['Quarterly cash flow','Operating earnings less growth investment, before financing.'];h[4][1]=`Each arrow adds a funding round. Closing cash is shown against the ₹${f0(D.R.P.buffer)} Cr minimum.`;h[6]=['Operating return on capital','Annualised monthly operating profit ÷ modelled capital.<br><small>Dots show return after depreciation.</small>'];return h;};
cxLegends=function(D){
 const i=(c,l)=>`<span>${swc(c)}${l}</span>`,ln=(c,l,dashed=false)=>`<span><i class="ln" style="border-top:${dashed?'1.5px dashed':'2.5px solid'} ${c}"></i>${l}</span>`;
 return [i(CX_REV,'Revenue / month'),
 i(CX_PAT,'Operating profit')+i(CX_FIX,'Common overhead')+i(CX_VAR,'Selling costs')+i(CX_COGS,'Cost of goods')+i(CX_NEG,'Operating loss'),
 i(CX_PAT,'Quarter operating earnings')+i(CAP4C.capex,'Capex additions')+i(CAP4C.pp,'Labs / systems additions')+i(CAP4C.wc,'Increase in working capital'),
 ln(CX_NEG,'Accumulated cash before funding')+i(CX_HOLE,'Funding shortfall')+i('#DDDCD6','Quarter flows, faded'),
 ln(CX_CASH,'Cash in the bank')+i(ACCENT,'Planned equity')+ln(ACCENT,`₹${f0(D.R.P.buffer)} Cr minimum`,true),
 i(CX_VALUE,'Investor stake value')+ln(ACCENT,`₹${f0(D.pr[0].amt)} Cr invested`,true),
 i(CX_PAT,'Before depreciation')+`<span><i class="dot o" style="border-color:${CX_PAT}"></i>After depreciation</span>`];
};
const reviewRev=CX.rev;
CX.rev=D=>{const r=reviewRev(D);r.lead='';r.body=r.body.replace(/<p class="cx-note">[^<]*<a href="#basis"[\s\S]*?<\/p>/,'');r.body=reviewCollapseLast(r.body);return r;};
const reviewMar=CX.mar;
CX.mar=D=>{const r=reviewMar(D);r.lead='';if(operatingModel().S[selQ()].pat<0)r.body=r.body.replace(`background:${ACCENT};`,`background:${CX_NEG};`);r.body=r.body.replace(/<p class="cx-sub">Share of monthly revenue<\/p>(<table class="cx-cols">[\s\S]*?<\/table>)/,(_,table)=>whyD('Share of monthly revenue',table));r.body=reviewCollapseLast(r.body);return r;};
const reviewSpend=CX.spend;
CX.spend=D=>{
 const r=reviewSpend(D),G=D.G,q=selQ(),c=G.K.cum[q],prev=q?G.K.cum[q-1]:{capex:0,pp:0,wc:0};r.lead='';
 r.body=r.body.replace('>Working capital<','>Increase in working capital<').replace(/<p class="cx-note">The key figure[\s\S]*?<\/p>/,'').replace(`background:${ACCENT};`,`background:${CX_NEG};`);
 r.body=r.body.replace(`${qName(q)} is short`,`${qName(q)} cash deficit`).replace(`${qName(q)} has left over`,`${qName(q)} cash surplus`);
 r.body=r.body.replace(/<div class="cx-calc">([\s\S]*?)<\/div><p class="cx-sub">How each is sized · total by Q16<\/p>(<table class="cx-rules">[\s\S]*?<\/table>)/,(_,calc,rules)=>`<section class="review-quarter"><h4>Cash flow in ${qName(q)}</h4><div class="cx-calc">${calc}</div></section><section class="review-capital-plan"><h4>Capital balances at Q16</h4><p>Accumulated by the end of the plan</p>${rules}</section>`);
 const method=`<p class="cx-note">Cash spending in ${qName(q)} uses the additions below.</p><table class="cx-cols review-balances"><thead><tr><th>₹ Cr</th><th>Opening</th><th>Closing</th><th>Cash used</th></tr></thead><tbody>${[['capex','Capex'],['pp','Labs / systems'],['wc','Working capital']].map(([k,l])=>`<tr><th>${l}</th><td>${fd(prev[k],2)}</td><td>${fd(c[k],2)}</td><td>${fd(c[k]-prev[k],2)}</td></tr>`).join('')}</tbody></table><div class="review-formula">Quarter cash used = closing balance − opening balance</div><p class="cx-note">Capex and labs/systems are cumulative deployment targets. Working capital is the additional receivables balance above the opening business, using ${f0(INP.capital.wcDays)} days in the base plan. Operating earnings already include operating losses; burn is not charged again.</p>`;
 r.body=reviewCollapseLast(r.body);r.body+=whyD('Cash calculation and balance reconciliation',method);return r;
};
const reviewNeed=CX.need;
CX.need=D=>{const r=reviewNeed(D);r.lead='';r.body=r.body.replace(`background:${ACCENT};`,`background:${CX_NEG};`);r.body=reviewCollapseLast(r.body);return r;};

function reviewRound(r,i,R){
 const rs=R.rounds,G=R.G,K=G.K,P=R.P,end=rs[i+1]?rs[i+1].q-1:R.N-1,start=r.q,at=k=>K.cum[end][k]-(start?K.cum[start-1][k]:0),earn=G.cumPat[end]-(start?G.cumPat[start-1]:0),opening=start?R.cash[start-1]:0;
 const debt=R.D.bal[end]-(start?R.D.bal[start-1]:0)-(R.D.cumInt[end]-(start?R.D.cumInt[start-1]:0));
 const costs=[['capex','Capex',at('capex')],['wc','Working capital increase',at('wc')],['pp','Labs / systems',at('pp')]];
 const detail=i?`<b>Round ${i+1} · ₹${f0(r.amt)} Cr in ${qName(start)}</b><br>Protects the ₹${f0(P.buffer)} Cr cash floor.<br><small>Without this round, projected cash breaches the floor in ${qName(r.trigger)}.</small>`:`The opening round uses the supplied ${rc(r.amt)} ask.`;
 return `<article class="review-round"><header><div><h4>Round ${i+1}</h4><span>${qName(start)} · ${EXIT[start]}</span><span class="review-round-when">${roundWhen(R,i).text}</span></div><strong>₹${f0(r.amt)}<small>Cr</small></strong></header><div class="review-round-period">Cash bridge · ${qName(start)}–${qName(end)}</div><dl class="review-uses"><div><dt>Opening cash + this round</dt><dd>${rc(opening+r.amt)}</dd></div>${costs.map(([k,l,v])=>`<div><dt>${swc(CAP4C[k])}${l}</dt><dd>−${rc(v)}</dd></div>`).join('')}<div><dt>${swc(earn<0?CX_NEG:CX_PAT)}Operating ${earn<0?'losses':'earnings'}</dt><dd>${earn<0?'−':'+'}${rc(Math.abs(earn))}</dd></div>${Math.abs(debt)>.005?`<div><dt>Debt, net of interest</dt><dd>${sr(debt)}</dd></div>`:''}<div class="review-closing"><dt>Cash at ${qName(end)} end</dt><dd>${rc(R.cash[end])}</dd></div></dl>${whyD('Timing and round size',`<p class="cx-note">${detail}</p>`)}</article>`;
}
const reviewRaise=CX.raise;
CX.raise=D=>{const r=reviewRaise(D),R=D.R,S=cxSeries(D);r.lead='';const old=r.body.indexOf('<p class="cx-note cx-rulen">'),after=old>=0?r.body.slice(old):'';r.body=`<div class="review-fund-total"><span>Total equity · ${R.rounds.length} rounds</span><b>${rc(R.equity)}</b><small>Lowest closing cash ${rc(R.minCash)} · ${qName(R.minQ)}</small></div><div class="review-rounds">${R.rounds.map((x,i)=>reviewRound(x,i,R)).join('')}</div>`+after;r.body=reviewCollapseLast(r.body);r.body=r.body.replace(/<p class="cx-note cx-rulen">[\s\S]*?<\/p>/,'');return r;};
const reviewRet=CX.ret;
CX.ret=D=>{const r=reviewRet(D);r.body=r.body.replace(/<p class="cx-note">Profit valuation annualises[\s\S]*?<\/p>/,'');r.body=reviewCollapseLast(r.body);return r;};
const reviewRoce=CX.roce;
CX.roce=D=>{
 const r=reviewRoce(D);r.lead='';r.body=r.body.replace(`background:${ACCENT};`,`background:${CX_PAT};`);r.body=reviewCollapseLast(r.body);
 const method=`<div class="review-formula">Before depreciation = monthly operating profit × 12 ÷ gross modelled capital</div><div class="review-formula">After depreciation = (monthly operating profit × 12 − annual depreciation) ÷ gross modelled capital</div><p class="cx-note">Gross modelled capital = cumulative capex + labs/systems + additional working capital. Annual depreciation = plants and centres ÷ ${f0(INP.funding.lifePlant)} + labs, systems and misc ÷ ${f0(INP.funding.lifeOther)}.</p><p class="cx-note"><b>Capital included</b><br>Forecast assets and the full working-capital target.<br><small>Existing fixed assets are excluded. This is not complete company ROCE.</small></p>`;
 r.body+=whyD('Return calculation and capital basis',method);return r;
};
NOTES.push('Capital cash check: capex, labs/systems and working capital are cumulative closing balances. Cash outflow in a quarter is its closing balance less the previous quarter’s closing balance. Funding deducts those changes and includes operating losses once through the monthly earnings schedule.');
NOTES.push('Capital return basis: annualised quarter-end monthly operating profit / gross modelled capital. Existing historical assets and opening receivables are not supplied in this forecast; the displayed return is a proxy on the modelled new capital, not complete company ROCE. Depreciation is straight-line on gross deployed balances.');
