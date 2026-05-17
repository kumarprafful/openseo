import fs from 'node:fs';
import path from 'node:path';

export interface TemplateDef {
  id: string;
  name: string;
  description: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  outputPath: string;
  content: string;
  condition?: (vars: Record<string, unknown>) => boolean;
}

function t(staticParts: TemplateStringsArray, ...dynamicKeys: string[]): string {
  let result = '';
  for (let i = 0; i < staticParts.length; i++) {
    result += staticParts[i];
    if (i < dynamicKeys.length) result += `{{${dynamicKeys[i]}}}`;
  }
  return result;
}

export function render(template: string, vars: Record<string, string | number | boolean | string[]>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const val = Array.isArray(value) ? value.join(', ') : String(value);
    result = result.replaceAll(`{{${key}}}`, val);
  }
  return result;
}

export const ALL_TEMPLATES: TemplateDef[] = [
  {
    id: 'structured-data',
    name: 'Structured data helpers',
    description: 'JSON-LD utility functions for Article, Organization, FAQ, Breadcrumb schemas',
    impact: 'high',
    outputPath: 'lib/structured-data.ts',
    content: `export interface JsonLd {
  '@context': 'https://schema.org';
  '@type': string;
  [key: string]: unknown;
}

export function articleSchema(params: {
  headline: string;
  description: string;
  url: string;
  imageUrl?: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  authorUrl?: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.headline,
    description: params.description,
    url: params.url,
    ...(params.imageUrl && { image: params.imageUrl }),
    datePublished: params.datePublished,
    dateModified: params.dateModified || params.datePublished,
    author: {
      '@type': 'Person',
      name: params.authorName,
      ...(params.authorUrl && { url: params.authorUrl }),
    },
  };
}

export function organizationSchema(params: {
  name: string;
  url: string;
  logoUrl?: string;
  sameAs?: string[];
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: params.name,
    url: params.url,
    ...(params.logoUrl && { logo: params.logoUrl }),
    ...(params.sameAs && { sameAs: params.sameAs }),
  };
}

export function faqSchema(items: Array<{ question: string; answer: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@id': item.url,
        name: item.name,
      },
    })),
  };
}`,
  },
  {
    id: 'breadcrumb',
    name: 'Breadcrumb component + JSON-LD',
    description: 'Client-side breadcrumb with JSON-LD structured data',
    impact: 'high',
    outputPath: 'components/breadcrumb.tsx',
    content: `'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items?: BreadcrumbItem[] }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const crumbs: BreadcrumbItem[] = items ?? [
    { label: 'Home', href: '/' },
    ...segments.map((segment, index) => ({
      label: segment.replace(/-/g, ' ').replace(/\\b\\w/g, (c) => c.toUpperCase()),
      href: index < segments.length - 1 ? '/' + segments.slice(0, index + 1).join('/') : undefined,
    })),
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@id': crumb.href ? '{{siteUrl}}' + crumb.href : '{{siteUrl}}' + pathname,
        name: crumb.label,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500">
        <ol className="flex flex-wrap items-center gap-1">
          {crumbs.map((crumb, index) => (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && <span aria-hidden="true">/</span>}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-gray-700 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-900 font-medium" aria-current="page">
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}`,
  },
  {
    id: 'not-found',
    name: 'Custom 404 page',
    description: 'SEO-friendly 404 page with sitemap links',
    impact: 'high',
    outputPath: 'app/not-found.tsx',
    content: `import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-gray-200">404</h1>
      <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
      <p className="mt-2 text-gray-500 max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          Go home
        </Link>
        <Link
          href="/sitemap"
          className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          View sitemap
        </Link>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'sitemap',
    name: 'Dynamic sitemap',
    description: 'Auto-generated XML sitemap from routes and content',
    impact: 'critical',
    outputPath: 'app/sitemap.ts',
    content: `import type { MetadataRoute } from 'next';
import fs from 'node:fs';
import path from 'node:path';

const SITE_URL = '{{siteUrl}}';
const LOCALES = [{{localesQuoted}}];
const DEFAULT_LOCALE = '{{defaultLocale}}';
const CONTENT_DIR = '{{contentDir}}';

function getContentSlugs(): string[] {
  const dir = path.join(process.cwd(), CONTENT_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f: string) => /\\.(md|mdx)$/.test(f))
    .map((f: string) => f.replace(/\\.(md|mdx)$/, ''));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const contentSlugs = getContentSlugs();

  const staticRoutes = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 1 },
    { url: SITE_URL + '/blog', lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
  ];

  const blogRoutes = contentSlugs.map((slug: string) => ({
    url: SITE_URL + '/blog/' + slug,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  if (LOCALES.length > 1) {
    const alt = (routes: Array<{ url: string }>) =>
      routes.map((route) => {
        const baseUrl = route.url.replace(SITE_URL, '');
        const languages: Record<string, string> = {};
        for (const loc of LOCALES) {
          if (loc === DEFAULT_LOCALE) continue;
          languages[loc] = SITE_URL + '/' + loc + baseUrl;
        }
        return { ...route, alternates: { languages } };
      });
    return [...alt(staticRoutes), ...alt(blogRoutes)];
  }
  return [...staticRoutes, ...blogRoutes];
}`,
  },
  {
    id: 'robots-txt',
    name: 'robots.txt',
    description: 'Search engine crawling rules with AI crawler access',
    impact: 'critical',
    outputPath: 'public/robots.txt',
    content: `# Allow all crawlers by default
User-agent: *
Allow: /
Disallow: /api/
Disallow: /_next/

# Sitemap
Sitemap: {{siteUrl}}/sitemap.xml

# Allow AI crawlers for GEO visibility
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /`,
  },
  {
    id: 'rss',
    name: 'RSS feed',
    description: 'RSS/Atom feed route from content directory',
    impact: 'medium',
    outputPath: 'app/rss.xml/route.ts',
    content: `import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

const SITE_URL = '{{siteUrl}}';
const SITE_NAME = '{{siteName}}';
const CONTENT_DIR = '{{contentDir}}';

function getPosts() {
  const dir = path.join(process.cwd(), CONTENT_DIR);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => /\\.(md|mdx)$/.test(f));
  const posts: Array<{ slug: string; title: string; description: string; date: string }> = [];

  for (const file of files) {
    const slug = file.replace(/\\.(md|mdx)$/, '');
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    const title = content.match(/^title:\\s*(.+)/m)?.[1] || slug;
    const description = content.match(/^description:\\s*(.+)/m)?.[1] || '';
    const date = content.match(/^date:\\s*(.+)/m)?.[1] || '';
    posts.push({ slug, title, description, date });
  }

  return posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export async function GET() {
  const posts = getPosts();
  const items = posts.map((post) => \`
    <item>
      <title><![CDATA[\${post.title}]]></title>
      <link>\${SITE_URL}/blog/\${post.slug}</link>
      <description><![CDATA[\${post.description}]]></description>
      <guid>\${SITE_URL}/blog/\${post.slug}</guid>
      \${post.date ? '<pubDate>' + new Date(post.date).toUTCString() + '</pubDate>' : ''}
    </item>\`).join('\\n');

  const rss = \`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>\${SITE_NAME}</title>
    <link>\${SITE_URL}</link>
    <description>Latest posts from \${SITE_NAME}</description>
    <language>{{defaultLocale}}</language>
    <atom:link href="\${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    \${items}
  </channel>
</rss>\`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}`,
    condition: (v) => !!v.contentDir,
  },
  {
    id: 'og-image',
    name: 'Dynamic OG image route',
    description: 'Dynamic Open Graph image generation via @vercel/og',
    impact: 'medium',
    outputPath: 'app/opengraph-image.tsx',
    content: `import { ImageResponse } from '@vercel/og';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || '{{siteName}}';
  const description = searchParams.get('description') || '';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          padding: '80px',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.2, marginBottom: 20, maxWidth: '90%' }}>
          {title}
        </div>
        {description && (
          <div style={{ fontSize: 28, color: '#94a3b8', maxWidth: '85%' }}>
            {description}
          </div>
        )}
        <div style={{ marginTop: 40, fontSize: 20, color: '#64748b' }}>
          {{siteUrl}}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}`,
    condition: (v) => v.ogType === 'dynamic',
  },
  {
    id: 'llms-txt',
    name: 'llms.txt generator',
    description: 'AI-friendly site mapping for LLM crawlers',
    impact: 'medium',
    outputPath: 'public/llms.txt',
    content: `# {{siteName}}
{{siteUrl}}

## About
{{siteName}} is a website built at {{siteUrl}}.

{{localesSection}}

## Content
- Blog: {{siteUrl}}/blog
- Sitemap: {{siteUrl}}/sitemap.xml
- RSS Feed: {{siteUrl}}/rss.xml

## Guidelines
- Content is structured with clear headings (H1, H2, H3)
- Articles include publish dates and author attribution
- Structured data is provided via JSON-LD
- Images have descriptive alt text
- Internal links use descriptive anchor text`,
  },
  {
    id: 'analytics',
    name: 'Analytics integration',
    description: 'Analytics component and provider setup',
    impact: 'low',
    outputPath: 'components/analytics.tsx',
    content: `{{analyticsContent}}`,
  },
  {
    id: 'validate-content',
    name: 'Content validation script',
    description: 'CLI script to validate content files for SEO compliance',
    impact: 'low',
    outputPath: 'scripts/validate-content.ts',
    content: `import fs from 'node:fs';
import path from 'node:path';

const CONTENT_DIR = '{{contentDir}}';
const LOCALES = [{{localesQuoted}}];
const DEFAULT_LOCALE = '{{defaultLocale}}';

interface ValidationError {
  file: string;
  type: string;
  message: string;
}

function validateFile(filePath: string, content: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const relativePath = path.relative(process.cwd(), filePath);

  if (!content.match(/^title:\\s+.+/m))
    errors.push({ file: relativePath, type: 'missing-title', message: 'Missing title' });
  if (!content.match(/^description:\\s+.+/m))
    errors.push({ file: relativePath, type: 'missing-description', message: 'Missing description' });
  if (!content.match(/^date:\\s+.+/m))
    errors.push({ file: relativePath, type: 'missing-date', message: 'Missing date' });

  const body = content.replace(/^---[\\s\\S]*?^---\\s*/m, '');
  if (!body.match(/^#\\s+/m))
    errors.push({ file: relativePath, type: 'missing-h1', message: 'No H1 heading' });

  const wordCount = body.split(/\\s+/).filter(Boolean).length;
  if (wordCount < 300)
    errors.push({ file: relativePath, type: 'too-short', message: wordCount + ' words (min 300)' });

  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    if (new RegExp('\\\\(/' + locale + '/', 'g').test(content))
      errors.push({ file: relativePath, type: 'locale-prefix', message: 'Link contains /' + locale + '/' });
  }

  return errors;
}

function main() {
  const dir = path.join(process.cwd(), CONTENT_DIR);
  if (!fs.existsSync(dir)) { console.log('No content dir'); process.exit(0); }

  const files = fs.readdirSync(dir).filter((f) => /\\.(md|mdx)$/.test(f));
  let all: ValidationError[] = [];
  for (const file of files)
    all = all.concat(validateFile(path.join(dir, file), fs.readFileSync(path.join(dir, file), 'utf-8')));

  if (!all.length) { console.log('All ' + files.length + ' files passed.'); process.exit(0); }
  console.log(all.length + ' issue(s):\\n');
  for (const e of all) console.log('  ' + e.file + '\\n    ' + e.message + '\\n');
  process.exit(1);
}
main();`,
    condition: (v) => !!v.contentDir,
  },
  {
    id: 'checklist',
    name: 'Feature launch checklist',
    description: 'SEO pre-launch checklist document',
    impact: 'low',
    outputPath: 'docs/seo-checklist.md',
    content: `# SEO Launch Checklist

## Pre-Launch
- [ ] Set site URL in environment variables
- [ ] Configure analytics
- [ ] Verify sitemap at {{siteUrl}}/sitemap.xml
- [ ] Verify robots.txt at {{siteUrl}}/robots.txt
- [ ] Test structured data with Google Rich Results Test
- [ ] Validate Core Web Vitals with Lighthouse
- [ ] Set up Google Search Console
- [ ] Set up Bing Webmaster Tools
- [ ] Verify OG images render correctly
- [ ] Test RSS feed at {{siteUrl}}/rss.xml

## Content
- [ ] All pages have unique <title> tags
- [ ] All pages have unique meta descriptions
- [ ] Heading hierarchy is correct (one H1 per page)
- [ ] All images have descriptive alt text
- [ ] Internal links use descriptive anchor text
- [ ] No broken internal links

## Technical
- [ ] Page loads under 2.5s LCP
- [ ] Mobile-friendly test passes
- [ ] HTTPS enforced
- [ ] No 4xx or 5xx errors on critical pages
- [ ] Canonical URLs are set on all pages
- [ ] hreflang tags are correct (if multi-locale)
- [ ] llms.txt is accessible

## GEO / AI Visibility
- [ ] AI crawlers allowed in robots.txt (GPTBot, ClaudeBot, PerplexityBot)
- [ ] Content has statistics and citations
- [ ] Author attribution is present
- [ ] Freshness signals are present (dates)
- [ ] Structured data is valid JSON-LD

## Post-Launch
- [ ] Monitor Google Search Console
- [ ] Run monthly content audits
- [ ] Update stale content`,
  },
];

export function renderTemplate(template: string, vars: Record<string, string | number | boolean | string[]>): string {
  const resolved: Record<string, string> = {};
  for (const [key, value] of Object.entries(vars)) {
    resolved[key] = Array.isArray(value) ? value.join(', ') : String(value);
  }

  // Special computed vars
  const localesArr = (vars.locales || ['en']) as string[];
  resolved['localesQuoted'] = localesArr.map((l: string) => `'${l}'`).join(', ');
  resolved['localesSection'] = localesArr.length > 1
    ? '## Locales\n' + localesArr.map((l: string) => `- ${l}: ${vars.siteUrl}/${l}`).join('\n')
    : '';

  // Analytics content
  const provider = String(vars.analyticsProvider || 'none');
  if (provider === 'none') {
    resolved['analyticsContent'] = 'export function Analytics() { return null; }';
  } else if (provider === 'umami') {
    resolved['analyticsContent'] = `
'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
export function Analytics() {
  const pathname = usePathname();
  useEffect(() => {
    const s = document.createElement('script');
    s.src = '${vars.analyticsScriptUrl}';
    s.setAttribute('data-website-id', '${vars.analyticsSiteId}');
    s.async = true;
    document.head.appendChild(s);
  }, []);
  useEffect(() => {
    if (typeof window.umami !== 'undefined') window.umami.track({ url: pathname });
  }, [pathname]);
  return null;
}`;
  } else if (provider === 'google-analytics') {
    resolved['analyticsContent'] = `
'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
export function Analytics() {
  const pathname = usePathname();
  useEffect(() => { if (typeof window.gtag !== 'undefined') window.gtag('config', '${vars.analyticsSiteId}', { page_path: pathname }); }, [pathname]);
  return (
    <>
      <Script src={\`https://www.googletagmanager.com/gtag/js?id=${vars.analyticsSiteId}\`} strategy="afterInteractive" />
      <Script id="ga" strategy="afterInteractive">{'window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","${vars.analyticsSiteId}",{page_path:window.location.pathname});'}</Script>
    </>
  );
}`;
  } else if (provider === 'plausible') {
    resolved['analyticsContent'] = `
'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
export function Analytics() {
  const pathname = usePathname();
  useEffect(() => {
    const s = document.createElement('script');
    s.src = '${vars.analyticsScriptUrl}';
    s.setAttribute('data-domain', '${vars.analyticsSiteId}');
    s.async = true; document.head.appendChild(s);
  }, []);
  useEffect(() => {
    if (typeof window.plausible !== 'undefined') window.plausible('pageview', { u: pathname });
  }, [pathname]);
  return null;
}`;
  }

  let result = template;
  for (const [key, value] of Object.entries(resolved)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

export function rankFeatures(missingIds: string[]): TemplateDef[] {
  const priority: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return ALL_TEMPLATES
    .filter((t) => missingIds.includes(t.id))
    .sort((a, b) => priority[a.impact] - priority[b.impact]);
}

export function getEnabledTemplates(vars: Record<string, unknown>): TemplateDef[] {
  const features = (vars.features || []) as string[];
  return ALL_TEMPLATES
    .filter((t) => features.includes(t.id))
    .filter((t) => !t.condition || t.condition(vars));
}

export function scaffoldFiles(vars: Record<string, unknown>, projectDir: string): Array<{ path: string; content: string; skipped: boolean }> {
  const templates = getEnabledTemplates(vars);
  const results: Array<{ path: string; content: string; skipped: boolean }> = [];

  for (const tpl of templates) {
    const fullPath = path.join(projectDir, tpl.outputPath);
    const dir = path.dirname(fullPath);
    const exists = fs.existsSync(fullPath);
    const content = renderTemplate(tpl.content, vars as Record<string, string | number | boolean | string[]>);

    if (exists) {
      results.push({ path: tpl.outputPath, content, skipped: true });
    } else {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fullPath, content, 'utf-8');
      results.push({ path: tpl.outputPath, content, skipped: false });
    }
  }

  return results;
}
