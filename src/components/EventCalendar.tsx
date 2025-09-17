import React, { useMemo, useState } from 'react';
import { Calendar, CalendarDayButton as BaseDayButton } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Contact } from '@/types';
import { cn } from '@/lib/utils';

type Props = { contacts: Contact[] };

function formatDateKey(date?: Date | null): string | null {
    if (!date || Number.isNaN(date.getTime?.())) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export const EventCalendar: React.FC<Props> = ({ contacts }) => {
	// Map des événements par jour
	const eventsByDay = useMemo(() => {
		const map: Record<string, { rdv: Contact[]; rappel: Contact[] }> = {};
		for (const c of contacts) {
			if (c.dateRDV) {
				map[c.dateRDV] = map[c.dateRDV] || { rdv: [], rappel: [] };
				map[c.dateRDV].rdv.push(c);
			}
			if (c.dateRappel) {
				map[c.dateRappel] = map[c.dateRappel] || { rdv: [], rappel: [] };
				map[c.dateRappel].rappel.push(c);
			}
		}
		return map;
	}, [contacts]);

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
                ...((ev?.rappel || []).map((c) => `${c.prenom} ${c.nom} (Rappel)`)),
                ...((ev?.rdv || []).map((c) => `${c.prenom} ${c.nom} (RDV)`)),
              ].join('\n')
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
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>{btn}</TooltipTrigger>
                    <TooltipContent>
                        <pre className="text-xs leading-4 whitespace-pre-wrap">{tooltipText}</pre>
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
