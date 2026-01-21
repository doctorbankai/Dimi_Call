import React, { useEffect, useMemo, useState } from 'react';
import { Contact } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, LabelList } from 'recharts';
import { localDbService } from '@/services/localDbService';
import { ContactListDialog } from './ContactListDialog';



type ChartDashboardProps = {
  contacts: Contact[];
  initialStartDate?: string;
  initialEndDate?: string;
};

export const ChartDashboard: React.FC<ChartDashboardProps> = ({ contacts, initialStartDate, initialEndDate }) => {
  // Filtres de dates pour les événements locaux (status_events)
  const [startDate, setStartDate] = useState<string>(initialStartDate || ''); // ISO yyyy-mm-dd
  const [endDate, setEndDate] = useState<string>(initialEndDate || '');
  const [localEvents, setLocalEvents] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      // Utiliser localDbService qui applique correctement toRangeBoundaries
      const events = await localDbService.listByDateRange(startDate || undefined, endDate || undefined);
      setLocalEvents(events);
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
  // Filtrer les événements pour ne garder que ceux des contacts présents
  const filteredLocalEvents = useMemo(() => {
    const contactIds = new Set(contacts.map(c => String(c.id)));
    return localEvents.filter(ev => contactIds.has(String(ev.contact_id)));
  }, [localEvents, contacts]);

  // Répartition des statuts basée sur la base locale
  const radialData = useMemo(() => {
    // Grouper par contact_id et garder seulement le dernier événement
    const latestByContact = new Map<string, any>();
    for (const ev of filteredLocalEvents) {
      const contactId = String(ev.contact_id || '');
      if (!contactId) continue;

      const existing = latestByContact.get(contactId);
      const evDate = new Date(ev.applied_at || 0).getTime();

      if (!existing || new Date(existing.applied_at || 0).getTime() < evDate) {
        latestByContact.set(contactId, ev);
      }
    }

    // Compter les statuts finaux
    const map = new Map<string, number>();
    const contactIdsByStatus = new Map<string, Set<string>>();

    for (const ev of latestByContact.values()) {
      let k = String(ev.new_status || ev.newStatus || '');
      const contactId = String(ev.contact_id || '');

      // Exclure les statuts vides ou "Non défini"
      if (!k || k === 'Non défini') continue;

      // Normaliser les anciens statuts DO/RO vers D0/R0
      if (k === 'DO') k = 'D0';
      if (k === 'RO') k = 'R0';

      map.set(k, (map.get(k) || 0) + 1);

      if (!contactIdsByStatus.has(k)) {
        contactIdsByStatus.set(k, new Set());
      }
      contactIdsByStatus.get(k)?.add(contactId);
    }

    // Utiliser les couleurs des badges de statuts (correspondant à statusConfigService)
    const getStatusColorFromLabel = (label: string): string => {
      // Mapping des labels vers les couleurs HSL correspondant aux couleurs Tailwind
      const statusMap: Record<string, string> = {
        'Non défini': 'hsl(220 8.9% 46.1%)', // gray
        'Mauvais num': 'hsl(0 84.2% 60.2%)', // red
        'Répondeur': 'hsl(24.6 95% 53.1%)', // orange
        'À rappeler': 'hsl(47.9 95.8% 53.1%)', // yellow
        'Pas intéressé': 'hsl(0 84.2% 60.2%)', // red (corrigé)
        'Argumenté': 'hsl(221.2 83.2% 53.3%)', // blue
        'D0': 'hsl(142.1 76.2% 36.3%)', // emerald
        'R0': 'hsl(142.1 70.6% 45.3%)', // green
        'Liste noire': 'hsl(240 5.9% 10%)', // gray-800
        'Prématuré': 'hsl(280 87.3% 65.1%)', // purple
        'A0': 'hsl(239 84.3% 67.8%)', // indigo
      };
      return statusMap[label] || 'hsl(var(--chart-1))';
    };

    // Ordre des statuts défini
    const statusOrder = ['Mauvais num', 'Répondeur', 'À rappeler', 'Pas intéressé', 'Argumenté', 'D0', 'R0', 'Liste noire', 'Prématuré'];

    // Créer un tableau avec tous les statuts dans l'ordre
    const orderedData = statusOrder
      .map(label => ({
        label,
        value: map.get(label) || 0,
        fill: getStatusColorFromLabel(label),
        contactIds: Array.from(contactIdsByStatus.get(label) || [])
      }))
      .filter(d => d.value > 0); // Ne garder que ceux qui ont des valeurs

    // Ajouter les statuts non listés (comme A0 ou autres) à la fin
    const listedStatuses = new Set(statusOrder);
    const unlisted = Array.from(map.entries())
      .filter(([label]) => !listedStatuses.has(label))
      .map(([label, value]) => ({
        label,
        value,
        fill: getStatusColorFromLabel(label),
        contactIds: Array.from(contactIdsByStatus.get(label) || [])
      }));

    return [...orderedData, ...unlisted];
  }, [filteredLocalEvents]);

  const radialConfig = useMemo(() => {
    const base: any = { value: { label: 'Contacts' } };
    radialData.forEach((d) => {
      base[d.label] = { label: d.label, color: d.fill };
    });
    return base;
  }, [radialData]);

  // Données d'entonnoir de conversion
  const funnelData = useMemo(() => {
    // Grouper par contact_id et garder seulement le dernier événement
    const latestByContact = new Map<string, any>();
    for (const ev of filteredLocalEvents) {
      const contactId = String(ev.contact_id || '');
      if (!contactId) continue;

      const existing = latestByContact.get(contactId);
      const evDate = new Date(ev.applied_at || 0).getTime();

      if (!existing || new Date(existing.applied_at || 0).getTime() < evDate) {
        latestByContact.set(contactId, ev);
      }
    }

    // Définition des règles d'agrégation (D0 et R0)
    const statusMapping = {
      'Contacté': ['Mauvais num', 'Répondeur', 'À rappeler', 'Pas intéressé', 'Argumenté', 'D0', 'R0'],
      'Décroché': ['À rappeler', 'Pas intéressé', 'Argumenté', 'D0', 'R0'],
      'Argumenté': ['Argumenté', 'D0', 'R0'],
      'Pris': ['D0', 'R0']
    };

    // Initialisation des compteurs et des listes de contacts
    const counts = {
      'Contacté': 0,
      'Décroché': 0,
      'Argumenté': 0,
      'Pris': 0
    };
    const contactIdsByFunnel = {
      'Contacté': new Set<string>(),
      'Décroché': new Set<string>(),
      'Argumenté': new Set<string>(),
      'Pris': new Set<string>()
    };

    // Parcours des derniers statuts par contact
    latestByContact.forEach((event) => {
      let status = String(event.new_status || event.newStatus || '');
      const contactId = String(event.contact_id || '');

      // Normaliser les anciens statuts DO/RO vers D0/R0
      if (status === 'DO') status = 'D0';
      if (status === 'RO') status = 'R0';

      // Comptage pour chaque catégorie applicable
      Object.entries(statusMapping).forEach(([category, statuses]) => {
        if (statuses.includes(status)) {
          const cat = category as keyof typeof counts;
          counts[cat]++;
          contactIdsByFunnel[cat].add(contactId);
        }
      });
    });

    // Transformation en format pour Recharts avec couleurs correspondantes
    return [
      { category: 'Contacté', value: counts['Contacté'], fill: 'hsl(24.6 95% 53.1%)', contactIds: Array.from(contactIdsByFunnel['Contacté']) }, // orange (Répondeur)
      { category: 'Décroché', value: counts['Décroché'], fill: 'hsl(47.9 95.8% 53.1%)', contactIds: Array.from(contactIdsByFunnel['Décroché']) }, // yellow (À rappeler)
      { category: 'Argumenté', value: counts['Argumenté'], fill: 'hsl(221.2 83.2% 53.3%)', contactIds: Array.from(contactIdsByFunnel['Argumenté']) }, // blue (Argumenté)
      { category: 'Pris', value: counts['Pris'], fill: 'hsl(142.1 76.2% 36.3%)', contactIds: Array.from(contactIdsByFunnel['Pris']) } // emerald (D0)
    ];
  }, [filteredLocalEvents]);

  // Configuration du graphique d'entonnoir
  const funnelConfig = {
    value: { label: 'Événements' },
    'Contacté': { label: 'Contacté', color: 'hsl(24.6 95% 53.1%)' }, // orange (Répondeur)
    'Décroché': { label: 'Décroché', color: 'hsl(47.9 95.8% 53.1%)' }, // yellow (À rappeler)
    'Argumenté': { label: 'Argumenté', color: 'hsl(221.2 83.2% 53.3%)' }, // blue (Argumenté)
    'Pris': { label: 'Pris', color: 'hsl(142.1 76.2% 36.3%)' } // emerald (D0)
  } as const;

  // KPIs globaux basés sur la base locale (derniers événements par contact)
  const totalRDV = useMemo(() => {
    const latestByContact = new Map<string, any>();
    for (const ev of filteredLocalEvents) {
      const contactId = String(ev.contact_id || '');
      if (!contactId) continue;

      const existing = latestByContact.get(contactId);
      const evDate = new Date(ev.applied_at || 0).getTime();

      if (!existing || new Date(existing.applied_at || 0).getTime() < evDate) {
        latestByContact.set(contactId, ev);
      }
    }
    return Array.from(latestByContact.values()).filter((e) => !!e.dateRDV).length;
  }, [filteredLocalEvents]);

  const totalRappels = useMemo(() => {
    const latestByContact = new Map<string, any>();
    for (const ev of filteredLocalEvents) {
      const contactId = String(ev.contact_id || '');
      if (!contactId) continue;

      const existing = latestByContact.get(contactId);
      const evDate = new Date(ev.applied_at || 0).getTime();

      if (!existing || new Date(existing.applied_at || 0).getTime() < evDate) {
        latestByContact.set(contactId, ev);
      }
    }
    return Array.from(latestByContact.values()).filter((e) => !!e.dateRappel).length;
  }, [filteredLocalEvents]);

  // Durée d'appel utilitaire (supporte mm:ss ou hh:mm:ss)
  const parseDuration = (value?: string) => {
    if (!value) return 0;
    const parts = String(value).trim().split(':');
    if (parts.length < 2 || parts.length > 3) return 0;
    const nums = parts.map((p) => Number(p));
    if (nums.some((n) => Number.isNaN(n))) return 0;
    if (nums.length === 2) return nums[0] * 60 + nums[1];
    return nums[0] * 3600 + nums[1] * 60 + nums[2];
  };
  const averageDurationSeconds = useMemo(() => {
    let sum = 0;
    let count = 0;
    filteredLocalEvents.forEach((ev: any) => {
      if (ev.dureeAppel) {
        const secs = parseDuration(String(ev.dureeAppel));
        if (secs > 0) {
          sum += secs;
          count += 1;
        }
      }
    });
    return count > 0 ? Math.round(sum / count) : 0;
  }, [filteredLocalEvents]);

  // Durée moyenne des appels décrochés uniquement (exclure certains statuts)
  const averageAnsweredDurationSeconds = useMemo(() => {
    // Grouper par contact_id et garder seulement le dernier événement
    const latestByContact = new Map<string, any>();
    for (const ev of filteredLocalEvents) {
      const contactId = String(ev.contact_id || '');
      if (!contactId) continue;

      const existing = latestByContact.get(contactId);
      const evDate = new Date(ev.applied_at || 0).getTime();

      if (!existing || new Date(existing.applied_at || 0).getTime() < evDate) {
        latestByContact.set(contactId, ev);
      }
    }

    // Exclure certains statuts d'événement (par libellé)
    const excludedLabels = new Set<string>([
      'Mauvais num',
      'Prématuré',
      'Répondeur',
    ].map((s) => s.toLowerCase()));
    let sum = 0;
    let count = 0;
    latestByContact.forEach((ev: any) => {
      let label = String(ev.new_status || ev.newStatus || '');

      // Normaliser les anciens statuts DO/RO vers D0/R0
      if (label === 'DO') label = 'D0';
      if (label === 'RO') label = 'R0';

      label = label.toLowerCase();
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
  }, [filteredLocalEvents]);

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
    for (const ev of filteredLocalEvents) {
      const day = ev.applied_at ? fmt(String(ev.applied_at)) : null;
      if (!day) continue;
      map.set(day, (map.get(day) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
  }, [filteredLocalEvents]);

  const handleBarClick = (data: any) => {
    // Supporte à la fois 'label' (Radial) et 'category' (Funnel)
    const statusLabel = data?.label || data?.category;
    if (statusLabel) {
      setSelectedStatus(statusLabel);
      setIsDialogOpen(true);
    }
  };

  const selectedContacts = useMemo(() => {
    if (!selectedStatus) return [];

    // Cherche d'abord dans radialData
    const radialMatch = radialData.find(d => d.label === selectedStatus);
    if (radialMatch && radialMatch.contactIds) {
      const idSet = new Set(radialMatch.contactIds);
      return contacts.filter(c => idSet.has(String(c.id)));
    }

    // Sinon cherche dans funnelData
    const funnelMatch = funnelData.find(d => d.category === selectedStatus);
    if (funnelMatch && funnelMatch.contactIds) {
      const idSet = new Set(funnelMatch.contactIds);
      return contacts.filter(c => idSet.has(String(c.id)));
    }

    return [];
  }, [selectedStatus, radialData, funnelData, contacts]);

  const handleDownloadLogs = () => {
    if (!selectedStatus) return;

    const timestamp = new Date().toISOString();
    const contactIds = new Set(contacts.map(c => String(c.id)));

    // Collecter les événements bruts pour ce statut (sans filtre)
    const rawEventsForStatus = localEvents.filter(ev => {
      let status = String(ev.new_status || ev.newStatus || '');
      // Normaliser les anciens statuts DO/RO vers D0/R0
      if (status === 'DO') status = 'D0';
      if (status === 'RO') status = 'R0';
      return status === selectedStatus;
    });

    // Collecter les événements filtrés
    const filteredEventsForStatus = filteredLocalEvents.filter(ev => {
      let status = String(ev.new_status || ev.newStatus || '');
      // Normaliser les anciens statuts DO/RO vers D0/R0
      if (status === 'DO') status = 'D0';
      if (status === 'RO') status = 'R0';
      return status === selectedStatus;
    });

    const logs = [
      `DEBUG LOGS - CHART DATA VS CONTACT LIST`,
      `Timestamp: ${timestamp}`,
      `Selected Status: ${selectedStatus}`,
      `----------------------------------------`,
      `GLOBAL COUNTS:`,
      `- Total Contacts (Props): ${contacts.length}`,
      `- Total Raw Events (DB): ${localEvents.length}`,
      `- Total Filtered Events (DB matching Contacts): ${filteredLocalEvents.length}`,
      ``,
      `STATUS SPECIFIC (${selectedStatus}):`,
      `- Raw Events Count: ${rawEventsForStatus.length}`,
      `- Filtered Events Count: ${filteredEventsForStatus.length}`,
      `- Selected Contacts Found: ${selectedContacts.length}`,
      ``,
      `ANALYSIS:`,
      rawEventsForStatus.length > filteredEventsForStatus.length
        ? `⚠️ Mismatch detected! ${rawEventsForStatus.length - filteredEventsForStatus.length} events exist for contacts NOT in the current list.`
        : `✅ Raw and Filtered counts match (or filtered is subset).`,
      ``,
      `RAW EVENT SAMPLE (First 10 for status ${selectedStatus}):`,
      ...rawEventsForStatus.slice(0, 10).map(ev =>
        `  - ContactID: ${ev.contact_id}, Status: ${ev.new_status || ev.newStatus}, Date: ${ev.applied_at} ${contactIds.has(String(ev.contact_id)) ? '[VALID]' : '[ORPHANED]'}`
      ),
      ``,
      `CONTACT IDS IN CURRENT LIST (First 10):`,
      ...contacts.slice(0, 10).map(c => `  - ${c.id} (${c.prenom} ${c.nom})`)
    ].join('\n');

    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug_chart_${selectedStatus}_${timestamp.replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const total = contacts.length || 1;

  return (
    <div className="w-full max-w-none" style={{ width: '100%', margin: 0, padding: 0 }}>
      {/* Dialog liste contacts */}
      <ContactListDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        status={selectedStatus || ''}
        contacts={selectedContacts}
        onDownloadLogs={handleDownloadLogs}
      />
      <Card className="flex flex-col w-full" style={{ width: '100%' }}>
        <CardHeader className="items-center pb-0">
          <CardTitle>Répartition des statuts</CardTitle>
          <CardDescription>Mise à jour sur la sélection actuelle</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 w-full" style={{ width: '100%' }}>
          <ChartContainer config={radialConfig as any} className="w-full h-[500px]" style={{ width: '100%' }}>
            <BarChart
              accessibilityLayer
              data={radialData}
              margin={{ top: 32, right: 12, left: 12, bottom: 12 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis allowDecimals={false} />
              <ChartTooltip
                cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
                onClick={handleBarClick}
                className="cursor-pointer"
              >
                {radialData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity cursor-pointer" />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  offset={8}
                  fill="hsl(var(--foreground))"
                  fontSize={12}
                />
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
                <Bar
                  dataKey="value"
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={false}
                  onClick={handleBarClick}
                  className="cursor-pointer"
                >
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity cursor-pointer" />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="top"
                    fill="hsl(var(--foreground))"
                    fontSize={12}
                  />
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
              <YAxis width={40} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="count" />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Fin des 5 modules (2 charts + 3 KPIs) */}

      <ContactListDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        status={selectedStatus || ''}
        contacts={selectedContacts}
      />
    </div>
  );
};

export default ChartDashboard;

