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
- `@openseo/core` is the shared detection engine — stateless, filesystem-only, no LLM.
- `@openseo/crawler` (Playwright) and `@openseo/agents` (LangChain) are stubs — Phase 2 & 4.
- `@openseo/dashboard` (Next.js) build is **disabled** via `echo` stub until Phase 5.

## Key conventions

- **Templates are inline TypeScript** (`templates.ts`) with `{{var}}` replacement — NOT EJS despite what ADR-005 says. The implementation is the source of truth.
- Scaffold is **idempotent**: skips files that already exist in the target project.
- Templates use these variables: `siteUrl`, `siteName`, `contentDir`, `locales`, `defaultLocale`, `analyticsProvider`, `analyticsScriptUrl`, `analyticsSiteId`, `ogType`, `features`.
- Detection auto-runs on mount in `MainMenu`. Pre-selects missing features in scaffold.

## What's stub vs real

| Screen/Package | Status |
|---|---|
| Scaffold (info → select → execute → result) | Fully implemented (4 sub-screens) |
| Audit, GEO | Stubs — title + escape-to-menu only |
| Content, Settings | Not registered in App (missing from SCREENS map) |
| Agents, Crawler | Stub classes |
| Dashboard | Build disabled |

## Gotchas

- `turbo typecheck` depends on `^build` — dependency packages must be built first for type resolution.
- Ink React key warning on duplicate keys in feature list (cosmetic).
- "Raw mode not supported on current process.stdin" in non-TTY — expected, harmless.
- `tsup` bundles CLI as single ESM file; all imports are `.js` extensions in src (required by ESM).
- No CI workflows or GitHub Actions config yet.
