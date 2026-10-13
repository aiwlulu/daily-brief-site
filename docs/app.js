/* Content is rendered with textContent. News strings never become HTML. */
import {taipeiToday, validDate, shiftDate, periodRange, selectEditions} from './dates.mjs';
const el = id => document.getElementById(id);
let data, editions = [], selectedEditions = [], lang = 'zh', filter = 'all', query = '';
const params = new URLSearchParams(location.search);
let period = params.get('view') === 'week' ? 'week' : 'day';
let selectedDate = validDate(params.get('date') || '') ? params.get('date') : taipeiToday();
function choosePeriod() {
  selectedEditions = selectEditions(editions, selectedDate, period);
  const newest = selectedEditions[0];
  const blank = {date:selectedDate, throughline:{zh:'這段期間尚未收錄新聞。',en:'No editions have been published for this period.'},stories:[],deep:[],context:[],memo:{title:{zh:'',en:''},items:[]},lower:[]};
  data = {...(newest || blank), stories:selectedEditions.flatMap(e => e.stories.map(s => ({...s, sourceId:s.id, editionDate:e.date, id:e.date+'-'+s.id})))};
  data.deep = selectedEditions.flatMap(e => e.deep.map(d => ({...d,id:e.date+'-'+d.id}))).slice(0,3);
  const url = new URL(location.href);
  url.searchParams.set('view',period); url.searchParams.set('date',selectedDate);
  history.replaceState(null,'',url);
  render();
}
function renderPeriod() {
  const zh = lang === 'zh', range = periodRange(selectedDate,period);
  const label = period === 'day' ? selectedDate : range.start+' / '+range.end;
  el('view-day').textContent = zh ? '當日' : 'Day';
  el('view-week').textContent = zh ? '當週' : 'Week';
  el('view-day').setAttribute('aria-pressed',String(period === 'day'));
  el('view-week').setAttribute('aria-pressed',String(period === 'week'));
  el('date-label').textContent = zh ? '日期' : 'Date';
  el('date').value = selectedDate;
  el('today').textContent = zh ? '回到今天' : 'Today';
  el('latest').textContent = zh ? '閱讀最新一期' : 'Latest edition';
  el('latest').hidden = selectedEditions.length > 0;
  el('previous').setAttribute('aria-label',zh ? (period === 'day'?'上一日':'上一週') : (period === 'day'?'Previous day':'Previous week'));
  el('next').setAttribute('aria-label',zh ? (period === 'day'?'下一日':'下一週') : (period === 'day'?'Next day':'Next week'));
  el('edition').textContent = (period === 'day'?'DAILY EDITION / ':'WEEKLY VIEW / ')+label;
  el('edition-date').textContent = label;
  el('news-title').textContent = zh ? (period === 'day'?'當日新聞':'當週新聞') : (period === 'day'?'Daily stories':'Weekly stories');
  el('story-total').textContent = words[lang].count(data.stories.length);
  el('coverage').textContent = zh
    ? label+' · 台灣時間 · '+(period === 'week'?'週一至週日 · ':'')+'已收錄 '+selectedEditions.length+' 期，共 '+data.stories.length+' 則。'+(!selectedEditions.length?'此期間尚未發布，可切換日期或閱讀最新一期。':period === 'week'?'以下按刊期由新到舊排列；深讀與產業分析取自本週已收錄刊期。':'')
    : label+' · Asia/Taipei · '+(period === 'week'?'Monday to Sunday · ':'')+selectedEditions.length+' editions, '+data.stories.length+' stories.'+(!selectedEditions.length?' No edition yet. Choose another date or the latest edition.':period === 'week'?' Newest first. Analysis comes from the available editions.':'');
  el('theme-label').textContent = zh ? (period === 'week'?'最新刊期主線 · '+data.date:'今日主線') : (period === 'week'?'LATEST EDITION / '+data.date:'TODAY’S THROUGHLINE');
  if(period === 'week' && selectedEditions.length) {
    el('context-title').textContent = (zh?'最新刊期產業脈絡 · ':'Latest context · ')+data.date;
    el('memo-title').textContent = (zh?'最新刊期分析備忘錄 · ':'Latest analysis memo · ')+data.date;
    el('lower-title').textContent = (zh?'最新刊期低權重標題 · ':'Latest lower-priority headlines · ')+data.date;
  }
  document.querySelectorAll('.deep,.context,.memo,.lower,.sources,.lead').forEach(n=>n.hidden=!selectedEditions.length);
}

