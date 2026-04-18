import { NextRequest, NextResponse } from 'next/server';
import { getXAdapter } from '@/lib/channels/x';
import type { Draft } from '@/types';

export const runtime = 'nodejs';

// Dispatches to the mock or real adapter based on ZEITGEIST_X_MODE.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { draft?: Draft };
    if (!body?.draft || typeof body.draft.body !== 'string') {
      return NextResponse.json({ ok: false, error: 'invalid draft' }, { status: 400 });
    }
    const adapter = getXAdapter();
    const result = await adapter.publish(body.draft);
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

