#!/usr/bin/env node
import { render } from 'ink';
import React from 'react';
import { App } from './app.js';

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args = argv.slice(2);
  const parsed: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (key === 'json' || key === 'non-interactive' || key === 'local') {
        parsed[key] = true;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        parsed[key] = args[++i];
      } else {
        parsed[key] = true;
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      // short flags ignored for now
    } else if (!parsed.command) {
      parsed.command = arg;
    }
  }

  return parsed;
}

const parsed = parseArgs(process.argv);
const command = String(parsed.command || '');
const url = parsed.url ? String(parsed.url) : undefined;
const json = parsed.json === true;
const local = parsed.local === true;

if (command === 'audit') {
  const targetUrl = (url as string) || (local ? 'http://localhost:3000' : undefined);
  if (!targetUrl) {
    console.error('Usage: openseo audit --url <url> [--json] [--non-interactive]');
    console.error('       openseo audit --local [--json]');
    process.exit(1);
  }

  const { crawl, analyzeAll, fetchAndAnalyzeRobotsTxt } = await import('@openseo/crawler');

  try {
    const startTime = Date.now();
    const [crawlResult, robots] = await Promise.all([
      crawl({ url: targetUrl, maxPages: 30, maxDepth: 2, sameOrigin: true }),
      fetchAndAnalyzeRobotsTxt(targetUrl).catch(() => null),
    ]);

    const issues = analyzeAll(crawlResult.pages, robots);
    const summary = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const issue of issues) summary[issue.severity]++;

    const result = {
      url: targetUrl,
      pagesCrawled: crawlResult.pages.length,
      durationMs: Date.now() - startTime,
      summary,
      issuesCount: issues.length,
      issues,
    };

    if (json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`\nAudit Results for ${targetUrl}`);
      console.log(`Pages crawled: ${result.pagesCrawled} in ${(result.durationMs / 1000).toFixed(1)}s`);
      console.log(`Issues found: ${result.issuesCount}`);
      console.log(`  Critical: ${summary.critical}`);
      console.log(`  High:     ${summary.high}`);
      console.log(`  Medium:   ${summary.medium}`);
      console.log(`  Low:      ${summary.low}`);
      console.log(`  Info:     ${summary.info}`);
      for (const issue of issues) {
        const tag = issue.fixAvailable ? '[Fix]' : '[--]';
        console.log(`  ${tag} [${issue.severity}] ${issue.title} — ${issue.location.slice(0, 80)}`);
      }
    }

    process.exit(0);
  } catch (e) {
    console.error('Audit failed:', e instanceof Error ? e.message : e);
    process.exit(1);
  }
} else {
  console.error('');
  console.error('  ╭──────────────────────────────────────╮');
  console.error('  │  OpenSEO — SEO/GEO/AEO Engineering   │');
  console.error('  │  v0.1.0                              │');
  console.error('  ╰──────────────────────────────────────╯');
  console.error('');

  const { waitUntilExit } = render(React.createElement(App));
  await waitUntilExit();
}
