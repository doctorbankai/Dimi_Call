import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { localDbService } from '@/services/localDbService';
import { usePagination } from '@/hooks/usePagination';
import { TablePagination } from '@/components/TablePagination';
import { Contact, ContactStatus } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as DateRangeCalendar } from '@/components/ui/calendar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Search,
  Phone,
  Mail,
  Calendar,
  Clock,
  History,
  Bell,
  MessageSquare,
  Download,
  Upload,
  Trash2,
  FileSpreadsheet,
  ArrowUpNarrowWide,
  Funnel,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { StatusEventRecord } from '@/types/statusEvent';
import { formatPhoneNumber, importContactsFromFile } from '../services/dataService';
import { ViewSwitcher, type ViewMode } from './ViewSwitcher';
import { AnnuaireTable, AnnuaireEditableField } from './AnnuaireTable';
import { AnnuaireCardsView } from './AnnuaireCardsView';
import StatusSelect from './StatusSelect';
import ImportMappingDialog from './ImportMappingDialog';
import { ContactFiles } from './contacts/ContactFiles';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

type HistoryType = 'appel' | 'rappel' | 'rdv' | 'statut';

type QuickFilterKey = 'all' | 'today' | 'thisWeek' | 'thisMonth' | 'custom';

interface HistoryMetaItem {
  label: string;
  value: string;
}

interface ContactHistoryItem {
  id: number;
  appliedAt?: string | null;
  displayDate: string;
  status: string;
  previousStatus?: string;
  type: HistoryType;
  meta: HistoryMetaItem[];
  notes?: string;
}

interface DirectoryContact {
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
}

interface ContactDetailDraft {
  status: ContactStatus;
  reminderDate: string;
  reminderTime: string;
  rdvDate: string;
  rdvTime: string;
  callDate: string;
  callTime: string;
  callDuration: string;
  commentaire: string;
}

interface AnnuairePageProps {
  theme?: 'dark' | 'light';
  onCall?: () => void;
  onSms?: () => void;
  onEmail?: () => void;
  onQualification?: () => void;
  onReminder?: () => void;
  onRDV?: () => void;
  onCalCom?: () => void;
  onLinkedIn?: () => void;
  onGoogle?: () => void;
  onDirectLink?: () => void;
  onContactSelect?: (contact: DirectoryContact | null) => void;
  focusContact?: { id?: string; name?: string } | null;
  onContactFocusConsumed?: () => void;
}

const TYPE_BADGE_LABELS: Record<HistoryType, string> = {
  appel: 'Appel',
  rappel: 'Rappel',
  rdv: 'RDV',
  statut: 'Statut',
};

const TYPE_BADGE_STYLES: Record<HistoryType, string> = {
  appel:
    'border border-green-200 bg-green-50 text-xs font-medium text-green-700 dark:border-green-900/40 dark:bg-green-900/40 dark:text-green-300',
  rappel:
    'border border-yellow-200 bg-yellow-50 text-xs font-medium text-yellow-700 dark:border-yellow-900/40 dark:bg-yellow-900/40 dark:text-yellow-300',
  rdv:
    'border border-blue-200 bg-blue-50 text-xs font-medium text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/40 dark:text-blue-300',
  statut:
    'border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 dark:border-slate-900/40 dark:bg-slate-900/40 dark:text-slate-300',
};

const TYPE_BULLET_CLASSES: Record<HistoryType, string> = {
  appel: 'bg-green-500',
  rappel: 'bg-yellow-500',
  rdv: 'bg-blue-500',
  statut: 'bg-slate-400',
};
const safeTrim = (value: unknown): string => {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).trim();
};

