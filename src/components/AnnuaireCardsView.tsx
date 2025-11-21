import React, { useState, useCallback, useMemo, useEffect } from "react"
import type { StatusEventRecord } from '@/types/statusEvent'
import { ContactCardsGrid } from './contacts/ContactCardsGrid'
import { ContactDetailSheet } from './contacts/ContactDetailSheet'

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
  onCall?: () => void
  onSms?: () => void
  onEmail?: () => void
  onQualification?: () => void
  onReminder?: () => void
  onRDV?: () => void
  onCalCom?: () => void
  onLinkedIn?: () => void
  onGoogle?: () => void
  onDirectLink?: () => void
}

export const AnnuaireCardsView: React.FC<AnnuaireCardsViewProps> = ({
  contacts,
  selectedContactId,
  onSelectContact,
  onCall,
  onSms,
  onEmail,
  onQualification,
  onReminder,
  onRDV,
  onCalCom,
  onLinkedIn,
  onGoogle,
  onDirectLink,
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const selectedContact = useMemo(
    () => contacts.find(contact => contact.id === selectedContactId) ?? null,
    [contacts, selectedContactId]
  )

  useEffect(() => {
    if (selectedContactId && selectedContact) {
      setIsSheetOpen(true)
    }
    if (!selectedContactId) {
      setIsSheetOpen(false)
    }
  }, [selectedContactId, selectedContact])

  const handleSelectContact = useCallback((id: string) => {
    const contact = contacts.find(c => c.id === id)
    if (contact) {
      onSelectContact(contact)
      setIsSheetOpen(true)
    }
  }, [contacts, onSelectContact])

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setIsSheetOpen(open)
    if (!open) {
      onSelectContact(null)
    }
  }, [onSelectContact])

  return (
    <div className="flex h-full w-full overflow-hidden">
      <ContactCardsGrid
        contacts={contacts}
        selectedId={selectedContactId}
        onSelectContact={handleSelectContact}
      />

      <ContactDetailSheet
        contact={selectedContact}
        open={isSheetOpen}
        onOpenChange={handleSheetOpenChange}
        onCall={onCall}
        onSms={onSms}
        onEmail={onEmail}
        onQualification={onQualification}
        onReminder={onReminder}
        onRDV={onRDV}
        onCalCom={onCalCom}
        onLinkedIn={onLinkedIn}
        onGoogle={onGoogle}
        onDirectLink={onDirectLink}
      />
    </div>
  )
}
