# Implementation Plan

- [x] 1. Créer un script de diagnostic pour tester l'API GitHub et la configuration actuelle


  - Créer un script qui teste l'API GitHub pour vérifier que v1.0.31 est bien une pre-release
  - Tester la configuration electron-updater actuelle avec allowPrerelease=true
  - Vérifier que les fichiers latest-mac.yml sont correctement générés
  - _Requirements: 2.2, 2.3_



- [ ] 2. Améliorer le logging de diagnostic dans le système de mise à jour
  - Ajouter des logs détaillés dans tous les événements autoUpdater (checking, available, not-available, error)
  - Logger l'état d'allowPrerelease à chaque vérification
  - Logger les informations de release reçues de GitHub (version, prerelease, releaseDate)


  - Ajouter des logs pour tracer le flux complet de vérification des mises à jour
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 3. Corriger la synchronisation des préférences beta au démarrage d'Electron


  - Modifier getBetaPreferences() pour lire depuis un fichier persistant au lieu de localStorage
  - Créer une méthode pour synchroniser les préférences entre localStorage (frontend) et fichier (backend)
  - S'assurer que les préférences sont correctement chargées avant la première vérification automatique
  - _Requirements: 3.1, 3.2_



- [ ] 4. Implémenter un mécanisme de cache-busting pour electron-updater
  - Modifier le handler check-for-updates pour forcer une nouvelle requête à GitHub
  - Utiliser setFeedURL() pour réinitialiser la configuration quand allowPrerelease change


  - Ajouter une option pour forcer la vérification sans cache
  - _Requirements: 1.1, 1.2_

- [ ] 5. Améliorer la gestion des préférences dans BetaPreferencesService
  - Ajouter une méthode syncWithElectron() pour synchroniser avec le backend


  - Implémenter une validation plus robuste des préférences corrompues
  - Ajouter des événements pour notifier les changements de préférences
  - _Requirements: 3.3, 3.4_




- [ ] 6. Créer des tests automatisés pour valider le système de pre-release
  - Test pour vérifier que allowPrerelease est correctement configuré selon les préférences
  - Test pour vérifier que les pre-releases sont détectées quand l'option est activée
  - Test pour vérifier que seules les releases stables sont détectées quand l'option est désactivée
  - Test de persistance des préférences après redémarrage
  - _Requirements: 1.3, 1.4, 3.1, 3.2_

- [ ] 7. Implémenter une interface de diagnostic dans l'application
  - Ajouter une section "Diagnostic" dans les paramètres pour afficher l'état du système
  - Afficher l'état actuel d'allowPrerelease, la dernière vérification, et les logs récents
  - Ajouter un bouton "Forcer la vérification" qui ignore le cache
  - _Requirements: 2.1, 2.4_

- [ ] 8. Tester et valider la correction avec la v1.0.31
  - Tester que les utilisateurs avec pre-releases activées reçoivent bien la v1.0.31
  - Vérifier que les utilisateurs sans pre-releases restent sur la v1.0.26
  - Tester le basculement entre modes stable et pre-release
  - Valider que les logs montrent clairement le comportement attendu
  - _Requirements: 1.1, 1.2, 1.3, 1.4_