/* Content is rendered with textContent. News strings never become HTML. */
import {storyParagraph} from './story-copy.mjs';
import {fallbackWeekly} from './weekly.mjs';
import {icon} from './icons.mjs';
import {mountCalendar} from './calendar.mjs';
import {storyFigures,chainMap,chainStrip,numbersOverview} from './viz.mjs';
import {renderEvents} from './events.mjs';
import {taipeiToday, validDate, shiftDate, periodRange, selectEditions} from './dates.mjs';
const el = id => document.getElementById(id);
let data, weekly, weekPaths={}, exportPaths={}, exportVersions={}, exportPathsEn={}, exportVersionsEn={}, catalog = [], selectedEditions = [], lang = 'en', filter = 'all', query = '';
let readingMode='summary';
const params = new URLSearchParams(location.search);
let period = ['week','events'].includes(params.get('view')) ? params.get('view') : 'day';
let events=null;const eventState={region:'all'};
// English by default; a chosen language persists per browser.
try{const saved=params.get('lang')||localStorage.getItem('brief-lang');if(saved==='zh'||saved==='en')lang=saved;}catch{}
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
  const requested=selectEditions(catalog,selectedDate,period==='week'?'week':'day');
  const requestedWeek=periodRange(selectedDate,'week').start;
  if(!data||requested.some(entry=>!editionCache.has(entry.date))||(period==='week'&&weekPaths[requestedWeek]&&!weeklyCache.has(requestedWeek)))setPageState('loading');
  el('error').hidden=true;
  try {
    if(period==='events'&&!events)events=await readJson('./events.json');
    const loaded=await Promise.all(requested.map(async entry=>{if(!editionCache.has(entry.date))editionCache.set(entry.date,await readJson(entry.path));return editionCache.get(entry.date);}));
    const weekStart=periodRange(selectedDate,'week').start;
    if(period==='week'&&weekPaths[weekStart]&&!weeklyCache.has(weekStart))weeklyCache.set(weekStart,await readJson(weekPaths[weekStart]));
    const digest=period==='week' ? (weeklyCache.get(weekStart)||fallbackWeekly(loaded,selectedDate)) : null;
    if(version!==requestVersion)return;
    selectedEditions=loaded;weekly=digest;
  const newest = selectedEditions[0];
  const blank = {date:selectedDate, throughline:{zh:'這段期間尚未收錄新聞。',en:'No editions have been published for this period.'},stories:[],deep:[],context:[],memo:{title:{zh:'',en:''},items:[]},lower:[]};
  data = {...(newest || blank), stories:selectedEditions.flatMap(e => rankStories(e).map(s => ({...s, sourceId:s.id, editionDate:e.date, id:e.date+'-'+s.id})))};
  data.deep = selectedEditions.flatMap(e => e.deep.map(d => ({...d,id:e.date+'-'+d.id}))).slice(0,3);
  const url = new URL(location.href);
  // Day is the default view, so it stays out of shared links.
  if(period==='day')url.searchParams.delete('view');else url.searchParams.set('view',period);
  url.searchParams.set('date',selectedDate);
  history.replaceState(null,'',url);
  render();
  setPageState('ready');
  revealHash();
  } catch(error){if(version===requestVersion){setPageState('error');el('error').hidden=false;el('coverage').textContent=lang==='zh'?'刊期暫時無法載入，請重試。':'Edition could not be loaded. Please retry.';}}
  finally{if(version===requestVersion)document.querySelector('main').setAttribute('aria-busy','false');}
}
// Reading order: lead stories, then stories in the 30-second brief order,
// then the rest (usually background follow-ups) in edition order.
function rankStories(edition){
  const brief=(edition.brief||[]).map(b=>b.id);
  const rank=s=>s.depth==='lead'?0:brief.includes(s.id)?1:s.pick?2:3;
  const pos=s=>brief.includes(s.id)?brief.indexOf(s.id):99;
  return edition.stories.map((s,i)=>({s,i})).sort((a,b)=>rank(a.s)-rank(b.s)||pos(a.s)-pos(b.s)||a.i-b.i).map(x=>x.s);
}
function renderPeriod() {
  document.body.dataset.view=period;
  const zh = lang === 'zh', range = periodRange(selectedDate,period==='week'?'week':'day');
  const label = period === 'day' ? selectedDate : range.start+' / '+range.end;
  const exportKey=period==='events'?events?.updated:period==='week'?range.start:selectedDate;
  // English interface downloads the English workbook when one exists.
  const en=!zh&&exportPathsEn[period]?.[exportKey];
  const exportPath=en?exportPathsEn[period][exportKey]:exportPaths[period]?.[exportKey];
  const exportVersion=(en?exportVersionsEn:exportVersions)[period]?.[exportKey];
  const excel=el('export-excel');excel.hidden=!exportPath;
  if(exportPath){excel.href=exportPath+(exportVersion?'?v='+exportVersion:'');excel.download=exportPath.split('/').pop();}
  else excel.removeAttribute('href');
  excel.replaceChildren(icon('download'),node('span','Excel'));
  if(period==='events'){excel.setAttribute('aria-label',zh?'下載產業行事曆 Excel':'Download the industry calendar as Excel');excel.dataset.tooltip=zh?'依月份排列的活動日程':'Events by month';}
  else{excel.setAttribute('aria-label',zh?'下載本'+(period==='week'?'週':'日')+'重點 Excel':'Download '+(period==='week'?'weekly':'daily')+' highlights as Excel');excel.dataset.tooltip=zh?'每則標題與一句重點':'Each headline with a one-line summary';}
  // Visible text labels; no tooltip repeating them.
  el('view-day').replaceChildren(icon('today'),node('span',zh?'當日':'Day'));
  el('view-week').replaceChildren(icon('week'),node('span',zh?'當週':'Week'));
  el('view-events').replaceChildren(icon('flag'),node('span',zh?'行事曆':'Events'));
  el('view-day').setAttribute('aria-pressed',String(period === 'day'));
  el('view-week').setAttribute('aria-pressed',String(period === 'week'));
  el('view-events').setAttribute('aria-pressed',String(period === 'events'));
  // Tab title follows language and view, e.g. "Oct 17, 2026 · Daily Brief".
  const fmt=(d,o)=>new Intl.DateTimeFormat(zh?'zh-TW':'en',{...o,timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
  const md=d=>zh?fmt(d,{month:'numeric',day:'numeric'}):fmt(d,{month:'short',day:'numeric'});
  document.title=period==='events'?(zh?'產業行事曆｜Daily Brief':'Industry calendar · Daily Brief')
    :period==='week'?(zh?md(range.start)+'–'+md(range.end)+' 週報｜Daily Brief':'Week of '+md(range.start)+' · Daily Brief')
    :(zh?md(selectedDate)+' 日報｜Daily Brief':fmt(selectedDate,{month:'short',day:'numeric',year:'numeric'})+' · Daily Brief');
  document.querySelector('meta[name=description]').content=zh?'Daily Brief 商業與科技日報：台灣與東南亞半導體、資料中心與工廠供應鏈的查證新聞，附來源與圖表。':'Daily Brief: verified bilingual news on Taiwan and Southeast Asian semiconductor, data-center and factory supply chains, with sources and charts.';
  el('date-label').textContent = zh ? '日期' : 'Date';
  el('date').value = selectedDate;
  el('date-display').textContent = selectedDate.slice(5).replace('-','/');
  el('calendar-open').setAttribute('aria-label',(zh?'選擇日期：':'Choose date: ')+selectedDate);
  el('publication-status').textContent = data.archiveType==='backfill' ? (zh?'回溯補編':'RETROSPECTIVE EDITION') : data.generatedAt ? (zh?'更新於 ':'UPDATED ')+new Intl.DateTimeFormat(zh?'zh-TW':'en',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Taipei'}).format(new Date(data.generatedAt)) : '';
  el('today').replaceChildren(icon('current'));
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
  zh: {all:'全部',tech:'科技與商業',taiwan:'台灣與政策',global:'全球與能源',pick:'深讀推薦',detail:'分析',confidence:'查證信心',sources:'新聞來源',count:n => n+' 則新聞',empty:'找不到符合條件的新聞。'},
  en: {all:'All',tech:'Tech & business',taiwan:'Taiwan & policy',global:'Global & energy',pick:'READ DEEPER',detail:'Analysis',confidence:'Confidence',sources:'Sources',count:n => n===1?'1 story':n+' stories',empty:'No stories match your search.'}
};
const t = value => value[lang];
// Source names may be plain strings (older data) or {zh,en}.
const label = value => typeof value==='string'?value:value[lang]||value.zh;
function node(tag, text, className) {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (className) n.className = className;
  return n;
}
function link(source) {
  const a = node('a', label(source.name));
  a.append(icon('external'));
  a.href = source.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}
function renderStories() {
  if(period==='events'){renderEvents(el('events-view'),events,lang,taipeiToday(),eventState);return;}
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
    // Show when the event happened; older stories without one show the edition date.
    const eventDate=s.market?.eventDate||s.editionDate,md=(+eventDate.slice(5,7))+'/'+(+eventDate.slice(8));
    const published=node('time',s.market?.eventDate?(lang==='zh'?'事件 '+md:'Event '+new Intl.DateTimeFormat('en',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(eventDate+'T12:00:00Z'))):md,'story-time');
    published.dateTime=eventDate;published.setAttribute('aria-label',(s.market?.eventDate?(lang==='zh'?'事件日期：':'Event date: '):(lang==='zh'?'刊期日期：':'Edition date: '))+eventDate);meta.append(node('span', words[lang][s.category], 'category cat-'+s.category));
    if (s.pick) meta.append(node('span', words[lang].pick, 'pick'));
    const heading=node('h3',undefined,'story-heading');heading.append(node('strong',t(s.title)),document.createTextNode(' '),published);
    const paragraph=node('p',undefined,'summary-text story-copy');paragraph.id=article.id+'-copy';
    let expanded=openStories.has(s.id)||(readingMode==='deep'&&!closedStories.has(s.id));
    paragraph.textContent=storyParagraph(s,lang,expanded);
    content.append(meta,heading,paragraph);
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
    const strip=chainStrip(s,lang);if(strip)content.append(strip);
    const figures=storyFigures(s,lang);if(figures)content.append(figures);
    const toggle=node('button',undefined,'story-toggle');toggle.type='button';
    toggle.setAttribute('aria-controls',paragraph.id);
    const updateToggle=()=>{
      const label=expanded?(lang==='zh'?'收合內容':'Show less'):(lang==='zh'?'閱讀更多':'Read more');
      toggle.replaceChildren(node('span',label),icon('plus'));
      toggle.setAttribute('aria-expanded',String(expanded));
      toggle.setAttribute('aria-label',label+'：'+t(s.title));
    };
    updateToggle();
    toggle.onclick=()=>{
      expanded=!expanded;
      if(expanded){openStories.add(s.id);closedStories.delete(s.id);}else{openStories.delete(s.id);closedStories.add(s.id);}
      paragraph.textContent=storyParagraph(s,lang,expanded);updateToggle();
    };
    content.append(toggle);
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
    content.append(node('span',words[lang][item.category],'week-category category cat-'+item.category),node('h3',t(item.title)),node('p',t(item.summary)));
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
const storyNumber=s=>String(data.stories.indexOf(s)+1).padStart(2,'0');
function renderNumbers(){
  const zh=lang==='zh',map=period==='day'?chainMap(data.stories,lang,storyNumber):null;
  const charts=period==='day'?numbersOverview(data.stories,lang,storyNumber):[];
  el('numbers').hidden=!map&&!charts.length;
  el('numbers-title').textContent=zh?'數據一覽':'At a glance';
  el('numbers-sub').textContent=zh?'先看圖，再讀全文':'Scan the charts, then read on';
  el('chain-title').textContent=zh?'供應鏈位置：上游到下游':'Supply chain: upstream to downstream';
  el('chain-note').textContent=zh?'依各則新聞的產業鏈欄位標示，一則可跨多個環節；點選編號跳到該則。':'Placed from each story’s supply-chain fields; a story can span several stages. Select a number to jump to it.';
  el('chain-block').hidden=!map;el('chain-map').replaceChildren(...(map?[map]:[]));
  el('numbers-charts').replaceChildren(...charts);
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
const currentTheme=()=>document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
function renderTheme(){
  const dark=currentTheme()==='dark',zh=lang==='zh';
  const label=dark?(zh?'切換為淺色':'Light theme'):(zh?'切換為深色':'Dark theme');
  el('theme').replaceChildren(icon(dark?'sun':'moon'));
  el('theme').setAttribute('aria-label',label);el('theme').dataset.tooltip=label;
  document.querySelector('meta[name=theme-color]').content=dark?'#0f1714':'#f7f6f1';
}
function render() {
  document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  const copy = lang === 'zh' ? {
    'brand-sub':'商業與科技日報',skip:'跳到新聞內容',intro:'從 AI 晶片到能源供應，讀事件，也讀成本、競爭與接下來的變化。',
    start:'閱讀本期','story-total':'11 則重點新聞','deep-title':'延伸深讀','deep-sub':'三個值得多停留的問題','news-title':'今日新聞','brief-title':'30 秒 Brief','brief-sub':'先掌握今天的變化',
    'search-label':'搜尋','context-title':'產業脈絡','memo-title':'一頁分析備忘錄','lower-title':'降低權重的標題','sources-title':'來源與查證','back-top':'回到頁首',
    'source-note':'本期內容整理自提供的 2026 年 10 月 13 日日報，部分來源網址經重新檢索。原始財報、SPUR 技術標準及部分低權重新聞連結尚未找回，文中已註明。信心程度沿用原日報，並不表示本頁已完成全面獨立查證。'
  } : {
    'brand-sub':'BUSINESS & TECHNOLOGY',skip:'Skip to stories',intro:'From AI chips to energy supply. Read the events, the economics and the changes to watch.',
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
    el('intro').textContent=(data.perspective||data.coverage)?(lang==='zh'?'台灣與東南亞，沿著設備、封裝、記憶體與終端工廠，追蹤需求、成本及投資如何落地。':'Taiwan and Southeast Asia: follow equipment, packaging, memory and end-use factories to understand demand, costs and investment execution.'):(lang==='zh'?'先讀重點，再沿著背景、商業模式與競爭關係往下看。':'Start with the essentials, then explore the context, business models and competition.');
  }
  el('lang').textContent = lang === 'zh' ? 'EN' : '中';
  renderTheme();
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
  renderNumbers();
  renderStories();
}
let beforePrint = [];
window.addEventListener('beforeprint',()=>{beforePrint=[...document.querySelectorAll('.story-copy')].map(n=>[n,n.textContent]);for(const [n] of beforePrint){const story=data.stories.find(s=>'story-'+s.id+'-copy'===n.id);if(story)n.textContent=storyParagraph(story,lang,true);}});
window.addEventListener('afterprint',()=>beforePrint.forEach(([n,copy])=>n.textContent=copy));
// Stories load after the page, so jump to a linked story once it exists.
// Short links use #s12; #story-YYYY-MM-DD-12 remains supported.
let hashHandled=false;
function revealHash(){
  if(hashHandled||!location.hash)return;hashHandled=true;
  const short=location.hash.match(/^#s(\d+)$/);
  const target=document.getElementById(short?'story-'+selectedDate+'-'+short[1]:decodeURIComponent(location.hash.slice(1)));
  if(target)requestAnimationFrame(()=>target.scrollIntoView());
}
async function readJson(path) {
  const response = await fetch(path,{cache:'no-cache'});
  if (!response.ok) throw new Error('Content unavailable');
  return response.json();
}
readJson('./editions/index.json').then(async manifest => {
  weekPaths=manifest.weeks||{};
  exportPaths=manifest.exports||{};
  exportVersions=manifest.exportVersions||{};
  exportPathsEn=manifest.exportsEn||{};
  exportVersionsEn=manifest.exportVersionsEn||{};
  catalog=manifest.editions.slice().sort((a,b)=>b.date.localeCompare(a.date));
  el('lang').onclick=()=>{lang=lang==='zh'?'en':'zh';try{localStorage.setItem('brief-lang',lang);}catch{}render();};
  el('theme').onclick=()=>{const next=currentTheme()==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem('brief-theme',next);}catch{}renderTheme();};
  el('search').addEventListener('input',e=>{query=e.target.value.trim();renderStories();});
  el('clear-search').onclick=()=>{query='';el('search').value='';renderStories();el('search').focus();};
  mountCalendar({date:()=>selectedDate,locale:()=>lang,available:()=>catalog.map(e=>e.date),select:value=>{selectedDate=value;choosePeriod();}});
  el('view-day').onclick=()=>{period='day';choosePeriod();};
  el('view-week').onclick=()=>{period='week';choosePeriod();};
  el('view-events').onclick=()=>{period='events';choosePeriod();};
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

el('previous').replaceChildren(icon('prev'));el('next').replaceChildren(icon('next'));el('clear-search').replaceChildren(icon('close'));document.querySelector('.calendar-glyph').append(icon('calendar'));

el('search-icon').append(icon('search'));

