import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const missing=[];
for(const file of walk('src').filter(f=>f.endsWith('.tsx'))){
 const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 function visit(n){
  if(ts.isJsxText(n)){const text=n.text.replace(/\s+/g,' ').trim();if(/[A-Za-z]{2}/.test(text)&&!['Yamo','yamo','.lk','LankaQR','WhatsApp','EV','km','km ·','km · ~','/ 5.0','© OpenStreetMap · © OpenFreeMap','🧭 Google Maps ↗','🚗 Waze ↗'].includes(text))missing.push({file: file.replaceAll('\\','/'),text});}
  ts.forEachChild(n,visit);
 }visit(source);
}
for(const file of [...new Set(missing.map(x=>x.file))])console.log(file+'\n'+missing.filter(x=>x.file===file).map(x=>x.text).join(' | '));
console.log(`${missing.length} remaining fixed text fragments`);
if(missing.length)process.exitCode=1;
