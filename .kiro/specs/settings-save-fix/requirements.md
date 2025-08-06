# Requirements Document

## Introduction

Cette fonctionnalité corrige le problème de sauvegarde des paramètres des versions bêta et des outils de développement dans le SettingsDialog. Actuellement, lorsque les utilisateurs cochent les cases pour activer les versions bêta ou les DevTools et cliquent sur "Sauvegarder", les préférences ne sont pas persistées correctement.

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur, je veux que mes préférences de versions bêta soient sauvegardées quand je clique sur le bouton "Sauvegarder", afin que mes choix soient persistés.

#### Acceptance Criteria

1. WHEN l'utilisateur coche la case "Recevoir les versions bêta" THEN le système SHALL marquer les paramètres comme modifiés
2. WHEN l'utilisateur clique sur "Sauvegarder et Fermer" THEN le système SHALL persister les préférences bêta via BetaPreferencesService
3. WHEN l'utilisateur rouvre les paramètres THEN le système SHALL afficher l'état correct des préférences bêta
4. WHEN la sauvegarde échoue THEN le système SHALL afficher un message d'erreur approprié

### Requirement 2

**User Story:** En tant qu'utilisateur, je veux que mes préférences des outils de développement soient sauvegardées quand je clique sur le bouton "Sauvegarder", afin que l'état des DevTools soit persisté.

#### Acceptance Criteria

1. WHEN l'utilisateur coche la case "Activer les outils de développement" THEN le système SHALL marquer les paramètres comme modifiés
2. WHEN l'utilisateur clique sur "Sauvegarder et Fermer" THEN le système SHALL persister l'état des DevTools via DevToolsService
3. WHEN l'utilisateur rouvre les paramètres THEN le système SHALL afficher l'état correct des DevTools
4. WHEN la sauvegarde échoue THEN le système SHALL afficher un message d'erreur approprié

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux que le bouton "Sauvegarder" soit activé quand je modifie les paramètres bêta ou DevTools, afin de pouvoir sauvegarder mes changements.

#### Acceptance Criteria

1. WHEN l'utilisateur modifie les préférences bêta THEN le système SHALL activer le bouton "Sauvegarder"
2. WHEN l'utilisateur modifie les préférences DevTools THEN le système SHALL activer le bouton "Sauvegarder"
3. WHEN l'utilisateur sauvegarde THEN le système SHALL désactiver le bouton "Sauvegarder"
4. WHEN l'utilisateur réinitialise THEN le système SHALL restaurer les valeurs par défaut pour bêta et DevTools

### Requirement 4

**User Story:** En tant qu'utilisateur, je veux que la réinitialisation des paramètres restaure aussi les préférences bêta et DevTools, afin d'avoir un comportement cohérent.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur "Réinitialiser les changements" THEN le système SHALL restaurer les préférences bêta aux valeurs par défaut
2. WHEN l'utilisateur clique sur "Réinitialiser les changements" THEN le système SHALL restaurer les DevTools aux valeurs par défaut
3. WHEN la réinitialisation est effectuée THEN le système SHALL mettre à jour l'interface utilisateur avec les nouvelles valeurs
4. WHEN la réinitialisation est effectuée THEN le système SHALL marquer les paramètres comme modifiés

### Requirement 5

**User Story:** En tant qu'utilisateur, je veux que les changements de préférences bêta et DevTools soient immédiatement appliqués même sans sauvegarder, afin d'avoir un feedback immédiat.

#### Acceptance Criteria

1. WHEN l'utilisateur active les versions bêta THEN le système SHALL immédiatement appliquer le changement via BetaPreferencesService
2. WHEN l'utilisateur active les DevTools THEN le système SHALL immédiatement appliquer le changement via DevToolsService
3. WHEN l'utilisateur ferme les paramètres sans sauvegarder THEN le système SHALL conserver les changements déjà appliqués
4. WHEN l'utilisateur réinitialise THEN le système SHALL immédiatement annuler les changements appliqués