# Requirements Document - Alignement des fonctionnalités Appels 2

## Introduction

La nouvelle page "Appels 2" (AppelsCardsView) a été créée avec une interface en cartes moderne, mais elle manque plusieurs fonctionnalités essentielles présentes dans la page originale "Appels" (ContactTable). Ce document définit les exigences pour aligner les fonctionnalités de la nouvelle page avec l'ancienne, tout en conservant l'interface moderne en cartes.

L'objectif est d'assurer la parité des fonctionnalités entre les deux pages pour permettre aux utilisateurs de bénéficier de toutes les capacités existantes dans la nouvelle interface. Les fonctionnalités spécifiques aux tables (colonnes, pagination) ne sont pas incluses car non pertinentes pour l'interface en cartes.

## Requirements

### Requirement 1: Import de contacts avec mapping de colonnes

**User Story:** En tant qu'utilisateur, je veux pouvoir importer des fichiers de contacts avec une interface de correspondance des colonnes, afin de mapper correctement les données de mon fichier vers les champs de l'application.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur le bouton "Importer" THEN le système SHALL ouvrir un dialogue de sélection de fichier
2. WHEN l'utilisateur sélectionne un fichier Excel/CSV/TSV THEN le système SHALL analyser les en-têtes du fichier
3. WHEN les en-têtes sont analysés THEN le système SHALL afficher le composant ImportMappingDialog permettant de faire correspondre chaque colonne du fichier avec les champs de l'application
4. WHEN l'utilisateur valide le mapping THEN le système SHALL importer les contacts selon la correspondance définie
5. IF certaines colonnes ne correspondent pas automatiquement THEN le système SHALL permettre à l'utilisateur de les mapper manuellement via des dropdowns
6. WHEN l'import est terminé THEN le système SHALL afficher un toast de confirmation avec le nombre de contacts importés
7. WHEN l'import échoue THEN le système SHALL afficher un message d'erreur explicite

### Requirement 2: Recherche automatique avec dropdown dans la navbar

**User Story:** En tant qu'utilisateur, je veux avoir accès à un menu de recherche automatique avec des options LinkedIn, Google et lien direct dans la barre de navigation, afin de rechercher rapidement des informations sur mes contacts sans avoir à scroller jusqu'aux boutons d'action.

#### Acceptance Criteria

1. WHEN l'utilisateur est sur la page Appels 2 THEN le système SHALL afficher un dropdown de recherche automatique dans la barre de navigation supérieure (à côté des boutons Importer/Exporter)
2. WHEN l'utilisateur ouvre le dropdown THEN le système SHALL afficher les options: LinkedIn, Google, et Lien direct
3. WHEN l'utilisateur sélectionne une option de recherche THEN le système SHALL effectuer la recherche pour le contact actuellement sélectionné
4. WHEN l'utilisateur ouvre le dropdown THEN le système SHALL afficher une section "Mode automatique" avec des options radio pour: Désactivé, LinkedIn, Google, Lien
5. WHEN un mode automatique est sélectionné THEN le système SHALL automatiquement effectuer cette recherche lors de la sélection d'un nouveau contact
6. WHEN le lien direct est sélectionné mais qu'aucun contact n'est sélectionné ou que le contact n'a pas de lien THEN le système SHALL afficher l'option en grisé (disabled)
7. WHEN l'utilisateur change le mode automatique THEN le système SHALL sauvegarder ce choix dans le localStorage
8. WHEN la page se charge THEN le système SHALL restaurer le mode automatique sauvegardé

### Requirement 3: Filtrage rapide fonctionnel

**User Story:** En tant qu'utilisateur, je veux pouvoir filtrer rapidement mes contacts par critères prédéfinis, afin de trouver rapidement les prospects pertinents.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur le bouton de filtre dans la navbar THEN le système SHALL afficher un dropdown avec les options de filtrage rapide
2. WHEN l'utilisateur sélectionne "Tous les prospects" THEN le système SHALL afficher tous les contacts sans filtre
3. WHEN l'utilisateur sélectionne "À rappeler aujourd'hui" THEN le système SHALL afficher uniquement les contacts avec une dateRappel égale à la date du jour
4. WHEN l'utilisateur sélectionne "Avec RDV planifié" THEN le système SHALL afficher uniquement les contacts ayant une dateRDV définie
5. WHEN l'utilisateur sélectionne "Statut à vérifier" THEN le système SHALL afficher uniquement les contacts avec un statut "Non défini" ou vide
6. WHEN un filtre est appliqué THEN le système SHALL mettre à jour la liste des contacts affichés en temps réel
7. WHEN un filtre est appliqué THEN le système SHALL afficher un indicateur visuel sur le bouton de filtre

### Requirement 4: Commentaires rapides avec widget Zap

**User Story:** En tant qu'utilisateur, je veux pouvoir insérer rapidement des commentaires prédéfinis dans le champ Notes, afin de gagner du temps lors de la qualification des contacts.

#### Acceptance Criteria

