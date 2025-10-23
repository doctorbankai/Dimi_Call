import { forwardRef, useState } from 'react';
import { Contact, CallStates, Theme } from '../types';
import { ContactTable, ContactTableRef } from './ContactTable';
import { VirtualizedContactTable, VirtualizedContactTableRef } from './VirtualizedContactTable';
import { TablePagination } from './TablePagination';
import { usePagination } from '../hooks/usePagination';
import { useTableCleanup } from '../hooks/useCleanupRef';
import { DropZoneOverlay } from './DropZoneOverlay';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { ImportMappingDialog } from './ImportMappingDialog';
import TableErrorBoundary from './table/TableErrorBoundary';
import { validateContact, ContactUpdateInput } from './table/schemas/contactValidation';
import { logError, logWarning, logInfo } from './table/utils/errorLogger';

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

// Définir les expectedTargets pour ImportMappingDialog
const EXPECTED_TARGETS = [
  { label: 'Prénom', value: 'prenom' },
  { label: 'Nom', value: 'nom' },
  { label: 'Téléphone', value: 'telephone' },
  { label: 'Mail', value: 'email' },
  { label: 'Source', value: 'source' },
  { label: 'Type', value: 'type' },
  { label: 'Qualité', value: 'qualite' },
  { label: 'Lien', value: 'lien' },
  { label: 'Date Rappel', value: 'dateRappel' },
  { label: 'Heure Rappel', value: 'heureRappel' },
  { label: 'Date Appel', value: 'dateAppel' },
  { label: 'Heure Appel', value: 'heureAppel' },
  { label: 'Statut', value: 'statut' },
  { label: 'Commentaire', value: 'commentaire' },
  { label: 'Date RDV', value: 'dateRDV' },
  { label: 'Heure RDV', value: 'heureRDV' },
  { label: 'Durée Appel', value: 'dureeAppel' },
  { label: 'Sexe', value: 'sexe' },
  { label: 'Don', value: 'don' },
  { label: 'Date', value: 'date' },
  { label: 'UID', value: 'uid' },
];

