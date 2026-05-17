import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  dts: true,
  clean: true,
  target: 'node20',
  external: [
    'langchain',
    '@langchain/core',
    '@langchain/openai',
    '@langchain/anthropic',
    '@langchain/google-genai',
    '@langchain/ollama',
    '@langchain/community',
    'zod',
    'playwright',
  ],
});
