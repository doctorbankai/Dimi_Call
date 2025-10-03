import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Contact, Theme, ContactStatus } from '../types';
import { Modal, Button, Input } from './Common';
import { supabaseService } from '../services/supabaseService';
import { IconChevronUp, IconChevronDown } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Search,
  Download,
  Loader2,
  Database,
  Users,
  CheckSquare,
  Square,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Settings,
  X,
  ArrowRight,
  Link,
  RotateCcw
} from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SupabaseDataDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (selectedContacts: Partial<Contact>[]) => void;
  theme: Theme;
}

interface RawContact {
  [key: string]: any;
}

interface ColumnMapping {
  supabaseColumn: string;
  appColumn: string;
  priority?: number; // Pour les colonnes avec itérations
}

// Mapping prédéfini des colonnes - CORRIGÉ selon vos spécifications
const PREDEFINED_MAPPINGS: Record<string, string> = {
  'statut_final': 'statut',
  'date_rappel': 'dateRappel',
  'heure_rappel': 'heureRappel',
  'sexe': 'sexe',
  'prenom': 'prenom',
  'nom': 'nom',
  'numero': 'telephone',
  'mail': 'email',
  'source': 'source',
  'type': 'type',
  'don': 'don',
  'qualite': 'qualite',
  'UID': 'uid'
};

// Patterns pour les colonnes avec itérations - TOUS mappent vers les mêmes colonnes de base
const ITERATION_PATTERNS = [
  // Patterns appel : date_appel_X -> dateAppel, statut_appel_X -> statut, commentaires_appel_X -> commentaire
  { pattern: /^date_appel_(\d+)$/, appColumn: 'dateAppel' },
  { pattern: /^statut_appel_(\d+)$/, appColumn: 'statut' },
  { pattern: /^commentaires_appel_(\d+)$/, appColumn: 'commentaire' },
  // Patterns RDV : date_rX_X -> date, type_rX_X -> type, statut_rX_X -> statut, commentaires_rX_X -> commentaire
  { pattern: /^date_r(\d+)_(\d+)$/, appColumn: 'date' },
  { pattern: /^type_r(\d+)_(\d+)$/, appColumn: 'type' },
  { pattern: /^statut_r(\d+)_(\d+)$/, appColumn: 'statut' },
  { pattern: /^commentaires_r(\d+)_(\d+)$/, appColumn: 'commentaire' }
];

// Colonnes à exclure complètement
const EXCLUDED_COLUMNS = ['Nu'];

// Colonnes cibles de l'application - SIMPLIFIÉES
const APP_COLUMNS = [
  { key: 'prenom', label: 'Prénom' },
  { key: 'nom', label: 'Nom' },
  { key: 'telephone', label: 'Téléphone' },
  { key: 'email', label: 'Mail' },
  { key: 'source', label: 'Source' },
  { key: 'statut', label: 'Statut' },
  { key: 'commentaire', label: 'Commentaire' },
  { key: 'dateRappel', label: 'Date Rappel' },
  { key: 'heureRappel', label: 'Heure Rappel' },
  { key: 'dateAppel', label: 'Date Appel' },
  { key: 'sexe', label: 'Sexe' },
  { key: 'don', label: 'Don' },
  { key: 'qualite', label: 'Qualité' },
  { key: 'type', label: 'Type' },
  { key: 'date', label: 'Date' },
  { key: 'uid', label: 'UID' }
];

