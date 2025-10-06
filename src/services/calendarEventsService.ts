import type { StatusEventRecord } from '@/types/statusEvent';
import type { IEvent } from '@/calendar/interfaces';
import { localDbService } from './localDbService';

const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MINUTES_PER_DAY = 24 * 60;

const pad2 = (value: number): string => value.toString().padStart(2, '0');

const isValidDateParts = (year: number, month: number, day: number): boolean => {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return false;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() + 1 === month &&
    candidate.getUTCDate() === day
  );
};

const buildIsoDate = (year: number, month: number, day: number): string | null => {
  if (!isValidDateParts(year, month, day)) {
    return null;
  }
  return `${year.toString().padStart(4, '0')}-${pad2(month)}-${pad2(day)}`;
};

const excelSerialToIsoDate = (serial: number): string | null => {
  if (!Number.isFinite(serial) || serial <= 0 || serial > 100000) {
    return null;
  }
  const days = Math.floor(serial);
  const date = new Date(EXCEL_EPOCH_MS + days * DAY_IN_MS);
  return buildIsoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
};

const normalizeIsoDate = (raw: unknown): string | null => {
  if (raw === null || raw === undefined) {
    return null;
  }

  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return buildIsoDate(raw.getFullYear(), raw.getMonth() + 1, raw.getDate());
  }

  const trimmed = String(raw).trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const isoWithTime = trimmed.match(/^(\d{4}-\d{2}-\d{2})[ T]/);
  if (isoWithTime) {
    return isoWithTime[1];
  }

  const numericCandidate = trimmed.replace(',', '.');
  if (/^\d+(\.\d+)?$/.test(numericCandidate)) {
    const serial = Number(numericCandidate);
    const fromSerial = excelSerialToIsoDate(serial);
    if (fromSerial) {
      return fromSerial;
    }
  }

  const dateMatch = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dateMatch) {
    const part1 = Number(dateMatch[1]);
    const part2 = Number(dateMatch[2]);
    let year = Number(dateMatch[3]);
    if (dateMatch[3].length === 2) {
      year += year >= 70 ? 1900 : 2000;
    }

    let month: number;
    let day: number;

    if (part1 > 12 && part2 <= 12) {
      day = part1;
      month = part2;
    } else if (part2 > 12 && part1 <= 12) {
      month = part1;
      day = part2;
    } else {
      month = part1;
      day = part2;
    }

    const iso = buildIsoDate(year, month, day);
    if (iso) {
      return iso;
    }
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return buildIsoDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
  }

  return null;
};

