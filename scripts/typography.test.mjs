import test from 'node:test';
import assert from 'node:assert/strict';
import {formatZhText,formatChineseFields} from '../docs/typography.mjs';

test('Chinese text leaves spaces at Han, English and number boundaries', () => {
  assert.equal(
    formatZhText('NVIDIA公布11億美元，Gen2D完成測試，AI model的輸出。'),
    'NVIDIA 公布 11 億美元，Gen2D 完成測試，AI model 的輸出。'
  );
});
test('measurement units, decimals and embedded English punctuation are preserved', () => {
  assert.equal(formatZhText('2026年10月22日，誤差11.55%，記憶體20MB、延遲100ms。'),
    '2026 年 10 月 22 日，誤差 11.55%，記憶體 20MB、延遲 100ms。');
  assert.equal(formatZhText('採用Markdown、JSON等格式，format: JSON, size: 10MB。'),
    '採用 Markdown、JSON 等格式，format: JSON, size: 10MB。');
});
test('Chinese fields change without touching URLs, English or metric data', () => {
  const value={title:{zh:'AI資料中心9家',en:'Nine AI data centers'},metric:'11人',metrics:[{unit:'NTD billion',owner:{zh:'台積電TSMC',en:'TSMC'},sourceUrl:'https://example.com/news?date=2026-10-22'}]};
  const out=formatChineseFields(value);
  assert.equal(out.title.zh,'AI 資料中心 9 家');
  assert.equal(out.title.en,value.title.en);
  assert.equal(out.metric,'11 人');
  assert.equal(out.metrics[0].unit,'NTD billion');
  assert.equal(out.metrics[0].sourceUrl,value.metrics[0].sourceUrl);
  assert.equal(out.metrics[0].owner.zh,'台積電 TSMC');
});
test('formatter is idempotent',()=>{
  const value='NVIDIA公布11億美元，HBM記憶體11.55%，計畫2027年第2季開出。';
  assert.equal(formatZhText(formatZhText(value)),formatZhText(value));
});
