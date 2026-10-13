# Repository instructions

All commit messages must follow Conventional Commits 1.0.0:
https://www.conventionalcommits.org/zh-hant/v1.0.0/

Use `<type>[optional scope][!]: <description>`. Use `feat` for features and `fix` for bug fixes. Separate an optional body and footer with blank lines. Mark breaking changes with `!` or a `BREAKING CHANGE:` footer.

Commit authorship for this repository should use the aiwlulu account. Do not import history from the old daily-brief repository.

## Editorial and interface requirements

- Publish verified bilingual daily editions from 2026-10-12 onward, retaining prior editions. Publish only dates that have actually been researched. Mark reconstructed editions and unresolved evidence explicitly.
- Treat Awwwards, Webby Awards and FWA as design aspirations, never claim award certification from self-assessment.
- Prefer custom SVG icons for actions; when icons would be ambiguous, use a short label such as 日, 週, EN or 中. Every icon-only control needs an accessible name and a custom tooltip.
- Use custom date, search and disclosure presentation, avoiding browser-default widget styling. Preserve semantic HTML, keyboard interaction and reduced-motion support. Do not use emoji.
- Keep asset versioning in the Pages workflow. Check generated module imports as well as raw source syntax. Load only the requested day or week, so growing archives do not require fetching all prior editions.
- Commit an edition and its manifest update atomically. Use Conventional Commits and aiwlulu authorship. Verify Actions status before saying publication succeeded.
