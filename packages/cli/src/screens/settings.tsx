import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppState } from '../state.js';
import type { ProviderType } from '@openseo/agents';

type Field = 'provider' | 'apiKey' | 'model' | 'baseUrl';

const PROVIDERS: ProviderType[] = ['openai', 'anthropic', 'google', 'ollama'];

const FIELD_LABELS: Record<Field, string> = {
  provider: 'Provider',
  apiKey: 'API Key',
  model: 'Model',
  baseUrl: 'Base URL',
};

const FIELD_PROPS: Record<Field, { defaultVal: string; secret: boolean }> = {
  provider: { defaultVal: 'openai', secret: false },
  apiKey: { defaultVal: '', secret: true },
  model: { defaultVal: '', secret: false },
  baseUrl: { defaultVal: '', secret: false },
};

export function SettingsScreen() {
  const { setScreen, providerConfig, updateProviderConfig } = useAppState();
  const [cursor, setCursor] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState('');

  const fields: Field[] = ['provider', 'apiKey', 'model', 'baseUrl'];

  function getDisplayValue(field: Field): string {
    if (field === 'provider') return providerConfig.provider;
    const key = field as keyof typeof providerConfig;
    const val = providerConfig[key] as string;
    if (field === 'apiKey' && val) return val.slice(0, 8) + '…' + val.slice(-4);
    return val || '(not set)';
  }

  function commitEdit() {
    if (fields[cursor] === 'provider') {
      const idx = PROVIDERS.indexOf(providerConfig.provider as ProviderType);
      const next = PROVIDERS[(idx + 1) % PROVIDERS.length];
      updateProviderConfig({ provider: next });
    } else {
      const field = fields[cursor];
      updateProviderConfig({ [field]: editBuffer });
    }
    setEditing(false);
  }

  useInput((input, key) => {
    if (key.escape) {
      if (editing) { setEditing(false); return; }
      setScreen('main-menu');
      return;
    }

    if (editing) {
      if (key.return) { commitEdit(); return; }
      if (key.backspace || key.delete) { setEditBuffer((p) => p.slice(0, -1)); return; }
      if (input.length === 1 && input.charCodeAt(0) >= 32) { setEditBuffer((p) => p + input); return; }
      return;
    }

    if (key.upArrow || input === 'k') setCursor((p) => Math.max(0, p - 1));
    else if (key.downArrow || input === 'j') setCursor((p) => Math.min(fields.length - 1, p + 1));
    else if (key.return) {
      const field = fields[cursor];
      if (field === 'provider') {
        const idx = PROVIDERS.indexOf(providerConfig.provider as ProviderType);
        const next = PROVIDERS[(idx + 1) % PROVIDERS.length];
        updateProviderConfig({ provider: next });
      } else {
        const key2 = field as keyof typeof providerConfig;
        setEditBuffer(String(providerConfig[key2] || ''));
        setEditing(true);
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>⚙️  Settings — LLM Provider</Text>
      <Box height={1} />
      <Text dimColor>Configure your AI provider for enhanced suggestions and chat.</Text>
      <Box height={1} />

      {fields.map((field, i) => {
        const isActive = i === cursor;
        const display = getDisplayValue(field);
        const editingThis = editing && isActive;

        return (
          <Box key={field}>
            <Text>{isActive ? '▸' : ' '}</Text>
            <Box width={14}><Text bold={isActive}> {FIELD_LABELS[field]}:</Text></Box>
            {editingThis ? (
              <Text color="cyan">{editBuffer}█</Text>
            ) : (
              <Text color={FIELD_PROPS[field].secret && display !== '(not set)' ? 'green' : isActive ? 'cyan' : 'white'}>
                {FIELD_PROPS[field].secret && display !== '(not set)' ? '••••••••' : display}
              </Text>
            )}
          </Box>
        );
      })}

      <Box height={1} />
      {providerConfig.provider !== 'ollama' && !providerConfig.apiKey && (
        <Text color="yellow">⚠️  No API key set. Set via this screen or {providerConfig.provider.toUpperCase()}_API_KEY env var.</Text>
      )}

      <Box height={1} />
      <Text>Press <Text bold>Enter</Text> to edit field, <Text bold>Esc</Text> to go back</Text>
      <Text dimColor>Provider cycles through: openai → anthropic → google → ollama</Text>
    </Box>
  );
}
