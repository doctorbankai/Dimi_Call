import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addMinutes, format, formatDistanceToNow, formatDistanceToNowStrict, isToday, isTomorrow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

import { calendarEventsService } from "@/services/calendarEventsService";
import { systemNotificationService } from "@/services/systemNotificationService";
import type {
  DesktopNotificationPayload,
  NotificationBuckets,
  NotificationEntry,
  NotificationPreferences,
  UseNotificationCenterState,
} from "@/notifications/types";
import type { IEvent } from "@/calendar/interfaces";

const STORAGE_PREFIX = "dimicall.notifications.v1";
const STORAGE_PREFERENCES = `${STORAGE_PREFIX}.preferences`;
const STORAGE_ACKS = `${STORAGE_PREFIX}.acks`;
const STORAGE_SENT = `${STORAGE_PREFIX}.sent`;

const DEFAULT_PREFERENCES: NotificationPreferences = {
  desktopEnabled: true,
  rappelLeadMinutes: 5,
  rdvLeadMinutes: 15,
};

const MAX_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24h
const LAST_UPDATED_RELATIVE_INTERVAL = 30_000;

const hasWindow = typeof window !== "undefined";

const formatLastUpdatedLabel = (timestamp: number): string => {
  try {
    return `Mise à jour ${formatDistanceToNow(timestamp, { locale: fr, addSuffix: true })}`;
  } catch {
    return "Mis à jour récemment";
  }
};

const readJsonFromStorage = <T,>(key: string, fallback: T): T => {
  if (!hasWindow) {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[useNotificationCenter] Impossible de lire ${key}`, error);
    return fallback;
  }
};

const writeJsonToStorage = (key: string, value: unknown): void => {
  if (!hasWindow) {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[useNotificationCenter] Impossible d'écrire ${key}`, error);
  }
};

const readSet = (key: string): Set<string> => {
  const data = readJsonFromStorage<string[]>(key, []);
  return new Set(data);
};

const writeSet = (key: string, set: Set<string>): void => {
  writeJsonToStorage(key, Array.from(set));
};

