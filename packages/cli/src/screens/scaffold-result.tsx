import React from 'react';
import { Box, Text, useInput } from 'ink';

interface Props {
  results: Array<{ path: string; skipped: boolean }>;
  projectDir: string;
  hasContentDir: boolean;
  onBack: () => void;
}

export function ScaffoldResult({ results, hasContentDir, onBack }: Props) {
  const created = results.filter((r) => !r.skipped);
  const skipped = results.filter((r) => r.skipped);

  useInput((_input, key) => {
    if (key.escape || key.return) onBack();
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>✓  Scaffold complete!</Text>
      <Box height={1} />

      {created.length > 0 && (
        <>
          <Text bold>Created {created.length} file{created.length !== 1 ? 's' : ''}:</Text>
          {created.map((r) => (
            <Text key={r.path}>  • {r.path}</Text>
          ))}
        </>
      )}

      {skipped.length > 0 && (
        <>
          <Box height={1} />
          <Text bold dimColor>
            Skipped ({skipped.length} already exist{skipped.length !== 1 ? 's' : ''}):
          </Text>
          {skipped.map((r) => (
            <Text key={r.path} dimColor>  • {r.path} (exists)</Text>
          ))}
        </>
      )}

      <Box height={1} />
      <Text bold>📦 Install runtime deps:</Text>
      <Text>  npm install gray-matter react-markdown remark-gfm</Text>

      {hasContentDir && (
        <>
          <Box height={1} />
          <Text bold>🔧 Install dev deps:</Text>
          <Text>  npm install -D tsx</Text>
          <Box height={1} />
          <Text bold>📝 Add to package.json scripts:</Text>
          <Text>  "validate-seo": "tsx scripts/validate-content.ts"</Text>
        </>
      )}

      <Box height={1} />
      <Text dimColor>Press Enter or Esc to return to menu</Text>
    </Box>
  );
}
