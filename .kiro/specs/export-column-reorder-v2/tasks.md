# Implementation Plan

- [x] 1. Créer la configuration centralisée de l'ordre des colonnes


  - Créer le fichier `src/config/exportColumnOrder.ts` avec l'interface ExportColumnConfig
  - Définir le tableau EXPORT_COLUMN_ORDER avec le nouvel ordre spécifié
  - Inclure les trois nouvelles colonnes virtuelles (Sexe, Type, Qualité) aux bonnes positions
  - Ajouter la validation de la configuration pour détecter les doublons
  - _Requirements: 1.2, 2.1, 2.2, 2.3_



- [ ] 2. Implémenter le service de réorganisation des colonnes
  - Créer le fichier `src/services/exportColumnService.ts` avec la classe ExportColumnService
  - Implémenter la méthode `reorderDataForExport` pour réorganiser les données
  - Implémenter la méthode `reorderRowForExport` pour traiter chaque ligne individuellement
  - Ajouter la méthode `addRemainingColumns` pour inclure les colonnes non configurées
  - _Requirements: 1.1, 3.1, 3.2, 4.1, 4.3_

- [ ] 3. Ajouter la gestion des colonnes virtuelles
  - Implémenter la logique pour ajouter les colonnes Sexe, Type, Qualité avec des valeurs vides
  - Créer la méthode `getExportColumnOrder` pour obtenir l'ordre final des colonnes
  - Ajouter la validation pour s'assurer que les colonnes virtuelles sont bien vides



  - Tester que les colonnes virtuelles apparaissent aux bonnes positions
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 4. Modifier le service d'export existant pour utiliser le nouvel ordre
  - Identifier et examiner le service d'export actuel (probablement dans dataService.ts)
  - Modifier la méthode d'export pour utiliser ExportColumnService.reorderDataForExport
  - Implémenter `generateCSVWithColumnOrder` pour respecter l'ordre spécifié
  - Ajouter la méthode `escapeCSVValue` pour gérer correctement les caractères spéciaux
  - _Requirements: 1.1, 1.2, 3.3_

- [ ] 5. Créer le service de compatibilité pour les imports
  - Créer le fichier `src/services/importCompatibilityService.ts`
  - Implémenter `detectImportFormat` pour identifier les formats ancien/nouveau
  - Créer `normalizeImportedData` pour traiter les données importées
  - Ajouter la logique pour ignorer les colonnes virtuelles lors des imports
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 6. Ajouter la gestion d'erreurs et la validation
  - Implémenter `validateColumnConfiguration` dans ExportColumnService
  - Ajouter la gestion d'erreurs dans les méthodes d'export
  - Créer un système de fallback vers l'ancien format en cas d'erreur
  - Ajouter des logs détaillés pour le débogage des problèmes d'export
  - _Requirements: 3.3, 4.2_

- [ ] 7. Créer les tests unitaires pour ExportColumnService
  - Tester `reorderDataForExport` avec différents jeux de données
  - Vérifier que les colonnes virtuelles sont ajoutées correctement
  - Tester que les données existantes sont préservées lors de la réorganisation
  - Valider que les colonnes restantes sont ajoutées à la fin
  - _Requirements: 3.1, 3.2, 4.1, 4.3_

- [ ] 8. Créer les tests unitaires pour ImportCompatibilityService
  - Tester la détection du format legacy avec des en-têtes d'ancien format
  - Tester la détection du nouveau format avec les colonnes Sexe, Type, Qualité
  - Vérifier la normalisation des données importées
  - Tester la gestion des colonnes virtuelles contenant des données
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 9. Créer les tests d'intégration pour l'export complet
  - Tester l'export avec le nouvel ordre de colonnes sur des données réelles
  - Vérifier que l'ordre des colonnes est respecté dans le fichier généré
  - Tester l'export avec des datasets vides et partiels
  - Valider que toutes les données sont préservées après réorganisation
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2_

- [ ] 10. Tester la rétrocompatibilité avec les imports existants
  - Créer des fichiers de test avec l'ancien format de colonnes
  - Vérifier que l'import fonctionne toujours avec les anciens fichiers
  - Tester l'import de fichiers avec le nouveau format
  - Valider que les colonnes virtuelles sont ignorées lors de l'import
  - _Requirements: 5.1, 5.2, 5.4_

- [ ] 11. Implémenter la validation de configuration au démarrage
  - Ajouter un appel à `validateColumnConfiguration` au démarrage de l'application
  - Créer des messages d'erreur clairs pour les problèmes de configuration
  - Ajouter des logs d'information sur la configuration des colonnes chargée
  - Implémenter un système d'alerte si la configuration est invalide
  - _Requirements: 1.4, 3.3_

- [ ] 12. Optimiser les performances pour les gros datasets
  - Analyser les performances de réorganisation sur de gros volumes de données
  - Optimiser la méthode `reorderDataForExport` pour réduire la complexité
  - Implémenter un système de traitement par batch si nécessaire
  - Ajouter des métriques de performance pour surveiller les temps d'export
  - _Requirements: 1.1, 3.3_

- [ ] 13. Créer la documentation et les exemples d'utilisation
  - Documenter la nouvelle configuration des colonnes d'export
  - Créer des exemples de fichiers exportés avec le nouveau format
  - Ajouter la documentation pour l'ajout de nouvelles colonnes
  - Créer un guide de migration pour les utilisateurs
  - _Requirements: 1.4, 4.4_

- [ ] 14. Effectuer les tests end-to-end du workflow complet
  - Tester le cycle complet : données → export → import → vérification
  - Valider que l'ordre des colonnes est maintenu dans tout le workflow
  - Tester avec différents types de données et formats
  - Vérifier la cohérence entre l'interface utilisateur et les fichiers exportés
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.4_

- [ ] 15. Déployer avec système de fallback et monitoring
  - Implémenter un système de fallback vers l'ancien format en cas de problème
  - Ajouter des métriques pour surveiller le succès des exports
  - Créer des alertes pour les échecs d'export
  - Tester le déploiement en environnement de staging avant la production
  - _Requirements: 3.3, 4.2_