import {icon} from './icons.mjs';
import {shiftDate} from './dates.mjs';
// Custom calendar; native button semantics retain keyboard and screen-reader support.
export function mountCalendar({date, locale, available, select}) {
  const opener=document.getElementById('calendar-open'), panel=document.getElementById('calendar-panel');
  let month=date().slice(0,7), focusDate=date();
  const n=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
  const close=()=>{panel.hidden=true;opener.setAttribute('aria-expanded','false');};
  function render(focus=false){
    const zh=locale()==='zh', first=month+'-01';
    panel.replaceChildren();
    const header=n('div');header.className='calendar-header';
    const prev=n('button'),next=n('button'),title=n('strong');
    prev.type=next.type='button';prev.append(icon('prev'));next.append(icon('next'));prev.setAttribute('aria-label',zh?'上一個月':'Previous month');next.setAttribute('aria-label',zh?'下一個月':'Next month');
    title.id='calendar-month';title.textContent=new Intl.DateTimeFormat(zh?'zh-TW':'en',{year:'numeric',month:'long',timeZone:'UTC'}).format(new Date(first+'T12:00:00Z'));
    function move(step){const d=new Date(first+'T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+step);month=d.toISOString().slice(0,7);focusDate=month+'-01';render();panel.querySelector(step<0?'.calendar-header button:first-child':'.calendar-header button:last-child').focus();}
    prev.onclick=()=>move(-1);next.onclick=()=>move(1);header.append(prev,title,next);panel.append(header);
    const weekdays=n('div');weekdays.className='calendar-weekdays';weekdays.setAttribute('aria-hidden','true');(zh?['日','一','二','三','四','五','六']:['S','M','T','W','T','F','S']).forEach(x=>weekdays.append(n('span',x)));panel.append(weekdays);
    const grid=n('div');grid.className='calendar-grid';grid.setAttribute('role','group');grid.setAttribute('aria-labelledby','calendar-month');
    const offset=new Date(first+'T12:00:00Z').getUTCDay();
    const published=new Set(available());
    for(let i=0;i<42;i++){
      const value=shiftDate(first,i-offset),b=n('button',String(Number(value.slice(-2))));b.type='button';b.dataset.date=value;b.tabIndex=value===focusDate?0:-1;
      b.className=(value.slice(0,7)!==month?'outside ':'')+(published.has(value)?'published ':'');b.setAttribute('aria-label',value+(published.has(value)?(zh?'，已有刊期':', edition available'):(zh?'，尚無刊期':', no edition')));b.setAttribute('aria-pressed',String(value===date()));
      b.onclick=()=>{select(value);close();opener.focus();};
      b.onkeydown=e=>{const steps={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7};if(e.key in steps){e.preventDefault();focusDate=shiftDate(value,steps[e.key]);month=focusDate.slice(0,7);render(true);}};
      grid.append(b);
    }
    panel.append(grid);const note=n('p',zh?'圓點表示已有日報':'Dots indicate available editions');note.className='calendar-note';panel.append(note);
    if(focus)panel.querySelector('[data-date="'+focusDate+'"]').focus();
  }
  opener.onclick=()=>{if(!panel.hidden){close();return;}month=date().slice(0,7);focusDate=date();render(true);panel.hidden=false;
    if(matchMedia('(max-width:540px)').matches)panel.style.top=Math.max(12,Math.min(opener.getBoundingClientRect().bottom+10,innerHeight-panel.offsetHeight-12))+'px';
    else panel.style.removeProperty('top');
    opener.setAttribute('aria-expanded','true');panel.querySelector('[data-date="'+focusDate+'"]').focus();};
  document.addEventListener('click',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!opener.contains(e.target))close();});
  panel.addEventListener('keydown',e=>{if(e.key==='Escape'){close();opener.focus();}});
  document.addEventListener('focusin',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!opener.contains(e.target))close();});
  addEventListener('resize',close);
  return {close};
}

