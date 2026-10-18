// Charts built from structured story metrics. Values come only from the
// edition's metrics; nothing is derived beyond unit conversion and published
// base comparisons.
const n=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const tidy=v=>Number(v.toPrecision(12));
const num=(v,lang,max=2)=>new Intl.NumberFormat(lang==='zh'?'zh-TW':'en',{maximumFractionDigits:max}).format(tidy(v));
const pct=(v,lang,signed=false)=>(signed&&v>0?'+':'')+num(v*100,lang,1)+'%';

// Display value and unit for one metric in the reader's language.
export function formatMetric(m,lang){
 const v=m.current,zh=lang==='zh';
 switch(m.unit){
  case 'NTD billion':return zh?(v>=1000?'新台幣 '+num(v/1000,lang,3)+' 兆元':'新台幣 '+num(v*10,lang,1)+' 億元'):'NT$'+num(v,lang)+'B';
  case 'USD billion':return zh?num(v*10,lang,1)+' 億美元':'US$'+num(v,lang)+'B';
  case 'MYR million':return zh?num(v/100,lang,2)+' 億令吉':'RM'+num(v,lang)+'M';
  case '%':return pct(v,lang);
  case '個職缺':return zh?num(v,lang)+' 個職缺':num(v,lang)+' openings';
  case '家':return zh?num(v,lang)+' 家':num(v,lang)+' companies';
  case '人':return zh?num(v,lang)+' 人':num(v,lang)+' people';
  case 'wafers/month':return num(v,lang)+(zh?' 片／月':' wafers/month');
  case 'tonnes/year':return num(v,lang)+(zh?' 噸／年':' tonnes/year');
  case 'designs':return num(v,lang)+(zh?' 款晶片':' chip designs');
  case 'acres':return num(v,lang)+(zh?' 英畝':' acres');
  default:return num(v,lang)+' '+m.unit;
 }
}
// Short data-status chip, so plans, specs and forecasts never read as actuals.
const kinds=[[/實績/,'實績','Actual'],[/規格/,'規格','Spec'],[/目標/,'目標','Target'],[/預測/,'預測','Forecast'],[/規劃|計畫/,'規劃','Plan'],[/估計|估算/,'估計','Estimate'],[/統計/,'統計','Statistic'],[/引述|轉述/,'引述','Reported'],[/陳述/,'陳述','Statement'],[/超過/,'下限','Floor']];
export function kindLabel(m,lang){const k=kinds.find(([re])=>re.test(m.kind||''));return k?k[lang==='zh'?1:2]:(m.kind||'');}
const rateLabel=(m,lang)=>m.reportedRate!=null&&/YoY|QoQ/.test(m.comparison)?m.comparison+' '+pct(m.reportedRate,lang,true):'';
const name=(m,lang)=>m.name[lang]||m.name.zh;
const text=(v,lang)=>typeof v==='string'?v:v?.[lang]||v?.zh||'';

function barRow({label,value,display,detail,max,min=0,muted=false}){
 const row=n('div',undefined,'viz-row'+(muted?' is-muted':''));
 row.tabIndex=0;row.dataset.tooltip=detail;row.setAttribute('aria-label',label+': '+display+(detail?'. '+detail:''));
 const track=n('div',undefined,'viz-track');
 const span=max-min||1, zero=(0-min)/span*100, size=Math.abs(value)/span*100;
 const bar=n('span',undefined,'viz-bar'+(value<0?' is-negative':''));
 bar.style.left=(value<0?zero-size:zero)+'%';bar.style.width=Math.max(size,.6)+'%';
 track.append(bar);
 row.append(n('span',label,'viz-label'),track,n('strong',display,'viz-value'));
 return row;
}

// Percentage definitions differ (for example GDP, CPI and productivity).
// Keep them as individual tiles. Absolute values also need a shared owner,
// period and status before they can form a comparison.
export function groupMetrics(metrics){
 const groups=new Map();
 metrics.forEach((m,index)=>{
  const key=m.unit==='%'?'percent:'+index:JSON.stringify([m.unit,text(m.owner,'zh'),text(m.period,'zh'),m.kind]);
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(m);
 });
 return [...groups.values()];
}

// Per-story figures: comparable absolute metrics become bars, the rest tiles.
export function storyFigures(story,lang){
 const metrics=story.metrics||[];
 if(!metrics.length)return null;
 const zh=lang==='zh',wrap=n('div',undefined,'story-figures');
 wrap.setAttribute('aria-label',zh?'本則數據':'Figures in this story');
 const tiles=n('div',undefined,'figure-tiles');
 for(const group of groupMetrics(metrics)){
  if(group.length>1&&group.every(m=>m.current>=0)){
   const chart=n('div',undefined,'viz-mini');
   const max=Math.max(...group.map(m=>m.current));
   chart.append(n('p',(zh?'同單位比較 · ':'Same-unit comparison · ')+text(group[0].period,lang),'viz-caption'));
   for(const m of group)chart.append(barRow({label:name(m,lang)+' · '+kindLabel(m,lang),value:m.current,display:formatMetric(m,lang),detail:[text(m.owner,lang),rateLabel(m,lang)].filter(Boolean).join(' · '),max}));
   wrap.append(chart);
  }else for(const m of group){
   const tile=n('div',undefined,'figure-tile');
   tile.append(n('span',name(m,lang),'figure-label'),n('strong',formatMetric(m,lang),'figure-value'));
   const meta=n('span',undefined,'figure-meta');
   meta.append(n('span',kindLabel(m,lang),'figure-kind'));
   const rate=rateLabel(m,lang);if(rate)meta.append(n('span',rate,'figure-rate'));
   if(m.base!=null)meta.append(n('span',(zh?'前值 ':'Prior ')+formatMetric({...m,current:m.base},lang),'figure-rate'));
   meta.append(n('span',text(m.period,lang),'figure-period'));
   tile.append(meta);tiles.append(tile);
  }
 }
 if(tiles.children.length)wrap.append(tiles);
 return wrap;
}

