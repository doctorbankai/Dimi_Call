# Requirements Document

## Introduction

Cette fonctionnalité vise à améliorer la compatibilité des recherches LinkedIn en normalisant les noms et prénoms contenant des accents uniquement lors de la génération des URLs. Actuellement, lorsque des contacts ont des accents dans leurs noms ou prénoms, les URLs générées pour LinkedIn peuvent ne pas être optimales pour la recherche. Cette amélioration permettra de générer des URLs LinkedIn plus efficaces en supprimant temporairement les accents des noms et prénoms uniquement au moment de construire l'URL de recherche, sans modifier les données stockées dans la table.

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur de l'application, je veux que les recherches LinkedIn fonctionnent correctement même quand les contacts ont des accents dans leurs noms ou prénoms, afin d'obtenir de meilleurs résultats de recherche.

#### Acceptance Criteria

1. WHEN un utilisateur clique sur le bouton LinkedIn pour un contact avec des accents dans le nom THEN le système SHALL supprimer temporairement les accents uniquement pour générer l'URL LinkedIn
2. WHEN un utilisateur clique sur le bouton LinkedIn pour un contact avec des accents dans le prénom THEN le système SHALL supprimer temporairement les accents uniquement pour générer l'URL LinkedIn
3. WHEN un utilisateur utilise la recherche automatique LinkedIn avec un contact contenant des accents THEN le système SHALL supprimer temporairement les accents uniquement pour générer l'URL LinkedIn
4. WHEN le système supprime temporairement les accents THEN il SHALL préserver la casse originale des caractères non-accentués
5. WHEN le système supprime temporairement les accents THEN il SHALL convertir correctement les caractères accentués français courants (é, è, ê, ë, à, â, ä, ù, û, ü, ô, ö, î, ï, ç, ÿ, etc.)
6. WHEN le système génère l'URL LinkedIn THEN les données originales dans la table SHALL rester inchangées avec leurs accents

### Requirement 2

**User Story:** En tant que développeur, je veux une fonction utilitaire réutilisable pour supprimer les accents, afin de pouvoir l'utiliser dans d'autres parties de l'application si nécessaire.

#### Acceptance Criteria

1. WHEN une fonction de suppression d'accents est créée THEN elle SHALL être exportée depuis le module utils
2. WHEN la fonction reçoit une chaîne avec des accents THEN elle SHALL retourner la même chaîne sans accents
3. WHEN la fonction reçoit une chaîne vide ou null THEN elle SHALL retourner une chaîne vide
4. WHEN la fonction reçoit une chaîne sans accents THEN elle SHALL retourner la chaîne inchangée
5. WHEN la fonction traite des caractères spéciaux non-accentués THEN elle SHALL les préserver

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux que la modification soit transparente et n'affecte pas les autres fonctionnalités de recherche, afin de maintenir la cohérence de l'application.

#### Acceptance Criteria

1. WHEN la fonction searchLinkedIn est modifiée THEN elle SHALL continuer à fonctionner avec les mêmes paramètres d'entrée
2. WHEN la fonction searchGoogle est utilisée THEN elle SHALL continuer à fonctionner normalement sans modification
3. WHEN la fonction openDirectLink est utilisée THEN elle SHALL continuer à fonctionner normalement sans modification
4. WHEN les autres fonctionnalités de l'application utilisent les noms avec accents THEN elles SHALL continuer à afficher les accents normalement
5. WHEN l'utilisateur voit les contacts dans l'interface THEN les noms et prénoms SHALL toujours afficher les accents originaux
6. WHEN les données sont sauvegardées ou exportées THEN les accents originaux SHALL être préservés dans tous les formats