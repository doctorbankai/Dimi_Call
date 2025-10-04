import type { StatusEventRecord } from '@/types/statusEvent';

interface LocalDbApi {
  getAll?: () => Promise<{ success?: boolean; data?: unknown; error?: unknown }>;
  listStatus?: (start?: string, end?: string) => Promise<{ success?: boolean; data?: unknown; error?: unknown }>;
  delete?: (id: number) => Promise<{ success?: boolean; error?: unknown }>;
  exportCsv?: () => Promise<{ success?: boolean; path?: string; error?: unknown }>;
  exportXlsx?: () => Promise<{ success?: boolean; path?: string; error?: unknown }>;
  importCsv?: () => Promise<{ success?: boolean; error?: unknown }>;
  importXlsx?: () => Promise<{ success?: boolean; error?: unknown }>;
}

const getLocalDbApi = (): LocalDbApi | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return ((window as any)?.electronAPI?.localdb as LocalDbApi) ?? null;
};

const normalizeEvents = (data: unknown): StatusEventRecord[] => {
  if (Array.isArray(data)) {
    return data as StatusEventRecord[];
  }
  return [];
};

const toRangeBoundaries = (start?: string, end?: string): { start?: string; end?: string } => {
  const normalize = (value?: string | null, isEnd = false) => {
    const trimmed = (value ?? '').trim();
    if (!trimmed) {
      return undefined;
    }
    return `${trimmed} ${isEnd ? '23:59:59' : '00:00:00'}`;
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
};
