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
  numeroLigne: integer('numeroLigne'),
  source: text('source'),
  statut: text('statut'),
  lien: text('lien'),
  sexe: text('sexe'),
  don: text('don'),
  qualite: text('qualite'),
  type: text('type'),
  date: text('date'),
  uid: text('uid'),
  uidSupabase: text('uid_supabase'),
  utilisateur: text('utilisateur'),
  actions: text('actions'),
  statutAppel: text('statutAppel'),
  statutRDV: text('statutRDV'),
  commentaireRDV: text('commentaireRDV'),
})

export type StatusEvent = typeof statusEvents.$inferSelect
export type NewStatusEvent = Omit<StatusEvent, 'id' | 'appliedAt'> & { appliedAt?: string }

let sqlite: Database.Database | null = null
let db: ReturnType<typeof drizzle> | null = null
let dbFilePathMemo: string | null = null

const toLocalYMD = (d: Date) => {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const normalizeDateOnly = (value?: string | null): string | null => {
  const raw = (value ?? '').trim()
  if (!raw) return null
  const iso = /^\d{4}-\d{2}-\d{2}$/
  if (iso.test(raw)) return raw
  const dmy = /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/
  const ymd = /^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/
  let parsed: Date | null = null
  if (dmy.test(raw)) {
    const [, dd, mm, yy] = dmy.exec(raw)!
    parsed = new Date(`${yy}-${mm}-${dd}T00:00:00Z`)
  } else if (ymd.test(raw)) {
    const [, yy, mm, dd] = ymd.exec(raw)!
    parsed = new Date(`${yy}-${mm}-${dd}T00:00:00Z`)
  } else {
    const candidate = new Date(raw)
    if (!isNaN(candidate.getTime())) parsed = candidate
  }
  return parsed ? toLocalYMD(parsed) : null
}

const normalizeTime = (value?: string | null): string | null => {
  const raw = (value ?? '').trim()
  if (!raw) return null
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(raw)
  if (!m) return null
  const h = Math.min(23, Math.max(0, Number(m[1])))
  const min = Math.min(59, Math.max(0, Number(m[2])))
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

const normalizeDuration = (value?: string | null): string | null => {
  const raw = (value ?? '').trim()
  if (!raw) return null
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(raw)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  const sec = m[3] ? Number(m[3]) : 0
  const totalSeconds = (h > 0 ? h * 3600 : 0) + min * 60 + sec
  const mm = Math.floor(totalSeconds / 60)
  const ss = totalSeconds % 60
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

const normalizeStatus = (value?: string | null): string | null => {
  const raw = (value ?? '').trim()
  if (!raw) return 'Non défini'
  const lowered = raw.toLowerCase()
  if (lowered === 'do') return 'D0'
  if (lowered === 'ro') return 'R0'
  if (lowered === 'non defini' || lowered === 'non défini') return 'Non défini'
  return raw
}

const normalizeAppliedAt = (value?: string | null): string => {
  const raw = (value ?? '').trim()
  if (!raw) return new Date().toISOString()
  const parse = (v: string) => {
    const d = new Date(v)
    return isNaN(d.getTime()) ? null : d
  }
  let parsed = parse(raw)
  if (!parsed) {
    const onlyDate = normalizeDateOnly(raw)
    parsed = onlyDate ? new Date(`${onlyDate}T00:00:00Z`) : null
  }
  return (parsed ?? new Date()).toISOString()
}

const normalizePhone = (value?: string | null): string | null => {
  const raw = (value ?? '').replace(/\s+/g, '').trim()
  if (!raw) return null
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return null
  if (raw.startsWith('+')) return `+${digits}`
  if (digits.startsWith('00')) return `+${digits.slice(2)}`
  return digits
}

const normalizeEmail = (value?: string | null): string | null => {
  const raw = (value ?? '').trim()
  if (!raw) return null
  return raw.toLowerCase()
}

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
  maybeAdd('numeroLigne', 'INTEGER')
  maybeAdd('source', 'TEXT')
  maybeAdd('statut', 'TEXT')
  maybeAdd('lien', 'TEXT')
  maybeAdd('sexe', 'TEXT')
  maybeAdd('don', 'TEXT')
  maybeAdd('qualite', 'TEXT')
  maybeAdd('type', 'TEXT')
  maybeAdd('date', 'TEXT')
  maybeAdd('uid', 'TEXT')
  maybeAdd('uid_supabase', 'TEXT')
  maybeAdd('utilisateur', 'TEXT')
  maybeAdd('actions', 'TEXT')
  maybeAdd('statutAppel', 'TEXT')
  maybeAdd('statutRDV', 'TEXT')
  maybeAdd('commentaireRDV', 'TEXT')

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
      email, commentaire, dateRappel, heureRappel, dateRDV, heureRDV, dateAppel, heureAppel, dureeAppel, dateEntree, heureEntree,
      numeroLigne, source, statut, lien, sexe, don, qualite, type, date, uid, uid_supabase, utilisateur, actions, statutAppel, statutRDV, commentaireRDV
    )
    VALUES (
      @contactId, @oldStatus, @newStatus, @appliedAt, @prenom, @nom, @telephone,
      @email, @commentaire, @dateRappel, @heureRappel, @dateRDV, @heureRDV, @dateAppel, @heureAppel, @dureeAppel, @dateEntree, @heureEntree,
      @numeroLigne, @source, @statut, @lien, @sexe, @don, @qualite, @type, @date, @uid, @uid_supabase, @utilisateur, @actions, @statutAppel, @statutRDV, @commentaireRDV
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
    numeroLigne: (event as any).numeroLigne ?? null,
    source: (event as any).source ?? null,
    statut: (event as any).statut ?? ((event as any).newStatus ?? (event as any).new_status ?? null),
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
  })
  const row = sqlite.prepare(`SELECT * FROM status_events WHERE id = ?`).get(info.lastInsertRowid) as StatusEvent
  return row
}

