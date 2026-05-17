import fs from 'node:fs';
import path from 'node:path';

export interface ProjectInfo {
  framework: 'nextjs' | 'astro' | 'remix' | 'unknown';
  frameworkVersion?: string;
  appRouter: boolean;
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun';
  locales: string[];
  defaultLocale: string;
  contentDir: string | null;
  contentCount: number;
  hasTailwind: boolean;
  hasTypescript: boolean;
}

export interface ExistingSEO {
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
  hasNotFound: boolean;
  hasRSS: boolean;
  hasOGImages: boolean;
  hasLlmsTxt: boolean;
  hasStructuredData: boolean;
  hasAnalytics: boolean;
  hasBreadcrumb: boolean;
}

export interface AuditIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'technical' | 'content' | 'geo' | 'schema' | 'performance' | 'links' | 'images' | 'headings';
  title: string;
  description: string;
  location: string;
  lineNumber?: number;
  recommendation: string;
  fixAvailable: boolean;
  aiSuggested: boolean;
}

export interface AuditResult {
  url: string;
  pagesCrawled: number;
  totalPages: number;
  durationMs: number;
  issues: AuditIssue[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

export interface GeoScore {
  overall: number;
  checks: GeoCheck[];
}

export interface GeoCheck {
  name: string;
  score: number;
  weight: 'high' | 'med' | 'low';
  status: 'pass' | 'warn' | 'fail';
  details: string;
  recommendation: string;
}

export function detectFramework(packageJson: Record<string, unknown>): ProjectInfo['framework'] {
  const deps = {
    ...(packageJson.dependencies as Record<string, string> || {}),
    ...(packageJson.devDependencies as Record<string, string> || {}),
  };
  if (deps.next) return 'nextjs';
  if (deps.astro) return 'astro';
  if (deps['@remix-run/react']) return 'remix';
  return 'unknown';
}

export function detectPackageManager(projectDir: string): ProjectInfo['packageManager'] {
  if (fs.existsSync(path.join(projectDir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(projectDir, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(projectDir, 'bun.lock'))) return 'bun';
  return 'npm';
}

export function detectAppRouter(projectDir: string): boolean {
  return fs.existsSync(path.join(projectDir, 'app')) &&
    (fs.existsSync(path.join(projectDir, 'app', 'layout.tsx')) ||
     fs.existsSync(path.join(projectDir, 'app', 'layout.js')));
}

export function detectTypescript(projectDir: string): boolean {
  return fs.existsSync(path.join(projectDir, 'tsconfig.json'));
}

export function detectTailwind(projectDir: string): boolean {
  return fs.existsSync(path.join(projectDir, 'tailwind.config.ts')) ||
    fs.existsSync(path.join(projectDir, 'tailwind.config.js')) ||
    fs.existsSync(path.join(projectDir, 'tailwind.config.mjs'));
}

export function parseLocales(config?: Record<string, unknown>): string[] {
  if (config?.i18n && Array.isArray((config.i18n as Record<string, unknown>).locales)) {
    return (config.i18n as Record<string, unknown>).locales as string[];
  }
  return ['en'];
}

export function detectLocales(projectDir: string): string[] {
  const nextConfigPaths = [
    'next.config.ts', 'next.config.js', 'next.config.mjs',
    'next.config.mts', 'next.config.cjs',
  ];
  for (const cfgPath of nextConfigPaths) {
    const fullPath = path.join(projectDir, cfgPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const match = content.match(/locales:\s*\[([^\]]+)\]/);
      if (match) {
        return match[1].split(',').map((l: string) => l.trim().replace(/['"]/g, ''));
      }
    }
  }
  return ['en'];
}

export function detectDefaultLocale(projectDir: string): string {
  const nextConfigPaths = [
    'next.config.ts', 'next.config.js', 'next.config.mjs',
    'next.config.mts', 'next.config.cjs',
  ];
  for (const cfgPath of nextConfigPaths) {
    const fullPath = path.join(projectDir, cfgPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const match = content.match(/defaultLocale:\s*['"]([^'"]+)['"]/);
      if (match) return match[1];
    }
  }
  return 'en';
}

export function detectContentDir(projectDir: string): string | null {
  const candidates = ['content/blog', 'content/posts', 'content', 'blog', 'posts', 'src/content'];
  for (const dir of candidates) {
    const fullDir = path.join(projectDir, dir);
    if (fs.existsSync(fullDir) && fs.statSync(fullDir).isDirectory()) {
      return dir;
    }
  }
  return null;
}

export function countContentFiles(projectDir: string, contentDir: string | null): number {
  if (!contentDir) return 0;
  const fullDir = path.join(projectDir, contentDir);
  if (!fs.existsSync(fullDir)) return 0;
  let count = 0;
  try {
    const entries = fs.readdirSync(fullDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && /\.(md|mdx|mdoc)$/.test(entry.name)) count++;
    }
  } catch { }
  return count;
}

export function detectExistingSEO(projectDir: string): ExistingSEO {
  const publicDir = path.join(projectDir, 'public');
  const appDir = path.join(projectDir, 'app');
  const srcDir = path.join(projectDir, 'src');
  const libDir = path.join(projectDir, 'lib');
  const componentsDir = path.join(projectDir, 'components');

  return {
    hasRobotsTxt: fileExistsAny(publicDir, ['robots.txt']),
    hasSitemap: fileExistsAny(appDir, ['sitemap.ts', 'sitemap.js', 'sitemap.xml/route.ts']) ||
                fileExistsAny(srcDir, ['app/sitemap.ts']),
    hasNotFound: fileExistsAny(appDir, ['not-found.tsx', 'not-found.js']) ||
                 fileExistsAny(srcDir, ['app/not-found.tsx']),
    hasRSS: fileExistsAny(appDir, ['rss.xml/route.ts', 'feed.xml/route.ts', 'rss/route.ts']),
    hasOGImages: fileExistsAny(appDir, ['opengraph-image.tsx', 'opengraph-image.png', 'twitter-image.tsx']),
    hasLlmsTxt: fileExistsAny(publicDir, ['llms.txt', 'llm.txt']),
    hasStructuredData: fileExistsAny(libDir, ['structured-data.ts', 'structured-data.js', 'seo.ts']) ||
                       hasJsondInProject(projectDir),
    hasAnalytics: hasAnalyticsInPackage(projectDir),
    hasBreadcrumb: fileExistsAny(componentsDir, ['breadcrumb.tsx', 'breadcrumbs.tsx', 'Breadcrumb.tsx']),
  };
}

function fileExistsAny(dir: string, files: string[]): boolean {
  for (const f of files) {
    if (fs.existsSync(path.join(dir, f))) return true;
  }
  return false;
}

function hasJsondInProject(projectDir: string): boolean {
  try {
    const files = fs.readdirSync(projectDir, { recursive: true }) as string[];
    return files.some(f => {
      try {
        const content = fs.readFileSync(path.join(projectDir, f), 'utf-8');
        return content.includes('schema.org') || content.includes('"@context"');
      } catch { return false; }
    });
  } catch { return false; }
}

function hasAnalyticsInPackage(projectDir: string): boolean {
  const pkgPath = path.join(projectDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return false;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    return ['umami', 'plausible', 'react-ga', 'react-ga4', 'gtag'].some(
      dep => dep in allDeps
    );
  } catch { return false; }
}

export async function runProjectDetection(projectDir: string) {
  const pkgPath = path.join(projectDir, 'package.json');
  let pkg: Record<string, unknown> = {};
  if (fs.existsSync(pkgPath)) {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  }

  const deps = (pkg.dependencies || {}) as Record<string, string>;

  const projectInfo: ProjectInfo = {
    framework: detectFramework(pkg),
    frameworkVersion: deps.next,
    appRouter: detectAppRouter(projectDir),
    packageManager: detectPackageManager(projectDir),
    locales: detectLocales(projectDir),
    defaultLocale: detectDefaultLocale(projectDir),
    contentDir: detectContentDir(projectDir),
    contentCount: 0,
    hasTailwind: detectTailwind(projectDir),
    hasTypescript: detectTypescript(projectDir),
  };

  projectInfo.contentCount = countContentFiles(projectDir, projectInfo.contentDir);

  const existingSEO = detectExistingSEO(projectDir);

  return { projectInfo, existingSEO, pkg };
}
