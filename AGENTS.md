# Repository instructions

All commit messages must follow Conventional Commits 1.0.0:
https://www.conventionalcommits.org/zh-hant/v1.0.0/

Use `<type>[optional scope][!]: <description>`. Use `feat` for features and `fix` for bug fixes. Separate an optional body and footer with blank lines. Mark breaking changes with `!` or a `BREAKING CHANGE:` footer.

Commit authorship for this repository should use the aiwlulu account. Do not import history from the old daily-brief repository.

## Editorial and interface requirements

- Chinese copy must use Traditional Chinese. Review daily editions, weekly digests and interface copy for simplified-character contamination before publication. Preserve valid shared characters and proper names such as 干擾, 核准 and 貝里斯; do not blindly convert all Chinese text.

- Publish verified bilingual daily editions from 2026-10-12 onward, retaining prior editions. Publish only dates that have actually been researched. Mark reconstructed editions and unresolved evidence explicitly.
- Treat Awwwards, Webby Awards and FWA as design aspirations, never claim award certification from self-assessment.
- Prefer custom SVG icons for actions; when icons would be ambiguous, use a short label such as 日, 週, EN or 中. Every icon-only control needs an accessible name and a custom tooltip.
- Use custom date, search and disclosure presentation, avoiding browser-default widget styling. Preserve semantic HTML, keyboard interaction and reduced-motion support. Do not use emoji.
- Keep asset versioning in the Pages workflow. Check generated module imports as well as raw source syntax. Load only the requested day or week, so growing archives do not require fetching all prior editions.
- Commit an edition and its manifest update atomically. Use Conventional Commits and aiwlulu authorship. Verify Actions status before saying publication succeeded.

Do not show internal recovery or editing status such as missing prior topics in the published edition. Omit unverified/unrecovered candidates; keep only reader-relevant caveats for published stories.

Weekly periods run Sunday through Saturday. Weekly view is a concise digest of at most 5 key themes across the published week, ranked by importance without category quotas. Merge continuing events, assign each referenced event only once, and provide short bilingual summaries linked to daily editions. Omit long analyses, memos, source lists and filter/search controls in weekly view. Update docs/weeks/SUNDAY.json and the manifest weeks mapping atomically with each daily publication; references must identify actual stories from the same week. Do not fabricate unpublished dates.

## Regional coverage and Excel

- Focus new coverage on Taiwan and Southeast Asia, excluding India and Central Asia. Foreign developments qualify only when directly relevant to these supply chains. Preserve historical editions as archives.
- Select industries related to Advanced Energy Industries (AEIS): precision/process power, semiconductor equipment, data-center power and industrial applications. This defines coverage only. Outside the Excel CEO lens below, do not adopt a CEO perspective, recommend supplier actions, evaluate opportunities/risks for the reader, or predict company revenue. The reader performs the analysis.
- Follow the chain from materials and equipment through wafer fabrication, HBM/DRAM/NAND, substrates and advanced packaging, test/burn-in, server ODMs, rack power and cooling, to end-use factories. Include only relevant supported links; distinguish actual events from dated background.
- Do not name AEIS or Advanced Energy Industries in public editions, weekly summaries, interface copy or Excel. Publish verified facts, attributed source claims, factual chain relationships, numbers and limitations. Omit editorial takeaways, recommendations, scenarios and investment/operating judgments.
- New stories need structured `market` fields for eventDate, bilingual countries/industries/chain, investment/demand/fdi changes and `facts` relevance/timing/unknowns. Add `metrics` only for supported figures, preserving owner, sourceUrl, period, unit, actual/forecast/plan/specification status, comparison, explicit base and base period. Rates are decimal numeric values, never prose parsing. Missing bases stay null with an explanation. Never reverse-engineer precise bases from rounded growth.
- Add bilingual `location` to event or project stories when verified. Include country, city and venue where available, identify whether it is the event venue or project site, and cite an inspected organizer or authoritative source. Never substitute company headquarters for an event location. Preserve material date discrepancies between sources.
- Publish `.xlsx` highlight downloads for the current day and the current curated week, in Traditional Chinese and English: `docs/exports/{day,week}-DATE.xlsx` and `{day,week}-DATE-en.xlsx`. The English interface downloads the English file.
- Each workbook has two sheets with the same layout and a title row, no explanatory note: 摘要版 / Summary (one row per story in website order, or per curated theme for the week; column A number; column B a bold headline, then the summary; column C 事件日期 / Event date as a typed date, or the list of event dates for a weekly theme) and 完整版 / Full (the same rows with the full reading paragraph from `story-copy.mjs`; the weekly Full sheet lists each referenced story under its theme order). No link column. Lead stories use a light fill. The Full sheet adds column D, 「AI 解讀」 / "AI interpretation", filled from `story.ceoView` on a pale amber background. Do not add market, numeric or field-definition sheets.
- Build with `python3 scripts/build-workbooks.py REPO_ROOT YYYY-MM-DD` (openpyxl; it calls `node scripts/story-paragraphs.mjs` for full paragraphs). It writes all four files and updates `manifest.exports`, `exportsEn`, `exportVersions` and `exportVersionsEn`. Use fonts that render bold on macOS and Windows (PingFang TC for Chinese, Calibri for English); fallback CJK fonts may drop bold.
- Excel downloads cover the complete period and are independent of search filters. Show the download only when a manifest export exists. Preserve prior downloads and map entries. `scripts/check-xlsx.py` must pass for every export. Download links include the matching version hash so browsers do not serve a cached older workbook.

## Daily reading and editorial depth

