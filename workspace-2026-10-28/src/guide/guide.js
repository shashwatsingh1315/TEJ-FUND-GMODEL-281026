/* Layout only: no model inputs or financial calculations live in this module. */
let guideMapObserver=null,guideMapFrame=0,guideMapEpoch=0;
function disposeGuideMap(){
  if(guideMapObserver){guideMapObserver.disconnect();guideMapObserver=null;}
  if(guideMapFrame){cancelAnimationFrame(guideMapFrame);guideMapFrame=0;}
  guideMapEpoch++;
}
function guideMapIcon(kind){
  const shapes={
    basis:'<path d="M3 6h4m4 0h10M3 12h10m4 0h4M3 18h4m4 0h10"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="18" r="2"/>',
    revenue:'<path d="M3 3v18h18M6 16l5-5 4 3 6-8m-5 0h5v5"/>',
    finance:'<path d="M3 8V6a2 2 0 0 1 2-2h13"/><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M21 12h-5a2 2 0 0 0 0 5h5"/><path d="M17 14.5h.01"/>',
    cities:'<path d="M3 21V8h8v13m0-18h10v18M1 21h22M6 12h2m-2 4h2m7-9h2m-2 4h2m-2 4h2m-1 4v2"/>',
    products:'<path d="m12 3 9 5v9l-9 5-9-5V8l9-5Zm-9 5 9 5 9-5m-9 5v9M7.5 5.5l9 5"/>',
    audit:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h3m3 0h2M8 15h3m3 0h2M8 18h3m3 0h2"/>'
  };
  return `<svg class="guide-map-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${shapes[kind]||''}</svg>`;
}
function guideOverview(pages){
  const node=(id,name,route,extra='',label=id)=>`<a class="guide-map-node${extra}" data-node="${Number(id)}" href="#${route}" aria-label="${id} ${name}"><span class="guide-map-meta">${guideMapIcon(route)}<span>${label}</span></span><b>${name}</b></a>`;
  return `<div class="guide-layout">
  <section class="s-panel stage3 guide-overview" aria-labelledby="guide-overview-title">
   <header class="guide-card-head"><h2 id="guide-overview-title">What this dashboard is</h2><p>The Tejas plan, from revenue assumptions to funding and investor returns · Oct 2026–Sep 2030.</p></header>
   <div class="guide-directory"><div class="guide-columns" aria-hidden="true"><span>The page &amp; the question it answers</span><span>What you’ll find</span></div>
    ${pages.map(p=>`<article class="guide-page"><header class="guide-page-head"><span class="guide-page-number">${p[0]}</span><h3><a href="#${p[2]}">${p[1]}</a></h3><p class="guide-page-question">${p[3]}</p></header><p class="guide-page-content">${p[4]}</p></article>`).join('')}
   </div>
  </section>
  <aside class="s-panel stage3 guide-map-panel" aria-labelledby="guide-map-title">
   <header class="guide-card-head"><h2 id="guide-map-title">How the model fits together</h2><p>Assumptions build revenue. Revenue drives funding. The financials bring them together.</p></header>
   <div class="guide-map-canvas" id="guide-connection-map">
    <svg class="guide-map-edges" role="img" aria-label="Model basis feeds Revenue. Cities and Products break down Revenue. Revenue feeds Funding and Financials. Funding feeds Financials; operating profit returns from Financials to Funding."></svg>
    ${node('01','Model basis','basis')}${node('02','Revenue','revenue')}${node('03','Funding &amp; returns','finance')}
    ${node('04','Cities &amp; Dealers','cities',' guide-map-branch','04 · By market')}${node('05','Products','products',' guide-map-branch','05 · By product')}${node('06','Financials','audit')}
   </div>
  </aside>
 </div>`;
}
function mountGuideMap(){
  disposeGuideMap();
  const canvas=document.getElementById('guide-connection-map');
  if(!canvas)return;
  const svg=canvas.querySelector('svg'),epoch=guideMapEpoch,ns='http://www.w3.org/2000/svg';
  const make=(tag,attrs)=>{const el=document.createElementNS(ns,tag);for(const [key,value]of Object.entries(attrs))el.setAttribute(key,String(value));return el;};
  function draw(){
    guideMapFrame=0;
    if(epoch!==guideMapEpoch||!canvas.isConnected)return;
    const box=canvas.getBoundingClientRect(),width=box.width,height=box.height;
    if(!width)return;
    svg.setAttribute('width',width);svg.setAttribute('height',height);svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.replaceChildren();
    const defs=make('defs',{}),marker=make('marker',{id:'guide-map-arrow',viewBox:'0 0 6 6',refX:5.5,refY:3,markerWidth:6,markerHeight:6,orient:'auto',markerUnits:'userSpaceOnUse'});
    marker.appendChild(make('path',{d:'M0 0 L6 3 L0 6 Z',class:'guide-map-arrow'}));defs.appendChild(marker);svg.appendChild(defs);
    const n={};canvas.querySelectorAll('[data-node]').forEach(el=>{const r=el.getBoundingClientRect();n[el.dataset.node]={x:r.x-box.x,y:r.y-box.y,w:r.width,h:r.height,cx:r.x-box.x+r.width/2,cy:r.y-box.y+r.height/2};});
    const line=d=>svg.appendChild(make('path',{d,class:'guide-map-line','marker-end':'url(#guide-map-arrow)'}));
    const label=(value,x,y,extra={})=>{const el=make('text',{x,y,...extra});el.textContent=value;svg.appendChild(el);};
    line(`M${n[1].cx} ${n[1].y+n[1].h} V${n[2].y-2}`);
    label('Assumptions',n[1].cx+12,(n[1].y+n[1].h+n[2].y)/2+3);
    line(`M${n[2].cx} ${n[2].y+n[2].h} V${n[3].y-2}`);
    label('Revenue',n[2].cx+12,(n[2].y+n[2].h+n[3].y)/2+3);
    const hub=(n[2].x+n[2].w+n[4].x)/2;
    line(`M${n[2].x+n[2].w} ${n[2].cy} H${hub} V${n[4].cy} H${n[4].x-3}`);
    line(`M${n[2].x+n[2].w} ${n[2].cy} H${hub} V${n[5].cy} H${n[5].x-3}`);
    const left=Math.max(7,Math.min(n[2].x,n[3].x,n[6].x)-20),ry=(n[2].cy+n[6].cy)/2;
    line(`M${n[2].x} ${n[2].cy} H${left} V${n[6].cy} H${n[6].x-3}`);
    label('Revenue',left-4,ry,{transform:`rotate(-90 ${left-4} ${ry})`,'text-anchor':'middle'});
    const down=n[3].cx-9,up=n[3].cx+9,middle=(n[3].y+n[3].h+n[6].y)/2;
    line(`M${down} ${n[3].y+n[3].h} V${n[6].y-2}`);
    line(`M${up} ${n[6].y} V${n[3].y+n[3].h+2}`);
    label('Funding',down-7,middle+3,{'text-anchor':'end'});label('Operating profit',up+7,middle+3);
  }
  const schedule=()=>{if(epoch===guideMapEpoch&&!guideMapFrame)guideMapFrame=requestAnimationFrame(draw);};
  guideMapObserver=new ResizeObserver(schedule);guideMapObserver.observe(canvas);
  if(document.fonts)document.fonts.ready.then(schedule);
  schedule();
}
