import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { AlertTriangle, Bell, BellOff, CalendarDays, Clock, Phone, RefreshCcw, Smartphone } from "lucide-react"
import { format, formatDistanceToNow, parseISO } from "date-fns"
import { fr } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

import { useNotificationCenter } from "@/notifications/useNotificationCenter"
import type { NotificationEntry, UseNotificationCenterState } from "@/notifications/types"
import { cn } from "@/lib/utils"

interface NotificationCenterButtonProps {
  onNavigateToCalendar?: () => void
  updateDownloaded?: boolean
  adbConnected?: boolean
}

const CARD_LIST_MAX_HEIGHT = 320

const useStabilizedBoolean = (value: boolean, enterDelay = 150, exitDelay = 400) => {
  const [stabilized, setStabilized] = useState(value)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    if (value) {
      timeoutId = setTimeout(() => setStabilized(true), enterDelay)
    } else {
      timeoutId = setTimeout(() => setStabilized(false), exitDelay)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [value, enterDelay, exitDelay])

  return stabilized
}

const formatDateLabel = (entry: NotificationEntry) => {
  const start = parseISO(entry.startIso)
  const dayLabel = format(start, "EEEE d MMMM", { locale: fr })
  const timeLabel = format(start, "HH:mm")
  return `${dayLabel} • ${timeLabel}`
}

const formatRelativeLabel = (entry: NotificationEntry) => {
  const start = parseISO(entry.startIso)
  return formatDistanceToNow(start, { locale: fr, addSuffix: true })
}

const formatNewCountLabel = (count: number) => {
  if (count <= 0) return "0 nouveau"
  return `${count} ${count > 1 ? "nouveaux" : "nouveau"}`
}

const NotificationSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
    ))}
  </div>
)

const NotificationItem = ({ entry }: { entry: NotificationEntry }) => {
  const isRdv = entry.type === "rdv"
  const meta = entry.event.metadata
  const phoneNumber = meta?.phone
  const comment = meta?.comment

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3",
        isRdv ? "bg-emerald-50/70 dark:bg-emerald-950/30" : "bg-sky-50/70 dark:bg-sky-950/30"
      )}
    >
      <Avatar className="size-10 border-2 border-background shadow-sm">
        <AvatarFallback className={cn(isRdv ? "bg-emerald-600 text-white" : "bg-sky-600 text-white")}>
          {entry.contactInitials || "?"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="truncate font-semibold">{entry.contactName}</div>
          <Badge variant={isRdv ? "default" : "secondary"} className={cn(isRdv ? "bg-emerald-600 hover:bg-emerald-600" : "bg-sky-600 hover:bg-sky-600")}
          >
            {isRdv ? "RDV" : "Rappel"}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {formatDateLabel(entry)}
          </span>
          <span className="inline-flex items-center gap-1">
            <RefreshCcw className="size-3.5" />
            {formatRelativeLabel(entry)}
          </span>
        </div>

        {phoneNumber && (
          <div className="text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Phone className="size-3.5" />
              {phoneNumber}
            </span>
          </div>
        )}

        {comment && <p className="line-clamp-2 text-sm text-muted-foreground/90">{comment}</p>}
      </div>
    </div>
  )
}

const OverdueItem = ({ entry }: { entry: NotificationEntry }) => {
  const meta = entry.event.metadata
  const elapsed = formatDistanceToNow(parseISO(entry.startIso), { locale: fr, addSuffix: true })

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-400/60 bg-amber-50/70 p-3 dark:border-amber-500/50 dark:bg-amber-950/30">
      <AlertTriangle className="mt-0.5 size-5 text-amber-500" />
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div className="truncate font-semibold">{entry.contactName}</div>
          <Badge variant="outline" className="border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-200">
            En retard
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{meta?.kind === "rdv" ? "RDV" : "Rappel"} attendu {elapsed}</p>
        {meta?.comment && <p className="line-clamp-2 text-sm text-muted-foreground/90">{meta.comment}</p>}
      </div>
    </div>
  )
}

