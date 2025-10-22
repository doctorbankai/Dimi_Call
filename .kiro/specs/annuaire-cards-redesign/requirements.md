# Requirements Document

## Introduction

Cette fonctionnalité vise à refondre le design de la page "Annuaire" en mode Cards pour améliorer l'expérience utilisateur. L'objectif est de créer une grille de cards compactes et élégantes (3-4 par ligne) qui affichent les informations essentielles, et d'ouvrir un panneau de détails avec l'historique complet lorsqu'on clique sur une card. Le design doit être moderne, responsive et utiliser les composants shadcn/ui.

## Glossary

- **Annuaire System**: Le système de gestion des contacts dans l'application
- **Card**: Un composant visuel compact représentant un contact
- **Detail Panel**: Un panneau latéral ou modal affichant les informations complètes d'un contact
- **Grid Layout**: Une disposition en grille responsive des cards
- **Contact History**: L'historique des interactions avec un contact (appels, rappels, rendez-vous)

## Requirements

### Requirement 1: Grille de cards compactes

**User Story:** En tant qu'utilisateur, je veux voir mes contacts sous forme de cards compactes organisées en grille, afin de visualiser plus de contacts simultanément.

#### Acceptance Criteria

1. WHEN l'utilisateur accède à la page Annuaire en mode Cards, THE Annuaire System SHALL afficher les contacts dans une grille responsive
2. WHEN l'écran a une largeur supérieure à 1280px, THE Annuaire System SHALL afficher 4 cards par ligne
3. WHEN l'écran a une largeur entre 1024px et 1280px, THE Annuaire System SHALL afficher 3 cards par ligne
4. WHEN l'écran a une largeur entre 768px et 1024px, THE Annuaire System SHALL afficher 2 cards par ligne
5. WHEN l'écran a une largeur inférieure à 768px, THE Annuaire System SHALL afficher 1 card par ligne

### Requirement 2: Contenu des cards compactes

**User Story:** En tant qu'utilisateur, je veux que chaque card affiche uniquement les informations essentielles, afin d'avoir une vue d'ensemble claire et non surchargée.

#### Acceptance Criteria

1. WHEN une card est affichée, THE Annuaire System SHALL afficher l'avatar ou les initiales du contact
2. WHEN une card est affichée, THE Annuaire System SHALL afficher le nom complet du contact
3. WHEN une card est affichée, THE Annuaire System SHALL afficher le numéro de téléphone principal
4. WHEN une card est affichée, THE Annuaire System SHALL afficher le statut actuel du contact avec un badge coloré
5. WHEN une card est affichée, THE Annuaire System SHALL afficher la date du prochain rappel si elle existe
6. WHEN une card est affichée, THE Annuaire System SHALL utiliser des animations smooth au survol (hover effects)

### Requirement 3: Interactions avec les cards

**User Story:** En tant qu'utilisateur, je veux pouvoir interagir rapidement avec les cards, afin d'accéder aux actions principales sans ouvrir le panneau de détails.

#### Acceptance Criteria

1. WHEN l'utilisateur survole une card, THE Annuaire System SHALL afficher un effet visuel de hover avec élévation
2. WHEN l'utilisateur clique sur une card, THE Annuaire System SHALL ouvrir le panneau de détails pour ce contact
3. WHEN l'utilisateur survole une card, THE Annuaire System SHALL afficher des boutons d'action rapide (appel, SMS, email)
4. WHEN l'utilisateur clique sur un bouton d'action rapide, THE Annuaire System SHALL exécuter l'action sans ouvrir le panneau de détails
5. WHEN l'utilisateur utilise le clavier, THE Annuaire System SHALL permettre la navigation entre les cards avec les flèches

### Requirement 4: Panneau de détails

**User Story:** En tant qu'utilisateur, je veux voir toutes les informations et l'historique d'un contact dans un panneau dédié, afin d'avoir une vue complète sans quitter la page.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur une card, THE Annuaire System SHALL ouvrir un panneau de détails en overlay ou en slide-over
2. WHEN le panneau de détails est ouvert, THE Annuaire System SHALL afficher toutes les informations du contact (prénom, nom, téléphone, email, statut, notes)
3. WHEN le panneau de détails est ouvert, THE Annuaire System SHALL afficher la section "Rappels & Rendez-vous" avec les dates et heures
4. WHEN le panneau de détails est ouvert, THE Annuaire System SHALL afficher l'historique complet des interactions
5. WHEN le panneau de détails est ouvert, THE Annuaire System SHALL afficher tous les boutons d'action (appel, SMS, email, qualification, rappel, RDV, Cal.com)
6. WHEN le panneau de détails est ouvert, THE Annuaire System SHALL afficher les boutons de recherche externe (LinkedIn, Google)
7. WHEN l'utilisateur clique en dehors du panneau ou sur le bouton fermer, THE Annuaire System SHALL fermer le panneau avec une animation smooth
8. WHEN l'utilisateur appuie sur la touche Escape, THE Annuaire System SHALL fermer le panneau de détails

### Requirement 5: Design moderne avec shadcn/ui

**User Story:** En tant qu'utilisateur, je veux que l'interface soit moderne et cohérente avec le reste de l'application, afin d'avoir une expérience visuelle agréable.

#### Acceptance Criteria

1. WHEN les cards sont affichées, THE Annuaire System SHALL utiliser les composants shadcn/ui Card, Avatar, Badge
2. WHEN le panneau de détails est affiché, THE Annuaire System SHALL utiliser le composant shadcn/ui Sheet ou Dialog
3. WHEN les boutons d'action sont affichés, THE Annuaire System SHALL utiliser le composant shadcn/ui Button avec les variantes appropriées
4. WHEN les animations sont déclenchées, THE Annuaire System SHALL utiliser des transitions CSS smooth (duration-200, duration-300)
5. WHEN le mode sombre est activé, THE Annuaire System SHALL adapter automatiquement les couleurs et contrastes

### Requirement 6: Performance et responsive

**User Story:** En tant qu'utilisateur, je veux que la grille de cards soit fluide et performante, afin d'avoir une navigation agréable même avec beaucoup de contacts.

#### Acceptance Criteria

1. WHEN la page charge avec plus de 100 contacts, THE Annuaire System SHALL utiliser la virtualisation ou la pagination pour maintenir les performances
2. WHEN l'utilisateur redimensionne la fenêtre, THE Annuaire System SHALL adapter la grille de manière fluide sans rechargement
3. WHEN l'utilisateur fait défiler la page, THE Annuaire System SHALL maintenir un framerate de 60fps minimum
4. WHEN le panneau de détails s'ouvre, THE Annuaire System SHALL charger les données en moins de 100ms
5. WHEN l'application est compilée, THE Annuaire System SHALL compiler sans erreurs TypeScript ou ESLint

### Requirement 7: Accessibilité

**User Story:** En tant qu'utilisateur utilisant des technologies d'assistance, je veux pouvoir naviguer et interagir avec les cards, afin d'accéder aux informations de contact.

#### Acceptance Criteria

1. WHEN un lecteur d'écran est utilisé, THE Annuaire System SHALL annoncer le nom du contact et les informations principales pour chaque card
2. WHEN l'utilisateur navigue au clavier, THE Annuaire System SHALL fournir des indicateurs de focus visibles
3. WHEN les boutons d'action sont affichés, THE Annuaire System SHALL fournir des labels aria appropriés
4. WHEN le panneau de détails est ouvert, THE Annuaire System SHALL déplacer le focus sur le panneau
5. WHEN le panneau de détails est fermé, THE Annuaire System SHALL restaurer le focus sur la card qui l'a ouvert
