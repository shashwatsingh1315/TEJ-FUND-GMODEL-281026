const fs=require('node:fs'),path=require('node:path');
const sharp=require('/Users/shashwat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{for(let i=1;i<=7;i++){await sharp(path.join(__dirname,`chart-${i}.svg`)).flatten({background:'#FFFFFF'}).png().toFile(path.join(__dirname,`chart-${i}.png`));}console.log('Seven standalone SVG charts rendered to PNG for visual inspection.');})();
