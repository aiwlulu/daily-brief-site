import {periodRange} from './dates.mjs';
export function fallbackWeekly(editions,date){
 const range=periodRange(date,'week');
 const candidates=editions.filter(e=>e.date>=range.start&&e.date<=range.end).flatMap(e=>e.stories.map(s=>({...s,date:e.date})));
 candidates.sort((a,b)=>Number(Boolean(b.pick))-Number(Boolean(a.pick))||b.date.localeCompare(a.date)||a.id-b.id);
 const unique=new Map();
 for(const s of candidates){
  const key=s.topic||s.title.en.toLowerCase().replace(/[^a-z0-9]/g,'');
  const ref={date:s.date,storyId:s.id};
  if(!unique.has(key))unique.set(key,{...s,references:[]});
  const refs=unique.get(key).references;
  if(!refs.some(r=>r.date===ref.date&&r.storyId===ref.storyId))refs.push(ref);
 }
 const chosen=[...unique.values()].slice(0,5);
 return {weekStart:range.start,throughline:null,highlights:chosen.map((s,i)=>({id:i+1,category:s.category,title:s.title,summary:s.summary,references:s.references}))};
}