const openStories = new Set();
const words = {
  zh: {all:'全部',tech:'科技與商業',taiwan:'台灣與政策',global:'全球與能源',pick:'深讀推薦',detail:'展開分析',confidence:'判斷信心',sources:'新聞來源',count:n => n+' 則新聞',empty:'找不到符合條件的新聞。'},
  en: {all:'All',tech:'Tech & business',taiwan:'Taiwan & policy',global:'Global & energy',pick:'READ DEEPER',detail:'Read analysis',confidence:'Confidence',sources:'Sources',count:n => n+' stories',empty:'No stories match your search.'}
};
const t = value => value[lang];
function node(tag, text, className) {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (className) n.className = className;
  return n;
}
function link(source) {
  const a = node('a', source.name+' ↗');
  a.href = source.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}
function renderStories() {
  const list = el('news-list');
  list.replaceChildren();
  const matches = data.stories.filter(s =>
    (filter === 'all' || s.category === filter) &&
    JSON.stringify(s).toLocaleLowerCase().includes(query.toLocaleLowerCase())
  );
  el('count').textContent = words[lang].count(matches.length);
  el('empty').textContent = words[lang].empty;
  el('empty').hidden = matches.length > 0;
  for (const s of matches) {
    const article = node('article', undefined, 'story');
    article.id = 'story-'+s.id;
    article.append(node('div', String(s.sourceId).padStart(2,'0'), 'story-number'));
    const content = node('div');
    const meta = node('div', undefined, 'story-meta');
    meta.append(node('span', words[lang][s.category]),node('time',s.editionDate));
    if (s.pick) meta.append(node('span', words[lang].pick, 'pick'));
    content.append(meta, node('h3', t(s.title)), node('p', t(s.summary), 'summary-text'));
    const details = node('details');
    details.open = openStories.has(s.id);
    details.addEventListener('toggle', () => {if(details.isConnected) details.open ? openStories.add(s.id) : openStories.delete(s.id);});
    details.append(node('summary', words[lang].detail));
    const body = node('div', undefined, 'story-body');
    if(s.table){
      const table = node('table');
      const caption = node('caption',lang === 'zh' ? '2026 年第三季自結財務數據' : 'Q3 2026 preliminary results');
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
    const sources = node('div',undefined,'source-links');
    sources.setAttribute('aria-label',words[lang].sources);
    s.sources.forEach(source=>sources.append(link(source)));
    body.append(sources); details.append(body); content.append(details);
    const metric = node('aside', undefined, 'metric');
    const metricText = s.sourceId === 11 && lang === 'en' ? '10M' : s.metric;
    metric.append(node('strong',metricText),node('small',t(s.metricLabel)));
    article.append(content,metric); list.append(article);
  }
  [...el('filters').children].forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter === filter)));
}
function textSection(target, items) {
  target.replaceChildren();
  items.forEach(item=>{
    const n = node('div');
    n.append(node('h3',t(item.title)),node('p',t(item.text)));
    target.append(n);
  });
}
function render() {
  document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  const copy = lang === 'zh' ? {
    'brand-sub':'商業與科技日報',print:'列印',intro:'從 AI 晶片到能源供應，讀事件，也讀成本、競爭與接下來的變化。',
    start:'閱讀本期 ↘','story-total':'11 則重點新聞','deep-title':'本期深讀','deep-sub':'三個值得多停留的問題','news-title':'今日新聞',
    'search-label':'搜尋','context-title':'產業脈絡','memo-title':'一頁分析備忘錄','lower-title':'降低權重的標題','sources-title':'來源與查證','back-top':'回到頁首 ↑',
    'source-note':'本期內容整理自提供的 2026 年 10 月 13 日日報，部分來源網址經重新檢索。原始財報、SPUR 技術標準及部分低權重新聞連結尚未找回，文中已註明。信心程度沿用原日報，並不表示本頁已完成全面獨立查證。'
  } : {
    'brand-sub':'BUSINESS & TECHNOLOGY',print:'Print',intro:'From AI chips to energy supply. Read the events, the economics and the changes to watch.',
    start:'Read this edition ↘','story-total':'11 selected stories','deep-title':'Read deeper','deep-sub':'Three questions worth your time','news-title':'Today’s stories',
    'search-label':'Search','context-title':'Industry context','memo-title':'One-page analysis memo','lower-title':'Lower-priority headlines','sources-title':'Sources & verification','back-top':'Back to top ↑',
    'source-note':'Adapted from the supplied October 13, 2026 brief. Some source URLs were recovered through search. Original earnings, SPUR standard and lower-priority article links remain incomplete, as noted. Confidence labels reflect the brief and do not establish a full independent fact-check.'
  };
  Object.entries(copy).forEach(([id,text])=>el(id).textContent=text);
  el('headline').replaceChildren(node('span',lang === 'zh'?'看見新聞背後的':'Read the news.'),node('br'),node('em',lang === 'zh'?'商業邏輯。':'See the economics.'));
  el('lang').textContent = lang === 'zh' ? 'English' : '繁體中文';
  el('lang').setAttribute('aria-label',lang === 'zh' ? 'Switch to English' : '切換為繁體中文');
  el('search').placeholder = lang === 'zh' ? '公司、事件或關鍵字' : 'Company, event or keyword';
  el('throughline').textContent = t(data.throughline);
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
  data.stories.forEach(story=>{
    const n=node('div',undefined,'source-row');n.append(node('strong',story.editionDate+' / '+String(story.sourceId).padStart(2,'0')+' · '+t(story.title)));
    story.sources.forEach(source=>{n.append(link(source),node('small',source.type+' '));});
    el('source-list').append(n);
  });
  renderPeriod();
  renderStories();
}
let beforePrint = [];
window.addEventListener('beforeprint',()=>{beforePrint=[...document.querySelectorAll('details')].map(n=>[n,n.open]);beforePrint.forEach(([n])=>n.open=true);});
window.addEventListener('afterprint',()=>beforePrint.forEach(([n,open])=>n.open=open));
async function readJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error('Content unavailable');
  return response.json();
}
readJson('./editions/index.json').then(async manifest => {
  editions = await Promise.all(manifest.editions.map(item => readJson(item.path)));
  editions.sort((a,b)=>b.date.localeCompare(a.date));
  el('lang').onclick=()=>{lang=lang==='zh'?'en':'zh';render();};
  el('search').addEventListener('input',e=>{query=e.target.value.trim();renderStories();});
  el('print').onclick=()=>window.print();
  el('view-day').onclick=()=>{period='day';choosePeriod();};
  el('view-week').onclick=()=>{period='week';choosePeriod();};
  el('date').addEventListener('change',e=>{if(validDate(e.target.value)){selectedDate=e.target.value;choosePeriod();}});
  el('previous').onclick=()=>{selectedDate=shiftDate(selectedDate,period==='day'?-1:-7);choosePeriod();};
  el('next').onclick=()=>{selectedDate=shiftDate(selectedDate,period==='day'?1:7);choosePeriod();};
  el('today').onclick=()=>{selectedDate=taipeiToday();choosePeriod();};
  el('latest').onclick=()=>{if(editions.length){selectedDate=editions[0].date;period='day';choosePeriod();}};
  choosePeriod();
}).catch(()=>el('error').hidden=false);
