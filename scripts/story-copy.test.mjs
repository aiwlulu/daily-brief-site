import test from 'node:test';
import assert from 'node:assert/strict';
import {storyParagraph} from '../docs/story-copy.mjs';
const story={summary:{zh:'公布新產品。',en:'A product was announced.'},location:{zh:'台灣台北',en:'Taipei, Taiwan'},sections:[{label:{zh:'供應鏈'},text:{zh:'產品連結測試設備。',en:'The product connects to test equipment.'}},{label:{zh:'數據'},text:{zh:'公司稱額定能力為 10 kW。',en:'The company states a 10 kW rating.'}}],market:{facts:{unknowns:{zh:'未公布出貨量。',en:'Shipments are undisclosed.'}}},metric:'10 kW',metricLabel:{zh:'額定能力',en:'Rating'},confidence:{zh:'高',en:'High'}};
test('essentials combine news, industry context, venue and material unknowns without line breaks',()=>{
 const copy=storyParagraph(story,'zh');
 for(const phrase of ['公布新產品','產品連結測試設備','台灣台北','未公布出貨量'])assert.ok(copy.includes(phrase));
 assert.ok(!copy.includes('\n'));assert.ok(!copy.includes('10 kW'));
});
test('full paragraph preserves source figures, table values and limitations without repeating sections',()=>{
 const copy=storyParagraph({...story,table:[{zh:'營收',en:'Revenue',value:'USD 100'}],sections:[...story.sections,story.sections[1]]},'en',true);
 assert.equal(copy.split('The company states a 10 kW rating.').length-1,1);
 for(const phrase of ['Revenue: USD 100','Shipments are undisclosed','Verification confidence: High'])assert.ok(copy.includes(phrase));
 assert.ok(!copy.includes('\n'));
});
