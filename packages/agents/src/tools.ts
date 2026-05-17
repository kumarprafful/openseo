import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export function createCrawlTool() {
  return new DynamicStructuredTool({
    name: 'crawl_site',
    description: 'Crawl a URL and extract page data including meta tags, headings, links, images, schema, and content.',
    schema: z.object({
      url: z.string().url().describe('The URL to crawl'),
      maxPages: z.number().optional().describe('Maximum pages to crawl (default: 10)'),
      maxDepth: z.number().optional().describe('Maximum crawl depth (default: 1)'),
    }),
    func: async ({ url, maxPages = 10, maxDepth = 1 }) => {
      const { crawl } = await import('@openseo/crawler');
      const result = await crawl({ url, maxPages, maxDepth, captureHtml: true });
      return JSON.stringify({
        pagesCrawled: result.pages.length,
        pages: result.pages.map((p) => ({
          url: p.url,
          title: p.title,
          wordCount: p.wordCount,
          headings: p.headings.map((h) => `${'#'.repeat(h.level)} ${h.text}`),
          links: p.links.length,
          images: p.images.length,
          schemaTypes: [...new Set(p.jsonLd.map((j) => j['@type']).filter(Boolean).flat())],
          hasH1: p.hasH1,
          hasMultipleH1: p.hasMultipleH1,
        })),
      });
    },
  });
}

export function createAnalyzeSeoTool() {
  return new DynamicStructuredTool({
    name: 'analyze_seo',
    description: 'Run SEO analysis on crawled pages. Returns issues grouped by severity.',
    schema: z.object({
      url: z.string().url().describe('The URL to analyze'),
    }),
    func: async ({ url }) => {
      const { crawl, analyzeAll, fetchAndAnalyzeRobotsTxt } = await import('@openseo/crawler');
      const [crawlResult, robots] = await Promise.all([
        crawl({ url, maxPages: 30, maxDepth: 2 }),
        fetchAndAnalyzeRobotsTxt(url).catch(() => null),
      ]);
      const issues = analyzeAll(crawlResult.pages, robots);
      return JSON.stringify({
        pagesCrawled: crawlResult.pages.length,
        totalIssues: issues.length,
        bySeverity: {
          critical: issues.filter((i) => i.severity === 'critical').length,
          high: issues.filter((i) => i.severity === 'high').length,
          medium: issues.filter((i) => i.severity === 'medium').length,
        },
        issues: issues.map((i) => ({
          severity: i.severity,
          title: i.title,
          description: i.description,
          recommendation: i.recommendation,
          fixAvailable: i.fixAvailable,
        })),
      });
    },
  });
}

export function createAnalyzeGeoTool() {
  return new DynamicStructuredTool({
    name: 'analyze_geo',
    description: 'Run GEO (Generative Engine Optimization) analysis on a URL. Returns 12 GEO signal scores.',
    schema: z.object({
      url: z.string().url().describe('The URL to analyze for GEO readiness'),
    }),
    func: async ({ url }) => {
      const { crawl, checkAllGeo, calculateGeoScore, fetchAndAnalyzeRobotsTxt } = await import('@openseo/crawler');
      const crawlResult = await crawl({ url, maxPages: 1, maxDepth: 0, captureHtml: true });
      const robots = await fetchAndAnalyzeRobotsTxt(url).catch(() => null);
      const page = crawlResult.pages[0];
      if (!page) return JSON.stringify({ error: 'No content received' });

      const checks = checkAllGeo(page, robots);
      const score = calculateGeoScore(checks);
      return JSON.stringify({
        overallScore: score.overall,
        checks: score.checks.map((c) => ({
          name: c.name,
          score: c.score,
          status: c.status,
          weight: c.weight,
          details: c.details,
          recommendation: c.recommendation,
        })),
      });
    },
  });
}

export function createSuggestionTool() {
  return new DynamicStructuredTool({
    name: 'suggest_fixes',
    description: 'Generate prioritized fix suggestions based on audit issues.',
    schema: z.object({
      issues: z.string().describe('JSON array of audit issues to generate fixes for'),
    }),
    func: async ({ issues }) => {
      const parsed = JSON.parse(issues);
      const suggestions = parsed.map((issue: Record<string, unknown>) => ({
        priority: issue.severity === 'critical' ? 1 : issue.severity === 'high' ? 2 : 3,
        title: issue.title,
        action: issue.fixAvailable ? 'Run `openseo scaffold` to generate the missing files.' : issue.recommendation,
      }));
      suggestions.sort((a: { priority: number }, b: { priority: number }) => a.priority - b.priority);
      return JSON.stringify(suggestions);
    },
  });
}

export function getDefaultTools() {
  return [
    createCrawlTool(),
    createAnalyzeSeoTool(),
    createAnalyzeGeoTool(),
    createSuggestionTool(),
  ];
}
