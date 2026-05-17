import fs from 'node:fs';
import path from 'node:path';

export interface AuditRecord {
  id: string;
  url: string;
  timestamp: string;
  pagesCrawled: number;
  durationMs: number;
  summary: { critical: number; high: number; medium: number; low: number; info: number };
  issuesCount: number;
  issues: Array<{
    severity: string;
    title: string;
    description: string;
    category: string;
    location: string;
    recommendation: string;
    fixAvailable: boolean;
  }>;
}

const AUDITS_DIR = '.openseo/audits';

function getAuditsDir(): string {
  const cwd = process.env.PROJECT_DIR || process.cwd();
  return path.join(cwd, AUDITS_DIR);
}

export function ensureAuditsDir(): string {
  const dir = getAuditsDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function saveAudit(audit: AuditRecord): void {
  const dir = ensureAuditsDir();
  const filePath = path.join(dir, `${audit.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(audit, null, 2));
}

export function getAudits(): AuditRecord[] {
  const dir = getAuditsDir();
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  return files
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as AuditRecord;
      } catch {
        return null;
      }
    })
    .filter((a): a is AuditRecord => a !== null)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getAuditById(id: string): AuditRecord | null {
  const audits = getAudits();
  return audits.find((a) => a.id === id) || null;
}
