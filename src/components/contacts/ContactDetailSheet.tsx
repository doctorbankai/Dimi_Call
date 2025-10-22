import React, { useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContactHeader } from './ContactHeader'
import { ContactActions } from './ContactActions'
import { ContactInfo } from './ContactInfo'
import { ContactHistory } from './ContactHistory'

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

interface ContactDetailSheetProps {
  contact: DirectoryContact | null
  open: boolean
  onOpenChange: (open: boolean) => void
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

export const ContactDetailSheet: React.FC<ContactDetailSheetProps> = ({
  contact,
  open,
  onOpenChange,
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
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Sauvegarder le focus avant l'ouverture
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement
    }
  }, [open])

  // Restaurer le focus à la fermeture
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && previousFocusRef.current) {
      setTimeout(() => {
        previousFocusRef.current?.focus()
      }, 0)
    }
    onOpenChange(newOpen)
  }

  if (!contact) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="!max-w-7xl w-[95vw] max-h-[90vh] overflow-hidden p-0 gap-0 flex flex-col"
        aria-labelledby="contact-dialog-title"
        aria-describedby="contact-dialog-description"
      >
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <ContactHeader contact={contact} />
        </DialogHeader>

        <div className="px-6 py-4 border-b shrink-0">
          <ContactActions 
            contact={contact}
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
            onClose={() => onOpenChange(false)}
          />
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-[500px]">
          <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-6 mt-4 grid w-auto grid-cols-2 shrink-0">
              <TabsTrigger value="info">Informations</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="flex-1 mt-4 overflow-y-auto data-[state=active]:flex data-[state=active]:flex-col min-h-0">
              <div className="px-6 pb-6">
                <ContactInfo contact={contact} />
              </div>
            </TabsContent>

            <TabsContent value="history" className="flex-1 mt-4 overflow-y-auto data-[state=active]:flex data-[state=active]:flex-col min-h-0">
              <div className="px-6 pb-6">
                <ContactHistory history={contact.history} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Description cachée pour l'accessibilité */}
        <span id="contact-dialog-description" className="sr-only">
          Détails complets du contact {contact.fullName} incluant les informations personnelles et l'historique des interactions
        </span>
      </DialogContent>
    </Dialog>
  )
}
