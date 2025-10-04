import { supabaseService } from '@/services/supabaseService'
import { supabaseLogger } from '@/lib/supabase-logger'

type SyncTarget = 'phone' | 'blacklist'

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

export interface SupabaseShareState {
  supabaseReady: boolean
  globalError?: string
  phone: ShareTargetState
  blacklist: ShareTargetState
}

type Listener = (state: SupabaseShareState) => void

interface RuntimeTargetState {
  inFlight: boolean
  pendingResync: boolean
}

const STORAGE_KEY = 'dimicall_supabase_share_preferences'
const hasWindow = typeof window !== 'undefined'

const defaultTargetState: ShareTargetState = {
  enabled: false,
  status: 'idle',
}

const state: SupabaseShareState = {
  supabaseReady: safeCheckSupabaseReady(),
  phone: { ...defaultTargetState },
  blacklist: { ...defaultTargetState },
}

const runtimeState: Record<SyncTarget, RuntimeTargetState> = {
  phone: { inFlight: false, pendingResync: false },
  blacklist: { inFlight: false, pendingResync: false },
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
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    supabaseLogger.warn('[share] Sauvegarde préférences Supabase échouée', error)
  }
}

function autoResumeEnabledTargets() {
  if (state.phone.enabled) {
    ensureListener('phone')
    scheduleSync('phone', 'resume')
  }

  if (state.blacklist.enabled) {
    ensureListener('blacklist')
    scheduleSync('blacklist', 'resume')
  }
}

function getSnapshot(): SupabaseShareState {
  return {
    supabaseReady: state.supabaseReady,
    globalError: state.globalError,
    phone: { ...state.phone, stats: state.phone.stats ? { ...state.phone.stats } : undefined },
    blacklist: { ...state.blacklist, stats: state.blacklist.stats ? { ...state.blacklist.stats } : undefined },
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
  return syncSharedBlacklistNumbers(events)
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


