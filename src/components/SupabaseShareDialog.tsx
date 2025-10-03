import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Server, ShieldAlert } from 'lucide-react'
import { useSupabaseShare } from '@/hooks/useSupabaseShare'

interface SupabaseShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const SupabaseShareDialog: React.FC<SupabaseShareDialogProps> = ({ open, onOpenChange }) => {
  const { state, setEnabled, triggerSync, refreshSupabaseStatus, downloadLogs } = useSupabaseShare()

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'syncing':
        return (
          <Badge variant="outline" className="gap-1 text-xs text-amber-600 border-amber-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            Synchronisation…
          </Badge>
        )
      case 'success':
        return (
          <Badge variant="outline" className="gap-1 text-xs text-emerald-600 border-emerald-500">
            <CheckCircle2 className="w-3 h-3" />
            À jour
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="outline" className="gap-1 text-xs text-red-600 border-red-500">
            <AlertTriangle className="w-3 h-3" />
            Erreur
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="text-xs text-muted-foreground">
            Inactif
          </Badge>
        )
    }
  }

  const renderStats = (stats?: { processed: number; shared: number; filtered: number }) => {
    if (!stats) return null
    return (
      <div className="text-xs text-muted-foreground grid gap-1 mt-2">
        <span>
          <span className="font-medium text-foreground">{stats.shared}</span> éléments envoyés
        </span>
        <span>
          <span className="font-medium text-foreground">{stats.processed}</span> lignes analysées,
          <span className="font-medium text-foreground"> {stats.filtered}</span> ignorées
        </span>
      </div>
    )
  }

  const renderError = (error?: string) => {
    if (!error) return null
    return (
      <div className="flex items-start gap-2 text-xs text-red-600 bg-red-100/40 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2 mt-2">
        <ShieldAlert className="w-4 h-4 mt-0.5" />
        <div className="grid gap-1">
          <span className="font-medium">Synchronisation interrompue</span>
          <span>{error}</span>
        </div>
      </div>
    )
  }

  const connectionOk = state.supabaseReady

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="gap-1">
          <DialogTitle>Partage Supabase</DialogTitle>
          <DialogDescription>
            Choisissez ce que vous souhaitez partager avec Supabase pour vos autres utilisateurs.
          </DialogDescription>
        </DialogHeader>

        <section className="rounded-md border bg-muted/40 px-3 py-3 flex items-start gap-3">
          <Server className={`w-5 h-5 mt-0.5 ${connectionOk ? 'text-emerald-600' : 'text-amber-600 animate-pulse'}`} />
          <div className="grid gap-1 text-sm">
            <div className="font-medium">Statut connexion</div>
            {connectionOk ? (
              <span className="text-muted-foreground">Supabase configuré et prêt à recevoir les données.</span>
            ) : (
              <span className="text-amber-600">Supabase non configuré ou indisponible.</span>
            )}
            <div className="flex gap-2 mt-1">
              <Button variant="outline" size="sm" onClick={() => refreshSupabaseStatus()} className="h-7">
                <RefreshCw className="w-3 h-3 mr-1" /> Vérifier
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadLogs()} className="h-7">
                Télécharger les logs
              </Button>
            </div>
          </div>
        </section>

        <div className="grid gap-4">
          <div className="rounded-md border px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-medium flex items-center gap-2">
                  Partager les numéros de téléphone
                  {renderStatusBadge(state.phone.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Synchronise les numéros de téléphone de la table locale vers Supabase (`shared_phone_numbers`).
                  Utilisé pour éviter les doublons entre utilisateurs.
                </p>
                {renderStats(state.phone.stats)}
                {renderError(state.phone.lastError)}
              </div>
              <Switch
                checked={state.phone.enabled}
                onCheckedChange={(checked) => setEnabled('phone', !!checked)}
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                disabled={!state.phone.enabled || state.phone.status === 'syncing'}
                onClick={() => triggerSync('phone', 'manual')}
                className="h-7"
              >
                <RefreshCw className="w-3 h-3 mr-1" /> Relancer la synchro
              </Button>
            </div>
          </div>

          <div className="rounded-md border px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-medium flex items-center gap-2">
                  Partager les listes noires
                  {renderStatusBadge(state.blacklist.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Envoie uniquement les numéros dont le statut est « Liste noire » vers `shared_blacklist_numbers`.
                  Permet de bloquer les contacts indésirables sur toute l’application.
                </p>
                {renderStats(state.blacklist.stats)}
                {renderError(state.blacklist.lastError)}
              </div>
              <Switch
                checked={state.blacklist.enabled}
                onCheckedChange={(checked) => setEnabled('blacklist', !!checked)}
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                disabled={!state.blacklist.enabled || state.blacklist.status === 'syncing'}
                onClick={() => triggerSync('blacklist', 'manual')}
                className="h-7"
              >
                <RefreshCw className="w-3 h-3 mr-1" /> Relancer la synchro
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


