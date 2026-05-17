# Phase 2: Crawler & Technical SEO Audit

> A headless browser engine that crawls your project (local or deployed) and surfaces SEO issues ranked by impact.

## TUI Screen: Audit

```
┌───────────────────────────────────────────────────────────────┐
│  ← Back to Menu            🛠  Audit & Fix                   │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Target: http://localhost:3000  (local dev server)            │
│  Pages: 24   Depth: 2    With JS: yes                        │
│                                                               │
│  ┌─ Scanning ──────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │  ● Crawling pages        ████████████░░░░  12/24        │ │
│  │  ● Extracting meta       ██████░░░░░░░░░░   8/24        │ │
│  │  ● Checking schema       ████████████████  24/24   ✓    │ │
│  │  ● Analyzing links       ██████████░░░░░░  10/24        │ │
│  │  ● Checking performance  ████░░░░░░░░░░░░   4/24        │ │
│  │  ● AI crawler audit      ████████████████   1/1    ✓    │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Press Esc to cancel   Running...                              │
└───────────────────────────────────────────────────────────────┘
```

After scan completes:

```
┌───────────────────────────────────────────────────────────────┐
│  ← Back to Menu            🛠  Audit Results                  │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Found 14 issues across 24 pages                              │
│                                                               │
│  Critical (3)                                                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 🚨 5 pages missing <title> tag                  [Fix]   │ │
│  │ 🚨 GPTBot blocked in robots.txt                 [Fix]   │ │
│  │ 🚨 No canonical URLs set                       [Fix]   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  High (5)                                                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ⚠️  12 pages missing meta description          [Fix]    │ │
│  │ ⚠️  3 images missing alt text                  [Fix]    │ │
│  │ ⚠️  Duplicate H1 on /blog/                     [Fix]    │ │
│  │ ⚠️  Missing hreflang for de, fr, pt-br        [Fix]    │ │
│  │ ⚠️  No structured data found                   [Add]    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Medium (4)                                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ⚡ 3 broken internal links                       [Fix]  │ │
│  │ ⚡ LCP > 2.5s on 3 pages                        [Opt]  │ │
│  │ ⚡ No RSS feed                                   [Add]  │ │
│  │ ⚡ Thin content (<300 words) on 2 pages          [Rev]  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Low (2)                                                      │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ℹ️  No OG images                                 [Add]  │ │
│  │ ℹ️  No llms.txt                                  [Add]  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  [a] Fix all  [1-14] Fix specific  [r] Refresh  [e] Export   │
└───────────────────────────────────────────────────────────────┘
```

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Playwright   │────>│  Extractor   │────>│  Analyzer    │
│  (headless)   │     │  Pipeline    │     │              │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       ▼                    ▼                    ▼
  Seeds URLs        Meta, Links,         Issue detection
  Crawls pages      Schema, Images,      Priority ranking
  Renders JS        Headings, CWV        Suggestions
```

## Extractors

| Extractor | Data Collected |
|---|---|
| `meta` | `<title>`, `<meta name="description">`, `<meta name="robots">`, canonical |
| `headings` | H1-H6 structure, duplicates, missing H1 |
| `schema` | JSON-LD blocks, microdata, validation against Schema.org |
| `links` | Internal, external, broken (4xx/5xx), redirects, `nofollow` |
| `images` | `<img>` tags, alt text, lazy loading, dimensions |
| `hreflang` | `alternate` link tags, `x-default`, language coverage |
| `performance` | LCP, CLS, INP via Lighthouse protocol |
| `content` | Word count, readability, thin content detection |
| `robots` | robots.txt content, AI-bot directives (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) |

## AI-Crawler Audit

Checks if major AI crawlers can access the site:

| Crawler | User-Agent | Check |
|---|---|---|
| GPTBot | `GPTBot` | Allowed/disallowed in robots.txt |
| ClaudeBot | `ClaudeBot` | Allowed/disallowed in robots.txt |
| Claude-Web | `Claude-Web` | Allowed/disallowed |
| PerplexityBot | `PerplexityBot` | Allowed/disallowed |
| Google-Extended | `Google-Extended` | Allowed/disallowed |
| Applebot-Extended | `Applebot-Extended` | Allowed/disallowed |
| Bytespider | `Bytespider` | Allowed/disallowed |

Each check returns: `allowed`, `blocked`, or `not-specified` (default: allowed).

## Schema.org Validation

Validates JSON-LD and microdata against the Schema.org vocabulary:

- Syntax validation (valid JSON-LD)
- Required property checks (per schema type)
- Property type checking (Text vs URL vs Number)
- Circular reference detection
- Recommendation: suggest missing schema types based on page content

## Report Formats

| Format | Use Case |
|---|---|
| **TUI** | Interactive review with fix actions |
| **JSON** (`--json`) | CI/CD pipeline consumption |
| **HTML** | Shareable report for stakeholders |
| **Markdown** | GitHub issues / PR comments |
| **GitHub Actions annotations** | PR check annotations |

## Commands

| Command | Action |
|---|---|
| `openseo audit` | Full audit via TUI (choose target) |
| `openseo audit --local` | Audit local dev server (auto-starts if needed) |
| `openseo audit --url https://example.com` | Audit deployed site |
| `openseo audit --json --non-interactive` | JSON output for CI |
| `openseo audit --format html` | Generate HTML report |
| `openseo check ai-crawlers` | AI crawler access audit only |
| `openseo check schema` | Schema validation only |
| `openseo check links` | Broken link check only |

## Fix Actions

Each issue has a corresponding fix action:

| Issue | Fix Action |
|---|---|
| Missing `<title>` | Suggest title based on content + template |
| Blocked AI crawler | Update `robots.txt` |
| Missing meta description | Generate from content |
| Missing alt text | Suggest alt text (AI-assisted) |
| Broken link | List broken URL + source page |
| No canonical | Set self-referencing canonical |
| Missing hreflang | Generate from locale config |
| No structured data | Scaffold structured data helpers |
| Thin content | Flag for content team |
