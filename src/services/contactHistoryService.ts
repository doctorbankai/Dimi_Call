import { ContactStatus } from '@/types';
import type { StatusEventRecord } from '@/types/statusEvent';
import { formatPhoneNumber } from './dataService';

export type HistoryType = 'appel' | 'rappel' | 'rdv' | 'statut';

export interface HistoryMetaItem {
    label: string;
    value: string;
}

export interface ContactHistoryItem {
    id: number;
    appliedAt?: string | null;
    displayDate: string;
    status: string;
    previousStatus?: string;
    type: HistoryType;
    meta: HistoryMetaItem[];
    notes?: string;
}

export interface DirectoryContact {
    id: string;
    fullName: string;
    prenom: string;
    nom: string;
    telephone: string;
    email?: string;
    status: string;
    previousStatus?: string;
    commentaire?: string;
    reminder?: { date?: string; time?: string; label: string };
    rdv?: { date?: string; time?: string; label: string };
    lastCall?: { date?: string; time?: string; duration?: string; label: string };
    history: ContactHistoryItem[];
    events: StatusEventRecord[];
    lastUpdatedAt?: string | null;
    lastUpdatedLabel?: string;
    totalEvents: number;
    numeroLigne: number;
    firstCallAt?: number | null;
    firstD0R0At?: number | null;
}

export const safeTrim = (value: unknown): string => {
    if (value === undefined || value === null) {
        return '';
    }
    return String(value).trim();
};

export const statusKey = (value?: string | null): string => {
    const trimmed = safeTrim(value);
    if (!trimmed) {
        return '';
    }
    return trimmed
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();
};

export const normalizeStatusLabel = (status?: string | null): string => {
    const trimmed = safeTrim(status);
    if (!trimmed) {
        return 'Non défini';
    }
    const key = statusKey(trimmed);
    if (key.startsWith('nondefin')) return 'Non défini';
    if (key.includes('mauvais')) return 'Mauvais num';
    if (key.includes('repondeur')) return 'Répondeur';
    if (key.includes('rappeler')) return 'À rappeler';
    if (key.includes('pasinter')) return 'Pas intéressé';
    if (key.includes('argument')) return 'Argumenté';
    if (key === 'do') return 'D0';
    if (key === 'ro') return 'R0';
    if (key === 'a0') return 'A0'; // Corrigé pour correspondre au type ContactStatus
    if (key.includes('listenoi')) return 'Liste noire';
    if (key.includes('prematur')) return 'Prématuré';
    return trimmed;
};

