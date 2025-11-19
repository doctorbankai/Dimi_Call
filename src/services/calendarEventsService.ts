import type { StatusEventRecord } from '@/types/statusEvent';
import type { IEvent, IEventMetadata } from '@/calendar/interfaces';
import { localDbService } from './localDbService';
import { normalizeIsoDate, normalizeTime24hValue } from '@/utils/datetimeNormalization';

const buildEventMetadata = (
  kind: 'rappel' | 'rdv',
  dbEvent: StatusEventRecord,
  normalizedDate: string | null,
  normalizedTime: string | null
): IEventMetadata => ({
  kind,
  recordId: dbEvent.id,
  contact: {
    id: dbEvent.contact_id ?? null,
    prenom: dbEvent.prenom ?? null,
    nom: dbEvent.nom ?? null,
  },
  phone: dbEvent.telephone ?? null,
  email: dbEvent.email ?? dbEvent.mail ?? null,
  comment: dbEvent.commentaire ?? dbEvent.comment ?? null,
  status: dbEvent.new_status ?? dbEvent.newStatus ?? null,
  normalizedDate,
  normalizedTime,
  source: dbEvent,
});

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
    return this.convertToCalendarEvents(dbEvents);
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

      const metadata = buildEventMetadata('rappel', dbEvent, validDate, validTime);

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
        metadata,
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

      const metadata = buildEventMetadata('rdv', dbEvent, validDate, validTime);

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
        metadata,
      };
    } catch (error) {
      console.error('[calendarEventsService] Error creating RDV event:', error);
      return null;
    }
  },
};
