import React from 'react';
import { useTableStore } from '../../store/useTableStore';
import { Contact } from '../../types';

// Hook to progressively move sort configuration into the store
export const useSortWiring = (
  propSort: { key: keyof Contact | null; direction: 'asc' | 'desc' | null },
  onSortChangeFromProps?: (sort: { key: keyof Contact | null; direction: 'asc' | 'desc' | null }) => void
) => {
  const sort = useTableStore(s => s.sort);
  const setSort = useTableStore(s => s.setSort);

  // Initialize store from props if empty
  React.useEffect(() => {
    if (sort.key !== propSort.key || sort.direction !== propSort.direction) {
      setSort(propSort);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setBoth = (next: { key: keyof Contact | null; direction: 'asc' | 'desc' | null }) => {
    setSort(next);
    onSortChangeFromProps?.(next);
  };

  return { sort: sort ?? propSort, setSort: setBoth };
};
