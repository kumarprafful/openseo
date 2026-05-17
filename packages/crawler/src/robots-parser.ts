import type { AiCrawlerStatus, RobotsAnalysis } from './types.js';

const AI_CRAWLERS = [
  { crawler: 'GPTBot', userAgent: 'GPTBot' },
  { crawler: 'ClaudeBot', userAgent: 'ClaudeBot' },
  { crawler: 'Claude-Web', userAgent: 'Claude-Web' },
  { crawler: 'PerplexityBot', userAgent: 'PerplexityBot' },
  { crawler: 'Google-Extended', userAgent: 'Google-Extended' },
  { crawler: 'Applebot-Extended', userAgent: 'Applebot-Extended' },
  { crawler: 'Bytespider', userAgent: 'Bytespider' },
];

function parseUserAgentSections(raw: string): Map<string, string[]> {
  const sections = new Map<string, string[]>();
  let currentUa = '*';
  const directives: string[] = [];

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const uaMatch = trimmed.match(/^User-agent:\s*(.+)/i);
    if (uaMatch) {
      if (directives.length > 0) {
        sections.set(currentUa, [...directives]);
        directives.length = 0;
      }
      currentUa = uaMatch[1].trim();
      continue;
    }

    directives.push(trimmed);
  }

  if (directives.length > 0) {
    sections.set(currentUa, [...directives]);
  }

  return sections;
}

function getDisallowedPaths(sections: Map<string, string[]>, userAgent: string): string[] {
  const exact = sections.get(userAgent);
  if (exact) return exact.filter((d) => /^disallow:/i.test(d)).map((d) => d.replace(/^disallow:\s*/i, '').trim() || '/');

  const wildcard = sections.get('*');
  if (wildcard) return wildcard.filter((d) => /^disallow:/i.test(d)).map((d) => d.replace(/^disallow:\s*/i, '').trim() || '/');

  return [];
}

export function analyzeRobotsTxt(raw: string): RobotsAnalysis {
  const sections = parseUserAgentSections(raw);

  const aiCrawlers: AiCrawlerStatus[] = AI_CRAWLERS.map(({ crawler, userAgent }) => {
    const disallowed = getDisallowedPaths(sections, userAgent);
    const allowedPaths = sections.get(userAgent)?.filter((d) => /^allow:/i.test(d)).map((d) => d.replace(/^allow:\s*/i, '').trim()) || [];

    let status: AiCrawlerStatus['status'];
    if (disallowed.length > 0 && (disallowed.includes('/') || disallowed.some((p) => p === ''))) {
      status = 'blocked';
    } else if (disallowed.length > 0) {
      status = 'blocked';
    } else if (allowedPaths.length > 0 || sections.has(userAgent)) {
      status = 'allowed';
    } else {
      status = 'not-specified';
    }

    return { crawler, userAgent, status };
  });

  const sitemaps: string[] = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    const match = trimmed.match(/^Sitemap:\s*(.+)/i);
    if (match) sitemaps.push(match[1].trim());
  }

  const wildcardSection = sections.get('*');
  const hasWildcardAllow = wildcardSection?.some((d) => /^allow:/i.test(d)) ?? false;
  const hasWildcardDisallow = wildcardSection?.some((d) => /^disallow:/i.test(d)) ?? false;

  return { content: raw, aiCrawlers, sitemaps, hasWildcardAllow, hasWildcardDisallow };
}

export async function fetchAndAnalyzeRobotsTxt(url: string): Promise<RobotsAnalysis | null> {
  try {
    const robotsUrl = new URL('/robots.txt', url).href;
    const res = await fetch(robotsUrl);
    if (!res.ok) return null;
    const text = await res.text();
    return analyzeRobotsTxt(text);
  } catch {
    return null;
  }
}

export async function readLocalRobotsTxt(projectDir: string): Promise<string | null> {
  try {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const robotsPath = path.join(projectDir, 'public', 'robots.txt');
    if (fs.existsSync(robotsPath)) {
      return fs.readFileSync(robotsPath, 'utf-8');
    }
    return null;
  } catch {
    return null;
  }
}
