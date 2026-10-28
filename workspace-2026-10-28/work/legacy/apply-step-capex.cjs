console.error('Retired: apply-step-capex.cjs belongs to the old way of building the dashboard and would overwrite it. See WORKING-ON-THE-DASHBOARD.md.');process.exit(1);
/* Adds whole-phase capex to the dashboard: phase inputs in the plan defaults, and the
   step-capex layer (work/step-capex-layer.js) as the last code layer, between markers so
   re-running replaces it. Run from workspace-2026-10-28: node work/apply-step-capex.cjs */
const fs=require('node:fs'),path=require('node:path');
const target=path.join(__dirname,'..','outputs','Tejas_Revenue_Dashboard_1041_Updated.html');
const layer=fs.readFileSync(path.join(__dirname,'step-capex-layer.js'),'utf8').trim();
const OPEN='/* >>> step capex layer */',CLOSE='/* <<< step capex layer */';
let html=fs.readFileSync(target,'utf8');

/* 1 · plan defaults: phases per item (centres use centresN) and how far ahead a phase is paid */
const re=/(<script type="application\/json" id="inputs-default">)([\s\S]*?)(<\/script>)/,m=html.match(re),raw=m[2];
const d=JSON.parse(raw);
if(JSON.stringify(d,null,1)!==raw.trim())throw Error('inputs-default is not in the expected layout; refusing to rewrite it');
const c=d.capital,phases={tileP5:8,wood:3,upvc:3,labs:4,systems:4,misc:10};
d.capital=Object.fromEntries(Object.entries(c).filter(([k])=>!['phases','leadQ'].includes(k)).flatMap(([k,v])=>k==='firstPhase'?[[k,v],['phases',c.phases||phases],['leadQ',c.leadQ??1]]:[[k,v]]));
html=html.replace(re,(_,a,__,b)=>a+raw.slice(0,raw.indexOf('{'))+JSON.stringify(d,null,1)+raw.slice(raw.lastIndexOf('}')+1)+b);

/* 2 · the layer, after every other layer and before the dashboard starts */
const block=`${OPEN}\n${layer}\n${CLOSE}\n`;
if(html.includes(OPEN))html=html.slice(0,html.indexOf(OPEN))+block+html.slice(html.indexOf(CLOSE)+CLOSE.length+1);
else{const at=html.lastIndexOf('window.__dash={...window.__dash,capModel');if(at<0)throw Error('end of the last code layer not found');html=html.slice(0,at)+block+html.slice(at);}
fs.writeFileSync(target,html);
console.log('Applied step capex to '+path.relative(process.cwd(),target));
