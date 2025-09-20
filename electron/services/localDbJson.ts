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

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function readFileSafe(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed?.events)) {
        data.events = parsed.events
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
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
  } catch (e) {
    // Ne pas remonter l'erreur au handler IPC
  }
}

export function initDb(dbFilePath: string) {
  dbFilePathMemo = dbFilePath.replace(/\.db$/, '.json')
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


