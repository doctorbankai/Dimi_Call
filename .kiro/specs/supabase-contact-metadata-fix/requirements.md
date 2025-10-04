# Requirements Document

## Introduction

Actuellement, lors de la synchronisation des numéros de téléphone vers les tables Supabase `shared_phone_numbers` et `shared_blacklist_numbers`, les colonnes `prenom`, `nom` et `source` restent vides (NULL). Ces informations sont pourtant collectées dans le code mais ne sont pas incluses dans le payload envoyé à Supabase. Cette fonctionnalité doit être corrigée pour que les métadonnées des contacts soient correctement synchronisées avec la base de données partagée.

## Requirements

### Requirement 1: Synchronisation complète des métadonnées vers shared_phone_numbers

**User Story:** En tant qu'utilisateur de l'application, je veux que les informations de prénom, nom et source soient synchronisées avec la table `shared_phone_numbers`, afin que les contacts partagés contiennent toutes les métadonnées disponibles.

#### Acceptance Criteria

1. WHEN la synchronisation vers `shared_phone_numbers` est déclenchée THEN le système SHALL inclure les champs `prenom`, `nom` et `source` dans le payload d'upsert
2. WHEN plusieurs événements existent pour le même numéro normalisé THEN le système SHALL utiliser les métadonnées de l'événement avec le statut de priorité la plus élevée
3. WHEN un champ `prenom`, `nom` ou `source` est vide ou null dans les données sources THEN le système SHALL envoyer NULL pour ce champ à Supabase
4. WHEN la synchronisation est réussie THEN les colonnes `prenom`, `nom` et `source` dans `shared_phone_numbers` SHALL contenir les valeurs appropriées

### Requirement 2: Synchronisation complète des métadonnées vers shared_blacklist_numbers

**User Story:** En tant qu'utilisateur de l'application, je veux que les informations de prénom, nom et source soient synchronisées avec la table `shared_blacklist_numbers`, afin que les numéros en liste noire contiennent toutes les métadonnées disponibles.

#### Acceptance Criteria

1. WHEN la synchronisation vers `shared_blacklist_numbers` est déclenchée THEN le système SHALL inclure les champs `prenom`, `nom` et `source` dans le payload d'upsert
2. WHEN plusieurs événements de liste noire existent pour le même numéro THEN le système SHALL utiliser les métadonnées de l'événement le plus récent ou avec le commentaire le plus détaillé
3. WHEN un champ `prenom`, `nom` ou `source` est vide ou null dans les données sources THEN le système SHALL envoyer NULL pour ce champ à Supabase
4. WHEN la synchronisation est réussie THEN les colonnes `prenom`, `nom` et `source` dans `shared_blacklist_numbers` SHALL contenir les valeurs appropriées

### Requirement 3: Extraction correcte de la source depuis les événements locaux

**User Story:** En tant que développeur, je veux que le champ `source` soit correctement extrait depuis les événements de la base locale, afin que cette information soit disponible pour la synchronisation.

#### Acceptance Criteria

1. WHEN un événement local est traité THEN le système SHALL extraire le champ `source` en utilisant les clés possibles ['source', 'origine', 'provenance']
2. WHEN le champ `source` n'est pas trouvé THEN le système SHALL utiliser une valeur par défaut appropriée (ex: 'Données')
3. WHEN le champ `source` est extrait THEN il SHALL être stocké dans l'objet `sample` de l'agrégation

### Requirement 4: Validation des données synchronisées

**User Story:** En tant qu'utilisateur, je veux pouvoir vérifier que les métadonnées ont été correctement synchronisées, afin de m'assurer de l'intégrité des données partagées.

#### Acceptance Criteria

1. WHEN la synchronisation est terminée THEN les logs SHALL indiquer le nombre de contacts avec métadonnées complètes vs partielles
2. WHEN une erreur de synchronisation se produit THEN le système SHALL logger les détails de l'erreur incluant les champs manquants
3. WHEN l'utilisateur consulte les tables Supabase THEN les colonnes `prenom`, `nom` et `source` SHALL contenir des valeurs non-NULL pour les contacts synchronisés
