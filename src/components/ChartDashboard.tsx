import React, { useMemo } from 'react';
import { Contact, ContactStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, RadialBar, RadialBarChart } from 'recharts';
import EventCalendar from '@/components/EventCalendar';

type ChartDashboardProps = {
  contacts: Contact[];
};

export const ChartDashboard: React.FC<ChartDashboardProps> = ({ contacts }) => {
  // Comptage par statut (radial)
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    contacts.forEach((c) => {
      const key = c.statut ?? ContactStatus.NonDefini;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [contacts]);

  const radialData = useMemo(() => {
    const entries = Object.entries(statusCounts).filter(([label]) => label !== ContactStatus.NonDefini);
    // Limiter le nombre de segments pour lisibilité, regrouper le reste
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 6);
    const others = sorted.slice(6);
    const othersSum = others.reduce((acc, [, v]) => acc + v, 0);
    const withOthers = othersSum > 0 ? [...top, ['Autres', othersSum]] : top;
    const palette = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)'];
    return withOthers.map(([label, value], i) => ({
      label: String(label),
      value: Number(value),
      fill: palette[i % palette.length],
    }));
  }, [statusCounts]);

  const radialConfig = useMemo(() => {
    const base: any = { value: { label: 'Contacts' } };
    radialData.forEach((d, i) => {
      base[d.label] = { label: d.label, color: d.fill };
    });
    return base;
  }, [radialData]);

  // KPIs globaux
  const totalRDV = useMemo(() => contacts.filter((c) => !!c.dateRDV).length, [contacts]);
  const totalRappels = useMemo(() => contacts.filter((c) => !!c.dateRappel).length, [contacts]);

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
    contacts.forEach((c) => {
      if (c.dureeAppel) {
        const secs = parseDuration(c.dureeAppel);
        if (secs > 0) {
          sum += secs;
          count += 1;
        }
      }
    });
    return count > 0 ? Math.round(sum / count) : 0;
  }, [contacts]);

  // Durée moyenne des appels décrochés uniquement (exclure certains statuts)
  const averageAnsweredDurationSeconds = useMemo(() => {
    const excluded = new Set< ContactStatus >([
      ContactStatus.MauvaisNum,
      ContactStatus.Premature,
      ContactStatus.Repondeur,
    ]);
    let sum = 0;
    let count = 0;
    contacts.forEach((c) => {
      if (excluded.has(c.statut)) return;
      if (c.dureeAppel) {
        const secs = parseDuration(c.dureeAppel);
        if (secs > 0) {
          sum += secs;
          count += 1;
        }
      }
    });
    return count > 0 ? Math.round(sum / count) : 0;
  }, [contacts]);

  // Bar: durée de chaque appel (derniers 50)
  const lastCallsDurations = useMemo(() => {
    const calls = contacts
      .filter((c) => c.dateAppel && c.dureeAppel)
      .map((c) => ({
        date: c.dateAppel!,
        label: c.dateAppel!,
        duration: parseDuration(c.dureeAppel!),
      }))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return calls.slice(-50);
  }, [contacts]);

  const durationConfig = { duration: { label: 'Durée (s)', color: 'var(--chart-5)' } } as const;

  const total = contacts.length || 1;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Répartition des statuts</CardTitle>
          <CardDescription>Mise à jour sur la sélection actuelle</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer config={radialConfig as any} className="mx-auto aspect-square max-h-[300px]">
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
          <CardTitle>Durée de chaque appel (derniers 50)</CardTitle>
          <CardDescription>En secondes</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={durationConfig as any} className="mx-auto aspect-square max-h-[300px]">
            <BarChart data={lastCallsDurations}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} tickMargin={10} axisLine={false} minTickGap={24} allowDuplicatedCategory={false} />
              <YAxis width={40} />
              <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="duration" />} />
              <Bar dataKey="duration" fill="var(--color-duration)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Fin des 5 modules (2 charts + 3 KPIs) */}
    </div>
  );
};

export default ChartDashboard;


