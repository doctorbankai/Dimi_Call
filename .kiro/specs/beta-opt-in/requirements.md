# Requirements Document

## Introduction

Cette fonctionnalité permet aux utilisateurs de DimiCall d'opter pour recevoir les versions bêta (pre-release) de l'application via GitHub releases. Lorsque cette option est activée, l'application active automatiquement les logs de débogage (Ctrl+Shift+I) pour faciliter l'analyse et le feedback des utilisateurs testeurs.

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur avancé, je veux pouvoir choisir de recevoir les versions bêta de l'application, afin de tester les nouvelles fonctionnalités avant leur sortie officielle.

#### Acceptance Criteria

1. WHEN l'utilisateur accède aux paramètres de mise à jour THEN le système SHALL afficher une option pour activer les versions bêta
2. WHEN l'utilisateur active l'option bêta THEN le système SHALL sauvegarder cette préférence localement
3. WHEN l'option bêta est activée THEN le système SHALL rechercher les pre-releases GitHub en plus des releases stables
4. WHEN l'utilisateur désactive l'option bêta THEN le système SHALL revenir aux releases stables uniquement

### Requirement 2

**User Story:** En tant qu'utilisateur testeur de versions bêta, je veux que les outils de débogage soient automatiquement disponibles, afin de pouvoir analyser et reporter les problèmes efficacement.

#### Acceptance Criteria

1. WHEN l'utilisateur utilise une version bêta THEN le système SHALL activer automatiquement les DevTools (Ctrl+Shift+I)
2. WHEN l'utilisateur utilise une version stable THEN le système SHALL maintenir les DevTools désactivés par défaut
3. WHEN l'utilisateur passe d'une version bêta à stable THEN le système SHALL désactiver automatiquement les DevTools
4. WHEN les DevTools sont activés pour les bêta THEN le système SHALL afficher un indicateur visuel dans l'interface

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux être informé clairement quand j'utilise une version bêta, afin de comprendre que cette version peut contenir des bugs.

#### Acceptance Criteria

1. WHEN l'utilisateur utilise une version bêta THEN le système SHALL afficher un badge "BETA" dans la barre de titre
2. WHEN une mise à jour bêta est disponible THEN le système SHALL indiquer clairement qu'il s'agit d'une version bêta
3. WHEN l'utilisateur active l'option bêta THEN le système SHALL afficher un avertissement sur la nature expérimentale des versions bêta
4. WHEN l'utilisateur consulte les informations de version THEN le système SHALL distinguer clairement les versions bêta des versions stables

### Requirement 4

**User Story:** En tant qu'utilisateur, je veux que mes préférences de versions bêta soient persistantes, afin de ne pas avoir à les reconfigurer à chaque redémarrage.

#### Acceptance Criteria

1. WHEN l'utilisateur active/désactive l'option bêta THEN le système SHALL sauvegarder cette préférence dans le stockage local
2. WHEN l'application redémarre THEN le système SHALL restaurer les préférences de versions bêta
3. WHEN l'utilisateur réinstalle l'application THEN le système SHALL permettre de reconfigurer facilement les préférences bêta
4. IF les préférences sont corrompues THEN le système SHALL revenir aux paramètres par défaut (versions stables)

### Requirement 5

**User Story:** En tant qu'utilisateur, je veux pouvoir facilement revenir aux versions stables, afin de retrouver une expérience stable si les versions bêta posent problème.

#### Acceptance Criteria

1. WHEN l'utilisateur désactive l'option bêta THEN le système SHALL proposer de revenir à la dernière version stable
2. WHEN l'utilisateur confirme le retour à la version stable THEN le système SHALL télécharger et installer la dernière version stable
3. WHEN le retour à la version stable est effectué THEN le système SHALL désactiver automatiquement les DevTools
4. WHEN l'utilisateur change de canal (bêta/stable) THEN le système SHALL afficher une confirmation avant d'appliquer le changement