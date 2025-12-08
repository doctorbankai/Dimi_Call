import React from 'react';
import {
  Home,
  Users,
  Phone,
  Wrench,
  AlertTriangle,
  Calendar,
  Pin,
  CheckCircle2,
  MousePointer2,
  PhoneCall,
  Zap,
  FileSpreadsheet,
  Table,
  ListChecks,
  Sparkles,
  Upload,
  FileDown,
  PieChart,
  Filter,
  GitBranch,
  Search,
  FileSearch,
  Folder,
  UploadCloud,
  Eye
} from 'lucide-react';
import { HelpCategory, HelpSection, HelpSectionData } from '../types/help';

export const helpSections: HelpSectionData[] = [
  {
    id: HelpSection.DocOverview,
    title: 'Page Appels',
    icon: Home,
    description: 'Piloter vos appels, statuts et actions rapides',
    category: 'documentation',
    content: [
      {
        type: 'heading',
        content: 'Vue Appels',
        level: 1
      },
      {
        type: 'paragraph',
        content: 'Sélectionnez un contact dans la liste, lancez l’appel via ADB et mettez à jour le statut F1-F12 sans quitter la page.'
      },
      {
        type: 'quickstart',
        content: [
          {
            title: 'Sélectionner un contact',
            description: 'Clique ou navigation clavier ; la fiche courte affiche les actions disponibles.',
            icon: React.createElement(MousePointer2, { className: 'w-4 h-4' }),
            shortcut: 'Tab/Flèches'
          },
          {
            title: 'Lancer l’appel',
            description: 'Icône téléphone ou Alt + T ; badge ADB doit être vert.',
            icon: React.createElement(PhoneCall, { className: 'w-4 h-4' }),
            shortcut: 'Alt + T'
          },
          {
            title: 'Mettre à jour le statut',
            description: 'F1-F12 ou bandeau statuts pour qualifier rapidement.',
            icon: React.createElement(Zap, { className: 'w-4 h-4' }),
            shortcut: 'F1 - F12'
          }
        ]
      }
    ]
  },
  {
    id: HelpSection.DocContacts,
    title: 'Page Contacts & Import',
    icon: Users,
    description: 'Importer, nettoyer et organiser les contacts',
    category: 'documentation',
    content: [
      {
        type: 'heading',
        content: 'Importer un fichier',
        level: 1
      },
      {
        type: 'quickstart',
        content: [
          {
            title: 'Préparer le fichier',
            description: 'En-têtes claires, UTF-8, une ligne par contact.',
            icon: React.createElement(FileSpreadsheet, { className: 'w-4 h-4' })
          },
          {
            title: 'Colonnes clés',
            description: 'Prénom, Nom, Téléphone, Email pour un mapping fiable.',
            icon: React.createElement(Table, { className: 'w-4 h-4' })
          },
          {
            title: 'Dédoublonner',
            description: 'Nettoyer avant import pour éviter les fiches multiples.',
            icon: React.createElement(ListChecks, { className: 'w-4 h-4' })
          }
        ]
      }
    ]
  },
  {
    id: HelpSection.DocCalls,
    title: 'Page Calendrier',
    icon: Phone,
    description: 'Rappels, RDV et suivi des tâches datées',
    category: 'documentation',
    content: [
      {
        type: 'heading',
        content: 'Vue Calendrier',
        level: 1
      },
      {
        type: 'quickstart',
        content: [
          {
            title: 'Choisir la vue',
            description: 'Jour, Semaine, Mois, Année ou Agenda depuis la barre en haut.',
            icon: React.createElement(Calendar, { className: 'w-4 h-4' })
          },
          {
            title: 'Repérer les rappels',
            description: 'Cartes “Aujourd’hui” et “À venir” pour les rappels/RDV de la base locale.',
            icon: React.createElement(Pin, { className: 'w-4 h-4' })
          },
          {
            title: 'Ouvrir ou valider',
            description: 'Cliquer pour voir le détail, ouvrir l’annuaire ou marquer comme fait.',
            icon: React.createElement(CheckCircle2, { className: 'w-4 h-4' })
          }
        ]
      }
    ]
  },
  {
    id: HelpSection.DocProductivity,
    title: 'Page Pré-qualification',
    icon: Wrench,
    description: 'Évaluer rapidement les leads',
    category: 'documentation',
    content: [
      {
        type: 'heading',
        content: 'Processus',
        level: 1
      },
      {
        type: 'quickstart',
        content: [
          {
            title: 'Importer un fichier',
            description: 'Déposer un Excel (.xlsx/.xls) avec colonnes Prénom et Nom.',
            icon: React.createElement(Upload, { className: 'w-4 h-4' })
          },
          {
            title: 'Classer les profils',
            description: 'Assigner Baleine/Poisson/Prématuré/Inexploitable/Passer via les boutons.',
            icon: React.createElement(Sparkles, { className: 'w-4 h-4' })
          },
          {
            title: 'Exporter ou recommencer',
            description: 'Exporter le classement en Excel ou charger un nouveau fichier.',
            icon: React.createElement(FileDown, { className: 'w-4 h-4' })
          }
        ]
      }
    ]
  },
  {
    id: HelpSection.DocGraph,
    title: 'Page Graphiques',
    icon: Phone,
    description: 'Visualiser les performances',
    category: 'documentation',
    content: [
      {
        type: 'heading',
        content: 'Vue Graphiques',
        level: 1
      },
      {
        type: 'paragraph',
        content: 'Suivez vos volumes d’appels, taux de réponse et conversions en un coup d’œil.'
      },
      {
        type: 'quickstart',
        content: [
          {
            title: 'Régler la période',
            description: 'Utiliser les filtres dates de la barre Graphiques/BDD.',
            icon: React.createElement(Calendar, { className: 'w-4 h-4' })
          },
          {
            title: 'Lire la répartition',
            description: 'Statuts finaux des contacts basés sur la base locale.',
            icon: React.createElement(PieChart, { className: 'w-4 h-4' })
          },
          {
            title: 'Suivre le tunnel',
            description: 'Entonnoir Contacté → Décroché → Argumenté → Pris.',
            icon: React.createElement(GitBranch, { className: 'w-4 h-4' })
          }
        ]
      }
    ]
  },
  {
    id: HelpSection.DocAnnuaire,
    title: 'Page Annuaire',
    icon: Users,
    description: 'Rechercher et ouvrir des fiches contact',
    category: 'documentation',
    content: [
      {
        type: 'heading',
        content: 'Vue Annuaire',
        level: 1
      },
      {
        type: 'paragraph',
        content: 'Parcourez rapidement vos contacts, ouvrez une fiche et lancez les actions associées.'
      },
      {
        type: 'quickstart',
        content: [
          {
            title: 'Recherche rapide',
            description: 'Tapez un nom ou un numéro pour filtrer instantanément.',
            icon: React.createElement(Search, { className: 'w-4 h-4' })
          },
          {
            title: 'Ouvrir une fiche',
            description: 'Cliquer ou double-cliquer pour voir les détails et actions.',
            icon: React.createElement(FileSearch, { className: 'w-4 h-4' })
          },
          {
            title: 'Actions directes',
            description: 'Appeler, envoyer un SMS/email ou planifier un rappel.',
            icon: React.createElement(Zap, { className: 'w-4 h-4' })
          }
        ]
      }
    ]
  },
  {
    id: HelpSection.DocFiles,
    title: 'Page Fichiers',
    icon: Home,
    description: 'Gérer les imports, exports et documents',
    category: 'documentation',
    content: [
      {
        type: 'heading',
        content: 'Vue Fichiers',
        level: 1
      },
      {
        type: 'paragraph',
        content: 'Centralise vos imports récents, exports et fichiers associés aux campagnes.'
      },
      {
        type: 'quickstart',
        content: [
          {
            title: 'Naviguer',
            description: 'Arborescence de C:\\DimiCall : dossiers et sous-dossiers.',
            icon: React.createElement(Folder, { className: 'w-4 h-4' })
          },
          {
            title: 'Déposer/charger',
            description: 'Drag & drop ou bouton Importer pour ajouter des fichiers.',
            icon: React.createElement(UploadCloud, { className: 'w-4 h-4' })
          },
          {
            title: 'Prévisualiser',
            description: 'Aperçu intégré + tags et pièces jointes contact/appel.',
            icon: React.createElement(Eye, { className: 'w-4 h-4' })
          }
        ]
      }
    ]
  },
  {
    id: HelpSection.TroubleshootAdb,
    title: 'Dépannage ADB',
    icon: AlertTriangle,
    description: 'Connexion téléphone et lancement d’appels',
    category: 'depannage',
    content: [
      {
        type: 'heading',
        content: 'Symptômes fréquents',
        level: 1
      },
      {
        type: 'list',
        content: [
          'Badge ADB en “Err” ou “Off”',
          'Appel qui ne démarre pas',
          'Popup d’autorisation non proposée'
        ]
      },
      {
        type: 'heading',
        content: 'Correctifs rapides',
        level: 2
      },
      {
        type: 'list',
        content: [
          '1) Changer de câble USB (câble data) et de port',
          '2) Sur le téléphone, révoquer puis réaccepter le débogage USB',
          '3) Relancer ADB via les paramètres DimiCall',
          '4) Garder le téléphone déverrouillé pendant l’appel',
          '5) Redémarrer DimiCall si le badge reste en “Err”'
        ]
      },
      {
        type: 'tip',
        content: 'Si vous avez plusieurs téléphones, n’en laissez qu’un seul branché pour éviter les conflits ADB.'
      }
    ]
  },
  {
    id: HelpSection.TroubleshootImport,
    title: 'Import de fichiers',
    icon: AlertTriangle,
    description: 'Corriger les erreurs d’import CSV/Excel',
    category: 'depannage',
    content: [
      {
        type: 'heading',
        content: 'Erreurs fréquentes',
        level: 1
      },
      {
        type: 'list',
        content: [
          '“Format non supporté”',
          'Colonnes non reconnues',
          'Accents ou caractères spéciaux mal lus'
        ]
      },
      {
        type: 'heading',
        content: 'Solutions',
        level: 2
      },
      {
        type: 'list',
        content: [
          'Sauvegarder en UTF-8 (CSV) ou en .xlsx récent',
          'Première ligne = en-têtes simples (Prenom, Nom, Telephone, Email)',
          'Supprimer les colonnes vides et lignes blanches en début de fichier',
          'Limiter les caractères spéciaux dans les en-têtes',
          'Tester un échantillon de 20 lignes avant l’import complet'
        ]
      }
    ]
  },
  {
    id: HelpSection.TroubleshootPerformance,
    title: 'Performance',
    icon: AlertTriangle,
    description: 'Lenteurs ou listes volumineuses',
    category: 'depannage',
    content: [
      {
        type: 'heading',
        content: 'Quand l’app ralentit',
        level: 1
      },
      {
        type: 'list',
        content: [
          'Tableau très chargé',
          'Filtres ou recherche sur de gros volumes',
          'Machine limitée ou trop d’apps ouvertes'
        ]
      },
      {
        type: 'heading',
        content: 'Réglages rapides',
        level: 2
      },
      {
        type: 'list',
        content: [
          'Activer le mode compact',
          'Masquer les colonnes non utilisées',
          'Filtrer par statut plutôt que parcourir toute la liste',
          'Fermer et relancer l’app après de longues sessions'
        ]
      }
    ]
  },
  {
    id: HelpSection.TroubleshootUpdates,
    title: 'Mises à jour & support',
    icon: AlertTriangle,
    description: 'Installer les MAJ et obtenir de l’aide',
    category: 'depannage',
    content: [
      {
        type: 'heading',
        content: 'Mise à jour bloquée',
        level: 1
      },
      {
        type: 'list',
        content: [
          'Fermer DimiCall puis relancer en mode administrateur',
          'Vérifier la connexion internet',
          'Désactiver temporairement l’antivirus si nécessaire'
        ]
      },
      {
        type: 'heading',
        content: 'Quand contacter le support',
        level: 2
      },
      {
        type: 'list',
        content: [
          'Appels qui ne se lancent pas malgré la checklist',
          'Imports qui échouent après nettoyage',
          'Crashs répétés ou blocage au démarrage'
        ]
      },
      {
        type: 'tip',
        content: 'Utilisez le bouton “Contacter le support” pour envoyer un ticket avec une description courte + capture d’écran si possible.'
      }
    ]
  }
];

export const getHelpSection = (sectionId: HelpSection, category?: HelpCategory): HelpSectionData | undefined => {
  const section = helpSections.find(section => section.id === sectionId && (!category || section.category === category));
  if (section) return section;
  if (category) {
    return helpSections.find(section => section.category === category);
  }
  return undefined;
};

export const getAllHelpSections = (): HelpSectionData[] => {
  return helpSections;
};

export const getHelpSectionsByCategory = (category: HelpCategory): HelpSectionData[] => {
  return helpSections.filter(section => section.category === category);
};