# Implementation Plan

- [x] 1. Installer les dépendances nécessaires


  - Installer @tanstack/react-virtual pour la virtualisation de la grille
  - Vérifier que tous les composants shadcn/ui nécessaires sont installés (Sheet, Tabs)
  - _Requirements: 6.1, 6.3_





- [ ] 2. Créer le composant ContactCard compact
  - [ ] 2.1 Créer le fichier src/components/contacts/ContactCard.tsx
    - Implémenter la structure de base avec Avatar, nom, téléphone, statut

    - Ajouter le badge de statut avec les couleurs appropriées
    - Afficher le prochain rappel si disponible
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [x] 2.2 Ajouter les effets hover et les animations

    - Implémenter l'effet d'élévation au survol
    - Ajouter les transitions smooth (duration-200)
    - Gérer l'état selected avec border primary
    - _Requirements: 3.1, 5.4_
  
  - [x] 2.3 Implémenter les actions rapides au hover

    - Créer la barre d'actions avec gradient background
    - Ajouter les boutons Appel, SMS, Email
    - Gérer l'opacité (hidden par défaut, visible au hover)
    - Empêcher la propagation du clic sur les actions




    - _Requirements: 3.3, 3.4_
  
  - [ ] 2.4 Ajouter la navigation clavier
    - Gérer les événements Enter et Space pour ouvrir le détail

    - Ajouter les ARIA labels appropriés
    - Gérer le focus visible
    - _Requirements: 3.5, 7.1, 7.2, 7.3_

- [x] 3. Créer le composant ContactCardsGrid

  - [ ] 3.1 Créer le fichier src/components/contacts/ContactCardsGrid.tsx
    - Implémenter la grille responsive avec Tailwind CSS
    - Définir les breakpoints (1/2/3/4 colonnes)
    - Ajouter le padding et gap appropriés
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  
  - [ ] 3.2 Intégrer la virtualisation avec @tanstack/react-virtual
    - Configurer le virtualizer avec estimateSize
    - Implémenter le rendu des items virtuels




    - Ajouter un buffer (overscan) de 5 items
    - _Requirements: 6.1, 6.3_
  
  - [ ] 3.3 Implémenter le lazy loading au scroll
    - Détecter le scroll proche de la fin


    - Charger progressivement plus de contacts (par batch de 40)
    - Afficher un loader pendant le chargement
    - _Requirements: 6.1_
  
  - [ ] 3.4 Gérer la sélection et le scroll vers l'élément sélectionné
    - Implémenter scrollIntoView pour l'élément sélectionné


    - Vérifier la visibilité avant de scroller
    - Ajouter un délai pour laisser le temps au rendu
    - _Requirements: 3.2_

- [ ] 4. Créer les sous-composants du Sheet de détails
  - [x] 4.1 Créer ContactHeader (src/components/contacts/ContactHeader.tsx)


    - Afficher l'avatar large (64px) avec initiales
    - Afficher le nom complet en titre
    - Afficher téléphone et email avec icônes
    - Afficher le badge de statut
    - _Requirements: 4.2_




  
  - [ ] 4.2 Créer ContactActions (src/components/contacts/ContactActions.tsx)
    - Implémenter les boutons d'action principaux (Appel, SMS, Email)
    - Ajouter les boutons secondaires (Rappel, RDV, Qualification)

    - Ajouter les boutons de recherche externe (LinkedIn, Google)
    - Utiliser les bonnes couleurs pour chaque bouton
    - Gérer l'état disabled pour les actions non disponibles
    - _Requirements: 4.5_
  
  - [x] 4.3 Créer ContactInfo (src/components/contacts/ContactInfo.tsx)

    - Créer la section "Informations principales" avec les champs en lecture seule
    - Créer la section "Rappels & Rendez-vous" avec les dates/heures
    - Créer la section "Notes" avec le textarea
    - Utiliser ScrollArea pour le contenu scrollable
    - Organiser les champs en grille responsive (2 colonnes sur desktop)
    - _Requirements: 4.2, 4.3_

  
  - [ ] 4.4 Créer ContactHistory (src/components/contacts/ContactHistory.tsx)
    - Afficher la liste des événements d'historique
    - Utiliser des Cards pour chaque événement




    - Afficher la date, le statut, le type, les métadonnées
    - Gérer le cas où il n'y a pas d'historique
    - Utiliser ScrollArea pour la liste scrollable
    - _Requirements: 4.4_


- [ ] 5. Créer le composant ContactDetailSheet principal
  - [ ] 5.1 Créer le fichier src/components/contacts/ContactDetailSheet.tsx
    - Utiliser le composant Sheet de shadcn/ui
    - Configurer side="right" et width responsive

    - Intégrer ContactHeader dans SheetHeader
    - _Requirements: 4.1, 4.7_
  
  - [ ] 5.2 Intégrer les Tabs pour Info/Historique
    - Créer les deux tabs "Informations" et "Historique"

    - Intégrer ContactInfo dans le premier tab
    - Intégrer ContactHistory dans le second tab
    - Ajouter ContactActions sous le header
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

  

  - [ ] 5.3 Gérer l'ouverture/fermeture du Sheet
    - Implémenter le handler onOpenChange
    - Gérer la fermeture avec Escape
    - Gérer la fermeture en cliquant en dehors
    - Restaurer le focus sur la card après fermeture

    - _Requirements: 4.7, 4.8, 7.5_
  
  - [ ] 5.4 Implémenter le focus trap et l'accessibilité
    - Déplacer le focus dans le Sheet à l'ouverture
    - Ajouter les ARIA labels (labelledby, describedby)

    - Gérer la navigation clavier dans le Sheet
    - _Requirements: 7.4, 7.5_

