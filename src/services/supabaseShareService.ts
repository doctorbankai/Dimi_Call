import { supabaseService } from '@/services/supabaseService'
import { supabaseLogger } from '@/lib/supabase-logger'
import { loadContacts } from '@/services/dataService'
import type { Contact } from '@/types'
import { supabase } from '@/lib/supabase'

type SyncTarget = 'phone' | 'blacklist' | 'calls'
const SYNC_TARGETS: SyncTarget[] = ['phone', 'blacklist', 'calls']

export type ShareStatus = 'idle' | 'syncing' | 'success' | 'error'

export interface ShareTargetState {
  enabled: boolean
  status: ShareStatus
  lastSyncedAt?: string
  lastError?: string
  stats?: {
    processed: number
    shared: number
    filtered: number
  }
}

interface AuthIdentity {
  id: string | null
  email: string | null
}

export interface SupabaseShareState {
  supabaseReady: boolean
  globalError?: string
  phone: ShareTargetState
  blacklist: ShareTargetState
  calls: ShareTargetState
}

type Listener = (state: SupabaseShareState) => void

interface RuntimeTargetState {
  inFlight: boolean
  pendingResync: boolean
}

const STORAGE_KEY = 'dimicall_supabase_share_preferences'
const hasWindow = typeof window !== 'undefined'

const defaultTargetState: ShareTargetState = {
  enabled: true,
  status: 'idle',
}

const state: SupabaseShareState = {
  supabaseReady: safeCheckSupabaseReady(),
  phone: { ...defaultTargetState },
  blacklist: { ...defaultTargetState },
  calls: { ...defaultTargetState },
}

const runtimeState: Record<SyncTarget, RuntimeTargetState> = {
  phone: { inFlight: false, pendingResync: false },
  blacklist: { inFlight: false, pendingResync: false },
  calls: { inFlight: false, pendingResync: false },
}

const listeners = new Set<Listener>()
const eventHandlers = new Map<SyncTarget, () => void>()
const debounceTimers: Partial<Record<SyncTarget, number>> = {}

loadPreferences()

if (hasWindow) {
  autoResumeEnabledTargets()
}

function safeCheckSupabaseReady(): boolean {
  try {
    return supabaseService.isReady()
  } catch (error) {
    supabaseLogger.warn('[share] Vérification configuration Supabase impossible', error)
    return false
  }
}

function loadPreferences() {
  if (!hasWindow) return
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Partial<Record<SyncTarget, boolean>>
    if (typeof parsed.phone === 'boolean') state.phone.enabled = parsed.phone
    if (typeof parsed.blacklist === 'boolean') state.blacklist.enabled = parsed.blacklist
    if (typeof parsed.calls === 'boolean') state.calls.enabled = parsed.calls
  } catch (error) {
    supabaseLogger.warn('[share] Lecture préférences Supabase échouée', error)
  }
}

