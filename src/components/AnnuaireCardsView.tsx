import React, { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Bell,
  Calendar as CalendarIcon,
  Calendar,
  CalendarSearch,
  Clock,
  Eye,
  FileCheck,
  Globe,
  History,
  Linkedin,
  Mail,
  MessageSquare,
  Phone,
  PhoneCall,
  Search
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { StatusEventRecord } from '@/types/statusEvent'
import { ContactStatus } from "@/types"
import { STATUS_COLORS } from "@/constants"

interface ContactHistoryItem {
  id: number
  appliedAt?: string | null
  displayDate: string
  status: string
  previousStatus?: string
  type: 'appel' | 'rappel' | 'rdv' | 'statut'
  meta: Array<{ label: string; value: string }>
  notes?: string
}

interface DirectoryContact {
  id: string
  fullName: string
  prenom: string
  nom: string
  telephone: string
  email?: string
  status: string
  previousStatus?: string
  commentaire?: string
  reminder?: { date?: string; time?: string; label: string }
  rdv?: { date?: string; time?: string; label: string }
  lastCall?: { date?: string; time?: string; duration?: string; label: string }
  history: ContactHistoryItem[]
  events: StatusEventRecord[]
  lastUpdatedAt?: string | null
  lastUpdatedLabel?: string
  totalEvents: number
  numeroLigne: number
}

interface AnnuaireCardsViewProps {
  contacts: DirectoryContact[]
  selectedContactId: string | null
  onSelectContact: (contact: DirectoryContact | null) => void
  searchTerm: string
  onSearchChange: (value: string) => void
}

const normalizeKey = (value?: string) =>
  value
    ?.normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase() ?? ''

const CONTACT_STATUS_LOOKUP = (() => {
  const entries = new Map<string, ContactStatus>()
  Object.values(ContactStatus).forEach(status => {
    entries.set(normalizeKey(status), status)
  })
  return entries
})()

const mapStatusToContactStatus = (status?: string): ContactStatus | null => {
  if (!status) return null
  return CONTACT_STATUS_LOOKUP.get(normalizeKey(status)) ?? null
}

const getStatusBadgeClasses = (status?: string): string => {
  const mapped = mapStatusToContactStatus(status)
  if (!mapped) {
    return 'bg-gray-200 text-gray-700 dark:bg-neutral-700 dark:text-neutral-300'
  }
  const colors = STATUS_COLORS[mapped]
  return [colors?.bg, colors?.text, colors?.darkBg, colors?.darkText]
    .filter(Boolean)
    .join(' ')
}

const getInitials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2) || '?'

const HistoryCard: React.FC<{ item: ContactHistoryItem }> = ({ item }) => (
  <div className="rounded-lg border bg-muted/40 p-3 text-xs">
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 font-medium text-foreground">
        <History className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{item.displayDate}</span>
      </div>
      {item.status && (
        <Badge variant="outline" className="text-[10px]">
          {item.status}
        </Badge>
      )}
    </div>
    <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
      {item.previousStatus && <span>Depuis {item.previousStatus}</span>}
      <span className="capitalize">({item.type})</span>
    </div>
    {item.notes && (
      <p className="mt-2 text-muted-foreground/80">
        {item.notes}
      </p>
    )}
    {item.meta.length > 0 && (
      <div className="mt-2 grid gap-1 sm:grid-cols-2">
        {item.meta.map((meta, index) => (
          <div key={`${meta.label}-${index}`} className="flex items-center gap-1 text-muted-foreground">
            <span className="text-[11px] font-medium text-foreground">{meta.label} :</span>
            <span className="truncate">{meta.value}</span>
          </div>
        ))}
      </div>
    )}
  </div>
)