const statusKey = (value?: string | null): string => {
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

const normalizeStatusLabel = (status?: string | null): string => {
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
  if (key.includes('listenoi')) return 'Liste noire';
  if (key.includes('prematur')) return 'Prématuré';
  if (key === 'a0') return 'A0';
  return trimmed;
};

const getStatusColor = (status: string): string => {
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
};const resolveContactStatusValue = (value?: string | null): ContactStatus => {
  const trimmed = safeTrim(value);
  if (!trimmed) {
    return ContactStatus.NonDefini;
  }
  const normalized = trimmed.toLowerCase();
  const match = Object.values(ContactStatus).find((candidate) => candidate.toLowerCase() === normalized);
  return match ?? ContactStatus.NonDefini;
};



const buildFullName = (prenom?: string, nom?: string): string => {
  return [safeTrim(prenom), safeTrim(nom)].filter(Boolean).join(' ').trim();
};

const formatIsoDateTime = (iso?: string | null): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatDateAndTime = (date?: string | null, time?: string | null): string => {
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

const buildIsoFromDateTime = (date?: string | null, time?: string | null): string | null => {
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

const resolveEventTimestamp = (event: StatusEventRecord): string | null => {
  return (
    safeTrim(event.applied_at) ||
    buildIsoFromDateTime(event.dateEntree, event.heureEntree) ||
    buildIsoFromDateTime(event.dateAppel, event.heureAppel) ||
    buildIsoFromDateTime(event.dateRappel, event.heureRappel) ||
    buildIsoFromDateTime(event.dateRDV, event.heureRDV) ||
    null
  );
};

const pickFirstNonEmpty = (events: StatusEventRecord[], ...keys: (keyof StatusEventRecord)[]): string => {
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

const deriveHistoryType = (event: StatusEventRecord): HistoryType => {
  if (safeTrim(event.dateRDV) || safeTrim(event.heureRDV)) return 'rdv';
  if (safeTrim(event.dateRappel) || safeTrim(event.heureRappel)) return 'rappel';
  if (safeTrim(event.dateAppel) || safeTrim(event.heureAppel) || safeTrim(event.dureeAppel)) return 'appel';
  return 'statut';
};

const buildHistoryMeta = (event: StatusEventRecord): HistoryMetaItem[] => {
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

const buildContactHistory = (events: StatusEventRecord[]): ContactHistoryItem[] => {
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
const buildDirectoryContact = (events: StatusEventRecord[]): DirectoryContact | null => {
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
  };
};

const transformEventsToContacts = (events: StatusEventRecord[]): DirectoryContact[] => {
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
const loadEventsFromSQLite = async (start?: string, end?: string): Promise<StatusEventRecord[]> => {
  try {
    const normalizedStart = start?.trim() ?? ''
    const normalizedEnd = end?.trim() ?? ''
    if (normalizedStart || normalizedEnd) {
      return await localDbService.listByDateRange(normalizedStart, normalizedEnd)
    }
    return await localDbService.getAll()
  } catch (error) {
    console.error('[Annuaire] Erreur lors du chargement SQLite', error)
    return []
  }
};const EVENT_FIELD_MAP: Record<AnnuaireEditableField, keyof StatusEventRecord | 'new_status'> = {
  prenom: 'prenom',
  nom: 'nom',
  email: 'email',
  commentaire: 'commentaire',
  status: 'new_status',
  dateRappel: 'dateRappel',
  heureRappel: 'heureRappel',
  dateRDV: 'dateRDV',
  heureRDV: 'heureRDV',
  dateAppel: 'dateAppel',
  heureAppel: 'heureAppel',
  dureeAppel: 'dureeAppel',
};



export function AnnuairePage({ 
  theme = 'dark',
  onCall,
  onSms,
  onEmail,
  onQualification,
  onReminder,
  onRDV,
  onCalCom,
  onLinkedIn,
  onGoogle,
  onDirectLink,
  onContactSelect,
  focusContact,
  onContactFocusConsumed,
}: AnnuairePageProps) {
  const [contacts, setContacts] = useState<DirectoryContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<DirectoryContact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<DirectoryContact | null>(null);
  const [detailDraft, setDetailDraft] = useState<ContactDetailDraft | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'phone' | 'lastCall'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem('annuaire-view-mode');
      return saved === 'table' ? 'table' : 'cards';
    } catch {
      return 'cards';
    }
  });

  const [filterQuick, setFilterQuick] = useState<QuickFilterKey>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [mappingDialog, setMappingDialog] = useState<{
    open: boolean;
    file: File | null;
    headers: string[];
    preview: string[][];
  }>({
    open: false,
    file: null,
    headers: [],
    preview: []
  });

  const selectedContacts = useMemo(
    () => contacts.filter((contact) => selectedContactIds.has(contact.id)),
    [contacts, selectedContactIds]
  );
  const selectedCount = selectedContacts.length;
  const hasSelection = selectedCount > 0;

  const visibleContactCount = filteredContacts.length;

  const savedItemsPerPage = useMemo(() => {
    try {
      const stored = Number(localStorage.getItem('dimicall-items-per-page'));
      return Number.isFinite(stored) && stored > 0 ? stored : 50;
    } catch {
      return 50;
    }
  }, []);

  const initialPage = useMemo(() => {
    try {
      const stored = Number(localStorage.getItem('dimicall-events-current-page'));
      return Number.isFinite(stored) && stored > 0 ? stored : 1;
    } catch {
      return 1;
    }
  }, []);

  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedData: paginatedContacts,
    totalItems,
    goToPage,
    setItemsPerPage,
  } = usePagination<DirectoryContact>({
    data: filteredContacts,
    initialItemsPerPage: savedItemsPerPage,
    initialPage,
  });

  const updateContactField = useCallback(
    async (contactId: string, field: AnnuaireEditableField, value: string) => {
      const contact = contacts.find((entry) => entry.id === contactId);
      if (!contact || contact.events.length === 0) {
        console.warn('[Annuaire] updateContactField target not found', { contactId, field });
        return;
      }

      const latestEvent = contact.events[0];
      if (typeof latestEvent.id !== 'number') {
        console.warn('[Annuaire] updateContactField missing event id', { contactId, field });
        return;
      }

      const payloadKey = EVENT_FIELD_MAP[field];
      if (!payloadKey) {
        console.warn('[Annuaire] updateContactField unsupported field', field);
        return;
      }

      const updater = (window as any)?.electronAPI?.localdb?.update;
      if (typeof updater !== 'function') {
        console.error('[Annuaire] localdb.update unavailable');
        return;
      }

      try {
        await updater({ id: latestEvent.id, [payloadKey]: value });
      } catch (error) {
        console.error('[Annuaire] updateContactField failed', { field, error });
        return;
      }

      const applyUpdate = (entry: DirectoryContact): DirectoryContact => {
        if (entry.id !== contactId) {
          return entry;
        }

        const updatedEvents = entry.events.map((event, index) =>
          index === 0 ? { ...event, [payloadKey]: value } : event
        );

        const next: DirectoryContact = { ...entry, events: updatedEvents };

        switch (field) {
          case 'prenom':
            next.prenom = value;
            next.fullName = buildFullName(value, next.nom) || next.telephone || 'Contact';
            break;
          case 'nom':
            next.nom = value;
            next.fullName = buildFullName(next.prenom, value) || next.telephone || 'Contact';
            break;
          case 'email':
            next.email = value;
            break;
          case 'commentaire':
            next.commentaire = value;
            break;
          case 'status': {
            const normalized = normalizeStatusLabel(value);
            if (normalized !== next.status) {
              next.previousStatus = next.status;
              next.status = normalized;
            }
            break;
          }
          case 'dateRappel':
          case 'heureRappel': {
            const dateValue = field === 'dateRappel' ? value : next.reminder?.date ?? '';
            const timeValue = field === 'heureRappel' ? value : next.reminder?.time ?? '';
            next.reminder =
              dateValue || timeValue
                ? {
                    date: dateValue,
                    time: timeValue,
                    label: formatDateAndTime(dateValue, timeValue) || 'Non renseigné',
                  }
                : undefined;
            break;
          }
          case 'dateRDV':
          case 'heureRDV': {
            const dateValue = field === 'dateRDV' ? value : next.rdv?.date ?? '';
            const timeValue = field === 'heureRDV' ? value : next.rdv?.time ?? '';
            next.rdv =
              dateValue || timeValue
                ? {
                    date: dateValue,
                    time: timeValue,
                    label: formatDateAndTime(dateValue, timeValue) || 'Non renseigné',
                  }
                : undefined;
            break;
          }
          case 'dateAppel':
          case 'heureAppel':
          case 'dureeAppel': {
            const dateValue = field === 'dateAppel' ? value : next.lastCall?.date ?? '';
            const timeValue = field === 'heureAppel' ? value : next.lastCall?.time ?? '';
            const durationValue = field === 'dureeAppel' ? value : next.lastCall?.duration ?? '';
            next.lastCall =
              dateValue || timeValue || durationValue
                ? {
                    date: dateValue,
                    time: timeValue,
                    duration: durationValue,
                    label:
                      formatDateAndTime(dateValue, timeValue) ||
                      (durationValue ? `Durée ${durationValue}` : 'Non renseigné'),
                  }
                : undefined;
            break;
          }
          default:
            break;
        }

        return next;
      };

      setContacts((prev) => prev.map(applyUpdate));
      setFilteredContacts((prev) => prev.map(applyUpdate));
      setSelectedContact((prev) => (prev && prev.id === contactId ? applyUpdate(prev) : prev));
    },
    [contacts]
  );

  const handleStatusChange = useCallback(
    (nextStatus: ContactStatus) => {
      setDetailDraft((previous) => (previous ? { ...previous, status: nextStatus } : previous));
      if (selectedContact) {
        void updateContactField(selectedContact.id, 'status', nextStatus);
      }
    },
    [selectedContact, updateContactField]
  );

  const updateDetailDraft = useCallback((patch: Partial<ContactDetailDraft>) => {
    setDetailDraft((previous) => (previous ? { ...previous, ...patch } : previous));
  }, []);

  const persistDetailField = useCallback(
    (field: AnnuaireEditableField, value: string) => {
      if (!selectedContact) {
        return;
      }

      const currentValue = (() => {
        switch (field) {
          case 'prenom':
            return selectedContact.prenom;
          case 'nom':
            return selectedContact.nom;
          case 'email':
            return selectedContact.email ?? '';
          case 'commentaire':
            return selectedContact.commentaire ?? '';
          case 'status':
            return selectedContact.status;
          case 'dateRappel':
            return selectedContact.reminder?.date ?? '';
          case 'heureRappel':
            return selectedContact.reminder?.time ?? '';
          case 'dateRDV':
            return selectedContact.rdv?.date ?? '';
          case 'heureRDV':
            return selectedContact.rdv?.time ?? '';
          case 'dateAppel':
            return selectedContact.lastCall?.date ?? '';
          case 'heureAppel':
            return selectedContact.lastCall?.time ?? '';
          case 'dureeAppel':
            return selectedContact.lastCall?.duration ?? '';
          default:
            return '';
        }
      })();

      if (currentValue === value) {
        return;
      }

      void updateContactField(selectedContact.id, field, value);
    },
    [selectedContact, updateContactField]
  );

  // Fonction pour analyser un fichier et extraire headers/preview
  const analyzeAndOpenMappingDialog = useCallback(async (file: File) => {
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) return;

          let headers: string[] = [];
          let preview: string[][] = [];

          const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

          if (extension === '.csv' || extension === '.tsv') {
            // Parse CSV/TSV avec détection automatique du délimiteur
            const text = data as string;
            // Retirer le BOM UTF-8 si présent
            const textNoBom = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
            const lines = textNoBom.split(/\r?\n/).filter(line => line.trim());
            
            if (lines.length > 0) {
              // Détection automatique du délimiteur (priorité au point-virgule pour CSV FR)
              const firstLine = lines[0];
              let delimiter = ',';
              if (firstLine.includes(';')) {
                delimiter = ';';
              } else if (firstLine.includes('\t')) {
                delimiter = '\t';
              } else if (firstLine.includes(',')) {
                delimiter = ',';
              }
              
              // Split CSV-safe (gère les guillemets)
              function splitCSVLine(line: string, delim: string): string[] {
                const out: string[] = [];
                let cur = '';
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                  const ch = line[i];
                  if (ch === '"') {
                    if (inQuotes && line[i + 1] === '"') { 
                      cur += '"';
                      i++;
                    } else { 
                      inQuotes = !inQuotes;
                    }
                  } else if (ch === delim && !inQuotes) {
                    out.push(cur);
                    cur = '';
                  } else {
                    cur += ch;
                  }
                }
                out.push(cur);
                return out;
              }
              
              headers = splitCSVLine(lines[0], delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
              preview = lines.slice(1, 6).map(line => 
                splitCSVLine(line, delimiter).map(cell => cell.trim().replace(/^"|"$/g, ''))
              );
              
              console.log('🔍 [CSV] Délimiteur détecté:', delimiter === '\t' ? 'TAB' : delimiter, '- Colonnes:', headers.length);
            }
          } else {
            // Parse Excel
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];
            
            if (jsonData.length > 0) {
              headers = jsonData[0].map(h => String(h || '').trim());
              preview = jsonData.slice(1, 6);
            }
          }

          setMappingDialog({
            open: true,
            file,
            headers,
            preview
          });
        } catch (error) {
          console.error('Erreur lors de l\'analyse du fichier:', error);
          toast.error('Erreur d\'analyse', {
            description: 'Impossible de lire le fichier'
          });
        }
      };

      if (file.name.endsWith('.csv') || file.name.endsWith('.tsv')) {
        reader.readAsText(file, 'UTF-8'); // Encodage explicite pour Electron
      } else {
        reader.readAsBinaryString(file);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du fichier:', error);
      toast.error('Erreur', {
        description: 'Impossible d\'ouvrir le fichier'
      });
    }
  }, []);

  const fetchContactsRef = useRef<((range: { start: string; end: string }) => Promise<void>) | null>(null);

  // Gestion des événements d'import/export
  useEffect(() => {
    const handleImport = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv,.tsv,.xlsx,.xls';
      input.onchange = async (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          await analyzeAndOpenMappingDialog(files[0]);
        }
      };
      input.click();
    };

    const handleImportXlsx = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx,.xls';
      input.onchange = async (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          await analyzeAndOpenMappingDialog(files[0]);
        }
      };
      input.click();
    };

    const handleExport = async () => {
      try {
        const dataToExport = hasSelection ? selectedContacts : contacts;
        const csvContent = [
          ['Prénom', 'Nom', 'Téléphone', 'Email', 'Statut', 'Commentaire', 'Date Rappel', 'Heure Rappel', 'Date RDV', 'Heure RDV'].join(','),
          ...dataToExport.map(contact => [
            contact.prenom,
            contact.nom,
            contact.telephone,
            contact.email || '',
            contact.status,
            contact.commentaire || '',
            contact.reminder?.date || '',
            contact.reminder?.time || '',
            contact.rdv?.date || '',
            contact.rdv?.time || ''
          ].map(v => `"${v}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `annuaire_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        toast.success('Export réussi', {
          description: `${dataToExport.length} contacts exportés`
        });
      } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        toast.error('Erreur d\'export');
      }
    };

    const handleExportXlsx = async () => {
      try {
        const dataToExport = hasSelection ? selectedContacts : contacts;
        const worksheet = XLSX.utils.json_to_sheet(dataToExport.map(contact => ({
          'Prénom': contact.prenom,
          'Nom': contact.nom,
          'Téléphone': contact.telephone,
          'Email': contact.email || '',
          'Statut': contact.status,
          'Commentaire': contact.commentaire || '',
          'Date Rappel': contact.reminder?.date || '',
          'Heure Rappel': contact.reminder?.time || '',
          'Date RDV': contact.rdv?.date || '',
          'Heure RDV': contact.rdv?.time || ''
        })));
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Annuaire');
        XLSX.writeFile(workbook, `annuaire_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        toast.success('Export réussi', {
          description: `${dataToExport.length} contacts exportés`
        });
      } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        toast.error('Erreur d\'export');
      }
    };

    window.addEventListener('dimicall-db-import', handleImport);
    window.addEventListener('dimicall-db-import-xlsx', handleImportXlsx);
    window.addEventListener('dimicall-db-export', handleExport);
    window.addEventListener('dimicall-db-export-xlsx', handleExportXlsx);

    return () => {
      window.removeEventListener('dimicall-db-import', handleImport);
      window.removeEventListener('dimicall-db-import-xlsx', handleImportXlsx);
      window.removeEventListener('dimicall-db-export', handleExport);
      window.removeEventListener('dimicall-db-export-xlsx', handleExportXlsx);
    };
  }, [analyzeAndOpenMappingDialog, contacts, selectedContacts, hasSelection]);

  useEffect(() => {
    if (!selectedContact) {
      setDetailDraft(null);
      return;
    }

    setDetailDraft({
      status: resolveContactStatusValue(selectedContact.status),
      reminderDate: selectedContact.reminder?.date ?? '',
      reminderTime: selectedContact.reminder?.time ?? '',
      rdvDate: selectedContact.rdv?.date ?? '',
      rdvTime: selectedContact.rdv?.time ?? '',
      callDate: selectedContact.lastCall?.date ?? '',
      callTime: selectedContact.lastCall?.time ?? '',
      callDuration: selectedContact.lastCall?.duration ?? '',
      commentaire: selectedContact.commentaire ?? '',
    });
  }, [selectedContact]);

  const fetchContacts = useCallback(async (range: { start: string; end: string }) => {
    setLoading(true);
    try {
      const events = await loadEventsFromSQLite(range.start, range.end);
      const contactsFromEvents = transformEventsToContacts(events);
      setContacts(contactsFromEvents);
      setFilteredContacts(contactsFromEvents);
      setSelectedContactIds((prev) => {
        if (prev.size === 0) {
          return prev;
        }
        const next = new Set<string>();
        contactsFromEvents.forEach((contact) => {
          if (prev.has(contact.id)) {
            next.add(contact.id);
          }
        });
        if (next.size !== prev.size) {
          localDbService.dispatchSelectionCount(next.size);
          return next;
        }
        return prev;
      });
      
      // Créer automatiquement les dossiers pour tous les contacts
      // On le fait en arrière-plan sans bloquer l'interface
      if (contactsFromEvents.length > 0) {
        console.log(`[Annuaire] Début création automatique de ${contactsFromEvents.length} dossiers...`);
        import('@/services/fileManagerService').then(({ ensureContactFolders }) => {
          console.log('[Annuaire] Module fileManagerService chargé, appel ensureContactFolders...');
          ensureContactFolders(contactsFromEvents).then((result) => {
            console.log('[Annuaire] Résultat création dossiers:', result);
            if (result.created > 0) {
              console.log(`[Annuaire] ✅ ${result.created} dossiers créés automatiquement`);
            }
            if (result.errors > 0) {
              console.warn(`[Annuaire] ⚠️ ${result.errors} erreurs lors de la création des dossiers`);
            }
          }).catch((error) => {
            console.error('[Annuaire] ❌ Erreur lors de la création automatique des dossiers:', error);
          });
        }).catch((error) => {
          console.error('[Annuaire] ❌ Erreur lors du chargement du module fileManagerService:', error);
        });
      } else {
        console.log('[Annuaire] Aucun contact à traiter pour la création de dossiers');
      }
    } catch (error) {
      console.error('[Annuaire] Impossible de charger les contacts', error);
      setContacts([]);
      setFilteredContacts([]);
      setSelectedContactIds(() => {
        localDbService.dispatchSelectionCount(0);
        return new Set();
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Stocker fetchContacts dans une ref pour l'utiliser dans handleImportConfirm
  useEffect(() => {
    fetchContactsRef.current = fetchContacts;
  }, [fetchContacts]);

  // Callback de confirmation d'import
  const handleImportConfirm = useCallback(async (mapping: Record<string, string>, options: { phonesToRemove?: string[] }) => {
    try {
      if (!mappingDialog.file) {
        console.log('❌ [MAPPING] Aucun fichier dans le dialogue');
        return;
      }
      
      console.log('🔄 [MAPPING] Début de l\'importation avec mapping:', mapping);
      
      // Import réel des contacts via localDbService
      // import statique (déplacé en haut) pour compatibilité production
      const imported = await importContactsFromFile(mappingDialog.file, mapping, options);
      console.log(`📥 [MAPPING] ${imported.length} contacts importés (après exclusion éventuelle)`);
      
      // Recharger les contacts
      if (fetchContactsRef.current) {
        await fetchContactsRef.current(dateRange);
      }
      
      // Fermer le dialogue
      setMappingDialog({ open: false, file: null, headers: [], preview: [] });
      console.log('🔒 [MAPPING] Dialogue fermé');
      
      toast.success('Import réussi', {
        description: `${imported.length} contacts importés avec succès`
      });

    } catch (error) {
      console.error('❌ [MAPPING] Erreur lors de l\'import:', error);
      setMappingDialog(prev => ({ ...prev, open: false }));
      toast.error('Erreur d\'import', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue'
      });
    }
  }, [mappingDialog.file, dateRange]);

  const quickFilters = useMemo(() => [
    { key: 'all', label: 'Tout' as const },
    { key: 'today', label: "Aujourd'hui" as const },
    { key: 'thisWeek', label: 'Cette semaine' as const },
    { key: 'thisMonth', label: 'Ce mois' as const },
  ], []);

  const sortFieldLabel = useMemo(() => {
    switch (sortBy) {
      case 'phone':
        return 'Téléphone';
      case 'lastCall':
        return 'Dernier appel';
      default:
        return 'Nom';
    }
  }, [sortBy]);

  const handleSortOrderToggle = useCallback(() => {
    setSortOrder((previous) => (previous === 'asc' ? 'desc' : 'asc'));
  }, []);

  const handleSortFieldToggle = useCallback(() => {
    setSortBy((previous) => {
      if (previous === 'name') {
        return 'phone';
      }
      if (previous === 'phone') {
        return 'lastCall';
      }
      return 'name';
    });
  }, []);

  const rangeLabel = useMemo(() => {
    if (!dateRange.start && !dateRange.end) {
      return 'Plage';
    }
    if (dateRange.start && dateRange.start === dateRange.end) {
      return dateRange.start;
    }
    const startLabel = dateRange.start || '—';
    const endLabel = dateRange.end || '—';
    return `${startLabel} à ${endLabel}`;
  }, [dateRange]);

  const formatDateToYMD = (date?: Date | null): string => {
    if (!date) {
      return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const applyDateFilter = useCallback((range: { start: string; end: string }, key: QuickFilterKey) => {
    setFilterQuick(key);
    setDateRange(range);
    setIsDatePickerOpen(false);
  }, []);

  const handleQuickFilter = useCallback((key: QuickFilterKey) => {
    switch (key) {
      case 'all': {
        applyDateFilter({ start: '', end: '' }, 'all');
        break;
      }
      case 'today': {
        const today = new Date();
        const ymd = formatDateToYMD(today);
        applyDateFilter({ start: ymd, end: ymd }, 'today');
        break;
      }
      case 'thisWeek': {
        const today = new Date();
        const dayOfWeek = (today.getDay() + 6) % 7;
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - dayOfWeek);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        applyDateFilter({ start: formatDateToYMD(startDate), end: formatDateToYMD(endDate) }, 'thisWeek');
        break;
      }
      case 'thisMonth': {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        applyDateFilter({ start: formatDateToYMD(startDate), end: formatDateToYMD(endDate) }, 'thisMonth');
        break;
      }
      default:
        break;
    }
  }, [applyDateFilter]);

  const handleCustomRange = useCallback((range: { from?: Date; to?: Date } | undefined) => {
    if (!range) {
      return;
    }
    const start = formatDateToYMD(range.from ?? null);
    const end = formatDateToYMD(range.to ?? range.from ?? null);
    if (!start && !end) {
      return;
    }
    applyDateFilter({ start, end }, 'custom');
  }, [applyDateFilter]);

  const toggleContactSelection = useCallback((contactId: string, value: boolean | 'indeterminate') => {
    const checked = value === 'indeterminate' ? true : Boolean(value);
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(contactId);
      } else {
        next.delete(contactId);
      }
      if (next.size !== prev.size) {
        localDbService.dispatchSelectionCount(next.size);
      }
      return next;
    });
  }, []);

  const pageSelectedCount = useMemo(
    () => paginatedContacts.filter((contact) => selectedContactIds.has(contact.id)).length,
    [paginatedContacts, selectedContactIds]
  );

  const bulkSelectionState = useMemo<boolean | 'indeterminate'>(() => {
    if (paginatedContacts.length === 0 || pageSelectedCount === 0) {
      return false;
    }
    if (pageSelectedCount === paginatedContacts.length) {
      return true;
    }
    return 'indeterminate';
  }, [paginatedContacts, pageSelectedCount]);

  const handleToggleSelectAll = useCallback((value: boolean | 'indeterminate') => {
    const shouldSelectAll = value === true || value === 'indeterminate';
    setSelectedContactIds((previous) => {
      const next = new Set(previous);
      if (shouldSelectAll) {
        paginatedContacts.forEach((contact) => next.add(contact.id));
      } else {
        paginatedContacts.forEach((contact) => next.delete(contact.id));
      }
      if (next.size !== previous.size) {
        localDbService.dispatchSelectionCount(next.size);
      }
      return next;
    });
  }, [paginatedContacts]);

  const handlePageChange = useCallback(
    (page: number) => {
      const normalized = Math.max(1, Math.min(page, totalPages || 1));
      try {
        localStorage.setItem('dimicall-events-current-page', String(normalized));
      } catch {
        // Ignored
      }
      goToPage(normalized);
    },
    [goToPage, totalPages]
  );

  const handleItemsPerPageChange = useCallback(
    (pageSize: number) => {
      const normalized = pageSize > 0 ? pageSize : itemsPerPage;
      try {
        localStorage.setItem('dimicall-items-per-page', String(normalized));
      } catch {
        // Ignored
      }
      setItemsPerPage(normalized);
    },
    [itemsPerPage, setItemsPerPage]
  );

  const clearSelection = useCallback(() => {
    setSelectedContactIds(() => {
      localDbService.dispatchSelectionCount(0);
      return new Set();
    });
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    if (!hasSelection) {
      return;
    }
    const eventIds = selectedContacts.flatMap((contact) =>
      contact.events
        .map((event) => event.id)
        .filter((id): id is number => typeof id === 'number')
    );
    if (eventIds.length === 0) {
      clearSelection();
      return;
    }
    await localDbService.deleteByIds(eventIds);
    clearSelection();
    await fetchContacts(dateRange);
  }, [clearSelection, dateRange, fetchContacts, hasSelection, selectedContacts]);

  const handleResetAllContacts = useCallback(async () => {
    try {
      // Récupérer tous les événements
      const allEvents = await localDbService.getAll();
      const allEventIds = allEvents
        .map((event) => event.id)
        .filter((id): id is number => typeof id === 'number');
      
      if (allEventIds.length === 0) {
        toast.info('Aucun contact à supprimer');
        return;
      }

      // Supprimer tous les événements
      await localDbService.deleteByIds(allEventIds);
      
      // Réinitialiser l'état
      clearSelection();
      setContacts([]);
      setFilteredContacts([]);
      
      // Recharger les données
      await fetchContacts(dateRange);
      
      toast.success('Base de données réinitialisée', {
        description: `${allEventIds.length} contact${allEventIds.length > 1 ? 's' : ''} supprimé${allEventIds.length > 1 ? 's' : ''}`
      });
    } catch (error) {
      console.error('[Annuaire] Erreur lors de la réinitialisation', error);
      toast.error('Erreur', {
        description: 'Impossible de réinitialiser la base de données'
      });
    }
  }, [clearSelection, dateRange, fetchContacts]);

  const handleTransferSelected = useCallback(() => {
    if (!hasSelection) {
      return;
    }
    const payload: Contact[] = selectedContacts.map((contact, index) => {
      const statusValue = contact.status;
      const status = (Object.values(ContactStatus) as string[]).includes(statusValue)
        ? (statusValue as ContactStatus)
        : ContactStatus.NonDefini;
      const numeroLigne = contact.numeroLigne || index + 1;
      return {
        id: contact.id || `annuaire-${numeroLigne}`,
        numeroLigne,
        prenom: contact.prenom,
        nom: contact.nom,
        telephone: contact.telephone,
        email: contact.email || '',
        source: 'Données',
        statut: status,
        commentaire: contact.commentaire || '',
        dateRappel: contact.reminder?.date || '',
        heureRappel: contact.reminder?.time || '',
        dateRDV: contact.rdv?.date || '',
        heureRDV: contact.rdv?.time || '',
        dateAppel: contact.lastCall?.date || '',
        heureAppel: contact.lastCall?.time || '',
        dureeAppel: contact.lastCall?.duration || '',
        lien: '',
      };
    });
    const name = `Selection Annuaire (${new Date().toLocaleString('fr-FR')})`;
    try {
      localStorage.setItem('dimicall-db-transfer-data', JSON.stringify({ contacts: payload, name }));
    } catch {
      // Ignored
    }
    window.dispatchEvent(
      new CustomEvent('dimicall-db-transferred', {
        detail: { contacts: payload, name },
      })
    );
    clearSelection();
  }, [clearSelection, hasSelection, selectedContacts]);

  const handleExportCsv = useCallback(async () => {
    await localDbService.exportCsv();
  }, []);

  const handleExportXlsx = useCallback(async () => {
    await localDbService.exportXlsx();
  }, []);

  const handleImportCsv = useCallback(async () => {
    const success = await localDbService.importCsv();
    if (success) {
      await fetchContacts(dateRange);
    }
  }, [dateRange, fetchContacts]);

  const handleImportXlsx = useCallback(async () => {
    const success = await localDbService.importXlsx();
    if (success) {
      await fetchContacts(dateRange);
    }
  }, [dateRange, fetchContacts]);

  const handleRefresh = useCallback(async () => {
    await fetchContacts(dateRange);
  }, [dateRange, fetchContacts]);

  const handleViewChange = useCallback((newView: ViewMode) => {
    setViewMode(newView);
    try {
      localStorage.setItem('annuaire-view-mode', newView);
    } catch (error) {
      console.warn('[Annuaire] Impossible de sauvegarder la préférence de vue', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleDeleteEvent: EventListener = () => {
      void handleDeleteSelected();
    };
    const handleExportCsvEvent: EventListener = () => {
      void handleExportCsv();
    };
    const handleExportXlsxEvent: EventListener = () => {
      void handleExportXlsx();
    };
    const handleImportCsvEvent: EventListener = () => {
      void handleImportCsv();
    };
    const handleImportXlsxEvent: EventListener = () => {
      void handleImportXlsx();
    };
    const handleRefreshEvent: EventListener = () => {
      void handleRefresh();
    };
    const handleTransferEvent: EventListener = () => {
      handleTransferSelected();
    };

    const listeners: Array<[string, EventListener]> = [
      ['dimicall-db-delete', handleDeleteEvent],
      ['dimicall-db-export', handleExportCsvEvent],
      ['dimicall-db-export-xlsx', handleExportXlsxEvent],
      ['dimicall-db-import', handleImportCsvEvent],
      ['dimicall-db-import-xlsx', handleImportXlsxEvent],
      ['dimicall-db-refresh', handleRefreshEvent],
      ['dimicall-db-transfer', handleTransferEvent],
    ];

    listeners.forEach(([eventName, listener]) => {
      window.addEventListener(eventName, listener);
    });

    return () => {
      listeners.forEach(([eventName, listener]) => {
        window.removeEventListener(eventName, listener);
      });
    };
  }, [
    handleDeleteSelected,
    handleExportCsv,
    handleExportXlsx,
    handleImportCsv,
    handleImportXlsx,
    handleRefresh,
    handleTransferSelected,
  ]);

  const dispatchLocalDbEvent = useCallback((eventName: string) => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.dispatchEvent(new CustomEvent(eventName));
    } catch (error) {
      console.warn('[Annuaire] dispatchLocalDbEvent failed', { eventName, error });
    }
  }, []);

  useEffect(() => {
    fetchContacts(dateRange);
  }, [fetchContacts, dateRange]);

  useEffect(() => {
    const handleLocalDbUpdate = () => {
      fetchContacts(dateRange);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('localdb-updated', handleLocalDbUpdate as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('localdb-updated', handleLocalDbUpdate as EventListener);
      }
    };
  }, [fetchContacts, dateRange]);

  useEffect(() => {
    const handleExternalFilter = (event: CustomEvent<{ scope?: string; start?: string; end?: string }>) => {
      const detail = event.detail || {};
      if (detail.scope === 'db') {
        const startValue = typeof detail.start === 'string' ? detail.start : '';
        const endValue = typeof detail.end === 'string' ? detail.end : '';
        const isEmpty = !startValue && !endValue;
        applyDateFilter({ start: startValue, end: endValue }, isEmpty ? 'all' : 'custom');
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('dimicall-date-filter', handleExternalFilter as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('dimicall-date-filter', handleExternalFilter as EventListener);
      }
    };
  }, [applyDateFilter]);

  useEffect(() => {
    if (!selectedContact) {
      return;
    }

    const refreshed = contacts.find((contact) => contact.id === selectedContact.id);
    if (refreshed && refreshed !== selectedContact) {
      setSelectedContact(refreshed);
    }
  }, [contacts, selectedContact]);

  useEffect(() => {
    const lowerTerm = searchTerm.trim().toLowerCase();

    const filtered = contacts.filter((contact) => {
      if (!lowerTerm) return true;
      const haystacks = [
        contact.fullName.toLowerCase(),
        contact.telephone.toLowerCase(),
        contact.telephone.replace(/\D/g, ''),
        contact.email?.toLowerCase() ?? '',
        contact.status.toLowerCase(),
        contact.commentaire?.toLowerCase() ?? '',
      ];
      return haystacks.some((value) => value.includes(lowerTerm));
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'phone') {
        const compare = a.telephone.localeCompare(b.telephone);
        return sortOrder === 'asc' ? compare : -compare;
      }
      if (sortBy === 'lastCall') {
        const aDate = a.history[0]?.appliedAt ? new Date(a.history[0].appliedAt).getTime() : 0;
        const bDate = b.history[0]?.appliedAt ? new Date(b.history[0].appliedAt).getTime() : 0;
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      }
      const compare = a.fullName.localeCompare(b.fullName, 'fr', { sensitivity: 'base' });
      return sortOrder === 'asc' ? compare : -compare;
    });

    setFilteredContacts(sorted);
  }, [contacts, searchTerm, sortBy, sortOrder]);


  const handleContactClick = (contact: DirectoryContact) => {
    setSelectedContact(contact);
    setIsContactDialogOpen(true);
  };

  useEffect(() => {
    if (!focusContact || loading) return;
    const normalizedName = focusContact.name?.trim().toLowerCase();
    const target =
      contacts.find((c) => focusContact.id && c.id === focusContact.id) ||
      (normalizedName ? contacts.find((c) => c.fullName.toLowerCase().includes(normalizedName)) : undefined);
    if (target) {
      setSelectedContact(target);
      setIsContactDialogOpen(true);
      setSearchTerm((prev) => (normalizedName ? focusContact.name ?? prev : prev));
      onContactSelect?.(target);
    }
    onContactFocusConsumed?.();
  }, [focusContact, loading, contacts, onContactSelect, onContactFocusConsumed]);

  const getInitials = (contact: DirectoryContact) => {
    const tokens = contact.fullName.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return '??';
    if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
    return `${tokens[0][0]}${tokens[tokens.length - 1][0]}`.toUpperCase();
  };

  const InfoField = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: LucideIcon;
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 text-sm text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="truncate">{value || '—'}</span>
      </div>
    </div>
  );
  return (
    <div className="flex h-full flex-col gap-4 w-full overflow-hidden">
      {/* Navbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-semibold text-foreground">Annuaire</h1>
            <p className="text-sm text-muted-foreground">
              {visibleContactCount} contact{visibleContactCount > 1 ? 's' : ''} unique
              {visibleContactCount > 1 ? 's' : ''}
              {hasSelection && (
                <span className="ml-2 text-xs font-medium text-primary">
                  {selectedCount} selectionne{selectedCount > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          <ViewSwitcher currentView={viewMode} onViewChange={handleViewChange} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={handleSortOrderToggle}
            title={sortOrder === 'asc' ? 'Tri croissant' : 'Tri décroissant'}
          >
            <ArrowUpNarrowWide className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={handleSortFieldToggle}>
            <Funnel className="mr-2 h-4 w-4" />
            {sortFieldLabel}
          </Button>
        </div>
      </div>

      {/* Filters & actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2">
            {quickFilters.map(({ key, label }) => (
              <Button
                key={key}
                size="sm"
                variant={filterQuick === key ? 'default' : 'outline'}
                className="h-8"
                onClick={() => handleQuickFilter(key as QuickFilterKey)}
              >
                {label}
              </Button>
            ))}
          </div>
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Calendar className="h-4 w-4 mr-2" />
                {rangeLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-2" align="start">
              <DateRangeCalendar
                mode="range"
                selected={{
                  from: dateRange.start ? new Date(dateRange.start) : undefined,
                  to: dateRange.end ? new Date(dateRange.end) : undefined,
                }}
                onSelect={handleCustomRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => dispatchLocalDbEvent('dimicall-db-import')}
            title="Importer un fichier CSV/Excel"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                size="sm" 
                disabled={contacts.length === 0}
                className="h-9"
                title="Exporter les données"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 border shadow-lg bg-popover text-popover-foreground z-50">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Options d'export
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => dispatchLocalDbEvent('dimicall-db-export')}>
                CSV
                {contacts.length > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">({contacts.length})</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => dispatchLocalDbEvent('dimicall-db-export-xlsx')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel (.xlsx)
                {contacts.length > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">({contacts.length})</span>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                title="Supprimer la sélection"
                disabled={!hasSelection}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer {selectedCount} contact{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''} ? Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => dispatchLocalDbEvent('dimicall-db-delete')}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="h-9"
                title="Réinitialiser toute la base de données"
                disabled={contacts.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Réinitialiser tout
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive">⚠️ Attention : Réinitialisation totale</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p className="font-semibold">Vous êtes sur le point de supprimer TOUS les contacts de l'annuaire ({contacts.length} contact{contacts.length > 1 ? 's' : ''}).</p>
                  <p>Cette action est <span className="font-bold text-destructive">IRRÉVERSIBLE</span> et supprimera définitivement :</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Tous les contacts</li>
                    <li>Tout l'historique des appels</li>
                    <li>Tous les rappels et rendez-vous</li>
                    <li>Tous les commentaires</li>
                  </ul>
                  <p className="font-semibold mt-4">Êtes-vous absolument certain de vouloir continuer ?</p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleResetAllContacts}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Oui, tout supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'table' ? (
          <div className="animate-in fade-in duration-200 space-y-4 h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              <AnnuaireTable
                contacts={paginatedContacts}
                selectedIds={selectedContactIds}
                onToggleSelection={toggleContactSelection}
                onToggleSelectAll={handleToggleSelectAll}
                onContactClick={handleContactClick}
                loading={loading}
                theme={theme}
                onUpdateField={updateContactField}
              />
            </div>
            <div className="mt-2 border-t border-border/60 pt-2">
              <TablePagination
                className="w-full"
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                pageSizeOptions={[25, 50, 100]}
              />
            </div>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="animate-in fade-in duration-200 h-full">
            <AnnuaireCardsView
              contacts={filteredContacts}
              selectedContactId={selectedContact?.id || null}
              onSelectContact={(contact) => {
                setSelectedContact(contact)
                onContactSelect?.(contact)
              }}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onCall={selectedContact && onCall ? onCall : undefined}
              onSms={selectedContact && onSms ? onSms : undefined}
              onEmail={selectedContact && onEmail ? onEmail : undefined}
              onQualification={selectedContact && onQualification ? onQualification : undefined}
              onReminder={selectedContact && onReminder ? onReminder : undefined}
              onRDV={selectedContact && onRDV ? onRDV : undefined}
              onCalCom={selectedContact && onCalCom ? onCalCom : undefined}
              onLinkedIn={selectedContact && onLinkedIn ? onLinkedIn : undefined}
              onGoogle={selectedContact && onGoogle ? onGoogle : undefined}
              onDirectLink={selectedContact && onDirectLink ? onDirectLink : undefined}
            />
          </div>
        ) : (
          <div className="animate-in fade-in duration-200">
            {loading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="border-dashed">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </CardContent>
              </Card>
            ))}
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground border rounded-lg">
                  <History className="h-8 w-8" />
                  <p>Aucun contact trouvé dans la base locale.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map((contact) => {
            const isSelected = selectedContactIds.has(contact.id);
            return (
              <Card
                key={contact.id}
                className={`cursor-pointer transition-colors hover:bg-muted/40 ${isSelected ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}
                onClick={() => handleContactClick(contact)}
              >
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-start gap-4">
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(value) => toggleContactSelection(contact.id, value)}
                        className="mt-1"
                      />
                    </div>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="" alt={contact.fullName} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(contact)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-semibold">{contact.fullName}</h3>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {contact.telephone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span className="truncate">{formatPhoneNumber(contact.telephone)}</span>
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge className={getStatusColor(contact.status)}>{contact.status}</Badge>
                        {contact.lastUpdatedLabel && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {contact.lastUpdatedLabel}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <History className="h-3 w-3" />
                          {contact.totalEvents} événement{contact.totalEvents > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {contact.commentaire && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{contact.commentaire}</p>
                  )}

                  <div className="space-y-1 text-xs text-muted-foreground">
                    {contact.reminder?.label && (
                      <div className="flex items-center gap-1">
                        <Bell className="h-3 w-3" />
                        <span>Rappel : {contact.reminder.label}</span>
                      </div>
                    )}
                    {contact.rdv?.label && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>RDV : {contact.rdv.label}</span>
                      </div>
                    )}
                    {contact.lastCall?.label && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>Dernier appel : {contact.lastCall.label}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
              </div>
            )}
          </div>
        )}

        <Dialog
        open={isContactDialogOpen}
        onOpenChange={(open) => {
          setIsContactDialogOpen(open);
          if (!open) {
            setSelectedContact(null);
          }
        }}
      >
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden">
          {selectedContact && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt={selectedContact.fullName} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(selectedContact)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold">{selectedContact.fullName}</h2>
                    {selectedContact.telephone && (
                      <p className="text-sm text-muted-foreground">
                        {formatPhoneNumber(selectedContact.telephone)}
                      </p>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informations</TabsTrigger>
                  <TabsTrigger value="history">Historique</TabsTrigger>
                  <TabsTrigger value="files">Fichiers</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InfoField
                      icon={Phone}
                      label="T?l?phone"
                      value={
                        selectedContact.telephone
                          ? formatPhoneNumber(selectedContact.telephone)
                          : 'Non renseigné'
                      }
                    />
                    <InfoField icon={Mail} label="Email" value={selectedContact.email || 'Non renseigné'} />
                    <div className="space-y-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Statut actuel
                      </span>
                      <StatusSelect
                        value={detailDraft?.status ?? resolveContactStatusValue(selectedContact.status)}
                        onChange={handleStatusChange}
                        size="sm"
                        triggerClassName="w-full md:w-[200px]"
                      />
                    </div>
                    {selectedContact.previousStatus && (
                      <div className="space-y-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Statut pr?c?dent
                        </span>
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          {selectedContact.previousStatus}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InfoField
                      icon={Clock}
                      label="Dernière mise à jour"
                      value={selectedContact.lastUpdatedLabel || 'Non renseigné'}
                    />
                    <InfoField
                      icon={History}
                      label="?v?nements enregistr?s"
                      value={selectedContact.totalEvents}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Prochain rappel
                      </span>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                          type="date"
                          value={detailDraft?.reminderDate ?? ''}
                          onChange={(event) => updateDetailDraft({ reminderDate: event.target.value })}
                          onBlur={(event) => detailDraft && persistDetailField('dateRappel', event.currentTarget.value)}
                          disabled={!detailDraft}
                        />
                        <Input
                          type="time"
                          value={detailDraft?.reminderTime ?? ''}
                          onChange={(event) => updateDetailDraft({ reminderTime: event.target.value })}
                          onBlur={(event) => detailDraft && persistDetailField('heureRappel', event.currentTarget.value)}
                          disabled={!detailDraft}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        RDV
                      </span>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                          type="date"
                          value={detailDraft?.rdvDate ?? ''}
                          onChange={(event) => updateDetailDraft({ rdvDate: event.target.value })}
                          onBlur={(event) => detailDraft && persistDetailField('dateRDV', event.currentTarget.value)}
                          disabled={!detailDraft}
                        />
                        <Input
                          type="time"
                          value={detailDraft?.rdvTime ?? ''}
                          onChange={(event) => updateDetailDraft({ rdvTime: event.target.value })}
                          onBlur={(event) => detailDraft && persistDetailField('heureRDV', event.currentTarget.value)}
                          disabled={!detailDraft}
                        />
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Dernier appel
                      </span>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-1">
                          <Input
                            type="date"
                            value={detailDraft?.callDate ?? ''}
                            onChange={(event) => updateDetailDraft({ callDate: event.target.value })}
                            onBlur={(event) => detailDraft && persistDetailField('dateAppel', event.currentTarget.value)}
                            disabled={!detailDraft}
                          />
                          <Input
                            type="time"
                            value={detailDraft?.callTime ?? ''}
                            onChange={(event) => updateDetailDraft({ callTime: event.target.value })}
                            onBlur={(event) => detailDraft && persistDetailField('heureAppel', event.currentTarget.value)}
                            disabled={!detailDraft}
                          />
                        </div>
                        <Input
                          value={detailDraft?.callDuration ?? ''}
                          onChange={(event) => updateDetailDraft({ callDuration: event.target.value })}
                          onBlur={(event) => detailDraft && persistDetailField('dureeAppel', event.currentTarget.value)}
                          placeholder="Dur?e (mm:ss)"
                          disabled={!detailDraft}
                          className="w-full sm:w-[180px]"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <MessageSquare className="h-4 w-4" />
                      Notes
                    </h3>
                    <Textarea
                      value={detailDraft?.commentaire ?? ''}
                      onChange={(event) => updateDetailDraft({ commentaire: event.target.value })}
                      onBlur={(event) => detailDraft && persistDetailField('commentaire', event.currentTarget.value)}
                      placeholder="Ajouter une note?"
                      rows={4}
                      disabled={!detailDraft}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <ScrollArea className="h-72 pr-4">
                    {selectedContact.history.length > 0 ? (
                      <div className="space-y-6">
                        {selectedContact.history.map((entry, index) => (
                          <div key={`${entry.id}-${index}`} className="relative pl-6">
                            <div className="absolute left-0 top-6 flex flex-col items-center">
                              <span
                                className={`h-2.5 w-2.5 rounded-full border border-background ${TYPE_BULLET_CLASSES[entry.type]}`}
                              />
                              {index < selectedContact.history.length - 1 && (
                                <span className="mt-1 w-px flex-1 bg-border" />
                              )}
                            </div>
                            <div className="space-y-3 rounded-lg border bg-card/40 p-4 shadow-sm">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={TYPE_BADGE_STYLES[entry.type]}>
                                    {TYPE_BADGE_LABELS[entry.type]}
                                  </Badge>
                                  <span className="text-sm font-medium text-foreground">{entry.displayDate}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  {entry.previousStatus && (
                                    <Badge variant="outline" className="text-xs text-muted-foreground">
                                      {entry.previousStatus}
                                    </Badge>
                                  )}
                                  <Badge className={getStatusColor(entry.status)}>{entry.status}</Badge>
                                </div>
                              </div>

                              {entry.meta.length > 0 && (
                                <div className="grid gap-1 text-xs text-muted-foreground">
                                  {entry.meta.map((metaItem, metaIndex) => (
                                    <div key={metaIndex} className="flex flex-wrap items-baseline gap-2">
                                      <span className="font-medium text-foreground">{metaItem.label}</span>
                                      <span className="flex-1">{metaItem.value}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {entry.notes && (
                                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                  <span className="flex-1 whitespace-pre-wrap">{entry.notes}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-60 flex-col items-center justify-center text-muted-foreground">
                        <History className="mb-2 h-8 w-8" />
                        <p>Aucun historique disponible pour ce contact.</p>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="files" className="space-y-4">
                  <ScrollArea className="h-72 pr-4">
                    <ContactFiles 
                      contactId={selectedContact.id}
                      contact={{
                        prenom: selectedContact.prenom,
                        nom: selectedContact.nom,
                        telephone: selectedContact.telephone
                      }}
                    />
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
        </Dialog>

        {/* Dialogue de mapping des colonnes */}
        <ImportMappingDialog
          isOpen={mappingDialog.open}
          onClose={() => {
            setMappingDialog({ open: false, file: null, headers: [], preview: [] });
          }}
          fileName={mappingDialog.file?.name}
          detectedHeaders={mappingDialog.headers}
          previewRows={mappingDialog.preview}
          expectedTargets={[
            { label: 'Prénom', value: 'prenom' },
            { label: 'Nom', value: 'nom' },
            { label: 'Téléphone', value: 'telephone' },
            { label: 'Mail', value: 'email' },
            { label: 'Source', value: 'source' },
            { label: 'Type', value: 'type' },
            { label: 'Qualité', value: 'qualite' },
            { label: 'Lien', value: 'lien' },
            { label: 'Date Rappel', value: 'dateRappel' },
            { label: 'Heure Rappel', value: 'heureRappel' },
            { label: 'Date Appel', value: 'dateAppel' },
            { label: 'Heure Appel', value: 'heureAppel' },
            { label: 'Statut', value: 'statut' },
            { label: 'Commentaire', value: 'commentaire' },
            { label: 'Date RDV', value: 'dateRDV' },
            { label: 'Heure RDV', value: 'heureRDV' },
            { label: 'Durée Appel', value: 'dureeAppel' },
            { label: 'Sexe', value: 'sexe' },
            { label: 'Don', value: 'don' },
            { label: 'Date', value: 'date' },
            { label: 'UID', value: 'uid' },
          ]}
          requiredTargets={['telephone']}
          onConfirm={handleImportConfirm}
        />
      </div>
    </div>
  );
}


