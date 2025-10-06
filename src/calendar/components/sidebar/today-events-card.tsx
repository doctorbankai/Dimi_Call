import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { useCalendar } from "@/calendar/contexts/calendar-context";
import { useMemo } from "react";
import { parseISO, isSameDay } from "date-fns";

export function TodayEventsCard() {
  const { selectedDate, events } = useCalendar();

  const todayEvents = useMemo(() => {
    return events.filter(event => {
      const eventStartDate = parseISO(event.startDate);
      return isSameDay(eventStartDate, selectedDate);
    });
  }, [events, selectedDate]);

  const formattedDate = format(selectedDate, "EEEE d MMMM yyyy", { locale: fr });

  return (
    <div data-slot="card" className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm">
      <div data-slot="card-header" className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6">
        <div data-slot="card-title" className="font-semibold flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" aria-hidden="true" />
          {formattedDate}
        </div>
      </div>
      <div data-slot="card-content" className="px-6 space-y-3">
        {todayEvents.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Aucun événement prévu
          </div>
        ) : (
          <div className="space-y-2">
            {todayEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{event.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(parseISO(event.startDate), "HH:mm", { locale: fr })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
