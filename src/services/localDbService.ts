import type { StatusEventRecord } from '@/types/statusEvent';

interface LocalDbApi {
  getAll?: () => Promise<{ success?: boolean; data?: unknown; error?: unknown }>;
  listStatus?: (start?: string, end?: string) => Promise<{ success?: boolean; data?: unknown; error?: unknown }>;
  delete?: (id: number) => Promise<{ success?: boolean; error?: unknown }>;
  exportCsv?: () => Promise<{ success?: boolean; path?: string; error?: unknown }>;
  exportXlsx?: () => Promise<{ success?: boolean; path?: string; error?: unknown }>;
  importCsv?: () => Promise<{ success?: boolean; error?: unknown }>;
  importXlsx?: () => Promise<{ success?: boolean; error?: unknown }>;
  repair?: () => Promise<{ success?: boolean; updated?: number; scanned?: number; error?: unknown }>;
  insertStatus?: (payload: any) => Promise<{ success?: boolean; data?: unknown; error?: unknown }>;
  clear?: () => Promise<{ success?: boolean; error?: unknown }>;
}

const getLocalDbApi = (): LocalDbApi | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return ((window as any)?.electronAPI?.localdb as LocalDbApi) ?? null;
};

const toLocalYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const normalizeDate = (value?: string | null): string | null => {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (iso.test(raw)) return raw;
  const dmy = /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/;
  const ymd = /^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/;
  let parsed: Date | null = null;
  if (dmy.test(raw)) {
    const [, dd, mm, yy] = dmy.exec(raw)!;
    parsed = new Date(`${yy}-${mm}-${dd}T00:00:00Z`);
  } else if (ymd.test(raw)) {
    const [, yy, mm, dd] = ymd.exec(raw)!;
    parsed = new Date(`${yy}-${mm}-${dd}T00:00:00Z`);
  } else {
    const candidate = new Date(raw);
    if (!isNaN(candidate.getTime())) parsed = candidate;
  }
  return parsed ? toLocalYMD(parsed) : null;
};

const normalizeTime = (value?: string | null): string | null => {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(raw);
  if (!m) return null;
  const h = Math.min(23, Math.max(0, Number(m[1])));
  const min = Math.min(59, Math.max(0, Number(m[2])));
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
};

const normalizeDuration = (value?: string | null): string | null => {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(raw);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  const sec = m[3] ? Number(m[3]) : 0;
  const totalSeconds = (h > 0 ? h * 3600 : 0) + min * 60 + sec;
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};

const normalizeStatus = (value?: string | null): string | null => {
  const raw = (value ?? '').trim();
  if (!raw) return 'Non défini';
  const lowered = raw.toLowerCase();
  if (lowered === 'do') return 'D0';
  if (lowered === 'ro') return 'R0';
  if (lowered === 'non defini' || lowered === 'non défini') return 'Non défini';
  return raw;
};

const normalizeAppliedAt = (value?: string | null): string => {
  const raw = (value ?? '').trim();
  if (!raw) return new Date().toISOString();
  const tryParse = (val: string) => {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };
  let parsed = tryParse(raw);
  if (!parsed) {
    const onlyDate = normalizeDate(raw);
    parsed = onlyDate ? new Date(`${onlyDate}T00:00:00Z`) : null;
  }
  return (parsed ?? new Date()).toISOString();
};

