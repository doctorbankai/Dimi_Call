import { useVirtualizer } from '@tanstack/react-virtual';
import { MutableRefObject, useMemo } from 'react';

export interface VirtualConfig {
  count: number;
  getScrollElement: () => HTMLElement | null | undefined;
  rowHeight?: number;
}

export const useTunedVirtualizer = ({ count, getScrollElement, rowHeight = 40 }: VirtualConfig) => {
  const estimateSize = useMemo(() => () => rowHeight, [rowHeight]);
  const virtualizer = useVirtualizer({
    count,
    getScrollElement,
    estimateSize,
    overscan: Math.min(25, Math.max(8, Math.floor(count * 0.01))),
    measureElement: (el) => el?.getBoundingClientRect?.().height ?? rowHeight,
    initialRect: { width: 0, height: 480 },
  });
  return virtualizer;
};
