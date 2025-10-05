import type { StatusEventRecord } from '@/types/statusEvent';
import type { IEvent } from '@/calendar/interfaces';
import { localDbService } from './localDbService';

/**
 * Valide et normalise une date au format ISO (YYYY-MM-DD)
 */
function validateISODate(dateStr: string): string | null {
  try {
    const trimmed = dateStr.trim();
    // Vérifier le format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      console.error('[validateISODate] Invalid format:', dateStr);
      return null;
    }
    return trimmed;
  } catch {
    return null;
  }
}

/**
 * Valide et normalise une heure au format 24h (HH:MM)
 */
function validateTime24h(timeStr: string): string | null {
  try {
    const trimmed = timeStr.trim();
    // Vérifier le format HH:MM
    if (!/^\d{1,2}:\d{2}$/.test(trimmed)) {
      console.error('[validateTime24h] Invalid format:', timeStr);
      return null;
    }
    
    // Normaliser pour avoir toujours HH:MM (avec 2 chiffres pour l'heure)
    const [hours, minutes] = trimmed.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  } catch {
    return null;
  }
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

      // Normaliser les valeurs (les données sont déjà au bon format)
      const dateStr = String(dateRappel).trim();
      const heureStr = String(heureRappel).trim();
      
      // Valider les formats (YYYY-MM-DD et HH:MM)
      const validDate = validateISODate(dateStr);
      const validTime = validateTime24h(heureStr);
      
      if (!validDate || !validTime) {
        console.error('[createRappelEvent] Invalid date/time format:', { 
          dateRappel: dateStr, 
          heureRappel: heureStr,
          validDate,
          validTime
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
          dateRappel: dateStr,
          heureRappel: heureStr
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

      // Normaliser les valeurs (les données sont déjà au bon format)
      const dateStr = String(dateRDV).trim();
      const heureStr = String(heureRDV).trim();
      
      // Valider les formats (YYYY-MM-DD et HH:MM)
      const validDate = validateISODate(dateStr);
      const validTime = validateTime24h(heureStr);
      
      if (!validDate || !validTime) {
        console.error('[createRDVEvent] Invalid date/time format:', { 
          dateRDV: dateStr, 
          heureRDV: heureStr,
          validDate,
          validTime
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
          dateRDV: dateStr,
          heureRDV: heureStr
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
