import React, { useState, useCallback, useMemo, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
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
import { useDebouncedUpdate } from '../hooks/useDebouncedUpdate';

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
}

type SortDirection = 'asc' | 'desc' | null;

const INPUT_BASE_CLASS = "h-8 px-3 py-1 text-sm border-0 bg-transparent focus:bg-accent/50 transition-colors";

// Shadcn Table Classes Constants
const SHADCN_STYLES = {
  // Container
  tableContainer: "rounded-md border bg-background",
  
  // Header
  tableHeader: "sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
  headerRow: "flex border-b",
  headerCell: "h-10 flex items-center px-3 py-2 text-left text-xs font-medium text-muted-foreground select-none transition-colors",
  headerCellSortable: "cursor-pointer hover:bg-muted/50",
  headerCellFirst: "first:rounded-tl-md",
  headerCellLast: "last:rounded-tr-md",
  
  // Body
  tableBody: "relative",
  bodyRow: "flex border-b border-border hover:bg-muted/50 cursor-pointer transition-colors",
  bodyRowSelected: "bg-accent text-accent-foreground",
  bodyRowActiveCall: "bg-green-50 hover:bg-green-100 dark:bg-green-950/50 dark:hover:bg-green-950/80",
  bodyCell: "px-3 py-2 text-sm flex items-center flex-shrink-0",
  
  // Sort Icons
  sortIcon: "h-3 w-3 text-muted-foreground transition-colors",
  sortIconInactive: "h-3 w-3 text-muted-foreground/40",
  sortIconContainer: "flex items-center ml-2"
} as const;

// Shadcn Spacing Configuration
const SHADCN_SPACING = {
  headerHeight: 40,      // h-10 in pixels
  rowHeight: 36,         // Compact row height
  cellPadding: 'px-3 py-2',
  iconSize: 'h-3 w-3',
  headerIconSize: 'h-3.5 w-3.5'
} as const;

// Column Resize Configuration
const COLUMN_RESIZE_CONFIG = {
  // Fixed-width columns (never resize)
  fixed: {
    '#': 50,
    'Statut': 120,
    'Date Rappel': 110,
    'Heure Rappel': 80,
    'Date RDV': 110,
    'Heure RDV': 80,
    'Date Appel': 110,
    'Heure Appel': 80,
    'Durée Appel': 70,
    'Sexe': 60,
    'Don': 60,
    'Type': 80,
    'Qualité': 80,
    'Date': 100,
    'UID': 100
  },
  
  // Flexible columns (grow/shrink proportionally)
  flexible: {
    'Prénom': { min: 100, preferred: 140, grow: 1 },
    'Nom': { min: 100, preferred: 140, grow: 1 },
    'Téléphone': { min: 120, preferred: 150, grow: 0.5 },
    'Mail': { min: 180, preferred: 250, grow: 2 },
    'Source': { min: 100, preferred: 140, grow: 0.8 },
    'Commentaire': { min: 250, preferred: 350, grow: 3 },
    'Lien': { min: 140, preferred: 200, grow: 1.5 }
  }
} as const;

// Mobile Column Configuration
const MOBILE_COLUMN_CONFIG = {
  sm: ['#', 'Prénom', 'Nom', 'Statut', 'Commentaire'],
  md: ['#', 'Prénom', 'Nom', 'Téléphone', 'Statut', 'Commentaire', 'Date Rappel'],
  lg: 'all' as const,
  xl: 'all' as const
};

type ScreenSize = 'sm' | 'md' | 'lg' | 'xl';

// Responsive Columns Hook
const useResponsiveColumns = (): ScreenSize => {
  const [screenSize, setScreenSize] = useState<ScreenSize>('lg');
  
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) setScreenSize('sm');
      else if (width < 1024) setScreenSize('md');
      else if (width < 1280) setScreenSize('lg');
      else setScreenSize('xl');
    };
    
    updateScreenSize();
    
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScreenSize, 150);
    };
    
    window.addEventListener('resize', debouncedResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
    };
  }, []);
  
  return screenSize;
};

