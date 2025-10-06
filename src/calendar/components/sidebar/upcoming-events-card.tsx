import { format, addDays, parseISO, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock } from "lucide-react";
import { useCalendar } from "@/calendar/contexts/calendar-context";
import { useMemo } from "react";

export function UpcomingEventsCard() {
  const { selectedDate, events } = useCalendar();

  const upcomingEvents = useMemo(() => {
    const startDate = selectedDate;
    const endDate = addDays(selectedDate, 7);

    return events
      .filter(event => {
        const eventStartDate = parseISO(event.startDate);
        return isWithinInterval(eventStartDate, { start: startDate, end: endDate });
      })
      .sort((a, b) => {
        const dateA = parseISO(a.startDate);
        const dateB = parseISO(b.startDate);
        return dateA.getTime() - dateB.getTime();
      });
  }, [events, selectedDate]);

  const displayedEvents = upcomingEvents.slice(0, 5);
  const remainingCount = upcomingEvents.length - displayedEvents.length;

  return (
    <div data-slot="card" className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm">
      <div data-slot="card-header" className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6">
        <div data-slot="card-title" className="font-semibold flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" aria-hidden="true" />
          Prochains événements (7 jours)
        </div>
      </div>
      <div data-slot="card-content" className="px-6">
        <div className="space-y-2">
          {displayedEvents.map((event) => {
            const eventDate = parseISO(event.startDate);
            return (
              <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <div className="flex-shrink-0">
                  <span data-slot="badge" className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden bg-orange-100 text-orange-800 border-orange-200">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{event.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(eventDate, "dd/MM", { locale: fr })} • {event.type || "Rappel"}
                  </div>
                </div>
              </div>
            );
          })}
          {remainingCount > 0 && (
            <div className="text-xs text-muted-foreground text-center pt-2">
              +{remainingCount} autres événements
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
