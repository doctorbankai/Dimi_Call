import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Phone,
  Mail,
  Calendar,
  Clock,
  History,
  Filter,
  SortAsc,
  SortDesc,
  Bell,
  MessageSquare,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatPhoneNumber } from '../services/dataService';

type HistoryType = 'appel' | 'rappel' | 'rdv' | 'statut';

interface StatusEventRecord {
  id?: number;
  contact_id?: string | null;
  old_status?: string | null;
  new_status?: string | null;
  applied_at?: string | null;
  prenom?: string | null;
  nom?: string | null;
  telephone?: string | null;
  email?: string | null;
  mail?: string | null;
  commentaire?: string | null;
  comment?: string | null;
  dateRappel?: string | null;
  heureRappel?: string | null;
  dateRDV?: string | null;
  heureRDV?: string | null;
  dateAppel?: string | null;
  heureAppel?: string | null;
  dureeAppel?: string | null;
  dateEntree?: string | null;
  heureEntree?: string | null;
}

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

interface AnnuairePageProps {
  theme?: 'dark' | 'light';
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
  if (key === 'do') return 'DO';
  if (key === 'ro') return 'RO';
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
      const value = safeTrim((event as Record<string, unknown>)[key]);
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
  const contactId = safeTrim(latest.contact_id) || `contact-${latest.id ?? Math.random().toString(36).slice(2)}`;
  const prenom = safeTrim(latest.prenom);
  const nom = safeTrim(latest.nom);
  const telephone = safeTrim(latest.telephone) || pickFirstNonEmpty(sorted, 'telephone');
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
  const grouped = new Map<string, StatusEventRecord[]>();
  for (const event of events) {
    const contactId = safeTrim(event.contact_id);
    if (!contactId) continue;
    if (!grouped.has(contactId)) {
      grouped.set(contactId, []);
    }
    grouped.get(contactId)!.push(event);
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
const loadEventsFromSQLite = async (): Promise<StatusEventRecord[]> => {
  try {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.localdb) {
      const res = await (window as any).electronAPI.localdb.getAll();
      if (res?.success && Array.isArray(res.data)) {
        return res.data as StatusEventRecord[];
      }
      console.error('[Annuaire] Impossible de récupérer les données SQLite', res?.error);
      return [];
    }
    console.warn('[Annuaire] API localdb indisponible');
    return [];
  } catch (error) {
    console.error('[Annuaire] Erreur lors du chargement SQLite', error);
    return [];
  }
};

export function AnnuairePage({ theme = 'dark' }: AnnuairePageProps) {
  const [contacts, setContacts] = useState<DirectoryContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<DirectoryContact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<DirectoryContact | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'phone' | 'lastCall'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    let isMounted = true;

    const fetchContacts = async () => {
      setLoading(true);
      const events = await loadEventsFromSQLite();
      if (!isMounted) return;
      const contactsFromEvents = transformEventsToContacts(events);
      setContacts(contactsFromEvents);
      setFilteredContacts(contactsFromEvents);
      setLoading(false);
    };

    fetchContacts();

    const handleLocalDbUpdate = () => {
      fetchContacts();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('localdb-updated', handleLocalDbUpdate as any);
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('localdb-updated', handleLocalDbUpdate as any);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedContact) return;
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/70 px-6 py-3 backdrop-blur-sm shadow-sm">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-semibold text-foreground">Annuaire</h1>
          <p className="text-sm text-muted-foreground">
            {filteredContacts.length} contact{filteredContacts.length > 1 ? 's' : ''} unique
            {filteredContacts.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() =>
              setSortBy(sortBy === 'name' ? 'phone' : sortBy === 'phone' ? 'lastCall' : 'name')
            }
          >
            <Filter className="mr-2 h-4 w-4" />
            {sortBy === 'name' ? 'Nom' : sortBy === 'phone' ? 'Téléphone' : 'Dernier appel'}
          </Button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-auto space-y-6">

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
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
            <History className="h-8 w-8" />
            <p>Aucun contact trouvé dans la base locale.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map((contact) => (
            <Card
              key={contact.id}
              className="cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => handleContactClick(contact)}
            >
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start gap-4">
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
                        {contact.totalEvents} évènement{contact.totalEvents > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {contact.commentaire && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{contact.commentaire}</p>
                )}

                <div className="space-y-1 text-xs text-muted-foreground">
                  {contact.reminder && contact.reminder.label && (
                    <div className="flex items-center gap-1">
                      <Bell className="h-3 w-3" />
                      <span>Rappel : {contact.reminder.label}</span>
                    </div>
                  )}
                  {contact.rdv && contact.rdv.label && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>RDV : {contact.rdv.label}</span>
                    </div>
                  )}
                  {contact.lastCall && contact.lastCall.label && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>
                        Dernier appel : {contact.lastCall.label}
                        {contact.lastCall.duration ? ` (${contact.lastCall.duration})` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
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
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Informations</TabsTrigger>
                  <TabsTrigger value="history">Historique</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InfoField
                      icon={Phone}
                      label="Téléphone"
                      value={
                        selectedContact.telephone
                          ? formatPhoneNumber(selectedContact.telephone)
                          : 'Non renseigné'
                      }
                    />
                    {selectedContact.email && (
                      <InfoField icon={Mail} label="Email" value={selectedContact.email} />
                    )}
                    <div className="space-y-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Statut actuel
                      </span>
                      <Badge className={getStatusColor(selectedContact.status)}>
                        {selectedContact.status}
                      </Badge>
                    </div>
                    {selectedContact.previousStatus && (
                      <div className="space-y-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Statut précédent
                        </span>
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          {selectedContact.previousStatus}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InfoField
                      icon={Clock}
                      label="Dernière mise à jour"
                      value={selectedContact.lastUpdatedLabel || 'Non renseigné'}
                    />
                    <InfoField
                      icon={History}
                      label="Évènements enregistrés"
                      value={`${selectedContact.totalEvents}`}
                    />
                    <InfoField
                      icon={Bell}
                      label="Prochain rappel"
                      value={selectedContact.reminder?.label || 'Non renseigné'}
                    />
                    <InfoField icon={Calendar} label="RDV" value={selectedContact.rdv?.label || 'Non renseigné'} />
                    <InfoField
                      icon={Phone}
                      label="Dernier appel"
                      value={
                        selectedContact.lastCall
                          ? `${selectedContact.lastCall.label}${
                              selectedContact.lastCall.duration ? ` (${selectedContact.lastCall.duration})` : ''
                            }`
                          : 'Non renseigné'
                      }
                    />
                  </div>

                  {selectedContact.commentaire && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                          <MessageSquare className="h-4 w-4" />
                          Dernière note
                        </h3>
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                          {selectedContact.commentaire}
                        </p>
                      </div>
                    </>
                  )}
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
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
