"""Build highlight and calendar workbooks in Chinese and English.

Usage: python3 scripts/build-workbooks.py REPO_ROOT YYYY-MM-DD
       python3 scripts/build-workbooks.py REPO_ROOT events
Writes docs/exports/{day,week}-DATE[-en].xlsx and events-UPDATED[-en].xlsx
and updates the manifest. The date form also rebuilds the calendar.
"""
import datetime as dt
import hashlib
import json
import math
import subprocess
import sys
import unicodedata
from pathlib import Path

from openpyxl import Workbook
from openpyxl.cell.rich_text import CellRichText, TextBlock
from openpyxl.cell.text import InlineFont
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

# PingFang TC has real bold weights on macOS; fallback CJK fonts often do not.
FONTS = {'zh': 'PingFang TC', 'en': 'Calibri'}
INK, TEXT, MUTED, BRAND, LINE, LEAD = '14322B', '3B4A44', '7A8780', '1F6B56', 'E3E6DF', 'F4F7EE'
WIDTH = {'A': 6, 'B': 86, 'C': 13}
HEADS = {'zh': ('#', '新聞', '事件日期'), 'en': ('#', 'Story', 'Event date')}
DATE_FORMAT = {'zh': 'm/d', 'en': 'mmm d'}


def week_start(date):
    day = dt.date.fromisoformat(date)
    return (day - dt.timedelta(days=(day.weekday() + 1) % 7)).isoformat()


def short(date, lang):
    day = dt.date.fromisoformat(date)
    return f'{day.month}/{day.day}' if lang == 'zh' else day.strftime('%b ') + str(day.day)


def event_date(story, edition_date):
    # Event date when recorded; older stories fall back to the edition date.
    return story.get('market', {}).get('eventDate') or edition_date


def ranked(edition):
    # Same order as the website: leads, brief order, then the rest.
    brief = [b['id'] for b in edition.get('brief', [])]
    def key(item):
        i, s = item
        rank = 0 if s.get('depth') == 'lead' else 1 if s['id'] in brief else 2 if s.get('pick') else 3
        return rank, brief.index(s['id']) if s['id'] in brief else 99, i
    return [s for _, s in sorted(enumerate(edition['stories']), key=key)]


def lines(text, size, width):
    # Excel does not autofit wrapped rows on open, so estimate the height.
    units = sum(2 if unicodedata.east_asian_width(c) in 'WF' else 0.88 for c in text)
    return max(1, math.ceil(units * size / 11 / (width * 1.1)))


def sheet(ws, lang, title, entries, field):
    font = FONTS[lang]
    ws.sheet_view.showGridLines = False
    ws.sheet_view.zoomScale = 110
    for col, width in WIDTH.items():
        ws.column_dimensions[col].width = width
    ws.merge_cells('A1:C1')
    head = ws['A1']
    head.value = title
    head.font = Font(name=font, size=18, bold=True, color=INK)
    head.alignment = Alignment(vertical='center')
    ws.row_dimensions[1].height = 40
    # Column headers; the event date has its own column, separate from the edition.
    for col, text in enumerate(HEADS[lang], 1):
        cell = ws.cell(2, col, text)
        cell.font = Font(name=font, size=10, bold=True, color=MUTED)
        cell.border = Border(bottom=Side(style='medium', color=INK))
        cell.alignment = Alignment(horizontal='center' if col != 2 else 'left', vertical='bottom')
    ws.row_dimensions[2].height = 22
    row = 3
    for i, e in enumerate(entries, 1):
        fill = PatternFill('solid', fgColor=LEAD if e['lead'] else 'FFFFFF')
        number = ws.cell(row, 1, f'{i:02d}')
        number.font = Font(name=font, size=12, bold=True, color=BRAND)
        number.alignment = Alignment(horizontal='center', vertical='top')
        body = ws.cell(row, 2)
        body.value = CellRichText(
            TextBlock(InlineFont(rFont=font, sz=13, b=True, color=INK), e['heading'] + '\n'),
            TextBlock(InlineFont(rFont=font, sz=11, color=TEXT), e[field]),
        )
        body.alignment = Alignment(wrap_text=True, vertical='top')
        # One date is a typed Excel date; several (weekly themes) stay as text.
        when = ws.cell(row, 3, dt.date.fromisoformat(e['dates'][0]) if len(e['dates']) == 1
                       else ('、' if lang == 'zh' else ', ').join(short(d, lang) for d in e['dates']))
        when.number_format = DATE_FORMAT[lang]
        when.font = Font(name=font, size=11, bold=True, color=TEXT)
        when.alignment = Alignment(horizontal='center', vertical='top', wrap_text=True)
        ws.row_dimensions[row].height = (
            lines(e['heading'], 13, WIDTH['B']) * 20
            + lines(e[field], 11, WIDTH['B']) * 16 + 14)
        for col in range(1, 4):
            cell = ws.cell(row, col)
            cell.fill = fill
            cell.border = Border(bottom=Side(style='thin', color=LINE))
        row += 1
    ws.freeze_panes = 'A3'
    ws.print_title_rows = '1:2'
    ws.page_setup.orientation = 'portrait'
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.sheet_properties.tabColor = BRAND


