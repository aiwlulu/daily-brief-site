// Industry calendar: month grid for scanning, agenda list for detail.
import {icon} from './icons.mjs';
const n=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const regions={tw:['台灣','Taiwan'],sea:['東南亞','Southeast Asia'],nea:['日韓','Japan & Korea'],us:['美國','United States'],eu:['歐洲','Europe']};
const types={semiconductor:['半導體','Semiconductor'],datacenter:['資料中心','Data center'],packaging:['電路板與載板','PCB & substrate'],research:['學術研討','Research'],systems:['電腦與系統','Computing systems']};
const focus=e=>e.region==='tw'||e.region==='sea';
const day=d=>new Date(d+'T00:00:00Z');
const daysBetween=(a,b)=>Math.round((day(b)-day(a))/864e5);

function dateRange(e,lang){
 const s=day(e.start),t=day(e.end),zh=lang==='zh';
 const m=d=>new Intl.DateTimeFormat(zh?'zh-TW':'en',{month:'short',timeZone:'UTC'}).format(d);
 if(zh)return (s.getUTCMonth()+1)+'/'+s.getUTCDate()+' – '+(t.getUTCMonth()+1)+'/'+t.getUTCDate();
 return s.getUTCMonth()===t.getUTCMonth()?m(s)+' '+s.getUTCDate()+'–'+t.getUTCDate():m(s)+' '+s.getUTCDate()+' – '+m(t)+' '+t.getUTCDate();
}
function status(e,today,lang){
 const zh=lang==='zh';
 if(e.end<today)return ['past',zh?'已結束':'Ended'];
 if(e.start<=today)return ['live',zh?'進行中':'On now'];
 const d=daysBetween(today,e.start);
 return ['upcoming',zh?d+' 天後':'In '+d+' day'+(d===1?'':'s')];
}

export function renderEvents(root,data,lang,today,state){
 const zh=lang==='zh',t=pair=>pair[zh?0:1];
 root.replaceChildren();
 const head=n('div',undefined,'section-top');
 head.append(n('h2',zh?'產業行事曆':'Industry calendar'),n('span',(zh?'資料核對至 ':'Checked ')+data.updated));
 const intro=n('p',zh?'半導體、封裝與資料中心主要展會及研討會。日期與場館依主辦單位或權威來源核對，出發前請再確認官方公告。':'Major semiconductor, packaging and data-center shows and conferences. Dates and venues are checked against organizers or authoritative sources; confirm official notices before travel.','events-intro');
 const filters=n('div',undefined,'filters events-filters');filters.setAttribute('role','group');filters.setAttribute('aria-label',zh?'地區':'Region');
 for(const key of ['all',...Object.keys(regions)]){
  const b=n('button',key==='all'?(zh?'全部':'All'):t(regions[key]));b.type='button';
  b.setAttribute('aria-pressed',String(state.region===key));
  b.onclick=()=>{state.region=key;renderEvents(root,data,lang,today,state);};
  filters.append(b);
 }
 const events=data.events.filter(e=>state.region==='all'||e.region===state.region).sort((a,b)=>a.start.localeCompare(b.start));
 // Month grid from the current month through the last listed event.
 const first=data.events.reduce((m,e)=>e.start<m?e.start:m,today).slice(0,7),last=data.events.reduce((m,e)=>e.start>m?e.start:m,today).slice(0,7);
 const grid=n('ol',undefined,'event-months');grid.setAttribute('aria-label',zh?'月份總覽':'Months at a glance');
 for(let y=+first.slice(0,4),mo=+first.slice(5);(y+'-'+String(mo).padStart(2,'0'))<=last;mo===12?(y++,mo=1):mo++){
  const key=y+'-'+String(mo).padStart(2,'0'),inMonth=events.filter(e=>e.start.startsWith(key));
  const li=n('li',undefined,'event-month'+(key===today.slice(0,7)?' is-current':'')+(inMonth.length?'':' is-empty'));
  li.append(n('span',zh?y+' 年 '+mo+' 月':new Intl.DateTimeFormat('en',{month:'short',year:'numeric',timeZone:'UTC'}).format(day(key+'-01')),'event-month-label'));
  for(const e of inMonth){
   const a=n('a',undefined,'event-chip'+(focus(e)?' is-focus':'')+(e.end<today?' is-past':''));a.href='#event-'+e.id;
   a.append(n('span',String(day(e.start).getUTCDate()),'event-chip-day'),n('span',e.name.en.replace(/\s*\d{4}.*$/,''),'event-chip-name'));
   a.setAttribute('aria-label',e.name[lang]+', '+dateRange(e,lang)+', '+t(regions[e.region]));
   li.append(a);
  }
  grid.append(li);
 }
 const legend=n('div',undefined,'viz-legend events-legend');
 legend.append(n('span',zh?'台灣與東南亞':'Taiwan & Southeast Asia','key'),n('span',zh?'其他地區':'Other regions','key is-outline'));
 // Agenda grouped by month; ended events stay listed but recede.
 const agenda=n('div',undefined,'event-agenda');
 let month='';
 for(const e of events){
  const key=e.start.slice(0,7);
  if(key!==month){month=key;agenda.append(n('h3',zh?key.slice(0,4)+' 年 '+(+key.slice(5))+' 月':new Intl.DateTimeFormat('en',{month:'long',year:'numeric',timeZone:'UTC'}).format(day(key+'-01')),'event-agenda-month'));}
  const [code,label]=status(e,today,lang);
  const item=n('article',undefined,'event-item is-'+code+(focus(e)?' is-focus':''));item.id='event-'+e.id;
  const date=n('div',undefined,'event-date');
  date.append(n('strong',dateRange(e,lang)),n('span',label,'event-status'));
  const body=n('div',undefined,'event-body');
  const meta=n('div',undefined,'event-meta');meta.append(n('span',t(regions[e.region]),'event-region'),n('span',t(types[e.type])));
  const title=n('h4',e.name[lang]);
  const place=n('p',undefined,'event-place');place.append(icon('pin'),n('span',e.place[lang]));
  const source=n('a',typeof e.source.name==='string'?e.source.name:e.source.name[lang]);source.href=e.source.url;source.target='_blank';source.rel='noopener noreferrer';source.append(icon('external'));source.className='event-source';
  body.append(meta,title,place,n('p',e.focus[lang],'event-focus'),source);
  item.append(date,body);agenda.append(item);
 }
 if(!events.length)agenda.append(n('p',zh?'此地區目前沒有已核對的活動。':'No verified events for this region yet.','events-empty'));
 root.append(head,intro,filters,legend,grid,agenda);
}