- Place the daily 30-second brief near the top, before story bodies and deeper-reading recommendations. New editions should include `brief: [{id, text: {zh,en}}]` with 3 to 5 concise points referencing actual story IDs. Preserve the fallback for older editions without this field.
- Show every story's source links directly below its summary, outside collapsed analysis. Preserve source-type labels, accessible names and custom vector icons.
- New editions use `coverage.approach: "facts-first"`. Omit story.takeaway, market.business and metric.impact. Keep market.facts.relevance/timing/unknowns bilingual. Do not impersonate another publication or copy its wording.
- Choose about 3 consequential lead stories with `depth: "lead"` for editorial importance and richer coverage. Start in Essentials mode with detailed sections closed. The Essentials / Full analysis switch collapses or expands all stories; individual overrides remain possible and must survive filtering and language changes. Weekly view remains concise and has no depth control.
- For leads, add verified background, named industry participants, source-attributed product and business facts, comparable numbers and known data gaps. Preserve depth through factual detail and source documents. Do not add decision scenarios, strategic implications, action recommendations or unsupported causal conclusions.
- Aim for newsletter-like reading richness with a concise entry layer. Preserve Traditional Chinese, bilingual factual agreement, source verification, compact weekly themes, date/search/language functionality and the custom loading skeleton.


## Story paragraph presentation

- Each daily story uses a bold headline followed inline by its event date (`market.eventDate`, labelled 事件 / Event) in a semantic time element; stories without an event date show the edition date. Use only verified timestamps if exact publication times are available; never invent hours or minutes.
- Render one continuous reading paragraph below the headline. Combine the news, verified industry/supply-chain context, venue and material limitations within that paragraph. Do not render separate metrics, editorial boxes or subsection headings. Source links remain immediately after the paragraph.
- Read more expands that same paragraph in place, retaining full source details and optional table figures as prose; Show less restores the shorter paragraph. Preserve global reading modes, individual overrides, search, language and complete print output. Keep the current factual-only coverage requirement, with no CEO role-play or decision advice.


## Visual reading aids

- Everything shown in the English interface must be English. Source names, metric `period` and metric `owner` use `{zh,en}` (older plain strings remain valid); calendar `source.name` likewise.

- Daily view shows an "At a glance" section after the brief: a supply-chain flow (upstream to downstream, with investment and policy as a separate band) and a table of every figure. Do not chart growth rates or values from different owners, periods or definitions side by side. Each story may show a chain-position strip and its figures after the source links; source links stay directly below the paragraph.
- Charts read only structured `metrics` and `market` fields. Same-unit metrics in a story are compared as bars; others become stat tiles with a status chip (actual, specification, target, forecast, estimate, plan, statistic, reported, statement). Never chart mismatched units or present growth rates from different owners as a ranking.
- Data marks use the validated series blue; comparison baselines use gray. Colour never carries meaning alone.
- Stories render leads first, then 30-second brief order, then the rest.

## Industry calendar

- `docs/events.json` feeds the 行事曆 view. Include major semiconductor, packaging, data-center and research events, emphasising Taiwan and Southeast Asia; foreign events qualify when directly relevant to these supply chains.
- The calendar view offers a schedule workbook (`docs/exports/events-UPDATED[-en].xlsx`): title, month bands, one row per event with dates, bold name with a one-line focus, region, venue and type; Taiwan and Southeast Asia rows are tinted and ended events are grey. Rebuild it with `python3 scripts/build-workbooks.py REPO_ROOT events` whenever `docs/events.json` changes (the date form rebuilds it too).
- Each event needs dates, region, type, bilingual name/place/focus and an inspected organizer or authoritative HTTPS source. Record material date or venue discrepancies in `focus`. Omit events whose dates cannot be verified. Update `updated` when checked.

## Interface defaults

- The interface defaults to English; the reader's language and light/dark choice persist per browser. Day is the default view and is omitted from URLs; `#sN` links to story N of the selected date. Print uses the browser command and the print stylesheet.

## Excel CEO lens (exception to facts-first)

- New stories include `ceoView {zh,en}`: 2 to 3 sentences on how the CEO of a U.S. company that designs, makes and sells precision power conversion, measurement and control instruments, or a related industry, might read the story: which customers, processes or products it touches, what that CEO would ask or verify next, and what is too uncertain to act on.
- Write it without mentioning a CEO or any role; phrase it from the supplier side (for example 對精密電源與量測設備業者而言, 值得追問的是).
- It appears only in the Excel Full sheet, in its own column labelled 「AI 解讀」 / "AI interpretation". The website, summaries and weekly digests stay facts-only.
- Never name AEIS or Advanced Energy Industries. Do not give investment advice, predict any company's revenue, or present the view as fact; tie it to facts already in the story and state uncertainty.

## Freshness

- Daily stories should cover events from the previous 72 hours of the edition date, or developments first reported in the previous 24 hours. Older statistics, plans or openings belong in `context` as dated background, not as stories, unless new information about them appeared in the last 24 hours, in which case the story says what is new.

## Writing style

- Paragraphs read as news, not audit notes: lead with what happened and why it matters, use natural transitions, and gather limitations at the end in one or two sentences. Avoid internal editing language (本期, 本文, 今日整合追蹤, 標為來源受限) and repeated "does not mean" caveats.
- The website shows location under the headline and verification confidence as a chip beside the category; paragraphs no longer append location, confidence or "label: figure" text. The Excel Full paragraph appends location at the end.
- The final section is labelled 尚未確認 / Still unknown and matches `market.facts.unknowns`, which is then not repeated.
