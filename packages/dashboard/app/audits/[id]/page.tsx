import React from 'react';
import Link from 'next/link';
import { getAuditById } from '../../../lib/data';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#22c55e',
  info: '#94a3b8',
};

function IssueCard({ issue }: { issue: { severity: string; title: string; description: string; category: string; location: string; recommendation: string; fixAvailable: boolean } }) {
  return (
    <div style={{ background: '#1e293b', borderRadius: 8, padding: 16, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 600 }}>{issue.title}</span>
        <span style={{
          background: SEVERITY_COLORS[issue.severity] || '#94a3b8',
          color: '#fff',
          borderRadius: 4,
          padding: '2px 8px',
          fontSize: 12,
          textTransform: 'uppercase',
        }}>
          {issue.severity}
        </span>
      </div>
      <p style={{ color: '#94a3b8', margin: '0 0 8px 0', fontSize: 14 }}>{issue.description}</p>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
        {issue.category} · {issue.location}
      </div>
      {issue.recommendation && (
        <div style={{ fontSize: 13, color: '#38bdf8', marginTop: 4 }}>
          Fix: {issue.recommendation}
        </div>
      )}
    </div>
  );
}

export default function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = React.use(params);
  const audit = getAuditById(resolved.id);

  if (!audit) {
    return (
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Audit Not Found</h1>
        <Link href="/audits" style={{ color: '#38bdf8' }}>← Back to audits</Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/audits" style={{ color: '#38bdf8', fontSize: 14, textDecoration: 'none', display: 'block', marginBottom: 16 }}>← Back to audits</Link>

      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Audit Detail</h1>
      <div style={{ color: '#94a3b8', marginBottom: 24 }}>
        <div>{audit.url}</div>
        <div style={{ fontSize: 13 }}>{new Date(audit.timestamp).toLocaleString()} · {audit.pagesCrawled} pages · {(audit.durationMs / 1000).toFixed(1)}s</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div style={{ background: '#1e293b', borderRadius: 8, padding: '12px 20px', textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: audit.summary.critical > 0 ? '#ef4444' : '#22c55e' }}>{audit.issuesCount}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Total Issues</div>
        </div>
        {(['critical', 'high', 'medium', 'low'] as const).map((sev) => (
          <div key={sev} style={{ background: '#1e293b', borderRadius: 8, padding: '12px 20px', textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: SEVERITY_COLORS[sev] }}>{audit.summary[sev]}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'capitalize' }}>{sev}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Issues</h2>
      {audit.issues.map((issue, i) => (
        <IssueCard key={i} issue={issue} />
      ))}
    </div>
  );
}
