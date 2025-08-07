# Implementation Plan

- [x] 1. Modifier la fonction d'export Google Contacts pour inclure le statut A0


  - Mettre à jour le filtre dans `exportGoogleContactsCSV` pour inclure `ContactStatus.A0`
  - Tester que la fonction filtre correctement les contacts avec le statut A0
  - _Requirements: 1.1, 1.2_



- [ ] 2. Mettre à jour le calcul du compteur Google Contacts dans l'interface
  - Modifier le `useMemo` pour `googleContactsCount` dans `src/App.tsx` pour inclure le statut A0


  - Vérifier que le badge affiche le bon nombre incluant les contacts A0
  - _Requirements: 1.3, 3.1_



- [ ] 3. Mettre à jour le tooltip du bouton Google Contacts
  - Modifier le texte du `title` pour mentionner le statut A0 dans les statuts exportables
  - Mettre à jour le message d'aide quand aucun contact n'est éligible
  - _Requirements: 1.4, 3.2_



- [ ] 4. Créer des tests unitaires pour la fonction d'export modifiée
  - Écrire des tests pour vérifier que les contacts A0 sont inclus dans l'export
  - Tester le mélange de contacts avec différents statuts incluant A0


  - Tester le cas où seuls des contacts A0 existent
  - _Requirements: 1.1, 1.2_




- [ ] 5. Créer des tests d'intégration pour l'interface utilisateur
  - Tester que le compteur du badge inclut les contacts A0
  - Tester l'activation du bouton quand il y a des contacts A0
  - Tester le tooltip avec des contacts A0
  - _Requirements: 1.3, 1.4, 3.1, 3.2_

- [ ] 6. Mettre à jour les tests existants pour inclure le statut A0
  - Réviser les tests existants de `exportGoogleContactsCSV` pour inclure des cas avec A0
  - Mettre à jour les tests d'intégration existants pour couvrir le nouveau statut
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 7. Tester la fonctionnalité complète end-to-end
  - Créer des contacts avec le statut A0
  - Vérifier que le bouton est activé et affiche le bon compteur
  - Effectuer l'export et vérifier que les contacts A0 sont inclus dans le fichier CSV
  - Vérifier que les notifications affichent le bon nombre de contacts exportés
  - _Requirements: 2.1, 2.2, 2.3_