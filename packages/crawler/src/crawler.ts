import { chromium, type Page, type Browser } from 'playwright';
import type { CrawlConfig, CrawlProgress, CrawlResult, ExtractedPage, ProgressCallback } from './types.js';
import { extractPageData } from './extractors.js';
import { fetchAndAnalyzeRobotsTxt, analyzeRobotsTxt } from './robots-parser.js';

const DEFAULT_CONFIG = {
  maxPages: 30,
  maxDepth: 2,
  sameOrigin: true,
  renderJs: true,
  timeout: 30000,
};

function normalizeUrl(href: string, base: string): string | null {
  try {
    const url = new URL(href, base);
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
}

export async function crawl(config: CrawlConfig, onProgress?: ProgressCallback): Promise<CrawlResult> {
  const opts = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();

  const visited = new Set<string>();
  const queue: { url: string; depth: number }[] = [];
  const pages: ExtractedPage[] = [];

  const baseUrl = normalizeUrl(opts.url, opts.url);
  if (!baseUrl) throw new Error(`Invalid URL: ${opts.url}`);

  queue.push({ url: baseUrl, depth: 0 });
  const origin = new URL(baseUrl).origin;

  const emit = (phase: CrawlProgress['phase'], current: number, total: number, message?: string) => {
    onProgress?.({ phase, current, total, message });
  };

  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ userAgent: 'OpenSEO-Crawler/1.0' });

    onProgress?.({ phase: 'robots', current: 0, total: 1, message: 'Fetching robots.txt' });
    const robotsAnalysis = await fetchAndAnalyzeRobotsTxt(opts.url);
    onProgress?.({ phase: 'robots', current: 1, total: 1, message: 'Robots.txt analyzed' });

    let totalDiscovered = queue.length;

    while (queue.length > 0 && pages.length < opts.maxPages) {
      const { url: pageUrl, depth } = queue.shift()!;
      if (visited.has(pageUrl)) continue;
      if (depth > opts.maxDepth) continue;
      visited.add(pageUrl);

      if (opts.excludePatterns?.some((p) => p.test(pageUrl))) continue;
      if (opts.includePatterns && !opts.includePatterns.some((p) => p.test(pageUrl))) continue;

      const pageNum = pages.length + 1;
      emit('crawling', pageNum, Math.min(opts.maxPages, totalDiscovered), pageUrl);

      let page: Page | null = null;
      try {
        page = await context.newPage();
        page.setDefaultTimeout(opts.timeout);

        const response = await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: opts.timeout });

        emit('extracting', pageNum, Math.min(opts.maxPages, totalDiscovered), pageUrl);

        const extracted = await extractPageData(page, pageUrl, depth, opts.captureHtml);
        if (response) extracted.status = response.status();
        pages.push(extracted);

        if (depth < opts.maxDepth) {
          for (const link of extracted.links) {
            const normalized = normalizeUrl(link.href, pageUrl);
            if (!normalized || visited.has(normalized)) continue;

            if (opts.sameOrigin && !normalized.startsWith(origin)) continue;

            if (link.rel === 'nofollow' || link.rel === 'ugc' || link.rel === 'sponsored') continue;

            const isHtml = /\.(html?|php|asp|aspx)$/i.test(normalized) || !/\.[a-z]+$/i.test(normalized.split('?')[0]);
            if (!isHtml) continue;

            if (!queue.some((q) => q.url === normalized)) {
              queue.push({ url: normalized, depth: depth + 1 });
              totalDiscovered = Math.max(totalDiscovered, pages.length + queue.length);
            }
          }
        }
      } catch {
        // skip failed pages
      } finally {
        if (page) await page.close().catch(() => {});
      }
    }

    emit('analyzing', 0, 0);

    const durationMs = Date.now() - startTime;

    return { pages, robots: robotsAnalysis, durationMs };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
