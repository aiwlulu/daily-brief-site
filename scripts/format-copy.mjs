// Format a researched edition and its current weekly digest before workbook generation.
// Usage: node scripts/format-copy.mjs YYYY-MM-DD
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {formatChineseFields} from '../docs/typography.mjs';

const date=process.argv[2];
if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))throw new Error('Expected a YYYY-MM-DD edition date');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const day=new Date(date+'T12:00:00Z');
if(Number.isNaN(day.valueOf()))throw new Error('Invalid date');
const weekDate=new Date(day);
weekDate.setUTCDate(day.getUTCDate()-((day.getUTCDay()+7)%7));
const week=weekDate.toISOString().slice(0,10);
const files=[path.join(root,'docs','editions',date+'.json'),path.join(root,'docs','weeks',week+'.json')];
for(const filename of files){
  const original=fs.readFileSync(filename,'utf8');
  const data=JSON.parse(original),formatted=formatChineseFields(data);
  if(JSON.stringify(formatted)===JSON.stringify(data)){console.log('Already formatted:',path.basename(filename));continue;}
  formatted.generatedAt=new Date().toISOString();
  fs.writeFileSync(filename,JSON.stringify(formatted,null,2)+'\n');
  console.log('Formatted:',path.basename(filename));
}
