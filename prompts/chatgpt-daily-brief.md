# Daily News Brief · 每日編採

排程固定指令：每天台北時間 08:00，以 aiwlulu 身分讀取 aiwlulu/daily-brief-site 最新 main 的 prompts/chatgpt-daily-brief.md，依下列規格查證並發布。回報刊期、篇數、部署結果與網址。若執行環境提供用量，分列模型輸入、輸出與工具用量。

## 取材與上下文

先取得 main 的 HEAD。從 https://aiwlulu.github.io/daily-brief-site/editor-context/index.json 取得最近刊期，再讀同目錄最新日的 YYYY-MM-DD.json，編週報時讀本週已有刊期的短索引與 docs/weeks/SUNDAY.json（若有）。若 Pages 尚在更新，以 main 當期資料為準。索引含 story ID、topic、事件日期、標題與已報導事實。只有追蹤事件或需要核對數字時才查該篇原文。檢查與匯出交由工作流程執行。

聚焦台灣、東南亞精密電源、半導體與封測、伺服器、資料中心電力與工廠供應鏈。境外事件需有直接區域關聯，排除印度與中亞。挑選重要且可核實的進展，通常 8–12 則，素材不足可減量。事件在過去 72 小時，或首次報導於過去 24 小時，舊資料註明日期。追蹤事件指出新增事實。實際開啟直接 HTTPS 來源，優先一手，重要或爭議說法尋找獨立佐證，受限時標明。核對日期、地點、歸屬、幣別、期間、比較與原話。只呈現事實、具名說法及不確定性。禁止公開提及 AEIS 或 Advanced Energy Industries。

## 一份草稿

在 drafts/YYYY-MM-DD 分支（以剛核對的 main 為基底）一次提交根目錄 daily-draft.json。只提交有變更的完整草稿。頂層為 edition、week；週日或新聞涉及展會時核對未來 60 天活動，若有更新才附完整 events（沿用 docs/events.json 結構、保留歷史、核對主辦來源）。日期均使用台北刊期。讀寫失敗時回報原因。

以下「雙語」為 {zh,en}，使用自然繁中與英文。數字與來源兩版一致。

- edition：date、generatedAt（實際 ISO 時間）、coverage {focus:雙語, approach:"facts-first"}、throughline（雙語）、brief（3–5 個 {id,text:雙語} 連到真實故事）、stories、verificationNote（雙語，限影響讀者理解的查證限制）。context 可附已核實的背景。深讀沿用 lead 正文；僅在有額外內容時提供 deep [{id,question:雙語,text:雙語}]。淘汰題材留在內部。
- story：整數 id、穩定 topic、category（tech/taiwan/global）、pick、depth（lead/standard，約三篇主稿）、雙語 title、summary、confidence、metricLabel、字串 metric、sections [{label:雙語,text:雙語}]、sources [{name:雙語,url,type}]。來源類型 First-hand、Second-hand 或 Source-limited。正文寫供應鏈背景、參與者與可比較數字。活動或專案有可查證地點時加雙語 location。ceoView 為雙語 2–3 句供應商待查事項，僅供 Excel，勿給投資建議或預測營收。
- market：eventDate、雙語 countries/industries/chain、changes 裡的雙語 investment/demand/fdi、facts 裡的雙語 relevance/timing/unknowns。尚未確認事項只寫在 unknowns，網站與 Excel 會接到段尾。
- metrics：無可核實數字時填 []。每筆含雙語 name/period/owner、數值 current、unit、sourceUrl（見 sources）、kind（如公司實績、產品規格、預測或官方統計）、comparison、base、basePeriod、reportedRate、baseStatus。比例用小數，缺乏明確可比基期用 null 並說明，勿反推。
- week：weekStart（週日）、generatedAt、雙語 throughline、highlights（最多 5 個 {id,category,title:雙語,summary:雙語,references:[{date,storyId}]}）。依重要性合併連續進展，每則只引用一次，限當週已發布及本次事件。

等候 Publish researched draft 與其觸發的 Deploy GitHub Pages 成功，核對線上日期與下載。驗證失敗只查對應步驟；若 main 已更新，先核對新內容再以新 main 為基底提交修訂草稿。Excel、索引和 Git 發布由 Actions 處理。
