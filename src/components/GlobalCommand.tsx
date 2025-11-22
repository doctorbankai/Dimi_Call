import * as React from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { Calendar, Phone, BarChart3, BookOpen, Database, Settings, Sun, Moon, Search, Sparkles } from 'lucide-react'
import { Contact } from '@/types'
import { Theme } from '@/types'

type GlobalCommandProps = {
  open: boolean
  onOpenChange: (v: boolean) => void
  theme: Theme
  contacts?: Contact[]
  onPickContact?: (c: Contact) => void
  onNavigate?: (mode: 'appels-cards' | 'calendar-2' | 'graph' | 'db' | 'annuaire' | 'files' | 'prequalification') => void
  onOpenSettings?: () => void
  onToggleTheme?: () => void
}

export const GlobalCommand: React.FC<GlobalCommandProps> = ({
  open,
  onOpenChange,
  theme,
  contacts = [],
  onPickContact,
  onNavigate,
  onOpenSettings,
  onToggleTheme,
}) => {
  // Show all contacts; cmdk handles filtering efficiently for typical sizes
  const topContacts = contacts

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher un contact ou une action..." />
      <CommandList>
        <CommandEmpty>Aucun résultat</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => onNavigate?.('appels-cards')}>
            <Phone className="mr-2 h-4 w-4" />
            <span>Appels</span>
            <CommandShortcut>G A</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => onNavigate?.('prequalification')}>
            <Sparkles className="mr-2 h-4 w-4" />
            <span>Pré-qualification</span>
          </CommandItem>
          <CommandItem onSelect={() => onNavigate?.('calendar-2')}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Calendrier</span>
          </CommandItem>
          <CommandItem onSelect={() => onNavigate?.('graph')}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Graphiques</span>
          </CommandItem>
          <CommandItem onSelect={() => onNavigate?.('annuaire')}>
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Annuaire</span>
          </CommandItem>
          <CommandItem onSelect={() => onNavigate?.('files')}>
            <Database className="mr-2 h-4 w-4" />
            <span>Fichiers</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => onOpenSettings?.()}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Paramètres</span>
            <CommandShortcut>G S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => onToggleTheme?.()}>
            {theme === Theme.Dark ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            <span>Basculer thème</span>
          </CommandItem>
        </CommandGroup>

        {topContacts.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Contacts">
              {topContacts.map((c) => (
                <CommandItem key={c.id} onSelect={() => onPickContact?.(c)}>
                  <Search className="mr-2 h-4 w-4" />
                  <span>
                    {c.prenom || ''} {c.nom || ''} — {c.telephone || ''}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}

export default GlobalCommand
