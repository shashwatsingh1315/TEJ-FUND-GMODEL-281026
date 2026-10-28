/* Runs the dashboard's own scripts in a Node VM (no browser) and returns a function
   that evaluates code inside it. Default file: the latest workspace dashboard. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const DEFAULT_FILE=path.join(__dirname,'..','workspace-2026-10-28','outputs','Tejas_Revenue_Dashboard_1041_Updated.html');
module.exports=function load(f=DEFAULT_FILE){
 const html=fs.readFileSync(f,'utf8'),defaults=html.match(/<script type="application\/json" id="inputs-default">([\s\S]*?)<\/script>/)[1],noop=()=>{},elements={};
 const el=()=>({innerHTML:'',textContent:'',classList:{add:noop,remove:noop,toggle:noop},querySelectorAll:()=>[],style:{},dataset:{},setAttribute:noop});
 const ctx=vm.createContext({structuredClone,console,document:{getElementById:id=>id==='inputs-default'?{textContent:defaults}:elements[id]??=(el()),addEventListener:noop,querySelector:()=>null},localStorage:{getItem:()=>null,setItem:noop},innerWidth:1384,addEventListener:noop,window:{innerHeight:988},MutationObserver:class{observe(){}},setTimeout:()=>1,clearTimeout:noop,requestAnimationFrame:f=>f()});
 for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(m[1].replace(/^routeApp\(\);$/m,''),ctx,{timeout:3000});
 return s=>vm.runInContext(s,ctx,{timeout:15000});
};