export const SupabaseDataDialog: React.FC<SupabaseDataDialogProps> = ({ isOpen, onClose, onImport, theme }) => {
  // Debug log pour vérifier le rendu
  console.log('🐛 SupabaseDataDialog rendu avec isOpen:', isOpen);

  // États principaux
  const [step, setStep] = useState<'config' | 'mapping' | 'preview'>('config');
  const [rawContacts, setRawContacts] = useState<RawContact[]>([]);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchColumn, setSearchColumn] = useState('all');
  
  // Configuration Supabase
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [configUrl, setConfigUrl] = useState('');
  const [configKey, setConfigKey] = useState('');
  const [configuring, setConfiguring] = useState(false);
  
  // États de la table (pour l'étape preview)
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  });
  
  // Références pour la virtualisation
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const lastSelectedIndex = useRef<number>(-1);

  // Vérification de la configuration au montage
  useEffect(() => {
    if (isOpen) {
      checkConfiguration();
    }
  }, [isOpen]);

  // Génération automatique des mappings quand les colonnes sont chargées
  useEffect(() => {
    if (availableColumns.length > 0) {
      generateAutomaticMappings();
    }
  }, [availableColumns]);

  const checkConfiguration = async () => {
    try {
      const connectionInfo = supabaseService.getConnectionInfo();
      if (!connectionInfo.configured) {
        setShowConfigForm(true);
        return;
      }
      
      await loadInitialData();
    } catch (error) {
      console.error('Erreur lors de la vérification de configuration:', error);
      setShowConfigForm(true);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Chargement initial des données...');
      const result = await supabaseService.getRawSupabaseData(0, 1000);
      
      console.log('✅ Données chargées:', {
        count: result.data.length,
        totalCount: result.totalCount,
        columns: result.columns.length
      });
      
      setRawContacts(result.data);
      setAvailableColumns(result.columns);
      setTotalCount(result.totalCount);
      setStep('mapping');
      
      // Charger plus de données si nécessaire
      if (result.hasMore && result.data.length < 2000) {
        await loadMoreData(1);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error);
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreData = async (page: number) => {
    try {
      const result = await supabaseService.getRawSupabaseData(page, 1000);
      setRawContacts(prev => [...prev, ...result.data]);
    } catch (error) {
      console.error('Erreur lors du chargement de plus de données:', error);
    }
  };

  const handleManualConfiguration = async () => {
    if (!configUrl.trim() || !configKey.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setConfiguring(true);
    setError(null);

    try {
      supabaseService.configureManually(configUrl.trim(), configKey.trim());
      const testResult = await supabaseService.testConnection();
      
      if (testResult.success) {
        setShowConfigForm(false);
        await loadInitialData();
      } else {
        setError(testResult.error || 'Échec de la connexion');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur de configuration');
    } finally {
      setConfiguring(false);
    }
  };



  const generateAutomaticMappings = () => {
    const mappings: ColumnMapping[] = [];
    const processedColumns = new Set<string>();
    
    console.log('🔧 Génération automatique des mappings pour', availableColumns.length, 'colonnes');
    console.log('🔍 Colonnes disponibles:', availableColumns);
    
    // Filtrer les colonnes exclues
    const validColumns = availableColumns.filter(column => !EXCLUDED_COLUMNS.includes(column));
    console.log('🚫 Colonnes exclues:', availableColumns.filter(column => EXCLUDED_COLUMNS.includes(column)));
    console.log('✅ Colonnes valides:', validColumns.length);
    
    // 1. D'abord, traiter tous les mappings directs
    validColumns.forEach(column => {
      if (PREDEFINED_MAPPINGS[column]) {
        mappings.push({
          supabaseColumn: column,
          appColumn: PREDEFINED_MAPPINGS[column]
        });
        processedColumns.add(column);
        console.log('✅ Mapping direct:', column, '->', PREDEFINED_MAPPINGS[column]);
      }
    });
    
    // 2. Ensuite, traiter toutes les colonnes avec patterns d'itération
    // IMPORTANT: Tous les patterns mappent vers les MÊMES colonnes de base
    validColumns.forEach(column => {
      if (processedColumns.has(column)) return; // Déjà traité
      
      for (const { pattern, appColumn } of ITERATION_PATTERNS) {
        const match = column.match(pattern);
        if (match) {
          let priority = 0;
          
          // Calculer la priorité selon le pattern pour l'ordre d'affichage
          if (match.length === 2) {
            // Pattern simple comme date_appel_1
            priority = parseInt(match[1]);
          } else if (match.length === 3) {
            // Pattern complexe comme date_r1_2
            priority = parseInt(match[1]) * 10 + parseInt(match[2]);
          }
          
          mappings.push({
            supabaseColumn: column,
            appColumn: appColumn, // Même appColumn pour toutes les itérations !
            priority
          });
          processedColumns.add(column);
          console.log('✅ Mapping pattern:', column, '->', appColumn, '(priorité:', priority + ')');
          break; // Sortir de la boucle des patterns une fois trouvé
        }
      }
    });
    
    // 3. Ajouter les colonnes non mappées comme "no-mapping"
    const unmappedColumns = validColumns.filter(col => !processedColumns.has(col));
    unmappedColumns.forEach(column => {
      mappings.push({
        supabaseColumn: column,
        appColumn: 'no-mapping'
      });
      console.log('⚠️ Colonne non mappée:', column);
    });
    
    console.log('📊 Résultat final:', mappings.length, 'mappings créés');
    console.log('📊 Répartition:', {
      mappingsActifs: mappings.filter(m => m.appColumn !== 'no-mapping').length,
      nonMappes: mappings.filter(m => m.appColumn === 'no-mapping').length,
      total: mappings.length,
      exclus: availableColumns.length - validColumns.length
    });
    
    setColumnMappings(mappings);
  };

  const updateMapping = (index: number, appColumn: string) => {
    setColumnMappings(prev => {
      const newMappings = [...prev];
      
      // Si on essaie d'assigner une appColumn déjà utilisée, retirer l'ancien mapping
      if (appColumn !== 'no-mapping') {
        const existingIndex = newMappings.findIndex(
          (mapping, i) => i !== index && mapping.appColumn === appColumn
        );
        if (existingIndex !== -1) {
          newMappings[existingIndex] = { ...newMappings[existingIndex], appColumn: 'no-mapping' };
        }
      }
      
      // Mettre à jour le mapping actuel
      newMappings[index] = { ...newMappings[index], appColumn };
      
      return newMappings;
    });
  };

  const removeMapping = (index: number) => {
    setColumnMappings(prev => prev.filter((_, i) => i !== index));
  };

  const addMapping = () => {
    const unmappedColumns = availableColumns.filter(col => 
      !columnMappings.some(mapping => mapping.supabaseColumn === col)
    );
    
    if (unmappedColumns.length > 0) {
      setColumnMappings(prev => [...prev, {
        supabaseColumn: unmappedColumns[0],
        appColumn: 'no-mapping'
      }]);
    }
  };

  // Création des colonnes pour TanStack Table (étape preview)
  const columnHelper = createColumnHelper<Contact>();
  
  const previewColumns = useMemo<ColumnDef<Contact>[]>(() => {
    if (step !== 'preview') return [];
    
    const selectColumn = columnHelper.display({
      id: 'select',
      size: 50,
      minSize: 50,
      maxSize: 50,
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        </div>
      ),
    });

    // Colonnes basées sur les mappings configurés
    const mappedColumns = columnMappings
      .filter(mapping => mapping.appColumn && mapping.appColumn !== 'no-mapping')
      .map((mapping, index) => {
        const appColumnInfo = APP_COLUMNS.find(col => col.key === mapping.appColumn);
        return columnHelper.accessor(mapping.appColumn as keyof Contact, {
          id: `${mapping.appColumn}_${index}`, // ID unique avec index pour éviter les doublons
          header: appColumnInfo?.label || mapping.appColumn,
          size: 150,
          cell: (info) => (
            <div className="px-2 py-1 text-sm truncate">
              {String(info.getValue() || '')}
            </div>
          ),
        }) as ColumnDef<Contact>;
      });

    return [selectColumn, ...mappedColumns];
  }, [step, columnMappings]);

  const mapRawContactToContact = (rawContact: RawContact): Partial<Contact> => {
    const mapped: Partial<Contact> = {
      id: rawContact.id || rawContact.UID || `temp-${Date.now()}-${Math.random()}`,
    };

    // Appliquer les mappings configurés
    columnMappings.forEach(mapping => {
      if (mapping.appColumn && mapping.appColumn !== 'no-mapping' && rawContact[mapping.supabaseColumn] !== undefined) {
        const value = rawContact[mapping.supabaseColumn];
        
        // Traitement spécial pour le statut
        if (mapping.appColumn === 'statut') {
          // Convertir les valeurs de statut Supabase vers ContactStatus
          const statusMapping: Record<string, ContactStatus> = {
            'Non défini': ContactStatus.NonDefini,
            'Mauvais num': ContactStatus.MauvaisNum,
            'Répondeur': ContactStatus.Repondeur,
            'À rappeler': ContactStatus.ARappeler,
            'Pas intéressé': ContactStatus.PasInteresse,
            'Argumenté': ContactStatus.Argumente,
            'DO': ContactStatus.DO,
            'RO': ContactStatus.RO,
            'Liste noire': ContactStatus.ListeNoire,
            'Prématuré': ContactStatus.Premature,
          };
          (mapped as any)[mapping.appColumn] = statusMapping[value] || ContactStatus.NonDefini;
        } else {
          (mapped as any)[mapping.appColumn] = value;
        }
      }
    });

    return mapped;
  };

  const mappedContacts = useMemo(() => {
    return rawContacts.map(mapRawContactToContact);
  }, [rawContacts, columnMappings]);

  const table = useReactTable({
    data: mappedContacts as Contact[],
    columns: previewColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    state: {
      sorting,
      rowSelection,
      globalFilter,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    enableMultiRowSelection: true,
  });

  const handleRowClick = (index: number, event: React.MouseEvent) => {
    const row = table.getRowModel().rows[index];
    if (!row) return;

    if (event.shiftKey && lastSelectedIndex.current !== -1) {
      // Sélection en bloc avec Shift
      const start = Math.min(lastSelectedIndex.current, index);
      const end = Math.max(lastSelectedIndex.current, index);
      
      const newSelection = { ...rowSelection };
      for (let i = start; i <= end; i++) {
        const rowAtIndex = table.getRowModel().rows[i];
        if (rowAtIndex) {
          newSelection[rowAtIndex.id] = true;
        }
      }
      setRowSelection(newSelection);
    } else {
      // Sélection simple
      row.toggleSelected();
      lastSelectedIndex.current = index;
    }
  };

  const rows = table.getRowModel().rows;
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  const handleImportSelected = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const selectedContacts = selectedRows.map(row => row.original);
    onImport(selectedContacts);
    onClose();
  };

  const selectedCount = Object.keys(rowSelection).length;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const progressPercentage = totalCount > 0 ? (rawContacts.length / totalCount) * 100 : 0;

  // Rendu du formulaire de configuration
  if (showConfigForm) {
    return (
          <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground z-[9999]">
          <DialogHeader className="bg-card text-card-foreground">
            <DialogTitle>Configuration Supabase</DialogTitle>
            <DialogDescription>
              Configurez les paramètres de connexion à votre base de données Supabase.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 bg-card text-card-foreground">
            <div className="space-y-2">
              <label className="text-sm font-medium">URL Supabase</label>
              <Input
                type="url"
                placeholder="https://votre-projet.supabase.co"
                value={configUrl}
                onChange={(e) => setConfigUrl(e.target.value)}
                disabled={configuring}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Clé anonyme</label>
              <Input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={configKey}
                onChange={(e) => setConfigKey(e.target.value)}
                disabled={configuring}
              />
            </div>
            
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={configuring}>
                Annuler
              </Button>
              <Button onClick={handleManualConfiguration} disabled={configuring}>
                {configuring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connecter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Étape de mapping des colonnes
  if (step === 'mapping') {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 bg-card text-card-foreground z-[9999]">
        <DialogHeader className="px-6 py-4 border-b bg-card text-card-foreground">
          <DialogTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Configuration du mapping des colonnes
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden bg-card text-card-foreground">
            {/* Instructions */}
            <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Associez les colonnes de votre table Supabase aux colonnes de l'application. 
                Les mappings automatiques ont été générés selon vos données.
              </p>
            </div>

            {/* Interface de mapping */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 overflow-auto hide-scrollbar">
              {/* Colonnes Supabase */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Colonnes Supabase ({availableColumns.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {availableColumns.map((column) => {
                        const isMapped = columnMappings.some(m => m.supabaseColumn === column);
                        return (
                          <div
                            key={column}
                            className={`p-3 rounded-lg border text-sm transition-colors ${
                              isMapped 
                                ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                                : 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                            }`}
                          >
                            <div className="font-medium">{column}</div>
                            {isMapped && (
                              <div className="text-xs mt-1 opacity-75">
                                ✓ Mappé
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Mappings actuels */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Mappings configurés ({columnMappings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {columnMappings.map((mapping, index) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {mapping.supabaseColumn}
                              </div>
                              {mapping.priority && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">
                                  Priorité: {mapping.priority}
                                </div>
                              )}
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div className="flex-1">
                              <Select 
                                value={mapping.appColumn} 
                                onValueChange={(value) => updateMapping(index, value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                                  <SelectItem value="no-mapping">Ne pas mapper</SelectItem>
                                  {APP_COLUMNS.map((col) => (
                                    <SelectItem key={col.key} value={col.key}>
                                      {col.label}
                        </SelectItem>
                      ))}

                    </SelectContent>
                  </Select>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeMapping(index)}
                              className="flex-shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {columnMappings.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          Aucun mapping configuré
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  
                  <div className="mt-4 flex gap-2">
                    <Button onClick={addMapping} variant="outline" className="flex-1">
                      Ajouter un mapping
                    </Button>
                    <Button 
                      onClick={generateAutomaticMappings} 
                      variant="outline"
                      className="gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Auto
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-800">
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('config')}>
                    Retour
                  </Button>
                  <Button 
                    onClick={() => setStep('preview')} 
                    disabled={columnMappings.filter(m => m.appColumn && m.appColumn !== 'no-mapping').length === 0}
                  >
                    Prévisualiser ({columnMappings.filter(m => m.appColumn && m.appColumn !== 'no-mapping').length} mappings)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Étape de prévisualisation et sélection
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 bg-card text-card-foreground z-[9999]">
        <DialogHeader className="px-6 py-4 border-b bg-card text-card-foreground">
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Prévisualisation et sélection des contacts
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden bg-card text-card-foreground">
          {/* Barre d'outils */}
          <div className="px-4 sm:px-6 py-4 border-b bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 w-full">
                <div className="flex items-center gap-2 w-full sm:flex-1 sm:max-w-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher..."
                      value={globalFilter}
                      onChange={(e) => setGlobalFilter(e.target.value)}
                      className="pl-10 pr-9 w-full"
                    />
                    {globalFilter && (
                      <button
                        onClick={() => setGlobalFilter('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        aria-label="Effacer la recherche"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="gap-1 whitespace-nowrap">
                    <Users className="h-3 w-3" />
                    {filteredCount.toLocaleString()} contacts
                  </Badge>
                  
                  {selectedCount > 0 && (
                    <Badge variant="default" className="gap-1 whitespace-nowrap">
                      <CheckSquare className="h-3 w-3" />
                      {selectedCount} sélectionnés
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('mapping')}>
                  Modifier mapping
                </Button>
              <Button
                onClick={handleImportSelected}
                disabled={selectedCount === 0}
                  className="gap-2"
              >
                <Download className="h-4 w-4" />
                Importer ({selectedCount})
              </Button>
            </div>
                </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Chargement des données...</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle className="text-red-600">Erreur</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()} className="w-full">
                      Réessayer
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {/* Container avec scroll horizontal */}
                <div className="flex-1 overflow-auto bg-card text-card-foreground hide-scrollbar">
                  <div className="min-w-fit bg-card text-card-foreground">
                    {/* En-têtes de table */}
                    <div className="border-b bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                      {table.getHeaderGroups().map(headerGroup => (
                        <div key={headerGroup.id} className="flex bg-gray-50 dark:bg-gray-800">
                          {headerGroup.headers.map(header => (
                            <div
                              key={header.id}
                              className="flex-shrink-0 border-r last:border-r-0 bg-gray-50 dark:bg-gray-800"
                              style={{ width: `${header.getSize()}px` }}
                            >
                              {header.isPlaceholder ? null : (
                                <div className="h-12 flex items-center px-2">
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Corps de table virtualisé */}
                    <div
                      ref={tableContainerRef}
                      className="bg-card text-card-foreground"
                      style={{ height: 'calc(90vh - 280px)', minHeight: '300px', maxHeight: '600px' }}
                    >
                      <div
                        style={{
                          height: `${rowVirtualizer.getTotalSize()}px`,
                          width: '100%',
                          position: 'relative',
                        }}
                      >
                        {rowVirtualizer.getVirtualItems().map(virtualRow => {
                          const row = rows[virtualRow.index];
                          return (
                            <div
                              key={row.id}
                              className={`absolute top-0 left-0 w-full flex border-b hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-none bg-card text-card-foreground ${
                                row.getIsSelected() ? 'bg-blue-100 dark:bg-blue-900/50' : ''
                              }`}
                              style={{
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                              }}
                              onClick={(e) => handleRowClick(virtualRow.index, e)}
                            >
                              {row.getVisibleCells().map(cell => (
                                <div
                                  key={cell.id}
                                  className="flex-shrink-0 border-r last:border-r-0 flex items-center bg-card text-card-foreground"
                                  style={{ width: `${cell.column.getSize()}px` }}
                                >
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && !error && (
            <div className="px-4 sm:px-6 py-4 border-t bg-gray-50 dark:bg-gray-800">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
                  <span className="whitespace-nowrap">
                    Page {table.getState().pagination.pageIndex + 1} sur {table.getPageCount()}
                  </span>
                  <Separator orientation="vertical" className="h-4 hidden sm:block" />
                  <span className="whitespace-nowrap">
                    {table.getFilteredRowModel().rows.length} résultats
                  </span>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                    className="px-2 sm:px-3"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                    <span className="sr-only">Première page</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="px-2 sm:px-3"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Page précédente</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="px-2 sm:px-3"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Page suivante</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                    className="px-2 sm:px-3"
                  >
                    <ChevronsRight className="h-4 w-4" />
                    <span className="sr-only">Dernière page</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
