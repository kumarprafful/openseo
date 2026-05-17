# Agent Communication Protocol

> Defines how AI agents communicate within the OpenSEO multi-agent system.

## Message Format

All inter-agent communication uses a structured JSON format:

```typescript
interface AgentMessage {
  id: string;                          // Unique message ID
  from: AgentId;                       // Sender agent
  to: AgentId | 'orchestrator';        // Recipient
  type: MessageType;                   // See below
  timestamp: string;                   // ISO 8601
  correlationId: string;               // Links related messages
  payload: Record<string, unknown>;    // Message body
  metadata?: {
    tokensUsed?: number;
    model?: string;
    duration?: number;
  };
}

type AgentId = 
  | 'orchestrator'
  | 'strategist'
  | 'creator'
  | 'optimizer'
  | 'geo-specialist'
  | 'auditor'
  | 'schema-agent';

type MessageType =
  | 'request'       // Ask another agent to do work
  | 'response'      // Return results
  | 'progress'      // Status update for long tasks
  | 'question'      // Agent needs clarification
  | 'clarification' // Answer to a question
  | 'error'         // Something went wrong
  | 'gate'          // Human-in-the-loop required
  | 'gate-result';  // Human decision
```

## Tool Definitions

Tools are the operations agents can perform. Each tool has a strict schema:

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  input: JSONSchema;     // JSON Schema for input validation
  output: JSONSchema;    // JSON Schema for output validation
  cost?: 'cheap' | 'moderate' | 'expensive';
  requiresHuman?: boolean;
}
```

### Shared Tools

```typescript
// All agents can use:
const SHARED_TOOLS: ToolDefinition[] = [
  {
    name: 'read-file',
    description: 'Read a file from the project directory',
    input: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
    output: { type: 'object', properties: { content: { type: 'string' }, exists: { type: 'boolean' } } },
  },
  {
    name: 'write-file',
    description: 'Write content to a file (does not overwrite without force)',
    input: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' }, force: { type: 'boolean' } }, required: ['path', 'content'] },
    output: { type: 'object', properties: { written: { type: 'boolean' }, skipped: { type: 'boolean' } } },
  },
  {
    name: 'run-command',
    description: 'Execute a shell command in the project directory',
    input: { type: 'object', properties: { command: { type: 'string' }, timeout: { type: 'number' } }, required: ['command'] },
    output: { type: 'object', properties: { stdout: { type: 'string' }, stderr: { type: 'string' }, exitCode: { type: 'number' } } },
    requiresHuman: true, // Shell access is gated
  },
  {
    name: 'web-search',
    description: 'Search the web for information (competitors, keywords, trends)',
    input: { type: 'object', properties: { query: { type: 'string' }, numResults: { type: 'number' } }, required: ['query'] },
    output: { type: 'object', properties: { results: { type: 'array', items: { type: 'object' } } } },
    cost: 'moderate',
  },
];
```

### Specialist Tools

Each agent has its own set of tools. See `docs/05-ai-agents.md` for per-agent tool lists.

## Communication Flow

```
1. Orchestrator receives task from user (via TUI or CLI)
         │
         ▼
2. Orchestrator plans execution: determines which agents,
   in what order, with what dependencies
         │
         ▼
3. For each step:
   │
   ├─ 3a. Send 'request' to specialist agent
   │       with task and context (correlationId)
   │
   ├─ 3b. Specialist sends 'progress' updates
   │       (for long operations shown in TUI)
   │
   ├─ 3c. Specialist may send 'question' to orchestrator
   │       (e.g., "Should I target short-tail or long-tail keywords?")
   │
   ├─ 3d. Orchestrator may forward 'gate' to TUI
   │       (human-in-the-loop approval required)
   │
   └─ 3e. Specialist sends 'response' or 'error'
         │
         ▼
4. Orchestrator collects all responses
         │
         ▼
5. Orchestrator synthesizes final output
   (may involve requesting revisions from specialists)
         │
         ▼
6. Final output sent to TUI for display/confirmation
```

## Output Schemas

### AuditResult

```typescript
interface AuditResult {
  url: string;
  score: number;              // 0-100
  issues: AuditIssue[];
  summary: string;            // Human-readable summary
}

interface AuditIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'technical' | 'content' | 'geo' | 'schema' | 'performance';
  title: string;
  description: string;
  location: string;           // File path or URL
  lineNumber?: number;
  recommendation: string;
  fixAvailable: boolean;
  aiSuggested: boolean;       // False = deterministic, true = AI-generated
}
```

### GeoResult

```typescript
interface GeoResult {
  url: string;
  overallScore: number;       // 0-100
  checks: GeoCheck[];
  topFixes: string[];         // Priority-ordered fix suggestions
}

interface GeoCheck {
  name: string;
  score: number;              // 0-100
  weight: 'high' | 'med' | 'low';
  status: 'pass' | 'warn' | 'fail';
  details: string;
  recommendation: string;
}
```

### ContentStrategy

```typescript
interface ContentStrategy {
  siteAnalysis: {
    totalPosts: number;
    topics: string[];
    gaps: string[];
  };
  topicClusters: TopicCluster[];
  contentBriefs: ContentBrief[];
  recommendations: string[];
}

interface TopicCluster {
  pillar: string;
  subtopics: string[];
  searchVolume: number;
  competition: 'low' | 'medium' | 'high';
}

interface ContentBrief {
  title: string;
  targetKeywords: string[];
  outline: string[];
  wordCount: number;
  competitorUrls: string[];
  geoOptimization: string[];   // GEO-specific notes
}
```

## Error Protocol

```typescript
interface AgentError {
  code: string;
  message: string;           // Human-readable
  retryable: boolean;
  suggestion?: string;       // What to try next
  details?: unknown;
}

// Standard error codes
const ERROR_CODES = {
  TOOL_FAILURE: 'TOOL_FAILURE',
  MODEL_TIMEOUT: 'MODEL_TIMEOUT',
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_INPUT: 'INVALID_INPUT',
  HUMAN_REQUIRED: 'HUMAN_REQUIRED',
  UNKNOWN: 'UNKNOWN',
} as const;
```

## Context Sharing

Agents share context through a `Context` object passed with each request:

```typescript
interface AgentContext {
  projectInfo: ProjectInfo;       // From project detection
  existingSEO: ExistingSEO;       // Current SEO state
  conversationHistory: AgentMessage[];
  correlationId: string;
  userPreferences: {
    providers: string[];
    modelRouting: 'auto' | 'manual';
    autoFix: boolean;
    humanGateLevel: 'all' | 'critical' | 'none';
  };
}
```

## Streaming Progress

For long-running agent operations, progress updates are streamed to the TUI:

```typescript
interface ProgressUpdate {
  correlationId: string;
  agentId: AgentId;
  status: 'running' | 'completed' | 'failed';
  progress: number;             // 0-100
  currentStep?: string;
  estimatedSecondsRemaining?: number;
  partialOutput?: unknown;      // Incremental results
}
```

The TUI subscribes to progress events via an event emitter and updates the progress bar in real-time.
