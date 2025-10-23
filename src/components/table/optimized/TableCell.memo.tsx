import React, { memo, useMemo } from 'react';
import { Contact } from '../types';

export interface CellRendererProps {
  contact: Contact;
  columnKey: keyof Contact | 'index';
  render: (contact: Contact, columnKey: keyof Contact | 'index') => React.ReactNode;
}

export const TableCellMemo: React.FC<CellRendererProps> = memo(({ contact, columnKey, render }) => {
  const node = useMemo(() => render(contact, columnKey), [contact, columnKey, render]);
  return <>{node}</>;
}, (prev, next) => {
  if (prev.columnKey !== next.columnKey) return false;
  if (prev.columnKey === 'index') return true;
  return prev.contact[prev.columnKey] === next.contact[next.columnKey as keyof Contact];
});
