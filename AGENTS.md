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
- Select industries related to Advanced Energy Industries (AEIS): precision/process power, semiconductor equipment, data-center power and industrial applications. This defines coverage only. Do not adopt a CEO perspective, recommend supplier actions, evaluate opportunities/risks for the reader, or predict company revenue. The reader performs the analysis.
- Follow the chain from materials and equipment through wafer fabrication, HBM/DRAM/NAND, substrates and advanced packaging, test/burn-in, server ODMs, rack power and cooling, to end-use factories. Include only relevant supported links; distinguish actual events from dated background.
- Do not name AEIS or Advanced Energy Industries in public editions, weekly summaries, interface copy or Excel. Publish verified facts, attributed source claims, factual chain relationships, numbers and limitations. Omit editorial takeaways, recommendations, scenarios and investment/operating judgments.
- New stories need structured `market` fields for eventDate, bilingual countries/industries/chain, investment/demand/fdi changes and `facts` relevance/timing/unknowns. Add `metrics` only for supported figures, preserving owner, sourceUrl, period, unit, actual/forecast/plan/specification status, comparison, explicit base and base period. Rates are decimal numeric values, never prose parsing. Missing bases stay null with an explanation. Never reverse-engineer precise bases from rounded growth.
- Add bilingual `location` to event or project stories when verified. Include country, city and venue where available, identify whether it is the event venue or project site, and cite an inspected organizer or authoritative source. Never substitute company headquarters for an event location. Preserve material date discrepancies between sources.
- Publish actual `.xlsx` downloads for the current day and current curated week. Workbook sheets: 市場動向, 數值明細, 欄位說明. Weekly market rows must match the five curated themes, numeric details retain referenced events. Use typed dates/numbers, native filter tables, frozen identifiers and headers, explicit source links. Separate YoY, QoQ, absolute changes and percentage-point changes. Leave impact-assessment and personal-analysis columns blank for the reader.
- Generate workbooks with the Spreadsheets skill and `@oai/artifact-tool`. Copy `scripts/export-workbooks.mjs` and `scripts/export-data.mjs` into an OS temporary directory, link that directory's node_modules to CODEX_PRIMARY_RUNTIME_NODE_MODULES, then run the copied builder with CODEX_PRIMARY_RUNTIME_NODE and arguments REPO_ROOT YYYY-MM-DD. It writes docs/exports/day-YYYY-MM-DD.xlsx and week-SUNDAY.xlsx and updates manifest.exports. Set BRIEF_PREVIEW_DIR to render QA ranges. Validate the exported XLSX and all affected formulas. Publish both binaries, edition, weekly file and manifest atomically. Never publish a download path pointing to a missing file.
- Excel downloads represent the complete selected period and are independent of search filters. Show the download only when a corresponding manifest export exists. Preserve prior downloads and map entries.
- Excel body rows must use a uniform white background with subtle horizontal separators. Do not use alternating row colors or a banded table theme. Retain distinct column headers, native filters, typed values, formulas and frozen identifiers.
- Define final column-header text before creating Excel Tables. Never rename header cells afterward without updating table metadata. `scripts/check-xlsx.py` must pass for all exported files before publication; it validates OOXML relationships, table ranges and exact header agreement. Include it in local and Pages checks. A successful ZIP export or artifact preview alone does not establish Excel compatibility.
- Publish `manifest.exportVersions` hashes with updated XLSX files. Download links must include the matching hash so browsers do not serve a cached older or broken workbook.

## Daily reading and editorial depth

- Place the daily 30-second brief near the top, before story bodies and deeper-reading recommendations. New editions should include `brief: [{id, text: {zh,en}}]` with 3 to 5 concise points referencing actual story IDs. Preserve the fallback for older editions without this field.
- Show every story's source links directly below its summary, outside collapsed analysis. Preserve source-type labels, accessible names and custom vector icons.
- New editions use `coverage.approach: "facts-first"`. Omit story.takeaway, market.business and metric.impact. Keep market.facts.relevance/timing/unknowns bilingual. Do not impersonate another publication or copy its wording.
- Choose about 3 consequential lead stories with `depth: "lead"` for editorial importance and richer coverage. Start in Essentials mode with detailed sections closed. The Essentials / Full analysis switch collapses or expands all stories; individual overrides remain possible and must survive filtering and language changes. Weekly view remains concise and has no depth control.
- For leads, add verified background, named industry participants, source-attributed product and business facts, comparable numbers and known data gaps. Preserve depth through factual detail and source documents. Do not add decision scenarios, strategic implications, action recommendations or unsupported causal conclusions.
- Aim for newsletter-like reading richness with a concise entry layer. Preserve Traditional Chinese, bilingual factual agreement, source verification, compact weekly themes, date/search/language functionality and the custom loading skeleton.


## Story paragraph presentation

- Each daily story uses a bold headline followed inline by its edition date in a semantic time element. Use only verified timestamps if exact publication times are available; never invent hours or minutes.
- Render one continuous reading paragraph below the headline. Combine the news, verified industry/supply-chain context, venue and material limitations within that paragraph. Do not render separate metrics, editorial boxes or subsection headings. Source links remain immediately after the paragraph.
- Read more expands that same paragraph in place, retaining full source details and optional table figures as prose; Show less restores the shorter paragraph. Preserve global reading modes, individual overrides, search, language and complete print output. Keep the current factual-only coverage requirement, with no CEO role-play or decision advice.
