// Print full reading paragraphs for editions: {date: {storyId: {zh, en}}}.
// Usage: node scripts/story-paragraphs.mjs REPO_ROOT YYYY-MM-DD...
import fs from 'node:fs';
import path from 'node:path';
import {storyParagraph} from '../docs/story-copy.mjs';
const [root,...dates]=process.argv.slice(2);
const out={};
for(const date of dates){
 const edition=JSON.parse(fs.readFileSync(path.join(root,'docs/editions',date+'.json'),'utf8'));
 out[date]=Object.fromEntries(edition.stories.map(s=>{
  const story={...s,editionDate:date,sourceId:s.id};
  return [s.id,{zh:storyParagraph(story,'zh',true),en:storyParagraph(story,'en',true)}];
 }));
}
process.stdout.write(JSON.stringify(out));
