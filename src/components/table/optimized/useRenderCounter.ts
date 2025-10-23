import React from 'react';

// Tiny instrumentation to measure re-renders per key (dev-only)
const counters: Record<string, number> = {};
export const useRenderCounter = (key: string) => {
  if (process.env.NODE_ENV !== 'development') return 0;
  counters[key] = (counters[key] || 0) + 1;
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug(`[RenderCounter] ${key}:`, counters[key]);
  });
  return counters[key];
};
