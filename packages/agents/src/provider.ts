import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOllama } from '@langchain/ollama';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

export type ProviderType = 'openai' | 'anthropic' | 'google' | 'ollama';

export interface ProviderConfig {
  provider: ProviderType;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

const DEFAULT_MODELS: Record<ProviderType, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-20250514',
  google: 'gemini-2.0-flash',
  ollama: 'llama3.2',
};

export function createModel(config: ProviderConfig): BaseChatModel {
  const model = config.model || DEFAULT_MODELS[config.provider];

  switch (config.provider) {
    case 'openai':
      return new ChatOpenAI({
        apiKey: config.apiKey || process.env.OPENAI_API_KEY,
        model,
        temperature: 0.3,
      });
    case 'anthropic':
      return new ChatAnthropic({
        apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
        model,
        temperature: 0.3,
      });
    case 'google':
      return new ChatGoogleGenerativeAI({
        apiKey: config.apiKey || process.env.GOOGLE_API_KEY,
        model,
        temperature: 0.3,
      });
    case 'ollama':
      return new ChatOllama({
        baseUrl: config.baseUrl || 'http://localhost:11434',
        model,
        temperature: 0.3,
      });
  }
}

export function suggestModel(task: string): ProviderType {
  const t = task.toLowerCase();
  if (/strateg|plan|gap|topic/i.test(t)) return 'anthropic';
  if (/creat|write|rewrit|generat/i.test(t)) return 'openai';
  if (/geo|optimize|improve/i.test(t)) return 'anthropic';
  if (/audit|technical|check/i.test(t)) return 'google';
  if (/schema|validat/i.test(t)) return 'openai';
  return 'openai';
}
