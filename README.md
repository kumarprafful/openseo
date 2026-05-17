# OpenSEO

> Open-source SEO, GEO & AEO suite for engineering teams.

**Automated SEO infrastructure, AI-powered content optimization, and generative engine optimization — all from your terminal.**

```bash
npx openseo-cli
```

## What It Does

| Command | Description |
|---|---|
| `openseo` | Launch the TUI — detect project health, get ranked suggestions |
| `openseo scaffold` | Scaffold SEO infrastructure (11 features: sitemap, robots.txt, structured data, OG images, llms.txt, etc.) |
| `openseo audit` | Full technical SEO audit — crawl pages, find issues, fix them |
| `openseo geo` | GEO (Generative Engine Optimization) analysis — score pages for AI search readiness |
| `openseo content` | AI-powered content strategy, gap analysis, and creation |
| `openseo check ai-crawlers` | Audit GPTBot, ClaudeBot, PerplexityBot access |

## Features

- **11 scaffolding features** — Structured data, breadcrumbs, 404 page, sitemap, robots.txt, RSS, OG images, llms.txt, analytics, content validation, launch checklist
- **Technical SEO audit** — Headless crawl, schema validation, AI-crawler access check
- **GEO/AEO analysis** — 12 GEO signal checks for ChatGPT, Perplexity, AI Overviews visibility
- **Multi-agent AI system** — Content strategist, creator, optimizer, GEO specialist, auditor agents via LangChain.js
- **Multi-LLM support** — OpenAI, Anthropic, Google, Ollama, OpenRouter
- **CI/CD ready** — `--json` and `--non-interactive` on every command
- **Persistent TUI** — Full-screen terminal dashboard with keyboard navigation

## Quick Start

```bash
cd my-project
npx openseo-cli
```

The TUI auto-detects your project (Next.js, Astro, Remix), checks existing SEO state, and shows ranked suggestions.

## Requirements

- Node.js 20+
- pnpm (for development)

## Project Structure

```
openseo/
├── packages/
│   ├── cli/          # Entry point, TUI (Ink + React)
│   ├── core/         # Shared SEO utilities
│   ├── agents/       # LangChain.js AI agents
│   ├── crawler/      # Playwright headless crawler
│   └── dashboard/    # Self-hosted web UI (Next.js)
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
pnpm dev
```

## License

MIT — see [LICENSE](LICENSE)
