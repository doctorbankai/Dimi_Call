# Implementation Plan

- [x] 1. Corriger la transmission des numéros à exclure dans ImportMappingDialog





  - Modifier le bouton "Importer" pour utiliser `removedPhones` au lieu de `supabaseMatchesSet`
  - Ajouter une condition pour vérifier que `filterMode === 'remove'` ET `removedPhones.length > 0`
  - Améliorer le logging pour afficher les détails de l'exclusion
  - _Requirements: 1.1, 1.2, 2.3, 2.4, 3.2_

- [ ]* 1.1 Tester manuellement le flux complet d'exclusion
  - Importer un fichier avec des numéros déjà dans Supabase
  - Vérifier que la détection fonctionne
  - Cliquer sur "Supprimer les lignes détectées"
  - Vérifier que l'aperçu est mis à jour
  - Cliquer sur "Importer"
  - Vérifier dans les logs que `options.phonesToRemove` contient les numéros
  - Vérifier que les lignes sont effectivement supprimées
  - Vérifier que la table finale ne contient pas ces contacts
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4_

- [ ]* 1.2 Tester le cas de réinitialisation
  - Importer un fichier avec des numéros déjà dans Supabase
  - Cliquer sur "Supprimer les lignes détectées"
  - Cliquer sur "Réinitialiser"
  - Cliquer sur "Importer"
  - Vérifier que TOUS les contacts sont importés (aucune exclusion)
  - _Requirements: 2.4, 3.2_

- [ ]* 1.3 Tester le mode "Voir uniquement"
  - Importer un fichier avec des numéros déjà dans Supabase
  - Cliquer sur "Voir uniquement les lignes détectées"
  - Cliquer sur "Importer"
  - Vérifier que TOUS les contacts sont importés (pas d'exclusion en mode isolate)
  - _Requirements: 2.4, 3.2_