export const getStatusColor = (status: string): string => {
    const key = statusKey(status);
    if (key.startsWith('nondefin')) {
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
    if (key.includes('mauvais')) {
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
    if (key.includes('repondeur')) {
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    }
    if (key.includes('rappeler')) {
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
    if (key.includes('pasinter')) {
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
    if (key.includes('argument')) {
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
    if (key === 'do' || key === 'ro') {
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    }
    if (key.includes('listenoi')) {
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
    if (key.includes('prematur')) {
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    }
    if (key === 'a0') {
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
};

export type StatusCategory = 'all' | 'non-appeles' | 'ne-pas-appeler' | 'premature' | 'prospects' | 'process';

export const STATUS_CATEGORY_LABELS: Record<Exclude<StatusCategory, 'all'>, string> = {
    'non-appeles': 'Non appelés',
    'ne-pas-appeler': 'Ne pas appeler',
    premature: 'Prématuré',
    prospects: 'Prospects',
    process: 'Process en cours',
};

export const STATUS_CATEGORY_ORDER: Exclude<StatusCategory, 'all'>[] = [
    'non-appeles',
    'ne-pas-appeler',
    'premature',
    'prospects',
    'process',
];

export const getStatusCategory = (status?: string | null): Exclude<StatusCategory, 'all'> => {
    const key = statusKey(status);
    if (!key || key.startsWith('nondefin')) {
        return 'non-appeles';
    }
    if (key.includes('listenoi') || key.includes('pasinter') || key.includes('mauvais')) {
        return 'ne-pas-appeler';
    }
    if (key.includes('prematur')) {
        return 'premature';
    }
    if (key === 'do' || key === 'ro' || key.includes('d0') || key.includes('r0')) {
        return 'process';
    }
    if (key.includes('repondeur') || key.includes('rappeler') || key.includes('argument') || key === 'a0') {
        return 'prospects';
    }
    return 'non-appeles';
};

export const buildFullName = (prenom?: string, nom?: string): string => {
    return [safeTrim(prenom), safeTrim(nom)].filter(Boolean).join(' ').trim();
};

export const formatIsoDateTime = (iso?: string | null): string => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

export const formatDateAndTime = (date?: string | null, time?: string | null): string => {
    const dateValue = safeTrim(date);
    const timeValue = safeTrim(time);
    if (!dateValue && !timeValue) {
        return '';
    }
    const combined = [dateValue, timeValue].filter(Boolean).join(' ');
    const parsed = combined ? new Date(combined) : null;
    if (parsed && !Number.isNaN(parsed.getTime())) {
        const dateText = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(parsed);
        if (timeValue) {
            return `${dateText} à ${timeValue}`;
        }
        return dateText;
    }
    if (dateValue && timeValue) {
        return `${dateValue} à ${timeValue}`;
    }
    return dateValue || timeValue;
};

export const buildIsoFromDateTime = (date?: string | null, time?: string | null): string | null => {
    const dateValue = safeTrim(date);
    if (!dateValue) {
        return null;
    }
    const timeValue = safeTrim(time) || '00:00';
    const parsed = new Date(`${dateValue} ${timeValue}`);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return parsed.toISOString();
};

export const resolveEventTimestamp = (event: StatusEventRecord): string | null => {
    return (
        safeTrim(event.applied_at) ||
        buildIsoFromDateTime(event.dateEntree, event.heureEntree) ||
        buildIsoFromDateTime(event.dateAppel, event.heureAppel) ||
        buildIsoFromDateTime(event.dateRappel, event.heureRappel) ||
        buildIsoFromDateTime(event.dateRDV, event.heureRDV) ||
        null
    );
};

export const getEventTimestampMs = (event: StatusEventRecord): number | null => {
    const iso = resolveEventTimestamp(event);
    if (!iso) return null;
    const value = new Date(iso).getTime();
    return Number.isNaN(value) ? null : value;
};

export const findEarliestEvent = (
    events: StatusEventRecord[],
    predicate: (event: StatusEventRecord) => boolean
): number | null => {
    let earliest: number | null = null;
    for (const event of events) {
        if (!predicate(event)) continue;
        const ts = getEventTimestampMs(event);
        if (ts === null) continue;
        if (earliest === null || ts < earliest) {
            earliest = ts;
        }
    }
    return earliest;
};

export const pickFirstNonEmpty = (events: StatusEventRecord[], ...keys: (keyof StatusEventRecord)[]): string => {
    for (const key of keys) {
        for (const event of events) {
            const value = safeTrim((event as any)[key]);
            if (value) {
                return value;
            }
        }
    }
    return '';
};

export const deriveHistoryType = (event: StatusEventRecord): HistoryType => {
    if (safeTrim(event.dateRDV) || safeTrim(event.heureRDV)) return 'rdv';
    if (safeTrim(event.dateRappel) || safeTrim(event.heureRappel)) return 'rappel';
    if (safeTrim(event.dateAppel) || safeTrim(event.heureAppel) || safeTrim(event.dureeAppel)) return 'appel';
    return 'statut';
};

export const buildHistoryMeta = (event: StatusEventRecord): HistoryMetaItem[] => {
    const meta: HistoryMetaItem[] = [];
    const callInfo = formatDateAndTime(event.dateAppel, event.heureAppel);
    if (callInfo || safeTrim(event.dureeAppel)) {
        const parts: string[] = [];
        if (callInfo) parts.push(callInfo);
        const duration = safeTrim(event.dureeAppel);
        if (duration) parts.push(`Durée ${duration}`);
        meta.push({ label: 'Appel', value: parts.join(' • ') || '—' });
    }
    const reminderInfo = formatDateAndTime(event.dateRappel, event.heureRappel);
    if (reminderInfo) {
        meta.push({ label: 'Rappel', value: reminderInfo });
    }
    const rdvInfo = formatDateAndTime(event.dateRDV, event.heureRDV);
    if (rdvInfo) {
        meta.push({ label: 'RDV', value: rdvInfo });
    }
    const telephone = safeTrim(event.telephone);
    if (telephone) {
        meta.push({ label: 'Téléphone', value: formatPhoneNumber(telephone) });
    }
    const email = safeTrim(event.email) || safeTrim(event.mail);
    if (email) {
        meta.push({ label: 'Email', value: email });
    }
    return meta;
};

export const buildContactHistory = (events: StatusEventRecord[]): ContactHistoryItem[] => {
    return events
        .slice()
        .sort((a, b) => {
            const aTs = resolveEventTimestamp(a);
            const bTs = resolveEventTimestamp(b);
            const aTime = aTs ? new Date(aTs).getTime() : 0;
            const bTime = bTs ? new Date(bTs).getTime() : 0;
            return bTime - aTime;
        })
        .map((event, index) => {
            const timestamp = resolveEventTimestamp(event);
            const displayDate = formatIsoDateTime(timestamp) || 'Date inconnue';
            const status = normalizeStatusLabel(event.new_status);
            const previous = event.old_status ? normalizeStatusLabel(event.old_status) : undefined;
            const notes = safeTrim(event.commentaire) || safeTrim(event.comment);
            return {
                id: event.id ?? index,
                appliedAt: timestamp,
                displayDate,
                status,
                previousStatus: previous,
                type: deriveHistoryType(event),
                meta: buildHistoryMeta(event),
                notes: notes || undefined,
            };
        });
};

export const buildDirectoryContact = (events: StatusEventRecord[]): DirectoryContact | null => {
    if (events.length === 0) {
        return null;
    }
    const sorted = events
        .slice()
        .sort((a, b) => {
            const aTime = resolveEventTimestamp(a);
            const bTime = resolveEventTimestamp(b);
            const aValue = aTime ? new Date(aTime).getTime() : 0;
            const bValue = bTime ? new Date(bTime).getTime() : 0;
            return bValue - aValue;
        });
    const latest = sorted[0];
    const prenom = safeTrim(latest.prenom);
    const nom = safeTrim(latest.nom);
    const telephone = safeTrim(latest.telephone) || pickFirstNonEmpty(sorted, 'telephone');

    // Generate stable contact ID based on phone number (normalized)
    const normalizedPhone = telephone.replace(/[\s\-\.]/g, '');
    const contactId = normalizedPhone ? `contact-phone-${normalizedPhone}` : `contact-${latest.id ?? Math.random().toString(36).slice(2)}`;
    const email = pickFirstNonEmpty(sorted, 'email', 'mail') || undefined;
    const commentaire = pickFirstNonEmpty(sorted, 'commentaire', 'comment') || undefined;
    const reminderDate = pickFirstNonEmpty(sorted, 'dateRappel') || undefined;
    const reminderTime = pickFirstNonEmpty(sorted, 'heureRappel') || undefined;
    const rdvDate = pickFirstNonEmpty(sorted, 'dateRDV') || undefined;
    const rdvTime = pickFirstNonEmpty(sorted, 'heureRDV') || undefined;
    const lastCallDate = pickFirstNonEmpty(sorted, 'dateAppel') || undefined;
    const lastCallTime = pickFirstNonEmpty(sorted, 'heureAppel') || undefined;
    const lastCallDuration = pickFirstNonEmpty(sorted, 'dureeAppel') || undefined;
    const lastUpdatedIso = resolveEventTimestamp(latest);
    const history = buildContactHistory(sorted);
    const fullName = buildFullName(prenom, nom) || telephone || 'Contact';
    const status = normalizeStatusLabel(latest.new_status);
    const previous = latest.old_status ? normalizeStatusLabel(latest.old_status) : undefined;
    const firstCallAt = findEarliestEvent(sorted, (event) =>
        Boolean(safeTrim(event.dateAppel) || safeTrim(event.heureAppel) || safeTrim(event.dureeAppel))
    );
    const firstD0R0At = findEarliestEvent(sorted, (event) => {
        const normalized = normalizeStatusLabel(event.new_status);
        const key = statusKey(normalized);
        return key === 'do' || key === 'r0';
    });

    const reminder =
        reminderDate || reminderTime
            ? { date: reminderDate, time: reminderTime, label: formatDateAndTime(reminderDate, reminderTime) || 'Non renseigné' }
            : undefined;
    const rdv =
        rdvDate || rdvTime
            ? { date: rdvDate, time: rdvTime, label: formatDateAndTime(rdvDate, rdvTime) || 'Non renseigné' }
            : undefined;
    const lastCall =
        lastCallDate || lastCallTime || lastCallDuration
            ? {
                date: lastCallDate,
                time: lastCallTime,
                duration: lastCallDuration,
                label:
                    formatDateAndTime(lastCallDate, lastCallTime) ||
                    (lastCallDuration ? `Durée ${lastCallDuration}` : 'Non renseigné'),
            }
            : undefined;

    return {
        id: contactId,
        fullName,
        prenom,
        nom,
        telephone,
        email,
        status,
        previousStatus: previous,
        commentaire,
        reminder,
        rdv,
        lastCall,
        history,
        events: sorted,
        lastUpdatedAt: lastUpdatedIso,
        lastUpdatedLabel: formatIsoDateTime(lastUpdatedIso),
        totalEvents: sorted.length,
        numeroLigne: 0,
        firstCallAt,
        firstD0R0At,
    };
};

export const transformEventsToContacts = (events: StatusEventRecord[]): DirectoryContact[] => {
    // Group by phone number to avoid duplicates
    const grouped = new Map<string, StatusEventRecord[]>();

    for (const event of events) {
        // Use phone number as the unique key instead of contact_id
        const telephone = safeTrim(event.telephone);
        if (!telephone) continue;

        // Normalize phone number (remove spaces, dashes, etc.)
        const normalizedPhone = telephone.replace(/[\s\-\.]/g, '');

        if (!grouped.has(normalizedPhone)) {
            grouped.set(normalizedPhone, []);
        }
        grouped.get(normalizedPhone)!.push(event);
    }

    return Array.from(grouped.values())
        .map((group) => buildDirectoryContact(group))
        .filter((contact): contact is DirectoryContact => contact !== null)
        .sort((a, b) => {
            const nameCompare = a.fullName.localeCompare(b.fullName, 'fr', { sensitivity: 'base' });
            if (nameCompare !== 0) return nameCompare;
            return a.telephone.localeCompare(b.telephone);
        })
        .map((contact, index) => ({ ...contact, numeroLigne: index + 1 }));
};
