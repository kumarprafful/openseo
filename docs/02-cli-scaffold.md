# Phase 1: CLI Scaffolding (openseo-cli)

> The entry point. A persistent TUI that scaffolds SEO/GEO/AEO infrastructure into any Next.js App Router project.

## What It Scaffolds (11 Features)

| # | Feature | Impact | Files Created |
|---|---------|--------|---------------|
| 1 | Structured data helpers | High | `lib/structured-data.ts` |
| 2 | Breadcrumb component + JSON-LD | High | `components/breadcrumb.tsx` |
| 3 | Custom 404 page | High | `app/not-found.tsx` |
| 4 | Dynamic sitemap | High | `app/sitemap.ts` |
| 5 | robots.txt | High | `public/robots.txt` |
| 6 | RSS feed | Med | `app/rss.xml/route.ts` |
| 7 | Dynamic OG image route | Med | `app/opengraph-image.tsx` |
| 8 | llms.txt / llm.txt generator | Med | `public/llms.txt` |
| 9 | Analytics integration | Low | `components/analytics.tsx`, `lib/analytics.ts` |
| 10 | Content validation script | Low | `scripts/validate-content.ts` |
| 11 | Feature launch checklist | Low | `docs/seo-checklist.md` |

## TUI Screen: Scaffold

```
┌───────────────────────────────────────────────────────────────┐
│  ← Back to Menu              📦  Scaffold SEO Infrastructure  │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Site URL:    [https://example.com            ]               │
│  Site name:   [Example                       ]               │
│  Content dir: [content/blog/                  ]               │
│  Locales:     [en,de,fr,pt-br                ]               │
│  Default:     [en                             ]               │
│                                                               │
│  ┌─ Features (ranked by impact for your project) ──────────┐ │
│  │                                                         │ │
│  │  ● robots.txt                 Critical  (none found)    │ │
│  │  ● Dynamic sitemap            Critical  (none found)    │ │
│  │  ● Structured data helpers    High     (no schema)      │ │
│  │  ● Breadcrumb + JSON-LD      High     (recommended)     │ │
│  │  ● Custom 404 page           High     (uses default)    │ │
│  │  ● llms.txt generator        Med      (missing)         │ │
│  │  ○ RSS feed                  Med      (optional)        │ │
│  │  ○ Dynamic OG image route    Med      (optional)        │ │
│  │  ○ Analytics integration     Low      (optional)        │ │
│  │  ○ Content validation script Low      (optional)        │ │
│  │  ○ Feature launch checklist  Low      (optional)        │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Space: toggle   p: toggle priority   Enter: scaffold selected│
└───────────────────────────────────────────────────────────────┘
```

## Impact Ranking Logic

The AI layer (or deterministic rules if no LLM is configured) ranks features based on:

1. **Missing vs existing** — If no robots.txt exists, that's "Critical"
2. **Search engine fundamentals** — robots.txt, sitemap always rank high
3. **AI readiness signals** — llms.txt, structured data for GEO
4. **User's project type** — Content-heavy sites prioritize RSS, structured data
5. **Framework capabilities** — Next.js App Router makes OG images, sitemaps easy

## Project Detection Engine

```typescript
interface ProjectInfo {
  framework: 'nextjs' | 'astro' | 'remix' | 'unknown';
  frameworkVersion?: string;
  appRouter: boolean;              // Next.js App Router vs Pages Router
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun';
  locales: string[];
  defaultLocale: string;
  contentDir: string | null;
  contentCount: number;
  hasTailwind: boolean;
  hasTypescript: boolean;
}

interface ExistingSEO {
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
  hasNotFound: boolean;
  hasRSS: boolean;
  hasOGImages: boolean;
  hasLlmsTxt: boolean;
  hasStructuredData: boolean;
  hasAnalytics: boolean;
  hasBreadcrumb: boolean;
}
```

Detection runs by:
1. Reading `package.json` dependencies → framework identification
2. Scanning `app/` and `pages/` directories → App Router detection
3. Reading `next.config` / `i18n` config → locale detection
4. Glob for `content/`, `blog/`, `posts/` → content directory detection
5. Checking for existence of specific files → existing SEO state

## Template Engine

Templates are `.ejs` files in `packages/cli/src/templates/`. Variables are interpolated based on user input.

```
packages/cli/src/templates/
├── structured-data.ts.ejs
├── breadcrumb.tsx.ejs
├── not-found.tsx.ejs
├── sitemap.ts.ejs
├── robots.txt.ejs
├── rss.xml.ts.ejs
├── opengraph-image.tsx.ejs
├── llms.txt.ejs
├── analytics.tsx.ejs
├── validate-content.ts.ejs
└── seo-checklist.md.ejs
```

## Post-Scaffold Output

After scaffolding, the TUI shows:

```
┌───────────────────────────────────────────────────────────────┐
│  ✓ Scaffold complete!                                          │
│                                                               │
│  Created 8 files:                                             │
│    • public/robots.txt                                        │
│    • app/sitemap.ts                                           │
│    • lib/structured-data.ts                                   │
│    • components/breadcrumb.tsx                                │
│    • app/not-found.tsx                                        │
│    • public/llms.txt                                          │
│    • lib/analytics.ts                                         │
│    • components/analytics.tsx                                 │
│                                                               │
│  📦 Install runtime deps:                                     │
│    npm install gray-matter react-markdown remark-gfm          │
│                                                               │
│  🔧 Install dev deps:                                         │
│    npm install -D tsx                                         │
│                                                               │
│  📝 Add to package.json scripts:                              │
│    "validate-seo": "tsx scripts/validate-content.ts"          │
│                                                               │
│  Press Enter to return to menu                                │
└───────────────────────────────────────────────────────────────┘
```

## Idempotency

All scaffold operations are idempotent:
- If a file exists, it's not overwritten unless `--force` is passed
- Existing content is detected and reported during project detection
- The TUI shows which files will be **created** vs **skipped** before confirming

## Commands

| Command | Action |
|---|---|
| `openseo` | Open TUI (detect + show main menu) |
| `openseo scaffold` | Jump directly to scaffold screen |
| `openseo scaffold --json` | Output planned files as JSON, non-interactive |
| `openseo scaffold --yes` | Scaffold all missing features, no prompts |
| `openseo scaffold --force` | Overwrite existing files |

## Key Design Decisions

1. **Blog routes are `/blog/[slug]`** — NO locale prefix in URL (not `/blog/fr/slug`)
2. **Internal links never use locale prefix** — validated by content validation script
3. **Interlinking is same-language only** (EN→EN, DE→DE)
4. **hreflang set via `alternates.languages`** in `generateMetadata`
5. **OG images are dynamic PNG** via `@vercel/og` (Node.js runtime)
6. **Analytics events use `<feature>_<action>` naming convention**
7. **Breadcrumb JSON-LD uses `item` property** (not `@id`) — Google-preferred
