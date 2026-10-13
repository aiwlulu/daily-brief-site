import fs from 'node:fs';
import assert from 'node:assert/strict';
import {validDate} from '../docs/dates.mjs';
const bilingual=value=>{for(const lang of ['zh','en'])assert.ok(typeof value?.[lang]==='string' && value[lang].trim(),'Missing bilingual text');};
const manifest = JSON.parse(fs.readFileSync(new URL('../docs/editions/index.json',import.meta.url),'utf8'));
assert.ok(manifest.editions.length);
assert.equal(new Set(manifest.editions.map(e=>e.date)).size,manifest.editions.length);
for(const entry of manifest.editions) {
const data = JSON.parse(fs.readFileSync(new URL('../docs/'+entry.path,import.meta.url),'utf8'));
assert.equal(data.date,entry.date);
assert.ok(validDate(data.date));
assert.equal(entry.path,'./editions/'+data.date+'.json');
bilingual(data.throughline);
if(data.verificationNote)bilingual(data.verificationNote);
if(data.generatedAt)assert.ok(!Number.isNaN(Date.parse(data.generatedAt)));
for(const item of [...data.context,...data.lower,...data.memo.items]){bilingual(item.title);bilingual(item.text);}
for(const item of data.deep){bilingual(item.question);bilingual(item.text);}
assert.equal(new Set(data.stories.map(s=>s.id)).size,data.stories.length);
for(const story of data.stories){
  assert.ok(['tech','taiwan','global'].includes(story.category));
  for(const key of ['title','summary','metricLabel','confidence'])for(const lang of ['zh','en'])assert.ok(story[key][lang]);
  assert.ok(Number.isInteger(story.id));
  assert.equal(typeof story.metric,'string');
  if(story.pick!==undefined)assert.equal(typeof story.pick,'boolean');
  assert.ok(story.sections.length);
  story.sections.forEach(section=>{bilingual(section.label);bilingual(section.text);});
  assert.ok(story.sources.length);
  story.sources.forEach(s=>assert.equal(new URL(s.url).protocol,'https:'));
}
for(const item of data.deep)assert.ok(data.stories.some(s=>s.id===item.id));
}
const html = fs.readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const app = fs.readFileSync(new URL('../docs/app.js',import.meta.url),'utf8');
for(const match of app.matchAll(/el\('([^']+)'\)/g))assert.ok(html.includes('id="'+match[1]+'"'),'Missing element '+match[1]);
assert.ok(!app.includes('innerHTML'));
console.log('PASS: edition manifest, bilingual stories, source URLs, deep links and UI targets.');
