import { NextRequest, NextResponse } from 'next/server';
import { saveAudit, getAudits, type AuditRecord } from '../../../lib/data';

export async function GET() {
  const audits = getAudits();
  return NextResponse.json(audits);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AuditRecord;

    if (!body.id || !body.url || !body.timestamp) {
      return NextResponse.json({ error: 'Missing required fields: id, url, timestamp' }, { status: 400 });
    }

    saveAudit(body);
    return NextResponse.json({ success: true, id: body.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid request' }, { status: 400 });
  }
}
