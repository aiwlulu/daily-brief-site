import test from 'node:test';
import assert from 'node:assert/strict';
import {groupMetrics,formatMetric,stagesFor} from '../docs/viz.mjs';
const metric={unit:'USD billion',owner:{zh:'公司',en:'Company'},period:{zh:'第三季',en:'Q3'},kind:'公司實績',current:1};
test('unlike growth and inflation percentages stay separate',()=>{
 const values=[.10,.045,.086].map(current=>({...metric,unit:'%',current}));
 assert.deepEqual(groupMetrics(values).map(g=>g.length),[1,1,1]);
});
test('absolute comparisons require matching period, owner and status',()=>{
 const values=[metric,{...metric,current:.2},{...metric,period:{zh:'第四季',en:'Q4'}},{...metric,owner:{zh:'另一公司',en:'Other company'}},{...metric,kind:'公司目標'}];
 assert.deepEqual(groupMetrics(values).map(g=>g.length),[2,1,1,1]);
});
test('physical capacity and area units have bilingual display text',()=>{
 assert.equal(formatMetric({...metric,unit:'wafers/month',current:6000},'zh'),'6,000 片／月');
 assert.equal(formatMetric({...metric,unit:'tonnes/year',current:700000},'en'),'700,000 tonnes/year');
 assert.equal(formatMetric({...metric,unit:'designs',current:6},'en'),'6 chip designs');
 assert.equal(formatMetric({...metric,unit:'acres',current:430},'zh'),'430 英畝');
 assert.equal(formatMetric({...metric,unit:'turbines',current:4},'en'),'4 turbines');
 assert.equal(formatMetric({...metric,unit:'turbines',current:4},'zh'),'4 部風機');
 assert.equal(formatMetric({...metric,unit:'JPY billion',current:115},'zh'),'1,150 億日圓');
 assert.equal(formatMetric({...metric,unit:'JPY billion',current:115},'en'),'¥115B');
});
test('PCB materials do not match PC systems',()=>{
 const story=zh=>({market:{industries:{zh}}});
 assert.ok(!stagesFor(story('銅箔材料；PCB；銅箔基板')).includes('systems'));
 assert.ok(stagesFor(story('PC；電源')).includes('systems'));
 assert.ok(stagesFor(story('伺服器 ODM')).includes('systems'));
});
