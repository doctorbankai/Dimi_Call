# Implementation Plan

- [x] 1. Modifier la fonction exportContactsToFile pour réorganiser l'ordre des colonnes


  - Mettre à jour l'array `headers` avec le nouvel ordre spécifié
  - Modifier le mapping des données pour correspondre aux nouveaux headers
  - Renommer les colonnes selon les spécifications (Téléphone → Numéro, etc.)
  - _Requirements: 1.1, 1.2, 1.3_


- [ ] 2. Ajouter le support des colonnes manquantes dans l'export
  - Inclure les colonnes Sexe, Type, et Qualité dans l'export même si vides
  - Mapper correctement les champs optionnels du Contact vers les colonnes d'export
  - Gérer les valeurs undefined/null avec des chaînes vides par défaut


  - _Requirements: 2.1, 2.2_

- [ ] 3. Implémenter une détection flexible des noms de colonnes dans normalizeHeader
  - Créer un mapping exhaustif supportant de multiples variantes pour chaque colonne
  - Implémenter la normalisation des headers (suppression accents, espaces, minuscules)


  - Gérer les correspondances : "Numéro" → "telephone", "Statut Appel" → "statut", etc.
  - Maintenir tous les anciens mappings pour la rétrocompatibilité complète
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 4. Créer des tests unitaires pour valider la détection flexible
  - Tester la détection de multiples variantes de noms de colonnes
  - Vérifier que "Numéro", "Téléphone", "Phone", "Tel" mappent tous vers "telephone"
  - Tester la normalisation des accents et espaces dans les headers
  - Valider la rétrocompatibilité avec tous les formats existants





  - _Requirements: 1.1, 2.1, 3.1, 3.2, 3.3_

- [ ] 5. Créer une fonction utilitaire pour normaliser les headers
  - Implémenter une fonction qui supprime les accents, espaces, et convertit en minuscules
  - Gérer les caractères spéciaux et la ponctuation dans les noms de colonnes
  - Optimiser la performance de la détection avec une approche de fallback
  - _Requirements: 3.1, 3.2_

- [ ] 6. Tester le flux complet export/import avec détection flexible
  - Tester l'export en format CSV avec le nouvel ordre de colonnes
  - Tester l'export en format Excel avec le nouvel ordre de colonnes
  - Créer des fichiers de test avec différentes variantes de noms de colonnes
  - Vérifier que tous les formats sont correctement détectés et importés
  - _Requirements: 1.4, 3.1, 3.2, 3.3_