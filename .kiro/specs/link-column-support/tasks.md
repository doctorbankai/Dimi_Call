# Implementation Plan

- [x] 1. Étendre l'interface Contact pour supporter la colonne lien


  - Ajouter le champ optionnel `lien?: string` à l'interface Contact dans src/types.ts
  - Mettre à jour les types TypeScript pour assurer la compatibilité
  - _Requirements: 1.1, 1.2_




- [ ] 2. Créer les fonctions utilitaires pour la gestion des liens
  - [ ] 2.1 Implémenter la fonction de validation d'URL
    - Créer la fonction `isValidUrl(url: string): boolean` dans src/lib/utils.ts
    - Ajouter la gestion des URLs avec et sans protocole


    - Écrire les tests unitaires pour la validation d'URL
    - _Requirements: 1.3, 1.4_

  - [x] 2.2 Implémenter la fonction d'ouverture de lien direct

    - Créer la fonction `openDirectLink(url: string): void` dans src/lib/utils.ts


    - Implémenter la gestion de fenêtre dédiée similaire à LinkedIn/Google
    - Ajouter la gestion automatique du protocole https://
    - Écrire les tests unitaires pour l'ouverture de liens
    - _Requirements: 2.3, 4.3_



- [ ] 3. Étendre le système de recherche automatique
  - [ ] 3.1 Mettre à jour le type AutoSearchMode
    - Modifier le type pour inclure 'link' dans src/App.tsx

    - Mettre à jour la logique de sauvegarde/chargement du localStorage


    - Ajouter la validation du mode 'link' lors du chargement
    - _Requirements: 3.1, 3.2_

  - [ ] 3.2 Implémenter le handler pour les liens directs
    - Créer la fonction `handleDirectLink` dans src/App.tsx


    - Ajouter la logique de validation du contact et du lien
    - Intégrer les notifications de succès/erreur
    - Ajouter la gestion des cas d'erreur (contact sans lien, URL invalide)

    - _Requirements: 2.1, 2.3, 4.4_



- [ ] 4. Ajouter le bouton "Lien" dans l'interface
  - [ ] 4.1 Créer le bouton Lien dans la section des actions rapides
    - Ajouter le RibbonButton "Lien" avec l'icône ExternalLink dans src/App.tsx
    - Implémenter la logique d'activation/désactivation basée sur la présence du lien


    - Appliquer le même style que les boutons LinkedIn et Google existants
    - Ajouter les classes CSS appropriées (min-w-[80px] max-w-[80px] h-12)
    - _Requirements: 2.1, 2.2, 5.1, 5.3_




  - [ ] 4.2 Intégrer le bouton dans la logique de recherche automatique
    - Modifier la logique de recherche automatique pour supporter le mode 'link'
    - Ajouter la condition pour le mode 'link' dans la fonction de recherche automatique
    - Mettre à jour les notifications pour inclure "Ouverture automatique Lien"
    - _Requirements: 3.3, 3.4_



- [ ] 5. Ajouter l'option "Auto-Lien" dans le dropdown menu
  - [x] 5.1 Créer l'option de menu "Auto-Lien"

    - Ajouter le DropdownMenuItem "Auto-Lien" avec l'icône ExternalLink dans src/App.tsx


    - Implémenter le onClick pour définir le mode sur 'link'
    - Ajouter l'indicateur visuel "Actuel" quand le mode est sélectionné
    - Utiliser la couleur purple-500 pour l'icône pour la différenciation
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 5.2_



  - [ ] 5.2 Mettre à jour l'affichage du bouton dropdown principal
    - Modifier la logique d'affichage de l'icône pour inclure le mode 'link'
    - Mettre à jour le texte affiché pour "Auto-Lien" quand le mode est actif


    - Assurer la cohérence visuelle avec les autres modes


    - _Requirements: 4.3, 5.2, 5.3_

- [ ] 6. Étendre le système d'importation pour supporter la colonne lien
  - [x] 6.1 Ajouter la reconnaissance de la colonne "Lien"


    - Modifier le service d'importation pour reconnaître les colonnes lien/link/url/site/website
    - Ajouter la logique de mapping vers le champ `lien` du Contact
    - Implémenter la validation des URLs lors de l'importation
    - Ajouter les avertissements pour les URLs invalides sans bloquer l'importation
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 6.2 Mettre à jour l'interface d'importation
    - Ajouter "Lien" comme option dans la liste des colonnes disponibles
    - Mettre à jour l'interface de sélection des colonnes pour inclure le lien
    - Assurer que l'option "Lien" est visible et sélectionnable
    - _Requirements: 1.1, 1.2_

- [ ] 7. Ajouter les tests pour la fonctionnalité lien
  - [ ] 7.1 Créer les tests unitaires pour les fonctions utilitaires
    - Écrire les tests pour `isValidUrl` avec différents formats d'URL
    - Créer les tests pour `openDirectLink` avec mocking de window.open
    - Tester les cas d'erreur et la gestion des exceptions
    - _Requirements: 1.3, 2.3_

  - [ ] 7.2 Créer les tests d'intégration pour l'interface
    - Tester l'activation/désactivation du bouton Lien
    - Vérifier le comportement du dropdown avec l'option Auto-Lien
    - Tester la logique de recherche automatique en mode 'link'
    - Valider les notifications et messages d'erreur
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3_

- [ ] 8. Finaliser l'intégration et les tests end-to-end
  - [ ] 8.1 Tester le workflow complet d'importation avec liens
    - Créer un fichier de test avec des données incluant une colonne lien
    - Tester l'importation complète et la validation des URLs
    - Vérifier que les contacts avec liens sont correctement traités
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 8.2 Valider l'expérience utilisateur complète
    - Tester le basculement entre les différents modes de recherche automatique
    - Vérifier la cohérence visuelle avec les fonctionnalités existantes
    - Valider les tooltips et messages d'aide utilisateur
    - Tester les cas d'erreur et la robustesse de l'interface
    - _Requirements: 2.1, 2.2, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4_