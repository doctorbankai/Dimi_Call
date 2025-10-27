import React from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Bell, Settings, Sun, Moon } from 'lucide-react'
import { useSupabaseAuth } from '@/lib/auth-client'
import { Theme } from '@/types'

type HeaderActionsProps = {
  theme: Theme
  onToggleTheme: () => void
  onOpenSettings: () => void
  updateDownloaded?: boolean
  adbConnected?: boolean
}

export const HeaderActions: React.FC<HeaderActionsProps> = ({
  theme,
  onToggleTheme,
  onOpenSettings,
  updateDownloaded = false,
  adbConnected = false,
}) => {
  const auth = useSupabaseAuth()
  const email = auth.user?.email || 'user'

  // Build simple initials-based avatar data URL
  const initials = (email?.split('@')[0] || 'U')
    .split(/[._-]/)
    .map((s) => s.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)

  const avatarSvg = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'>
      <circle cx='16' cy='16' r='16' fill='#6366f1' />
      <text x='16' y='21' text-anchor='middle' font-family='Inter,Arial' font-size='12' fill='white' font-weight='600'>${initials}</text>
    </svg>`
  )}`

  return (
    <div className="ml-auto flex items-center gap-2">
      <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
        <Bell className="h-4 w-4" />
        {updateDownloaded && (
          <span className="bg-destructive absolute end-0 top-0 block size-2 shrink-0 rounded-full" />
        )}
        {adbConnected && (
          <span className="absolute -bottom-0.5 -right-0.5 block size-2 shrink-0 rounded-full bg-green-500" />
        )}
      </Button>

      <Button variant="ghost" size="icon" onClick={onToggleTheme} aria-label="Toggle theme">
        {theme === Theme.Dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        <span className="sr-only">Toggle theme</span>
      </Button>

      <Button variant="ghost" size="icon" onClick={onOpenSettings} aria-label="Settings">
        <Settings className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-2 h-4" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="relative flex size-8 shrink-0 overflow-hidden rounded-full" aria-label="User menu">
            <img alt={email} src={avatarSvg} className="aspect-square size-full" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled>{email}</DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenSettings}>Paramètres</DropdownMenuItem>
          <DropdownMenuItem onClick={() => auth.signOut?.()}>Déconnexion</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default HeaderActions
