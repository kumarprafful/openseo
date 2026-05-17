import React from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppState } from '../state.js';

export function GeoScreen() {
  const { setScreen } = useAppState();

  useInput((input, key) => {
    if (key.escape || input === 'q') setScreen('main-menu');
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>🌐  GEO Analysis</Text>
      <Text> </Text>
      <Text>Analyze pages for generative AI search readiness.</Text>
      <Text> </Text>
      <Text>Esc: back</Text>
    </Box>
  );
}
