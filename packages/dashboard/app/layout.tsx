import React from 'react';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>OpenSEO Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#0f172a', color: '#e2e8f0' }}>
        <nav style={{ display: 'flex', gap: 24, padding: '16px 24px', borderBottom: '1px solid #1e293b', background: '#1e293b' }}>
          <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <Link href="/audits" style={{ color: '#94a3b8', textDecoration: 'none' }}>Audits</Link>
        </nav>
        <main style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
