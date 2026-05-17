import type { AuditIssue } from '@openseo/core';
import type { ExtractedPage, RobotsAnalysis } from './types.js';

function countBy<T>(arr: T[], key: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of arr) {
    const k = key(item);
    counts[k] = (counts[k] || 0) + 1;
  }
  return counts;
}

export function analyzeMeta(pages: ExtractedPage[]): AuditIssue[] {
  const issues: AuditIssue[] = [];

  const missingTitle = pages.filter((p) => !p.title);
  if (missingTitle.length > 0) {
    issues.push({
      id: 'missing-title',
      severity: 'critical',
      category: 'technical',
      title: 'Pages missing <title> tag',
      description: `${missingTitle.length} page${missingTitle.length > 1 ? 's' : ''} missing a <title> tag`,
      location: missingTitle.map((p) => p.url).join(', '),
      recommendation: 'Add a unique, descriptive <title> tag to each page (50-60 characters).',
      fixAvailable: false,
      aiSuggested: false,
    });
  }

  const missingDesc = pages.filter((p) => !p.metaDescription);
  if (missingDesc.length > 0) {
    issues.push({
      id: 'missing-meta-description',
      severity: 'high',
      category: 'technical',
      title: 'Pages missing meta description',
      description: `${missingDesc.length} page${missingDesc.length > 1 ? 's' : ''} missing meta description`,
      location: missingDesc.map((p) => p.url).join(', '),
      recommendation: 'Add a unique meta description to each page (120-160 characters).',
      fixAvailable: false,
      aiSuggested: false,
    });
  }

  const missingCanonical = pages.filter((p) => !p.canonical);
  if (missingCanonical.length > 0) {
    issues.push({
      id: 'missing-canonical',
      severity: 'high',
      category: 'technical',
      title: 'Pages missing canonical URL',
      description: `${missingCanonical.length} page${missingCanonical.length > 1 ? 's' : ''} missing canonical URL`,
      location: missingCanonical.map((p) => p.url).join(', '),
      recommendation: 'Set a self-referencing canonical URL on each page to prevent duplicate content issues.',
      fixAvailable: false,
      aiSuggested: false,
    });
  }

  return issues;
}

export function analyzeHeadings(pages: ExtractedPage[]): AuditIssue[] {
  const issues: AuditIssue[] = [];

  const noH1 = pages.filter((p) => !p.hasH1);
  if (noH1.length > 0) {
    issues.push({
      id: 'missing-h1',
      severity: 'high',
      category: 'content',
      title: 'Pages missing H1 heading',
      description: `${noH1.length} page${noH1.length > 1 ? 's' : ''} without an H1 tag`,
      location: noH1.map((p) => p.url).join(', '),
      recommendation: 'Add one H1 tag per page that describes the main topic.',
      fixAvailable: false,
      aiSuggested: false,
    });
  }

  const multiH1 = pages.filter((p) => p.hasMultipleH1);
  if (multiH1.length > 0) {
    issues.push({
      id: 'multiple-h1',
      severity: 'medium',
      category: 'content',
      title: 'Pages with multiple H1 tags',
      description: `${multiH1.length} page${multiH1.length > 1 ? 's' : ''} with more than one H1`,
      location: multiH1.map((p) => p.url).join(', '),
      recommendation: 'Use only one H1 per page. Use H2-H6 for sub-sections.',
      fixAvailable: false,
      aiSuggested: false,
    });
  }

  return issues;
}

export function analyzeLinks(pages: ExtractedPage[]): AuditIssue[] {
  const issues: AuditIssue[] = [];

  const pagesWithBroken: { url: string; broken: string[] }[] = [];

  const allLinks = pages.flatMap((p) => p.links);
  const internalLinks = allLinks.filter((l) => l.isInternal);
  const externalLinks = allLinks.filter((l) => !l.isInternal);

  if (internalLinks.length === 0 && pages.length > 1) {
    issues.push({
      id: 'no-internal-links',
      severity: 'medium',
      category: 'links',
      title: 'No internal links found',
      description: 'Pages do not link to each other internally',
      location: pages[0]?.url || '',
      recommendation: 'Add internal links between related pages to improve navigation and SEO.',
      fixAvailable: false,
      aiSuggested: false,
    });
  }

  const nofollowCount = allLinks.filter((l) => l.rel?.includes('nofollow')).length;
  if (nofollowCount > 10) {
    issues.push({
      id: 'excessive-nofollow',
      severity: 'low',
      category: 'links',
      title: 'Excessive nofollow links',
      description: `${nofollowCount} links use rel="nofollow"`,
      location: pages[0]?.url || '',
      recommendation: 'Use nofollow sparingly. Only apply to sponsored content or untrusted user submissions.',
      fixAvailable: false,
      aiSuggested: false,
    });
  }

  return issues;
}

