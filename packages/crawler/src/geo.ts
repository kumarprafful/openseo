import type { ExtractedPage, RobotsAnalysis } from './types.js';
import type { GeoScore, GeoCheck } from '@openseo/core';

const WEIGHT_MULT: Record<string, number> = { high: 3, med: 2, low: 1 };

function textBetween(html: string, tag: string): string[] {
  const results: string[] = [];
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    const stripped = m[1].replace(/<[^>]+>/g, '').trim();
    if (stripped) results.push(stripped);
  }
  return results;
}

function countInHtml(html: string, pattern: RegExp): number {
  return (html.match(pattern) || []).length;
}

function hasMetaTag(html: string, name: string): boolean {
  const regex = new RegExp(`<meta\\s+[^>]*(?:name|property)=["']${name}["']`, 'i');
  return regex.test(html);
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function checkStatsAndCitations(page: ExtractedPage): GeoCheck {
  const html = page.rawHtml || '';
  const numbers = countInHtml(html, /\b\d+(?:\.\d+)?%/g) + countInHtml(html, /\b\d+(?:,\d{3})+(?!\w)/g);
  const citations = countInHtml(html, /\[(\d+|source|ref)\]/g) + countInHtml(html, /<sup>/g);
  const sourceLinks = page.links.filter((l) => /source|ref|citation/i.test(l.text)).length;

  let score = 0;
  if (numbers > 0) score += 40;
  if (citations > 0) score += 30;
  if (sourceLinks > 0) score += 30;

  return {
    name: 'Statistics & Citations',
    score,
    weight: 'high',
    status: score >= 70 ? 'pass' : score >= 30 ? 'warn' : 'fail',
    details: `${numbers} data points, ${citations} citation markers, ${sourceLinks} source links`,
    recommendation: score < 70 ? 'Add statistics backed by authoritative sources with citation markers.' : '',
  };
}

function checkStructuredData(page: ExtractedPage): GeoCheck {
  const types = page.jsonLd.map((j) => j['@type']).filter(Boolean).flat();
  const count = types.length;
  const recommended = ['Article', 'Organization', 'Person', 'FAQPage', 'BreadcrumbList'];
  const found = recommended.filter((t) => types.includes(t));
  const missing = recommended.filter((t) => !types.includes(t));

  let score = 0;
  if (count > 0) score += 30;
  score += Math.min(found.length * 14, 70);

  return {
    name: 'Structured Data',
    score,
    weight: 'high',
    status: score >= 70 ? 'pass' : score >= 30 ? 'warn' : 'fail',
    details: `${count} schema types found. Present: ${found.join(', ') || 'none'}. Missing: ${missing.join(', ') || 'none'}`,
    recommendation: missing.length > 0 ? `Consider adding: ${missing.join(', ')}` : '',
  };
}

function checkDefinitionBlocks(page: ExtractedPage): GeoCheck {
  const html = page.rawHtml || '';
  const h2s = textBetween(html, 'h2');
  const h3s = textBetween(html, 'h3');
  const allHeadings = [...h2s, ...h3s];

  let score = 0;
  if (allHeadings.length > 0) score += 30;

  const hasDefinitionAfterH2 = /<h2[^>]*>[\s\S]*?<\/h2>\s*(?:<p[^>]*>[\s\S]*?<\/p>){1,3}/i.test(html);
  if (hasDefinitionAfterH2) score += 40;

  const parasAfterH2 = countInHtml(html, /<\/h2>[\s\S]*?(?:<p[^>]*>[\s\S]*?<\/p>)/gi);
  if (parasAfterH2 > 0) score += Math.min(parasAfterH2 * 10, 30);

  return {
    name: 'Definition Blocks',
    score,
    weight: 'high',
    status: score >= 70 ? 'pass' : score >= 30 ? 'warn' : 'fail',
    details: `${allHeadings.length} headings, ${parasAfterH2} definition paragraphs after headings`,
    recommendation: score < 70 ? 'Add a 40-60 word definition/summary paragraph after each H2/H3.' : '',
  };
}

function checkAnswerBlocks(page: ExtractedPage): GeoCheck {
  const html = page.rawHtml || '';
  const firstParaMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const firstPara = firstParaMatch ? firstParaMatch[1].replace(/<[^>]+>/g, '').trim() : '';

  let score = 0;
  if (firstPara.length > 0) {
    const wc = countWords(firstPara);
    if (wc >= 40 && wc <= 60) score += 60;
    else if (wc >= 20 && wc < 40) score += 40;
    else if (wc > 60 && wc <= 100) score += 30;
    else score += 10;
  }

  const hasQuestionH2 = /<h2[^>]*>.*?(?:what|how|why|when|where|which|who)\s/i.test(html);
  if (hasQuestionH2) score += 40;

  return {
    name: 'Answer Blocks',
    score,
    weight: 'high',
    status: score >= 70 ? 'pass' : score >= 30 ? 'warn' : 'fail',
    details: firstPara ? `First paragraph: ${countWords(firstPara)} words` : 'No paragraph content found',
    recommendation: score < 70 ? 'Keep first paragraph 40-60 words, directly answering the likely query.' : '',
  };
}

function checkContentExtractability(page: ExtractedPage): GeoCheck {
  const html = page.rawHtml || '';
  const textLen = page.wordCount;
  const imageCount = page.images.length;
  const tables = countInHtml(html, /<table/i);
  const lists = countInHtml(html, /<(?:ul|ol)\s?[^>]*>/g);
  const codeBlocks = countInHtml(html, /<pre>/g) + countInHtml(html, /<code>/g);

  let score = 0;
  if (textLen >= 800) score += 40;
  else if (textLen >= 300) score += 25;
  else if (textLen > 0) score += 10;

  if (tables > 0) score += 15;
  if (lists > 0) score += 15;
  if (codeBlocks > 0) score += 10;

  const textRatio = textLen > 0 ? Math.min(textLen / (imageCount + 1), 300) / 3 : 0;
  score += Math.min(textRatio, 20);

  return {
    name: 'Content Extractability',
    score,
    weight: 'high',
    status: score >= 70 ? 'pass' : score >= 30 ? 'warn' : 'fail',
    details: `${textLen} words, ${imageCount} images, ${tables} tables, ${lists} lists, ${codeBlocks} code blocks`,
    recommendation: score < 70 ? 'Aim for 800+ words with tables, lists, and code blocks for AI-friendly content.' : '',
  };
}

function checkAiBotAccess(robots: RobotsAnalysis | null): GeoCheck {
  if (!robots) {
    return {
      name: 'AI Bot Access',
      score: 0,
      weight: 'high',
      status: 'fail',
      details: 'No robots.txt found',
      recommendation: 'Add robots.txt to manage AI crawler access.',
    };
  }

  const allowed = robots.aiCrawlers.filter((a) => a.status === 'allowed').length;
  const blocked = robots.aiCrawlers.filter((a) => a.status === 'blocked').length;
  const notSpecified = robots.aiCrawlers.filter((a) => a.status === 'not-specified').length;

  let score = 0;
  if (blocked === 0) score += 60;
  if (allowed > 0) score += 20;
  if (notSpecified > 0) score += 10;

  const hasLlmsTxt = robots.content.includes('llms.txt') || robots.content.includes('/llms.txt');
  if (hasLlmsTxt) score += 10;

  return {
    name: 'AI Bot Access',
    score,
    weight: 'high',
    status: score >= 70 ? 'pass' : score >= 30 ? 'warn' : 'fail',
    details: `${allowed} allowed, ${blocked} blocked, ${notSpecified} not specified. llms.txt: ${hasLlmsTxt ? 'referenced' : 'not found'}`,
    recommendation: blocked > 0 ? `Unblock AI crawlers for better visibility in AI search results.` : '',
  };
}

function checkFaqBlocks(page: ExtractedPage): GeoCheck {
  const html = page.rawHtml || '';
  const hasFaqSchema = page.jsonLd.some((j) => {
    const t = j['@type'];
    return Array.isArray(t) ? t.includes('FAQPage') : t === 'FAQPage';
  });
  const hasDl = /<dl>/i.test(html);
  const qaCount = countInHtml(html, /<h[2-4][^>]*>\s*(?:what|how|why|when|where|can|do|does|is|are)\s/i);

  let score = 0;
  if (hasFaqSchema) score += 50;
  if (hasDl) score += 20;
  if (qaCount > 0) score += Math.min(qaCount * 10, 30);

  return {
    name: 'FAQ Blocks',
    score,
    weight: 'med',
    status: score >= 70 ? 'pass' : score >= 30 ? 'warn' : 'fail',
    details: `FAQPage schema: ${hasFaqSchema ? 'yes' : 'no'}, Q&A headings: ${qaCount}, definition lists: ${hasDl ? 'yes' : 'no'}`,
    recommendation: score < 70 ? 'Add FAQPage schema and question-based H2s throughout your content.' : '',
  };
}

function checkContentTypeScoring(page: ExtractedPage): GeoCheck {
  const html = page.rawHtml || '';
  const promotional = countInHtml(html, /\b(buy|shop|order|purchase|discount|sale|price|pricing|subscribe|sign up|get started|free trial|book now|call now)\b/gi);
  const informational = countInHtml(html, /\b(guide|how|what|why|tutorial|learn|understand|explain|overview|introduction|difference|benefit|example|best practices)\b/gi);

  const total = promotional + informational;
  let score = 0;

  if (total > 0) {
    const infoRatio = informational / total;
    score = Math.round(infoRatio * 100);
  }

  return {
    name: 'Content Type Scoring',
    score,
    weight: 'med',
    status: score >= 70 ? 'pass' : score >= 30 ? 'warn' : 'fail',
    details: `${informational} informational vs ${promotional} promotional signals`,
    recommendation: score < 70 ? 'Reduce promotional language and increase informational/educational content for better AI citation rates.' : '',
  };
}

function checkFreshnessSignals(page: ExtractedPage): GeoCheck {
  const html = page.rawHtml || '';
  const dateMeta = hasMetaTag(html, 'date') || hasMetaTag(html, 'article:published_time') || hasMetaTag(html, 'article:modified_time');
  const timeTags = countInHtml(html, /<time\b[^>]*datetime=/gi);
  const freshnessText = countInHtml(html, /\b(published|updated|last modified|posted)\s+(on|at|:\s*)\d/i);
  const yearPattern = countInHtml(html, /\b(202[3-9]|203[0-9])\b/g);

  let score = 0;
  if (dateMeta) score += 40;
  if (timeTags > 0) score += 20;
  if (freshnessText > 0) score += 20;
  if (yearPattern > 0) score += 20;

  return {
    name: 'Freshness Signals',
    score,
    weight: 'med',
    status: score >= 70 ? 'pass' : score >= 30 ? 'warn' : 'fail',
    details: `Date meta: ${dateMeta}, <time> tags: ${timeTags}, freshness text: ${freshnessText > 0 ? 'found' : 'none'}`,
    recommendation: score < 70 ? 'Add article:published_time and article:modified_time meta tags with <time> elements.' : '',
  };
}

function checkAuthorAttribution(page: ExtractedPage): GeoCheck {
  const html = page.rawHtml || '';
  const hasAuthorMeta = hasMetaTag(html, 'author');
  const hasPersonSchema = page.jsonLd.some((j) => {
    const t = j['@type'];
    return Array.isArray(t) ? t.includes('Person') : t === 'Person';
  });
  const hasRelAuthor = /rel=["']author["']/i.test(html);
  const bylineFound = /\b(by|written by|author)\b\s+/i.test(html);

  let score = 0;
  if (hasAuthorMeta) score += 30;
  if (hasPersonSchema) score += 30;
  if (hasRelAuthor) score += 20;
  if (bylineFound) score += 20;

  return {
    name: 'Author Attribution',
    score,
    weight: 'med',
    status: score >= 70 ? 'pass' : score >= 30 ? 'warn' : 'fail',
    details: `Author meta: ${hasAuthorMeta}, Person schema: ${hasPersonSchema}, rel=author: ${hasRelAuthor}, byline: ${bylineFound}`,
    recommendation: score < 70 ? 'Add Person schema for the author and include a visible byline with credentials.' : '',
  };
}

const AI_PATTERNS = [
  /\b(as an AI|as a language model|I'm an AI|I am an AI|as an AI assistant)\b/i,
  /\b(I cannot|I'm unable|I am unable|I don't have personal)\b/i,
  /\b(I'm here to help|I'm designed|I was created)\b/i,
  /\b(It's important to note that|It is worth noting that)\b/i,
  /\b(In conclusion|To summarize|In summary|Overall,)\b/i,
  /\b(leverage|utilize|game-changer|revolutionize|cutting-edge)\b/i,
  /\b(delve|navigate|robust|seamless|holistic)\b/i,
];

function checkAiWritingSignals(page: ExtractedPage): GeoCheck {
  const html = page.rawHtml || '';

  let aiFlags = 0;
  let totalPatterns = 0;
  for (const pattern of AI_PATTERNS) {
    const count = countInHtml(html, pattern);
    totalPatterns += count;
    if (count > 0) aiFlags++;
  }

  let score = 100;
  if (aiFlags >= 5) score = 10;
  else if (aiFlags >= 3) score = 30;
  else if (aiFlags >= 1) score = 60;

  const ratio = totalPatterns / Math.max(page.wordCount, 1);
  if (ratio > 0.05) score = Math.min(score, 20);

  return {
    name: 'AI Writing Signals',
    score,
    weight: 'low',
    status: score >= 70 ? 'pass' : score >= 30 ? 'warn' : 'fail',
    details: `${totalPatterns} AI-pattern matches across ${aiFlags} categories (${(ratio * 100).toFixed(1)}% of content)`,
    recommendation: score < 70 ? 'Review flagged content for AI-generated patterns that may reduce trust with AI platforms.' : '',
  };
}

function checkSchemaMarkup(page: ExtractedPage): GeoCheck {
  const types = page.jsonLd.map((j) => j['@type']).filter(Boolean).flat() as string[];
  const uniqueTypes = [...new Set(types)];
  const count = uniqueTypes.length;

  let score = 0;
  if (count > 0) score += 30;
  score += Math.min(count * 15, 70);

  return {
    name: 'Schema Markup',
    score,
    weight: 'high',
    status: score >= 70 ? 'pass' : score >= 30 ? 'warn' : 'fail',
    details: `${count} schema type${count !== 1 ? 's' : ''} found: ${uniqueTypes.join(', ') || 'none'}`,
    recommendation: count === 0 ? 'Add schema markup (Article, BreadcrumbList, Organization) for better AI comprehension.' : '',
  };
}

export function checkAllGeo(page: ExtractedPage, robots: RobotsAnalysis | null): GeoCheck[] {
  return [
    checkStatsAndCitations(page),
    checkStructuredData(page),
    checkDefinitionBlocks(page),
    checkAnswerBlocks(page),
    checkContentExtractability(page),
    checkAiBotAccess(robots),
    checkFaqBlocks(page),
    checkContentTypeScoring(page),
    checkFreshnessSignals(page),
    checkAuthorAttribution(page),
    checkAiWritingSignals(page),
    checkSchemaMarkup(page),
  ];
}

export function calculateGeoScore(checks: GeoCheck[]): GeoScore {
  let totalWeight = 0;
  let weightedScore = 0;

  for (const check of checks) {
    const w = WEIGHT_MULT[check.weight] || 1;
    totalWeight += w;
    weightedScore += check.score * w;
  }

  const overall = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;

  return { overall, checks };
}
