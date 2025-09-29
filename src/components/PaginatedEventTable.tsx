import React, { useEffect, useMemo, useState } from 'react'
import { usePagination } from '@/hooks/usePagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TablePagination } from '@/components/TablePagination'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, RefreshCw, Upload, Download, Calendar as CalendarIcon, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Contact, ContactStatus } from '@/types'

type StatusEvent = {
  id: number
  contact_id: string
  old_status?: string | null
  new_status: string
  applied_at: string
  prenom?: string | null
  nom?: string | null
  telephone?: string | null
  email?: string | null
  commentaire?: string | null
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

export default function PaginatedEventTable() {
  const [events, setEvents] = useState<StatusEvent[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [editing, setEditing] = useState<{ id: number; field: keyof StatusEvent; value: string } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [sortKey, setSortKey] = useState<keyof StatusEvent | 'id'>('id')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const loadAll = async () => {
    setIsLoading(true)
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.localdb) {
        const res = await (window as any).electronAPI.localdb.getAll()
        if (res?.success) {
          setEvents(res.data || [])
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto rafraîchir quand la DB locale change (après insert/update)
  useEffect(() => {
    const handler = () => loadAll()
    window.addEventListener('localdb-updated', handler as any)
    return () => window.removeEventListener('localdb-updated', handler as any)
  }, [])

  // Actions déclenchées depuis App (bandeau BDD)
  useEffect(() => {
    const onDelete = async () => {
      const ids = selectedIds.size > 0 ? Array.from(selectedIds) : (selectedId ? [selectedId] : [])
      for (const id of ids) { await handleDelete(id) }
      setSelectedIds(new Set())
      try { window.dispatchEvent(new CustomEvent('dimicall-db-selection', { detail: { count: 0 } })) } catch {}
    }
    const onExport = async () => { await handleExportCsv() }
    const onImport = async () => { await handleImportCsv() }
    const onExportXlsx = async () => { await handleExportXlsx() }
    const onImportXlsx = async () => { await handleImportXlsx() }
    const onRefresh = async () => { await loadAll() }
    window.addEventListener('dimicall-db-delete', onDelete as any)
    window.addEventListener('dimicall-db-export', onExport as any)
    window.addEventListener('dimicall-db-import', onImport as any)
    window.addEventListener('dimicall-db-export-xlsx', onExportXlsx as any)
    window.addEventListener('dimicall-db-import-xlsx', onImportXlsx as any)
    window.addEventListener('dimicall-db-refresh', onRefresh as any)
    return () => {
      window.removeEventListener('dimicall-db-delete', onDelete as any)
      window.removeEventListener('dimicall-db-export', onExport as any)
      window.removeEventListener('dimicall-db-import', onImport as any)
      window.removeEventListener('dimicall-db-export-xlsx', onExportXlsx as any)
      window.removeEventListener('dimicall-db-import-xlsx', onImportXlsx as any)
      window.removeEventListener('dimicall-db-refresh', onRefresh as any)
    }
  }, [selectedId, selectedIds])

  const handleDelete = async (id: number) => {
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.localdb) {
        await (window as any).electronAPI.localdb.delete(id)
        // Optimiste: enlever localement
        setEvents((prev) => prev.filter((e) => e.id !== id))
      }
    } catch {}
  }

  const commitEdit = async () => {
    if (!editing) return
    try {
      const payload: any = { id: editing.id, [editing.field]: editing.value }
      await (window as any).electronAPI?.localdb?.update(payload)
      setEvents((prev) => prev.map((e) => (e.id === editing.id ? ({ ...e, [editing.field]: editing.value } as any) : e)))
    } finally {
      setEditing(null)
    }
  }

  // Pagination
  const savedItemsPerPage = useMemo(() => {
    try { return Number(localStorage.getItem('dimicall-items-per-page')) || 50 } catch { return 50 }
  }, [])

  const initialPage = useMemo(() => {
    try { return Number(localStorage.getItem('dimicall-events-current-page')) || 1 } catch { return 1 }
  }, [])

  // Recherche globale (texte)
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return events
    const t = searchTerm.toLowerCase()
    return events.filter(ev => {
      const email = (ev as any).email || (ev as any).mail || ''
      const comment = (ev as any).commentaire || (ev as any).comment || ''
      return [
        String(ev.id),
        ev.prenom || '',
        ev.nom || '',
        ev.telephone || '',
        email,
        (ev as any).new_status || (ev as any).newStatus || '',
        comment,
        ev.dateRappel || '', ev.heureRappel || '', ev.dateRDV || '', ev.heureRDV || '',
        ev.dateAppel || '', ev.heureAppel || '', ev.dateEntree || '', ev.heureEntree || '',
      ].some(v => String(v).toLowerCase().includes(t))
    })
  }, [events, searchTerm])

  // Tri
  const sortedData = useMemo(() => {
    const data = [...filteredData]
    data.sort((a, b) => {
      const va = (a as any)[sortKey] ?? ''
      const vb = (b as any)[sortKey] ?? ''
      if (va == null && vb == null) return 0
      if (va == null) return sortDir === 'asc' ? -1 : 1
      if (vb == null) return sortDir === 'asc' ? 1 : -1
      const na = typeof va === 'number' ? va : Number(String(va).replaceAll(/[^0-9.-]/g, ''))
      const nb = typeof vb === 'number' ? vb : Number(String(vb).replaceAll(/[^0-9.-]/g, ''))
      const bothNumeric = !Number.isNaN(na) && !Number.isNaN(nb) && String(va).trim() !== '' && String(vb).trim() !== ''
      const cmp = bothNumeric ? (na - nb) : String(va).localeCompare(String(vb))
      return sortDir === 'asc' ? cmp : -cmp
    })
    return data
  }, [filteredData, sortKey, sortDir])

  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedData,
    totalItems,
    goToPage,
    setItemsPerPage,
  } = usePagination<StatusEvent>({ data: sortedData, initialItemsPerPage: savedItemsPerPage, initialPage })

  const handlePageChange = (page: number) => {
    try { localStorage.setItem('dimicall-events-current-page', String(page)) } catch {}
    goToPage(page)
  }

  const handleItemsPerPageChange = (n: number) => {
    try { localStorage.setItem('dimicall-items-per-page', String(n)) } catch {}
    setItemsPerPage(n)
  }

  // Sélection
  const isRowSelected = (id: number) => selectedIds.has(id)
  const toggleRow = (id: number, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id); else next.delete(id)
      // informer App pour activer/désactiver le bouton Supprimer
      try { window.dispatchEvent(new CustomEvent('dimicall-db-selection', { detail: { count: next.size } })) } catch {}
      return next
    })
  }
  const allPageSelected = paginatedData.length > 0 && paginatedData.every(e => selectedIds.has(e.id))
  const somePageSelected = paginatedData.some(e => selectedIds.has(e.id)) && !allPageSelected
  const toggleAllPage = (checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      paginatedData.forEach(e => { if (checked) next.add(e.id); else next.delete(e.id) })
      return next
    })
  }

  const handleExportCsv = async () => {
    try {
      const res = await (window as any).electronAPI?.localdb?.exportCsv()
      if (res?.success) {
        try {
          window.dispatchEvent(new CustomEvent('dimicall-toast', { detail: { type: 'success', title: 'Export CSV réussi', path: res.path } }))
        } catch {}
      }
    } catch {}
  }

  const handleImportCsv = async () => {
    try {
      const res = await (window as any).electronAPI?.localdb?.importCsv()
      if (res?.success) {
        await loadAll()
      }
    } catch {}
  }

  const handleExportXlsx = async () => {
    try {
      const res = await (window as any).electronAPI?.localdb?.exportXlsx()
      if (res?.success) {
        try {
          window.dispatchEvent(new CustomEvent('dimicall-toast', { detail: { type: 'success', title: 'Export Excel réussi', path: res.path } }))
        } catch {}
      }
    } catch {}
  }

  const handleImportXlsx = async () => {
    try {
      const res = await (window as any).electronAPI?.localdb?.importXlsx()
      if (res?.success) {
        await loadAll()
      }
    } catch {}
  }

  // Filtres de date pilotés depuis la barre supérieure (App)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const toLocalYMD = (d: Date) => {
    const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`
  }
  const applyListFilter = async (s?: string, e?: string) => {
    setIsLoading(true)
    try {
      const start = s ? `${s} 00:00:00` : undefined
      const end = e ? `${e} 23:59:59` : undefined
      const res = await (window as any).electronAPI?.localdb?.listStatus(start, end)
      if (res?.success) setEvents(res.data || [])
    } finally {
      setIsLoading(false)
    }
  }
  // Écoute des filtres émis par App (scope=db)
  useEffect(() => {
    const handler = (e: any) => {
      const { scope, start, end } = e.detail || {}
      if (scope === 'db') {
        const s = start || ''
        const d = end || ''
        setStartDate(s)
        setEndDate(d)
        applyListFilter(s, d)
      }
    }
    window.addEventListener('dimicall-date-filter', handler as any)
    return () => window.removeEventListener('dimicall-date-filter', handler as any)
  }, [])

  // Transfert vers Table (sur demande App)
  useEffect(() => {
    const onTransfer = () => {
      const selected = events.filter(e => selectedIds.has(e.id))
      if (selected.length === 0) return
      const contacts: Contact[] = selected.map((ev, idx) => {
        const email = (ev as any).email || (ev as any).mail || ''
        const comment = (ev as any).commentaire || (ev as any).comment || ''
        const rawStatus = (ev as any).new_status ?? (ev as any).newStatus ?? ''
        const status = Object.values(ContactStatus).includes(rawStatus as ContactStatus)
          ? (rawStatus as ContactStatus)
          : ContactStatus.NonDefini
        return {
          id: ev.contact_id || String(ev.id),
          numeroLigne: ev.id || (idx + 1),
          prenom: ev.prenom || '',
          nom: ev.nom || '',
          telephone: ev.telephone || '',
          email,
          source: 'Données',
          statut: status,
          commentaire: comment,
          dateRappel: ev.dateRappel || '',
          heureRappel: ev.heureRappel || '',
          dateRDV: ev.dateRDV || '',
          heureRDV: ev.heureRDV || '',
          dateAppel: ev.dateAppel || '',
          heureAppel: ev.heureAppel || '',
          dureeAppel: ev.dureeAppel || '',
          lien: '',
        }
      })
      const name = `Sélection Données (${new Date().toLocaleString('fr-FR')})`
      try {
        localStorage.setItem('dimicall-db-transfer-data', JSON.stringify({ contacts, name }))
      } catch {}
      // IMPORTANT: différer l'événement pour éviter setState durant le render d'un autre composant
      setTimeout(() => {
        try {
          window.dispatchEvent(new CustomEvent('dimicall-db-transferred', { detail: { contacts, name } }))
        } catch {}
      }, 0)
    }
    window.addEventListener('dimicall-db-transfer', onTransfer as any)
    return () => window.removeEventListener('dimicall-db-transfer', onTransfer as any)
  }, [events, selectedIds])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1" style={{ minHeight: 0, overflow: 'hidden' }}>
        {/* Recherche locale */}
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher dans Données…"
            className="h-8 text-xs max-w-sm"
          />
        </div>

        <Table className="relative w-full table-auto min-w-[560px] md:min-w-0">
          <TableHeader
            className="[&_tr]:border-b"
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 90,
              backgroundColor: 'hsl(var(--background))',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              borderBottom: '1px solid hsl(var(--border))',
              willChange: 'transform',
              transform: 'translateZ(0)'
            }}
          >
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="px-2 py-1.5 text-center text-xs min-w-[38px]">
                <Checkbox
                  checked={allPageSelected ? true : (somePageSelected ? 'indeterminate' as any : false)}
                  onCheckedChange={(v) => toggleAllPage(!!v)}
                  aria-label="Tout sélectionner"
                />
              </TableHead>
              <TableHead onClick={() => { setSortKey('id'); setSortDir(prev => (sortKey === 'id' && prev === 'asc') ? 'desc' : 'asc') }} className="px-2 py-1.5 text-center text-xs min-w-[60px] cursor-pointer select-none">
                <div className="inline-flex items-center gap-1 justify-center">
                  # {sortKey === 'id' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/> ) : <ArrowUpDown className="w-3 h-3 text-muted-foreground"/>}
                </div>
              </TableHead>
              <TableHead onClick={() => { setSortKey('prenom'); setSortDir(prev => (sortKey === 'prenom' && prev === 'asc') ? 'desc' : 'asc') }} className="px-2 py-1.5 text-center text-xs min-w-[100px] cursor-pointer select-none">
                <div className="inline-flex items-center gap-1 justify-center">Prénom {sortKey === 'prenom' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/> ) : <ArrowUpDown className="w-3 h-3 text-muted-foreground"/>}</div>
              </TableHead>
              <TableHead onClick={() => { setSortKey('nom'); setSortDir(prev => (sortKey === 'nom' && prev === 'asc') ? 'desc' : 'asc') }} className="px-2 py-1.5 text-center text-xs min-w-[100px] cursor-pointer select-none">
                <div className="inline-flex items-center gap-1 justify-center">Nom {sortKey === 'nom' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/> ) : <ArrowUpDown className="w-3 h-3 text-muted-foreground"/>}</div>
              </TableHead>
              <TableHead onClick={() => { setSortKey('telephone'); setSortDir(prev => (sortKey === 'telephone' && prev === 'asc') ? 'desc' : 'asc') }} className="px-2 py-1.5 text-center text-xs min-w-[150px] cursor-pointer select-none">
                <div className="inline-flex items-center gap-1 justify-center">Téléphone {sortKey === 'telephone' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/> ) : <ArrowUpDown className="w-3 h-3 text-muted-foreground"/>}</div>
              </TableHead>
              <TableHead onClick={() => { setSortKey('email' as any); setSortDir(prev => (sortKey === 'email' && prev === 'asc') ? 'desc' : 'asc') }} className="px-2 py-1.5 text-center text-xs min-w-[150px] cursor-pointer select-none">
                <div className="inline-flex items-center gap-1 justify-center">Mail {sortKey === 'email' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/> ) : <ArrowUpDown className="w-3 h-3 text-muted-foreground"/>}</div>
              </TableHead>
              <TableHead onClick={() => { setSortKey('new_status' as any); setSortDir(prev => (sortKey === 'new_status' && prev === 'asc') ? 'desc' : 'asc') }} className="px-2 py-1.5 text-center text-xs min-w-[100px] cursor-pointer select-none">
                <div className="inline-flex items-center gap-1 justify-center">Statut {sortKey === 'new_status' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/> ) : <ArrowUpDown className="w-3 h-3 text-muted-foreground"/>}</div>
              </TableHead>
              <TableHead onClick={() => { setSortKey('commentaire' as any); setSortDir(prev => (sortKey === 'commentaire' && prev === 'asc') ? 'desc' : 'asc') }} className="px-2 py-1.5 text-center text-xs min-w-[120px] cursor-pointer select-none">
                <div className="inline-flex items-center gap-1 justify-center">Commentaire {sortKey === 'commentaire' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/> ) : <ArrowUpDown className="w-3 h-3 text-muted-foreground"/>}</div>
              </TableHead>
              <TableHead onClick={() => { setSortKey('dateRappel'); setSortDir(prev => (sortKey === 'dateRappel' && prev === 'asc') ? 'desc' : 'asc') }} className="px-2 py-1.5 text-center text-xs min-w-[100px] cursor-pointer select-none">Date Rappel</TableHead>
              <TableHead onClick={() => { setSortKey('heureRappel'); setSortDir(prev => (sortKey === 'heureRappel' && prev === 'asc') ? 'desc' : 'asc') }} className="px-2 py-1.5 text-center text-xs min-w-[100px] cursor-pointer select-none">Heure Rappel</TableHead>
              <TableHead onClick={() => { setSortKey('dateRDV'); setSortDir(prev => (sortKey === 'dateRDV' && prev === 'asc') ? 'desc' : 'asc') }} className="px-2 py-1.5 text-center text-xs min-w-[100px] cursor-pointer select-none">Date RDV</TableHead>
              <TableHead onClick={() => { setSortKey('heureRDV'); setSortDir(prev => (sortKey === 'heureRDV' && prev === 'asc') ? 'desc' : 'asc') }} className="px-2 py-1.5 text-center text-xs min-w-[100px] cursor-pointer select-none">Heure RDV</TableHead>
              <TableHead onClick={() => { setSortKey('dateAppel'); setSortDir(prev => (sortKey === 'dateAppel' && prev === 'asc') ? 'desc' : 'asc') }} className="px-2 py-1.5 text-center text-xs min-w-[100px] cursor-pointer select-none">Date Appel</TableHead>
              <TableHead onClick={() => { setSortKey('heureAppel'); setSortDir(prev => (sortKey === 'heureAppel' && prev === 'asc') ? 'desc' : 'asc') }} className="px-2 py-1.5 text-center text-xs min-w-[100px] cursor-pointer select-none">Heure Appel</TableHead>
              <TableHead onClick={() => { setSortKey('dateEntree'); setSortDir(prev => (sortKey === 'dateEntree' && prev === 'asc') ? 'desc' : 'asc') }} className="px-2 py-1.5 text-center text-xs min-w-[100px] cursor-pointer select-none">Date Entrée</TableHead>
              <TableHead onClick={() => { setSortKey('heureEntree'); setSortDir(prev => (sortKey === 'heureEntree' && prev === 'asc') ? 'desc' : 'asc') }} className="px-2 py-1.5 text-center text-xs min-w-[100px] cursor-pointer select-none">Heure Entrée</TableHead>
              <TableHead onClick={() => { setSortKey('dureeAppel'); setSortDir(prev => (sortKey === 'dureeAppel' && prev === 'asc') ? 'desc' : 'asc') }} className="px-2 py-1.5 text-center text-xs min-w-[100px] cursor-pointer select-none">Durée Appel</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell className="p-4 text-center text-muted-foreground" colSpan={16}>
                  {isLoading ? 'Chargement…' : 'Aucune donnée à afficher.'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((ev) => {
                const email = (ev as any).email || (ev as any).mail || ''
                const comment = (ev as any).commentaire || (ev as any).comment || ''
                const dateAppel = ev.dateAppel || ''
                const heureAppel = ev.heureAppel || ''
                const isSelected = selectedId === ev.id
                const startEdit = (field: keyof StatusEvent, value: any) => {
                  setEditing({ id: ev.id, field, value: String(value ?? '') })
                }
                const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') commitEdit()
                  if (e.key === 'Escape') setEditing(null)
                }
                return (
                  <TableRow
                    key={ev.id}
                    data-contact-id={ev.contact_id}
                    className={
                      (isSelected ? 'bg-blue-100 dark:bg-blue-900/60 ' : (isRowSelected(ev.id) ? 'bg-blue-50 dark:bg-blue-900/40 ' : '')) + 'hover:bg-muted/50 cursor-pointer transition-colors duration-150 border-b'
                    }
                    onClick={() => setSelectedId(ev.id)}
                  >
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={isRowSelected(ev.id)} onCheckedChange={(v) => toggleRow(ev.id, !!v)} aria-label="Sélectionner la ligne" />
                    </TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap">{ev.id}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap" onDoubleClick={() => startEdit('prenom', ev.prenom)}>
                      {editing?.id === ev.id && editing.field === 'prenom' ? (
                        <input className="h-7 px-2 text-xs border rounded w-full" value={editing.value} autoFocus onChange={(e) => setEditing({ ...editing, value: e.target.value })} onBlur={commitEdit} onKeyDown={onKeyDown} />
                      ) : (
                        ev.prenom || ''
                      )}
                    </TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap" onDoubleClick={() => startEdit('nom', ev.nom)}>
                      {editing?.id === ev.id && editing.field === 'nom' ? (
                        <input className="h-7 px-2 text-xs border rounded w-full" value={editing.value} autoFocus onChange={(e) => setEditing({ ...editing, value: e.target.value })} onBlur={commitEdit} onKeyDown={onKeyDown} />
                      ) : (
                        ev.nom || ''
                      )}
                    </TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap font-mono" onDoubleClick={() => startEdit('telephone', ev.telephone)}>
                      {editing?.id === ev.id && editing.field === 'telephone' ? (
                        <input className="h-7 px-2 text-xs border rounded w-full" value={editing.value} autoFocus onChange={(e) => setEditing({ ...editing, value: e.target.value })} onBlur={commitEdit} onKeyDown={onKeyDown} />
                      ) : (
                        ev.telephone || ''
                      )}
                    </TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap" onDoubleClick={() => startEdit('email', email)}>
                      {editing?.id === ev.id && editing.field === 'email' ? (
                        <input className="h-7 px-2 text-xs border rounded w-full" value={editing.value} autoFocus onChange={(e) => setEditing({ ...editing, value: e.target.value })} onBlur={commitEdit} onKeyDown={onKeyDown} />
                      ) : (
                        <span className="truncate block max-w-[180px] mx-auto" title={email}>{email}</span>
                      )}
                    </TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap font-medium" onDoubleClick={() => startEdit('new_status', (ev as any).new_status ?? (ev as any).newStatus)}>
                      {editing?.id === ev.id && (editing.field === 'new_status') ? (
                        <input className="h-7 px-2 text-xs border rounded w-full" value={editing.value} autoFocus onChange={(e) => setEditing({ ...editing, value: e.target.value })} onBlur={commitEdit} onKeyDown={onKeyDown} />
                      ) : (
                        (ev as any).new_status ?? (ev as any).newStatus ?? ''
                      )}
                    </TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap" onDoubleClick={() => startEdit('commentaire', comment)}>
                      {editing?.id === ev.id && editing.field === 'commentaire' ? (
                        <input className="h-7 px-2 text-xs border rounded w-full" value={editing.value} autoFocus onChange={(e) => setEditing({ ...editing, value: e.target.value })} onBlur={commitEdit} onKeyDown={onKeyDown} />
                      ) : (
                        comment
                      )}
                    </TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap" onDoubleClick={() => startEdit('dateRappel', ev.dateRappel)}>{ev.dateRappel || ''}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap" onDoubleClick={() => startEdit('heureRappel', ev.heureRappel)}>{ev.heureRappel || ''}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap" onDoubleClick={() => startEdit('dateRDV', ev.dateRDV)}>{ev.dateRDV || ''}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap" onDoubleClick={() => startEdit('heureRDV', ev.heureRDV)}>{ev.heureRDV || ''}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap" onDoubleClick={() => startEdit('dateAppel', dateAppel)}>{dateAppel}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap" onDoubleClick={() => startEdit('heureAppel', heureAppel)}>{heureAppel}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap">{ev.dateEntree || (ev.applied_at ? new Date(ev.applied_at).toLocaleDateString() : '')}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap">{ev.heureEntree || (ev.applied_at ? new Date(ev.applied_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}</TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap" onDoubleClick={() => startEdit('dureeAppel', ev.dureeAppel)}>{ev.dureeAppel || ''}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Barre d'actions + Pagination sticky en bas */}
      <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-3 py-1.5 pb-4">
          <TablePagination
            className="w-full"
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            pageSizeOptions={[25, 50, 100]}
            showFirstLast={true}
            showPageInfo={true}
          />
        </div>
      </div>
    </div>
  )
}


