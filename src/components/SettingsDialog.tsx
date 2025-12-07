import React, { useState, useEffect } from 'react';
import { Settings, Mail, X, Save, Undo, ChevronDown, Palette, Calendar, MessageSquare, Sun, Moon, Monitor, Keyboard, RotateCcw, DownloadCloud, Info, CheckCircle, ExternalLink, Columns, FileText, PhoneCall } from 'lucide-react';
import { BetaOptInSettings } from './BetaOptInSettings';
import { LogsViewer } from './LogsViewer';
import { useAutoUpdate } from '../hooks/useAutoUpdate';
import { DevToolsService } from '../services/devToolsService';
import { BetaPreferencesService, BetaPreferences } from '../services/betaPreferencesService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { EmailType, SmsType, Civility, Theme, ContactStatus, CallMode } from '../types';
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
    body: "Bonjour {titre} {nom},\n\nPour resituer mon appel, je suis gérant privé au sein du cabinet de gestion de patrimoine Arcanis Conseil. Je vous envoie l'adresse de notre site web que vous puissiez en savoir d'avantage : https://arcanis-conseil.fr\n\nLe site est avant tout une vitrine, le mieux est de m'appeler si vous souhaitez davantage d'informations ou de prendre un créneau de 30 minutes dans mon agenda via ce lien : https://cal.com/dimitri-morel-arcanis-conseil/audit-patrimonial?overlayCalendar=true\n\nBien à vous,"
  },
  [EmailType.D0Visio]: {
    subject: "Confirmation rendez-vous visio - Arcanis Conseil",
    body: "Bonjour {titre} {nom}, merci pour votre temps lors de notre échange téléphonique. \n\nSuite à notre appel, je vous confirme {rdv} en visio.\n\nPour rappel, notre entretien durera une trentaine de minutes. Le but est de vous présenter plus en détail Arcanis Conseil, d'effectuer ensemble l'état des lieux de votre situation patrimoniale (revenus, patrimoine immobilier, épargne constituée etc.), puis de vous donner un diagnostic de vos leviers. Notre métier est de vous apporter un conseil pertinent et personnalisé sur l'optimisation de votre patrimoine.\n\nJe vous invite à visiter notre site internet pour de plus amples renseignements avant le début de notre échange : www.arcanis-conseil.fr\n\nN'hésitez pas à revenir vers moi en cas de question ou d'un besoin supplémentaire d'information.\n\nBien cordialement"
  },
  [EmailType.R0Interne]: {
    subject: "Confirmation rendez-vous présentiel - Arcanis Conseil",
    body: "Bonjour {titre} {nom}, merci pour votre temps lors de notre échange téléphonique. \n\nSuite à notre appel, je vous confirme {rdv} dans nos locaux au 22 rue la Boétie, 75008 Paris.\n\nPour rappel, notre entretien durera une trentaine de minutes. Le but est de vous présenter plus en détail Arcanis Conseil, d'effectuer ensemble l'état des lieux de votre situation patrimoniale (revenus, patrimoine immobilier, épargne constituée etc.), puis de vous donner un diagnostic de vos leviers. Notre métier est de vous apporter un conseil pertinent et personnalisé sur l'optimisation de votre patrimoine.\n\nJe vous invite à visiter notre site internet pour de plus amples renseignements avant le début de notre échange : www.arcanis-conseil.fr\n\nN'hésitez pas à revenir vers moi en cas de question ou d'un besoin supplémentaire d'information.\n\nBien cordialement"
  },
  [EmailType.R0Externe]: {
    subject: "Confirmation rendez-vous présentiel - Arcanis Conseil",
    body: "Bonjour {titre} {nom}, merci pour votre temps lors de notre échange téléphonique. \n\nSuite à notre appel, je vous confirme {rdv} à {adresse}.\n\nPour rappel, notre entretien durera une trentaine de minutes. Le but est de vous présenter plus en détail Arcanis Conseil, d'effectuer ensemble l'état des lieux de votre situation patrimoniale (revenus, patrimoine immobilier, épargne constituée etc.), puis de vous donner un diagnostic de vos leviers. Notre métier est de vous apporter un conseil pertinent et personnalisé sur l'optimisation de votre patrimoine.\n\nJe vous invite à visiter notre site internet pour de plus amples renseignements avant le début de notre échange : www.arcanis-conseil.fr\n\nN'hésitez pas à revenir vers moi en cas de question ou d'un besoin supplémentaire d'information.\n\nBien cordialement"
  }
};

