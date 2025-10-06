import React, { useEffect, useMemo, useState } from 'react';
import { Contact } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';
 

type ChartDashboardProps = {
  contacts: Contact[];
};

export const ChartDashboard: React.FC<ChartDashboardProps> = ({ contacts }) => {
  // Filtres de dates pour les événements locaux (status_events)
  const [startDate, setStartDate] = useState<string>(''); // ISO yyyy-mm-dd
  const [endDate, setEndDate] = useState<string>('');
  const [localEvents, setLocalEvents] = useState<any[]>([]);
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

  // Écoute des filtres externes (pilotage depuis App)
  useEffect(() => {
    const handler = (e: any) => {
      const { scope, start, end } = e.detail || {};
      if (scope === 'graph') {
        setStartDate(start || '');
        setEndDate(end || '');
      }
    };
    window.addEventListener('dimicall-date-filter', handler as any);
    return () => window.removeEventListener('dimicall-date-filter', handler as any);
  }, []);
  // Répartition des statuts basée sur la base locale
  const radialData = useMemo(() => {
    const map = new Map<string, number>();
    for (const ev of localEvents) {
      const k = String(ev.new_status || ev.newStatus || '');
      // Exclure les statuts vides ou "Non défini"
      if (!k || k === 'Non défini') continue;
      map.set(k, (map.get(k) || 0) + 1);
    }
    const entries = Array.from(map.entries()).map(([label, value]) => ({ label, value }));
    const sorted = entries.sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, 6);
    const others = sorted.slice(6);
    const othersSum = others.reduce((acc, d) => acc + d.value, 0);
    const withOthers = othersSum > 0 ? [...top, { label: 'Autres', value: othersSum }] : top;
    
    // Utiliser les couleurs des badges de statuts
    const getStatusColorFromLabel = (label: string): string => {
      // Mapping des labels vers les ContactStatus
      const statusMap: Record<string, string> = {
        'Non défini': 'hsl(var(--muted))',
        'Mauvais num': 'hsl(0 84.2% 60.2%)',
        'Répondeur': 'hsl(45 93.4% 47.5%)',
        'À rappeler': 'hsl(43 96.4% 56.3%)',
        'Pas intéressé': 'hsl(215.4 16.3% 46.9%)',
        'Argumenté': 'hsl(221.2 83.2% 53.3%)',
        'DO': 'hsl(142.1 76.2% 36.3%)',
        'RO': 'hsl(160 84.1% 39.4%)',
        'Liste noire': 'hsl(240 5.9% 10%)',
        'Prématuré': 'hsl(280 87.3% 65.1%)',
        'A0': 'hsl(239 84.3% 67.8%)',
      };
      return statusMap[label] || 'hsl(var(--chart-1))';
    };
    
    return withOthers.map((d) => ({ 
      label: d.label, 
      value: d.value, 
      fill: getStatusColorFromLabel(d.label) 
    }));
  }, [localEvents]);

  const radialConfig = useMemo(() => {
    const base: any = { value: { label: 'Contacts' } };
    radialData.forEach((d) => {
      base[d.label] = { label: d.label, color: d.fill };
    });
    return base;
  }, [radialData]);

  // Données d'entonnoir de conversion
  const funnelData = useMemo(() => {
    // Définition des règles d'agrégation (DO et RO au lieu de D0 et R0)
    const statusMapping = {
      'Contacté': ['Mauvais num', 'Répondeur', 'À rappeler', 'Pas intéressé', 'Argumenté', 'DO', 'RO'],
      'Décroché': ['À rappeler', 'Pas intéressé', 'Argumenté', 'DO', 'RO'],
      'Argumenté': ['Argumenté', 'DO', 'RO'],
      'Pris': ['DO', 'RO']
    };

    // Initialisation des compteurs
    const counts = {
      'Contacté': 0,
      'Décroché': 0,
      'Argumenté': 0,
      'Pris': 0
    };

    // Parcours des événements locaux
    localEvents.forEach((event) => {
      const status = String(event.new_status || event.newStatus || '');
      
      // Comptage pour chaque catégorie applicable
      Object.entries(statusMapping).forEach(([category, statuses]) => {
        if (statuses.includes(status)) {
          counts[category as keyof typeof counts]++;
        }
      });
    });

    // Transformation en format pour Recharts
    return [
      { category: 'Contacté', value: counts['Contacté'], fill: 'var(--chart-1)' },
      { category: 'Décroché', value: counts['Décroché'], fill: 'var(--chart-2)' },
      { category: 'Argumenté', value: counts['Argumenté'], fill: 'var(--chart-3)' },
      { category: 'Pris', value: counts['Pris'], fill: 'var(--chart-4)' }
    ];
  }, [localEvents]);

  // Configuration du graphique d'entonnoir
  const funnelConfig = {
    value: { label: 'Événements' },
    'Contacté': { label: 'Contacté', color: 'var(--chart-1)' },
    'Décroché': { label: 'Décroché', color: 'var(--chart-2)' },
    'Argumenté': { label: 'Argumenté', color: 'var(--chart-3)' },
    'Pris': { label: 'Pris', color: 'var(--chart-4)' }
  } as const;

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
    <div className="w-full max-w-none" style={{ width: '100%', margin: 0, padding: 0 }}>
      <Card className="flex flex-col w-full" style={{ width: '100%' }}>
        <CardHeader className="items-center pb-0">
          <CardTitle>Répartition des statuts</CardTitle>
          <CardDescription>Mise à jour sur la sélection actuelle</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 w-full" style={{ width: '100%' }}>
          <ChartContainer config={radialConfig as any} className="w-full h-[500px]" style={{ width: '100%' }}>
            <BarChart data={radialData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="label" />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {radialData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
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

      {/* Graphique d'entonnoir de conversion */}
      {localEvents.length === 0 ? (
        <Card className="w-full mt-4">
          <CardHeader className="items-center pb-0">
            <CardTitle>Entonnoir de conversion</CardTitle>
            <CardDescription>Progression des contacts par étape</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Aucune donnée disponible</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full mt-4">
          <CardHeader className="items-center pb-0">
            <CardTitle>Entonnoir de conversion</CardTitle>
            <CardDescription>Progression des contacts par étape</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer config={funnelConfig as any} className="w-full h-[400px]">
              <BarChart 
                accessibilityLayer 
                data={funnelData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs text-muted-foreground">
              {funnelData.map((d) => (
                <div key={d.category} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: d.fill }} />
                  <span>{d.category}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-muted-foreground text-center">
              {funnelData.reduce((acc, d) => acc + d.value, 0)} Événements
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs alignés en une ligne sur grands écrans */}
      <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-4 mt-4">
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

      <Card className="w-full mt-4">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Nombre d'événements par jour</CardTitle>
              <CardDescription>Basé sur la base locale</CardDescription>
            </div>
            <div className="flex items-center gap-2"></div>
          </div>
        </CardHeader>
        <CardContent className="w-full" style={{ width: '100%' }}>
          <ChartContainer config={callsConfig as any} className="w-full h-[280px] sm:h-[320px] md:h-[360px] xl:h-[420px]" style={{ width: '100%' }}>
            <BarChart data={eventsByDay} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
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

