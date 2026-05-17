# OpenSEO — Agent Instructions

## Commands

```
pnpm install          # install (uses shamefully-hoist=true)
pnpm build            # turbo build — all packages
pnpm dev              # turbo dev (watch mode)
pnpm lint             # turbo lint
pnpm typecheck        # dependsOn ^build — run build first or together
pnpm test             # dependsOn build — vitest
pnpm clean            # turbo clean
pnpm format           # prettier --write .
```

To build one package: `turbo build --filter=@openseo/cli`

## Architecture

- **5 packages** under `@openseo/*` scope. `packages/cli` is the entry (bin: `openseo`).
- CLI = Ink (React 19) TUI + Zustand state. Screen routing via `useAppState().screen`.
- `@openseo/core` — shared detection engine + `AuditIssue`/`AuditResult` types.
- `@openseo/crawler` — Playwright-based headless crawler with extractors (meta, headings, links, images, schema, hreflang, content), robots.txt AI-crawler audit, schema validator, and `analyzeAll()` issue detection.
- `@openseo/agents` — LangChain.js provider abstraction (`createModel`), 4 agent tools wrapping crawler functions (`crawl_site`, `analyze_seo`, `analyze_geo`, `suggest_fixes`), task-to-model router (`suggestModel`).
- `@openseo/dashboard` — Next.js, build **disabled** until Phase 5.

## CLI commands

| Command | Behavior |
|---|---|
| `openseo` | Launch TUI (scaffold, audit, GEO, settings) |
| `openseo audit --url <url>` | Non-interactive audit, text output |
| `openseo audit --url <url> --json` | Non-interactive audit, JSON output |
| `openseo audit --local` | Audit localhost:3000 |
| `openseo geo --url <url>` | Non-interactive GEO analysis, text output |
| `openseo geo --url <url> --json` | Non-interactive GEO analysis, JSON output |

## Key conventions

- **Templates are inline TypeScript** (`templates.ts`) with `{{var}}` replacement — NOT EJS despite ADR-005.
- Scaffold is **idempotent**: skips existing files in the target project.
- Detection auto-runs on mount in `MainMenu`. Pre-selects missing features.

## Implemented analyzers (crawler)

**SEO:** Meta (title, description, canonical), Headings (missing H1, multiple H1), Links (internal count, nofollow), Images (missing alt, excessive lazy loading), Content (thin content <300 words, zero content), Schema (no/partial structured data, types found), Hreflang (missing), Robots (missing robots.txt, AI-crawler blocked, no sitemap directive).

**GEO (12 checks):** Statistics & Citations, Structured Data, Definition Blocks, Answer Blocks, Content Extractability, AI Bot Access, FAQ Blocks, Content Type Scoring, Freshness Signals, Author Attribution, AI Writing Signals, Schema Markup. Each produces score 0-100 + weighted aggregate.

## What's stub vs real

| Screen/Package | Status |
|---|---|
| Scaffold (info → select → execute → result) | Fully implemented |
| **Audit (input → progress → results)** | **Phase 2 complete** |
| **GEO (input → run → score → detail)** | **Phase 3 complete** |
| **Settings (provider config form)** | **Phase 4 complete** |
| Content | Not registered in App (missing from SCREENS map) |
| Dashboard | Build disabled |

## Gotchas

- `turbo typecheck` depends on `^build` — dependency packages must be built first for type resolution.
- **Crawler tsconfig includes `"lib": ["ES2022", "DOM"]`** because extractors use `document` etc. inside Playwright's `page.evaluate()`.
- GEO analysis requires `captureHtml: true` on crawl config (set automatically in GEO TUI and CLI).
- Ink React key warning on duplicate keys in feature list (cosmetic).
- "Raw mode not supported on current process.stdin" in non-TTY — expected, harmless.
- `tsup` bundles CLI as single ESM file; all imports are `.js` extensions (required by ESM).
- No CI workflows yet.
- CLI commands use dynamic `import()` for the crawler package (only loaded when needed).
- `@openseo/agents` uses a `tsup.config.ts` with heavy externals (LangChain, Zod, workspace packages) to avoid bundling Playwright transitively.
- LLM provider config is stored in-memory only (Zustand state). Not persisted to disk yet.
