# OpenSEO Architecture

> Open-source SEO, GEO & AEO suite for engineering teams.

## Philosophy

OpenSEO is built on a few core beliefs:

1. **SEO infrastructure should be code, not clicks.** Scaffold it, version it, CI/CD it.
2. **GEO/AEO is the new SEO.** AI search visibility is a first-class concern, not an afterthought.
3. **AI agents should augment, not replace.** The tool suggests and automates; the engineer decides.
4. **Open source wins long-term.** No vendor lock-in, no surprise pricing, community-owned.

## Monorepo Structure

```
openseo/
├── package.json              # pnpm workspace root
├── turbo.json                 # Turborepo pipeline
├── tsconfig.base.json         # Shared TypeScript config
├── .npmrc
├── .gitignore
├── LICENSE                    # MIT
│
├── docs/
│   ├── 01-architecture.md     # This file
│   ├── 02-cli-scaffold.md     # Phase 1: CLI + TUI + Scaffold
│   ├── 03-crawler-audit.md    # Phase 2: Crawler + Audit
│   ├── 04-geo-aeo-engine.md   # Phase 3: GEO/AEO analysis
│   ├── 05-ai-agents.md        # Phase 4: AI agent system
│   ├── 06-dashboard-ci.md     # Phase 5: Dashboard + CI
│   ├── 07-plugin-ecosystem.md # Phase 6: Plugin system
│   ├── agent-protocol.md      # Agent communication specification
│   └── decisions.md           # Architecture Decision Records
│
├── packages/
│   ├── cli/                   # @openseo/cli  — Entry point, TUI
│   ├── core/                  # @openseo/core — Shared SEO utilities
│   ├── agents/                # @openseo/agents — LangChain.js agents
│   ├── crawler/               # @openseo/crawler — Headless crawler
│   └── dashboard/             # @openseo/dashboard — Web UI
│
├── scripts/                   # Shared build/dev scripts
└── pnpm-workspace.yaml
```

## Package Dependency Graph

```
                         ┌─────────────┐
                         │  @openseo/  │
                         │    cli      │
                         └──────┬──────┘
                                │ depends on
              ┌─────────────────┼──────────────────┐
              ▼                 ▼                   ▼
       ┌──────────┐    ┌──────────────┐    ┌────────────┐
       │@openseo/ │    │ @openseo/    │    │ @openseo/  │
       │  core    │    │   crawler    │    │  agents    │
       └────┬─────┘    └──────┬───────┘    └─────┬──────┘
            │                 │                  │
            └─────────────────┼──────────────────┘
                              ▼
                       ┌──────────────┐
                       │  LangChain.js│
                       │  (external)  │
                       └──────────────┘
```

## Technology Decisions

| Concern | Choice | Rationale |
|---|---|---|
| **TUI Framework** | Ink (React for CLI) | Persistent full-screen TUI, component model, same pattern as opencode |
| **Prompt library** | `@inquirer/prompts` | Modal inputs within TUI (select, checkbox, input, confirm) |
| **Progress** | `ora` | Spinners for async operations |
| **Output styling** | `chalk` | Colored, structured terminal output |
| **AI framework** | LangChain.js | Multi-provider support, tool use, agent orchestration |
| **Crawler** | Playwright | Headless browser, JS rendering, modern API |
| **Schema validation** | Custom (via Schema.org vocab) | Lightweight, no external dep for basic validation |
| **Build** | Turborepo + tsup | Fast TS compilation, bundle CLI as single JS |
| **Package manager** | pnpm | Fast, strict, workspace-native |
| **Monorepo tool** | Turborepo | Parallel builds, caching, pipeline |

## TUI Screen Map

```
openseo (no args)
  │
  └─ Main Menu (persistent TUI dashboard)
       │  Shows: project health score, quick actions, ranked suggestions
       │
       ├─ 🛠  Audit & Fix
       │    ├─ Run full scan → live progress per extractor
       │    └─ Results view → issues ranked by impact, [Fix] button per issue
       │
       ├─ 📦  Scaffold
       │    ├─ Project info (pre-filled from detection)
       │    └─ Feature list → 11 items with impact rank, checkboxes
       │
       ├─ 🌐  GEO Analysis
       │    ├─ URL input → 12 GEO checks → scores per check
       │    └─ Fix suggestions per failed check
       │
       ├─ 📝  Content Strategy
       │    ├─ Content gap analysis
       │    └─ Topic clusters, brief generation, AI creation
       │
       ├─ 🤖  AI Crawlers
       │    ├─ Check GPTBot/ClaudeBot/PerplexityBot access
       │    └─ robots.txt audit + fix
       │
       ├─ 💬  Chat Mode
       │    └─ Freeform AI chat with full project context
       │
       └─ ⚙️  Settings
            ├─ LLM API keys (OpenAI, Anthropic, Google, Ollama)
            └─ Project config (.openseorc)
```

