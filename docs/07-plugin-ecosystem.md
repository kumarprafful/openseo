# Phase 6: Plugin Ecosystem & Future

> A plugin system for extending OpenSEO with custom checks, extractors, templates, and agent skills.

## Plugin API Architecture

```
┌──────────────────────────────────────────────────┐
│  @openseo/cli                                     │
│  ┌────────────────────────────────────────────┐   │
│  │  Plugin Registry                           │   │
│  │  ├─ Built-in plugins (core checks)         │   │
│  │  ├─ Community plugins (npm packages)       │   │
│  │  └─ Local plugins (project .openseo/plugins)│   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

## Plugin Types

| Type | Interface | Example |
|---|---|---|
| **Checker** | Custom SEO check | "Check for H1s that match the page title" |
| **Extractor** | Custom data extractor | "Extract FAQ schema variants" |
| **Template** | Custom scaffold output | "Add breadcrumb for Astro framework" |
| **Reporter** | Custom output format | "Slack webhook reporter" |
| **Agent Skill** | Custom AI agent capability | "Competitor backlink analyzer" |
| **Provider** | Custom LLM provider | "AWS Bedrock provider" |

## Plugin Lifecycle

```
npm install @openseo/plugin-my-checker
        │
        ▼
Plugin auto-detected at CLI startup
        │
        ▼
Plugin registers hooks:
  - checker: 'custom-h1-check'
  - priority: 'medium'
  - category: 'technical'
        │
        ▼
Plugin available in TUI as:
  - Shows in Audit results
  - Has [Fix] action
  - Contributes to health score
```

## Plugin Interface

```typescript
interface OpenSEOPlugin {
  name: string;
  version: string;
  description: string;
  
  // Lifecycle
  onLoad?(context: PluginContext): Promise<void>;
  onUnload?(): Promise<void>;
  
  // Registration
  registerCheckers?(): CheckerDefinition[];
  registerExtractors?(): ExtractorDefinition[];
  registerTemplates?(): TemplateDefinition[];
  registerReporters?(): ReporterDefinition[];
  registerAgentSkills?(): AgentSkillDefinition[];
  registerProviders?(): ProviderDefinition[];
}
```

## MCP Server Integration

OpenSEO can operate as an MCP (Model Context Protocol) server, allowing AI coding agents (Claude Code, Cursor, VS Code Copilot) to query it directly:

```json
// In claude_desktop_config.json or .cursor/mcp.json
{
  "mcpServers": {
    "openseo": {
      "command": "npx",
      "args": ["openseo-cli", "mcp"]
    }
  }
}
```

This exposes OpenSEO tools as MCP tools that any MCP-compatible agent can use:

| MCP Tool | Description |
|---|---|
| `openseo_audit` | Run SEO audit on a URL |
| `openseo_geo` | Analyze page for GEO readiness |
| `openseo_schema` | Validate structured data |
| `openseo_scaffold` | Generate SEO files |
| `openseo_check_ai` | Check AI crawler access |

## VS Code Extension

A VS Code extension that surfaces OpenSEO feedback inline:

```
// app/page.tsx
export default function Home() {
  return (
    <div>
      <h1>Welcome</h1>          ← ⚠️ SEO: Missing meta description
      <Image src="hero.jpg" />  ← ⚠️ SEO: Missing alt text
    </div>
  );
}
```

Features:
- Inline annotations from `openseo audit`
- Quick-fix suggestions (Ctrl+. to apply)
- File watcher for real-time checks
- Status bar with project health score

## Community Template Marketplace

A registry of community-contributed templates for scaffold:

```
openseo scaffold --template community/astro-breadcrumb
openseo scaffold --list-templates
```

Templates are distributed as npm packages:
- `@openseo/template-structured-data`
- `@openseo/template-analytics-plausible`
- `community/openseo-template-remix-seo`

## Roadmap Beyond Phase 6

| Feature | Description |
|---|---|
| **OpenSEO Cloud** | Managed dashboard + scheduled audits |
| **Slack/Teams integration** | Report delivery to team channels |
| **Content scheduling** | AI-generated content with review → schedule → publish |
| **Internationalization scanner** | Detect missing translations, broken hreflang |
| **SERP preview** | TUI-based SERP preview for title/meta optimization |
| **Competitor tracking** | Monitor competitor SEO changes over time |
| **Core Web Vitals history** | Track CWV per page over time |
| **Backlink monitoring** | Integration with Ahrefs/Moz APIs |
