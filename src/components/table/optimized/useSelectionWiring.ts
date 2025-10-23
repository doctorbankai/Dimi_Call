import { useEffect } from 'react';
import { useTableStore } from '../../store/useTableStore';

// Hook to wire selection to the global table store while preserving prop compatibility
export const useSelectionWiring = (
  propSelectedId: string | null,
  onSelectFromProps: ((id: string | null) => void) | null = null
) => {
  const selectedId = useTableStore(s => s.selectedContactId);
  const setSelected = useTableStore(s => s.setSelected);

  // Sync prop -> store (initial and when parent changes)
  useEffect(() => {
    if (propSelectedId !== selectedId) {
      setSelected(propSelectedId);
    }
  }, [propSelectedId, selectedId, setSelected]);

  // Optional: expose a unified setter that updates store and notifies parent if needed
  const setBoth = (id: string | null) => {
    setSelected(id);
    onSelectFromProps?.(id);
  };

  return { selectedId: selectedId ?? propSelectedId, setSelected: setBoth };
};
