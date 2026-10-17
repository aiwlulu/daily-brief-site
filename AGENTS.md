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

Weekly view is a concise digest of at most 7 key themes across the published week. Merge related events and provide short bilingual summaries linked to daily editions. Omit long analyses, memos, source lists and filter/search controls in weekly view. Update docs/weeks/MONDAY.json and the manifest weeks mapping atomically with each daily publication; references must identify actual stories from the same week.

## Daily reading and editorial depth

- Place the daily 30-second brief near the top, before story bodies and deeper-reading recommendations. New editions should include `brief: [{id, text: {zh,en}}]` with 3 to 5 concise points referencing actual story IDs. Preserve the fallback for older editions without this field.
- Show every story's source links directly below its summary, outside collapsed analysis. Preserve source-type labels, accessible names and custom vector icons.
- New stories should include `takeaway: {zh,en}`: a short, grounded editorial interpretation, distinct from reported facts. Do not impersonate another publication's writer or copy its wording.
- Choose about 3 consequential lead stories with `depth: "lead"`; open their detailed analysis by default while allowing readers to close it. Other stories may use `depth: "standard"`. Keep the user's open/closed choices when filtering or changing language.
- For leads, develop the relevant background, revenue and cost mechanics, competitors or substitutes, value-chain implications, contrary evidence and concrete next checkpoints. Prefer connected explanations over repetitive checklist headings. Use only applicable angles and supported numbers; label hypotheses and examples clearly.
- Aim for newsletter-like reading richness with a concise entry layer. Preserve Traditional Chinese, bilingual factual agreement, source verification, compact weekly themes, date/search/language functionality and the custom loading skeleton.

