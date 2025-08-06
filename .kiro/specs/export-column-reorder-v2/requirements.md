# Requirements Document

## Introduction

Cette fonctionnalité modifie l'ordre des colonnes lors de l'export des données via le bouton "Exporter". L'ordre actuel des colonnes doit être réorganisé selon un nouvel ordre spécifique, avec l'ajout de nouvelles colonnes vides (Sexe, Type, Qualité) qui n'existent pas actuellement dans la table.

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur, je veux que l'export des données respecte un nouvel ordre de colonnes spécifique, afin d'avoir une structure de données plus logique et organisée.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur le bouton "Exporter" THEN le système SHALL générer un fichier avec le nouvel ordre de colonnes
2. WHEN l'export est généré THEN les colonnes SHALL être dans l'ordre suivant : Date Rappel, Heure Rappel, Sexe, Prénom, Nom, Téléphone, Mail, École/Source, Type, Qualité, Lien, Date Appel, Heure Appel, Statut, Commentaire, puis toutes les autres colonnes restantes
3. WHEN l'export est effectué THEN l'ordre des colonnes SHALL être cohérent à chaque export
4. WHEN l'utilisateur ouvre le fichier exporté THEN les colonnes SHALL apparaître dans le bon ordre

### Requirement 2

**User Story:** En tant qu'utilisateur, je veux que de nouvelles colonnes vides soient ajoutées à l'export (Sexe, Type, Qualité), afin de pouvoir les remplir manuellement après l'export.

#### Acceptance Criteria

1. WHEN l'export est généré THEN le système SHALL inclure une colonne "Sexe" vide à la position 3
2. WHEN l'export est généré THEN le système SHALL inclure une colonne "Type" vide à la position 9
3. WHEN l'export est généré THEN le système SHALL inclure une colonne "Qualité" vide à la position 10
4. WHEN les nouvelles colonnes sont ajoutées THEN elles SHALL être complètement vides (pas de données par défaut)

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux que les colonnes existantes conservent leurs données lors de la réorganisation, afin de ne perdre aucune information.

#### Acceptance Criteria

1. WHEN l'ordre des colonnes change THEN toutes les données existantes SHALL être préservées
2. WHEN une colonne est déplacée THEN ses données SHALL suivre la colonne dans sa nouvelle position
3. WHEN l'export est généré THEN aucune donnée ne SHALL être perdue ou corrompue
4. WHEN l'utilisateur compare avant/après THEN seul l'ordre des colonnes SHALL avoir changé

### Requirement 4

**User Story:** En tant qu'utilisateur, je veux que les colonnes restantes (non spécifiées dans le nouvel ordre) apparaissent après les colonnes prioritaires, afin de conserver toutes les informations disponibles.

#### Acceptance Criteria

1. WHEN l'export inclut des colonnes non mentionnées dans le nouvel ordre THEN elles SHALL apparaître après les colonnes prioritaires
2. WHEN des colonnes supplémentaires existent THEN elles SHALL être incluses dans l'export
3. WHEN l'ordre des colonnes restantes n'est pas spécifié THEN elles SHALL apparaître dans leur ordre original
4. WHEN de nouvelles colonnes sont ajoutées à l'application THEN elles SHALL automatiquement apparaître à la fin de l'export

### Requirement 5

**User Story:** En tant qu'utilisateur, je veux que le changement d'ordre des colonnes soit rétrocompatible avec les imports existants, afin de ne pas casser les workflows existants.

#### Acceptance Criteria

1. WHEN un fichier avec l'ancien ordre de colonnes est importé THEN le système SHALL toujours fonctionner correctement
2. WHEN un fichier avec le nouvel ordre de colonnes est importé THEN le système SHALL reconnaître et traiter correctement les colonnes
3. WHEN les nouvelles colonnes vides (Sexe, Type, Qualité) contiennent des données dans un import THEN le système SHALL les ignorer gracieusement
4. WHEN l'utilisateur importe puis exporte THEN l'ordre de sortie SHALL respecter le nouvel ordre défini

## Ordre des colonnes

### Ordre actuel (à modifier)
1. Prénom
2. Nom  
3. Téléphone
4. Mail
5. École/Source
6. Statut
7. Commentaire
8. Date Rappel
9. Heure Rappel
10. Date RDV
11. Heure RDV
12. Date Appel
13. Heure Appel
14. Durée Appel
15. [Autres colonnes...]

### Nouvel ordre requis
1. Date Rappel
2. Heure Rappel
3. **Sexe** (nouvelle colonne vide)
4. Prénom
5. Nom
6. Téléphone
7. Mail
8. École/Source
9. **Type** (nouvelle colonne vide)
10. **Qualité** (nouvelle colonne vide)
11. Lien
12. Date Appel
13. Heure Appel
14. Statut
15. Commentaire
16. [Toutes les autres colonnes restantes dans leur ordre original]