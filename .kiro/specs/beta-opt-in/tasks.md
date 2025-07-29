# Implementation Plan

- [x] 1. Créer le service de gestion des préférences bêta


  - Implémenter `BetaPreferencesService` avec méthodes de sauvegarde/récupération des préférences
  - Ajouter la gestion du localStorage pour persister les préférences utilisateur
  - Inclure la validation et migration des données de préférences existantes
  - _Requirements: 4.1, 4.2, 4.4_



- [ ] 2. Étendre les types existants pour supporter les versions bêta
  - Modifier `UpdateInfo` dans `src/types/update.ts` pour inclure les champs `isBeta` et `isPrerelease`
  - Ajouter l'interface `BetaPreferences` avec les propriétés enabled, lastModified, hasBeenWarned
  - Étendre `UpdateState` pour inclure `betaPreferences`


  - Mettre à jour `UseAutoUpdateResult` avec les nouvelles méthodes bêta
  - _Requirements: 1.2, 4.1_

- [ ] 3. Créer le composant BetaOptInSettings
  - Développer le composant React avec checkbox pour activer/désactiver les versions bêta


  - Implémenter le dialog d'avertissement pour la première activation des versions bêta
  - Ajouter la logique de validation et confirmation des changements de préférences
  - Inclure le bouton "Revenir à la version stable" avec confirmation
  - _Requirements: 1.1, 3.3, 5.1, 5.4_

- [x] 4. Intégrer BetaOptInSettings dans SettingsDialog


  - Modifier `SettingsDialog` pour inclure la nouvelle section de paramètres bêta
  - Ajouter la section dans l'onglet approprié des paramètres de mise à jour
  - Connecter les callbacks et la gestion d'état avec le composant parent
  - _Requirements: 1.1_

- [ ] 5. Étendre le hook useAutoUpdate pour les versions bêta
  - Modifier `useAutoUpdate` pour gérer les préférences bêta dans l'état
  - Ajouter la méthode `setBetaPreferences` pour mettre à jour les préférences
  - Implémenter `revertToStable` pour revenir aux versions stables
  - Intégrer la logique de vérification des pre-releases selon les préférences


  - _Requirements: 1.2, 1.3, 5.1, 5.2_

- [ ] 6. Modifier la logique de vérification des mises à jour
  - Étendre la fonction `checkForUpdates` pour inclure les pre-releases GitHub si bêta activé
  - Ajouter la logique de filtrage des versions selon les préférences utilisateur


  - Implémenter la détection du type de version (stable/beta) dans les métadonnées
  - Modifier la gestion des erreurs pour les cas spécifiques aux versions bêta
  - _Requirements: 1.3, 5.2_

- [ ] 7. Créer le système d'indicateurs visuels pour les versions bêta
  - Ajouter un badge "BETA" dans le composant TitleBar pour les versions bêta
  - Modifier `UpdateConfirmationDialog` pour distinguer les mises à jour bêta des stables
  - Implémenter les styles visuels distinctifs pour les versions bêta
  - Ajouter les tooltips explicatifs pour les indicateurs bêta
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 8. Implémenter la gestion automatique des DevTools


  - Créer la logique de détection du type de version au démarrage de l'application
  - Ajouter les méthodes d'activation/désactivation automatique des DevTools selon le type de version
  - Étendre l'API Electron avec `enableDevTools`, `disableDevTools`, `isDevToolsEnabled`
  - Implémenter la gestion des transitions entre versions stable et bêta



  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 9. Ajouter la gestion des erreurs spécifiques aux versions bêta
  - Implémenter la gestion des erreurs de récupération des pre-releases avec fallback vers stable
  - Ajouter la gestion des préférences corrompues avec retour aux valeurs par défaut
  - Créer la logique de retry automatique pour les échecs de téléchargement bêta
  - Implémenter les notifications d'erreur spécifiques aux versions bêta
  - _Requirements: 4.4, 5.3_

- [ ] 10. Créer les tests unitaires pour le service de préférences bêta
  - Écrire les tests pour `BetaPreferencesService` couvrant sauvegarde/récupération
  - Tester la gestion des préférences corrompues et la migration des données
  - Créer les tests pour la validation des préférences et les cas d'erreur
  - _Requirements: 4.2, 4.4_

- [ ] 11. Créer les tests unitaires pour BetaOptInSettings
  - Tester le rendu du composant avec différents états de préférences
  - Vérifier l'affichage du dialog d'avertissement lors de la première activation
  - Tester les interactions utilisateur et les callbacks de changement de préférences
  - Valider l'affichage conditionnel du bouton "Revenir à la version stable"
  - _Requirements: 1.1, 3.3, 5.1_

- [ ] 12. Créer les tests d'intégration pour le système de mise à jour étendu
  - Tester la vérification des pre-releases quand les versions bêta sont activées
  - Vérifier que seules les releases stables sont vérifiées quand bêta désactivé
  - Tester l'activation/désactivation automatique des DevTools selon le type de version
  - Valider la persistance des préférences à travers les redémarrages d'application
  - _Requirements: 1.3, 2.1, 2.2, 4.2_

- [ ] 13. Implémenter la logique de retour aux versions stables
  - Créer la fonction pour télécharger et installer la dernière version stable
  - Ajouter la confirmation utilisateur avant le changement de canal de mise à jour
  - Implémenter la désactivation automatique des DevTools lors du retour au stable
  - Gérer la mise à jour des préférences et de l'état de l'application
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 14. Ajouter la validation et sécurité pour les versions bêta
  - Implémenter la vérification de l'origine GitHub officielle pour les pre-releases
  - Ajouter la validation de l'intégrité des téléchargements de versions bêta
  - Créer la sanitisation des données de préférences utilisateur
  - Implémenter les contrôles de sécurité pour l'activation des DevTools
  - _Requirements: 2.4_

- [ ] 15. Créer les tests end-to-end pour le workflow complet
  - Tester le processus complet d'opt-in pour les versions bêta depuis l'interface
  - Vérifier le workflow de retour aux versions stables avec confirmation
  - Tester la persistance des préférences et l'état des DevTools à travers les redémarrages
  - Valider l'affichage correct des indicateurs visuels selon le type de version
  - _Requirements: 1.1, 2.1, 3.1, 4.2, 5.1_