interface SmsTemplates {
  [SmsType.PremierContact]: string;
  [SmsType.D0Visio]: string;
  [SmsType.R0Interne]: string;
  [SmsType.R0Externe]: string;
}

const defaultSmsTemplates: SmsTemplates = {
  [SmsType.PremierContact]: `Bonjour {civilite} {nom},

Pour resituer mon appel, je suis gérant privé au sein du cabinet de gestion de patrimoine Arcanis Conseil. Je vous envoie l'adresse de notre site web que vous puissiez en savoir davantage : https://arcanis-conseil.fr

Le site est avant tout une vitrine. Le mieux est de m'appeler si vous souhaitez davantage d'informations ou de prendre un créneau de 30 minutes dans mon agenda via ce lien : https://cal.com/dimitri-morel-arcanis-conseil/audit-patrimonial?overlayCalendar=true

Bien à vous,`,
  [SmsType.D0Visio]: `Bonjour {civilite} {nom},

Suite à notre appel, je vous confirme {rdv} en visio. Nous prendrons 30 minutes pour faire un point rapide et vous présenter Arcanis Conseil.

À très bientôt,`,
  [SmsType.R0Interne]: `Bonjour {civilite} {nom},

Suite à notre appel, je vous confirme {rdv} dans nos locaux (22 rue la Boétie, 75008 Paris). Prévoir 30 minutes pour l'entretien.

À très bientôt,`,
  [SmsType.R0Externe]: `Bonjour {civilite} {nom},

Suite à notre appel, je vous confirme {rdv} à {adresse}. Prévoir 30 minutes pour l'entretien.

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
const MODE_STORAGE_KEY = 'dimicall-call-mode';

// Configuration par défaut des colonnes
const DEFAULT_COLUMN_CONFIG = {
  '#': { isEssential: true, label: 'Numéro de ligne' },
  'Prénom': { isEssential: true, label: 'Prénom du contact' },
  'Nom': { isEssential: true, label: 'Nom du contact' },
  'Commentaire': { isEssential: true, label: 'Commentaire/Qualification' },
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
  'Source': { isEssential: false, label: 'Source du contact' }
};

type SettingsCategory = 'email' | 'sms' | 'calcom' | 'appearance' | 'shortcuts' | 'update' | 'columns' | 'statuses' | 'data-sharing' | 'diagnostic' | 'logs';

const getCategories = (devToolsEnabled: boolean, updateEnabled: boolean = true) => [
  { 
    id: 'email' as SettingsCategory, 
    label: 'Templates Email', 
    icon: Mail, 
    description: 'Personnalisez vos modèles d\'email'
  },
  { 
    id: 'sms' as SettingsCategory, 
    label: 'Templates SMS', 
    icon: MessageSquare, 
    description: 'Personnalisez vos modèles de SMS pour chaque type'
  },
  { 
    id: 'calcom' as SettingsCategory, 
    label: 'Cal.com', 
    icon: Calendar, 
    description: 'Configuration de votre calendrier'
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
  }] : [])
] as const;

const emailTypeLabels = {
  [EmailType.PremierContact]: { label: 'Premier Contact', icon: Mail },
  [EmailType.D0Visio]: { label: 'D0 Visio', icon: Calendar },
  [EmailType.R0Interne]: { label: 'R0 Interne', icon: Settings },
  [EmailType.R0Externe]: { label: 'R0 Externe', icon: MessageSquare }
};

// Template SMS par défaut
const DEFAULT_SMS_TEMPLATE = `Bonjour {civilite} {nom},

Pour resituer mon appel, je suis gérant privé au sein du cabinet de gestion de patrimoine Arcanis Conseil.

Je vous envoie l'adresse de notre site web que vous puissiez en savoir d'avantage :
https://arcanis-conseil.fr

Le site est avant tout une vitrine, le mieux est de m'appeler si vous souhaitez davantage d'informations ou de prendre un créneau de 30 minutes dans mon agenda via ce lien :
https://calendly.com/dimitri-morel-arcanis-conseil/audit

Bien à vous,

Dimitri MOREL - Arcanis Conseil`;

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
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('email');
  const [templates, setTemplates] = useState<EmailTemplates>(defaultTemplates);
  const [apporteurTemplates, setApporteurTemplates] = useState<EmailTemplates>(defaultTemplates);
  const [signature, setSignature] = useState('');
  const [apporteurSignature, setApporteurSignature] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedEmailType, setSelectedEmailType] = useState<EmailType>(EmailType.PremierContact);
  const [selectedSmsType, setSelectedSmsType] = useState<SmsType>(SmsType.PremierContact);
  const [localCalcomUrl, setLocalCalcomUrl] = useState<string>(calcomUrl || 'https://cal.com/dimitri-morel-arcanis-conseil/audit-patrimonial?overlayCalendar=true');
  const [localSmsTemplate, setLocalSmsTemplate] = useState<string>(smsTemplate || DEFAULT_SMS_TEMPLATE);
  const [localSmsTemplateApporteur, setLocalSmsTemplateApporteur] = useState<string>(smsTemplate || DEFAULT_SMS_TEMPLATE);
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplates>(defaultSmsTemplates);
  const [apporteurSmsTemplates, setApporteurSmsTemplates] = useState<SmsTemplates>(defaultSmsTemplates);
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>([]);
  const [shortcutsChanged, setShortcutsChanged] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('Chargement...');
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [callMode, setCallMode] = useState<CallMode>(() => {
    try {
      const saved = localStorage.getItem(MODE_STORAGE_KEY);
      return saved === CallMode.Apporteur ? CallMode.Apporteur : CallMode.Client;
    } catch {
      return CallMode.Client;
    }
  });

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
  
  // Configuration des colonnes
  const [columnConfig, setColumnConfig] = useState<Record<string, boolean>>({});
  const [columnConfigChanged, setColumnConfigChanged] = useState(false);
  // Éditeur de statuts: configuration par mode (libellés/couleurs/visibilité)
  const [statusConfig, setStatusConfig] = useState<StatusConfigMap>(() => StatusConfigService.getConfig());
  
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
      const next = StatusConfigService.getConfig(callMode);
      setStatusConfig(next);
    } catch {}
  }, [callMode, activeCategory, isOpen]);

  // Charger les informations de diagnostic quand la section diagnostic est ouverte
  useEffect(() => {
    if (isOpen && activeCategory === 'diagnostic') {
      loadDiagnosticInfo();
    }
  }, [isOpen, activeCategory]);

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
  const handleShortcutChange = (key: string, newStatus: ContactStatus) => {
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
    setColumnConfigChanged(true);
    setHasChanges(true);
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
      setLocalSmsTemplate(DEFAULT_SMS_TEMPLATE);
      handleShortcutsReset();
      handleColumnConfigReset();
      
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
        // Si l'utilisateur désactive les DevTools alors qu'il est sur la section Logs,
        // le rediriger vers la section Email
        if (activeCategory === 'logs') {
          setActiveCategory('email');
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <BetaOptInSettings
              betaPreferences={betaPreferences}
              onPreferencesChange={handleBetaPreferencesChange}
              isCurrentVersionBeta={betaPreferences.enabled}
              onRevertToStable={handleRevertToStable}
              isRevertingToStable={isRevertingToStable}
              devToolsEnabled={devToolsEnabled}
              onDevToolsToggle={handleDevToolsToggle}
            />
            
            {/* Afficher un message informatif quand les DevTools sont activés */}
            {devToolsEnabled && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="font-medium text-sm">Section Logs disponible</h4>
                      <p className="text-xs text-muted-foreground">
                        Les DevTools sont activés. Vous pouvez maintenant accéder à la section "Logs" 
                        pour consulter et analyser les logs système de l'application.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDiagnosticSettings = () => {
    return (
      <div className="space-y-6">
        <Card>
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
                <div className="bg-white dark:bg-card p-3 rounded-md text-sm font-mono border shadow-none">
                  <pre>{JSON.stringify(diagnosticInfo.betaPreferences, null, 2)}</pre>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-medium">État des mises à jour</Label>
              {diagnosticInfo.updateStatus && (
                <div className="bg-white dark:bg-card p-3 rounded-md text-sm font-mono border shadow-none">
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

    return (
      <div className="space-y-6">
        {/* Signature Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                <Settings className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Signature par défaut</CardTitle>
                <CardDescription>Utilisée automatiquement dans tous vos emails</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Input
              id="signature-input"
              value={callMode === CallMode.Apporteur ? apporteurSignature : signature}
              onChange={(e) => handleSignatureChange(e.target.value)}
              placeholder="Votre nom et fonction"
            />
          </CardContent>
        </Card>

        <Separator />

        {/* Template Selection & Editor */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Templates d'Email</h3>
              <p className="text-sm text-muted-foreground">
                Personnalisez vos modèles d'email pour chaque type d'interaction
              </p>
            </div>
            {hasChanges && (
              <Badge variant="outline" className="text-xs">
                Non sauvegardé
              </Badge>
            )}
          </div>

          {/* Email Type Selector */}
          <div className="space-y-3">
            <Label htmlFor="email-type-selector">Type d'email</Label>
            <Select 
              value={selectedEmailType} 
              onValueChange={(value) => setSelectedEmailType(value as EmailType)}
            >
              <SelectTrigger id="email-type-selector">
                <SelectValue />
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

          {/* Template Editor (par mode) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                  <emailInfo.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">{emailInfo.label}</CardTitle>
                  <CardDescription>Personnalisez le contenu de ce type d'email</CardDescription>
                </div>
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
                <Textarea
                  id={`body-${selectedEmailType}`}
                  value={currentTemplate.body}
                  onChange={(e) => handleTemplateChange('body', e.target.value)}
                  placeholder="Corps du message"
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              {/* Variables Help */}
              <div className="bg-white dark:bg-card p-4 rounded-lg border shadow-none">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Variables disponibles</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <code className="bg-background px-2 py-1 rounded border text-xs">{'{titre}'}</code>
                    <code className="bg-background px-2 py-1 rounded border text-xs">{'{nom}'}</code>
                    <code className="bg-background px-2 py-1 rounded border text-xs">{'{signature}'}</code>
                    <code className="bg-background px-2 py-1 rounded border text-xs">{'{rdv}'}</code>
                    {selectedEmailType === EmailType.R0Externe && (
                      <code className="bg-background px-2 py-1 rounded border text-xs">{'{adresse}'}</code>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ces variables seront automatiquement remplacées par les informations du contact
                  </p>
                </div>
              </div>
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
              <CardTitle className="text-base">Configuration Cal.com</CardTitle>
              <CardDescription>Personnalisez l'URL de votre calendrier de prise de rendez-vous</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bandeau mode actif */}
          <div className="flex items-center justify-between p-3 rounded-md bg-white dark:bg-card border shadow-none">
            <div className="text-sm">
              Mode actif : <strong>{callMode === CallMode.Apporteur ? 'Apporteur' : 'Client'}</strong>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={callMode === CallMode.Client ? 'default' : 'secondary'} className="text-[10px]">Client</Badge>
              <Switch
                checked={callMode === CallMode.Apporteur}
                onCheckedChange={(checked) => {
                  const newMode = checked ? CallMode.Apporteur : CallMode.Client;
                  setCallMode(newMode);
                  try { localStorage.setItem(MODE_STORAGE_KEY, newMode); } catch {}
                }}
              />
              <Badge variant={callMode === CallMode.Apporteur ? 'default' : 'secondary'} className="text-[10px]">Apporteur</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="calcom-url-input">URL Cal.com</Label>
            <Input
              id="calcom-url-input"
              type="url"
              value={localCalcomUrl}
              onChange={(e) => handleCalcomUrlChange(e.target.value)}
              placeholder="https://cal.com/votre-nom/votre-événement"
            />
          </div>

          {/* Informations d'aide */}
          <div className="bg-white dark:bg-card rounded-lg p-4 border shadow-none">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">Guide de configuration</p>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>• Utilisez l'URL complète de votre événement Cal.com</p>
                <p>• Format: <code className="bg-background px-2 py-1 rounded border font-mono">https://cal.com/votre-nom/votre-événement</code></p>
                <p>• Les informations du contact seront automatiquement ajoutées :</p>
                <div className="grid grid-cols-1 gap-1 ml-4">
                  <code className="bg-background px-2 py-1 rounded border text-xs font-mono">name (nom du contact)</code>
                  <code className="bg-background px-2 py-1 rounded border text-xs font-mono">email (email du contact)</code>
                  <code className="bg-background px-2 py-1 rounded border text-xs font-mono">smsReminderNumber (téléphone)</code>
                </div>
              </div>
            </div>
          </div>

          {/* Aperçu de l'URL finale */}
          {localCalcomUrl && (
            <div className="bg-white dark:bg-card rounded-lg p-4 border shadow-none">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Aperçu</span>
              </div>
              <div className="text-xs font-mono text-muted-foreground break-all">
                {localCalcomUrl}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Cette URL sera utilisée lors du clic sur le bouton "Cal.com" du ruban
              </p>
            </div>
          )}
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

    return (
      <div className="space-y-6">
        <Separator />

        {/* Template Selection & Editor */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Templates SMS</h3>
              <p className="text-sm text-muted-foreground">
                Personnalisez vos modèles de SMS pour chaque type d'interaction
              </p>
            </div>
            {hasChanges && (
              <Badge variant="outline" className="text-xs">
                Non sauvegardé
              </Badge>
            )}
          </div>

          {/* SMS Type Selector */}
          <div className="space-y-3">
            <Label htmlFor="sms-type-selector">Type de SMS</Label>
            <Select 
              value={selectedSmsType} 
              onValueChange={(value) => setSelectedSmsType(value as SmsType)}
            >
              <SelectTrigger id="sms-type-selector" className="z-[20001]">
                <SelectValue />
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

          {/* Template Editor (par mode) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                  <smsInfo.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">{smsInfo.label}</CardTitle>
                  <CardDescription>Personnalisez le contenu de ce type de SMS</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bandeau mode actif */}
              <div className="flex items-center justify-between p-3 rounded-md bg-white dark:bg-card border shadow-none">
                <div className="text-sm">
                  Mode actif : <strong>{callMode === CallMode.Apporteur ? 'Apporteur' : 'Client'}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={callMode === CallMode.Client ? 'default' : 'secondary'} className="text-[10px]">Client</Badge>
                  <Switch
                    checked={callMode === CallMode.Apporteur}
                    onCheckedChange={(checked) => {
                      const newMode = checked ? CallMode.Apporteur : CallMode.Client;
                      setCallMode(newMode);
                      try { localStorage.setItem(MODE_STORAGE_KEY, newMode); } catch {}
                    }}
                  />
                  <Badge variant={callMode === CallMode.Apporteur ? 'default' : 'secondary'} className="text-[10px]">Apporteur</Badge>
                </div>
              </div>

              {/* Body Field */}
              <div className="space-y-2">
                <Label htmlFor={`sms-body-${selectedSmsType}`}>Message SMS</Label>
                <Textarea
                  id={`sms-body-${selectedSmsType}`}
                  value={currentTemplate}
                  onChange={(e) => handleSmsTemplateChange(e.target.value)}
                  placeholder="Corps du message SMS"
                  rows={10}
                  className="font-mono text-sm"
                />
                <div className="text-xs text-muted-foreground">
                  Caractères: {currentTemplate.length} / 1600 (recommandé pour SMS long)
                </div>
              </div>

              {/* Variables Help */}
              <div className="bg-white dark:bg-card p-4 rounded-lg border shadow-none">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Variables disponibles</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <code className="bg-background px-2 py-1 rounded border text-xs">{'{civilite}'}</code>
                    <code className="bg-background px-2 py-1 rounded border text-xs">{'{nom}'}</code>
                    <code className="bg-background px-2 py-1 rounded border text-xs">{'{prenom}'}</code>
                    <code className="bg-background px-2 py-1 rounded border text-xs">{'{nom_complet}'}</code>
                    <code className="bg-background px-2 py-1 rounded border text-xs">{'{rdv}'}</code>
                    {selectedSmsType === SmsType.R0Externe && (
                      <code className="bg-background px-2 py-1 rounded border text-xs">{'{adresse}'}</code>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ces variables seront automatiquement remplacées par les informations du contact
                  </p>
                </div>
              </div>

              {/* Aperçu avec exemple */}
              {currentTemplate && (
                <div className="bg-white dark:bg-card rounded-lg p-4 border shadow-none">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Aperçu avec exemple</span>
                  </div>
                  <div className="bg-background rounded-lg p-3 border text-xs font-mono whitespace-pre-wrap">
                    {(() => {
                      const previewRdv = 'notre entretien du lundi 1 janvier 2025 à 09:00';
                      const previewAdresse = '22 rue la Boétie, 75008 Paris';
                      return currentTemplate
                        .replace(/{civilite}/g, 'Madame')
                        .replace(/{nom}/g, 'Dupont')
                        .replace(/{prenom}/g, 'Marie')
                        .replace(/{nom_complet}/g, 'Marie Dupont')
                        .replace(/{rdv}/g, previewRdv)
                        .replace(/{adresse}/g, previewAdresse);
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
    const availableStatuses = Object.values(ContactStatus);

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
                    onValueChange={(value) => handleShortcutChange(shortcut.key, value as ContactStatus)}
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

  const renderColumnSettings = () => (
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
            <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Les colonnes essentielles restent toujours visibles
                </span>
              </div>
            </div>

            <div className="border rounded-md divide-y">
              {Object.keys(DEFAULT_COLUMN_CONFIG).map((columnName) => {
                const config = DEFAULT_COLUMN_CONFIG[columnName as keyof typeof DEFAULT_COLUMN_CONFIG];
                const isEssential = columnConfig[columnName] ?? config.isEssential;
                
                return (
                  <div key={columnName} className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <div>
                          <div className="font-medium">{columnName}</div>
                          <div className="text-sm text-muted-foreground">{config.label}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`column-${columnName}`}
                          checked={isEssential}
                          onCheckedChange={(checked) => handleColumnEssentialChange(columnName, checked)}
                        />
                        <Label htmlFor={`column-${columnName}`} className="text-sm">
                          {isEssential ? (
                            <Badge variant="default" className="text-xs">Essentielle</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Optionnelle</Badge>
                          )}
                        </Label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {Object.values(columnConfig).filter(Boolean).length} colonne(s) essentielle(s) sur {Object.keys(DEFAULT_COLUMN_CONFIG).length}
              </div>
              <Button variant="outline" size="sm" onClick={handleColumnConfigReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Remettre par défaut
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Impact des Modifications</CardTitle>
          <CardDescription>
            Comment ces paramètres affectent l'interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Les colonnes <strong>essentielles</strong> ne peuvent pas être masquées via le menu "Colonnes"</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Les colonnes <strong>optionnelles</strong> peuvent être masquées individuellement</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>L'option "Masquer les colonnes optionnelles" ne cache que les colonnes non-essentielles</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Les paramètres sont sauvegardés automatiquement à la fermeture</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStatusEditor = () => {
    // Presets de couleurs (shadcn/tailwind) simplifiés
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

    const getPresetKeyFor = (status: ContactStatus): string => {
      const current = statusConfig[status]?.color || '';
      for (const preset of COLOR_PRESETS) {
        if (current.includes(`bg-${preset.key}-`)) return preset.key;
      }
      return 'gray';
    };

    const applyPreset = (status: ContactStatus, presetKey: string) => {
      const preset = COLOR_PRESETS.find((p) => p.key === presetKey);
      if (!preset) return;
      const next = { ...statusConfig, [status]: { ...statusConfig[status], color: preset.badgeClass, dot: preset.dotClass } };
      setStatusConfig(next);
      StatusConfigService.saveConfig(next, callMode);
      setHasChanges(true);
    };

    const handleLabelChange = (status: ContactStatus, newLabel: string) => {
      const next = { ...statusConfig, [status]: { ...statusConfig[status], label: newLabel } };
      setStatusConfig(next);
      StatusConfigService.saveConfig(next, callMode);
      setHasChanges(true);
    };

    const handleVisibilityToggle = (status: ContactStatus, visible: boolean) => {
      const next = { ...statusConfig, [status]: { ...statusConfig[status], visible } };
      setStatusConfig(next);
      StatusConfigService.saveConfig(next, callMode);
      setHasChanges(true);
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>Statuts personnalisés</CardTitle>
          <CardDescription>Un libellé, une couleur, une visibilité. Simple.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y border rounded-md">
            {Object.values(ContactStatus).map((status) => {
              const presetKey = getPresetKeyFor(status);
              const preset = COLOR_PRESETS.find(p => p.key === presetKey)!;
              const label = statusConfig[status]?.label || status;
              return (
                <div key={status} className="p-3 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="text-sm font-medium">{status}</div>
                  </div>

                  <div>
                    <Label className="text-xs">Libellé</Label>
                    <Input value={label} onChange={(e) => handleLabelChange(status, e.target.value)} />
                  </div>

                  <div>
                    <Label className="text-xs">Couleur</Label>
                    <Select value={presetKey} onValueChange={(val) => applyPreset(status, val)}>
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

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={statusConfig[status]?.visible !== false} onCheckedChange={(checked) => handleVisibilityToggle(status, checked)} />
                      <span className="text-xs">Visible</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-xs text-muted-foreground mt-3">
            Astuce: le libellé est ce qui s'affiche dans le tableau des contacts.
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCategory = () => {
    switch (activeCategory) {
      case 'email':
        return renderEmailSettings();
      case 'sms':
        return renderSmsSettings();
      case 'calcom':
        return renderCalcomSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'shortcuts':
        return renderShortcutSettings();
      case 'update':
        return renderUpdateSettings();
      case 'diagnostic':
        return renderDiagnosticSettings();
      case 'columns':
        return renderColumnSettings();
      case 'statuses':
        return renderStatusEditor();
      case 'data-sharing':
        return renderDataSharingSettings();
      case 'logs':
        return renderLogsSettings();
      default:
        return renderEmailSettings();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-[1400px] xl:max-w-7xl w-full h-[95vh] sm:h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-3 sm:p-4 border-b flex-row items-center justify-between gap-2 bg-white dark:bg-background transition-colors">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Réglages de l'application</span>
            <span className="sm:hidden">Réglages</span>
          </DialogTitle>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Toggle mode Client / Apporteur */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Badge variant={callMode === CallMode.Client ? 'default' : 'secondary'} className="text-[10px] sm:text-xs px-1.5 sm:px-2">Client</Badge>
              <Switch
                checked={callMode === CallMode.Apporteur}
                onCheckedChange={(checked) => {
                  const newMode = checked ? CallMode.Apporteur : CallMode.Client;
                  setCallMode(newMode);
                  try { localStorage.setItem(MODE_STORAGE_KEY, newMode); } catch {}
                }}
                className="scale-75 sm:scale-100"
              />
              <Badge variant={callMode === CallMode.Apporteur ? 'default' : 'secondary'} className="text-[10px] sm:text-xs px-1.5 sm:px-2 hidden xs:inline-flex">Apporteur</Badge>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-0 bg-white dark:bg-background transition-colors">
          {/* Sidebar de navigation */}
          <div className="w-48 sm:w-56 md:w-64 border-r bg-white dark:bg-muted/20 p-2 sm:p-3 md:p-4 flex-shrink-0 h-full overflow-y-auto transition-colors">
            <div className="pb-3 sm:pb-4 hidden sm:block">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-foreground/10 flex items-center justify-center">
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                <span className="font-semibold text-sm sm:text-base">Réglages</span>
              </div>
            </div>
            <nav className="space-y-0.5 sm:space-y-1">
              {getCategories(devToolsEnabled, isUpdateEnabled).map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "w-full text-left rounded-md transition-colors",
                    activeCategory === category.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3">
                    <category.icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0", activeCategory !== category.id && "text-muted-foreground")} aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium truncate">{category.label}</div>
                      <div className={cn("text-[10px] sm:text-xs truncate hidden sm:block", activeCategory === category.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        {category.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
            {renderCategory()}
          </div>
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
