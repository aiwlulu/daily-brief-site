// Run a copy of this file and export-data.mjs from an OS temp directory whose
// node_modules points to CODEX_PRIMARY_RUNTIME_NODE_MODULES. See AGENTS.md.
import fs from 'node:fs/promises';
import path from 'node:path';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
import {marketHeaders,metricHeaders,marketRow,collectMetrics,metricFormulas,weeklyRows} from './export-data.mjs';
const root=path.resolve(process.argv[2]||'.');
const date=process.argv[3];
if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))throw Error('Provide edition date');
const read=async file=>JSON.parse(await fs.readFile(path.join(root,'docs',file),'utf8'));
const manifest=await read('editions/index.json');
const {periodRange}=await import(path.join(root,'docs/dates.mjs'));
const weekStart=periodRange(date,'week').start;
const digest=await read(manifest.weeks[weekStart]);
const editions=await Promise.all(manifest.editions.filter(e=>periodRange(e.date,'week').start===weekStart).map(e=>read(e.path)));
const day=editions.find(e=>e.date===date);if(!day)throw Error('Edition missing');
const selectedKeys=new Set(digest.highlights.flatMap(h=>h.references.map(r=>r.date+':'+r.storyId)));
const weeklyEditions=editions.map(e=>({...e,stories:e.stories.filter(s=>selectedKeys.has(e.date+':'+s.id))}));
const output=path.join(root,'docs/exports');await fs.mkdir(output,{recursive:true});
const previews=process.env.BRIEF_PREVIEW_DIR; if(previews)await fs.mkdir(previews,{recursive:true});
const col=i=>{let s='';for(i++;i;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s;};
const noteRows=[
 ['欄位／方法','定義'],
 ['閱讀角度','Advanced Energy Industries (NASDAQ: AEIS)。半導體設備精密電源、資料中心電源、工業客戶與區域服務；影響為編輯分析。'],
 ['國家範圍','聚焦台灣與東南亞。美國等國家只在直接連結台灣供應鏈時列為關聯地點。'],
 ['日期','刊期與事件日期分欄。週報刊期欄為週起日，個別事件日期請查數值明細與日報。背景資料保留原發布時間。'],
 ['市場動向','日報每則一列。週報依精選五個主題合併，數值明細保留各事件。市場表連結至日報完整來源，數值表連結至原始數據。下載完整刊期，不受頁面搜尋篩選影響。'],
 ['數值與單位','數值為可計算儲存格，貨幣單位獨立。百分比底層為小數，顯示百分比。不同公司、期間、產品規格及計畫金額不可任意加總。'],
 ['Base','只填來源明示的同口徑基期。缺少則留空並註明，不從已四捨五入成長率反推精確基期。'],
 ['YoY / QoQ','分欄記錄來源公布的年增率與季增率。數值明細可能用不同列表示同一指標的不同比較口徑。'],
 ['變動計算','同口徑且基期可用時，金額變動＝本期減基期；變動率＝本期除基期減一。基期為零時變動率留空。'],
 ['百分點','比例或成長率的修訂以百分點表示。例如 GDP 預測由 10.35% 到 12.16%，增加 1.81 個百分點，並非年增 1.81%。'],
 ['資料性質','區分實績、官方估計、預測、公司目標、規劃與產品規格。規劃不是已實現 FDI，額定能力不是實際用電，職缺不是聘用。'],
 ['AEIS 影響','來源沒有披露 AEIS 訂單或影響金額時保持未知，不以市場增幅直接推算公司收入。'],
 ['背景資料','CoWoS 與美光屬本週追蹤；越南 FDI 於 10/3 發布，非今日新統計。'],
 ['來源限制',day.verificationNote.zh],
 ['AEIS 業務背景',day.perspective.source.url],
 ['資料更新',day.generatedAt]
];
async function create(period,marketRows,metricEditions){
 const wb=Workbook.create();
 const main=wb.worksheets.add('市場動向'),nums=wb.worksheets.add('數值明細'),notes=wb.worksheets.add('欄位說明');
 const numberRows=collectMetrics(metricEditions);
 function table(sheet,headers,rows,widths,name){
  const all=[headers,...rows],last=col(headers.length-1),end=all.length;
  sheet.showGridLines=false;
  const range=sheet.getRange(`A1:${last}${end}`);range.values=all;
  range.format.font={name:'Noto Sans CJK TC',size:12,color:'#203C34'};
  range.format.rowHeight=70;range.format.verticalAlignment='top';range.format.wrapText=true;
  headers.forEach((_,i)=>sheet.getRange(`${col(i)}1:${col(i)}${end}`).format.columnWidth=widths[i]||32);
  const header=sheet.getRange(`A1:${last}1`);header.format.fill='#193D34';header.format.font={name:'Noto Sans CJK TC',size:12,bold:true,color:'#FFFFFF'};header.format.rowHeight=42;header.format.horizontalAlignment='center';header.format.verticalAlignment='center';
  if(rows.length){
   const t=sheet.tables.add(`A1:${last}${end}`,true,name);
   // Use a neutral theme and explicit white fills so table data never picks
   // up the default alternating colors when opened in Excel.
   t.style='TableStyleLight1';t.showBandedColumns=false;t.showFilterButton=true;
   const body=sheet.getRange(`A2:${last}${end}`);
   body.format.fill='#FFFFFF';
   body.format.borders={insideHorizontal:{style:'thin',color:'#DCE4DE'}};
  }
  sheet.freezePanes.freezeRows(1);sheet.freezePanes.freezeColumns(3);
  return end;
 }
 table(main,marketHeaders,marketRows,[14,14,24,24,36,30,42,42,42,55,72,45,80,36,48,48,24,24,80],'MarketEvents');
 // A single clickable daily/weekly page exposes every direct source without
 // creating unreadable multi-URL cells. Numeric rows retain original URLs.
 for(let i=0;i<marketRows.length;i++){
  const key=marketRows[i][2],parts=key.split(':');
  const url=period==='day'?`https://aiwlulu.github.io/daily-brief-site/?view=day&date=${date}#story-${date}-${parts[1]}`:`https://aiwlulu.github.io/daily-brief-site/?view=week&date=${date}`;
  main.getRange(`S${i+2}`).formulas=[[`=HYPERLINK("${url}","完整來源與日報")`]];
 }
 main.getRange('S1').values=[['完整來源與日報連結']];main.getRange(`S1:S${marketRows.length+1}`).format.columnWidth=28;
 const end=table(nums,metricHeaders,numberRows,[14,14,24,24,36,32,25,38,18,18,38,18,18,19,19,20,20,20,44,40,70,80],'QuantitativeDetails');
 for(const sheet of [main,nums])if(sheet.getUsedRange().values.length>1)sheet.getRange(`A2:B${sheet.getUsedRange().values.length}`).setNumberFormat('yyyy-mm-dd');
 let n=2;
 for(const e of metricEditions)for(const s of e.stories)for(const m of s.metrics||[]){
  nums.getRange(`I${n}`).setNumberFormat(m.unit==='%'?'0.00%':'#,##0.00');
  nums.getRange(`L${n}`).setNumberFormat(m.unit==='%'?'0.00%':'#,##0.00');
  nums.getRange(`N${n}:O${n}`).setNumberFormat('0.0%');
  nums.getRange(`R${n}`).setNumberFormat('0.0%');
  nums.getRange(`P${n}:Q${n}`).setNumberFormat('#,##0.00');
  metricFormulas(n,m).forEach((f,i)=>{if(f)nums.getRange(`${col(15+i)}${n}`).formulas=[[f]];});n++;
 }
 table(notes,noteRows[0],noteRows.slice(1),[28,110],'FieldDefinitions');
 notes.freezePanes.unfreeze();notes.getRange('A2:B16').format.rowHeight=64;
 for(let i=0;i<numberRows.length;i++){
  const url=numberRows[i][21].replaceAll('"','""');nums.getRange(`V${i+2}`).formulas=[[`=HYPERLINK("${url}","${url}")`]];
 }
 for(const sh of [main,nums,notes])sh.getUsedRange().format.autofitRows();
 main.tabColor='#193D34';nums.tabColor='#719487';notes.tabColor='#D9DFD6';
 wb.recalculate();
 // Check real formulas and missing-base behavior, not only presence of formulas.
 const ci=numberRows.findIndex(r=>r[5]==='2026 年 GDP 成長預測');
 if(ci>=0){const point=nums.getRange(`Q${ci+2}`).values[0][0];if(Math.abs(point-1.81)>1e-9)throw Error('GDP percentage-point calculation failed');}
 if(numberRows.some((r,i)=>r[11]===null&&nums.getRange(`P${i+2}:R${i+2}`).values[0].some(v=>v!==null&&v!=='')))throw Error('Missing bases generated values');
 const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!',options:{useRegex:true,maxResults:10},maxChars:800});
 console.log(period,marketRows.length,'market rows,',numberRows.length,'numeric rows',errors.ndjson);
 const inspect=await wb.inspect({kind:'table',range:'數值明細!I1:R5',include:'values,formulas',tableMaxRows:5,tableMaxCols:10,maxChars:1300});console.log(inspect.ndjson);
 if(previews)for(const [sheet,range] of [['市場動向','A1:F4'],['數值明細','F1:R5'],['欄位說明','A1:B6']]){
  const png=await wb.render({sheetName:sheet,range,scale:1.3,format:'png'});await fs.writeFile(path.join(previews,period+'-'+sheet+'.png'),new Uint8Array(await png.arrayBuffer()));
 }
 const filename=period+'-'+(period==='day'?date:weekStart)+'.xlsx';
 await(await SpreadsheetFile.exportXlsx(wb)).save(path.join(output,filename));
 return './exports/'+filename;
}
const dayPath=await create('day',day.stories.map(s=>marketRow(day,s)),[day]);
const weekPath=await create('week',weeklyRows(digest,editions),weeklyEditions);
manifest.exports??={};manifest.exports.day??={};manifest.exports.week??={};
manifest.exports.day[date]=dayPath;manifest.exports.week[weekStart]=weekPath;
await fs.writeFile(path.join(root,'docs/editions/index.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Excel files and manifest generated');
