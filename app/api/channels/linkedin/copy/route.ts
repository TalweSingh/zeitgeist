import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// No-op telemetry endpoint for LinkedIn copy-to-clipboard events.
// Accepts { draftId: string }; logs to server console and returns { ok: true }.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { draftId?: string };
    // eslint-disable-next-line no-console
    console.log('[zeitgeist] linkedin copy telemetry', { draftId: body?.draftId });
  } catch {
    // no-op
  }
  return NextResponse.json({ ok: true });
}

