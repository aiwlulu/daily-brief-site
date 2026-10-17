// One reading paragraph, with the same source facts in both depth modes.
const text=(value,lang)=>typeof value==='string'?value:value?.[lang]||'';
const sentence=(value,lang)=>{
 const clean=value.replace(/\s+/g,' ').trim();
 return clean&&!/[。！？.!?]$/.test(clean)?clean+(lang==='zh'?'。':'.'):clean;
};
// Location, confidence and the headline figure are shown beside the story on
// the website; pass {location:true} where the paragraph stands alone (Excel).
const unknownLabel=/尚未確認|來源限制|Unconfirmed|limitation|Still unknown/i;
export function storyParagraph(story,lang='zh',expanded=false,{location=false}={}){
 const sections=story.sections||[];
 const context=sections.find(s=>/上下游|供應鏈|產業背景|產品與供應鏈|記憶體|從晶片|為什麼重要|預測依據/.test(s.label?.zh||''));
 const parts=[text(story.summary,lang)];
 if(expanded){
  parts.push(...sections.map(s=>text(s.text,lang)));
  if(story.table)parts.push(...story.table.map(row=>text(row,lang)+(lang==='zh'?'：':': ')+(lang==='en'?row.value.replace('1,336.49 億','133.649B').replace('876.27 億','87.627B'):row.value)));
 }else if(context)parts.push(text(context.text,lang));
 // Unknowns close the paragraph once; skip them when a section already says so.
 const listed=expanded&&sections.some(s=>unknownLabel.test(text(s.label,'zh')+' '+text(s.label,'en')));
 if(story.market?.facts?.unknowns&&!listed)parts.push(text(story.market.facts.unknowns,lang));
 if(location&&story.location)parts.push((lang==='zh'?'地點：':'Location: ')+text(story.location,lang));
 const unique=[];
 for(const part of parts){
  const clean=sentence(part,lang);
  if(clean&&!unique.some(existing=>existing.includes(clean)))unique.push(clean);
 }
 // Chinese sentences join without spaces.
 return unique.join(lang==='zh'?'':' ');
}
