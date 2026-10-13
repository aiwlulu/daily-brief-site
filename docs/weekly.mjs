import {periodRange} from './dates.mjs';
export function fallbackWeekly(editions,date){
 const range=periodRange(date,'week');
 const candidates=editions.filter(e=>e.date>=range.start&&e.date<=range.end).flatMap(e=>e.stories.map(s=>({...s,date:e.date})));
 candidates.sort((a,b)=>Number(Boolean(b.pick))-Number(Boolean(a.pick))||b.date.localeCompare(a.date)||a.id-b.id);
 const unique=new Map();
 for(const s of candidates){const key=s.topic||s.title.en.toLowerCase().replace(/[^a-z0-9]/g,'');if(!unique.has(key))unique.set(key,s);}
 const all=[...unique.values()],chosen=all.slice(0,7);
 for(const category of ['tech','taiwan','global']){
  if(chosen.some(s=>s.category===category))continue;
  const story=all.find(s=>s.category===category);if(!story)continue;
  if(chosen.length<7)chosen.push(story);else{const index=chosen.findLastIndex(s=>chosen.filter(x=>x.category===s.category).length>1);if(index>=0)chosen[index]=story;}
 }
 return {weekStart:range.start,throughline:null,highlights:chosen.map((s,i)=>({id:i+1,category:s.category,title:s.title,summary:s.summary,references:[{date:s.date,storyId:s.id}]}))};
}
