import { useEffect, useMemo, useState, useCallback } from "react"
import type { ReactNode } from "react"
import { AlertTriangle, Bell, BellOff, CalendarDays, Clock, ExternalLink, Phone, RefreshCcw, Smartphone, Trash2, X } from "lucide-react"
import { format, formatDistanceToNow, parseISO } from "date-fns"
import { fr } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

import { useNotificationCenter } from "@/notifications/useNotificationCenter"
import type { NotificationEntry, UseNotificationCenterState } from "@/notifications/types"
import { cn } from "@/lib/utils"

interface NotificationCenterButtonProps {
  onNavigateToCalendar?: () => void
  onNavigateToAnnuaire?: (contactId?: string, contactName?: string) => void
  updateDownloaded?: boolean
  adbConnected?: boolean
}

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

const useResponsiveListHeight = (maxPx = 420, minPx = 240, viewportRatio = 0.55) => {
  const [height, setHeight] = useState(maxPx)

  useEffect(() => {
    const compute = () => {
      if (typeof window === "undefined") return
      const next = Math.max(minPx, Math.min(maxPx, Math.round(window.innerHeight * viewportRatio)))
      setHeight(next)
    }

    compute()
    window.addEventListener("resize", compute)
    return () => window.removeEventListener("resize", compute)
  }, [maxPx, minPx, viewportRatio])

  return height
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

const NotificationItem = ({
  entry,
  onDismiss,
  onOpenAnnuaire,
}: {
  entry: NotificationEntry
  onDismiss?: (entry: NotificationEntry) => void
  onOpenAnnuaire?: (entry: NotificationEntry) => void
}) => {
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
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate font-semibold">{entry.contactName}</div>
              <Badge
                variant={isRdv ? "default" : "secondary"}
                className={cn(isRdv ? "bg-emerald-600 hover:bg-emerald-600" : "bg-sky-600 hover:bg-sky-600")}
              >
                {isRdv ? "RDV" : "Rappel"}
              </Badge>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {onOpenAnnuaire && (
              <Button
                aria-label={`Ouvrir ${entry.contactName} dans l'annuaire`}
                variant="ghost"
                size="icon"
                className="size-8 text-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50"
                onClick={() => onOpenAnnuaire(entry)}
              >
                <ExternalLink className="size-4" />
              </Button>
            )}
            {onDismiss && (
              <Button
                aria-label={`Terminer la tâche pour ${entry.contactName}`}
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => onDismiss(entry)}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
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

const OverdueItem = ({
  entry,
  onDismiss,
  onOpenAnnuaire,
}: {
  entry: NotificationEntry
  onDismiss?: (entry: NotificationEntry) => void
  onOpenAnnuaire?: (entry: NotificationEntry) => void
}) => {
  const meta = entry.event.metadata
  const elapsed = formatDistanceToNow(parseISO(entry.startIso), { locale: fr, addSuffix: true })

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-400/60 bg-amber-50/70 p-3 dark:border-amber-500/50 dark:bg-amber-950/30">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate font-semibold">{entry.contactName}</div>
              <Badge variant="outline" className="border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-100">
                En retard
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {meta?.kind === "rdv" ? "RDV" : "Rappel"} attendu {elapsed}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onOpenAnnuaire && (
              <Button
                aria-label={`Ouvrir ${entry.contactName} dans l'annuaire`}
                variant="ghost"
                size="icon"
                className="size-8 text-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50"
                onClick={() => onOpenAnnuaire(entry)}
              >
                <ExternalLink className="size-4" />
              </Button>
            )}
            {onDismiss && (
              <Button
                aria-label={`Terminer la tâche pour ${entry.contactName}`}
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => onDismiss(entry)}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Synthèse intelligente</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            {showRefreshing && <RefreshCcw className="size-3 animate-spin" />}
            {statusLabel}
          </p>
          <p className="text-2xs text-muted-foreground/80">
            {totalUpcoming} échéances à venir • {overdueCount} à rattraper
          </p>
        </div>
        <Badge variant={badgeVariant} className="flex w-fit items-center gap-1 self-start">
          <Bell className="size-3.5" />
          {formatNewCountLabel(center.unreadCount)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
  onNavigateToAnnuaire,
  updateDownloaded = false,
  adbConnected = false,
}: NotificationCenterButtonProps) => {
  const updateEventInDb = useCallback(async (entry: NotificationEntry) => {
    const updater = (window as any)?.electronAPI?.localdb?.update;
    const recordId = entry.event.metadata?.source?.id ?? entry.event.metadata?.recordId ?? null;
    if (!updater || !recordId) return;
    const payload: Record<string, unknown> = { id: recordId };
    if (entry.type === "rappel") {
      payload.dateRappel = null;
      payload.heureRappel = null;
    } else if (entry.type === "rdv") {
      payload.dateRDV = null;
      payload.heureRDV = null;
    }
    try {
      await updater(payload);
      window.dispatchEvent(new Event("localdb-updated"));
    } catch (error) {
      console.error("[NotificationCenter] update event failed", error);
    }
  }, []);

  const [open, setOpen] = useState(false)
  const center = useNotificationCenter()
  const { markAllAsRead, markAsRead, dismissEntries, toggleDesktopEnabled, refresh } = center
  const listMaxHeight = useResponsiveListHeight(420, 220, 0.6)

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

  const handleDismissEntry = async (entry: NotificationEntry) => {
    dismissEntries([entry.id])
    markAsRead([entry.id])
    await updateEventInDb(entry)
    window.dispatchEvent(
      new CustomEvent("notifications-dimicall-dismiss", {
        detail: {
          recordId: entry.event.metadata?.recordId ?? entry.event.metadata?.source?.id,
          eventId: entry.event.id,
        },
      })
    )
  }

  const handleOpenAnnuaire = (entry: NotificationEntry) => {
    if (typeof window !== "undefined" && entry.contactName) {
      window.localStorage.setItem("annuaire:last-search", entry.contactName)
    }
    onNavigateToAnnuaire?.(entry.event.metadata?.contact?.id ?? undefined, entry.contactName)
    setOpen(false)
  }
  const canOpenAnnuaire = Boolean(onNavigateToAnnuaire)

  const handleClearAll = async (entries: NotificationEntry[]) => {
    const ids = entries.map((e) => e.id)
    dismissEntries(ids)
    markAsRead(ids)
    for (const entry of entries) {
      await updateEventInDb(entry)
      window.dispatchEvent(
        new CustomEvent("notifications-dimicall-dismiss", {
          detail: {
            recordId: entry.event.metadata?.recordId ?? entry.event.metadata?.source?.id,
            eventId: entry.event.id,
          },
        })
      )
    }
  }

  const renderCardList = (
    entries: NotificationEntry[],
    {
      emptyState,
      renderItem,
      clearLabel,
    }: {
      emptyState: ReactNode
      renderItem: (entry: NotificationEntry) => ReactNode
      clearLabel: string
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
      <>
        <div className="flex items-center justify-end border-b px-3 py-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                Tout supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer toutes les notifications ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Vous êtes sur le point de supprimer les {entries.length} notification{entries.length > 1 ? "s" : ""}{" "}
                  de la catégorie <span className="font-semibold">{clearLabel}</span>. Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => handleClearAll(entries)}
                >
                  Tout supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <ScrollArea style={{ maxHeight: listMaxHeight }} className="pr-2">
          <div className="space-y-3 p-3">
            {entries.map((entry) => renderItem(entry))}
          </div>
        </ScrollArea>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative text-foreground hover:bg-muted/60 hover:text-foreground",
            triggerHasActivity && "text-destructive hover:text-destructive"
          )}
          aria-label="Centre de notifications"
        >
          {(triggerHasActivity || updateDownloaded) && (
            <span
              className="absolute inset-0 animate-[pulse_2s_ease-in-out_infinite] rounded-full bg-destructive/15"
              aria-hidden
            />
          )}
          <Bell className="relative z-10 h-4 w-4 drop-shadow-sm" />
          {updateDownloaded && <span className="absolute -left-0.5 -top-0.5 inline-flex size-2.5 rounded-full bg-destructive" />}
          {adbConnected && <span className="absolute -bottom-0.5 -right-0.5 inline-flex size-2.5 rounded-full bg-emerald-500 ring-1 ring-background" />}
          {triggerHasActivity && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground shadow">
              {unreadBadgeLabel}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-[min(520px,calc(100vw-1rem))] max-h-[90vh] overflow-hidden rounded-xl p-0 shadow-xl sm:w-[520px]"
      >
        <div className="flex max-h-[90vh] flex-col">
          <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div>
                <h3 className="text-base font-semibold">Centre de notifications</h3>
                <p className="text-xs text-muted-foreground">Adapté automatiquement selon vos rappels & RDV</p>
              </div>
              <Badge variant="outline" className="w-fit bg-primary/10 text-primary">
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

            <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
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
              <TabsList className="grid w-full grid-cols-3 gap-1">
                <TabsTrigger value="rappels">Rappels ({rappelEntries.length})</TabsTrigger>
                <TabsTrigger value="rdv">RDV ({rdvEntries.length})</TabsTrigger>
                <TabsTrigger value="overdue">Retards ({overdueEntries.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="rappels" className="flex-1">
                <div className="rounded-xl border bg-background/60 dark:bg-background/20 overflow-hidden">
                  {renderCardList(rappelEntries, {
                    clearLabel: "Rappels",
                    emptyState: (
                      <EmptyState
                        icon={<Bell className="size-5 text-muted-foreground" />}
                        title="Aucun rappel enregistré"
                        description="Ajoutez des rappels dans la page Calendrier pour les voir apparaître ici."
                      />
                    ),
                    renderItem: (entry) => (
                      <NotificationItem
                        key={entry.id}
                        entry={entry}
                        onDismiss={handleDismissEntry}
                        onOpenAnnuaire={canOpenAnnuaire ? handleOpenAnnuaire : undefined}
                      />
                    ),
                  })}
                </div>
              </TabsContent>

              <TabsContent value="rdv" className="flex-1">
                <div className="rounded-xl border bg-background/60 dark:bg-background/20 overflow-hidden">
                  {renderCardList(rdvEntries, {
                    clearLabel: "RDV",
                    emptyState: (
                      <EmptyState
                        icon={<CalendarDays className="size-5 text-muted-foreground" />}
                        title="Pas de RDV enregistrés"
                        description="Planifiez vos RDV pour les suivre ici en un clin d'œil."
                      />
                    ),
                    renderItem: (entry) => (
                      <NotificationItem
                        key={entry.id}
                        entry={entry}
                        onDismiss={handleDismissEntry}
                        onOpenAnnuaire={canOpenAnnuaire ? handleOpenAnnuaire : undefined}
                      />
                    ),
                  })}
                </div>
              </TabsContent>

              <TabsContent value="overdue" className="flex-1">
                <div className="rounded-xl border bg-background/60 dark:bg-background/20 overflow-hidden">
                  {renderCardList(overdueEntries, {
                    clearLabel: "Retards",
                    emptyState: (
                      <EmptyState
                        icon={<AlertTriangle className="size-5 text-muted-foreground" />}
                        title="Tout est à jour"
                        description="Aucun rappel ou RDV en retard détecté pour le moment."
                      />
                    ),
                    renderItem: (entry) => (
                      <OverdueItem
                        key={entry.id}
                        entry={entry}
                        onDismiss={handleDismissEntry}
                        onOpenAnnuaire={canOpenAnnuaire ? handleOpenAnnuaire : undefined}
                      />
                    ),
                  })}
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                Préavis: rappels {center.preferences.rappelLeadMinutes} min · RDV {center.preferences.rdvLeadMinutes} min
              </div>
              <Button variant="outline" size="sm" className="gap-2 sm:w-auto" onClick={onNavigateToCalendar}>
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
