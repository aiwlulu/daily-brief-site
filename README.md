# Daily Brief｜商業與科技日報

聚焦台灣與東南亞半導體、封裝、記憶體、伺服器、資料中心電源與終端工廠供應鏈的中英雙語日報。每天整理經查證的事實、數字與來源，並把分析留給讀者。

- 當日：[aiwlulu.github.io/daily-brief-site](https://aiwlulu.github.io/daily-brief-site/)
- 當週精華：[?view=week](https://aiwlulu.github.io/daily-brief-site/?view=week)
- 產業行事曆：[?view=events](https://aiwlulu.github.io/daily-brief-site/?view=events)

刊期自 2026-10-12 起累積，歷史刊期全部保留。

## 功能

**閱讀**
- 30 秒 Brief：3 至 5 個重點放在最上方，點選即跳到該則新聞
- 新聞排序：主稿、Brief 順序、其餘新聞；每則為粗體標題加刊期日期，下方一段完整說明，來源連結緊接在段落後
- 重點摘要／深度閱讀全域切換，每則也可單獨展開或收合
- 分類篩選與文字搜尋

**視覺化**
- 數據一覽：供應鏈上下游流程圖、公布成長率並列、前後比較，每張圖都可切換成資料表
- 每則新聞：供應鏈位置條、同單位數字橫條比較、標示資料性質的數字卡（實績、規格、目標、預測、規劃等）
- 產業行事曆：月份總覽與月份清單，可依地區篩選，台灣與東南亞活動以色彩標示

**介面**
- 中英文切換（預設英文），淺色／深色主題；兩者都會記在瀏覽器
- 自訂日曆、日期導覽與向量圖示，支援鍵盤操作、螢幕閱讀器與減少動態效果
- 響應式版面，列印時自動展開全文

**Excel 下載**
- 當日與當週各一份，依刊期完整匯出，不受頁面搜尋篩選影響
- 工作表依序為：重點、摘要明細、市場動向、數值明細、欄位說明

## 網址

| 用途 | 格式 |
| --- | --- |
| 指定日期 | `?date=2026-10-17` |
| 跳到該日第 N 則 | `?date=2026-10-17#s12` |
| 當週 | `?view=week&date=2026-10-17` |
| 行事曆 | `?view=events` |

舊格式 `?view=day&date=…#story-2026-10-17-12` 仍可使用。

## 內容如何產生

1. ChatGPT「Daily News Brief」排程於台灣時間 08:00 開始蒐集、查證並撰寫刊期，指令見 [`prompts/chatgpt-daily-brief.md`](prompts/chatgpt-daily-brief.md)。
2. 排程透過 GitHub 連線，以一筆提交同時寫入當日刊期、週精華、索引與 Excel。
3. 推送到 `main` 後，GitHub Actions 執行檢查、為資源加上版本號，再部署到 GitHub Pages。

排程需要維持 GitHub 連線；repo 內沒有 cron 或獨立新聞服務。完成時間依查證與部署而異。

## 專案結構

```text
docs/                    網站（GitHub Pages 發布此目錄）
  index.html             頁面骨架與載入畫面
  app.js                 狀態、載入與渲染
  viz.mjs                數據圖表、供應鏈圖與數字卡
  events.mjs             產業行事曆
  calendar.mjs           日期選擇器
  story-copy.mjs         組合每則新聞的單一段落
  weekly.mjs             沒有週精華檔時的備援選題
  dates.mjs / icons.mjs  日期工具與 SVG 圖示
  style.css              版面、主題與列印樣式
  editions/              每日刊期 YYYY-MM-DD.json 與索引 index.json
  weeks/                 週精華，以週日日期命名
  events.json            產業行事曆資料
  exports/               Excel 下載檔
scripts/                 檢查、測試、Excel 匯出與部署前處理
prompts/                 ChatGPT 排程指令（不部署）
AGENTS.md                內容、資料結構與介面的正式規格
```

## 資料檔

- **刊期** `docs/editions/YYYY-MM-DD.json`：throughline、brief、stories、deep、context、lower、verificationNote 等欄位。新刊期的每則新聞需包含 `market`（日期、國家、產業、供應鏈環節、投資／需求／FDI 變化、事實與未知事項）；有數字時加入 `metrics`。圖表直接讀取這兩個欄位。
- **索引** `docs/editions/index.json`：已發布刊期、週精華對照 `weeks`、Excel 路徑 `exports` 與快取用雜湊 `exportVersions`。
- **週精華** `docs/weeks/YYYY-MM-DD.json`：週日至週六，最多 5 個跨日主題，每個主題以 `references: [{date, storyId}]` 指向當週已發布的新聞。沒有週精華檔時，介面會從當週新聞選出最多 5 則。
- **行事曆** `docs/events.json`：每個活動需有日期、地區、類型、中英文名稱／地點／重點，以及實際查閱過的官方或權威來源。

欄位細節與撰寫規範以 [`AGENTS.md`](AGENTS.md) 為準。

## 本機預覽與檢查

```sh
python3 -m http.server 8000 --directory docs
```

開啟 <http://localhost:8000/>。網站使用相對路徑，可部署在 Pages 子路徑。

```sh
npm test
```

`npm test` 會依序執行：
- `scripts/check.mjs`：刊期、週精華、行事曆、索引與介面元素
- `scripts/check-xlsx.py`：Excel 的 OOXML 關聯、表格範圍與表頭一致性
- `scripts/*.test.mjs`：日期、段落組合與匯出資料的單元測試

網站本身是純 HTML、CSS 與 JavaScript，不需要安裝套件或 API 金鑰。

## Excel 匯出

`scripts/export-workbooks.mjs` 使用 Codex 執行環境的 `@oai/artifact-tool` 產生活頁簿，接著執行：
- `scripts/summary-data.mjs`：產生閱讀用摘要資料
- `scripts/finish-workbook.py`：加入「重點」與「摘要明細」工作表，並把日報連結縮短成可點擊文字（需要 python3 與 openpyxl）

完成後會更新 `manifest.exports` 與 `exportVersions`。完整步驟見 `AGENTS.md`。

## 部署

1. 建立 Public Repo `daily-brief-site`，並保留 `.github/workflows/pages.yml`。
2. 在 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**。
3. 首次部署可在 **Actions → Deploy GitHub Pages → Run workflow** 手動執行；之後每次推送到 `main` 都會自動部署。

工作流程依序為：執行與 `npm test` 相同的檢查、以 `scripts/prepare-pages.mjs` 為 CSS／JS／模組匯入加上內容雜湊，然後上傳並部署 `docs/`。

## 提交規範

- 遵循 [Conventional Commits 1.0.0](https://www.conventionalcommits.org/zh-hant/v1.0.0/)，使用 aiwlulu 帳號
- 每日發布：`feat(news): publish YYYY-MM-DD daily brief`
- 同日修正：`fix(news): update YYYY-MM-DD verified coverage`
- 刊期、週精華、索引與 Excel 須在同一筆提交更新

## 編輯原則

- 事實優先：只發布查證過的事實、標明出處的說法、數字與資料缺口；不提供建議、情境推演或投資判斷
- 來源：只收錄實際開啟過的 HTTPS 連結；重要說法以一手來源為主，並盡量取得獨立第二來源
- 數字：標明發布者、期間、單位與資料性質（實績、預測、規劃、規格），百分比與百分點分開，不從四捨五入的成長率反推基期
- 中文使用繁體，發布前檢查簡體字

Awwwards、Webby、FWA 等獎項只作為設計方向，不代表獲獎或認證。
