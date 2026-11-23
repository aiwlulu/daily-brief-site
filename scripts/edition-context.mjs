// The editor can read an individual day's short index without loading its full JSON.
import fs from 'node:fs';
const read = file => JSON.parse(fs.readFileSync('docs/' + file, 'utf8'));
const write = (file, value) => fs.writeFileSync('docs/editor-context/' + file, JSON.stringify(value) + '\n');
fs.mkdirSync('docs/editor-context', {recursive:true});
const {editions} = read('editions/index.json');
const recent = editions.map(e => e.date).sort().reverse().slice(0, 7);
for (const date of recent) {
  const {stories} = read('editions/' + date + '.json');
  write(date + '.json', stories.map(s => ({
    id:s.id, topic:s.topic, eventDate:s.market?.eventDate, title:s.title.zh, summary:s.summary.zh
  })));
}
write('index.json', recent);