function savePreferences() {
  if (!hasWindow) return
  try {
    const payload = {
      phone: state.phone.enabled,
      blacklist: state.blacklist.enabled,
      calls: state.calls.enabled,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    supabaseLogger.warn('[share] Sauvegarde préférences Supabase échouée', error)
  }
}

function autoResumeEnabledTargets() {
  for (const target of SYNC_TARGETS) {
    if (state[target].enabled) {
      ensureListener(target)
      scheduleSync(target, 'resume')
    }
  }
}

function getSnapshot(): SupabaseShareState {
  return {
    supabaseReady: state.supabaseReady,
    globalError: state.globalError,
    phone: { ...state.phone, stats: state.phone.stats ? { ...state.phone.stats } : undefined },
    blacklist: { ...state.blacklist, stats: state.blacklist.stats ? { ...state.blacklist.stats } : undefined },
    calls: { ...state.calls, stats: state.calls.stats ? { ...state.calls.stats } : undefined },
  }
}

function notify() {
  const snapshot = getSnapshot()
  listeners.forEach((listener) => {
    try {
      listener(snapshot)
    } catch (error) {
      supabaseLogger.warn('[share] Listener SupabaseShareState erreur', error)
    }
  })
}

function ensureListener(target: SyncTarget) {
  if (!hasWindow) return
  if (eventHandlers.has(target)) return
  const handler = () => scheduleSync(target, 'localdb-update')
  window.addEventListener('localdb-updated', handler)
  eventHandlers.set(target, handler)
}

function removeListener(target: SyncTarget) {
  if (!hasWindow) return
  const handler = eventHandlers.get(target)
  if (handler) {
    window.removeEventListener('localdb-updated', handler)
    eventHandlers.delete(target)
  }
  const timer = debounceTimers[target]
  if (typeof timer === 'number') {
    window.clearTimeout(timer)
    delete debounceTimers[target]
  }
}

function scheduleSync(target: SyncTarget, reason: string) {
  if (!hasWindow) return
  if (!state[target].enabled) return
  const existing = debounceTimers[target]
  if (typeof existing === 'number') {
    window.clearTimeout(existing)
  }
  debounceTimers[target] = window.setTimeout(() => {
    debounceTimers[target] = undefined
    void runSync(target, reason)
  }, reason === 'resume' ? 250 : 750)
}

async function ensureSupabaseReady(): Promise<boolean> {
  const ready = safeCheckSupabaseReady()
  if (ready) {
    state.supabaseReady = true
    state.globalError = undefined
    notify()
    return true
  }

  try {
    const result = await supabaseService.testConnection()
    state.supabaseReady = !!result.success
    state.globalError = result.success ? undefined : result.error
    notify()
    return !!result.success
  } catch (error: any) {
    state.supabaseReady = false
    state.globalError = error?.message || 'Connexion Supabase indisponible'
    notify()
    return false
  }
}

async function runSync(target: SyncTarget, reason: string) {
  if (!state[target].enabled) return
  if (!state.supabaseReady) {
    const readyLater = await ensureSupabaseReady()
    if (!readyLater) {
      state[target].status = 'error'
      state[target].lastError = state.globalError || 'Supabase non configuré'
      notify()
      return
    }
  }

  const runtime = runtimeState[target]
  if (runtime.inFlight) {
    runtime.pendingResync = true
    return
  }

  runtime.inFlight = true
  runtime.pendingResync = false

  state[target].status = 'syncing'
  state[target].lastError = undefined
  notify()

  try {
    const stats = await performSync(target)
    state[target].status = 'success'
    state[target].lastSyncedAt = new Date().toISOString()
    state[target].stats = stats
    supabaseLogger.log(`[share] Synchronisation ${target} réussie`, { reason, stats })
  } catch (error: any) {
    state[target].status = 'error'
    state[target].lastError = error?.message || 'Erreur inconnue'
    state[target].stats = undefined
    supabaseLogger.error(`[share] Synchronisation ${target} échouée`, error)
  } finally {
    runtime.inFlight = false
    savePreferences()
    notify()

    if (runtime.pendingResync) {
      runtime.pendingResync = false
      scheduleSync(target, 'pending-resync')
    }
  }
}

async function performSync(target: SyncTarget): Promise<{ processed: number; shared: number; filtered: number; withMetadata?: number }> {
  const events = await fetchLocalEvents()
  if (target === 'phone') {
    return syncSharedPhoneNumbers(events)
  }
  if (target === 'blacklist') {
    return syncSharedBlacklistNumbers(events)
  }
  return syncCallEvents(events)
}

async function fetchLocalEvents(): Promise<any[]> {
  if (!hasWindow) throw new Error('Synchronisation côté serveur indisponible')
  const api = (window as any)?.electronAPI?.localdb
  if (!api?.getAll) {
    throw new Error('Base locale indisponible dans cet environnement')
  }
  const result = await api.getAll()
  if (!result?.success) {
    throw new Error(result?.error || 'Lecture de la base locale échouée')
  }
  return Array.isArray(result.data) ? result.data : []
}

async function syncSharedPhoneNumbers(events: any[]): Promise<{ processed: number; shared: number; filtered: number; withMetadata: number }> {
  const client = supabaseService.getClient()
  const nowIso = new Date().toISOString()
  const aggregate = new Map<string, {
    phoneNumber: string
    normalized: string
    occurrences: number
    sample: {
      contactId?: string
      prenom?: string
      nom?: string
      source?: string
      statut?: string
      commentaire?: string
    }
  }>()

  let filtered = 0

  for (const row of events) {
    const raw = extractPhone(row)
    if (!raw) {
      filtered += 1
      continue
    }
    const normalized = normalizePhoneNumber(raw)
    if (!normalized) {
      filtered += 1
      continue
    }

    const key = normalized
    const sample = {
      contactId: extractString(row, ['contact_id', 'contactId', 'id']),
      prenom: extractString(row, ['prenom', 'firstName']),
      nom: extractString(row, ['nom', 'lastName']),
      source: extractString(row, ['source', 'origine', 'provenance']) || 'Données',
      statut: extractStatus(row),
      commentaire: extractString(row, ['commentaire', 'comment']),
    }

    const existing = aggregate.get(key)
    if (!existing) {
      aggregate.set(key, {
        phoneNumber: raw,
        normalized,
        occurrences: 1,
        sample,
      })
    } else {
      existing.occurrences += 1
      if (sample.statut && (!existing.sample.statut || isHigherPriorityStatus(sample.statut, existing.sample.statut))) {
        existing.sample = sample
      }
    }
  }

  const payload = Array.from(aggregate.values()).map((entry) => ({
    phone_number: entry.phoneNumber,
    normalized_phone: entry.normalized,
    prenom: entry.sample.prenom || null,
    nom: entry.sample.nom || null,
    source: entry.sample.source || 'Données',
    updated_at: nowIso,
  }))

  await chunkedUpsert(client, 'shared_phone_numbers', payload, 'normalized_phone')

  const withMetadata = payload.filter(entry => entry.prenom && entry.nom && entry.source).length

  return {
    processed: events.length,
    shared: payload.length,
    filtered,
    withMetadata,
  }
}

async function syncSharedBlacklistNumbers(events: any[]): Promise<{ processed: number; shared: number; filtered: number; withMetadata: number }> {
  const client = supabaseService.getClient()
  const nowIso = new Date().toISOString()

  const aggregate = new Map<string, {
    phoneNumber: string
    normalized: string
    reason?: string
    occurrences: number
    sample: {
      contactId?: string
      prenom?: string
      nom?: string
      source?: string
      statut?: string
      commentaire?: string
    }
  }>()

  let filtered = 0
  let processed = 0

  for (const row of events) {
    processed += 1
    const status = extractStatus(row)
    if (!isBlacklistStatus(status)) {
      filtered += 1
      continue
    }

    const raw = extractPhone(row)
    if (!raw) {
      filtered += 1
      continue
    }
    const normalized = normalizePhoneNumber(raw)
    if (!normalized) {
      filtered += 1
      continue
    }

    const key = normalized
    const reason = extractString(row, ['commentaire', 'comment']) || status || 'Liste noire'
    const sample = {
      contactId: extractString(row, ['contact_id', 'contactId', 'id']),
      prenom: extractString(row, ['prenom', 'firstName']),
      nom: extractString(row, ['nom', 'lastName']),
      source: extractString(row, ['source', 'origine', 'provenance']) || 'Données',
      statut: status,
      commentaire: extractString(row, ['commentaire', 'comment']),
    }

    const existing = aggregate.get(key)
    if (!existing) {
      aggregate.set(key, {
        phoneNumber: raw,
        normalized,
        reason,
        occurrences: 1,
        sample,
      })
    } else {
      existing.occurrences += 1
      existing.reason = preferReason(existing.reason, reason)
      if (!existing.sample.commentaire && sample.commentaire) {
        existing.sample = sample
      }
    }
  }

  const payload = Array.from(aggregate.values()).map((entry) => ({
    phone_number: entry.phoneNumber,
    normalized_phone: entry.normalized,
    prenom: entry.sample.prenom || null,
    nom: entry.sample.nom || null,
    source: entry.sample.source || 'Données',
    updated_at: nowIso,
  }))

  await chunkedUpsert(client, 'shared_blacklist_numbers', payload, 'normalized_phone')

  const withMetadata = payload.filter(entry => entry.prenom && entry.nom && entry.source).length

  return {
    processed,
    shared: payload.length,
    filtered,
    withMetadata,
  }
}

async function syncCallEvents(events: any[]): Promise<{ processed: number; shared: number; filtered: number; withMetadata: number }> {
  const client = supabaseService.getClient()
  const nowIso = new Date().toISOString()
  const contacts = loadContactsSnapshot()
  const contactsMap = new Map<string, Contact>()
  contacts.forEach((contact) => {
    if (contact?.id) {
      contactsMap.set(contact.id, contact)
    }
  })

  const authIdentity = await getCurrentAuthIdentity()
  const payload: Array<Record<string, any>> = []
  let filtered = 0
  let enriched = 0

  for (const row of events) {
    const record = buildCallRecord(row, contactsMap, authIdentity, nowIso)
    if (!record) {
      filtered += 1
      continue
    }
    if (record.metadata) {
      enriched += 1
    }
    payload.push(record)
  }

  if (payload.length === 0) {
    return {
      processed: events.length,
      shared: 0,
      filtered: events.length,
      withMetadata: 0,
    }
  }

  await chunkedUpsert(client, 'call_data_events', payload, 'user_uid,local_event_id')

  return {
    processed: events.length,
    shared: payload.length,
    filtered,
    withMetadata: enriched,
  }
}

function buildCallRecord(
  row: any,
  contacts: Map<string, Contact>,
  auth: AuthIdentity,
  timestamp: string
): Record<string, any> | null {
  const contactId = extractString(row, ['contact_id', 'contactId'])
  const contact = contactId ? contacts.get(contactId) : undefined
  const firstName = extractString(row, ['prenom', 'firstName']) ?? contact?.prenom
  const lastName = extractString(row, ['nom', 'lastName']) ?? contact?.nom
  const comment = row.commentaire ?? row.comment ?? contact?.commentaire ?? null
  const phone = extractPhone(row) ?? contact?.telephone ?? null
  const normalizedPhone = phone ? normalizePhoneNumber(phone) : null
  const numeroLigne =
    typeof row.numeroLigne === 'number'
      ? row.numeroLigne
      : typeof row.numero_ligne === 'number'
      ? row.numero_ligne
      : contact?.numeroLigne ?? null

  if (!contact && !phone && !firstName && !lastName) {
    return null
  }

  const localEventId = normalizeNumericId(row.id) ?? normalizeNumericId(row.local_event_id)
  const createdAt = row.applied_at ?? row.appliedAt ?? timestamp
  const metadata = sanitizeMetadataRecord({
    applied_at: row.applied_at ?? row.appliedAt,
    old_status: extractString(row, ['old_status', 'oldStatus']),
    new_status: extractStatus(row),
    local_comment: row.commentaire ?? row.comment,
    local_event_id: localEventId ?? undefined,
  })

  return {
    local_event_id: localEventId,
    contact_id: contactId || contact?.id || null,
    numero_ligne: numeroLigne,
    prenom: firstName ?? null,
    nom: lastName ?? null,
    telephone: phone ?? null,
    normalized_phone: normalizedPhone,
    email: extractString(row, ['email', 'mail']) ?? contact?.email ?? null,
    source: contact?.source ?? extractString(row, ['source', 'origine', 'provenance']) ?? null,
    statut: contact?.statut ?? extractStatus(row) ?? null,
    commentaire: comment,
    date_rappel: row.dateRappel ?? contact?.dateRappel ?? null,
    heure_rappel: row.heureRappel ?? contact?.heureRappel ?? null,
    date_rdv: row.dateRDV ?? contact?.dateRDV ?? null,
    heure_rdv: row.heureRDV ?? contact?.heureRDV ?? null,
    date_appel: row.dateAppel ?? contact?.dateAppel ?? null,
    heure_appel: row.heureAppel ?? contact?.heureAppel ?? null,
    duree_appel: row.dureeAppel ?? contact?.dureeAppel ?? null,
    lien: contact?.lien ?? null,
    sexe: contact?.sexe ?? null,
    don: contact?.don ?? null,
    qualite: contact?.qualite ?? null,
    type_contact: contact?.type ?? null,
    date_contact: contact?.date ?? null,
    uid: contact?.uid ?? null,
    uid_supabase: contact?.uid_supabase ?? null,
    utilisateur: contact?.utilisateur ?? null,
    actions: contact?.actions ?? null,
    statut_appel: contact?.statutAppel ?? null,
    statut_rdv: contact?.statutRDV ?? null,
    commentaire_rdv: contact?.commentaireRDV ?? null,
    user_uid: auth.id,
    user_email: auth.email,
    synced_at: timestamp,
    updated_at: timestamp,
    created_at: createdAt,
    metadata,
  }
}

function loadContactsSnapshot(): Contact[] {
  if (!hasWindow) return []
  try {
    return loadContacts()
  } catch (error) {
    supabaseLogger.warn('[share] Chargement des contacts impossible', error)
    return []
  }
}

async function getCurrentAuthIdentity(): Promise<AuthIdentity> {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    const user = data.session?.user
    return {
      id: user?.id ?? null,
      email: user?.email ?? null,
    }
  } catch (error) {
    supabaseLogger.warn('[share] Impossible de récupérer l’utilisateur Supabase', error)
    return { id: null, email: null }
  }
}

