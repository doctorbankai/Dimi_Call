import path from 'path'
import fs from 'fs'

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
  // Nouvelles colonnes: date/heure d'entrée dans la table
  dateEntree?: string | null
  heureEntree?: string | null
  numeroLigne?: number | null
  source?: string | null
  statut?: string | null
  lien?: string | null
  sexe?: string | null
  don?: string | null
  qualite?: string | null
  type?: string | null
  date?: string | null
  uid?: string | null
  uid_supabase?: string | null
  utilisateur?: string | null
  actions?: string | null
  statutAppel?: string | null
  statutRDV?: string | null
  commentaireRDV?: string | null
}

type NewStatusEvent = Omit<StatusEvent, 'id' | 'applied_at'> & { applied_at?: string }

let dbFilePathMemo: string | null = null
let data: { events: StatusEvent[] } = { events: [] }

// CSV helpers
function csvEscape(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  const needsQuotes = /[",\n\r]/.test(str)
  const escaped = str.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}

const CSV_HEADERS: (keyof StatusEvent)[] = [
  'id',
  'contact_id',
  'old_status',
  'new_status',
  'applied_at',
  'prenom',
  'nom',
  'telephone',
  'email',
  'commentaire',
  'dateRappel',
  'heureRappel',
  'dateRDV',
  'heureRDV',
  'dateAppel',
  'heureAppel',
  'dureeAppel',
  'dateEntree',
  'heureEntree',
  'numeroLigne',
  'source',
  'statut',
  'lien',
  'sexe',
  'don',
  'qualite',
  'type',
  'date',
  'uid',
  'uid_supabase',
  'utilisateur',
  'actions',
  'statutAppel',
  'statutRDV',
  'commentaireRDV',
]

function toCsv(events: StatusEvent[]): string {
  const header = CSV_HEADERS.join(',')
  const rows = events.map(ev => CSV_HEADERS.map(h => csvEscape((ev as any)[h] ?? '')).join(','))
  return [header, ...rows].join('\n') + '\n'
}

function parseCsv(content: string): StatusEvent[] {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim().length > 0)
  if (lines.length === 0) return []
  const headerLine = lines[0]
  const headers = splitCsvLine(headerLine)
  const indexOf = (name: string) => headers.findIndex(h => h === name)

  const idx: Record<string, number> = {}
  CSV_HEADERS.forEach(h => { idx[h] = indexOf(h) })

  const rows: StatusEvent[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i])
    const get = (name: keyof StatusEvent): string | null => {
      const j = idx[name as string]
      if (j === -1 || j === undefined) return null
      const v = cols[j]
      return (v === undefined || v === '') ? null : v
    }
    const idRaw = get('id')
    const id = idRaw ? Number(idRaw) : NaN
    const ev: StatusEvent = {
      id: Number.isFinite(id) ? id : 0,
      contact_id: get('contact_id') ?? '',
      old_status: get('old_status'),
      new_status: (get('new_status') ?? '') as string,
      applied_at: (get('applied_at') ?? new Date().toISOString()) as string,
      prenom: get('prenom'),
      nom: get('nom'),
      telephone: get('telephone'),
      email: get('email'),
      commentaire: get('commentaire'),
      dateRappel: get('dateRappel'),
      heureRappel: get('heureRappel'),
      dateRDV: get('dateRDV'),
      heureRDV: get('heureRDV'),
      dateAppel: get('dateAppel'),
      heureAppel: get('heureAppel'),
      dureeAppel: get('dureeAppel'),
      dateEntree: get('dateEntree'),
      heureEntree: get('heureEntree'),
    numeroLigne: get('numeroLigne') ? Number(get('numeroLigne')) : null,
    source: get('source'),
    statut: get('statut'),
    lien: get('lien'),
    sexe: get('sexe'),
    don: get('don'),
    qualite: get('qualite'),
    type: get('type'),
    date: get('date'),
    uid: get('uid'),
    uid_supabase: get('uid_supabase'),
    utilisateur: get('utilisateur'),
    actions: get('actions'),
    statutAppel: get('statutAppel'),
    statutRDV: get('statutRDV'),
    commentaireRDV: get('commentaireRDV'),
    }
    rows.push(ev)
  }
  // Trier par id desc si présent, sinon par applied_at desc
  rows.sort((a, b) => (b.id || 0) - (a.id || 0))
  return rows
}

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        // Double quote escapes
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === ',') {
        result.push(current)
        current = ''
      } else if (ch === '"') {
        inQuotes = true
      } else {
        current += ch
      }
    }
  }
  result.push(current)
  return result
}

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function readFileSafe(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8')
      data.events = parseCsv(raw)
      return
    }

    // Migration automatique depuis l'ancien JSON si présent
    const jsonPath = filePath.replace(/\.csv$/, '.json')
    if (fs.existsSync(jsonPath)) {
      try {
        const rawJson = fs.readFileSync(jsonPath, 'utf8')
        const parsed = JSON.parse(rawJson)
        if (Array.isArray(parsed?.events)) {
          data.events = parsed.events as StatusEvent[]
        } else if (Array.isArray(parsed)) {
          data.events = parsed as StatusEvent[]
        } else {
          data.events = []
        }
        // Écrire au format CSV et supprimer l'ancien JSON
        writeFileSafe(filePath)
        try { fs.unlinkSync(jsonPath) } catch {}
      } catch {
        data = { events: [] }
      }
    }
  } catch (e) {
    // Réinitialiser en cas de corruption
    data = { events: [] }
  }
}

