# Implementation Plan - Correction du Dialogue de Rappel

## Overview

Ce plan d'implémentation détaille les étapes pour corriger les problèmes d'interface utilisateur dans le dialogue "Programmer un rappel". Les tâches sont organisées de manière incrémentale pour permettre des tests à chaque étape.

## Tasks

- [x] 1. Ajouter le support du z-index au SingleDayPicker


  - Ajouter la prop `zIndex` optionnelle à l'interface `TProps` avec une valeur par défaut de 50
  - Appliquer le z-index au `PopoverContent` via la prop `className` en utilisant `cn()` pour combiner avec les classes existantes
  - Tester que le calendrier s'ouvre correctement avec le nouveau z-index
  - _Requirements: 2.1, 2.4_



- [ ] 2. Ajuster le z-index par défaut du TimePicker
  - Modifier la valeur par défaut de la prop `zIndex` de 250 à 20100 dans l'interface `TimePickerProps`
  - Vérifier que le z-index est correctement appliqué au `PopoverContent` via la classe `z-[${zIndex}]`


  - Tester que le TimePicker s'ouvre au-dessus du dialogue de rappel
  - _Requirements: 3.1, 3.2_

- [ ] 3. Ajouter le support du z-index au RelativeDateSelector
  - Ajouter la prop `zIndex` optionnelle à l'interface `RelativeDateSelectorProps` avec une valeur par défaut de 20100


  - Passer la prop `zIndex` au composant `SelectContent` via une classe CSS dynamique
  - Créer une classe Tailwind arbitraire pour le z-index: `z-[${zIndex}]`
  - Tester que le Select s'ouvre au-dessus du dialogue de rappel
  - _Requirements: 1.1, 1.2, 1.3, 1.4_



- [ ] 4. Mettre à jour le ReminderDialog pour utiliser les nouveaux z-index
  - Passer la prop `zIndex={20100}` au composant `SingleDayPicker`
  - Passer la prop `zIndex={20100}` au composant `TimePicker`
  - Passer la prop `zIndex={20100}` au composant `RelativeDateSelector`
  - Vérifier que tous les composants reçoivent bien la prop `container={dialogContentRef.current}`


  - _Requirements: 1.4, 2.4, 3.4_

- [ ] 5. Supprimer l'input date natif du ReminderDialog
  - Supprimer complètement l'élément `<Input type="date">` avec la classe `sr-only`
  - Supprimer les handlers `handleManualDateChange` qui ne sont plus nécessaires


  - Vérifier que le `SingleDayPicker` gère correctement la sélection de date sans l'input natif
  - Mettre à jour les tests si nécessaire pour refléter ce changement
  - _Requirements: 2.1, 2.2_

- [ ] 6. Vérifier et ajuster les styles du SingleDayPicker
  - S'assurer que le bouton du `SingleDayPicker` a un style cohérent avec les autres champs du formulaire


  - Vérifier que le placeholder "YYYY-MM-DD" est affiché correctement
  - Vérifier que la date sélectionnée est formatée correctement (format français)
  - Tester le comportement responsive sur mobile
  - _Requirements: 2.2, 2.3, 4.1, 4.5_

- [ ] 7. Vérifier l'accessibilité de tous les composants
  - Tester la navigation au clavier (Tab, Enter, Escape) dans le dialogue



  - Vérifier que tous les champs ont des labels ARIA appropriés
  - Vérifier que les erreurs sont annoncées aux lecteurs d'écran
  - Tester avec un lecteur d'écran (NVDA ou JAWS)
  - Vérifier le contraste des couleurs avec les outils DevTools
  - _Requirements: 4.2, 4.3_

- [ ] 8. Tester l'intégration complète du dialogue
  - Ouvrir le dialogue de rappel depuis la table de contacts
  - Tester la sélection de date via le calendrier shadcn
  - Tester la sélection d'heure via le TimePicker
  - Tester la sélection rapide via le RelativeDateSelector
  - Vérifier que tous les dropdowns s'ouvrent au-dessus du dialogue
  - Vérifier que la sauvegarde fonctionne correctement
  - _Requirements: 1.1, 2.2, 3.1, 4.1_

- [ ] 9. Vérifier le comportement responsive
  - Tester le dialogue sur mobile (viewport < 640px)
  - Vérifier que les dropdowns sont accessibles sur petit écran
  - Vérifier que le calendrier s'adapte correctement
  - Vérifier que les boutons sont facilement cliquables (touch-manipulation)
  - _Requirements: 4.5_

- [ ]* 10. Ajouter des tests unitaires pour les modifications
  - Écrire des tests pour vérifier que le z-index est appliqué au SingleDayPicker
  - Écrire des tests pour vérifier que le z-index est appliqué au TimePicker
  - Écrire des tests pour vérifier que le z-index est appliqué au RelativeDateSelector
  - Écrire des tests pour vérifier que l'input date natif n'est plus présent dans le DOM
  - _Requirements: 1.1, 2.1, 3.1_

- [ ]* 11. Mettre à jour la documentation
  - Documenter les nouvelles props `zIndex` dans les composants
  - Ajouter des exemples d'utilisation dans les commentaires JSDoc
  - Mettre à jour le README si nécessaire
  - _Requirements: 4.1_

## Notes

- Les tâches marquées avec `*` sont optionnelles mais recommandées
- Chaque tâche doit être testée individuellement avant de passer à la suivante
- Les tests d'accessibilité (tâche 7) sont critiques et ne doivent pas être ignorés
- Le comportement responsive (tâche 9) doit être vérifié sur de vrais appareils mobiles si possible