function sanitizeMetadataRecord(record: Record<string, unknown>): Record<string, unknown> | null {
  const entries = Object.entries(record).filter(([, value]) => value !== undefined && value !== null && value !== '')
  if (entries.length === 0) {
    return null
  }
  return Object.fromEntries(entries)
}

function normalizeNumericId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return null
}

async function chunkedUpsert(client: any, table: string, records: any[], conflictTarget: string) {
  const chunkSize = 500
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize)
    if (chunk.length === 0) continue
    const { error } = await client.from(table).upsert(chunk, {
      onConflict: conflictTarget,
    })
    if (error) {
      throw new Error(error.message || `Erreur Supabase (${table})`)
    }
  }
}

function extractPhone(row: any): string | null {
  const candidate = extractString(row, ['telephone', 'phone', 'numero', 'numeroLigne'])
  return candidate ? candidate.trim() : null
}

function extractStatus(row: any): string | undefined {
  return extractString(row, ['new_status', 'newStatus', 'statut', 'status', 'statut_final'])
}

function extractString(row: any, keys: string[]): string | undefined {
  if (!row) return undefined
  for (const key of keys) {
    const value = row[key]
    if (value && typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed.length > 0 && trimmed.toLowerCase() !== 'null') {
        return trimmed
      }
    }
  }
  return undefined
}

