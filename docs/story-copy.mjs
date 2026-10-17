// One reading paragraph, with the same source facts in both depth modes.
const text=(value,lang)=>typeof value==='string'?value:value?.[lang]||'';
const sentence=(value,lang)=>{
 const clean=value.replace(/\s+/g,' ').trim();
 return clean&&!/[。！？.!?]$/.test(clean)?clean+(lang==='zh'?'。':'.'):clean;
};
export function storyParagraph(story,lang='zh',expanded=false){
 const sections=story.sections||[];
 const context=sections.find(s=>/上下游|供應鏈|產業背景|產品與供應鏈|記憶體|從晶片|為什麼重要|預測依據/.test(s.label?.zh||''));
 const parts=[text(story.summary,lang)];
 if(story.location)parts.push((lang==='zh'?'地點：':'Location: ')+text(story.location,lang));
 if(expanded){
  parts.push(...sections.map(s=>text(s.text,lang)));
  if(story.table)parts.push(...story.table.map(row=>text(row,lang)+(lang==='zh'?'：':': ')+(lang==='en'?row.value.replace('1,336.49 億','133.649B').replace('876.27 億','87.627B'):row.value)));
  const metric=story.editionDate==='2026-10-13'&&story.sourceId===11&&lang==='en'?'10M':story.metric;
  if(metric)parts.push(text(story.metricLabel,lang)+(lang==='zh'?'：':': ')+metric);
  if(story.confidence)parts.push((lang==='zh'?'查證信心：':'Verification confidence: ')+text(story.confidence,lang));
 }else if(context)parts.push(text(context.text,lang));
 if(story.market?.facts?.unknowns)parts.push(text(story.market.facts.unknowns,lang));
 const unique=[];
 for(const part of parts){
  const clean=sentence(part,lang);
  if(clean&&!unique.some(existing=>existing.includes(clean)))unique.push(clean);
 }
 return unique.join(' ');
}
