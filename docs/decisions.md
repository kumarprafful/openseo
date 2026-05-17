# Architecture Decision Records

> Key architectural decisions made during the OpenSEO design process.

## ADR-001: Persistent TUI vs Inline Prompts

**Status**: Accepted

**Context**: We needed to choose between inline prompts (one-at-a-time, like `npx create-next-app`) and a persistent full-screen TUI (like `lazygit`).

**Decision**: Use a persistent TUI built with Ink (React for CLI).

**Rationale**:
- Persistent TUI allows showing context (project health, suggestions) alongside interactive elements
- Users can navigate between screens without losing state
- Supports keyboard shortcuts for power users
- Consistent visual layout improves discoverability of features
- Ink's component model maps well to our screen architecture

**Consequences**:
- Higher initial development complexity vs inline prompts
- Better long-term UX for multi-step workflows
- Can still support inline mode with flags (`--no-tui`)

---

## ADR-002: TypeScript as Primary Language

**Status**: Accepted

**Context**: We needed to choose the implementation language for the CLI, agents, and core libraries.

**Decision**: Use TypeScript for all packages. Python may be added later for ML-heavy features.

**Rationale**:
- TypeScript's `npx` distribution is zero-friction for consumers
- Natural fit with Next.js ecosystem (scaffold targets App Router)
- LangChain.js supports all required LLM providers and agent patterns
- Single language across CLI, dashboard, and agents reduces cognitive overhead
- Shared types across packages in the monorepo

**Consequences**:
- Some ML/NLP tasks may be more verbose in TypeScript than Python
- Can add Python microservice later if needed (e.g., local model inference)
- Multi-modal is handled via API calls (no local model needed)

---

## ADR-003: LangChain.js for Agent Orchestration

**Status**: Accepted

**Context**: We needed an AI agent framework for the multi-agent system.

**Decision**: Use LangChain.js as the primary agent framework.

**Rationale**:
- Mature TypeScript support with regular releases
- Built-in support for all major LLM providers (OpenAI, Anthropic, Google, Ollama)
- `AgentExecutor` pattern maps directly to our agent topology
- Tool system integrates cleanly with our engine layer
- Streaming, callbacks, and memory are well-supported

**Alternatives Considered**:
- **Vercel AI SDK**: Great for streaming, but less mature agent orchestration
- **Custom implementation**: More control but reinvents the wheel
- **Python CrewAI/LangGraph**: Would require polyglot architecture

**Consequences**:
- Locked into LangChain abstractions (can wrap if needed)
- Regular updates needed to keep up with LangChain releases

---

## ADR-004: Deterministic Engine + AI Layer Architecture

**Status**: Accepted

**Context**: We needed to decide how much of the system should depend on LLMs vs work without them.

**Decision**: Core features work without any LLM. AI layer is additive.

**Rationale**:
- SEO scaffolding, crawling, schema validation are deterministic operations
- Users should not need an API key for basic functionality
- AI suggestions are valuable but non-critical
- Separating concerns makes testing and debugging easier
- Users can choose their comfort level with AI assistance

**Consequences**:
- Two parallel implementations for some features (deterministic + AI-enhanced)
- Clear API boundary between engine layer and AI layer
- AI features are gated behind provider configuration

---

## ADR-005: EJS Templates for Scaffolding

**Status**: Accepted

**Context**: We needed a template engine for generating project files.

**Decision**: Use EJS for template files.

**Rationale**:
- Simple interpolations (`<%= variable %>`) — no complex syntax
- Supports conditionals and loops for feature-gated content
- Well-known, minimal learning curve
- No runtime dependencies beyond `ejs` package
- Templates are plain text files (not embedded in TypeScript)

**Alternatives Considered**:
- **Template literals in TypeScript**: More powerful but harder to maintain
- **Handlebars/Mustache**: Logic-less, but need conditionals for optional features
- **TSX**: Overkill for plain text output

**Consequences**:
- Template files are separate `.ejs` files in the package
- Type safety is manual (variables must match between prompt answers and templates)

---

## ADR-006: Playwright for Headless Crawling

**Status**: Accepted

**Context**: We needed a headless browser for crawling JavaScript-rendered pages.

**Decision**: Use Playwright over Puppeteer.

**Rationale**:
- Playwright supports Chromium, Firefox, and WebKit
- Better API design (no `page.evaluate()` boilerplate)
- Native TypeScript support
- Active development by Microsoft
- Better support for intercepting network requests

**Consequences**:
- Larger install size (browser binaries)
- Can use `playwright-core` for headless-only installs

---

## ADR-007: Single CLI Binary via tsup

**Status**: Accepted

**Context**: We needed a distribution strategy for the CLI.

**Decision**: Bundle with `tsup` to produce a single-file JS executable.

**Rationale**:
- `tsup` uses `esbuild` under the hood — fast bundling
- Produces a single entry point that `npx` can execute
- No ESM/CJS resolution issues at runtime
- Supports `shebang` injection for `bin` entry
- Tree-shakes dependencies → smaller install size

**Distribution channels**:
- `npx openseo-cli` — no install, always latest
- `npm install -g openseo-cli` — persistent install
- Homebrew (future)

**Consequences**:
- Node.js 20+ required (enforced in package.json)
- Native modules (Playwright) still need install step

---

## ADR-008: pnpm + Turborepo for Monorepo

**Status**: Accepted

**Context**: We needed a monorepo tool and package manager.

**Decision**: Use pnpm workspaces + Turborepo.

**Rationale**:
- pnpm is faster and stricter than npm/yarn
- Built-in workspace protocol (`@openseo/cli@workspace:*`)
- Turborepo provides parallel builds, caching, pipeline
- Widely adopted, well-documented

**Alternatives Considered**:
- **Nx**: More powerful but more complex
- **npm workspaces**: Less strict, slower
- **Bun**: Too early for production tooling

**Consequences**:
- Contributors need pnpm installed
- Standardized build pipeline via turbo.json

---

## ADR-009: OG Images via @vercel/og (Node.js Runtime)

**Status**: Accepted

**Context**: We needed to decide the OG image generation strategy in scaffolding.

**Decision**: Use `@vercel/og` with Node.js runtime (not Edge).

**Rationale**:
- `@vercel/og` produces high-quality dynamic PNG images
- Node.js runtime supports more features (fonts, complex layouts)
- Works on any deployment platform (not just Vercel)
- User can change to Edge runtime if they prefer

**Template generated**:
```typescript
// app/opengraph-image.tsx
export const runtime = 'nodejs';
export default async function Image({ params }) {
  // ... @vercel/og JSX template
}
```

**Consequences**:
- Requires `@vercel/og` as a dependency in the target project
- Node.js runtime has slightly higher cold start than Edge
- Can be overridden to Edge runtime via `export const runtime = 'edge'`

---

## ADR-010: Breadcrumb JSON-LD Uses `item` Property

**Status**: Accepted

**Context**: We needed to choose between `@id` and `item` property for breadcrumb JSON-LD.

**Decision**: Use the `item` property (Google-preferred format).

**Rationale**:
- Google's official documentation recommends `item` over `@id`
- Better compatibility with Google Search Console validation
- More readable and maintainable

**Generated format**:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": { "@id": "https://example.com", "name": "Home" }
    }
  ]
}
```

**Consequences**:
- Slightly more verbose than `@id`-only format
- Consistent with Google's latest guidance
