import React, { useEffect, useMemo, useRef, useState } from "react"
import { Contact, ContactStatus, CallStates, CallMode } from "../types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Bell,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  EyeOff,
  Globe,
  History,
  Linkedin,
  Phone,
  PhoneCall,
  Search,
  Settings2,
  Trash2,
  Upload,
  Plus,
  Pencil,
  X,
  Users,
  BarChart3,
  FileSpreadsheet,
  Check,
} from "lucide-react"
import { COLUMN_HEADERS, DEFAULT_COLUMN_ORDER } from "../constants"
import CallControl from "./CallControl"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DatePickerWithClear } from "./DatePickerWithClear"
import { TimePickerWithClear } from "./TimePickerWithClear"
import { ZapWidget } from "./ZapWidget"
import { DropZoneOverlay } from "./DropZoneOverlay"
import { ImportProgressBar } from "./ImportProgressBar"
import ImportMappingDialog from "./ImportMappingDialog"
import { QUICK_COMMENTS } from "../constants"
import { toast } from "sonner"
import * as XLSX from 'xlsx'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  ResizablePanelGroup,
  ResizablePanel,
} from "@/components/ui/resizable"
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from "@/components/ui/command"
import { Progress } from "@/components/ui/progress"
import { shortcutService } from '../services/shortcutService'
import { exportContactsToFile, exportGoogleContactsCSV, exportGoogleCalendarCSV, importContactsFromFile } from '../services/dataService'
import { ViewSwitcher, ViewMode } from '@/components/ViewSwitcher'
import { PaginatedContactTable } from '@/components/PaginatedContactTable'
import type { ContactTableRef } from '@/components/ContactTable'
import { useCallMode } from "../context/ModeContext"
import { StatusConfigService } from "../services/statusConfigService"
// Retire le radial chart dans la barre de recherche

export type TableTab = {
  id: string
  name: string
  color?: string
  contacts: Contact[]
}

type AppelsCardsViewProps = {
  contacts: Contact[]
  selectedContactId: string | null
  onSelectContact: (contact: Contact | null) => void
  onUpdateContact: (updates: Partial<Contact> & { id: string }) => void
  callStates: CallStates
  activeCallContactId: string | null
  callStartTime: Date | null
  adbConnected: boolean
  onCall: () => void | Promise<void>
  onHangUp: () => void | Promise<void>
  onEmail: () => void
  onSms: () => void
  onRappel: () => void
  onRendezVous: () => void
  onCalCom: () => void
  onQualification: () => void
  onLinkedInSearch: (mode?: 'name' | 'name-type') => void
  onGoogleSearch: () => void
  onDirectLink: () => void
  onExport: () => void
  onClearActiveTab: () => void
  searchQuery: string
  onSearch: (value: string) => void
  onImportDialog: () => void
  onExportDialog: () => void
  autoSearchMode: 'disabled' | 'linkedin' | 'linkedin-name' | 'linkedin-name-type' | 'google' | 'link'
  onAutoSearchModeChange: (mode: 'disabled' | 'linkedin' | 'linkedin-name' | 'linkedin-name-type' | 'google' | 'link') => void
  // Props pour la gestion des onglets
  tableTabs?: TableTab[]
  activeTableTabId?: string
  onSetActiveTableTabId?: (id: string) => void
  onAddTab?: () => void
  onEditTab?: (tab: TableTab) => void
  onDeleteTab?: (tabId: string) => void
}

type FormState = Pick<
  Contact,
  | "prenom"
  | "nom"
  | "telephone"
  | "email"
  | "commentaire"
  | "dateRappel"
  | "heureRappel"
  | "dateRDV"
  | "heureRDV"
  | "dateAppel"
  | "heureAppel"
  | "dureeAppel"
  | "source"
>

const getInitialFormState = (contact: Contact | null): FormState => ({
  prenom: contact?.prenom ?? "",
  nom: contact?.nom ?? "",
  telephone: contact?.telephone ?? "",
  email: contact?.email ?? "",
  commentaire: contact?.commentaire ?? "",
  dateRappel: contact?.dateRappel ?? "",
  heureRappel: contact?.heureRappel ?? "",
  dateRDV: contact?.dateRDV ?? "",
  heureRDV: contact?.heureRDV ?? "",
  dateAppel: contact?.dateAppel ?? "",
  heureAppel: contact?.heureAppel ?? "",
  dureeAppel: contact?.dureeAppel ?? "",
  source: contact?.source ?? "",
})

const formatDisplayDate = (value?: string) => {
  if (!value) return ""
  try {
    return format(new Date(value), "dd MMM yyyy", { locale: fr })
  } catch {
    return value
  }
}

const formatDisplayDateTime = (date?: string, time?: string) => {
  const formattedDate = formatDisplayDate(date)
  if (!formattedDate) return ""
  return time ? `${formattedDate} à ${time}` : formattedDate
}

const iconBadgeClass =
  "inline-flex items-center justify-center rounded-full border border-border/70 h-[22px] w-[22px] sm:h-[24px] sm:w-[24px] text-[9px] sm:text-[10px] font-medium leading-none shrink-0";

const contactBadgeClass =
  "inline-flex items-center justify-center rounded-full border border-border/70 px-1.5 sm:px-2 py-0 text-[9px] sm:text-[10px] font-medium leading-none h-[22px] sm:h-[24px] shrink-0";

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
]

const REQUIRED_TARGETS = ['telephone']