function writeFileSafe(filePath: string) {
  try {
    ensureDir(filePath)
    const csv = toCsv(data.events)
    fs.writeFileSync(filePath, csv, 'utf8')
  } catch (e) {
    // Ne pas remonter l'erreur au handler IPC
  }
}

export function initDb(dbFilePath: string) {
  dbFilePathMemo = dbFilePath.replace(/\.db$/, '.csv')
  readFileSafe(dbFilePathMemo)
}

export function getDbPath(): string | null {
  return dbFilePathMemo
}

export function insertStatusEvent(event: NewStatusEvent): StatusEvent {
  const applied_at = event.applied_at ?? new Date().toISOString()
  const nextId = (data.events[0]?.id ?? 0) + 1
  // Calcul date/heure d'entrée basées sur applied_at
  const d = new Date(applied_at)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const dateEntree = `${yyyy}-${mm}-${dd}`
  const heureEntree = `${hh}:${mi}`
  const record: StatusEvent = {
    id: nextId,
    contact_id: event.contact_id,
    old_status: event.old_status ?? null,
    new_status: (event as any).new_status ?? (event as any).newStatus ?? '',
    applied_at,
    prenom: event.prenom ?? null,
    nom: event.nom ?? null,
    telephone: event.telephone ?? null,
    email: (event as any).email ?? null,
    commentaire: (event as any).commentaire ?? (event as any).comment ?? null,
    dateRappel: (event as any).dateRappel ?? null,
    heureRappel: (event as any).heureRappel ?? null,
    dateRDV: (event as any).dateRDV ?? null,
    heureRDV: (event as any).heureRDV ?? null,
    dateAppel: (event as any).dateAppel ?? null,
    heureAppel: (event as any).heureAppel ?? null,
    dureeAppel: (event as any).dureeAppel ?? null,
    dateEntree,
    heureEntree,
    numeroLigne: (event as any).numeroLigne ?? null,
    source: (event as any).source ?? null,
    statut: (event as any).statut ?? ((event as any).new_status ?? (event as any).newStatus ?? null),
    lien: (event as any).lien ?? null,
    sexe: (event as any).sexe ?? null,
    don: (event as any).don ?? null,
    qualite: (event as any).qualite ?? null,
    type: (event as any).type ?? null,
    date: (event as any).date ?? null,
    uid: (event as any).uid ?? null,
    uid_supabase: (event as any).uid_supabase ?? null,
    utilisateur: (event as any).utilisateur ?? null,
    actions: (event as any).actions ?? null,
    statutAppel: (event as any).statutAppel ?? null,
    statutRDV: (event as any).statutRDV ?? null,
    commentaireRDV: (event as any).commentaireRDV ?? null,
  }
  // insérer en tête (ordre DESC par date/id)
  data.events.unshift(record)
  if (dbFilePathMemo) writeFileSafe(dbFilePathMemo)
  return record
}

