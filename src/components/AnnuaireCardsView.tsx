import React, { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bell, Clock, History, Phone, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { StatusEventRecord } from '@/types/statusEvent'

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

const getStatusColor = (status: string): string => {
  const key = status
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
  
  if (key.startsWith('nondefin')) {
    return 'bg-gray-200 text-gray-700 dark:bg-neutral-700 dark:text-neutral-300'
  }
  if (key.includes('mauvais')) {
    return 'bg-red-200 text-red-700 dark:bg-red-600 dark:text-red-100'
  }
  if (key.includes('repondeur')) {
    return 'bg-orange-200 text-orange-700 dark:bg-orange-600 dark:text-orange-100'
  }
  if (key.includes('rappeler')) {
    return 'bg-yellow-200 text-yellow-700 dark:bg-yellow-600 dark:text-yellow-100'
  }
  if (key.includes('pasinter')) {
    return 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-100'
  }
  if (key.includes('argument')) {
    return 'bg-blue-200 text-blue-700 dark:bg-blue-600 dark:text-blue-100'
  }
  if (key === 'do' || key === 'ro') {
    return 'bg-green-200 text-green-700 dark:bg-green-600 dark:text-green-100'
  }
  if (key.includes('listenoi')) {
    return 'bg-red-200 text-red-700 dark:bg-red-600 dark:text-red-100'
  }
  if (key.includes('prematur')) {
    return 'bg-purple-200 text-purple-700 dark:bg-purple-600 dark:text-purple-100'
  }
  if (key === 'a0') {
    return 'bg-indigo-200 text-indigo-700 dark:bg-indigo-600 dark:text-indigo-100'
  }
  return 'bg-gray-200 text-gray-700 dark:bg-neutral-700 dark:text-neutral-300'
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
}

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

  // Scroll automatique vers le contact sélectionné
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
            if (retryNode) {
              retryNode.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
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

  // Charger plus de contacts au scroll
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
      {/* Liste des contacts */}
      <div className="flex w-full lg:w-[320px] xl:w-[360px] 2xl:w-[420px] flex-col rounded-xl border bg-card/70 backdrop-blur-sm shadow-sm max-h-[300px] lg:max-h-none">
        <div className="border-b px-4 py-2.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Contacts</h2>
            <p className="text-xs text-muted-foreground/70">{contacts.length} contacts</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              className="pl-9 h-8"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="space-y-1.5 p-3">
            {displayedContacts.map((contact) => (
              <Card
                key={contact.id}
                data-contact-card={contact.id}
                className={cn(
                  "text-card-foreground flex flex-col gap-6 py-6 overflow-hidden rounded-lg border bg-card/80 transition-all duration-200 cursor-pointer",
                  selectedContactId === contact.id
                    ? "border-primary shadow-sm"
                    : "shadow-sm hover:border-primary/40"
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
                      <div className="truncate text-xs font-semibold text-foreground leading-tight">
                        {contact.fullName}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5 truncate">
                          <Phone className="h-2.5 w-2.5" aria-hidden="true" />
                          {contact.telephone}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "rounded-full px-1.5 py-0 text-[9px] font-medium capitalize shrink-0",
                      getStatusColor(contact.status)
                    )}
                  >
                    {contact.status}
                  </Badge>
                </CardHeader>
                <CardContent className="p-0 px-3 pb-1.5 pt-0 flex items-center justify-between text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-3">
                    {/* Placeholder pour d'autres infos si nécessaire */}
                  </div>
                  <span className="text-[9px] text-muted-foreground/60 truncate max-w-[100px]">
                    {contact.email?.split('@')[1] || ''}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Détails du contact */}
      <div className="flex-1 overflow-hidden">
        {selectedContactId && contacts.find(c => c.id === selectedContactId) ? (
          <ContactDetails contact={contacts.find(c => c.id === selectedContactId)!} />
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm">
            <p className="text-muted-foreground">Sélectionnez un contact pour voir les détails</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Composant pour afficher les détails d'un contact
const ContactDetails: React.FC<{ contact: DirectoryContact }> = ({ contact }) => {
  return (
    <div className="flex h-full flex-col rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm">
      <div className="border-b px-6 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border">
              <AvatarFallback>
                {getInitials(contact.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold leading-tight text-foreground">
                {contact.fullName}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {contact.email && <span>{contact.email}</span>}
                {contact.email && <span className="text-muted-foreground/50">•</span>}
                <span>{contact.telephone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="grid gap-4 px-6 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Informations principales</h3>
              <div className="my-2 h-px w-full bg-border" />
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prénom</label>
                    <div className="text-sm text-foreground">{contact.prenom || '—'}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nom</label>
                    <div className="text-sm text-foreground">{contact.nom || '—'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Téléphone</label>
                    <div className="text-sm text-foreground">{contact.telephone}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <div className="text-sm text-foreground">{contact.email || '—'}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Statut</label>
                  <Badge className={cn("w-fit", getStatusColor(contact.status))}>
                    {contact.status}
                  </Badge>
                </div>
                {contact.commentaire && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes</label>
                    <div className="text-sm text-muted-foreground">{contact.commentaire}</div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Rappels & Rendez-vous</h3>
              <div className="my-2 h-px w-full bg-border" />
              <div className="space-y-3 text-xs text-muted-foreground">
                {contact.reminder && (
                  <div className="flex items-center gap-1">
                    <Bell className="h-3 w-3" aria-hidden="true" />
                    <span>Rappel : {contact.reminder.label}</span>
                  </div>
                )}
                {contact.rdv && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span>RDV : {contact.rdv.label}</span>
                  </div>
                )}
                {contact.lastCall && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" aria-hidden="true" />
                    <span>Dernier appel : {contact.lastCall.label}</span>
                  </div>
                )}
                {!contact.reminder && !contact.rdv && !contact.lastCall && (
                  <p className="text-xs text-muted-foreground">Aucun événement enregistré.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Historique</h3>
              <div className="my-2 h-px w-full bg-border" />
              {contact.totalEvents > 0 ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <History className="h-3 w-3" aria-hidden="true" />
                  <span>{contact.totalEvents} événement{contact.totalEvents > 1 ? 's' : ''}</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Aucun historique enregistré.</p>
              )}
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  )
}
