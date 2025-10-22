import React from 'react'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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

interface ContactInfoProps {
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

export const ContactInfo: React.FC<ContactInfoProps> = ({ contact }) => {
  const badgeClasses = getStatusBadgeClasses(contact.status)

  return (
    <div className="space-y-6">
        {/* Informations principales */}
        <section>
          <h3 className="text-sm font-medium mb-3">Informations principales</h3>
          <Separator className="mb-4" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Prénom</Label>
              <Input value={contact.prenom || ''} readOnly aria-readonly />
            </div>
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={contact.nom || ''} readOnly aria-readonly />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={contact.telephone || ''} readOnly aria-readonly />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={contact.email || ''} readOnly aria-readonly />
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <Label>Statut</Label>
            <div>
              <Badge
                variant="secondary"
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                  badgeClasses
                )}
              >
                {contact.status}
              </Badge>
            </div>
          </div>
        </section>

        <Separator />

        {/* Rappels & Rendez-vous */}
        <section>
          <h3 className="text-sm font-medium mb-3">Rappels & Rendez-vous</h3>
          <Separator className="mb-4" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date de rappel</Label>
              <Input value={contact.reminder?.date || ''} readOnly aria-readonly />
            </div>
            <div className="space-y-2">
              <Label>Heure de rappel</Label>
              <Input value={contact.reminder?.time || ''} readOnly aria-readonly />
            </div>
            <div className="space-y-2">
              <Label>Date de RDV</Label>
              <Input value={contact.rdv?.date || ''} readOnly aria-readonly />
            </div>
            <div className="space-y-2">
              <Label>Heure de RDV</Label>
              <Input value={contact.rdv?.time || ''} readOnly aria-readonly />
            </div>
            <div className="space-y-2">
              <Label>Date d'appel</Label>
              <Input value={contact.lastCall?.date || ''} readOnly aria-readonly />
            </div>
            <div className="space-y-2">
              <Label>Heure d'appel</Label>
              <Input value={contact.lastCall?.time || ''} readOnly aria-readonly />
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <Label>Durée d'appel</Label>
            <Input value={contact.lastCall?.duration || ''} readOnly aria-readonly />
          </div>
        </section>

        <Separator />

        {/* Notes */}
        <section>
          <h3 className="text-sm font-medium mb-3">Notes</h3>
          <Separator className="mb-4" />
          <Textarea
            value={contact.commentaire || ''}
            readOnly
            aria-readonly
            rows={4}
            placeholder="Aucune note"
          />
        </section>
      </div>
  )
}