export function listStatusEvents(startDate?: string, endDate?: string): StatusEvent[] {
  if (!sqlite || !db) throw new Error('DB non initialisée')
  if (startDate && endDate) {
    // Pour la date de fin, on utilise < au lieu de <= car toRangeBoundaries ajoute déjà un jour
    // et utilise 00:00:00 du jour suivant, ce qui permet d'inclure toute la journée précédente
    return sqlite.prepare(`
      SELECT * FROM status_events
      WHERE applied_at >= ? AND applied_at < ?
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
    // Pour la date de fin seule, on utilise < au lieu de <=
    return sqlite.prepare(`
      SELECT * FROM status_events
      WHERE applied_at < ?
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
    date_rappel: 'dateRappel',
    heureRappel: 'heureRappel',
    heure_rappel: 'heureRappel',
    dateRDV: 'dateRDV',
    date_rdv: 'dateRDV',
    heureRDV: 'heureRDV',
    heure_rdv: 'heureRDV',
    dateAppel: 'dateAppel',
    date_appel: 'dateAppel',
    heureAppel: 'heureAppel',
    heure_appel: 'heureAppel',
    dureeAppel: 'dureeAppel',
    duree_appel: 'dureeAppel',
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


// Remplacer tous les événements (utile pour import CSV)
export function replaceAllStatusEvents(events: StatusEvent[]): { success: boolean; count: number } {
  if (!sqlite || !db) throw new Error('DB non initialisée')
  const tx = sqlite.transaction((rows: StatusEvent[]) => {
    sqlite!.prepare(`DELETE FROM status_events`).run()
    const insert = sqlite!.prepare(`
      INSERT INTO status_events (
        id, contact_id, old_status, new_status, applied_at, prenom, nom, telephone,
        email, commentaire, dateRappel, heureRappel, dateRDV, heureRDV, dateAppel, heureAppel, dureeAppel, dateEntree, heureEntree,
        numeroLigne, source, statut, lien, sexe, don, qualite, type, date, uid, uid_supabase, utilisateur, actions, statutAppel, statutRDV, commentaireRDV
      ) VALUES (
        @id, @contact_id, @old_status, @new_status, @applied_at, @prenom, @nom, @telephone,
        @email, @commentaire, @dateRappel, @heureRappel, @dateRDV, @heureRDV, @dateAppel, @heureAppel, @dureeAppel, @dateEntree, @heureEntree,
        @numeroLigne, @source, @statut, @lien, @sexe, @don, @qualite, @type, @date, @uid, @uid_supabase, @utilisateur, @actions, @statutAppel, @statutRDV, @commentaireRDV
      )
    `)
    for (const r of rows) {
      const rec: any = {
        id: r.id ?? null,
        contact_id: (r as any).contact_id ?? (r as any).contactId ?? '',
        old_status: (r as any).old_status ?? (r as any).oldStatus ?? null,
        new_status: (r as any).new_status ?? (r as any).newStatus ?? '',
        applied_at: r.applied_at ?? new Date().toISOString(),
        prenom: (r as any).prenom ?? null,
        nom: (r as any).nom ?? null,
        telephone: (r as any).telephone ?? null,
        email: (r as any).email ?? null,
        commentaire: (r as any).commentaire ?? (r as any).comment ?? null,
        dateRappel: (r as any).dateRappel ?? null,
        heureRappel: (r as any).heureRappel ?? null,
        dateRDV: (r as any).dateRDV ?? null,
        heureRDV: (r as any).heureRDV ?? null,
        dateAppel: (r as any).dateAppel ?? null,
        heureAppel: (r as any).heureAppel ?? null,
        dureeAppel: (r as any).dureeAppel ?? null,
        dateEntree: (r as any).dateEntree ?? null,
        heureEntree: (r as any).heureEntree ?? null,
        numeroLigne: (r as any).numeroLigne ?? null,
        source: (r as any).source ?? null,
        statut: (r as any).statut ?? (r as any).new_status ?? (r as any).newStatus ?? null,
        lien: (r as any).lien ?? null,
        sexe: (r as any).sexe ?? null,
        don: (r as any).don ?? null,
        qualite: (r as any).qualite ?? null,
        type: (r as any).type ?? null,
        date: (r as any).date ?? null,
        uid: (r as any).uid ?? null,
        uid_supabase: (r as any).uid_supabase ?? (r as any).uidSupabase ?? null,
        utilisateur: (r as any).utilisateur ?? null,
        actions: (r as any).actions ?? null,
        statutAppel: (r as any).statutAppel ?? null,
        statutRDV: (r as any).statutRDV ?? null,
        commentaireRDV: (r as any).commentaireRDV ?? null,
      }
      insert.run(rec)
    }
  })
  tx(events)
  return { success: true, count: events.length }
}

export function clearStatusEvents(): { success: boolean; deleted: number } {
  if (!sqlite || !db) throw new Error('DB non initialisée')
  const info = sqlite.prepare(`DELETE FROM status_events`).run()
  return { success: true, deleted: info.changes ?? 0 }
}

export function repairStatusEvents(): { success: boolean; scanned: number; updated: number } {
  if (!sqlite || !db) throw new Error('DB non initialisée')
  const columns = sqlite.prepare(`PRAGMA table_info(status_events)`).all() as Array<{ name: string }>
  const available = new Set(columns.map(c => c.name))
  const rows = sqlite.prepare(`SELECT * FROM status_events`).all() as any[]
  const updatableCols = Array.from(available).filter((c) => c !== 'id')
  if (updatableCols.length === 0) {
    return { success: true, scanned: rows.length, updated: 0 }
  }

  const setSql = updatableCols.map((col) => `${col} = @${col}`).join(', ')
  const stmt = sqlite.prepare(`UPDATE status_events SET ${setSql} WHERE id = @id`)

  const sanitize = (row: any) => {
    const base: any = { id: row.id }
    const set = (key: string, value: any) => {
      if (!available.has(key)) return
      base[key] = value
    }

    const contactId = (row.contact_id || row.contactId || row.id || '').toString().trim()
    set('contact_id', contactId || (row.id ? String(row.id) : ''))
    set('new_status', normalizeStatus(row.new_status ?? row.newStatus))
    set('old_status', normalizeStatus(row.old_status ?? row.oldStatus))
    set('applied_at', normalizeAppliedAt(row.applied_at))
    set('prenom', (row.prenom ?? '').trim() || null)
    set('nom', (row.nom ?? '').trim() || null)
    set('telephone', normalizePhone(row.telephone))
    set('email', normalizeEmail(row.email))
    set('commentaire', (row.commentaire ?? row.comment ?? '').trim() || null)
    set('dateRappel', normalizeDateOnly(row.dateRappel))
    set('heureRappel', normalizeTime(row.heureRappel))
    set('dateRDV', normalizeDateOnly(row.dateRDV))
    set('heureRDV', normalizeTime(row.heureRDV))
    set('dateAppel', normalizeDateOnly(row.dateAppel))
    set('heureAppel', normalizeTime(row.heureAppel))
    set('dureeAppel', normalizeDuration(row.dureeAppel))
    set('dateEntree', normalizeDateOnly(row.dateEntree))
    set('heureEntree', normalizeTime(row.heureEntree))
    set('numeroLigne', typeof row.numeroLigne === 'number' && Number.isFinite(row.numeroLigne) ? row.numeroLigne : null)
    set('source', row.source ?? null)
    set('statut', normalizeStatus(row.statut ?? row.new_status ?? row.newStatus))
    set('lien', row.lien ?? null)
    set('sexe', row.sexe ?? null)
    set('don', row.don ?? null)
    set('qualite', row.qualite ?? null)
    set('type', row.type ?? null)
    set('date', normalizeDateOnly(row.date))
    set('uid', row.uid ?? null)
    set('uid_supabase', row.uid_supabase ?? row.uidSupabase ?? null)
    set('utilisateur', row.utilisateur ?? null)
    set('actions', row.actions ?? null)
    set('statutAppel', normalizeStatus(row.statutAppel))
    set('statutRDV', normalizeStatus(row.statutRDV))
    set('commentaireRDV', row.commentaireRDV ?? null)
    return base
  }

  const isDifferent = (a: any, b: any) => {
    for (const key of Object.keys(b)) {
      if (a[key] !== b[key]) return true
    }
    return false
  }

  let updated = 0
  const tx = sqlite.transaction((events: any[]) => {
    for (const row of events) {
      const clean = sanitize(row)
      if (isDifferent(row, clean)) {
        stmt.run(clean)
        updated++
      }
    }
  })
  tx(rows)
  return { success: true, scanned: rows.length, updated }
}


