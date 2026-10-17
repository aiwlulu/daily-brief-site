import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validDate,periodRange} from '../docs/dates.mjs';
const bilingual=value=>{for(const lang of ['zh','en'])assert.ok(typeof value?.[lang]==='string' && value[lang].trim(),'Missing bilingual text');};
// Guard the simplified character found in published Chinese copy.
// Do not convert shared forms such as 干, 准, 台 or proper names automatically.
const checkChineseCopy=(value,path='copy')=>{
 if(!value||typeof value!=='object')return;
 for(const [key,item] of Object.entries(value)){
  if(key==='zh'&&typeof item==='string')assert.ok(!item.includes('\u6761'),'Simplified 条 in '+path+'.zh');
  else if(item&&typeof item==='object')checkChineseCopy(item,path+'.'+key);
 }
};
const manifest = JSON.parse(fs.readFileSync(new URL('../docs/editions/index.json',import.meta.url),'utf8'));
assert.ok(manifest.editions.length);
assert.equal(new Set(manifest.editions.map(e=>e.date)).size,manifest.editions.length);
for(const entry of manifest.editions) {
const data = JSON.parse(fs.readFileSync(new URL('../docs/'+entry.path,import.meta.url),'utf8'));
checkChineseCopy(data,entry.path);
assert.equal(data.date,entry.date);
assert.ok(validDate(data.date));
assert.equal(entry.path,'./editions/'+data.date+'.json');
bilingual(data.throughline);
if(data.perspective||data.coverage)assert.ok(!/\bAEIS\b|Advanced Energy Industries/i.test(JSON.stringify(data)),'Private editorial lens exposed in public edition');
if(data.verificationNote)bilingual(data.verificationNote);
if(data.generatedAt)assert.ok(!Number.isNaN(Date.parse(data.generatedAt)));
for(const item of [...data.context,...data.lower,...data.memo.items]){bilingual(item.title);bilingual(item.text);}
for(const item of data.deep){bilingual(item.question);bilingual(item.text);}
assert.equal(new Set(data.stories.map(s=>s.id)).size,data.stories.length);
for(const story of data.stories){
  if(data.perspective||data.coverage){
   const m=story.market;assert.ok(m&&validDate(m.eventDate),'Missing market date');
   for(const key of ['countries','industries','chain'])bilingual(m[key]);
   for(const key of ['investment','demand','fdi'])bilingual(m.changes[key]);
   if(data.coverage?.approach==='facts-first'){
    for(const key of ['relevance','timing','unknowns'])bilingual(m.facts[key]);
    assert.ok(!m.business&&!story.takeaway,'Editorial judgment in factual edition');
   }else for(const key of ['exposure','impact','horizon','action','checkpoint'])bilingual(m.business[key]);
   assert.ok(Array.isArray(story.metrics));
   for(const metric of story.metrics){
    bilingual(metric.name);if(data.coverage?.approach==='facts-first')assert.ok(!metric.impact);else bilingual(metric.impact);assert.ok(Number.isFinite(metric.current));
    assert.ok(metric.base===null||Number.isFinite(metric.base));assert.ok(metric.reportedRate===null||Number.isFinite(metric.reportedRate));
    for(const key of ['owner','unit','period','kind','comparison','baseStatus'])assert.ok(typeof metric[key]==='string'&&metric[key].trim());
    assert.equal(new URL(metric.sourceUrl).protocol,'https:');
    assert.ok(story.sources.some(s=>s.url===metric.sourceUrl),'Numeric source absent from story');
    if(metric.base!==null)assert.ok(metric.basePeriod);
   }
  }
  if(story.takeaway)bilingual(story.takeaway);
  if(story.location)bilingual(story.location);
  if(story.depth)assert.ok(['lead','standard'].includes(story.depth));
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
if(data.brief){
 assert.ok(data.brief.length>=3&&data.brief.length<=5);
 assert.equal(new Set(data.brief.map(item=>item.id)).size,data.brief.length);
 for(const item of data.brief){bilingual(item.text);assert.ok(data.stories.some(s=>s.id===item.id),'Missing brief story');}
}
}
for(const [weekStart,weekPath] of Object.entries(manifest.weeks||{})){
 assert.ok(validDate(weekStart));assert.equal(periodRange(weekStart,'week').start,weekStart);
 assert.equal(weekPath,'./weeks/'+weekStart+'.json');
 const digest=JSON.parse(fs.readFileSync(new URL('../docs/'+weekPath,import.meta.url),'utf8'));
 checkChineseCopy(digest,weekPath);
 assert.equal(digest.weekStart,weekStart);bilingual(digest.throughline);
 assert.ok(digest.highlights.length<=5);assert.equal(new Set(digest.highlights.map(h=>h.id)).size,digest.highlights.length);
 const usedReferences=new Set();
 for(const item of digest.highlights){
  bilingual(item.title);bilingual(item.summary);assert.ok(['tech','taiwan','global'].includes(item.category));assert.ok(item.references.length);
  for(const ref of item.references){
   const referenceKey=ref.date+':'+ref.storyId;assert.ok(!usedReferences.has(referenceKey),'Repeated weekly event '+referenceKey);usedReferences.add(referenceKey);
   assert.equal(periodRange(ref.date,'week').start,weekStart);const entry=manifest.editions.find(e=>e.date===ref.date);assert.ok(entry,'Missing referenced edition');
   const edition=JSON.parse(fs.readFileSync(new URL('../docs/'+entry.path,import.meta.url),'utf8'));assert.ok(edition.stories.some(s=>s.id===ref.storyId),'Missing referenced story');
  }
 }
}
for(const [period,entries] of Object.entries(manifest.exports||{})){
 assert.ok(['day','week'].includes(period));
 for(const [date,path] of Object.entries(entries)){
  assert.ok(validDate(date));assert.equal(path,'./exports/'+period+'-'+date+'.xlsx');
  if(period==='week')assert.ok(manifest.weeks[date]);else assert.ok(manifest.editions.some(e=>e.date===date));
  const bytes=fs.readFileSync(new URL('../docs/'+path,import.meta.url));assert.equal(bytes.subarray(0,2).toString(),'PK','Invalid XLSX');
  const version=manifest.exportVersions?.[period]?.[date];if(version)assert.equal(version,createHash('sha256').update(bytes).digest('hex').slice(0,12),'Stale Excel download version');
 }
}
const html = fs.readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const app = fs.readFileSync(new URL('../docs/app.js',import.meta.url),'utf8');
for(const match of app.matchAll(/el\('([^']+)'\)/g))assert.ok(html.includes('id="'+match[1]+'"'),'Missing element '+match[1]);
assert.ok(!app.includes('innerHTML'));
console.log('PASS: edition manifest, bilingual stories, source URLs, deep links and UI targets.');

