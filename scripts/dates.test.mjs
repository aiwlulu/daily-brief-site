import test from 'node:test';
import assert from 'node:assert/strict';
import {taipeiToday,validDate,periodRange,selectEditions,shiftDate} from '../docs/dates.mjs';
test('Taipei midnight changes date at 16:00 UTC',()=>{
  assert.equal(taipeiToday(new Date('2026-10-12T15:59:59Z')),'2026-10-12');
  assert.equal(taipeiToday(new Date('2026-10-12T16:00:00Z')),'2026-10-13');
});
test('week starts Monday and includes Sunday',()=>{
  assert.deepEqual(periodRange('2026-10-13','week'),{start:'2026-10-12',end:'2026-10-18'});
  assert.deepEqual(periodRange('2026-10-18','week'),{start:'2026-10-12',end:'2026-10-18'});
  assert.deepEqual(periodRange('2026-10-19','week'),{start:'2026-10-19',end:'2026-10-25'});
});
test('weeks and navigation cross year boundaries',()=>{
  assert.deepEqual(periodRange('2027-01-01','week'),{start:'2026-12-28',end:'2027-01-03'});
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
  assert.deepEqual(selectEditions(editions,'2026-10-13','week').map(e=>e.date),['2026-10-18','2026-10-12']);
  assert.deepEqual(selectEditions(editions,'2026-10-13','day'),[]);
  assert.deepEqual(selectEditions(editions,'2026-10-12','day').map(e=>e.date),['2026-10-12']);
  assert.equal(editions[0].date,'2026-10-11');
});
