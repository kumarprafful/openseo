# OpenSEO

> Open-source SEO, GEO & AEO suite for engineering teams.

**Automated SEO infrastructure, AI-powered content optimization, and generative engine optimization — all from your terminal.**

```bash
npx @openseo/cli
```

## What It Does

| Command | Description |
|---|---|
| `openseo` | Launch TUI — detect project health, scaffold, audit, GEO |
| `openseo audit --url <url>` | Run technical SEO audit, text or JSON output |
| `openseo geo --url <url>` | Run GEO analysis on a single page, text or JSON output |

## Features (Phase 3 — Crawler, Audit & GEO)

- **11 scaffolding features** — Structured data, breadcrumbs, 404 page, sitemap, robots.txt, RSS, OG images, llms.txt, analytics, content validation, launch checklist
- **Headless crawl** — Playwright-based crawler with configurable depth, page limit, same-origin filtering, optional HTML capture
- **Extractors** — Meta tags, headings, links, images, JSON-LD schema, hreflang, word count, raw HTML
- **8 SEO analyzers** — Meta (title/description/canonical), headings (missing/multiple H1), links (internal, nofollow), images (alt text, lazy loading), content (thin content <300 words), schema (present/absent types), hreflang (missing), robots.txt (AI crawler audit)
- **AI-crawler audit** — Checks GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, Bytespider access in robots.txt
- **Schema validation** — Validates required properties for Article, Organization, FAQPage, BreadcrumbList, LocalBusiness, Product, Recipe, Event, Review
- **12 GEO checks** — Statistics & citations, structured data, definition blocks, answer blocks, content extractability, AI bot access, FAQ blocks, content type scoring, freshness signals, author attribution, AI writing signals, schema markup
- **GEO scoring** — Weighted aggregate score (0-100) with per-check breakdown and recommendations
- **GEO TUI** — URL input, score visualization, per-check detail view
- **Audit TUI** — URL input, live progress, results grouped by severity
- **CI/CD ready** — `--json` flag on audit and geo commands
- **Persistent TUI** — Full-screen terminal dashboard with keyboard navigation (Ink + React)

## Quick Start

```bash
cd my-project
npx @openseo/cli
```

The TUI auto-detects your project (Next.js, Astro, Remix), checks existing SEO state, and shows ranked suggestions.

### Run an audit

```bash
openseo audit --url https://example.com
openseo audit --url https://example.com --json   # CI output
openseo audit --local                             # localhost:3000
```

### Run a GEO analysis

```bash
openseo geo --url https://example.com/blog/post
openseo geo --url https://example.com/blog/post --json   # CI output
```

## Requirements

- Node.js 20+
- pnpm (for development)
- Playwright browsers (`pnpm exec playwright install chromium` if running crawler locally)

## Project Structure

```
openseo/
├── packages/
│   ├── cli/          # Entry point, TUI (Ink + React + Zustand)
│   ├── core/         # Shared utilities + AuditIssue types
│   ├── crawler/      # Playwright crawler, extractors, analyzers, robots parser, schema validator
│   ├── agents/       # LangChain.js AI agents (stub — Phase 4)
│   └── dashboard/    # Web dashboard (stub — Phase 5)
└── docs/
    ├── 01-architecture.md
    ├── 02-cli-scaffold.md
    ├── 03-crawler-audit.md
    ├── 04-geo-aeo-engine.md
    ├── 05-ai-agents.md
    ├── 06-dashboard-ci.md
    ├── 07-plugin-ecosystem.md
    ├── agent-protocol.md
    └── decisions.md
```

## Development

```bash
git clone https://github.com/your-org/openseo
cd openseo
pnpm install
pnpm build
pnpm typecheck
```

Run `pnpm dev` for watch mode on all packages.

## License

MIT — see [LICENSE](LICENSE)
