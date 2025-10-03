# Implementation Plan

- [x] 1. Ajuster la largeur du DialogContent


  - Modifier la classe `max-w-5xl` en `max-w-[90vw] lg:max-w-[1400px] w-full` dans le DialogContent
  - Vérifier que le dialogue s'affiche correctement sur différentes tailles d'écran
  - _Requirements: 1.1, 1.2, 1.3_



- [ ] 2. Réorganiser l'en-tête de la grille de mapping
  - Séparer l'en-tête en deux sections distinctes : titres des colonnes et badges/boutons
  - Créer une première ligne avec les titres "Colonne détectée" et "Associer à" avec `grid-cols-12 gap-4 p-3`


  - Créer une deuxième ligne avec les badges et boutons en utilisant `flex-wrap` pour la responsivité
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.2, 4.3_

- [x] 3. Optimiser les espacements de la grille


  - Augmenter `gap-2` à `gap-4` dans les lignes de la grille
  - Augmenter `p-2` à `p-3` dans les lignes de la grille
  - Augmenter `gap-1` à `gap-2` pour les icônes et texte dans les cellules


  - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.2, 5.3_

- [x] 4. Améliorer la zone de défilement



  - Modifier la hauteur de ScrollArea de `h-[320px]` à `h-[450px] max-h-[60vh]`
  - Vérifier que la barre de défilement apparaît correctement quand nécessaire
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 5. Optimiser les sélecteurs de champs
  - Modifier SelectTrigger de `h-8 text-xs` à `h-9 text-sm w-full max-w-md`
  - Vérifier que les sélecteurs sont bien dimensionnés et lisibles
  - _Requirements: 3.2, 5.2_

- [ ] 6. Améliorer la typographie
  - Changer les titres de colonnes de `text-xs` à `text-sm`
  - Changer les badges de `text-[10px]` à `text-xs`
  - Changer les textes des boutons de `text-[11px]` à `text-xs`
  - _Requirements: 2.1, 5.2_

- [ ]* 7. Tester visuellement sur différentes résolutions
  - Tester sur 1920x1080, 1366x768, et 1024x768
  - Vérifier qu'il n'y a pas de défilement horizontal
  - Vérifier que tous les éléments sont visibles et accessibles
  - Tester avec différents nombres de colonnes (5, 10, 15)
  - Tester avec des noms de colonnes longs
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3_

- [ ]* 8. Vérifier la fonctionnalité existante
  - Tester la sélection de mapping
  - Tester l'auto-détection
  - Tester la résolution de conflits
  - Tester la validation et l'import
  - _Requirements: All_
