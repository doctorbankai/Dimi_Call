# Requirements Document

## Introduction

Cette fonctionnalité désactive complètement le système de mise à jour automatique pour les versions macOS (.dmg) de l'application DimiCall. En raison des coûts de notarisation Apple, les versions macOS distribuées via GitHub Actions ne peuvent pas utiliser le système de mise à jour automatique d'Electron. Cette spec vise à supprimer tous les éléments liés aux mises à jour (badge dans la titlebar, section mise à jour dans les paramètres) uniquement pour les builds macOS.

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur macOS, je ne veux pas voir le badge de mise à jour dans la titlebar, afin d'éviter la confusion puisque les mises à jour automatiques ne sont pas disponibles sur cette plateforme.

#### Acceptance Criteria

1. WHEN l'application s'exécute sur macOS THEN le badge de mise à jour SHALL ne jamais s'afficher dans la titlebar
2. WHEN l'application s'exécute sur macOS THEN aucune vérification de mise à jour SHALL être effectuée
3. WHEN l'application s'exécute sur macOS THEN les événements electron-updater SHALL être désactivés
4. WHEN l'application s'exécute sur Windows ou Linux THEN le système de mise à jour SHALL fonctionner normalement

### Requirement 2

**User Story:** En tant qu'utilisateur macOS, je ne veux pas voir la section "Mise à jour" dans les paramètres de l'application, afin d'avoir une interface cohérente sans fonctionnalités non disponibles.

#### Acceptance Criteria

1. WHEN l'utilisateur ouvre les paramètres sur macOS THEN la section mise à jour SHALL être masquée
2. WHEN l'utilisateur ouvre les paramètres sur macOS THEN aucun bouton de vérification manuelle SHALL être visible
3. WHEN l'utilisateur ouvre les paramètres sur Windows ou Linux THEN la section mise à jour SHALL être visible et fonctionnelle

### Requirement 3

**User Story:** En tant que développeur, je veux que la désactivation soit basée sur la détection de la plateforme, afin que le même code puisse être utilisé pour toutes les plateformes avec un comportement adaptatif.

#### Acceptance Criteria

1. WHEN l'application démarre THEN elle SHALL détecter la plateforme d'exécution
2. WHEN la plateforme est macOS THEN une variable de configuration SHALL désactiver les mises à jour
3. WHEN la plateforme est Windows ou Linux THEN les mises à jour SHALL rester activées
4. WHEN la détection de plateforme échoue THEN les mises à jour SHALL être désactivées par sécurité

### Requirement 4

**User Story:** En tant qu'utilisateur macOS, je veux être informé de la façon d'obtenir les mises à jour, afin de savoir comment maintenir l'application à jour manuellement.

#### Acceptance Criteria

1. WHEN l'utilisateur ouvre les paramètres sur macOS THEN un message informatif SHALL expliquer comment obtenir les mises à jour
2. WHEN le message s'affiche THEN il SHALL inclure un lien vers la page des releases GitHub
3. WHEN l'utilisateur clique sur le lien THEN il SHALL ouvrir la page GitHub dans le navigateur par défaut
4. WHEN le message s'affiche THEN il SHALL expliquer que les mises à jour automatiques ne sont pas disponibles sur macOS

### Requirement 5

**User Story:** En tant que développeur, je veux que les builds GitHub Actions pour macOS soient configurés pour désactiver les mises à jour, afin d'assurer la cohérence entre le build et le comportement de l'application.

#### Acceptance Criteria

1. WHEN le build macOS est généré via GitHub Actions THEN une variable d'environnement SHALL indiquer la désactivation des mises à jour
2. WHEN l'application macOS démarre THEN elle SHALL vérifier cette variable d'environnement
3. WHEN la variable indique la désactivation THEN tous les composants de mise à jour SHALL être désactivés
4. WHEN le build est fait localement pour développement THEN les mises à jour SHALL pouvoir être activées via une variable d'environnement de développement