# Phase 4: AI Agent System (LangChain.js)

> A multi-agent orchestration system built with LangChain.js that specializes in SEO/GEO/AEO workflows.

## Agent Topology

```
User Request
     │
     ▼
┌──────────────────────────────────┐
│  Orchestrator Agent              │  ← Supervisor: plans, delegates, synthesizes
│  - receives task from TUI/CLI    │
│  - decomposes into subtasks      │
│  - routes to specialist agents   │
│  - collects results, synthesizes │
└──────────┬───────────────────────┘
           │
    ┌──────┼──────┬─────────┬──────────┬──────────┐
    ▼      ▼      ▼         ▼          ▼          ▼
┌──────┐ ┌────┐ ┌──────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Strat-│ │Crea-│ │Opti- │ │Geo     │ │Auditor │ │Schema  │
│egist │ │tor  │ │mizer │ │Special.│ │        │ │Agent   │
└──┬───┘ └──┬──┘ └──┬───┘ └───┬────┘ └───┬────┘ └───┬────┘
   │        │       │         │          │          │
   └────────┴───────┴─────────┴──────────┴──────────┘
                    │
                    ▼
         ┌──────────────────┐
         │  Output          │
         │  (content, fixes,│
         │   reports, code, │
         │   suggestions)   │
         └──────────────────┘
```

## Agent Definitions

### Orchestrator Agent

```typescript
interface OrchestratorAgent {
  role: 'SEO Strategy Orchestrator';
  responsibility: 'Plan, delegate, and synthesize SEO/GEO/AEO tasks';
  
  // Tools available
  tools: [
    'delegate-to-strategist',
    'delegate-to-creator',
    'delegate-to-optimizer',
    'delegate-to-geo-specialist',
    'delegate-to-auditor',
    'delegate-to-schema-agent',
  ];

  // Process
  // 1. Receive user request
  // 2. Analyze scope → determine which agents to involve
  // 3. Delegate subtasks in dependency order
  // 4. Collect results, resolve conflicts
  // 5. Synthesize final output
}
```

### Strategist Agent

```typescript
interface StrategistAgent {
  role: 'Content Strategist';
  responsibility: 'Analyze content gaps, identify opportunities, plan topic clusters';
  
  tools: [
    'web-search',
    'crawl-competitor',
    'analyze-content-gaps',
    'generate-topic-clusters',
    'keyword-research',
  ];

  // Output: Content strategy brief with:
  // - Topic clusters
  // - Keyword targets
  // - Content gap analysis
  // - Priority ranking
  // - Internal linking suggestions
}
```

### Creator Agent

```typescript
interface CreatorAgent {
  role: 'Content Creator';
  responsibility: 'Generate, rewrite, and optimize content for SEO/GEO';
  
  tools: [
    'generate-content-brief',
    'write-content',
    'rewrite-content',
    'optimize-for-geo',
    'generate-meta-tags',
    'generate-alt-text',        // Multi-modal: image → alt text
    'generate-og-images',       // Multi-modal: content → OG image prompt
  ];

  // Output: Draft content, metadata, suggested images
}
```

### Optimizer Agent

```typescript
interface OptimizerAgent {
  role: 'On-Page Optimizer';
  responsibility: 'Optimize existing content for search engines and AI platforms';
  
  tools: [
    'analyze-on-page-seo',
    'suggest-keyword-placements',
    'optimize-headings',
    'optimize-internal-links',
    'suggest-structured-data',
  ];

  // Output: Optimization suggestions with diff-like format
}
```

### GEO Specialist Agent

```typescript
interface GEOSpecialistAgent {
  role: 'GEO Optimization Specialist';
  responsibility: 'Optimize content for generative AI citation';
  
  tools: [
    'analyze-geo-signals',
    'rewrite-for-geo',
    'add-statistics-and-citations',
    'generate-llms-txt',
    'check-ai-crawler-access',
  ];

  // Output: GEO-optimized content, llms.txt, AI crawler fixes
}
```

### Auditor Agent

```typescript
interface AuditorAgent {
  role: 'Technical SEO Auditor';
  responsibility: 'Identify technical SEO issues and recommend fixes';
  
  tools: [
    'crawl-site',
    'check-technical-seo',
    'analyze-performance',
    'check-mobile-friendliness',
    'check-core-web-vitals',
  ];

  // Output: Ranked issue list with fix instructions
}
```

