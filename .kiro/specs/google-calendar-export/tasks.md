# Implementation Plan

- [x] 1. Créer les fonctions utilitaires de formatage pour Google Calendar


  - Implémenter `formatDateForGoogleCalendar` pour convertir YYYY-MM-DD vers MM/DD/YYYY
  - Implémenter `formatTimeForGoogleCalendar` pour convertir HH:mm vers HH:MM AM/PM
  - Implémenter `calculateEndTime` pour ajouter 30 minutes à l'heure de début
  - Implémenter `buildReminderDescription` pour construire la description de l'événement
  - Créer des tests unitaires pour chaque fonction utilitaire
  - _Requirements: 2.3, 2.4, 3.3, 3.5, 3.6_



- [ ] 2. Implémenter la fonction d'export Google Calendar CSV
  - Ajouter la fonction `exportGoogleCalendarCSV` dans `services/dataService.ts`
  - Implémenter le filtrage des contacts ayant des dates de rappel définies
  - Créer le mapping vers le format Google Calendar avec les colonnes requises
  - Gérer les événements "toute la journée" quand seule la date est définie
  - Implémenter la génération du fichier CSV avec encodage UTF-8 BOM


  - Ajouter la logique de téléchargement automatique avec nom de fichier horodaté
  - _Requirements: 2.1, 2.2, 2.5, 3.1, 3.2, 3.4, 4.4_

- [ ] 3. Créer les tests unitaires pour le service d'export
  - Tester le filtrage des contacts avec rappels vs sans rappels
  - Tester la génération correcte du format CSV Google Calendar
  - Tester la gestion des événements avec et sans heure définie


  - Tester la construction des descriptions d'événements
  - Tester la gestion des erreurs (aucun rappel, données invalides)
  - Tester le formatage des noms de fichiers avec horodatage
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_



- [ ] 4. Ajouter le compteur de rappels dans l'état de l'application
  - Créer la variable d'état `calendarRemindersCount` dans `App.tsx`
  - Implémenter la fonction de calcul des contacts avec rappels
  - Ajouter la logique de mise à jour automatique du compteur
  - Intégrer le calcul dans les hooks existants de gestion des contacts
  - _Requirements: 1.2, 1.4, 5.3_



- [ ] 5. Implémenter le handler d'export Google Calendar
  - Créer la fonction `handleGoogleCalendarExport` dans `App.tsx`
  - Implémenter la vérification préalable du nombre de rappels
  - Ajouter la gestion d'erreurs avec messages spécifiques
  - Intégrer les notifications de succès et d'erreur

  - Utiliser useCallback pour l'optimisation des performances
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 6. Créer le bouton Agenda dans l'interface utilisateur
  - Ajouter le bouton "Agenda" à côté du bouton "Contacts" existant dans `App.tsx`
  - Implémenter le style CSS identique au bouton "Contacts"


  - Ajouter l'icône de calendrier appropriée (CalendarIcon)
  - Implémenter la logique de désactivation quand aucun rappel n'est disponible
  - Ajouter le tooltip dynamique avec le nombre de rappels
  - _Requirements: 1.1, 1.2, 1.4, 5.1, 5.2, 5.5_

- [x] 7. Ajouter le badge de comptage au bouton Agenda


  - Implémenter l'affichage conditionnel du badge quand des rappels sont disponibles
  - Utiliser le même style que le badge du bouton "Contacts"
  - Mettre à jour dynamiquement le nombre affiché
  - Gérer l'affichage/masquage selon la disponibilité des rappels
  - _Requirements: 1.2, 5.3_




- [ ] 8. Créer les tests d'intégration pour l'interface utilisateur
  - Tester l'activation/désactivation du bouton selon la disponibilité des rappels
  - Tester la mise à jour du badge de comptage
  - Tester le déclenchement de l'export au clic
  - Tester l'affichage des notifications appropriées
  - Tester la cohérence visuelle avec le bouton "Contacts"
  - _Requirements: 1.1, 1.2, 1.4, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 9. Créer les tests end-to-end pour le flux complet
  - Tester l'export de rappels avec différents formats (avec/sans heure)
  - Tester l'export avec des contacts sans rappels
  - Tester la génération et le téléchargement du fichier CSV
  - Tester la compatibilité du fichier généré avec Google Calendar
  - Tester les scénarios d'erreur et la gestion des cas limites
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4_

- [ ] 10. Intégrer et tester la fonctionnalité complète
  - Vérifier que tous les composants fonctionnent ensemble
  - Tester l'import du fichier généré dans Google Calendar
  - Valider que les événements apparaissent correctement dans le calendrier
  - Effectuer des tests de régression pour s'assurer que les fonctionnalités existantes ne sont pas affectées
  - Documenter les cas d'usage et les limitations éventuelles
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5_