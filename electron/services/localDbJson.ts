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
  }
  // insérer en tête (ordre DESC par date/id)
  data.events.unshift(record)
  if (dbFilePathMemo) writeFileSafe(dbFilePathMemo)
  return record
}

export function listStatusEvents(startDate?: string, endDate?: string): StatusEvent[] {
  let events = [...data.events]
  if (startDate && endDate) {
    events = events.filter(e => e.applied_at >= startDate && e.applied_at <= endDate)
  } else if (startDate) {
    events = events.filter(e => e.applied_at >= startDate)
  } else if (endDate) {
    events = events.filter(e => e.applied_at <= endDate)
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


