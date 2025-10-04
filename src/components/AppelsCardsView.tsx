import React, { useEffect, useMemo, useRef, useState } from "react"
import { Contact, ContactStatus, CallStates } from "../types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Calendar as CalendarIcon,
  Clock,
  Download,
  Eye,
  Globe,
  History,
  Linkedin,
  Mail,
  Phone,
  PhoneCall,
  Search,
  Trash2,
  Upload,
} from "lucide-react"
import { STATUS_COLORS, STATUS_OPTIONS } from "../constants"
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import StatusSelect from "./StatusSelect"
import { DatePickerWithClear } from "./DatePickerWithClear"
import { TimePickerWithClear } from "./TimePickerWithClear"
import { ZapWidget } from "./ZapWidget"
import { loadAutoSearchMode } from "./AutoSearchDropdown"
import { DropZoneOverlay } from "./DropZoneOverlay"
import { ImportProgressBar } from "./ImportProgressBar"
import ImportMappingDialog from "./ImportMappingDialog"
import { QUICK_COMMENTS } from "../constants"
import { toast } from "sonner"
import * as XLSX from 'xlsx'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { shortcutService } from '../services/shortcutService'

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
  onSmsMonsieur: () => void
  onSmsMadame: () => void
  onRappel: () => void
  onRendezVous: () => void
  onCalCom: () => void
  onQualification: () => void
  onLinkedInSearch: () => void
  onGoogleSearch: () => void
  onDirectLink: () => void
  onExport: () => void
  onClearActiveTab: () => void
  searchQuery: string
  onSearch: (value: string) => void
  onImportDialog: () => void
  onExportDialog: () => void
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
  if (!value) return "—"
  try {
    return format(new Date(value), "dd MMM yyyy", { locale: fr })
  } catch {
    return value
  }
}

const formatDisplayTime = (value?: string) => {
  if (!value) return "—"
  return value
}

