import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {groupMetrics,formatMetric,hasEnglishMetricUnit,stagesFor} from '../docs/viz.mjs';
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
 assert.equal(formatMetric({...metric,unit:'GPUs',current:4328},'zh'),'4,328 顆 GPU');
 assert.equal(formatMetric({...metric,unit:'GPUs',current:4328},'en'),'4,328 GPUs');
 assert.equal(formatMetric({...metric,unit:'racks',current:100},'zh'),'100 櫃');
 assert.equal(formatMetric({...metric,unit:'racks',current:100},'en'),'100 racks');
 assert.equal(formatMetric({...metric,unit:'USD billion',current:.086},'en'),'US$0.086B');
 assert.equal(formatMetric({...metric,unit:'USD billion',current:.086},'zh'),'0.86 億美元');
 assert.equal(formatMetric({...metric,unit:'USD billion',current:.000086},'en'),'US$0.000086B');
 assert.equal(formatMetric({...metric,unit:'JPY billion',current:115},'zh'),'1,150 億日圓');
 assert.equal(formatMetric({...metric,unit:'JPY billion',current:115},'en'),'¥115B');
});
test('PCB materials do not match PC systems',()=>{
 const story=zh=>({market:{industries:{zh}}});
 assert.ok(!stagesFor(story('銅箔材料；PCB；銅箔基板')).includes('systems'));
 assert.ok(stagesFor(story('PC；電源')).includes('systems'));
 assert.ok(stagesFor(story('伺服器 ODM')).includes('systems'));
});

test('Chinese count units have idiomatic English figure values',()=>{
 const named=(en,unit,current)=>({name:{zh:'數據',en},unit,current});
 assert.equal(formatMetric(named('Destinations named by the new control','個國家',5),'en'),'5 countries');
 assert.equal(formatMetric(named('GPUs in 52U rack','顆',96),'en'),'96 GPUs');
 assert.equal(formatMetric(named('Servers in 52U rack','台',12),'en'),'12 servers');
 assert.equal(formatMetric(named('Planned scalable CPU core count','個核心',32768),'en'),'32,768 cores');
 assert.equal(formatMetric(named('Customers receiving engineering tools','家',3),'en'),'3 customers');
 assert.equal(formatMetric(named('End-2027 monthly MEMS target','針',6000000),'en'),'6,000,000 needles');
 assert.equal(formatMetric(named('Q3 earnings per share','元',11.59),'en'),'NT$11.59');
 assert.equal(formatMetric(named('Planned factory output','萬張/月',915),'en'),'9,150,000 sheets/month');
 assert.equal(formatMetric(named('Q3 book-to-bill ratio','倍',1.64),'en'),'1.64×');
 assert.equal(formatMetric(named('Reported fatalities','人',1),'en'),'1 person');
 assert.equal(formatMetric(named('Preloaded images','張',100),'en'),'100 images');
 assert.equal(formatMetric(named('Additional chemical sensor systems','台',5000),'en'),'5,000 systems');
});
test('every archived metric has a translated English unit',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../docs/editions/index.json',import.meta.url),'utf8'));
 for(const entry of manifest.editions){
  const edition=JSON.parse(readFileSync(new URL('../docs/'+entry.path,import.meta.url),'utf8'));
  for(const story of edition.stories){
   for(const item of story.metrics||[]){
    const context=entry.date+' story '+story.id+' unit '+item.unit;
    assert.ok(hasEnglishMetricUnit(item.unit),'Unsupported English unit: '+context);
    assert.doesNotMatch(formatMetric(item,'en'),/\\p{Script=Han}/u,'Chinese characters in English figure: '+context);
   }
  }
 }
});
