import React, { useEffect, useMemo, useState } from 'react';
import { Contact } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar as CalendarIcon } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, RadialBar, RadialBarChart } from 'recharts';
 
import EventCalendar from '@/components/EventCalendar';

type ChartDashboardProps = {
  contacts: Contact[];
};

export const ChartDashboard: React.FC<ChartDashboardProps> = ({ contacts }) => {
  // Filtres de dates pour les événements locaux (status_events)
  const [startDate, setStartDate] = useState<string>(''); // ISO yyyy-mm-dd
  const [endDate, setEndDate] = useState<string>('');
  const [quickRange, setQuickRange] = useState<'today' | 'thisWeek' | 'thisMonth' | 'custom'>('custom');
  const [localEvents, setLocalEvents] = useState<any[]>([]);
  const [rangeOpen, setRangeOpen] = useState(false);
  const fromDate = startDate ? new Date(startDate) : undefined;
  const toDate = endDate ? new Date(endDate) : undefined;
  // Format local YYYY-MM-DD (évite le décalage UTC)
  const toLocalYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const fetchLocalEvents = async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI?.localdb) {
        const start = startDate ? `${startDate} 00:00:00` : undefined;
        const end = endDate ? `${endDate} 23:59:59` : undefined;
        const res = await window.electronAPI.localdb.listStatus(start, end);
        if (res?.success) setLocalEvents(res.data || []);
      }
    } catch (e) {
      // silencieux
    }
  };

  useEffect(() => {
    fetchLocalEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // Quick ranges
  function setDateFilter(range: 'today' | 'thisWeek' | 'thisMonth') {
    const today = new Date();
    if (range === 'today') {
      setStartDate(toLocalYMD(today));
      setEndDate(toLocalYMD(today));
    } else if (range === 'thisWeek') {
      const day = today.getDay(); // 0 (dim) - 6 (sam)
      const diffToMonday = (day + 6) % 7; // lundi = 0
      const start = new Date(today);
      start.setDate(today.getDate() - diffToMonday);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      setStartDate(toLocalYMD(start));
      setEndDate(toLocalYMD(end));
    } else if (range === 'thisMonth') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setStartDate(toLocalYMD(start));
      setEndDate(toLocalYMD(end));
    }
    setQuickRange(range);
  }
  // Répartition des statuts basée sur la base locale
  const radialData = useMemo(() => {
    const map = new Map<string, number>();
    for (const ev of localEvents) {
      const k = String(ev.new_status || ev.newStatus || '');
      if (!k) continue;
      map.set(k, (map.get(k) || 0) + 1);
    }
    const entries = Array.from(map.entries()).map(([label, value]) => ({ label, value }));
    const sorted = entries.sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, 6);
    const others = sorted.slice(6);
    const othersSum = others.reduce((acc, d) => acc + d.value, 0);
    const withOthers = othersSum > 0 ? [...top, { label: 'Autres', value: othersSum }] : top;
    const palette = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)'];
    return withOthers.map((d, i) => ({ label: d.label, value: d.value, fill: palette[i % palette.length] }));
  }, [localEvents]);

  const radialConfig = useMemo(() => {
    const base: any = { value: { label: 'Contacts' } };
    radialData.forEach((d, i) => {
      base[d.label] = { label: d.label, color: d.fill };
    });
    return base;
  }, [radialData]);

  // KPIs globaux basés sur la base locale (événements)
  const totalRDV = useMemo(() => localEvents.filter((e) => !!e.dateRDV).length, [localEvents]);
  const totalRappels = useMemo(() => localEvents.filter((e) => !!e.dateRappel).length, [localEvents]);

  // Durée d'appel utilitaire (mm:ss -> secondes)
  const parseDuration = (mmss?: string) => {
    if (!mmss) return 0;
    const m = /^(\d{1,2}):(\d{2})$/.exec(mmss);
    if (!m) return 0;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  };
  const averageDurationSeconds = useMemo(() => {
    let sum = 0;
    let count = 0;
    localEvents.forEach((ev: any) => {
      if (ev.dureeAppel) {
        const secs = parseDuration(String(ev.dureeAppel));
        if (secs > 0) {
          sum += secs;
          count += 1;
        }
      }
    });
    return count > 0 ? Math.round(sum / count) : 0;
  }, [localEvents]);

  // Durée moyenne des appels décrochés uniquement (exclure certains statuts)
  const averageAnsweredDurationSeconds = useMemo(() => {
    // Exclure certains statuts d'événement (par libellé)
    const excludedLabels = new Set<string>([
      'Mauvais num',
      'Prématuré',
      'Répondeur',
    ].map((s) => s.toLowerCase()));
    let sum = 0;
    let count = 0;
    localEvents.forEach((ev: any) => {
      const label = String(ev.new_status || ev.newStatus || '').toLowerCase();
      if (excludedLabels.has(label)) return;
      if (ev.dureeAppel) {
        const secs = parseDuration(String(ev.dureeAppel));
        if (secs > 0) {
          sum += secs;
          count += 1;
        }
      }
    });
    return count > 0 ? Math.round(sum / count) : 0;
  }, [localEvents]);

  // Plus de periodMode: agrégation par jour sur la base locale uniquement

  const callsConfig = { count: { label: 'Événements', color: 'var(--chart-5)' } } as const;

  // Événements par jour (base locale)
  const eventsByDay = useMemo(() => {
    const fmt = (s: string) => {
      const d = s.includes('T') ? new Date(s) : new Date(s.replace(' ', 'T') + 'Z');
      if (isNaN(d.getTime())) return null;
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    const map = new Map<string, number>();
    for (const ev of localEvents) {
      const day = ev.applied_at ? fmt(String(ev.applied_at)) : null;
      if (!day) continue;
      map.set(day, (map.get(day) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
  }, [localEvents]);

  const total = contacts.length || 1;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* Filtres de dates (local DB) */}
      <Card className="xl:col-span-2">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center justify-center gap-2 w-full">
            <div className="inline-flex items-center gap-2">
              <Button size="sm" variant={quickRange==='today'?'default':'outline'} onClick={() => setDateFilter('today')}>Aujourd'hui</Button>
              <Button size="sm" variant={quickRange==='thisWeek'?'default':'outline'} onClick={() => setDateFilter('thisWeek')}>Cette semaine</Button>
              <Button size="sm" variant={quickRange==='thisMonth'?'default':'outline'} onClick={() => setDateFilter('thisMonth')}>Ce mois</Button>
            </div>
            <Popover open={rangeOpen} onOpenChange={setRangeOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {fromDate && toDate ? `${toLocalYMD(fromDate)} → ${toLocalYMD(toDate)}` : 'Plage'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 pointer-events-auto" align="start">
                <div className="p-2">
                  <Calendar
                    mode="range"
                    selected={{ from: fromDate, to: toDate } as any}
                    onSelect={(r: any) => {
                      setQuickRange('custom');
                      const f: Date | undefined = r?.from ?? undefined;
                      const t: Date | undefined = r?.to ?? r?.from ?? undefined;
                      setStartDate(f ? toLocalYMD(f) : '');
                      setEndDate(t ? toLocalYMD(t) : '');
                    }}
                    numberOfMonths={2}
                  />
                  <div className="flex justify-end gap-2 p-2">
                    <Button size="sm" variant="secondary" onClick={() => { setRangeOpen(false); }}>Fermer</Button>
                    <Button size="sm" onClick={() => { setRangeOpen(false); fetchLocalEvents(); }}>Appliquer</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button onClick={fetchLocalEvents} variant="outline" size="sm" className="h-8">
              <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Répartition des statuts</CardTitle>
          <CardDescription>Mise à jour sur la sélection actuelle</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer config={radialConfig as any} className="mx-auto aspect-square max-h-[220px] sm:max-h-[260px] md:max-h-[320px] lg:max-h-[360px]">
            <RadialBarChart data={radialData.map((d) => ({ ...d, [d.label]: d.label }))} innerRadius={30} outerRadius={120}>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="label" />} />
              <RadialBar dataKey="value" background />
            </RadialBarChart>
          </ChartContainer>
          {/* Légende personnalisée statuts */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs text-muted-foreground">
            {radialData.map((d) => (
              <div key={d.label} className="flex items-center gap-1.5">
                <div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: d.fill }} />
                <span>{d.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground text-center">{contacts.length} contacts</div>
        </CardContent>
      </Card>
      {/* Carte supprimée selon demande */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Agenda RDV & Rappels</CardTitle>
          <CardDescription>Navigation mensuelle</CardDescription>
        </CardHeader>
        <CardContent>
          <EventCalendar contacts={contacts} />
        </CardContent>
      </Card>

      {/* KPIs alignés en une ligne sur grands écrans */}
      <div className="grid grid-cols-1 gap-4 xl:col-span-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Durée moyenne d'appel</CardTitle>
            <CardDescription>En secondes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-4xl font-bold tabular-nums">{averageDurationSeconds.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Durée moyenne (décrochés)</CardTitle>
            <CardDescription>En secondes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-4xl font-bold tabular-nums">{averageAnsweredDurationSeconds.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>RDV obtenus</CardTitle>
            <CardDescription>Total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-4xl font-bold tabular-nums">{totalRDV.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rappels</CardTitle>
            <CardDescription>Total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-4xl font-bold tabular-nums">{totalRappels.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Nombre d'événements par jour</CardTitle>
              <CardDescription>Basé sur la base locale</CardDescription>
            </div>
            <div className="flex items-center gap-2"></div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={callsConfig as any} className="mx-auto aspect-square max-h-[220px] sm:max-h-[260px] md:max-h-[320px] lg:max-h-[360px]">
            <BarChart data={eventsByDay}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} tickMargin={10} axisLine={false} minTickGap={24} allowDuplicatedCategory={false} />
              <YAxis width={40} />
              <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="count" />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Fin des 5 modules (2 charts + 3 KPIs) */}
    </div>
  );
};

export default ChartDashboard;


