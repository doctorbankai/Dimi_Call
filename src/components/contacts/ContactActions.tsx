import React from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Phone,
  MessageSquare,
  Mail,
  Bell,
  Calendar,
  FileCheck,
  CalendarSearch,
  Linkedin,
  Globe,
  Eye,
} from 'lucide-react'

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

interface ContactActionsProps {
  contact: DirectoryContact
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
  onClose?: () => void
}

export const ContactActions: React.FC<ContactActionsProps> = ({ 
  contact,
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
  onClose
}) => {
  const handleCall = () => {
    if (onCall) {
      onCall()
    } else {
      // Action par défaut : afficher un message
      alert(`Appel vers ${contact.fullName} au ${contact.telephone}\n\nCette fonctionnalité sera disponible prochainement.`)
    }
  }

  const handleSMS = () => {
    if (onSms) {
      onSms()
    } else {
      alert(`SMS vers ${contact.fullName} au ${contact.telephone}\n\nCette fonctionnalité sera disponible prochainement.`)
    }
  }

  const handleEmail = () => {
    if (onEmail) {
      onEmail()
    } else if (contact.email) {
      alert(`Email vers ${contact.fullName} à ${contact.email}\n\nCette fonctionnalité sera disponible prochainement.`)
    }
  }

  const handleQualification = () => {
    if (onQualification) {
      onQualification()
    } else {
      alert(`Qualification de ${contact.fullName}\n\nCette fonctionnalité sera disponible prochainement.`)
    }
  }

  const handleReminder = () => {
    if (onReminder) {
      onReminder()
    } else {
      alert(`Rappel pour ${contact.fullName}\n\nCette fonctionnalité sera disponible prochainement.`)
    }
  }

  const handleRDV = () => {
    if (onRDV) {
      onRDV()
    } else {
      alert(`Rendez-vous avec ${contact.fullName}\n\nCette fonctionnalité sera disponible prochainement.`)
    }
  }

  const handleCalCom = () => {
    if (onCalCom) {
      onCalCom()
    } else {
      alert(`Cal.com pour ${contact.fullName}\n\nCette fonctionnalité sera disponible prochainement.`)
    }
  }

  const handleLinkedInClick = () => {
    if (onLinkedIn) {
      onLinkedIn()
    } else {
      const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(contact.fullName)}`
      window.open(searchUrl, '_blank')
    }
  }

  const handleGoogleClick = () => {
    if (onGoogle) {
      onGoogle()
    } else {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(contact.fullName)}`
      window.open(searchUrl, '_blank')
    }
  }

  const handleDirectLinkClick = () => {
    if (onDirectLink) {
      onDirectLink()
    } else {
      console.log('Lien direct:', contact.fullName)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Actions principales */}
      <Button
        size="sm"
        onClick={handleCall}
        className="gap-2 bg-green-500 hover:bg-green-600 text-white"
      >
        <Phone className="h-4 w-4" />
        Appeler
      </Button>

      <Button size="sm" variant="outline" onClick={handleSMS} className="gap-2">
        <MessageSquare className="h-4 w-4" />
        SMS
      </Button>

      <Button 
        size="sm" 
        variant="outline" 
        onClick={handleEmail} 
        disabled={!contact.email}
        className="gap-2"
      >
        <Mail className="h-4 w-4" />
        Email
      </Button>

      {/* Actions secondaires */}
      <Button size="sm" variant="outline" onClick={handleQualification} className="gap-2">
        <FileCheck className="h-4 w-4" />
        Qualification
      </Button>

      <Button size="sm" variant="outline" onClick={handleReminder} className="gap-2">
        <Bell className="h-4 w-4" />
        Rappel
      </Button>

      <Button size="sm" variant="outline" onClick={handleRDV} className="gap-2">
        <Calendar className="h-4 w-4" />
        RDV
      </Button>

      <Button size="sm" variant="outline" onClick={handleCalCom} className="gap-2">
        <CalendarSearch className="h-4 w-4" />
        Cal.com
      </Button>

      {/* Séparateur */}
      <Separator orientation="vertical" className="h-8" />

      {/* Recherche externe */}
      <Button
        size="sm"
        variant="outline"
        onClick={handleLinkedInClick}
        className="gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white border-[#0A66C2]"
      >
        <Linkedin className="h-4 w-4" />
        LinkedIn
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={handleGoogleClick}
        className="gap-2 bg-[#4285F4] hover:bg-[#357AE8] text-white border-[#4285F4]"
      >
        <Globe className="h-4 w-4" />
        Google
      </Button>

      <Button size="sm" variant="outline" onClick={handleDirectLinkClick} className="gap-2">
        <Eye className="h-4 w-4" />
        Lien direct
      </Button>
    </div>
  )
}
