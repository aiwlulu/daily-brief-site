"""Materialize a researched draft in a disposable checkout before validation."""
import datetime as dt
import json
import sys
from pathlib import Path


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def prepare(root, draft, day):
    date = dt.date.fromisoformat(day)
    if date.isoformat() != day or draft['edition']['date'] != day:
        raise ValueError('Edition date must match the draft branch')
    week = (date - dt.timedelta(days=(date.weekday() + 1) % 7)).isoformat()
    if draft['week']['weekStart'] != week:
        raise ValueError('Weekly digest must start on the Sunday of this edition')
    edition = draft['edition']
    edition.setdefault('deep', [])
    edition.setdefault('context', [])
    edition.setdefault('memo', {'title': {'zh': '', 'en': ''}, 'items': []})
    edition['lower'] = []
    if edition['coverage']['approach'] != 'facts-first' or not edition['brief']:
        raise ValueError('Provide facts-first coverage and a linked brief')
    for story in edition['stories']:
        if not all(story['ceoView'].get(lang) for lang in ('zh', 'en')):
            raise ValueError(f"Missing Excel interpretation for story {story['id']}")
    docs = root / 'docs'
    manifest_path = docs / 'editions/index.json'
    manifest = json.loads(manifest_path.read_text())
    day_path = f'./editions/{day}.json'
    week_path = f'./weeks/{week}.json'
    write(docs / day_path, edition)
    write(docs / week_path, draft['week'])
    if 'events' in draft:
        write(docs / 'events.json', draft['events'])
    entries = {e['date']: e for e in manifest['editions']}
    entries[day] = {'date': day, 'path': day_path}
    manifest['editions'] = [entries[key] for key in sorted(entries, reverse=True)]
    manifest['weeks'][week] = week_path
    write(manifest_path, manifest)


if __name__ == '__main__':
    prepare(Path.cwd(), json.load(sys.stdin), sys.argv[1])
