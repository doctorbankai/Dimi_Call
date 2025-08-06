import { 
  Home, 
  Users, 
  Phone, 
  Wrench, 
  AlertTriangle
} from 'lucide-react';
import { HelpSection, HelpSectionData } from '../types/help';

export const helpSections: HelpSectionData[] = [
  {
    id: HelpSection.Introduction,
    title: 'Introduction',
    icon: Home,
    description: 'Découvrez DimiCall et ses fonctionnalités principales',
    content: [
      {
        type: 'heading',
        content: 'Bienvenue dans DimiCall',
        level: 1
      },
      {
        type: 'paragraph',
        content: 'DimiCall est une application de gestion de contacts et d\'appels conçue pour optimiser votre prospection commerciale. Elle vous permet de gérer efficacement vos listes de contacts, d\'automatiser vos appels via votre téléphone Android, et de suivre vos interactions commerciales.'
      },
      {
        type: 'heading',
        content: 'Fonctionnalités principales',
        level: 2
      },
      {
        type: 'list',
        content: [
          'Gestion complète des contacts avec import/export CSV et Excel',
          'Intégration ADB pour les appels automatiques via Android',
          'Templates personnalisables pour emails et SMS',
          'Système de rappels et rendez-vous intégré',
          'Export vers Google Calendar et Google Contacts',
          'Recherche automatique LinkedIn et Google',
          'Interface moderne avec thèmes sombre et clair'
        ]
      },
      {
        type: 'heading',
        content: 'Objectifs de l\'application',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'DimiCall vise à simplifier et accélérer votre processus de prospection en centralisant tous vos outils de communication et en automatisant les tâches répétitives. L\'application s\'intègre parfaitement dans votre workflow quotidien pour maximiser votre efficacité commerciale.'
      },
      {
        type: 'tip',
        content: 'Conseil : Commencez par importer votre liste de contacts, puis configurez votre téléphone Android via ADB pour profiter pleinement des fonctionnalités d\'appel automatique.'
      }
    ]
  },
  {
    id: HelpSection.ContactManagement,
    title: 'Gestion des contacts',
    icon: Users,
    description: 'Import, export et manipulation des contacts',
    content: [
      {
        type: 'heading',
        content: 'Import de contacts',
        level: 1
      },
      {
        type: 'paragraph',
        content: 'DimiCall supporte plusieurs formats d\'import pour vos listes de contacts :'
      },
      {
        type: 'list',
        content: [
          'Fichiers CSV (séparés par virgules)',
          'Fichiers TSV (séparés par tabulations)',
          'Fichiers Excel (.xlsx)',
          'Glisser-déposer directement dans l\'application'
        ]
      },
      {
        type: 'heading',
        content: 'Colonnes supportées',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'L\'application reconnaît automatiquement ces colonnes :'
      },
      {
        type: 'list',
        content: [
          'Prénom, Nom : Informations de base',
          'Téléphone : Numéro formaté automatiquement',
          'Email : Adresse électronique',
          'Commentaire : Notes et qualifications',
          'Statut : État du contact (À rappeler, Argumenté, etc.)',
          'Dates : Rappel, RDV, dernier appel',
          'Lien : URL personnalisée pour le contact'
        ]
      },
      {
        type: 'heading',
        content: 'Export de contacts',
        level: 1
      },
      {
        type: 'paragraph',
        content: 'Exportez vos contacts dans différents formats :'
      },
      {
        type: 'list',
        content: [
          'CSV standard : Pour réimporter dans d\'autres outils',
          'Excel : Avec formatage et colonnes organisées',
          'Google Contacts : Format optimisé pour Google',
          'Google Calendar : Événements basés sur les RDV programmés'
        ]
      },
      {
        type: 'heading',
        content: 'Manipulation des données',
        level: 1
      },
      {
        type: 'list',
        content: [
          'Tri par colonnes : Cliquez sur les en-têtes',
          'Recherche avancée : Par colonne ou globale',
          'Filtres par statut : Affichez seulement certains types',
          'Édition en ligne : Double-cliquez pour modifier',
          'Suppression : Sélectionnez et utilisez la touche Suppr'
        ]
      },
      {
        type: 'warning',
        content: 'Attention : La suppression de contacts est définitive. Assurez-vous d\'avoir une sauvegarde avant de supprimer des données importantes.'
      }
    ]
  },
  {
    id: HelpSection.CallFeatures,
    title: 'Fonctionnalités d\'appel',
    icon: Phone,
    description: 'Configuration ADB et appels automatiques',
    content: [
      {
        type: 'heading',
        content: 'Configuration ADB',
        level: 1
      },
      {
        type: 'paragraph',
        content: 'ADB (Android Debug Bridge) permet à DimiCall de contrôler votre téléphone Android pour automatiser les appels.'
      },
      {
        type: 'heading',
        content: 'Prérequis',
        level: 2
      },
      {
        type: 'list',
        content: [
          'Téléphone Android avec débogage USB activé',
          'Câble USB pour connecter le téléphone à l\'ordinateur',
          'Autorisation de débogage accordée à l\'ordinateur',
          'Application téléphone par défaut configurée'
        ]
      },
      {
        type: 'heading',
        content: 'Activation du débogage USB',
        level: 2
      },
      {
        type: 'list',
        content: [
          '1. Allez dans Paramètres > À propos du téléphone',
          '2. Appuyez 7 fois sur "Numéro de build"',
          '3. Retournez aux Paramètres > Options de développement',
          '4. Activez "Débogage USB"',
          '5. Connectez le téléphone et autorisez l\'ordinateur'
        ]
      },
      {
        type: 'heading',
        content: 'Utilisation des appels automatiques',
        level: 1
      },
      {
        type: 'paragraph',
        content: 'Une fois ADB configuré, vous pouvez :'
      },
      {
        type: 'list',
        content: [
          'Cliquer sur l\'icône téléphone d\'un contact pour appeler',
          'Utiliser les raccourcis clavier pour appeler rapidement',
          'Suivre la durée des appels en temps réel',
          'Enregistrer automatiquement les durées d\'appel'
        ]
      },
      {
        type: 'heading',
        content: 'Résolution des problèmes',
        level: 1
      },
      {
        type: 'list',
        content: [
          'Badge "Err" : Vérifiez la connexion USB et les autorisations',
          'Badge "Off" : Téléphone déconnecté ou ADB désactivé',
          'Appels qui ne se lancent pas : Redémarrez ADB via les paramètres',
          'Autorisations refusées : Révoquez et accordez à nouveau'
        ]
      },
      {
        type: 'tip',
        content: 'Conseil : Gardez votre téléphone déverrouillé pendant les sessions d\'appel pour éviter les interruptions.'
      }
    ]
  },
  {
    id: HelpSection.ToolsAndActions,
    title: 'Outils et actions',
    icon: Wrench,
    description: 'Tous les boutons et leurs fonctions',
    content: [
      {
        type: 'heading',
        content: 'Barre d\'outils principale',
        level: 1
      },
      {
        type: 'paragraph',
        content: 'La barre d\'outils contient tous les outils essentiels pour interagir avec vos contacts :'
      },
      {
        type: 'heading',
        content: 'Actions de communication',
        level: 2
      },
      {
        type: 'list',
        content: [
          '📞 Téléphone : Lance un appel via ADB (nécessite un contact sélectionné)',
          '✉️ Email : Ouvre le compositeur d\'email avec templates personnalisables',
          '💬 SMS : Prépare un SMS avec votre template personnalisé',
          '🔔 Rappel : Programme un rappel avec date et heure',
          '📅 RDV : Planifie un rendez-vous avec intégration calendrier'
        ]
      },
      {
        type: 'heading',
        content: 'Recherche et navigation',
        level: 2
      },
      {
        type: 'list',
        content: [
          '🔍 LinkedIn : Recherche automatique du contact sur LinkedIn',
          '🌐 Google : Recherche Google du nom du contact',
          '🔗 Lien direct : Ouvre l\'URL personnalisée du contact (si disponible)',
          '📋 Calendrier : Accès rapide à votre calendrier Cal.com'
        ]
      },
      {
        type: 'heading',
        content: 'Gestion des données',
        level: 2
      },
      {
        type: 'list',
        content: [
          '📥 Import : Importe des contacts depuis CSV/Excel',
          '📤 Export : Exporte vers CSV, Excel, Google Contacts/Calendar',
          '🔄 Actualiser : Recharge les données depuis le stockage',
          '🗑️ Supprimer : Supprime le contact sélectionné'
        ]
      },
      {
        type: 'heading',
        content: 'Paramètres et configuration',
        level: 2
      },
      {
        type: 'list',
        content: [
          '⚙️ Paramètres : Accès aux réglages de l\'application',
          '🌙/☀️ Thème : Bascule entre mode sombre et clair',
          '⌨️ Raccourcis : Configuration des touches de fonction',
          '📊 Colonnes : Gestion de la visibilité des colonnes'
        ]
      },
      {
        type: 'heading',
        content: 'Actions contextuelles',
        level: 1
      },
      {
        type: 'paragraph',
        content: 'Certaines actions nécessitent qu\'un contact soit sélectionné :'
      },
      {
        type: 'list',
        content: [
          'Clic simple : Sélectionne un contact',
          'Double-clic : Édite le contact en ligne',
          'Clic droit : Menu contextuel avec actions rapides',
          'Touches F1-F12 : Raccourcis pour changer le statut'
        ]
      },
      {
        type: 'warning',
        content: 'Certaines actions (appel, SMS) nécessitent une connexion ADB active avec votre téléphone Android.'
      }
    ]
  },
  {
    id: HelpSection.CommonErrors,
    title: 'Erreurs fréquentes',
    icon: AlertTriangle,
    description: 'Solutions aux problèmes courants',
    content: [
      {
        type: 'heading',
        content: 'Problèmes ADB',
        level: 1
      },
      {
        type: 'heading',
        content: 'Erreur : "Appareil non autorisé"',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'Solution étape par étape :'
      },
      {
        type: 'list',
        content: [
          '1. Débranchez et rebranchez le câble USB',
          '2. Sur votre téléphone, une popup apparaît : "Autoriser le débogage USB ?"',
          '3. Cochez "Toujours autoriser depuis cet ordinateur"',
          '4. Appuyez sur "Autoriser"',
          '5. Redémarrez DimiCall si nécessaire'
        ]
      },
      {
        type: 'heading',
        content: 'Erreur : "Aucun appareil trouvé"',
        level: 2
      },
      {
        type: 'list',
        content: [
          'Vérifiez que le débogage USB est activé',
          'Essayez un autre câble USB (certains ne transmettent que l\'alimentation)',
          'Changez de port USB sur votre ordinateur',
          'Redémarrez le service ADB via les paramètres'
        ]
      },
      {
        type: 'heading',
        content: 'Problèmes d\'import',
        level: 1
      },
      {
        type: 'heading',
        content: 'Erreur : "Format de fichier non supporté"',
        level: 2
      },
      {
        type: 'list',
        content: [
          'Vérifiez l\'extension : .csv, .tsv, ou .xlsx uniquement',
          'Ouvrez le fichier dans Excel et sauvegardez au bon format',
          'Assurez-vous que le fichier n\'est pas corrompu',
          'Vérifiez l\'encodage (UTF-8 recommandé pour les CSV)'
        ]
      },
      {
        type: 'heading',
        content: 'Erreur : "Colonnes non reconnues"',
        level: 2
      },
      {
        type: 'list',
        content: [
          'Utilisez les noms de colonnes standards : Prénom, Nom, Téléphone, Email',
          'Évitez les caractères spéciaux dans les en-têtes',
          'Assurez-vous que la première ligne contient les en-têtes',
          'Supprimez les lignes vides au début du fichier'
        ]
      },
      {
        type: 'heading',
        content: 'Problèmes de performance',
        level: 1
      },
      {
        type: 'heading',
        content: 'Application lente avec beaucoup de contacts',
        level: 2
      },
      {
        type: 'list',
        content: [
          'Utilisez les filtres pour réduire l\'affichage',
          'Masquez les colonnes inutiles via les paramètres',
          'Supprimez les contacts obsolètes',
          'Redémarrez l\'application périodiquement'
        ]
      },
      {
        type: 'heading',
        content: 'Problèmes de mise à jour',
        level: 1
      },
      {
        type: 'heading',
        content: 'Mise à jour bloquée',
        level: 2
      },
      {
        type: 'list',
        content: [
          'Fermez complètement l\'application',
          'Redémarrez en tant qu\'administrateur si nécessaire',
          'Vérifiez votre connexion internet',
          'Désactivez temporairement l\'antivirus'
        ]
      },
      {
        type: 'tip',
        content: 'Conseil : En cas de problème persistant, utilisez le bouton "Envoyer un ticket" dans la barre de titre pour obtenir de l\'aide personnalisée.'
      }
    ]
  }
];

export const getHelpSection = (sectionId: HelpSection): HelpSectionData | undefined => {
  return helpSections.find(section => section.id === sectionId);
};

export const getAllHelpSections = (): HelpSectionData[] => {
  return helpSections;
};