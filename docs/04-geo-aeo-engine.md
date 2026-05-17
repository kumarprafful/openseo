# Phase 3: GEO/AEO Analysis Engine

> Analyzes pages for Generative Engine Optimization (GEO) and Answer Engine Optimization (AEO) readiness.

## TUI Screen: GEO Analysis

```
┌───────────────────────────────────────────────────────────────┐
│  ← Back to Menu            🌐  GEO Analysis                  │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  URL to analyze: [https://example.com/blog/seo-guide       ]  │
│                                                               │
│  ┌─ GEO Score ─────────────────────────────────────────────┐ │
│  │  42 / 100                   Needs improvement            │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─ Check Results ──────────────────────────────────────────┐ │
│  │                                                         │ │
│  │  ✓ Content extractability       85/100  Good            │ │
│  │  ✓ AI bot access                100/100 Perfect         │ │
│  │  ✓ FAQ blocks                   80/100  Good            │ │
│  │  ⚠️  Structured data             60/100  Missing Person  │ │
│  │  ⚠️  Definition blocks           45/100  Add summaries  │ │
│  │  ⚠️  Author attribution          30/100  Missing        │ │
│  │  ⚠️  Freshness signals           25/100  Missing dates  │ │
│  │  ⛔ Statistics & citations        0/100  None found     │ │
│  │  ⛔ Answer blocks                10/100  Too long       │ │
│  │  ⛔ Content type scoring         20/100  Too promotional│ │
│  │  ⛔ AI writing signals           15/100  AI-written     │ │
│  │  ⛔ Schema markup                 0/100  None found     │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  [1-12] Show detail  [g] Generate report  [f] Fix suggested   │
└───────────────────────────────────────────────────────────────┘
```

## The 12 GEO Checks

The GEO analysis engine runs 12 checks against each URL. These are based on the signals that generative AI platforms (ChatGPT, Perplexity, Google AI Overviews, Claude, Gemini) evaluate when selecting sources.

| # | Check | What It Measures | Weight |
|---|-------|-----------------|--------|
| 1 | **Statistics & Citations** | Data points backed by sources | High |
| 2 | **Structured data** | JSON-LD/microdata validity & completeness | High |
| 3 | **Definition blocks** | Summary paragraphs after H2s (40-60 words) | High |
| 4 | **Answer blocks** | First paragraph optimal for extraction | High |
| 5 | **Content extractability** | Thin content / image-heavy pages | High |
| 6 | **AI bot access** | GPTBot, ClaudeBot, PerplexityBot not blocked | High |
| 7 | **FAQ blocks** | FAQPage schema, Q&A structure | Med |
| 8 | **Content type scoring** | Informational vs promotional density | Med |
| 9 | **Freshness signals** | Date meta tags, last-modified, time elements | Med |
| 10 | **Author attribution** | Person schema, meta author, rel=author | Med |
| 11 | **AI writing signals** | Detection of AI-generated patterns that reduce trust | Low |
| 12 | **Schema markup** | Presence and correctness of schema types | High |

## Check Details

### 1. Statistics & Citations
- Scans for numerical data points
- Checks for citation markers (`[1]`, `[source]`, `<sup>`, etc.)
- Verifies data points have source attribution
- GEO impact: Content with statistics shows 37% better visibility in AI responses

### 2. Structured Data
- Counts JSON-LD blocks
- Validates syntax against Schema.org
- Checks for recommended types: Article, Organization, Person, FAQPage, BreadcrumbList
- Flags missing required properties

### 3. Definition Blocks
- Checks first paragraph after each H2/H3
- Measures length (optimal: 40-60 words)
- Verifies summary/definitional nature (not just transitional text)

### 4. Answer Blocks
- Measures first paragraph length (optimal: 40-60 words)
- Checks if it directly answers likely user queries
- Evaluates clarity and self-containedness

### 5. Content Extractability
- Text-to-HTML ratio
- Flags heavy image/content-light pages
- Checks for code blocks, tables, lists that AI can parse
- Minimum word count check

### 6. AI Bot Access
- Checks robots.txt for GPTBot, ClaudeBot, PerplexityBot, Google-Extended
- Verifies no `Disallow: /` for AI crawlers
- Checks if `llms.txt` exists
- Tests actual access by simulating a crawl

### 7. FAQ Blocks
- Detects FAQPage schema
- Finds definition lists (`<dl>`) and expandable Q&A
- Checks for natural language Q&A patterns

### 8. Content Type Scoring
- Measures promotional density (CTAs, product mentions vs informational content)
- AI cites information, not pitches
- Flags sales-heavy pages with low informational value

### 9. Freshness Signals
- Checks `<meta date>`, `<time>`, `last-modified` header
- Detects "Updated on" and "Published on" text patterns
- Verifies recency of content

### 10. Author Attribution
- Checks for `Person` schema with author info
- Detects `rel="author"` links
- Verifies byline with credentials/expertise signals
- GEO impact: Content with clear authorship shows 20% better citation rates

### 11. AI Writing Signals
- Detects patterns common in AI-generated text (repetitive phrasing, hedging, etc.)
- Flags content that may reduce trust with AI platforms
- Note: This doesn't block; it flags for human review

### 12. Schema Markup
- Enumerates all schema types present
- Validates against Schema.org vocabulary
- Suggests missing types based on content analysis

## AEO Optimization Detection

In addition to GEO checks, the engine identifies AEO (Answer Engine Optimization) opportunities:

| Signal | Detection | Fix |
|---|---|---|
| Question-based H2s | `"What is X"`, `"How to Y"` | Add more, ensure direct answer follows |
| Concise answers | First paragraph extraction quality | Shorten to 40-60 words |
| Featured snippet structure | Lists, tables, definitions | Add structured content |
| "People also ask" potential | Related question coverage | Add FAQ schema |

## AI Enhancement

When an LLM provider is configured, the GEO analysis is enhanced:

- **GEO content recommendations**: Rewrite suggestions for low-scoring checks
- **Competitor comparison**: Analyze competitor pages for comparison
- **Priority suggestions**: "Fix these 3 things first for maximum GEO impact"

## Commands

| Command | Action |
|---|---|
| `openseo geo` | GEO analysis via TUI |
| `openseo geo --url https://example.com/page` | Analyze specific URL |
| `openseo geo --crawl` | Crawl site + GEO score all pages |
| `openseo geo --json` | JSON output for CI |
| `openseo geo --check ai-access` | AI bot access check only |
| `openseo geo --report > geo-report.md` | Generate markdown report |

## Integration with Audit

GEO checks are also available as part of the full audit (`openseo audit`). The audit includes GEO checks as an optional module, accessible from the audit results screen.
