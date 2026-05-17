import React from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppState } from '../state.js';

export function AuditScreen() {
  const { setScreen } = useAppState();

  useInput((input, key) => {
    if (key.escape || input === 'q') setScreen('main-menu');
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>🛠  Audit & Fix</Text>
      <Text> </Text>
      <Text>Run a full SEO audit of your project.</Text>
      <Text> </Text>
      <Text>Esc: back</Text>
    </Box>
  );
}
