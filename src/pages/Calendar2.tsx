import { useEffect, useState, useCallback } from 'react';
import { CalendarProvider } from '@/calendar/contexts/calendar-context';
import { ClientContainer } from '@/calendar/components/client-container';
import { TodayEventsCard } from '@/calendar/components/sidebar/today-events-card';
import { UpcomingEventsCard } from '@/calendar/components/sidebar/upcoming-events-card';
import { USERS_MOCK } from '@/calendar/mocks';
import { calendarEventsService } from '@/services/calendarEventsService';
import type { IEvent } from '@/calendar/interfaces';
import '@/utils/testCalendarEvents'; // Charge l'utilitaire de test

type Calendar2Props = {
  onOpenAnnuaireContact?: (id?: string, name?: string) => void;
};

export default function Calendar2({ onOpenAnnuaireContact }: Calendar2Props) {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.classList.add('calendar-no-shadow');
    return () => {
      document.body.classList.remove('calendar-no-shadow');
    };
  }, []);

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

  const handleCompleteEvent = useCallback(
    async (event: IEvent) => {
      const updater = (window as any)?.electronAPI?.localdb?.update;
      const recordId = event.metadata?.source?.id ?? event.metadata?.recordId;
      if (updater && recordId) {
        const payload: Record<string, unknown> = { id: recordId };
        if (event.metadata?.kind === 'rappel') {
          payload.dateRappel = null;
          payload.heureRappel = null;
        } else if (event.metadata?.kind === 'rdv') {
          payload.dateRDV = null;
          payload.heureRDV = null;
        }
        try {
          await updater(payload);
        } catch (error) {
          console.error('[Calendar2] Erreur lors de la validation de lévénement', error);
        }
      }
      setEvents((prev) => prev.filter((item) => item.id !== event.id));
      try {
        window.dispatchEvent(new Event('localdb-updated'));
        window.dispatchEvent(
          new CustomEvent('notifications-dimicall-dismiss', {
            detail: {
              recordId: recordId ?? event.id,
              eventId: event.id,
            },
          })
        );
      } catch (error) {
        console.error('[Calendar2] Impossible démettre localdb-updated', error);
      }
    },
    [setEvents]
  );

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
    <div className="flex-1 min-h-0 flex flex-col calendar-no-shadow">
      <CalendarProvider
        events={events}
        users={USERS_MOCK}
        onOpenAnnuaireContact={onOpenAnnuaireContact}
        onCompleteEvent={handleCompleteEvent}
      >
        <div className="px-4 py-3 flex items-center justify-between">
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
