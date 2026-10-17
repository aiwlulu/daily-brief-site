import test from 'node:test';
import assert from 'node:assert/strict';
import {metricFormulas,weeklyRows} from './export-data.mjs';
test('metric calculations preserve missing bases, zero and percentage points',()=>{
 assert.deepEqual(metricFormulas(5,{current:21.07,base:null,unit:'USD billion'}),[null,null,null]);
 assert.deepEqual(metricFormulas(6,{current:10,base:0,unit:'USD billion'}),['=I6-L6',null,null]);
 assert.deepEqual(metricFormulas(7,{current:.1216,base:.1035,unit:'%'}),[null,'=(I7-L7)*100',null]);
 assert.deepEqual(metricFormulas(8,{current:120,base:100,unit:'USD'}),['=I8-L8',null,'=I8/L8-1']);
});
test('weekly workbook has one row per curated theme and rejects missing references',()=>{
 const digest={weekStart:'2026-10-11',highlights:[{id:1,title:{zh:'主題'},summary:{zh:'合併'},references:[{date:'2026-10-17',storyId:1}]}]};
 assert.throws(()=>weeklyRows(digest,[]),/Missing weekly reference/);
 const rows=weeklyRows(digest,[{date:'2026-10-17',stories:[{id:1,title:{zh:'事件'},summary:{zh:'摘要'},confidence:{zh:'高'},sources:[{type:'First-hand',url:'https://example.com/source'}]}]}]);
 assert.equal(rows.length,1);assert.equal(rows[0][9],'主題');
});