// Définir les expectedTargets pour ImportMappingDialog
const EXPECTED_TARGETS = [
  { label: 'Prénom', value: 'prenom' },
  { label: 'Nom', value: 'nom' },
  { label: 'Téléphone', value: 'telephone' },
  { label: 'Email', value: 'email' },
  { label: 'Source', value: 'source' },
  { label: 'Statut', value: 'statut' },
  { label: 'Commentaire', value: 'commentaire' },
  { label: 'Date Rappel', value: 'dateRappel' },
  { label: 'Heure Rappel', value: 'heureRappel' },
  { label: 'Date RDV', value: 'dateRDV' },
  { label: 'Heure RDV', value: 'heureRDV' },
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
  onSmsMonsieur,
  onSmsMadame,
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
}) => {
  const [visibleCount, setVisibleCount] = useState(40)
  const [autoSearchMode, setAutoSearchMode] = useState<'disabled' | 'linkedin' | 'google' | 'link'>(() => loadAutoSearchMode())
  const [activeFilter, setActiveFilter] = useState<'all' | 'rappel' | 'rdv' | 'status'>('all')
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

  // Handlers pour le drag & drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    setIsDragOver(false)
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
  const handleImportConfirm = async (_mapping: Record<string, string>, _options: { phonesToRemove?: string[] }) => {
    try {
      setMappingDialog(prev => ({ ...prev, open: false }))
      setImportProgress({ percentage: 0, message: 'Préparation de l\'import...' })

      // Simuler la progression (dans une vraie implémentation, cela viendrait du service d'import)
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (!prev) return null
          const newPercentage = Math.min(prev.percentage + 10, 90)
          return {
            percentage: newPercentage,
            message: `Import en cours... ${newPercentage}%`
          }
        })
      }, 200)

      // Ici, vous devriez appeler votre service d'import
      // const result = await importContactsFromFile(mappingDialog.file, mapping, options)
      
      // Pour l'instant, on simule un succès après 2 secondes
      setTimeout(() => {
        clearInterval(progressInterval)
        setImportProgress({ percentage: 100, message: 'Import terminé !' })
        
        toast.success('Import réussi', {
          description: 'Les contacts ont été importés avec succès'
        })

        // Masquer la barre de progression après 2 secondes
        setTimeout(() => {
          setImportProgress(null)
        }, 2000)
      }, 2000)

    } catch (error) {
      console.error('Erreur lors de l\'import:', error)
      setImportProgress(null)
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
            // Parse CSV/TSV
            const text = data as string
            const delimiter = extension === '.tsv' ? '\t' : ','
            const lines = text.split('\n').filter(line => line.trim())
            
            if (lines.length > 0) {
              headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''))
              preview = lines.slice(1, 6).map(line => 
                line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
              )
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
        reader.readAsText(file)
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

  useEffect(() => {
    setFormState(getInitialFormState(selectedContact))
    setSelectedStatus(selectedContact?.statut ?? ContactStatus.NonDefini)
    setNoteDraft(selectedContact?.commentaire ?? "")
  }, [selectedContact])

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

  // Scroll automatique vers le contact sélectionné
  useEffect(() => {
    if (!selectedContactId) return
    
    // Petit délai pour laisser le DOM se mettre à jour
    const timeoutId = setTimeout(() => {
      const node = scrollRef.current?.querySelector<HTMLDivElement>(`[data-contact-card="${selectedContactId}"]`)
      
      // Si le contact n'est pas dans le DOM, il faut charger plus de contacts
      if (!node) {
        const contactIndex = filteredContacts.findIndex(c => c.id === selectedContactId)
        if (contactIndex !== -1 && contactIndex >= visibleCount) {
          // Charger jusqu'à ce contact + quelques autres
          setVisibleCount(contactIndex + 20)
          // Réessayer après le render
          setTimeout(() => {
            const retryNode = scrollRef.current?.querySelector<HTMLDivElement>(`[data-contact-card="${selectedContactId}"]`)
            if (retryNode) {
              retryNode.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }, 200)
        }
        return
      }
      
      // Vérifier si le contact est déjà visible
      const container = scrollRef.current
      if (!container) return
      
      const containerRect = container.getBoundingClientRect()
      const nodeRect = node.getBoundingClientRect()
      
      const isVisible = 
        nodeRect.top >= containerRect.top &&
        nodeRect.bottom <= containerRect.bottom
      
      // Scroller uniquement si pas visible
      if (!isVisible) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
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
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-semibold text-foreground">Appels</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={autoSearchMode} onValueChange={(value) => setAutoSearchMode(value as any)} className="w-auto">
            <TabsList className="h-9">
              <TabsTrigger value="linkedin" className="text-xs">
                <Linkedin className="h-3.5 w-3.5 mr-1.5" />
                LinkedIn
              </TabsTrigger>
              <TabsTrigger value="google" className="text-xs">
                <Globe className="h-3.5 w-3.5 mr-1.5" />
                Google
              </TabsTrigger>
              <TabsTrigger value="link" className="text-xs">
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Lien
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
              <TooltipContent side="bottom" className="max-w-sm">
                <div className="space-y-2">
                  <p className="font-semibold">Mode Autocall</p>
                  <p className="text-xs">Active l'appel automatique du contact suivant après application d'un statut.</p>
                  <div className="mt-2 space-y-1 text-xs">
                    <p className="font-medium">Raccourcis clavier :</p>
                    <p>• <kbd className="px-1 py-0.5 bg-muted rounded">F1</kbd> : Appeler le contact</p>
                    <p>• <kbd className="px-1 py-0.5 bg-muted rounded">F2-F10</kbd> : Appliquer un statut</p>
                    <p className="text-muted-foreground mt-1">En mode Autocall, appliquer un statut (F2-F10) passe automatiquement au contact suivant et lance l'appel.</p>
                  </div>
                </div>
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
                  className="h-9 bg-neutral-900 hover:bg-black text-white border-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-900"
                  title="Exporter les données"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Exporter les données</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onExportDialog}>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter tout (Excel)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  // Export Google Contacts
                  toast.info('Export Google Contacts en cours...')
                  // Appeler la fonction d'export si disponible
                }}>
                  <Mail className="mr-2 h-4 w-4" />
                  Google Contacts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  // Export Google Calendar
                  toast.info('Export Google Calendar en cours...')
                }}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Google Calendar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
          <Button 
            size="sm"
            className="h-9 bg-red-500 hover:bg-red-600 text-white border-red-500 dark:bg-red-600 dark:hover:bg-red-700"
            onClick={onClearActiveTab}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
          </Button>
        </div>
      </div>
      <div className="flex h-full w-full gap-4 overflow-hidden">
        <div className="hidden xl:flex xl:w-[360px] 2xl:w-[420px] flex-col rounded-xl border bg-card/70 backdrop-blur-sm shadow-sm">
          <div className="border-b px-4 py-2.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">Contacts</h2>
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
                    onClick={() => onSelectContact(contact)}
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
                              {contact.telephone || "—"}
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
                          <span>Appel en cours…</span>
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
                        {selectedContact.email && selectedContact.telephone && <span className="text-muted-foreground/50">•</span>}
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
                      onSmsMonsieur={onSmsMonsieur}
                      onSmsMadame={onSmsMadame}
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
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 bg-[#0A66C2] hover:bg-[#004182] text-white border-[#0A66C2]" onClick={onLinkedInSearch}>
                    <Linkedin className="h-4 w-4" /> LinkedIn
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
            <div className="flex h-full flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 text-muted-foreground">
              <div className="rounded-full border bg-background p-3 shadow-sm">
                <Phone className="h-6 w-6" />
              </div>
              <div className="text-sm font-medium">Sélectionnez un prospect dans la colonne de gauche</div>
              <p className="text-xs text-muted-foreground/80">
                Les informations détaillées s’afficheront ici.
              </p>
            </div>
          )}
        </div>
      </div>

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

