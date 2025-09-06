import React, { forwardRef } from 'react';
import { Contact, ContactStatus, CallStates, Theme } from '../types';
import { ContactTable, ContactTableRef } from './ContactTable';
import { TablePagination } from './TablePagination';
import { usePagination } from '../hooks/usePagination';

interface PaginatedContactTableProps {
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
}

export const PaginatedContactTable = forwardRef<ContactTableRef, PaginatedContactTableProps>(({
  contacts,
  callStates,
  onSelectContact,
  selectedContactId,
  onUpdateContact,
  onDeleteContact,
  activeCallContactId,
  theme,
  visibleColumns,
  columnHeaders,
  contactDataKeys,
  onToggleColumnVisibility,
  availableColumns = [],
  onFileImport,
  initialItemsPerPage = 25,
  pageSizeOptions = [25, 50, 100],
  className = '',
}, ref) => {
  // Utiliser le hook de pagination
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedData,
    totalItems,
    goToPage,
    setItemsPerPage,
  } = usePagination({
    data: contacts,
    initialItemsPerPage,
    initialPage: (() => {
      try {
        const saved = localStorage.getItem('dimicall-current-page');
        const n = saved ? parseInt(saved, 10) : 1;
        return Number.isFinite(n) && n > 0 ? n : 1;
      } catch {
        return 1;
      }
    })(),
  });

  // Gérer la sélection de contact avec pagination
  const handleSelectContact = (contact: Contact | null) => {
    onSelectContact(contact);
  };

  // Gérer les changements de pagination
  const handlePageChange = (page: number) => {
    try { localStorage.setItem('dimicall-current-page', String(page)); } catch {}
    goToPage(page);
    // Optionnel: scroll vers le haut de la table
    if (ref && 'current' in ref && ref.current) {
      // Si la table a une méthode de scroll, l'utiliser
      // Sinon, on peut scroll vers le haut du conteneur
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    try {
      localStorage.setItem('dimicall-items-per-page', String(newItemsPerPage));
    } catch (error) {
      // Ignorer les erreurs de localStorage pour ne pas bloquer l'UI
    }
    setItemsPerPage(newItemsPerPage);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Table avec données paginées */}
      <div className="flex-1" style={{ minHeight: 0, overflow: 'hidden' }}>
        <ContactTable
          ref={ref}
          contacts={paginatedData}
          callStates={callStates}
          onSelectContact={handleSelectContact}
          selectedContactId={selectedContactId}
          onUpdateContact={onUpdateContact}
          onDeleteContact={onDeleteContact}
          activeCallContactId={activeCallContactId}
          theme={theme}
          visibleColumns={visibleColumns}
          columnHeaders={columnHeaders}
          contactDataKeys={contactDataKeys}
          onToggleColumnVisibility={onToggleColumnVisibility}
          availableColumns={availableColumns}
          onFileImport={onFileImport}
        />
      </div>

      {/* Pagination fixe en bas */}
      <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          pageSizeOptions={pageSizeOptions}
          showFirstLast={true}
          showPageInfo={true}
        />
      </div>
    </div>
  );
});

PaginatedContactTable.displayName = 'PaginatedContactTable';