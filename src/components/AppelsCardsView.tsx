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
  Filter,
  Globe,
  History,
  Linkedin,
  Mail,
  Phone,
  Search,
  Sparkles,
  Trash2,
  Upload,
  User,
} from "lucide-react"
import { STATUS_COLORS, STATUS_OPTIONS } from "../constants"
import CallControl from "./CallControl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
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

const timeOptions = Array.from({ length: 24 * 4 }, (_, index) => {
  const hour = Math.floor(index / 4)
  const minute = (index % 4) * 15
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`
})

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
  const [filterOpen, setFilterOpen] = useState(false)
  const applyQuickFilter = (type: 'all' | 'rappel' | 'rdv' | 'status') => {
    // TODO: branch existing filter logic; for now just close the menu
    setFilterOpen(false)
  }

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) ?? null,
    [contacts, selectedContactId],
  )
  const [formState, setFormState] = useState<FormState>(getInitialFormState(selectedContact))
  const [selectedStatus, setSelectedStatus] = useState<ContactStatus>(
    selectedContact?.statut ?? ContactStatus.NonDefini,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [noteDraft, setNoteDraft] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setFormState(getInitialFormState(selectedContact))
    setSelectedStatus(selectedContact?.statut ?? ContactStatus.NonDefini)
    setNoteDraft(selectedContact?.commentaire ?? "")
  }, [selectedContact])

  useEffect(() => {
    if (!selectedContactId) return
    const node = scrollRef.current?.querySelector<HTMLDivElement>(`[data-contact-card="${selectedContactId}"]`)
    if (!node) return
    node.scrollIntoView({ block: "nearest" })
  }, [selectedContactId])

  const handleFormChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!selectedContact) return
    setIsSaving(true)
    try {
      onUpdateContact({
        id: selectedContact.id,
        ...formState,
        statut: selectedStatus,
        commentaire: noteDraft,
      })
    } finally {
      setIsSaving(false)
    }
  }

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

  const displayedContacts = useMemo(
    () => contacts.slice(0, Math.min(visibleCount, contacts.length)),
    [contacts, visibleCount],
  )

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/70 px-6 py-4 backdrop-blur-sm shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-foreground">Appels</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(event) => onSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu open={filterOpen} onOpenChange={setFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filtres rapides</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => applyQuickFilter('all')}>Tous les prospects</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyQuickFilter('rappel')}>À rappeler aujourd’hui</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyQuickFilter('rdv')}>Avec RDV planifié</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyQuickFilter('status')}>Statut à vérifier</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="secondary" onClick={onImportDialog}>
            <Upload className="mr-2 h-4 w-4" /> Importer
          </Button>
          <Button variant="secondary" onClick={onExportDialog}>
            <Download className="mr-2 h-4 w-4" /> Exporter
          </Button>
          <Button variant="destructive" onClick={onClearActiveTab}>
            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
          </Button>
        </div>
      </div>
      <div className="flex h-full w-full gap-4 overflow-hidden">
        <div className="hidden xl:flex xl:w-[360px] 2xl:w-[420px] flex-col rounded-xl border bg-card/70 backdrop-blur-sm shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-medium text-muted-foreground">Contacts</h2>
            <p className="text-xs text-muted-foreground/70">
              {contacts.length} prospect{contacts.length > 1 ? "s" : ""}
            </p>
          </div>
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="space-y-2 p-4">
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
                    <CardHeader className="p-0 px-3 py-2 flex flex-row items-center gap-2.5 space-y-0">
                      <div className="flex min-w-0 flex-1 items-start gap-2.5">
                        <Avatar className="h-8 w-8 border">
                          <AvatarFallback>
                            {(contact.prenom?.[0] ?? "").toUpperCase()
                              .concat(contact.nom?.[0] ?? "")
                              .slice(0, 2) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <CardTitle className="truncate text-sm font-semibold text-foreground">
                            {[contact.prenom, contact.nom].filter(Boolean).join(" ") || "Sans nom"}
                          </CardTitle>
                          <div className="mt-0.5 grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{contact.email || "Aucun email"}</span>
                            </span>
                            <span className="flex items-center gap-1 truncate">
                              <Phone className="h-3 w-3" />
                              <span className="truncate">{contact.telephone || "—"}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                          statusConfig?.bg,
                          statusConfig?.text,
                        )}
                      >
                        {contact.statut ?? ContactStatus.NonDefini}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-0 px-3 pb-2.5 pt-1 grid gap-1.5 text-xs text-muted-foreground">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                          Source
                        </span>
                        <span className="truncate text-foreground">{contact.source || "—"}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                          Commentaire
                        </span>
                        <span className="line-clamp-2 text-foreground/80">
                          {contact.commentaire || "Aucun commentaire"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="rounded-md border border-border/40 bg-muted/30 p-1.5">
                          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                            Rappel
                          </span>
                          <div className="mt-0.5 flex items-center gap-1 text-foreground">
                            <CalendarIcon className="h-3 w-3" />
                            <span>{formatDisplayDate(contact.dateRappel)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDisplayTime(contact.heureRappel)}</span>
                          </div>
                        </div>
                        <div className="rounded-md border border-border/40 bg-muted/30 p-1.5">
                          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                            Rendez-vous
                          </span>
                          <div className="mt-0.5 flex items-center gap-1 text-foreground">
                            <CalendarIcon className="h-3 w-3" />
                            <span>{formatDisplayDate(contact.dateRDV)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDisplayTime(contact.heureRDV)}</span>
                          </div>
                        </div>
                      </div>
                      {isCalling && (
                        <div className="flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] text-primary">
                          <Sparkles className="h-3 w-3" />
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
              <div className="border-b px-6 py-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
              <div className="border-b bg-card/70 px-6 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-3" onClick={onLinkedInSearch}>
                    <Linkedin className="h-4 w-4" /> LinkedIn
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-3" onClick={onGoogleSearch}>
                    <Globe className="h-4 w-4" /> Google
                  </Button>
                  <Button
                    variant="ghost"
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
                <div className="grid gap-6 px-6 py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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
                          <Textarea
                            id="contact-comment"
                            value={noteDraft}
                            onChange={(event) => setNoteDraft(event.target.value)}
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
                          <DatePickerField
                            label="Date de rappel"
                            value={formState.dateRappel}
                            onChange={(value) => handleFormChange("dateRappel", value)}
                          />
                          <TimeSelectField
                            label="Heure de rappel"
                            value={formState.heureRappel}
                            onChange={(value) => handleFormChange("heureRappel", value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <DatePickerField
                            label="Date de RDV"
                            value={formState.dateRDV}
                            onChange={(value) => handleFormChange("dateRDV", value)}
                          />
                          <TimeSelectField
                            label="Heure de RDV"
                            value={formState.heureRDV}
                            onChange={(value) => handleFormChange("heureRDV", value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <DatePickerField
                            label="Date d'appel"
                            value={formState.dateAppel}
                            onChange={(value) => handleFormChange("dateAppel", value)}
                          />
                          <TimeSelectField
                            label="Heure d'appel"
                            value={formState.heureAppel}
                            onChange={(value) => handleFormChange("heureAppel", value)}
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

                    <div className="rounded-lg border bg-muted/30 p-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Raccourcis clavier
                      </h4>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Utilisez F2–F10 pour appliquer rapidement un statut au contact sélectionné.
                      </p>
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
    </div>
  )
}

type DatePickerFieldProps = {
  label: string
  value?: string
  onChange: (value: string) => void
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({ label, value, onChange }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground/80">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="flex w-full items-center justify-between text-sm"
            type="button"
          >
            <span className="text-left">
              {value ? formatDisplayDate(value) : <span className="text-muted-foreground">Sélectionner une date</span>}
            </span>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={fr}
            selected={value ? new Date(value) : undefined}
            onSelect={(date) => {
              if (!date) return
              const formatted = format(date, "yyyy-MM-dd")
              onChange(formatted)
              setOpen(false)
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

const TimeSelectField: React.FC<TimeSelectFieldProps> = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-foreground/80">{label}</Label>
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger className="w-full justify-between">
        <SelectValue placeholder="Sélectionner" />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        <ScrollArea className="h-60">
          {timeOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </ScrollArea>
      </SelectContent>
    </Select>
  </div>
)

const LoaderIndicator = () => (
  <span className="mr-2 inline-flex items-center">
    <svg
      className="h-3.5 w-3.5 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  </span>
)

export default AppelsCardsView

