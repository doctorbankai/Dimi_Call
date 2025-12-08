import React, { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sun, Moon, DownloadCloud, Smartphone, AlertCircle, RefreshCcw, HelpCircle, BookOpen, MailQuestion, Wrench } from 'lucide-react'
import { useSupabaseAuth } from '@/lib/auth-client'
import { CallMode, Theme } from '@/types'
import { NotificationCenterButton } from '@/components/notifications/NotificationCenter'
import { BetaPreferences, UpdateState } from '@/types/update'
import { AdbConnectionState } from '@/services/adbService'
import { cn } from '@/lib/utils'
import { useCallMode } from '@/context/ModeContext'
import packageJson from '../../package.json'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'

type HeaderActionsProps = {
  theme: Theme
  onToggleTheme: () => void
  onOpenSettings: () => void
  updateDownloaded?: boolean
  adbConnected?: boolean
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
  onOpenHelp?: () => void
  onOpenSupport?: () => void
  onOpenTroubleshoot?: () => void
}

export const HeaderActions: React.FC<HeaderActionsProps> = ({
  theme,
  onToggleTheme,
  onOpenSettings,
  updateDownloaded = false,
  adbConnected = false,
  onNavigate,
  onOpenAnnuaireContact,
  updateState,
  onUpdateClick,
  onUpdateConfirmationOpen,
  betaPreferences,
  isUpdateEnabled,
  adbConnectionState,
  adbConnecting = false,
  onAdbClick,
  onOpenHelp,
  onOpenSupport,
  onOpenTroubleshoot,
}) => {
  const auth = useSupabaseAuth()
  const email = auth.user?.email || 'user'
  const { mode, setMode } = useCallMode()
  const modeLabel = mode === CallMode.Apporteur ? 'Apporteur' : 'Client'
  const [shockwaveId, setShockwaveId] = React.useState(0)
  const handleModeToggle = (checked: boolean) => {
    const next = checked ? CallMode.Apporteur : CallMode.Client
    setMode(next)
    if (checked) setShockwaveId((id) => id + 1)
  }

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

  const isElectron = typeof window !== 'undefined' && Boolean((window as any).electronAPI)
  const effectiveUpdateState: UpdateState = updateState ?? {
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    error: null,
    progress: 0,
    updateInfo: null,
    enabled: true,
  }
  const updatesAllowed = (isUpdateEnabled ?? effectiveUpdateState.enabled ?? true) && !effectiveUpdateState.error
  const normalizedVersion = (packageJson?.version ?? '').toLowerCase()
  const isBetaBuild = /\b(beta|alpha|rc|preview|canary)\b/.test(normalizedVersion)
  const showBetaBadge = Boolean(betaPreferences?.enabled) || isBetaBuild

  const updateBadgeLabel = useMemo(() => {
    if (!updatesAllowed) return null
    if (effectiveUpdateState.checking) return 'MAJ...'
    if (effectiveUpdateState.downloading) {
      const progress = Math.max(0, Math.min(100, Math.round(effectiveUpdateState.progress ?? 0)))
      return `${progress}%`
    }
    if (effectiveUpdateState.downloaded) return 'Mettre à jour'
    if (effectiveUpdateState.available) return 'MAJ'
    return null
  }, [effectiveUpdateState, updatesAllowed])

  const updateBadgeIntent = effectiveUpdateState.downloaded
    ? 'ready'
    : effectiveUpdateState.downloading
      ? 'progress'
      : effectiveUpdateState.checking
        ? 'checking'
        : 'idle'

  const canInteractWithUpdate = Boolean(
    (effectiveUpdateState.downloaded && onUpdateConfirmationOpen) || onUpdateClick
  )

  const handleUpdateBadgeClick = () => {
    if (!canInteractWithUpdate) return
    if (effectiveUpdateState.downloaded && onUpdateConfirmationOpen) {
      onUpdateConfirmationOpen()
      return
    }
    onUpdateClick?.()
  }

  const renderUpdateBadge = () => {
    if (!updateBadgeLabel || !isElectron) return null

    const palette = {
      ready: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-100',
      progress: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-100',
      checking: 'bg-sky-500/10 text-sky-700 border-sky-200 dark:text-sky-100',
      idle: 'bg-muted text-muted-foreground border-transparent',
    } as const

    const intent = palette[updateBadgeIntent as keyof typeof palette]
    const iconColor =
      updateBadgeIntent === 'ready'
        ? 'text-emerald-700 dark:text-emerald-200'
        : updateBadgeIntent === 'progress'
          ? 'text-amber-700 dark:text-amber-200'
          : updateBadgeIntent === 'checking'
            ? 'text-sky-700 dark:text-sky-200'
            : 'text-muted-foreground'

    return (
      <button
        type="button"
        onClick={handleUpdateBadgeClick}
        disabled={!canInteractWithUpdate}
        aria-label="Statut des mises à jour"
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-tight transition-colors focus-visible:outline-none disabled:opacity-60',
          intent
        )}
        title={
          effectiveUpdateState.downloaded
            ? 'Nouvelle version téléchargée - cliquer pour installer'
            : effectiveUpdateState.downloading
              ? 'Téléchargement de la mise à jour'
              : effectiveUpdateState.checking
                ? 'Recherche de mises à jour'
                : 'Mise à jour disponible'
        }
      >
        {effectiveUpdateState.downloading || effectiveUpdateState.checking ? (
          <Spinner className={cn('size-3.5', iconColor)} />
        ) : (
          <DownloadCloud className={cn('w-3.5 h-3.5', iconColor)} />
        )}
        <span className="tracking-wide">{updateBadgeLabel}</span>
        {effectiveUpdateState.downloading && (
          <span className="text-[11px] font-medium text-muted-foreground">
            {Math.round(effectiveUpdateState.progress ?? 0)}%
          </span>
        )}
      </button>
    )
  }

  const adbState = adbConnectionState
  const adbPalette = adbState?.isConnected
    ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-100'
    : 'bg-rose-500/10 text-rose-700 border-rose-200 dark:text-rose-100'

  const renderAdbBadge = () => {
    if (!adbState || !isElectron) return null

    const adbBadgeText = adbState.isConnected
      ? 'ADB connecté'
      : adbConnecting
        ? 'Connexion ADB...'
        : 'ADB déconnecté'

    const adbBadgeTitle = adbState.isConnected
      ? `Appareil Android prêt${adbState.device?.name ? ` (${adbState.device.name})` : ''}`
      : adbConnecting
        ? 'Connexion ADB en cours'
        : adbState.error ?? 'Aucun appareil ADB détecté'

    return (
      <button
        type="button"
        onClick={onAdbClick}
        disabled={!onAdbClick}
        aria-label="Statut ADB"
        title={adbBadgeTitle}
        className="focus-visible:outline-none disabled:opacity-60"
      >
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors',
            adbPalette,
            adbConnecting && 'animate-pulse'
          )}
        >
          {adbConnecting ? (
            <RefreshCcw className={cn('w-3.5 h-3.5', !adbState.isConnected && 'text-rose-600')} />
          ) : adbState.isConnected ? (
            <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-200" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-200" />
          )}
          <span className="tracking-wide">{adbBadgeText}</span>
          {adbState.isConnected && typeof adbState.batteryLevel === 'number' && (
            <span className="text-[11px] font-medium text-muted-foreground">
              {adbState.batteryLevel}%
            </span>
          )}
        </span>
      </button>
    )
  }

  return (
    <div className="ml-auto flex items-center gap-2">
      <div className="hidden items-center gap-2 md:flex">
        {showBetaBadge && (
          <span className="inline-flex items-center gap-1 rounded-full border border-purple-300/70 bg-purple-600/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-purple-700 dark:text-purple-100">
            Beta
          </span>
        )}
        {renderUpdateBadge()}
        {renderAdbBadge()}
      </div>
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {shockwaveId > 0 && mode === CallMode.Apporteur && (
              <motion.div
                key={shockwaveId}
                className="pointer-events-none fixed inset-0 z-[99998]"
                initial={{ scale: 0.2, opacity: 0.35 }}
                animate={{ scale: 4.2, opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  background:
                    'radial-gradient(circle at center, rgba(236,72,153,0.55) 0%, rgba(168,85,247,0.35) 35%, rgba(34,211,238,0.35) 55%, transparent 70%)',
                  transformOrigin: 'center center',
                  willChange: 'transform, opacity',
                }}
              />
            )}
          </AnimatePresence>,
          document.body
        )}
      <div
        className="relative flex items-center gap-2 rounded-full border border-border/70 bg-white px-3 py-1 shadow-sm dark:border-border/60 dark:bg-neutral-900"
        aria-label={`Mode actuel : ${modeLabel}`}
      >
        <span className="text-xs sm:text-sm text-muted-foreground">Mode :</span>
        <Badge
          variant={mode === CallMode.Apporteur ? 'default' : 'secondary'}
          className={
            mode === CallMode.Apporteur
              ? 'text-[11px] sm:text-xs px-2 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-400 text-white border-0 shadow-[0_0_12px_rgba(236,72,153,0.35)]'
              : 'text-[11px] sm:text-xs px-2'
          }
        >
          {modeLabel}
        </Badge>
        <Switch
          checked={mode === CallMode.Apporteur}
          onCheckedChange={handleModeToggle}
          aria-label="Changer le mode d'appel"
          className={
            mode === CallMode.Apporteur
              ? 'scale-75 sm:scale-100 data-[state=checked]:bg-[linear-gradient(90deg,#ec4899,#a855f7,#22d3ee)] data-[state=unchecked]:bg-[linear-gradient(90deg,#e5e7eb,#d1d5db,#e5e7eb)] shadow-[0_0_10px_rgba(168,85,247,0.35)] border-transparent'
              : 'scale-75 sm:scale-100'
          }
        />
      </div>
      <NotificationCenterButton
        onNavigateToCalendar={() => onNavigate?.('calendar-2')}
        onNavigateToAnnuaire={(id, name) => {
          if (onOpenAnnuaireContact) {
            onOpenAnnuaireContact(id, name)
          } else {
            onNavigate?.('annuaire')
          }
        }}
        updateDownloaded={updateDownloaded}
        adbConnected={adbConnected}
      />

      <Button
        variant="ghost"
        size="icon"
        className="text-foreground hover:bg-muted/60"
        onClick={onToggleTheme}
        aria-label="Toggle theme"
      >
        {theme === Theme.Dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        <span className="sr-only">Toggle theme</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground hover:bg-muted/60"
            aria-label="Aide"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => onOpenHelp?.()}>
            <BookOpen className="h-4 w-4" />
            <span>Documentation</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onOpenTroubleshoot?.()}>
            <Wrench className="h-4 w-4" />
            <span>Dépannage</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onOpenSupport?.()}>
            <MailQuestion className="h-4 w-4" />
            <span>Contacter le support</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-2 h-4" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="relative flex size-8 shrink-0 overflow-hidden rounded-full" aria-label="User menu">
            <img alt={email} src={avatarSvg} className="aspect-square size-full" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-1">
          <DropdownMenuLabel className="flex items-center gap-3 rounded-md px-3 py-2">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initials}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{email}</span>
              <span className="text-xs text-muted-foreground">Compte connecté</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onOpenSettings}>Paramètres</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => auth.signOut?.()}>
            Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default HeaderActions
