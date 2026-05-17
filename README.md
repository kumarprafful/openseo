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

## Features (Phase 5 — Crawler, Audit, GEO, AI Agents & Dashboard)

- **11 scaffolding features** — Structured data, breadcrumbs, 404 page, sitemap, robots.txt, RSS, OG images, llms.txt, analytics, content validation, launch checklist
- **Headless crawl** — Playwright-based crawler with configurable depth, page limit, same-origin filtering, optional HTML capture
- **Extractors** — Meta tags, headings, links, images, JSON-LD schema, hreflang, word count, raw HTML
- **8 SEO analyzers** — Meta, headings, links, images, content, schema, hreflang, robots.txt/AI-crawler audit
- **AI-crawler audit** — Checks 7 AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.) in robots.txt
- **Schema validation** — Validates required properties for 11 Schema.org types
- **12 GEO checks** — Full GEO/AEO readiness scoring with weighted aggregate
- **Multi-LLM provider support** — OpenAI, Anthropic, Google, Ollama
- **LangChain.js tools** — 4 agent tools wrapping crawler/analyzer functions
- **Settings TUI** — Configure LLM provider, API key, model, base URL
- **Web dashboard** — Next.js 15 app with audit history, detail views, and API routes
- **File-based persistence** — Audit results auto-saved to `.openseo/audits/` as JSON
- **GitHub Actions CI** — Auto-audit PRs with summary comment
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

### View the dashboard

```bash
openseo dashboard                           # print instructions
cd packages/dashboard && pnpm dev           # start Next.js dev server
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
│   ├── core/         # Shared utilities + types (AuditIssue, AuditResult, GeoScore)
│   ├── crawler/      # Playwright crawler, extractors, analyzers, robots parser, schema validator, GEO engine
│   ├── agents/       # LangChain.js provider abstraction, tool wrappers, model routing
│   └── dashboard/    # Web dashboard (Next.js 15 — home, audit list, audit detail, API)
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
