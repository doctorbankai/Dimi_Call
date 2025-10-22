import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Phone } from 'lucide-react'
import { ContactStatus } from '@/types'
import { STATUS_COLORS } from '@/constants'

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
  history: any[]
  events: any[]
  lastUpdatedAt?: string | null
  lastUpdatedLabel?: string
  totalEvents: number
  numeroLigne: number
}

interface ContactCardProps {
  contact: DirectoryContact
  isSelected: boolean
  onClick: () => void
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

export const ContactCard = React.memo<ContactCardProps>(
  ({ contact, isSelected, onClick }) => {
    const badgeClasses = getStatusBadgeClasses(contact.status)

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
      }
    }

    return (
      <Card
        role="button"
        tabIndex={0}
        aria-label={`Contact ${contact.fullName}, ${contact.telephone}, statut ${contact.status}`}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'group relative overflow-hidden rounded-lg border bg-card/80 transition-all duration-200 cursor-pointer',
          'h-[180px] flex flex-col',
          'hover:shadow-lg hover:-translate-y-0.5',
          isSelected ? 'border-primary shadow-md ring-2 ring-primary/20' : 'hover:border-primary/40'
        )}
      >
        <CardContent className="p-4 flex flex-col h-full items-center justify-center">
          {/* Avatar + Nom */}
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-12 w-12 border-2">
              <AvatarFallback className="text-sm font-semibold">
                {getInitials(contact.fullName)}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-semibold text-center line-clamp-1 text-sm leading-tight">
              {contact.fullName}
            </h3>
          </div>

          {/* Téléphone */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
            <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{contact.telephone}</span>
          </div>

          {/* Badge de statut */}
          <Badge
            variant="secondary"
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-medium capitalize mt-3',
              badgeClasses
            )}
          >
            {contact.status}
          </Badge>
        </CardContent>
      </Card>
    )
  }
)

ContactCard.displayName = 'ContactCard'
