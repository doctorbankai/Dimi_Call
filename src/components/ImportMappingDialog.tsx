import React, { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { formatPhoneNumber, normalizeHeader, normalizePhoneNumber } from '../services/dataService'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Sparkles, TriangleAlert } from 'lucide-react'
import { useSupabaseShare } from '@/hooks/useSupabaseShare'
import { supabaseService } from '@/services/supabaseService'
import { extractPhoneCandidates } from '@/services/phoneUtils'

type HeaderOption = {
  label: string
  value: string
}

interface ImportMappingDialogProps {
  isOpen: boolean
  onClose: () => void
  fileName?: string
  detectedHeaders: string[]
  previewRows: string[][]
  expectedTargets: HeaderOption[]
  requiredTargets: string[]
  onConfirm: (mapping: Record<string, string>, options: { phonesToRemove?: string[] }) => void
  onPreviewUpdate?: (rows: string[][]) => void
  onRemovedPhonesChange?: (phones: string[]) => void
}

export const ImportMappingDialog: React.FC<ImportMappingDialogProps> = ({
  isOpen,
  onClose,
  fileName,
  detectedHeaders,
  previewRows,
  expectedTargets,
  requiredTargets,
  onConfirm,
  onPreviewUpdate,
  onRemovedPhonesChange,
}) => {
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [phoneWarnings, setPhoneWarnings] = useState<{
    shared: number
    blacklist: number
    normalized: string[]
    details: { phone: string; source: 'shared' | 'blacklist'; rows: number[]; prenom?: string; nom?: string }[]
  }>({ shared: 0, blacklist: 0, normalized: [], details: [] })
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [isCheckingPhones, setIsCheckingPhones] = useState(false)
  const { state } = useSupabaseShare()
  const [filterMode, setFilterMode] = useState<'none' | 'remove' | 'isolate'>('none')
  const [preview, setPreview] = useState<string[][]>(previewRows || [])
  const [originalPreview, setOriginalPreview] = useState<string[][]>(previewRows || [])
  const [removedPhones, setRemovedPhones] = useState<string[]>([])
  const [statusMessage, setStatusMessage] = useState<string>('')
  const dialogContentRef = React.useRef<HTMLDivElement>(null)

  const requiredSet = useMemo(() => new Set(requiredTargets), [requiredTargets])

  const headers = detectedHeaders || []
  const rows = preview

  const assignedTargets = useMemo(() => new Set(Object.values(mapping).filter(Boolean)), [mapping])
  const conflictingMappings = useMemo(() => {
    const conflicts: Record<string, string[]> = {}
    Object.entries(mapping).forEach(([header, target]) => {
      if (target && target !== 'no-mapping') {
        if (!conflicts[target]) conflicts[target] = []
        conflicts[target].push(header)
      }
    })
    return Object.fromEntries(Object.entries(conflicts).filter(([_, hs]) => hs.length > 1))
  }, [mapping])

  const suggestions = useMemo(() => {
    const m: Record<string, string> = {}
    headers.forEach((h) => {
      const norm = normalizeHeader(h || '')
      const match = expectedTargets.find((opt) => opt.value === norm)
      if (match) m[h] = match.value
    })
    return m
  }, [headers, expectedTargets])

  useEffect(() => {
    setMapping((prev) => {
      const next = { ...prev }
      headers.forEach((h) => {
        if (!next[h] && suggestions[h]) {
          next[h] = suggestions[h]
        }
      })
      return next
    })
  }, [headers, suggestions])

  useEffect(() => {
    setPreview(previewRows || [])
    setOriginalPreview(previewRows || [])
    setFilterMode('none')
    setRemovedPhones([])
    setStatusMessage('')
    onPreviewUpdate?.(previewRows || [])
    onRemovedPhonesChange?.([])
  }, [previewRows])

  useEffect(() => {
    if (!previewRows.length || !state.supabaseReady) {
      setPhoneWarnings({ shared: 0, blacklist: 0, normalized: [], details: [] })
      return
    }
    const phoneColumn = headers.find((h) => (mapping[h] ?? suggestions[h]) === 'telephone')
    if (!phoneColumn) {
      setPhoneWarnings({ shared: 0, blacklist: 0, normalized: [], details: [] })
      return
    }
    const phoneIndex = headers.indexOf(phoneColumn)
    const importedPhones = previewRows
      .map((row) => extractPhoneCandidates(row?.[phoneIndex]))
      .flat()
      .map(normalizePhoneNumber)
      .filter(Boolean) as string[]
    
    console.log('[ImportMappingDialog] 🔍 Vérification Supabase', {
      previewRowsCount: previewRows.length,
      phoneColumn,
      phoneIndex,
      importedPhonesCount: importedPhones.length,
      importedPhonesSample: importedPhones.slice(0, 3),
      supabaseReady: state.supabaseReady
    })
    
    if (importedPhones.length === 0) {
      console.log('[ImportMappingDialog] ⚠️ Aucun numéro importé détecté')
      setPhoneWarnings({ shared: 0, blacklist: 0, normalized: [], details: [] })
      return
    }
    let abort = false
    ;(async () => {
      setIsCheckingPhones(true)
      try {
        if (!supabaseService.isReady()) {
          setPhoneWarnings({ shared: 0, blacklist: 0, normalized: [], details: [] })
          return
        }
        const client = supabaseService.getClient()
        const uniquePhones = Array.from(new Set(importedPhones))
        const batches = chunk(uniquePhones, 500)
        const sharedMatches: string[] = []
        const blacklistMatches: string[] = []
        const details: { phone: string; source: 'shared' | 'blacklist'; rows: number[]; prenom?: string; nom?: string }[] = []
        for (const batch of batches) {
          if (abort) return
          const [{ data: sharedData, error: sharedError }, { data: blacklistData, error: blacklistError }] = await Promise.all([
            client.from('shared_phone_numbers').select('normalized_phone, prenom, nom').in('normalized_phone', batch),
            client.from('shared_blacklist_numbers').select('normalized_phone, prenom, nom').in('normalized_phone', batch)
          ])
          if (sharedError || blacklistError) {
            console.error('[ImportMappingDialog] ❌ Erreur vérification numéros', sharedError || blacklistError)
            continue
          }
          
          console.log('[ImportMappingDialog] 📊 Résultats Supabase', {
            batchSize: batch.length,
            sharedDataCount: (sharedData || []).length,
            blacklistDataCount: (blacklistData || []).length,
            sharedData: sharedData?.slice(0, 2),
            blacklistData: blacklistData?.slice(0, 2)
          })
          
          // Traiter les numéros partagés
          if (Array.isArray(sharedData)) {
            for (const item of sharedData) {
              const num = item.normalized_phone
              if (num) {
                sharedMatches.push(num)
                const rows = previewRows.reduce<number[]>((acc, row, idx) => {
                  const candidates = extractPhoneCandidates(row?.[phoneIndex])
                  const match = candidates.some((candidate) => normalizePhoneNumber(candidate) === num)
                  if (match) acc.push(idx + 1)
                  return acc
                }, [])
                details.push({ 
                  phone: num, 
                  source: 'shared', 
                  rows,
                  prenom: item.prenom || undefined,
                  nom: item.nom || undefined
                })
              }
            }
          }
          
          // Traiter les numéros en liste noire
          if (Array.isArray(blacklistData)) {
            for (const item of blacklistData) {
              const num = item.normalized_phone
              if (num) {
                blacklistMatches.push(num)
                const rows = previewRows.reduce<number[]>((acc, row, idx) => {
                  const candidates = extractPhoneCandidates(row?.[phoneIndex])
                  const match = candidates.some((candidate) => normalizePhoneNumber(candidate) === num)
                  if (match) acc.push(idx + 1)
                  return acc
                }, [])
                details.push({ 
                  phone: num, 
                  source: 'blacklist', 
                  rows,
                  prenom: item.prenom || undefined,
                  nom: item.nom || undefined
                })
              }
            }
          }
        }
        setPhoneWarnings({
          shared: sharedMatches.length,
          blacklist: blacklistMatches.length,
          normalized: Array.from(new Set([...sharedMatches, ...blacklistMatches])),
          details
        })
      } catch (error) {
        console.error('[ImportMappingDialog] Vérification Supabase impossible', error)
        setPhoneWarnings({ shared: 0, blacklist: 0, normalized: [], details: [] })
      } finally {
        if (!abort) setIsCheckingPhones(false)
      }
    })()
    return () => { abort = true }
  }, [previewRows, headers, mapping, suggestions, state.supabaseReady])

  const applyFilter = (mode: 'remove' | 'isolate') => {
    console.log('[ImportMappingDialog] 🔘 Action sur les lignes détectées', { mode, lignesInitiales: previewRows.length, numerosDetectes: phoneWarnings.normalized })
    setFilterMode(mode)
    setStatusMessage(mode === 'remove' ? 'Les lignes détectées seront ignorées lors de l’import.' : 'Affichage des seules lignes détectées.')
    const phoneColumn = headers.find((h) => (mapping[h] ?? suggestions[h]) === 'telephone')
    if (!phoneColumn) {
      console.warn('[ImportMappingDialog] ⚠️ Impossible d’appliquer le filtre: aucune colonne Téléphone définie')
      return
    }
    const idx = headers.indexOf(phoneColumn)
    if (mode === 'remove') {
      const filtered = (previewRows || []).filter((row, rowIdx) => {
        const candidates = extractPhoneCandidates(row?.[idx])
        const normalizedCandidates = candidates.map(normalizePhoneNumber).filter(Boolean) as string[]
        const keep = normalizedCandidates.every((candidate) => !phoneWarnings.normalized.includes(candidate))
        if (!keep) {
          console.log('[ImportMappingDialog] ❌ Ligne exclue', { rowIdx, telephone: row?.[idx], candidats: normalizedCandidates })
        }
        return keep
      })
      const removed = (previewRows || []).filter((row) => {
        const candidates = extractPhoneCandidates(row?.[idx])
        const normalizedCandidates = candidates.map(normalizePhoneNumber).filter(Boolean) as string[]
        return normalizedCandidates.some((candidate) => phoneWarnings.normalized.includes(candidate))
      })
      console.log('[ImportMappingDialog] 🧹 Suppression des lignes détectées', {
        lignesRestantes: filtered.length,
        lignesSupprimées: removed.length,
        numsSupprimes: removed
          .map((row) => extractPhoneCandidates(row?.[idx]).map(normalizePhoneNumber).filter(Boolean))
          .flat()
      })
      console.log('[ImportMappingDialog] 💾 Mise à jour de removedPhones:', JSON.stringify(phoneWarnings.normalized))
      setPreview(filtered)
      setRemovedPhones(phoneWarnings.normalized)
      // NE PAS appeler onPreviewUpdate ici car cela déclenche un re-render qui réinitialise removedPhones
      // onPreviewUpdate?.(filtered)
      onRemovedPhonesChange?.(phoneWarnings.normalized)
    } else {
      const isolated = (previewRows || []).filter((row, rowIdx) => {
        const candidates = extractPhoneCandidates(row?.[idx])
        const normalizedCandidates = candidates.map(normalizePhoneNumber).filter(Boolean) as string[]
        const keep = normalizedCandidates.some((candidate) => phoneWarnings.normalized.includes(candidate))
        if (keep) {
          console.log('[ImportMappingDialog] 🔍 Ligne conservée pour visualisation', { rowIdx, telephone: row?.[idx], candidats: normalizedCandidates })
        }
        return keep
      })
      console.log('[ImportMappingDialog] 🔍 Isolation des lignes détectées', { lignesIsolées: isolated.length })
      setPreview(isolated)
      setRemovedPhones([])
      // NE PAS appeler onPreviewUpdate ici car cela déclenche un re-render qui réinitialise l'état
      // onPreviewUpdate?.(isolated)
      onRemovedPhonesChange?.([])
    }
  }

  const resetFilter = () => {
    console.log('[ImportMappingDialog] ↩️ Réinitialisation du filtre', { modeActuel: filterMode })
    setFilterMode('none')
    const restored = originalPreview || previewRows || []
    setPreview(restored)
    setRemovedPhones([])
    setStatusMessage('')
    // NE PAS appeler onPreviewUpdate ici car cela déclenche un re-render qui réinitialise l'état
    // onPreviewUpdate?.(restored)
    onRemovedPhonesChange?.([])
  }

  const filteredRows = useMemo(() => {
    if (filterMode !== 'isolate' || phoneWarnings.normalized.length === 0) return rows
    const phoneColumn = headers.find((h) => (mapping[h] ?? suggestions[h]) === 'telephone')
    if (!phoneColumn) return rows
    const idx = headers.indexOf(phoneColumn)
    return rows.filter((row) => {
      const candidates = extractPhoneCandidates(row?.[idx])
      const normalizedCandidates = candidates.map(normalizePhoneNumber).filter(Boolean) as string[]
      return normalizedCandidates.some((candidate) => phoneWarnings.normalized.includes(candidate))
    })
  }, [rows, headers, mapping, suggestions, filterMode, phoneWarnings.normalized])

  const importedPreview = filterMode === 'isolate' ? filteredRows : rows

  const detailsSummary = useMemo(() => {
    if (!phoneWarnings.details.length) return []
    return phoneWarnings.details.map((item) => ({
      ...item,
      formattedPhone: formatPhoneNumber(item.phone),
      rowCount: item.rows.length
    }))
  }, [phoneWarnings.details])

  const supabaseMatchesSet = useMemo(() => new Set(phoneWarnings.normalized), [phoneWarnings.normalized])

  const unmappedCount = useMemo(() => headers.filter((h) => !mapping[h]).length, [headers, mapping])
  const ignoredCount = useMemo(() => Object.values(mapping).filter(target => target === 'no-mapping').length, [mapping])
  const conflictCount = useMemo(() => Object.keys(conflictingMappings).length, [conflictingMappings])

  const isValid = useMemo(() => {
    // chaque required target doit être mappée par au moins un header
    // (en excluant les colonnes ignorées "no-mapping")
    const mappedTargets = Object.values(mapping).filter(target => target !== 'no-mapping')
    for (const req of requiredSet) {
      if (!mappedTargets.includes(req)) return false
    }
    // Il ne doit pas y avoir de conflits de mapping
    return conflictCount === 0
  }, [mapping, requiredSet, conflictCount])

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
        <DialogContent ref={dialogContentRef} className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-[1400px] w-full max-h-[95vh] overflow-hidden flex flex-col p-3 sm:p-4 lg:p-6">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Importer et mapper les colonnes</DialogTitle>
            <DialogDescription>
              {fileName ? `Fichier: ${fileName}` : 'Sélectionnez la correspondance entre vos colonnes et les champs attendus.'}
            </DialogDescription>
          </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 overflow-y-auto flex-1 min-h-0">
          <div className="bg-muted/40 rounded-md border p-3 text-sm">
            <div className="font-medium mb-1">Règles d’import</div>
            <div className="text-muted-foreground">
              - Champs obligatoires: Prénom, Nom, Téléphone. Vous pouvez ajouter Email, Source, Statut, Commentaire, Date/Heure Rappel, Date/Heure RDV, Date/Heure Appel, Durée Appel, Lien, etc.
            </div>
          </div>

          <Tabs defaultValue="mapping">
            <TabsList>
              <TabsTrigger value="mapping">Mapping des en-têtes</TabsTrigger>
              <TabsTrigger value="preview">Aperçu (5 premières lignes)</TabsTrigger>
            </TabsList>

            <div className="mt-4 rounded-md border bg-muted/30 p-3 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                  <TriangleAlert className={cn('h-4 w-4', (phoneWarnings.shared || phoneWarnings.blacklist) ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')} />
                  Vérification Supabase
                </div>
                <div className="text-[11px] sm:text-xs text-muted-foreground">
                  {isCheckingPhones ? 'Analyse des numéros…' : state.supabaseReady ? 'Connexion Supabase active' : 'Supabase non connecté'}
                </div>
              </div>
              <Separator />
              {!state.supabaseReady ? (
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Connectez Supabase pour détecter automatiquement les numéros présents dans vos tables partagées et liste noire.
                </div>
              ) : (phoneWarnings.shared === 0 && phoneWarnings.blacklist === 0) ? (
                <div className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                  Aucun numéro détecté dans les tables Supabase correspondantes.
                </div>
              ) : (
                <div className="space-y-3 text-xs sm:text-sm">
                  {phoneWarnings.shared > 0 && (
                    <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                      <span className="font-medium">• {phoneWarnings.shared} numéro(s) déjà partagés</span>
                    </div>
                  )}
                  {phoneWarnings.blacklist > 0 && (
                    <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
                      <span className="font-medium">• {phoneWarnings.blacklist} numéro(s) figurent dans la liste noire</span>
                    </div>
                  )}
                  <div className="grid gap-3 rounded-md border border-amber-200/70 bg-amber-50 dark:bg-amber-900/15 p-3">
                    <p className="text-muted-foreground">
                      Les lignes concernées peuvent être retirées automatiquement avant import pour éviter les doublons ou respecter la liste noire. Vous pouvez également isoler ces lignes pour vérification.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="text-[11px] sm:text-xs h-7" onClick={() => applyFilter('remove')}>
                        Supprimer les lignes détectées
                      </Button>
                      <Button variant="outline" size="sm" className="text-[11px] sm:text-xs h-7" onClick={() => applyFilter('isolate')}>
                        Voir uniquement les lignes détectées
                      </Button>
                      {filterMode !== 'none' && (
                        <Button variant="ghost" size="sm" className="text-[11px] sm:text-xs h-7" onClick={resetFilter}>
                          Réinitialiser
                        </Button>
                      )}
                      {phoneWarnings.details.length > 0 && (
                        <Button variant="ghost" size="sm" className="text-[11px] sm:text-xs h-7" onClick={() => {
                          console.log('[ImportMappingDialog] 📋 Détails numéros détectés', phoneWarnings.details)
                          setDetailsOpen(true)
                        }}>
                          Détails
                        </Button>
                      )}
                    </div>
                    {filterMode !== 'none' && (
                      <div className="rounded-md border border-amber-300 bg-amber-100/80 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100 px-3 py-2 flex items-center justify-between">
                        <span>{statusMessage}</span>
                        <button onClick={resetFilter} className="underline text-[11px] sm:text-xs">Annuler</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <TabsContent value="mapping" className="mt-2">
              <div className="rounded-lg border">
                <div className="bg-muted/50 rounded-t-lg">
                  {/* Ligne 1 : Titres des colonnes */}
                  <div className="grid grid-cols-12 gap-2 sm:gap-4 p-2 sm:p-3 border-b">
                    <div className="col-span-5 font-medium text-xs sm:text-sm">Colonne détectée</div>
                    <div className="col-span-7 font-medium text-xs sm:text-sm">Associer à</div>
                  </div>
                  
                  {/* Ligne 2 : Badges et actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <Badge variant={unmappedCount === 0 ? 'default' : 'secondary'} className="h-5 px-2 text-xs">
                        {headers.length - unmappedCount}/{headers.length} mappées
                      </Badge>
                      {conflictCount > 0 && (
                        <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>{conflictCount} conflit(s)</span>
                        </div>
                      )}
                      {ignoredCount > 0 && (
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{ignoredCount} ignorée(s)</span>
                        </div>
                      )}
                      {unmappedCount > 0 && (
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>{unmappedCount} non reconnue(s)</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs"
                        onClick={() => setMapping((prev) => ({ ...prev, ...suggestions }))}
                        title="Tenter l'auto-détection"
                      >
                        <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Auto-détection</span>
                      </Button>
                      {conflictCount > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs text-red-600 hover:text-red-700"
                          onClick={() => {
                            const newMapping = { ...mapping }
                            Object.entries(conflictingMappings).forEach(([target, headers]) => {
                              // Garder seulement la première colonne, ignorer les autres
                              headers.slice(1).forEach(header => {
                                newMapping[header] = 'no-mapping'
                              })
                            })
                            setMapping(newMapping)
                          }}
                          title="Résoudre automatiquement les conflits"
                        >
                          <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Résoudre conflits</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <ScrollArea className="h-[250px] sm:h-[300px] max-h-[30vh]">
                  <div className="divide-y">
                    {headers.map((h, idx) => {
                      const isUnmapped = !mapping[h]
                      const isIgnored = mapping[h] === 'no-mapping'
                      const isConflicting = Object.values(conflictingMappings).some(headers => headers.includes(h))
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "grid grid-cols-12 gap-2 sm:gap-4 p-2 sm:p-3 items-center",
                            isConflicting && "bg-red-50 dark:bg-red-900/10 border-l-2 sm:border-l-4 border-red-500",
                            isUnmapped && "bg-amber-50 dark:bg-amber-900/10",
                            isIgnored && "bg-blue-50 dark:bg-blue-900/10"
                          )}
                        >
                          <div className="col-span-5 truncate flex items-center gap-1 sm:gap-2 text-xs sm:text-sm" title={h}>
                            {isConflicting ? (
                              <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                            ) : isIgnored ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            ) : isUnmapped ? (
                              <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            )}
                            <span className="truncate">{h || '(vide)'}</span>
                            {isConflicting && (
                              <span className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 ml-0.5 sm:ml-1 shrink-0">
                                (conflit)
                              </span>
                            )}
                          </div>
                        <div className="col-span-7">
                          <Select
                            value={mapping[h] ?? undefined}
                            onValueChange={(val) => setMapping((m) => {
                              const next = { ...m } as Record<string, string>
                              if (val === 'no-mapping') { delete next[h] } else { next[h] = val }
                              return next
                            })}
                          >
                            <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm w-full max-w-full sm:max-w-md">
                              <SelectValue placeholder="Choisir un champ" />
                            </SelectTrigger>
                            <SelectContent container={dialogContentRef.current}>
                              <SelectItem value="no-mapping">(Ignorer)</SelectItem>
                              {expectedTargets.map((opt) => {
                                const isAlreadyAssigned = assignedTargets.has(opt.value) && mapping[h] !== opt.value
                                return (
                                  <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    disabled={isAlreadyAssigned}
                                    className={cn(
                                      'text-sm',
                                      requiredSet.has(opt.value) && 'font-semibold',
                                      isAlreadyAssigned && 'opacity-50 cursor-not-allowed'
                                    )}
                                  >
                                    {opt.label}
                                    {isAlreadyAssigned && ' (déjà utilisé)'}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-2">
              <div className="rounded-lg border overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40">
                      {headers.map((h, i) => (
                        <th key={i} className="px-2 py-1 text-left whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{h || '(vide)'}</span>
                            {mapping[h] && (
                              <span className="inline-flex items-center text-xs px-1 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                {mapping[h]}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importedPreview.slice(0, 5).map((r, i) => (
                      <tr key={i} className="border-t">
                        {headers.map((_, j) => (
                          <td key={j} className="px-2 py-1 whitespace-nowrap text-muted-foreground">
                            {r[j] ?? ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 flex-shrink-0 pt-3 sm:pt-4 border-t mt-3 sm:mt-4">
            <div className="text-[10px] sm:text-xs text-muted-foreground">
              {filterMode === 'remove' && removedPhones.length > 0
                ? `${removedPhones.length} numéro(s) seront ignorés lors de l’import.`
                : filterMode === 'isolate' && phoneWarnings.normalized.length > 0
                  ? `${phoneWarnings.normalized.length} ligne(s) en cours d’examen.`
                  : isValid
                    ? 'Prêt à importer'
                    : conflictingMappings && Object.keys(conflictingMappings).length > 0
                      ? `Résolvez les ${Object.keys(conflictingMappings).length} conflit(s) de mapping en choisissant "(Ignorer)" pour les colonnes en doublon.`
                      : 'Renseignez au minimum Prénom, Nom et Téléphone.'}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9">Annuler</Button>
              <Button disabled={!isValid} onClick={() => {
                console.log('[ImportMappingDialog] 📊 État avant validation:', {
                  filterMode,
                  removedPhonesLength: removedPhones.length,
                  removedPhones: JSON.stringify(removedPhones),
                  phoneWarningsNormalized: JSON.stringify(phoneWarnings.normalized)
                })
                
                const options = filterMode === 'remove' && removedPhones.length > 0
                  ? { phonesToRemove: removedPhones }
                  : {}
                
                console.log('[ImportMappingDialog] 🚀 Validation import', { 
                  filterMode, 
                  removedPhonesCount: removedPhones.length,
                  optionsPhonesToRemove: options.phonesToRemove ? JSON.stringify(options.phonesToRemove) : 'undefined'
                })
                onConfirm(mapping, options)
              }} className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9">Importer</Button>
            </div>
          </div>
        </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails des numéros détectés</DialogTitle>
            <DialogDescription>
              Numéros identifiés dans Supabase avec leurs lignes correspondantes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs sm:text-sm max-h-[60vh] overflow-y-auto">
            {detailsSummary.length === 0 ? (
              <p className="text-muted-foreground text-xs sm:text-sm">Aucun numéro détecté.</p>
            ) : (
              detailsSummary.map((item, index) => (
                <div
                  key={`${item.phone}-${index}`}
                  className="rounded-md border border-border/70 bg-muted/40 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{item.formattedPhone}</span>
                      {(item.prenom || item.nom) && (
                        <span className="text-[11px] text-muted-foreground">
                          {[item.prenom, item.nom].filter(Boolean).join(' ')}
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] sm:text-xs rounded px-2 py-0.5 border',
                        item.source === 'blacklist'
                          ? 'border-red-400 text-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-amber-400 text-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      )}
                    >
                      {item.source === 'blacklist' ? 'Liste noire' : 'Déjà partagé'}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    <p className="text-[11px] sm:text-xs">Lignes concernées :</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.rows.length > 0 ? (
                        item.rows.map((row) => (
                          <span
                            key={row}
                            className="inline-flex items-center rounded border bg-background px-2 py-0.5 text-[11px]"
                          >
                            Ligne {row}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px]">Non déterminé</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setDetailsOpen(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ImportMappingDialog

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

function filterRowsByPhones(normalizedPhones: string[], mode: 'remove' | 'isolate') {
  window.dispatchEvent(new CustomEvent('dimicall-import-filter-phones', { detail: { normalizedPhones, mode } }))
}


