import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

type StatusEvent = {
  id: number
  contact_id: string
  old_status?: string | null
  new_status: string
  applied_at: string
  prenom?: string | null
  nom?: string | null
  telephone?: string | null
  // Champs potentiels additionnels si présents dans events.json/sqlite
  email?: string | null
  mail?: string | null
  commentaire?: string | null
  comment?: string | null
  dateRappel?: string | null
  heureRappel?: string | null
  dateRDV?: string | null
  heureRDV?: string | null
  dateAppel?: string | null
  heureAppel?: string | null
  dureeAppel?: string | null
  dateEntree?: string | null
  heureEntree?: string | null
}

export default function LocalDBViewer() {
  const [events, setEvents] = useState<StatusEvent[]>([])
  const [dbPath, setDbPath] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [dbOk, setDbOk] = useState<boolean | null>(null)
  const [lastError, setLastError] = useState<string>('')
  const [selectedEvent, setSelectedEvent] = useState<StatusEvent | null>(null)

  const refreshPath = async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI?.localdb) {
        const pathRes = await window.electronAPI.localdb.getPath()
        if (pathRes?.success) {
          setDbPath(pathRes.data || '')
          setDbOk(!!pathRes.data)
        } else {
          setDbOk(false)
        }
      }
    } catch (e: any) {
      setDbOk(false)
      setLastError(e?.message || String(e))
    }
  }

  const loadAll = async () => {
    setIsLoading(true)
    setLastError('')
    try {
      await refreshPath()
      if (typeof window !== 'undefined' && window.electronAPI?.localdb) {
        const res = await window.electronAPI.localdb.getAll()
        if (res?.success) {
          setEvents(res.data || [])
          setDbOk(true)
          // Conserver la sélection si encore présente, sinon reset
          if (selectedEvent && !(res.data || []).some((e: StatusEvent) => e.id === selectedEvent.id)) {
            setSelectedEvent(null)
          }
        } else {
          setDbOk(false)
          setLastError(res?.error || 'Erreur inconnue lors du chargement.')
        }
      }
    } catch (e: any) {
      setDbOk(false)
      setLastError(e?.message || String(e))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const StatusDot = ({ ok }: { ok: boolean | null }) => (
    <span
      title={ok === null ? 'État inconnu' : ok ? 'Opérationnelle' : 'Erreur'}
      className={
        'inline-block w-2.5 h-2.5 rounded-full ' +
        (ok === null ? 'bg-gray-400' : ok ? 'bg-green-500' : 'bg-red-500')
      }
    />
  )

  return (
    <Card className="flex-1">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Base locale SQLite</CardTitle>
            <CardDescription>
              Fichier: {dbPath || 'inconnu'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <StatusDot ok={dbOk} />
            <span className="text-muted-foreground">
              {dbOk === null ? 'Inconnu' : dbOk ? 'Opérationnelle' : 'Erreur'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <button
            className="h-9 px-3 rounded border text-sm"
            onClick={loadAll}
            disabled={isLoading}
          >
            {isLoading ? 'Chargement…' : 'Rafraîchir'}
          </button>
          {lastError && (
            <span className="text-xs text-red-600">{lastError}</span>
          )}
        </div>
        <div>
          <Table className="w-full text-sm">
            <TableHeader
              style={{
                position: 'sticky',
                top: 0,
              zIndex: 90,
                backgroundColor: 'hsl(var(--background))',
                backdropFilter: 'blur(4px)'
              }}
            >
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="px-2 py-1.5 text-center text-xs min-w-[60px]">#</TableHead>
                <TableHead className="px-2 py-1.5 text-center text-xs min-w-[100px]">Prénom</TableHead>
                <TableHead className="px-2 py-1.5 text-center text-xs min-w-[100px]">Nom</TableHead>
                <TableHead className="px-2 py-1.5 text-center text-xs min-w-[150px]">Téléphone</TableHead>
                <TableHead className="px-2 py-1.5 text-center text-xs min-w-[150px]">Mail</TableHead>
                <TableHead className="px-2 py-1.5 text-center text-xs min-w-[100px]">Statut</TableHead>
                <TableHead className="px-2 py-1.5 text-center text-xs min-w-[100px]">Commentaire</TableHead>
                <TableHead className="px-2 py-1.5 text-center text-xs min-w-[100px]">Date Rappel</TableHead>
                <TableHead className="px-2 py-1.5 text-center text-xs min-w-[100px]">Heure Rappel</TableHead>
                <TableHead className="px-2 py-1.5 text-center text-xs min-w-[100px]">Date RDV</TableHead>
                <TableHead className="px-2 py-1.5 text-center text-xs min-w-[100px]">Heure RDV</TableHead>
                <TableHead className="px-2 py-1.5 text-center text-xs min-w-[100px]">Date Appel</TableHead>
                <TableHead className="px-2 py-1.5 text-center text-xs min-w-[100px]">Heure Appel</TableHead>
                <TableHead className="px-2 py-1.5 text-center text-xs min-w-[100px]">Date Entrée</TableHead>
                <TableHead className="px-2 py-1.5 text-center text-xs min-w-[100px]">Heure Entrée</TableHead>
                <TableHead className="px-2 py-1.5 text-center text-xs min-w-[100px]">Durée Appel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map(ev => {
                const email = ev.email || ev.mail || ''
                const comment = ev.commentaire || ev.comment || ''
                // Utiliser strictement les colonnes dédiées pour appel, ne plus déduire de applied_at
                const dateAppel = ev.dateAppel || ''
                const heureAppel = ev.heureAppel || ''
                return (
                  <TableRow
                    key={ev.id}
                    data-contact-id={ev.contact_id}
                    className={
                      'hover:bg-muted/50 cursor-pointer transition-colors ' +
                      (selectedEvent?.id === ev.id ? 'bg-muted/30' : '')
                    }
                    onClick={() => setSelectedEvent(ev)}
                  >
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap">{ev.id}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap">{ev.prenom || ''}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap">{ev.nom || ''}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap font-mono">{ev.telephone || ''}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap">
                      <span className="truncate block max-w-[180px] mx-auto" title={email}>{email}</span>
                    </TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap font-medium">{(ev as any).new_status ?? (ev as any).newStatus ?? ''}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap">{comment}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap">{ev.dateRappel || ''}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap">{ev.heureRappel || ''}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap">{ev.dateRDV || ''}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap">{ev.heureRDV || ''}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap">{dateAppel}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap">{heureAppel}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap">{ev.dateEntree || (ev.applied_at ? new Date(ev.applied_at).toLocaleDateString() : '')}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap">{ev.heureEntree || (ev.applied_at ? new Date(ev.applied_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap">{ev.dureeAppel || ''}</TableCell>
                  </TableRow>
                )
              })}
              {events.length === 0 && (
                <TableRow>
                  <TableCell className="p-4 text-center text-muted-foreground" colSpan={16}>
                    Aucune donnée à afficher.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Détails de la ligne sélectionnée */}
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">Détails de la sélection</div>
          {selectedEvent ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">ID</div>
                <div className="font-medium">{selectedEvent.id}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Contact ID</div>
                <div className="font-medium break-all">{selectedEvent.contact_id}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Date</div>
                <div className="font-medium">{selectedEvent.applied_at}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Prénom</div>
                <div className="font-medium">{selectedEvent.prenom || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Nom</div>
                <div className="font-medium">{selectedEvent.nom || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Téléphone</div>
                <div className="font-medium">{selectedEvent.telephone || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Ancien statut</div>
                <div className="font-medium">{selectedEvent.old_status || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Nouveau statut</div>
                <div className="font-medium">{selectedEvent.new_status}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Mail</div>
                <div className="font-medium">{selectedEvent.email || selectedEvent.mail || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Commentaire</div>
                <div className="font-medium">{selectedEvent.commentaire || selectedEvent.comment || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Date Rappel</div>
                <div className="font-medium">{selectedEvent.dateRappel || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Heure Rappel</div>
                <div className="font-medium">{selectedEvent.heureRappel || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Date RDV</div>
                <div className="font-medium">{selectedEvent.dateRDV || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Heure RDV</div>
                <div className="font-medium">{selectedEvent.heureRDV || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Date Appel</div>
                <div className="font-medium">{selectedEvent.dateAppel || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Heure Appel</div>
                <div className="font-medium">{selectedEvent.heureAppel || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Date Entrée</div>
                <div className="font-medium">{selectedEvent.dateEntree || (selectedEvent.applied_at ? new Date(selectedEvent.applied_at).toLocaleDateString() : '-')}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Heure Entrée</div>
                <div className="font-medium">{selectedEvent.heureEntree || (selectedEvent.applied_at ? new Date(selectedEvent.applied_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-')}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Durée Appel</div>
                <div className="font-medium">{selectedEvent.dureeAppel || '-'}</div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Aucune ligne sélectionnée.</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


