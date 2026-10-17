"""Build the day and week highlight workbooks in Chinese and English.

Usage: python3 scripts/build-workbooks.py REPO_ROOT YYYY-MM-DD
Writes docs/exports/{day,week}-DATE[-en].xlsx and updates the manifest.
"""
import datetime as dt
import hashlib
import json
import math
import sys
import unicodedata
from pathlib import Path

from openpyxl import Workbook
from openpyxl.cell.rich_text import CellRichText, TextBlock
from openpyxl.cell.text import InlineFont
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

SITE = 'https://aiwlulu.github.io/daily-brief-site/'
# PingFang TC has real bold weights on macOS; fallback CJK fonts often do not.
FONTS = {'zh': 'PingFang TC', 'en': 'Calibri'}
INK, TEXT, MUTED, BRAND, LINE, LEAD = '14322B', '3B4A44', '7A8780', '1F6B56', 'E3E6DF', 'F4F7EE'
WIDTH = {'A': 6, 'B': 88, 'C': 11}


def week_start(date):
    day = dt.date.fromisoformat(date)
    return (day - dt.timedelta(days=(day.weekday() + 1) % 7)).isoformat()


def short(date, lang):
    day = dt.date.fromisoformat(date)
    return f'{day.month}/{day.day}' if lang == 'zh' else day.strftime('%b ') + str(day.day)


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
    units = sum(2 if unicodedata.east_asian_width(c) in 'WF' else 0.95 for c in text)
    return max(1, math.ceil(units * size / 11 / (width * 1.1)))


def sheet(wb, lang, title, entries):
    font = FONTS[lang]
    ws = wb.active
    ws.title = '重點' if lang == 'zh' else 'Highlights'
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
    ws.row_dimensions[2].height = 6
    for col in 'ABC':
        ws[f'{col}2'].border = Border(bottom=Side(style='medium', color=INK))
    row = 3
    for i, e in enumerate(entries, 1):
        fill = PatternFill('solid', fgColor=LEAD if e['lead'] else 'FFFFFF')
        number = ws.cell(row, 1, f'{i:02d}')
        number.font = Font(name=font, size=12, bold=True, color=BRAND)
        number.alignment = Alignment(horizontal='center', vertical='top')
        body = ws.cell(row, 2)
        body.value = CellRichText(
            TextBlock(InlineFont(rFont=font, sz=13, b=True, color=INK), e['heading']),
            TextBlock(InlineFont(rFont=font, sz=11, color=MUTED), '   ' + e['time'] + '\n'),
            TextBlock(InlineFont(rFont=font, sz=11, color=TEXT), e['detail']),
        )
        body.alignment = Alignment(wrap_text=True, vertical='top')
        link = ws.cell(row, 3, '開啟 ›' if lang == 'zh' else 'Open ›')
        link.hyperlink = e['url']
        link.font = Font(name=font, size=11, color=BRAND, underline='single')
        link.alignment = Alignment(horizontal='center', vertical='top')
        ws.row_dimensions[row].height = (
            lines(e['heading'] + '   ' + e['time'], 13, WIDTH['B']) * 20
            + lines(e['detail'], 11, WIDTH['B']) * 16 + 10)
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


def save(entries, title, lang, path):
    wb = Workbook()
    sheet(wb, lang, title, entries)
    wb.properties.title = title
    wb.save(path)
    return hashlib.sha256(path.read_bytes()).hexdigest()[:12]


def main():
    root, date = Path(sys.argv[1]).resolve(), sys.argv[2]
    docs = root / 'docs'
    manifest_path = docs / 'editions/index.json'
    manifest = json.loads(manifest_path.read_text())
    read = lambda rel: json.loads((docs / rel).read_text())
    edition = read(next(e['path'] for e in manifest['editions'] if e['date'] == date))
    start = week_start(date)
    end = (dt.date.fromisoformat(start) + dt.timedelta(days=6)).isoformat()
    editions = {e['date']: read(e['path']) for e in manifest['editions'] if start <= e['date'] <= end}
    digest = read(manifest['weeks'][start])
    out = docs / 'exports'
    out.mkdir(exist_ok=True)
    for lang in ('zh', 'en'):
        suffix = '' if lang == 'zh' else '-en'
        day_entries = [{
            'heading': s['title'][lang], 'time': short(date, lang), 'detail': s['summary'][lang],
            'lead': s.get('depth') == 'lead',
            'url': f"{SITE}?lang={lang}&date={date}#s{s['id']}"} for s in ranked(edition)]
        week_entries = []
        for h in digest['highlights']:
            dates = sorted({r['date'] for r in h['references']})
            week_entries.append({
                'heading': h['title'][lang], 'time': ('、' if lang == 'zh' else ', ').join(short(d, lang) for d in dates),
                'detail': h['summary'][lang], 'lead': False,
                'url': f"{SITE}?lang={lang}&date={dates[-1]}"})
        if lang == 'zh':
            titles = (f'{date} 日報重點', f'{start} 至 {end} 週報重點')
        else:
            titles = (f'Daily Brief highlights · {date}', f'Weekly highlights · {start} to {end}')
        exports = manifest.setdefault('exports' if lang == 'zh' else 'exportsEn', {})
        versions = manifest.setdefault('exportVersions' if lang == 'zh' else 'exportVersionsEn', {})
        for period, key, entries, title in (('day', date, day_entries, titles[0]), ('week', start, week_entries, titles[1])):
            name = f'{period}-{key}{suffix}.xlsx'
            versions.setdefault(period, {})[key] = save(entries, title, lang, out / name)
            exports.setdefault(period, {})[key] = './exports/' + name
            print('Wrote', name)
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')


if __name__ == '__main__':
    main()
