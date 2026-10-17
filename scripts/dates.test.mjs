import test from 'node:test';
import assert from 'node:assert/strict';
import {taipeiToday,validDate,periodRange,selectEditions,shiftDate} from '../docs/dates.mjs';
test('Taipei midnight changes date at 16:00 UTC',()=>{
  assert.equal(taipeiToday(new Date('2026-10-12T15:59:59Z')),'2026-10-12');
  assert.equal(taipeiToday(new Date('2026-10-12T16:00:00Z')),'2026-10-13');
});
test('week starts Sunday and includes Saturday',()=>{
  for(const date of ['2026-10-11','2026-10-13','2026-10-17'])assert.deepEqual(periodRange(date,'week'),{start:'2026-10-11',end:'2026-10-17'});
  assert.deepEqual(periodRange('2026-10-18','week'),{start:'2026-10-18',end:'2026-10-24'});
});
test('weeks and navigation cross year boundaries',()=>{
  assert.deepEqual(periodRange('2027-01-01','week'),{start:'2026-12-27',end:'2027-01-02'});
  assert.equal(shiftDate('2026-12-31',1),'2027-01-01');
});
test('validates calendar dates including leap days',()=>{
  assert.equal(validDate('2026-02-29'),false);
  assert.equal(validDate('2028-02-29'),true);
  assert.equal(validDate('invalid'),false);
  assert.equal(validDate('2026-13-01'),false);
});
test('filters editions by period and orders newest first without mutation',()=>{
  const editions = ['2026-10-11','2026-10-12','2026-10-18','2026-10-19'].map(date=>({date}));
  assert.deepEqual(selectEditions(editions,'2026-10-13','week').map(e=>e.date),['2026-10-12','2026-10-11']);
  assert.deepEqual(selectEditions(editions,'2026-10-13','day'),[]);
  assert.deepEqual(selectEditions(editions,'2026-10-12','day').map(e=>e.date),['2026-10-12']);
  assert.equal(editions[0].date,'2026-10-11');
});
import {fallbackWeekly} from '../docs/weekly.mjs';
test('weekly fallback merges repeated topics and selects at most five',()=>{
 const make=(id,topic)=>({id,topic,pick:true,category:'tech',title:{zh:topic,en:topic},summary:{zh:'摘要',en:'Summary'}});
 const digest=fallbackWeekly([{date:'2026-10-16',stories:[make(1,'repeat')]},{date:'2026-10-17',stories:[make(2,'repeat'),...Array.from({length:6},(_,i)=>make(i+3,'topic'+i))]}],'2026-10-17');
 assert.equal(digest.highlights.length,5);
 assert.equal(new Set(digest.highlights.map(h=>h.title.en)).size,5);
 assert.equal(digest.highlights[0].references.length,2);
});