export function analyzeImages(pages: ExtractedPage[]): AuditIssue[] {
  const issues: AuditIssue[] = [];

  const pagesWithMissingAlt: { url: string; count: number }[] = [];

  for (const page of pages) {
    const missingAlt = page.images.filter((img) => !img.alt);
    if (missingAlt.length > 0) {
      pagesWithMissingAlt.push({ url: page.url, count: missingAlt.length });
    }
  }

  if (pagesWithMissingAlt.length > 0) {
    const totalMissing = pagesWithMissingAlt.reduce((s, p) => s + p.count, 0);
    issues.push({
      id: 'missing-alt-text',
      severity: 'high',
      category: 'images',
      title: 'Images missing alt text',
      description: `${totalMissing} image${totalMissing > 1 ? 's' : ''} across ${pagesWithMissingAlt.length} page${pagesWithMissingAlt.length > 1 ? 's' : ''} missing alt text`,
      location: pagesWithMissingAlt.map((p) => `${p.url} (${p.count})`).join(', '),
      recommendation: 'Add descriptive alt text to all images for accessibility and SEO.',
      fixAvailable: false,
      aiSuggested: false,
    });
  }

  const pagesWithLazy = pages.filter((p) => p.images.some((img) => img.lazy));
  const totalImages = pages.reduce((s, p) => s + p.images.length, 0);
  const lazyImages = pages.reduce((s, p) => s + p.images.filter((img) => img.lazy).length, 0);
  const lazyRatio = totalImages > 0 ? lazyImages / totalImages : 0;

  if (lazyRatio > 0.5 && pagesWithLazy.length > 0) {
    issues.push({
      id: 'excessive-lazy-loading',
      severity: 'low',
      category: 'images',
      title: 'Excessive lazy loading on images',
      description: `${Math.round(lazyRatio * 100)}% of images use loading="lazy"`,
      location: pagesWithLazy[0]?.url || '',
      recommendation: 'Consider eager-loading above-the-fold (hero) images for better LCP.',
      fixAvailable: false,
      aiSuggested: false,
    });
  }

  return issues;
}

export function analyzeContent(pages: ExtractedPage[]): AuditIssue[] {
  const issues: AuditIssue[] = [];

  const thinContent = pages.filter((p) => p.wordCount < 300 && p.wordCount > 0);
  if (thinContent.length > 0) {
    issues.push({
      id: 'thin-content',
      severity: 'medium',
      category: 'content',
      title: 'Pages with thin content (<300 words)',
      description: `${thinContent.length} page${thinContent.length > 1 ? 's' : ''} with fewer than 300 words`,
      location: thinContent.map((p) => `${p.url} (${p.wordCount} words)`).join(', '),
      recommendation: 'Expand content to at least 300 words per page for better SEO performance.',
      fixAvailable: false,
      aiSuggested: false,
    });
  }

  const zeroContent = pages.filter((p) => p.wordCount === 0);
  if (zeroContent.length > 0) {
    issues.push({
      id: 'zero-content',
      severity: 'medium',
      category: 'content',
      title: 'Pages with no body content',
      description: `${zeroContent.length} page${zeroContent.length > 1 ? 's' : ''} with zero body text`,
      location: zeroContent.map((p) => p.url).join(', '),
      recommendation: 'Ensure each page has meaningful body content for users and search engines.',
      fixAvailable: false,
      aiSuggested: false,
    });
  }

  return issues;
}