SHEETS = {'zh': ('摘要版', '完整版'), 'en': ('Summary', 'Full')}


def save(summary, full, title, lang, path):
    # Summary sheet first for scanning; full sheet keeps the whole paragraph.
    wb = Workbook()
    first = wb.active
    first.title = SHEETS[lang][0]
    sheet(first, lang, title, summary, 'detail')
    second = wb.create_sheet(SHEETS[lang][1])
    sheet(second, lang, title, full, 'full')
    second.sheet_properties.tabColor = MUTED
    wb.properties.title = title
    wb.save(path)
    return hashlib.sha256(path.read_bytes()).hexdigest()[:12]


REGIONS = {'tw': ('台灣', 'Taiwan'), 'sea': ('東南亞', 'Southeast Asia'), 'nea': ('日韓', 'Japan & Korea'),
           'us': ('美國', 'United States'), 'eu': ('歐洲', 'Europe')}
TYPES = {'semiconductor': ('半導體', 'Semiconductor'), 'datacenter': ('資料中心', 'Data center'),
         'packaging': ('電路板與載板', 'PCB & substrate'), 'research': ('學術研討', 'Research'),
         'systems': ('電腦與系統', 'Computing systems')}
FOCUS_FILL, FOCUS_INK, PAST = 'E8F1FC', '1F5FAF', 'A3ACA7'


def date_range(start, end, lang):
    a, b = dt.date.fromisoformat(start), dt.date.fromisoformat(end)
    if lang == 'zh':
        return f'{a.month}/{a.day} – {b.month}/{b.day}'
    if a.month == b.month:
        return a.strftime('%b ') + f'{a.day}–{b.day}'
    return a.strftime('%b ') + str(a.day) + ' – ' + b.strftime('%b ') + str(b.day)


def schedule(data, lang, today, path):
    # Month-grouped schedule: dark month bands, one row per event.
    i = 0 if lang == 'zh' else 1
    font = FONTS[lang]
    wb = Workbook()
    ws = wb.active
    ws.title = '行事曆' if lang == 'zh' else 'Calendar'
    ws.sheet_view.showGridLines = False
    ws.sheet_view.zoomScale = 110
    widths = {'A': 17, 'B': 56, 'C': 15, 'D': 42, 'E': 15}
    for col, width in widths.items():
        ws.column_dimensions[col].width = width
    ws.merge_cells('A1:E1')
    ws['A1'] = '產業行事曆' if lang == 'zh' else 'Industry calendar'
    ws['A1'].font = Font(name=font, size=18, bold=True, color=INK)
    ws['A1'].alignment = Alignment(vertical='center')
    ws.row_dimensions[1].height = 36
    ws.merge_cells('A2:E2')
    ws['A2'] = (f"核對至 {data['updated']} · 藍色為台灣與東南亞" if lang == 'zh'
                else f"Checked {data['updated']} · Taiwan and Southeast Asia in blue")
    ws['A2'].font = Font(name=font, size=10, color=MUTED)
    ws.row_dimensions[2].height = 20
    heads = ('日期', '活動', '地區', '地點', '類型') if lang == 'zh' else ('Dates', 'Event', 'Region', 'Venue', 'Type')
    for col, text in enumerate(heads, 1):
        cell = ws.cell(3, col, text)
        cell.font = Font(name=font, size=10, bold=True, color=MUTED)
        cell.border = Border(bottom=Side(style='medium', color=INK))
        cell.alignment = Alignment(vertical='bottom')
    ws.row_dimensions[3].height = 22
    row, month = 4, None
    for e in sorted(data['events'], key=lambda e: e['start']):
        key = e['start'][:7]
        if key != month:
            month = key
            first = dt.date.fromisoformat(key + '-01')
            ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=5)
            band = ws.cell(row, 1, f'{first.year} 年 {first.month} 月' if lang == 'zh' else first.strftime('%B %Y'))
            band.font = Font(name=font, size=12, bold=True, color='FFFFFF')
            band.alignment = Alignment(vertical='center', indent=1)
            for col in range(1, 6):
                ws.cell(row, col).fill = PatternFill('solid', fgColor=INK)
            ws.row_dimensions[row].height = 24
            row += 1
        past = e['end'] < today
        focus = e['region'] in ('tw', 'sea')
        ink, text = (PAST, PAST) if past else (INK, TEXT)
        when = ws.cell(row, 1, date_range(e['start'], e['end'], lang))
        when.font = Font(name=font, size=12, bold=True, color=ink)
        name = e['name'][lang]
        detail = e['focus'][lang]
        event = ws.cell(row, 2)
        event.value = CellRichText(
            TextBlock(InlineFont(rFont=font, sz=12, b=True, color=ink), name + '\n'),
            TextBlock(InlineFont(rFont=font, sz=10, color=PAST if past else MUTED), detail))
        region = ws.cell(row, 3, REGIONS[e['region']][i])
        region.font = Font(name=font, size=11, bold=focus, color=PAST if past else FOCUS_INK if focus else text)
        place = ws.cell(row, 4, e['place'][lang])
        place.font = Font(name=font, size=11, color=text)
        kind = ws.cell(row, 5, TYPES[e['type']][i])
        kind.font = Font(name=font, size=10, color=PAST if past else MUTED)
        for col in range(1, 6):
            cell = ws.cell(row, col)
            cell.alignment = Alignment(wrap_text=True, vertical='top', indent=1 if col == 1 else 0)
            cell.border = Border(bottom=Side(style='thin', color=LINE))
            cell.fill = PatternFill('solid', fgColor=FOCUS_FILL if focus and not past else 'FFFFFF')
        ws.row_dimensions[row].height = max(
            lines(name, 12, widths['B']) * 18 + lines(detail, 10, widths['B']) * 14,
            lines(e['place'][lang], 11, widths['D']) * 16) + 12
        row += 1
    ws.freeze_panes = 'A4'
    ws.print_title_rows = '1:3'
    ws.page_setup.orientation = 'landscape'
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.sheet_properties.tabColor = BRAND
    wb.properties.title = ws['A1'].value
    wb.save(path)
    return hashlib.sha256(path.read_bytes()).hexdigest()[:12]


