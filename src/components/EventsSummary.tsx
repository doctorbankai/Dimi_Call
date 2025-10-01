import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Phone, Mail, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Event {
  id: number;
  contactId: string;
  prenom?: string;
  nom?: string;
  telephone?: string;
  email?: string;
  commentaire?: string;
  dateRappel?: string;
  heureRappel?: string;
  dateRDV?: string;
  heureRDV?: string;
  newStatus?: string;
}

interface EventsSummaryProps {
  selectedDate?: Date;
  className?: string;
}

export function EventsSummary({ selectedDate, className }: EventsSummaryProps) {
  const [localEvents, setLocalEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les événements depuis la base de données locale
  const loadEvents = async () => {
    try {
      setIsLoading(true);
      if (typeof window !== 'undefined' && (window as any).electronAPI?.localdb) {
        const res = await (window as any).electronAPI.localdb.getAll();
        if (res?.success) {
          setLocalEvents(res.data || []);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    const handleUpdate = () => loadEvents();
    window.addEventListener('localdb-updated', handleUpdate as any);
    return () => window.removeEventListener('localdb-updated', handleUpdate as any);
  }, []);

  // Filtrer les événements pour la date sélectionnée
  const eventsForDate = useMemo(() => {
    if (!selectedDate) return { rdv: [], rappel: [] };
    
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const rdv: Event[] = [];
    const rappel: Event[] = [];

    localEvents.forEach(event => {
      if (event.dateRDV === dateKey) {
        rdv.push(event);
      }
      if (event.dateRappel === dateKey) {
        rappel.push(event);
      }
    });

    return { rdv, rappel };
  }, [selectedDate, localEvents]);

  // Obtenir les événements à venir (7 prochains jours)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcoming: { event: Event; type: 'rdv' | 'rappel'; date: string }[] = [];

    localEvents.forEach(event => {
      if (event.dateRDV) {
        const eventDate = new Date(event.dateRDV);
        if (eventDate >= today && eventDate <= nextWeek) {
          upcoming.push({ event, type: 'rdv', date: event.dateRDV });
        }
      }
      if (event.dateRappel) {
        const eventDate = new Date(event.dateRappel);
        if (eventDate >= today && eventDate <= nextWeek) {
          upcoming.push({ event, type: 'rappel', date: event.dateRappel });
        }
      }
    });

    return upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [localEvents]);

  const formatEventTime = (date: string, time?: string) => {
    if (!time) return '';
    return time;
  };

  const getEventTypeColor = (type: 'rdv' | 'rappel') => {
    return type === 'rdv' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-orange-100 text-orange-800 border-orange-200';
  };

  const getEventTypeIcon = (type: 'rdv' | 'rappel') => {
    return type === 'rdv' ? <Calendar className="h-4 w-4" /> : <Clock className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Récapitulatif des événements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Chargement...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Événements du jour sélectionné */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {eventsForDate.rdv.length === 0 && eventsForDate.rappel.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Aucun événement prévu
              </div>
            ) : (
              <>
                {/* RDV du jour */}
                {eventsForDate.rdv.map((event) => (
                  <div key={`rdv-${event.id}`} className="flex items-start gap-3 p-3 rounded-lg border bg-blue-50/50">
                    <div className="flex-shrink-0">
                      <Badge className={getEventTypeColor('rdv')}>
                        {getEventTypeIcon('rdv')}
                        <span className="ml-1">RDV</span>
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        {event.prenom} {event.nom}
                      </div>
                      {event.heureRDV && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatEventTime(event.dateRDV!, event.heureRDV)}
                        </div>
                      )}
                      {event.telephone && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />
                          {event.telephone}
                        </div>
                      )}
                      {event.commentaire && (
                        <div className="text-sm text-muted-foreground flex items-start gap-1 mt-1">
                          <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{event.commentaire}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Rappels du jour */}
                {eventsForDate.rappel.map((event) => (
                  <div key={`rappel-${event.id}`} className="flex items-start gap-3 p-3 rounded-lg border bg-orange-50/50">
                    <div className="flex-shrink-0">
                      <Badge className={getEventTypeColor('rappel')}>
                        {getEventTypeIcon('rappel')}
                        <span className="ml-1">Rappel</span>
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        {event.prenom} {event.nom}
                      </div>
                      {event.heureRappel && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatEventTime(event.dateRappel!, event.heureRappel)}
                        </div>
                      )}
                      {event.telephone && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />
                          {event.telephone}
                        </div>
                      )}
                      {event.commentaire && (
                        <div className="text-sm text-muted-foreground flex items-start gap-1 mt-1">
                          <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{event.commentaire}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Événements à venir */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Prochains événements (7 jours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Aucun événement à venir
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.slice(0, 5).map((item, index) => (
                <div key={`upcoming-${item.event.id}-${index}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex-shrink-0">
                    <Badge variant="outline" className={getEventTypeColor(item.type)}>
                      {getEventTypeIcon(item.type)}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {item.event.prenom} {item.event.nom}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(item.date), 'dd/MM', { locale: fr })} • {item.type === 'rdv' ? 'RDV' : 'Rappel'}
                    </div>
                  </div>
                </div>
              ))}
              {upcomingEvents.length > 5 && (
                <div className="text-xs text-muted-foreground text-center pt-2">
                  +{upcomingEvents.length - 5} autres événements
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