## Data Flow

```
1. User runs `openseo` in project directory
         │
         ▼
2. Detector scans project:
   - Reads package.json → framework detection
   - Reads tsconfig, next.config, etc. → project config
   - Scans directory structure → content dirs, locales
   - Checks for existing SEO files → state diff
         │
         ▼
3. App state initialized (Zustand store in Ink context):
   - projectInfo: { framework, locales, contentDir, ... }
   - existingSeo: { found: [...], missing: [...] }
   - issues: [] (populated after audit)
   - aiSuggestions: [] (populated after AI analysis)
         │
         ▼
4. TUI renders Main Menu with health summary
         │
         ▼
5. User navigates to a screen (Audit, Scaffold, GEO, etc.)
         │
         ▼
6. Screen calls Engine Layer (deterministic) + AI Layer (suggestions)
         │
         ▼
7. Results displayed in TUI with action buttons
         │
         ▼
8. User confirms actions → files written, commands run
```

## Engine Layer

The Engine Layer handles all **deterministic** operations. No LLM needed.

| Module | Responsibility |
|---|---|
| **`detector`** | Framework detection, project state inference |
| **`scaffolder`** | Template engine (ejs), file writer |
| **`crawler`** | Headless browser crawl, data extraction |
| **`schema-validator`** | JSON-LD/microdata validation against Schema.org |
| **`geo-analyzer`** | 12 GEO signal checks (statistics, citations, definition blocks, etc.) |
| **`locale-utils`** | hreflang generation, locale detection |
| **`robots-analyzer`** | robots.txt parser, AI-bot access audit |

## AI Layer (LangChain.js)

The AI Layer handles **suggestions, rankings, and analysis**. Runs on-demand when the user has configured an LLM provider.

| Component | Responsibility |
|---|---|
| **`SuggestionChain`** | Given project state + issues, rank by impact |
| **`GeoAnalysisChain`** | Given page content, score 12 GEO signals |
| **`ContentStrategyChain`** | Given existing content, identify gaps + topics |
| **`ContentCreatorChain`** | Generate content briefs and drafts |
| **`SchemaRecommenderChain`** | Suggest schema types based on page content |

## Provider Abstraction

All LLM interactions go through a provider abstraction:

```
User Config
     │
     ▼
┌─────────────────┐
│  LLM Provider    │  ← selects based on user config
│  Registry        │
└────────┬────────┘
         │
    ┌────┼────┬──────┬──────┐
    ▼    ▼    ▼      ▼      ▼
  OpenAI  Anthropic  Google  Ollama  OpenRouter
```

Each provider implements:

```typescript
interface LLMProvider {
  name: string;
  call(prompt: string, opts?: CallOptions): Promise<LLMResponse>;
  stream(prompt: string, opts?: CallOptions): AsyncIterable<LLMResponse>;
  embed(text: string): Promise<number[]>;
}
```

## Distribution Strategy

| Channel | Command | Notes |
|---|---|---|
| **npx** | `npx openseo-cli` | No install, always latest |
| **npm global** | `npm i -g openseo-cli` | Persistent install |
| **Homebrew** | `brew install openseo-cli` | macOS users |

The CLI is bundled as a single JS file via `tsup`. Runtime dependencies are minimal.

## Key Design Principles

1. **Detect before asking.** Every prompt should be pre-filled with auto-detected values.
2. **Default to the right thing.** The common path requires zero configuration.
3. **Keyboard-first.** Arrow keys, shortcuts, vim-style navigation where possible.
4. **Non-interactive is first-class.** `--json`, `--yes`, `--non-interactive` on every command.
5. **AI is additive.** Core features work without any LLM. AI layer enhances but never gates.
6. **Idempotent by design.** Running scaffold twice is safe. All file writes check for existing content.
7. **Machine-readable output.** `--json` on every screen/command for CI/CD and agent consumption.
