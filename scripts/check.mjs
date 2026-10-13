import fs from 'node:fs';
import assert from 'node:assert/strict';
const manifest = JSON.parse(fs.readFileSync(new URL('../docs/editions/index.json',import.meta.url),'utf8'));
assert.ok(manifest.editions.length);
assert.equal(new Set(manifest.editions.map(e=>e.date)).size,manifest.editions.length);
for(const entry of manifest.editions) {
const data = JSON.parse(fs.readFileSync(new URL('../docs/'+entry.path,import.meta.url),'utf8'));
assert.equal(data.date,entry.date);
assert.equal(new Set(data.stories.map(s=>s.id)).size,data.stories.length);
for(const story of data.stories){
  assert.ok(['tech','taiwan','global'].includes(story.category));
  for(const key of ['title','summary','metricLabel','confidence'])for(const lang of ['zh','en'])assert.ok(story[key][lang]);
  assert.ok(story.sections.length);
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
