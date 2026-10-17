/* Content is rendered with textContent. News strings never become HTML. */
import {fallbackWeekly} from './weekly.mjs';
import {icon} from './icons.mjs';
import {mountCalendar} from './calendar.mjs';
import {taipeiToday, validDate, shiftDate, periodRange, selectEditions} from './dates.mjs';
const el = id => document.getElementById(id);
let data, weekly, weekPaths={}, exportPaths={}, exportVersions={}, catalog = [], selectedEditions = [], lang = 'zh', filter = 'all', query = '';
let readingMode='summary';
const params = new URLSearchParams(location.search);
let period = params.get('view') === 'week' ? 'week' : 'day';
let selectedDate = validDate(params.get('date') || '') ? params.get('date') : taipeiToday();
function setPageState(state) {
  document.body.dataset.state=state;
  document.querySelector('main').setAttribute('aria-busy',String(state==='loading'));
  el('edition-content').inert=state!=='ready';
  el('loading-status').textContent=state==='loading'?(lang==='zh'?'正在載入新聞':'Loading news'):'';
}
const editionCache=new Map(), weeklyCache=new Map();
let requestVersion=0;
async function choosePeriod() {
  const version=++requestVersion;
  const requested=selectEditions(catalog,selectedDate,period);
  const requestedWeek=periodRange(selectedDate,'week').start;
  if(!data||requested.some(entry=>!editionCache.has(entry.date))||(period==='week'&&weekPaths[requestedWeek]&&!weeklyCache.has(requestedWeek)))setPageState('loading');
  el('error').hidden=true;
  try {
    const loaded=await Promise.all(requested.map(async entry=>{if(!editionCache.has(entry.date))editionCache.set(entry.date,await readJson(entry.path));return editionCache.get(entry.date);}));
    const weekStart=periodRange(selectedDate,'week').start;
    if(period==='week'&&weekPaths[weekStart]&&!weeklyCache.has(weekStart))weeklyCache.set(weekStart,await readJson(weekPaths[weekStart]));
    const digest=period==='week' ? (weeklyCache.get(weekStart)||fallbackWeekly(loaded,selectedDate)) : null;
    if(version!==requestVersion)return;
    selectedEditions=loaded;weekly=digest;
  const newest = selectedEditions[0];
  const blank = {date:selectedDate, throughline:{zh:'這段期間尚未收錄新聞。',en:'No editions have been published for this period.'},stories:[],deep:[],context:[],memo:{title:{zh:'',en:''},items:[]},lower:[]};
  data = {...(newest || blank), stories:selectedEditions.flatMap(e => e.stories.map(s => ({...s, sourceId:s.id, editionDate:e.date, id:e.date+'-'+s.id})))};
  data.deep = selectedEditions.flatMap(e => e.deep.map(d => ({...d,id:e.date+'-'+d.id}))).slice(0,3);
  const url = new URL(location.href);
  url.searchParams.set('view',period); url.searchParams.set('date',selectedDate);
  history.replaceState(null,'',url);
  render();
  setPageState('ready');
  } catch(error){if(version===requestVersion){setPageState('error');el('error').hidden=false;el('coverage').textContent=lang==='zh'?'刊期暫時無法載入，請重試。':'Edition could not be loaded. Please retry.';}}
  finally{if(version===requestVersion)document.querySelector('main').setAttribute('aria-busy','false');}
}
function renderPeriod() {
  document.body.dataset.view=period;
  const zh = lang === 'zh', range = periodRange(selectedDate,period);
  const label = period === 'day' ? selectedDate : range.start+' / '+range.end;
  const exportKey=period==='week'?range.start:selectedDate;
  const exportPath=exportPaths[period]?.[exportKey];
  const exportVersion=exportVersions[period]?.[exportKey];
  const excel=el('export-excel');excel.hidden=!exportPath;
  if(exportPath){excel.href=exportPath+(exportVersion?'?v='+exportVersion:'');excel.download=exportPath.split('/').pop();}
  else excel.removeAttribute('href');
  excel.replaceChildren(icon('download'),node('span','Excel'));
  excel.setAttribute('aria-label',zh?'下載本'+(period==='week'?'週':'日')+'完整 Excel，含市場動向、數值及來源':'Download the complete '+(period==='week'?'weekly':'daily')+' Excel, including market changes, metrics and sources');
  excel.dataset.tooltip=zh?'完整刊期 Excel，不受搜尋篩選影響':'Complete edition, independent of search filters';
  el('view-day').replaceChildren(icon('today'),node('span',zh?'日':'D'));
  el('view-day').setAttribute('aria-label',zh?'當日':'Daily view');
  el('view-day').dataset.tooltip=zh?'當日':'Daily view';
  el('view-week').replaceChildren(icon('week'),node('span',zh?'週':'W'));
  el('view-week').setAttribute('aria-label',zh?'當週':'Weekly view');
  el('view-week').dataset.tooltip=zh?'當週':'Weekly view';
  el('view-day').setAttribute('aria-pressed',String(period === 'day'));
  el('view-week').setAttribute('aria-pressed',String(period === 'week'));
  el('date-label').textContent = zh ? '日期' : 'Date';
  el('date').value = selectedDate;
  el('date-display').textContent = selectedDate.slice(5).replace('-','/');
  el('calendar-open').setAttribute('aria-label',(zh?'選擇日期：':'Choose date: ')+selectedDate);
  el('publication-status').textContent = data.archiveType==='backfill' ? (zh?'回溯補編':'RETROSPECTIVE EDITION') : data.generatedAt ? (zh?'更新於 ':'UPDATED ')+new Intl.DateTimeFormat(zh?'zh-TW':'en',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Taipei'}).format(new Date(data.generatedAt)) : '';
  el('today').replaceChildren(icon('today'));
  el('today').setAttribute('aria-label',zh?'回到今天':'Back to today');
  el('today').dataset.tooltip=zh?'回到今天':'Back to today';
  el('latest').textContent = zh ? '閱讀最新一期' : 'Latest edition';
  el('latest').hidden = selectedEditions.length > 0;
  el('previous').setAttribute('aria-label',zh ? (period === 'day'?'上一日':'上一週') : (period === 'day'?'Previous day':'Previous week'));
  el('next').setAttribute('aria-label',zh ? (period === 'day'?'下一日':'下一週') : (period === 'day'?'Next day':'Next week'));
  el('previous').dataset.tooltip=el('previous').getAttribute('aria-label');
  el('next').dataset.tooltip=el('next').getAttribute('aria-label');
  el('edition').textContent = period==='day' ? selectedDate.replaceAll('-','/')+' · '+new Intl.DateTimeFormat(zh?'zh-TW':'en',{weekday:'long',timeZone:'UTC'}).format(new Date(selectedDate+'T12:00:00Z')) : 'WEEKLY VIEW / '+label;
  el('edition-date').textContent = label;
  el('news-title').textContent = zh ? (period === 'day'?'當日新聞':'關鍵精華') : (period === 'day'?'Daily stories':'Key highlights');
  el('story-total').textContent = period==='week'?(zh?weekly.highlights.length+' 個重點':weekly.highlights.length+' highlights'):words[lang].count(data.stories.length);
  el('coverage').textContent = period==='week'
    ? (zh?label+' · 台灣時間 · 已收錄 '+selectedEditions.length+'/7 天 · '+weekly.highlights.length+' 個重點':label+' · Asia/Taipei · '+selectedEditions.length+'/7 days available · '+weekly.highlights.length+' highlights')
    : (zh?'台灣時間 · '+data.stories.length+' 則新聞':'Asia/Taipei · '+data.stories.length+' stories');
  if(!selectedEditions.length)el('coverage').textContent += zh?' · 尚無刊期，可閱讀最新一期。':' · No edition yet; open the latest edition.';
  el('theme-label').textContent = zh ? (period === 'week'?'最新刊期主線 · '+data.date:'今日主線') : (period === 'week'?'LATEST EDITION / '+data.date:'TODAY’S THROUGHLINE');
  if(period === 'week' && selectedEditions.length) {
    el('context-title').textContent = (zh?'最新刊期產業脈絡 · ':'Latest context · ')+data.date;
    el('memo-title').textContent = (zh?'最新刊期分析備忘錄 · ':'Latest analysis memo · ')+data.date;
    el('lower-title').textContent = (zh?'最新刊期低權重標題 · ':'Latest lower-priority headlines · ')+data.date;
  }
  document.querySelector('.sources').hidden=period==='week'||!selectedEditions.length;
  document.querySelector('.lead').hidden=period==='week'||!selectedEditions.length;
  document.querySelector('.quick-brief').hidden=period==='week'||!data.stories.length;
  document.querySelector('.deep').hidden=period==='week'||!data.deep.length;
  document.querySelector('.context').hidden=period==='week'||!data.context.length;
  document.querySelector('.memo').hidden=period==='week'||!data.memo.items.length;
  document.querySelector('.lower').hidden=period==='week'||!data.lower.length;
  el('reading-controls').hidden=period==='week'||!data.stories.length;
  el('reading-label').textContent=zh?'閱讀方式':'Reading depth';
  el('reading-summary').textContent=zh?'重點摘要':'Essentials';
  el('reading-deep').textContent=zh?'深度閱讀':'Full analysis';
  el('reading-summary').setAttribute('aria-pressed',String(readingMode==='summary'));
  el('reading-deep').setAttribute('aria-pressed',String(readingMode==='deep'));
  el('reading-note').textContent=zh?'每篇也可單獨展開或收合':'Each story can also be opened or closed individually';
}

const openStories = new Set(), closedStories = new Set();
const words = {
  zh: {all:'全部',tech:'科技與商業',taiwan:'台灣與政策',global:'全球與能源',pick:'深讀推薦',detail:'分析',confidence:'判斷信心',sources:'新聞來源',count:n => n+' 則新聞',empty:'找不到符合條件的新聞。'},
  en: {all:'All',tech:'Tech & business',taiwan:'Taiwan & policy',global:'Global & energy',pick:'READ DEEPER',detail:'Analysis',confidence:'Confidence',sources:'Sources',count:n => n===1?'1 story':n+' stories',empty:'No stories match your search.'}
};
const t = value => value[lang];
function node(tag, text, className) {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (className) n.className = className;
  return n;
}
function link(source) {
  const a = node('a', source.name);
  a.append(icon('external'));
  a.href = source.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}
function renderStories() {
  if(period==='week'){renderWeekly();return;}
  const list = el('news-list');
  list.replaceChildren();
  const matches = data.stories.filter(s =>
    (filter === 'all' || s.category === filter) &&
    JSON.stringify({title:s.title,summary:s.summary,sections:s.sections,metric:s.metric,metricLabel:s.metricLabel,sources:s.sources.map(source=>source.name)}).toLocaleLowerCase().includes(query.toLocaleLowerCase())
  );
  el('count').textContent = words[lang].count(matches.length);
  el('empty').textContent = words[lang].empty;
  el('empty').hidden = matches.length > 0;
  el('clear-search').hidden=!query;
  el('clear-search').setAttribute('aria-label',lang==='zh'?'清除搜尋':'Clear search');
  for (const s of matches) {
    const article = node('article', undefined, 'story');
    article.id = 'story-'+s.id;
    article.append(node('div', String(data.stories.indexOf(s)+1).padStart(2,'0'), 'story-number'));
    const content = node('div');
    const meta = node('div', undefined, 'story-meta');
    const published=node('time',s.editionDate.slice(5).replace('-','/'));published.dateTime=s.editionDate;published.setAttribute('aria-label',s.editionDate);meta.append(node('span', words[lang][s.category]),published);
    if (s.pick) meta.append(node('span', words[lang].pick, 'pick'));
    content.append(meta, node('h3', t(s.title)), node('p', t(s.summary), 'summary-text'));
    if(s.location)content.append(node('p',(lang==='zh'?'地點：':'Location: ')+t(s.location),'story-location'));
    const sources = node('div',undefined,'source-links story-sources');
    sources.setAttribute('aria-label',(lang==='zh'?'相關連結：':'Related sources: ')+t(s.title));
    sources.append(node('span',lang==='zh'?'相關連結':'Sources','source-label'));
    s.sources.forEach(source=>{
      const a=link(source);
      const labels=lang==='zh'?{'First-hand':'一手','Second-hand':'報導','Source-limited':'來源有限'}:{'First-hand':'Primary','Second-hand':'Reporting','Source-limited':'Limited'};
      a.append(node('small',labels[source.type]||source.type,'source-kind'));
      sources.append(a);
    });
    content.append(sources);
    if(s.takeaway){
      const note=node('aside',undefined,'editor-note');
      note.append(node('span',lang==='zh'?'編輯解讀':'EDITOR’S LENS','eyebrow'),node('p',t(s.takeaway)));
      content.append(note);
    }
    const details = node('details');
    details.open = openStories.has(s.id)||(readingMode==='deep'&&!closedStories.has(s.id));
    const rememberDisclosure=()=>{if(details.isConnected){if(details.open){openStories.add(s.id);closedStories.delete(s.id);}else{openStories.delete(s.id);closedStories.add(s.id);}}};
    details.addEventListener('toggle',rememberDisclosure);
    const toggle=node('summary',lang==='zh'?'背景、商業邏輯與待查':'Context, economics & what to watch');toggle.append(icon('plus'));details.append(toggle);
    // Save a user override synchronously before search or language can rebuild
    // the list. Native toggle events may arrive after the old node is removed.
    toggle.addEventListener('click',event=>{event.preventDefault();details.open=!details.open;rememberDisclosure();});
    const body = node('div', undefined, 'story-body');
    const metric=node('div',undefined,'metric');
    const metricText=s.editionDate==='2026-10-13'&&s.sourceId===11&&lang==='en'?'10M':s.metric;
    metric.append(node('strong',metricText),node('small',t(s.metricLabel)));body.append(metric);
    if(s.table){
      const table = node('table');
      const caption = node('caption',lang === 'zh' ? '財務數據' : 'Financial data');
      table.append(caption);
      const tbody = node('tbody');
      s.table.forEach(row => {
        const tr = node('tr');
        const th = node('th', row[lang]);
        th.scope = 'row';
        const value = lang === 'en' ? row.value.replace('1,336.49 億','133.649B').replace('876.27 億','87.627B') : row.value;
        tr.append(th, node('td', value)); tbody.append(tr);
      });
      table.append(tbody); body.append(table);
    }
    s.sections.forEach(section => {
      const n = node('section',undefined,'detail-section');
      n.append(node('h4',t(section.label)),node('p',t(section.text)));
      body.append(n);
    });
    body.append(node('p',words[lang].confidence+'：'+t(s.confidence),'confidence'));
    details.append(body); content.append(details);
    article.append(content); list.append(article);
  }
  [...el('filters').children].forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter === filter)));
}
function renderWeekly() {
  const list=el('news-list');list.replaceChildren();
  el('count').textContent=lang==='zh'?'約 3 分鐘閱讀':'About 3 min read';
  el('empty').hidden=weekly.highlights.length>0;
  el('empty').textContent=lang==='zh'?'這週尚無已發布新聞。':'No published stories this week.';
  for(const item of weekly.highlights){
    const article=node('article',undefined,'week-highlight');
    const number=node('span',String(item.id).padStart(2,'0'),'week-number');
    const content=node('div');
    content.append(node('span',words[lang][item.category],'week-category'),node('h3',t(item.title)),node('p',t(item.summary)));
    const links=node('div',undefined,'week-references');
    const dates=[...new Set(item.references.map(r=>r.date))];
    for(const date of dates){const a=node('a',date.slice(5).replace('-','/')+(lang==='zh'?' 日報':' edition'));a.href='./?view=day&date='+date;a.append(icon('right'));links.append(a);}
    content.append(links);article.append(number,content);list.append(article);
  }
}
function textSection(target, items) {
  target.replaceChildren();
  items.forEach(item=>{
    const n = node('div');
    n.append(node('h3',t(item.title)),node('p',t(item.text)));
    target.append(n);
  });
}
function renderBrief(){
  const list=el('brief-list');list.replaceChildren();
  const edition=selectedEditions[0];
  const chosen=edition?.brief?.length?edition.brief: (edition?.stories||[]).filter(s=>s.pick).slice(0,5).map(s=>({id:s.id,text:s.title}));
  for(const item of chosen){
    const story=data.stories.find(s=>s.sourceId===item.id&&s.editionDate===edition.date);
    if(!story)continue;
    const li=node('li'),a=node('a');a.href='#story-'+story.id;
    a.append(node('span',t(item.text)),icon('down'));
    a.onclick=()=>{filter='all';query='';el('search').value='';renderStories();};
    li.append(a);list.append(li);
  }
}
function render() {
  document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  const copy = lang === 'zh' ? {
    'brand-sub':'商業與科技日報',print:'列印',intro:'從 AI 晶片到能源供應，讀事件，也讀成本、競爭與接下來的變化。',
    start:'閱讀本期','story-total':'11 則重點新聞','deep-title':'延伸深讀','deep-sub':'三個值得多停留的問題','news-title':'今日新聞','brief-title':'30 秒 Brief','brief-sub':'先掌握今天的變化',
    'search-label':'搜尋','context-title':'產業脈絡','memo-title':'一頁分析備忘錄','lower-title':'降低權重的標題','sources-title':'來源與查證','back-top':'回到頁首',
    'source-note':'本期內容整理自提供的 2026 年 10 月 13 日日報，部分來源網址經重新檢索。原始財報、SPUR 技術標準及部分低權重新聞連結尚未找回，文中已註明。信心程度沿用原日報，並不表示本頁已完成全面獨立查證。'
  } : {
    'brand-sub':'BUSINESS & TECHNOLOGY',print:'Print',intro:'From AI chips to energy supply. Read the events, the economics and the changes to watch.',
    start:'Read this edition','story-total':'11 selected stories','deep-title':'Read deeper','deep-sub':'Three questions worth your time','news-title':'Today’s stories','brief-title':'30-second Brief','brief-sub':'What changed today',
    'search-label':'Search','context-title':'Industry context','memo-title':'One-page analysis memo','lower-title':'Lower-priority headlines','sources-title':'Sources & verification','back-top':'Back to top',
    'source-note':'Adapted from the supplied October 13, 2026 brief. Some source URLs were recovered through search. Original earnings, SPUR standard and lower-priority article links remain incomplete, as noted. Confidence labels reflect the brief and do not establish a full independent fact-check.'
  };
  Object.entries(copy).forEach(([id,text])=>el(id).textContent=text);
  el('start').append(icon('down'));el('back-top').append(icon('up'));
  if(period==='week'){
    el('headline').replaceChildren(node('span',lang==='zh'?'本週':'This week’s'),node('em',lang==='zh'?'關鍵精華。':' essentials.'));
    el('intro').textContent=weekly.throughline?t(weekly.throughline):(lang==='zh'?'快速回顧已收錄刊期的關鍵事件，完整細節可進入每日版閱讀。':'A concise selection from available editions. Open the daily edition for details.');
  }else {
    el('headline').textContent=lang==='zh'?'今天，值得理解的事。':'Today, with perspective.';
    el('intro').textContent=data.perspective?(lang==='zh'?'台灣與東南亞，沿著設備、封裝、記憶體與終端工廠，追蹤需求、成本及投資如何落地。':'Taiwan and Southeast Asia: follow equipment, packaging, memory and end-use factories to understand demand, costs and investment execution.'):(lang==='zh'?'先讀重點，再沿著背景、商業模式與競爭關係往下看。':'Start with the essentials, then explore the context, business models and competition.');
  }
  el('lang').textContent = lang === 'zh' ? 'EN' : '中';
  el('lang').dataset.tooltip=lang==='zh'?'English':'繁體中文';
  el('print').replaceChildren(icon('printer'));
  el('print').setAttribute('aria-label',lang==='zh'?'列印':'Print');
  el('print').dataset.tooltip=lang==='zh'?'列印':'Print';
  el('lang').setAttribute('aria-label',lang === 'zh' ? 'Switch to English' : '切換為繁體中文');
  el('search').placeholder = lang === 'zh' ? '公司、事件或關鍵字' : 'Company, event or keyword';
  el('throughline').textContent = t(data.throughline);
  const notes=selectedEditions.map(e=>e.date+' · '+(e.verificationNote?t(e.verificationNote):(lang==='zh'?'此刊期沿用提供的日報，部分原始來源仍待核對；各則限制見分析內容。':'Adapted from the supplied brief; some original sources remain incomplete. See story-specific caveats.')));
  el('source-note').textContent=notes.join('\n\n');
  el('filters').replaceChildren();
  ['all','tech','taiwan','global'].forEach(key=>{
    const button=node('button',words[lang][key]); button.type='button';button.dataset.filter=key;
    button.onclick=()=>{filter=key;renderStories();};
    el('filters').append(button);
  });
  el('deep-links').replaceChildren();
  data.deep.forEach((item,i)=>{
    const a=node('a',undefined,'deep-card'); a.href='#story-'+item.id;
    a.append(node('small','0'+(i+1)+' / '+(lang==='zh'?'深讀':'DEEP READ')),node('h3',t(item.question)),node('p',t(item.text)));
    a.onclick=()=>{filter='all';query='';el('search').value='';openStories.add(item.id);renderStories();};
    el('deep-links').append(a);
  });
  textSection(el('context-content'),data.context);
  el('memo-topic').textContent=t(data.memo.title);
  el('memo-content').replaceChildren();
  data.memo.items.forEach(item=>{
    const n=node('div');n.append(node('h4',t(item.title)),node('p',t(item.text)));el('memo-content').append(n);
  });
  el('lower-content').replaceChildren();
  data.lower.forEach(item=>{
    const n=node('div',undefined,'lower-item');n.append(node('strong',t(item.title)),node('p',t(item.text)));el('lower-content').append(n);
  });
  el('source-list').replaceChildren();
  data.stories.forEach((story,index)=>{
    const n=node('div',undefined,'source-row');n.append(node('strong',story.editionDate+' / '+String(index+1).padStart(2,'0')+' · '+t(story.title)));
    story.sources.forEach(source=>{n.append(link(source),node('small',source.type+' '));});
    el('source-list').append(n);
  });
  renderPeriod();
  renderBrief();
  renderStories();
}
let beforePrint = [];
window.addEventListener('beforeprint',()=>{beforePrint=[...document.querySelectorAll('details')].map(n=>[n,n.open]);beforePrint.forEach(([n])=>n.open=true);});
window.addEventListener('afterprint',()=>beforePrint.forEach(([n,open])=>n.open=open));
async function readJson(path) {
  const response = await fetch(path,{cache:'no-cache'});
  if (!response.ok) throw new Error('Content unavailable');
  return response.json();
}
readJson('./editions/index.json').then(async manifest => {
  weekPaths=manifest.weeks||{};
  exportPaths=manifest.exports||{};
  exportVersions=manifest.exportVersions||{};
  catalog=manifest.editions.slice().sort((a,b)=>b.date.localeCompare(a.date));
  el('lang').onclick=()=>{lang=lang==='zh'?'en':'zh';render();};
  el('search').addEventListener('input',e=>{query=e.target.value.trim();renderStories();});
  el('clear-search').onclick=()=>{query='';el('search').value='';renderStories();el('search').focus();};
  mountCalendar({date:()=>selectedDate,locale:()=>lang,available:()=>catalog.map(e=>e.date),select:value=>{selectedDate=value;choosePeriod();}});
  el('print').onclick=()=>window.print();
  el('view-day').onclick=()=>{period='day';choosePeriod();};
  el('view-week').onclick=()=>{period='week';choosePeriod();};
  const setReadingMode=mode=>{
    readingMode=mode;openStories.clear();closedStories.clear();
    for(const story of data.stories)(mode==='deep'?openStories:closedStories).add(story.id);
    renderPeriod();renderStories();
  };
  el('reading-summary').onclick=()=>setReadingMode('summary');
  el('reading-deep').onclick=()=>setReadingMode('deep');
  el('date').addEventListener('change',e=>{if(validDate(e.target.value)){selectedDate=e.target.value;choosePeriod();}});
  el('previous').onclick=()=>{selectedDate=shiftDate(selectedDate,period==='day'?-1:-7);choosePeriod();};
  el('next').onclick=()=>{selectedDate=shiftDate(selectedDate,period==='day'?1:7);choosePeriod();};
  el('today').onclick=()=>{selectedDate=taipeiToday();choosePeriod();};
  el('latest').onclick=()=>{if(catalog.length){selectedDate=catalog[0].date;period='day';choosePeriod();}};
  choosePeriod();
}).catch(()=>{setPageState('error');el('error').hidden=false;});

el('retry').onclick=()=>location.reload();
function readingProgress(){const height=document.documentElement.scrollHeight-innerHeight;el('reading-progress').style.width=(height>0?Math.min(100,scrollY/height*100):0)+'%';}
addEventListener('scroll',readingProgress,{passive:true});addEventListener('resize',readingProgress);

el('previous').replaceChildren(icon('left'));el('next').replaceChildren(icon('right'));el('clear-search').replaceChildren(icon('close'));document.querySelector('.calendar-glyph').append(icon('calendar'));

el('search-icon').append(icon('search'));

