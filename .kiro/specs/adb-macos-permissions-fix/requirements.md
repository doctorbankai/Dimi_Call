# Requirements Document

## Introduction

L'application DimiCall utilise ADB (Android Debug Bridge) pour communiquer avec les smartphones Android. Actuellement, l'application fonctionne correctement sur Windows avec les fichiers .exe, mais les utilisateurs macOS (.dmg) rapportent que ADB ne fonctionne pas. Le problème identifié est que les binaires ADB sur macOS perdent leurs permissions d'exécution lors du processus de packaging avec Electron Builder, rendant les fichiers non exécutables.

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur macOS, je veux que l'application DimiCall puisse utiliser ADB pour communiquer avec mon smartphone Android, afin de pouvoir passer des appels et envoyer des SMS via l'application.

#### Acceptance Criteria

1. WHEN l'application DimiCall est installée sur macOS THEN les binaires ADB doivent avoir les permissions d'exécution appropriées
2. WHEN l'utilisateur tente d'utiliser les fonctionnalités ADB THEN l'application doit pouvoir exécuter les commandes ADB sans erreur de permissions
3. WHEN l'application démarre sur macOS THEN elle doit vérifier et corriger automatiquement les permissions des binaires ADB si nécessaire

### Requirement 2

**User Story:** En tant que développeur, je veux que le processus de build Electron Builder préserve ou restaure automatiquement les permissions d'exécution des binaires ADB sur macOS, afin d'éviter les problèmes de permissions en production.

#### Acceptance Criteria

1. WHEN Electron Builder copie les platform-tools vers le bundle macOS THEN les permissions d'exécution doivent être préservées ou restaurées
2. WHEN l'application est packagée pour macOS THEN tous les binaires dans le dossier platform-tools doivent être exécutables
3. IF les permissions ne peuvent pas être préservées pendant le build THEN l'application doit les corriger au démarrage

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux que l'application fonctionne de manière identique sur Windows et macOS, afin d'avoir une expérience utilisateur cohérente peu importe ma plateforme.

#### Acceptance Criteria

1. WHEN j'utilise les fonctionnalités ADB sur macOS THEN elles doivent fonctionner exactement comme sur Windows
2. WHEN l'application détecte des appareils Android THEN elle doit les lister correctement sur macOS comme sur Windows
3. WHEN j'initie un appel ou un SMS via ADB THEN la commande doit s'exécuter avec succès sur macOS

### Requirement 4

**User Story:** En tant que développeur, je veux avoir des logs détaillés et des messages d'erreur clairs pour diagnostiquer les problèmes ADB sur macOS, afin de pouvoir rapidement identifier et résoudre les problèmes.

#### Acceptance Criteria

1. WHEN l'application tente d'exécuter ADB THEN elle doit logger le chemin complet et les permissions du binaire
2. IF les permissions sont incorrectes THEN l'application doit logger une erreur explicite et tenter de les corriger
3. WHEN la correction des permissions échoue THEN l'application doit fournir des instructions claires à l'utilisateur