// Get visible columns for screen size
const getVisibleColumnsForScreenSize = (
  columns: ColumnConfig[],
  screenSize: ScreenSize
): ColumnConfig[] => {
  const allowedColumns = MOBILE_COLUMN_CONFIG[screenSize];
  
  if (allowedColumns === 'all') {
    return columns;
  }
  
  return columns.filter(col => allowedColumns.includes(col.label));
};

// Comment Widget Component - Memoized for performance
interface CommentWidgetProps {
  value: string;
  onChange: (newComment: string) => void;
  theme: Theme;
}

const CommentWidget = React.memo<CommentWidgetProps>(({ value, onChange, theme }) => {
  const [comment, setComment] = useState(value);

  useEffect(() => {
    setComment(value);
  }, [value]);

  const handleBlur = () => {
    if (comment !== value) {
      onChange(comment);
    }
  };

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
}, (prevProps, nextProps) => {
  // Only re-render if value or theme changes
  return prevProps.value === nextProps.value && prevProps.theme === nextProps.theme;
});

// DateTime Cell Component - Memoized for performance
interface DateTimeCellProps {
  value: string; 
  type: 'date' | 'time';
  onChange: (newValue: string) => void;
  theme: Theme;
}

const DateTimeCell = React.memo<DateTimeCellProps>(({ value, type, onChange, theme }) => {
  const [currentValue, setCurrentValue] = useState(value);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);

  const handleClear = () => {
    setCurrentValue('');
    onChange('');
    setIsCalendarOpen(false);
    setIsTimeOpen(false);
  };

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  if (type === 'date') {
    const handleDateSelect = (date: Date | undefined) => {
      if (date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        onChange(formattedDate);
        setSelectedDate(date);
      }
      setIsCalendarOpen(false);
    };

    const displayValue = value ? new Date(value).toLocaleDateString('fr-FR') : '';

    return (
      <div className="flex items-center gap-1">
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-8 px-2 text-xs justify-start text-left font-normal flex-1",
                !value && "text-muted-foreground",
                INPUT_BASE_CLASS
              )}
            >
              <CalendarIcon className="mr-2 h-3 w-3" />
              {displayValue || "Sélectionner"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={selectedDate || (value ? new Date(value) : undefined)}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleClear}
            title="Supprimer la date"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  if (type === 'time') {
    const handleTimeSelect = (type: 'hour' | 'minute', timeValue: number) => {
      const parts = currentValue.split(':');
      const hours = type === 'hour' ? timeValue.toString().padStart(2, '0') : (parts[0] || '00');
      const minutes = type === 'minute' ? timeValue.toString().padStart(2, '0') : (parts[1] || '00');
      const newTime = `${hours}:${minutes}`;
      setCurrentValue(newTime);
      onChange(newTime);
    };

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    return (
      <div className="flex items-center gap-1">
        <Popover open={isTimeOpen} onOpenChange={setIsTimeOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-8 px-2 text-xs justify-start text-left font-normal flex-1",
                !value && "text-muted-foreground",
                INPUT_BASE_CLASS
              )}
            >
              <Clock className="mr-2 h-3 w-3" />
              {currentValue || "Heure"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="center">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium mb-2">Heures</div>
                <ScrollArea className="h-40">
                  <div className="grid gap-1">
                    {hours.map(hour => (
                      <Button
                        key={hour}
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs justify-start"
                        onClick={() => handleTimeSelect('hour', hour)}
                      >
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
                      <Button
                        key={minute}
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs justify-start"
                        onClick={() => handleTimeSelect('minute', minute)}
                      >
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
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleClear}
            title="Supprimer l'heure"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return null;
}, (prevProps, nextProps) => {
  // Only re-render if value, type, or theme changes
  return (
    prevProps.value === nextProps.value &&
    prevProps.type === nextProps.type &&
    prevProps.theme === nextProps.theme
  );
});


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

export const VirtualizedContactTable = forwardRef<ContactTableRef, ContactTableProps>(({
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
  const [editingCell, setEditingCell] = useState<{ contactId: string; field: keyof Contact } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Contact | null; direction: SortDirection }>({
    key: null,
    direction: null,
  });

  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(false);

  const [reminderDialog, setReminderDialog] = useState<{
    isOpen: boolean;
    contact: Contact | null;
  }>({
    isOpen: false,
    contact: null
  });

  // Responsive screen size
  const screenSize = useResponsiveColumns();

  // Debounced updates for better performance
  const { debouncedCommentUpdate, debouncedDateUpdate, debouncedTextUpdate } = useDebouncedUpdate({
    onUpdateContact,
    delays: {
      comment: 300,  // 300ms for comments
      date: 500,     // 500ms for dates
      text: 1000     // 1000ms for text fields
    }
  });

  // Create dynamic columns based on props
  const dynamicColumns = useMemo((): ColumnConfig[] => {
    return columnHeaders.map((header, index) => {
      const dataKey = contactDataKeys[index];
      const headerToIdMap: Record<string, string> = {
        '#': 'numeroLigne',
        'Sexe': 'sexe',
        'Prénom': 'prenom',
        'Nom': 'nom',
        'Téléphone': 'telephone',
        'Mail': 'email',
        'Source': 'source',
        'Statut': 'statut',
        'Commentaire': 'commentaire',
        'Date Rappel': 'dateRappel',
        'Heure Rappel': 'heureRappel',
        'Date RDV': 'dateRDV',
        'Heure RDV': 'heureRDV',
        'Date Appel': 'dateAppel',
        'Heure Appel': 'heureAppel',
        'Durée Appel': 'dureeAppel',
        'Don': 'don',
        'Qualité': 'qualite',
        'Type': 'type',
        'Date': 'date',
        'UID': 'uid'
      };

      const iconMap: Record<string, React.ComponentType<any>> = {
        '#': Hash,
        'Prénom': User,
        'Nom': User,
        'Téléphone': Phone,
        'Mail': Mail,
        'Source': FolderOpen,
        'Statut': FileText,
        'Commentaire': MessageCircle,
        'Date Rappel': CalendarIcon,
        'Heure Rappel': Clock,
        'Date RDV': CalendarIcon,
        'Heure RDV': Clock,
        'Date Appel': CalendarIcon,
        'Heure Appel': Clock,
        'Durée Appel': Hourglass,
        'Sexe': User,
        'Don': User,
        'Qualité': User,
        'Type': User,
        'Date': CalendarIcon,
        'UID': User,
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
    if (dynamicColumns.length === 0) {
      return [];
    }

    const enforcedLabels = ['#', ...DEFAULT_COLUMN_ORDER, 'Don', 'Date', 'UID'];
    const enforcedIds = enforcedLabels
      .map(label => dynamicColumns.find(col => col.label === label)?.id)
      .filter((id): id is string => Boolean(id));

    const remainingIds = dynamicColumns
      .map(col => col.id)
      .filter(id => !enforcedIds.includes(id));

    return [...enforcedIds, ...remainingIds];
  }, [dynamicColumns]);

  // Load saved column order
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

  // Save column order
  useEffect(() => {
    try {
      if (columnOrder.length > 0) {
        localStorage.setItem(COLUMN_ORDER_STORAGE_KEY, JSON.stringify(columnOrder));
      }
    } catch {}
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

  // Load saved sort config
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SORT_CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { key: string | null; direction: SortDirection };
        const validKeys = dynamicColumns
          .map(col => col.key)
          .filter((k): k is keyof Contact => k !== 'index');
        if (parsed && (parsed.key === null || (typeof parsed.key === 'string' && (validKeys as string[]).includes(parsed.key))) &&
            (parsed.direction === 'asc' || parsed.direction === 'desc' || parsed.direction === null)) {
          setSortConfig({ key: parsed.key as keyof Contact | null, direction: parsed.direction });
        }
      }
    } catch {}
  }, [dynamicColumns]);

  // Save sort config
  useEffect(() => {
    try {
      localStorage.setItem(SORT_CONFIG_STORAGE_KEY, JSON.stringify(sortConfig));
    } catch {}
  }, [sortConfig]);

  // Sort contacts
  const sortedContacts = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return contacts;

    return [...contacts].sort((a, b) => {
      const aVal = a[sortConfig.key!];
      const bVal = b[sortConfig.key!];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal, 'fr-FR')
          : bVal.localeCompare(aVal, 'fr-FR');
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [contacts, sortConfig]);

  // Dynamic overscan based on screen size
  const getOverscan = useCallback((screenSize: ScreenSize): number => {
    switch (screenSize) {
      case 'sm': return 5;   // Mobile: fewer rows
      case 'md': return 8;   // Tablet: moderate
      case 'lg': return 10;  // Desktop: more rows
      case 'xl': return 12;  // Wide: most rows
    }
  }, []);

  // Virtualization setup
  const rowVirtualizer = useVirtualizer({
    count: sortedContacts.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => SHADCN_SPACING.rowHeight,
    overscan: getOverscan(screenSize),
  });

  // Scroll to contact function
  const scrollToContact = useCallback((contactId: string) => {
    if (!scrollContainerRef.current) return;

    const contactRow = scrollContainerRef.current.querySelector(`[data-contact-id="${contactId}"]`);
    
    if (contactRow) {
      contactRow.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    } else {
      const contactIndex = sortedContacts.findIndex(contact => contact.id === contactId);
      if (contactIndex === -1) return;

      const rowHeight = 40;
      const targetPosition = contactIndex * rowHeight;
      const container = scrollContainerRef.current;
      const containerHeight = container.clientHeight;
      const scrollTop = container.scrollTop;
      
      const isVisible = targetPosition >= scrollTop && 
                       targetPosition <= scrollTop + containerHeight - rowHeight;
      
      if (!isVisible) {
        const margin = 80;
        const scrollPosition = Math.max(0, targetPosition - margin);
        
        container.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }
    }
  }, [sortedContacts]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    scrollToContact,
    openImportMapping: async (file: File) => {
      // Placeholder for import mapping
    }
  }), [scrollToContact]);

  // Auto scroll on selection
  useEffect(() => {
    if (selectedContactId && shouldAutoScrollRef.current) {
      const timeoutId = setTimeout(() => {
        scrollToContact(selectedContactId);
        shouldAutoScrollRef.current = false;
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedContactId, scrollToContact]);

  // Cell editing
  const handleCellDoubleClick = (contactId: string, columnKey: keyof Contact, currentValue: any) => {
    const nonEditableFields: (keyof Contact)[] = [
      'statut', 'commentaire', 'dateRappel', 'heureRappel', 'dateRDV', 'heureRDV', 'dateAppel', 'heureAppel', 'dureeAppel'
    ];

    if (nonEditableFields.includes(columnKey)) return;
    setEditingCell({ contactId, field: columnKey });
    setEditValue(currentValue || '');
  };

  const handleEditCommit = () => {
    if (editingCell) {
      onUpdateContact({
        id: editingCell.contactId,
        [editingCell.field]: editValue,
      });
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleEditCommit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  // Reminder dialog handlers
  const handleOpenReminderDialog = (contact: Contact) => {
    setReminderDialog({
      isOpen: true,
      contact: contact
    });
  };

  const handleCloseReminderDialog = () => {
    setReminderDialog({
      isOpen: false,
      contact: null
    });
  };

  const handleSaveReminder = (date: string, time: string) => {
    if (reminderDialog.contact) {
      onUpdateContact({
        id: reminderDialog.contact.id,
        dateRappel: date,
        heureRappel: time
      });
    }
  };


  // Render cell content
  const renderCellContent = (contact: Contact, column: ColumnConfig) => {
    const columnKey = column.key as keyof Contact;
    
    if (column.id === 'index') {
      const index = contacts.findIndex(c => c.id === contact.id) + 1;
      return (
        <span className="cursor-pointer hover:text-primary transition-colors font-medium text-right w-full block">
          {index}
        </span>
      );
    }
    
    const value = contact[columnKey];

    if (editingCell && editingCell.contactId === contact.id && editingCell.field === columnKey) {
      return (
        <Input
          className={INPUT_BASE_CLASS}
          value={editValue}
          autoFocus
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleEditCommit}
          onKeyDown={handleEditKeyDown}
        />
      );
    }

    switch (columnKey) {
      case 'prenom':
      case 'nom':
        return (
          <span className="cursor-pointer hover:text-primary transition-colors font-medium text-left truncate w-full block">
            {value || 'N/A'}
          </span>
        );
        
      case 'telephone':
        return (
          <span className="cursor-pointer hover:text-primary transition-colors font-mono text-left truncate w-full block">
            {value ? formatPhoneNumber(value as string) : 'N/A'}
          </span>
        );

      case 'email':
        return (
          <span 
            className="cursor-pointer hover:text-primary transition-colors truncate text-left w-full block" 
            title={value as string}
          >
            {value || 'N/A'}
          </span>
        );

      case 'source':
        return (
          <span className="cursor-pointer hover:text-primary transition-colors text-left truncate w-full block">
            {value || 'N/A'}
          </span>
        );

      case 'statut': {
        const currentStatus = (value as ContactStatus) || ContactStatus.NonDefini;
        return (
          <div className="w-full min-w-[100px] max-w-full">
            <StatusSelect
              value={currentStatus}
              onChange={(newStatus) => {
                onUpdateContact({
                  id: contact.id,
                  statut: newStatus,
                });
              }}
              triggerClassName="h-7 px-2 text-xs bg-transparent border-0 w-full"
              contentClassName="bg-popover border shadow-lg"
              size="sm"
            />
          </div>
        );
      }

      case 'commentaire':
        return (
          <div className="w-full min-w-0 max-w-full">
            <CommentWidget
              value={(value as string) || ''}
              onChange={(newComment) => {
                // Use debounced update for comments (300ms)
                debouncedCommentUpdate(contact.id, newComment);
              }}
              theme={theme}
            />
          </div>
        );

      case 'dateRappel':
        return (
          <div className="flex items-center gap-1 w-full min-w-0">
            <DateTimeCell
              value={(value as string) || ''}
              type="date"
              onChange={(newDate) => {
                // Use debounced update for dates (500ms)
                debouncedDateUpdate(contact.id, columnKey, newDate);
              }}
              theme={theme}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-primary"
              title="Programmer un rappel"
              onClick={(event) => {
                event.stopPropagation();
                handleOpenReminderDialog(contact);
              }}
            >
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        );

      case 'dateRDV':
      case 'dateAppel':
        return (
          <DateTimeCell
            value={(value as string) || ''}
            type="date"
            onChange={(newDate) => {
              // Use debounced update for dates (500ms)
              debouncedDateUpdate(contact.id, columnKey, newDate);
            }}
            theme={theme}
          />
        );

      case 'heureRappel':
      case 'heureRDV':
      case 'heureAppel':
        return (
          <DateTimeCell
            value={(value as string) || ''}
            type="time"
            onChange={(newTime) => {
              // Use debounced update for time fields (500ms)
              debouncedDateUpdate(contact.id, columnKey, newTime);
            }}
            theme={theme}
          />
        );

      case 'dureeAppel':
        return (
          <span className="cursor-pointer hover:text-primary transition-colors text-right font-mono w-full block">
            {value || 'N/A'}
          </span>
        );

      case 'lien':
        return (
          <span 
            className="cursor-pointer hover:text-primary transition-colors truncate text-left w-full block" 
            title={value as string}
          >
            {value || 'N/A'}
          </span>
        );

      default:
        return (
          <span className="cursor-pointer hover:text-primary transition-colors text-left truncate w-full block">
            {value || 'N/A'}
          </span>
        );
    }
  };

  // Calculate responsive column widths
  const calculateResponsiveWidths = useMemo(() => {
    try {
      const containerWidth = scrollContainerRef.current?.clientWidth || 1200;
      
      // Validation
      const validatedWidth = containerWidth < 320 ? 320 : containerWidth;
      
      // Get visible columns
      let visibleCols = columnOrder
        .map(id => dynamicColumns.find(col => col.id === id))
        .filter((col): col is ColumnConfig => {
          if (!col) return false;
          return visibleColumns[col.label] !== false;
        });
      
      // Apply responsive filtering based on screen size
      visibleCols = getVisibleColumnsForScreenSize(visibleCols, screenSize);
      
      // Step 1: Calculate total width of fixed columns
      const fixedColumns = visibleCols.filter(col => 
        COLUMN_RESIZE_CONFIG.fixed[col.label as keyof typeof COLUMN_RESIZE_CONFIG.fixed]
      );
      
      const fixedWidth = fixedColumns.reduce((sum, col) => 
        sum + (COLUMN_RESIZE_CONFIG.fixed[col.label as keyof typeof COLUMN_RESIZE_CONFIG.fixed] || 0), 0
      );
      
      // Step 2: Calculate available width for flexible columns
      const availableWidth = Math.max(0, validatedWidth - fixedWidth - 20); // 20px margin
      
      // Step 3: Get flexible columns and calculate total weight
      const flexibleColumns = visibleCols.filter(col =>
        COLUMN_RESIZE_CONFIG.flexible[col.label as keyof typeof COLUMN_RESIZE_CONFIG.flexible]
      );
      
      const totalWeight = flexibleColumns.reduce((sum, col) => {
        const config = COLUMN_RESIZE_CONFIG.flexible[col.label as keyof typeof COLUMN_RESIZE_CONFIG.flexible];
        return sum + (config?.grow || 1);
      }, 0);
      
      // Step 4: Distribute available width proportionally
      return visibleCols.map(col => {
        // Fixed column
        const fixedSize = COLUMN_RESIZE_CONFIG.fixed[col.label as keyof typeof COLUMN_RESIZE_CONFIG.fixed];
        if (fixedSize) {
          return { ...col, calculatedWidth: `${fixedSize}px` };
        }
        
        // Flexible column
        const flexConfig = COLUMN_RESIZE_CONFIG.flexible[col.label as keyof typeof COLUMN_RESIZE_CONFIG.flexible];
        if (flexConfig && totalWeight > 0) {
          const proportionalWidth = (availableWidth * flexConfig.grow) / totalWeight;
          const finalWidth = Math.max(
            flexConfig.min,
            Math.min(proportionalWidth, flexConfig.preferred * 1.5)
          );
          return { ...col, calculatedWidth: `${Math.floor(finalWidth)}px` };
        }
        
        // Fallback
        return { ...col, calculatedWidth: '100px' };
      });
    } catch (error) {
      console.error('Column width calculation failed:', error);
      // Fallback to fixed widths
      return columnOrder
        .map(id => dynamicColumns.find(col => col.id === id))
        .filter((col): col is ColumnConfig => {
          if (!col) return false;
          return visibleColumns[col.label] !== false;
        })
        .map(col => ({
          ...col,
          calculatedWidth: '100px'
        }));
    }
  }, [columnOrder, dynamicColumns, visibleColumns, scrollContainerRef.current?.clientWidth, screenSize]);

  // Visible ordered columns with calculated widths
  const visibleOrderedColumns = calculateResponsiveWidths;

  // Empty state component
  const EmptyState = () => (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Aucun contact</h3>
            <p className="text-sm text-muted-foreground">Importez un fichier pour commencer.</p>
            <div className="flex items-center gap-2 mt-2">
              <Button 
                size="sm" 
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.csv,.tsv,.xlsx,.xls';
                  input.onchange = async (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files && files.length > 0 && onFileImport) {
                      await onFileImport(files[0]);
                    }
                  };
                  input.click();
                }}
              >
                Importer des contacts
              </Button>
              <span className="text-xs text-muted-foreground">ou glissez-déposez un fichier (.csv, .xlsx)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      <div className="contact-table-container h-full">
        <div 
          ref={scrollContainerRef}
          className={cn(SHADCN_STYLES.tableContainer, "scrollbar-hidden h-full overflow-auto")}
          style={{
            position: 'relative',
            height: '100%',
            overflow: 'auto',
            display: 'block'
          }}
        >
          <AnimatePresence mode="wait">
            {contacts.length === 0 ? (
              <EmptyState key="empty" />
            ) : (
              <div className="relative w-full min-w-[560px] md:min-w-0">
                {/* Header */}
                <div className={SHADCN_STYLES.tableHeader}>
                  <div className={SHADCN_STYLES.headerRow}>
                    {visibleOrderedColumns.map((column) => (
                      <div
                        key={column.id}
                        className={cn(
                          SHADCN_STYLES.headerCell,
                          column.canSort && SHADCN_STYLES.headerCellSortable
                        )}
                        style={{ 
                          width: column.calculatedWidth,
                          minWidth: column.calculatedWidth,
                          maxWidth: column.calculatedWidth,
                          flexShrink: 0
                        }}
                        onClick={() => {
                          if (column.canSort && column.key !== 'index') {
                            handleSort(column.key as keyof Contact);
                          }
                        }}
                      >
                        <div className="flex items-center w-full min-w-0">
                          <span className="text-xs font-medium text-muted-foreground truncate flex-1 min-w-0">
                            {column.label}
                          </span>
                          {column.canSort && (
                            <div className="flex items-center ml-1 flex-shrink-0">
                              {sortConfig.key === column.key && sortConfig.direction === 'asc' && (
                                <ArrowUp className={SHADCN_STYLES.sortIcon} />
                              )}
                              {sortConfig.key === column.key && sortConfig.direction === 'desc' && (
                                <ArrowDown className={SHADCN_STYLES.sortIcon} />
                              )}
                              {sortConfig.key !== column.key && (
                                <ArrowUpDown className={SHADCN_STYLES.sortIconInactive} />
                              )}
                            </div>
                          )}
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
                      <div
                        key={contact.id}
                        data-contact-id={contact.id}
                        data-index={virtualRow.index}
                        className={cn(
                          SHADCN_STYLES.bodyRow,
                          isSelected && SHADCN_STYLES.bodyRowSelected,
                          isActiveCall && !isSelected && SHADCN_STYLES.bodyRowActiveCall
                        )}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        onClick={() => {
                          shouldAutoScrollRef.current = true;
                          onSelectContact(contact);
                        }}
                      >
                        {visibleOrderedColumns.map(column => (
                          <div
                            key={column.id}
                            className={cn(SHADCN_STYLES.bodyCell)}
                            style={{ 
                              width: column.calculatedWidth,
                              minWidth: column.calculatedWidth,
                              maxWidth: column.calculatedWidth,
                              flexShrink: 0
                            }}
                            onDoubleClick={() => {
                              if (column.key !== 'index') {
                                handleCellDoubleClick(contact.id, column.key as keyof Contact, contact[column.key as keyof Contact]);
                              }
                            }}
                          >
                            <div className="flex items-center w-full min-w-0 overflow-hidden">
                              {renderCellContent(contact, column)}
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
        <ReminderDialog
          isOpen={reminderDialog.isOpen}
          onClose={handleCloseReminderDialog}
          contact={reminderDialog.contact}
          initialDate={reminderDialog.contact.dateRappel}
          initialTime={reminderDialog.contact.heureRappel}
          onSave={handleSaveReminder}
        />
      )}
    </>
  );
});

VirtualizedContactTable.displayName = 'VirtualizedContactTable';
