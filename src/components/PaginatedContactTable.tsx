import { forwardRef, useState } from 'react';
import { Contact, CallStates, Theme } from '../types';
import { ContactTable, ContactTableRef } from './ContactTable';
import { TablePagination } from './TablePagination';
import { usePagination } from '../hooks/usePagination';
import { DropZoneOverlay } from './DropZoneOverlay';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { ImportMappingDialog } from './ImportMappingDialog';

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
      } catch {
        return 1;
      }
    })(),
  });

  // Handlers pour le drag & drop
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
        toast.error('Format de fichier non supporté', {
          description: 'Veuillez utiliser un fichier .csv, .tsv, .xlsx ou .xls'
        });
        return;
      }

      // Analyser le fichier et ouvrir le dialogue de mapping
      await analyzeAndOpenMappingDialog(file);
    }
  };

  // Fonction pour analyser un fichier et extraire headers/preview
  const analyzeAndOpenMappingDialog = async (file: File) => {
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) return;

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
              
              console.log('🔍 [CSV] Délimiteur détecté:', delimiter === '\t' ? 'TAB' : delimiter, '- Colonnes:', headers.length);
            }
          } else {
            // Parse Excel
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];
            
            if (jsonData.length > 0) {
              headers = jsonData[0].map(h => String(h || '').trim());
              preview = jsonData.slice(1, 6);
            }
          }

          setMappingDialog({
            open: true,
            file,
            headers,
            preview
          });
        } catch (error) {
          console.error('Erreur lors de l\'analyse du fichier:', error);
          toast.error('Erreur d\'analyse', {
            description: 'Impossible de lire le fichier'
          });
        }
      };

      if (file.name.endsWith('.csv') || file.name.endsWith('.tsv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du fichier:', error);
      toast.error('Erreur', {
        description: 'Impossible d\'ouvrir le fichier'
      });
    }
  };

  // Callback de confirmation d'import
  const handleImportConfirm = async (mapping: Record<string, string>, _options: { phonesToRemove?: string[] }) => {
    try {
      if (!mappingDialog.file) {
        console.log('❌ [MAPPING] Aucun fichier dans le dialogue');
        return;
      }
      
      console.log('🔄 [MAPPING] Début de l\'importation avec mapping:', mapping);
      
      // Si onFileImport est fourni, l'utiliser
      if (onFileImport) {
        await onFileImport(mappingDialog.file);
      }
      
      // Fermer le dialogue
      setMappingDialog({ open: false, file: null, headers: [], preview: [] });
      console.log('🔒 [MAPPING] Dialogue fermé');
      
      toast.success('Import réussi', {
        description: 'Fichier importé avec succès'
      });

    } catch (error) {
      console.error('❌ [MAPPING] Erreur lors de l\'import:', error);
      setMappingDialog(prev => ({ ...prev, open: false }));
      toast.error('Erreur d\'import', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue'
      });
    }
  };

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
    <div 
      className={`flex flex-col h-full ${className}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <DropZoneOverlay isVisible={isDragOver} isDragActive={isDragActive} />
      
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
      {paginationNode}

      {/* Dialogue de mapping d'import */}
      <ImportMappingDialog
        isOpen={mappingDialog.open}
        onClose={() => setMappingDialog({ open: false, file: null, headers: [], preview: [] })}
        fileName={mappingDialog.file?.name || ''}
        detectedHeaders={mappingDialog.headers}
        previewRows={mappingDialog.preview}
        expectedTargets={EXPECTED_TARGETS}
        requiredTargets={REQUIRED_TARGETS}
        onConfirm={handleImportConfirm}
      />
    </div>
  );
});

PaginatedContactTable.displayName = 'PaginatedContactTable';