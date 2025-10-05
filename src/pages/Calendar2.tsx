import { useEffect, useState } from 'react';
import { CalendarProvider } from '@/calendar/contexts/calendar-context';
import { ClientContainer } from '@/calendar/components/client-container';
import { USERS_MOCK } from '@/calendar/mocks';
import { calendarEventsService } from '@/services/calendarEventsService';
import type { IEvent } from '@/calendar/interfaces';
import '@/utils/testCalendarEvents'; // Charge l'utilitaire de test

export default function Calendar2() {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger les événements depuis la base de données locale
    const loadEvents = async () => {
      try {
        console.log('[Calendar2] Loading events...');
        setLoading(true);
        const dbEvents = await calendarEventsService.getAllEvents();
        console.log('[Calendar2] Events loaded:', dbEvents.length);
        console.log('[Calendar2] Events:', dbEvents);
        setEvents(dbEvents);
      } catch (error) {
        console.error('[Calendar2] Error loading events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();

    // Écouter les mises à jour de la base de données
    const handleDbUpdate = () => {
      loadEvents();
    };

    window.addEventListener('localdb-updated', handleDbUpdate);

    return () => {
      window.removeEventListener('localdb-updated', handleDbUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <CalendarProvider events={events} users={USERS_MOCK}>
        <ClientContainer />
      </CalendarProvider>
    </div>
  );
}
