import React from 'react';
import { Contact, CallStates, Theme } from '../types';
import { PaginatedContactTableWired, ContactTableRef } from './PaginatedContactTable.wired';
import { PaginatedContactTable } from './PaginatedContactTable';

// Toggle component to switch between wired and legacy without changing callers
// Consumers can import PaginatedContactTableEntry to get the best path by default
export const PaginatedContactTableEntry = React.forwardRef<ContactTableRef, {
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
  initialItemsPerPage?: number;
  pageSizeOptions?: number[];
  className?: string;
}>((props, ref) => {
  // Feature flag from localStorage to allow instant fallback if needed
  const useWired = React.useMemo(() => {
    try {
      const v = localStorage.getItem('dimicall-use-wired-table');
      return v === null ? true : v === 'true';
    } catch {
      return true;
    }
  }, []);

  if (useWired) {
    return <PaginatedContactTableWired ref={ref} {...props} />;
  }
  return <PaginatedContactTable ref={ref} {...props} />;
});

PaginatedContactTableEntry.displayName = 'PaginatedContactTableEntry';
