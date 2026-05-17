import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppState } from '../state.js';
import { crawl, analyzeAll, fetchAndAnalyzeRobotsTxt } from '@openseo/crawler';
import type { CrawlProgress, ExtractedPage, RobotsAnalysis } from '@openseo/crawler';
import type { AuditIssue, AuditResult } from '@openseo/core';

type AuditMode = 'input' | 'running' | 'results';

function severityColor(s: AuditIssue['severity']): string {
  switch (s) {
    case 'critical': return 'red';
    case 'high': return 'yellow';
    case 'medium': return 'blue';
    case 'low': return 'green';
    case 'info': return 'white';
  }
}

function severityLabel(s: AuditIssue['severity']): string {
  switch (s) {
    case 'critical': return 'CRITICAL';
    case 'high': return 'HIGH';
    case 'medium': return 'MEDIUM';
    case 'low': return 'LOW';
    case 'info': return 'INFO';
  }
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const width = 20;
  const filled = total > 0 ? Math.round((current / total) * width) : 0;
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  return <Text>{bar} {current}/{total}</Text>;
}

export function AuditScreen() {
  const { setScreen } = useAppState();
  const [mode, setMode] = useState<AuditMode>('input');
  const [url, setUrl] = useState('http://localhost:3000');
  const [editing, setEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState('');
  const [progress, setProgress] = useState<Record<string, { current: number; total: number; done: boolean; message?: string }>>({});
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<number | null>(null);
  const [resultsCursor, setResultsCursor] = useState(0);

  const onProgress = useCallback((p: CrawlProgress) => {
    setProgress((prev) => ({
      ...prev,
      [p.phase]: { current: p.current, total: p.total, done: p.phase === 'complete', message: p.message },
    }));
  }, []);

  useInput((input, key) => {
    if (key.escape) {
      if (mode === 'input') { setScreen('main-menu'); return; }
      if (mode === 'results') { setMode('input'); setResult(null); return; }
      if (mode === 'running') { /* could cancel */ return; }
    }

    if (mode === 'input') {
      if (editing) {
        if (key.return) {
          setUrl(editBuffer);
          setEditing(false);
        } else if (key.backspace || key.delete) {
          setEditBuffer((p) => p.slice(0, -1));
        } else if (input.length === 1 && input.charCodeAt(0) >= 32) {
          setEditBuffer((p) => p + input);
        }
        return;
      }

      if (input === 'e') {
        setEditBuffer(url);
        setEditing(true);
        return;
      }

      if (key.return) {
        startAudit();
        return;
      }
    }

    if (mode === 'results') {
      if (key.upArrow || input === 'k') {
        setResultsCursor((p) => Math.max(0, p - 1));
      } else if (key.downArrow || input === 'j') {
        if (result) {
          const total = result.issues.length;
          setResultsCursor((p) => Math.min(total - 1, p + 1));
        }
      }
    }
  });

  async function startAudit() {
    setMode('running');
    setError(null);
    setResult(null);
    setProgress({});
    selectedIssue;

    const startTime = Date.now();

    try {
      setProgress({ robots: { current: 0, total: 1, done: false, message: 'Fetching robots.txt' } });

      const [crawlResult, robots] = await Promise.all([
        crawl({ url, maxPages: 30, maxDepth: 2, sameOrigin: true }, onProgress),
        fetchAndAnalyzeRobotsTxt(url).catch(() => null),
      ]);

      setProgress((prev) => ({
        ...prev,
        robots: { current: 1, total: 1, done: true, message: 'Robots.txt analyzed' },
      }));

      const issues = analyzeAll(crawlResult.pages, robots);

      const summary = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
      for (const issue of issues) {
        summary[issue.severity]++;
      }

      setResult({
        url,
        pagesCrawled: crawlResult.pages.length,
        totalPages: crawlResult.pages.length,
        durationMs: Date.now() - startTime,
        issues,
        summary,
      });

      setMode('results');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Audit failed');
      setMode('input');
    }
  }

  if (mode === 'results' && result) {
    const sortedIssues = [...result.issues].sort((a, b) => {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return (order[a.severity] ?? 5) - (order[b.severity] ?? 5);
    });

    return (
      <Box flexDirection="column" padding={1}>
        <Text bold>🛠  Audit Results</Text>
        <Box height={1} />
        <Text>URL: {result.url}</Text>
        <Text>Crawled: {result.pagesCrawled} pages in {(result.durationMs / 1000).toFixed(1)}s</Text>
        <Box height={1} />

        <Text bold>
          Found {result.issues.length} issue{result.issues.length !== 1 ? 's' : ''}
        </Text>
        <Box height={1} />

        {(['critical', 'high', 'medium', 'low', 'info'] as const).map((sev) => {
          const sevIssues = sortedIssues.filter((i) => i.severity === sev);
          if (sevIssues.length === 0) return null;
          return (
            <Box key={sev} flexDirection="column" marginBottom={1}>
              <Text bold color={severityColor(sev)}>
                {severityLabel(sev)} ({sevIssues.length})
              </Text>
              {sevIssues.map((issue, i) => (
                <Text key={issue.id}>
                  {'  '}{issue.fixAvailable ? <Text color="green">[Fix]</Text> : <Text color="gray">[--]</Text>}{' '}
                  {issue.title}{' '}
                  <Text dimColor>{issue.location.length > 50 ? issue.location.slice(0, 50) + '...' : issue.location}</Text>
                </Text>
              ))}
            </Box>
          );
        })}

        <Box height={1} />
        <Text dimColor>Esc: back</Text>
      </Box>
    );
  }

  if (mode === 'running') {
    const phases = [
      { key: 'robots', label: 'Robots.txt audit' },
      { key: 'crawling', label: 'Crawling pages' },
      { key: 'extracting', label: 'Extracting data' },
      { key: 'analyzing', label: 'Analyzing' },
    ];

    return (
      <Box flexDirection="column" padding={1}>
        <Text bold>🛠  Audit & Fix — Running</Text>
        <Box height={1} />
        <Text dimColor>Target: {url}</Text>
        <Box height={1} />

        {phases.map(({ key, label }) => {
          const p = progress[key];
          const done = p?.done;
          const active = p && !done;
          return (
            <Box key={key}>
              <Text>
                {done ? <Text color="green">✓</Text> : active ? <Text color="cyan">●</Text> : <Text color="gray">○</Text>}
                {' '}{label}{' '}
                {p && !done && key === 'crawling' ? (
                  <ProgressBar current={p.current} total={p.total} />
                ) : p?.message && !done ? (
                  <Text dimColor>{p.message}</Text>
                ) : null}
                {p?.message && done ? <Text dimColor>{p.message}</Text> : null}
              </Text>
            </Box>
          );
        })}

        <Box height={1} />
        <Text dimColor>Crawling... Esc to cancel</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>🛠  Audit & Fix</Text>
      <Box height={1} />
      <Text>Run a full technical SEO audit of your project.</Text>
      <Box height={1} />

      {editing ? (
        <Box>
          <Text>Target URL: </Text>
          <Text inverse> {editBuffer} </Text>
        </Box>
      ) : (
        <Box>
          <Text>Target URL: </Text>
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
      <Text>Press <Text bold>Enter</Text> to start audit</Text>
      <Text dimColor>Esc: back</Text>
    </Box>
  );
}
