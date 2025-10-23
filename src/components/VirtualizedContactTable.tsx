import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { Contact, ContactStatus, CallStates, Theme } from '../types';
import { QUICK_COMMENTS, TABLE_HEADER_ICONS, DEFAULT_COLUMN_ORDER } from '../constants';
import { cn } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import {
  Phone, User, Mail, MessageCircle, Clock, Calendar as CalendarIcon, FileText, ArrowUpDown,
  ArrowUp, ArrowDown, Zap, Hourglass, Users, Hash, FolderOpen, X, Bell
} from 'lucide-react';
import { ReminderDialog } from './ReminderDialog';
import StatusSelect from './StatusSelect';
import { formatPhoneNumber } from '../services/dataService';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TableRowMemo } from './table/optimized/TableRow.memo';
import { TableCellMemo } from './table/optimized/TableCell.memo';
import { useStableRenderers } from './table/optimized/useStableRenderers';

// Storage keys
const COLUMN_ORDER_STORAGE_KEY = 'dimicall-column-order';
const COLUMN_ORDER_VERSION_KEY = 'dimicall-column-order-version';
const COLUMN_ORDER_VERSION = '3.0';
const SORT_CONFIG_STORAGE_KEY = 'dimicall-sort-config';

// Column configuration
interface ColumnConfig {
  id: string;
  key: keyof Contact | 'index';
  label: string;
  icon: React.ComponentType<any>;
  width?: string;
  minWidth?: string;
  canHide: boolean;
  canSort: boolean;
  defaultVisible: boolean;
  calculatedWidth?: string;
}

type SortDirection = 'asc' | 'desc' | null;

const INPUT_BASE_CLASS = "h-8 px-2 text-xs border border-border/50 rounded-md bg-background/80 focus:bg-background focus:border-primary/50 transition-colors";

// Comment Widget Component
interface CommentWidgetProps {
  value: string;
  onChange: (newComment: string) => void;
  theme: Theme;
}

