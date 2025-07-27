# Requirements Document

## Introduction

Cette fonctionnalité vise à réorganiser l'ordre des colonnes dans l'export de données pour qu'elles correspondent à un ordre spécifique demandé par l'utilisateur. L'export doit présenter les colonnes dans un ordre logique et cohérent avec les besoins métier.

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur, je veux que les colonnes exportées soient dans un ordre spécifique, afin que les données soient organisées de manière logique et cohérente avec mes besoins métier.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur le bouton "Export" THEN le système SHALL exporter les colonnes dans l'ordre suivant : Date Rappel, Heure Rappel, Sexe, Prénom, Nom, Numéro, Mail, Source, Type, Qualité, Date Appel, Statut Appel, Commentaires Appel
2. WHEN l'export est généré THEN le système SHALL utiliser les noms de colonnes sans numérotation (ex: "Date Appel" au lieu de "Date Appel 1")
3. WHEN l'export est généré THEN le système SHALL inclure toutes les colonnes disponibles même si certaines sont vides
4. WHEN l'export est généré THEN le système SHALL maintenir la compatibilité avec les formats CSV et Excel existants

### Requirement 2

**User Story:** En tant qu'utilisateur, je veux que les colonnes manquantes dans les données actuelles soient ajoutées à l'export, afin d'avoir une structure complète même si certaines données ne sont pas encore renseignées.

#### Acceptance Criteria

1. WHEN l'export est généré THEN le système SHALL inclure les colonnes "Sexe", "Type", et "Qualité" même si elles ne sont pas présentes dans les données actuelles
2. WHEN une colonne n'existe pas dans les données THEN le système SHALL créer une colonne vide avec le nom approprié
3. WHEN l'export est généré THEN le système SHALL mapper correctement les colonnes existantes vers les nouveaux noms (ex: "École/Source" devient "Source")

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux que la fonction d'export soit rétrocompatible, afin que les imports précédents continuent de fonctionner correctement.

#### Acceptance Criteria

1. WHEN un fichier exporté avec le nouveau format est réimporté THEN le système SHALL pouvoir traiter correctement toutes les colonnes
2. WHEN l'import traite un fichier avec les nouveaux noms de colonnes THEN le système SHALL mapper correctement vers les propriétés internes des contacts
3. WHEN l'import traite un fichier avec les anciens noms de colonnes THEN le système SHALL continuer à fonctionner normalement