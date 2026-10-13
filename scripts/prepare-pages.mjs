import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve('docs'), hashes=new Map(), processing=new Set();
function version(file){
 const full=path.resolve(root,file);
 if(!full.startsWith(root+path.sep))throw Error('Asset outside docs');
 if(hashes.has(full))return hashes.get(full);
 if(processing.has(full))throw Error('Circular module dependency');
 processing.add(full);
 if(/\.(?:mjs|js)$/.test(full)){
  const original=fs.readFileSync(full,'utf8');
  const transformed=original.replace(/(from\s+['"])(\.\/[^'"?]+\.(?:mjs|js))(?:\?[^'"]*)?(['"])/g,(all,prefix,relative,quote)=>{
   const imported=path.relative(root,path.resolve(path.dirname(full),relative));
   return prefix+relative+'?v='+version(imported)+quote;
  });
  fs.writeFileSync(full,transformed);
 }
 const hash=createHash('sha256').update(fs.readFileSync(full)).digest('hex').slice(0,12);
 hashes.set(full,hash);processing.delete(full);return hash;
}
const html=path.join(root,'index.html');
const output=fs.readFileSync(html,'utf8').replace(/((?:src|href)=")(\.\/[^"?#]+\.(?:css|js|mjs|svg|png))(?:\?[^"#]*)?(")/g,(all,prefix,file,quote)=>prefix+file+'?v='+version(file)+quote);
fs.writeFileSync(html,output);
console.log('Prepared content-versioned page assets.');
