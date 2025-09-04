import './index.css';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Theme, Contact, CallState, CallStates, ContactStatus, Civility, EmailType } from './types';
import { APP_NAME, COLUMN_HEADERS, CONTACT_DATA_KEYS, headerIcons } from './constants';
import { ContactTable, ContactTableRef } from './components/ContactTable';
import { PaginatedContactTable } from './components/PaginatedContactTable';
import { EmailDialog, RappelDialog, RendezVousDialog, QualificationDialog, GenericInfoDialog } from './components/Dialogs';


import { TitleBar } from './components/TitleBar';
import { UpdateConfirmationDialog } from './components/UpdateConfirmationDialog';
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
  exportGoogleContactsCSV,
  exportGoogleCalendarCSV
} from './services/dataService';

import { useAdb } from './hooks/useAdb';
import { useAutoUpdate } from './hooks/useAutoUpdate';
import { DevToolsService } from './services/devToolsService';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn, searchLinkedIn, searchGoogle, openDirectLink } from './lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import {
  Phone, Mail, MessageSquare, Bell, Calendar, CalendarSearch, FileCheck, Linkedin, Globe, ExternalLink,
  Download, Keyboard, RefreshCw, Sun, Moon, Columns, X, Filter, Infinity, 
  Upload, Smartphone, Wifi, WifiOff, Loader2, FileSpreadsheet, Settings2, Eye, Trash2, Users, Timer
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropZoneOverlay } from './components/Common';
import { CalendarModal } from './components/CalendarModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileCard } from './components/UserProfileCard';
import { useSupabaseAuth } from './lib/auth-client';

import { ShortcutConfigDialog } from './components/ShortcutConfigDialog';
import { ShortcutIndicator } from './components/ShortcutIndicator';
import { shortcutService } from './services/shortcutService';
import { SettingsDialog, getSavedColumnConfig } from './components/SettingsDialog';


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

