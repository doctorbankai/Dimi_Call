# Requirements Document

## Introduction

Cette fonctionnalité ajoute le support d'une colonne "Lien" dans la table des contacts, permettant aux utilisateurs d'ouvrir directement des liens internet depuis l'interface. Cette option s'ajoute aux fonctionnalités existantes de recherche Google et LinkedIn, mais avec la particularité qu'elle utilise directement le lien fourni sans nécessiter de nom/prénom.

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur, je veux pouvoir ajouter une colonne "Lien" lors de l'importation de données, afin de pouvoir stocker et accéder directement à des liens internet pour chaque contact.

#### Acceptance Criteria

1. WHEN l'utilisateur importe des données THEN le système SHALL proposer "Lien" comme option de colonne disponible
2. WHEN l'utilisateur sélectionne la colonne "Lien" THEN le système SHALL mapper cette colonne aux données importées
3. WHEN des données sont importées avec une colonne "Lien" THEN le système SHALL valider que les valeurs sont des URLs valides
4. IF une URL n'est pas valide THEN le système SHALL afficher un avertissement mais permettre l'importation

### Requirement 2

**User Story:** En tant qu'utilisateur, je veux voir un bouton "Lien" dans l'interface des actions rapides, afin de pouvoir ouvrir directement le lien associé à un contact.

#### Acceptance Criteria

1. WHEN un contact possède une valeur dans la colonne "Lien" THEN le système SHALL afficher un bouton "Lien" actif dans les actions rapides
2. WHEN un contact ne possède pas de lien THEN le système SHALL afficher le bouton "Lien" désactivé
3. WHEN l'utilisateur clique sur le bouton "Lien" actif THEN le système SHALL ouvrir le lien dans le navigateur par défaut
4. WHEN l'utilisateur clique sur le bouton "Lien" actif THEN le système SHALL utiliser l'icône "external-link" ou similaire

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux avoir l'option "Auto-Lien" dans le menu déroulant de recherche automatique, afin de pouvoir configurer l'ouverture automatique des liens.

#### Acceptance Criteria

1. WHEN l'utilisateur ouvre le menu déroulant de recherche automatique THEN le système SHALL afficher l'option "Auto-Lien"
2. WHEN l'utilisateur sélectionne "Auto-Lien" THEN le système SHALL configurer cette option comme mode de recherche automatique actuel
3. WHEN le mode "Auto-Lien" est actif THEN le système SHALL utiliser directement la valeur de la colonne "Lien" sans traitement supplémentaire
4. WHEN le mode "Auto-Lien" est actif ET qu'un contact n'a pas de lien THEN le système SHALL désactiver l'action automatique pour ce contact

### Requirement 4

**User Story:** En tant qu'utilisateur, je veux que le système différencie clairement l'option "Lien" des autres options, afin de comprendre qu'elle ne nécessite pas de nom/prénom.

#### Acceptance Criteria

1. WHEN l'option "Lien" est affichée THEN le système SHALL utiliser une icône distinctive (external-link ou link)
2. WHEN l'utilisateur survole l'option "Lien" THEN le système SHALL afficher un tooltip explicatif
3. WHEN le mode "Auto-Lien" est sélectionné THEN le système SHALL indiquer visuellement qu'il utilise directement les liens
4. WHEN l'utilisateur configure le mode "Auto-Lien" THEN le système SHALL expliquer que cette option utilise directement les liens sans nom/prénom

### Requirement 5

**User Story:** En tant qu'utilisateur, je veux que la fonctionnalité "Lien" soit cohérente avec l'interface existante, afin d'avoir une expérience utilisateur uniforme.

#### Acceptance Criteria

1. WHEN le bouton "Lien" est affiché THEN le système SHALL utiliser le même style que les boutons LinkedIn et Google existants
2. WHEN l'option "Auto-Lien" est affichée dans le menu THEN le système SHALL suivre le même format que les autres options
3. WHEN l'utilisateur interagit avec les fonctionnalités "Lien" THEN le système SHALL maintenir les mêmes animations et transitions
4. WHEN des erreurs surviennent avec les liens THEN le système SHALL utiliser le même système de notification que les autres fonctionnalités