export const AnnuaireCardsView: React.FC<AnnuaireCardsViewProps> = ({
  contacts,
  selectedContactId,
  onSelectContact,
  searchTerm,
  onSearchChange,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(40)

  const displayedContacts = useMemo(
    () => contacts.slice(0, Math.min(visibleCount, contacts.length)),
    [contacts, visibleCount]
  )

  const selectedContact = useMemo(
    () => contacts.find(contact => contact.id === selectedContactId) ?? null,
    [contacts, selectedContactId]
  )

  useEffect(() => {
    if (!selectedContactId) return

    const timeoutId = setTimeout(() => {
      const node = scrollRef.current?.querySelector<HTMLDivElement>(`[data-contact-card="${selectedContactId}"]`)

      if (!node) {
        const contactIndex = contacts.findIndex(c => c.id === selectedContactId)
        if (contactIndex !== -1 && contactIndex >= visibleCount) {
          setVisibleCount(contactIndex + 20)
          setTimeout(() => {
            const retryNode = scrollRef.current?.querySelector<HTMLDivElement>(`[data-contact-card="${selectedContactId}"]`)
            retryNode?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 200)
        }
        return
      }

      const container = scrollRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const nodeRect = node.getBoundingClientRect()

      const isVisible =
        nodeRect.top >= containerRect.top &&
        nodeRect.bottom <= containerRect.bottom

      if (!isVisible) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [selectedContactId, visibleCount, contacts])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      if (scrollHeight - scrollTop - clientHeight < 500 && visibleCount < contacts.length) {
        setVisibleCount(prev => Math.min(prev + 20, contacts.length))
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [visibleCount, contacts.length])

  return (
    <div className="flex h-full w-full gap-4 overflow-hidden flex-col lg:flex-row">
      <div className="flex w-full lg:w-[320px] xl:w-[360px] 2xl:w-[420px] flex-col rounded-xl border bg-card/70 backdrop-blur-sm shadow-sm max-h-[300px] lg:max-h-none">
        <div className="border-b px-4 py-2.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Contacts</h2>
            <p className="text-xs text-muted-foreground/70">
              {contacts.length} contact{contacts.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              className="pl-9 h-8"
            />
          </div>
        </div>
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="space-y-1.5 p-3">
            {displayedContacts.map((contact) => {
              const isSelected = contact.id === selectedContactId
              const badgeClasses = getStatusBadgeClasses(contact.status)
              const reminderLabel = contact.reminder?.label
              const rdvLabel = contact.rdv?.label
              const lastCallLabel = contact.lastCall?.label

              return (
                <Card
                  key={contact.id}
                  data-contact-card={contact.id}
                  className={cn(
                    "overflow-hidden rounded-lg border bg-card/80 transition-all duration-200 cursor-pointer",
                    isSelected ? "border-primary shadow-sm" : "hover:border-primary/40"
                  )}
                  onClick={() => onSelectContact(contact)}
                >
                  <CardHeader className="p-0 px-3 py-1.5 flex flex-row items-center gap-2 space-y-0">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <Avatar className="h-7 w-7 border">
                        <AvatarFallback className="text-xs">
                          {getInitials(contact.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <CardTitle className="truncate text-xs font-semibold text-foreground leading-tight">
                          {contact.fullName}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5 truncate">
                            <Phone className="h-2.5 w-2.5" aria-hidden="true" />
                            {contact.telephone || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-full px-1.5 py-0 text-[9px] font-medium capitalize shrink-0",
                        badgeClasses
                      )}
                    >
                      {contact.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-0 px-3 pb-1.5 pt-0 flex items-center justify-between text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-3">
                      {reminderLabel && (
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-2.5 w-2.5 text-orange-500" aria-hidden="true" />
                          <span className="text-foreground">{reminderLabel}</span>
                        </div>
                      )}
                      {rdvLabel && (
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-2.5 w-2.5 text-blue-500" aria-hidden="true" />
                          <span className="text-foreground">{rdvLabel}</span>
                        </div>
                      )}
                      {lastCallLabel && (
                        <div className="flex items-center gap-1">
                          <PhoneCall className="h-2.5 w-2.5 text-emerald-500" aria-hidden="true" />
                          <span className="text-foreground">{lastCallLabel}</span>
                        </div>
                      )}
                    </div>
                    {contact.email && (
                      <span className="text-[9px] text-muted-foreground/60 truncate max-w-[100px]">
                        {contact.email.split('@')[1] || contact.email}
                      </span>
                    )}
                  </CardContent>
                </Card>
              )
            })}
            {contacts.length > visibleCount && (
              <Button
                variant="ghost"
                className="w-full text-xs"
                onClick={() => setVisibleCount((prev) => Math.min(prev + 40, contacts.length))}
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
                      {getInitials(selectedContact.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold leading-tight text-foreground">
                      {selectedContact.fullName}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {selectedContact.email && <span>{selectedContact.email}</span>}
                      {selectedContact.email && selectedContact.telephone && <span className="text-muted-foreground/50">•</span>}
                      {selectedContact.telephone && <span>{selectedContact.telephone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-md border bg-transparent px-3 py-2 whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 w-fit text-xs flex items-center justify-center min-w-[160px]"
                    disabled
                  >
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      {selectedContact.status}
                    </div>
                  </Button>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      size="icon"
                      disabled
                      className="size-10 rounded-full transition-all duration-200 hover:scale-105 bg-green-500 hover:bg-green-600 text-white shadow-lg focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Appeler"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      disabled
                      className="size-10 rounded-full transition-all duration-200 hover:scale-105 border-2 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="SMS"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      disabled
                      className="size-10 rounded-full transition-all duration-200 hover:scale-105 border-2 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Email"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      disabled
                      className="size-10 rounded-full transition-all duration-200 hover:scale-105 border-2 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Qualification"
                    >
                      <FileCheck className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      disabled
                      className="size-10 rounded-full transition-all duration-200 hover:scale-105 border-2 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Rappel"
                    >
                      <Bell className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      disabled
                      className="size-10 rounded-full transition-all duration-200 hover:scale-105 border-2 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Rendez-vous"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      disabled
                      className="size-10 rounded-full transition-all duration-200 hover:scale-105 border-2 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Cal.com"
                    >
                      <CalendarSearch className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-b bg-card/70 px-6 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 bg-[#0A66C2] hover:bg-[#004182] text-white border-[#0A66C2]" disabled>
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 bg-[#4285F4] hover:bg-[#357AE8] text-white border-[#4285F4]" disabled>
                  <Globe className="h-4 w-4" /> Google
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 px-3"
                  disabled
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
                          <Label>Prénom</Label>
                          <Input value={selectedContact.prenom || ''} readOnly aria-readonly />
                        </div>
                        <div className="space-y-2">
                          <Label>Nom</Label>
                          <Input value={selectedContact.nom || ''} readOnly aria-readonly />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Téléphone</Label>
                          <Input value={selectedContact.telephone || ''} readOnly aria-readonly />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input value={selectedContact.email || ''} readOnly aria-readonly />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Statut</Label>
                        <Badge className={cn("w-fit", getStatusBadgeClasses(selectedContact.status))}>
                          {selectedContact.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={selectedContact.commentaire || ''}
                          readOnly
                          aria-readonly
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
                        <div className="space-y-2">
                          <Label>Date de rappel</Label>
                          <Input value={selectedContact.reminder?.date || ''} readOnly aria-readonly />
                        </div>
                        <div className="space-y-2">
                          <Label>Heure de rappel</Label>
                          <Input value={selectedContact.reminder?.time || ''} readOnly aria-readonly />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date de RDV</Label>
                          <Input value={selectedContact.rdv?.date || ''} readOnly aria-readonly />
                        </div>
                        <div className="space-y-2">
                          <Label>Heure de RDV</Label>
                          <Input value={selectedContact.rdv?.time || ''} readOnly aria-readonly />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date d'appel</Label>
                          <Input value={selectedContact.lastCall?.date || ''} readOnly aria-readonly />
                        </div>
                        <div className="space-y-2">
                          <Label>Heure d'appel</Label>
                          <Input value={selectedContact.lastCall?.time || ''} readOnly aria-readonly />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Durée d'appel</Label>
                        <Input value={selectedContact.lastCall?.duration || ''} readOnly aria-readonly />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Historique</h3>
                    <Separator className="my-2" />
                    {selectedContact.history.length > 0 ? (
                      <div className="space-y-3">
                        {selectedContact.history.map(item => (
                          <HistoryCard key={item.id} item={item} />
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
            <div className="text-sm font-medium">Sélectionnez un contact dans la colonne de gauche</div>
            <p className="text-xs text-muted-foreground/80">
              Les informations détaillées s’afficheront ici.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