const App: React.FC = () => {
  // Authentication hook
  const auth = useSupabaseAuth();
  
  // Auto-update hook
  const { updateState, installUpdate, isUpdateEnabled } = useAutoUpdate();
  

  
  // Authentication states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // State declarations
  const [theme, setTheme] = useState<Theme>(Theme.Dark);
  const [activeMenuTab, setActiveMenuTab] = useState<'dimicall'>('dimicall');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [callStates, setCallStates] = useState<CallStates>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState<keyof Contact | 'all'>('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [activeCallContactId, setActiveCallContactId] = useState<string | null>(null);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isRappelDialogOpen, setIsRappelDialogOpen] = useState(false);
  const [isRendezVousDialogOpen, setIsRendezVousDialogOpen] = useState(false);
  const [isUpdateConfirmationOpen, setIsUpdateConfirmationOpen] = useState(false);
  const [isQualificationDialogOpen, setIsQualificationDialogOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isFnKeysInfoOpen, setIsFnKeysInfoOpen] = useState(false);
  const [isShortcutConfigOpen, setIsShortcutConfigOpen] = useState(false);
  const [isCalcomConfigOpen, setIsCalcomConfigOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [shortcutIndicator, setShortcutIndicator] = useState<{
    isVisible: boolean;
    key: string;
    label: string;
  }>({ isVisible: false, key: '', label: '' });

  const [isAdbLogsDialogOpen, setIsAdbLogsDialogOpen] = useState(false);
  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = useState(false);

  const [importProgress, setImportProgress] = useState<{ percentage: number; message: string } | null>(null);
  
  const [autoSearchMode, setAutoSearchMode] = useState<'disabled' | 'linkedin' | 'google' | 'link'>(() => {
    try {
      const saved = localStorage.getItem('auto-search-mode');
      console.log('🔄 [AUTO-SEARCH] Chargement du mode depuis localStorage:', saved);
      
      // Validation de la valeur chargée
      if (saved && ['disabled', 'linkedin', 'google', 'link'].includes(saved)) {
        console.log('✅ [AUTO-SEARCH] Mode valide trouvé:', saved);
        return saved as 'disabled' | 'linkedin' | 'google' | 'link';
      }
      
      console.log('🔄 [AUTO-SEARCH] Aucun mode valide trouvé, utilisation par défaut: linkedin');
      return 'linkedin'; // Par défaut LinkedIn auto
    } catch (error) {
      console.error('❌ [AUTO-SEARCH] Erreur lors du chargement:', error);
      return 'linkedin';
    }
  });
  const [splitPanelOpen, setSplitPanelOpen] = useState(true);
  
  // État pour l'URL Cal.com personnalisée
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
      
      // Vérifier si c'est une ancienne URL à migrer
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

  // État pour le template SMS personnalisé
  const [smsTemplate, setSmsTemplate] = useState<string>(() => {
    const saved = localStorage.getItem('sms-template');
    return saved || `Bonjour {civilite} {nom},

Pour resituer mon appel, je suis gérant privé au sein du cabinet de gestion de patrimoine Arcanis Conseil.

Je vous envoie l'adresse de notre site web que vous puissiez en savoir d'avantage :
https://arcanis-conseil.fr

Le site est avant tout une vitrine, le mieux est de m'appeler si vous souhaitez davantage d'informations ou de prendre un créneau de 30 minutes dans mon agenda via ce lien :
https://calendly.com/dimitri-morel-arcanis-conseil/audit

Bien à vous,

Dimitri MOREL - Arcanis Conseil`;
  });

  // État intelligent pour les colonnes visibles basé sur les données réelles
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [availableDataKeys, setAvailableDataKeys] = useState<(keyof Contact | null)[]>([]);

  // Fonction pour détecter les colonnes disponibles dans les données
  const detectAvailableColumns = useCallback((contactsData: Contact[]) => {
    if (!contactsData || contactsData.length === 0) {
      // Colonnes par défaut minimales si pas de données
        const defaultColumns = ["#", "Prénom", "Nom", "Téléphone", "Mail", "Statut"];
  const defaultDataKeys = ['numeroLigne', 'prenom', 'nom', 'telephone', 'email', 'statut'] as (keyof Contact | null)[];
      
      setAvailableColumns(defaultColumns);
      setAvailableDataKeys(defaultDataKeys);
      
      // Initialiser la visibilité pour les colonnes par défaut
      setVisibleColumns(prevVisible => {
        const defaultVisibility = defaultColumns.reduce((acc, col) => {
          acc[col] = true;
          return acc;
        }, {} as Record<string, boolean>);
        return defaultVisibility;
      });
      return;
    }

    // Analyser un échantillon de contacts pour détecter les colonnes avec des données
    const sampleSize = Math.min(10, contactsData.length);
    const sample = contactsData.slice(0, sampleSize);
    
    const detectedColumns = new Set<string>();
    const detectedDataKeys: (keyof Contact | null)[] = [];
    
    // Toujours inclure les colonnes essentielles ET importantes par défaut
    const alwaysIncludeColumns = [
      "#", "Prénom", "Nom", 
      "Téléphone", "Mail", "Statut", "Commentaire",
      "Date Rappel", "Heure Rappel", "Date RDV", "Heure RDV", 
      "Date Appel", "Heure Appel", "Durée Appel"
    ];
    
    const alwaysIncludeDataKeys = [
      'numeroLigne', 'prenom', 'nom',
      'telephone', 'email', 'statut', 'commentaire',
      'dateRappel', 'heureRappel', 'dateRDV', 'heureRDV',
      'dateAppel', 'heureAppel', 'dureeAppel'
    ] as (keyof Contact)[];
    
    alwaysIncludeColumns.forEach((col, index) => {
      detectedColumns.add(col);
      detectedDataKeys.push(alwaysIncludeDataKeys[index] || null);
    });
    
    // Vérifier les colonnes optionnelles pour voir si elles contiennent des données
    const optionalColumns = ["Sexe", "Don", "Qualité", "Type", "Date", "UID"];
    const optionalDataKeys = ['sexe', 'don', 'qualite', 'type', 'date', 'uid'] as (keyof Contact)[];
    
    COLUMN_HEADERS.forEach((header, index) => {
      if (alwaysIncludeColumns.includes(header)) return; // Déjà incluse
      
      const dataKey = CONTACT_DATA_KEYS[index];
      if (!dataKey) return;
      
      // Vérifier si au moins un contact a une valeur non vide pour cette colonne
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
    
    // Mettre à jour la visibilité en utilisant une fonction callback pour éviter la dépendance circulaire
    setVisibleColumns(prevVisible => {
      const newVisibleColumns = newAvailableColumns.reduce((acc, col) => {
        // Garder la préférence existante si elle existe, sinon true par défaut
        acc[col] = prevVisible[col] !== undefined ? prevVisible[col] : true;
        return acc;
      }, {} as Record<string, boolean>);
      
      // Masquer par défaut certaines colonnes moins importantes (seulement si pas déjà défini)
      const lessImportantColumns = ["Sexe", "Don", "Qualité", "Type", "Date", "UID"];
      lessImportantColumns.forEach(col => {
        if (newVisibleColumns[col] !== undefined && prevVisible[col] === undefined) {
          newVisibleColumns[col] = false;
        }
      });
      
      return newVisibleColumns;
    });
  }, []); // Pas de dépendances pour éviter la boucle infinie

  // Effect pour détecter les colonnes quand les contacts changent
  useEffect(() => {
    detectAvailableColumns(contacts);
  }, [contacts]); // Seulement dépendant des contacts, pas de detectAvailableColumns

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
    // Notifications désactivées - fonction no-op
    return;
  }, []);

  // Handler pour l'authentification réussie
  const handleAuthenticated = useCallback(() => {
    setIsAuthModalOpen(false);
    showNotification('success', `Bienvenue ${auth.user?.email}!`, 3000);
  }, [auth.user, showNotification]);

  // Effect pour vérifier l'authentification au démarrage et fermer la modale après connexion
  useEffect(() => {
    if (!auth.isAuthenticated) {
      setIsAuthModalOpen(true);
    } else {
      // Utilisateur authentifié : fermer la modale sans notification
      setIsAuthModalOpen(false);
    }
  }, [auth.isAuthenticated]);

  // Effect pour synchroniser les DevTools au démarrage
  useEffect(() => {
    // Synchroniser l'état des DevTools avec les préférences utilisateur
    const devToolsEnabled = DevToolsService.isEnabled();
    if (devToolsEnabled && window.electronAPI?.enableDevTools) {
      window.electronAPI.enableDevTools();
    }
  }, []);



  const updateContact = useCallback(async (updatedFields: Partial<Contact> & { id: string }) => {
    // Utiliser une fonction de mise à jour pour éviter les stale closures
    let updatedContact: Contact | null = null;
    let contactFound = false;
    
    setContacts(currentContacts => {
      const existingContact = currentContacts.find(c => c.id === updatedFields.id);
      if (!existingContact) {
        console.warn(`Contact avec l'ID ${updatedFields.id} non trouvé pour mise à jour`);
        return currentContacts; // Retourner l'état inchangé
      }

      contactFound = true;
      updatedContact = { ...existingContact, ...updatedFields };
      const updatedContacts = currentContacts.map(c => c.id === updatedFields.id ? updatedContact! : c);
      
      // Sauvegarder les contacts mis à jour
      saveContacts(updatedContacts);
      
      // Si on a une table importée, la mettre à jour aussi
      if (hasImportedTable()) {
        const savedTable = loadImportedTable();
        if (savedTable && savedTable.metadata) {
          saveImportedTable(updatedContacts, savedTable.metadata);
    
        }
      }
      
      return updatedContacts; // Forcer le re-render immédiat
    });
    
    // Si le contact n'a pas été trouvé, arrêter ici
    if (!contactFound || !updatedContact) {
      return;
    }

    // 🔄 Mise à jour en temps réel du contact sélectionné dans le panneau latéral
    if (selectedContact?.id === updatedFields.id) {
      setSelectedContact(updatedContact);

    }

    // Forcer un petit délai pour que l'interface se mette à jour
    await new Promise(resolve => setTimeout(resolve, 50));

  }, [selectedContact, showNotification]); // Retiré 'contacts' car on utilise setContacts avec fonction

  const addContact = useCallback(async (newContact: Omit<Contact, 'id' | 'numeroLigne'>) => {
    const contactWithId = {
      ...newContact,
      id: uuidv4(),
      numeroLigne: contacts.length + 1,
    };

    // Ajout local immédiat
    setContacts(prev => [...prev, contactWithId].map((c, idx) => ({ ...c, numeroLigne: idx + 1 })));

    // Synchronisation avec Supabase uniquement si activée
    showNotification('success', `Contact ${newContact.prenom} ${newContact.nom} ajouté`);

    return contactWithId;
  }, [contacts, showNotification]);

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
    
    // Vérifier si le contact sélectionné existe toujours
    if (selectedContact) {
      const stillExists = contactsWithIds.find(c => c.id === selectedContact.id);
      if (!stillExists) {
        setSelectedContact(null);
      }
    }
  }, [selectedContact]);

  const handleRowSelection = useCallback((contact: Contact | null) => {
    console.log('Sélection contact:', contact ? `${contact.prenom} ${contact.nom} (ID: ${contact.id})` : 'Aucun');
    setSelectedContact(contact);
  }, []);

  const handleDeleteContact = useCallback(async (contactId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce contact ?")) {
      const contactToDelete = contacts.find(c => c.id === contactId);
      
      // Suppression locale immédiate
      setContacts(prev => prev.filter(c => c.id !== contactId).map((c, idx) => ({...c, numeroLigne: idx + 1})));
      setCallStates(prev => {
        const newStates = {...prev};
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

      // Synchronisation avec Supabase uniquement si activée
      showNotification('info', `Contact ${contactToDelete?.prenom} ${contactToDelete?.nom} supprimé.`);
    }
  }, [contacts, selectedContact, activeCallContactId, showNotification]);

  const endActiveCall = useCallback((markAsError = false, contactIdToEnd?: string) => {
    const idToProcess = contactIdToEnd || activeCallContactId;
    if (idToProcess && callStates[idToProcess]?.isCalling) {
      updateCallState(idToProcess, { isCalling: false, hasBeenCalled: !markAsError });
      if (callStartTime && !markAsError) {
        const durationMs = new Date().getTime() - callStartTime.getTime();
        const seconds = Math.floor((durationMs / 1000) % 60);
        const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
        const durationStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        updateContact({id: idToProcess, dureeAppel: durationStr });
      } else if (markAsError) {
        updateContact({id: idToProcess, dureeAppel: "Erreur" });
      }
      if (activeCallContactId === idToProcess) {
        setActiveCallContactId(null);
        setCallStartTime(null);
      }
      showNotification('info', "Appel terminé (simulé).");
    }
  }, [activeCallContactId, callStates, callStartTime, updateCallState, updateContact, showNotification]);

  // Search handlers
  const handleLinkedInSearch = useCallback((contact?: Contact) => {
    const target = contact || selectedContact;
    if (!target) {
      showNotification('info', "Sélectionnez un contact pour la recherche LinkedIn.");
      return;
    }
    searchLinkedIn(target.prenom, target.nom);
  }, [selectedContact, showNotification]);

  const handleGoogleSearch = useCallback((contact?: Contact) => {
    const target = contact || selectedContact;
    if (!target) {
      showNotification('info', "Sélectionnez un contact pour la recherche Google.");
      return;
    }
    searchGoogle(target.prenom, target.nom);
  }, [selectedContact, showNotification]);

  const handleDirectLink = useCallback((contact?: Contact) => {
    const target = contact || selectedContact;
    if (!target) {
      showNotification('info', "Sélectionnez un contact pour ouvrir le lien.");
      return;
    }
    
    if (!target.lien) {
      showNotification('warning', "Ce contact n'a pas de lien associé.");
      return;
    }

    try {
      openDirectLink(target.lien);
      showNotification('success', 'Lien ouvert avec succès', 2000);
    } catch (error) {
      showNotification('error', 'Erreur lors de l\'ouverture du lien');
    }
  }, [selectedContact, showNotification]);

  const handleSms = useCallback(async (civilite?: string, contact?: Contact) => {
    const target = contact || selectedContact;
    if (!target) {
        showNotification('info', "Sélectionnez un contact pour envoyer un SMS.");
        return;
    }

    // Vérifier la connexion ADB
    if (!adbConnectionState.isConnected) {
      showNotification('error', "Aucun appareil Android connecté via ADB. Connectez votre téléphone d'abord.");
      return;
    }

    // Vérifier que le contact a un numéro de téléphone
    if (!target.telephone) {
      showNotification('error', `Aucun numéro de téléphone pour ${target.prenom} ${target.nom}.`);
      return;
    }

    // Créer le nom d'accueil avec civilité
    const greetingName = civilite ? `${civilite} ${target.nom}`.trim() : `${target.prenom} ${target.nom}`.trim() || "client(e)";
    
    // Utiliser le template SMS personnalisé avec remplacement des variables
    const messageBody = smsTemplate
      .replace(/{civilite}/g, civilite || target.prenom || "")
      .replace(/{nom}/g, target.nom || "")
      .replace(/{prenom}/g, target.prenom || "")
      .replace(/{nom_complet}/g, `${target.prenom || ""} ${target.nom || ""}`.trim() || "client(e)");

    // Nettoyer le numéro de téléphone
    const phoneNumberCleaned = target.telephone.replace(/\s/g, '');

    try {
      showNotification('info', "Préparation du SMS...");
      
      // Préparer le SMS avec le message pré-rempli
      const result = await sendSms(phoneNumberCleaned, messageBody);
      
      if (result.success) {
        showNotification('success', "L'application de messagerie s'est ouverte avec votre message pré-rempli. Vous n'avez plus qu'à vérifier et envoyer.");
      } else {
        showNotification('error', `Échec de la préparation du SMS: ${result.message}`);
      }
    } catch (error) {
      showNotification('error', `Erreur lors de la préparation du SMS: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }, [selectedContact, showNotification, adbConnectionState.isConnected, sendSms, smsTemplate]);

  // Clear data handlers
  const clearAllData = useCallback(() => {
    try {
      // 1. Vider la liste des contacts
      setContacts([]);
      
      // 2. Vider les états d'appel
      setCallStates({});
      
      // 3. Désélectionner le contact actuel
      setSelectedContact(null);
      
      // 4. Réinitialiser l'appel actif si nécessaire
      if (activeCallContactId) {
        setActiveCallContactId(null);
        setCallStartTime(null);
      }
      
      // 5. Nettoyer le localStorage
      saveContacts([]);
      saveCallStates({});
      clearImportedTable();
      
      // 6. Notification de succès
      showNotification('success', 'Toutes les données ont été supprimées avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression des données:', error);
      showNotification('error', 'Erreur lors de la suppression des données');
    }
  }, [activeCallContactId, showNotification]);

  const handleClearData = useCallback(() => {
    setIsClearDataDialogOpen(true);
  }, []);

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
          message: `⚠️ Fichier volumineux détecté (${fileSizeMB.toFixed(1)} MB). Traitement optimisé...`, 
          percentage: 5 
        });
        await new Promise(res => setTimeout(res, 1000));
      }
      
      setImportProgress({ message: `📖 Lecture du fichier...`, percentage: 10 });
      await new Promise(res => setTimeout(res, 200));
      
      setImportProgress({ message: `⚙️ Traitement par chunks...`, percentage: 20 });
      
      // Import optimisé
      const newContacts = await importContactsFromFile(file);
      
      setImportProgress({ message: `📝 Préparation des données...`, percentage: 80 });
      await new Promise(res => setTimeout(res, 100));
      
      const updatedContacts = newContacts.map((c, idx) => ({ 
        ...c, 
        numeroLigne: idx + 1, 
        id: c.id || uuidv4() 
      }));
      
      setImportProgress({ message: `💾 Sauvegarde...`, percentage: 90 });
      
      // Sauvegarder la table importée pour persistance
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const source = fileExtension === 'csv' ? 'csv' : 'xlsx';
      saveImportedTable(updatedContacts, {
        fileName: file.name,
        source: source as 'csv' | 'xlsx',
        totalRows: updatedContacts.length
      });
      
      setContacts(updatedContacts);
      setCallStates({});
      setSelectedContact(null);
      
      setImportProgress({ message: `✅ Finalisation...`, percentage: 100 });
      await new Promise(res => setTimeout(res, 500)); 
      setImportProgress(null);
      
      const message = fileSizeMB > 10 
        ? `🎉 ${updatedContacts.length} contacts importés avec succès depuis un fichier de ${fileSizeMB.toFixed(1)} MB !`
        : `✅ ${updatedContacts.length} contacts importés avec succès !`;
        
      showNotification('success', message);
      
    } catch (error) {
      console.error("Import error:", error);
      setImportProgress(null);
      showNotification('error', `❌ Erreur d'importation: ${error instanceof Error ? error.message : "Erreur inconnue"}. Vérifiez le format de votre fichier.`);
    }
  }, [showNotification]);

  const handleImportFile = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    setIsImporting(true);
    try {
      await handleSingleFileImport(file);
    } finally {
      setIsImporting(false);
    }
  }, [handleSingleFileImport]);

  const handleExport = useCallback((format: 'csv' | 'xlsx') => {
    if (contacts.length === 0) {
      showNotification('info', 'Aucun contact à exporter');
      return;
    }
    
    try {
      exportContactsToFile(contacts, format);
      showNotification('success', `Export ${format.toUpperCase()} réussi`);
    } catch (error) {
      showNotification('error', `Erreur lors de l'export: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }, [contacts, showNotification]);

  // Calcul du nombre de contacts filtrés pour Google Contacts
  const googleContactsCount = useMemo(() => {
    return contacts.filter(contact => 
      contact.statut === ContactStatus.ARappeler ||
      contact.statut === ContactStatus.DO ||
      contact.statut === ContactStatus.RO ||
      contact.statut === ContactStatus.A0
    ).length;
  }, [contacts]);

  // Calcul du nombre de contacts avec rappels pour Google Calendar
  const calendarRemindersCount = useMemo(() => {
    return contacts.filter(contact => 
      contact.dateRappel && contact.dateRappel.trim() !== ''
    ).length;
  }, [contacts]);

  // Handler pour l'export Google Contacts
  const handleGoogleContactsExport = useCallback(() => {
    try {
      // Vérification préalable du nombre de contacts
      if (googleContactsCount === 0) {
        showNotification('warning', 'Aucun contact à exporter avec les statuts sélectionnés (À rappeler, DO, RO)');
        return;
      }
      
      exportGoogleContactsCSV(contacts);
      showNotification('success', `${googleContactsCount} contacts exportés vers Google Contacts`);
    } catch (error) {
      console.error('Erreur lors de l\'export Google Contacts:', error);
      
      // Messages d'erreur spécifiques
      if (error instanceof Error) {
        if (error.message.includes('Aucun contact à exporter')) {
          showNotification('warning', 'Aucun contact à exporter avec les statuts sélectionnés');
        } else if (error.message.includes('CSV')) {
          showNotification('error', 'Erreur lors de la génération du fichier CSV');
        } else if (error.message.includes('téléchargement')) {
          showNotification('error', 'Erreur lors du téléchargement du fichier');
        } else {
          showNotification('error', `Erreur lors de l'export: ${error.message}`);
        }
      } else {
        showNotification('error', 'Erreur inconnue lors de l\'export');
      }
    }
  }, [contacts, googleContactsCount, showNotification]);

  // Handler pour l'export Google Calendar
  const handleGoogleCalendarExport = useCallback(() => {
    try {
      // Vérification préalable du nombre de rappels
      if (calendarRemindersCount === 0) {
        showNotification('warning', 'Aucun rappel à exporter');
        return;
      }
      
      exportGoogleCalendarCSV(contacts);
      showNotification('success', `${calendarRemindersCount} rappels exportés vers Google Agenda`);
    } catch (error) {
      console.error('Erreur lors de l\'export Google Calendar:', error);
      
      // Messages d'erreur spécifiques
      if (error instanceof Error) {
        if (error.message.includes('Aucun rappel à exporter')) {
          showNotification('warning', 'Aucun rappel à exporter');
        } else if (error.message.includes('CSV')) {
          showNotification('error', 'Erreur lors de la génération du fichier CSV');
        } else if (error.message.includes('téléchargement')) {
          showNotification('error', 'Erreur lors du téléchargement du fichier');
        } else {
          showNotification('error', `Erreur lors de l'export: ${error.message}`);
        }
      } else {
        showNotification('error', 'Erreur inconnue lors de l\'export');
      }
    }
  }, [contacts, calendarRemindersCount, showNotification]);

  const makePhoneCall = useCallback(async (contactToCall?: Contact) => {
    console.log('🔍 [MAKEPHONECALL] Début makePhoneCall, contactToCall:', contactToCall);
    console.log('🔍 [MAKEPHONECALL] selectedContact:', selectedContact);
    
    const targetContact = contactToCall || selectedContact;
    console.log('🔍 [MAKEPHONECALL] targetContact final:', targetContact);

    if (!targetContact) {
      console.log('❌ [MAKEPHONECALL] Pas de contact - RETURN');
      showNotification('error', "Sélectionnez un contact pour appeler.");
      return;
    }
    
    console.log('🔍 [MAKEPHONECALL] activeCallContactId:', activeCallContactId);
    if (activeCallContactId && activeCallContactId !== targetContact.id) {
      console.log('🔍 [MAKEPHONECALL] Fin d\'appel en cours...');
      endActiveCall(false, activeCallContactId); 
    }

    // Vérifier la connexion ADB
    console.log('🔍 [MAKEPHONECALL] adbConnectionState.isConnected:', adbConnectionState.isConnected);
    if (!adbConnectionState.isConnected) {
      console.log('❌ [MAKEPHONECALL] ADB pas connecté - RETURN');
      showNotification('error', "Aucun appareil Android connecté via ADB. Connectez votre téléphone d'abord.");
      return;
    }

    // Nettoyer le numéro de téléphone pour l'appel
    const cleanPhoneNumber = targetContact.telephone.replace(/[^0-9+]/g, '');
    console.log('🔍 [MAKEPHONECALL] cleanPhoneNumber:', cleanPhoneNumber);
    
    try {
      console.log('🔍 [MAKEPHONECALL] Début du try...');
      showNotification('info', `Appel en cours vers ${targetContact.prenom} ${targetContact.nom} au ${targetContact.telephone}...`);
      
      console.log('🔍 [MAKEPHONECALL] Avant makeAdbCall...');
      // Faire l'appel réel via ADB
        const callResult = await makeAdbCall(cleanPhoneNumber);
        console.log('🔍 [MAKEPHONECALL] Après makeAdbCall, result:', callResult);
        
        if (callResult.success) {
          // Appel réussi
          console.log(`📞 Configuration de l'appel pour le contact ${targetContact.id}...`);
          updateCallState(targetContact.id, { isCalling: true, hasBeenCalled: false });
          setActiveCallContactId(targetContact.id);
          setCallStartTime(new Date());
          console.log(`📞 Contact actif défini: ${targetContact.id}, heure de début: ${new Date()}`);
          
          const now = new Date();
          updateContact({
            id: targetContact.id,
            dateAppel: now.toISOString().split('T')[0],
            heureAppel: now.toTimeString().substring(0,5),
            dureeAppel: "00:00" 
          });
          setSelectedContact(targetContact);
        
        showNotification('success', `Appel initié vers ${targetContact.prenom} ${targetContact.nom}`);
        
        // Recherche automatique selon le mode configuré
        if (autoSearchMode === 'linkedin') {
          handleLinkedInSearch(targetContact);
          showNotification('info', 'Ouverture automatique LinkedIn', 2000);
        } else if (autoSearchMode === 'google') {
          handleGoogleSearch(targetContact);
          showNotification('info', 'Ouverture automatique Google', 2000);
        } else if (autoSearchMode === 'link') {
          handleDirectLink(targetContact);
          showNotification('info', 'Ouverture automatique Lien', 2000);
        }
        // Si 'disabled', ne rien faire
      } else {
        // Échec de l'appel
        showNotification('error', `Échec de l'appel: ${callResult.message}`);
      }
    } catch (error) {
      showNotification('error', `Erreur lors de l'appel: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }, [selectedContact, activeCallContactId, endActiveCall, updateCallState, updateContact, autoSearchMode, 
      showNotification, handleLinkedInSearch, handleGoogleSearch, handleDirectLink, adbConnectionState.isConnected, makeAdbCall]);

  // Surveillance robuste des fins d'appel via événements ADB
  useEffect(() => {
    console.log('🔧 Configuration de la surveillance des fins d\'appels...');
    
    const unsubscribeCallEnd = onCallEnd((callEndEvent) => {
      console.log('📞 Événement de fin d\'appel reçu:', callEndEvent);
      
      if (activeCallContactId) {
        // Calculer la durée d'appel formatée
        const seconds = Math.floor((callEndEvent.durationMs / 1000) % 60);
        const minutes = Math.floor((callEndEvent.durationMs / (1000 * 60)) % 60);
        const durationStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        console.log(`📞 Mise à jour du contact ${activeCallContactId} avec durée: ${durationStr}`);
        
        // Mettre à jour le contact avec la durée réelle
        updateContact({
          id: activeCallContactId, 
          dureeAppel: durationStr
        });
        
        // Terminer l'appel dans l'interface
        updateCallState(activeCallContactId, { isCalling: false, hasBeenCalled: true });
        setActiveCallContactId(null);
        setCallStartTime(null);
        
        showNotification('success', `Appel terminé - Durée: ${durationStr}`);
      } else {
        console.log('📞 Fin d\'appel détectée mais aucun appel actif dans l\'interface');
        showNotification('info', "Appel terminé détecté.");
      }
    });
    
    return () => {
      console.log('🔧 Nettoyage de la surveillance des fins d\'appels...');
      unsubscribeCallEnd();
    };
  }, [activeCallContactId, onCallEnd, updateContact, updateCallState, showNotification]);

  // Auto-connexion ADB au démarrage si pas encore connecté
  useEffect(() => {
    if (!adbConnectionState.isConnected && !adbConnecting) {
      // Essayer de se connecter automatiquement après 2 secondes
      const timer = setTimeout(() => {
        connectAdb().catch(error => {
          console.log('Auto-connexion ADB échouée:', error);
        });
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [adbConnectionState.isConnected, adbConnecting, connectAdb]);

  // useEffects
  useEffect(() => {
    if (theme === Theme.Dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.backgroundColor = 'hsl(220 9% 4%)';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = 'hsl(0 0% 100%)';
    }
  }, [theme]);

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // S'exécuter une seule fois au démarrage
    if (!isInitialized) {
      // Vérifier s'il y a une table importée sauvegardée
      if (hasImportedTable()) {
        const savedTable = loadImportedTable();
        if (savedTable && savedTable.contacts.length > 0) {
          const metadata = savedTable.metadata;
          console.log(`🔄 Restauration de la table importée: ${savedTable.contacts.length} contacts (${metadata?.fileName})`);
          
          const contactsWithIds = savedTable.contacts.map((c, idx) => ({
            ...c,
            telephone: formatPhoneNumber(c.telephone || ""),
            id: c.id || uuidv4(),
            numeroLigne: idx + 1,
          }));
          
          setContacts(contactsWithIds);
          setCallStates(loadCallStates());
          showNotification('success', `Table importée restaurée: ${contactsWithIds.length} contacts (${metadata?.fileName})`, 4000);
          setIsInitialized(true);
          return; // Ne pas charger les contacts par défaut
        }
      }
      
      // Chargement normal si pas de table importée
      refreshData();
      setIsInitialized(true);
    }
  }, [isInitialized, showNotification]);

  useEffect(() => {
    // Ne sauvegarder que si on n'est pas en train de restaurer
    if (contacts.length > 0) {
      saveContacts(contacts);
    }
  }, [contacts]);

  useEffect(() => {
    saveCallStates(callStates);
  }, [callStates]);

  // Configuration des mises à jour temps réel - Supabase supprimé pour libérer de l'espace
  
  const filteredContacts = useMemo(() => {
    if (!searchTerm) return contacts;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return contacts.filter(contact => {
      if (searchColumn === 'all') {
        return Object.values(contact).some(value =>
          String(value).toLowerCase().includes(lowerSearchTerm)
        );
      }
      const contactValue = contact[searchColumn as keyof Contact];
      return String(contactValue).toLowerCase().includes(lowerSearchTerm);
    });
     }, [contacts, searchTerm, searchColumn]);

   // Variables de protection contre les workflows multiples (persistantes entre les re-renders)
   const isProcessingRef = useRef(false);
   const lastKeyPressRef = useRef<{ key: string; timestamp: number } | null>(null);
   
   // Refs pour stocker les valeurs actuelles (évite les problèmes de closure stale)
   const selectedContactRef = useRef<Contact | null>(null);
   const activeCallContactIdRef = useRef<string | null>(null);
   const filteredContactsRef = useRef<Contact[]>([]);
   const contactsRef = useRef<Contact[]>([]);
   const makePhoneCallRef = useRef<((contactToCall?: Contact) => Promise<void>) | null>(null);
   
   // Mettre à jour les refs quand les valeurs changent
   useEffect(() => {
     selectedContactRef.current = selectedContact;
     console.log(`🔄 [CONTACT_REF] Contact sélectionné mis à jour:`, selectedContact ? `${selectedContact.prenom} ${selectedContact.nom}` : 'null');
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
       console.log('💾 [AUTO-SEARCH] Sauvegarde du mode:', autoSearchMode);
       localStorage.setItem('auto-search-mode', autoSearchMode);
       console.log('✅ [AUTO-SEARCH] Mode sauvegardé avec succès dans localStorage');
       
       // Vérification immédiate de la sauvegarde
       const verification = localStorage.getItem('auto-search-mode');
       if (verification === autoSearchMode) {
         console.log('✅ [AUTO-SEARCH] Vérification réussie - Mode persistent:', verification);
       } else {
         console.error('❌ [AUTO-SEARCH] Échec de la vérification:', { expected: autoSearchMode, actual: verification });
       }
     } catch (error) {
       console.error('❌ [AUTO-SEARCH] Erreur lors de la sauvegarde:', error);
     }
   }, [autoSearchMode]);

   // Fonction de debug pour tester la persistence manuellement (accessible via window.testAutoSearchPersistence)
   useEffect(() => {
     (window as any).testAutoSearchPersistence = () => {
       console.log('🧪 [AUTO-SEARCH] Test de persistence:');
       console.log('📖 Mode actuel en mémoire:', autoSearchMode);
       console.log('💾 Mode sauvegardé en localStorage:', localStorage.getItem('auto-search-mode'));
       console.log('🔄 Pour tester: changez le mode via l\'interface, puis rafraîchissez la page');
     };
   }, [autoSearchMode]);

   // Log initial du mode d'auto-recherche au démarrage
   useEffect(() => {
     console.log('🚀 [AUTO-SEARCH] Application démarrée avec le mode:', autoSearchMode);
     console.log('💡 [AUTO-SEARCH] Ce mode sera utilisé avec la touche F1 et le bouton Appeler');
   }, []); // Seulement au mount

   // Handler pour les raccourcis globaux Electron
   useEffect(() => {
     const handleGlobalFnKey = async (event: any, key: string) => {
       // Protection contre les workflows multiples
       if (isProcessingRef.current) {
         return;
       }
       
       // Protection contre les appuis répétés (debounce de 500ms)
       const now = Date.now();
       const lastKeyPress = lastKeyPressRef.current;
       if (lastKeyPress && lastKeyPress.key === key && (now - lastKeyPress.timestamp) < 500) {
         return;
       }
       lastKeyPressRef.current = { key, timestamp: now };
       
            // Récupérer le contact sélectionné au moment de l'appui sur la touche (depuis la ref)
     const currentSelectedContact = selectedContactRef.current;
     if (!currentSelectedContact) {
       showNotification('error', `Veuillez sélectionner un contact avant d'utiliser ${key}`);
       return;
     }
     
     // Traitement spécial pour F1 : Appeler le contact sélectionné (identique au bouton "Appeler")
     if (key === 'F1') {
       isProcessingRef.current = true; // Bloquer les nouveaux workflows
       
       try {
         console.log(`📞 [F1] Lancement d'appel via F1 (identique au bouton Appeler)`);
         console.log(`📞 [F1] Contact sélectionné:`, currentSelectedContact);
         console.log(`📞 [F1] makePhoneCall function:`, makePhoneCall);
         
         // Passer explicitement le contact pour éviter les closures stales
         await makePhoneCall(currentSelectedContact);
         console.log(`📞 [F1] makePhoneCall terminé`);
       } catch (error) {
         console.error(`❌ [F1] Erreur lors de l'appel:`, error);
       } finally {
         isProcessingRef.current = false; // Débloquer les workflows
       }
       return; // Sortir ici pour F1, pas besoin du workflow de changement de statut
     }
     
     // Utiliser le service de raccourcis personnalisés pour F2-F10
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
         isProcessingRef.current = false; // Débloquer les workflows
       }
     };

     // Fonction de workflow séquentiel avec vérifications
     const executeSequentialWorkflow = async (key: string, newStatus: ContactStatus, contact: Contact) => {
       // ÉTAPE 1: Raccrochage (si appel en cours)
       const wasCallActive = activeCallContactIdRef.current === contact.id;
       if (wasCallActive) {
         const hangupSuccess = await performHangupWithRetry();
         if (!hangupSuccess) {
           throw new Error("Échec du raccrochage après plusieurs tentatives");
         }
         
         // Délai de stabilisation après raccrochage
         await waitWithLog(500, "Stabilisation après raccrochage");
       }

       // ÉTAPE 2: Application du statut avec vérification améliorée
       const statusUpdateSuccess = await performStatusUpdateWithVerification(contact, newStatus);
       if (!statusUpdateSuccess) {
         showNotification('info', `${key}: Statut appliqué mais non vérifié pour ${contact.prenom}`);
       } else {
         showNotification('success', `${key}: ${contact.prenom} → "${newStatus}"`);
       }
       
       // Délai pour que l'interface se mette à jour
       await waitWithLog(600, "Mise à jour de l'interface");

       // ÉTAPE 3: Sélection du contact suivant avec vérification
       const nextContact = await findAndSelectNextContact(contact);
       if (!nextContact) {
         showNotification('info', "Fin de la liste atteinte.");
         return;
       }
       
       // Délai pour que la sélection soit effective
       await waitWithLog(300, "Finalisation de la sélection");

       // ÉTAPE 4: Lancement de l'appel suivant avec vérification
       const callSuccess = await performCallWithVerification(nextContact);
       if (!callSuccess) {
         showNotification('error', `Workflow terminé, mais échec de l'appel vers ${nextContact.prenom}`);
         return;
       }
     };

     // Fonction de raccrochage avec retry
     const performHangupWithRetry = async (): Promise<boolean> => {
       for (let attempt = 1; attempt <= 3; attempt++) {
         try {
           const result = await adbEndCall();
           
           // Vérifier que l'appel est vraiment terminé
           await waitWithLog(300, `Vérification raccrochage (tentative ${attempt})`);
           
           // Vérifier l'état après le délai
           if (activeCallContactIdRef.current === null) {
             return true;
           }
           
         } catch (error) {
           console.error(`❌ [HANGUP] Erreur tentative ${attempt}:`, error);
         }
         
         if (attempt < 3) {
           await waitWithLog(400, `Délai avant tentative ${attempt + 1}`);
         }
       }
       
       // Forcer la fin d'appel si toutes les tentatives échouent
       if (selectedContactRef.current) {
         endActiveCall(false, selectedContactRef.current.id);
       }
       return false;
     };

     // Fonction de mise à jour du statut avec vérification améliorée
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
               await waitWithLog(300, `Délai avant nouvelle tentative de mise à jour`);
             }
           }
         }
         
         if (!updateSuccess) {
           return false;
         }
         
         // Délais plus longs pour la propagation
         await waitWithLog(400, "Propagation de la mise à jour du statut");
         
         // Vérifier dans plusieurs sources avec délais plus longs
         let verificationAttempts = 0;
         const maxVerificationAttempts = 8; // Plus de tentatives
         
         while (verificationAttempts < maxVerificationAttempts) {
           verificationAttempts++;
           
           // Vérifier dans les contacts actuels
           const updatedContact = contactsRef.current.find(c => c.id === contact.id);
           
           if (updatedContact?.statut === newStatus) {
             return true;
           }
           
           if (verificationAttempts < maxVerificationAttempts) {
             await waitWithLog(250, `Attente propagation (tentative ${verificationAttempts})`);
           }
         }
         
         // Dernière tentative de force-update si la vérification échoue
         try {
           await updateContact({ id: contact.id, statut: newStatus });
           await waitWithLog(500, "Force-update final");
           
           const finalCheck = contactsRef.current.find(c => c.id === contact.id);
           if (finalCheck?.statut === newStatus) {
             return true;
           }
         } catch (error) {
           console.error(`❌ [STATUS] Échec du force-update:`, error);
         }
         
         return false; // Plus strict - on signale l'échec
         
       } catch (error) {
         console.error(`❌ [STATUS] Erreur lors de la mise à jour du statut:`, error);
         return false;
       }
     };

     // Fonction de sélection du contact suivant avec vérification
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
         
         // Sélectionner le contact suivant
         setSelectedContact(nextContact);
         
         // Délai pour que la sélection soit effective
         await waitWithLog(200, "Application de la sélection");
         
         // Scroll automatique vers le contact sélectionné
         if (contactTableRef.current) {
           contactTableRef.current.scrollToContact(nextContact.id);
         }
         
         return nextContact;
         
       } catch (error) {
         console.error(`❌ [SELECT] Erreur lors de la sélection du contact suivant:`, error);
         return null;
       }
     };

     // Fonction d'appel avec vérification
     const performCallWithVerification = async (contact: Contact): Promise<boolean> => {
       try {
         // Lancer l'appel en utilisant la ref pour éviter les stale closures
         if (!makePhoneCallRef.current) {
           return false;
         }
         await makePhoneCallRef.current(contact);
         
         // Délai plus court pour que l'appel s'initialise
         await waitWithLog(400, "Initialisation de l'appel");
         
         // Vérifier que l'appel a bien démarré (avec plusieurs tentatives)
         let callVerificationAttempts = 0;
         const maxCallVerificationAttempts = 5; // Plus de tentatives
         
         while (callVerificationAttempts < maxCallVerificationAttempts) {
           callVerificationAttempts++;
           
           // Vérifier à la fois la ref ET l'état direct avec une fonction de vérification
           let isCallActive = false;
           
           // Méthode 1: Vérifier la ref
           if (activeCallContactIdRef.current === contact.id) {
             isCallActive = true;
           }
           
           // Méthode 2: Vérifier l'état des appels directement
           if (!isCallActive) {
             // Utiliser une fonction de callback pour accéder à l'état le plus récent
             await new Promise<void>((resolve) => {
               setCallStates(currentCallStates => {
                 const contactCallState = currentCallStates[contact.id];
                 if (contactCallState?.isCalling) {
                   isCallActive = true;
                 }
                 resolve();
                 return currentCallStates; // Retourner l'état inchangé
               });
             });
           }
           
           if (isCallActive) {
             return true;
           }
           
           if (callVerificationAttempts < maxCallVerificationAttempts) {
             await waitWithLog(200, `Vérification appel (tentative ${callVerificationAttempts})`);
           }
         }
         
         return false;
         
       } catch (error) {
         console.error(`❌ [CALL] Erreur lors du lancement de l'appel vers ${contact.prenom}:`, error);
         return false;
       }
     };

     // Fonction utilitaire pour les délais
     const waitWithLog = async (ms: number, reason: string): Promise<void> => {
       await new Promise(resolve => setTimeout(resolve, ms));
     };

     // Vérifier l'API Electron via window.electronAPI
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
   }, [adbEndCall, endActiveCall, updateContact, showNotification]); // Retiré makePhoneCall car on utilise maintenant makePhoneCallRef

  // Other handlers - version optimisée pour gros fichiers (supprimé car en conflit avec la version useCallback)

  // Fonctions handleSingleFileImport et handleExport supprimées car en conflit avec les versions useCallback



  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === Theme.Light ? Theme.Dark : Theme.Light));
  };
  
  // Obtenir les colonnes essentielles depuis les réglages sauvegardés
  const getEssentialColumns = () => {
    try {
      const columnConfig = getSavedColumnConfig();
      return Object.keys(columnConfig).filter(column => columnConfig[column]);
    } catch (error) {
      console.error('Erreur lors du chargement de la config des colonnes:', error);
      // Fallback vers la config par défaut
      return ["#", "Prénom", "Nom", "Commentaire"];
    }
  };

  // État pour les colonnes essentielles (rechargé depuis les réglages)
  const [essentialColumns, setEssentialColumns] = useState<string[]>(() => getEssentialColumns());

  // Fonction pour recharger les colonnes essentielles depuis les réglages
  const reloadEssentialColumns = () => {
    setEssentialColumns(getEssentialColumns());
  };

  const toggleColumnVisibility = (header: string) => {
    // Vérifier que la colonne est disponible
    if (!availableColumns.includes(header)) {
      showNotification('error', `La colonne "${header}" n'est pas disponible dans les données actuelles.`);
      return;
    }
    
    setVisibleColumns(prev => {
      const newVisibleColumns = { ...prev, [header]: !prev[header] };
      console.log('🔧 App.tsx - Toggle column visibility:', {
        header,
        'Ancienne valeur': prev[header],
        'Nouvelle valeur': newVisibleColumns[header],
        'État complet': newVisibleColumns
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
    showNotification('success', 'Toutes les colonnes disponibles sont maintenant affichées.');
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
    showNotification('success', 'Colonnes optionnelles masquées.');
  };

  const handleRefresh = () => {
    showNotification('info', 'Rafraîchissement des données...');
    refreshData();
  };

  // Derived state & constants for rendering
  const searchColumnsOptions = useMemo(() => [
    { value: 'all', label: 'Toutes les colonnes' },
    ...COLUMN_HEADERS.slice(1, COLUMN_HEADERS.length -1) 
      .map((header, idx) => {
        const dataKeyIndex = idx + 1; 
        const dataKey = CONTACT_DATA_KEYS[dataKeyIndex] as keyof Contact | null;
        return {
          value: dataKey || 'all',
          label: header
        };
      })
  ], []);

  const totalContacts = contacts.length;
  const processedContacts = contacts.filter(c => c.statut !== ContactStatus.NonDefini).length;
  const progressPercentage = totalContacts > 0 ? Math.round((processedContacts / totalContacts) * 100) : 0;

  // RibbonButton component homogénéisé
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
      "flex flex-col items-center justify-center w-[80px] h-12 ribbon-button-modern",
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
      showNotification('error', 'Veuillez sélectionner un contact pour prendre un rendez-vous');
      return;
    }
    
    console.log('🗓️ Ouverture du modal calendrier pour:', selectedContact.prenom, selectedContact.nom);
    
    // ⚠️ SOLUTION TEMPORAIRE pour X-Frame-Options
    // Cal.com bloque l'embedding avec X-Frame-Options: sameorigin
    // On peut soit essayer l'embed (qui va échouer) soit aller directement au nouvel onglet
    
    const useDirectOpen = true; // Changez à false pour essayer l'embed d'abord
    
    if (useDirectOpen) {
      console.log('🗓️ Ouverture directe en nouvel onglet (contournement X-Frame-Options)');
      handleDirectCalendarOpen();
    } else {
      console.log('🗓️ Tentative d\'embedding Cal.com (risque d\'échec X-Frame-Options)');
      setIsCalendarModalOpen(true);
    }
  }, [selectedContact, showNotification]);

  // Fonction pour ouvrir directement Cal.com en nouvel onglet
  const handleDirectCalendarOpen = useCallback(() => {
    if (!selectedContact) {
      showNotification('error', 'Veuillez sélectionner un contact');
      return;
    }
    
    // Séparer l'URL de base et les paramètres existants
    const [baseUrl, existingParams] = calcomUrl.split('?');
    const allParams = new URLSearchParams(existingParams || '');
    
    // Ajouter les paramètres du contact
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
    console.log('📝 Contact sélectionné:', { 
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
  }, [showNotification]);

  // Fonction pour sauvegarder le nouveau template SMS
  const handleSaveSmsTemplate = useCallback((newTemplate: string) => {
    setSmsTemplate(newTemplate);
    localStorage.setItem('sms-template', newTemplate);
    showNotification('success', 'Template SMS mis à jour');
  }, [showNotification]);

  // Fonction callback quand un RDV est pris avec succès
  const handleCalendarSuccess = useCallback(() => {
    if (selectedContact) {
      showNotification('success', `Rendez-vous pris avec ${selectedContact.prenom} ${selectedContact.nom}`);
      // Optionnel : mettre à jour la date/heure de RDV du contact
      // updateContact({ id: selectedContact.id, dateRDV: new Date().toISOString().split('T')[0] });
    }
    setIsCalendarModalOpen(false);
  }, [selectedContact, showNotification]);

  // Debug log pour l'état du modal - Supabase supprimé

  // JSX Return
  // Si l'authentification est en cours de chargement, ne rien afficher
  // L'écran de chargement sera géré par main.tsx
  if (auth.isLoading) {
    return null;
  }

  return (
    <div className={cn(
      "flex h-screen overflow-hidden bg-background", 
      theme === Theme.Dark ? "dark" : ""
    )}>
      {/* Contenu principal */}
      <main className="flex flex-col flex-1 w-full min-h-0 overflow-hidden pt-8">
          {/* Barre de titre personnalisée pour Electron */}
          <TitleBar 
            theme={theme} 
            activeTab={activeMenuTab}
            onTabChange={(tab) => {
              if (tab === 'dimicall') {
                setActiveMenuTab(tab);
              }
            }}
            showDimiTable={false}
            onSettingsClick={() => setIsSettingsOpen(true)}
            adbConnectionState={adbConnectionState}
            adbConnecting={adbConnecting}
            activeCallContactId={activeCallContactId}
            onAdbClick={async (e) => {
              if (e.ctrlKey || e.metaKey) {
                setIsAdbLogsDialogOpen(true);
                return;
              }
              
              if (adbConnectionState.isConnected) {
                await disconnectAdb();
                showNotification('info', 'ADB déconnecté');
              } else if (!adbConnecting) {
                const success = await connectAdb();
                showNotification(success ? 'success' : 'error', success ? 'ADB connecté' : 'Échec de connexion ADB');
              }
            }}
            updateState={updateState}
            isUpdateEnabled={isUpdateEnabled}
            onUpdateClick={installUpdate}
            onUpdateConfirmationOpen={() => setIsUpdateConfirmationOpen(true)}
          />


      
      {/* Notifications */}
      
             {/* 🔧 Indicateur d'appel en cours avec chronométrage en temps réel - DÉSACTIVÉ */}
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

      
      {/* Main content */}
      <main className={cn(
        "flex-1 flex flex-col p-3 space-y-3 overflow-hidden w-full min-h-0",
        isAuthModalOpen && "pointer-events-none opacity-50"
      )}>
      {/* Ribbon */}
        <Card className="p-3 ribbon-container w-fit mx-auto shadow-md">
          <div className="flex items-stretch justify-center gap-2 relative">
            
            {/* Communication Group */}
            <div className="flex flex-col items-center">
              <div className="flex gap-2 p-2 border-r border-border pr-4 mr-2 justify-center items-center">
                <RibbonButton 
                  onClick={() => makePhoneCall()} 
                  icon={<Phone />} 
                  label="Appeler" 
                  disabled={!selectedContact}
                  className="min-w-[80px] max-w-[80px] h-12"
                />
                <RibbonButton 
                  onClick={() => selectedContact && setIsEmailDialogOpen(true)} 
                  icon={<Mail />} 
                  label="Email" 
                  disabled={!selectedContact}
                  className="min-w-[80px] max-w-[80px] h-12"
                />
              {/* Bouton SMS avec dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!selectedContact}
                    className={cn(
                        "flex flex-col items-center justify-center min-w-[80px] max-w-[80px] h-12 ribbon-button-modern",
                      "relative overflow-hidden transition-all duration-300 ease-out",
                      "hover:scale-105 hover:shadow-lg hover:shadow-primary/20",
                      "group cursor-pointer",
                      "border border-transparent hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10 hover:border-primary/30",
                      selectedContact && "hover:transform hover:rotate-1"
                    )}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                    </div>
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-xl" />
                    
                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
                      <div className="w-4 h-4 mb-1 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
                        <MessageSquare />
                      </div>
                      <span className="text-[10px] leading-tight w-full transition-all duration-300 group-hover:font-semibold text-center">
                        SMS
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-40 border shadow-lg bg-popover text-popover-foreground z-50" 
                  align="center"
                >
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Envoyer SMS
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem 
                      onClick={() => handleSms('Monsieur')}
                      className="cursor-pointer"
                      disabled={!selectedContact}
                    >
                      Monsieur {selectedContact?.nom}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleSms('Madame')}
                      className="cursor-pointer"
                      disabled={!selectedContact}
                    >
                      Madame {selectedContact?.nom}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
              <span className="text-[9px] text-muted-foreground mt-1 font-medium tracking-wider text-center w-full">Communication</span>
            </div>

            {/* Planification Group */}
            <div className="flex flex-col items-center">
              <div className="flex gap-2 p-2 border-r border-border pr-4 mr-2 justify-center items-center">
                <RibbonButton 
                  onClick={() => selectedContact && setIsRappelDialogOpen(true)} 
                  icon={<Bell />} 
                  label="Rappel" 
                  disabled={!selectedContact}
                  className="min-w-[80px] max-w-[80px] h-12"
                />
                <RibbonButton 
                  onClick={() => selectedContact && setIsRendezVousDialogOpen(true)} 
                  icon={<Calendar />} 
                  label="Rdv" 
                  disabled={!selectedContact}
                  className="min-w-[80px] max-w-[80px] h-12"
                />
                <RibbonButton 
                  onClick={handleCalendarClick} 
                  onContextMenu={(e) => e.preventDefault()}
                  icon={
                    <div className="relative">
                      <CalendarSearch />
                    </div>
                  } 
                  label="Cal.com" 
                  disabled={!selectedContact} 
                  className="min-w-[80px] max-w-[80px] h-12"
                />
              </div>
              <span className="text-[9px] text-muted-foreground mt-1 font-medium tracking-wider text-center w-full">Planification</span>
            </div>

            {/* Qualification Group */}
            <div className="flex flex-col items-center">
              <div className="flex gap-2 p-2 border-r border-border pr-4 mr-2 justify-center items-center">
                <RibbonButton 
                  onClick={() => selectedContact && setIsQualificationDialogOpen(true)} 
                  icon={<FileCheck />} 
                  label="Qualif." 
                  disabled={!selectedContact}
                  className="min-w-[80px] max-w-[80px] h-12"
                />
              </div>
              <span className="text-[9px] text-muted-foreground mt-1 font-medium tracking-wider text-center w-full">Qualification</span>
            </div>

            {/* Recherche Group */}
            <div className="flex flex-col items-center">
              <div className="flex gap-2 p-2 border-r border-border pr-4 mr-2 justify-center items-center">
                <RibbonButton 
                  onClick={() => handleLinkedInSearch()} 
                  icon={<Linkedin />} 
                  label="LinkedIn" 
                  disabled={!selectedContact}
                  className="min-w-[80px] max-w-[80px] h-12"
                />
                <RibbonButton 
                  onClick={() => handleGoogleSearch()} 
                  icon={<Globe />} 
                  label="Google" 
                  disabled={!selectedContact}
                  className="min-w-[80px] max-w-[80px] h-12"
                />
                <RibbonButton 
                  onClick={() => handleDirectLink()} 
                  icon={<ExternalLink />} 
                  label="Lien" 
                  disabled={!selectedContact || !selectedContact.lien}
                  className="min-w-[80px] max-w-[80px] h-12"
                />
              
              {/* Dropdown Auto-Search */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "flex flex-col items-center justify-center min-w-[80px] max-w-[80px] h-12 ribbon-button-modern",
                      "relative overflow-hidden transition-all duration-300 ease-out",
                      "hover:scale-105 hover:shadow-lg hover:shadow-primary/20",
                      "group cursor-pointer",
                      "border border-transparent hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10 hover:border-primary/30",
                      "hover:transform hover:rotate-1"
                    )}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                    </div>
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-xl" />
                    
                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
                      <div className="w-4 h-4 mb-1 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
                        {autoSearchMode === 'disabled' ? <X /> :
                         autoSearchMode === 'linkedin' ? <Linkedin /> :
                         autoSearchMode === 'google' ? <Globe /> :
                         <ExternalLink />}
                      </div>
                      <span className="text-[10px] leading-tight w-full transition-all duration-300 group-hover:font-semibold text-center">
                        {autoSearchMode === 'disabled' ? 'Désactivé' :
                         autoSearchMode === 'linkedin' ? 'Auto-LinkedIn' :
                         autoSearchMode === 'google' ? 'Auto-Google' :
                         'Auto-Lien'}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-56 border shadow-lg bg-popover text-popover-foreground z-50" 
                  align="center"
                >
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Infinity className="w-4 h-4" />
                    Mode de recherche automatique
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem 
                      onClick={() => {
                        setAutoSearchMode('disabled');
                        console.log('🔧 [AUTO-SEARCH] Mode changé vers: Désactivé');
                      }}
                      className="cursor-pointer"
                    >
                      <X className="mr-2 h-4 w-4 text-red-500" />
                      <span>Désactivé</span>
                      {autoSearchMode === 'disabled' && <span className="ml-auto text-xs opacity-70">Actuel</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setAutoSearchMode('linkedin');
                        console.log('🔧 [AUTO-SEARCH] Mode changé vers: Auto-LinkedIn');
                      }}
                      className="cursor-pointer"
                    >
                      <Linkedin className="mr-2 h-4 w-4 text-blue-500" />
                      <span>Auto-LinkedIn</span>
                      {autoSearchMode === 'linkedin' && <span className="ml-auto text-xs opacity-70">Actuel</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setAutoSearchMode('google');
                        console.log('🔧 [AUTO-SEARCH] Mode changé vers: Auto-Google');
                      }}
                      className="cursor-pointer"
                    >
                      <Globe className="mr-2 h-4 w-4 text-green-500" />
                      <span>Auto-Google</span>
                      {autoSearchMode === 'google' && <span className="ml-auto text-xs opacity-70">Actuel</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setAutoSearchMode('link');
                        console.log('🔧 [AUTO-SEARCH] Mode changé vers: Auto-Lien');
                      }}
                      className="cursor-pointer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4 text-purple-500" />
                      <span>Auto-Lien</span>
                      {autoSearchMode === 'link' && <span className="ml-auto text-xs opacity-70">Actuel</span>}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
              <span className="text-[9px] text-muted-foreground mt-1 font-medium tracking-wider text-center w-full">Recherche</span>
            </div>

            {/* Données Group */}
            <div className="flex flex-col items-center">
              <div className="flex gap-2 p-2 justify-center items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => document.getElementById('fileImporter')?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[80px] max-w-[80px] h-12 ribbon-button-modern",
                    "relative overflow-hidden transition-all duration-300 ease-out",
                    "hover:scale-105 hover:shadow-lg hover:shadow-primary/20",
                    "group cursor-pointer",
                    "border border-transparent hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10 hover:border-primary/30",
                    "hover:transform hover:rotate-1"
                  )}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                  </div>
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-xl" />
                  
                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
                    <div className="w-4 h-4 mb-1 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
                      <Upload />
                    </div>
                    <span className="text-[10px] leading-tight w-full transition-all duration-300 group-hover:font-semibold text-center">
                      Importer
                    </span>
                  </div>
                </Button>
              <input type="file" id="fileImporter" accept=".csv, .tsv, .xlsx, .xls" className="hidden" onChange={(e) => e.target.files && handleImportFile(e.target.files)} />
              
              {/* Bouton Export avec menu déroulant */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={contacts.length === 0}
                    className={cn(
                        "flex flex-col items-center justify-center min-w-[80px] max-w-[80px] h-12 ribbon-button-modern",
                      "relative overflow-hidden transition-all duration-300 ease-out",
                      "hover:scale-105 hover:shadow-lg hover:shadow-primary/20",
                      "group cursor-pointer",
                      "border border-transparent hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10 hover:border-primary/30",
                      contacts.length > 0 && "hover:transform hover:rotate-1"
                    )}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                    </div>
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-xl" />
                    
                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
                      <div className="w-4 h-4 mb-1 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
                        <Download />
                      </div>
                      <span className="text-[10px] leading-tight w-full transition-all duration-300 group-hover:font-semibold text-center">
                        Export
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-40 border shadow-lg bg-popover text-popover-foreground z-50" 
                  align="center"
                >
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Format d'export
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                                         <DropdownMenuItem 
                       onClick={() => handleExport('csv')}
                       className="cursor-pointer"
                       disabled={contacts.length === 0}
                     >
                       <span className="mr-2 text-green-600">CSV</span>
                       <span className="text-xs text-muted-foreground">Fichier texte</span>
                     </DropdownMenuItem>
                     <DropdownMenuItem 
                       onClick={() => handleExport('xlsx')}
                       className="cursor-pointer"
                       disabled={contacts.length === 0}
                     >
                       <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                       <span>Excel</span>
                       <span className="ml-auto text-xs text-muted-foreground">.xlsx</span>
                     </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Bouton Supprimer */}
              <Button
                variant="ghost"
                size="sm"
                disabled={contacts.length === 0}
                onClick={handleClearData}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[80px] max-w-[80px] h-12 ribbon-button-modern",
                  "relative overflow-hidden transition-all duration-300 ease-out",
                  "hover:scale-105 hover:shadow-lg hover:shadow-primary/20",
                  "group cursor-pointer",
                  "border border-transparent hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10 hover:border-primary/30",
                  contacts.length > 0 && "hover:transform hover:rotate-1"
                )}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                </div>
                
                {/* Glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-xl" />
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
                  <div className="w-4 h-4 mb-1 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
                    <Trash2 />
                  </div>
                  <span className="text-[10px] leading-tight w-full transition-all duration-300 group-hover:font-semibold text-center">
                    Supprimer
                  </span>
                </div>
              </Button>

              {/* Bouton Google Contacts */}
              <Button
                variant="ghost"
                size="sm"
                disabled={googleContactsCount === 0}
                onClick={handleGoogleContactsExport}
                title={googleContactsCount > 0 
                  ? `Exporter ${googleContactsCount} contacts (À rappeler, DO, RO, A0) vers Google Contacts` 
                  : 'Aucun contact à exporter - Seuls les contacts avec les statuts "À rappeler", "DO", "RO" ou "A0" sont exportés'
                }
                className={cn(
                  "flex flex-col items-center justify-center min-w-[80px] max-w-[80px] h-12 ribbon-button-modern",
                  "relative overflow-hidden transition-all duration-300 ease-out",
                  "hover:scale-105 hover:shadow-lg hover:shadow-primary/20",
                  "group cursor-pointer",
                  "border border-transparent hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10 hover:border-primary/30",
                  googleContactsCount > 0 && "hover:transform hover:rotate-1"
                )}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                </div>
                
                {/* Glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-xl" />
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
                  <div className="w-4 h-4 mb-1 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
                    <Users />
                  </div>
                  <span className="text-[10px] leading-tight w-full transition-all duration-300 group-hover:font-semibold text-center">
                    Contacts
                  </span>
                  {googleContactsCount > 0 && (
                    <Badge variant="secondary" className="absolute -top-1 -right-1 text-[8px] h-4 w-4 p-0 flex items-center justify-center">
                      {googleContactsCount}
                    </Badge>
                  )}
                </div>
              </Button>

              {/* Bouton Google Calendar */}
              <Button
                variant="ghost"
                size="sm"
                disabled={calendarRemindersCount === 0}
                onClick={handleGoogleCalendarExport}
                title={calendarRemindersCount > 0 
                  ? `Exporter ${calendarRemindersCount} rappels vers Google Agenda` 
                  : 'Aucun rappel à exporter - Seuls les contacts avec date de rappel sont exportés'
                }
                className={cn(
                  "flex flex-col items-center justify-center min-w-[80px] max-w-[80px] h-12 ribbon-button-modern",
                  "relative overflow-hidden transition-all duration-300 ease-out",
                  "hover:scale-105 hover:shadow-lg hover:shadow-primary/20",
                  "group cursor-pointer",
                  "border border-transparent hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10 hover:border-primary/30",
                  calendarRemindersCount > 0 && "hover:transform hover:rotate-1"
                )}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                </div>
                
                {/* Glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-xl" />
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
                  <div className="w-4 h-4 mb-1 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
                    <Calendar />
                  </div>
                  <span className="text-[10px] leading-tight w-full transition-all duration-300 group-hover:font-semibold text-center">
                    Agenda
                  </span>
                  {calendarRemindersCount > 0 && (
                    <Badge variant="secondary" className="absolute -top-1 -right-1 text-[8px] h-4 w-4 p-0 flex items-center justify-center">
                      {calendarRemindersCount}
                    </Badge>
                  )}
                </div>
              </Button>
            </div>
              <span className="text-[9px] text-muted-foreground mt-1 font-medium tracking-wider text-center w-full">Données</span>
            </div>
          </div>
        </Card>

        {/* Search bar area */}
        <div className="flex items-stretch gap-3">
          {/* 1er encadré: Recherche */}
          <div className="flex-1 flex gap-3 items-center bg-card rounded-lg p-3 shadow-sm border">
            <Select value={searchColumn} onValueChange={(value) => setSearchColumn(value as keyof Contact | 'all')}>
              <SelectTrigger className="w-44 text-sm h-9 border-border/50 focus:border-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {searchColumnsOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm h-9 pl-9 border-border/50 focus:border-primary"
              />
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* 2ème encadré: Colonnes */}
          <div className="flex items-center bg-card rounded-lg p-3 shadow-sm border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Colonnes
                  <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                    {availableColumns.filter(col => visibleColumns[col]).length}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-background/95 backdrop-blur-sm border shadow-lg">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Gestion des colonnes
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Afficher uniquement les colonnes disponibles dans les données */}
                {availableColumns
                  // Afficher toutes les colonnes disponibles
                  .map((header) => {
                    const isEssential = essentialColumns.includes(header);
                    return (
                      <DropdownMenuCheckboxItem
                        key={header}
                        className="flex items-center gap-2"
                        checked={visibleColumns[header] || false}
                        onCheckedChange={() => toggleColumnVisibility(header)}
                        onSelect={(e) => e.preventDefault()} // Empêche la fermeture du menu
                      >
                        <span className="flex-1">{header}</span>
                        {isEssential && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (essentielle)
                          </span>
                        )}
                      </DropdownMenuCheckboxItem>
                    );
                  })}

                <DropdownMenuSeparator />
                
                {/* Actions rapides */}
                <DropdownMenuCheckboxItem
                  className="flex items-center gap-2 text-primary"
                  checked={false}
                  onCheckedChange={showAllAvailableColumns}
                  onSelect={(e) => e.preventDefault()} // Empêche la fermeture du menu
                >
                  <Eye className="h-4 w-4" />
                  Afficher toutes les colonnes disponibles
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuCheckboxItem
                  className="flex items-center gap-2 text-orange-600 dark:text-orange-400"
                  checked={false}
                  onCheckedChange={hideOptionalColumns}
                  onSelect={(e) => e.preventDefault()} // Empêche la fermeture du menu
                >
                  <Eye className="h-4 w-4" />
                  Masquer les colonnes optionnelles
                </DropdownMenuCheckboxItem>
                
                {/* Informations sur les colonnes */}
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  {availableColumns.length} colonne{availableColumns.length > 1 ? 's' : ''} disponible{availableColumns.length > 1 ? 's' : ''} dans les données
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* 3ème encadré: Chart */}
          <div className="flex items-center bg-card rounded-lg p-3 shadow-sm border">
            <div className="relative inline-flex items-center justify-center px-2 py-0.5">
              <svg width="32" height="32" className="transform -rotate-90">
                <circle 
                  cx="16" 
                  cy="16" 
                  r="14" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  fill="transparent" 
                  className="text-muted-foreground/20"
                />
                <circle 
                  cx="16" 
                  cy="16" 
                  r="14" 
                  stroke="#3B82F6" 
                  strokeWidth="2" 
                  fill="transparent" 
                  strokeDasharray="87.96459430051421" 
                  strokeDashoffset={87.96459430051421 - (87.96459430051421 * progressPercentage / 100)}
                  className="transition-all duration-300 ease-in-out" 
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] font-medium text-muted-foreground">{Math.round(progressPercentage)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Contact table */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="flex-1 bg-card rounded-lg border shadow-sm overflow-hidden">
              <PaginatedContactTable
                ref={contactTableRef}
                contacts={filteredContacts}
                callStates={callStates}
                onSelectContact={handleRowSelection}
                selectedContactId={selectedContact?.id || null}
                onUpdateContact={updateContact}
                onDeleteContact={handleDeleteContact}
                activeCallContactId={activeCallContactId}
                theme={theme}
                visibleColumns={visibleColumns}
                columnHeaders={availableColumns.length > 0 ? availableColumns : COLUMN_HEADERS}
                contactDataKeys={availableDataKeys.length > 0 ? availableDataKeys : CONTACT_DATA_KEYS as (keyof Contact | null)[]}
                onToggleColumnVisibility={toggleColumnVisibility}
                availableColumns={availableColumns}
                onFileImport={handleSingleFileImport}
                initialItemsPerPage={25}
                pageSizeOptions={[25, 50, 100]}
              />
            </div>
          </div>
        </div>
              </main>



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
      {selectedContact && isRappelDialogOpen && (
        <RappelDialog
          isOpen={isRappelDialogOpen}
          onClose={() => setIsRappelDialogOpen(false)}
          contact={selectedContact}
          onSave={(date, time) => {
            updateContact({ id: selectedContact.id, dateRappel: date, heureRappel: time });
            showNotification('success', `Rappel défini pour ${selectedContact.prenom} le ${date} à ${time}.`);
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
            showNotification('success', `Rendez-vous programmé pour ${selectedContact.prenom} le ${date} à ${time}.`);
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
            showNotification('success', `Qualification enregistrée pour ${selectedContact.prenom}.`);
            setIsQualificationDialogOpen(false);
          }}
          theme={theme}
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
                Utilisez les touches de fonction pour interagir rapidement avec le contact sélectionné :
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
          theme={theme}
        />
              )}
      {/* Supabase dialog supprimé pour libérer de l'espace */}
       
       {/* Dialog de configuration des raccourcis */}
       {isShortcutConfigOpen && (
         <ShortcutConfigDialog
           isOpen={isShortcutConfigOpen}
           onClose={() => setIsShortcutConfigOpen(false)}
           theme={theme}
           onSave={() => {
             showNotification('success', 'Configuration des raccourcis sauvegardée', 3000);
           }}
         />
       )}

       {/* Dialog des réglages */}
       {isSettingsOpen && (
         <SettingsDialog
           isOpen={isSettingsOpen}
           onClose={() => setIsSettingsOpen(false)}
           onSave={() => {
             reloadEssentialColumns(); // Recharger les colonnes essentielles
             showNotification('success', 'Réglages sauvegardés avec succès', 3000);
           }}
           calcomUrl={calcomUrl}
           onCalcomUrlChange={handleSaveCalcomUrl}
           smsTemplate={smsTemplate}
           onSmsTemplateChange={handleSaveSmsTemplate}
           theme={theme}
           onThemeChange={setTheme}
         />
       )}

       {/* Indicateur de raccourci */}
       <ShortcutIndicator
         isVisible={shortcutIndicator.isVisible}
         keyPressed={shortcutIndicator.key}
         statusLabel={shortcutIndicator.label}
         theme={theme}
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
                    {adbConnectionState.autoDetectionEnabled ? 'Désactiver' : 'Activer'} détection auto
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const success = await restartAdb();
                      showNotification(success ? 'success' : 'error', success ? 'Serveur ADB redémarré' : 'Erreur lors du redémarrage ADB');
                    }}
                  >
                    Redémarrer ADB
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const logs = getAdbLogs().join('\n');
                      navigator.clipboard.writeText(logs);
                      showNotification('success', 'Logs copiés dans le presse-papier');
                    }}
                  >
                    Copier logs
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>État:</strong> {adbConnectionState.isConnected ? '✅ Connecté' : '❌ Déconnecté'}
                </div>
                <div>
                  <strong>Détection auto:</strong> {adbConnectionState.autoDetectionEnabled ? '✅ Activée' : '❌ Désactivée'}
                </div>
                {adbConnectionState.device && (
                  <>
                    <div>
                      <strong>Appareil:</strong> {adbConnectionState.device.name}
                    </div>
                    <div>
                      <strong>Série:</strong> {adbConnectionState.device.serial}
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
                <h3 className="font-medium">Logs en temps réel:</h3>
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
        theme={theme}
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
                  placeholder="https://cal.com/votre-nom/votre-événement"
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
                <p>• Utilisez l'URL complète de votre événement Cal.com</p>
                <p>• Format: https://cal.com/votre-nom/votre-événement</p>
                <p>• Les paramètres du contact seront ajoutés automatiquement</p>
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

      {/* Modal d'authentification */}
              <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />

      {/* Dialog de confirmation de mise à jour */}
      <UpdateConfirmationDialog
        isOpen={isUpdateConfirmationOpen}
        onClose={() => setIsUpdateConfirmationOpen(false)}
        onConfirm={installUpdate}
        updateInfo={updateState.updateInfo}
      />

      {/* Dialog de confirmation de suppression des données */}
      <Dialog open={isClearDataDialogOpen} onOpenChange={setIsClearDataDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Supprimer toutes les données</DialogTitle>
            <DialogDescription>
              Cette action supprimera définitivement tous les contacts importés dans la table. 
              Cette action ne peut pas être annulée.
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


        </main>
      </div>
  );
};

export default App;