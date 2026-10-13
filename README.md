# Daily Brief｜商業與科技日報

適合手機閱讀的中英文新聞日報。目前收錄 2026 年 10 月 13 日期刊。

## 功能

* 當日／當週切換、日期導覽、中英文切換、分類篩選、文字搜尋。
* 11 則新聞摘要、展開分析、來源連結與查證限制。
* 三則深讀推薦、產業脈絡、一頁分析備忘錄。
* 響應式版面、鍵盤操作、列印樣式。
* 純 HTML、CSS、JavaScript，無套件安裝或 API 金鑰。

## GitHub Pages

1. 建立 Public Repo，建議名稱為 `daily-brief-site`。
2. 將此目錄的所有內容上傳到 `main`，保留 `.github/workflows/pages.yml`。
3. 開啟 **Settings → Pages → Build and deployment → Source → GitHub Actions**。
4. 在 **Actions → Deploy GitHub Pages → Run workflow** 執行首次部署。
5. 網址預期為 `https://aiwlulu.github.io/daily-brief-site/`，以部署結果為準。

每次推送至 main 都會重新部署。工作流程僅負責部署，不會自動抓新聞。

## 本機預覽

```sh
python3 -m http.server 8000 --directory docs
```

開啟 <http://localhost:8000>。部署使用相對路徑，可放在專案型 Pages 子路徑。

## 更新內容

`docs/editions/YYYY-MM-DD.json` 儲存每日期刊內容，`docs/editions/index.json` 列出已發布日期，`docs/app.js` 處理互動，`docs/style.css` 管理版面。
新增刊期後，將日期與路徑加入 index.json，再執行 `npm test` 與 `node --check docs/app.js`。

當日依 Asia/Taipei 的日期選刊，當週為週一至週日，依刊期由新到舊顯示。未發布的日期會顯示空狀態並提供最新一期入口，不以舊新聞冒充今日新聞。網址保留 view 與 date，方便分享。每日期刊可持續累積；目前只有 2026-10-13，尚未串接每日新聞自動產生流程。

新聞內容整理自使用者提供的日報。部分來源網址已重新檢索，尚未找回的原始連結會在頁面註明，不會將對話引用代碼當成網址。保留財報自結、效能宣稱及交易待核准等限制。
