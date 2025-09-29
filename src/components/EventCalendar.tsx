import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CalendarDayButton as BaseDayButton } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Contact } from '@/types';
import { cn } from '@/lib/utils';

type Props = { contacts?: Contact[] };

function formatDateKey(date?: Date | null): string | null {
    if (!date || Number.isNaN(date.getTime?.())) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export const EventCalendar: React.FC<Props> = () => {
    // Charger les événements locaux (status_events)
    const [localEvents, setLocalEvents] = useState<any[]>([])
    const loadEvents = async () => {
        try {
            if (typeof window !== 'undefined' && (window as any).electronAPI?.localdb) {
                const res = await (window as any).electronAPI.localdb.getAll()
                if (res?.success) setLocalEvents(res.data || [])
            }
        } catch {}
    }
    useEffect(() => { loadEvents() }, [])
    useEffect(() => {
        const h = () => loadEvents()
        window.addEventListener('localdb-updated', h as any)
        return () => window.removeEventListener('localdb-updated', h as any)
    }, [])

    // Map des événements par jour (depuis status_events)
    const eventsByDay = useMemo(() => {
        const map: Record<string, { rdv: any[]; rappel: any[] }> = {};
        for (const ev of localEvents) {
            if (ev.dateRDV) {
                map[ev.dateRDV] = map[ev.dateRDV] || { rdv: [], rappel: [] };
                map[ev.dateRDV].rdv.push(ev);
            }
            if (ev.dateRappel) {
                map[ev.dateRappel] = map[ev.dateRappel] || { rdv: [], rappel: [] };
                map[ev.dateRappel].rappel.push(ev);
            }
        }
        return map;
    }, [localEvents]);

    // Matchers pour rdv/rappel
    const hasRdv = (date: Date) => {
        const k = formatDateKey(date); if (!k) return false; return (eventsByDay[k]?.rdv?.length ?? 0) > 0;
    };
    const hasRappel = (date: Date) => {
        const k = formatDateKey(date); if (!k) return false; return (eventsByDay[k]?.rappel?.length ?? 0) > 0;
    };

    // Bouton jour avec pastilles et tooltip
    const DayButton: React.FC<any> = (props) => {
        const date: Date | undefined = props?.day?.date || props?.date;
        const k = formatDateKey(date);
        const ev = k ? eventsByDay[k] : undefined;
        const showRdv = (ev?.rdv?.length ?? 0) > 0;
        const showRappel = (ev?.rappel?.length ?? 0) > 0;
        const showTooltip = showRdv || showRappel;
        const tooltipText = showTooltip
            ? [
                ev?.rdv?.length
                  ? [
                      `📅 RDV (${ev.rdv.length})`,
                      ...ev.rdv
                        .slice()
                        .sort((a, b) => (a.heureRDV || '').localeCompare(b.heureRDV || ''))
                        .map((c) => [
                          `• ${c.prenom || ''} ${c.nom || ''}`.trim(),
                          c.heureRDV ? `   ⏰ ${c.heureRDV}` : undefined,
                          c.telephone ? `   ☎ ${c.telephone}` : undefined,
                          (c.commentaire || (c.comment)) ? `   💬 "${c.commentaire || c.comment}"` : undefined,
                        ].filter(Boolean).join('\n')),
                    ].join('\n')
                  : '',
                ev?.rappel?.length
                  ? [
                      `⏰ Rappels (${ev.rappel.length})`,
                      ...ev.rappel
                        .slice()
                        .sort((a, b) => (a.heureRappel || '').localeCompare(b.heureRappel || ''))
                        .map((c) => [
                          `• ${c.prenom || ''} ${c.nom || ''}`.trim(),
                          c.heureRappel ? `   ⏰ ${c.heureRappel}` : undefined,
                          c.telephone ? `   ☎ ${c.telephone}` : undefined,
                          (c.commentaire || (c.comment)) ? `   💬 "${c.commentaire || c.comment}"` : undefined,
                        ].filter(Boolean).join('\n')),
                    ].join('\n')
                  : '',
              ].filter(Boolean).join('\n\n')
            : '';

        const buttonStyle: React.CSSProperties = {};
        if (showRdv && showRappel) {
            buttonStyle.background = 'linear-gradient(135deg, var(--chart-2) 0% 50%, var(--chart-3) 50% 100%)';
            buttonStyle.color = 'hsl(var(--primary-foreground))';
        } else if (showRdv) {
            buttonStyle.background = 'var(--chart-2)';
            buttonStyle.color = 'hsl(var(--primary-foreground))';
        } else if (showRappel) {
            buttonStyle.background = 'var(--chart-3)';
            buttonStyle.color = 'hsl(var(--primary-foreground))';
        }

        const btn = (
            <BaseDayButton {...props} className={cn('relative', props.className)} style={buttonStyle}>
                {props.children}
            </BaseDayButton>
        );
        if (!showTooltip) return btn;

        return (
            <TooltipProvider delayDuration={0}>
                <Tooltip delayDuration={0} disableHoverableContent={false}>
                    <TooltipTrigger asChild>{btn}</TooltipTrigger>
                    <TooltipContent 
                        side="top" 
                        align="center"
                        className="max-w-xs p-3 bg-popover text-popover-foreground border shadow-lg"
                        sideOffset={8}
                        avoidCollisions={true}
                        sticky="always"
                    >
                        <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono">
                            {tooltipText}
                        </pre>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

    const [selected, setSelected] = useState<Date | undefined>(new Date());

    return (
        <div className="w-full flex flex-col items-center">
            <Calendar
                showOutsideDays
                captionLayout="dropdown"
                mode="single"
                selected={selected}
                onSelect={setSelected}
                className="mx-auto [--cell-size:--spacing(9)]"
                components={{ DayButton }}
            />
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-[var(--chart-2)]" /> RDV</div>
                <div className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-[var(--chart-3)]" /> Rappels</div>
            </div>
        </div>
    );
};

export default EventCalendar;
