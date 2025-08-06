# Requirements Document

## Introduction

Cette fonctionnalité vise à corriger définitivement le problème des DevTools en production. Actuellement, les utilisateurs peuvent cocher la case "Activer les outils de développement" dans les paramètres, sauvegarder, mais le raccourci Ctrl+Shift+I ne fonctionne pas en production car l'API nécessaire n'est pas implémentée côté Electron.

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur, je veux pouvoir activer les DevTools via les paramètres et utiliser Ctrl+Shift+I pour les ouvrir en production, afin de pouvoir déboguer l'application et reporter des bugs.

#### Acceptance Criteria

1. WHEN l'utilisateur coche la case "Activer les outils de développement" dans les paramètres THEN les DevTools doivent être activés côté Electron
2. WHEN l'utilisateur sauvegarde les paramètres avec DevTools activés THEN le raccourci Ctrl+Shift+I doit fonctionner pour ouvrir les DevTools
3. WHEN l'utilisateur décoche la case "Activer les outils de développement" THEN les DevTools doivent être désactivés côté Electron
4. WHEN les DevTools sont désactivés THEN le raccourci Ctrl+Shift+I ne doit plus fonctionner
5. WHEN l'application redémarre THEN l'état des DevTools doit être restauré selon les préférences sauvegardées

### Requirement 2

**User Story:** En tant qu'utilisateur, je veux que l'état des DevTools soit persistant entre les sessions, afin de ne pas avoir à réactiver les DevTools à chaque redémarrage.

#### Acceptance Criteria

1. WHEN l'utilisateur active les DevTools et redémarre l'application THEN les DevTools doivent rester activés
2. WHEN l'utilisateur désactive les DevTools et redémarre l'application THEN les DevTools doivent rester désactivés
3. WHEN l'application démarre pour la première fois THEN les DevTools doivent être désactivés par défaut

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux que l'activation des DevTools soit immédiate, afin de pouvoir les utiliser sans redémarrer l'application.

#### Acceptance Criteria

1. WHEN l'utilisateur active les DevTools via les paramètres THEN les DevTools doivent être immédiatement disponibles via Ctrl+Shift+I
2. WHEN l'utilisateur désactive les DevTools via les paramètres THEN le raccourci Ctrl+Shift+I doit immédiatement cesser de fonctionner
3. WHEN l'utilisateur active/désactive les DevTools THEN aucun redémarrage de l'application ne doit être nécessaire

### Requirement 4

**User Story:** En tant qu'utilisateur, je veux que les DevTools soient automatiquement activés quand j'active les versions bêta, afin d'avoir les outils de débogage disponibles pour reporter les bugs.

#### Acceptance Criteria

1. WHEN l'utilisateur active les versions bêta THEN les DevTools doivent être automatiquement activés
2. WHEN l'utilisateur désactive les versions bêta THEN les DevTools peuvent rester dans leur état actuel (pas de désactivation forcée)
3. WHEN les DevTools sont activés automatiquement via les versions bêta THEN l'interface utilisateur doit refléter cet état