const NotificationSummary = ({ center }: { center: UseNotificationCenterState }) => {
  const totalUpcoming = center.buckets.rappel.length + center.buckets.rdv.length
  const totalRappels = useMemo(() => center.entries.filter((entry) => entry.type === "rappel").length, [center.entries])
  const totalRdv = useMemo(() => center.entries.filter((entry) => entry.type === "rdv").length, [center.entries])
  const overdueCount = center.entries.length - totalUpcoming
  const isRefreshing = center.status === "refreshing"

  const showRefreshing = useStabilizedBoolean(isRefreshing)
  const statusLabel = showRefreshing ? "Mise à jour en cours…" : center.lastUpdatedLabel
  const badgeVariant = center.unreadCount > 0 ? "secondary" : "outline"

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Synthèse intelligente</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            {showRefreshing && <RefreshCcw className="size-3 animate-spin" />}
            {statusLabel}
          </p>
          <p className="text-2xs text-muted-foreground/80">{totalUpcoming} échéances à venir • {overdueCount} à rattraper</p>
        </div>
        <Badge variant={badgeVariant} className="flex items-center gap-1">
          <Bell className="size-3.5" />
          {formatNewCountLabel(center.unreadCount)}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="text-xs uppercase text-muted-foreground">Rappels enregistrés</p>
          <p className="mt-1 text-2xl font-semibold">{totalRappels}</p>
          <p className="text-xs text-muted-foreground">Toutes les échéances à traiter</p>
        </div>
        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="text-xs uppercase text-muted-foreground">RDV enregistrés</p>
          <p className="mt-1 text-2xl font-semibold">{totalRdv}</p>
          <p className="text-xs text-muted-foreground">Prochains rendez-vous suivis</p>
        </div>
      </div>
    </div>
  )
}