export function listStatusEvents(startDate?: string, endDate?: string): StatusEvent[] {
  let events = [...data.events]
  if (startDate && endDate) {
    // Pour la date de fin, on utilise < au lieu de <= car toRangeBoundaries ajoute déjà un jour
    // et utilise 00:00:00 du jour suivant, ce qui permet d'inclure toute la journée précédente
    events = events.filter(e => {
      // Normaliser les formats de date pour la comparaison
      const eventDate = e.applied_at.replace('T', ' ').replace(/\.\d{3}Z?$/, '').replace('Z', '')
      const start = startDate.replace('T', ' ').replace(/\.\d{3}Z?$/, '').replace('Z', '')
      const end = endDate.replace('T', ' ').replace(/\.\d{3}Z?$/, '').replace('Z', '')
      return eventDate >= start && eventDate < end
    })
  } else if (startDate) {
    events = events.filter(e => {
      const eventDate = e.applied_at.replace('T', ' ').replace(/\.\d{3}Z?$/, '').replace('Z', '')
      const start = startDate.replace('T', ' ').replace(/\.\d{3}Z?$/, '').replace('Z', '')
      return eventDate >= start
    })
  } else if (endDate) {
    events = events.filter(e => {
      const eventDate = e.applied_at.replace('T', ' ').replace(/\.\d{3}Z?$/, '').replace('Z', '')
      const end = endDate.replace('T', ' ').replace(/\.\d{3}Z?$/, '').replace('Z', '')
      return eventDate < end
    })
  }
  return events
}

export function getAllStatusEvents(): StatusEvent[] {
  return [...data.events]
}

export function deleteStatusEvent(id: number): { success: boolean } {
  const before = data.events.length
  data.events = data.events.filter(e => e.id !== id)
  if (dbFilePathMemo) writeFileSafe(dbFilePathMemo)
  return { success: data.events.length < before }
}

export function updateStatusEvent(payload: { id: number } & Partial<StatusEvent>): StatusEvent {
  const { id, ...rest } = payload
  const idx = data.events.findIndex(e => e.id === id)
  if (idx === -1) throw new Error('Événement introuvable')
  const keyMap: Record<string, keyof StatusEvent> = {
    prenom: 'prenom',
    nom: 'nom',
    telephone: 'telephone',
    email: 'email',
    commentaire: 'commentaire',
    comment: 'commentaire',
    dateRappel: 'dateRappel',
    heureRappel: 'heureRappel',
    dateRDV: 'dateRDV',
    heureRDV: 'heureRDV',
    dateAppel: 'dateAppel',
    heureAppel: 'heureAppel',
    dureeAppel: 'dureeAppel',
    new_status: 'new_status',
    newStatus: 'new_status',
    numeroLigne: 'numeroLigne',
    numero_ligne: 'numeroLigne',
    source: 'source',
    statut: 'statut',
    lien: 'lien',
    sexe: 'sexe',
    don: 'don',
    qualite: 'qualite',
    type: 'type',
    date: 'date',
    uid: 'uid',
    uid_supabase: 'uid_supabase',
    uidSupabase: 'uid_supabase',
    utilisateur: 'utilisateur',
    actions: 'actions',
    statutAppel: 'statutAppel',
    statut_appel: 'statutAppel',
    statutRDV: 'statutRDV',
    statut_rdv: 'statutRDV',
    commentaireRDV: 'commentaireRDV',
    commentaire_rdv: 'commentaireRDV',
  } as any
  const current = { ...data.events[idx] }
  for (const [k, v] of Object.entries(rest)) {
    const mapped = (keyMap as any)[k]
    if (mapped) (current as any)[mapped] = v
  }
  data.events[idx] = current
  if (dbFilePathMemo) writeFileSafe(dbFilePathMemo)
  return current
}

export function updateLatestStatusEventForContact(contactId: string, fields: Partial<StatusEvent>): StatusEvent | null {
  const idx = data.events.findIndex(e => e.contact_id === contactId)
  if (idx === -1) return null
  const current = { ...data.events[idx], ...fields }
  data.events[idx] = current
  if (dbFilePathMemo) writeFileSafe(dbFilePathMemo)
  return current
}

export function replaceAllStatusEvents(events: StatusEvent[]): { success: boolean; count: number } {
  data.events = [...events]
  // Réordonner par id desc (cohérence avec insert en tête)
  data.events.sort((a, b) => (b.id || 0) - (a.id || 0))
  if (dbFilePathMemo) writeFileSafe(dbFilePathMemo)
  return { success: true, count: data.events.length }
}


