import React from 'react';
import { Contact, CallStates, Theme } from '../types';
import { VirtualizedContactTableWired, ContactTableRef } from './VirtualizedContactTable.wired';
import { ContactTable } from './ContactTable';
import { TablePagination } from './TablePagination';
import { usePagination } from '../hooks/usePagination';

// Drop-in replacement to use the wired VirtualizedContactTable without changing external props
export const PaginatedContactTableWired = React.forwardRef<ContactTableRef, {
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
  const { currentPage, totalPages, itemsPerPage, paginatedData, totalItems, goToPage, setItemsPerPage } = usePagination({ data: props.contacts, initialItemsPerPage: props.initialItemsPerPage ?? 25, initialPage: 1 });

  return (
    <div className={`flex flex-col h-full ${props.className ?? ''}`}> 
      <div className="flex-1" style={{ minHeight: 0, overflow: 'hidden' }}>
        <VirtualizedContactTableWired
          ref={ref}
          {...props}
          contacts={paginatedData}
        />
      </div>
      <div className="px-3 py-1.5 min-h-[48px] border-t bg-card">
        <TablePagination
          className="w-full"
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={goToPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={props.pageSizeOptions ?? [25,50,100]}
          showFirstLast
          showPageInfo
        />
      </div>
    </div>
  );
});

PaginatedContactTableWired.displayName = 'PaginatedContactTableWired';
