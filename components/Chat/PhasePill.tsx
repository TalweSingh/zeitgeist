'use client';

import * as React from 'react';
import type { Phase } from '@/types';
import { Badge } from '@/components/ui/badge';

const LABEL: Record<Phase, string> = {
  intake: 'Intake',
  research: 'Research',
  jobs_review: 'Jobs review',
  brand_identity: 'Brand identity',
  strategy: 'Strategy',
  content: 'Content'
};

const VARIANT: Record<Phase, 'default' | 'secondary' | 'success' | 'warning' | 'outline'> = {
  intake: 'outline',
  research: 'warning',
  jobs_review: 'secondary',
  brand_identity: 'secondary',
  strategy: 'secondary',
  content: 'success'
};

export function PhasePill({ phase }: { phase: Phase }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">Phase</span>
      <Badge variant={VARIANT[phase]}>{LABEL[phase]}</Badge>
    </div>
  );
}
