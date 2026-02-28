import React, { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Settings, Mail, X, Save, Undo, ChevronDown, ChevronRight, Palette, Calendar, MessageSquare, Sun, Moon, Monitor, Keyboard, RotateCcw, DownloadCloud, Info, CheckCircle, ExternalLink, Columns, FileText, PhoneCall, Plus, Trash2, GripVertical, Folder } from 'lucide-react';
import { BetaOptInSettings } from './BetaOptInSettings';
import { LogsViewer } from './LogsViewer';
import { useAutoUpdate } from '../hooks/useAutoUpdate';
import { DevToolsService } from '../services/devToolsService';
import { BetaPreferencesService, BetaPreferences } from '../services/betaPreferencesService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatePresence, motion } from 'framer-motion';
import { EmailType, SmsType, Civility, Theme, ContactStatus, CallMode } from '../types';
import { useCallMode } from '../context/ModeContext';
import { shortcutService, ShortcutConfig } from '../services/shortcutService';
import { cn } from '../lib/utils';
import { StatusConfigService, StatusConfigMap } from '../services/statusConfigService';
import { useSupabaseShare } from '@/hooks/useSupabaseShare';
import { Server, ShieldAlert } from 'lucide-react';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  calcomUrl?: string;
  onCalcomUrlChange?: (newUrl: string) => void;
  smsTemplate?: string;
  onSmsTemplateChange?: (newTemplate: string) => void;
  theme?: Theme;
  onThemeChange?: (theme: Theme) => void;
}

interface EmailTemplate {
  subject: string;
  body: string;
}

interface EmailTemplates {
  [EmailType.PremierContact]: EmailTemplate;
  [EmailType.D0Visio]: EmailTemplate;
  [EmailType.R0Interne]: EmailTemplate;
  [EmailType.R0Externe]: EmailTemplate;
}

const defaultTemplates: EmailTemplates = {
  [EmailType.PremierContact]: {
    subject: "Arcanis Conseil - Premier Contact",
    body: "Bonjour @titre @nom,\n\nPour resituer mon appel, je suis gérant privé au sein du cabinet de gestion de patrimoine Arcanis Conseil. Je vous envoie l'adresse de notre site web que vous puissiez en savoir d'avantage : https://arcanis-conseil.fr\n\nLe site est avant tout une vitrine, le mieux est de m'appeler si vous souhaitez davantage d'informations ou de prendre un créneau de 30 minutes dans mon agenda via ce lien : https://cal.com/dimitri-morel-arcanis-conseil/audit-patrimonial?overlayCalendar=true\n\nBien à vous,"
  },
  [EmailType.D0Visio]: {
    subject: "Confirmation rendez-vous visio - Arcanis Conseil",
    body: "Bonjour @titre @nom, merci pour votre temps lors de notre échange téléphonique. \n\nSuite à notre appel, je vous confirme @rdv en visio.\n\nPour rappel, notre entretien durera une trentaine de minutes. Le but est de vous présenter plus en détail Arcanis Conseil, d'effectuer ensemble l'état des lieux de votre situation patrimoniale (revenus, patrimoine immobilier, épargne constituée etc.), puis de vous donner un diagnostic de vos leviers. Notre métier est de vous apporter un conseil pertinent et personnalisé sur l'optimisation de votre patrimoine.\n\nJe vous invite à visiter notre site internet pour de plus amples renseignements avant le début de notre échange : www.arcanis-conseil.fr\n\nN'hésitez pas à revenir vers moi en cas de question ou d'un besoin supplémentaire d'information.\n\nBien cordialement"
  },
  [EmailType.R0Interne]: {
    subject: "Confirmation rendez-vous présentiel - Arcanis Conseil",
    body: "Bonjour @titre @nom, merci pour votre temps lors de notre échange téléphonique. \n\nSuite à notre appel, je vous confirme @rdv dans nos locaux au 22 rue la Boétie, 75008 Paris.\n\nPour rappel, notre entretien durera une trentaine de minutes. Le but est de vous présenter plus en détail Arcanis Conseil, d'effectuer ensemble l'état des lieux de votre situation patrimoniale (revenus, patrimoine immobilier, épargne constituée etc.), puis de vous donner un diagnostic de vos leviers. Notre métier est de vous apporter un conseil pertinent et personnalisé sur l'optimisation de votre patrimoine.\n\nJe vous invite à visiter notre site internet pour de plus amples renseignements avant le début de notre échange : www.arcanis-conseil.fr\n\nN'hésitez pas à revenir vers moi en cas de question ou d'un besoin supplémentaire d'information.\n\nBien cordialement"
  },
  [EmailType.R0Externe]: {
    subject: "Confirmation rendez-vous présentiel - Arcanis Conseil",
    body: "Bonjour @titre @nom, merci pour votre temps lors de notre échange téléphonique. \n\nSuite à notre appel, je vous confirme @rdv à @adresse.\n\nPour rappel, notre entretien durera une trentaine de minutes. Le but est de vous présenter plus en détail Arcanis Conseil, d'effectuer ensemble l'état des lieux de votre situation patrimoniale (revenus, patrimoine immobilier, épargne constituée etc.), puis de vous donner un diagnostic de vos leviers. Notre métier est de vous apporter un conseil pertinent et personnalisé sur l'optimisation de votre patrimoine.\n\nJe vous invite à visiter notre site internet pour de plus amples renseignements avant le début de notre échange : www.arcanis-conseil.fr\n\nN'hésitez pas à revenir vers moi en cas de question ou d'un besoin supplémentaire d'information.\n\nBien cordialement"
  }
};

interface SmsTemplates {
  [SmsType.PremierContact]: string;
  [SmsType.D0Visio]: string;
  [SmsType.R0Interne]: string;
  [SmsType.R0Externe]: string;
}

const defaultSmsTemplates: SmsTemplates = {
  [SmsType.PremierContact]: `Bonjour @civilite @nom,

Pour resituer mon appel, je suis gérant privé au sein du cabinet de gestion de patrimoine Arcanis Conseil. Je vous envoie l'adresse de notre site web que vous puissiez en savoir davantage : https://arcanis-conseil.fr

Le site est avant tout une vitrine. Le mieux est de m'appeler si vous souhaitez davantage d'informations ou de prendre un créneau de 30 minutes dans mon agenda via ce lien : https://cal.com/dimitri-morel-arcanis-conseil/audit-patrimonial?overlayCalendar=true

Bien à vous,`,
  [SmsType.D0Visio]: `Bonjour @civilite @nom,

Suite à notre appel, je vous confirme @rdv en visio. Nous prendrons 30 minutes pour faire un point rapide et vous présenter Arcanis Conseil.

À très bientôt,`,
  [SmsType.R0Interne]: `Bonjour @civilite @nom,

Suite à notre appel, je vous confirme @rdv dans nos locaux (22 rue la Boétie, 75008 Paris). Prévoir 30 minutes pour l'entretien.

À très bientôt,`,
  [SmsType.R0Externe]: `Bonjour @civilite @nom,

Suite à notre appel, je vous confirme @rdv à @adresse. Prévoir 30 minutes pour l'entretien.

À très bientôt,`,
};

const smsTypeLabels = {
  [SmsType.PremierContact]: { label: 'Premier Contact', icon: MessageSquare },
  [SmsType.D0Visio]: { label: 'D0 Visio', icon: Calendar },
  [SmsType.R0Interne]: { label: 'R0 Interne', icon: Settings },
  [SmsType.R0Externe]: { label: 'R0 Externe', icon: MessageSquare },
};

const STORAGE_KEY = 'dimicall_email_templates';
const SMS_STORAGE_KEY = 'dimicall_sms_templates';
const COLUMNS_STORAGE_KEY = 'dimicall_column_config';
const COLUMN_ORDER_STORAGE_KEY = 'dimicall-column-order';
const COLUMN_LABELS_STORAGE_KEY = 'dimicall-column-labels';
const MODE_STORAGE_KEY = 'dimicall-call-mode';
const CAL_PROVIDER_STORAGE_KEY = 'dimicall-calendar-provider';

// Configuration par défaut des colonnes
const DEFAULT_COLUMN_CONFIG = {
  '#': { isEssential: true, label: 'Numéro de ligne' },
  'Prénom': { isEssential: true, label: 'Prénom du contact' },
  'Nom': { isEssential: true, label: 'Nom du contact' },
  'Commentaire': { isEssential: true, label: 'Commentaire/Qualification' },
  'Sexe': { isEssential: false, label: 'Sexe du contact' },
  'Téléphone': { isEssential: false, label: 'Numéro de téléphone' },
  'Mail': { isEssential: false, label: 'Adresse email' },
  'Statut': { isEssential: false, label: 'Statut du contact' },
  'Date Rappel': { isEssential: false, label: 'Date de rappel programmée' },
  'Heure Rappel': { isEssential: false, label: 'Heure de rappel programmée' },
  'Date RDV': { isEssential: false, label: 'Date de rendez-vous' },
  'Heure RDV': { isEssential: false, label: 'Heure de rendez-vous' },
  'Date Appel': { isEssential: false, label: 'Date du dernier appel' },
  'Heure Appel': { isEssential: false, label: 'Heure du dernier appel' },
  'Durée Appel': { isEssential: false, label: 'Durée du dernier appel' },
  'Source': { isEssential: false, label: 'Source du contact' },
  'Type': { isEssential: false, label: 'Type de contact' },
  'Qualité': { isEssential: false, label: 'Qualité du contact' },
  'Lien': { isEssential: false, label: 'Lien associé' },
  'Don': { isEssential: false, label: 'Don' },
  'Date': { isEssential: false, label: 'Date (import)' },
  'UID': { isEssential: false, label: 'Identifiant unique (UID)' },
};
const DEFAULT_COLUMN_ORDER_LIST = Object.keys(DEFAULT_COLUMN_CONFIG);
const DEFAULT_COLUMN_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(DEFAULT_COLUMN_CONFIG).map(([key, value]) => [key, value.label])
);

type SettingsCategory = 'templates' | 'calcom' | 'appearance' | 'shortcuts' | 'update' | 'columns' | 'statuses' | 'data-sharing' | 'diagnostic' | 'logs' | 'storage';

const getCategories = (devToolsEnabled: boolean, updateEnabled: boolean = true) => [
  {
    id: 'templates' as SettingsCategory,
    label: 'Templates',
    icon: Mail,
    description: 'Emails et SMS'
  },
  {
    id: 'calcom' as SettingsCategory,
    label: 'Calendrier',
    icon: Calendar,
    description: 'Configuration de vos liens de prise de rendez-vous'
  },
  {
    id: 'appearance' as SettingsCategory,
    label: 'Apparence',
    icon: Palette,
    description: 'Thème et interface'
  },
  {
    id: 'shortcuts' as SettingsCategory,
    label: 'Raccourcis',
    icon: Keyboard,
    description: 'Touches de fonction'
  },
  {
    id: 'columns' as SettingsCategory,
    label: 'Gestion des Colonnes',
    icon: Columns,
    description: 'Configuration de la visibilité des colonnes'
  },
  {
    id: 'statuses' as SettingsCategory,
    label: 'Statuts',
    icon: FileText,
    description: 'Noms et couleurs des statuts'
  },
  {
    id: 'data-sharing' as SettingsCategory,
    label: 'Partage des données',
    icon: Settings,
    description: 'Configuration du partage Supabase'
  },
  // Section Mise à jour visible uniquement si les mises à jour sont activées
  ...(updateEnabled ? [{
    id: 'update' as SettingsCategory,
    label: 'Mises à jour',
    icon: DownloadCloud,
    description: 'Système de mise à jour automatique'
  }] : []),
  // Section Diagnostic visible uniquement si DevTools activés
  ...(devToolsEnabled ? [{
    id: 'diagnostic' as SettingsCategory,
    label: 'Diagnostic',
    icon: Info,
    description: 'Diagnostic du système de mise à jour'
  }] : []),
  // Section Logs visible uniquement si DevTools activés
  ...(devToolsEnabled ? [{
    id: 'logs' as SettingsCategory,
    label: 'Logs',
    icon: FileText,
    description: 'Consulter et copier les logs système'
  }] : []),
  {
    id: 'storage' as SettingsCategory,
    label: 'Stockage',
    icon: Folder,
    description: 'Gestion de l\'espace de stockage'
  }
] as const;

