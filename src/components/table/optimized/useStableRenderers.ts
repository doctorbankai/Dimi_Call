import React, { useMemo, useCallback } from 'react';
import { Contact } from '../types';

export const useStableRenderers = (
  renderCell: (contact: Contact, key: keyof Contact | 'index') => React.ReactNode
) => {
  // Stable reference for render function to avoid new closures per row
  const stableRender = useCallback(renderCell, [renderCell]);

  // Precompute renderer per column key if needed
  const getRendererFor = useCallback((key: keyof Contact | 'index') => {
    return (contact: Contact) => stableRender(contact, key);
  }, [stableRender]);

  return { stableRender, getRendererFor };
};
