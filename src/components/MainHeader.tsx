import React from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import SearchInput from '@/components/SearchInput'
import HeaderActions from '@/components/HeaderActions'
import { Theme, Contact } from '@/types'
import GlobalCommand from '@/components/GlobalCommand'
import { BetaPreferences } from '@/types/update'
import type { UpdateState } from '@/types/update'
import { AdbConnectionState } from '@/services/adbService'

type MainHeaderProps = {
  theme: Theme
  onToggleTheme: () => void
  onOpenSettings: () => void
  updateDownloaded?: boolean
  adbConnected?: boolean
  contacts?: Contact[]
  onPickContact?: (c: Contact) => void
  onNavigate?: (mode: 'appels-cards' | 'calendar-2' | 'graph' | 'db' | 'annuaire' | 'files' | 'prequalification') => void
  onOpenAnnuaireContact?: (id?: string, name?: string) => void
  updateState?: UpdateState
  onUpdateClick?: () => void
  onUpdateConfirmationOpen?: () => void
  betaPreferences?: BetaPreferences | null
  isUpdateEnabled?: boolean
  adbConnectionState?: AdbConnectionState
  adbConnecting?: boolean
  onAdbClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
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
  updateState,
  onUpdateClick,
  onUpdateConfirmationOpen,
  betaPreferences,
  isUpdateEnabled,
  adbConnectionState,
  adbConnecting,
  onAdbClick,
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
    <header className="bg-background/40 sticky top-0 z-40 flex h-12 sm:h-14 shrink-0 items-center gap-1 sm:gap-2 border-b backdrop-blur-md transition-[width,height] ease-linear min-w-0">
      <div className="flex w-full items-center gap-1 px-2 sm:px-3 md:px-4 lg:gap-2 min-w-0 flex-wrap">
        <SidebarTrigger className="size-8 sm:size-9 shrink-0" />
        <Separator orientation="vertical" className="mx-1 sm:mx-2 h-4 hidden sm:block" />

        <div className="lg:flex-1 min-w-0">
          <div className="relative hidden max-w-sm flex-1 lg:block min-w-0">
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
          updateState={updateState}
          onUpdateClick={onUpdateClick}
          onUpdateConfirmationOpen={onUpdateConfirmationOpen}
          betaPreferences={betaPreferences}
          isUpdateEnabled={isUpdateEnabled}
          adbConnectionState={adbConnectionState}
          adbConnecting={adbConnecting}
          onAdbClick={onAdbClick}
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
