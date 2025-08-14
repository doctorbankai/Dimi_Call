# Requirements Document

## Introduction

Les utilisateurs ayant activé l'option pour recevoir les pre-releases GitHub dans les paramètres de l'application ne reçoivent pas la version v1.0.31 qui est marquée comme pre-release sur GitHub. Le système doit être diagnostiqué et corrigé pour s'assurer que les utilisateurs reçoivent bien les pre-releases quand cette option est activée.

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur ayant activé les pre-releases, je veux recevoir automatiquement les nouvelles versions pre-release publiées sur GitHub, afin de pouvoir tester les nouvelles fonctionnalités en avant-première.

#### Acceptance Criteria

1. WHEN un utilisateur active l'option "Recevoir les pre-releases GitHub" dans les paramètres THEN le système SHALL configurer autoUpdater.allowPrerelease = true
2. WHEN autoUpdater.allowPrerelease est true THEN le système SHALL détecter et proposer les releases marquées comme "prerelease: true" sur GitHub
3. WHEN une nouvelle pre-release est disponible (comme v1.0.31) THEN l'utilisateur SHALL recevoir une notification de mise à jour
4. WHEN l'utilisateur vérifie manuellement les mises à jour avec l'option pre-release activée THEN le système SHALL trouver la v1.0.31 au lieu de rester sur la v1.0.26

### Requirement 2

**User Story:** En tant que développeur, je veux pouvoir diagnostiquer pourquoi les pre-releases ne sont pas détectées, afin d'identifier et corriger le problème dans le système de mise à jour.

#### Acceptance Criteria

1. WHEN le système vérifie les mises à jour THEN il SHALL logger clairement si allowPrerelease est activé ou non
2. WHEN electron-updater fait une requête à GitHub THEN le système SHALL logger les paramètres de la requête
3. WHEN GitHub retourne des releases THEN le système SHALL logger quelles releases sont trouvées et lesquelles sont filtrées
4. IF aucune pre-release n'est détectée THEN le système SHALL logger la raison (configuration, filtrage, erreur API, etc.)

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux que le système de pre-release fonctionne de manière fiable, afin de ne pas manquer les nouvelles versions de test.

#### Acceptance Criteria

1. WHEN les préférences beta sont sauvegardées THEN elles SHALL persister correctement dans localStorage
2. WHEN l'application redémarre THEN les préférences beta SHALL être restaurées correctement
3. WHEN checkForUpdates est appelé THEN les préférences beta actuelles SHALL être utilisées
4. IF les préférences sont corrompues THEN le système SHALL utiliser les valeurs par défaut et logger l'erreur