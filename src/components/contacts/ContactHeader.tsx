import React from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DialogTitle } from '@/components/ui/dialog'
import { Phone, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
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

interface ContactHeaderProps {
  contact: DirectoryContact
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

export const ContactHeader: React.FC<ContactHeaderProps> = ({ contact }) => {
  const badgeClasses = getStatusBadgeClasses(contact.status)

  return (
    <div className="flex items-start gap-4">
      <Avatar className="h-16 w-16 border-2">
        <AvatarFallback className="text-lg font-semibold">
          {getInitials(contact.fullName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <DialogTitle className="text-2xl">{contact.fullName}</DialogTitle>
        <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" />
            {contact.telephone}
          </span>
          {contact.email && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {contact.email}
              </span>
            </>
          )}
        </div>
        <Badge
          variant="secondary"
          className={cn(
            'mt-2 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
            badgeClasses
          )}
        >
          {contact.status}
        </Badge>
      </div>
    </div>
  )
}