export const NotificationCenterButton = ({
  onNavigateToCalendar,
  updateDownloaded = false,
  adbConnected = false,
}: NotificationCenterButtonProps) => {
  const [open, setOpen] = useState(false)
  const center = useNotificationCenter()
  const { markAllAsRead, toggleDesktopEnabled, refresh } = center

  useEffect(() => {
    if (open) {
      markAllAsRead()
    }
  }, [open, markAllAsRead])

  const handleToggleDesktop = async (checked: boolean) => {
    await toggleDesktopEnabled(checked)
  }

  const triggerHasActivity = center.unreadCount > 0
  const unreadBadgeLabel = center.unreadCount > 9 ? "9+" : String(center.unreadCount)
  const hasError = center.status === "error"
  const isInitialLoading = (center.status === "loading" || center.status === "idle") && !center.lastUpdated && !hasError

  const rappelEntries = useMemo(
    () =>
      center.entries
        .filter((entry) => entry.type === "rappel")
        .sort((a, b) => a.startTimestamp - b.startTimestamp),
    [center.entries]
  )
  const rdvEntries = useMemo(
    () =>
      center.entries
        .filter((entry) => entry.type === "rdv")
        .sort((a, b) => a.startTimestamp - b.startTimestamp),
    [center.entries]
  )
  const overdueEntries = useMemo(
    () =>
      center.entries
        .filter((entry) => entry.startTimestamp < Date.now())
        .sort((a, b) => b.startTimestamp - a.startTimestamp),
    [center.entries]
  )

  const renderCardList = (
    entries: NotificationEntry[],
    {
      emptyState,
      renderItem,
    }: {
      emptyState: JSX.Element
      renderItem: (entry: NotificationEntry) => JSX.Element
    }
  ) => {
    if (isInitialLoading) {
      return (
        <div className="p-4">
          <NotificationSkeleton />
        </div>
      )
    }

    if (entries.length === 0) {
      return <div className="p-6">{emptyState}</div>
    }

    return (
      <ScrollArea style={{ height: CARD_LIST_MAX_HEIGHT }} className="pr-2">
        <div className="space-y-3 p-3">
          {entries.map((entry) => renderItem(entry))}
        </div>
      </ScrollArea>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Centre de notifications">
          <Bell className="h-4 w-4" />
          {updateDownloaded && <span className="absolute -left-0.5 -top-0.5 inline-flex size-2.5 rounded-full bg-destructive" />}
          {adbConnected && <span className="absolute -bottom-0.5 -right-0.5 inline-flex size-2.5 rounded-full bg-emerald-500 ring-1 ring-background" />}
          {triggerHasActivity && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground shadow">
              {unreadBadgeLabel}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-[420px] max-h-[85vh] overflow-hidden rounded-xl p-0 shadow-xl">
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Centre de notifications</h3>
                <p className="text-xs text-muted-foreground">Adapté automatiquement selon vos rappels & RDV</p>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary">
                Intelligent
              </Badge>
            </div>

            {hasError && (
              <div className="flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <div>Impossible de récupérer les événements ({center.error ?? "erreur inconnue"}).</div>
                <Button variant="outline" size="sm" className="shrink-0 text-destructive" onClick={() => refresh()}>
                  Réessayer
                </Button>
              </div>
            )}

            <NotificationSummary center={center} />

            <Separator />

            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div>
                <p className="text-sm font-medium">Notifications natives</p>
                <p className="text-xs text-muted-foreground">
                  {center.preferences.desktopEnabled
                    ? "Alertes push Windows / macOS activées"
                    : "Activez les alertes pour ne rien manquer"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {center.preferences.desktopEnabled ? (
                  <Smartphone className="size-4 text-primary" />
                ) : (
                  <BellOff className="size-4 text-muted-foreground" />
                )}
                <Switch checked={center.preferences.desktopEnabled} onCheckedChange={handleToggleDesktop} />
              </div>
            </div>

            <Tabs defaultValue="rappels" className="mt-1 flex flex-col gap-3">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="rappels">Rappels ({rappelEntries.length})</TabsTrigger>
                <TabsTrigger value="rdv">RDV ({rdvEntries.length})</TabsTrigger>
                <TabsTrigger value="overdue">Retards ({overdueEntries.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="rappels" className="flex-1">
                <div className="rounded-xl border bg-background/60 dark:bg-background/20 overflow-hidden">
                  {renderCardList(rappelEntries, {
                    emptyState: (
                      <EmptyState
                        icon={<Bell className="size-5 text-muted-foreground" />}
                        title="Aucun rappel enregistré"
                        description="Ajoutez des rappels dans la page Calendrier pour les voir apparaître ici."
                      />
                    ),
                    renderItem: (entry) => <NotificationItem key={entry.id} entry={entry} />,
                  })}
                </div>
              </TabsContent>

              <TabsContent value="rdv" className="flex-1">
                <div className="rounded-xl border bg-background/60 dark:bg-background/20 overflow-hidden">
                  {renderCardList(rdvEntries, {
                    emptyState: (
                      <EmptyState
                        icon={<CalendarDays className="size-5 text-muted-foreground" />}
                        title="Pas de RDV enregistrés"
                        description="Planifiez vos RDV pour les suivre ici en un clin d'œil."
                      />
                    ),
                    renderItem: (entry) => <NotificationItem key={entry.id} entry={entry} />,
                  })}
                </div>
              </TabsContent>

              <TabsContent value="overdue" className="flex-1">
                <div className="rounded-xl border bg-background/60 dark:bg-background/20 overflow-hidden">
                  {renderCardList(overdueEntries, {
                    emptyState: (
                      <EmptyState
                        icon={<AlertTriangle className="size-5 text-muted-foreground" />}
                        title="Tout est à jour"
                        description="Aucun rappel ou RDV en retard détecté pour le moment."
                      />
                    ),
                    renderItem: (entry) => <OverdueItem key={entry.id} entry={entry} />,
                  })}
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                Préavis: rappels {center.preferences.rappelLeadMinutes} min · RDV {center.preferences.rdvLeadMinutes} min
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={onNavigateToCalendar}>
                <CalendarDays className="size-4" />
                Ouvrir le calendrier
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

const EmptyState = ({ icon, title, description }: { icon: ReactNode; title: string; description: string }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-muted/40 bg-muted/10 p-6 text-center">
    <span className="flex size-10 items-center justify-center rounded-full border border-muted/30 bg-background text-muted-foreground">
      {icon}
    </span>
    <p className="text-sm font-medium">{title}</p>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
)
