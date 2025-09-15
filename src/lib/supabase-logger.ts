export type SupabaseLogLevel = 'log' | 'warn' | 'error';

export interface SupabaseLogEntry {
  timestamp: string; // ISO
  level: SupabaseLogLevel;
  message: string;
  details?: unknown;
}

const MAX_ENTRIES = 500;
let entries: SupabaseLogEntry[] = [];

function add(level: SupabaseLogLevel, message: string, details?: unknown) {
  const entry: SupabaseLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    details,
  };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) {
    entries = entries.slice(entries.length - MAX_ENTRIES);
  }
  try {
    // Persist a fenêtre courte pour assister les redémarrages (non critique)
    localStorage.setItem('dc_supabase_logs_snapshot', JSON.stringify(entries.slice(-100)));
  } catch {}
}

function toText(): string {
  return entries
    .map(e => {
      const detailStr = e.details !== undefined ? ` | details=${safeStringify(e.details)}` : '';
      return `[${e.timestamp}] [${e.level.toUpperCase()}] ${e.message}${detailStr}`;
    })
    .join('\n');
}

function safeStringify(value: unknown): string {
  try {
    return typeof value === 'string' ? value : JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
}

function download(filename?: string) {
  const content = toText();
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  a.download = filename || `dimicall-supabase-logs-${ts}.txt`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

export const supabaseLogger = {
  log: (message: string, details?: unknown) => add('log', message, details),
  warn: (message: string, details?: unknown) => add('warn', message, details),
  error: (message: string, details?: unknown) => add('error', message, details),
  getEntries: (): SupabaseLogEntry[] => entries.slice(),
  clear: () => { entries = []; },
  toText,
  download,
};


