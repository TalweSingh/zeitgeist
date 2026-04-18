import type { PerformanceRecord } from '@/types';

/**
 * Interface-based performance store so we can swap to a live API later
 * without touching the UI. Today: reads /data/history.json.
 */
export interface PerformanceStore {
  getPerformanceHistory(): Promise<PerformanceRecord[]>;
}

export async function getPerformanceHistory(): Promise<PerformanceRecord[]> {
  // Client: relative fetch. Server: resolve via filesystem import.
  if (typeof window !== 'undefined') {
    const res = await fetch('/data/history.json');
    if (!res.ok) return [];
    return (await res.json()) as PerformanceRecord[];
  }
  // Server-side: import JSON directly. Keep dynamic so client bundle stays lean.
  const mod = await import('@/data/history.json');
  return (mod.default ?? mod) as PerformanceRecord[];
}

export const performanceStore: PerformanceStore = {
  getPerformanceHistory
};