const normalizePhone = (value?: string | null): string | null => {
  const raw = (value ?? '').replace(/\s+/g, '').trim();
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return null;
  if (raw.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  return digits;
};

const normalizeEmail = (value?: string | null): string | null => {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  return raw.toLowerCase();
};

const sanitizeEvent = (record: StatusEventRecord): StatusEventRecord => {
  const contactId = (record.contact_id || (record as any).contactId || record.id || '').toString().trim();
  const newStatus = normalizeStatus(record.new_status ?? record.newStatus);
  const oldStatus = normalizeStatus(record.old_status);

  const next: StatusEventRecord = {
    ...record,
    contact_id: contactId || (record.id ? String(record.id) : ''),
    new_status: newStatus,
    old_status: oldStatus,
    applied_at: normalizeAppliedAt(record.applied_at),
    prenom: (record.prenom ?? '').trim() || null,
    nom: (record.nom ?? '').trim() || null,
    telephone: normalizePhone(record.telephone),
    email: normalizeEmail(record.email ?? (record as any).mail),
    commentaire: (record.commentaire ?? (record as any).comment ?? '').trim() || null,
    dateRappel: normalizeDate(record.dateRappel),
    heureRappel: normalizeTime(record.heureRappel),
    dateRDV: normalizeDate(record.dateRDV),
    heureRDV: normalizeTime(record.heureRDV),
    dateAppel: normalizeDate(record.dateAppel),
    heureAppel: normalizeTime(record.heureAppel),
    dureeAppel: normalizeDuration(record.dureeAppel),
    dateEntree: normalizeDate(record.dateEntree),
    heureEntree: normalizeTime(record.heureEntree),
    numeroLigne: typeof record.numeroLigne === 'number' && Number.isFinite(record.numeroLigne) ? record.numeroLigne : null,
    statut: normalizeStatus(record.statut) || newStatus,
    statutAppel: normalizeStatus(record.statutAppel),
    statutRDV: normalizeStatus(record.statutRDV),
    uid_supabase: (record as any).uid_supabase ?? null,
  };
  return next;
};

const normalizeEvents = (data: unknown): StatusEventRecord[] => {
  if (!Array.isArray(data)) return [];
  return (data as StatusEventRecord[]).map(sanitizeEvent);
};

const toRangeBoundaries = (start?: string, end?: string): { start?: string; end?: string } => {
  const normalize = (value?: string | null, isEnd = false) => {
    const trimmed = (value ?? '').trim();
    if (!trimmed) {
      return undefined;
    }
    if (isEnd) {
      // Pour inclure toute la journée de fin, on ajoute un jour et on utilise 00:00:00
      // puis on utilisera < au lieu de <= dans la comparaison
      const date = new Date(trimmed);
      date.setDate(date.getDate() + 1);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d} 00:00:00`;
    }
    return `${trimmed} 00:00:00`;
  };

  return {
    start: normalize(start, false),
    end: normalize(end, true),
  };
};

export const localDbService = {
  async getAll(): Promise<StatusEventRecord[]> {
    const api = getLocalDbApi();
    if (!api?.getAll) {
      return [];
    }
    try {
      const res = await api.getAll();
      if (res?.success) {
        return normalizeEvents(res.data);
      }
    } catch (error) {
      console.error('[localDbService] getAll failed', error);
    }
    return [];
  },

  async listByDateRange(start?: string, end?: string): Promise<StatusEventRecord[]> {
    const api = getLocalDbApi();
    if (!api?.listStatus) {
      return [];
    }
    try {
      const range = toRangeBoundaries(start, end);
      const res = await api.listStatus(range.start, range.end);
      if (res?.success) {
        return normalizeEvents(res.data);
      }
    } catch (error) {
      console.error('[localDbService] listByDateRange failed', error);
    }
    return [];
  },

  async deleteByIds(ids: Iterable<number>): Promise<void> {
    const api = getLocalDbApi();
    if (!api?.delete) {
      return;
    }
    for (const id of ids) {
      try {
        await api.delete(id);
      } catch (error) {
        console.error('[localDbService] delete failed', { id, error });
      }
    }
  },

  async exportCsv(): Promise<boolean> {
    const api = getLocalDbApi();
    if (!api?.exportCsv) {
      return false;
    }
    try {
      const res = await api.exportCsv();
      if (res?.success) {
        try {
          window.dispatchEvent(
            new CustomEvent('dimicall-toast', {
              detail: { type: 'success', title: 'Export CSV réussi', path: res.path },
            })
          );
        } catch (error) {
          console.error('[localDbService] toast dispatch failed', error);
        }
        return true;
      }
    } catch (error) {
      console.error('[localDbService] exportCsv failed', error);
    }
    return false;
  },

  async exportXlsx(): Promise<boolean> {
    const api = getLocalDbApi();
    if (!api?.exportXlsx) {
      return false;
    }
    try {
      const res = await api.exportXlsx();
      if (res?.success) {
        try {
          window.dispatchEvent(
            new CustomEvent('dimicall-toast', {
              detail: { type: 'success', title: 'Export Excel réussi', path: res.path },
            })
          );
        } catch (error) {
          console.error('[localDbService] toast dispatch failed', error);
        }
        return true;
      }
    } catch (error) {
      console.error('[localDbService] exportXlsx failed', error);
    }
    return false;
  },

  async importCsv(): Promise<boolean> {
    const api = getLocalDbApi();
    if (!api?.importCsv) {
      return false;
    }
    try {
      const res = await api.importCsv();
      return Boolean(res?.success);
    } catch (error) {
      console.error('[localDbService] importCsv failed', error);
      return false;
    }
  },

  async importXlsx(): Promise<boolean> {
    const api = getLocalDbApi();
    if (!api?.importXlsx) {
      return false;
    }
    try {
      const res = await api.importXlsx();
      return Boolean(res?.success);
    } catch (error) {
      console.error('[localDbService] importXlsx failed', error);
      return false;
    }
  },

  dispatchSelectionCount(count: number) {
    try {
      window.dispatchEvent(new CustomEvent('dimicall-db-selection', { detail: { count } }));
    } catch (error) {
      console.error('[localDbService] selection event failed', error);
    }
  },

  async clearAll(): Promise<boolean> {
    const api = getLocalDbApi();
    if (!api?.clear) {
      return false;
    }
    try {
      const res = await api.clear();
      if (res?.success) {
        try {
          window.dispatchEvent(new CustomEvent('dimicall-toast', { detail: { type: 'success', title: 'Base locale réinitialisée' } }));
        } catch { }
        return true;
      }
    } catch (error) {
      console.error('[localDbService] clearAll failed', error);
    }
    return false;
  },

  async repair(): Promise<{ success: boolean; updated: number; scanned: number }> {
    const api = getLocalDbApi();
    if (!api?.repair) {
      return { success: false, updated: 0, scanned: 0 };
    }
    try {
      const res = await api.repair();
      if (res?.success) {
        return {
          success: true,
          updated: Number(res.updated || 0),
          scanned: Number(res.scanned || 0),
        };
      }
    } catch (error) {
      console.error('[localDbService] repair failed', error);
    }
    return { success: false, updated: 0, scanned: 0 };
  },

  async saveContacts(contacts: any[]): Promise<{ success: boolean; count: number }> {
    const api = getLocalDbApi();
    if (!api?.insertStatus) {
      return { success: false, count: 0 };
    }

    let savedCount = 0;
    try {
      // Pour éviter de bloquer l'UI, on peut faire des lots si nécessaire,
      // mais ici on itère simplement.
      for (const contact of contacts) {
        const payload = {
          contact_id: contact.id || contact.contactId || crypto.randomUUID(),
          new_status: contact.statut || 'Non défini',
          applied_at: new Date().toISOString(), // Date d'import = maintenant
          prenom: contact.prenom,
          nom: contact.nom,
          telephone: contact.telephone,
          email: contact.email,
          commentaire: contact.commentaire,
          source: contact.source,
          dateRappel: contact.dateRappel,
          heureRappel: contact.heureRappel,
          dateRDV: contact.dateRDV,
          heureRDV: contact.heureRDV,
          dateAppel: contact.dateAppel,
          heureAppel: contact.heureAppel,
          dureeAppel: contact.dureeAppel,
          numeroLigne: contact.numeroLigne,
          // Mapping des champs étendus
          lien: contact.lien,
          sexe: contact.sexe,
          don: contact.don,
          qualite: contact.qualite,
          type: contact.type,
          date: contact.date,
          uid: contact.uid,
          uid_supabase: contact.uid_supabase,
          utilisateur: contact.utilisateur,
          actions: contact.actions,
          statutAppel: contact.statutAppel,
          statutRDV: contact.statutRDV,
          commentaireRDV: contact.commentaireRDV,
        };

        const res = await api.insertStatus(payload);
        if (res && res.success) {
          savedCount++;
        }
      }

      // Après avoir tout sauvegardé, on notifie que la DB a changé
      // pour déclencher la synchro Supabase et le rechargement UI
      if (savedCount > 0) {
        window.dispatchEvent(new CustomEvent('localdb-updated'));
        window.dispatchEvent(new CustomEvent('dimicall-db-selection', { detail: { count: 0 } })); // Reset sélection si besoin
      }

      return { success: true, count: savedCount };
    } catch (error) {
      console.error('[localDbService] saveContacts failed', error);
      return { success: false, count: savedCount };
    }
  },
};
