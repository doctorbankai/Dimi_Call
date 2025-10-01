import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { EventsSummary } from '@/components/EventsSummary';

interface FullPageCalendarProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

export function FullPageCalendar({ selectedDate, onDateChange }: FullPageCalendarProps) {
  return (
    <div className="flex h-full gap-6 w-full">
      {/* Récapitulatif des événements - côté gauche */}
      <div className="w-80 flex-shrink-0">
        <EventsSummary selectedDate={selectedDate} />
      </div>

      {/* Calendrier principal - côté droit */}
      <div className="flex-1 flex flex-col gap-6 min-w-0 w-full">
        <Card className="flex-1 overflow-hidden border shadow-lg w-full">
          <CardContent className="h-full w-full p-6">
            <div className="flex h-full w-full items-center justify-center">
              <Calendar
                mode="single"
                captionLayout="dropdown-buttons"
                fromYear={1980}
                toYear={2099}
                selected={selectedDate}
                onSelect={onDateChange}
                className="w-full rounded-2xl border bg-background p-6 shadow-sm [--cell-size:6rem] sm:[--cell-size:6.5rem] md:[--cell-size:7rem] lg:[--cell-size:7.5rem] xl:[--cell-size:8rem]"
                classNames={{
                  root: 'w-full',
                  months: 'flex flex-col gap-6 md:flex-row md:items-start md:justify-center w-full',
                  month: 'flex flex-col gap-6 w-full',
                  dropdown_root: 'bg-foreground text-background',
                  nav: 'flex items-center justify-between w-full',
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed w-full">
          <CardContent className="p-5 text-center text-base font-medium">
            {selectedDate ? (
              <span>
                Date selectionnee : {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
            ) : (
              <span>Selectionnez un jour dans le calendrier.</span>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}