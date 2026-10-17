// Explicit structured data only. Never infer numeric bases from rounded prose.
export const marketHeaders=['刊期日期','事件日期','新聞 ID','國家','產業與趨勢','供應鏈環節','市場投資','市場需求','外商投資 FDI','標題','事件摘要','產業關聯','影響評估（自行填寫）','已公布時程','分析備註（自行填寫）','待確認事項','查證信心','日報連結','活動或專案地點'];
export const metricHeaders=['刊期日期','事件日期','新聞 ID','國家','產業與趨勢','指標','資料性質','本期期間','本期值','單位','基期期間','基期值 Base','比較口徑','YoY percentage','QoQ percentage','絕對變動','百分點變動','計算變動率','基期與計算說明','數字歸屬','影響評估（自行填寫）','來源連結'];
const zh=x=>x?.zh||'';
const absent='未提供結構化資料，請查日報原文';
const dateValue=value=>value?new Date(value+'T00:00:00Z'):null;
export function marketRow(edition,s){
 const m=s.market,a=m?.facts;
 return [dateValue(edition.date),dateValue(m?.eventDate),edition.date+':'+s.id,zh(m?.countries)||absent,zh(m?.industries)||absent,zh(m?.chain)||absent,zh(m?.changes?.investment)||absent,zh(m?.changes?.demand)||absent,zh(m?.changes?.fdi)||absent,zh(s.title),zh(s.summary),zh(a?.relevance)||zh(m?.chain)||absent,'',zh(a?.timing)||'詳見事件日期與原文','',zh(a?.unknowns)||'詳見日報來源限制',zh(s.confidence),s.sources.map(x=>x.url).join('\n'),zh(s.location)||'未提供活動場館；詳見原文'];
}
export function metricRow(edition,s,m){
 return [dateValue(edition.date),dateValue(s.market?.eventDate),edition.date+':'+s.id,zh(s.market?.countries)||absent,zh(s.market?.industries)||absent,zh(m.name),m.kind,m.period,m.current,m.unit,m.basePeriod||'',m.base??null,m.comparison,m.comparison==='YoY'?m.reportedRate??null:null,m.comparison==='QoQ'?m.reportedRate??null:null,null,null,null,m.baseStatus||'未揭露可比基期；不倒推',m.owner,'',m.sourceUrl];
}
export function collectMetrics(editions){
 return editions.flatMap(e=>e.stories.flatMap(s=>(s.metrics||[]).map(m=>metricRow(e,s,m))));
}
export function metricFormulas(row,m){
 // Blank and zero stay distinct. Rates cannot use a zero base.
 const comparable=Number.isFinite(m.current)&&Number.isFinite(m.base);
 return [comparable&&m.unit!=='%'?`=I${row}-L${row}`:null,comparable&&m.unit==='%'?`=(I${row}-L${row})*100`:null,comparable&&m.base!==0&&m.unit!=='%'?`=I${row}/L${row}-1`:null];
}
export function weeklyRows(digest,editions){
 const byKey=new Map(editions.flatMap(e=>e.stories.map(s=>[e.date+':'+s.id,{e,s}])));
 return digest.highlights.map(h=>{
  const selected=h.references.map(r=>byKey.get(r.date+':'+r.storyId));
  if(selected.some(x=>!x))throw new Error('Missing weekly reference');
  const structured=selected.filter(({s})=>s.market);
  const values=(structured.length?structured:selected).map(({e,s})=>marketRow(e,s));
  const merged=column=>[...new Set(values.map(v=>v[column]))].join('\n');
  return [dateValue(digest.weekStart),null,'週主題 '+h.id,merged(3),merged(4),merged(5),merged(6),merged(7),merged(8),zh(h.title),zh(h.summary),merged(11),'',merged(13),'',merged(15),'各則限制詳見日報',selected.flatMap(({s})=>s.sources.map(x=>x.url)).filter((x,i,a)=>a.indexOf(x)===i).join('\n'),merged(18)];
 });
}
