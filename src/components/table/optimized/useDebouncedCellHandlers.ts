import React, { useMemo, useCallback } from 'react';
import { Contact, Theme } from '../types';
import { TableCellMemo } from './table/optimized/TableCell.memo';

// Debounced wrappers for DateTimeCell and CommentWidget updates
export const useDebouncedCellHandlers = (delay = 300) => {
  const timers = React.useRef<Record<string, any>>({});

  const debounce = useCallback((key: string, fn: () => void) => {
    if (timers.current[key]) clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(fn, delay);
  }, [delay]);

  const debouncedFieldUpdate = useCallback(
    (contactId: string, field: keyof Contact, value: any, onUpdate: (c: Partial<Contact> & { id: string }) => void) => {
      debounce(`${contactId}:${field as string}`, () => {
        onUpdate({ id: contactId, [field]: value } as any);
      });
    },
    [debounce]
  );

  React.useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout); }, []);

  return { debouncedFieldUpdate };
};