export function analyzeSchema(pages: ExtractedPage[]): AuditIssue[] {
  const issues: AuditIssue[] = [];

  const noSchema = pages.filter((p) => p.jsonLd.length === 0);
  if (noSchema.length === pages.length) {
    issues.push({
      id: 'no-structured-data',
      severity: 'high',
      category: 'schema',
      title: 'No structured data found',
      description: 'No JSON-LD structured data detected on any page',
      location: pages[0]?.url || '',
      recommendation: 'Add structured data (e.g., Organization, Article, BreadcrumbList) to improve search result appearance.',
      fixAvailable: true,
      aiSuggested: false,
    });
  } else if (noSchema.length > 0 && noSchema.length < pages.length) {
    issues.push({
      id: 'partial-structured-data',
      severity: 'medium',
      category: 'schema',
      title: 'Some pages missing structured data',
      description: `${noSchema.length} of ${pages.length} pages have no structured data`,
      location: noSchema.map((p) => p.url).join(', '),
      recommendation: 'Ensure all pages have appropriate structured data for their content type.',
      fixAvailable: true,
      aiSuggested: false,
    });
  }

  const typesFound = new Set(pages.flatMap((p) => p.jsonLd.map((j) => j['@type']).filter(Boolean)));
  if (typesFound.size > 0) {
    const typeList = Array.from(typesFound).flat().join(', ');
    issues.push({
      id: 'schema-types-found',
      severity: 'info',
      category: 'schema',
      title: 'Structured data types detected',
      description: `Found schema types: ${typeList}`,
      location: pages[0]?.url || '',
      recommendation: 'Validate structured data using Google Rich Results Test.',
      fixAvailable: false,
      aiSuggested: false,
    });
  }

  return issues;
}

export function analyzeHreflang(pages: ExtractedPage[]): AuditIssue[] {
  const issues: AuditIssue[] = [];

  const withHreflang = pages.filter((p) => p.hreflang.length > 0);
  if (withHreflang.length === 0 && pages.length > 0) {
    // No hreflang found — info only
    issues.push({
      id: 'no-hreflang',
      severity: 'low',
      category: 'technical',
      title: 'No hreflang tags found',
      description: 'No alternate language tags detected on crawled pages',
      location: pages[0]?.url || '',
      recommendation: 'Add hreflang tags if you have multi-language content to serve correct language versions.',
      fixAvailable: false,
      aiSuggested: false,
    });
  }

  return issues;
}

export function analyzeRobots(robots: RobotsAnalysis | null): AuditIssue[] {
  const issues: AuditIssue[] = [];

  if (!robots) {
    issues.push({
      id: 'no-robots-txt',
      severity: 'high',
      category: 'technical',
      title: 'No robots.txt found',
      description: 'The site does not have a robots.txt file',
      location: '/robots.txt',
      recommendation: 'Add a robots.txt file to manage crawler access and point to your sitemap.',
      fixAvailable: true,
      aiSuggested: false,
    });
    return issues;
  }

  for (const ai of robots.aiCrawlers) {
    if (ai.status === 'blocked') {
      issues.push({
        id: `ai-crawler-blocked-${ai.crawler}`,
        severity: 'high',
        category: 'technical',
        title: `${ai.crawler} blocked in robots.txt`,
        description: `${ai.crawler} (${ai.userAgent}) is disallowed from crawling`,
        location: '/robots.txt',
        recommendation: `Consider allowing ${ai.crawler} if you want AI search engines to index your content.`,
        fixAvailable: true,
        aiSuggested: false,
      });
    }
  }

  if (!robots.hasWildcardAllow && !robots.hasWildcardDisallow && robots.sitemaps.length === 0) {
    issues.push({
      id: 'no-sitemap-in-robots',
      severity: 'low',
      category: 'technical',
      title: 'No sitemap referenced in robots.txt',
      description: 'robots.txt does not contain a Sitemap directive',
      location: '/robots.txt',
      recommendation: 'Add a Sitemap directive to robots.txt to help search engines discover all pages.',
      fixAvailable: true,
      aiSuggested: false,
    });
  }

  return issues;
}

export function analyzeAll(pages: ExtractedPage[], robots: RobotsAnalysis | null): AuditIssue[] {
  return [
    ...analyzeMeta(pages),
    ...analyzeHeadings(pages),
    ...analyzeLinks(pages),
    ...analyzeImages(pages),
    ...analyzeContent(pages),
    ...analyzeSchema(pages),
    ...analyzeHreflang(pages),
    ...analyzeRobots(robots),
  ];
}
