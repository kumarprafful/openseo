import React from 'react';
import { getAudits } from '../lib/data';

function Score({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: '#1e293b', borderRadius: 8, padding: 16, flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

export default function Page() {
  const audits = getAudits();
  const latest = audits[0] || null;

  const totalIssues = audits.reduce((s, a) => s + a.issuesCount, 0);
  const criticalIssues = audits.reduce((s, a) => s + a.summary.critical, 0);
  const avgScore = audits.length > 0
    ? Math.round(audits.reduce((s, a) => s + (100 - (a.summary.critical * 10 + a.summary.high * 3)), 0) / audits.length)
    : 0;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>OpenSEO Dashboard</h1>
      <p style={{ color: '#94a3b8', marginBottom: 24 }}>
        {audits.length > 0 ? `${audits.length} audit${audits.length !== 1 ? 's' : ''} recorded` : 'No audits yet. Run `openseo audit --url <url>` to get started.'}
      </p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
        <Score label="Audits Run" value={audits.length} color="#38bdf8" />
        <Score label="Total Issues" value={totalIssues} color="#f59e0b" />
        <Score label="Critical Issues" value={criticalIssues} color="#ef4444" />
        <Score label="Avg Health" value={avgScore} color="#22c55e" />
      </div>

      {latest && (
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Latest Audit</h2>
          <div style={{ background: '#1e293b', borderRadius: 8, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: '#94a3b8' }}>{latest.url}</span>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>{new Date(latest.timestamp).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span>Pages: {latest.pagesCrawled}</span>
              <span>Issues: {latest.issuesCount}</span>
              <span>Critical: {latest.summary.critical}</span>
              <span>High: {latest.summary.high}</span>
              <span>Medium: {latest.summary.medium}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
