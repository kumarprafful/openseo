import type { Page } from 'playwright';
import type { ExtractedPage } from './types.js';

export interface PageEvalResult {
  status: number;
  contentType: string;
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  robotsMeta: string | null;
  headings: { level: number; text: string }[];
  links: { href: string; text: string; rel?: string }[];
  images: { src: string; alt: string; lazy: boolean }[];
  jsonLd: string[];
  hreflang: { href: string; lang: string }[];
  wordCount: number;
}

export async function extractPageData(page: Page, url: string, depth: number): Promise<ExtractedPage> {
  const raw: PageEvalResult = await page.evaluate(() => {
    const getMeta = (name: string): string | null => {
      const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      return el?.getAttribute('content') ?? null;
    };

    const links = Array.from(document.querySelectorAll('a[href]')).map((a) => ({
      href: (a as HTMLAnchorElement).href,
      text: (a as HTMLAnchorElement).textContent?.trim().slice(0, 200) || '',
      rel: (a as HTMLAnchorElement).rel || undefined,
    }));

    const images = Array.from(document.querySelectorAll('img[src]')).map((img) => ({
      src: (img as HTMLImageElement).src,
      alt: (img as HTMLImageElement).alt || '',
      lazy: (img as HTMLImageElement).loading === 'lazy',
    }));

    const jsonLd: string[] = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
      jsonLd.push(s.textContent || '');
    });

    const hreflang = Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).map((l) => ({
      href: (l as HTMLLinkElement).href,
      lang: (l as HTMLLinkElement).getAttribute('hreflang') || '',
    }));

    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((h) => ({
      level: parseInt(h.tagName[1], 10),
      text: h.textContent?.trim().slice(0, 300) || '',
    }));

    const textContent = document.body?.textContent || '';
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;

    return {
      status: document.querySelector('meta[name="robots"]') ? 200 : 200,
      contentType: document.contentType || 'text/html',
      title: document.title || null,
      metaDescription: getMeta('description'),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
      robotsMeta: getMeta('robots'),
      headings,
      links,
      images,
      jsonLd,
      hreflang,
      wordCount,
    };
  });

  const pageUrl = page.url();
  const baseUrl = new URL(pageUrl);
  const origin = baseUrl.origin;
  const canonicalUrl = raw.canonical ? new URL(raw.canonical, pageUrl).href : null;

  const parsedJsonLd: Record<string, unknown>[] = [];
  for (const rawJson of raw.jsonLd) {
    try {
      const parsed = JSON.parse(rawJson);
      if (Array.isArray(parsed)) parsedJsonLd.push(...parsed);
      else parsedJsonLd.push(parsed);
    } catch {
      // skip
    }
  }

  return {
    url: pageUrl,
    depth,
    status: raw.status,
    contentType: raw.contentType,
    title: raw.title,
    metaDescription: raw.metaDescription,
    canonical: canonicalUrl,
    robotsMeta: raw.robotsMeta,
    headings: raw.headings,
    links: raw.links.map((l) => ({
      ...l,
      isInternal: l.href.startsWith(origin) || l.href.startsWith('/'),
    })),
    images: raw.images,
    jsonLd: parsedJsonLd,
    hreflang: raw.hreflang,
    wordCount: raw.wordCount,
    hasH1: raw.headings.some((h) => h.level === 1),
    hasMultipleH1: raw.headings.filter((h) => h.level === 1).length > 1,
  };
}
