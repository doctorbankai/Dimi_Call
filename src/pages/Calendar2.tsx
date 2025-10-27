import { useEffect, useState } from 'react';
import { CalendarProvider } from '@/calendar/contexts/calendar-context';
import { ClientContainer } from '@/calendar/components/client-container';
import { TodayEventsCard } from '@/calendar/components/sidebar/today-events-card';
import { UpcomingEventsCard } from '@/calendar/components/sidebar/upcoming-events-card';
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
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <CalendarProvider events={events} users={USERS_MOCK}>
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Calendrier</h1>
        </div>
        <div className="flex gap-4 p-4 h-full overflow-hidden">
          {/* Sidebar gauche avec les cartes */}
          <div className="w-80 flex-shrink-0 space-y-4 overflow-y-auto">
            <TodayEventsCard />
            <UpcomingEventsCard />
          </div>
          
          {/* Calendrier principal */}
          <div className="flex-1 overflow-hidden">
            <ClientContainer />
          </div>
        </div>
      </CalendarProvider>
    </div>
  );
}
