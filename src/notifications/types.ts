import type { CalendarEventKind, IEvent } from "@/calendar/interfaces";

export interface DesktopNotificationPayload {
  title: string;
  body: string;
  subtitle?: string;
  silent?: boolean;
  urgency?: "low" | "normal" | "critical";
  tag?: string;
  timeoutType?: "default" | "never";
  data?: Record<string, unknown>;
}

export interface NotificationEntry {
  /**
   * Identifiant unique basé sur l'événement source afin de gérer les accusés de lecture
   */
  id: string;
  /**
   * Type d'événement (rappel vs RDV)
   */
  type: CalendarEventKind;
  /**
   * Instance brute provenant du calendrier
   */
  event: IEvent;
  /**
   * Date ISO (UTC) de début d'événement
   */
  startIso: string;
  /**
   * Date ISO (UTC) de fin d'événement
   */
  endIso: string;
  /**
   * Timestamp numérique (ms) calculé côté client pour simplifier les comparaisons
   */
  startTimestamp: number;
  /**
   * Nom complet du contact (utilisé pour l'affichage et la recherche)
   */
  contactName: string;
  /**
   * Initiales calculées pour les avatars
   */
  contactInitials: string;
}

export interface NotificationPreferences {
  desktopEnabled: boolean;
  rappelLeadMinutes: number;
  rdvLeadMinutes: number;
}

export interface NotificationBuckets {
  rappel: NotificationEntry[];
  rdv: NotificationEntry[];
  overdue: NotificationEntry[];
}

export interface UseNotificationCenterState {
  status: "idle" | "loading" | "refreshing" | "ready" | "error";
  error?: string;
  lastUpdated?: number;
  lastUpdatedLabel: string;
  unreadCount: number;
  buckets: NotificationBuckets;
  entries: NotificationEntry[];
  preferences: NotificationPreferences;
  refresh: () => Promise<void>;
  markAllAsRead: () => void;
  markAsRead: (ids: string[]) => void;
  toggleDesktopEnabled: (enabled: boolean) => Promise<void>;
}
