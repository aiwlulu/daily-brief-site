// Reading-order summary rows for the Excel 摘要 sheet: bold headline with
// date, followed by one paragraph combining news and industry context.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {storyParagraph} from '../docs/story-copy.mjs';
import {periodRange} from '../docs/dates.mjs';

const short=date=>date.slice(5).replace('-','/');
const tight=text=>text.replace(/([。！？：；])\s+/g,'$1');
const sentence=text=>{const clean=(text||'').replace(/\s+/g,' ').trim();return clean&&!/[。！？.!?]$/.test(clean)?clean+'。':clean;};

// Same reading order as the website: leads, brief order, then the rest.
function rankStories(edition){
 const brief=(edition.brief||[]).map(b=>b.id);
 const rank=s=>s.depth==='lead'?0:brief.includes(s.id)?1:s.pick?2:3;
 const pos=s=>brief.includes(s.id)?brief.indexOf(s.id):99;
 return edition.stories.map((s,i)=>({s,i})).sort((a,b)=>rank(a.s)-rank(b.s)||pos(a.s)-pos(b.s)||a.i-b.i).map(x=>x.s);
}

export function daySummary(edition){
 return {
  title:edition.date+' 日報',
  note:'「重點」每則一列：粗體標題與日期，下方一句說明。「摘要明細」以完整段落整合產業與供應鏈脈絡、地點及資料限制；數值見「數值明細」。',
  entries:rankStories(edition).map(s=>({
   heading:s.title.zh,
   time:short(edition.date),
   detail:tight(sentence(s.summary.zh)),
   paragraph:tight(storyParagraph({...s,editionDate:edition.date,sourceId:s.id},'zh',true))
  }))
 };
}

export function weekSummary(digest,editions){
 const byKey=new Map(editions.flatMap(e=>e.stories.map(s=>[e.date+':'+s.id,s])));
 const range=periodRange(digest.weekStart,'week');
 return {
  title:range.start+' 至 '+range.end+' 週報',
  note:'本週精選主題依重要性排列。「重點」每個主題一列；「摘要明細」補充各則新聞的產業關聯。',
  entries:digest.highlights.map(h=>{
   const stories=h.references.map(r=>byKey.get(r.date+':'+r.storyId)).filter(Boolean);
   const context=[...new Set(stories.map(s=>sentence(s.market?.facts?.relevance?.zh)).filter(Boolean))];
   const dates=[...new Set(h.references.map(r=>r.date))].sort().map(short);
   return {heading:h.title.zh,time:dates.join('、'),detail:sentence(h.summary.zh),paragraph:sentence(h.summary.zh)+(context.length?'產業關聯：'+context.join(''):'')};
  })
 };
}

// CLI: node scripts/summary-data.mjs ROOT YYYY-MM-DD PERIOD
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const [root,date,period]=process.argv.slice(2);
 const read=async file=>JSON.parse(await fs.readFile(path.join(root,'docs',file),'utf8'));
 const manifest=await read('editions/index.json');
 if(period==='day'){
  const entry=manifest.editions.find(e=>e.date===date);
  process.stdout.write(JSON.stringify(daySummary(await read(entry.path))));
 }else{
  const editions=await Promise.all(manifest.editions.filter(e=>periodRange(e.date,'week').start===date).map(e=>read(e.path)));
  process.stdout.write(JSON.stringify(weekSummary(await read(manifest.weeks[date]),editions)));
 }
}
