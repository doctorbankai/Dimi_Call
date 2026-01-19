import './index.css';
import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import type { DateRange } from 'react-day-picker';
import { Theme, Contact, CallState, CallStates, ContactStatus, Civility, EmailType, CallMode, SmsType } from './types';
import { useCallMode } from './context/ModeContext';
import { APP_NAME, COLUMN_HEADERS, CONTACT_DATA_KEYS, headerIcons } from './constants';
import { ContactTable, ContactTableRef } from './components/ContactTable';
import { PaginatedContactTable } from './components/PaginatedContactTable';
import { AppelsCardsView } from './components/AppelsCardsView';
import { EmailDialog, RappelDialog, RendezVousDialog, QualificationDialog, GenericInfoDialog } from './components/Dialogs';
import { SmsDialogImproved as SmsDialog } from './components/SmsDialogImproved';
import Calendar2 from './pages/Calendar2';


import { TitleBar } from './components/TitleBar';
import { MainHeader } from './components/MainHeader';
import { AppSidebar } from '@/components/AppSidebar';
import HelpDialog from './components/HelpDialog';
import { TicketForm } from './components/TicketForm';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UpdateConfirmationDialog } from './components/UpdateConfirmationDialog';
import { HelpCategory, HelpSection } from './types/help';
import packageJson from '../package.json';
import {
  loadContacts,
  saveContacts,
  importContactsFromFile,
  exportContactsToFile,
  loadCallStates,
  saveCallStates,
  saveImportedTable,
  loadImportedTable,
  clearImportedTable,
  hasImportedTable,
  getImportedTableMetadata,
  formatPhoneNumber,
  generateGmailComposeUrl,
  generateSmsMessage,
  exportGoogleContactsCSV,
  exportGoogleCalendarCSV,
  reorderContactsColumns
} from './services/dataService';
import { localDbService } from './services/localDbService';

import { useAdb } from './hooks/useAdb';
import { useAutoUpdate } from './hooks/useAutoUpdate';
import { DevToolsService } from './services/devToolsService';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn, searchLinkedIn, searchGoogle, openDirectLink } from './lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as UiCalendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import {
  Phone, Mail, MessageSquare, Bell, Calendar, CalendarSearch, FileCheck, Linkedin, Globe, ExternalLink,
  Download, Keyboard, RefreshCw, Sun, Moon, Columns, X, Filter, Infinity, Search, Zap, EyeOff,
  Upload, Smartphone, Wifi, WifiOff, Loader2, FileSpreadsheet, Settings2, Eye, Trash2, Users, Timer, BarChart3, Database, Table2,
  ChevronLeft, ChevronRight, ChevronDown, Plus, Edit, RotateCcw, Pencil, Palette, Check
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// Sonner (toast moderne shadcn)
import { Toaster, toast } from 'sonner'
import { DropZoneOverlay } from './components/Common';
import { CalendarModal } from './components/CalendarModal';
import { LoginPage } from './pages/LoginPage';
import { SupabaseDisconnectDialog } from '@/components/SupabaseDisconnectDialog';
import { UserProfileCard } from './components/UserProfileCard';
import { useSupabaseAuth } from './lib/auth-client';
import CallControl from './components/CallControl';

import { ShortcutConfigDialog } from './components/ShortcutConfigDialog';
import { ShortcutIndicator } from './components/ShortcutIndicator';
import { shortcutService } from './services/shortcutService';
import { SettingsDialog, getSavedColumnConfig } from './components/SettingsDialog';
import { ChartDashboard } from './components/ChartDashboard';
import { TabEditDialog } from './components/TabEditDialog';
import LocalDBViewer from './components/LocalDBViewer';
import PaginatedEventTable from './components/PaginatedEventTable';
import { FullPageCalendar } from './components/FullPageCalendar';
import { AnnuairePage } from './components/AnnuairePage';
import { FilesPage } from './pages/FilesPage';
import { PreQualificationPage } from './features/prequalification/PreQualificationPage';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';

// Cl de stockage pour la visibilit des colonnes
const VISIBLE_COLUMNS_STORAGE_KEY = 'dimicall-visible-columns';

// Type pour les onglets de table
export type TableTab = {
  id: string
  name: string
  color?: string
  contacts: Contact[]
}

type QuickRangeKey =
  | 'all'
  | 'today'
  | 'last7'
  | 'last30'
  | 'thisWeek'
  | 'thisMonth'
  | 'custom'


// Composant DonutChart moderne
const DonutChart: React.FC<{ progress: number; size?: number }> = ({ progress, size = 32 }) => {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          className="text-muted-foreground/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-primary transition-all duration-300 ease-in-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-medium text-muted-foreground">
          {progress}%
        </span>
      </div>
    </div>
  );
};

type LocalStatusEventOverrides = Partial<Contact>;

interface BuildLocalStatusEventOptions {
  oldStatus?: string | null;
  newStatus?: string | null;
  overrides?: LocalStatusEventOverrides;
}

const buildLocalStatusEventPayload = (contact: Contact, options: BuildLocalStatusEventOptions = {}) => {
  const overrides = options.overrides ?? {};
  const hasOverride = (key: keyof Contact) => Object.prototype.hasOwnProperty.call(overrides, key);
  const resolveField = <K extends keyof Contact>(key: K): Contact[K] | null => {
    if (hasOverride(key)) {
      const value = overrides[key];
      return (value ?? null) as Contact[K] | null;
    }
    const original = contact[key];
    return (original ?? null) as Contact[K] | null;
  };
  const numeroLigneValue = resolveField('numeroLigne');
  const snapshotStatut = options.newStatus ?? (resolveField('statut') as string | null) ?? null;

  return {
    contactId: contact.id,
    oldStatus: options.oldStatus ?? null,
    newStatus: snapshotStatut,
    prenom: resolveField('prenom') ?? null,
    nom: resolveField('nom') ?? null,
    telephone: resolveField('telephone') ?? null,
    email: resolveField('email') ?? null,
    commentaire: resolveField('commentaire') ?? null,
    dateRappel: resolveField('dateRappel') ?? null,
    heureRappel: resolveField('heureRappel') ?? null,
    dateRDV: resolveField('dateRDV') ?? null,
    heureRDV: resolveField('heureRDV') ?? null,
    dateAppel: resolveField('dateAppel') ?? null,
    heureAppel: resolveField('heureAppel') ?? null,
    dureeAppel: resolveField('dureeAppel') ?? null,
    numeroLigne: typeof numeroLigneValue === 'number' && Number.isFinite(numeroLigneValue) ? numeroLigneValue : null,
    source: resolveField('source') ?? null,
    statut: snapshotStatut,
    lien: resolveField('lien') ?? null,
    sexe: resolveField('sexe') ?? null,
    don: resolveField('don') ?? null,
    qualite: resolveField('qualite') ?? null,
    type: resolveField('type') ?? null,
    date: resolveField('date') ?? null,
    uid: resolveField('uid') ?? null,
    uid_supabase: resolveField('uid_supabase') ?? null,
    utilisateur: resolveField('utilisateur') ?? null,
    actions: resolveField('actions') ?? null,
    statutAppel: resolveField('statutAppel') ?? null,
    statutRDV: resolveField('statutRDV') ?? null,
    commentaireRDV: resolveField('commentaireRDV') ?? null,
  };
};

