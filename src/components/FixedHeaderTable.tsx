import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Contact, CallStates, Theme } from '../types';
import { ContactTable, ContactTableRef } from './ContactTable';

interface FixedHeaderTableProps {
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
}

/**
 * Solution de fallback avec header fixe si le sticky ne fonctionne pas
 */
export const FixedHeaderTable = forwardRef<ContactTableRef, FixedHeaderTableProps>((props, ref) => {
  const tableRef = useRef<ContactTableRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Exposer les méthodes de la table interne
  useImperativeHandle(ref, () => ({
    scrollToContact: (contactId: string) => {
      tableRef.current?.scrollToContact(contactId);
    }
  }), []);

  useEffect(() => {
    // Mesurer la hauteur du header
    const measureHeader = () => {
      if (containerRef.current) {
        const header = containerRef.current.querySelector('thead');
        if (header) {
          setHeaderHeight(header.offsetHeight);
        }
      }
    };

    measureHeader();
    
    // Re-mesurer lors du redimensionnement
    const resizeObserver = new ResizeObserver(measureHeader);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed-header-table h-full relative"
      style={{
        position: 'relative',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      {/* Header fixe */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 102,
          backgroundColor: 'hsl(var(--background))',
          borderBottom: '1px solid hsl(var(--border))',
          boxShadow: '0 2px 8px 0 rgb(0 0 0 / 0.1)',
        }}
      >
        {/* Clone du header pour affichage fixe */}
        <div style={{ visibility: 'hidden', position: 'absolute' }}>
          <ContactTable
            {...props}
            ref={tableRef}
            contacts={props.contacts.slice(0, 1)} // Juste pour le header
          />
        </div>
      </div>

      {/* Contenu scrollable avec padding pour le header */}
      <div
        style={{
          height: '100%',
          overflow: 'auto',
          paddingTop: headerHeight,
        }}
      >
        <ContactTable
          {...props}
          ref={tableRef}
        />
      </div>
    </div>
  );
});

FixedHeaderTable.displayName = 'FixedHeaderTable';