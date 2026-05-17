import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppState } from '../state.js';
import { crawl, checkAllGeo, calculateGeoScore, fetchAndAnalyzeRobotsTxt } from '@openseo/crawler';
import type { GeoScore, GeoCheck } from '@openseo/core';

type GeoMode = 'input' | 'running' | 'results';

function statusSymbol(status: GeoCheck['status']): string {
  switch (status) {
    case 'pass': return '✓';
    case 'warn': return '⚠️';
    case 'fail': return '⛔';
  }
}

function statusColor(status: GeoCheck['status']): string {
  switch (status) {
    case 'pass': return 'green';
    case 'warn': return 'yellow';
    case 'fail': return 'red';
  }
}

function scoreColor(score: number): string {
  if (score >= 70) return 'green';
  if (score >= 40) return 'yellow';
  return 'red';
}

function ProgressBarScaled({ value }: { value: number }) {
  const width = 30;
  const filled = Math.round((value / 100) * width);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  return <Text>{bar} {value}/100</Text>;
}

export function GeoScreen() {
  const { setScreen } = useAppState();
  const [mode, setMode] = useState<GeoMode>('input');
  const [url, setUrl] = useState('https://example.com');
  const [editing, setEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<GeoScore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);

  useInput((input, key) => {
    if (key.escape) {
      if (mode === 'input') { setScreen('main-menu'); return; }
      if (mode === 'results') {
        if (detailIndex !== null) { setDetailIndex(null); return; }
        setMode('input'); setResult(null); return;
      }
    }

    if (mode === 'input') {
      if (editing) {
        if (key.return) { setUrl(editBuffer); setEditing(false); return; }
        if (key.backspace || key.delete) { setEditBuffer((p) => p.slice(0, -1)); return; }
        if (input.length === 1 && input.charCodeAt(0) >= 32) { setEditBuffer((p) => p + input); return; }
        return;
      }
      if (input === 'e') { setEditBuffer(url); setEditing(true); return; }
      if (key.return && !running) { runGeo(); return; }
    }

    if (mode === 'results' && detailIndex === null) {
      if (result && /^[0-9]$/.test(input)) {
        const idx = parseInt(input, 10) - 1;
        if (idx >= 0 && idx < result.checks.length) setDetailIndex(idx);
      }
    }
  });

  async function runGeo() {
    setRunning(true);
    setError(null);
    setMode('running');

    try {
      const crawlResult = await crawl({ url, maxPages: 1, maxDepth: 0, captureHtml: true, renderJs: true });
      const robots = await fetchAndAnalyzeRobotsTxt(url).catch(() => null);
      const page = crawlResult.pages[0];
      if (!page) throw new Error('No content received from URL');

      const checks = checkAllGeo(page, robots);
      const score = calculateGeoScore(checks);
      setResult(score);
      setMode('results');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'GEO analysis failed');
      setMode('input');
    }

    setRunning(false);
  }

  if (mode === 'results' && result) {
    if (detailIndex !== null) {
      const check = result.checks[detailIndex];
      return (
        <Box flexDirection="column" padding={1}>
          <Text bold>{statusSymbol(check.status)} {check.name}</Text>
          <Box height={1} />
          <Text>Score: <Text color={scoreColor(check.score)}>{check.score}/100</Text></Text>
          <Text>Weight: {check.weight === 'high' ? 'High' : check.weight === 'med' ? 'Medium' : 'Low'}</Text>
          <Text>Status: <Text color={statusColor(check.status)}>{check.status.toUpperCase()}</Text></Text>
          <Box height={1} />
          <Text bold>Details:</Text>
          <Text>{check.details}</Text>
          {check.recommendation && (
            <>
              <Box height={1} />
              <Text bold>Recommendation:</Text>
              <Text>{check.recommendation}</Text>
            </>
          )}
          <Box height={1} />
          <Text dimColor>Esc: back</Text>
        </Box>
      );
    }

    const passed = result.checks.filter((c) => c.status === 'pass').length;
    const warned = result.checks.filter((c) => c.status === 'warn').length;
    const failed = result.checks.filter((c) => c.status === 'fail').length;

    return (
      <Box flexDirection="column" padding={1}>
        <Text bold>🌐  GEO Analysis — Results</Text>
        <Box height={1} />
        <Text>URL: {url}</Text>
        <Box height={1} />

        <Text bold>
          GEO Score: <Text color={scoreColor(result.overall)}>{result.overall}/100</Text>
        </Text>
        <ProgressBarScaled value={result.overall} />
        <Box height={1} />

        <Text>
          {passed} passed, {warned} warnings, {failed} failed
        </Text>
        <Box height={1} />

        {result.checks.map((check, i) => (
          <Box key={check.name}>
            <Text>
              <Text color={statusColor(check.status)}>{statusSymbol(check.status)}</Text>{' '}
              <Text bold>{check.name}</Text>{' '}
              <Text color={scoreColor(check.score)}>{check.score}/100</Text>{' '}
              <Text dimColor>({check.weight === 'high' ? 'High' : check.weight === 'med' ? 'Medium' : 'Low'})</Text>{' '}
              <Text dimColor>[{i + 1}]</Text>
            </Text>
          </Box>
        ))}

        <Box height={1} />
        <Text dimColor>Press [1-12] for detail  Esc: back</Text>
      </Box>
    );
  }

  if (mode === 'running') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold>🌐  GEO Analysis — Running</Text>
        <Box height={1} />
        <Text dimColor>URL: {url}</Text>
        <Box height={1} />
        <Text color="cyan">● Crawling page...</Text>
        <Text color="cyan">● Extracting data...</Text>
        <Text color="cyan">● Running 12 GEO checks...</Text>
        <Box height={1} />
        <Text dimColor>Please wait...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>🌐  GEO Analysis</Text>
      <Box height={1} />
      <Text>Analyze a page for Generative Engine Optimization readiness.</Text>
      <Text>12 checks score how well AI search engines can use your content.</Text>
      <Box height={1} />

      {editing ? (
        <Box>
          <Text>URL: </Text>
          <Text inverse> {editBuffer} </Text>
        </Box>
      ) : (
        <Box>
          <Text>URL: </Text>
          <Text bold>{url}</Text>
          <Text dimColor>  (e to edit)</Text>
        </Box>
      )}

      {error && (
        <>
          <Box height={1} />
          <Text color="red">Error: {error}</Text>
        </>
      )}

      <Box height={1} />
      <Text>Press <Text bold>Enter</Text> to analyze</Text>
      <Text dimColor>Esc: back</Text>
    </Box>
  );
}
