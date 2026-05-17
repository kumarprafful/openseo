export interface CrawlConfig {
  url: string;
  maxPages?: number;
  maxDepth?: number;
  sameOrigin?: boolean;
  includePatterns?: RegExp[];
  excludePatterns?: RegExp[];
  renderJs?: boolean;
  timeout?: number;
}

export interface CrawlProgress {
  phase: 'crawling' | 'extracting' | 'analyzing' | 'schema' | 'robots' | 'complete';
  current: number;
  total: number;
  message?: string;
}

export interface ExtractedPage {
  url: string;
  depth: number;
  status: number;
  contentType: string;
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  robotsMeta: string | null;
  headings: { level: number; text: string }[];
  links: { href: string; text: string; rel?: string; isInternal: boolean }[];
  images: { src: string; alt: string; lazy: boolean }[];
  jsonLd: Record<string, unknown>[];
  hreflang: { href: string; lang: string }[];
  wordCount: number;
  hasH1: boolean;
  hasMultipleH1: boolean;
}

export interface AiCrawlerStatus {
  crawler: string;
  userAgent: string;
  status: 'allowed' | 'blocked' | 'not-specified';
}

export interface RobotsAnalysis {
  content: string;
  aiCrawlers: AiCrawlerStatus[];
  sitemaps: string[];
  hasWildcardAllow: boolean;
  hasWildcardDisallow: boolean;
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: { path: string; message: string }[];
  types: string[];
}

export interface CrawlResult {
  pages: ExtractedPage[];
  robots: RobotsAnalysis | null;
  durationMs: number;
}

export type ProgressCallback = (progress: CrawlProgress) => void;