// Supply-chain stages, upstream to downstream, matched from structured fields.
const stages=[
 ['materials','材料與設備','Materials & tools',/材料|設備|零組件|製程設備/],
 ['wafer','晶圓製造','Wafer fab',/晶圓|代工|晶片設計|設計至/],
 ['memory','記憶體','Memory',/HBM|DRAM|NAND|記憶體|SSD/],
 ['packaging','封裝測試','Packaging & test',/封裝|封測|測試|載板|基板/],
 ['systems','伺服器與整機','Servers & systems',/ODM|伺服器|整機|\bPC\b|電腦/],
 ['power','電源與散熱','Power & cooling',/電源|供電|液冷|散熱|電力|電價/],
 ['datacenter','資料中心','Data centers',/資料中心|機房|算力/],
 ['factory','終端工廠','End-use factories',/工廠|在地工廠|自動化|終端/],
 ['policy','投資與政策','Investment & policy',/投資|FDI|外資|園區|預測|人才|招募|資金/]
];
export const stagesFor=s=>stages.filter(([,,,re])=>re.test([s.market?.chain?.zh,s.market?.industries?.zh].join(' '))).map(([key])=>key);
function stageItem([key,labelZh,labelEn],hits,lang,number){
 const li=n('li',undefined,'chain-stage'+(hits.length?' has-stories':''));li.dataset.stage=key;
 const head=n('div',undefined,'chain-head');head.append(n('span',lang==='zh'?labelZh:labelEn,'chain-name'),n('span',String(hits.length),'chain-count'));
 const chips=n('div',undefined,'chain-chips');
 for(const s of hits){const a=n('a',number(s),'chain-chip');a.href='#story-'+s.id;a.dataset.tooltip=s.title[lang];a.setAttribute('aria-label',number(s)+' '+s.title[lang]);chips.append(a);}
 li.append(head,chips);return li;
}
// Flow diagram: physical chain left to right, investment and policy as a band.
export function chainMap(stories,lang,number){
 const marked=stories.filter(s=>s.market);
 if(!marked.length)return null;
 const zh=lang==='zh',wrap=n('div',undefined,'chain-diagram');
 const flow=n('ol',undefined,'chain-map');
 flow.setAttribute('aria-label',zh?'供應鏈由上游到下游':'Supply chain from upstream to downstream');
 for(const stage of stages.slice(0,-1))flow.append(stageItem(stage,marked.filter(s=>stagesFor(s).includes(stage[0])),lang,number));
 const ends=n('div',undefined,'chain-ends');ends.setAttribute('aria-hidden','true');
 ends.append(n('span',zh?'上游':'Upstream'),n('span',zh?'下游':'Downstream'));
 const band=n('ul',undefined,'chain-band');
 const policy=stages.at(-1);band.append(stageItem(policy,marked.filter(s=>stagesFor(s).includes(policy[0])),lang,number));
 wrap.append(ends,flow,band);
 return wrap;
}
// Compact per-story strip: the eight physical stages, matched ones filled.
export function chainStrip(story,lang){
 if(!story.market?.chain)return null;
 const hit=stagesFor(story),zh=lang==='zh';
 const wrap=n('div',undefined,'chain-strip');
 const names=stages.filter(([key])=>hit.includes(key)).map(([,a,b])=>zh?a:b);
 wrap.setAttribute('role','img');
 wrap.setAttribute('aria-label',(zh?'供應鏈位置：':'Supply-chain position: ')+(names.join(zh?'、':', ')||story.market.chain[lang]));
 const track=n('span',undefined,'chain-strip-track');
 for(const [key,a,b] of stages.slice(0,-1)){const seg=n('span',undefined,'chain-seg'+(hit.includes(key)?' is-on':''));seg.dataset.tooltip=zh?a:b;track.append(seg);}
 wrap.append(n('span',zh?'上游':'Up','chain-strip-end'),track,n('span',zh?'下游':'Down','chain-strip-end'),n('span',story.market.chain[lang]+(hit.includes('policy')?(zh?' · 投資與政策':' · Investment & policy'):''),'chain-strip-label'));
 return wrap;
}

// Edition-wide figures as one table. Growth rates from different owners and
// periods are not charted together; each story shows its own comparisons.
export function numbersOverview(stories,lang,number){
 const zh=lang==='zh',rows=stories.flatMap(s=>(s.metrics||[]).map(m=>({s,m})));
 const blocks=[];
 if(!rows.length)return blocks;
 // Table view keeps every value reachable without the charts.
 const details=n('details',undefined,'viz-table');
 details.append(n('summary',zh?'檢視全部數據表':'View all figures as a table'));
 const table=n('table'),head=n('tr');
 for(const h of zh?['新聞','指標','數值','性質','期間','來源方']:['Story','Metric','Value','Status','Period','Owner'])head.append(n('th',h));
 const thead=n('thead');thead.append(head);const body=n('tbody');
 for(const {s,m} of rows){
  const tr=n('tr');const link=n('a',number(s));link.href='#story-'+s.id;const td=n('td');td.append(link);
  tr.append(td,n('td',name(m,lang)),n('td',formatMetric(m,lang)),n('td',kindLabel(m,lang)),n('td',text(m.period,lang)),n('td',text(m.owner,lang)));body.append(tr);
 }
 table.append(thead,body);details.append(table);blocks.push(details);
 return blocks;
}
