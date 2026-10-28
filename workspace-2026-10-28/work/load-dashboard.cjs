const fs=require('node:fs'),vm=require('node:vm');
module.exports=function loadDashboard(file='outputs/Tejas_Revenue_Dashboard_1041_Updated.html'){
 const html=fs.readFileSync(file,'utf8'),defaults=html.match(/<script type="application\/json" id="inputs-default">([\s\S]*?)<\/script>/)[1],noop=()=>{},events={},elements={};
 const el=()=>({innerHTML:'',textContent:'',classList:{add:noop,remove:noop,toggle:noop},querySelectorAll:()=>[],style:{},dataset:{},setAttribute:noop});
 const ctx=vm.createContext({structuredClone,console,document:{getElementById:id=>id==='inputs-default'?{textContent:defaults}:elements[id]??=(el()),addEventListener:(event,f)=>{(events[event]??=[]).push(f);},querySelector:s=>s==='[data-finance-summary]'?elements.summary??=(el()):null},localStorage:{getItem:()=>null,setItem:noop},innerWidth:1384,addEventListener:noop,window:{innerHeight:988},MutationObserver:class{observe(){}},setTimeout:()=>1,clearTimeout:noop,requestAnimationFrame:f=>f()});
 for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(m[1].replace(/^routeApp\(\);$/m,''),ctx,{timeout:3000});
 const run=(s)=>vm.runInContext(s,ctx,{timeout:15000});return {ctx,run,events,elements,html};
};