function normalizePhoneNumber(phone: string): string | null {
  if (!phone) return null
  let cleaned = phone.replace(/[^0-9+]/g, '')
  if (!cleaned) return null
  if (cleaned.startsWith('00')) {
    cleaned = `+${cleaned.slice(2)}`
  }
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = `+33${cleaned.slice(1)}`
    } else {
      cleaned = `+${cleaned}`
    }
  }
  return cleaned
}

function isBlacklistStatus(status?: string): boolean {
  if (!status) return false
  const normalized = status.toLowerCase()
  return normalized.includes('liste noire') || normalized.includes('blacklist')
}

function preferReason(current?: string, next?: string): string | undefined {
  if (next && next.length > 0) {
    if (!current || current.length === 0) return next
    if (next.length > current.length) return next
  }
  return current
}

function isHigherPriorityStatus(candidate?: string, existing?: string): boolean {
  if (!candidate) return false
  if (!existing) return true
  const priority = (status: string) => {
    const value = status.toLowerCase()
    if (value.includes('liste noire')) return 3
    if (value.includes('pas intéress')) return 2
    if (value.includes('mauvais')) return 1
    return 0
  }
  return priority(candidate) > priority(existing)
}

export const supabaseShareManager = {
  getState: (): SupabaseShareState => getSnapshot(),
  subscribe: (listener: Listener) => {
    listeners.add(listener)
    listener(getSnapshot())
    return () => {
      listeners.delete(listener)
    }
  },
  async setEnabled(target: SyncTarget, enabled: boolean) {
    state[target].enabled = enabled
    state[target].status = enabled ? 'idle' : 'idle'
    state[target].lastError = undefined
    state[target].stats = undefined
    savePreferences()
    notify()

    if (enabled) {
      ensureListener(target)
      await runSync(target, 'toggle-on')
    } else {
      removeListener(target)
    }
  },
  async triggerSync(target: SyncTarget, reason: string = 'manual') {
    await runSync(target, reason)
  },
  refreshSupabaseStatus: ensureSupabaseReady,
  downloadLogs: () => supabaseLogger.download('dimicall-supabase-share-logs.txt'),
}

export type SupabaseShareManager = typeof supabaseShareManager


