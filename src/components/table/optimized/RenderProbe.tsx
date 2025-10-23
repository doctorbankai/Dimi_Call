// Dev-only instrumentation for VirtualizedContactTable render metrics
// Usage: wrap parts of VCT in <RenderProbe label="row-{id}">...</RenderProbe>

import React from 'react';

const counters: Record<string, number> = {};

export const RenderProbe: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  if (process.env.NODE_ENV === 'development') {
    counters[label] = (counters[label] || 0) + 1;
    // eslint-disable-next-line no-console
    console.debug(`[Probe] ${label} render #${counters[label]}`);
  }
  return <>{children}</>;
};

export const getRenderCounts = () => ({ ...counters });
export const resetRenderCounts = () => { Object.keys(counters).forEach(k => delete counters[k]); };
