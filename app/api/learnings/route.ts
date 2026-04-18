import { NextRequest, NextResponse } from 'next/server';
import type { Learning, PerformanceRecord } from '@/types';

export const runtime = 'nodejs';

// Learnings endpoint. Subagent 2 may wire this to LEARNINGS_SYSTEM.
// For now, returns 204 so the client hook falls back to its local heuristic.
// Body shape: { performanceHistory: PerformanceRecord[] } -> { learnings: Learning[] }
export async function POST(_req: NextRequest) {
  const empty: Learning[] = [];
  // Return an empty payload (not 204) so the hook can inspect it and fall back.
  return NextResponse.json({ learnings: empty });
}

export type LearningsResponse = { learnings: Learning[] };
export type LearningsRequest = { performanceHistory: PerformanceRecord[] };