const formatDurationLabel = (durationMs: number): string => {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const contactsEqualById = (a: Contact[], b: Contact[]) => {
  if (a.length !== b.length) return false;
  const ids = new Set(a.map(contact => contact.id));
  return b.every(contact => ids.has(contact.id));
};


type ViewMode = 'table' | 'appels-cards' | 'graph' | 'db' | 'calendar-2' | 'annuaire' | 'files' | 'prequalification';

const App: React.FC = ({ appKey }: { appKey?: number } = {}) => {
  const { mode } = useCallMode();
  // Authentication hook
  const auth = useSupabaseAuth();
  const userDisplayName = useMemo(() => {
    const metadata = auth.user?.user_metadata as Record<string, unknown> | undefined;
    const fullName = typeof metadata?.full_name === 'string' ? metadata.full_name : undefined;
    const shortName = typeof metadata?.name === 'string' ? metadata.name : undefined;
    return (fullName && fullName.trim()) || (shortName && shortName.trim()) || auth.user?.email || 'Utilisateur DimiCall';
  }, [auth.user]);

  // Auto-update hook
  const { updateState, installUpdate, isUpdateEnabled, betaPreferences } = useAutoUpdate();



  // Authentication states - removed isAuthModalOpen (now using full page)

  // State declarations
  const readSystemTheme = () => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return Theme.Light;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.Dark : Theme.Light;
  };

  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('dimicall-theme') as Theme | null;
      if (saved === Theme.Light || saved === Theme.Dark || saved === Theme.System) {
        return saved;
      }
    } catch {
      // Ignore storage errors and fall back to system
    }
    return Theme.System;
  });
  const [systemTheme, setSystemTheme] = useState<Theme>(readSystemTheme);
  useEffect(() => {
    try {
      localStorage.setItem('dimicall-theme', theme);
    } catch {
      // Ignore storage write issues (private mode, etc.)
    }
  }, [theme]);

  const resolveThemeValue = useCallback(
    (value: Theme) => (value === Theme.System ? systemTheme : value),
    [systemTheme]
  );
  const resolvedTheme = resolveThemeValue(theme);
  const handleToggleTheme = useCallback(
    () => setTheme((current) => (resolveThemeValue(current) === Theme.Dark ? Theme.Light : Theme.Dark)),
    [resolveThemeValue]
  );
  const [activeMenuTab, setActiveMenuTab] = useState<'dimicall'>('dimicall');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [callStates, setCallStates] = useState<CallStates>({});
  const [searchTerm, setSearchTerm] = useState(() => {
    try {
      return localStorage.getItem('dimicall-search-term') || '';
    } catch {
      return '';
    }
  });
  const [searchColumn, setSearchColumn] = useState<keyof Contact | 'all'>(() => {
    try {
      const saved = localStorage.getItem('dimicall-search-column');
      return (saved && saved !== 'null') ? (saved as keyof Contact | 'all') : 'all';
    } catch {
      return 'all';
    }
  });
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [tableUpdateKey] = useState(0);
  const [appUpdateKey] = useState(0);

  // Exposer la cl de mise à jour pour les composants parents
  React.useEffect(() => {
    (window as any).appUpdateKey = appUpdateKey;
  }, [appUpdateKey]);
  const [activeCallContactId, setActiveCallContactId] = useState<string | null>(null);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);

  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isSmsDialogOpen, setIsSmsDialogOpen] = useState(false);
  const [isRappelDialogOpen, setIsRappelDialogOpen] = useState(false);
  const [isRendezVousDialogOpen, setIsRendezVousDialogOpen] = useState(false);
  const [isUpdateConfirmationOpen, setIsUpdateConfirmationOpen] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<{ visible: boolean; title: string; path?: string } | null>(null)
  const [isQualificationDialogOpen, setIsQualificationDialogOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isFnKeysInfoOpen, setIsFnKeysInfoOpen] = useState(false);
  const [isShortcutConfigOpen, setIsShortcutConfigOpen] = useState(false);
  const [isCalcomConfigOpen, setIsCalcomConfigOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHeaderHelpOpen, setIsHeaderHelpOpen] = useState(false);
  const [helpInitialSection, setHelpInitialSection] = useState<HelpSection>(HelpSection.DocOverview);
  const [helpMode, setHelpMode] = useState<HelpCategory>('documentation');
  const [isHeaderTicketOpen, setIsHeaderTicketOpen] = useState(false);
  // Densité UI (compact/default)
  const [uiDensity, setUiDensity] = useState<'default' | 'compact'>(() => {
    try { return (localStorage.getItem('ui-density') as 'default' | 'compact') || 'default' } catch { return 'default' }
  });
  useEffect(() => {
    try {
      localStorage.setItem('ui-density', uiDensity);
    } catch { }
    const cls = 'density-compact';
    if (uiDensity === 'compact') document.body.classList.add(cls); else document.body.classList.remove(cls);
  }, [uiDensity]);
  const [shortcutIndicator, setShortcutIndicator] = useState<{
    isVisible: boolean;
    key: string;
    label: string;
  }>({ isVisible: false, key: '', label: '' });

  const [isAdbLogsDialogOpen, setIsAdbLogsDialogOpen] = useState(false);
  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = useState(false);

  const [importProgress, setImportProgress] = useState<{ percentage: number; message: string } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem('dimicall-view-mode') as ViewMode | null
      // Migration automatique : si l'ancienne vue 'table' est sauvegardée, la remplacer par 'appels-cards'
      if (saved === 'table') {
        localStorage.setItem('dimicall-view-mode', 'appels-cards')
        return 'appels-cards'
      }
      if (
        saved === 'appels-cards' ||
        saved === 'graph' ||
        saved === 'db' ||
        saved === 'calendar-2' ||
        saved === 'annuaire' ||
        saved === 'files' ||
        saved === 'prequalification'
      ) {
        return saved
      }
    } catch (error) {
      console.warn('Impossible de charger le mode de vue sauvegardé', error)
    }
    return 'appels-cards'
  });
  const [annuaireFocusContact, setAnnuaireFocusContact] = useState<{ id?: string; name?: string } | null>(null);
  // Filtres globaux par vue pour uniformit
  const [graphRange, setGraphRange] = useState<{ start: string; end: string }>(() => {
    const now = new Date();
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const end = fmt(now);
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return { start: fmt(start), end };
  })
  const [dbRange, setDbRange] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date())
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)
  const [filterQuick, setFilterQuick] = useState<QuickRangeKey>('last7')
  const [dbSelectedCount, setDbSelectedCount] = useState<number>(0)

  // Throttled persistence to avoid blocking on every keystroke
  const contactsPersistRef = useRef<Contact[] | null>(null);
  const contactsPersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const PERSIST_DELAY_MS = 800;

  const flushPendingContacts = useCallback((snapshot?: Contact[]) => {
    const dataToPersist = snapshot ?? contactsPersistRef.current;
    if (!dataToPersist) return;
    try {
      saveContacts(dataToPersist);
      if (hasImportedTable()) {
        const savedTable = loadImportedTable();
        if (savedTable?.metadata) {
          saveImportedTable(dataToPersist, savedTable.metadata);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des contacts:', error);
    }
    contactsPersistRef.current = null;
  }, []);

  const schedulePersistContacts = useCallback((nextContacts: Contact[], options?: { immediate?: boolean }) => {
    contactsPersistRef.current = nextContacts;

    if (options?.immediate) {
      if (contactsPersistTimerRef.current) {
        clearTimeout(contactsPersistTimerRef.current);
        contactsPersistTimerRef.current = null;
      }
      flushPendingContacts(nextContacts);
      return;
    }

    if (contactsPersistTimerRef.current) {
      return; // déjà planifié
    }

    contactsPersistTimerRef.current = setTimeout(() => {
      flushPendingContacts();
      contactsPersistTimerRef.current = null;
    }, PERSIST_DELAY_MS);
  }, [flushPendingContacts]);

  const formatYmd = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

  const updateRangeAndBroadcast = (range: { start: string; end: string }, key: QuickRangeKey) => {
    setFilterQuick(key)
    if (viewMode === 'graph') {
      setGraphRange(range)
    } else {
      setDbRange(range)
    }
    const evt = new CustomEvent('dimicall-date-filter', { detail: { scope: viewMode === 'graph' ? 'graph' : 'db', start: range.start, end: range.end } })
    window.dispatchEvent(evt)
  }

  const applyQuickRange = (key: QuickRangeKey) => {
    const now = new Date()

    if (key === 'all') {
      updateRangeAndBroadcast({ start: '', end: '' }, 'all')
      return
    }

    if (key === 'today') {
      const ymd = formatYmd(now)
      updateRangeAndBroadcast({ start: ymd, end: ymd }, 'today')
      return
    }

    if (key === 'last7') {
      const end = formatYmd(now)
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 6)
      updateRangeAndBroadcast({ start: formatYmd(startDate), end }, 'last7')
      return
    }

    if (key === 'last30') {
      const end = formatYmd(now)
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 29)
      updateRangeAndBroadcast({ start: formatYmd(startDate), end }, 'last30')
      return
    }

    if (key === 'thisWeek') {
      const today = new Date(now)
      const diffToMonday = (today.getDay() + 6) % 7
      const start = new Date(today)
      start.setDate(today.getDate() - diffToMonday)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      updateRangeAndBroadcast({ start: formatYmd(start), end: formatYmd(end) }, 'thisWeek')
      return
    }

    if (key === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      updateRangeAndBroadcast({ start: formatYmd(start), end: formatYmd(end) }, 'thisMonth')
      return
    }

    if (key === 'custom') {
      setFilterQuick('custom')
    }
  }

  const handleCustomRangeSelect = (range?: DateRange) => {
    setCustomRangeDraft(range)
  }

  const applyCustomRange = () => {
    if (!customRangeDraft?.from && !customRangeDraft?.to) return
    const start = customRangeDraft?.from ? formatYmd(customRangeDraft.from) : ''
    const end = customRangeDraft?.to ? formatYmd(customRangeDraft.to) : start
    updateRangeAndBroadcast({ start, end }, 'custom')
    setFilterMenuOpen(false)
  }

  const resetCustomRange = () => {
    setCustomRangeDraft(undefined)
    applyQuickRange('all')
    setFilterMenuOpen(false)
  }

  const formatDateLabel = (date?: Date) => (date ? date.toLocaleDateString('fr-FR') : '—')
  // Onglets Table
  const [tableTabs, setTableTabs] = useState<TableTab[]>(() => {
    try {
      const raw = localStorage.getItem('dimicall-table-tabs')
      return raw ? JSON.parse(raw) as TableTab[] : []
    } catch { return [] }
  })

  // tats pour l'dition des onglets
  const [editingTab, setEditingTab] = useState<TableTab | null>(null)
  const [isTabEditDialogOpen, setIsTabEditDialogOpen] = useState(false)

  // Fonctions pour grer l'dition des onglets
  const handleEditTab = (tab: TableTab) => {
    setEditingTab(tab)
    setIsTabEditDialogOpen(true)
  }

  const handleSaveTab = (name: string, color: string) => {
    if (editingTab) {
      setTableTabs(prev => prev.map(tab =>
        tab.id === editingTab.id
          ? { ...tab, name, color }
          : tab
      ))
    }
  }

  const handleAddTab = () => {
    if (tableTabs.length >= 5) return
    const id = crypto.randomUUID()
    setTableTabs(prev => [...prev, { id, name: `Onglet ${prev.length + 1}`, contacts: [] }])
    setActiveTableTabId(id)
  }

  const handleDeleteTab = (tabId: string) => {
    setTableTabs(prev => {
      const next = prev.filter(t => t.id !== tabId)

      // Si c'tait le dernier onglet, crer un nouvel onglet vide
      if (next.length === 0) {
        const newTabId = crypto.randomUUID()
        const newTab = {
          id: newTabId,
          name: 'Nouveau',
          contacts: []
        }
        setActiveTableTabId(newTabId)
        return [newTab]
      }

      // Sinon, passer  l'onglet suivant
      if (resolvedActiveTabId === tabId) {
        setActiveTableTabId(next[0]?.id || '')
      }
      return next
    })
  }
  const [activeTableTabId, setActiveTableTabId] = useState<string>(() => {
    try { return localStorage.getItem('dimicall-active-table-tab') || '' } catch { return '' }
  })
  const [editingTabId, setEditingTabId] = useState<string | null>(null)

  const resolvedActiveTabId = useMemo(() => {
    if (activeTableTabId && tableTabs.some(tab => tab.id === activeTableTabId)) {
      return activeTableTabId;
    }
    return tableTabs[0]?.id || '';
  }, [activeTableTabId, tableTabs]);

  const activeTab = useMemo(() => {
    if (!resolvedActiveTabId) {
      return null;
    }
    return tableTabs.find(tab => tab.id === resolvedActiveTabId) || null;
  }, [tableTabs, resolvedActiveTabId]);

  useEffect(() => {
    if (!resolvedActiveTabId) {
      if (contacts.length > 0) {
        setContacts([]);
      }
      if (selectedContact) {
        setSelectedContact(null);
      }
      return;
    }

    const currentTab = tableTabs.find(tab => tab.id === resolvedActiveTabId);
    if (!currentTab) {
      return;
    }

    // Toujours synchroniser les contacts de l'onglet actif, même si les IDs sont les mêmes
    // Cela permet de mettre à jour les compteurs googleContactsCount et calendarRemindersCount
    // quand le contenu des contacts change (statut, dateRappel, etc.)
    // On utilise une comparaison par référence pour détecter les changements
    if (contacts !== currentTab.contacts) {
      setContacts(currentTab.contacts);
    }

    if (selectedContact && !currentTab.contacts.some(contact => contact.id === selectedContact.id)) {
      setSelectedContact(null);
    }
  }, [resolvedActiveTabId, tableTabs]);


  useEffect(() => {
    const onSel = (e: any) => {
      const c = Number(e?.detail?.count ?? 0)
      setDbSelectedCount(isNaN(c) ? 0 : c)
    }
    window.addEventListener('dimicall-db-selection', onSel as any)
    return () => window.removeEventListener('dimicall-db-selection', onSel as any)
  }, [])

  // Nettoyage automatique de la base locale (limité à une fois toutes les 6h)
  useEffect(() => {
    let cancelled = false
    const runRepair = async () => {
      try {
        if (typeof window === 'undefined' || !(window as any).electronAPI?.localdb?.repair) return
        const lastRun = (() => { try { return Number(localStorage.getItem('dimicall-last-db-repair') || '0') } catch { return 0 } })()
        const SIX_HOURS = 6 * 60 * 60 * 1000
        if (Date.now() - lastRun < SIX_HOURS) return
        const res = await localDbService.repair()
        if (cancelled) return
        if (res.success) {
          try { localStorage.setItem('dimicall-last-db-repair', String(Date.now())) } catch { }
          if (res.updated > 0) {
            toast.success(`Base locale nettoyée (${res.updated}/${res.scanned})`)
          }
        }
      } catch (error) {
        console.error('[App] auto repair localdb failed', error)
      }
    }
    runRepair()
    return () => { cancelled = true }
  }, [])

  // Persister tabs
  useEffect(() => {
    try { localStorage.setItem('dimicall-table-tabs', JSON.stringify(tableTabs)) } catch { }
  }, [tableTabs])
  useEffect(() => {
    try { localStorage.setItem('dimicall-active-table-tab', activeTableTabId) } catch { }
  }, [activeTableTabId])

  // Rception transfert depuis BDD
  useEffect(() => {
    const handler = (e: any) => {
      const contactsFromDb: Contact[] = e?.detail?.contacts || []
      const name: string = e?.detail?.name || `Nouvel onglet (${tableTabs.length + 1})`
      setTableTabs(prev => {
        const limited = prev.slice(0, 5)
        if (limited.length >= 5) {
          // Remplacer le dernier onglet si djà 5
          const replaced = [...limited]
          replaced[4] = { id: crypto.randomUUID(), name, contacts: contactsFromDb }
          setActiveTableTabId(replaced[4].id)
          return replaced
        }
        const id = crypto.randomUUID()
        setActiveTableTabId(id)
        return [...limited, { id, name, contacts: contactsFromDb }]
      })
    }
    window.addEventListener('dimicall-db-transferred', handler as any)
    const onToast = (e: any) => {
      const d = e?.detail || {}
      if (d?.type === 'success') {
        toast.success(d.title || 'Opration russie', {
          action: d.path ? {
            label: "Ouvrir l'emplacement",
            onClick: () => { try { (window as any).electronAPI?.showItemInFolder?.(d.path) } catch { } }
          } : undefined
        })
      } else if (d?.type === 'error') {
        toast.error(d.title || 'Opration choue')
      } else if (d?.type === 'info') {
        toast.message(d.title || 'Information')
      }
    }
    window.addEventListener('dimicall-toast', onToast as any)
    return () => {
      window.removeEventListener('dimicall-db-transferred', handler as any)
      window.removeEventListener('dimicall-toast', onToast as any)
    }
  }, [tableTabs.length])

  const [autoSearchMode, setAutoSearchMode] = useState<'disabled' | 'linkedin' | 'linkedin-name' | 'linkedin-name-type' | 'google' | 'link'>(() => {
    try {
      // Unifier la clé de stockage avec le dropdown et les autres vues
      const KEYS = ['dimicall-auto-search-mode', 'auto-search-mode']
      let saved: string | null = null
      for (const k of KEYS) {
        const val = localStorage.getItem(k)
        if (val) { saved = val; break }
      }
      // console.log('🔎 [AUTO-SEARCH] Chargement mode depuis localStorage:', saved)

      if (saved && ['disabled', 'linkedin', 'linkedin-name', 'linkedin-name-type', 'google', 'link'].includes(saved)) {
        // console.log('✅ [AUTO-SEARCH] Mode valide trouvé:', saved)
        return saved as 'disabled' | 'linkedin' | 'linkedin-name' | 'linkedin-name-type' | 'google' | 'link'
      }

      // console.log('ℹ️ [AUTO-SEARCH] Aucun mode valide, défaut linkedin enrichi')
      return 'linkedin-name-type'
    } catch (error) {
      console.error('⚠️ [AUTO-SEARCH] Erreur lors du chargement:', error)
      return 'linkedin-name-type'
    }
  });

  // Persister le mode automatique pour toutes les vues qui lisent la même clé
  useEffect(() => {
    try { localStorage.setItem('dimicall-auto-search-mode', autoSearchMode) } catch { }
  }, [autoSearchMode])
  const [splitPanelOpen, setSplitPanelOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('dimicall-split-panel-open');
      return saved ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // tat pour l'URL Cal.com personnalise
  const [calcomUrl, setCalcomUrl] = useState<string>(() => {
    const saved = localStorage.getItem('calcom-url');

    // Migration automatique des anciennes URLs vers la nouvelle avec overlayCalendar=true
    if (saved) {
      const newUrl = 'https://cal.com/dimitri-morel-arcanis-conseil/audit-patrimonial?overlayCalendar=true';

      // Liste des anciennes URLs à migrer
      const oldUrls = [
        'https://cal.com/dimitri-morel-arcanis-conseil/audit-patrimonial',
        'https://cal.com/dimitri-morel-arcanis-conseil/arcanis-conseil-audit-patrimonial-dimicall',
      ];

      // Vrifier si c'est une ancienne URL à migrer
      const isOldUrl = oldUrls.some(oldUrl => saved === oldUrl) ||
        (saved.includes('dimitri-morel-arcanis-conseil') &&
          !saved.includes('overlayCalendar=true') &&
          !saved.includes('audit-patrimonial?overlayCalendar=true'));

      if (isOldUrl) {
        console.log('🔄 Migration URL Cal.com:', saved, '→', newUrl);
        localStorage.setItem('calcom-url', newUrl);
        return newUrl;
      }

      return saved;
    }

    return 'https://cal.com/dimitri-morel-arcanis-conseil/audit-patrimonial?overlayCalendar=true';
  });

  // tat pour le template SMS personnalis
  const [smsTemplate, setSmsTemplate] = useState<string>(() => {
    const saved = localStorage.getItem('sms-template');
    return saved || `Bonjour @civilite @nom,

Pour resituer mon appel, je suis grant priv au sein du cabinet de gestion de patrimoine Arcanis Conseil.

Je vous envoie l'adresse de notre site web que vous puissiez en savoir d'avantage :
https://arcanis-conseil.fr

Le site est avant tout une vitrine, le mieux est de m'appeler si vous souhaitez davantage d'informations ou de prendre un crneau de 30 minutes dans mon agenda via ce lien :
https://calendly.com/dimitri-morel-arcanis-conseil/audit

Bien à vous,

Dimitri MOREL - Arcanis Conseil`;
  });

  // Template SMS Apporteur séparé
  const [smsTemplateApporteur, setSmsTemplateApporteur] = useState<string>(() => {
    try {
      const savedAll = localStorage.getItem('dimicall_email_templates');
      if (savedAll) {
        const data = JSON.parse(savedAll);
        if (data.smsApporteur) return data.smsApporteur as string;
      }
    } catch { }
    return `Bonjour @civilite @nom,\n\nJe vous contacte dans le cadre de la gestion de votre dossier apporteur. Voici les informations et liens dédiés.\n\nBien à vous,`;
  });

  // tat intelligent pour les colonnes visibles bas sur les donnes relles
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(VISIBLE_COLUMNS_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      // console.log('🔍 Chargement initial visibleColumns depuis localStorage:', parsed);
      return parsed;
    } catch (error) {
      console.error('❌ Erreur lors du chargement de visibleColumns:', error);
      return {};
    }
  });

  // Ref pour garder une trace de l'initialisation des colonnes
  const columnsInitializedRef = useRef(false);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [availableDataKeys, setAvailableDataKeys] = useState<(keyof Contact | null)[]>([]);

  // Fonction pour dtecter les colonnes disponibles dans les donnes
  const detectAvailableColumns = useCallback((contactsData: Contact[]) => {
    // console.log('🔎 detectAvailableColumns appelé avec', contactsData?.length || 0, 'contacts');

    if (!contactsData || contactsData.length === 0) {
      // Colonnes par dfaut minimales si pas de donnes
      const defaultColumns = ["#", "Sexe", "Prnom", "Nom", "Tlphone", "Mail", "Statut", "Commentaire"];
      const defaultDataKeys = ['numeroLigne', 'sexe', 'prenom', 'nom', 'telephone', 'email', 'statut', 'commentaire'] as (keyof Contact | null)[];

      setAvailableColumns(defaultColumns);
      setAvailableDataKeys(defaultDataKeys);

      // NE PAS réinitialiser visibleColumns si des préférences existent déjà
      // Initialiser uniquement si c'est la toute première fois
      setVisibleColumns(prevVisible => {
        // Si on a déjà des préférences, les garder
        if (Object.keys(prevVisible).length > 0) {
          // console.log('✅ Préférences existantes conservées (pas de contacts):', prevVisible);
          return prevVisible;
        }

        // Sinon, initialiser avec les valeurs par défaut
        console.log('⚠️ Initialisation avec valeurs par défaut (pas de contacts)');
        const defaultVisibility = defaultColumns.reduce((acc, col) => {
          acc[col] = true;
          return acc;
        }, {} as Record<string, boolean>);
        return defaultVisibility;
      });
      return;
    }

    // Analyser un chantillon de contacts pour dtecter les colonnes avec des donnes
    const sampleSize = Math.min(10, contactsData.length);
    const sample = contactsData.slice(0, sampleSize);

    const detectedColumns = new Set<string>();
    const detectedDataKeys: (keyof Contact | null)[] = [];

    // Toujours inclure les colonnes essentielles ET importantes par dfaut
    const alwaysIncludeColumns = [
      "#", "Sexe", "Prnom", "Nom",
      "Tlphone", "Mail", "Statut", "Commentaire",
      "Source", "Type", "Qualit", "Lien",
      "Date Rappel", "Heure Rappel", "Date RDV", "Heure RDV",
      "Date Appel", "Heure Appel", "Dure Appel"
    ];

    const alwaysIncludeDataKeys = [
      'numeroLigne', 'sexe', 'prenom', 'nom',
      'telephone', 'email', 'statut', 'commentaire',
      'source', 'type', 'qualite', 'lien',
      'dateRappel', 'heureRappel', 'dateRDV', 'heureRDV',
      'dateAppel', 'heureAppel', 'dureeAppel'
    ] as (keyof Contact)[];

    alwaysIncludeColumns.forEach((col, index) => {
      detectedColumns.add(col);
      detectedDataKeys.push(alwaysIncludeDataKeys[index] || null);
    });

    // Vrifier les colonnes optionnelles pour voir si elles contiennent des donnes
    COLUMN_HEADERS.forEach((header, index) => {
      if (alwaysIncludeColumns.includes(header)) return; // Djà incluse

      const dataKey = CONTACT_DATA_KEYS[index];
      if (!dataKey) return;

      // Vrifier si au moins un contact a une valeur non vide pour cette colonne
      const hasData = sample.some(contact => {
        const value = contact[dataKey as keyof Contact];
        return value !== undefined && value !== null && value !== '';
      });

      if (hasData) {
        detectedColumns.add(header);
        detectedDataKeys.push(dataKey as keyof Contact);
      }
    });

    const newAvailableColumns = Array.from(detectedColumns);
    setAvailableColumns(newAvailableColumns);
    setAvailableDataKeys(detectedDataKeys);

    // Mettre à jour la visibilit UNIQUEMENT lors de la premire initialisation
    // ou si de nouvelles colonnes sont dtectes
    setVisibleColumns(prevVisible => {
      // Si les colonnes sont djà initialises et qu'on a des prfrences sauvegardes,
      // ne pas les craser
      const hasExistingPreferences = Object.keys(prevVisible).length > 0;

      const newVisibleColumns = newAvailableColumns.reduce((acc, col) => {
        // Garder la prfrence existante si elle existe, sinon true par dfaut
        acc[col] = prevVisible[col] !== undefined ? prevVisible[col] : true;
        return acc;
      }, {} as Record<string, boolean>);

      // Masquer par dfaut certaines colonnes moins importantes (seulement si pas djà dfini)
      const lessImportantColumns = ["Don", "Qualit", "Type", "Date", "UID"];
      lessImportantColumns.forEach(col => {
        if (newVisibleColumns[col] !== undefined && prevVisible[col] === undefined) {
          newVisibleColumns[col] = false;
        }
      });

      // Si on a djà des prfrences, ne retourner les nouvelles valeurs que pour les nouvelles colonnes
      if (hasExistingPreferences) {
        const merged = { ...prevVisible };
        // Ajouter uniquement les nouvelles colonnes dtectes
        newAvailableColumns.forEach(col => {
          if (merged[col] === undefined) {
            merged[col] = newVisibleColumns[col];
          }
        });
        // console.log('✅ Préférences existantes conservées et fusionnées:', merged);
        return merged;
      }

      console.log('⚠️ Initialisation avec nouvelles colonnes détectées:', newVisibleColumns);
      return newVisibleColumns;
    });
  }, []); // Pas de dpendances pour viter la boucle infinie

  // Effect pour dtecter les colonnes quand les contacts changent
  useEffect(() => {
    detectAvailableColumns(contacts);
  }, [contacts, detectAvailableColumns]); // Inclure detectAvailableColumns dans les dépendances

  // Sauvegarder la visibilit des colonnes à chaque modification
  useEffect(() => {
    try {
      if (Object.keys(visibleColumns).length > 0) {
        // console.log('💾 Sauvegarde visibleColumns dans localStorage:', visibleColumns);
        localStorage.setItem(VISIBLE_COLUMNS_STORAGE_KEY, JSON.stringify(visibleColumns));
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de visibleColumns:', error);
    }
  }, [visibleColumns]);

  // Charger la taille de page prfre
  const savedItemsPerPage = useMemo(() => {
    try {
      const raw = localStorage.getItem('dimicall-items-per-page');
      const n = raw ? parseInt(raw, 10) : NaN;
      return Number.isFinite(n) && n > 0 ? n : 25;
    } catch {
      return 25;
    }
  }, []);

  // ADB Hook
  const {
    connectionState: adbConnectionState,
    isConnecting: adbConnecting,
    connect: connectAdb,
    disconnect: disconnectAdb,
    getLogs: getAdbLogs,
    setAutoDetection: setAdbAutoDetection,
    restartAdbServer: restartAdb,
    makeCall: makeAdbCall,
    endCall: adbEndCall,
    sendSms,
    getCurrentCallState,
    getLastCallNumber,
    checkCallState,
    onCallEnd
  } = useAdb();

  // Settings state
  const [currentTab, setCurrentTab] = useState<'table' | 'adb' | 'files' | 'performance'>('table');
  const [isImporting, setIsImporting] = useState(false);

  // Ref pour le scroll automatique de la table
  const contactTableRef = useRef<ContactTableRef>(null);

  // Stable helper functions
  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string, duration: number = 3000) => {
    // Notifications dsactives - fonction no-op
    return;
  }, []);

  const handleOpenAnnuaireContact = useCallback((id?: string, name?: string) => {
    setAnnuaireFocusContact({ id, name });
    setViewMode('annuaire');
  }, []);

  const handleTitleBarAdbClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      if (event.ctrlKey || event.metaKey) {
        setIsAdbLogsDialogOpen(true);
        return;
      }

      if (adbConnectionState.isConnected) {
        await disconnectAdb();
        showNotification('info', 'ADB déconnecté');
        return;
      }

      if (adbConnecting) {
        return;
      }

      const success = await connectAdb();
      showNotification(success ? 'success' : 'error', success ? 'ADB connecté' : 'Échec de connexion ADB');
    },
    [adbConnectionState.isConnected, adbConnecting, connectAdb, disconnectAdb, setIsAdbLogsDialogOpen, showNotification]
  );

  // Handler pour l'authentification russie - removed (no longer needed with full page)
  // Effect pour vrifier l'authentification - removed (handled by conditional render)

  // Sauvegardes de prfrences utilisateur
  useEffect(() => {
    try { localStorage.setItem('dimicall-theme', theme); } catch { }
  }, [theme]);
  useEffect(() => {
    try { localStorage.setItem('dimicall-active-tab', activeMenuTab); } catch { }
  }, [activeMenuTab]);
  useEffect(() => {
    try { localStorage.setItem('dimicall-search-term', searchTerm); } catch { }
  }, [searchTerm]);
  useEffect(() => {
    try { localStorage.setItem('dimicall-search-column', String(searchColumn)); } catch { }
  }, [searchColumn]);
  useEffect(() => {
    try { localStorage.setItem('dimicall-split-panel-open', String(splitPanelOpen)); } catch { }
  }, [splitPanelOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('dimicall-view-mode', viewMode)
    } catch (error) {
      console.warn('Impossible de sauvegarder le mode de vue', error)
    }
  }, [viewMode])

  useEffect(() => {
    try {
      localStorage.setItem('dimicall-view-mode', viewMode)
    } catch (error) {
      console.warn('Impossible de sauvegarder le mode de vue', error)
    }
  }, [viewMode])

  // Effect pour synchroniser les DevTools au dmarrage
  useEffect(() => {
    // Synchroniser l'tat des DevTools avec les prfrences utilisateur
    const devToolsEnabled = DevToolsService.isEnabled();
    if (devToolsEnabled && window.electronAPI?.enableDevTools) {
      window.electronAPI.enableDevTools();
    }
  }, []);



  const updateContact = useCallback(async (updatedFields: Partial<Contact> & { id: string }) => {
    // console.log('🔄 [UPDATE] updateContact appel avec:', updatedFields);
    // Utiliser une fonction de mise à jour pour viter les stale closures
    let updatedContact: Contact | null = null;
    let contactFound = false;
    let previousStatusBeforeUpdate: ContactStatus | undefined;

    setContacts(currentContacts => {
      const existingContact = currentContacts.find(c => c.id === updatedFields.id);
      if (!existingContact) {
        console.warn(`Contact avec l'ID ${updatedFields.id} non trouv pour mise à jour`);
        return currentContacts; // Retourner l'tat inchang
      }

      contactFound = true;
      // Capture l'ancien statut avant fusion
      previousStatusBeforeUpdate = existingContact.statut;
      updatedContact = { ...existingContact, ...updatedFields };
      const updatedContacts = currentContacts.map(c => c.id === updatedFields.id ? updatedContact! : c);

      // console.log('🔄 [UPDATE] Contacts mis à jour:', updatedContacts.length, 'contacts');
      // console.log('🔄 [UPDATE] Contact modifi:', updatedContact);

      return updatedContacts; // Forcer le re-render immdiat
    });

    // Si le contact n'a pas t trouv, arrter ici
    if (!contactFound || !updatedContact) {
      return;
    }

    const resolvedContact = updatedContact!;

    setTableTabs(prevTabs => {
      if (!prevTabs || prevTabs.length === 0) {
        return prevTabs;
      }
      let hasChanges = false;
      const nextTabs = prevTabs.map(tab => {
        const idx = tab.contacts.findIndex(tabContact => tabContact.id === resolvedContact.id);
        if (idx === -1) {
          return tab;
        }
        const updatedTabContacts = [...tab.contacts];
        updatedTabContacts[idx] = { ...tab.contacts[idx], ...resolvedContact };
        hasChanges = true;
        return { ...tab, contacts: updatedTabContacts };
      });
      return hasChanges ? nextTabs : prevTabs;
    });


    // ?? Mise  jour en temps rel du contact slectionn dans le panneau latral
    if (selectedContact?.id === updatedFields.id) {
      setSelectedContact(updatedContact);
      // console.log('?? [UPDATE] Contact slectionn mis  jour:', updatedContact);
    }

    // Forcer un petit dlai pour que l'interface se mette à jour
    await new Promise(resolve => setTimeout(resolve, 50));

    // Enregistrer un événement de statut en local si le statut a changé
    try {
      const newStatus = updatedFields.statut;
      if (typeof window !== 'undefined' && window.electronAPI?.localdb && typeof newStatus !== 'undefined' && updatedContact) {
        // Insrer uniquement si le statut change rellement
        if (previousStatusBeforeUpdate !== newStatus) {
          const statusSnapshot = buildLocalStatusEventPayload(updatedContact, {
            oldStatus: previousStatusBeforeUpdate ?? null,
            newStatus: newStatus ?? updatedContact.statut ?? null,
          });
          await window.electronAPI.localdb.insertStatus(statusSnapshot);
          try { window.dispatchEvent(new CustomEvent('localdb-updated')); } catch { }
        }
      }
    } catch (e) {
      console.warn('chec d\'enregistrement local du statut:', e);
    }

    // Journaliser aussi les modifications de champs (commentaire, dates, etc.) comme événements
    try {
      if (typeof window !== 'undefined' && window.electronAPI?.localdb && updatedContact) {
        const syncKeys = [
          'commentaire',
          'comment',
          'dateRappel',
          'heureRappel',
          'dateRDV',
          'heureRDV',
          'dateAppel',
          'heureAppel',
          'dureeAppel',
          'email',
          'telephone',
          'prenom',
          'nom',
          'numeroLigne',
          'source',
          'statut',
          'lien',
          'sexe',
          'don',
          'qualite',
          'type',
          'date',
          'uid',
          'uid_supabase',
          'utilisateur',
          'actions',
          'statutAppel',
          'statutRDV',
          'commentaireRDV',
        ] as const;

        const hasRelevantUpdate = syncKeys.some((key) => key in updatedFields);
        if (hasRelevantUpdate) {
          const resolvedComment =
            (updatedFields as any).commentaire ??
            (updatedFields as any).comment ??
            updatedContact.commentaire ??
            null;

          let updatedEventSuccessfully = false;
          const overrides: Partial<Contact> = {};
          Object.entries(updatedFields).forEach(([key, value]) => {
            if (key === 'id') return;
            if (value !== undefined) {
              (overrides as any)[key] = value as any;
            }
          });
          if (resolvedComment !== null) {
            overrides.commentaire = resolvedComment;
          } else if ('commentaire' in updatedFields) {
            overrides.commentaire = (updatedFields as Partial<Contact>).commentaire ?? '';
          }

          const snapshot = buildLocalStatusEventPayload(updatedContact, {
            oldStatus: previousStatusBeforeUpdate ?? null,
            newStatus: updatedContact.statut ?? null,
            overrides,
          });

          if (window.electronAPI.localdb.updateLatestForContact) {
            try {
              const { contactId: _snapshotContactId, oldStatus: _snapshotOldStatus, ...fieldsToPersist } = snapshot;
              const updateResult = await window.electronAPI.localdb.updateLatestForContact(
                updatedContact.id,
                fieldsToPersist
              );
              if (updateResult?.success && updateResult.data) {
                updatedEventSuccessfully = true;
              }
            } catch (updateError) {
              console.warn('[UPDATE] updateLatestForContact failed, fallback to insert', updateError);
            }
          }

          if (!updatedEventSuccessfully) {
            await window.electronAPI.localdb.insertStatus(snapshot);
          }

          try { window.dispatchEvent(new CustomEvent('localdb-updated')); } catch { }
        }
      }
    } catch (e) {
      console.warn('chec de mise a jour de l\'evenement local:', e);
    }

  }, [selectedContact, showNotification]); // Retir 'contacts' car on utilise setContacts avec fonction

  const addContact = useCallback(async (newContact: Omit<Contact, 'id' | 'numeroLigne'>) => {
    const baseContacts = activeTab?.contacts ?? contacts;
    const contactWithId = {
      ...newContact,
      id: uuidv4(),
      numeroLigne: baseContacts.length + 1,
    };

    const updatedContacts = [...baseContacts, contactWithId].map((c, idx) => ({ ...c, numeroLigne: idx + 1 }));
    setContacts(updatedContacts);
    if (resolvedActiveTabId) {
      setTableTabs(prev =>
        prev.map(tab =>
          tab.id === resolvedActiveTabId ? { ...tab, contacts: updatedContacts } : tab
        )
      );
    }

    showNotification('success', `Contact ${newContact.prenom} ${newContact.nom} ajout`);

    return contactWithId;
  }, [activeTab, contacts, resolvedActiveTabId, showNotification]);


  const updateCallState = useCallback((contactId: string, newState: Partial<CallState>) => {
    setCallStates(prev => ({ ...prev, [contactId]: { ...(prev[contactId] || {}), ...newState } }));
  }, []);

  const refreshData = useCallback(() => {
    const loadedContacts = loadContacts();
    const contactsWithIds = loadedContacts.map((c, idx) => ({
      ...c,
      telephone: formatPhoneNumber(c.telephone || ""),
      id: c.id || uuidv4(),
      numeroLigne: idx + 1,
    }));
    setContacts(contactsWithIds);
    setCallStates(loadCallStates());

    // Vrifier si le contact slectionn existe toujours
    if (selectedContact) {
      const stillExists = contactsWithIds.find(c => c.id === selectedContact.id);
      if (!stillExists) {
        setSelectedContact(null);
      }
    }
  }, [selectedContact]);

  const handleRowSelection = useCallback((contact: Contact | null) => {
    console.log('Slection contact:', contact ? `${contact.prenom} ${contact.nom} (ID: ${contact.id})` : 'Aucun');
    setSelectedContact(contact);
  }, []);

  const handleDeleteContact = useCallback(async (contactId: string) => {
    if (window.confirm("Êtes-vous sr de vouloir supprimer ce contact ?")) {
      const contactToDelete = contacts.find(c => c.id === contactId);

      // Suppression locale immdiate
      setContacts(prev => prev.filter(c => c.id !== contactId).map((c, idx) => ({ ...c, numeroLigne: idx + 1 })));
      setCallStates(prev => {
        const newStates = { ...prev };
        delete newStates[contactId];
        return newStates;
      });
      if (selectedContact?.id === contactId) {
        setSelectedContact(null);
      }
      if (activeCallContactId === contactId) {
        setActiveCallContactId(null);
        setCallStartTime(null);
      }

      // Synchronisation avec Supabase uniquement si active
      showNotification('info', `Contact ${contactToDelete?.prenom} ${contactToDelete?.nom} supprim.`);
    }
  }, [contacts, selectedContact, activeCallContactId, showNotification]);

  const endActiveCall = useCallback((markAsError = false, contactIdToEnd?: string) => {
    const idToProcess = contactIdToEnd || activeCallContactId;
    if (idToProcess && callStates[idToProcess]?.isCalling) {
      updateCallState(idToProcess, { isCalling: false, hasBeenCalled: !markAsError });
      if (callStartTime && !markAsError) {
        const durationMs = new Date().getTime() - callStartTime.getTime();
        const durationStr = formatDurationLabel(durationMs);
        updateContact({ id: idToProcess, dureeAppel: durationStr });
      } else if (markAsError) {
        updateContact({ id: idToProcess, dureeAppel: "Erreur" });
      }
      if (activeCallContactId === idToProcess) {
        setActiveCallContactId(null);
        setCallStartTime(null);
      }
      showNotification('info', "Appel termin (simul).");
    }
  }, [activeCallContactId, callStates, callStartTime, updateCallState, updateContact, showNotification]);

  // Marqueur global d'appel en cours pour la gestion d'auth (pas de dconnexion pendant appel)
  useEffect(() => {
    try {
      const inCall = Boolean(activeCallContactId && callStartTime);
      localStorage.setItem('dc_call_in_progress', inCall ? '1' : '0');
    } catch (e) {
      // noop
    }
  }, [activeCallContactId, callStartTime]);

  // Search handlers - Supprimés, voir plus bas pour les nouvelles versions avec type et source

  const handleSms = useCallback(async (civilite: string, smsType?: SmsType, contact?: Contact, dateISO?: string, time?: string) => {
    let target = contact || selectedContact;
    if (!target) {
      showNotification('info', "Slectionnez un contact pour envoyer un SMS.");
      return;
    }

    // Vrifier la connexion ADB
    if (!adbConnectionState.isConnected) {
      showNotification('error', "Aucun appareil Android connect via ADB. Connectez votre tlphone d'abord.");
      return;
    }

    // Vrifier que le contact a un numro de tlphone
    if (!target.telephone) {
      showNotification('error', `Aucun numro de tlphone pour ${target.prenom} ${target.nom}.`);
      return;
    }

    // G�n�rer le contenu du SMS selon le type et les templates configur�s
    // Appliquer d'�ventuelles valeurs de date/heure fournies par le dialogue
    if (target && (dateISO || time)) {
      target = {
        ...target,
        dateRDV: dateISO || target.dateRDV,
        heureRDV: time || target.heureRDV,
      } as Contact;
    }
    let messageBody = '';
    try {
      messageBody = generateSmsMessage(target, (smsType as SmsType) || SmsType.PremierContact, civilite as Civility);
    } catch (e) {
      const fallback = `Bonjour ${civilite || ''} ${target.nom || ''}`.trim() + ',\n\n';
      messageBody = fallback + 'Message à compléter.';
    }

    // Nettoyer le numro de tlphone
    const phoneNumberCleaned = target.telephone.replace(/\s/g, '');

    try {
      showNotification('info', "Prparation du SMS...");

      // Prparer le SMS avec le message pr-rempli
      const result = await sendSms(phoneNumberCleaned, messageBody);

      if (result.success) {
        showNotification('success', "L'application de messagerie s'est ouverte avec votre message pr-rempli. Vous n'avez plus qu' vrifier et envoyer.");
      } else {
        showNotification('error', `chec de la prparation du SMS: ${result.message}`);
      }
    } catch (error) {
      showNotification('error', `Erreur lors de la prparation du SMS: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }, [selectedContact, showNotification, adbConnectionState.isConnected, sendSms]);

  // Clear data handlers
  const clearAllData = useCallback(() => {
    try {
      // 1. Vider la liste des contacts
      setContacts([]);

      // 2. Vider les tats d'appel
      setCallStates({});

      // 3. Dslectionner le contact actuel
      setSelectedContact(null);

      // 4. Rinitialiser l'appel actif si ncessaire
      if (activeCallContactId) {
        setActiveCallContactId(null);
        setCallStartTime(null);
      }

      // 5. Crer un onglet vide par dfaut (ne jamais laisser 0 onglet)
      const defaultTabId = crypto.randomUUID();
      setTableTabs([{
        id: defaultTabId,
        name: 'Contacts',
        contacts: []
      }]);
      setActiveTableTabId(defaultTabId);

      // 6. Nettoyer le localStorage
      schedulePersistContacts([], { immediate: true });
      saveCallStates({});
      clearImportedTable();

      // 7. Notification de succs
      showNotification('success', 'Toutes les donnes ont t supprimes avec succs');
    } catch (error) {
      console.error('Erreur lors de la suppression des donnes:', error);
      showNotification('error', 'Erreur lors de la suppression des donnes');
    }
  }, [activeCallContactId, showNotification, schedulePersistContacts]);

  const handleClearData = useCallback(() => {
    setIsClearDataDialogOpen(true);
  }, []);

  // Fonction pour supprimer uniquement l'onglet actif
  const handleClearActiveTab = useCallback(() => {
    if (!resolvedActiveTabId) return;

    setTableTabs(prev =>
      prev.map(tab =>
        tab.id === resolvedActiveTabId
          ? { ...tab, contacts: [] }
          : tab
      )
    );

    if (contacts.length > 0) {
      setContacts([]);
      setCallStates({});
      setSelectedContact(null);
    }

    showNotification('success', "Table de l'onglet actif supprime");
  }, [resolvedActiveTabId, contacts, showNotification]);


  const confirmClearData = useCallback(() => {
    clearAllData();
    setIsClearDataDialogOpen(false);
  }, [clearAllData]);

  // Import/Export handlers
  const handleSingleFileImport = useCallback(async (file: File) => {
    const fileSizeMB = file.size / (1024 * 1024);

    setImportProgress({
      message: `Importation de "${file.name}" (${fileSizeMB.toFixed(1)} MB)...`,
      percentage: 0
    });

    try {
      // Analyse de la taille du fichier
      if (fileSizeMB > 50) {
        setImportProgress({
          message: `?? Fichier volumineux dtect (${fileSizeMB.toFixed(1)} MB). Traitement optimis...`,
          percentage: 5
        });
        await new Promise(res => setTimeout(res, 1000));
      }

      setImportProgress({ message: `📖 Lecture du fichier...`, percentage: 10 });
      await new Promise(res => setTimeout(res, 200));

      setImportProgress({ message: `⚙️ Traitement par chunks...`, percentage: 20 });

      // Import optimis
      const newContacts = await importContactsFromFile(file);

      setImportProgress({ message: `📝 Prparation des donnes...`, percentage: 80 });
      await new Promise(res => setTimeout(res, 100));

      const updatedContacts = newContacts.map((c, idx) => ({
        ...c,
        numeroLigne: idx + 1,
        id: c.id || uuidv4()
      }));

      setImportProgress({ message: `💾 Sauvegarde...`, percentage: 90 });

      // Sauvegarder la table importe pour persistance
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const source = fileExtension === 'csv' ? 'csv' : 'xlsx';
      saveImportedTable(updatedContacts, {
        fileName: file.name,
        source: source as 'csv' | 'xlsx',
        totalRows: updatedContacts.length
      });

      // Injecter dans l'onglet actif si la vue Tabs est utilise, sinon dans la vue globale
      if (tableTabs.length > 0) {
        const targetTabId = resolvedActiveTabId || tableTabs[0]?.id || '';
        if (targetTabId) {
          setTableTabs(prev => prev.map(t => t.id === targetTabId ? { ...t, contacts: updatedContacts } : t));
          setActiveTableTabId(targetTabId);
        } else {
          // Fallback: crer un onglet si aucune id active
          const id = crypto.randomUUID();
          setTableTabs(prev => [...prev, { id, name: `Import (${new Date().toLocaleString()})`, contacts: updatedContacts }]);
          setActiveTableTabId(id);
        }
        // Maintenir les colonnes dtectes en mettant aussi  jour le global
        setContacts(updatedContacts);
        // S'assurer qu'on est sur la vue Appels avec Cards/Table
        setViewMode('appels-cards');
      } else {
        setContacts(updatedContacts);
      }
      setCallStates({});
      setSelectedContact(null);

      setImportProgress({ message: `✅ Finalisation...`, percentage: 100 });
      await new Promise(res => setTimeout(res, 500));
      setImportProgress(null);

      const message = fileSizeMB > 10
        ? `🎉 ${updatedContacts.length} contacts imports avec succs depuis un fichier de ${fileSizeMB.toFixed(1)} MB !`
        : `✅ ${updatedContacts.length} contacts imports avec succs !`;

      showNotification('success', message);

    } catch (error) {
      console.error("Import error:", error);
      setImportProgress(null);
      showNotification('error', `❌ Erreur d'importation: ${error instanceof Error ? error.message : "Erreur inconnue"}. Vrifiez le format de votre fichier.`);
    }
  }, [showNotification, resolvedActiveTabId, tableTabs]);

  const handleImportFile = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) {
      console.log('? [IMPORT] Aucun fichier slectionn');
      return;
    }

    console.log(`?? [IMPORT] Fichier slectionn: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    setIsImporting(true);
    try {
      // Ouvrir le dialogue de mappage via la table si disponible
      if (contactTableRef.current?.openImportMapping) {
        console.log('?? [IMPORT] Ouverture du dialogue de mappage via ContactTable');
        await contactTableRef.current.openImportMapping(file);
      } else {
        console.log('?? [IMPORT] Import direct sans dialogue de mappage');
        await handleSingleFileImport(file);
      }
    } catch (error) {
      console.error('? [IMPORT] Erreur lors de l\'importation:', error);
    } finally {
      setIsImporting(false);
    }
  }, [handleSingleFileImport]);

  // Calcul du nombre de contacts filtrs pour Google Contacts
  const googleContactsCount = useMemo(() => {
    const filteredContacts = contacts.filter(contact =>
      contact.statut === ContactStatus.ARappeler ||
      contact.statut === ContactStatus.D0 ||
      contact.statut === ContactStatus.R0 ||
      contact.statut === ContactStatus.A0
    );
    return filteredContacts.length;
  }, [contacts]);

  // Calcul du nombre de contacts avec rappels pour Google Calendar
  const calendarRemindersCount = useMemo(() => {
    const filteredContacts = contacts.filter(contact =>
      contact.dateRappel && contact.dateRappel.trim() !== ''
    );
    return filteredContacts.length;
  }, [contacts]);

  const [exportOptions, setExportOptions] = useState({
    table: false,
    tableExcel: true,
    contacts: false,
    agenda: false,
  });

  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Garder une référence des anciennes valeurs pour détecter les vrais changements
  const prevCountsRef = useRef({
    contactsLength: 0,
    googleCount: 0,
    calendarCount: 0
  });

  // Fermer le menu d'export quand les compteurs changent (pas au chargement initial)
  useEffect(() => {
    const prev = prevCountsRef.current;
    const hasChanged =
      prev.contactsLength !== contacts.length ||
      prev.googleCount !== googleContactsCount ||
      prev.calendarCount !== calendarRemindersCount;

    // Fermer le menu seulement si les valeurs ont changé ET que le menu est ouvert
    if (hasChanged && exportMenuOpen && (prev.contactsLength > 0 || prev.googleCount > 0 || prev.calendarCount > 0)) {
      setExportMenuOpen(false);
    }

    // Mettre à jour les références
    prevCountsRef.current = {
      contactsLength: contacts.length,
      googleCount: googleContactsCount,
      calendarCount: calendarRemindersCount
    };
  }, [contacts.length, googleContactsCount, calendarRemindersCount, exportMenuOpen]);

  const handleExport = useCallback((format: 'csv' | 'xlsx') => {
    if (contacts.length === 0) {
      showNotification('info', 'Aucun contact à exporter');
      return;
    }

    try {
      exportContactsToFile(contacts, format);
      try {
        window.dispatchEvent(new CustomEvent('dimicall-toast', { detail: { type: 'success', title: `Export ${format.toUpperCase()} russi` } }))
      } catch { }
    } catch (error) {
      showNotification('error', `Erreur lors de l'export: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }, [contacts, showNotification]);

  // Handler unifié pour l'export avec options multiples
  const handleUnifiedExport = useCallback(() => {
    if (contacts.length === 0) {
      showNotification('info', 'Aucun contact à exporter');
      return;
    }

    const options = Object.entries(exportOptions).filter(([_, enabled]) => enabled);

    if (options.length === 0) {
      showNotification('info', 'Veuillez sélectionner au moins une option d\'export');
      return;
    }

    let exportCount = 0;

    // Exporter la table si sélectionnée
    if (exportOptions.table) {
      try {
        exportContactsToFile(contacts, 'csv');
        exportCount++;
      } catch (error) {
        console.error('Erreur lors de l\'export table:', error);
      }
    }

    // Exporter la table en Excel si sélectionnée
    if (exportOptions.tableExcel) {
      console.log('🔄 Début de l\'export Excel...');
      try {
        exportContactsToFile(contacts, 'xlsx');
        exportCount++;
        console.log('✅ Export Excel réussi, affichage de la notification');

        // Notification personnalisée pour l'export Excel réussi - avec délai pour laisser le temps à l'utilisateur de choisir l'emplacement
        setTimeout(() => {
          toast.success('Export Excel réussi', {
            action: {
              label: "Ouvrir l'emplacement",
              onClick: () => {
                try {
                  // Ouvrir le dossier de téléchargements
                  if ((window as any).electronAPI?.shell?.showItemInFolder) {
                    const os = require('os');
                    const downloadsPath = os.homedir() + '/Downloads';
                    (window as any).electronAPI.shell.showItemInFolder(downloadsPath);
                  } else {
                    // Fallback pour les navigateurs
                    window.open('file:///' + require('os').homedir() + '/Downloads', '_blank');
                  }
                } catch (error) {
                  console.error('Erreur lors de l\'ouverture du dossier:', error);
                  // Fallback simple
                  window.open('file:///' + require('os').homedir() + '/Downloads', '_blank');
                }
              }
            }
          });
        }, 3000); // Délai de 3 secondes pour laisser le temps à l'utilisateur de choisir l'emplacement
      } catch (error) {
        console.error('❌ Erreur lors de l\'export table Excel:', error);
        toast.error('Erreur lors de l\'export Excel');
      }
    }

    // Exporter vers Google Contacts si sélectionné
    if (exportOptions.contacts) {
      try {
        if (googleContactsCount === 0) {
          showNotification('info', 'Aucun contact à exporter vers Google Contacts (statuts: À rappeler, D0, R0, A0)');
        } else {
          exportGoogleContactsCSV(contacts);
          exportCount++;
        }
      } catch (error) {
        console.error('Erreur lors de l\'export Google Contacts:', error);
      }
    }

    // Exporter vers Google Calendar si sélectionné
    if (exportOptions.agenda) {
      try {
        if (calendarRemindersCount === 0) {
          showNotification('info', 'Aucun rappel à exporter vers Google Agenda');
        } else {
          exportGoogleCalendarCSV(contacts);
          exportCount++;
        }
      } catch (error) {
        console.error('Erreur lors de l\'export Google Calendar:', error);
      }
    }

    if (exportCount > 0) {
      showNotification('success', `${exportCount} export(s) effectué(s) avec succès`);
    }
  }, [exportOptions, contacts, googleContactsCount, calendarRemindersCount, showNotification]);

  const handleDbExport = useCallback(async () => {
    await localDbService.exportXlsx();
  }, []);

  // Handlers pour les recherches LinkedIn et Google
  const handleLinkedInSearch = useCallback((modeOrContact?: 'name' | 'name-type' | Contact, contact?: Contact) => {
    let mode: 'name' | 'name-type' | undefined;
    let targetContact: Contact | null;

    if (typeof modeOrContact === 'object' && modeOrContact !== null) {
      targetContact = modeOrContact;
      mode = undefined;
    } else {
      mode = modeOrContact as 'name' | 'name-type' | undefined;
      targetContact = contact || selectedContact;
    }

    if (!targetContact) {
      showNotification('error', 'Veuillez sélectionner un contact');
      return;
    }

    const prenom = targetContact.prenom || '';
    const nom = targetContact.nom || '';
    const type = (targetContact as any).type || '';
    const ecole = (targetContact as any).ecole || '';
    const source = targetContact.source || '';

    const primaryContext = type || ecole || source || '';
    const secondaryContext =
      source && source !== primaryContext
        ? source
        : ecole && ecole !== primaryContext
          ? ecole
          : '';

    if (mode === 'name') {
      searchLinkedIn(prenom, nom);
      return;
    }
    // Mode étendu (LinkedIn+) inclut Type/École/Source
    searchLinkedIn(prenom, nom, primaryContext, secondaryContext);
  }, [selectedContact, showNotification]);

  const handleGoogleSearch = useCallback((contact?: Contact) => {
    const targetContact = contact || selectedContact;
    if (!targetContact) {
      showNotification('error', 'Veuillez sélectionner un contact');
      return;
    }

    const prenom = targetContact.prenom || '';
    const nom = targetContact.nom || '';

    // Ne passer que le prénom et le nom (type et source ignorés)
    searchGoogle(prenom, nom);
  }, [selectedContact, showNotification]);

  const handleDirectLink = useCallback((contact?: Contact) => {
    const targetContact = contact || selectedContact;
    if (!targetContact) {
      showNotification('error', 'Veuillez sélectionner un contact');
      return;
    }

    const lien = targetContact.lien || '';
    if (!lien) {
      showNotification('error', 'Ce contact n\'a pas de lien défini');
      return;
    }

    openDirectLink(lien);
  }, [selectedContact, showNotification]);

  const makePhoneCall = useCallback(async (contactToCall?: Contact) => {
    console.log('?? [MAKEPHONECALL] Dbut makePhoneCall, contactToCall:', contactToCall);
    console.log('?? [MAKEPHONECALL] selectedContact:', selectedContact);

    const targetContact = contactToCall || selectedContact;
    console.log('?? [MAKEPHONECALL] targetContact final:', targetContact);

    if (!targetContact) {
      console.log('? [MAKEPHONECALL] Pas de contact - RETURN');
      showNotification('error', "Slectionnez un contact pour appeler.");
      return;
    }

    console.log('?? [MAKEPHONECALL] activeCallContactId:', activeCallContactId);
    if (activeCallContactId && activeCallContactId !== targetContact.id) {
      console.log('?? [MAKEPHONECALL] Fin d\'appel en cours...');
      endActiveCall(false, activeCallContactId);
    }

    // Vrifier la connexion ADB
    console.log('?? [MAKEPHONECALL] adbConnectionState.isConnected:', adbConnectionState.isConnected);
    if (!adbConnectionState.isConnected) {
      console.log('? [MAKEPHONECALL] ADB pas connect - RETURN');
      showNotification('error', "Aucun appareil Android connect via ADB. Connectez votre tlphone d'abord.");
      return;
    }

    // Nettoyer le numro de tlphone pour l'appel
    const cleanPhoneNumber = targetContact.telephone.replace(/[^0-9+]/g, '');
    console.log('🔍 [MAKEPHONECALL] cleanPhoneNumber:', cleanPhoneNumber);

    try {
      console.log('🔍 [MAKEPHONECALL] Dbut du try...');
      showNotification('info', `Appel en cours vers ${targetContact.prenom} ${targetContact.nom} au ${targetContact.telephone}...`);

      console.log('🔍 [MAKEPHONECALL] Avant makeAdbCall...');
      // Faire l'appel rel via ADB
      const callResult = await makeAdbCall(cleanPhoneNumber);
      console.log('🔍 [MAKEPHONECALL] Aprs makeAdbCall, result:', callResult);

      if (callResult.success) {
        // Appel russi
        console.log(`📞 Configuration de l'appel pour le contact ${targetContact.id}...`);
        updateCallState(targetContact.id, { isCalling: true, hasBeenCalled: false });
        setActiveCallContactId(targetContact.id);
        setCallStartTime(new Date());
        console.log(`📞 Contact actif dfini: ${targetContact.id}, heure de dbut: ${new Date()}`);

        const now = new Date();
        updateContact({
          id: targetContact.id,
          dateAppel: now.toISOString().split('T')[0],
          heureAppel: now.toTimeString().substring(0, 5),
          dureeAppel: "00:00"
        });
        setSelectedContact(targetContact);

        showNotification('success', `Appel initi vers ${targetContact.prenom} ${targetContact.nom}`);

        // Recherche automatique selon le mode configur
        if (autoSearchMode === 'linkedin' || autoSearchMode === 'linkedin-name') {
          handleLinkedInSearch('name', targetContact);
          showNotification('info', 'Ouverture automatique LinkedIn', 2000);
        } else if (autoSearchMode === 'linkedin-name-type') {
          handleLinkedInSearch('name-type', targetContact);
          showNotification('info', 'Ouverture automatique LinkedIn+', 2000);
        } else if (autoSearchMode === 'google') {
          handleGoogleSearch(targetContact);
          showNotification('info', 'Ouverture automatique Google', 2000);
        } else if (autoSearchMode === 'link') {
          handleDirectLink(targetContact);
          showNotification('info', 'Ouverture automatique Lien', 2000);
        }
        // Si 'disabled', ne rien faire
      } else {
        // chec de l'appel
        showNotification('error', `chec de l'appel: ${callResult.message}`);
      }
    } catch (error) {
      showNotification('error', `Erreur lors de l'appel: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }, [selectedContact, activeCallContactId, endActiveCall, updateCallState, updateContact, autoSearchMode,
    showNotification, handleLinkedInSearch, handleGoogleSearch, handleDirectLink, adbConnectionState.isConnected, makeAdbCall]);

  // Surveillance robuste des fins d'appel via vnements ADB
  useEffect(() => {
    // console.log('🔧 Configuration de la surveillance des fins d\'appels...');

    const unsubscribeCallEnd = onCallEnd((callEndEvent) => {
      console.log('📞 vnement de fin d\'appel reu:', callEndEvent);

      if (activeCallContactId) {
        // Calculer la dure d'appel formate
        const durationStr = formatDurationLabel(callEndEvent.durationMs);

        console.log(`📞 Mise à jour du contact ${activeCallContactId} avec dure: ${durationStr}`);

        // Mettre à jour le contact avec la dure relle
        updateContact({
          id: activeCallContactId,
          dureeAppel: durationStr
        });
        // Si des tabs sont actifs, propager la dure dans le tab courant pour un rendu immdiat
        setTableTabs(prev => {
          if (!prev || prev.length === 0) return prev;
          const targetId = resolvedActiveTabId || prev[0]?.id;
          return prev.map(tab => {
            if (tab.id !== targetId) return tab;
            const newContacts = tab.contacts.map(c => c.id === activeCallContactId ? { ...c, dureeAppel: durationStr } : c);
            return { ...tab, contacts: newContacts };
          });
        });

        // Terminer l'appel dans l'interface
        updateCallState(activeCallContactId, { isCalling: false, hasBeenCalled: true });
        setActiveCallContactId(null);
        setCallStartTime(null);

        showNotification('success', `Appel termin - Dure: ${durationStr}`);
      } else {
        console.log('?? Fin d\'appel dtecte mais aucun appel actif dans l\'interface');
        showNotification('info', "Appel termin dtect.");
      }
    });

    return () => {
      // console.log('🔧 Nettoyage de la surveillance des fins d\'appels...');
      unsubscribeCallEnd();
    };
  }, [activeCallContactId, onCallEnd, updateContact, updateCallState, showNotification, resolvedActiveTabId]);

  // Auto-connexion ADB au dmarrage si pas encore connect
  useEffect(() => {
    if (!adbConnectionState.isConnected && !adbConnecting) {
      // Essayer de se connecter automatiquement aprs 2 secondes
      const timer = setTimeout(() => {
        connectAdb().catch(error => {
          console.log('Auto-connexion ADB choue:', error);
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [adbConnectionState.isConnected, adbConnecting, connectAdb]);

  const applyDocumentTheme = useCallback((nextTheme: Theme) => {
    const root = document.documentElement;
    const isDark = nextTheme === Theme.Dark;
    root.classList.toggle('dark', isDark);
    root.dataset.theme = isDark ? 'dark' : 'light';
    root.style.colorScheme = isDark ? 'dark' : 'light';
  }, []);

  // Appliquer le thème de façon synchrone avant paint, sans styles inline
  useLayoutEffect(() => {
    applyDocumentTheme(resolvedTheme);
  }, [resolvedTheme, applyDocumentTheme]);

  useEffect(() => {
    const mediaQuery = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;
    if (!mediaQuery) return;

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? Theme.Dark : Theme.Light);
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const [isInitialized, setIsInitialized] = useState(false);

  // couteur d'vnement pour l'importation - toujours actif
  useEffect(() => {
    const onImported = (e: any) => {
      try {
        console.log('?? [IMPORT] vnement dimicall-imported-contacts reu:', e.detail);
        const { contacts: newContacts, fileName, source } = e.detail || {};
        if (!newContacts || !Array.isArray(newContacts)) {
          console.log('? [IMPORT] Pas de contacts valides dans l\'vnement');
          return;
        }
        console.log(`?? [IMPORT] ${newContacts.length} contacts reus pour importation`);

        // Réordonner les colonnes selon l'ordre souhaité
        const reorderedContacts = reorderContactsColumns(newContacts);

        const updatedContacts = reorderedContacts.map((c: Contact, idx: number) => ({
          ...c,
          numeroLigne: idx + 1,
          id: c.id || uuidv4()
        }));
        saveImportedTable(updatedContacts, { fileName: fileName || 'Import', source: (source || 'csv'), totalRows: updatedContacts.length });

        // S'assurer qu'il y a toujours au minimum un onglet
        console.log(`?? [IMPORT] tat des onglets: ${tableTabs.length} onglets, actif: ${resolvedActiveTabId}`);
        if (tableTabs.length === 0) {
          // Crer un onglet par dfaut si aucun n'existe
          console.log('?? [IMPORT] Cration d\'un nouvel onglet par dfaut');
          const defaultTabId = crypto.randomUUID()
          setTableTabs([{
            id: defaultTabId,
            name: 'Contacts',
            contacts: updatedContacts
          }])
          setActiveTableTabId(defaultTabId)
        } else {
          // Utiliser l'onglet actif existant ou crer un nouveau
          const targetTabId = resolvedActiveTabId || tableTabs[0]?.id || ''
          console.log(`?? [IMPORT] Onglet cible: ${targetTabId}`);
          if (targetTabId && tableTabs.some(t => t.id === targetTabId)) {
            console.log('? [IMPORT] Mise  jour de l\'onglet existant');
            setTableTabs(prev => prev.map(t => t.id === targetTabId ? { ...t, contacts: updatedContacts } : t))
            setActiveTableTabId(targetTabId)
          } else {
            console.log('?? [IMPORT] Cration d\'un nouvel onglet');
            const id = crypto.randomUUID()
            setTableTabs(prev => [...prev, { id, name: `Import (${new Date().toLocaleString()})`, contacts: updatedContacts }])
            setActiveTableTabId(id)
          }
        }

        setContacts(updatedContacts) // maintenir la liste globale en cohrence
        // S'assurer qu'on est sur la vue Appels avec Cards/Table
        setViewMode('appels-cards')
        setCallStates({});
        setSelectedContact(null);
        console.log(`? [IMPORT] Importation termine: ${updatedContacts.length} contacts`);
        showNotification('success', `✅ ${updatedContacts.length} contacts imports avec succs !`);
      } catch (error) {
        console.error('? [IMPORT] Erreur lors du traitement de l\'importation:', error);
      }
    }

    window.addEventListener('dimicall-imported-contacts', onImported as any)
    // console.log('?? [IMPORT] couteur d\'vnement dimicall-imported-contacts enregistr')

    return () => {
      window.removeEventListener('dimicall-imported-contacts', onImported as any)
      // console.log('?? [IMPORT] couteur d\'vnement dimicall-imported-contacts supprim')
    }
  }, [tableTabs, activeTableTabId, showNotification]);

  useEffect(() => {
    // S'excuter une seule fois au dmarrage
    if (!isInitialized) {

      // Vrifier s'il y a une table importe sauvegarde
      if (hasImportedTable()) {
        const savedTable = loadImportedTable();
        if (savedTable && savedTable.contacts.length > 0) {
          const metadata = savedTable.metadata;
          console.log(`🔄 Restauration de la table importe: ${savedTable.contacts.length} contacts (${metadata?.fileName})`);

          const contactsWithIds = savedTable.contacts.map((c, idx) => ({
            ...c,
            telephone: formatPhoneNumber(c.telephone || ""),
            id: c.id || uuidv4(),
            numeroLigne: idx + 1,
          }));

          setContacts(contactsWithIds);
          setCallStates(loadCallStates());
          showNotification('success', `Table importe restaure: ${contactsWithIds.length} contacts (${metadata?.fileName})`, 4000);
          setIsInitialized(true);
          return; // Ne pas charger les contacts par dfaut
        }
      }

      // Chargement normal si pas de table importe
      refreshData();

      // S'assurer qu'il y a toujours au minimum un onglet
      if (tableTabs.length === 0) {
        const defaultTabId = crypto.randomUUID();
        setTableTabs([{
          id: defaultTabId,
          name: 'Contacts',
          contacts: []
        }]);
        setActiveTableTabId(defaultTabId);
      }

      setIsInitialized(true);
    }
  }, [isInitialized, showNotification]);

  useEffect(() => {
    if (!isInitialized) return;
    // Persistance throttlee; on force immediate pour les vidages
    schedulePersistContacts(contacts, { immediate: contacts.length === 0 });
  }, [contacts, schedulePersistContacts, isInitialized]);

  useEffect(() => {
    return () => {
      if (contactsPersistTimerRef.current) {
        clearTimeout(contactsPersistTimerRef.current);
        contactsPersistTimerRef.current = null;
      }
      if (contactsPersistRef.current) {
        flushPendingContacts(contactsPersistRef.current);
      }
    };
  }, [flushPendingContacts]);

  useEffect(() => {
    saveCallStates(callStates);
  }, [callStates]);

  // Configuration des mises à jour temps rel - Supabase supprim pour librer de l'espace

  const filteredContacts = useMemo(() => {
    if (!searchTerm) return contacts;

    const normalize = (value: any) => {
      try {
        return String(value)
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove accents
          .replace(/[^\w@.\-+ ]+/g, ' ') // Drop punctuation except common symbols
          .trim();
      } catch {
        return '';
      }
    };

    const digitsOnly = (value: any) => String(value ?? '').replace(/\D+/g, '');

    const tokens: string[] = [];
    const re = /"([^"]+)"|(\S+)/g; // quoted phrases or words
    let match: RegExpExecArray | null;
    while ((match = re.exec(searchTerm))) {
      const token = match[1] || match[2];
      if (token) tokens.push(token);
    }
    const normTokens = tokens.map(normalize).filter(Boolean);

    return contacts.filter(contact => {
      const values = searchColumn === 'all'
        ? Object.values(contact)
        : [contact[searchColumn as keyof Contact]];

      const haystack = normalize(values.join(' '));
      const phoneDigits = digitsOnly((contact as any).telephone);

      return normTokens.every(t => {
        // If token looks like a phone fragment (>=3 digits), match against digits only
        if (/^\d{3,}$/.test(t)) {
          return phoneDigits.includes(t);
        }
        return haystack.includes(t);
      });
    });
  }, [contacts, searchTerm, searchColumn]);

  // Variables de protection contre les workflows multiples (persistantes entre les re-renders)
  const isProcessingRef = useRef(false);
  const lastKeyPressRef = useRef<{ key: string; timestamp: number } | null>(null);

  // Refs pour stocker les valeurs actuelles (vite les problmes de closure stale)
  const selectedContactRef = useRef<Contact | null>(null);
  const activeCallContactIdRef = useRef<string | null>(null);
  const filteredContactsRef = useRef<Contact[]>([]);
  const contactsRef = useRef<Contact[]>([]);
  const makePhoneCallRef = useRef<((contactToCall?: Contact) => Promise<void>) | null>(null);

  // Mettre à jour les refs quand les valeurs changent
  useEffect(() => {
    selectedContactRef.current = selectedContact;
    // console.log(`?? [CONTACT_REF] Contact slectionn mis  jour:`, selectedContact ? `${selectedContact.prenom} ${selectedContact.nom}` : 'null');
  }, [selectedContact]);

  useEffect(() => {
    activeCallContactIdRef.current = activeCallContactId;
  }, [activeCallContactId]);

  useEffect(() => {
    filteredContactsRef.current = filteredContacts;
  }, [filteredContacts]);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  useEffect(() => {
    makePhoneCallRef.current = makePhoneCall;
  }, [makePhoneCall]);

  // Persistance du mode d'auto-recherche dans localStorage
  useEffect(() => {
    try {
      // console.log('💾 [AUTO-SEARCH] Sauvegarde du mode:', autoSearchMode);
      localStorage.setItem('auto-search-mode', autoSearchMode);
      // console.log('✅ [AUTO-SEARCH] Mode sauvegard avec succs dans localStorage');

      // Vrification immdiate de la sauvegarde
      const verification = localStorage.getItem('auto-search-mode');
      if (verification === autoSearchMode) {
        // console.log('✅ [AUTO-SEARCH] Vrification russie - Mode persistent:', verification);
      } else {
        console.error('❌ [AUTO-SEARCH] chec de la vrification:', { expected: autoSearchMode, actual: verification });
      }
    } catch (error) {
      console.error('❌ [AUTO-SEARCH] Erreur lors de la sauvegarde:', error);
    }
  }, [autoSearchMode]);

  // Fonction de debug pour tester la persistence manuellement (accessible via window.testAutoSearchPersistence)
  useEffect(() => {
    (window as any).testAutoSearchPersistence = () => {
      // console.log('🧪 [AUTO-SEARCH] Test de persistence:');
      // console.log('📖 Mode actuel en mmoire:', autoSearchMode);
      // console.log('💾 Mode sauvegard en localStorage:', localStorage.getItem('auto-search-mode'));
      // console.log('🔄 Pour tester: changez le mode via l\'interface, puis rafrachissez la page');
    };
  }, [autoSearchMode]);

  // Log initial du mode d'auto-recherche au dmarrage
  useEffect(() => {
    // console.log('🚀 [AUTO-SEARCH] Application dmarre avec le mode:', autoSearchMode);
    // console.log('💡 [AUTO-SEARCH] Ce mode sera utilis avec la touche F1 et le bouton Appeler');
  }, []); // Seulement au mount

  // Handler pour les raccourcis globaux Electron
  useEffect(() => {
    const handleGlobalFnKey = async (event: any, key: string) => {
      // Protection contre les workflows multiples
      if (isProcessingRef.current) {
        return;
      }

      // Protection contre les appuis rpts (debounce de 500ms)
      const now = Date.now();
      const lastKeyPress = lastKeyPressRef.current;
      if (lastKeyPress && lastKeyPress.key === key && (now - lastKeyPress.timestamp) < 500) {
        return;
      }
      lastKeyPressRef.current = { key, timestamp: now };

      // Rcuprer le contact slectionn au moment de l'appui sur la touche (depuis la ref)
      const currentSelectedContact = selectedContactRef.current;
      if (!currentSelectedContact) {
        showNotification('error', `Veuillez slectionner un contact avant d'utiliser ${key}`);
        return;
      }

      // Traitement spcial pour F1 : Appeler le contact slectionn (identique au bouton "Appeler")
      if (key === 'F1') {
        isProcessingRef.current = true; // Bloquer les nouveaux workflows

        try {
          console.log(`?? [F1] Lancement d'appel via F1 (identique au bouton Appeler)`);
          console.log(`?? [F1] Contact slectionn:`, currentSelectedContact);
          console.log(`?? [F1] makePhoneCall function:`, makePhoneCall);

          // Passer explicitement le contact pour viter les closures stales
          await makePhoneCall(currentSelectedContact);
          console.log(`?? [F1] makePhoneCall termin`);
        } catch (error) {
          console.error(`? [F1] Erreur lors de l'appel:`, error);
        } finally {
          isProcessingRef.current = false; // Dbloquer les workflows
        }
        return; // Sortir ici pour F1, pas besoin du workflow de changement de statut
      }

      // Utiliser le service de raccourcis personnaliss pour F2-F10
      const newStatus = shortcutService.getStatusForKey(key);
      if (!newStatus) {
        return;
      }

      isProcessingRef.current = true; // Bloquer les nouveaux workflows

      // Afficher l'indicateur visuel
      const shortcut = shortcutService.getShortcuts().find(s => s.key === key);
      if (shortcut) {
        setShortcutIndicator({
          isVisible: true,
          key: shortcut.key,
          label: shortcut.label
        });
      }

      try {
        await executeSequentialWorkflow(key, newStatus, currentSelectedContact);
      } catch (error) {
        console.error(`❌ [WORKFLOW] Erreur dans le workflow ${key}:`, error);
        showNotification('error', `Erreur lors du workflow ${key}: ${error}`);
      } finally {
        isProcessingRef.current = false; // Dbloquer les workflows
      }
    };

    // Fonction de workflow squentiel avec vrifications
    const executeSequentialWorkflow = async (key: string, newStatus: ContactStatus, contact: Contact) => {
      // TAPE 1: Raccrochage (si appel en cours)
      const wasCallActive = activeCallContactIdRef.current === contact.id;
      if (wasCallActive) {
        const hangupSuccess = await performHangupWithRetry();
        if (!hangupSuccess) {
          throw new Error("chec du raccrochage aprs plusieurs tentatives");
        }

        // Dlai de stabilisation aprs raccrochage
        await waitWithLog(500, "Stabilisation aprs raccrochage");
      }

      // TAPE 2: Application du statut avec vrification amliore
      const statusUpdateSuccess = await performStatusUpdateWithVerification(contact, newStatus);
      if (!statusUpdateSuccess) {
        showNotification('info', `${key}: Statut appliqu mais non vrifi pour ${contact.prenom}`);
      } else {
        showNotification('success', `${key}: ${contact.prenom} → "${newStatus}"`);
      }

      // Dlai pour que l'interface se mette à jour
      await waitWithLog(600, "Mise à jour de l'interface");

      // TAPE 3: Slection du contact suivant avec vrification
      const nextContact = await findAndSelectNextContact(contact);
      if (!nextContact) {
        showNotification('info', "Fin de la liste atteinte.");
        return;
      }

      // Dlai pour que la slection soit effective
      await waitWithLog(300, "Finalisation de la slection");

      // TAPE 4: Lancement de l'appel suivant avec vrification
      const callSuccess = await performCallWithVerification(nextContact);
      if (!callSuccess) {
        showNotification('error', `Workflow termin, mais chec de l'appel vers ${nextContact.prenom}`);
        return;
      }
    };

    // Fonction de raccrochage avec retry
    const performHangupWithRetry = async (): Promise<boolean> => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const result = await adbEndCall();

          // Vrifier que l'appel est vraiment termin
          await waitWithLog(300, `Vrification raccrochage (tentative ${attempt})`);

          // Vrifier l'tat aprs le dlai
          if (activeCallContactIdRef.current === null) {
            return true;
          }

        } catch (error) {
          console.error(`❌ [HANGUP] Erreur tentative ${attempt}:`, error);
        }

        if (attempt < 3) {
          await waitWithLog(400, `Dlai avant tentative ${attempt + 1}`);
        }
      }

      // Forcer la fin d'appel si toutes les tentatives chouent
      if (selectedContactRef.current) {
        endActiveCall(false, selectedContactRef.current.id);
      }
      return false;
    };

    // Fonction de mise à jour du statut avec vrification amliore
    const performStatusUpdateWithVerification = async (contact: Contact, newStatus: ContactStatus): Promise<boolean> => {
      try {
        // Appliquer la mise à jour avec retry
        let updateAttempts = 0;
        const maxUpdateAttempts = 3;
        let updateSuccess = false;

        while (updateAttempts < maxUpdateAttempts && !updateSuccess) {
          updateAttempts++;

          try {
            await updateContact({ id: contact.id, statut: newStatus });
            updateSuccess = true;
          } catch (error) {
            if (updateAttempts < maxUpdateAttempts) {
              await waitWithLog(300, `Dlai avant nouvelle tentative de mise à jour`);
            }
          }
        }

        if (!updateSuccess) {
          return false;
        }

        // Dlais plus longs pour la propagation
        await waitWithLog(400, "Propagation de la mise à jour du statut");

        // Vrifier dans plusieurs sources avec dlais plus longs
        let verificationAttempts = 0;
        const maxVerificationAttempts = 8; // Plus de tentatives

        while (verificationAttempts < maxVerificationAttempts) {
          verificationAttempts++;

          // Vrifier dans les contacts actuels
          const updatedContact = contactsRef.current.find(c => c.id === contact.id);

          if (updatedContact?.statut === newStatus) {
            return true;
          }

          if (verificationAttempts < maxVerificationAttempts) {
            await waitWithLog(250, `Attente propagation (tentative ${verificationAttempts})`);
          }
        }

        // Dernire tentative de force-update si la vrification choue
        try {
          await updateContact({ id: contact.id, statut: newStatus });
          await waitWithLog(500, "Force-update final");

          const finalCheck = contactsRef.current.find(c => c.id === contact.id);
          if (finalCheck?.statut === newStatus) {
            return true;
          }
        } catch (error) {
          console.error(`❌ [STATUS] chec du force-update:`, error);
        }

        return false; // Plus strict - on signale l'chec

      } catch (error) {
        console.error(`❌ [STATUS] Erreur lors de la mise à jour du statut:`, error);
        return false;
      }
    };

    // Fonction de slection du contact suivant avec vrification
    const findAndSelectNextContact = async (currentContact: Contact): Promise<Contact | null> => {
      try {
        const currentIndex = filteredContactsRef.current.findIndex(c => c.id === currentContact.id);
        if (currentIndex === -1) {
          return null;
        }

        if (currentIndex >= filteredContactsRef.current.length - 1) {
          return null;
        }

        const nextContact = filteredContactsRef.current[currentIndex + 1];

        // Slectionner le contact suivant
        setSelectedContact(nextContact);

        // Dlai pour que la slection soit effective
        await waitWithLog(200, "Application de la slection");

        // Scroll automatique vers le contact slectionn
        if (contactTableRef.current) {
          contactTableRef.current.scrollToContact(nextContact.id);
        }

        return nextContact;

      } catch (error) {
        console.error(`❌ [SELECT] Erreur lors de la slection du contact suivant:`, error);
        return null;
      }
    };

    // Fonction d'appel avec vrification
    const performCallWithVerification = async (contact: Contact): Promise<boolean> => {
      try {
        // Lancer l'appel en utilisant la ref pour viter les stale closures
        if (!makePhoneCallRef.current) {
          return false;
        }
        await makePhoneCallRef.current(contact);

        // Dlai plus court pour que l'appel s'initialise
        await waitWithLog(400, "Initialisation de l'appel");

        // Vrifier que l'appel a bien dmarr (avec plusieurs tentatives)
        let callVerificationAttempts = 0;
        const maxCallVerificationAttempts = 5; // Plus de tentatives

        while (callVerificationAttempts < maxCallVerificationAttempts) {
          callVerificationAttempts++;

          // Vrifier à la fois la ref ET l'tat direct avec une fonction de vrification
          let isCallActive = false;

          // Mthode 1: Vrifier la ref
          if (activeCallContactIdRef.current === contact.id) {
            isCallActive = true;
          }

          // Mthode 2: Vrifier l'tat des appels directement
          if (!isCallActive) {
            // Utiliser une fonction de callback pour accder à l'tat le plus rcent
            await new Promise<void>((resolve) => {
              setCallStates(currentCallStates => {
                const contactCallState = currentCallStates[contact.id];
                if (contactCallState?.isCalling) {
                  isCallActive = true;
                }
                resolve();
                return currentCallStates; // Retourner l'tat inchang
              });
            });
          }

          if (isCallActive) {
            return true;
          }

          if (callVerificationAttempts < maxCallVerificationAttempts) {
            await waitWithLog(200, `Vrification appel (tentative ${callVerificationAttempts})`);
          }
        }

        return false;

      } catch (error) {
        console.error(`❌ [CALL] Erreur lors du lancement de l'appel vers ${contact.prenom}:`, error);
        return false;
      }
    };

    // Fonction utilitaire pour les dlais
    const waitWithLog = async (ms: number, reason: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, ms));
    };

    // Vrifier l'API Electron via window.electronAPI
    if (window.electronAPI?.ipcRenderer) {
      try {
        window.electronAPI.ipcRenderer.on('global-fn-key', handleGlobalFnKey);

        return () => {
          window.electronAPI.ipcRenderer.removeListener('global-fn-key', handleGlobalFnKey);
        };
      } catch (error) {
        console.error('❌ [ELECTRON_FN] Erreur activation raccourcis:', error);
      }
    }
  }, [adbEndCall, endActiveCall, updateContact, showNotification]); // Retir makePhoneCall car on utilise maintenant makePhoneCallRef

  // Other handlers - version optimise pour gros fichiers (supprim car en conflit avec la version useCallback)

  // Fonctions handleSingleFileImport et handleExport supprimes car en conflit avec les versions useCallback



  // Obtenir les colonnes essentielles depuis les rglages sauvegards
  const getEssentialColumns = () => {
    try {
      const columnConfig = getSavedColumnConfig();
      return Object.keys(columnConfig).filter(column => columnConfig[column]);
    } catch (error) {
      console.error('Erreur lors du chargement de la config des colonnes:', error);
      // Fallback vers la config par dfaut
      return ["#", "Sexe", "Prnom", "Nom", "Commentaire"];
    }
  };

  // tat pour les colonnes essentielles (recharg depuis les rglages)
  const [essentialColumns, setEssentialColumns] = useState<string[]>(() => getEssentialColumns());

  // Fonction pour recharger les colonnes essentielles depuis les rglages
  const reloadEssentialColumns = () => {
    setEssentialColumns(getEssentialColumns());
  };

  const toggleColumnVisibility = (header: string) => {
    // Vrifier que la colonne est disponible
    if (!availableColumns.includes(header)) {
      showNotification('error', `La colonne "${header}" n'est pas disponible dans les donnes actuelles.`);
      return;
    }

    setVisibleColumns(prev => {
      const newVisibleColumns = { ...prev, [header]: !prev[header] };
      console.log('🔧 App.tsx - Toggle column visibility:', {
        header,
        'Ancienne valeur': prev[header],
        'Nouvelle valeur': newVisibleColumns[header],
        'tat complet': newVisibleColumns
      });
      return newVisibleColumns;
    });
  };

  // Fonction pour afficher toutes les colonnes disponibles
  const showAllAvailableColumns = () => {
    const newVisibleColumns = { ...visibleColumns };
    availableColumns.forEach(header => {
      newVisibleColumns[header] = true;
    });
    setVisibleColumns(newVisibleColumns);
    showNotification('success', 'Toutes les colonnes disponibles sont maintenant affiches.');
  };

  // Fonction pour masquer les colonnes optionnelles
  const hideOptionalColumns = () => {
    const newVisibleColumns = { ...visibleColumns };
    availableColumns.forEach(header => {
      if (!essentialColumns.includes(header)) {
        newVisibleColumns[header] = false;
      }
    });
    setVisibleColumns(newVisibleColumns);
    showNotification('success', 'Colonnes optionnelles masques.');
  };

  const handleRefresh = () => {
    showNotification('info', 'Rafrachissement des donnes...');
    refreshData();
  };

  // Derived state & constants for rendering
  // Options de recherche bases sur les colonnes rellement disponibles/importes
  const searchColumnsOptions = useMemo(() => {
    // Toujours proposer la recherche globale
    const options: { value: keyof Contact | 'all'; label: string }[] = [
      { value: 'all', label: 'Toutes les colonnes' }
    ];

    // Utiliser le mapping disponible (enttes -> dataKeys) dtect dynamiquement
    if (availableColumns.length > 0 && availableDataKeys.length === availableColumns.length) {
      for (let i = 0; i < availableColumns.length; i++) {
        const header = availableColumns[i];
        const dataKey = availableDataKeys[i];
        // Ne pas ajouter lindex "#" qui na pas de dataKey exploitable
        if (!dataKey || header === '#') continue;
        options.push({ value: dataKey as keyof Contact, label: header });
      }
      return options;
    }

    // Fallback: ancienne logique sur constantes si rien de dtect
    const fallback = COLUMN_HEADERS.slice(1, COLUMN_HEADERS.length - 1).map((header, idx) => {
      const dataKeyIndex = idx + 1;
      const dataKey = CONTACT_DATA_KEYS[dataKeyIndex] as keyof Contact | null;
      return { value: (dataKey || 'all') as keyof Contact | 'all', label: header };
    });
    return options.concat(fallback);
  }, [availableColumns, availableDataKeys]);

  const totalContacts = contacts.length;
  const processedContacts = contacts.filter(c => c.statut !== ContactStatus.NonDefini).length;
  const progressPercentage = totalContacts > 0 ? Math.round((processedContacts / totalContacts) * 100) : 0;

  const activeRange = viewMode === 'graph' ? graphRange : dbRange;
  const activeDateRange = useMemo<DateRange | undefined>(() => {
    if (!activeRange.start && !activeRange.end) return undefined;
    return {
      from: activeRange.start ? new Date(activeRange.start) : undefined,
      to: activeRange.end ? new Date(activeRange.end) : undefined,
    };
  }, [activeRange.start, activeRange.end]);
  const [customRangeDraft, setCustomRangeDraft] = useState<DateRange | undefined>(activeDateRange);

  useEffect(() => {
    if (filterMenuOpen) {
      setCustomRangeDraft(activeDateRange);
    }
  }, [filterMenuOpen, activeDateRange]);

  const dateRangeLabel = (() => {
    if (filterQuick === 'all') return 'Tout';
    if (filterQuick === 'today') return "Aujourd'hui";
    if (filterQuick === 'last7') return '7 derniers jours';
    if (filterQuick === 'last30') return '30 derniers jours';
    if (filterQuick === 'thisWeek') return 'Cette semaine';
    if (filterQuick === 'thisMonth') return 'Ce mois';
    if (activeRange.start && activeRange.end) return `${activeRange.start} → ${activeRange.end}`;
    return 'Plage personnalisée';
  })();

  // RibbonButton component homognis
  const RibbonButton: React.FC<{
    onClick?: () => void;
    onContextMenu?: (e: React.MouseEvent<HTMLElement>) => void;
    icon: React.ReactNode;
    label: string;
    disabled?: boolean;
    className?: string;
    isDropdown?: boolean;
    children?: React.ReactNode;
  }> = ({ onClick, onContextMenu, icon, label, disabled, className, isDropdown = false, children }) => {

    const buttonContent = (
      <>
        {/* Shimmer effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
        </div>

        {/* Glow effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
          <div className="w-4 h-4 mb-1 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
            {icon}
          </div>
          <span className="text-[10px] leading-tight w-full transition-all duration-300 group-hover:font-semibold text-center">
            {label}
          </span>
        </div>
        {children}
      </>
    );

    const buttonClasses = cn(
      "flex flex-col items-center justify-center w-[80px] h-12 shrink-0 ribbon-button-modern",
      "relative overflow-hidden transition-all duration-300 ease-out",
      "hover:scale-105 hover:shadow-lg hover:shadow-primary/20",
      "group cursor-pointer",
      "border border-transparent hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10 hover:border-primary/30",
      !disabled && "hover:transform hover:rotate-1",
      disabled && "opacity-50 cursor-not-allowed pointer-events-none",
      className
    );

    if (isDropdown) {
      return (
        <div className={cn(
          // Classes de base du Button ghost sm de shadcn/ui
          "whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50",
          "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
          "outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          "hover:text-accent-foreground dark:hover:bg-accent/50",
          "rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
          // Classes custom du ribbon
          buttonClasses
        )}>
          {buttonContent}
        </div>
      );
    }

    return (
      <Button
        onClick={onClick}
        onContextMenu={onContextMenu}
        variant="ghost"
        size="sm"
        disabled={disabled}
        className={buttonClasses}
      >
        {buttonContent}
      </Button>
    );
  };

  // Fonction pour ouvrir le modal Cal.com
  const handleCalendarClick = useCallback(() => {
    if (!selectedContact) {
      showNotification('error', 'Veuillez slectionner un contact pour prendre un rendez-vous');
      return;
    }

    console.log('🗓️ Ouverture du modal calendrier pour:', selectedContact.prenom, selectedContact.nom);

    // ⚠️ SOLUTION TEMPORAIRE pour X-Frame-Options
    // Cal.com bloque l'embedding avec X-Frame-Options: sameorigin
    // On peut soit essayer l'embed (qui va chouer) soit aller directement au nouvel onglet

    const useDirectOpen = true; // Changez à false pour essayer l'embed d'abord

    if (useDirectOpen) {
      console.log('🗓️ Ouverture directe en nouvel onglet (contournement X-Frame-Options)');
      handleDirectCalendarOpen();
    } else {
      console.log('🗓️ Tentative d\'embedding Cal.com (risque d\'chec X-Frame-Options)');
      setIsCalendarModalOpen(true);
    }
  }, [selectedContact, showNotification]);

  // Fonction pour ouvrir directement Cal.com en nouvel onglet
  const handleDirectCalendarOpen = useCallback(() => {
    if (!selectedContact) {
      showNotification('error', 'Veuillez slectionner un contact');
      return;
    }

    // Sparer l'URL de base et les paramtres existants
    const [baseUrl, existingParams] = calcomUrl.split('?');
    const allParams = new URLSearchParams(existingParams || '');

    // Ajouter les paramtres du contact
    if (selectedContact.nom) allParams.set('name', selectedContact.nom);
    if (selectedContact.prenom) allParams.set('Prenom', selectedContact.prenom);
    if (selectedContact.email && selectedContact.email.trim() !== '') allParams.set('email', selectedContact.email);
    if (selectedContact.telephone) {
      let phoneNumber = selectedContact.telephone.replace(/[\s\-\(\)]/g, '');
      if (!phoneNumber.startsWith('+')) {
        if (phoneNumber.startsWith('0')) {
          phoneNumber = '+33' + phoneNumber.substring(1);
        } else if (!phoneNumber.startsWith('33')) {
          phoneNumber = '+33' + phoneNumber;
        } else {
          phoneNumber = '+' + phoneNumber;
        }
      }
      allParams.set('smsReminderNumber', phoneNumber);
    }

    const finalUrl = `${baseUrl}?${allParams.toString()}`;
    console.log('🔗 Ouverture Cal.com:', finalUrl);
    console.log('📝 Contact slectionn:', {
      nom: selectedContact.nom,
      prenom: selectedContact.prenom,
      email: selectedContact.email,
      telephone: selectedContact.telephone
    });

    window.open(finalUrl, '_blank');
    showNotification('info', `Calendrier ouvert pour ${selectedContact.prenom} ${selectedContact.nom}`);
  }, [selectedContact, showNotification, calcomUrl]);

  // Fonction pour sauvegarder la nouvelle URL Cal.com
  const handleSaveCalcomUrl = useCallback((newUrl: string) => {
    setCalcomUrl(newUrl);
    localStorage.setItem('calcom-url', newUrl);
    setIsCalcomConfigOpen(false);
    showNotification('success', 'URL Cal.com mise à jour');
  }, [showNotification, resolvedActiveTabId, tableTabs]);

  // Fonction pour sauvegarder le nouveau template SMS
  const handleSaveSmsTemplate = useCallback((newTemplate: string) => {
    if (mode === CallMode.Apporteur) {
      setSmsTemplateApporteur(newTemplate);
      try {
        const savedAll = localStorage.getItem('dimicall_email_templates');
        const data = savedAll ? JSON.parse(savedAll) : {};
        data.smsApporteur = newTemplate;
        localStorage.setItem('dimicall_email_templates', JSON.stringify(data));
      } catch { }
    } else {
      setSmsTemplate(newTemplate);
      localStorage.setItem('sms-template', newTemplate);
    }
    showNotification('success', 'Template SMS mis à jour');
  }, [showNotification, mode]);

  // Fonction callback quand un RDV est pris avec succs
  const handleCalendarSuccess = useCallback(() => {
    if (selectedContact) {
      showNotification('success', `Rendez-vous pris avec ${selectedContact.prenom} ${selectedContact.nom}`);
      // Optionnel : mettre à jour la date/heure de RDV du contact
      // updateContact({ id: selectedContact.id, dateRDV: new Date().toISOString().split('T')[0] });
    }
    setIsCalendarModalOpen(false);
  }, [selectedContact, showNotification]);

  // Debug log pour l'tat du modal - Supabase supprim

  // Afficher un écran de chargement pendant la vérification de l'authentification
  if (auth.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, afficher la page de connexion pleine écran
  if (!auth.isAuthenticated) {
    return <LoginPage />;
  }

  const hasNativeTitleBar =
    typeof window !== 'undefined' && Boolean((window as any).electronAPI);
  const headerHeight = hasNativeTitleBar ? '2rem' : '0px';

  return (
    <SidebarProvider
      className={cn(
        "grid h-svh min-h-svh overflow-hidden bg-background",
        "grid-cols-[auto_1fr]",
        "@container"
      )}
      style={{
        minHeight: 0,
        paddingTop: hasNativeTitleBar ? headerHeight : 0,
        "--sidebar-width": "16rem",
        "--sidebar-width-icon": "3rem",
        "--header-height": headerHeight,
      } as React.CSSProperties}
    >
      <AppSidebar
        activeTab={activeMenuTab}
        onTabChange={(tab) => {
          if (tab === 'dimicall') setActiveMenuTab(tab)
        }}
        onSettingsClick={() => setIsSettingsOpen(true)}
        viewMode={viewMode}
        onChangeViewMode={(mode) => setViewMode(mode)}
      />
      <SidebarInset className="min-w-0 flex flex-col min-h-0 transition-all duration-200 ease-linear pt-0 mt-0 basis-full overflow-hidden pl-0 md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-0">
        {/* Barre de titre personnalisée pour Electron */}
        <TitleBar
          theme={resolvedTheme}
        />

        {/* Contenu principal */}
        <main className="flex flex-col flex-1 w-full min-h-0 min-w-0 overflow-hidden h-full">
          {/* Notifications */}

          {/* 🔧 Indicateur d'appel en cours avec chronomtrage en temps rel - DSACTIV */}
          {/* {activeCallContactId && callStartTime && (
         <div className="fixed top-4 left-4 z-50">
           <div className="flex items-center gap-3 px-4 py-3 bg-green-500/10 border border-green-300 dark:border-green-700 rounded-lg animate-pulse shadow-lg">
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
               <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
               <span className="text-sm font-medium text-green-700 dark:text-green-300">
                 Appel en cours
               </span>
             </div>
             <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/50 px-3 py-2 rounded-md border border-green-300 dark:border-green-700">
               <Timer className="h-4 w-4 text-green-600 dark:text-green-400" />
               <span className="text-xl font-mono font-bold text-green-800 dark:text-green-200 min-w-[4rem] text-center">
                 {(() => {
                   if (!callStartTime) return '00:00';
                   const now = new Date();
                   const durationMs = now.getTime() - callStartTime.getTime();
                   const seconds = Math.floor((durationMs / 1000) % 60);
                   const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
                   return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                 })()}
               </span>
             </div>
           </div>
         </div>
       )} */}

          {/* Modal de progression */}
          {importProgress && (
            <Dialog open={true} onOpenChange={() => setImportProgress(null)}>
              <DialogContent className="sm:max-w-md" aria-describedby="import-progress-desc">
                <DialogHeader>
                  <DialogTitle className="sr-only">Progression d'import</DialogTitle>
                </DialogHeader>
                <div id="import-progress-desc" className="flex flex-col items-center space-y-4 p-4">
                  <div className="w-12 h-12 border-4 border-muted rounded-full animate-spin border-t-primary" />
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium">{importProgress.message}</p>
                    {importProgress.percentage !== null && (
                      <div className="w-full">
                        <Progress value={importProgress.percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">{importProgress.percentage}%</p>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Toast/Modal lger d'export russi (Shadcn-like) */}
          <Toaster position="bottom-right" richColors theme={resolvedTheme === Theme.Dark ? 'dark' : 'light'} closeButton />


          {/* Main content card (includes header) */}
          <div className="group-data-[variant=floating]:border group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm bg-card text-foreground border border-border rounded-lg shadow-sm mr-[2px] sm:mr-[4px] mt-[2px] sm:mt-[4px] mb-[2px] sm:mb-[4px] flex-1 flex flex-col min-h-0 overflow-hidden min-w-0">
            {/* Header inside the white container */}
            <MainHeader
              theme={resolvedTheme}
              onToggleTheme={handleToggleTheme}
              onOpenSettings={() => setIsSettingsOpen(true)}
              updateDownloaded={Boolean(updateState?.downloaded)}
              adbConnected={adbConnectionState.isConnected}
              contacts={contacts}
              onPickContact={(c) => {
                setSelectedContact(c)
              }}
              onNavigate={(mode) => setViewMode(mode)}
              onOpenAnnuaireContact={handleOpenAnnuaireContact}
              updateState={updateState}
              onUpdateClick={installUpdate}
              onUpdateConfirmationOpen={() => setIsUpdateConfirmationOpen(true)}
              betaPreferences={betaPreferences}
              isUpdateEnabled={isUpdateEnabled}
              adbConnectionState={adbConnectionState}
              adbConnecting={adbConnecting}
              onAdbClick={handleTitleBarAdbClick}
              onOpenHelp={() => {
                setHelpMode('documentation');
                setHelpInitialSection(HelpSection.DocOverview);
                setIsHeaderHelpOpen(true);
              }}
              onOpenSupport={() => setIsHeaderTicketOpen(true)}
              onOpenTroubleshoot={() => {
                setHelpMode('depannage');
                setHelpInitialSection(HelpSection.TroubleshootAdb);
                setIsHeaderHelpOpen(true);
              }}
            />
            <main className={cn(
              "flex-1 flex flex-col pt-2 md:pt-3 pb-3 md:pb-5 px-2 sm:px-3 md:px-5 space-y-2 md:space-y-3 overflow-hidden w-full min-h-0"
            )}>

              {/* Search bar area */}
              <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full justify-between min-w-0">
                {/* 0me encadr: Bascule Vue retire (dsormais dans la Sidebar) */}
                {/* Call Control inline (à droite du slecteur de mode) */}
                {viewMode === 'table' && (
                  <>

                    {/* Call Control - maintenant aprs la recherche */}
                    <div className="flex-grow min-w-0 w-full xl:w-auto -mt-1 order-1 xl:order-none">
                      <CallControl
                        contact={selectedContact}
                        isCalling={Boolean(activeCallContactId && selectedContact && activeCallContactId === selectedContact.id)}
                        callStartTime={callStartTime}
                        onCall={() => makePhoneCall()}
                        onHangUp={() => adbEndCall()}
                        onEmail={() => selectedContact && setIsEmailDialogOpen(true)}
                        onSms={() => selectedContact && setIsSmsDialogOpen(true)}
                        onRappel={() => selectedContact && setIsRappelDialogOpen(true)}
                        onRendezVous={() => selectedContact && setIsRendezVousDialogOpen(true)}
                        onCalCom={() => handleCalendarClick()}
                        onQualification={() => selectedContact && setIsQualificationDialogOpen(true)}
                        onStatusChange={(newStatus) => {
                          console.log('🔄 [STATUS] Changement de statut demand:', newStatus, 'pour contact:', selectedContact?.id);
                          if (selectedContact) {
                            updateContact({ id: selectedContact.id, statut: newStatus });
                          }
                        }}
                        adbConnected={adbConnectionState.isConnected}
                      />
                    </div>


                  </>
                )}

                {/* Bandeau filtres uniformisé pour Graph/BDD */}
                {viewMode === 'graph' || viewMode === 'db' ? (
                  <div className="w-full min-w-0">
                    <div
                      className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-2 sm:px-4 md:px-6 pt-2 pb-2 w-full min-w-0"
                      role="toolbar"
                      aria-label="Barre d'outils Graphiques"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
                        <div className="flex flex-col min-w-0">
                          <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                            {viewMode === 'graph' ? 'Graphiques' : 'Données'}
                          </h1>
                        </div>
                        <div className="h-9" />
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 w-full md:w-auto order-3 md:order-none justify-end flex-wrap">
                        {viewMode === 'db' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 gap-2 px-3 bg-white dark:bg-card border-border/70 shadow-none"
                            onClick={handleDbExport}
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                            <span className="text-sm">Exporter</span>
                          </Button>
                        )}
                        <DropdownMenu modal={false} open={filterMenuOpen} onOpenChange={setFilterMenuOpen}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 gap-2 px-3 bg-white dark:bg-card border-border/70 shadow-none"
                            >
                              <Calendar className="h-4 w-4" />
                              <span className="text-sm">{dateRangeLabel}</span>
                              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64 p-1">
                            <DropdownMenuLabel>Plage de dates</DropdownMenuLabel>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault()
                                applyQuickRange('today')
                                setFilterMenuOpen(false)
                              }}
                            >
                              Aujourd'hui
                              {filterQuick === 'today' && <Check className="ml-auto h-4 w-4 opacity-70" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault()
                                applyQuickRange('last7')
                                setFilterMenuOpen(false)
                              }}
                            >
                              7 derniers jours
                              {filterQuick === 'last7' && <Check className="ml-auto h-4 w-4 opacity-70" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault()
                                applyQuickRange('last30')
                                setFilterMenuOpen(false)
                              }}
                            >
                              30 derniers jours
                              {filterQuick === 'last30' && <Check className="ml-auto h-4 w-4 opacity-70" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault()
                                applyQuickRange('thisWeek')
                                setFilterMenuOpen(false)
                              }}
                            >
                              Cette semaine
                              {filterQuick === 'thisWeek' && <Check className="ml-auto h-4 w-4 opacity-70" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault()
                                applyQuickRange('thisMonth')
                                setFilterMenuOpen(false)
                              }}
                            >
                              Ce mois
                              {filterQuick === 'thisMonth' && <Check className="ml-auto h-4 w-4 opacity-70" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault()
                                applyQuickRange('all')
                                setFilterMenuOpen(false)
                              }}
                            >
                              Tout
                              {filterQuick === 'all' && <Check className="ml-auto h-4 w-4 opacity-70" />}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="flex items-center gap-2">
                                <CalendarSearch className="h-4 w-4" />
                                <span>Plage personnalisée</span>
                                {filterQuick === 'custom' && <Check className="ml-auto h-4 w-4 opacity-70" />}
                              </DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent
                                  className="p-3 space-y-3 min-w-[520px]"
                                  sideOffset={8}
                                  alignOffset={-4}
                                  onCloseAutoFocus={(event) => event.preventDefault()}
                                >
                                  <div className="text-xs text-muted-foreground px-1">
                                    {formatDateLabel(customRangeDraft?.from)} → {formatDateLabel(customRangeDraft?.to)}
                                  </div>
                                  <UiCalendar
                                    mode="range"
                                    numberOfMonths={2}
                                    defaultMonth={customRangeDraft?.from || customRangeDraft?.to || undefined}
                                    selected={customRangeDraft}
                                    onSelect={(range) => handleCustomRangeSelect(range || undefined)}
                                  />
                                  <div className="flex items-center justify-between gap-2 pt-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={resetCustomRange}
                                    >
                                      Réinitialiser
                                    </Button>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFilterMenuOpen(false)}
                                      >
                                        Fermer
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={applyCustomRange}
                                        disabled={!customRangeDraft?.from || !customRangeDraft?.to}
                                      >
                                        Appliquer
                                      </Button>
                                    </div>
                                  </div>
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ) : null}

              </div>

              {/* Content area */}
              <div className="flex-1 flex overflow-hidden min-h-0">
                {viewMode === 'table' ? (
                  <div className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0">
                    <div className="flex-1 bg-transparent rounded-none border-0 shadow-none overflow-hidden">
                      {tableTabs.length === 0 ? (
                        <PaginatedContactTable
                          key={`table-${tableUpdateKey}-${filteredContacts.length}-${selectedContact?.id || 'none'}`}
                          ref={contactTableRef}
                          contacts={filteredContacts}
                          callStates={callStates}
                          onSelectContact={handleRowSelection}
                          selectedContactId={selectedContact?.id || null}
                          onUpdateContact={updateContact}
                          onDeleteContact={handleDeleteContact}
                          activeCallContactId={activeCallContactId}
                          theme={resolvedTheme}
                          visibleColumns={visibleColumns}
                          columnHeaders={availableColumns.length > 0 ? availableColumns : COLUMN_HEADERS}
                          contactDataKeys={availableDataKeys.length > 0 ? availableDataKeys : CONTACT_DATA_KEYS as (keyof Contact | null)[]}
                          onToggleColumnVisibility={toggleColumnVisibility}
                          availableColumns={availableColumns}
                          onFileImport={handleSingleFileImport}
                          initialItemsPerPage={savedItemsPerPage}
                          pageSizeOptions={[25, 50, 100]}
                        />
                      ) : (
                        <Tabs value={resolvedActiveTabId} onValueChange={setActiveTableTabId} className="flex h-full flex-col">
                          {/* Barre d'onglets en haut - Responsive */}
                          <div className="flex flex-col lg:flex-row lg:items-center gap-2 px-1.5 py-1.5 border-b bg-card">
                            {/* Première ligne: Actions principales */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {/* Bouton Colonnes simplifié */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-2 shrink-0 bg-white text-foreground dark:text-slate-900 dark:bg-white hover:bg-slate-50 dark:hover:bg-slate-100 border border-border"
                                    title="Gestion des colonnes"
                                  >
                                    <Settings2 className="h-4 w-4" />
                                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                                      {availableColumns.filter(col => visibleColumns[col]).length}
                                    </Badge>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64">
                                  <DropdownMenuLabel className="flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    Gestion des colonnes
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {COLUMN_HEADERS.map((header) => (
                                    <DropdownMenuCheckboxItem
                                      key={header}
                                      className="flex items-center gap-2"
                                      checked={visibleColumns[header] || false}
                                      onCheckedChange={() => toggleColumnVisibility(header)}
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      {header}
                                    </DropdownMenuCheckboxItem>
                                  ))}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuCheckboxItem
                                    className="flex items-center gap-2 text-primary"
                                    checked={availableColumns.every(header => visibleColumns[header])}
                                    onCheckedChange={showAllAvailableColumns}
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Eye className="h-4 w-4" />
                                    Afficher toutes les colonnes disponibles
                                  </DropdownMenuCheckboxItem>
                                  <DropdownMenuCheckboxItem
                                    className="flex items-center gap-2 text-orange-600 dark:text-orange-400"
                                    checked={availableColumns.every(header => essentialColumns.includes(header) ? visibleColumns[header] : !visibleColumns[header])}
                                    onCheckedChange={hideOptionalColumns}
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <EyeOff className="h-4 w-4" />
                                    Masquer les colonnes optionnelles
                                  </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                              </DropdownMenu>

                              {/* Bouton Recherche moderne - Actions rapides - Visible sur tous les écrans */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!selectedContact}
                                    className="h-9 px-2 shrink-0"
                                    title="Actions de recherche pour le contact sélectionné"
                                  >
                                    <Globe className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  className="w-56 border shadow-lg bg-popover text-popover-foreground z-50"
                                  align="start"
                                >
                                  {/* Actions principales - plus épurées */}
                                  <DropdownMenuItem
                                    onClick={() => handleLinkedInSearch()}
                                    disabled={!selectedContact}
                                    className="cursor-pointer"
                                  >
                                    <Linkedin className="mr-2 h-4 w-4 text-blue-500" />
                                    <span>LinkedIn</span>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => handleGoogleSearch()}
                                    disabled={!selectedContact}
                                    className="cursor-pointer"
                                  >
                                    <Globe className="mr-2 h-4 w-4 text-green-500" />
                                    <span>Google</span>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => handleDirectLink()}
                                    disabled={!selectedContact || !selectedContact.lien}
                                    className="cursor-pointer"
                                  >
                                    <ExternalLink className="mr-2 h-4 w-4 text-purple-500" />
                                    <span>Lien direct</span>
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  {/* Mode automatique - simplifié */}
                                  <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
                                    Mode automatique
                                  </DropdownMenuLabel>

                                  <DropdownMenuRadioGroup value={autoSearchMode} onValueChange={(value) => setAutoSearchMode(value as any)}>
                                    <DropdownMenuRadioItem value="disabled" className="cursor-pointer">
                                      <X className="mr-2 h-4 w-4" />
                                      <span>Désactivé</span>
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioItem value="linkedin-name" className="cursor-pointer">
                                      <Linkedin className="mr-2 h-4 w-4 text-blue-500" />
                                      <span>LinkedIn (Prénom + Nom)</span>
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="linkedin-name-type" className="cursor-pointer">
                                      <Linkedin className="mr-2 h-4 w-4 text-blue-500" />
                                      <span>LinkedIn (Prénom + Nom + Type)</span>
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioItem value="google" className="cursor-pointer">
                                      <Globe className="mr-2 h-4 w-4 text-green-500" />
                                      <span>Google</span>
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="link" className="cursor-pointer">
                                      <ExternalLink className="mr-2 h-4 w-4 text-purple-500" />
                                      <span>Lien</span>
                                    </DropdownMenuRadioItem>
                                  </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>

                              {/* Boutons de recherche LinkedIn et Google - Masqués sur petits écrans, visibles sur grands écrans */}
                              <div className="hidden xl:flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleLinkedInSearch()}
                                  disabled={!selectedContact}
                                  className="h-8 gap-1.5 px-3 bg-[#0A66C2] hover:bg-[#004182] text-white border-[#0A66C2] shrink-0"
                                  title="Rechercher sur LinkedIn"
                                >
                                  <Linkedin className="h-4 w-4" />
                                  <span className="hidden 2xl:inline">LinkedIn</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleGoogleSearch()}
                                  disabled={!selectedContact}
                                  className="h-8 gap-1.5 px-3 bg-[#4285F4] hover:bg-[#357AE8] text-white border-[#4285F4] shrink-0"
                                  title="Rechercher sur Google"
                                >
                                  <Globe className="h-4 w-4" />
                                  <span className="hidden 2xl:inline">Google</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDirectLink()}
                                  disabled={!selectedContact || !selectedContact.lien}
                                  className="h-8 gap-1.5 px-3 shrink-0"
                                  title="Ouvrir le lien direct"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="hidden 2xl:inline">Lien direct</span>
                                </Button>
                              </div>
                            </div>

                            {/* Deuxième section: Boutons d'action */}
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  console.log('??? [IMPORT] Clic sur le bouton Importer');
                                  document.getElementById('fileImporter')?.click();
                                }}
                                className="h-9 px-2"
                                title="Importer un fichier CSV/Excel"
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                              <input
                                type="file"
                                id="fileImporter"
                                accept=".csv, .tsv, .xlsx, .xls"
                                className="hidden"
                                onClick={(e) => {
                                  (e.target as HTMLInputElement).value = '';
                                }}
                                onChange={(e) => {
                                  console.log('?? [IMPORT] vnement onChange de l\'input file dclench');
                                  if (e.target.files && e.target.files.length > 0) {
                                    console.log(`?? [IMPORT] Fichier slectionn: ${e.target.files[0].name}`);
                                    handleImportFile(e.target.files);
                                  } else {
                                    console.log('? [IMPORT] Aucun fichier dans e.target.files');
                                  }
                                }}
                              />

                              <DropdownMenu open={exportMenuOpen} onOpenChange={(open) => {
                                setExportMenuOpen(open);
                              }}>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={contacts.length === 0 && googleContactsCount === 0 && calendarRemindersCount === 0}
                                    className="h-9 px-2 shrink-0"
                                    title="Exporter les données"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  className="w-56 border shadow-lg bg-popover text-popover-foreground z-50"
                                  align="start"
                                >
                                  <DropdownMenuLabel className="flex items-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Options d'export
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />

                                  {/* Options d'export avec cases à cocher */}
                                  <DropdownMenuCheckboxItem
                                    checked={exportOptions.table}
                                    onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, table: checked }))}
                                    onSelect={(e) => e.preventDefault()}
                                    disabled={contacts.length === 0}
                                    className="cursor-pointer"
                                  >
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    <span>Table (CSV)</span>
                                    {contacts.length > 0 && (
                                      <span className="ml-auto text-xs text-muted-foreground">({contacts.length})</span>
                                    )}
                                  </DropdownMenuCheckboxItem>

                                  <DropdownMenuCheckboxItem
                                    checked={exportOptions.tableExcel}
                                    onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, tableExcel: checked }))}
                                    onSelect={(e) => e.preventDefault()}
                                    disabled={contacts.length === 0}
                                    className="cursor-pointer"
                                  >
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    <span>Table (Excel)</span>
                                    {contacts.length > 0 && (
                                      <span className="ml-auto text-xs text-muted-foreground">({contacts.length})</span>
                                    )}
                                  </DropdownMenuCheckboxItem>

                                  <DropdownMenuCheckboxItem
                                    checked={exportOptions.contacts}
                                    onCheckedChange={(checked) => {
                                      setExportOptions(prev => ({ ...prev, contacts: checked }));
                                    }}
                                    onSelect={(e) => e.preventDefault()}
                                    disabled={googleContactsCount === 0}
                                    className="cursor-pointer"
                                  >
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>Contacts Google</span>
                                    {googleContactsCount > 0 && (
                                      <span className="ml-auto text-xs text-muted-foreground">({googleContactsCount})</span>
                                    )}
                                  </DropdownMenuCheckboxItem>

                                  <DropdownMenuCheckboxItem
                                    checked={exportOptions.agenda}
                                    onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, agenda: checked }))}
                                    onSelect={(e) => e.preventDefault()}
                                    disabled={calendarRemindersCount === 0}
                                    className="cursor-pointer"
                                  >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <span>Agenda Google</span>
                                    {calendarRemindersCount > 0 && (
                                      <span className="ml-auto text-xs text-muted-foreground">({calendarRemindersCount})</span>
                                    )}
                                  </DropdownMenuCheckboxItem>

                                  <DropdownMenuSeparator />

                                  {/* Bouton d'export final */}
                                  <DropdownMenuItem
                                    onClick={handleUnifiedExport}
                                    className="cursor-pointer bg-primary/10 hover:bg-primary/20"
                                    disabled={Object.values(exportOptions).every(option => !option)}
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    <span className="font-medium">Exporter la sélection</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>

                              <Button
                                variant="outline"
                                size="sm"
                                disabled={contacts.length === 0}
                                onClick={handleClearActiveTab}
                                className="h-9 px-2 shrink-0"
                                title="Supprimer les contacts de l'onglet actif"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>

                              {/* Dropdown des onglets - Responsive */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="flex items-center gap-2 px-3 py-1.5 h-9 text-sm shrink-0"
                                  >
                                    <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: tableTabs.find(t => t.id === (resolvedActiveTabId))?.color || 'var(--primary)' }} />
                                    <span className="truncate max-w-[120px] sm:max-w-[200px]">
                                      {tableTabs.find(t => t.id === (resolvedActiveTabId))?.name || 'Onglets'}
                                    </span>
                                    <ChevronDown className="h-4 w-4 shrink-0" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-64">
                                  <DropdownMenuLabel className="flex items-center gap-2">
                                    <Tabs className="h-4 w-4" />
                                    Onglets
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />

                                  {/* Liste des onglets existants */}
                                  {tableTabs.map(tab => (
                                    <DropdownMenuItem
                                      key={tab.id}
                                      onClick={() => setActiveTableTabId(tab.id)}
                                      className={cn(
                                        "flex items-center gap-2 cursor-pointer",
                                        (resolvedActiveTabId) === tab.id && "bg-accent"
                                      )}
                                    >
                                      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: tab.color || 'var(--primary)' }} />
                                      <span className="flex-1 truncate">{tab.name}</span>

                                      {/* Boutons d'action pour l'onglet */}
                                      <div className="flex items-center gap-1">
                                        {/* Bouton de renommage */}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 p-0 hover:bg-accent-foreground/10"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleEditTab(tab)
                                          }}
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </Button>

                                        {/* Bouton de suppression */}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setTableTabs(prev => {
                                              const next = prev.filter(t => t.id !== tab.id)

                                              // Si c'tait le dernier onglet, crer un nouvel onglet vide
                                              if (next.length === 0) {
                                                const newTabId = crypto.randomUUID()
                                                const newTab = {
                                                  id: newTabId,
                                                  name: 'Nouveau',
                                                  contacts: []
                                                }
                                                setActiveTableTabId(newTabId)
                                                return [newTab]
                                              }

                                              // Sinon, passer  l'onglet suivant
                                              if ((resolvedActiveTabId) === tab.id) {
                                                setActiveTableTabId(next[0]?.id || '')
                                              }
                                              return next
                                            })
                                          }}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </DropdownMenuItem>
                                  ))}

                                  {/* Bouton d'ajout d'onglet */}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (tableTabs.length >= 5) return
                                      const id = crypto.randomUUID()
                                      setTableTabs(prev => [...prev, { id, name: `Onglet ${prev.length + 1}`, contacts: [] }])
                                      setActiveTableTabId(id)
                                    }}
                                    disabled={tableTabs.length >= 5}
                                    className="flex items-center gap-2"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Ajouter un onglet
                                  </DropdownMenuItem>

                                  {/* Bouton de suppression complte */}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={handleClearData}
                                    className="flex items-center gap-2 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Supprimer toutes les donnes
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          {/* Contenu des onglets */}
                          {tableTabs.map((tab) => {
                            const isActiveTab = tab.id === resolvedActiveTabId;
                            return (
                              <TabsContent key={tab.id} value={tab.id} className="flex-1 overflow-hidden">
                                <PaginatedContactTable
                                  key={`table-tab-${tab.id}-${tableUpdateKey}`}
                                  ref={isActiveTab ? contactTableRef : undefined}
                                  contacts={isActiveTab ? filteredContacts : tab.contacts}
                                  callStates={callStates}
                                  onSelectContact={handleRowSelection}
                                  selectedContactId={selectedContact?.id || null}
                                  onUpdateContact={updateContact}
                                  onDeleteContact={handleDeleteContact}
                                  activeCallContactId={activeCallContactId}
                                  theme={resolvedTheme}
                                  visibleColumns={visibleColumns}
                                  columnHeaders={availableColumns.length > 0 ? availableColumns : COLUMN_HEADERS}
                                  contactDataKeys={availableDataKeys.length > 0 ? availableDataKeys : CONTACT_DATA_KEYS as (keyof Contact | null)[]}
                                  onToggleColumnVisibility={toggleColumnVisibility}
                                  availableColumns={availableColumns}
                                  onFileImport={handleSingleFileImport}
                                  initialItemsPerPage={savedItemsPerPage}
                                  pageSizeOptions={[25, 50, 100]}
                                />
                              </TabsContent>
                            );
                          })}
                        </Tabs>
                      )}
                    </div>
                  </div>
                ) : viewMode === 'appels-cards' ? (
                  <AppelsCardsView
                    contacts={filteredContacts}
                    selectedContactId={selectedContact?.id || null}
                    onSelectContact={handleRowSelection}
                    onUpdateContact={updateContact}
                    callStates={callStates}
                    activeCallContactId={activeCallContactId}
                    callStartTime={callStartTime}
                    adbConnected={adbConnectionState.isConnected}
                    onCall={() => makePhoneCall()}
                    onHangUp={() => adbEndCall()}
                    onEmail={() => selectedContact && setIsEmailDialogOpen(true)}
                    onSms={() => selectedContact && setIsSmsDialogOpen(true)}
                    onRappel={() => selectedContact && setIsRappelDialogOpen(true)}
                    onRendezVous={() => selectedContact && setIsRendezVousDialogOpen(true)}
                    onCalCom={() => handleCalendarClick()}
                    onQualification={() => selectedContact && setIsQualificationDialogOpen(true)}
                    onLinkedInSearch={(mode) => handleLinkedInSearch(mode)}
                    onGoogleSearch={() => handleGoogleSearch()}
                    onDirectLink={() => handleDirectLink()}
                    onExport={() => handleUnifiedExport()}
                    onClearActiveTab={handleClearActiveTab}
                    searchQuery={searchTerm}
                    onSearch={(value) => setSearchTerm(value)}
                    onImportDialog={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = '.csv,.tsv,.xlsx,.xls'
                      input.onchange = (event) => {
                        const files = (event.target as HTMLInputElement).files
                        if (files && files.length > 0) {
                          handleImportFile(files)
                        }
                      }
                      input.click()
                    }}
                    onExportDialog={() => handleExport('xlsx')}
                    autoSearchMode={autoSearchMode}
                    onAutoSearchModeChange={(mode) => setAutoSearchMode(mode)}
                    tableTabs={tableTabs}
                    activeTableTabId={resolvedActiveTabId}
                    onSetActiveTableTabId={setActiveTableTabId}
                    onAddTab={handleAddTab}
                    onEditTab={handleEditTab}
                    onDeleteTab={handleDeleteTab}
                  />
                ) : viewMode === 'graph' ? (
                  <div className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0 w-full">
                    <div className="flex-1 w-full overflow-auto min-w-0">
                      <ChartDashboard
                        contacts={filteredContacts}
                        initialStartDate={graphRange.start}
                        initialEndDate={graphRange.end}
                      />
                    </div>
                  </div>
                ) : viewMode === 'calendar-2' ? (
                  <Calendar2 onOpenAnnuaireContact={handleOpenAnnuaireContact} />
                ) : viewMode === 'annuaire' ? (
                  <AnnuairePage
                    theme={resolvedTheme === Theme.Dark ? 'dark' : 'light'}
                    onContactSelect={(contact) => setSelectedContact(contact)}
                    onCall={() => makePhoneCall()}
                    onSms={() => selectedContact && setIsSmsDialogOpen(true)}
                    onEmail={() => selectedContact && setIsEmailDialogOpen(true)}
                    onQualification={() => selectedContact && setIsQualificationDialogOpen(true)}
                    onReminder={() => selectedContact && setIsRappelDialogOpen(true)}
                    onRDV={() => selectedContact && setIsRendezVousDialogOpen(true)}
                    onCalCom={() => handleCalendarClick()}
                    onLinkedIn={() => handleLinkedInSearch()}
                    onGoogle={() => handleGoogleSearch()}
                    onDirectLink={() => handleDirectLink()}
                    focusContact={annuaireFocusContact}
                    onContactFocusConsumed={() => setAnnuaireFocusContact(null)}
                  />
                ) : viewMode === 'files' ? (
                  <FilesPage contacts={contacts} />
                ) : viewMode === 'prequalification' ? (
                  <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                    <PreQualificationPage />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0">
                    <div className="flex-1 overflow-hidden">
                      <PaginatedEventTable />
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>



          {/* Dialogs */}
          {selectedContact && isEmailDialogOpen && (
            <EmailDialog
              isOpen={isEmailDialogOpen}
              onClose={() => setIsEmailDialogOpen(false)}
              contact={selectedContact}
              showNotification={showNotification}
              onUpdateContact={updateContact}
            />
          )}
          {selectedContact && isSmsDialogOpen && (
            <SmsDialog
              isOpen={isSmsDialogOpen}
              onClose={() => setIsSmsDialogOpen(false)}
              contact={selectedContact}
              onUpdateContact={updateContact}
              onSendSms={async (civility, smsType, dateISO, time) => {
                await handleSms(civility as string, smsType, undefined, dateISO, time);
                setIsSmsDialogOpen(false);
              }}
            />
          )}
          {selectedContact && isRappelDialogOpen && (
            <RappelDialog
              isOpen={isRappelDialogOpen}
              onClose={() => setIsRappelDialogOpen(false)}
              contact={selectedContact}
              onSave={(date, time) => {
                updateContact({ id: selectedContact.id, dateRappel: date, heureRappel: time });
                showNotification('success', `Rappel dfini pour ${selectedContact.prenom} le ${date} à ${time}.`);
                setIsRappelDialogOpen(false);
              }}
            />
          )}
          {selectedContact && isRendezVousDialogOpen && (
            <RendezVousDialog
              isOpen={isRendezVousDialogOpen}
              onClose={() => setIsRendezVousDialogOpen(false)}
              contact={selectedContact}
              onSave={(date, time) => {
                updateContact({ id: selectedContact.id, dateRDV: date, heureRDV: time });
                showNotification('success', `Rendez-vous programm pour ${selectedContact.prenom} le ${date} à ${time}.`);
                setIsRendezVousDialogOpen(false);
              }}
            />
          )}
          {selectedContact && isQualificationDialogOpen && (
            <QualificationDialog
              isOpen={isQualificationDialogOpen}
              onClose={() => setIsQualificationDialogOpen(false)}
              onSave={(comment) => {
                updateContact({ id: selectedContact.id, commentaire: comment });
                showNotification('success', `Qualification enregistre pour ${selectedContact.prenom}.`);
                setIsQualificationDialogOpen(false);
              }}
              theme={resolvedTheme}
            />
          )}
          {isFnKeysInfoOpen && (
            <GenericInfoDialog
              isOpen={isFnKeysInfoOpen}
              onClose={() => setIsFnKeysInfoOpen(false)}
              title="Raccourcis Clavier"
              content={
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Utilisez les touches de fonction pour interagir rapidement avec le contact slectionn :
                  </p>

                  {/* F1 pour l'appel */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Action d'appel :</p>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <Badge variant="outline" className="font-mono text-xs bg-blue-100 dark:bg-blue-800">
                        F1
                      </Badge>
                      <span className="text-sm font-medium">📞 Appeler le contact</span>
                    </div>
                  </div>

                  {/* F2-F10 pour les statuts */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Changement de statut :</p>
                    <div className="grid grid-cols-1 gap-2">
                      {shortcutService.getShortcuts().map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                          <Badge variant="outline" className="font-mono text-xs">
                            {key}
                          </Badge>
                          <span className="text-sm">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsFnKeysInfoOpen(false);
                        setIsShortcutConfigOpen(true);
                      }}
                      className="text-xs"
                    >
                      Personnaliser les raccourcis F2-F10
                    </Button>
                  </div>
                </div>
              }
              theme={resolvedTheme}
            />
          )}
          {/* Supabase dialog supprim pour librer de l'espace */}

          {/* Dialog de configuration des raccourcis */}
          {isShortcutConfigOpen && (
            <ShortcutConfigDialog
              isOpen={isShortcutConfigOpen}
              onClose={() => setIsShortcutConfigOpen(false)}
              theme={resolvedTheme}
              onSave={() => {
                showNotification('success', 'Configuration des raccourcis sauvegarde', 3000);
              }}
            />
          )}

          {/* Dialog des rglages */}
          {isSettingsOpen && (
            <SettingsDialog
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
              onSave={() => {
                reloadEssentialColumns(); // Recharger les colonnes essentielles
                showNotification('success', 'Rglages sauvegards avec succs', 3000);
              }}
              calcomUrl={calcomUrl}
              onCalcomUrlChange={handleSaveCalcomUrl}
              smsTemplate={smsTemplate}
              onSmsTemplateChange={handleSaveSmsTemplate}
              theme={theme}
              onThemeChange={setTheme}
            />
          )}

          <HelpDialog
            isOpen={isHeaderHelpOpen}
            onClose={() => setIsHeaderHelpOpen(false)}
            theme={resolvedTheme}
            initialSection={helpInitialSection}
            mode={helpMode}
          />

          <TicketForm
            isOpen={isHeaderTicketOpen}
            onOpenChange={setIsHeaderTicketOpen}
            userEmail={auth.user?.email}
            appVersion={packageJson.version}
          />

          {/* Indicateur de raccourci */}
          <ShortcutIndicator
            isVisible={shortcutIndicator.isVisible}
            keyPressed={shortcutIndicator.key}
            statusLabel={shortcutIndicator.label}
            theme={resolvedTheme}
            onClose={() => setShortcutIndicator({ isVisible: false, key: '', label: '' })}
          />

          {/* Dialog des logs ADB */}
          {isAdbLogsDialogOpen && (
            <Dialog open={isAdbLogsDialogOpen} onOpenChange={setIsAdbLogsDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[80vh]" aria-describedby="adb-logs-desc">
                <DialogHeader>
                  <DialogTitle>Logs ADB - Debug</DialogTitle>
                </DialogHeader>
                <div id="adb-logs-desc" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div></div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAdbAutoDetection(!adbConnectionState.autoDetectionEnabled)}
                      >
                        {adbConnectionState.autoDetectionEnabled ? 'Dsactiver' : 'Activer'} dtection auto
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const success = await restartAdb();
                          showNotification(success ? 'success' : 'error', success ? 'Serveur ADB redmarr' : 'Erreur lors du redmarrage ADB');
                        }}
                      >
                        Redmarrer ADB
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const logs = getAdbLogs().join('\n');
                          navigator.clipboard.writeText(logs);
                          showNotification('success', 'Logs copis dans le presse-papier');
                        }}
                      >
                        Copier logs
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>tat:</strong> {adbConnectionState.isConnected ? '✅ Connect' : '❌ Dconnect'}
                    </div>
                    <div>
                      <strong>Dtection auto:</strong> {adbConnectionState.autoDetectionEnabled ? '✅ Active' : '❌ Dsactive'}
                    </div>
                    {adbConnectionState.device && (
                      <>
                        <div>
                          <strong>Appareil:</strong> {adbConnectionState.device.name}
                        </div>
                        <div>
                          <strong>Srie:</strong> {adbConnectionState.device.serial}
                        </div>
                      </>
                    )}
                    {adbConnectionState.batteryLevel && (
                      <div>
                        <strong>Batterie:</strong> {adbConnectionState.batteryLevel}% {adbConnectionState.isCharging ? '🔌' : '🔋'}
                      </div>
                    )}
                  </div>

                  {adbConnectionState.error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <strong className="text-red-600">Erreur:</strong> {adbConnectionState.error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="font-medium">Logs en temps rel:</h3>
                    <div className="bg-muted/50 rounded-lg p-3 max-h-96 overflow-y-auto hide-scrollbar font-mono text-xs">
                      {getAdbLogs().length > 0 ? (
                        getAdbLogs().map((log, index) => (
                          <div key={index} className="mb-1">
                            {log}
                          </div>
                        ))
                      ) : (
                        <div className="text-muted-foreground">Aucun log disponible</div>
                      )}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Modal Cal.com */}
          <CalendarModal
            open={isCalendarModalOpen}
            onOpenChange={setIsCalendarModalOpen}
            contact={selectedContact || undefined}
            theme={resolvedTheme}
            onSuccess={handleCalendarSuccess}
          />

          {/* Modal de configuration Cal.com */}
          {isCalcomConfigOpen && (
            <Dialog open={isCalcomConfigOpen} onOpenChange={setIsCalcomConfigOpen}>
              <DialogContent className="sm:max-w-md" aria-describedby="calcom-config-desc">
                <DialogHeader>
                  <DialogTitle>Configuration Cal.com</DialogTitle>
                  <DialogDescription id="calcom-config-desc">
                    Configurez l'URL de votre compte Cal.com pour la prise de rendez-vous.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="calcom-url" className="text-sm font-medium">
                      URL Cal.com
                    </label>
                    <input
                      id="calcom-url"
                      type="url"
                      defaultValue={calcomUrl}
                      placeholder="https://cal.com/votre-nom/votre-vnement"
                      className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          if (input.value.trim()) {
                            handleSaveCalcomUrl(input.value.trim());
                          }
                        }
                      }}
                    />
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p> Utilisez l'URL complte de votre vnement Cal.com</p>
                    <p> Format: https://cal.com/votre-nom/votre-vnement</p>
                    <p> Les paramtres du contact seront ajouts automatiquement</p>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsCalcomConfigOpen(false)}>
                    Annuler
                  </Button>
                  <Button
                    onClick={() => {
                      const input = document.getElementById('calcom-url') as HTMLInputElement;
                      if (input?.value.trim()) {
                        handleSaveCalcomUrl(input.value.trim());
                      }
                    }}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Sauvegarder
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Pop-up de dconnexion Supabase */}
          <SupabaseDisconnectDialog
            open={!!auth.disconnectInfo}
            info={auth.disconnectInfo}
            onClose={auth.clearDisconnectInfo}
            onRetry={async () => {
              const ok = await auth.requestSessionRefresh();
              if (ok) {
                auth.clearDisconnectInfo();
              }
            }}
          />

          {/* Dialog de confirmation de mise à jour */}
          <UpdateConfirmationDialog
            isOpen={isUpdateConfirmationOpen}
            onClose={() => setIsUpdateConfirmationOpen(false)}
            onConfirm={installUpdate}
            updateInfo={updateState.updateInfo}
          />

          {/* Dialog de confirmation de suppression des donnes */}
          <Dialog open={isClearDataDialogOpen} onOpenChange={setIsClearDataDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Supprimer toutes les donnes</DialogTitle>
                <DialogDescription>
                  Cette action supprimera dfinitivement tous les contacts imports dans la table.
                  Cette action ne peut pas tre annule.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsClearDataDialogOpen(false)}>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={confirmClearData}>
                  Supprimer tout
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog d'dition des onglets */}
          <TabEditDialog
            isOpen={isTabEditDialogOpen}
            onClose={() => {
              setIsTabEditDialogOpen(false)
              setEditingTab(null)
            }}
            onSave={handleSaveTab}
            currentName={editingTab?.name || ''}
            currentColor={editingTab?.color || '#3b82f6'}
          />

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default App;



