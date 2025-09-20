import path from 'path'
import fs from 'fs'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql, and, gte, lte, between } from 'drizzle-orm'

// Schéma Drizzle pour la table des événements de statut
export const statusEvents = sqliteTable('status_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  contactId: text('contact_id').notNull(),
  oldStatus: text('old_status'),
  newStatus: text('new_status').notNull(),
  appliedAt: text('applied_at').default(sql`CURRENT_TIMESTAMP`),
  prenom: text('prenom'),
  nom: text('nom'),
  telephone: text('telephone'),
  email: text('email'),
  commentaire: text('commentaire'),
  dateRappel: text('dateRappel'),
  heureRappel: text('heureRappel'),
  dateRDV: text('dateRDV'),
  heureRDV: text('heureRDV'),
  dateAppel: text('dateAppel'),
  heureAppel: text('heureAppel'),
  dureeAppel: text('dureeAppel'),
  // Nouvelles colonnes: date et heure d'entrée dans la table (au moment de l'insertion)
  dateEntree: text('dateEntree'),
  heureEntree: text('heureEntree'),
})

export type StatusEvent = typeof statusEvents.$inferSelect
export type NewStatusEvent = Omit<StatusEvent, 'id' | 'appliedAt'> & { appliedAt?: string }

let sqlite: Database.Database | null = null
let db: ReturnType<typeof drizzle> | null = null
let dbFilePathMemo: string | null = null

