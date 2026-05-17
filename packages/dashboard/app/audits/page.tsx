import React from 'react';
import Link from 'next/link';
import { getAudits } from '../../lib/data';

function SeverityBadge({ count, color }: { count: number; color: string }) {
  if (count === 0) return null;
  return <span style={{ background: color, color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 12, marginLeft: 4 }}>{count}</span>;
}

export default function AuditsPage() {
  const audits = getAudits();

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Audit History</h1>

      {audits.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>No audits yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {audits.map((audit) => (
            <Link
              key={audit.id}
              href={`/audits/${audit.id}`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                background: '#1e293b',
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{audit.url}</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>{new Date(audit.timestamp).toLocaleString()} · {audit.pagesCrawled} pages · {audit.issuesCount} issues</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <SeverityBadge count={audit.summary.critical} color="#ef4444" />
                <SeverityBadge count={audit.summary.high} color="#f59e0b" />
                <SeverityBadge count={audit.summary.medium} color="#3b82f6" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