const normalizeMinutesToTime = (totalMinutes: number): string | null => {
  if (!Number.isFinite(totalMinutes)) {
    return null;
  }
  let minutes = Math.round(totalMinutes);
  if (minutes < 0) {
    return null;
  }
  minutes %= MINUTES_PER_DAY;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${pad2(hours)}:${pad2(mins)}`;
};

const excelSerialToTime = (serial: number): string | null => {
  if (!Number.isFinite(serial)) {
    return null;
  }

  if (serial >= 1 && serial < 24) {
    const hours = Math.floor(serial);
    const minutes = Math.round((serial - hours) * 60);
    return normalizeMinutesToTime(hours * 60 + minutes);
  }

  if (serial >= 0 && serial < 1) {
    const totalMinutes = serial * MINUTES_PER_DAY;
    return normalizeMinutesToTime(totalMinutes);
  }

  if (serial >= 24) {
    const wrapped = serial % 24;
    return excelSerialToTime(wrapped);
  }

  return null;
};

const normalizeTime24hValue = (raw: unknown): string | null => {
  if (raw === null || raw === undefined) {
    return null;
  }

  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return `${pad2(raw.getHours())}:${pad2(raw.getMinutes())}`;
  }

  const trimmed = String(raw).trim();
  if (!trimmed) {
    return null;
  }

  const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeMatch) {
    let hours = Number(timeMatch[1]);
    let minutes = Number(timeMatch[2]);
    const seconds = Number(timeMatch[3] ?? '0');

    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours > 99) {
      return null;
    }

    if (seconds >= 30) {
      minutes += 1;
    }

    return normalizeMinutesToTime(hours * 60 + minutes);
  }

  const frenchFormat = trimmed.match(/^(\d{1,2})h(\d{2})$/i);
  if (frenchFormat) {
    const hours = Number(frenchFormat[1]);
    const minutes = Number(frenchFormat[2]);
    return normalizeMinutesToTime(hours * 60 + minutes);
  }

  const ampmMatch = trimmed.match(/^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*([AP])\.?M\.?$/i);
  if (ampmMatch) {
    let hours = Number(ampmMatch[1]);
    const minutes = Number(ampmMatch[2] ?? '0');
    const seconds = Number(ampmMatch[3] ?? '0');
    const period = ampmMatch[4].toUpperCase();

    if (hours === 12) {
      hours = 0;
    }
    if (period === 'P') {
      hours += 12;
    }

    const totalMinutes = hours * 60 + minutes + (seconds >= 30 ? 1 : 0);
    return normalizeMinutesToTime(totalMinutes);
  }

  const numericCandidate = trimmed.replace(',', '.');
  if (/^\d+(\.\d+)?$/.test(numericCandidate)) {
    const numeric = Number(numericCandidate);
    const fromExcel = excelSerialToTime(numeric);
    if (fromExcel) {
      return fromExcel;
    }
    if (numeric >= 0 && numeric < 24) {
      const hours = Math.floor(numeric);
      const minutes = Math.round((numeric - hours) * 60);
      return normalizeMinutesToTime(hours * 60 + minutes);
    }
  }

  return null;
};

/**
 * Normalise une date au format ISO (YYYY-MM-DD)
 */
function validateISODate(input: unknown): string | null {
  return normalizeIsoDate(input);
}

/**
 * Normalise une heure au format 24h (HH:MM)
 */
function validateTime24h(input: unknown): string | null {
  return normalizeTime24hValue(input);
}

/**
 * Convertit les événements de la base de données locale en événements du calendrier
 */
export const calendarEventsService = {
  /**
   * Récupère tous les événements (rappels + RDV) de la base de données
   */
  async getAllEvents(): Promise<IEvent[]> {
    const dbEvents = await localDbService.getAll();
    console.log('[calendarEventsService] DB Events loaded:', dbEvents.length);
    console.log('[calendarEventsService] First 3 events:', dbEvents.slice(0, 3));
    const converted = this.convertToCalendarEvents(dbEvents);
    console.log('[calendarEventsService] Converted events:', converted.length);
    console.log('[calendarEventsService] Converted events sample:', converted.slice(0, 3));
    return converted;
  },

  /**
   * Récupère les événements dans une plage de dates
   */
  async getEventsByDateRange(start?: string, end?: string): Promise<IEvent[]> {
    const dbEvents = await localDbService.listByDateRange(start, end);
    return this.convertToCalendarEvents(dbEvents);
  },

  /**
   * Convertit les événements de la DB en événements du calendrier
   */
  convertToCalendarEvents(dbEvents: StatusEventRecord[]): IEvent[] {
    const calendarEvents: IEvent[] = [];
    let rappelCount = 0;
    let rdvCount = 0;

    for (const dbEvent of dbEvents) {
      // Debug: afficher les champs de date/heure
      if (dbEvent.dateRappel || dbEvent.heureRappel || dbEvent.dateRDV || dbEvent.heureRDV) {
        console.log('[calendarEventsService] Event with dates:', {
          id: dbEvent.id,
          dateRappel: dbEvent.dateRappel,
          heureRappel: dbEvent.heureRappel,
          dateRDV: dbEvent.dateRDV,
          heureRDV: dbEvent.heureRDV,
        });
      }

      // Traiter les rappels
      if (dbEvent.dateRappel && dbEvent.heureRappel) {
        rappelCount++;
        const rappelEvent = this.createRappelEvent(dbEvent);
        if (rappelEvent) {
          calendarEvents.push(rappelEvent);
        }
      }

      // Traiter les RDV
      if (dbEvent.dateRDV && dbEvent.heureRDV) {
        rdvCount++;
        const rdvEvent = this.createRDVEvent(dbEvent);
        if (rdvEvent) {
          calendarEvents.push(rdvEvent);
        }
      }
    }

    console.log('[calendarEventsService] Found rappels:', rappelCount, 'RDV:', rdvCount);
    return calendarEvents;
  },

  /**
   * Crée un événement de type Rappel
   */
  createRappelEvent(dbEvent: StatusEventRecord): IEvent | null {
    try {
      const { dateRappel, heureRappel, prenom, nom, telephone, commentaire } = dbEvent;
      
      if (!dateRappel || !heureRappel) return null;

      // Normaliser les valeurs (conversion des formats Excel, AM/PM, etc.)
      const validDate = validateISODate(dateRappel);
      const validTime = validateTime24h(heureRappel);
      
      if (!validDate || !validTime) {
        console.error('[createRappelEvent] Invalid date/time format:', { 
          dateRappel,
          heureRappel,
          normalizedDate: validDate,
          normalizedTime: validTime
        });
        return null;
      }

      // Construire la date/heure de début (format ISO 8601)
      const startDateTime = `${validDate}T${validTime}:00`;
      const startDate = new Date(startDateTime);
      
      // Vérifier si la date est valide
      if (isNaN(startDate.getTime())) {
        console.error('[createRappelEvent] Invalid date object:', { 
          startDateTime,
          dateRappel,
          heureRappel
        });
        return null;
      }
      
      // Durée par défaut : 30 minutes pour un rappel
      const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

      // Construire le titre
      const contactName = [prenom, nom].filter(Boolean).join(' ') || 'Contact inconnu';
      const title = `📞 Rappel: ${contactName}`;

      // Construire la description
      const description = [
        telephone ? `Téléphone: ${telephone}` : null,
        commentaire ? `Commentaire: ${commentaire}` : null,
      ].filter(Boolean).join('\n');

      return {
        id: dbEvent.id * 10 + 1, // ID unique pour les rappels (ex: 10, 20, 30...)
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        title,
        color: 'blue', // Bleu pour les rappels
        description: description || '',
        user: {
          id: dbEvent.contact_id || 'unknown',
          name: contactName,
          picturePath: null,
        },
      };
    } catch (error) {
      console.error('[calendarEventsService] Error creating rappel event:', error);
      return null;
    }
  },

  /**
   * Crée un événement de type RDV
   */
  createRDVEvent(dbEvent: StatusEventRecord): IEvent | null {
    try {
      const { dateRDV, heureRDV, prenom, nom, telephone, commentaire } = dbEvent;
      
      if (!dateRDV || !heureRDV) return null;

      // Normaliser les valeurs (conversion des formats Excel, AM/PM, etc.)
      const validDate = validateISODate(dateRDV);
      const validTime = validateTime24h(heureRDV);
      
      if (!validDate || !validTime) {
        console.error('[createRDVEvent] Invalid date/time format:', { 
          dateRDV,
          heureRDV,
          normalizedDate: validDate,
          normalizedTime: validTime
        });
        return null;
      }

      // Construire la date/heure de début (format ISO 8601)
      const startDateTime = `${validDate}T${validTime}:00`;
      const startDate = new Date(startDateTime);
      
      // Vérifier si la date est valide
      if (isNaN(startDate.getTime())) {
        console.error('[createRDVEvent] Invalid date object:', { 
          startDateTime,
          dateRDV,
          heureRDV
        });
        return null;
      }
      
      // Durée par défaut : 1 heure pour un RDV
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      // Construire le titre
      const contactName = [prenom, nom].filter(Boolean).join(' ') || 'Contact inconnu';
      const title = `📅 RDV: ${contactName}`;

      // Construire la description
      const description = [
        telephone ? `Téléphone: ${telephone}` : null,
        commentaire ? `Commentaire: ${commentaire}` : null,
      ].filter(Boolean).join('\n');

      return {
        id: dbEvent.id * 10 + 2, // ID unique pour les RDV (ex: 12, 22, 32...)
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        title,
        color: 'green', // Vert pour les RDV
        description: description || '',
        user: {
          id: dbEvent.contact_id || 'unknown',
          name: contactName,
          picturePath: null,
        },
      };
    } catch (error) {
      console.error('[calendarEventsService] Error creating RDV event:', error);
      return null;
    }
  },
};
