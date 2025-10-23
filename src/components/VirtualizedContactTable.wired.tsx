import React from 'react';
import { useVisibleColumnsWiring } from './table/optimized/useVisibleColumnsWiring';
import { VirtualizedContactTable as InnerVirtualizedContactTable, ContactTableRef } from './VirtualizedContactTable';
import { Contact, CallStates, Theme } from '../types';

// Wrapper to progressively wire visibleColumns to Zustand while keeping props API identical
export const VirtualizedContactTableWired = React.forwardRef<ContactTableRef, {
  contacts: Contact[];
  callStates: CallStates;
  onSelectContact: (contact: Contact | null) => void;
  selectedContactId: string | null;
  onUpdateContact: (contact: Partial<Contact> & { id: string }) => void;
  onDeleteContact: (contactId: string) => void;
  activeCallContactId: string | null;
  theme: Theme;
  visibleColumns: Record<string, boolean>;
  columnHeaders: string[];
  contactDataKeys: (keyof Contact | null)[];
  onToggleColumnVisibility: (header: string) => void;
  availableColumns?: string[];
  onFileImport?: (file: File) => Promise<void>;
}>(function Wrapper(props, ref) {
  const { visible, toggle } = useVisibleColumnsWiring(props.visibleColumns, props.onToggleColumnVisibility);
  return (
    <InnerVirtualizedContactTable
      ref={ref}
      {...props}
      visibleColumns={visible}
      onToggleColumnVisibility={toggle}
    />
  );
});

VirtualizedContactTableWired.displayName = 'VirtualizedContactTableWired';
