# Phase 5: Web Dashboard & CI Integration

> A self-hosted Next.js dashboard + CI/CD integrations for continuous SEO monitoring.

## Architecture

```
                    ┌──────────────┐
                    │  PostgreSQL  │
                    │   (via ORM)  │
                    └──────┬───────┘
                           │
┌──────────┐       ┌──────┴───────┐       ┌──────────┐
│  GitHub   │──────>│  @openseo/   │<──────│  Web     │
│  Action   │       │  dashboard   │       │  Browser │
└──────────┘       └──────────────┘       └──────────┘
                           │
                    ┌──────┴───────┐
                    │  @openseo/   │
                    │  core + CLI  │
                    └──────────────┘
```

## Web Dashboard (Next.js)

The dashboard is a self-hosted Next.js app that provides:

- **Project overview**: All monitored projects, health scores, trends
- **Audit history**: Timeline of audits with diff views
- **Issue tracking**: Open/resolved issues over time
- **GEO score tracking**: GEO scores per page over time
- **Content inventory**: All pages with metadata, scores
- **Team collaboration**: Share reports, assign fixes

### TUI Integration

The dashboard URL is displayed in the TUI:
```
📊 Dashboard: http://localhost:3456
   Login token: openseo_xxxx...

[o] Open in browser   [c] Copy URL
```

## GitHub Action

An official GitHub Action for CI/CD pipelines:

```yaml
# .github/workflows/seo-audit.yml
name: SEO Audit
on:
  pull_request:
    paths:
      - 'app/**'
      - 'content/**'
      - 'public/**'

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npx openseo-cli audit --url ${{ env.PREVIEW_URL }} --json > seo-report.json
      - uses: openseo/github-action@v1
        with:
          report: seo-report.json
          fail-on: 'critical'
      - uses: actions/github-script@v7
        with:
          script: |
            const report = require('./seo-report.json');
            // Post audit summary as PR comment
            github.rest.issues.createComment({
              ...context.repo,
              issue_number: context.issue.number,
              body: formatAuditComment(report)
            });
```

### What the Action Does

1. Runs `openseo audit` against the preview deployment
2. Compares results against the main branch baseline
3. Fails the check if new `critical` issues are introduced
4. Posts a summary as a PR comment
5. Annotates the code with inline suggestions

### PR Comment Example

```
## 🔍 OpenSEO Audit Results

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| SEO Score | 72/100 | 85/100 | +13 🟢 |
| Issues | 14 | 9 | -5 🟢 |
| GEO Score | 42/100 | 42/100 | — ⚪ |

### ⚠️ Issues to Review

- **Missing alt text** on `components/hero.tsx:24` — `[Fix]`
- **Duplicate H1** on `app/about/page.tsx:1` — `[Fix]`
- **Thin content** on `app/pricing/page.tsx` (180 words) — `[Review]`

### 🛡️ No new critical issues. Good to merge!
```

## Historical Tracking

Data stored in PostgreSQL (or SQLite for single-user):

| Table | Purpose |
|---|---|
| `projects` | Projects monitored |
| `audits` | Audit runs with scores |
| `issues` | Individual issues found |
| `geo_scores` | GEO scores per URL per run |
| `content_snapshots` | Content state at time of audit |
| `trends` | Score trends over time (materialized) |

## Deployment Options

| Option | Command | Use Case |
|---|---|---|
| **Local** | `docker compose up` | Single-user, local dev |
| **Self-hosted** | Docker image | Team deployment |
| **Managed** | Coming soon | Hosted by us |

## Commands

| Command | Action |
|---|---|
| `openseo dashboard start` | Start dashboard server |
| `openseo dashboard deploy` | Deploy to Vercel/Railway |
| `openseo dashboard link` | Link to existing dashboard |
| `openseo dashboard status` | Show dashboard connection status |
