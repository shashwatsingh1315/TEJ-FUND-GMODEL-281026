const fs=require('node:fs'),assert=require('node:assert/strict');
const root='/Users/shashwat/Documents/Codex/2026-10-28/c',target=root+'/outputs/Tejas_Revenue_Dashboard_1041_Updated.html';
let html=fs.readFileSync(__dirname+'/annotation-review/baseline.html','utf8');
const once=(a,b)=>{assert.ok(html.includes(a),'Missing: '+a.slice(0,100));html=html.replace(a,b);};
function scope(start,end,fn){const a=html.lastIndexOf(start);assert.ok(a>=0,start);const b=html.indexOf(end,a);assert.ok(b>a,end);const part=html.slice(a,b);html=html.slice(0,a)+fn(part)+html.slice(b);}
function sub(h,a,b){assert.ok(h.includes(a),'Missing scoped: '+a.slice(0,100));return h.replace(a,b);}
scope('function renderBasis(){','/* ---------- page 03 ---------- */',h=>{
 h=sub(h,'const s2=`<div class="b-grid two-up">','const s2=`<div class="review-inputs"><h3>How these two inputs work together</h3><p>Market size sets the local base. Product size scales it for each line.</p><div class="review-formula">Monthly revenue = units open × market size per unit × product-size multiplier × Tejas’s share</div></div><div class="b-grid two-up">');
 h=sub(h,"${howRead3('Square area = a unit’s monthly tile-adhesive market; outlined = live today. The grid below counts units opened each quarter.','Market size × units open is the base for every line.','Each class uses one average: ₹1.00 Cr per medium city, ₹0.75 Cr per medium zone. Real units vary around it; a unit changes class only at a change of magnitude (large city 10×, large zone 4×). One figure per class keeps the forecast checkable before units open.')}",'<div class="how-read"><p><b>How to read.</b> Square area shows the monthly tile-adhesive market of one unit. Outlined squares are live today; the grid below shows new openings.</p></div><div class="review-logic"><h4>Why use averages?</h4><p>Each location is different. One planning average per class keeps the forecast comparable; large markets have their own class.</p><div class="avg-range" aria-label="Illustration: individual markets may be smaller or larger than their class average"><span>Smaller</span><span class="avg-rail" aria-hidden="true"></span><b>Class average</b><span class="avg-rail" aria-hidden="true"></span><span>Larger</span></div></div>');
 h=sub(h,"${howRead('Bars compare each line with tile adhesive (1.00×). Below, each bar starts at the line’s launch; units add it after their wait.',`Lines beyond tile adhesive bring ${beyond}% of Q16 revenue.`)}",'<div class="how-read"><p><b>How to read.</b> Tile adhesive is the base (1×). The bars show each product’s market relative to it. The launch chart below shows when each product starts.</p></div>');
 h=sub(h,"${howRead('Each line is Tejas’s share of a city’s market, by quarter since the line started selling there. Black: medium units; grey: large.','Share is earned over six quarters, so a city’s revenue arrives after it opens.')}","${howRead('The x-axis is the number of quarters a product has sold in a unit; the y-axis is Tejas’s market share. Black = medium units; grey = large units.','Use the product’s selling age, not the company’s calendar quarter, to read its share.')}");
 h=sub(h,'<p class="ex-k">Check against today</p><h3>Today’s ₹${fd(today,1)} Cr, traced to its source</h3>${howRead(\'Read top to bottom: today’s revenue by line, then the market it implies in the four live units.\',\'The forecast starts from measured revenue, not an estimate.\')}', '<h3>Today’s ₹${fd(today,1)} Cr monthly revenue</h3>');
 h=sub(h,'<p class="ex-k">Worked example</p><h3>','<h3>');return h;
});
scope('function agingPanel(){','function productTable2',h=>{
 h=sub(h,'<p class="meta">Tile adhesive in a medium city that opens in Q${open}</p>','');
 h=sub(h,"${howRead(`Read across the quarters. The line starts the quarter the city opens; each quarter after, its share steps up. Q${read} is highlighted.`,'Age, not the calendar, sets a line’s share in each city.')}","<div class=\"how-read\"><p>Tile adhesive starts when this city opens in <b>Q${open}</b>. By <b>Q${read}</b>, it has sold there for <b>${read-open+1} quarters</b>, so the model applies the third-quarter share: <b>${fd(sh*100,0)}%</b>.</p></div>");
 h=sub(h,'  <div class="tl-res"><span>Revenue in Q${read}</span><b>1 city × ₹${fd(mk,2)} Cr × ${fd(p.size,2)} × ${fd(sh*100,0)}% = ₹${fd(rev,2)} Cr a month</b></div>\n','');
 h=sub(h,'<p class="note">A line launched later starts at whichever comes later: its launch, or the city’s opening plus a wait (see Formula inputs).</p>', '<div class="review-age-rule"><div><b>Start selling</b><span>Once the product has launched and the unit’s wait after opening is over.</span></div><div><b>Count quarters</b><span>The start is quarter 1; each quarter adds one.</span></div></div>');return h;
});
scope('function logicFlow(){','function agingPanel',h=>sub(h,'Revenue of one unit, one line, one quarter','Monthly revenue at quarter end'));
scope('function todayVisual(F){','function matureCity',h=>{
 h=h.replace(/   <div class="tv-step">[^\n]+\n/,'');
 h=sub(h,' Units opening in Q1 add ₹${fd(F.T[0]-today,2)} Cr, so Q1 exits at ₹${fd(F.T[0],2)} Cr.','');return h;
});
once("const CX_REV='#3D3C38',CX_PAT='#141413',CX_FIX='#8F8B80',CX_VAR='#BDB8AA',CX_COGS='#DDD8CC',CX_HOLE='#FBECE5',CX_GREY='#9C998F';","const CX_REV='#3976B9',CX_PAT='#24735A',CX_FIX='#7667A7',CX_VAR='#C69B50',CX_COGS='#B7C5D5',CX_HOLE='#F8E7E4',CX_GREY='#9C998F',CX_NEG='#B34641',CX_CASH='#193B63',CX_VALUE='#6C5798';");
once("exitM:'arr',exitMult:3","exitM:'arr',exitMult:10");
once("const RET_M=[['arr-2','2× ARR'],['arr-3','3× ARR'],['arr-5','5× ARR']","const RET_M=[['arr-10','10× ARR'],['arr-2','2× ARR'],['arr-3','3× ARR'],['arr-5','5× ARR']");
scope('function cxMoney(W,D){','/* step 6:',h=>{
 h=sub(h,"[['capex','Capex'],['pp','Intangibles'],['wc','Working capital']]","[['capex','Capex'],['pp','Intangibles'],['wc','Working capital'],['interest','Loan interest']]");
 h=sub(h,'hi=Math.max(...S.net,...S.cash)*1.05','hi=Math.max(...S.net,...S.cash)*1.22');
 h=sub(h,"let tot='',costs='',pats='',burn='',spend='',cashPats='',cashBurn='';","let tot='',costs='',pats='',burn='',spend='',cashPats='',cashBurn='',marginNotes='';");
 h=sub(h,'    const cashP=S.pat[q];',"    if([0,3,7,11,15].includes(q)){const top=w.cogs+w.variable+fx+Math.max(0,p);marginNotes+=T(x,y(top)-9,pctR(w.patP),'smono','middle',`font-size:12.5px;font-weight:700;fill:${p<0?CX_NEG:CX_PAT};${halo}`);}\n    const cashP=S.pat[q];");
 h=sub(h,"+ly('4','',cash)+rows;","+ly('4','',cash)+ly('1','',marginNotes)+rows;");
 h=sub(h,"['Cash less','spending']","['Net cash','flow']");
 h=sub(h,'fx=p<0?Math.max(0,w.fixed+p):w.fixed','fx=w.fixed');
 h=h.replaceAll("[fx,CX_FIX,'Fixed costs']","[fx,CX_FIX,'Common overhead']").replaceAll("[w.variable,CX_VAR,'Variable costs']","[w.variable,CX_VAR,'Selling costs']");
 h=h.replaceAll('fill="${ACCENT}"><title>${qLong(q)} · burn','fill="${CX_NEG}"><title>${qLong(q)} · burn').replaceAll('bar(x,0,cashP,ACCENT,','bar(x,0,cashP,CX_NEG,');
 h=h.replaceAll('stroke="${ACCENT_TXT}"','stroke="${CX_NEG}"').replaceAll('fill="${ACCENT_TXT}" stroke="#fff"','fill="${CX_NEG}" stroke="#fff"');
 h=sub(h,"T(c.x(pk),y(-S.peak)+20,`Deepest: −${rc(S.peak)} in ${qName(pk)}`,'slab-b','middle',`font-size:13px;fill:${ACCENT_TXT};${halo}`)","T(c.x(pk),y(-S.peak)-14,`Deepest: −${rc(S.peak)} in ${qName(pk)}`,'slab-b',pk>11?'end':'middle',`font-size:13px;fill:${CX_NEG};${halo}`)");
 const a=h.indexOf('  let cash=`'),b=h.indexOf('   +`<line ',a);assert.ok(a>=0&&b>a);h=h.slice(0,a)+'  let cash=`'+h.slice(b+5);
 h=h.replaceAll('stroke="${CX_PAT}" stroke-width="2.5"','stroke="${CX_CASH}" stroke-width="2.5"').replaceAll('fill="${CX_PAT}" stroke="#fff"','fill="${CX_CASH}" stroke="#fff"');
 return h;
});
scope('function cxRet(W,D){','/* step 7:',h=>sub(h,'fill="${q===q0?ACCENT:CX_REV}"','fill="${CX_VALUE}" stroke="${q===q0?CX_VALUE:\'none\'}" stroke-width="${q===q0?2:0}"'));
scope('function cxRoce(W,D){','/* chart titles,',h=>{
 h=sub(h,'sel=selQ(),lo=-40,bw=Math.min(36,c.slot*.6),cl=v=>Math.max(lo,v*100)','sel=selQ(),lo=Math.min(0,...ro.map(r=>Math.min(r.pre,r.post)*100)),bw=Math.min(36,c.slot*.6),cl=v=>v*100');
 h=sub(h,"{n:5,fmt:v=>","{n:7,fmt:v=>");h=sub(h,'fill="${q===sel?ACCENT:CX_REV}"','fill="${CX_PAT}" stroke="${q===sel?CX_PAT:\'none\'}" stroke-width="${q===sel?2:0}"');
 h=sub(h,"['ROCE','pre-tax']","['Return','pre-tax']");h=sub(h,'aria-label="Return on capital employed by quarter"','aria-label="Annualised operating return on gross modelled capital by quarter"');return h;
});
scope('CX.roce=D=>{','/* ---------- the page ---------- */',h=>{
 h=h.replace('ROCE before depreciation','Return before depreciation').replace("'pre-tax, simple'","'annualised profit ÷ gross modelled capital'").replace('Q16 ROCE if…','Q16 capital return if…');return h;
});
scope('function capKPI(D){','function fundDrawer',h=>h.replace('Return on capital at Q16','Q16 operating return').replace('<small>pre-tax</small>','<small>gross capital proxy</small>').replace('Capital consumed to Q16','Q16 capital + early losses'));
scope('function renderFinance(){','/* a step change',h=>{
 h=sub(h,'${stepBar(\'finance\')}<div class="cx-grid">','${financingControls(D)}${stepBar(\'finance\')}<div class="cx-grid">');
 h=sub(h,'<p class="cx-lead">${p.lead}</p>','${p.lead?`<p class="cx-lead">${p.lead}</p>`:\'\'}');
 h=sub(h,'<p>${s}</p>','${s?`<p>${s}</p>`:\'\'}');return h;
});
once("(window.innerHeight||864)-470","(window.innerHeight||864)-570");
const refinements=fs.readFileSync(__dirname+'/review-refinements.js','utf8')+'\n'+fs.readFileSync(__dirname+'/financing-revision.js','utf8'),css=fs.readFileSync(__dirname+'/review-refinements.css','utf8')+'\n'+fs.readFileSync(__dirname+'/financing-revision.css','utf8');
once('routeApp();\n</script>',refinements+'\nrouteApp();\n</script>');
once('</head>','<style id="review-refinements">\n'+css+'\n</style>\n</head>');
const revenue=s=>s.match(/  forecast:\{([\s\S]*?)\}\n\};/)[1];assert.equal(revenue(html),revenue(fs.readFileSync(__dirname+'/annotation-review/baseline.html','utf8')));
fs.writeFileSync(target,html);console.log('Applied review annotations to '+target);
