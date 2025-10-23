import React, { memo, useCallback, useMemo } from 'react';
import { Contact } from '../types';

// Memoized row with shallow field comparison for visible columns
export const TableRowMemo: React.FC<{
  contact: Contact;
  columns: { id: string; key: keyof Contact | 'index' }[];
  isSelected: boolean;
  isActiveCall: boolean;
  onSelect: (c: Contact) => void;
}> = memo(({ contact, columns, isSelected, isActiveCall, onSelect }) => {
  const handleClick = useCallback(() => onSelect(contact), [onSelect, contact]);
  const cells = useMemo(() => columns.map(c => ({ id: c.id, key: c.key })), [columns]);
  return (
    <div data-contact-id={contact.id} onClick={handleClick}>
      {cells.map(c => (
        <div key={c.id}>{c.key === 'index' ? '' : String((contact as any)[c.key] ?? '')}</div>
      ))}
    </div>
  );
}, (prev, next) => {
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.isActiveCall !== next.isActiveCall) return false;
  if (prev.contact.id !== next.contact.id) return false;
  // compare only currently used keys
  for (const col of next.columns) {
    const k = col.key as keyof Contact;
    if (k !== 'index' && prev.contact[k] !== next.contact[k]) return false;
  }
  return true;
});

export const createStableHandler = <T extends (...args: any[]) => any>(fn: T) => {
  // noop wrapper for future replacement
  return fn;
};