export const AppelsCardsView: React.FC<AppelsCardsViewProps> = ({
  contacts,
  selectedContactId,
  onSelectContact,
  onUpdateContact,
  callStates,
  activeCallContactId,
  callStartTime,
  adbConnected,
  onCall,
  onHangUp,
  onEmail,
  onSms,
  onRappel,
  onRendezVous,
  onCalCom,
  onQualification,
  onLinkedInSearch,
  onGoogleSearch,
  onDirectLink,
  onExport: _onExport,
  onClearActiveTab,
  searchQuery,
  onSearch,
  onImportDialog: _onImportDialog,
  onExportDialog: _onExportDialog,
  autoSearchMode,
  onAutoSearchModeChange,
  // Props pour la gestion des onglets
  tableTabs = [],
  activeTableTabId = '',
  onSetActiveTableTabId,
  onAddTab,
  onEditTab,
  onDeleteTab,
}) => {
  const [visibleCount, setVisibleCount] = useState(40)
  const [activeFilter] = useState<'all' | 'rappel' | 'rdv' | 'status'>('all')

  // Ref pour tracker si le scroll doit être automatique (uniquement au clic)
  const shouldAutoScrollRef = useRef(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem('appels-2-view-mode');
      return saved === 'table' ? 'table' : 'cards';
    } catch {
      return 'cards';
    }
  })
  const { mode } = useCallMode()
  const statusOptions = useMemo(() => StatusConfigService.getStatusList(mode), [mode])
  const columnHeadersWithProfile = useMemo(() => ['Profil', ...COLUMN_HEADERS], [])
  // Charger la configuration des colonnes essentielles depuis les paramètres
  const getEssentialColumns = (): string[] => {
    const saved = localStorage.getItem('dimicall_column_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        const essentials = Object.keys(config).filter(key => config[key] === true);
        if (!essentials.includes('Profil')) {
          essentials.unshift('Profil');
        }
        return essentials;
      } catch (error) {
        console.error('Erreur lors du chargement de la config des colonnes:', error);
      }
    }
    // Configuration par défaut si rien n'est sauvegardé
    return ['Profil', '#', 'Prénom', 'Nom', 'Commentaire'];
  };

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    // Par défaut, toutes les colonnes sont visibles
    const defaultVisible: Record<string, boolean> = {};
    columnHeadersWithProfile.forEach(header => {
      defaultVisible[header] = true;
    });
    // Tenter de charger la configuration sauvegardée
    try {
      const saved = localStorage.getItem('appels2-visible-columns');
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, boolean>;
        const merged: Record<string, boolean> = {};
        // Ne garder que les colonnes connues et ajouter les nouvelles en visible par défaut
        columnHeadersWithProfile.forEach(header => {
          merged[header] = typeof parsed[header] === 'boolean' ? parsed[header] : true;
        });
        return merged;
      }
    } catch (e) {
      console.error('[AppelsCardsView] Lecture des colonnes visibles échouée:', e);
    }
    return defaultVisible;
  })

  // Ordre des colonnes - utilise l'ordre par défaut si disponible
  const orderedColumnHeaders = useMemo(() => {
    // Créer un ordre basé sur DEFAULT_COLUMN_ORDER avec "Profil" toujours en premier
    const ordered: string[] = ['Profil'];
    const remainingHeaders = new Set(columnHeadersWithProfile);
    remainingHeaders.delete('Profil');

    // Ajouter d'abord les colonnes dans l'ordre par défaut si elles existent
    DEFAULT_COLUMN_ORDER.forEach(header => {
      if (remainingHeaders.has(header)) {
        ordered.push(header);
        remainingHeaders.delete(header);
      }
    });

    // Ajouter les colonnes restantes (comme "#" et les colonnes dynamiques) Ã  la fin
    remainingHeaders.forEach(header => {
      ordered.push(header);
    });

    return ordered;
  }, [columnHeadersWithProfile])

  // Créer les clés de données correspondantes dans le même ordre
  const orderedContactDataKeys = useMemo(() => {
    const keyMap: Record<string, keyof Contact | null> = {
      'Profil': null,
      '#': 'numeroLigne',
      'Sexe': 'sexe',
      'Prénom': 'prenom',
      'Nom': 'nom',
      'Téléphone': 'telephone',
      'Mail': 'email',
      'Statut': 'statut',
      'Commentaire': 'commentaire',
      'Source': 'source',
      'Type': 'type',
      'Qualité': 'qualite',
      'Lien': 'lien',
      'Date Rappel': 'dateRappel',
      'Heure Rappel': 'heureRappel',
      'Date RDV': 'dateRDV',
      'Heure RDV': 'heureRDV',
      'Date Appel': 'dateAppel',
      'Heure Appel': 'heureAppel',
      'Durée Appel': 'dureeAppel',
      'Don': 'don',
      'Date': 'date',
      'UID': 'uid'
    };

    return orderedColumnHeaders.map(header => keyMap[header] || null);
  }, [orderedColumnHeaders])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const [importProgress] = useState<{ percentage: number; message: string } | null>(null)
  const [mappingDialog, setMappingDialog] = useState<{
    open: boolean
    file: File | null
    headers: string[]
    preview: string[][]
  }>({
    open: false,
    file: null,
    headers: [],
    preview: []
  })
  const [isAutocallActive, setIsAutocallActive] = useState(false)
  const [exportOptions, setExportOptions] = useState({
    table: false,
    tableExcel: true,
    contacts: false,
    agenda: false
  })

  // Calcul du nombre de contacts filtrés pour Google Contacts
  const googleContactsCount = useMemo(() => {
    const filteredContacts = contacts.filter(contact =>
      contact.statut === ContactStatus.ARappeler ||
      contact.statut === ContactStatus.D0 ||
      contact.statut === ContactStatus.R0 ||
      contact.statut === ContactStatus.A0
    );
    return filteredContacts.length;
  }, [contacts]);

  // Calcul du nombre de contacts avec rappels pour Google Calendar
  const calendarRemindersCount = useMemo(() => {
    const filteredContacts = contacts.filter(contact =>
      contact.dateRappel && contact.dateRappel.trim() !== ''
    );
    return filteredContacts.length;
  }, [contacts]);

  // Handler unifié pour l'export avec options multiples
  const handleUnifiedExport = async () => {
    if (contacts.length === 0) {
      toast.info('Aucun contact à exporter');
      return;
    }

    const options = Object.entries(exportOptions).filter(([_, enabled]) => enabled);

    if (options.length === 0) {
      toast.info('Veuillez sélectionner au moins une option d\'export');
      return;
    }

    let exportCount = 0;

    // Import statique des fonctions d'export (compatibilité production)

    // Exporter la table CSV si sélectionnée
    if (exportOptions.table) {
      try {
        exportContactsToFile(contacts, 'csv');
        exportCount++;
      } catch (error) {
        console.error('Erreur lors de l\'export CSV:', error);
      }
    }

    // Exporter la table Excel si sélectionnée
    if (exportOptions.tableExcel) {
      try {
        exportContactsToFile(contacts, 'xlsx');
        exportCount++;
      } catch (error) {
        console.error('Erreur lors de l\'export Excel:', error);
      }
    }

    // Exporter vers Google Contacts si sélectionné
    if (exportOptions.contacts) {
      try {
        if (googleContactsCount === 0) {
          toast.info('Aucun contact à exporter vers Google Contacts (statuts: À rappeler, D0, R0, A0)');
        } else {
          exportGoogleContactsCSV(contacts);
          exportCount++;
        }
      } catch (error) {
        console.error('Erreur lors de l\'export Google Contacts:', error);
      }
    }

    // Exporter vers Google Calendar si sélectionné
    if (exportOptions.agenda) {
      try {
        if (calendarRemindersCount === 0) {
          toast.info('Aucun rappel à exporter vers Google Agenda');
        } else {
          exportGoogleCalendarCSV(contacts);
          exportCount++;
        }
      } catch (error) {
        console.error('Erreur lors de l\'export Google Calendar:', error);
      }
    }

    if (exportCount > 0) {
      toast.success(`${exportCount} export(s) effectué(s) avec succès`);
    }
  };

  // Handlers pour le drag & drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Ne déclencher que si on entre dans le conteneur principal
    if (e.currentTarget === e.target) {
      setIsDragOver(true)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Maintenir l'état actif pendant le survol
    if (!isDragOver) {
      setIsDragOver(true)
    }
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Ne déclencher que si on quitte réellement le conteneur principal
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY

    if (
      x <= rect.left ||
      x >= rect.right ||
      y <= rect.top ||
      y >= rect.bottom
    ) {
      setIsDragActive(false)
      setIsDragOver(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      const validExtensions = ['.csv', '.tsv', '.xlsx', '.xls']
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

      if (!validExtensions.includes(extension)) {
        toast.error('Format de fichier non supporté', {
          description: 'Veuillez utiliser un fichier .csv, .tsv, .xlsx ou .xls'
        })
        return
      }

      // Analyser le fichier et ouvrir le dialogue de mapping
      await analyzeAndOpenMappingDialog(file)
    }
  }

  // Callback de confirmation d'import
  const handleImportConfirm = async (mapping: Record<string, string>, options: { phonesToRemove?: string[] }) => {
    try {
      if (!mappingDialog.file) {
        console.log('âŒ [MAPPING] Aucun fichier dans le dialogue')
        return
      }

      console.log('ðŸ”„ [MAPPING] Début de l\'importation avec mapping:', mapping)

      // Import réel des contacts
      // import statique (déplacé en haut) pour compatibilité production
      const imported = await importContactsFromFile(mappingDialog.file, mapping, options)
      console.log(`ðŸ“¥ [MAPPING] ${imported.length} contacts importés (après exclusion éventuelle)`)

      // Déclencher l'événement global pour que App.tsx mette à jour la liste
      try {
        const ext = mappingDialog.file.name.split('.').pop()?.toLowerCase()
        const source = (ext === 'xlsx' || ext === 'xls') ? 'xlsx' : (ext === 'csv' || ext === 'tsv') ? 'csv' : 'csv'
        console.log('ðŸ“¡ [MAPPING] Déclenchement de l\'événement dimicall-imported-contacts')
        window.dispatchEvent(new CustomEvent('dimicall-imported-contacts', {
          detail: {
            contacts: imported,
            fileName: mappingDialog.file.name,
            source
          }
        }))
        console.log('✅ [MAPPING] Événement déclenché avec succès')
      } catch (error) {
        console.error('âŒ [MAPPING] Erreur lors du déclenchement de l\'événement:', error)
      }

      // Fermer le dialogue
      setMappingDialog({ open: false, file: null, headers: [], preview: [] })
      console.log('🔒 [MAPPING] Dialogue fermé')

      toast.success('Import réussi', {
        description: `${imported.length} contacts importés avec succès`
      })

    } catch (error) {
      console.error('âŒ [MAPPING] Erreur lors de l\'import:', error)
      setMappingDialog(prev => ({ ...prev, open: false }))
      toast.error('Erreur d\'import', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue'
      })
    }
  }

  // Fonction pour analyser un fichier et extraire headers/preview
  const analyzeAndOpenMappingDialog = async (file: File) => {
    try {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          if (!data) return

          let headers: string[] = []
          let preview: string[][] = []

          const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

          if (extension === '.csv' || extension === '.tsv') {
            // Parse CSV/TSV avec détection automatique du délimiteur
            const text = data as string
            // Retirer le BOM UTF-8 si présent
            const textNoBom = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text
            const lines = textNoBom.split(/\r?\n/).filter(line => line.trim())

            if (lines.length > 0) {
              // Détection automatique du délimiteur (priorité au point-virgule pour CSV FR)
              const firstLine = lines[0]
              let delimiter = ','
              if (firstLine.includes(';')) {
                delimiter = ';'
              } else if (firstLine.includes('\t')) {
                delimiter = '\t'
              } else if (firstLine.includes(',')) {
                delimiter = ','
              }

              // Split CSV-safe (gère les guillemets)
              function splitCSVLine(line: string, delim: string): string[] {
                const out: string[] = []
                let cur = ''
                let inQuotes = false
                for (let i = 0; i < line.length; i++) {
                  const ch = line[i]
                  if (ch === '"') {
                    if (inQuotes && line[i + 1] === '"') {
                      cur += '"'
                      i++
                    } else {
                      inQuotes = !inQuotes
                    }
                  } else if (ch === delim && !inQuotes) {
                    out.push(cur)
                    cur = ''
                  } else {
                    cur += ch
                  }
                }
                out.push(cur)
                return out
              }

              headers = splitCSVLine(lines[0], delimiter).map(h => h.trim().replace(/^"|"$/g, ''))
              preview = lines.slice(1, 6).map(line =>
                splitCSVLine(line, delimiter).map(cell => cell.trim().replace(/^"|"$/g, ''))
              )

              console.log('🔍 [CSV] Délimiteur détecté:', delimiter === '\t' ? 'TAB' : delimiter, '- Colonnes:', headers.length)
            }
          } else {
            // Parse Excel
            const workbook = XLSX.read(data, { type: 'binary' })
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][]

            if (jsonData.length > 0) {
              headers = jsonData[0].map(h => String(h || '').trim())
              preview = jsonData.slice(1, 6)
            }
          }

          setMappingDialog({
            open: true,
            file,
            headers,
            preview
          })
        } catch (error) {
          console.error('Erreur lors de l\'analyse du fichier:', error)
          toast.error('Erreur d\'analyse', {
            description: 'Impossible de lire le fichier'
          })
        }
      }

      if (file.name.endsWith('.csv') || file.name.endsWith('.tsv')) {
        reader.readAsText(file, 'UTF-8') // Encodage explicite pour Electron
      } else {
        reader.readAsBinaryString(file)
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du fichier:', error)
      toast.error('Erreur', {
        description: 'Impossible d\'ouvrir le fichier'
      })
    }
  }

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) ?? null,
    [contacts, selectedContactId],
  )
  const [formState, setFormState] = useState<FormState>(getInitialFormState(selectedContact))
  const [selectedStatus, setSelectedStatus] = useState<string>(
    selectedContact?.statut ?? ContactStatus.NonDefini,
  )
  const [noteDraft, setNoteDraft] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const contactTableRef = useRef<ContactTableRef>(null)

  useEffect(() => {
    setFormState(getInitialFormState(selectedContact))
    setSelectedStatus(selectedContact?.statut ?? ContactStatus.NonDefini)
    setNoteDraft(selectedContact?.commentaire ?? "")
  }, [selectedContact])
  const selectedStatusBadge = useMemo(() => {
    const currentStatus = selectedStatus || ContactStatus.NonDefini
    const { color, dot } = StatusConfigService.getColor(currentStatus, mode)
    const label = StatusConfigService.getLabel(currentStatus, mode)
    return { color, dot, label }
  }, [mode, selectedStatus])

  // Persistance de la préférence de vue
  useEffect(() => {
    try {
      localStorage.setItem('appels-2-view-mode', viewMode);
    } catch (error) {
      console.warn('[Appels 2] Impossible de sauvegarder la préférence de vue', error);
    }
  }, [viewMode]);

  const callHistory = useMemo(() => {
    if (!selectedContact) return [] as Array<{ numero: number; date?: string; statut?: string; commentaire?: string }>
    const history: Array<{ numero: number; date?: string; statut?: string; commentaire?: string }> = []
    for (let index = 1; index <= 4; index++) {
      const date = (selectedContact as any)[`date_appel_${index}`]
      const statut = (selectedContact as any)[`statut_appel_${index}`]
      const commentaire = (selectedContact as any)[`commentaires_appel_${index}`]
      if (date || statut || commentaire) {
        history.push({ numero: index, date, statut, commentaire })
      }
    }
    return history
  }, [selectedContact])

  // Filtrer les contacts selon le filtre actif
  const filteredContacts = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd')

    switch (activeFilter) {
      case 'rappel':
        return contacts.filter(c => c.dateRappel === today)
      case 'rdv':
        return contacts.filter(c => !!c.dateRDV)
      case 'status':
        return contacts.filter(c => !c.statut || c.statut === ContactStatus.NonDefini)
      default:
        return contacts
    }
  }, [contacts, activeFilter])

  const displayedContacts = useMemo(
    () => filteredContacts.slice(0, Math.min(visibleCount, filteredContacts.length)),
    [filteredContacts, visibleCount],
  )

  // Scroll automatique uniquement lors d'un clic sur une card
  useEffect(() => {
    if (!selectedContactId || !shouldAutoScrollRef.current) return

    // Petit délai pour laisser le DOM se mettre Ã  jour
    const timeoutId = setTimeout(() => {
      const node = scrollRef.current?.querySelector<HTMLDivElement>(`[data-contact-card="${selectedContactId}"]`)

      // Si le contact n'est pas dans le DOM, il faut charger plus de contacts
      if (!node) {
        const contactIndex = filteredContacts.findIndex(c => c.id === selectedContactId)
        if (contactIndex !== -1 && contactIndex >= visibleCount) {
          // Charger jusqu'Ã  ce contact + quelques autres
          setVisibleCount(contactIndex + 20)
          // Réessayer après le render
          setTimeout(() => {
            const retryNode = scrollRef.current?.querySelector<HTMLDivElement>(`[data-contact-card="${selectedContactId}"]`)
            if (retryNode) {
              retryNode.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }, 200)
        }
        // Réinitialiser le flag
        shouldAutoScrollRef.current = false;
        return
      }

      // Vérifier si le contact est déjÃ  visible
      const container = scrollRef.current
      if (!container) {
        shouldAutoScrollRef.current = false;
        return
      }

      const containerRect = container.getBoundingClientRect()
      const nodeRect = node.getBoundingClientRect()

      const isVisible =
        nodeRect.top >= containerRect.top &&
        nodeRect.bottom <= containerRect.bottom

      // Scroller uniquement si pas visible
      if (!isVisible) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      // Réinitialiser le flag après le scroll
      shouldAutoScrollRef.current = false;
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [selectedContactId, visibleCount, filteredContacts])

  const handleFormChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!selectedContact) return
    try {
      onUpdateContact({
        id: selectedContact.id,
        ...formState,
        statut: selectedStatus as ContactStatus | string,
        commentaire: noteDraft,
      })
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast.error('Erreur de sauvegarde', {
        description: 'Impossible de sauvegarder les modifications'
      })
    }
  }

  // Sauvegarde automatique avec debounce
  useEffect(() => {
    if (!selectedContact) return

    const timeoutId = setTimeout(() => {
      handleSave()
    }, 1000) // Sauvegarde après 1 seconde d'inactivité

    return () => clearTimeout(timeoutId)
  }, [formState, selectedStatus, noteDraft])

  // Gestion des raccourcis clavier (F1-F10)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si on est dans un champ de saisie
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      const key = e.key

      // Navigation: flèches Haut/Bas pour parcourir la liste
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        e.preventDefault()
        if (filteredContacts.length === 0) return
        const currentIdx = selectedContact
          ? filteredContacts.findIndex(c => c.id === selectedContact.id)
          : -1
        let nextIdx = currentIdx
        if (key === 'ArrowDown') nextIdx = Math.min(currentIdx + 1, filteredContacts.length - 1)
        if (key === 'ArrowUp') nextIdx = Math.max(currentIdx - 1, 0)
        if (nextIdx !== currentIdx && nextIdx >= 0) {
          shouldAutoScrollRef.current = true
          onSelectContact(filteredContacts[nextIdx])
        } else if (currentIdx === -1) {
          shouldAutoScrollRef.current = true
          onSelectContact(filteredContacts[0])
        }
        return
      }

      // F1 : Appeler le contact sélectionné
      if (key === 'F1') {
        e.preventDefault()
        if (selectedContact) {
          onCall()
          toast.info('F1: Appel en cours...')
        } else {
          toast.warning('Veuillez sélectionner un contact')
        }
        return
      }

      // F2-F10 : Appliquer un statut
      const newStatus = shortcutService.getStatusForKey(key)
      if (newStatus && selectedContact) {
        e.preventDefault()
        setSelectedStatus(newStatus as ContactStatus)
        onUpdateContact({
          id: selectedContact.id,
          statut: newStatus as ContactStatus
        })
        toast.success(`${key}: Statut "${newStatus}" appliqué`)

        // Si autocall est actif, passer au contact suivant et appeler
        if (isAutocallActive) {
          setTimeout(() => {
            const currentIndex = filteredContacts.findIndex(c => c.id === selectedContact.id)
            if (currentIndex < filteredContacts.length - 1) {
              const nextContact = filteredContacts[currentIndex + 1]
              onSelectContact(nextContact)
              setTimeout(() => {
                onCall()
              }, 300)
            } else {
              toast.info('Fin de la liste atteinte')
              setIsAutocallActive(false)
            }
          }, 500)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedContact, isAutocallActive, filteredContacts, onCall, onUpdateContact, onSelectContact])

  const toggleColumnVisibility = (header: string) => {
    if (header === 'Profil') {
      return;
    }
    setVisibleColumns(prev => {
      const next = { ...prev, [header]: !prev[header] };
      try {
        localStorage.setItem('appels2-visible-columns', JSON.stringify(next));
      } catch { }
      return next;
    });
  };

  // Persister toute modification de visibilité (y compris changements en masse)
  useEffect(() => {
    try {
      localStorage.setItem('appels2-visible-columns', JSON.stringify(visibleColumns));
    } catch { }
  }, [visibleColumns]);

  const handleDeleteContact = (contactId: string) => {
    // Implement delete logic if needed
    console.log('Delete contact:', contactId);
  };

  // Progression: contacts avec statut défini
  const completionPercent = useMemo(() => {
    if (!contacts?.length) return 0
    const defined = contacts.filter(c => c.statut && c.statut !== ContactStatus.NonDefini).length
    return Math.round((defined / contacts.length) * 100)
  }, [contacts])

  return (
    <div
      className="flex h-full w-full flex-col gap-4 overflow-hidden min-h-0"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <DropZoneOverlay isVisible={isDragOver} isDragActive={isDragActive} />
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-2 sm:px-4 md:px-6 pt-2 pb-2 min-w-0 bg-white dark:bg-background rounded-md transition-colors" role="toolbar" aria-label="Barre d'outils Appels">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-shrink-0">
          <div className="flex flex-col gap-0.5 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">Appels</h1>
          </div>
          <ViewSwitcher
            currentView={viewMode}
            onViewChange={setViewMode}
          />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 w-full md:w-auto order-3 md:order-none justify-end flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 sm:px-3 shrink-0 text-xs sm:text-sm gap-2 shadow-none bg-white dark:bg-card"
                title="Réglages"
              >
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">Réglages</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="bottom" sideOffset={6} className="w-72 shadow-none">
              <DropdownMenuLabel>Réglages rapides</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setIsAutocallActive(!isAutocallActive)
                  toast.info(isAutocallActive ? 'Autocall désactivé' : 'Autocall activé')
                }}
                className="cursor-pointer"
              >
                <PhoneCall className="mr-2 h-4 w-4" />
                <div className="flex flex-col gap-0.5">
                  <span>Autocall</span>
                  <span className="text-xs text-muted-foreground">Appel auto après statut</span>
                </div>
                {isAutocallActive && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  {autoSearchMode === 'linkedin' && <Linkedin className="mr-2 h-4 w-4 text-blue-600" />}
                  {autoSearchMode === 'linkedin-name' && <Linkedin className="mr-2 h-4 w-4 text-blue-600" />}
                  {autoSearchMode === 'linkedin-name-type' && <Linkedin className="mr-2 h-4 w-4 text-blue-600" />}
                  {autoSearchMode === 'google' && <Globe className="mr-2 h-4 w-4 text-green-600" />}
                  {autoSearchMode === 'link' && <Eye className="mr-2 h-4 w-4 text-purple-600" />}
                  {autoSearchMode === 'disabled' && <X className="mr-2 h-4 w-4" />}
                  <div className="flex flex-col gap-0.5">
                    <span>Recherche automatique</span>
                    <span className="text-xs text-muted-foreground">
                      {autoSearchMode === 'disabled' && 'Désactivé'}
                      {autoSearchMode === 'linkedin-name' && 'LinkedIn (Prénom + Nom)'}
                      {autoSearchMode === 'linkedin-name-type' && 'LinkedIn (Prénom + Nom + Type)'}
                      {autoSearchMode === 'google' && 'Google'}
                      {autoSearchMode === 'link' && 'Lien direct'}
                      {autoSearchMode === 'linkedin' && 'LinkedIn'}
                    </span>
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={autoSearchMode} onValueChange={(value) => onAutoSearchModeChange(value as any)}>
                      <DropdownMenuRadioItem value="disabled" className="cursor-pointer">
                        <X className="mr-2 h-4 w-4" />
                        <span>Désactivé</span>
                      </DropdownMenuRadioItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuRadioItem value="linkedin-name" className="cursor-pointer">
                        <Linkedin className="mr-2 h-4 w-4 text-blue-600" />
                        <span>LinkedIn (Prénom + Nom)</span>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="linkedin-name-type" className="cursor-pointer">
                        <Linkedin className="mr-2 h-4 w-4 text-blue-600" />
                        <span>LinkedIn (Prénom + Nom + Type)</span>
                      </DropdownMenuRadioItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuRadioItem value="google" className="cursor-pointer">
                        <Globe className="mr-2 h-4 w-4 text-green-600" />
                        <span>Google</span>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="link" className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4 text-purple-600" />
                        <span>Lien</span>
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Boutons principaux toujours visibles - Importer, Exporter, Supprimer */}
          <ButtonGroup className="shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 shrink-0 shadow-none bg-white dark:bg-card"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.csv,.tsv,.xlsx,.xls'
                input.onchange = async (e) => {
                  const files = (e.target as HTMLInputElement).files
                  if (files && files.length > 0) {
                    await analyzeAndOpenMappingDialog(files[0])
                  }
                }
                input.click()
              }}
              title="Importer un fichier CSV/Excel"
            >
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Importer</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  disabled={contacts.length === 0}
                  variant="outline"
                  className="h-8 px-2 shrink-0 shadow-none bg-white dark:bg-card"
                  title="Exporter les données"
                >
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Exporter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 border shadow-none bg-popover text-popover-foreground z-50">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Options d'export
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuCheckboxItem
                  checked={exportOptions.table}
                  onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, table: checked }))}
                  onSelect={(e) => e.preventDefault()}
                  disabled={contacts.length === 0}
                  className="cursor-pointer"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>Table (CSV)</span>
                  {contacts.length > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">({contacts.length})</span>
                  )}
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={exportOptions.tableExcel}
                  onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, tableExcel: checked }))}
                  onSelect={(e) => e.preventDefault()}
                  disabled={contacts.length === 0}
                  className="cursor-pointer"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  <span>Table (Excel)</span>
                  {contacts.length > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">({contacts.length})</span>
                  )}
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={exportOptions.contacts}
                  onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, contacts: checked }))}
                  onSelect={(e) => e.preventDefault()}
                  disabled={googleContactsCount === 0}
                  className="cursor-pointer"
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>Contacts Google</span>
                  {googleContactsCount > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">({googleContactsCount})</span>
                  )}
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={exportOptions.agenda}
                  onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, agenda: checked }))}
                  onSelect={(e) => e.preventDefault()}
                  disabled={calendarRemindersCount === 0}
                  className="cursor-pointer"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Agenda Google</span>
                  {calendarRemindersCount > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">({calendarRemindersCount})</span>
                  )}
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleUnifiedExport}
                  className="cursor-pointer"
                  disabled={Object.values(exportOptions).every(option => !option)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  <span className="font-medium">Exporter la sélection</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                className="h-8 px-2 shrink-0"
                title="Supprimer les contacts de l'onglet actif"
              >
                <Trash2 className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Supprimer</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer tous les contacts de la liste actuelle ?
                  Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onClearActiveTab}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {/* Progression globale déplacée dans l'en-tête du rail gauche */}
          {viewMode === 'cards' && null}
        </div>
      </div>
      {/* Contact Action Bar - Table View - Centered Below Title */}
      {viewMode === 'table' && (
        <div className="flex justify-center px-2 sm:px-4 md:px-6 py-2 min-w-0 w-full">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-lg border bg-card p-2 sm:p-3 shadow-none min-w-0 w-full md:w-auto max-w-full">
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
              <span data-slot="avatar" className="relative flex size-8 shrink-0 overflow-hidden rounded-full h-8 w-8 flex-shrink-0">
                <span data-slot="avatar-fallback" className="bg-muted flex size-full items-center justify-center rounded-full">
                  {selectedContact ? (selectedContact.prenom?.[0] || selectedContact.nom?.[0] || '?') : '?'}
                </span>
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-none" title={selectedContact ? `${selectedContact.prenom || ''} ${selectedContact.nom || ''}`.trim() : 'Aucun contact sélectionné'}>
                  {selectedContact ? (`${selectedContact.prenom || ''} ${selectedContact.nom || ''}`.trim() || 'Sans nom') : 'Aucun contact sélectionné'}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-none" title={selectedContact?.telephone || '-'}>
                  {selectedContact?.telephone || '-'}
                </span>
              </div>
            </div>
            <div className="flex items-center flex-1 md:flex-initial justify-start md:justify-end">
              <CallControl
                contact={selectedContact}
                isCalling={Boolean(activeCallContactId && selectedContact && activeCallContactId === selectedContact.id)}
                callStartTime={callStartTime}
                onCall={onCall}
                onHangUp={onHangUp}
                onEmail={onEmail}
                onSms={onSms}
                onRappel={onRappel}
                onRendezVous={onRendezVous}
                onCalCom={onCalCom}
                onQualification={onQualification}
                adbConnected={adbConnected}
                displayMode="actions-only"
                className="gap-2 flex-nowrap"
              />
            </div>
          </div>
        </div>
      )}
      {viewMode === 'cards' ? (
        <ResizablePanelGroup direction="horizontal" className="h-full min-h-0 @container">
          <ResizablePanel defaultSize={32} minSize={20} maxSize={50} className="relative z-10 min-h-0 flex flex-col overflow-hidden">
            <div className="m-1 sm:m-2 flex h-full flex-col rounded-lg border bg-card/40 overflow-hidden min-w-0">
              <div className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 space-y-2 border-b">
                <div className="flex items-center justify-between gap-2 flex-nowrap min-w-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 md:px-3 py-1.5 h-7 sm:h-8 text-xs sm:text-sm shrink-0 min-w-0 shadow-none bg-white dark:bg-card border-border/70"
                      >
                        <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0" style={{ backgroundColor: tableTabs.find(t => t.id === activeTableTabId)?.color || 'var(--primary)' }}></span>
                        <span className="truncate max-w-[60px] xs:max-w-[80px] sm:max-w-[120px] md:max-w-[200px]">
                          {tableTabs.find(t => t.id === activeTableTabId)?.name || 'Onglets'}
                        </span>
                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64 shadow-none">
                      <DropdownMenuLabel className="flex items-center gap-2">
                        Onglets
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      {/* Liste des onglets existants */}
                      {tableTabs.map(tab => (
                        <DropdownMenuItem
                          key={tab.id}
                          onClick={() => onSetActiveTableTabId?.(tab.id)}
                          className={cn(
                            "flex items-center gap-2 cursor-pointer",
                            activeTableTabId === tab.id && "bg-accent"
                          )}
                        >
                          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: tab.color || 'var(--primary)' }}></span>
                          <span className="flex-1 truncate">{tab.name}</span>

                          {/* Boutons d'action pour l'onglet */}
                          <div className="flex items-center gap-1">
                            {/* Bouton de renommage */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0 hover:bg-accent-foreground/10"
                              onClick={(e) => {
                                e.stopPropagation()
                                onEditTab?.(tab)
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>

                            {/* Bouton de suppression */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteTab?.(tab.id)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </DropdownMenuItem>
                      ))}

                      {/* Bouton d'ajout d'onglet */}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onAddTab?.()}
                        disabled={tableTabs.length >= 5}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Ajouter un onglet
                      </DropdownMenuItem>

                      {/* Bouton de suppression complète */}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive hover:text-destructive" onClick={onClearActiveTab}>
                        <Trash2 className="h-4 w-4" />
                        Supprimer toutes les données
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <p className="text-[10px] xs:text-xs text-muted-foreground/70 whitespace-nowrap">
                      {contacts.length} prospect{contacts.length > 1 ? "s" : ""}
                    </p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 px-2 sm:px-3 shrink-0"
                            aria-label="Premier sans statut"
                            onClick={() => {
                              const firstWithoutStatus = filteredContacts.find(c => !c.statut || c.statut === ContactStatus.NonDefini)
                              if (firstWithoutStatus) {
                                shouldAutoScrollRef.current = true
                                onSelectContact(firstWithoutStatus)
                                toast.info('Premier contact sans statut sélectionné')
                              } else {
                                toast.info('Aucun contact sans statut trouvé')
                              }
                            }}
                            disabled={!filteredContacts.some(c => !c.statut || c.statut === ContactStatus.NonDefini)}
                          >
                            <ChevronUp className="h-4 w-4" />
                            <span className="sr-only">Premier sans statut</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Revenir au premier contact sans statut</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                {/* Search moved below inside Command with list */}
              </div>
              <div className="flex-1 min-h-0 h-0 flex flex-col px-0 pt-0 pb-1.5 sm:pb-2">
                <Command className="h-full flex flex-col bg-transparent rounded-none border-0 shadow-none">
                  <CommandInput
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onValueChange={onSearch}
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  />
                  <ScrollArea className="h-[calc(100%-40px)]" viewportRef={scrollRef}>
                    <CommandList className="max-h-none">
                      <CommandEmpty>Aucun contact trouvé.</CommandEmpty>
                      <CommandGroup heading="Contacts">
                        {displayedContacts.map((contact) => {
                          const isSelected = contact.id === selectedContactId
                          const statusColor = StatusConfigService.getColor(contact.statut ?? ContactStatus.NonDefini, mode)
                          const statusLabel = StatusConfigService.getLabel(contact.statut ?? ContactStatus.NonDefini, mode)
                          const isCalling = !!callStates[contact.id]?.isCalling
                          return (
                            <CommandItem
                              key={contact.id}
                              data-contact-card={contact.id}
                              value={`${contact.prenom} ${contact.nom} ${contact.telephone} ${contact.email}`}
                              className={cn(
                                "px-2 sm:px-3 py-2 sm:py-3 cursor-pointer hover:bg-muted/50 data-[selected=true]:bg-transparent data-[selected=true]:text-foreground",
                                isSelected && "bg-accent",
                              )}
                              aria-selected={isSelected}
                              onSelect={() => {
                                shouldAutoScrollRef.current = true;
                                onSelectContact(contact);
                              }}
                            >
                              <>
                                <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
                                  <Avatar className="h-7 w-7 sm:h-9 sm:w-9 border shrink-0">
                                    <AvatarFallback className="text-[10px] sm:text-xs">
                                      {(contact.prenom?.[0] ?? "").toUpperCase()
                                        .concat(contact.nom?.[0] ?? "")
                                        .slice(0, 2) || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex min-w-0 flex-1 flex-col min-w-0">
                                    <div className="truncate text-xs sm:text-sm font-semibold text-foreground leading-tight">
                                      {[contact.prenom, contact.nom].filter(Boolean).join(" ") || "Sans nom"}
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-muted-foreground">
                                      <span className="flex items-center gap-0.5 truncate min-w-0">
                                        <Phone className="h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0" />
                                        <span className="truncate">{contact.telephone || "-"}</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2 flex-nowrap shrink-0">
                                  <TooltipProvider delayDuration={120}>
                                    <div className="flex items-center gap-1 sm:gap-1.5">
                                      {contact.dateRappel && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Badge
                                              variant="secondary"
                                              className={cn(
                                                iconBadgeClass,
                                                "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
                                                "[&>svg]:!h-[9px] [&>svg]:!w-[9px] sm:[&>svg]:!h-[10px] sm:[&>svg]:!w-[10px]"
                                              )}
                                              aria-label={`Rappel ${formatDisplayDateTime(contact.dateRappel, contact.heureRappel)}`}
                                            >
                                              <Bell className="h-[9px] w-[9px] sm:h-[10px] sm:w-[10px]" />
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent
                                            side="top"
                                            className="bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-[--radix-tooltip-content-transform-origin] rounded-md px-3 py-1.5 text-xs text-balance shadow-md"
                                          >
                                            {formatDisplayDate(contact.dateRappel)}
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                      {contact.dateRDV && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Badge
                                              variant="secondary"
                                              className={cn(
                                                iconBadgeClass,
                                                "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
                                                "[&>svg]:!h-[9px] [&>svg]:!w-[9px] sm:[&>svg]:!h-[10px] sm:[&>svg]:!w-[10px]"
                                              )}
                                              aria-label={`RDV ${formatDisplayDateTime(contact.dateRDV, contact.heureRDV)}`}
                                            >
                                              <Calendar className="h-[9px] w-[9px] sm:h-[10px] sm:w-[10px]" />
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent
                                            side="top"
                                            className="bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-[--radix-tooltip-content-transform-origin] rounded-md px-3 py-1.5 text-xs text-balance shadow-md"
                                          >
                                            {formatDisplayDate(contact.dateRDV)}
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </TooltipProvider>
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      contactBadgeClass,
                                      "capitalize",
                                      statusColor.color,
                                    )}
                                  >
                                    {statusLabel}
                                  </Badge>
                                  {isCalling && (
                                    <div className="hidden sm:flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] text-primary shrink-0">
                                      <PhoneCall className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                      <span className="whitespace-nowrap">Appel en cours…</span>
                                    </div>
                                  )}
                                </div>
                              </>
                            </CommandItem>
                          )
                        })}
                        {contacts.length > visibleCount && (
                          <div className="p-1">
                            <Button
                              variant="ghost"
                              className="w-full text-xs"
                              onClick={() => setVisibleCount((prev) => prev + 40)}
                            >
                              Afficher plus de contacts
                            </Button>
                          </div>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </ScrollArea>
                  {/* Section Statut des appels en bas */}
                  <div className="border-t p-2 sm:p-3 space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">Statut des appels</span>
                      <span className="text-xs sm:text-sm font-medium text-foreground">{Math.max(0, Math.min(100, Math.round(completionPercent)))}%</span>
                    </div>
                    <Progress
                      value={Math.max(0, Math.min(100, Math.round(completionPercent)))}
                      className="h-1"
                    />
                  </div>
                </Command>
              </div>
            </div>
          </ResizablePanel>

          <ResizablePanel defaultSize={68} minSize={50} maxSize={80} className="relative z-10 min-h-0 flex flex-col overflow-hidden">
            <div className="m-1 sm:m-2 flex h-full flex-col rounded-lg border bg-card overflow-hidden min-w-0">
              {selectedContact ? (
                <div className="flex h-full flex-col">
                  <div
                    className="relative w-full bg-card rounded-t-lg"
                    role="region"
                    aria-label="En-tête du contact sélectionné"
                  >
                    <Separator className="absolute inset-x-0 bottom-0" />
                    <div className="px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border">
                          <AvatarFallback>
                            {(selectedContact.prenom?.[0] ?? "").toUpperCase()
                              .concat(selectedContact.nom?.[0] ?? "")
                              .slice(0, 2) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-semibold leading-tight text-foreground">
                              {[selectedContact.prenom, selectedContact.nom].filter(Boolean).join(" ") || "Sans nom"}
                            </h2>
                            <div
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                                selectedStatusBadge.color,
                              )}
                            >
                              <div className={cn("w-1.5 h-1.5 rounded-full", selectedStatusBadge.dot)} />
                              {selectedStatusBadge.label}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            {selectedContact.email && <span>{selectedContact.email}</span>}
                            {selectedContact.email && selectedContact.telephone && <span className="text-muted-foreground/50">•</span>}
                            {selectedContact.telephone && <span>{selectedContact.telephone}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-3">
                        <CallControl
                          contact={selectedContact}
                          isCalling={Boolean(activeCallContactId && selectedContact && activeCallContactId === selectedContact.id)}
                          callStartTime={callStartTime}
                          onCall={onCall}
                          onHangUp={onHangUp}
                          onEmail={onEmail}
                          onSms={onSms}
                          onRappel={onRappel}
                          onRendezVous={onRendezVous}
                          onCalCom={onCalCom}
                          onQualification={onQualification}
                          adbConnected={adbConnected}
                          onStatusChange={(status) => setSelectedStatus(status)}
                          displayMode="actions-only"
                          className="gap-2"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="relative bg-card/60" role="toolbar" aria-label="Actions de recherche">
                    <Separator className="absolute inset-x-0 bottom-0" />
                    <div className="px-6 py-2.5 flex items-center gap-2 flex-nowrap">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 sm:px-3 shrink-0" onClick={() => onLinkedInSearch('name')} aria-label="LinkedIn">
                              <Linkedin className="h-4 w-4 text-blue-600" />
                              <span className="hidden sm:inline">LinkedIn</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>LinkedIn</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 sm:px-3 shrink-0" onClick={() => onLinkedInSearch('name-type')} aria-label="LinkedIn+">
                              <Linkedin className="h-4 w-4 text-[#D4AF37]" />
                              <span className="hidden sm:inline">LinkedIn+</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>LinkedIn+</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 sm:px-3 shrink-0" onClick={onGoogleSearch} aria-label="Google">
                              <Globe className="h-4 w-4 text-green-600" />
                              <span className="hidden sm:inline">Google</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Google</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 sm:px-3 shrink-0" onClick={onDirectLink} disabled={!selectedContact.lien} aria-label="Lien direct">
                              <Eye className="h-4 w-4" />
                              <span className="hidden sm:inline">Lien direct</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Lien direct</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 min-h-0 h-0">
                    <div className="px-6 py-6">
                      <Tabs defaultValue="informations" className="w-full">
                        <TabsList className="w-full justify-start">
                          <TabsTrigger value="informations">Informations principales</TabsTrigger>
                          <TabsTrigger value="historique">Historique</TabsTrigger>
                        </TabsList>
                        <TabsContent value="informations" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
                          <div className="section-card p-3 sm:p-4 space-y-3 sm:space-y-4">
                            <div className="grid gap-4 sm:gap-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div className="space-y-2">
                                  <Label htmlFor="contact-firstname">Prénom</Label>
                                  <Input
                                    id="contact-firstname"
                                    value={formState.prenom}
                                    onChange={(event) => handleFormChange("prenom", event.target.value)}
                                    className="text-sm"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="contact-lastname">Nom</Label>
                                  <Input
                                    id="contact-lastname"
                                    value={formState.nom}
                                    onChange={(event) => handleFormChange("nom", event.target.value)}
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div className="space-y-2">
                                  <Label htmlFor="contact-phone">Téléphone</Label>
                                  <Input
                                    id="contact-phone"
                                    value={formState.telephone}
                                    onChange={(event) => handleFormChange("telephone", event.target.value)}
                                    className="text-sm"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="contact-email">Email</Label>
                                  <Input
                                    id="contact-email"
                                    value={formState.email}
                                    onChange={(event) => handleFormChange("email", event.target.value)}
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div className="space-y-2">
                                  <Label htmlFor="contact-source">Source</Label>
                                  <Input
                                    id="contact-source"
                                    value={formState.source}
                                    onChange={(event) => handleFormChange("source", event.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Statut</Label>
                                  <Select
                                    value={selectedStatus}
                                    onValueChange={(value: string) => setSelectedStatus(value)}
                                  >
                                    <SelectTrigger className="justify-between">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {statusOptions
                                        .filter((status) => !(status === ContactStatus.A0 && mode !== CallMode.Apporteur))
                                        .map((status) => (
                                          <SelectItem key={status} value={status}>
                                            {StatusConfigService.getLabel(status, mode)}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="contact-comment">Notes</Label>
                                <ZapWidget
                                  value={noteDraft}
                                  onChange={setNoteDraft}
                                  quickComments={QUICK_COMMENTS}
                                  rows={4}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="section-card p-4 space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground">Rappels & Rendez-vous</h3>
                            <Separator className="my-2 opacity-30" />
                            <Tabs defaultValue="rappel" className="w-full">
                              <TabsList className="w-full justify-start">
                                <TabsTrigger value="rappel">Rappel</TabsTrigger>
                                <TabsTrigger value="rdv">RDV</TabsTrigger>
                                <TabsTrigger value="appel">Appel</TabsTrigger>
                              </TabsList>
                              <div className="mt-4 space-y-4">
                                <TabsContent value="rappel">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <DatePickerWithClear
                                      label="Date de rappel"
                                      value={formState.dateRappel}
                                      onChange={(value) => handleFormChange("dateRappel", value)}
                                      onClear={() => handleFormChange("dateRappel", "")}
                                    />
                                    <TimePickerWithClear
                                      label="Heure de rappel"
                                      value={formState.heureRappel}
                                      onChange={(value) => handleFormChange("heureRappel", value)}
                                      onClear={() => handleFormChange("heureRappel", "")}
                                    />
                                  </div>
                                </TabsContent>
                                <TabsContent value="rdv">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <DatePickerWithClear
                                      label="Date de RDV"
                                      value={formState.dateRDV}
                                      onChange={(value) => handleFormChange("dateRDV", value)}
                                      onClear={() => handleFormChange("dateRDV", "")}
                                    />
                                    <TimePickerWithClear
                                      label="Heure de RDV"
                                      value={formState.heureRDV}
                                      onChange={(value) => handleFormChange("heureRDV", value)}
                                      onClear={() => handleFormChange("heureRDV", "")}
                                    />
                                  </div>
                                </TabsContent>
                                <TabsContent value="appel">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <DatePickerWithClear
                                      label="Date d'appel"
                                      value={formState.dateAppel}
                                      onChange={(value) => handleFormChange("dateAppel", value)}
                                      onClear={() => handleFormChange("dateAppel", "")}
                                    />
                                    <TimePickerWithClear
                                      label="Heure d'appel"
                                      value={formState.heureAppel}
                                      onChange={(value) => handleFormChange("heureAppel", value)}
                                      onClear={() => handleFormChange("heureAppel", "")}
                                    />
                                  </div>
                                  <div className="mt-4 space-y-2">
                                    <Label htmlFor="call-duration">Durée d'appel</Label>
                                    <Input
                                      id="call-duration"
                                      value={formState.dureeAppel}
                                      placeholder="mm:ss"
                                      onChange={(event) => handleFormChange("dureeAppel", event.target.value)}
                                    />
                                  </div>
                                </TabsContent>
                              </div>
                            </Tabs>
                          </div>
                        </TabsContent>
                        <TabsContent value="historique" className="mt-6">
                          <div className="section-card p-4 space-y-4">
                            {callHistory.length > 0 ? (
                              <div className="space-y-3">
                                {callHistory.map((call) => (
                                  <div
                                    key={call.numero}
                                    className="rounded-lg border bg-muted/40 p-3 text-xs"
                                  >
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-2 font-medium text-foreground">
                                        <History className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>Appel {call.numero}</span>
                                      </div>
                                      {call.statut && (
                                        <Badge variant="outline" className="text-[10px]">
                                          {call.statut}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                                      {call.date && (
                                        <span>{call.date}</span>
                                      )}
                                    </div>
                                    {call.commentaire && (
                                      <p className="mt-2 text-muted-foreground/80">
                                        {call.commentaire}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center justify-start rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                                <span>Aucun historique enregistré.</span>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </ScrollArea>

                </div>
              ) : (
                <div
                  className="flex h-full flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/15 text-muted-foreground"
                  style={{ pointerEvents: 'none' }}
                >
                  <div className="rounded-full border bg-background p-3 shadow-none">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-medium">Sélectionnez un prospect dans la colonne de gauche</div>
                  <p className="text-xs text-muted-foreground/80">Les informations détaillées s’afficheront ici.</p>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="flex-1 flex flex-col p-1 md:p-1 space-y-0.5 md:space-y-1 overflow-hidden w-full min-h-0">
          {/* Table Container */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0">
              <div className="flex-1 bg-transparent rounded-none border-0 shadow-none overflow-hidden">
                <div dir="ltr" data-orientation="horizontal" data-slot="tabs" className="gap-2 flex h-full flex-col">
                  {/* Table Controls Bar - Fully Responsive */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 py-1.5 bg-card w-full max-w-[95%] mx-auto px-1.5">
                    {/* Groupe gauche : colonnes, recherche manuelle & champ de recherche */}
                    <div className="flex flex-1 flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-1.5 sm:px-2 shrink-0 shadow-none bg-background text-foreground hover:bg-accent border border-border"
                              title="Gestion des colonnes"
                            >
                              <Settings2 className="h-4 w-4" />
                              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs hidden sm:inline-flex">
                                {Object.values(visibleColumns).filter(Boolean).length}
                              </Badge>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" side="bottom" sideOffset={5} className="w-64">
                            <DropdownMenuLabel className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Gestion des colonnes
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {orderedColumnHeaders.map((header) => (
                              <DropdownMenuCheckboxItem
                                key={header}
                                disabled={header === 'Profil'}
                                checked={header === 'Profil' ? true : visibleColumns[header]}
                                onCheckedChange={() => header !== 'Profil' && toggleColumnVisibility(header)}
                                onSelect={(e) => e.preventDefault()}
                                className="flex items-center gap-2"
                              >
                                {header}
                              </DropdownMenuCheckboxItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                              checked={Object.values(visibleColumns).every(Boolean)}
                              onCheckedChange={() => {
                                const newVisibility: Record<string, boolean> = {}
                                orderedColumnHeaders.forEach(header => {
                                  newVisibility[header] = true
                                })
                                setVisibleColumns(newVisibility)
                                localStorage.setItem('appels2-visible-columns', JSON.stringify(newVisibility))
                              }}
                              onSelect={(e) => e.preventDefault()}
                              className="flex items-center gap-2 text-primary"
                            >
                              <Eye className="h-4 w-4" />
                              Afficher toutes les colonnes disponibles
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={(() => {
                                const essentialCols = getEssentialColumns();
                                return orderedColumnHeaders.every(header =>
                                  essentialCols.includes(header) ? visibleColumns[header] : !visibleColumns[header]
                                );
                              })()}
                              onCheckedChange={() => {
                                const essentialCols = getEssentialColumns();
                                const newVisibility: Record<string, boolean> = {}
                                orderedColumnHeaders.forEach(header => {
                                  newVisibility[header] = essentialCols.includes(header);
                                })
                                newVisibility['Profil'] = true
                                setVisibleColumns(newVisibility)
                                localStorage.setItem('appels2-visible-columns', JSON.stringify(newVisibility))
                              }}
                              onSelect={(e) => e.preventDefault()}
                              className="flex items-center gap-2 text-orange-600 dark:text-orange-400"
                            >
                              <EyeOff className="h-4 w-4" />
                              Masquer les colonnes optionnelles
                            </DropdownMenuCheckboxItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Tabs value={autoSearchMode} onValueChange={(value) => onAutoSearchModeChange(value as any)} className="w-auto">
                          <TabsList className="h-9 hidden">
                            <TabsTrigger
                              value="disabled"
                              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-primary/90 dark:data-[state=active]:text-primary-foreground"
                            >
                              Désactivé
                            </TabsTrigger>
                            <TabsTrigger
                              value="linkedin"
                              className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-500"
                            >
                              <Linkedin className="h-3.5 w-3.5 mr-1.5" />
                              LinkedIn
                            </TabsTrigger>
                            <TabsTrigger
                              value="google"
                              className="text-xs data-[state=active]:bg-green-600 data-[state=active]:text-white dark:data-[state=active]:bg-green-500"
                            >
                              <Globe className="h-3.5 w-3.5 mr-1.5" />
                              Google
                            </TabsTrigger>
                            <TabsTrigger
                              value="link"
                              className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white dark:data-[state=active]:bg-purple-500"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1.5" />
                              Lien
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                      <div className="relative flex-1 min-w-[160px] sm:min-w-[200px] max-w-[360px]">
                        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher..."
                          value={searchQuery}
                          onChange={(e) => onSearch(e.target.value)}
                          className="pl-8 h-8 text-sm"
                        />
                      </div>
                      <div className="flex flex-col justify-center min-w-[140px] px-2 gap-1 hidden sm:flex">
                        <div className="flex items-center justify-between text-[10px] leading-none">
                          <span className="text-muted-foreground">Statut des appels</span>
                          <span className="font-medium text-foreground">{Math.max(0, Math.min(100, Math.round(completionPercent)))}%</span>
                        </div>
                        <Progress
                          value={Math.max(0, Math.min(100, Math.round(completionPercent)))}
                          className="h-1.5 w-full"
                        />
                      </div>
                    </div>
                    {/* Groupe droite : actions contextuelles */}
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap shrink-0">
                      {/* Bouton pour revenir au premier contact sans statut */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Trouver le premier contact sans statut ou avec statut "Non défini"
                                const firstWithoutStatus = filteredContacts.find(c =>
                                  !c.statut || c.statut === ContactStatus.NonDefini
                                );

                                if (firstWithoutStatus) {
                                  // Sélectionner le contact
                                  onSelectContact(firstWithoutStatus);
                                  // Utiliser la méthode scrollToContact de ContactTable via la ref
                                  setTimeout(() => {
                                    contactTableRef.current?.scrollToContact(firstWithoutStatus.id);
                                  }, 150);
                                  toast.info('Retour au premier contact sans statut');
                                } else {
                                  toast.info('Aucun contact sans statut trouvé');
                                }
                              }}
                              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 h-8 text-sm shrink-0 shadow-none bg-background text-foreground hover:bg-accent border border-border"
                              disabled={!filteredContacts.some(c => !c.statut || c.statut === ContactStatus.NonDefini)}
                            >
                              <ChevronUp className="h-4 w-4" />
                              <span className="sr-only">Premier sans statut</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p>Revenir au premier contact sans statut</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 h-8 text-sm shrink-0 shadow-none bg-background text-foreground hover:bg-accent border border-border"
                          >
                            <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tableTabs.find(t => t.id === activeTableTabId)?.color || 'var(--primary)' }}></span>
                            <span className="truncate max-w-[80px] sm:max-w-[120px] md:max-w-[200px]">
                              {tableTabs.find(t => t.id === activeTableTabId)?.name || 'Contacts'}
                            </span>
                            <ChevronDown className="h-4 w-4 shrink-0" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64">
                          <DropdownMenuLabel className="flex items-center gap-2">
                            Onglets
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          {/* Liste des onglets existants */}
                          {tableTabs.map(tab => (
                            <DropdownMenuItem
                              key={tab.id}
                              onClick={() => onSetActiveTableTabId?.(tab.id)}
                              className={cn(
                                "flex items-center gap-2 cursor-pointer",
                                activeTableTabId === tab.id && "bg-accent"
                              )}
                            >
                              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: tab.color || 'var(--primary)' }}></span>
                              <span className="flex-1 truncate">{tab.name}</span>

                              {/* Boutons d'action pour l'onglet */}
                              <div className="flex items-center gap-1">
                                {/* Bouton de renommage */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 p-0 hover:bg-accent-foreground/10"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onEditTab?.(tab)
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>

                                {/* Bouton de suppression */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onDeleteTab?.(tab.id)
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </DropdownMenuItem>
                          ))}

                          {/* Bouton d'ajout d'onglet */}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onAddTab?.()}
                            disabled={tableTabs.length >= 5}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Ajouter un onglet
                          </DropdownMenuItem>

                          {/* Bouton de suppression complète */}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive hover:text-destructive" onClick={onClearActiveTab}>
                            <Trash2 className="h-4 w-4" />
                            Supprimer toutes les données
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {/* Table Content */}
                  <div data-state="active" data-orientation="horizontal" role="tabpanel" className="outline-none flex-1 overflow-hidden">
                    <PaginatedContactTable
                      ref={contactTableRef}
                      contacts={filteredContacts}
                      callStates={callStates}
                      onSelectContact={onSelectContact}
                      selectedContactId={selectedContactId}
                      onUpdateContact={onUpdateContact}
                      onDeleteContact={handleDeleteContact}
                      activeCallContactId={activeCallContactId}
                      theme={'light' as any}
                      visibleColumns={visibleColumns}
                      columnHeaders={orderedColumnHeaders}
                      contactDataKeys={orderedContactDataKeys as (keyof Contact | null)[]}
                      onToggleColumnVisibility={toggleColumnVisibility}
                      availableColumns={orderedColumnHeaders}
                      onFileImport={analyzeAndOpenMappingDialog}
                      initialItemsPerPage={25}
                      pageSizeOptions={[25, 50, 100]}
                      onLinkedInSearch={onLinkedInSearch}
                      onGoogleSearch={onGoogleSearch}
                      onDirectLink={onDirectLink}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Mapping Dialog */}
      <ImportMappingDialog
        isOpen={mappingDialog.open}
        onClose={() => setMappingDialog(prev => ({ ...prev, open: false }))}
        fileName={mappingDialog.file?.name}
        detectedHeaders={mappingDialog.headers}
        previewRows={mappingDialog.preview}
        expectedTargets={EXPECTED_TARGETS}
        requiredTargets={REQUIRED_TARGETS}
        onConfirm={handleImportConfirm}
      />

      {/* Import Progress Bar */}
      <ImportProgressBar
        progress={importProgress?.percentage || 0}
        message={importProgress?.message || ''}
        isVisible={!!importProgress}
      />
    </div>
  )
}

export default AppelsCardsView