### Schema Agent

```typescript
interface SchemaAgent {
  role: 'Structured Data Specialist';
  responsibility: 'Recommend, generate, and validate schema markup';
  
  tools: [
    'analyze-page-content',
    'recommend-schema-types',
    'generate-json-ld',
    'validate-schema',
    'suggest-schema-properties',
  ];

  // Output: Schema markup, validation report
}
```

## LangChain.js Integration

Each agent is a LangChain `Runnable` powered by a `ChatModel` with tool bindings.

```typescript
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOllama } from '@langchain/ollama';
import { AgentExecutor, createReactAgent } from 'langchain/agents';

// Agent factory
function createAgent(config: AgentConfig): AgentExecutor {
  const model = createModel(config.provider, config.model);
  const tools = loadTools(config.tools);
  const prompt = loadPrompt(config.role);

  return createReactAgent({
    llm: model,
    tools,
    prompt,
  });
}
```

## Multi-LLM Routing

Tasks are routed to the optimal model based on capability requirements:

| Task Type | Recommended Model | Rationale |
|---|---|---|
| Content strategy | Claude Sonnet 4 / GPT-4o | Complex reasoning, strategic planning |
| Content creation | GPT-4o / Claude Sonnet | Creative writing, structured output |
| GEO optimization | Claude Sonnet | Nuanced content optimization |
| Technical audit | GPT-4o / Gemini 2.5 | Structured analysis, large context |
| Schema generation | Any capable model | Well-defined, structured task |
| Image analysis (alt text) | GPT-4o / Claude Vision | Multi-modal understanding |
| Quick suggestions | GPT-4o-mini / Claude Haiku | Fast, cheap, good enough |

```typescript
function routeTask(task: Task): ModelConfig {
  const routes: Record<TaskType, ModelConfig> = {
    'strategy':      { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
    'creation':      { provider: 'openai',    model: 'gpt-4o' },
    'geo-optimize':  { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
    'audit':         { provider: 'google',    model: 'gemini-2.5-pro' },
    'schema':        { provider: 'openai',    model: 'gpt-4o-mini' },
    'alt-text':      { provider: 'openai',    model: 'gpt-4o' },
    'quick':         { provider: 'openai',    model: 'gpt-4o-mini' },
  };
  return routes[task.type];
}
```

## Multi-Modal Pipeline

The system supports multi-modal operations through LLM APIs:

```
User provides image (screenshot, social card, etc.)
        │
        ▼
┌──────────────────────┐
│  Multi-modal model    │  (GPT-4o, Claude Vision)
│  - Analyzes image     │
│  - Generates alt text │
│  - Suggests OG cards  │
│  - Extracts text      │
└──────────┬───────────┘
           │
           ▼
Output: structured data, alt text, OG image prompts
```

## Human-in-the-Loop

Critical actions require human confirmation:

```
Agent proposes action
        │
        ▼
┌──────────────────────┐
│  Gate Decision        │
│                      │
│  "Write 3 new blog   │
│   posts about:       │
│   - [topic 1]        │
│   - [topic 2]        │
│   - [topic 3]        │
│                      │
│  [Approve] [Edit] [Reject] │
└──────────────────────┘
        │
        ▼
   Proceed or modify
```

Gate types:
- **Automatic**: Low-risk actions (meta description generation, alt text)
- **Confirm**: Medium-risk (schema changes, content rewrites)
- **Review**: High-risk (publishing content, structural changes)

## Cost Optimization

| Strategy | Implementation |
|---|---|
| **Model tiering** | Use cheap models (Haiku, mini) for simple tasks |
| **Batching** | Batch small analyses into single LLM call |
| **Caching** | Cache identical analyses (same URL, same content) |
| **Local models** | Ollama for private/air-gapped environments |
| **Streaming** | Stream responses for perceived speed |

## LangChain.js Specifics

| LangChain Feature | Usage |
|---|---|
| `AgentExecutor` | Core agent runtime for all specialist agents |
| `Tool` interface | All tools implement this interface |
| `ChatModel` | Provider-agnostic model access |
| `RunnableSequence` | Composable pipeline for multi-step tasks |
| `OutputParser` | Structured output from agent responses |
| `Memory` | Conversation history in chat mode |
| `CallbackHandler` | Progress updates to TUI |
| `Hub` | Shared prompt templates |