const computeInitials = (name: string): string => {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const buildEntryId = (event: IEvent, type: NotificationEntry["type"]): string => {
  const recordId = event.metadata?.recordId ?? event.id;
  const normalizedDate = event.metadata?.normalizedDate ?? event.startDate;
  const normalizedTime = event.metadata?.normalizedTime ?? event.startDate;
  return `${type}-${recordId}-${normalizedDate}-${normalizedTime}`;
};

const toNotificationEntry = (event: IEvent): NotificationEntry | null => {
  try {
    const start = parseISO(event.startDate);
    if (Number.isNaN(start.getTime())) {
      return null;
    }

    const type = event.metadata?.kind ?? (event.title.includes("RDV") ? "rdv" : "rappel");
    const contactName =
      [event.metadata?.contact?.prenom, event.metadata?.contact?.nom].filter(Boolean).join(" ").trim() ||
      event.user?.name ||
      "Contact inconnu";

    return {
      id: buildEntryId(event, type),
      type,
      event,
      startIso: event.startDate,
      endIso: event.endDate,
      startTimestamp: start.getTime(),
      contactName,
      contactInitials: computeInitials(contactName || "C"),
    };
  } catch (error) {
    console.error("[useNotificationCenter] Impossible de convertir l'événement en notification", error, event);
    return null;
  }
};

const groupEntries = (entries: NotificationEntry[], now = Date.now()): NotificationBuckets => {
  const rappel: NotificationEntry[] = [];
  const rdv: NotificationEntry[] = [];
  const overdue: NotificationEntry[] = [];

  for (const entry of entries) {
    if (entry.startTimestamp < now) {
      overdue.push(entry);
      continue;
    }

    if (entry.type === "rappel") {
      rappel.push(entry);
    } else {
      rdv.push(entry);
    }
  }

  const sortAsc = (a: NotificationEntry, b: NotificationEntry) => a.startTimestamp - b.startTimestamp;
  const sortDesc = (a: NotificationEntry, b: NotificationEntry) => b.startTimestamp - a.startTimestamp;

  rappel.sort(sortAsc);
  rdv.sort(sortAsc);
  overdue.sort(sortDesc);

  return {
    rappel,
    rdv,
    overdue,
  };
};

const buildDesktopPayload = (
  entry: NotificationEntry,
  leadMinutes: number
): DesktopNotificationPayload => {
  const start = parseISO(entry.startIso);
  const dayLabel = isToday(start)
    ? "Aujourd'hui"
    : isTomorrow(start)
    ? "Demain"
    : format(start, "EEEE d MMMM", { locale: fr });
  const timeLabel = format(start, "HH:mm");
  const relative = formatDistanceToNowStrict(start, { locale: fr });
  const note = entry.event.metadata?.comment;

  const title =
    entry.type === "rdv"
      ? "RDV imminent"
      : entry.type === "rappel"
      ? "Rappel à traiter"
      : "Notification";

  const bodyLines = [
    `${entry.contactName} • ${dayLabel} à ${timeLabel}`,
    leadMinutes > 0 ? `Échéance dans ${relative}` : `Échéance ${relative}`,
  ];

  if (note) {
    bodyLines.push(note.length > 140 ? `${note.slice(0, 137)}…` : note);
  }

  return {
    title,
    body: bodyLines.join("\n"),
    tag: entry.id,
  };
};

export function useNotificationCenter(): UseNotificationCenterState {
  const [status, setStatus] = useState<UseNotificationCenterState["status"]>("idle");
  const [error, setError] = useState<string | undefined>(undefined);
  const [buckets, setBuckets] = useState<NotificationBuckets>({ rappel: [], rdv: [], overdue: [] });
  const [lastUpdated, setLastUpdated] = useState<number | undefined>(undefined);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState<string>("Synchronisation en cours…");
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [preferences, setPreferences] = useState<NotificationPreferences>(() =>
    readJsonFromStorage(STORAGE_PREFERENCES, DEFAULT_PREFERENCES)
  );
  const [entries, setEntries] = useState<NotificationEntry[]>([]);

  const acksRef = useRef<Set<string>>(readSet(STORAGE_ACKS));
  const sentRef = useRef<Set<string>>(readSet(STORAGE_SENT));
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const isInitialLoadRef = useRef(true);
  const isFetchingRef = useRef(false);
  const queuedRefreshRef = useRef(false);

  const persistAcks = useCallback(() => {
    writeSet(STORAGE_ACKS, acksRef.current);
  }, []);

  const persistSent = useCallback(() => {
    writeSet(STORAGE_SENT, sentRef.current);
  }, []);

  const computeUnread = useCallback(
    (nextBuckets: NotificationBuckets) => {
      const upcoming = [...nextBuckets.rappel, ...nextBuckets.rdv];
      return upcoming.filter((entry) => !acksRef.current.has(entry.id)).length;
    },
    [acksRef]
  );

  const refresh = useCallback(async () => {
    if (isFetchingRef.current) {
      queuedRefreshRef.current = true;
      return;
    }

    isFetchingRef.current = true;
    const isInitial = isInitialLoadRef.current;
    setStatus(isInitial ? "loading" : "refreshing");
    setError(undefined);
    let succeeded = false;
    try {
      const events = await calendarEventsService.getAllEvents();
      const entries = events
        .map(toNotificationEntry)
        .filter((entry): entry is NotificationEntry => Boolean(entry));

      const grouped = groupEntries(entries);
      setEntries(entries);
      setBuckets(grouped);
      setUnreadCount(computeUnread(grouped));
      const updatedAt = Date.now();
      setLastUpdated(updatedAt);
      setLastUpdatedLabel(formatLastUpdatedLabel(updatedAt));
      succeeded = true;
    } catch (err) {
      console.error("[useNotificationCenter] Erreur lors du chargement des notifications", err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      isFetchingRef.current = false;
      if (succeeded) {
        isInitialLoadRef.current = false;
        setStatus("ready");
      }
      if (queuedRefreshRef.current) {
        queuedRefreshRef.current = false;
        refresh();
      }
    }
  }, [computeUnread]);

  const clearScheduledNotifications = useCallback(() => {
    for (const timeout of timeoutsRef.current.values()) {
      clearTimeout(timeout);
    }
    timeoutsRef.current.clear();
  }, []);

  const scheduleDesktopNotifications = useCallback(
    (nextBuckets: NotificationBuckets, prefs: NotificationPreferences) => {
      clearScheduledNotifications();
      if (!prefs.desktopEnabled) {
        return;
      }

      const upcoming = [...nextBuckets.rappel, ...nextBuckets.rdv];
      const now = Date.now();

      upcoming.forEach((entry) => {
        const leadMinutes = entry.type === "rdv" ? prefs.rdvLeadMinutes : prefs.rappelLeadMinutes;
        const triggerAt = addMinutes(parseISO(entry.startIso), -leadMinutes).getTime();
        const key = `${entry.id}|${leadMinutes}`;

        if (sentRef.current.has(key)) {
          return;
        }

        if (triggerAt <= now) {
          const payload = buildDesktopPayload(entry, leadMinutes);
          systemNotificationService.show(payload).then((success) => {
            if (success) {
              sentRef.current.add(key);
              persistSent();
            }
          });
          return;
        }

        const delay = triggerAt - now;
        if (delay > MAX_TIMEOUT_MS) {
          return;
        }

        const timeout = setTimeout(async () => {
          const payload = buildDesktopPayload(entry, leadMinutes);
          const success = await systemNotificationService.show(payload);
          if (success) {
            sentRef.current.add(key);
            persistSent();
          }
          timeoutsRef.current.delete(key);
        }, delay);

        timeoutsRef.current.set(key, timeout);
      });
    },
    [clearScheduledNotifications, persistSent]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!lastUpdated) {
      return;
    }

    setLastUpdatedLabel(formatLastUpdatedLabel(lastUpdated));

    if (!hasWindow) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setLastUpdatedLabel(formatLastUpdatedLabel(lastUpdated));
    }, LAST_UPDATED_RELATIVE_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [lastUpdated]);

  useEffect(() => {
    const handler = () => {
      refresh();
    };
    if (hasWindow) {
      window.addEventListener("localdb-updated", handler);
    }
    return () => {
      if (hasWindow) {
        window.removeEventListener("localdb-updated", handler);
      }
    };
  }, [refresh]);

  useEffect(() => {
    writeJsonToStorage(STORAGE_PREFERENCES, preferences);
  }, [preferences]);

  useEffect(() => {
    scheduleDesktopNotifications(buckets, preferences);
    return () => {
      clearScheduledNotifications();
    };
  }, [buckets, preferences, scheduleDesktopNotifications, clearScheduledNotifications]);

  const markAsRead = useCallback(
    (ids: string[]) => {
      let dirty = false;
      ids.forEach((id) => {
        if (!acksRef.current.has(id)) {
          acksRef.current.add(id);
          dirty = true;
        }
      });
      if (dirty) {
        persistAcks();
        setUnreadCount(computeUnread(buckets));
      }
    },
    [buckets, computeUnread, persistAcks]
  );

  const markAllAsRead = useCallback(() => {
    const allIds = [...buckets.rappel, ...buckets.rdv].map((entry) => entry.id);
    markAsRead(allIds);
  }, [buckets, markAsRead]);

  const toggleDesktopEnabled = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        const granted = await systemNotificationService.ensurePermission();
        if (!granted) {
          setPreferences((prev) => ({ ...prev, desktopEnabled: false }));
          return;
        }
      }
      setPreferences((prev) => ({ ...prev, desktopEnabled: enabled }));
    },
    [setPreferences]
  );

  const state = useMemo<UseNotificationCenterState>(
    () => ({
      status,
      error,
      buckets,
      lastUpdated,
      unreadCount,
      lastUpdatedLabel,
      preferences,
      entries,
      refresh,
      markAllAsRead,
      markAsRead,
      toggleDesktopEnabled,
    }),
    [status, error, buckets, lastUpdated, unreadCount, lastUpdatedLabel, preferences, entries, refresh, markAllAsRead, markAsRead, toggleDesktopEnabled]
  );

  return state;
}
