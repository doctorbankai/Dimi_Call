# Implementation Plan

- [x] 1. Ajouter l'état et les handlers pour la boîte de dialogue de confirmation


  - Ajouter l'état `isClearDataDialogOpen` dans App.tsx
  - Créer le handler `handleClearData` pour ouvrir la boîte de dialogue
  - Créer le handler `confirmClearData` pour exécuter la suppression
  - _Requirements: 1.2, 2.3, 2.4_


- [ ] 2. Implémenter la fonction de suppression des données
  - Créer la fonction `clearAllData` qui vide tous les états de l'application
  - Intégrer les appels aux services existants (saveContacts, saveCallStates, clearImportedTable)
  - Ajouter la gestion d'erreur avec try/catch
  - Inclure la notification de succès après suppression


  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 3. Ajouter le bouton Supprimer dans la section Données
  - Localiser la section des boutons ribbon dans App.tsx
  - Ajouter le nouveau bouton avec les mêmes classes CSS que les boutons existants


  - Intégrer l'icône Trash2 de Lucide React
  - Connecter le bouton au handler `handleClearData`
  - _Requirements: 1.1, 3.1, 3.2, 3.3, 3.4_

- [x] 4. Créer la boîte de dialogue de confirmation



  - Ajouter le composant Dialog avec DialogContent, DialogHeader, DialogTitle, DialogDescription
  - Implémenter les boutons "Annuler" et "Supprimer tout" dans DialogFooter
  - Connecter les boutons aux handlers appropriés
  - Utiliser la variante "destructive" pour le bouton de confirmation
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 5. Tester l'intégration complète
  - Vérifier que le bouton s'affiche correctement dans la section Données
  - Tester le flux complet : clic → confirmation → suppression → notification
  - Vérifier que l'annulation fonctionne correctement
  - Tester que toutes les données sont effectivement supprimées (contacts, états, localStorage)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3, 4.4, 4.5_