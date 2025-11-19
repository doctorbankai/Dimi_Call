import React from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import SearchInput from '@/components/SearchInput'
import HeaderActions from '@/components/HeaderActions'
import { Theme, Contact } from '@/types'
import GlobalCommand from '@/components/GlobalCommand'

type MainHeaderProps = {
  theme: Theme
  onToggleTheme: () => void
  onOpenSettings: () => void
  updateDownloaded?: boolean
  adbConnected?: boolean
  contacts?: Contact[]
  onPickContact?: (c: Contact) => void
  onNavigate?: (mode: 'appels-cards' | 'calendar-2' | 'graph' | 'db' | 'annuaire' | 'files') => void
  onOpenAnnuaireContact?: (id?: string, name?: string) => void
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  theme,
  onToggleTheme,
  onOpenSettings,
  updateDownloaded,
  adbConnected,
  contacts = [],
  onPickContact,
  onNavigate,
  onOpenAnnuaireContact,
}) => {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <header className="bg-background/40 sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b backdrop-blur-md transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2">
        <SidebarTrigger className="size-9" />
        <Separator orientation="vertical" className="mx-2 h-4" />

        <div className="lg:flex-1">
          <div className="relative hidden max-w-sm flex-1 lg:block">
            <SearchInput placeholder="Search..." onOpenCommand={() => setOpen(true)} />
          </div>
        </div>

        <HeaderActions
          theme={theme}
          onToggleTheme={onToggleTheme}
          onOpenSettings={onOpenSettings}
          updateDownloaded={updateDownloaded}
          adbConnected={adbConnected}
          onNavigate={onNavigate}
          onOpenAnnuaireContact={onOpenAnnuaireContact}
        />
      </div>
      <GlobalCommand
        open={open}
        onOpenChange={setOpen}
        contacts={contacts}
        onPickContact={(c) => {
          onNavigate?.('appels-cards')
          onPickContact?.(c)
          setOpen(false)
        }}
        onNavigate={(mode) => {
          onNavigate?.(mode)
          setOpen(false)
        }}
        onOpenSettings={() => {
          onOpenSettings()
          setOpen(false)
        }}
        onToggleTheme={() => {
          onToggleTheme()
          setOpen(false)
        }}
        theme={theme}
      />
    </header>
  )
}

export default MainHeader
