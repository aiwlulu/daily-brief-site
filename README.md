# Daily Brief｜商業與科技日報

適合手機閱讀的中英文新聞日報。刊期自 2026 年 10 月 12 日起累積，中英文新聞與當週彙整皆可直接閱讀。

## 功能

* 當日／當週切換、日期導覽、中英文切換、分類篩選、文字搜尋。
* 每日新聞摘要、展開分析、來源連結與查證限制。
* 三則深讀推薦、產業脈絡、一頁分析備忘錄。
* 響應式版面、鍵盤操作、列印樣式。
* 純 HTML、CSS、JavaScript，無套件安裝或 API 金鑰。

## GitHub Pages

網站已部署：[Daily Brief](https://aiwlulu.github.io/daily-brief-site/)。

以下為部署設定：

1. 建立 Public Repo，建議名稱為 `daily-brief-site`。
2. 將此目錄的所有內容上傳到 `main`，保留 `.github/workflows/pages.yml`。
3. 開啟 **Settings → Pages → Build and deployment → Source → GitHub Actions**。
4. 在 **Actions → Deploy GitHub Pages → Run workflow** 執行首次部署。
5. 部署網址：[https://aiwlulu.github.io/daily-brief-site/](https://aiwlulu.github.io/daily-brief-site/)。

每次推送至 main 都會重新部署。GitHub Actions 負責驗證及部署；每日新聞由 ChatGPT 的 Daily News Brief 排程於台灣時間 08:00 開始蒐集、查證並透過 GitHub 連線寫入，完成時間依查證與部署而異。排程需要維持 GitHub 連線，並非 repo 內的 cron 或獨立新聞服務。

## 本機預覽

```sh
python3 -m http.server 8000 --directory docs
```

開啟 [本機預覽](http://localhost:8000/)。部署使用相對路徑，可放在專案型 Pages 子路徑。

## 更新內容

`docs/editions/YYYY-MM-DD.json` 儲存每日期刊內容，`docs/editions/index.json` 列出已發布日期，`docs/app.js` 處理互動，`docs/style.css` 管理版面。
新增刊期後，將日期與路徑加入 index.json，再執行 `npm test` 與 `node --check docs/app.js`。

當日依 Asia/Taipei 的日期選刊，當週為週一至週日，呈現最多 7 個跨日關鍵主題。未發布的日期會顯示空狀態並提供最新一期入口，不以舊新聞冒充今日新聞。網址保留 view 與 date，方便分享。每日期刊可持續累積；已收錄 2026-10-12 回溯補編與 2026-10-13 刊期。回溯補編明確標示重建範圍與未恢復來源，未來日期只在真正發布後出現。

新聞內容整理自使用者提供的日報。部分來源網址已重新檢索，尚未找回的原始連結會在頁面註明，不會將對話引用代碼當成網址。保留財報自結、效能宣稱及交易待核准等限制。

## 發布與品質

每日刊期與 index.json 應在同一筆提交更新，保留所有歷史刊期。提交遵循 Conventional Commits 1.0.0，使用 `feat(news): publish YYYY-MM-DD daily brief`，同日修正用 `fix(news): ...`。

刊期可含 `generatedAt`、`archiveType` 與中英文 `verificationNote`，供介面顯示更新時間、回溯補編與各期查證限制。品質目標涵蓋來源相關性、雙語一致性、資訊層次、客製化控制項、鍵盤操作、行動閱讀與減少動態效果，獎項水準作為設計方向，不代表獲獎認證。

固定閱讀網址：[Daily Brief](https://aiwlulu.github.io/daily-brief-site/)

當週：[本週關鍵精華](https://aiwlulu.github.io/daily-brief-site/?view=week)

## 週版精華

週版僅呈現最多 7 個跨日關鍵主題，每項包含精簡中英文摘要及每日版入口。長篇分析、備忘錄、分類搜尋及逐則來源列表保留在每日版。

`docs/weeks/YYYY-MM-DD.json` 以當週週一命名，透過 editions/index.json 的 `weeks` 對照表載入。每個 highlight 必須以 `references: [{date, storyId}]` 指向已存在的當週新聞。每日發布時一起更新當週精華與索引；未建立精華檔時，介面從當週新聞中選出最多 7 則推薦，依 topic 或相同英文標題合併重複項目。