const REQUIRED_TARGETS = ['telephone'];

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
  const cleanup = useTableCleanup();
  
  // Feature flag pour utiliser VirtualizedContactTable (activé par défaut)
  const [useVirtualizedTable] = useState(() => {
    try {
      const saved = localStorage.getItem('dimicall-use-virtualized-table')
      // Si pas de valeur sauvegardée, activer par défaut
      if (saved === null || saved === undefined) {
        return true
      }
      return saved === 'true'
    } catch (error) {
      logError(error as Error, {
        component: 'PaginatedContactTable',
        action: 'load_virtualized_preference'
      });
      return true // Activer par défaut en cas d'erreur
    }
  })

  // États pour le drag & drop
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [mappingDialog, setMappingDialog] = useState<{
    open: boolean;
    file: File | null;
    headers: string[];
    preview: string[][];
  }>({
    open: false,
    file: null,
    headers: [],
    preview: []
  });

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
      } catch (error) {
        logError(error as Error, {
          component: 'PaginatedContactTable',
          action: 'load_current_page'
        });
        return 1;
      }
    })(),
  });

  // Wrapper validé pour onUpdateContact
  const handleValidatedUpdateContact = (contactUpdate: Partial<Contact> & { id: string }) => {
    try {
      // Valider les données avec Zod
      const validation = validateContact(contactUpdate, true); // partial update
      
      if (!validation.success) {
        logWarning(
          `Validation failed for contact update: ${validation.errors?.join(', ')}`,
          {
            component: 'PaginatedContactTable',
            action: 'validate_contact_update',
            contactId: contactUpdate.id,
            additionalData: { errors: validation.errors, contactUpdate }
          }
        );
        
        // Afficher une notification à l'utilisateur
        toast.error('Données invalides', {
          description: validation.errors?.[0] || 'Vérifiez vos données'
        });
        return;
      }
      
      // Données validées, appeler la fonction originale
      logInfo(
        'Contact update validated successfully',
        {
          component: 'PaginatedContactTable',
          action: 'contact_update_success',
          contactId: contactUpdate.id
        }
      );
      
      onUpdateContact(validation.data as Partial<Contact> & { id: string });
    } catch (error) {
      logError(error as Error, {
        component: 'PaginatedContactTable',
        action: 'update_contact_wrapper',
        contactId: contactUpdate.id,
        additionalData: { contactUpdate }
      });
      
      toast.error('Erreur lors de la mise à jour', {
        description: 'Veuillez réessayer'
      });
    }
  };

  // Wrapper pour onDeleteContact avec logging
  const handleValidatedDeleteContact = (contactId: string) => {
    try {
      logInfo(
        'Contact deletion requested',
        {
          component: 'PaginatedContactTable',
          action: 'delete_contact_request',
          contactId
        }
      );
      
      onDeleteContact(contactId);
    } catch (error) {
      logError(error as Error, {
        component: 'PaginatedContactTable',
        action: 'delete_contact_wrapper',
        contactId,
      });
      
      toast.error('Erreur lors de la suppression', {
        description: 'Veuillez réessayer'
      });
    }
  };

  // Handlers pour le drag & drop avec cleanup automatique
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Ne déclencher que si on entre dans le conteneur principal
    if (e.currentTarget === e.target) {
      setIsDragOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Maintenir l'état actif pendant le survol
    if (!isDragOver) {
      setIsDragOver(true);
    }
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Ne déclencher que si on quitte réellement le conteneur principal
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (
      x <= rect.left ||
      x >= rect.right ||
      y <= rect.top ||
      y >= rect.bottom
    ) {
      setIsDragActive(false);
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validExtensions = ['.csv', '.tsv', '.xlsx', '.xls'];
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (!validExtensions.includes(extension)) {
        logWarning(
          `Invalid file extension attempted: ${extension}`,
          {
            component: 'PaginatedContactTable',
            action: 'file_drop_invalid_extension',
            additionalData: { fileName: file.name, extension }
          }
        );
        
        toast.error('Format de fichier non supporté', {
          description: 'Veuillez utiliser un fichier .csv, .tsv, .xlsx ou .xls'
        });
        return;
      }

      try {
        // Analyser le fichier et ouvrir le dialogue de mapping
        await analyzeAndOpenMappingDialog(file);
        
        logInfo(
          'File drop and analysis completed successfully',
          {
            component: 'PaginatedContactTable',
            action: 'file_drop_success',
            additionalData: { fileName: file.name, fileSize: file.size }
          }
        );
      } catch (error) {
        logError(error as Error, {
          component: 'PaginatedContactTable',
          action: 'file_drop_analysis',
          additionalData: { fileName: file.name }
        });
        
        toast.error('Erreur lors de l\'analyse du fichier', {
          description: 'Le fichier semble corrompu'
        });
      }
    }
  };

  // Fonction pour analyser un fichier et extraire headers/preview avec cleanup automatique
  const analyzeAndOpenMappingDialog = async (file: File) => {
    const controller = cleanup.createAbortController();
    
    try {
      await cleanup.safeAsync(async (signal) => {
        return new Promise<void>((resolve, reject) => {
          if (signal.aborted) {
            reject(new Error('Operation aborted'));
            return;
          }
          
          const reader = new FileReader();
          
          // Cleanup du FileReader si l'opération est annulée
          signal.addEventListener('abort', () => {
            try {
              reader.abort();
            } catch {
              // Silent fail
            }
            reject(new Error('File reading aborted'));
          });
          
          reader.onload = (e) => {
            try {
              if (signal.aborted) {
                reject(new Error('Operation aborted'));
                return;
              }
              
              const data = e.target?.result;
              if (!data) {
                reject(new Error('No data received from file'));
                return;
              }

              let headers: string[] = [];
              let preview: string[][] = [];

              const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

              if (extension === '.csv' || extension === '.tsv') {
                // Parse CSV/TSV avec détection automatique du délimiteur
                const text = data as string;
                // Retirer le BOM UTF-8 si présent
                const textNoBom = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
                const lines = textNoBom.split(/\r?\n/).filter(line => line.trim());
                
                if (lines.length > 0) {
                  // Détection automatique du délimiteur (priorité au point-virgule pour CSV FR)
                  const firstLine = lines[0];
                  let delimiter = ',';
                  if (firstLine.includes(';')) {
                    delimiter = ';';
                  } else if (firstLine.includes('\t')) {
                    delimiter = '\t';
                  } else if (firstLine.includes(',')) {
                    delimiter = ',';
                  }
                  
                  // Split CSV-safe (gère les guillemets)
                  function splitCSVLine(line: string, delim: string): string[] {
                    const out: string[] = [];
                    let cur = '';
                    let inQuotes = false;
                    for (let i = 0; i < line.length; i++) {
                      const ch = line[i];
                      if (ch === '"') {
                        if (inQuotes && line[i + 1] === '"') { 
                          cur += '"'; 
                          i++; 
                        } else { 
                          inQuotes = !inQuotes; 
                        }
                      } else if (ch === delim && !inQuotes) {
                        out.push(cur); 
                        cur = '';
                      } else {
                        cur += ch;
                      }
                    }
                    out.push(cur);
                    return out;
                  }
                  
                  headers = splitCSVLine(lines[0], delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
                  preview = lines.slice(1, 6).map(line => 
                    splitCSVLine(line, delimiter).map(cell => cell.trim().replace(/^"|"$/g, ''))
                  );
                  
                  logInfo(
                    `CSV delimiter detected: ${delimiter === '\t' ? 'TAB' : delimiter} - Columns: ${headers.length}`,
                    {
                      component: 'PaginatedContactTable',
                      action: 'csv_analysis',
                      additionalData: { delimiter, columnCount: headers.length }
                    }
                  );
                }
              } else {
                // Parse Excel
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];
                
                if (jsonData.length > 0) {
                  headers = jsonData[0].map(h => String(h || '').trim());
                  preview = jsonData.slice(1, 6);
                  
                  logInfo(
                    `Excel file analyzed - Columns: ${headers.length}, Preview rows: ${preview.length}`,
                    {
                      component: 'PaginatedContactTable',
                      action: 'excel_analysis',
                      additionalData: { columnCount: headers.length, previewRows: preview.length }
                    }
                  );
                }
              }

              setMappingDialog({
                open: true,
                file,
                headers,
                preview
              });
              
              resolve();
            } catch (error) {
              logError(error as Error, {
                component: 'PaginatedContactTable',
                action: 'file_parse_error',
                additionalData: { fileName: file.name }
              });
              reject(error);
            }
          };
          
          reader.onerror = () => {
            const error = new Error('FileReader error');
            logError(error, {
              component: 'PaginatedContactTable',
              action: 'file_reader_error',
              additionalData: { fileName: file.name }
            });
            reject(error);
          };

          if (file.name.endsWith('.csv') || file.name.endsWith('.tsv')) {
            reader.readAsText(file, 'UTF-8'); // Encodage explicite pour Electron
          } else {
            reader.readAsBinaryString(file);
          }
        });
      },
      () => {
        // Success callback - already handled in the promise
      },
      (error) => {
        if (error.name !== 'AbortError') {
          toast.error('Erreur d\'analyse', {
            description: 'Impossible de lire le fichier'
          });
        }
      });
    } catch (error) {
      logError(error as Error, {
        component: 'PaginatedContactTable',
        action: 'analyze_file_wrapper',
        additionalData: { fileName: file.name }
      });
      
      toast.error('Erreur', {
        description: 'Impossible d\'ouvrir le fichier'
      });
    }
  };

  // Callback de confirmation d'import avec validation et cleanup
  const handleImportConfirm = async (mapping: Record<string, string>, _options: { phonesToRemove?: string[] }) => {
    try {
      if (!mappingDialog.file) {
        logWarning(
          'Import confirmation called without file',
          {
            component: 'PaginatedContactTable',
            action: 'import_confirm_no_file'
          }
        );
        return;
      }
      
      logInfo(
        'Starting import with mapping',
        {
          component: 'PaginatedContactTable',
          action: 'import_start',
          additionalData: { fileName: mappingDialog.file.name, mappingKeys: Object.keys(mapping) }
        }
      );
      
      // Si onFileImport est fourni, l'utiliser
      if (onFileImport) {
        await onFileImport(mappingDialog.file);
      }
      
      // Fermer le dialogue
      setMappingDialog({ open: false, file: null, headers: [], preview: [] });
      
      logInfo(
        'Import completed successfully',
        {
          component: 'PaginatedContactTable',
          action: 'import_success',
          additionalData: { fileName: mappingDialog.file?.name }
        }
      );
      
      toast.success('Import réussi', {
        description: 'Fichier importé avec succès'
      });

    } catch (error) {
      logError(error as Error, {
        component: 'PaginatedContactTable',
        action: 'import_confirm_error',
        additionalData: { fileName: mappingDialog.file?.name }
      });
      
      setMappingDialog(prev => ({ ...prev, open: false }));
      
      toast.error('Erreur d\'import', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue'
      });
    }
  };

  // Gérer la sélection de contact avec validation
  const handleSelectContact = (contact: Contact | null) => {
    try {
      if (contact) {
        logInfo(
          'Contact selected',
          {
            component: 'PaginatedContactTable',
            action: 'contact_selection',
            contactId: contact.id,
            additionalData: { contactName: `${contact.prenom} ${contact.nom}` }
          }
        );
      }
      
      onSelectContact(contact);
    } catch (error) {
      logError(error as Error, {
        component: 'PaginatedContactTable',
        action: 'select_contact_wrapper',
        contactId: contact?.id
      });
    }
  };

  // Gérer les changements de pagination avec persistance sécurisée
  const handlePageChange = (page: number) => {
    try {
      localStorage.setItem('dimicall-current-page', String(page));
      
      logInfo(
        `Page changed to ${page}`,
        {
          component: 'PaginatedContactTable',
          action: 'page_change',
          additionalData: { newPage: page, totalPages }
        }
      );
    } catch (error) {
      logError(error as Error, {
        component: 'PaginatedContactTable',
        action: 'save_current_page'
      });
    }
    
    goToPage(page);
    
    // Scroll vers le haut avec cleanup automatique
    cleanup.safeSetTimeout(() => {
      if (ref && 'current' in ref && ref.current) {
        // Si la table a une méthode de scroll, l'utiliser
        // Sinon, on peut scroll vers le haut du conteneur
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    try {
      localStorage.setItem('dimicall-items-per-page', String(newItemsPerPage));
      
      logInfo(
        `Items per page changed to ${newItemsPerPage}`,
        {
          component: 'PaginatedContactTable',
          action: 'items_per_page_change',
          additionalData: { newItemsPerPage, oldItemsPerPage: itemsPerPage }
        }
      );
    } catch (error) {
      logError(error as Error, {
        component: 'PaginatedContactTable',
        action: 'save_items_per_page'
      });
    }
    
    setItemsPerPage(newItemsPerPage);
  };

  // Fonction pour retry en cas d'erreur dans le boundary
  const handleErrorBoundaryRetry = () => {
    logInfo(
      'Error boundary retry requested',
      {
        component: 'PaginatedContactTable',
        action: 'error_boundary_retry'
      }
    );
    
    // Reset des états locaux qui pourraient causer des problèmes
    setMappingDialog({ open: false, file: null, headers: [], preview: [] });
    setIsDragActive(false);
    setIsDragOver(false);
  };

  const paginationNode = (
    <div className="px-3 py-1.5 min-h-[48px] border-t bg-card">
      <TablePagination
        className="w-full"
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
  );

  return (
    <TableErrorBoundary
      theme={theme}
      fallbackTitle="Problème avec le tableau de contacts"
      onRetry={handleErrorBoundaryRetry}
      context="PaginatedContactTable"
    >
      <div 
        className={`flex flex-col h-full ${className}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <DropZoneOverlay isVisible={isDragOver} isDragActive={isDragActive} />
        
        {/* Table avec données paginées - aussi protégée par error boundary */}
        <div className="flex-1" style={{ minHeight: 0, overflow: 'hidden' }}>
          <TableErrorBoundary
            theme={theme}
            fallbackTitle="Problème avec l'affichage du tableau"
            context={useVirtualizedTable ? "VirtualizedContactTable" : "ContactTable"}
          >
            {useVirtualizedTable ? (
              <VirtualizedContactTable
                ref={ref as React.Ref<VirtualizedContactTableRef>}
                contacts={paginatedData}
                callStates={callStates}
                onSelectContact={handleSelectContact}
                selectedContactId={selectedContactId}
                onUpdateContact={handleValidatedUpdateContact}
                onDeleteContact={handleValidatedDeleteContact}
                activeCallContactId={activeCallContactId}
                theme={theme}
                visibleColumns={visibleColumns}
                columnHeaders={columnHeaders}
                contactDataKeys={contactDataKeys}
                onToggleColumnVisibility={onToggleColumnVisibility}
                availableColumns={availableColumns}
                onFileImport={onFileImport}
              />
            ) : (
              <ContactTable
                ref={ref}
                contacts={paginatedData}
                callStates={callStates}
                onSelectContact={handleSelectContact}
                selectedContactId={selectedContactId}
                onUpdateContact={handleValidatedUpdateContact}
                onDeleteContact={handleValidatedDeleteContact}
                activeCallContactId={activeCallContactId}
                theme={theme}
                visibleColumns={visibleColumns}
                columnHeaders={columnHeaders}
                contactDataKeys={contactDataKeys}
                onToggleColumnVisibility={onToggleColumnVisibility}
                availableColumns={availableColumns}
                onFileImport={onFileImport}
              />
            )}
          </TableErrorBoundary>
        </div>
        
        {/* Pagination aussi protégée */}
        <TableErrorBoundary
          theme={theme}
          fallbackTitle="Problème avec la pagination"
          context="TablePagination"
        >
          {paginationNode}
        </TableErrorBoundary>

        {/* Dialogue de mapping d'import - protégé par error boundary */}
        <TableErrorBoundary
          theme={theme}
          fallbackTitle="Problème avec le dialogue d'import"
          context="ImportMappingDialog"
        >
          <ImportMappingDialog
            isOpen={mappingDialog.open}
            onClose={() => {
              setMappingDialog({ open: false, file: null, headers: [], preview: [] });
              logInfo(
                'Import mapping dialog closed',
                {
                  component: 'PaginatedContactTable',
                  action: 'import_dialog_close'
                }
              );
            }}
            fileName={mappingDialog.file?.name || ''}
            detectedHeaders={mappingDialog.headers}
            previewRows={mappingDialog.preview}
            expectedTargets={EXPECTED_TARGETS}
            requiredTargets={REQUIRED_TARGETS}
            onConfirm={handleImportConfirm}
          />
        </TableErrorBoundary>
      </div>
    </TableErrorBoundary>
  );
});

PaginatedContactTable.displayName = 'PaginatedContactTable';