def build_calendar(docs, manifest):
    data = json.loads((docs / 'events.json').read_text())
    today = dt.datetime.now(dt.timezone(dt.timedelta(hours=8))).date().isoformat()
    for stale in (docs / 'exports').glob('events-*.xlsx'):
        stale.unlink()
    for lang, suffix, ekey, vkey in (('zh', '', 'exports', 'exportVersions'), ('en', '-en', 'exportsEn', 'exportVersionsEn')):
        name = f"events-{data['updated']}{suffix}.xlsx"
        manifest.setdefault(vkey, {})['events'] = {data['updated']: schedule(data, lang, today, docs / 'exports' / name)}
        manifest.setdefault(ekey, {})['events'] = {data['updated']: './exports/' + name}
        print('Wrote', name)


def main():
    root, date = Path(sys.argv[1]).resolve(), sys.argv[2]
    docs = root / 'docs'
    manifest_path = docs / 'editions/index.json'
    manifest = json.loads(manifest_path.read_text())
    (docs / 'exports').mkdir(exist_ok=True)
    build_calendar(docs, manifest)
    if date == 'events':
        manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
        return
    read = lambda rel: json.loads((docs / rel).read_text())
    edition = read(next(e['path'] for e in manifest['editions'] if e['date'] == date))
    start = week_start(date)
    end = (dt.date.fromisoformat(start) + dt.timedelta(days=6)).isoformat()
    editions = {e['date']: read(e['path']) for e in manifest['editions'] if start <= e['date'] <= end}
    digest = read(manifest['weeks'][start])
    paragraphs = json.loads(subprocess.run(
        ['node', str(root / 'scripts/story-paragraphs.mjs'), str(root), *editions],
        check=True, capture_output=True, text=True).stdout)
    out = docs / 'exports'
    out.mkdir(exist_ok=True)
    for lang in ('zh', 'en'):
        suffix = '' if lang == 'zh' else '-en'
        day_entries = [{
            'heading': s['title'][lang], 'dates': [event_date(s, date)], 'detail': s['summary'][lang],
            'full': paragraphs[date][str(s['id'])][lang],
            'lead': s.get('depth') == 'lead'} for s in ranked(edition)]
        week_entries, week_full = [], []
        for h in digest['highlights']:
            refs = [(r['date'], next(x for x in editions[r['date']]['stories'] if x['id'] == r['storyId'])) for r in h['references']]
            event_dates = sorted({event_date(story, d) for d, story in refs})
            week_entries.append({
                'heading': h['title'][lang], 'dates': event_dates,
                'detail': h['summary'][lang], 'lead': False})
            # Full weekly sheet: each referenced story under its theme, in theme order.
            for ref in sorted(h['references'], key=lambda r: r['date']):
                story = next(x for x in editions[ref['date']]['stories'] if x['id'] == ref['storyId'])
                week_full.append({
                    'heading': story['title'][lang], 'dates': [event_date(story, ref['date'])],
                    'full': paragraphs[ref['date']][str(ref['storyId'])][lang], 'lead': False})
        if lang == 'zh':
            titles = (f'{date} 日報重點', f'{start} 至 {end} 週報重點')
        else:
            titles = (f'Daily Brief highlights · {date}', f'Weekly highlights · {start} to {end}')
        exports = manifest.setdefault('exports' if lang == 'zh' else 'exportsEn', {})
        versions = manifest.setdefault('exportVersions' if lang == 'zh' else 'exportVersionsEn', {})
        for period, key, summary, full, title in (
                ('day', date, day_entries, day_entries, titles[0]),
                ('week', start, week_entries, week_full, titles[1])):
            name = f'{period}-{key}{suffix}.xlsx'
            versions.setdefault(period, {})[key] = save(summary, full, title, lang, out / name)
            exports.setdefault(period, {})[key] = './exports/' + name
            print('Wrote', name)
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')


if __name__ == '__main__':
    main()