const CommentWidget: React.FC<CommentWidgetProps> = ({ value, onChange }) => {
  const [comment, setComment] = React.useState(value);
  useEffect(() => { setComment(value); }, [value]);
  const handleBlur = () => { if (comment !== value) onChange(comment); };
  const insertQuickComment = (quickComment: string) => {
    const newComment = (comment ? comment + " " : "") + quickComment;
    setComment(newComment);
    onChange(newComment);
  };
  return (
    <div className="flex items-center space-x-1 w-full">
      <Input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onBlur={handleBlur}
        placeholder="Commentaire..."
        className={`${INPUT_BASE_CLASS} flex-1 min-w-0`}
      />
      <Select onValueChange={insertQuickComment}>
        <SelectTrigger className="h-6 w-6 p-0 border-none bg-transparent hover:bg-muted/50 rounded-sm flex-shrink-0">
          <Zap className="h-3 w-3 text-muted-foreground hover:text-primary transition-colors" />
        </SelectTrigger>
        <SelectContent className="bg-popover border shadow-lg">
          {QUICK_COMMENTS.map(qc => (
            <SelectItem key={qc} value={qc} className="text-xs">
              {qc}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// DateTime Cell Component
interface DateTimeCellProps {
  value: string; 
  type: 'date' | 'time';
  onChange: (newValue: string) => void;
  theme: Theme;
}

const DateTimeCell: React.FC<DateTimeCellProps> = ({ value, type, onChange }) => {
  const [currentValue, setCurrentValue] = React.useState(value);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [isTimeOpen, setIsTimeOpen] = React.useState(false);
  const handleClear = () => { setCurrentValue(''); onChange(''); setIsCalendarOpen(false); setIsTimeOpen(false); };
  useEffect(() => { setCurrentValue(value); }, [value]);

  if (type === 'date') {
    const handleDateSelect = (date: Date | undefined) => {
      if (date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        onChange(`${y}-${m}-${d}`); setSelectedDate(date);
      }
      setIsCalendarOpen(false);
    };
    const displayValue = value ? new Date(value).toLocaleDateString('fr-FR') : '';
    return (
      <div className="flex items-center gap-1">
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" className={cn("h-8 px-2 text-xs justify-start text-left font-normal flex-1", !value && "text-muted-foreground", INPUT_BASE_CLASS)}>
              <CalendarIcon className="mr-2 h-3 w-3" />
              {displayValue || "Sélectionner"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate || (value ? new Date(value) : undefined)}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {value && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={handleClear} title="Supprimer la date">
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  if (type === 'time') {
    const handleTimeSelect = (t: 'hour' | 'minute', timeValue: number) => {
      const parts = currentValue.split(':');
      const hours = t === 'hour' ? timeValue.toString().padStart(2, '0') : (parts[0] || '00');
      const minutes = t === 'minute' ? timeValue.toString().padStart(2, '0') : (parts[1] || '00');
      const newTime = `${hours}:${minutes}`; setCurrentValue(newTime); onChange(newTime);
    };
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);
    return (
      <div className="flex items-center gap-1">
        <Popover open={isTimeOpen} onOpenChange={setIsTimeOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" className={cn("h-8 px-2 text-xs justify-start text-left font-normal flex-1", !value && "text-muted-foreground", INPUT_BASE_CLASS)}>
              <Clock className="mr-2 h-3 w-3" />
              {currentValue || "Heure"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium mb-2">Heures</div>
                <ScrollArea className="h-40">
                  <div className="grid gap-1">
                    {hours.map(hour => (
                      <Button key={hour} variant="ghost" size="sm" className="h-8 text-xs justify-start" onClick={() => handleTimeSelect('hour', hour)}>
                        {hour.toString().padStart(2, '0')}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Minutes</div>
                <ScrollArea className="h-40">
                  <div className="grid gap-1">
                    {minutes.filter((_, i) => i % 5 === 0).map(minute => (
                      <Button key={minute} variant="ghost" size="sm" className="h-8 text-xs justify-start" onClick={() => handleTimeSelect('minute', minute)}>
                        {minute.toString().padStart(2, '0')}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {value && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={handleClear} title="Supprimer l'heure">
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }
  return null;
};

// Interface for exposed methods via ref
export interface ContactTableRef {
  scrollToContact: (contactId: string) => void;
  openImportMapping: (file: File) => Promise<void>;
}

interface ContactTableProps {
  contacts: Contact[];
  callStates: CallStates;
  onSelectContact: (contact: Contact | null) => void;
  selectedContactId: string | null;
  onUpdateContact: (contact: Partial<Contact> & { id: string }) => void;
  onDeleteContact: (contactId: string) => void;
  activeCallContactId: string | null;
  theme: Theme;
  visibleColumns: Record<string, boolean>;
  columnHeaders: string[];
  contactDataKeys: (keyof Contact | null)[];
  onToggleColumnVisibility: (header: string) => void;
  availableColumns?: string[];
  onFileImport?: (file: File) => Promise<void>;
}

export const VirtualizedContactTable = React.forwardRef<ContactTableRef, ContactTableProps>(({ 
  contacts,
  callStates,
  onSelectContact,
  selectedContactId,
  onUpdateContact,
  onDeleteContact,
  activeCallContactId,
  theme,
  visibleColumns,
  columnHeaders,
  contactDataKeys,
  onToggleColumnVisibility,
  availableColumns = [],
  onFileImport,
}, ref) => {
  const [editingCell, setEditingCell] = React.useState<{ contactId: string; field: keyof Contact } | null>(null);
  const [editValue, setEditValue] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof Contact | null; direction: SortDirection }>({ key: null, direction: null });
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(false);
  const [reminderDialog, setReminderDialog] = React.useState<{ isOpen: boolean; contact: Contact | null; }>({ isOpen: false, contact: null });

  // Create dynamic columns based on props
  const dynamicColumns = useMemo((): ColumnConfig[] => {
    return columnHeaders.map((header, index) => {
      const dataKey = contactDataKeys[index];
      const headerToIdMap: Record<string, string> = {
        '#': 'numeroLigne', 'Sexe': 'sexe', 'Prénom': 'prenom', 'Nom': 'nom', 'Téléphone': 'telephone', 'Mail': 'email', 'Source': 'source', 'Statut': 'statut', 'Commentaire': 'commentaire', 'Date Rappel': 'dateRappel', 'Heure Rappel': 'heureRappel', 'Date RDV': 'dateRDV', 'Heure RDV': 'heureRDV', 'Date Appel': 'dateAppel', 'Heure Appel': 'heureAppel', 'Durée Appel': 'dureeAppel', 'Don': 'don', 'Qualité': 'qualite', 'Type': 'type', 'Date': 'date', 'UID': 'uid'
      };
      const iconMap: Record<string, React.ComponentType<any>> = {
        '#': Hash, 'Prénom': User, 'Nom': User, 'Téléphone': Phone, 'Mail': Mail, 'Source': FolderOpen, 'Statut': FileText, 'Commentaire': MessageCircle, 'Date Rappel': CalendarIcon, 'Heure Rappel': Clock, 'Date RDV': CalendarIcon, 'Heure RDV': Clock, 'Date Appel': CalendarIcon, 'Heure Appel': Clock, 'Durée Appel': Hourglass, 'Sexe': User, 'Don': User, 'Qualité': User, 'Type': User, 'Date': CalendarIcon, 'UID': User
      };
      return {
        id: headerToIdMap[header] || header.toLowerCase(),
        key: (dataKey || 'index') as keyof Contact | 'index',
        label: header,
        icon: iconMap[header] || FileText,
        width: header === 'Lien' ? '200px' : 'auto',
        minWidth: header === '#' ? '60px' : header.includes('Téléphone') || header.includes('Mail') ? '150px' : '100px',
        canHide: !['#', 'Prénom', 'Nom', 'Commentaire'].includes(header),
        canSort: true,
        defaultVisible: true,
      };
    });
  }, [columnHeaders, contactDataKeys]);

  const enforcedColumnIds = useMemo(() => {
    if (dynamicColumns.length === 0) return [];
    const enforcedLabels = ['#', ...DEFAULT_COLUMN_ORDER, 'Don', 'Date', 'UID'];
    const enforcedIds = enforcedLabels.map(label => dynamicColumns.find(col => col.label === label)?.id).filter((id): id is string => Boolean(id));
    const remainingIds = dynamicColumns.map(col => col.id).filter(id => !enforcedIds.includes(id));
    return [...enforcedIds, ...remainingIds];
  }, [dynamicColumns]);

  // Load/Save column order
  useEffect(() => {
    if (enforcedColumnIds.length === 0) return;
    try {
      const savedVersion = localStorage.getItem(COLUMN_ORDER_VERSION_KEY);
      if (savedVersion !== COLUMN_ORDER_VERSION) {
        localStorage.setItem(COLUMN_ORDER_VERSION_KEY, COLUMN_ORDER_VERSION);
        localStorage.removeItem(COLUMN_ORDER_STORAGE_KEY);
      }
      localStorage.setItem(COLUMN_ORDER_STORAGE_KEY, JSON.stringify(enforcedColumnIds));
    } catch {}
    setColumnOrder(enforcedColumnIds);
  }, [enforcedColumnIds]);

  useEffect(() => {
    try { if (columnOrder.length > 0) localStorage.setItem(COLUMN_ORDER_STORAGE_KEY, JSON.stringify(columnOrder)); } catch {}
  }, [columnOrder]);

  // Sort handling
  const handleSort = useCallback((key: keyof Contact) => {
    setSortConfig(current => {
      if (current.key === key) {
        const direction = current.direction === 'asc' ? 'desc' : current.direction === 'desc' ? null : 'asc';
        return { key: direction ? key : null, direction };
      } else {
        return { key, direction: 'asc' };
      }
    });
  }, []);

  // Load/Save sort config
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SORT_CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { key: string | null; direction: SortDirection };
        const validKeys = dynamicColumns.map(col => col.key).filter((k): k is keyof Contact => k !== 'index');
        if (parsed && (parsed.key === null || (typeof parsed.key === 'string' && (validKeys as string[]).includes(parsed.key))) && (parsed.direction === 'asc' || parsed.direction === 'desc' || parsed.direction === null)) {
          setSortConfig({ key: parsed.key as keyof Contact | null, direction: parsed.direction });
        }
      }
    } catch {}
  }, [dynamicColumns]);

  useEffect(() => { try { localStorage.setItem(SORT_CONFIG_STORAGE_KEY, JSON.stringify(sortConfig)); } catch {} }, [sortConfig]);

  // Sort contacts (stable memo)
  const sortedContacts = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return contacts;
    return [...contacts].sort((a, b) => {
      const aVal = a[sortConfig.key!];
      const bVal = b[sortConfig.key!];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal, 'fr-FR') : bVal.localeCompare(aVal, 'fr-FR');
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [contacts, sortConfig]);

  // Virtualization setup
  const rowVirtualizer = useVirtualizer({
    count: sortedContacts.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    scrollToContact: (contactId: string) => {
      if (!scrollContainerRef.current) return;
      const contactRow = scrollContainerRef.current.querySelector(`[data-contact-id="${contactId}"]`);
      if (contactRow) {
        contactRow.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        return;
      }
      const contactIndex = sortedContacts.findIndex(c => c.id === contactId);
      if (contactIndex === -1) return;
      const rowHeight = 40; const targetPosition = contactIndex * rowHeight; const container = scrollContainerRef.current; const containerHeight = container.clientHeight; const scrollTop = container.scrollTop;
      const isVisible = targetPosition >= scrollTop && targetPosition <= scrollTop + containerHeight - rowHeight;
      if (!isVisible) {
        const margin = 80; const scrollPosition = Math.max(0, targetPosition - margin);
        container.scrollTo({ top: scrollPosition, behavior: 'smooth' });
      }
    },
    openImportMapping: async () => {}
  }), [sortedContacts]);

  // Auto scroll on selection
  useEffect(() => {
    if (selectedContactId) {
      const timeoutId = setTimeout(() => {
        const el = scrollContainerRef.current?.querySelector(`[data-contact-id="${selectedContactId}"]`) as HTMLElement | null;
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedContactId]);

  // Cell editing
  const handleCellDoubleClick = (contactId: string, columnKey: keyof Contact, currentValue: any) => {
    const nonEditableFields: (keyof Contact)[] = ['statut', 'commentaire', 'dateRappel', 'heureRappel', 'dateRDV', 'heureRDV', 'dateAppel', 'heureAppel', 'dureeAppel'];
    if (nonEditableFields.includes(columnKey)) return;
    setEditingCell({ contactId, field: columnKey });
    setEditValue(currentValue || '');
  };

  const handleEditCommit = () => {
    if (editingCell) {
      onUpdateContact({ id: editingCell.contactId, [editingCell.field]: editValue });
      setEditingCell(null); setEditValue('');
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleEditCommit();
    else if (e.key === 'Escape') { setEditingCell(null); setEditValue(''); }
  };

  // Reminder dialog handlers
  const handleOpenReminderDialog = (contact: Contact) => setReminderDialog({ isOpen: true, contact });
  const handleCloseReminderDialog = () => setReminderDialog({ isOpen: false, contact: null });
  const handleSaveReminder = (date: string, time: string) => { if (reminderDialog.contact) onUpdateContact({ id: reminderDialog.contact.id, dateRappel: date, heureRappel: time }); };

  // Stable cell renderer
  const renderCellContent = useCallback((contact: Contact, column: ColumnConfig) => {
    const columnKey = column.key as keyof Contact;
    if (column.id === 'index') {
      const index = contacts.findIndex(c => c.id === contact.id) + 1;
      return <span className="cursor-pointer hover:text-primary transition-colors font-medium text-center block">{index}</span>;
    }
    const value = contact[columnKey];
    if (editingCell && editingCell.contactId === contact.id && editingCell.field === columnKey) {
      return (
        <Input className={INPUT_BASE_CLASS} value={editValue} autoFocus onChange={(e) => setEditValue(e.target.value)} onBlur={handleEditCommit} onKeyDown={handleEditKeyDown} />
      );
    }
    switch (columnKey) {
      case 'prenom':
      case 'nom':
        return <span className="cursor-pointer hover:text-primary transition-colors font-medium">{value || 'N/A'}</span>;
      case 'telephone':
        return <span className="cursor-pointer hover:text-primary transition-colors font-mono">{value ? formatPhoneNumber(value as string) : 'N/A'}</span>;
      case 'email':
        return <span className="cursor-pointer hover:text-primary transition-colors truncate" title={value as string}>{value || 'N/A'}</span>;
      case 'source':
        return <span className="cursor-pointer hover:text-primary transition-colors">{value || 'N/A'}</span>;
      case 'statut': {
        const currentStatus = (value as ContactStatus) || ContactStatus.NonDefini;
        return (
          <StatusSelect
            value={currentStatus}
            onChange={(newStatus) => { onUpdateContact({ id: contact.id, statut: newStatus }); }}
            triggerClassName="border-none bg-transparent p-0 h-auto"
            contentClassName="bg-popover border shadow-lg"
            size="sm"
          />
        );
      }
      case 'commentaire':
        return <CommentWidget value={(value as string) || ''} onChange={(newComment) => onUpdateContact({ id: contact.id, commentaire: newComment })} theme={theme} />;
      case 'dateRappel':
        return (
          <div className="flex items-center justify-center gap-1">
            <DateTimeCell value={(value as string) || ''} type="date" onChange={(newDate) => onUpdateContact({ id: contact.id, [columnKey]: newDate })} theme={theme} />
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" title="Programmer un rappel" onClick={(event) => { event.stopPropagation(); handleOpenReminderDialog(contact); }}>
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        );
      case 'dateRDV':
      case 'dateAppel':
        return <DateTimeCell value={(value as string) || ''} type="date" onChange={(newDate) => onUpdateContact({ id: contact.id, [columnKey]: newDate })} theme={theme} />;
      case 'heureRappel':
      case 'heureRDV':
      case 'heureAppel':
        return <DateTimeCell value={(value as string) || ''} type="time" onChange={(newTime) => onUpdateContact({ id: contact.id, [columnKey]: newTime })} theme={theme} />;
      case 'dureeAppel':
        return <span className="cursor-pointer hover:text-primary transition-colors text-center block">{value || 'N/A'}</span>;
      case 'lien':
        return <span className="cursor-pointer hover:text-primary transition-colors truncate block max-w-[180px]" title={value as string}>{value || 'N/A'}</span>;
      default:
        return <span className="cursor-pointer hover:text-primary transition-colors">{value || 'N/A'}</span>;
    }
  }, [contacts, editingCell, editValue, onUpdateContact, theme]);

  const { stableRender } = useStableRenderers((c, k) => {
    const col = visibleOrderedColumns.find(v => v.key === k || (k === 'index' && v.id === 'numeroLigne'));
    // Fallback au renderer complet si besoin
    return col ? renderCellContent(c, col) : null;
  });

  // Visible ordered columns with calculated widths
  const visibleOrderedColumns = useMemo(() => {
    const result = columnOrder.map(id => dynamicColumns.find(col => col.id === id)).filter((col): col is ColumnConfig => col && visibleColumns[col.label] !== false);
    const autoColumns = result.filter(col => col.width === 'auto');
    const fixedColumns = result.filter(col => col.width !== 'auto');
    const fixedWidth = fixedColumns.reduce((sum, col) => { const w = parseInt(col.width || '0'); return sum + (isNaN(w) ? 0 : w); }, 0);
    const remainingWidth = autoColumns.length > 0 ? `calc((100% - ${fixedWidth}px) / ${autoColumns.length})` : '0px';
    return result.map(col => ({ ...col, calculatedWidth: col.width === 'auto' ? remainingWidth : col.width }));
  }, [columnOrder, dynamicColumns, visibleColumns]);

  // Empty state component
  const EmptyState = () => (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <Card className="w-full max-w-md"><CardContent className="p-6"><div className="flex flex-col items-center text-center gap-3"><div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><Users className="w-6 h-6 text-muted-foreground" /></div><h3 className="text-lg font-semibold">Aucun contact</h3><p className="text-sm text-muted-foreground">Importez un fichier pour commencer.</p><div className="flex items-center gap-2 mt-2"><Button size="sm" onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.csv,.tsv,.xlsx,.xls'; input.onchange = async (e) => { const files = (e.target as HTMLInputElement).files; if (files && files.length > 0 && onFileImport) { await onFileImport(files[0]); } }; input.click(); }}>Importer des contacts</Button><span className="text-xs text-muted-foreground">ou glissez-déposez un fichier (.csv, .xlsx)</span></div></div></CardContent></Card>
    </div>
  );

  return (
    <>
      <div className="contact-table-container h-full">
        <div ref={scrollContainerRef} className="border rounded-t-lg scrollbar-hidden relative bg-background transition-all duration-300 h-full overflow-x-auto" style={{ position: 'relative', height: '100%', overflow: 'auto', display: 'block' }}>
          <AnimatePresence mode="wait">
            {contacts.length === 0 ? (
              <EmptyState key="empty" />
            ) : (
              <div className="relative w-full min-w-[560px] md:min-w-0">
                {/* Header */}
                <div className="sticky top-0 z-[101] bg-background border-b" style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', willChange: 'transform', transform: 'translateZ(0)' }}>
                  <div className="flex border-b">
                    {visibleOrderedColumns.map((column) => (
                      <div key={column.id} className={cn("text-foreground h-16 flex items-center justify-center px-2 py-1.5 text-center font-medium text-xs select-none transition-all duration-200 border-r last:border-r-0 flex-shrink-0", column.canSort ? "cursor-pointer hover:bg-muted" : "")} style={{ width: column.calculatedWidth, minWidth: column.minWidth, maxWidth: column.calculatedWidth, boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 8px 0px, rgba(0, 0, 0, 0.1) 0px 1px 4px -1px' }} onClick={() => { if (column.canSort && column.key !== 'index') { handleSort(column.key as keyof Contact); } }}>
                        <div className="flex flex-col items-center justify-center gap-1 min-h-[40px]">
                          <div className="flex items-center justify-center gap-1 w-full">
                            <span className="inline-flex items-center gap-1.5 truncate text-xs font-medium [&>svg]:w-3.5 [&>svg]:h-3.5 [&>svg]:text-muted-foreground">
                              {TABLE_HEADER_ICONS[column.label]}
                              <span className="truncate">{column.label}</span>
                            </span>
                            {column.canSort && sortConfig.key === column.key && (<>{sortConfig.direction === 'asc' && <ArrowUp className="w-3 h-3 text-muted-foreground/50" />}{sortConfig.direction === 'desc' && <ArrowDown className="w-3 h-3 text-muted-foreground/50" />}{!sortConfig.direction && <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />}</>)}
                            {column.canSort && sortConfig.key !== column.key && (<ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Body with virtualization */}
                <div style={{ position: 'relative', height: `${rowVirtualizer.getTotalSize()}px` }}>
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const contact = sortedContacts[virtualRow.index];
                    const isSelected = selectedContactId === contact.id;
                    const isActiveCall = activeCallContactId === contact.id;
                    return (
                      <div key={contact.id} data-contact-id={contact.id} data-index={virtualRow.index} className={cn("flex border-b cursor-pointer transition-colors duration-150", !isSelected && "hover:bg-muted/50", isSelected && "bg-blue-500/20 dark:bg-blue-500/30 text-foreground", isActiveCall && (!isSelected ? (theme === Theme.Dark ? "bg-green-900/20 hover:bg-green-900/30" : "bg-green-100 hover:bg-green-200") : ""))} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }} onClick={() => onSelectContact(contact)}>
                        {visibleOrderedColumns.map(column => (
                          <div key={column.id} className={cn("px-2 py-1.5 text-xs text-center flex items-center justify-center border-r last:border-r-0 flex-shrink-0")} style={{ width: column.calculatedWidth, minWidth: column.minWidth, maxWidth: column.calculatedWidth }} onDoubleClick={() => { if (column.key !== 'index') { handleCellDoubleClick(contact.id, column.key as keyof Contact, contact[column.key as keyof Contact]); } }}>
                            <div className="flex items-center justify-center min-h-[32px] w-full">
                              <TableCellMemo contact={contact} columnKey={column.key} render={(c) => stableRender(c, column.key)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {reminderDialog.contact && (
        <ReminderDialog isOpen={reminderDialog.isOpen} onClose={handleCloseReminderDialog} contact={reminderDialog.contact} initialDate={reminderDialog.contact.dateRappel} initialTime={reminderDialog.contact.heureRappel} onSave={handleSaveReminder} />
      )}
    </>
  );
});

VirtualizedContactTable.displayName = 'VirtualizedContactTable';
