# Implementation Plan

- [x] 1. Créer la fonction utilitaire removeAccents


  - Implémenter la fonction removeAccents dans src/lib/utils.ts
  - Utiliser la méthode normalize('NFD') avec regex pour supprimer les diacritiques
  - Gérer les cas limites (chaînes vides, null, undefined)
  - Exporter la fonction pour réutilisation future
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_



- [ ] 2. Créer les tests unitaires pour removeAccents
  - Écrire des tests pour les accents français courants (é, è, ê, ë, à, â, ä, ù, û, ü, ô, ö, î, ï, ç, ÿ)
  - Tester la préservation de la casse (majuscules/minuscules)
  - Tester les cas limites (chaînes vides, null, undefined)
  - Tester les chaînes sans accents (doivent rester inchangées)


  - Tester la préservation des caractères spéciaux non-accentués
  - _Requirements: 1.4, 1.5, 2.2, 2.3, 2.4, 2.5_

- [ ] 3. Modifier la fonction searchLinkedIn pour utiliser removeAccents
  - Intégrer removeAccents dans la fonction searchLinkedIn existante


  - Normaliser le prénom et le nom avant de créer la requête de recherche
  - Préserver le comportement existant pour les autres paramètres
  - Maintenir la compatibilité avec les appels existants
  - _Requirements: 1.1, 1.2, 1.3, 1.6, 3.1_



- [ ] 4. Créer les tests d'intégration pour searchLinkedIn
  - Tester la génération d'URL LinkedIn avec des noms contenant des accents
  - Vérifier que les URLs générées ne contiennent pas d'accents
  - Tester le comportement avec des noms sans accents (régression)
  - Vérifier que la fonction continue à utiliser encodeURIComponent correctement



  - _Requirements: 1.1, 1.2, 1.3, 3.1_

- [ ] 5. Vérifier la non-régression des autres fonctions
  - Tester que searchGoogle fonctionne toujours normalement
  - Tester que openDirectLink fonctionne toujours normalement
  - Vérifier que filterAndJoin n'est pas affecté
  - Confirmer que les autres fonctions utilitaires restent intactes
  - _Requirements: 3.2, 3.3_

- [ ] 6. Tester l'intégration complète dans l'application
  - Tester le bouton LinkedIn manuel avec des contacts contenant des accents
  - Tester la recherche automatique LinkedIn avec des contacts contenant des accents
  - Vérifier que l'affichage des contacts dans l'interface conserve les accents originaux
  - Confirmer que les données en base ne sont pas modifiées
  - _Requirements: 1.1, 1.2, 1.3, 1.6, 3.4, 3.5, 3.6_