1. WHEN l'utilisateur édite le champ "Notes" dans le panneau de détails THEN le système SHALL afficher une icône Zap à côté du champ
2. WHEN l'utilisateur clique sur l'icône Zap THEN le système SHALL afficher un Select avec la liste des commentaires rapides prédéfinis (depuis QUICK_COMMENTS)
3. WHEN l'utilisateur sélectionne un commentaire rapide THEN le système SHALL l'ajouter au contenu existant du champ Notes avec un espace de séparation
4. WHEN plusieurs commentaires rapides sont ajoutés THEN le système SHALL les concaténer avec des espaces
5. WHEN l'utilisateur modifie manuellement le commentaire THEN le système SHALL conserver les modifications
6. WHEN l'utilisateur sauvegarde THEN le système SHALL persister le commentaire complet

### Requirement 5: Boutons d'effacement pour les dates et heures

**User Story:** En tant qu'utilisateur, je veux pouvoir effacer facilement les dates et heures sélectionnées, afin de corriger rapidement mes erreurs de saisie.

#### Acceptance Criteria

1. WHEN une date de rappel est sélectionnée THEN le système SHALL afficher un bouton X à côté du champ
2. WHEN une heure de rappel est sélectionnée THEN le système SHALL afficher un bouton X à côté du champ
3. WHEN une date de RDV est sélectionnée THEN le système SHALL afficher un bouton X à côté du champ
4. WHEN une heure de RDV est sélectionnée THEN le système SHALL afficher un bouton X à côté du champ
5. WHEN l'utilisateur clique sur un bouton X THEN le système SHALL effacer la valeur du champ correspondant
6. WHEN une valeur est effacée THEN le système SHALL mettre à jour immédiatement le contact
7. WHEN aucune valeur n'est sélectionnée THEN le système SHALL masquer le bouton X

### Requirement 6: Drag & Drop pour l'import de fichiers

**User Story:** En tant qu'utilisateur, je veux pouvoir glisser-déposer des fichiers directement sur la page pour les importer, afin d'accélérer mon workflow.

#### Acceptance Criteria

1. WHEN l'utilisateur glisse un fichier au-dessus de la page Appels 2 THEN le système SHALL afficher une overlay de drop zone
2. WHEN l'overlay est affichée THEN le système SHALL indiquer visuellement que le drop est possible
3. WHEN l'utilisateur dépose un fichier .csv, .tsv, .xlsx ou .xls THEN le système SHALL déclencher le processus d'import avec mapping
4. WHEN l'utilisateur dépose un fichier d'un autre type THEN le système SHALL afficher un message d'erreur
5. WHEN l'utilisateur glisse le fichier en dehors de la zone THEN le système SHALL masquer l'overlay
6. WHEN le fichier est déposé THEN le système SHALL ouvrir le dialogue de mapping des colonnes

### Requirement 7: Indicateur de progression d'import

**User Story:** En tant qu'utilisateur, je veux voir la progression de l'import de mes fichiers, afin de savoir combien de temps il reste.

#### Acceptance Criteria

1. WHEN un import est en cours THEN le système SHALL afficher une barre de progression dans la navbar
2. WHEN la progression avance THEN le système SHALL mettre à jour le pourcentage affiché
3. WHEN l'import est terminé THEN le système SHALL masquer la barre de progression après 2 secondes
4. WHEN l'import échoue THEN le système SHALL afficher un message d'erreur et masquer la barre
5. WHEN l'import contient beaucoup de contacts THEN le système SHALL afficher un message indiquant le nombre de contacts traités

### Requirement 8: Sauvegarde automatique des modifications

**User Story:** En tant qu'utilisateur, je veux que mes modifications soient sauvegardées automatiquement, afin de ne pas perdre mes données.

#### Acceptance Criteria

1. WHEN l'utilisateur modifie un champ dans le panneau de détails THEN le système SHALL activer le bouton "Sauvegarder"
2. WHEN l'utilisateur clique sur "Sauvegarder" THEN le système SHALL persister toutes les modifications via onUpdateContact
3. WHEN la sauvegarde est en cours THEN le système SHALL afficher un indicateur de chargement sur le bouton
4. WHEN la sauvegarde réussit THEN le système SHALL afficher un toast de confirmation
5. WHEN la sauvegarde échoue THEN le système SHALL afficher un toast d'erreur
6. WHEN l'utilisateur change de contact sans sauvegarder THEN le système SHALL perdre les modifications non sauvegardées (comportement actuel à conserver)

### Requirement 9: Scroll automatique vers le contact sélectionné

**User Story:** En tant qu'utilisateur, je veux que la liste scroll automatiquement vers le contact que je sélectionne, afin de toujours voir le contact actif.

#### Acceptance Criteria

1. WHEN un contact est sélectionné programmatiquement THEN le système SHALL scroller automatiquement jusqu'à sa carte
2. WHEN le contact est déjà visible THEN le système SHALL ne pas scroller
3. WHEN le contact n'est pas encore chargé (au-delà des 40 premiers) THEN le système SHALL charger les contacts jusqu'à atteindre le contact cible
4. WHEN le scroll automatique se produit THEN le système SHALL utiliser un scroll smooth pour une meilleure UX
5. WHEN le contact est en haut ou en bas de la liste THEN le système SHALL le centrer dans la vue si possible