- [x] 6. Refactoriser AnnuaireCardsView pour utiliser les nouveaux composants


  - [x] 6.1 Remplacer l'ancien layout par ContactCardsGrid

    - Supprimer l'ancienne structure de grille
    - Intégrer ContactCardsGrid avec les props appropriées
    - Passer les handlers onSelectContact et onQuickAction
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 6.2 Remplacer le panneau de détails par ContactDetailSheet

    - Supprimer l'ancien panneau latéral fixe
    - Intégrer ContactDetailSheet avec open/onOpenChange
    - Passer le contact sélectionné et les handlers
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  
  - [x] 6.3 Implémenter les handlers pour les actions rapides

    - Créer handleQuickAction pour gérer call/sms/email
    - Ajouter les toasts de succès/erreur
    - Gérer les états de chargement
    - _Requirements: 3.4_
  
  - [x] 6.4 Optimiser les performances avec memoization

    - Utiliser React.memo pour ContactCard
    - Utiliser useMemo pour les calculs coûteux
    - Utiliser useCallback pour les handlers
    - _Requirements: 6.3_

- [x] 7. Ajouter les styles et animations

  - [ ] 7.1 Créer les animations CSS pour les cards
    - Ajouter les transitions pour hover (transform, shadow)
    - Ajouter les transitions pour les actions rapides (opacity)
    - Utiliser cubic-bezier pour des animations smooth
    - _Requirements: 2.6, 3.1, 5.4_
  

  - [ ] 7.2 Ajouter les animations pour le Sheet
    - Animation slideIn pour l'ouverture
    - Animation slideOut pour la fermeture
    - Transitions smooth pour les tabs
    - _Requirements: 5.4_
  

  - [ ] 7.3 Vérifier le support du dark mode
    - Tester tous les composants en dark mode
    - Ajuster les couleurs si nécessaire
    - Vérifier les contrastes
    - _Requirements: 5.5_

- [ ] 8. Tests et validation
  - [ ] 8.1 Écrire les tests unitaires pour ContactCard
    - Tester l'affichage des informations
    - Tester les hover effects
    - Tester les click handlers
    - Tester les actions rapides
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.3, 3.4_
  



  - [ ] 8.2 Écrire les tests unitaires pour ContactCardsGrid
    - Tester le layout responsive
    - Tester la virtualisation
    - Tester la sélection
    - Tester le lazy loading

    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.3_
  
  - [ ] 8.3 Écrire les tests unitaires pour ContactDetailSheet
    - Tester l'ouverture/fermeture
    - Tester la navigation entre tabs

    - Tester l'affichage des informations
    - Tester l'affichage de l'historique

    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  

  - [ ] 8.4 Écrire les tests d'intégration
    - Tester le flux complet (clic card → ouverture sheet)
    - Tester les actions rapides
    - Tester la synchronisation avec la grille
    - Tester la fermeture et restauration du focus
    - _Requirements: 3.2, 3.4, 7.5_
  
  - [ ] 8.5 Tests de performance
    - Tester avec 1000+ contacts
    - Vérifier le framerate à 60fps
    - Vérifier l'absence de memory leaks
    - Vérifier l'efficacité de la virtualisation
    - _Requirements: 6.1, 6.3_
  
  - [ ] 8.6 Tests visuels responsive
    - Tester sur mobile (320px - 767px)
    - Tester sur tablette (768px - 1023px)
    - Tester sur desktop (1024px - 1279px)
    - Tester sur large desktop (1280px+)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.2_
  
  - [ ] 8.7 Tests d'accessibilité
    - Tester la navigation clavier
    - Tester avec un screen reader
    - Vérifier les focus indicators
    - Vérifier les ARIA labels
    - Vérifier les contrastes de couleurs
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9. Cleanup et optimisation finale
  - [ ] 9.1 Supprimer l'ancien code non utilisé
    - Identifier les composants/fonctions obsolètes
    - Supprimer le code mort
    - Nettoyer les imports inutilisés
    - _Requirements: 6.1, 6.2_
  
  - [ ] 9.2 Optimiser les imports et le bundle size
    - Utiliser des imports nommés pour lucide-react
    - Vérifier qu'il n'y a pas de duplications
    - Analyser le bundle size
    - _Requirements: 6.3_
  
  - [ ] 9.3 Vérifier la compilation sans erreurs
    - Exécuter TypeScript compiler
    - Vérifier ESLint
    - Corriger tous les warnings
    - _Requirements: 6.5_
  
  - [ ] 9.4 Tester le build de production
    - Exécuter npm run build
    - Vérifier qu'il n'y a pas d'erreurs
    - Tester l'application buildée
    - _Requirements: 6.5_
