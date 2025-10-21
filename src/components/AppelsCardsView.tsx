import React, { useEffect, useMemo, useRef, useState } from "react"
import { Contact, ContactStatus, CallStates } from "../types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Bell,
  Calendar,
  CalendarSearch,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Eye,
  EyeOff,
  FileCheck,
  Globe,
  History,
  Linkedin,
  Mail,
  MessageSquare,
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
} from "lucide-react"
import { STATUS_COLORS, STATUS_OPTIONS, COLUMN_HEADERS, CONTACT_DATA_KEYS, DEFAULT_COLUMN_ORDER } from "../constants"
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
import StatusSelect from "./StatusSelect"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { shortcutService } from '../services/shortcutService'
import { exportContactsToFile, exportGoogleContactsCSV, exportGoogleCalendarCSV, importContactsFromFile } from '../services/dataService'
import { ViewSwitcher, ViewMode } from '@/components/ViewSwitcher'
import { PaginatedContactTable } from '@/components/PaginatedContactTable'
import type { ContactTableRef } from '@/components/ContactTable'
import { StatusCompletionChart } from '@/components/StatusCompletionChart'

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

const formatDisplayTime = (value?: string) => {
  if (!value) return ""
  return value
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
  onExport,
  onClearActiveTab,
  searchQuery,
  onSearch,
  onImportDialog,
  onExportDialog,
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'rappel' | 'rdv' | 'status'>('all')
  
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
  // Charger la configuration des colonnes essentielles depuis les paramètres
  const getEssentialColumns = (): string[] => {
    const saved = localStorage.getItem('dimicall_column_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        return Object.keys(config).filter(key => config[key] === true);
      } catch (error) {
        console.error('Erreur lors du chargement de la config des colonnes:', error);
      }
    }
    // Configuration par défaut si rien n'est sauvegardé
    return ['#', 'Prénom', 'Nom', 'Commentaire'];
  };

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    // Par défaut, toutes les colonnes sont visibles
    const defaultVisible: Record<string, boolean> = {};
    COLUMN_HEADERS.forEach(header => {
      defaultVisible[header] = true;
    });
    // Tenter de charger la configuration sauvegardée
    try {
      const saved = localStorage.getItem('appels2-visible-columns');
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, boolean>;
        const merged: Record<string, boolean> = {};
        // Ne garder que les colonnes connues et ajouter les nouvelles en visible par défaut
        COLUMN_HEADERS.forEach(header => {
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
    // Créer un ordre basé sur DEFAULT_COLUMN_ORDER
    const ordered: string[] = [];
    const remainingHeaders = new Set(COLUMN_HEADERS);
    
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
  }, [])

  // Créer les clés de données correspondantes dans le même ordre
  const orderedContactDataKeys = useMemo(() => {
    const keyMap: Record<string, keyof Contact | null> = {
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
  const [importProgress, setImportProgress] = useState<{ percentage: number; message: string } | null>(null)
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
    table: true,
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
  const [selectedStatus, setSelectedStatus] = useState<ContactStatus>(
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
        statut: selectedStatus,
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
    setVisibleColumns(prev => {
      const next = { ...prev, [header]: !prev[header] };
      try {
        localStorage.setItem('appels2-visible-columns', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Persister toute modification de visibilité (y compris changements en masse)
  useEffect(() => {
    try {
      localStorage.setItem('appels2-visible-columns', JSON.stringify(visibleColumns));
    } catch {}
  }, [visibleColumns]);

  const handleDeleteContact = (contactId: string) => {
    // Implement delete logic if needed
    console.log('Delete contact:', contactId);
  };

  return (
    <div 
      className="flex h-full w-full flex-col gap-4 overflow-hidden"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <DropZoneOverlay isVisible={isDragOver} isDragActive={isDragActive} />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/70 px-6 py-3 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-semibold text-foreground">Appels</h1>
          </div>
          <ViewSwitcher
            currentView={viewMode}
            onViewChange={setViewMode}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusCompletionChart contacts={contacts} compact className="flex-shrink-0" />
          {viewMode === 'cards' && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-2 shrink-0"
                    title="Mode de recherche automatique"
                  >
                    {autoSearchMode === 'linkedin' && <Linkedin className="h-4 w-4 text-blue-600" />}
                    {autoSearchMode === 'linkedin-name' && <Linkedin className="h-4 w-4 text-blue-600" />}
                    {autoSearchMode === 'linkedin-name-type' && <Linkedin className="h-4 w-4 text-blue-600" />}
                    {autoSearchMode === 'google' && <Globe className="h-4 w-4 text-green-600" />}
                    {autoSearchMode === 'link' && <Eye className="h-4 w-4 text-purple-600" />}
                    {autoSearchMode === 'disabled' && <X className="h-4 w-4" />}
                    <span className="sr-only">Changer le mode automatique</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="bottom" sideOffset={5} className="w-64">
                  <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
                    Mode automatique
                  </DropdownMenuLabel>
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
                </DropdownMenuContent>
              </DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="sm"
                      onClick={() => {
                        setIsAutocallActive(!isAutocallActive)
                        toast.info(isAutocallActive ? 'Autocall désactivé' : 'Autocall activé')
                      }}
                      className={cn(
                        "h-9",
                        isAutocallActive 
                          ? "bg-neutral-700 hover:bg-neutral-800 text-white border-neutral-700 dark:bg-neutral-600 dark:hover:bg-neutral-700" 
                          : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-300 dark:border-neutral-700"
                      )}
                    >
                      <PhoneCall className="mr-2 h-4 w-4" />
                      Autocall
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-sm bg-popover text-popover-foreground border-border">
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground">Mode Autocall</p>
                      <p className="text-xs text-muted-foreground">Active l'appel automatique du contact suivant après application d'un statut.</p>
                      <div className="mt-2 space-y-1 text-xs">
                        <p className="font-medium text-foreground">Raccourcis clavier :</p>
                        <p className="text-foreground">"¢ <kbd className="px-1 py-0.5 bg-muted text-foreground rounded">F1</kbd> : Appeler le contact</p>
                        <p className="text-foreground">"¢ <kbd className="px-1 py-0.5 bg-muted text-foreground rounded">F2-F10</kbd> : Appliquer un statut</p>
                        <p className="text-muted-foreground mt-1">En mode Autocall, appliquer un statut (F2-F10) passe automatiquement au contact suivant et lance l'appel.</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="sm"
                      onClick={() => {
                        // Trouver le premier contact sans statut ou avec statut "Non défini"
                        const firstWithoutStatus = filteredContacts.find(c => 
                          !c.statut || c.statut === ContactStatus.NonDefini
                        );
                        
                        if (firstWithoutStatus) {
                          shouldAutoScrollRef.current = true;
                          onSelectContact(firstWithoutStatus);
                          toast.info('Retour au premier contact sans statut');
                        } else {
                          toast.info('Aucun contact sans statut trouvé');
                        }
                      }}
                      className="h-9 bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
                      disabled={!filteredContacts.some(c => !c.statut || c.statut === ContactStatus.NonDefini)}
                    >
                      <ChevronUp className="mr-2 h-4 w-4" />
                      Premier sans statut
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Revenir au premier contact sans statut</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <ButtonGroup>
                <Button 
                  size="sm"
                  className="h-9 bg-neutral-900 hover:bg-black text-white border-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-900"
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
                  <Upload className="h-4 w-4 mr-2" />
                  Importer
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="sm" 
                      disabled={contacts.length === 0}
                      className="h-9 bg-neutral-900 hover:bg-black text-white border-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-900"
                      title="Exporter les données"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 border shadow-lg bg-popover text-popover-foreground z-50">
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
                      className="cursor-pointer bg-primary/10 hover:bg-primary/20"
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
                    className="h-9 bg-red-500 hover:bg-red-600 text-white border-red-500 dark:bg-red-600 dark:hover:bg-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
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
            </>
          )}
        </div>
      </div>
      {viewMode === 'cards' ? (
      <div className="flex h-full w-full gap-4 overflow-hidden flex-col lg:flex-row">
        <div className="flex w-full lg:w-[320px] xl:w-[360px] 2xl:w-[420px] flex-col rounded-xl border bg-card/70 backdrop-blur-sm shadow-sm max-h-[300px] lg:max-h-none">
          <div className="border-b px-4 py-2.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 px-2 sm:px-3 py-1.5 h-8 text-sm shrink-0"
                  >
                    <span className="inline-block w-2 h-2 rounded-full" style={{backgroundColor: tableTabs.find(t => t.id === activeTableTabId)?.color || 'var(--primary)'}}></span>
                    <span className="truncate max-w-[80px] sm:max-w-[120px] md:max-w-[200px]">
                      {tableTabs.find(t => t.id === activeTableTabId)?.name || 'Onglets'}
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
                      <span className="inline-block w-2 h-2 rounded-full" style={{backgroundColor: tab.color || 'var(--primary)'}}></span>
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
              <p className="text-xs text-muted-foreground/70">
                {contacts.length} prospect{contacts.length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(event) => onSearch(event.target.value)}
                className="pl-9 h-8"
              />
            </div>
          </div>
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="space-y-1.5 p-3">
              {displayedContacts.map((contact) => {
                const isSelected = contact.id === selectedContactId
                const statusConfig = STATUS_COLORS[contact.statut ?? ContactStatus.NonDefini]
                const isCalling = !!callStates[contact.id]?.isCalling
                return (
                    <Card
                      key={contact.id}
                      data-contact-card={contact.id}
                      className={cn(
                        "overflow-hidden rounded-lg border bg-card/80 transition-all duration-200 cursor-pointer",
                        isSelected ? "border-primary shadow-sm" : "hover:border-primary/40",
                      )}
                    onClick={() => {
                      shouldAutoScrollRef.current = true;
                      onSelectContact(contact);
                    }}
                  >
                    <CardHeader className="p-0 px-3 py-1.5 flex flex-row items-center gap-2 space-y-0">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Avatar className="h-7 w-7 border">
                          <AvatarFallback className="text-xs">
                            {(contact.prenom?.[0] ?? "").toUpperCase()
                              .concat(contact.nom?.[0] ?? "")
                              .slice(0, 2) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <CardTitle className="truncate text-xs font-semibold text-foreground leading-tight">
                            {[contact.prenom, contact.nom].filter(Boolean).join(" ") || "Sans nom"}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-0.5 truncate">
                              <Phone className="h-2.5 w-2.5" />
                              {contact.telephone || "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "rounded-full px-1.5 py-0 text-[9px] font-medium capitalize shrink-0",
                          statusConfig?.bg,
                          statusConfig?.text,
                          statusConfig?.darkBg,
                          statusConfig?.darkText,
                        )}
                      >
                        {contact.statut ?? ContactStatus.NonDefini}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-0 px-3 pb-1.5 pt-0 flex items-center justify-between text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-3">
                        {contact.dateRappel && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-2.5 w-2.5 text-orange-500" />
                            <span className="text-foreground">{formatDisplayDate(contact.dateRappel)}</span>
                          </div>
                        )}
                        {contact.dateRDV && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-2.5 w-2.5 text-blue-500" />
                            <span className="text-foreground">{formatDisplayDate(contact.dateRDV)}</span>
                          </div>
                        )}
                      </div>
                      {contact.source && (
                        <span className="text-[9px] text-muted-foreground/60 truncate max-w-[100px]">
                          {contact.source}
                        </span>
                      )}
                      {isCalling && (
                        <div className="flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] text-primary ml-auto">
                          <PhoneCall className="h-3 w-3" />
                          <span>Appel en cours"¦</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
              {contacts.length > visibleCount && (
                <Button
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() => setVisibleCount((prev) => prev + 40)}
                >
                  Afficher plus de contacts
                </Button>
              )}
              {contacts.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-10">
                  Aucun contact trouvé.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 overflow-hidden">
          {selectedContact ? (
            <div className="flex h-full flex-col rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm">
              <div className="border-b px-6 py-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border">
                      <AvatarFallback>
                        {(selectedContact.prenom?.[0] ?? "").toUpperCase()
                          .concat(selectedContact.nom?.[0] ?? "")
                          .slice(0, 2) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-semibold leading-tight text-foreground">
                        {[selectedContact.prenom, selectedContact.nom].filter(Boolean).join(" ") || "Sans nom"}
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {selectedContact.email && <span>{selectedContact.email}</span>}
                        {selectedContact.email && selectedContact.telephone && <span className="text-muted-foreground/50">"¢</span>}
                        {selectedContact.telephone && <span>{selectedContact.telephone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <StatusSelect
                      value={selectedStatus}
                      onChange={(status) => {
                        setSelectedStatus(status)
                        onUpdateContact({ id: selectedContact.id, statut: status })
                      }}
                      triggerClassName="min-w-[160px]"
                      contentClassName="text-xs"
                      size="sm"
                    />
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
              <div className="border-b bg-card/70 px-6 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1.5 px-3 bg-[#0A66C2] hover:bg-[#004182] text-white border-[#0A66C2]"
                    onClick={() => onLinkedInSearch('name')}
                  >
                    <Linkedin className="h-4 w-4" /> 
                    <span>LinkedIn</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1.5 px-3 bg-[#0A66C2] hover:bg-[#004182] text-white border-[#0A66C2]"
                    onClick={() => onLinkedInSearch('name-type')}
                  >
                    <Linkedin className="h-4 w-4" /> 
                    <span>LinkedIn+</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 bg-[#4285F4] hover:bg-[#357AE8] text-white border-[#4285F4]" onClick={onGoogleSearch}>
                    <Globe className="h-4 w-4" /> Google
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-3"
                    onClick={onDirectLink}
                    disabled={!selectedContact.lien}
                  >
                    <Eye className="h-4 w-4" /> Lien direct
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="grid gap-4 px-6 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <section className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Informations principales</h3>
                      <Separator className="my-2" />
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="contact-firstname">Prénom</Label>
                            <Input
                              id="contact-firstname"
                              value={formState.prenom}
                              onChange={(event) => handleFormChange("prenom", event.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contact-lastname">Nom</Label>
                            <Input
                              id="contact-lastname"
                              value={formState.nom}
                              onChange={(event) => handleFormChange("nom", event.target.value)}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="contact-phone">Téléphone</Label>
                            <Input
                              id="contact-phone"
                              value={formState.telephone}
                              onChange={(event) => handleFormChange("telephone", event.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contact-email">Email</Label>
                            <Input
                              id="contact-email"
                              value={formState.email}
                              onChange={(event) => handleFormChange("email", event.target.value)}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
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
                              onValueChange={(value: ContactStatus) => setSelectedStatus(value)}
                            >
                              <SelectTrigger className="justify-between">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status}
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

                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Rappels & Rendez-vous</h3>
                      <Separator className="my-2" />
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
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
                        <div className="grid grid-cols-2 gap-4">
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
                        <div className="grid grid-cols-2 gap-4">
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
                        <div className="space-y-2">
                          <Label htmlFor="call-duration">Durée d'appel</Label>
                          <Input
                            id="call-duration"
                            value={formState.dureeAppel}
                            placeholder="mm:ss"
                            onChange={(event) => handleFormChange("dureeAppel", event.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Historique</h3>
                      <Separator className="my-2" />
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
                        <p className="text-xs text-muted-foreground">Aucun historique enregistré.</p>
                      )}
                    </div>


                  </section>
                </div>
              </ScrollArea>

            </div>
          ) : (
            <div 
              className="flex h-full flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 text-muted-foreground"
              style={{ pointerEvents: 'none' }}
            >
              <div className="rounded-full border bg-background p-3 shadow-sm">
                <Phone className="h-6 w-6" />
              </div>
              <div className="text-sm font-medium">Sélectionnez un prospect dans la colonne de gauche</div>
              <p className="text-xs text-muted-foreground/80">
                Les informations détaillées s,
    '"˜': afficheront ici.
              </p>
            </div>
          )}
        </div>
      </div>
      ) : (
        <div className="flex-1 flex flex-col p-1 md:p-1.5 space-y-1 md:space-y-1.5 overflow-hidden w-full min-h-0">
          {/* Action Bar */}
          <div className="flex items-stretch gap-3 w-full justify-between">
            <div className="flex-grow">
              <div className="w-full overflow-x-auto flex justify-center">
                <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3 shadow-sm min-w-[280px] w-fit">
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span data-slot="avatar" className="relative flex size-8 shrink-0 overflow-hidden rounded-full h-8 w-8 flex-shrink-0">
                      <span data-slot="avatar-fallback" className="bg-muted flex size-full items-center justify-center rounded-full">
                        {selectedContact ? (selectedContact.prenom?.[0] || selectedContact.nom?.[0] || '?') : '"”'}
                      </span>
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium whitespace-nowrap" title={selectedContact ? `${selectedContact.prenom || ''} ${selectedContact.nom || ''}`.trim() : 'Aucun contact sélectionné'}>
                        {selectedContact ? `${selectedContact.prenom || ''} ${selectedContact.nom || ''}`.trim() || 'Sans nom' : 'Aucun contact sélectionné'}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap" title={selectedContact?.telephone || '"”'}>
                        {selectedContact?.telephone || '"”'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 ml-auto justify-end">
                    <div className="hidden text-muted-foreground/50 text-sm sm:block">|</div>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              onClick={() => selectedContact && onCall()}
                              disabled={!selectedContact}
                              className="size-10 rounded-full transition-all duration-200 hover:scale-105 bg-green-500 hover:bg-green-600 text-white shadow-lg focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Appeler"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{selectedContact ? 'Appeler' : 'Sélectionnez un contact'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              disabled={!selectedContact}
                              onClick={() => selectedContact && onSms()}
                              className="size-10 rounded-full transition-all duration-200 hover:scale-105 border-2 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="SMS"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>SMS</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => { if (selectedContact?.email) onEmail() }}
                              disabled={!selectedContact || !selectedContact?.email}
                              className="size-10 rounded-full transition-all duration-200 hover:scale-105 border-2 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Email"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Email</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => selectedContact && onQualification()}
                              disabled={!selectedContact}
                              className="size-10 rounded-full transition-all duration-200 hover:scale-105 border-2 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Qualification"
                            >
                              <FileCheck className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Qualifier le contact</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => selectedContact && onRappel()}
                              disabled={!selectedContact}
                              className="size-10 rounded-full transition-all duration-200 hover:scale-105 border-2 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Rappel"
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Programmer un rappel</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => selectedContact && onRendezVous()}
                              disabled={!selectedContact}
                              className="size-10 rounded-full transition-all duration-200 hover:scale-105 border-2 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Rendez-vous"
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Programmer un rendez-vous</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => selectedContact && onCalCom()}
                              disabled={!selectedContact}
                              className="size-10 rounded-full transition-all duration-200 hover:scale-105 border-2 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Cal.com"
                            >
                              <CalendarSearch className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ouvrir Cal.com</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Table Container */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0">
              <div className="flex-1 bg-card rounded-lg border shadow-sm overflow-hidden">
                <div dir="ltr" data-orientation="horizontal" data-slot="tabs" className="gap-2 flex h-full flex-col">
                  {/* Table Controls Bar - Fully Responsive */}
                  <div className="flex items-center gap-2 px-1.5 py-1.5 border-b bg-card flex-wrap">
                    {/* Groupe 1: Gestion colonnes + Mode auto + Recherche */}
                    <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-2 shrink-0"
                            title="Gestion des colonnes"
                          >
                            <Settings2 className="h-4 w-4" />
                            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
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
                              checked={visibleColumns[header]}
                              onCheckedChange={() => toggleColumnVisibility(header)}
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
                                // Garder les colonnes essentielles visibles, masquer les optionnelles
                                newVisibility[header] = essentialCols.includes(header);
                              })
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
                            className="text-xs data-[state=active]:bg-neutral-900 data-[state=active]:text-white dark:data-[state=active]:bg-neutral-100 dark:data-[state=active]:text-neutral-900"
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-2 shrink-0"
                            title="Mode de recherche automatique"
                          >
                            {(autoSearchMode === 'linkedin' || autoSearchMode === 'linkedin-name' || autoSearchMode === 'linkedin-name-type') && <Linkedin className="h-4 w-4 text-blue-600" />}
                            {autoSearchMode === 'google' && <Globe className="h-4 w-4 text-green-600" />}
                            {autoSearchMode === 'link' && <Eye className="h-4 w-4 text-purple-600" />}
                            {autoSearchMode === 'disabled' && <X className="h-4 w-4" />}
                            <span className="sr-only">Changer le mode automatique</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" side="bottom" sideOffset={5} className="w-64">
                          <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
                            Mode automatique
                          </DropdownMenuLabel>
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
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <div className="relative flex-1 min-w-[180px] max-w-[300px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher dans la table..."
                          value={searchQuery}
                          onChange={(e) => onSearch(e.target.value)}
                          className="pl-9 h-9"
                        />
                      </div>
                    </div>
                    
                    {/* Groupe 2: Boutons de recherche manuelle LinkedIn/Google/Lien */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onLinkedInSearch('name')}
                        disabled={!selectedContactId}
                        className="h-8 gap-1.5 px-2 sm:px-3 bg-[#0A66C2] hover:bg-[#004182] text-white border-[#0A66C2] shrink-0"
                        title="Rechercher sur LinkedIn (Prénom + Nom)"
                      >
                        <Linkedin className="h-4 w-4" />
                        <span className="hidden sm:inline">LinkedIn</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onLinkedInSearch('name-type')}
                        disabled={!selectedContactId}
                        className="h-8 gap-1.5 px-2 sm:px-3 bg-[#0A66C2] hover:bg-[#004182] text-white border-[#0A66C2] shrink-0"
                        title="Rechercher sur LinkedIn (Prénom + Nom + Type)"
                      >
                        <Linkedin className="h-4 w-4" />
                        <span className="hidden sm:inline">LinkedIn+</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onGoogleSearch}
                        disabled={!selectedContactId}
                        className="h-8 gap-1.5 px-2 sm:px-3 bg-[#4285F4] hover:bg-[#357AE8] text-white border-[#4285F4] shrink-0"
                        title="Rechercher sur Google"
                      >
                        <Globe className="h-4 w-4" />
                        <span className="hidden sm:inline">Google</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onDirectLink}
                        disabled={!selectedContactId}
                        className="h-8 gap-1.5 px-2 sm:px-3 shrink-0"
                        title="Ouvrir le lien direct"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Lien direct</span>
                      </Button>
                    </div>
                    
                    {/* Groupe 3: Boutons d'actions */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {/* Bouton pour revenir au premier contact sans statut */}
                      <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
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
                                className="h-8 gap-1.5 px-2 sm:px-3 bg-primary/10 hover:bg-primary/20 text-primary border-primary/30 shrink-0"
                                disabled={!filteredContacts.some(c => !c.statut || c.statut === ContactStatus.NonDefini)}
                              >
                                <ChevronUp className="h-4 w-4" />
                                <span className="hidden md:inline">Premier sans statut</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p>Revenir au premier contact sans statut</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <Button
                        variant="outline"
                        size="sm"
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
                        className="h-8 px-2 shrink-0"
                        title="Importer un fichier CSV/Excel"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={contacts.length === 0}
                            className="h-8 px-2 shrink-0"
                            title="Exporter les données"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 border shadow-lg bg-popover text-popover-foreground z-50">
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
                            className="cursor-pointer bg-primary/10 hover:bg-primary/20"
                            disabled={Object.values(exportOptions).every(option => !option)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            <span className="font-medium">Exporter la sélection</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-2 shrink-0"
                              title="Supprimer les contacts de l'onglet actif"
                            >
                              <Trash2 className="h-4 w-4" />
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
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 h-8 text-sm shrink-0"
                          >
                            <span className="inline-block w-2 h-2 rounded-full" style={{backgroundColor: tableTabs.find(t => t.id === activeTableTabId)?.color || 'var(--primary)'}}></span>
                            <span className="truncate max-w-[80px] sm:max-w-[120px] md:max-w-[200px]">
                              {tableTabs.find(t => t.id === activeTableTabId)?.name || 'Onglets'}
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
                              <span className="inline-block w-2 h-2 rounded-full" style={{backgroundColor: tab.color || 'var(--primary)'}}></span>
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