export function initDb(dbFilePath: string) {
  if (db) return
  const dir = path.dirname(dbFilePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  sqlite = new Database(dbFilePath)
  dbFilePathMemo = dbFilePath
  // Mode WAL pour de meilleures perfs
  try { sqlite.pragma('journal_mode = WAL') } catch {}

  // Création de la table si elle n'existe pas (pas de migrations formelles ici)
  sqlite.prepare(`
    CREATE TABLE IF NOT EXISTS status_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      applied_at TEXT DEFAULT (CURRENT_TIMESTAMP),
      prenom TEXT,
      nom TEXT,
      telephone TEXT,
      email TEXT,
      commentaire TEXT,
      dateRappel TEXT,
      heureRappel TEXT,
      dateRDV TEXT,
      heureRDV TEXT,
      dateAppel TEXT,
      heureAppel TEXT,
      dureeAppel TEXT,
      dateEntree TEXT,
      heureEntree TEXT
    );
  `).run()

  // Migration légère: ajouter les colonnes manquantes si la table existait déjà
  const columns = sqlite.prepare(`PRAGMA table_info(status_events)`).all() as Array<{ name: string }>
  const have = new Set(columns.map(c => c.name))
  const maybeAdd = (col: string, def: string) => {
    if (!have.has(col)) {
      try { sqlite!.exec(`ALTER TABLE status_events ADD COLUMN ${col} ${def}`) } catch {}
    }
  }
  maybeAdd('email', 'TEXT')
  maybeAdd('commentaire', 'TEXT')
  maybeAdd('dateRappel', 'TEXT')
  maybeAdd('heureRappel', 'TEXT')
  maybeAdd('dateRDV', 'TEXT')
  maybeAdd('heureRDV', 'TEXT')
  maybeAdd('dateAppel', 'TEXT')
  maybeAdd('heureAppel', 'TEXT')
  maybeAdd('dureeAppel', 'TEXT')
  maybeAdd('dateEntree', 'TEXT')
  maybeAdd('heureEntree', 'TEXT')

  db = drizzle(sqlite)
}

export function getDbPath(): string | null {
  return dbFilePathMemo
}

export function insertStatusEvent(event: NewStatusEvent): StatusEvent {
  if (!sqlite || !db) throw new Error('DB non initialisée')
  const appliedAt = event.appliedAt ?? new Date().toISOString()
  // Calcul des champs d'entrée (date/heure locales formatées)
  const d = new Date(appliedAt)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const dateEntree = `${yyyy}-${mm}-${dd}`
  const heureEntree = `${hh}:${mi}`
  const stmt = sqlite.prepare(`
    INSERT INTO status_events (
      contact_id, old_status, new_status, applied_at, prenom, nom, telephone,
      email, commentaire, dateRappel, heureRappel, dateRDV, heureRDV, dateAppel, heureAppel, dureeAppel, dateEntree, heureEntree
    )
    VALUES (
      @contactId, @oldStatus, @newStatus, @appliedAt, @prenom, @nom, @telephone,
      @email, @commentaire, @dateRappel, @heureRappel, @dateRDV, @heureRDV, @dateAppel, @heureAppel, @dureeAppel, @dateEntree, @heureEntree
    )
  `)
  const info = stmt.run({
    contactId: event.contactId,
    oldStatus: event.oldStatus ?? null,
    newStatus: (event as any).newStatus ?? (event as any).new_status ?? event.newStatus,
    appliedAt,
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
  })
  const row = sqlite.prepare(`SELECT * FROM status_events WHERE id = ?`).get(info.lastInsertRowid) as StatusEvent
  return row
}

export function listStatusEvents(startDate?: string, endDate?: string): StatusEvent[] {
  if (!sqlite || !db) throw new Error('DB non initialisée')
  if (startDate && endDate) {
    return sqlite.prepare(`
      SELECT * FROM status_events
      WHERE applied_at BETWEEN ? AND ?
      ORDER BY applied_at DESC
    `).all(startDate, endDate) as StatusEvent[]
  }
  if (startDate) {
    return sqlite.prepare(`
      SELECT * FROM status_events
      WHERE applied_at >= ?
      ORDER BY applied_at DESC
    `).all(startDate) as StatusEvent[]
  }
  if (endDate) {
    return sqlite.prepare(`
      SELECT * FROM status_events
      WHERE applied_at <= ?
      ORDER BY applied_at DESC
    `).all(endDate) as StatusEvent[]
  }
  return sqlite.prepare(`SELECT * FROM status_events ORDER BY applied_at DESC`).all() as StatusEvent[]
}

export function getAllStatusEvents(): StatusEvent[] {
  if (!sqlite || !db) throw new Error('DB non initialisée')
  return sqlite.prepare(`SELECT * FROM status_events ORDER BY applied_at DESC`).all() as StatusEvent[]
}

export function deleteStatusEvent(id: number): { success: boolean } {
  if (!sqlite || !db) throw new Error('DB non initialisée')
  const info = sqlite.prepare(`DELETE FROM status_events WHERE id = ?`).run(id)
  return { success: info.changes > 0 }
}

export function updateStatusEvent(payload: { id: number } & Record<string, any>): StatusEvent {
  if (!sqlite || !db) throw new Error('DB non initialisée')
  const { id, ...rest } = payload
  if (!id) throw new Error('id requis')

  // Mappage des clés autorisées (camelCase/snake_case)
  const keyMap: Record<string, string> = {
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
  }

  const entries = Object.entries(rest)
    .filter(([k, v]) => keyMap[k] !== undefined)
    .map(([k, v]) => [keyMap[k], v] as [string, any])

  if (entries.length === 0) {
    const current = sqlite.prepare(`SELECT * FROM status_events WHERE id = ?`).get(id) as StatusEvent
    if (!current) throw new Error('Événement introuvable')
    return current
  }

  const setSql = entries.map(([col]) => `${col} = @${col}`).join(', ')
  const params = Object.fromEntries(entries)
  ;(params as any).id = id
  sqlite.prepare(`UPDATE status_events SET ${setSql} WHERE id = @id`).run(params)
  const updated = sqlite.prepare(`SELECT * FROM status_events WHERE id = ?`).get(id) as StatusEvent
  return updated
}

export function updateLatestStatusEventForContact(contactId: string, fields: Record<string, any>): StatusEvent | null {
  if (!sqlite || !db) throw new Error('DB non initialisée')
  const row = sqlite.prepare(`SELECT id FROM status_events WHERE contact_id = ? ORDER BY applied_at DESC LIMIT 1`).get(contactId) as { id: number } | undefined
  if (!row) return null
  return updateStatusEvent({ id: row.id, ...fields })
}