const emailTypeLabels = {
  [EmailType.PremierContact]: { label: 'Premier Contact', icon: Mail },
  [EmailType.D0Visio]: { label: 'D0 Visio', icon: Calendar },
  [EmailType.R0Interne]: { label: 'R0 Interne', icon: Settings },
  [EmailType.R0Externe]: { label: 'R0 Externe', icon: MessageSquare }
};

// Template SMS par défaut
const DEFAULT_SMS_TEMPLATE = `Bonjour @civilite @nom,

Pour resituer mon appel, je suis gérant privé au sein du cabinet de gestion de patrimoine Arcanis Conseil.

Je vous envoie l'adresse de notre site web que vous puissiez en savoir d'avantage :
https://arcanis-conseil.fr

Le site est avant tout une vitrine, le mieux est de m'appeler si vous souhaitez davantage d'informations ou de prendre un créneau de 30 minutes dans mon agenda via ce lien :
https://calendly.com/dimitri-morel-arcanis-conseil/audit

Bien à vous,

Dimitri MOREL - Arcanis Conseil`;

const VARIABLE_REGEX = /(@[a-zA-Z0-9_]+|\{[^}]+\})/g;

const renderHighlightedTemplate = (value: string, allowedKeys: string[]) => {
  const segments: Array<{ type: 'text' | 'var'; content: string }> = [];
  let lastIndex = 0;

  for (const match of value.matchAll(VARIABLE_REGEX)) {
    if (match.index !== undefined && match.index > lastIndex) {
      segments.push({ type: 'text', content: value.slice(lastIndex, match.index) });
    }
    if (match[0]) {
      segments.push({ type: 'var', content: match[0] });
      lastIndex = (match.index ?? 0) + match[0].length;
    }
  }

  if (lastIndex < value.length) {
    segments.push({ type: 'text', content: value.slice(lastIndex) });
  }

  if (!segments.length) {
    return null;
  }

  return segments.map((segment, index) => {
    if (segment.type !== 'var') {
      return <span key={`text-${index}`}>{segment.content}</span>;
    }
    const key = segment.content.startsWith('@')
      ? segment.content.slice(1)
      : segment.content.slice(1, -1);

    if (!allowedKeys.includes(key)) {
      return <span key={`text-${index}`}>{segment.content}</span>;
    }

    const display = segment.content.startsWith('{') ? `@${key}` : segment.content;

    return (
      <span
        key={`var-${index}`}
        className="bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-50 rounded-sm"
        style={{ boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}
      >
        {display}
      </span>
    );
  });
};

interface TemplateTextareaProps {
  id: string;
  value: string;
  rows?: number;
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  suggestions?: Array<{ label: string; value: string }>;
  allowedKeys?: string[];
}

const TemplateTextarea: React.FC<TemplateTextareaProps> = ({
  id,
  value,
  rows = 8,
  placeholder = 'Corps du message',
  onChange,
  className,
  suggestions = [],
  allowedKeys = []
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightedContent = renderHighlightedTemplate(value, allowedKeys);
  const hasValue = Boolean(value);
  const [pendingCaret, setPendingCaret] = useState<number | null>(null);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const filteredSuggestions = suggestions
    .filter((s) => allowedKeys.includes(s.value))
    .filter((s) => s.value.toLowerCase().includes(mentionQuery.toLowerCase()));

  const handleScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    if (!overlayRef.current) return;
    overlayRef.current.scrollTop = event.currentTarget.scrollTop;
    overlayRef.current.scrollLeft = event.currentTarget.scrollLeft;
  };

  const closeSuggestions = () => {
    setIsSuggestionOpen(false);
    setMentionStart(null);
    setMentionQuery('');
    setActiveIndex(0);
  };

  const handleValueChange = (nextValue: string, cursor: number | null) => {
    const cursorPosition = cursor ?? nextValue.length;
    const beforeCursor = nextValue.slice(0, cursorPosition);
    const match = /@([a-zA-Z0-9_]*)$/.exec(beforeCursor);

    if (match && typeof match.index === 'number') {
      setMentionStart(cursorPosition - match[0].length);
      setMentionQuery(match[1] || '');
      setIsSuggestionOpen(true);
      setActiveIndex(0);
    } else {
      closeSuggestions();
    }

    onChange(nextValue);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleValueChange(event.target.value, event.target.selectionStart);
  };

  const applySuggestion = (suggestionValue: string) => {
    if (mentionStart === null || !textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart ?? value.length;
    const before = value.slice(0, mentionStart);
    const after = value.slice(cursor);
    const insertion = `@${suggestionValue}`;
    const needsSpace = after.length === 0 || /^[^\s]/.test(after);
    const nextValue = `${before}${insertion}${needsSpace ? ' ' : ''}${after}`;
    const nextCaret = before.length + insertion.length + (needsSpace ? 1 : 0);

    setPendingCaret(nextCaret);
    onChange(nextValue);
    closeSuggestions();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isSuggestionOpen || !filteredSuggestions.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredSuggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      applySuggestion(filteredSuggestions[activeIndex]?.value);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeSuggestions();
    } else if (event.key === 'Backspace' && mentionQuery === '') {
      closeSuggestions();
    }
  };

  useEffect(() => {
    if (pendingCaret !== null && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(pendingCaret, pendingCaret);
      setPendingCaret(null);
    }
  }, [value, pendingCaret]);

  return (
    <div className="relative min-h-16">
      <div
        aria-hidden="true"
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 px-3 py-2 whitespace-pre-wrap break-words font-mono text-base md:text-sm leading-[1.5] text-foreground overflow-auto"
      >
        {hasValue ? highlightedContent : <span className="text-muted-foreground">{placeholder}</span>}
      </div>
      <Textarea
        id={id}
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        onScroll={handleScroll}
        className={cn(
          'font-mono text-base md:text-sm leading-[1.5] relative bg-transparent text-transparent caret-primary selection:bg-primary/20 placeholder:text-transparent px-3 py-2',
          className
        )}
      />
      {isSuggestionOpen && filteredSuggestions.length > 0 && (
        <div className="absolute bottom-2 left-2 z-30 w-56 max-h-56 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          <ul className="py-1">
            {filteredSuggestions.map((item, index) => (
              <li key={item.value}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                    index === activeIndex && 'bg-accent text-accent-foreground'
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applySuggestion(item.value);
                  }}
                >
                  <span className="font-medium">@{item.value}</span>
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

interface SortableColumnRowProps {
  columnName: string;
  isEssential: boolean;
  label: string;
  canRemove: boolean;
  onEssentialChange: (columnName: string, checked: boolean) => void;
  onRemove: (columnName: string) => void;
}

const SortableColumnRow = React.memo(({
  columnName,
  isEssential,
  label,
  canRemove,
  onEssentialChange,
  onRemove
}: SortableColumnRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: columnName });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-4 bg-background",
        isDragging && "ring-2 ring-primary/30 shadow-sm"
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          aria-label="Déplacer"
          {...attributes}
          {...listeners}
        >
          <span className="sr-only">Déplacer</span>
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <div className="min-w-0">
            <div className="font-medium truncate">{columnName}</div>
            <div className="text-sm text-muted-foreground truncate">{label}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center space-x-2">
          <Switch
            id={`column-${columnName}`}
            checked={isEssential}
            onCheckedChange={(checked) => onEssentialChange(columnName, checked)}
          />
          <Label htmlFor={`column-${columnName}`} className="text-sm">
            {isEssential ? (
              <Badge variant="default" className="text-xs">Essentielle</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Optionnelle</Badge>
            )}
          </Label>
        </div>
        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(columnName)}
            aria-label={`Supprimer ${columnName}`}
            className="h-8 w-8"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
});
SortableColumnRow.displayName = 'SortableColumnRow';

const COLOR_PRESETS = [
  { key: 'gray', name: 'Gris', badgeClass: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200', dotClass: 'bg-gray-500' },
  { key: 'red', name: 'Rouge', badgeClass: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200', dotClass: 'bg-red-500' },
  { key: 'orange', name: 'Orange', badgeClass: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200', dotClass: 'bg-orange-500' },
  { key: 'yellow', name: 'Jaune', badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200', dotClass: 'bg-yellow-500' },
  { key: 'blue', name: 'Bleu', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200', dotClass: 'bg-blue-500' },
  { key: 'purple', name: 'Violet', badgeClass: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200', dotClass: 'bg-purple-500' },
  { key: 'indigo', name: 'Indigo', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200', dotClass: 'bg-indigo-500' },
  { key: 'emerald', name: 'Émeraude', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200', dotClass: 'bg-emerald-500' },
  { key: 'green', name: 'Vert', badgeClass: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200', dotClass: 'bg-green-500' },
] as const;

const isDefaultStatus = (status: string) =>
  Object.values(ContactStatus).includes(status as ContactStatus);

interface SortableStatusRowProps {
  status: string;
  presetKey: string;
  preset: typeof COLOR_PRESETS[0];
  label: string;
  visible: boolean;
  isDefault: boolean;
  onLabelChange: (status: string, label: string) => void;
  onPresetChange: (status: string, val: string) => void;
  onVisibilityToggle: (status: string, checked: boolean) => void;
  onRemove: (status: string) => void;
}

const SortableStatusRow = React.memo(({
  status,
  presetKey,
  preset,
  label,
  visible,
  isDefault,
  onLabelChange,
  onPresetChange,
  onVisibilityToggle,
  onRemove
}: SortableStatusRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: status });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 grid grid-cols-1 md:grid-cols-[1.2fr_1.6fr_1.4fr_auto] gap-3 items-center"
    >
      <div className="flex items-center gap-2">
        <button
          className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          aria-label="Déplacer"
          {...attributes}
          {...listeners}
        >
          <span className="sr-only">Déplacer</span>
          <GripVertical className="w-4 h-4" />
        </button>
        <div>
          <div className="text-sm font-medium">{status}</div>
          {isDefault && (
            <div className="text-[11px] text-muted-foreground">Statut natif</div>
          )}
        </div>
      </div>

      <div>
        <Label className="text-xs">Libellé</Label>
        <Input value={label} onChange={(e) => onLabelChange(status, e.target.value)} />
      </div>

      <div>
        <Label className="text-xs">Couleur</Label>
        <Select value={presetKey} onValueChange={(val) => onPresetChange(status, val)}>
          <SelectTrigger>
            <SelectValue>
              <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', preset.badgeClass)}>
                <div className={cn('w-1.5 h-1.5 rounded-full', preset.dotClass)} />
                {label}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {COLOR_PRESETS.map((p) => (
              <SelectItem key={p.key} value={p.key}>
                <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', p.badgeClass)}>
                  <div className={cn('w-1.5 h-1.5 rounded-full', p.dotClass)} />
                  {p.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Switch checked={visible} onCheckedChange={(checked) => onVisibilityToggle(status, checked)} />
          <span className="text-xs">Visible</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(status)}
            aria-label={`Supprimer ${status}`}
            className="h-8 w-8"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
});
SortableStatusRow.displayName = 'SortableStatusRow';

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  calcomUrl,
  onCalcomUrlChange,
  smsTemplate,
  onSmsTemplateChange,
  theme = Theme.Dark,
  onThemeChange
}) => {
  const { mode: currentMode, setMode } = useCallMode();
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('templates');
  const [templateTab, setTemplateTab] = useState<'email' | 'sms'>('email');
  const [templates, setTemplates] = useState<EmailTemplates>(defaultTemplates);
  const [apporteurTemplates, setApporteurTemplates] = useState<EmailTemplates>(defaultTemplates);
  const [signature, setSignature] = useState('');
  const [apporteurSignature, setApporteurSignature] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedEmailType, setSelectedEmailType] = useState<EmailType>(EmailType.PremierContact);
  const [selectedSmsType, setSelectedSmsType] = useState<SmsType>(SmsType.PremierContact);
  const [localCalcomUrl, setLocalCalcomUrl] = useState<string>(calcomUrl || 'https://cal.com/dimitri-morel-arcanis-conseil/audit-patrimonial?overlayCalendar=true');
  const [calProvider, setCalProvider] = useState<string>(() => {
    try {
      return localStorage.getItem(CAL_PROVIDER_STORAGE_KEY) || 'calcom';
    } catch {
      return 'calcom';
    }
  });
  const [shockwaveId, setShockwaveId] = useState(0);
  const [localSmsTemplate, setLocalSmsTemplate] = useState<string>(smsTemplate || DEFAULT_SMS_TEMPLATE);
  const [localSmsTemplateApporteur, setLocalSmsTemplateApporteur] = useState<string>(smsTemplate || DEFAULT_SMS_TEMPLATE);
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplates>(defaultSmsTemplates);
  const [apporteurSmsTemplates, setApporteurSmsTemplates] = useState<SmsTemplates>(defaultSmsTemplates);
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>([]);
  const [shortcutsChanged, setShortcutsChanged] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('Chargement...');
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [callMode, setCallMode] = useState<CallMode>(currentMode);

  // État pour le diagnostic
  const [diagnosticInfo, setDiagnosticInfo] = useState<{
    allowPrerelease: boolean | null;
    lastCheck: string | null;
    currentVersion: string | null;
    betaPreferences: BetaPreferences | null;
    updateStatus: any;
  }>({
    allowPrerelease: null,
    lastCheck: null,
    currentVersion: null,
    betaPreferences: null,
    updateStatus: null
  });

  // State pour les menus dépliants
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  // Ouvrir automatiquement les menus si une sous-catégorie est active
  useEffect(() => {
    if (['columns', 'statuses', 'data-sharing'].includes(activeCategory)) {
      setIsAdvancedOpen(true);
    }
    if (['update', 'diagnostic', 'logs'].includes(activeCategory)) {
      setIsAdvancedOpen(true);
      setIsDevToolsOpen(true);
    }
  }, [activeCategory]);

  // Configuration des colonnes
  const [columnConfig, setColumnConfig] = useState<Record<string, boolean>>({});
  const [columnConfigChanged, setColumnConfigChanged] = useState(false);
  const [columnSearch, setColumnSearch] = useState('');
  const [columnLabels, setColumnLabels] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(COLUMN_LABELS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_COLUMN_LABELS, ...parsed };
        }
      }
    } catch { }
    return { ...DEFAULT_COLUMN_LABELS };
  });
  const [columnOrderSettings, setColumnOrderSettings] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(COLUMN_ORDER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sanitized = parsed
            .filter((col): col is string => typeof col === 'string')
            .filter((col) => DEFAULT_COLUMN_CONFIG[col as keyof typeof DEFAULT_COLUMN_CONFIG]);
          const merged = Array.from(
            new Set([
              ...sanitized,
              ...DEFAULT_COLUMN_ORDER_LIST.filter((col) => sanitized.indexOf(col) === -1),
            ])
          );
          return merged;
        }
      }
    } catch {
      // Fallback vers l'ordre par défaut
    }
    return DEFAULT_COLUMN_ORDER_LIST;
  });
  const [columnOrderChanged, setColumnOrderChanged] = useState(false);
  const [columnLabelsChanged, setColumnLabelsChanged] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnLabel, setNewColumnLabel] = useState('');
  const [columnFormError, setColumnFormError] = useState<string | null>(null);

  // S'assurer que les nouvelles colonnes sont ajoutées à la liste ordonnée même si une config existante est chargée
  useEffect(() => {
    const missing = DEFAULT_COLUMN_ORDER_LIST.filter((col) => !columnOrderSettings.includes(col));
    if (missing.length > 0) {
      const next = [...columnOrderSettings, ...missing];
      setColumnOrderSettings(next);
      setColumnOrderChanged(true);
      setHasChanges(true);
    }
  }, [columnOrderSettings]);
  // Éditeur de statuts: configuration par mode (libellés/couleurs/visibilité)
  const [statusConfig, setStatusConfig] = useState<StatusConfigMap>(() => StatusConfigService.getConfig());
  const [statusOrder, setStatusOrder] = useState<string[]>(() => StatusConfigService.getStatusList(undefined, { includeHidden: true }));
  const [newStatusLabel, setNewStatusLabel] = useState('');
  const [newStatusPreset, setNewStatusPreset] = useState('blue');
  const [statusFormError, setStatusFormError] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Hooks pour les paramètres de mise à jour (déplacés ici pour éviter les erreurs de hooks conditionnels)
  const { betaPreferences, setBetaPreferences, revertToStable, isUpdateEnabled, manualUpdateInfo } = useAutoUpdate();

  // Hook pour le partage Supabase
  const { state: supabaseState, setEnabled: setSupabaseEnabled, triggerSync: triggerSupabaseSync, refreshSupabaseStatus, downloadLogs } = useSupabaseShare();

  // Log pour debug des mises à jour
  useEffect(() => {
    console.log(`[SettingsDialog] Update enabled: ${isUpdateEnabled}`);
    if (!isUpdateEnabled && manualUpdateInfo) {
      console.log(`[SettingsDialog] Manual update info:`, manualUpdateInfo);
    }
  }, [isUpdateEnabled, manualUpdateInfo]);
  const [isRevertingToStable, setIsRevertingToStable] = useState(false);
  const [devToolsEnabled, setDevToolsEnabled] = useState(() => {
    try {
      return DevToolsService.isEnabled();
    } catch (error) {
      console.error('Erreur lors du chargement de l\'état des DevTools:', error);
      return false;
    }
  });

  // NOUVEAU : État pour la gestion d'erreurs
  const [error, setError] = useState<{
    message: string;
    type: 'beta' | 'devtools' | 'general';
    timestamp?: number;
  } | null>(null);

  // Charger les templates sauvegardés
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.templates) setTemplates(data.templates);
        if (data.signature) setSignature(data.signature);
        // mode apporteur
        if (data.apporteurTemplates) setApporteurTemplates(data.apporteurTemplates);
        if (data.apporteurSignature) setApporteurSignature(data.apporteurSignature);
        if (data.smsApporteur) setLocalSmsTemplateApporteur(data.smsApporteur);
      } catch (error) {
        console.error('Erreur lors du chargement des templates:', error);
      }
    }

    // Charger les templates SMS
    const savedSms = localStorage.getItem(SMS_STORAGE_KEY);
    if (savedSms) {
      try {
        const data = JSON.parse(savedSms);
        if (data.smsTemplates) setSmsTemplates(data.smsTemplates);
        if (data.apporteurSmsTemplates) setApporteurSmsTemplates(data.apporteurSmsTemplates);
      } catch (error) {
        console.error('Erreur lors du chargement des templates SMS:', error);
      }
    }
  }, []);

  // Mettre à jour l'URL locale et le template SMS quand ils changent depuis l'extérieur
  useEffect(() => {
    if (calcomUrl) {
      setLocalCalcomUrl(calcomUrl);
    }
    if (smsTemplate) {
      setLocalSmsTemplate(smsTemplate);
    }
  }, [calcomUrl, smsTemplate]);

  // Charger les raccourcis lors de l'ouverture
  useEffect(() => {
    if (isOpen) {
      setShortcuts(shortcutService.getShortcuts());
      setShortcutsChanged(false);
    }
  }, [isOpen]);

  // Synchroniser le mode local avec le mode global
  useEffect(() => {
    setCallMode(currentMode);
  }, [currentMode]);

  // Charger la configuration des colonnes
  useEffect(() => {
    const saved = localStorage.getItem(COLUMNS_STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setColumnConfig(data);
      } catch (error) {
        console.error('Erreur lors du chargement de la config des colonnes:', error);
        // Initialiser avec la config par défaut
        const defaultConfig: Record<string, boolean> = {};
        Object.keys(DEFAULT_COLUMN_CONFIG).forEach(column => {
          defaultConfig[column] = DEFAULT_COLUMN_CONFIG[column as keyof typeof DEFAULT_COLUMN_CONFIG].isEssential;
        });
        setColumnConfig(defaultConfig);
      }
    } else {
      // Première utilisation - initialiser avec la config par défaut
      const defaultConfig: Record<string, boolean> = {};
      Object.keys(DEFAULT_COLUMN_CONFIG).forEach(column => {
        defaultConfig[column] = DEFAULT_COLUMN_CONFIG[column as keyof typeof DEFAULT_COLUMN_CONFIG].isEssential;
      });
      setColumnConfig(defaultConfig);
    }
  }, []);

  // Charger la version de l'application
  useEffect(() => {
    if (isOpen && window.electronAPI?.getAppVersion) {
      window.electronAPI.getAppVersion()
        .then((version: string) => {
          setAppVersion(version || 'Version inconnue');
        })
        .catch(() => {
          setAppVersion('Version indisponible');
        });
    }
  }, [isOpen]);

  // Recharger la configuration des statuts lorsque le mode change ou quand on ouvre/va sur la section
  useEffect(() => {
    try {
      const state = StatusConfigService.getState(callMode);
      setStatusConfig(state.map);
      setStatusOrder(state.order);
    } catch { }
  }, [callMode, activeCategory, isOpen]);

  // Charger les informations de diagnostic quand la section diagnostic est ouverte
  useEffect(() => {
    if (isOpen && activeCategory === 'diagnostic') {
      loadDiagnosticInfo();
    }
  }, [isOpen, activeCategory]);

  // Empêcher l'affichage des sections réservées lorsque les DevTools sont désactivés
  useEffect(() => {
    if (!devToolsEnabled && (activeCategory === 'diagnostic' || activeCategory === 'logs')) {
      setActiveCategory('templates');
    }
  }, [devToolsEnabled, activeCategory]);

  const handleTemplateChange = (field: 'subject' | 'body', value: string) => {
    if (callMode === CallMode.Apporteur) {
      setApporteurTemplates(prev => ({
        ...prev,
        [selectedEmailType]: {
          ...prev[selectedEmailType],
          [field]: value
        }
      }));
    } else {
      setTemplates(prev => ({
        ...prev,
        [selectedEmailType]: {
          ...prev[selectedEmailType],
          [field]: value
        }
      }));
    }
    setHasChanges(true);
  };

  const handleSignatureChange = (value: string) => {
    if (callMode === CallMode.Apporteur) {
      setApporteurSignature(value);
    } else {
      setSignature(value);
    }
    setHasChanges(true);
  };

  const handleCalcomUrlChange = (value: string) => {
    setLocalCalcomUrl(value);
    setHasChanges(true);
  };

  // Obtenir le libellé d'un statut (dépend du mode)
  const getStatusLabel = (status: ContactStatus): string => {
    return StatusConfigService.getLabel(status, callMode);
  };

  // Gérer le changement de statut pour une touche
  const handleShortcutChange = (key: string, newStatus: string) => {
    setShortcuts(prev =>
      prev.map(shortcut =>
        shortcut.key === key
          ? { ...shortcut, status: newStatus, label: getStatusLabel(newStatus) }
          : shortcut
      )
    );
    setShortcutsChanged(true);
    setHasChanges(true);
  };

  // Remettre les raccourcis par défaut
  const handleShortcutsReset = () => {
    shortcutService.resetToDefaults();
    setShortcuts(shortcutService.getShortcuts());
    setShortcutsChanged(true);
    setHasChanges(true);
  };

  // Gérer le changement de statut essentiel d'une colonne
  const handleColumnEssentialChange = (columnName: string, isEssential: boolean) => {
    setColumnConfig(prev => ({
      ...prev,
      [columnName]: isEssential
    }));
    setColumnConfigChanged(true);
    setHasChanges(true);
  };

  // Remettre la configuration des colonnes par défaut
  const handleColumnConfigReset = () => {
    const defaultConfig: Record<string, boolean> = {};
    Object.keys(DEFAULT_COLUMN_CONFIG).forEach(column => {
      defaultConfig[column] = DEFAULT_COLUMN_CONFIG[column as keyof typeof DEFAULT_COLUMN_CONFIG].isEssential;
    });
    setColumnConfig(defaultConfig);
    setColumnOrderSettings(DEFAULT_COLUMN_ORDER_LIST);
    setColumnLabels({ ...DEFAULT_COLUMN_LABELS });
    setColumnConfigChanged(true);
    setColumnOrderChanged(true);
    setColumnLabelsChanged(true);
    setHasChanges(true);
  };

  const handleColumnOrderDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = columnOrderSettings.indexOf(active.id as string);
    const newIndex = columnOrderSettings.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const nextOrder = arrayMove(columnOrderSettings, oldIndex, newIndex);
    setColumnOrderSettings(nextOrder);
    setColumnOrderChanged(true);
    setHasChanges(true);
  };

  const handleRemoveColumn = (columnName: string) => {
    // Ne pas supprimer les colonnes essentielles par défaut
    const isDefault = DEFAULT_COLUMN_CONFIG[columnName as keyof typeof DEFAULT_COLUMN_CONFIG];
    if (isDefault?.isEssential) return;

    setColumnOrderSettings((prev) => prev.filter((c) => c !== columnName));
    setColumnConfig((prev) => {
      const next = { ...prev };
      delete next[columnName];
      return next;
    });
    setColumnLabels((prev) => {
      const next = { ...prev };
      delete next[columnName];
      return next;
    });
    setColumnOrderChanged(true);
    setColumnConfigChanged(true);
    setColumnLabelsChanged(true);
    setHasChanges(true);
  };

  const handleAddColumn = () => {
    const name = newColumnName.trim();
    const label = newColumnLabel.trim();
    if (!name) {
      setColumnFormError('Ajoutez un nom de colonne.');
      return;
    }
    const exists = columnOrderSettings.some((col) => col.toLowerCase() === name.toLowerCase());
    if (exists) {
      setColumnFormError('Cette colonne existe déjà.');
      return;
    }

    const finalLabel = label || name;
    const nextOrder = [...columnOrderSettings, name];
    setColumnOrderSettings(nextOrder);
    setColumnConfig((prev) => ({ ...prev, [name]: false }));
    setColumnLabels((prev) => ({ ...prev, [name]: finalLabel }));
    setColumnOrderChanged(true);
    setColumnConfigChanged(true);
    setColumnLabelsChanged(true);
    setHasChanges(true);
    setNewColumnName('');
    setNewColumnLabel('');
    setColumnFormError(null);
  };

  // Obtenir la couleur d'un statut (dépend du mode)
  const getStatusColor = (status: ContactStatus) => {
    const cfg = StatusConfigService.getColor(status, callMode);
    return cfg.color;
  };

  const handleSave = () => {
    try {
      // Sauvegarde des templates et signature existants
      const data = {
        templates,
        signature,
        apporteurTemplates,
        apporteurSignature,
        smsApporteur: localSmsTemplateApporteur,
        lastModified: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      // Sauvegarde des templates SMS structurés
      const smsData = {
        smsTemplates,
        apporteurSmsTemplates,
        lastModified: new Date().toISOString()
      };
      localStorage.setItem(SMS_STORAGE_KEY, JSON.stringify(smsData));

      // Sauvegarder le mode
      localStorage.setItem(MODE_STORAGE_KEY, callMode);

      // Sauvegarder l'URL Cal.com si elle a changé
      if (onCalcomUrlChange && localCalcomUrl !== calcomUrl) {
        onCalcomUrlChange(localCalcomUrl);
      }
      try { localStorage.setItem(CAL_PROVIDER_STORAGE_KEY, calProvider); } catch { }

      // Sauvegarder le template SMS si il a changé
      if (onSmsTemplateChange) {
        const toSave = callMode === CallMode.Apporteur ? localSmsTemplateApporteur : localSmsTemplate;
        if (toSave !== smsTemplate) onSmsTemplateChange(toSave);
      }

      // Sauvegarder les raccourcis si ils ont changé
      if (shortcutsChanged) {
        shortcutService.updateAllShortcuts(shortcuts);
        setShortcutsChanged(false);
      }

      // Sauvegarder la configuration des colonnes si elle a changé
      if (columnConfigChanged) {
        localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(columnConfig));
        setColumnConfigChanged(false);
      }

      // Sauvegarder l'ordre des colonnes si modifié
      if (columnOrderChanged) {
        localStorage.setItem(COLUMN_ORDER_STORAGE_KEY, JSON.stringify(columnOrderSettings));
        window.dispatchEvent(new CustomEvent('dimicall-column-order-changed', { detail: { order: columnOrderSettings } }));
        setColumnOrderChanged(false);
      }

      if (columnLabelsChanged) {
        localStorage.setItem(COLUMN_LABELS_STORAGE_KEY, JSON.stringify(columnLabels));
        setColumnLabelsChanged(false);
      }

      // NOUVEAU : Sauvegarder les préférences bêta
      console.log('💾 Sauvegarde des préférences bêta:', betaPreferences);
      BetaPreferencesService.setBetaPreferences(betaPreferences);

      // NOUVEAU : Sauvegarder l'état des DevTools
      console.log('💾 Sauvegarde de l\'état DevTools:', devToolsEnabled);
      DevToolsService.setEnabled(devToolsEnabled);

      console.log('✅ Sauvegarde des paramètres réussie');
      setHasChanges(false);
      onSave();
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des paramètres:', error);
      // TODO: Afficher un message d'erreur à l'utilisateur (sera implémenté dans la tâche 3)
    }
  };

  const handleReset = () => {
    try {
      // Réinitialisation existante
      setTemplates(defaultTemplates);
      setSignature('');
      setLocalCalcomUrl('https://cal.com/dimitri-morel-arcanis-conseil/audit-patrimonial?overlayCalendar=true');
      setCalProvider('calcom');
      setLocalSmsTemplate(DEFAULT_SMS_TEMPLATE);
      handleShortcutsReset();
      handleColumnConfigReset();
      setColumnLabels({ ...DEFAULT_COLUMN_LABELS });

      // NOUVEAU : Réinitialisation des préférences bêta
      const defaultBetaPrefs = {
        enabled: false,
        lastModified: Date.now(),
        hasBeenWarned: false,
      };
      console.log('🔄 Réinitialisation des préférences bêta:', defaultBetaPrefs);
      setBetaPreferences(defaultBetaPrefs);
      BetaPreferencesService.setBetaPreferences(defaultBetaPrefs);

      // NOUVEAU : Réinitialisation des DevTools
      console.log('🔄 Réinitialisation des DevTools: false');
      setDevToolsEnabled(false);
      DevToolsService.disableDevTools();

      console.log('✅ Réinitialisation des paramètres réussie');
      setHasChanges(true);
    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation des paramètres:', error);
      // TODO: Afficher un message d'erreur à l'utilisateur (sera implémenté dans la tâche 3)
    }
  };

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdates(true);
    console.log('UI: 🔍 Demande de vérification des mises à jour...');

    try {
      if (window.electronAPI?.checkForUpdates) {
        const result = await window.electronAPI.checkForUpdates();

        console.log(`UI: 📦 Réponse reçue du processus principal:`, result);

        if (result.status === 'checking') {
          console.log('UI: ✅ La vérification des mises à jour a été lancée avec succès.');
          // On peut ajouter un toast ici si besoin
        } else if (result.status === 'dev_mode') {
          console.warn(`UI: ⚠️ ${result.message}`);
          // On peut ajouter un toast ici si besoin
        } else if (result.status === 'error') {
          console.error(`UI: ❌ ${result.message}`);
          // On peut ajouter un toast ici si besoin
        }
      } else {
        console.warn('UI: ⚠️ API de mise à jour non disponible. L\'application n\'est probablement pas dans un contexte Electron.');
      }
    } catch (error) {
      console.error('UI: ❌ Erreur de communication IPC lors de la vérification des mises à jour:', error);
    } finally {
      // Laisser le temps à l'utilisateur de voir le changement d'état du bouton
      setTimeout(() => {
        setIsCheckingUpdates(false);
      }, 2500);
    }
  };

  // Handlers pour les paramètres de mise à jour
  const handleRevertToStable = async () => {
    setIsRevertingToStable(true);
    try {
      await revertToStable();
    } catch (error) {
      console.error('Erreur lors du retour à la version stable:', error);
    } finally {
      setIsRevertingToStable(false);
    }
  };

  // Fonction pour charger les informations de diagnostic
  const loadDiagnosticInfo = async () => {
    try {
      const betaPrefs = BetaPreferencesService.getBetaPreferences();
      const updateStatus = window.electronAPI?.getUpdateStatus ? await window.electronAPI.getUpdateStatus() : null;
      const currentVersion = window.electronAPI?.getAppVersion ? await window.electronAPI.getAppVersion() : null;

      setDiagnosticInfo({
        allowPrerelease: betaPrefs.enabled,
        lastCheck: new Date().toLocaleString(),
        currentVersion,
        betaPreferences: betaPrefs,
        updateStatus
      });
    } catch (error) {
      console.error('Erreur lors du chargement des infos de diagnostic:', error);
    }
  };

  // Fonction pour forcer la vérification avec cache-busting
  const handleForceCheck = async () => {
    setIsCheckingUpdates(true);
    try {
      const betaPrefs = BetaPreferencesService.getBetaPreferences();
      if (window.electronAPI?.checkForUpdates) {
        await window.electronAPI.checkForUpdates(betaPrefs.enabled, true); // forceRefresh = true
      }
      await loadDiagnosticInfo();
    } catch (error) {
      console.error('Erreur lors de la vérification forcée:', error);
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleDevToolsToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        await DevToolsService.enableDevTools();
      } else {
        await DevToolsService.disableDevTools();
        // Si l'utilisateur désactive les DevTools alors qu'il est sur une section réservée,
        // le rediriger vers la section Templates
        if (activeCategory === 'logs' || activeCategory === 'diagnostic') {
          setActiveCategory('templates');
        }
      }
      setDevToolsEnabled(enabled);
      setHasChanges(true);
      setError(null); // Effacer les erreurs précédentes
      console.log(`🔧 DevTools ${enabled ? 'activés' : 'désactivés'} avec succès`);
    } catch (error) {
      console.error('❌ Erreur lors du toggle des DevTools:', error);
      setError({
        message: 'Erreur lors de la modification des outils de développement',
        type: 'devtools',
        timestamp: Date.now()
      });
    }
  };

  const handleBetaPreferencesChange = (preferences: BetaPreferences) => {
    try {
      setBetaPreferences(preferences);
      // Application immédiate maintenue pour le feedback utilisateur
      BetaPreferencesService.setBetaPreferences(preferences);
      setHasChanges(true);
      setError(null); // Effacer les erreurs précédentes
      console.log('🔧 Préférences bêta modifiées avec succès:', preferences);
    } catch (error) {
      console.error('❌ Erreur lors de la modification des préférences bêta:', error);
      setError({
        message: 'Erreur lors de la sauvegarde des préférences bêta',
        type: 'beta',
        timestamp: Date.now()
      });
    }
  };

  const renderUpdateSettings = () => {
    // Si les mises à jour sont désactivées, afficher les informations de mise à jour manuelle
    if (!isUpdateEnabled && manualUpdateInfo) {
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">Version actuelle</CardTitle>
                  <CardDescription>DimiCall {appVersion}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Mises à jour manuelles
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {manualUpdateInfo.message}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.electronAPI?.openExternal) {
                    window.electronAPI.openExternal(manualUpdateInfo.url);
                  } else {
                    window.open(manualUpdateInfo.url, '_blank');
                  }
                }}
                className="w-full gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Télécharger la dernière version
              </Button>

              <p className="text-xs text-muted-foreground">
                Les mises à jour automatiques ne sont pas disponibles sur cette plateforme.
                Visitez la page GitHub pour télécharger manuellement les nouvelles versions.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Affichage normal pour les plateformes avec mises à jour automatiques
    return (
      <div className="space-y-6">
        <Card className="relative overflow-hidden rounded-xl border bg-card/60 px-6 py-5 shadow-sm flex flex-col gap-4">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                <Info className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Version actuelle</CardTitle>
                <CardDescription>DimiCall {appVersion}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleCheckForUpdates}
              className="gap-1.5"
              disabled={isCheckingUpdates}
            >
              <DownloadCloud className={`w-4 h-4 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
              {isCheckingUpdates ? 'Vérification en cours...' : 'Rechercher une mise à jour'}
            </Button>

            <p className="text-xs text-muted-foreground">
              {typeof window !== 'undefined' && window.electronAPI ?
                'Les mises à jour se font automatiquement au démarrage et toutes les 10 minutes.' :
                'Vérification des mises à jour disponible uniquement dans l\'application installée.'
              }
            </p>

            <div className="border-t pt-6 mt-2">
              <BetaOptInSettings
                betaPreferences={betaPreferences}
                onPreferencesChange={handleBetaPreferencesChange}
                isCurrentVersionBeta={betaPreferences.enabled}
                onRevertToStable={handleRevertToStable}
                isRevertingToStable={isRevertingToStable}
                devToolsEnabled={devToolsEnabled}
                onDevToolsToggle={handleDevToolsToggle}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDiagnosticSettings = () => {
    return (
      <div className="space-y-6">
        <Card className="relative overflow-hidden rounded-xl border bg-card/60 px-6 py-5 shadow-sm flex flex-col gap-4">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                <Info className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Diagnostic du système de mise à jour</CardTitle>
                <CardDescription>Informations détaillées sur l'état du système</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Version actuelle</Label>
                <div className="text-sm text-muted-foreground">
                  {diagnosticInfo.currentVersion || 'Chargement...'}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Pre-releases activées</Label>
                <div className="flex items-center gap-2">
                  <Badge variant={diagnosticInfo.allowPrerelease ? "default" : "secondary"}>
                    {diagnosticInfo.allowPrerelease ? "Oui" : "Non"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Dernière vérification</Label>
                <div className="text-sm text-muted-foreground">
                  {diagnosticInfo.lastCheck || 'Jamais'}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">État des mises à jour</Label>
                <div className="text-sm text-muted-foreground">
                  {diagnosticInfo.updateStatus?.updateAvailable ? (
                    <Badge variant="default">Mise à jour disponible</Badge>
                  ) : (
                    <Badge variant="secondary">À jour</Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">Préférences Beta</Label>
              {diagnosticInfo.betaPreferences && (
                <div className="bg-card p-3 rounded-md text-sm font-mono border shadow-none">
                  <pre>{JSON.stringify(diagnosticInfo.betaPreferences, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">État des mises à jour</Label>
              {diagnosticInfo.updateStatus && (
                <div className="bg-card p-3 rounded-md text-sm font-mono border shadow-none">
                  <pre>{JSON.stringify(diagnosticInfo.updateStatus, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={loadDiagnosticInfo}
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                Actualiser
              </Button>

              <Button
                onClick={handleForceCheck}
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={isCheckingUpdates}
              >
                <DownloadCloud className={`w-4 h-4 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
                {isCheckingUpdates ? 'Vérification...' : 'Forcer la vérification'}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• La vérification forcée ignore le cache et refait une requête à GitHub</p>
              <p>• Les logs détaillés sont disponibles dans la console Electron (F12)</p>
              <p>• Les préférences sont synchronisées entre localStorage et le fichier système</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderLogsSettings = () => {
    return <LogsViewer />;
  };

  const renderDataSharingSettings = () => {
    const renderStatusBadge = (status: string) => {
      switch (status) {
        case 'syncing':
          return (
            <Badge variant="outline" className="gap-1 text-xs text-amber-600 border-amber-500">
              <Settings className="w-3 h-3 animate-spin" />
              Synchronisation…
            </Badge>
          )
        case 'success':
          return (
            <Badge variant="outline" className="gap-1 text-xs text-emerald-600 border-emerald-500">
              <CheckCircle className="w-3 h-3" />
              À jour
            </Badge>
          )
        case 'error':
          return (
            <Badge variant="outline" className="gap-1 text-xs text-red-600 border-red-500">
              <X className="w-3 h-3" />
              Erreur
            </Badge>
          )
        default:
          return (
            <Badge variant="secondary" className="text-xs text-muted-foreground">
              Inactif
            </Badge>
          )
      }
    }

    const renderStats = (stats?: { processed: number; shared: number; filtered: number }) => {
      if (!stats) return null
      return (
        <div className="text-xs text-muted-foreground grid gap-1 mt-2">
          <span>
            <span className="font-medium text-foreground">{stats.shared}</span> éléments envoyés
          </span>
          <span>
            <span className="font-medium text-foreground">{stats.processed}</span> lignes analysées,
            <span className="font-medium text-foreground"> {stats.filtered}</span> ignorées
          </span>
        </div>
      )
    }

    const renderError = (error?: string) => {
      if (!error) return null
      return (
        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-100/40 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2 mt-2">
          <ShieldAlert className="w-4 h-4 mt-0.5" />
          <div className="grid gap-1">
            <span className="font-medium">Synchronisation interrompue</span>
            <span>{error}</span>
          </div>
        </div>
      )
    }

    const connectionOk = supabaseState.supabaseReady

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Partage Supabase</CardTitle>
            <CardDescription>
              Choisissez ce que vous souhaitez partager avec Supabase pour vos autres utilisateurs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-md border border-border/70 bg-muted/40">
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-medium truncate">Partage des données</div>
                <div className="text-[10px] sm:text-xs truncate hidden sm:block text-primary-foreground/80">
                  Configuration du partage Supabase
                </div>
              </div>
            </div>
            <section className="rounded-md border bg-muted/40 px-3 py-3 flex items-start gap-3">
              <Server className={`w-5 h-5 mt-0.5 ${connectionOk ? 'text-emerald-600' : 'text-amber-600 animate-pulse'}`} />
              <div className="grid gap-1 text-sm">
                <div className="font-medium">Statut connexion</div>
                {connectionOk ? (
                  <span className="text-muted-foreground">Supabase configuré et prêt à recevoir les données.</span>
                ) : (
                  <span className="text-amber-600">Supabase non configuré ou indisponible.</span>
                )}
                <div className="flex gap-2 mt-1">
                  <Button variant="outline" size="sm" onClick={() => refreshSupabaseStatus()} className="h-7">
                    <RotateCcw className="w-3 h-3 mr-1" /> Vérifier
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadLogs()} className="h-7">
                    Télécharger les logs
                  </Button>
                </div>
              </div>
            </section>

            <div className="grid gap-4">
              <div className="rounded-md border px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      Partager les numéros de téléphone
                      {renderStatusBadge(supabaseState.phone.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Synchronise les numéros de téléphone de la table locale vers Supabase (`shared_phone_numbers`).
                      Utilisé pour éviter les doublons entre utilisateurs.
                    </p>
                    {renderStats(supabaseState.phone.stats)}
                    {renderError(supabaseState.phone.lastError)}
                  </div>
                  <Switch
                    checked={supabaseState.phone.enabled}
                    onCheckedChange={(checked) => setSupabaseEnabled('phone', !!checked)}
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!supabaseState.phone.enabled || supabaseState.phone.status === 'syncing'}
                    onClick={() => triggerSupabaseSync('phone', 'manual')}
                    className="h-7"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" /> Relancer la synchro
                  </Button>
                </div>
              </div>

              <div className="rounded-md border px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      Partager les listes noires
                      {renderStatusBadge(supabaseState.blacklist.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Envoie uniquement les numéros dont le statut est « Liste noire » vers `shared_blacklist_numbers`.
                      Permet de bloquer les contacts indésirables sur toute l'application.
                    </p>
                    {renderStats(supabaseState.blacklist.stats)}
                    {renderError(supabaseState.blacklist.lastError)}
                  </div>
                  <Switch
                    checked={supabaseState.blacklist.enabled}
                    onCheckedChange={(checked) => setSupabaseEnabled('blacklist', !!checked)}
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!supabaseState.blacklist.enabled || supabaseState.blacklist.status === 'syncing'}
                    onClick={() => triggerSupabaseSync('blacklist', 'manual')}
                    className="h-7"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" /> Relancer la synchro
                  </Button>
                </div>
              </div>

              <div className="rounded-md border px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      Collecter les données d'appels
                      {renderStatusBadge(supabaseState.calls.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <PhoneCall className="w-3.5 h-3.5 text-muted-foreground" />
                      Capture en temps réel les événements complets (table
                      <code className="px-1 py-0.5 bg-muted rounded text-[10px] border border-border">call_data_events</code>
                      ) avec UID Supabase et email utilisateur.
                    </p>
                    {renderStats(supabaseState.calls.stats)}
                    {renderError(supabaseState.calls.lastError)}
                  </div>
                  <Switch
                    checked={supabaseState.calls.enabled}
                    onCheckedChange={(checked) => setSupabaseEnabled('calls', !!checked)}
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!supabaseState.calls.enabled || supabaseState.calls.status === 'syncing'}
                    onClick={() => triggerSupabaseSync('calls', 'manual')}
                    className="h-7"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" /> Relancer la synchro
                  </Button>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                    Activé par défaut
                  </Badge>
                </div>
              </div>

              <div className="rounded-md border px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      Miroir Graphique (status_events)
                      {renderStatusBadge(supabaseState.statusEvents.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Synchronise l’historique de la page Graphique (table locale <code className="px-1 py-0.5 bg-muted rounded text-[10px] border border-border">status_events</code>)
                      vers Supabase (<code className="px-1 py-0.5 bg-muted rounded text-[10px] border border-border">dimicall_status_events</code>).
                    </p>
                    {renderStats(supabaseState.statusEvents.stats)}
                    {renderError(supabaseState.statusEvents.lastError)}
                  </div>
                  <Switch
                    checked={supabaseState.statusEvents.enabled}
                    onCheckedChange={(checked) => setSupabaseEnabled('statusEvents', !!checked)}
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!supabaseState.statusEvents.enabled || supabaseState.statusEvents.status === 'syncing'}
                    onClick={() => triggerSupabaseSync('statusEvents', 'manual')}
                    className="h-7"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" /> Relancer la synchro
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  };

  const renderEmailSettings = () => {
    const templatesByMode = callMode === CallMode.Apporteur ? apporteurTemplates : templates;
    const currentTemplate = templatesByMode[selectedEmailType];
    const emailInfo = emailTypeLabels[selectedEmailType];
    const emailSuggestions = [
      { label: 'Titre (Madame/Monsieur)', value: 'titre' },
      { label: 'Nom de famille', value: 'nom' },
      { label: 'Signature', value: 'signature' },
      { label: 'Détails RDV', value: 'rdv' },
      ...(selectedEmailType === EmailType.R0Externe ? [{ label: 'Adresse', value: 'adresse' }] : []),
    ];
    const emailAllowedKeys = emailSuggestions.map((s) => s.value);

    return (
      <div className="space-y-6">
        {/* Template Selection & Editor */}
        <div className="space-y-6">
          {/* Template Editor (par mode) */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                  <emailInfo.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">{emailInfo.label}</CardTitle>
                  <CardDescription>Personnalisez le contenu de ce type d'email</CardDescription>
                </div>
              </div>
              <div className="space-y-1 w-full sm:w-auto">
                <span className="text-xs text-muted-foreground">Type d'email</span>
                <Select
                  value={selectedEmailType}
                  onValueChange={(value) => setSelectedEmailType(value as EmailType)}
                >
                  <SelectTrigger
                    id="email-type-selector"
                    className="w-full sm:w-fit min-w-[200px] max-w-full justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <SelectValue />
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(emailTypeLabels).map(([type, info]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <info.icon className="w-4 h-4" />
                          <span>{info.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subject Field */}
              <div className="space-y-2">
                <Label htmlFor={`subject-${selectedEmailType}`}>Sujet de l'email</Label>
                <Input
                  id={`subject-${selectedEmailType}`}
                  value={currentTemplate.subject}
                  onChange={(e) => handleTemplateChange('subject', e.target.value)}
                  placeholder="Sujet de l'email"
                />
              </div>

              {/* Body Field */}
              <div className="space-y-2">
                <Label htmlFor={`body-${selectedEmailType}`}>Corps du message</Label>
                <TemplateTextarea
                  id={`body-${selectedEmailType}`}
                  value={currentTemplate.body}
                  onChange={(value) => handleTemplateChange('body', value)}
                  placeholder="Corps du message"
                  rows={8}
                  suggestions={emailSuggestions}
                  allowedKeys={emailAllowedKeys}
                />
              </div>

              {/* Variables Help */}
              <div className="bg-card p-4 rounded-lg border shadow-none">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Variables disponibles</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1">
                      <code className="bg-background px-2 py-1 rounded border text-xs">@titre</code>
                      <span className="text-xs text-muted-foreground">(ex: Madame)</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <code className="bg-background px-2 py-1 rounded border text-xs">@nom</code>
                      <span className="text-xs text-muted-foreground">(ex: Dupont)</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <code className="bg-background px-2 py-1 rounded border text-xs">@signature</code>
                      <span className="text-xs text-muted-foreground">(ex: Dimitri MOREL)</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <code className="bg-background px-2 py-1 rounded border text-xs">@rdv</code>
                      <span className="text-xs text-muted-foreground">(ex: lundi 1 janv 2025 à 09:00)</span>
                    </span>
                    {selectedEmailType === EmailType.R0Externe && (
                      <span className="inline-flex items-center gap-1">
                        <code className="bg-background px-2 py-1 rounded border text-xs">@adresse</code>
                        <span className="text-xs text-muted-foreground">(ex: 22 rue la Boétie, Paris)</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ces variables seront automatiquement remplacées par les informations du contact
                  </p>
                </div>
              </div>

              {/* Signature Section (déplacée sous les variables) */}
              <div className="rounded-lg border bg-card text-card-foreground shadow-none p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold leading-tight">Signature par défaut</h4>
                    <p className="text-sm text-muted-foreground">Utilisée automatiquement dans tous vos emails</p>
                  </div>
                </div>
                <div className="w-full sm:w-[320px]">
                  <Input
                    id="signature-input"
                    value={callMode === CallMode.Apporteur ? apporteurSignature : signature}
                    onChange={(e) => handleSignatureChange(e.target.value)}
                    placeholder="Votre nom et fonction"
                  />
                </div>
              </div>

              {/* Aperçu avec exemple */}
              {currentTemplate.body && (
                <div className="bg-card rounded-lg p-4 border shadow-none">
                  <div className="flex items-center gap-2 mb-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Aperçu avec exemple</span>
                  </div>
                  <div className="bg-background rounded-lg p-3 border text-xs font-mono whitespace-pre-wrap">
                    {(() => {
                      const previewRdv = 'notre entretien du lundi 1 janvier 2025 à 09:00';
                      const previewAdresse = '22 rue la Boétie, 75008 Paris';
                      const applyBoth = (text: string, key: string, replacement: string) =>
                        text
                          .replace(new RegExp(`@${key}\\b`, 'g'), replacement)
                          .replace(new RegExp(`\\{${key}\\}`, 'g'), replacement);

                      let preview = currentTemplate.body;
                      preview = applyBoth(preview, 'titre', 'Madame');
                      preview = applyBoth(preview, 'nom', 'Dupont');
                      preview = applyBoth(preview, 'signature', 'Dimitri MOREL');
                      preview = applyBoth(preview, 'rdv', previewRdv);
                      preview = applyBoth(preview, 'adresse', previewAdresse);
                      return preview;
                    })()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Exemple avec : Titre "Madame", Nom "Dupont"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderCalcomSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Configuration Calendrier</CardTitle>
              <CardDescription>Compatible Cal.com, Calendly et URL directe</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Choisissez votre fournisseur de calendrier puis collez l’URL de prise de rendez-vous.
            </p>
          </div>

          <div className="space-y-3">
            <Label>Fournisseur</Label>
            <Select
              value={calProvider}
              onValueChange={(value) => {
                setCalProvider(value);
                try { localStorage.setItem(CAL_PROVIDER_STORAGE_KEY, value); } catch { }
              }}
            >
              <SelectTrigger className="w-fit min-w-[220px] max-w-full justify-between">
                <SelectValue />
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calcom">Cal.com</SelectItem>
                <SelectItem value="calendly">Calendly</SelectItem>
                <SelectItem value="custom">URL personnalisée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(() => {
            const placeholders: Record<string, string> = {
              calcom: 'https://cal.com/votre-nom/votre-evenement',
              calendly: 'https://calendly.com/votre-nom/votre-evenement',
              custom: 'https://votre-outil.com/mon-lien',
            };
            const formatByProvider: Record<string, string> = {
              calcom: 'https://cal.com/votre-nom/votre-evenement',
              calendly: 'https://calendly.com/votre-nom/votre-evenement',
              custom: 'https://votre-outil.com/mon-lien',
            };
            const labelByProvider: Record<string, string> = {
              calcom: 'URL Cal.com',
              calendly: 'URL Calendly',
              custom: 'URL personnalisée',
            };
            const placeholder = placeholders[calProvider] || placeholders.custom;
            const label = labelByProvider[calProvider] || 'URL du calendrier';
            const formatExample = formatByProvider[calProvider] || formatByProvider.custom;

            return (
              <>
                <div className="space-y-2">
                  <Label htmlFor="calcom-url-input">{label}</Label>
                  <Input
                    id="calcom-url-input"
                    type="url"
                    value={localCalcomUrl}
                    onChange={(e) => handleCalcomUrlChange(e.target.value)}
                    placeholder={placeholder}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format attendu :{' '}
                    <code className="bg-background px-2 py-1 rounded border font-mono">{formatExample}</code>
                  </p>
                </div>
              </>
            );
          })()}

        </CardContent>
      </Card>
    </div>
  );

  const handleSmsTemplateChange = (value: string) => {
    const templatesByMode = callMode === CallMode.Apporteur ? apporteurSmsTemplates : smsTemplates;
    const updatedTemplates = { ...templatesByMode, [selectedSmsType]: value };

    if (callMode === CallMode.Apporteur) {
      setApporteurSmsTemplates(updatedTemplates);
    } else {
      setSmsTemplates(updatedTemplates);
    }
    setHasChanges(true);
  };

  const renderSmsSettings = () => {
    const templatesByMode = callMode === CallMode.Apporteur ? apporteurSmsTemplates : smsTemplates;
    const currentTemplate = templatesByMode[selectedSmsType];
    const smsInfo = smsTypeLabels[selectedSmsType];
    const smsSuggestions = [
      { label: 'Civilité', value: 'civilite' },
      { label: 'Titre', value: 'titre' },
      { label: 'Nom de famille', value: 'nom' },
      { label: 'Prénom', value: 'prenom' },
      { label: 'Nom complet', value: 'nom_complet' },
      { label: 'Signature', value: 'signature' },
      { label: 'Détails RDV', value: 'rdv' },
      ...(selectedSmsType === SmsType.R0Externe ? [{ label: 'Adresse', value: 'adresse' }] : []),
    ];
    const smsAllowedKeys = smsSuggestions.map((s) => s.value);

    return (
      <div className="space-y-6">
        {/* Template Editor (par mode) */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                  <smsInfo.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">{smsInfo.label}</CardTitle>
                  <CardDescription>Personnalisez le contenu de ce type de SMS</CardDescription>
                </div>
              </div>
              <div className="space-y-1 w-full sm:w-auto">
                <span className="text-xs text-muted-foreground">Type de SMS</span>
                <Select
                  value={selectedSmsType}
                  onValueChange={(value) => setSelectedSmsType(value as SmsType)}
                >
                  <SelectTrigger
                    id="sms-type-selector"
                    className="z-[20001] w-full sm:w-fit min-w-[200px] max-w-full justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <SelectValue />
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </SelectTrigger>
                  <SelectContent className="z-[20001]">
                    {Object.entries(smsTypeLabels).map(([type, info]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <info.icon className="w-4 h-4" />
                          <span>{info.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Body Field */}
              <div className="space-y-2">
                <Label htmlFor={`sms-body-${selectedSmsType}`}>Message SMS</Label>
                <TemplateTextarea
                  id={`sms-body-${selectedSmsType}`}
                  value={currentTemplate}
                  onChange={handleSmsTemplateChange}
                  placeholder="Corps du message SMS"
                  rows={10}
                  suggestions={smsSuggestions}
                  allowedKeys={smsAllowedKeys}
                />
                <div className="text-xs text-muted-foreground">
                  Caractères: {currentTemplate.length} / 1600 (recommandé pour SMS long)
                </div>
              </div>

              {/* Variables Help */}
              <div className="bg-card p-4 rounded-lg border shadow-none">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Variables disponibles</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1">
                      <code className="bg-background px-2 py-1 rounded border text-xs">@civilite</code>
                      <span className="text-xs text-muted-foreground">(ex: Madame)</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <code className="bg-background px-2 py-1 rounded border text-xs">@nom</code>
                      <span className="text-xs text-muted-foreground">(ex: Dupont)</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <code className="bg-background px-2 py-1 rounded border text-xs">@prenom</code>
                      <span className="text-xs text-muted-foreground">(ex: Marie)</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <code className="bg-background px-2 py-1 rounded border text-xs">@nom_complet</code>
                      <span className="text-xs text-muted-foreground">(ex: Marie Dupont)</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <code className="bg-background px-2 py-1 rounded border text-xs">@rdv</code>
                      <span className="text-xs text-muted-foreground">(ex: lundi 1 janv 2025 à 09:00)</span>
                    </span>
                    {selectedSmsType === SmsType.R0Externe && (
                      <span className="inline-flex items-center gap-1">
                        <code className="bg-background px-2 py-1 rounded border text-xs">@adresse</code>
                        <span className="text-xs text-muted-foreground">(ex: 22 rue la Boétie, Paris)</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ces variables seront automatiquement remplacées par les informations du contact
                  </p>
                </div>
              </div>

              {/* Signature Section (après les variables, même design que l'email) */}
              <div className="rounded-lg border bg-card text-card-foreground shadow-none p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold leading-tight">Signature par défaut</h4>
                    <p className="text-sm text-muted-foreground">Utilisée automatiquement dans vos SMS</p>
                  </div>
                </div>
                <div className="w-full sm:w-[320px]">
                  <Input
                    id="signature-input-sms"
                    value={callMode === CallMode.Apporteur ? apporteurSignature : signature}
                    onChange={(e) => handleSignatureChange(e.target.value)}
                    placeholder="Votre nom et fonction"
                  />
                </div>
              </div>

              {/* Aperçu avec exemple */}
              {currentTemplate && (
                <div className="bg-card rounded-lg p-4 border shadow-none">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Aperçu avec exemple</span>
                  </div>
                  <div className="bg-background rounded-lg p-3 border text-xs font-mono whitespace-pre-wrap">
                    {(() => {
                      const previewRdv = 'notre entretien du lundi 1 janvier 2025 à 09:00';
                      const previewAdresse = '22 rue la Boétie, 75008 Paris';
                      const previewSignature =
                        (callMode === CallMode.Apporteur ? apporteurSignature : signature) || 'Votre signature';
                      const applyBoth = (text: string, key: string, replacement: string) =>
                        text
                          .replace(new RegExp(`@${key}\\b`, 'g'), replacement)
                          .replace(new RegExp(`\\{${key}\\}`, 'g'), replacement);

                      let preview = currentTemplate;
                      preview = applyBoth(preview, 'civilite', 'Madame');
                      preview = applyBoth(preview, 'nom', 'Dupont');
                      preview = applyBoth(preview, 'prenom', 'Marie');
                      preview = applyBoth(preview, 'nom_complet', 'Marie Dupont');
                      preview = applyBoth(preview, 'rdv', previewRdv);
                      preview = applyBoth(preview, 'adresse', previewAdresse);
                      preview = applyBoth(preview, 'signature', previewSignature);
                      return preview;
                    })()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Exemple avec : Civilité "Madame", Prénom "Marie", Nom "Dupont"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderTemplatesSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Templates</h3>
          <p className="text-sm text-muted-foreground">
            Gérez vos modèles Email et SMS au même endroit
          </p>
        </div>
      </div>

      <Tabs value={templateTab} onValueChange={(value) => setTemplateTab(value as 'email' | 'sms')} className="w-full">
        <TabsList className="grid grid-cols-2 w-full sm:w-auto">
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
        </TabsList>
        <TabsContent value="email">{renderEmailSettings()}</TabsContent>
        <TabsContent value="sms">{renderSmsSettings()}</TabsContent>
      </Tabs>
    </div>
  );

  const renderAppearanceSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle>Thème</CardTitle>
        <CardDescription>
          Choisissez le thème de l'application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {onThemeChange && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant={theme === Theme.Light ? "default" : "outline"}
              onClick={() => onThemeChange(Theme.Light)}
              className="flex flex-col h-auto p-4"
            >
              <Sun className="w-8 h-8 mb-2" />
              <span>Clair</span>
            </Button>
            <Button
              variant={theme === Theme.Dark ? "default" : "outline"}
              onClick={() => onThemeChange(Theme.Dark)}
              className="flex flex-col h-auto p-4"
            >
              <Moon className="w-8 h-8 mb-2" />
              <span>Sombre</span>
            </Button>
            <Button
              variant={theme === Theme.System ? "default" : "outline"}
              onClick={() => onThemeChange(Theme.System)}
              className="flex flex-col h-auto p-4"
            >
              <Monitor className="w-8 h-8 mb-2" />
              <span>Système</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderShortcutSettings = () => {
    const availableStatuses = StatusConfigService.getStatusList(callMode, { includeHidden: true });

    return (
      <Card>
        <CardHeader>
          <CardTitle>Raccourcis Clavier</CardTitle>
          <CardDescription>
            Configurez les actions pour les touches de fonction F1 à F10.
            Les changements sont sauvegardés lorsque vous cliquez sur "Sauvegarder".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <div className="divide-y">
              {/* F1 - Action d'appel fixe */}
              <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/20">
                <div className="flex items-center gap-3">
                  <div className="font-mono text-sm bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300 rounded-md h-8 w-8 flex items-center justify-center border border-blue-300 dark:border-blue-600">
                    F1
                  </div>
                  <span className="font-medium">📞 Appeler le contact sélectionné</span>
                </div>

                <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-600">
                  Fonction fixe
                </Badge>
              </div>

              {shortcuts.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-sm bg-muted text-muted-foreground rounded-md h-8 w-8 flex items-center justify-center border">
                      {shortcut.key}
                    </div>
                    <span>{shortcut.label}</span>
                  </div>

                  <Select
                    value={shortcut.status}
                    onValueChange={(value) => handleShortcutChange(shortcut.key, value)}
                  >
                    <SelectTrigger className="w-auto md:w-48">
                      <SelectValue>
                        <Badge className={cn("text-xs font-normal border", getStatusColor(shortcut.status))}>
                          {getStatusLabel(shortcut.status)}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableStatuses.map((status) => {
                        if (status === ContactStatus.A0 && callMode !== CallMode.Apporteur) return null;
                        return (
                          <SelectItem key={status} value={status}>
                            <Badge className={cn("text-xs font-normal border", getStatusColor(status))}>
                              {getStatusLabel(status)}
                            </Badge>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderColumnSettings = () => {

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Columns className="w-5 h-5" />
              Configuration des Colonnes
            </CardTitle>
            <CardDescription>
              Définissez quelles colonnes sont essentielles (ne peuvent pas être masquées) ou optionnelles dans le tableau des contacts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Input
                  value={columnSearch}
                  onChange={(e) => setColumnSearch(e.target.value)}
                  placeholder="Rechercher une colonne..."
                  className="max-w-xs bg-background"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-background"
                  onClick={handleColumnConfigReset}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Remettre par défaut
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.6fr_auto] gap-3 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Nom de colonne</Label>
                  <Input
                    value={newColumnName}
                    onChange={(e) => {
                      setNewColumnName(e.target.value);
                      setColumnFormError(null);
                    }}
                    placeholder="Ex: Lien perso"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Libellé</Label>
                  <Input
                    value={newColumnLabel}
                    onChange={(e) => {
                      setNewColumnLabel(e.target.value);
                      setColumnFormError(null);
                    }}
                    placeholder="Ex: Lien personnalisé"
                    className="bg-background"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleAddColumn} className="w-full md:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </div>

              {columnFormError && (
                <div className="text-xs text-red-600">{columnFormError}</div>
              )}

              {(() => {
                const lowered = columnSearch.trim().toLowerCase();
                const filteredColumns =
                  lowered.length === 0
                    ? columnOrderSettings
                    : columnOrderSettings.filter((name) => {
                      const label = columnLabels[name] || DEFAULT_COLUMN_CONFIG[name as keyof typeof DEFAULT_COLUMN_CONFIG]?.label || '';
                      return (
                        name.toLowerCase().includes(lowered) ||
                        label.toLowerCase().includes(lowered)
                      );
                    });

                if (filteredColumns.length === 0) {
                  return (
                    <div className="border rounded-md p-4 text-sm text-muted-foreground bg-muted/30">
                      Aucune colonne ne correspond à votre recherche.
                    </div>
                  );
                }

                return (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleColumnOrderDragEnd}>
                    <SortableContext items={filteredColumns} strategy={verticalListSortingStrategy}>
                      <div className="border rounded-md divide-y">
                        {filteredColumns.map((columnName) => {
                          const config = DEFAULT_COLUMN_CONFIG[columnName as keyof typeof DEFAULT_COLUMN_CONFIG];
                          const isEssential = columnConfig[columnName] ?? config?.isEssential ?? false;
                          const label = columnLabels[columnName] || config?.label || columnName;
                          const canRemove = !config?.isEssential;

                          return (
                            <SortableColumnRow
                              key={columnName}
                              columnName={columnName}
                              isEssential={isEssential}
                              label={label}
                              canRemove={canRemove}
                              onEssentialChange={handleColumnEssentialChange}
                              onRemove={handleRemoveColumn}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                );
              })()}

              <div className="pt-4 border-t text-sm text-muted-foreground">
                {Object.values(columnConfig).filter(Boolean).length} colonne(s) essentielle(s) sur {Object.keys(DEFAULT_COLUMN_CONFIG).length}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    );
  };

  const renderStatusEditor = () => {

    const displayedStatuses = statusOrder.filter((status) => statusConfig[status]);

    const getPresetKeyFor = (status: string): string => {
      const current = statusConfig[status]?.color || '';
      for (const preset of COLOR_PRESETS) {
        if (current.includes(`bg-${preset.key}-`)) return preset.key;
      }
      return 'gray';
    };

    const applyPreset = (status: string, presetKey: string) => {
      const preset = COLOR_PRESETS.find((p) => p.key === presetKey);
      if (!preset) return;
      const next = { ...statusConfig, [status]: { ...statusConfig[status], color: preset.badgeClass, dot: preset.dotClass } };
      setStatusConfig(next);
      StatusConfigService.saveConfig(next, callMode, statusOrder);
      setHasChanges(true);
    };

    const handleLabelChange = (status: string, newLabel: string) => {
      const next = { ...statusConfig, [status]: { ...statusConfig[status], label: newLabel } };
      setStatusConfig(next);
      StatusConfigService.saveConfig(next, callMode, statusOrder);
      setHasChanges(true);
    };

    const handleVisibilityToggle = (status: string, visible: boolean) => {
      const next = { ...statusConfig, [status]: { ...statusConfig[status], visible } };
      setStatusConfig(next);
      StatusConfigService.saveConfig(next, callMode, statusOrder);
      setHasChanges(true);
    };

    const handleAddStatus = () => {
      const label = newStatusLabel.trim();
      if (!label) {
        setStatusFormError('Ajoutez un libellé.');
        return;
      }

      // Interdire DO/RO explicitement
      if (label.toUpperCase() === 'DO') {
        setStatusFormError("Utilisez 'D0' (zéro) au lieu de 'DO'.");
        return;
      }
      if (label.toUpperCase() === 'RO') {
        setStatusFormError("Utilisez 'R0' (zéro) au lieu de 'RO'.");
        return;
      }

      const exists = statusOrder.some((status) => status.toLowerCase() === label.toLowerCase());
      if (exists) {
        setStatusFormError('Ce statut existe déjà.');
        return;
      }
      const preset = COLOR_PRESETS.find((p) => p.key === newStatusPreset) || COLOR_PRESETS[0];
      const nextState = StatusConfigService.addStatus(
        label,
        { label, color: preset.badgeClass, dot: preset.dotClass, visible: true },
        callMode
      );
      setStatusConfig(nextState.map);
      setStatusOrder(nextState.order);
      setHasChanges(true);
      setNewStatusLabel('');
      setStatusFormError(null);
    };

    const handleRemoveStatus = (status: string) => {
      if (isDefaultStatus(status)) {
        // Autorisé : suppression même des statuts natifs
      }
      const nextState = StatusConfigService.removeStatus(status, callMode);
      setStatusConfig(nextState.map);
      setStatusOrder(nextState.order);
      setHasChanges(true);
    };

    const handleDragEnd = (event: any) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = displayedStatuses.indexOf(active.id as string);
      const newIndex = displayedStatuses.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;
      const newOrder = arrayMove(displayedStatuses, oldIndex, newIndex);
      setStatusOrder(newOrder);
      const next = StatusConfigService.saveConfig(statusConfig, callMode, newOrder);
      setStatusConfig(next.map);
      setHasChanges(true);
    };


    return (
      <Card>
        <CardHeader>
          <CardTitle>Statuts personnalisés</CardTitle>
          <CardDescription>Un libellé, une couleur, une visibilité. Simple.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-background"
              onClick={() => {
                const reset = StatusConfigService.resetToDefaults(callMode);
                setStatusConfig(reset.map);
                setStatusOrder(reset.order);
                setHasChanges(true);
                setStatusFormError(null);
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Réinitialiser les statuts
            </Button>
            {statusFormError && (
              <div className="text-xs text-red-600">{statusFormError}</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[2fr_1.2fr_auto] gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Nouveau statut</Label>
              <Input
                value={newStatusLabel}
                onChange={(e) => {
                  setNewStatusLabel(e.target.value);
                  setStatusFormError(null);
                }}
                placeholder="Ex: En attente"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Couleur</Label>
              <Select value={newStatusPreset} onValueChange={(val) => setNewStatusPreset(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Couleur" />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_PRESETS.map((p) => (
                    <SelectItem key={p.key} value={p.key}>
                      <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', p.badgeClass)}>
                        <div className={cn('w-1.5 h-1.5 rounded-full', p.dotClass)} />
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAddStatus} className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>

          {statusFormError && (
            <div className="text-xs text-red-600">{statusFormError}</div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={displayedStatuses} strategy={verticalListSortingStrategy}>
              <div className="divide-y border rounded-md">
                {displayedStatuses.map((status) => {
                  const presetKey = getPresetKeyFor(status);
                  const preset = COLOR_PRESETS.find((p) => p.key === presetKey) || COLOR_PRESETS[0];
                  const label = statusConfig[status]?.label || status;
                  const visible = statusConfig[status]?.visible !== false;

                  return (
                    <SortableStatusRow
                      key={status}
                      status={status}
                      presetKey={presetKey}
                      preset={preset}
                      label={label}
                      visible={visible}
                      isDefault={isDefaultStatus(status)}
                      onLabelChange={handleLabelChange}
                      onPresetChange={applyPreset}
                      onVisibilityToggle={handleVisibilityToggle}
                      onRemove={handleRemoveStatus}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>

        </CardContent>
      </Card>
    );
  };



  const renderStorageSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Stockage des fichiers</h3>
          <p className="text-sm text-muted-foreground">
            Configurez l'emplacement racine où seront stockés les dossiers des contacts.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dossier Racine</CardTitle>
          <CardDescription>
            Tous les dossiers de contacts seront créés dans ce répertoire par défaut.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Chemin actuel</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={localStorage.getItem('dimicall_root_path') || 'C:\\DimiCall'}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      // @ts-ignore
                      const result = await window.electronAPI.pickFolder();
                      if (result.success && result.path) {
                        localStorage.setItem('dimicall_root_path', result.path);
                        setHasChanges(true);
                        window.dispatchEvent(new Event('storage'));
                        // Force re-render
                        setTemplateTab(prev => prev);
                      }
                    } catch (error) {
                      console.error('Error picking folder:', error);
                    }
                  }}
                >
                  <Folder className="mr-2 h-4 w-4" />
                  Changer...
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-md p-4 flex gap-3">
        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-semibold mb-1">Comment ça marche ?</p>
          <p>
            DimiCall crée automatiquement un dossier pour chaque contact au format : <br />
            <code className="bg-blue-100 dark:bg-blue-900/30 px-1 py-0.5 rounded text-xs">NOM Prénom - 0612345678</code>
          </p>
          <p className="mt-2 text-xs opacity-80">
            Vous pouvez également lier manuellement un dossier existant à un contact depuis sa fiche.
          </p>
        </div>
      </div>
    </div>
  );

  const renderCategory = () => {
    switch (activeCategory) {
      case 'templates':
        return renderTemplatesSettings();
      case 'calcom':
        return renderCalcomSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'shortcuts':
        return renderShortcutSettings();
      case 'update':
        return renderUpdateSettings();
      case 'diagnostic':
        return devToolsEnabled ? renderDiagnosticSettings() : renderTemplatesSettings();
      case 'columns':
        return renderColumnSettings();
      case 'statuses':
        return renderStatusEditor();
      case 'data-sharing':
        return renderDataSharingSettings();
      case 'logs':
        return devToolsEnabled ? renderLogsSettings() : renderTemplatesSettings();
      case 'storage':
        return renderStorageSettings();
      default:
        return renderTemplatesSettings();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-[1400px] xl:max-w-7xl w-full h-[95vh] sm:h-[90vh] flex flex-col p-0 gap-0">
        <AnimatePresence>
          {shockwaveId > 0 && (
            <motion.div
              key={shockwaveId}
              className="pointer-events-none fixed inset-0 z-[99998]"
              initial={{ scale: 0.2, opacity: 0.35 }}
              animate={{ scale: 4.2, opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                background: 'radial-gradient(circle at center, rgba(236,72,153,0.55) 0%, rgba(168,85,247,0.35) 35%, rgba(34,211,238,0.35) 55%, transparent 70%)',
                transformOrigin: 'center center',
                willChange: 'transform, opacity'
              }}
            />
          )}
        </AnimatePresence>
        <DialogHeader className="p-3 sm:p-4 border-b flex-row items-center justify-between gap-2 bg-white dark:bg-background transition-colors">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Réglages</span>
            <span className="sm:hidden">Réglages</span>
          </DialogTitle>
          <div className="flex items-center gap-2 sm:gap-4">
            <div
              className="relative flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 shadow-sm dark:border-border/60"
              aria-label={`Mode actuel : ${callMode === CallMode.Apporteur ? 'Apporteur' : 'Client'}`}
            >
              <span className="text-xs sm:text-sm text-muted-foreground">Mode :</span>
              <Badge
                variant={callMode === CallMode.Apporteur ? "default" : "secondary"}
                className={
                  callMode === CallMode.Apporteur
                    ? "text-[11px] sm:text-xs px-2 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-400 text-white border-0 shadow-[0_0_12px_rgba(236,72,153,0.35)]"
                    : "text-[11px] sm:text-xs px-2"
                }
              >
                {callMode === CallMode.Apporteur ? 'Apporteur' : 'Client'}
              </Badge>
              <Switch
                checked={callMode === CallMode.Apporteur}
                onCheckedChange={(checked) => {
                  const newMode = checked ? CallMode.Apporteur : CallMode.Client;
                  setCallMode(newMode);
                  setMode(newMode);
                  if (checked) setShockwaveId((id) => id + 1);
                }}
                className={
                  callMode === CallMode.Apporteur
                    ? "scale-75 sm:scale-100 data-[state=checked]:bg-[linear-gradient(90deg,#ec4899,#a855f7,#22d3ee)] data-[state=unchecked]:bg-[linear-gradient(90deg,#e5e7eb,#d1d5db,#e5e7eb)] shadow-[0_0_10px_rgba(168,85,247,0.35)] border-transparent"
                    : "scale-75 sm:scale-100"
                }
              />
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-0 bg-white dark:bg-background transition-colors">
          <SidebarProvider className="w-full h-full min-h-0">
            <Sidebar collapsible="none" className="w-[--sidebar-width] border-r bg-muted/20">
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {(() => {
                        const allCategories = getCategories(devToolsEnabled, isUpdateEnabled);
                        const getCat = (id: string) => allCategories.find(c => c.id === id);

                        const renderNavItem = (id: string) => {
                          const category = getCat(id);
                          if (!category) return null;
                          return (
                            <SidebarMenuItem key={category.id}>
                              <SidebarMenuButton
                                isActive={activeCategory === category.id}
                                onClick={() => setActiveCategory(category.id)}
                                tooltip={category.description}
                                className="h-auto py-2"
                              >
                                <category.icon className="w-4 h-4 shrink-0" />
                                <div className="flex flex-col gap-1 items-start text-left min-w-0">
                                  <span className="font-medium line-clamp-1">{category.label}</span>
                                  {activeCategory === category.id && (
                                    <span className="text-[10px] text-muted-foreground line-clamp-1 font-normal opacity-80">
                                      {category.description}
                                    </span>
                                  )}
                                </div>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        };

                        return (
                          <>
                            {/* Menu Principal */}
                            {['templates', 'calcom', 'appearance', 'shortcuts'].map(id => renderNavItem(id))}

                            {/* Paramètres avancés */}
                            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen} className="group/collapsible">
                              <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground font-semibold text-pink-500 dark:text-pink-400">
                                    <Settings className="w-4 h-4" />
                                    <span>Paramètres avancés</span>
                                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                  </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <SidebarMenuSub>
                                    {['columns', 'statuses', 'data-sharing'].map(id => {
                                      const category = getCat(id);
                                      if (!category) return null;
                                      return (
                                        <SidebarMenuSubItem key={id}>
                                          <SidebarMenuSubButton
                                            isActive={activeCategory === category.id}
                                            onClick={() => setActiveCategory(category.id)}
                                            className="h-auto py-1.5"
                                          >
                                            <div className="flex flex-col gap-0.5 items-start text-left min-w-0">
                                              <span className="font-medium line-clamp-1">{category.label}</span>
                                            </div>
                                          </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                      );
                                    })}

                                    {/* Outils de développement */}
                                    <Collapsible open={isDevToolsOpen} onOpenChange={setIsDevToolsOpen} className="group/devtools">
                                      <SidebarMenuSubItem>
                                        <CollapsibleTrigger asChild>
                                          <SidebarMenuSubButton className="font-semibold text-emerald-600 dark:text-emerald-500">
                                            <span>Outils Dev</span>
                                            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/devtools:rotate-90" />
                                          </SidebarMenuSubButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                          <SidebarMenuSub>
                                            {['update', 'diagnostic', 'logs'].map(id => {
                                              const category = getCat(id);
                                              if (!category) return null;
                                              return (
                                                <SidebarMenuSubItem key={id}>
                                                  <SidebarMenuSubButton
                                                    isActive={activeCategory === category.id}
                                                    onClick={() => setActiveCategory(category.id)}
                                                    className="h-auto py-1.5"
                                                  >
                                                    <span className="font-medium line-clamp-1">{category.label}</span>
                                                  </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                              );
                                            })}
                                          </SidebarMenuSub>
                                        </CollapsibleContent>
                                      </SidebarMenuSubItem>
                                    </Collapsible>
                                  </SidebarMenuSub>
                                </CollapsibleContent>
                              </SidebarMenuItem>
                            </Collapsible>
                          </>
                        );
                      })()}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>

            {/* Contenu principal */}
            <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto w-full min-w-0">
              {renderCategory()}
            </main>
          </SidebarProvider>
        </div>

        {/* Pied de page avec boutons */}
        <div className="p-3 sm:p-4 border-t flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 bg-white dark:bg-background transition-colors">
          <Button variant="ghost" onClick={handleReset} className="text-xs sm:text-sm h-8 sm:h-9">Réinitialiser</Button>
          <Button onClick={handleSave} disabled={!hasChanges} className="text-xs sm:text-sm h-8 sm:h-9">
            <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Sauvegarder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Fonction utilitaire pour récupérer les templates sauvegardés
export const getSavedEmailTemplates = (): { templates: EmailTemplates; signature: string } => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      return {
        templates: data.templates || defaultTemplates,
        signature: data.signature || ''
      };
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error);
    }
  }
  return {
    templates: defaultTemplates,
    signature: ''
  };
};

// Fonction utilitaire pour récupérer la configuration des colonnes sauvegardée
export const getSavedColumnConfig = (): Record<string, boolean> => {
  const saved = localStorage.getItem(COLUMNS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('Erreur lors du chargement de la config des colonnes:', error);
    }
  }

  // Retourner la config par défaut
  const defaultConfig: Record<string, boolean> = {};
  Object.keys(DEFAULT_COLUMN_CONFIG).forEach(column => {
    defaultConfig[column] = DEFAULT_COLUMN_CONFIG[column as keyof typeof DEFAULT_COLUMN_CONFIG].isEssential;
  });
  return defaultConfig;
}; 
