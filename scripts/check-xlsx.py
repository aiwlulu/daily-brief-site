"""Check exported OOXML relationships and Excel table/header consistency."""
import argparse
import json
import posixpath
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
REL = 'http://schemas.openxmlformats.org/package/2006/relationships'
OFFICE_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
NS = {'x': MAIN}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def resolve_target(part, target):
    return posixpath.normpath(target.lstrip('/') if target.startswith('/') else posixpath.join(posixpath.dirname(part), target))


def rels_path(part):
    return posixpath.join(posixpath.dirname(part), '_rels', posixpath.basename(part) + '.rels')


def column_number(letters):
    result = 0
    for letter in letters:
        result = result * 26 + ord(letter) - ord('A') + 1
    return result


def validate(filename):
    with zipfile.ZipFile(filename) as archive:
        require(archive.testzip() is None, 'ZIP checksum failure')
        names = archive.namelist()
        require(len(names) == len(set(names)), 'Duplicate ZIP entries')
        parts = {name: ET.fromstring(archive.read(name)) for name in names if name.endswith(('.xml', '.rels'))}
        require('[Content_Types].xml' in parts and '_rels/.rels' in parts, 'Missing OOXML package metadata')
        relationships = {}
        for name, root in parts.items():
            if not name.endswith('.rels'):
                continue
            source = '' if name == '_rels/.rels' else posixpath.join(posixpath.dirname(posixpath.dirname(name)), posixpath.basename(name)[:-5])
            entries = {}
            for relationship in root.findall('{' + REL + '}Relationship'):
                ident = relationship.attrib['Id']
                require(ident not in entries, 'Duplicate relationship ID in ' + name)
                if relationship.get('TargetMode') == 'External':
                    continue
                target = resolve_target(source, relationship.attrib['Target'])
                require(target in parts, 'Missing relationship target: ' + target)
                entries[ident] = target
            relationships[source] = entries
        workbook_path = next((resolve_target('', rel.attrib['Target']) for rel in parts['_rels/.rels'] if rel.get('Type', '').endswith('/officeDocument')), None)
        require(workbook_path in parts, 'Missing workbook relationship')
        workbook = parts[workbook_path]
        shared = parts.get('xl/sharedStrings.xml')
        strings = [''.join(si.itertext()) for si in shared] if shared is not None else []

        def cell_text(cell):
            if cell is None:
                return ''
            value = cell.findtext('x:v', default='', namespaces=NS)
            if cell.get('t') == 's':
                return strings[int(value)]
            if cell.get('t') == 'inlineStr':
                return ''.join(cell.find('x:is', NS).itertext())
            return value

        all_table_names = set()
        all_table_ids = set()
        sheet_names = set()
        table_count = 0
        for sheet in workbook.findall('x:sheets/x:sheet', NS):
            name = sheet.attrib['name']
            require(name.casefold() not in sheet_names, 'Duplicate sheet name')
            sheet_names.add(name.casefold())
            sheet_path = relationships[workbook_path].get(sheet.get('{' + OFFICE_REL + '}id'))
            require(sheet_path in parts, 'Missing worksheet: ' + name)
            worksheet = parts[sheet_path]
            cells = {cell.attrib['r']: cell for cell in worksheet.findall('x:sheetData/x:row/x:c', NS)}
            for address, cell in cells.items():
                require(cell.get('t') != 'e', f'{name}!{address}: cached formula error')
                require('is not implemented.' not in cell_text(cell), f'{name}!{address}: unsupported formula diagnostic in saved value')
            for table_ref in worksheet.findall('x:tableParts/x:tablePart', NS):
                target = relationships.get(sheet_path, {}).get(table_ref.get('{' + OFFICE_REL + '}id'))
                require(target in parts, 'Missing table part in ' + name)
                table = parts[target]
                table_name = table.attrib['displayName']
                require(table_name.casefold() not in all_table_names, 'Duplicate table name')
                require(table.attrib['id'] not in all_table_ids, 'Duplicate table ID')
                all_table_names.add(table_name.casefold())
                all_table_ids.add(table.attrib['id'])
                match = re.fullmatch(r'([A-Z]+)(\d+):([A-Z]+)(\d+)', table.attrib['ref'])
                require(match is not None, 'Invalid table range: ' + table.attrib['ref'])
                start_col, start_row, end_col, end_row = match.groups()
                columns = table.find('x:tableColumns', NS)
                expected_width = column_number(end_col) - column_number(start_col) + 1
                require(len(columns) == expected_width == int(columns.attrib['count']), 'Table column count mismatch')
                require(len({column.get('name', '').casefold() for column in columns}) == expected_width, 'Duplicate table column names')
                header_cells = [(column_number(re.match(r'[A-Z]+', address).group()), cell_text(cell)) for address, cell in cells.items() if re.search(r'\d+$', address).group() == start_row]
                header_map = dict(header_cells)
                for offset, column in enumerate(columns):
                    expected = column.attrib['name']
                    actual = header_map.get(column_number(start_col) + offset, '')
                    require(actual == expected, f'{name}/{table_name}: header {offset + 1} is {actual!r}, table metadata says {expected!r}')
                autofilter = table.find('x:autoFilter', NS)
                require(autofilter is None or autofilter.get('ref') == table.get('ref'), 'Table filter range mismatch')
                table_count += 1
        return len(sheet_names), table_count


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--file', action='append', default=[])
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    manifest = json.loads((root / 'docs/editions/index.json').read_text())
    paths = [Path(p) for p in args.file] if args.file else [root / 'docs' / p for key in ('exports', 'exportsEn') for entries in manifest.get(key, {}).values() for p in entries.values()]
    try:
        for path in paths:
            sheets, tables = validate(path)
            print(f'PASS: {path.name}: {sheets} worksheets, {tables} Excel tables and valid package relationships.')
    except (ValueError, KeyError, ET.ParseError, zipfile.BadZipFile) as error:
        print('FAIL: ' + str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
