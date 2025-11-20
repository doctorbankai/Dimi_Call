"use client";

import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Clock, Link2, Text, User, Check } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { EditEventDialog } from "@/calendar/components/dialogs/edit-event-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCalendar } from "@/calendar/contexts/calendar-context";

import type { IEvent } from "@/calendar/interfaces";

interface IProps {
  event: IEvent;
  children: React.ReactNode;
}

export function EventDetailsDialog({ event, children }: IProps) {
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);
  const { openAnnuaireContact, completeEvent } = useCalendar();
  const [isCompleting, setIsCompleting] = useState(false);

  const contactName = useMemo(() => {
    const metaName = [event.metadata?.contact?.prenom, event.metadata?.contact?.nom].filter(Boolean).join(" ").trim();
    return metaName || event.user.name;
  }, [event.metadata?.contact?.nom, event.metadata?.contact?.prenom, event.user.name]);

  const contactId = event.metadata?.contact?.id ?? undefined;

  const handleOpenAnnuaire = () => {
    openAnnuaireContact?.(contactId, contactName);
  };

  const handleComplete = async () => {
    if (!completeEvent) return;
    setIsCompleting(true);
    try {
      await completeEvent(event);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>{event.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <User className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Contact</p>
                <p className="text-sm text-muted-foreground">{contactName}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Début</p>
                <p className="text-sm text-muted-foreground">{format(startDate, "PPP p", { locale: fr })}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Fin</p>
                <p className="text-sm text-muted-foreground">{format(endDate, "PPP p", { locale: fr })}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Text className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground">{event.description || '—'}</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {openAnnuaireContact && (
              <Button type="button" variant="outline" onClick={handleOpenAnnuaire} disabled={!contactId && !contactName}>
                <Link2 className="mr-2 h-4 w-4" />
                Ouvrir dans l'annuaire
              </Button>
            )}
            {completeEvent && (
              <Button type="button" variant="default" onClick={handleComplete} disabled={isCompleting}>
                <Check className="mr-2 h-4 w-4" />
                {isCompleting ? 'Validation...' : 'Valider'}
              </Button>
            )}
            <EditEventDialog event={event}>
              <Button type="button" variant="outline">
                Modifier
              </Button>
            </EditEventDialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
