import React, { useEffect } from 'react'
import { Linkedin, Globe, ExternalLink, X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Contact } from '../types'

const AUTO_SEARCH_MODE_KEY = 'dimicall-auto-search-mode'

export const saveAutoSearchMode = (mode: string) => {
  try {
    localStorage.setItem(AUTO_SEARCH_MODE_KEY, mode)
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du mode de recherche automatique:', error)
  }
}

export const loadAutoSearchMode = (): 'disabled' | 'linkedin' | 'google' | 'link' => {
  try {
    const saved = localStorage.getItem(AUTO_SEARCH_MODE_KEY)
    if (saved && ['disabled', 'linkedin', 'google', 'link'].includes(saved)) {
      return saved as 'disabled' | 'linkedin' | 'google' | 'link'
    }
  } catch (error) {
    console.error('Erreur lors du chargement du mode de recherche automatique:', error)
  }
  return 'disabled'
}

interface AutoSearchDropdownProps {
  selectedContact: Contact | null
  onLinkedInSearch: () => void
  onGoogleSearch: () => void
  onDirectLink: () => void
  autoSearchMode: 'disabled' | 'linkedin' | 'google' | 'link'
  onAutoSearchModeChange: (mode: 'disabled' | 'linkedin' | 'google' | 'link') => void
}

export const AutoSearchDropdown: React.FC<AutoSearchDropdownProps> = ({
  selectedContact,
  onLinkedInSearch,
  onGoogleSearch,
  onDirectLink,
  autoSearchMode,
  onAutoSearchModeChange,
}) => {
  const hasLink = !!selectedContact?.lien

  // Sauvegarder le mode automatique lors du changement
  useEffect(() => {
    saveAutoSearchMode(autoSearchMode)
  }, [autoSearchMode])

  // Déclenchement automatique lors du changement de contact
  useEffect(() => {
    if (!selectedContact || autoSearchMode === 'disabled') return

    // Petit délai pour éviter les appels multiples
    const timeoutId = setTimeout(() => {
      try {
        switch (autoSearchMode) {
          case 'linkedin':
            if (selectedContact.prenom || selectedContact.nom) {
              onLinkedInSearch()
            }
            break
          case 'google':
            if (selectedContact.prenom || selectedContact.nom) {
              onGoogleSearch()
            }
            break
          case 'link':
            if (selectedContact.lien) {
              onDirectLink()
            }
            break
        }
      } catch (error) {
        console.error('Erreur lors de la recherche automatique:', error)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [selectedContact?.id, autoSearchMode])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" title="Recherche automatique">
          <Search className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Recherche rapide</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLinkedInSearch}>
          <Linkedin className="mr-2 h-4 w-4 text-blue-500" />
          <span>LinkedIn</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onGoogleSearch}>
          <Globe className="mr-2 h-4 w-4 text-green-500" />
          <span>Google</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDirectLink} disabled={!hasLink}>
          <ExternalLink className="mr-2 h-4 w-4 text-purple-500" />
          <span>Lien direct</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Mode automatique</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={autoSearchMode} onValueChange={(value) => onAutoSearchModeChange(value as any)}>
          <DropdownMenuRadioItem value="disabled">
            <X className="mr-2 h-4 w-4" />
            <span>Désactivé</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="linkedin">
            <Linkedin className="mr-2 h-4 w-4 text-blue-500" />
            <span>LinkedIn</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="google">
            <Globe className="mr-2 h-4 w-4 text-green-500" />
            <span>Google</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="link">
            <ExternalLink className="mr-2 h-4 w-4 text-purple-500" />
            <span>Lien</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
