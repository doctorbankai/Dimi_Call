import React, { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
// Replace alert import with a simple styled div to avoid missing component
import { cn } from '@/lib/utils'
import { normalizeHeader } from '../services/dataService'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Sparkles } from 'lucide-react'

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
  onConfirm: (mapping: Record<string, string>) => void
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
}) => {
  const [mapping, setMapping] = useState<Record<string, string>>({})

  const requiredSet = useMemo(() => new Set(requiredTargets), [requiredTargets])

  const headers = detectedHeaders || []
  const rows = previewRows || []

  const assignedTargets = useMemo(() => new Set(Object.values(mapping).filter(Boolean)), [mapping])
  
  // Détecter les conflits de mapping (plusieurs colonnes mappées au même champ)
  const conflictingMappings = useMemo(() => {
    const conflicts: Record<string, string[]> = {}
    Object.entries(mapping).forEach(([header, target]) => {
      if (target && target !== 'no-mapping') {
        if (!conflicts[target]) conflicts[target] = []
        conflicts[target].push(header)
      }
    })
    return Object.fromEntries(Object.entries(conflicts).filter(([_, headers]) => headers.length > 1))
  }, [mapping])

  // Auto-suggestions basées sur normalizeHeader + liste attendue
  const suggestions = useMemo(() => {
    const m: Record<string, string> = {}
    headers.forEach((h) => {
      const norm = normalizeHeader(h || '')
      const match = expectedTargets.find((opt) => opt.value === norm)
      if (match) m[h] = match.value
    })
    return m
  }, [headers, expectedTargets])

  // Initialiser/compléter automatiquement le mapping pour les headers non encore mappés
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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Importer et mapper les colonnes</DialogTitle>
          <DialogDescription>
            {fileName ? `Fichier: ${fileName}` : 'Sélectionnez la correspondance entre vos colonnes et les champs attendus.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4">
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

            <TabsContent value="mapping" className="mt-2">
              <div className="rounded-lg border">
                <div className="grid grid-cols-12 gap-2 p-2 bg-muted/50 text-xs font-medium">
                  <div className="col-span-5">Colonne détectée</div>
                  <div className="col-span-7 flex items-center justify-between">
                    <span>Associer à</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={unmappedCount === 0 ? 'default' : 'secondary'} className="h-5 px-2 text-[10px]">
                        {headers.length - unmappedCount}/{headers.length} mappées
                      </Badge>
                      {conflictCount > 0 && (
                        <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-[11px]">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>{conflictCount} conflit(s)</span>
                        </div>
                      )}
                      {ignoredCount > 0 && (
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{ignoredCount} ignorée(s)</span>
                        </div>
                      )}
                      {unmappedCount > 0 && (
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[11px]">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>{unmappedCount} non reconnue(s)</span>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => setMapping((prev) => ({ ...prev, ...suggestions }))}
                        title="Tenter l'auto-détection"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1" /> Auto-détection
                      </Button>
                      {conflictCount > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px] text-red-600 hover:text-red-700"
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
                          <AlertCircle className="h-3.5 w-3.5 mr-1" /> Résoudre conflits
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <ScrollArea className="h-[320px]">
                  <div className="divide-y">
                    {headers.map((h, idx) => {
                      const isUnmapped = !mapping[h]
                      const isIgnored = mapping[h] === 'no-mapping'
                      const isConflicting = Object.values(conflictingMappings).some(headers => headers.includes(h))
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "grid grid-cols-12 gap-2 p-2 items-center",
                            isConflicting && "bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500",
                            isUnmapped && "bg-amber-50 dark:bg-amber-900/10",
                            isIgnored && "bg-blue-50 dark:bg-blue-900/10"
                          )}
                        >
                          <div className="col-span-5 truncate flex items-center gap-1" title={h}>
                            {isConflicting ? (
                              <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                            ) : isIgnored ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            ) : isUnmapped ? (
                              <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            )}
                            <span>{h || '(vide)'}</span>
                            {isConflicting && (
                              <span className="text-xs text-red-600 dark:text-red-400 ml-1">
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
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Choisir un champ" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no-mapping">(Ignorer)</SelectItem>
                              {expectedTargets.map((opt) => {
                                const isAlreadyAssigned = assignedTargets.has(opt.value) && mapping[h] !== opt.value
                                return (
                                  <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    disabled={isAlreadyAssigned}
                                    className={cn(
                                      'text-xs',
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
                              <span className="inline-flex items-center text-[10px] px-1 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                {mapping[h]}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((r, i) => (
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

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {isValid ? 'Prêt à importer' : conflictCount > 0 ? 
                `Résolvez les ${conflictCount} conflit(s) de mapping en choisissant "(Ignorer)" pour les colonnes en doublon.` : 
                'Renseignez au minimum Prénom, Nom et Téléphone.'}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Annuler</Button>
              <Button disabled={!isValid} onClick={() => onConfirm(mapping)}>Importer</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ImportMappingDialog


