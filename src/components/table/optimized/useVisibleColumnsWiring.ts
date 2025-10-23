import React, { useMemo } from 'react';
import { useTableStore } from '../../store/useTableStore';

// Hook to wire visibleColumns into Zustand with local fallback
export const useVisibleColumnsWiring = (
  propVisible: Record<string, boolean>,
  onToggleFromProps?: (header: string) => void
) => {
  const storeVisible = useTableStore(s => s.visibleColumns);
  const setStoreVisible = useTableStore(s => s.setVisibleColumns);

  // Initialize from props once
  React.useEffect(() => {
    if (Object.keys(storeVisible || {}).length === 0 && Object.keys(propVisible || {}).length > 0) {
      setStoreVisible(propVisible);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (header: string) => {
    const next = { ...(storeVisible && Object.keys(storeVisible).length ? storeVisible : propVisible) };
    next[header] = next[header] === false ? true : false;
    setStoreVisible(next);
    onToggleFromProps?.(header);
  };

  const effective = useMemo(() => {
    const base = (storeVisible && Object.keys(storeVisible).length) ? storeVisible : propVisible;
    return base || {};
  }, [storeVisible, propVisible]);

  return { visible: effective, toggle };
};
