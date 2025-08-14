# Design Document

## Overview

Cette fonctionnalité améliore la compatibilité des recherches LinkedIn en normalisant temporairement les accents dans les noms et prénoms uniquement lors de la génération des URLs. La solution consiste à créer une fonction utilitaire de suppression d'accents et à l'intégrer dans la fonction `searchLinkedIn` existante, sans affecter les données stockées ou l'affichage dans l'interface utilisateur.

## Architecture

La solution s'appuie sur l'architecture existante en modifiant uniquement le module `src/lib/utils.ts`. Aucune modification n'est nécessaire dans les composants React ou les services de données.

### Flux de données

```
Contact (avec accents) → searchLinkedIn() → removeAccents() → URL LinkedIn (sans accents) → Fenêtre LinkedIn
```

Les données originales restent intactes dans toute la chaîne, seule l'URL générée est normalisée.

## Components and Interfaces

### Nouvelle fonction utilitaire

```typescript
/**
 * Supprime les accents d'une chaîne de caractères
 * @param str - La chaîne à normaliser
 * @returns La chaîne sans accents
 */
export const removeAccents = (str: string): string
```

### Fonction modifiée

```typescript
/**
 * Génère une URL de recherche LinkedIn et l'ouvre dans la fenêtre dédiée
 * @param prenom - Prénom de la personne à rechercher (peut contenir des accents)
 * @param nom - Nom de la personne à rechercher (peut contenir des accents)
 */
export const searchLinkedIn = (prenom: string, nom: string): void
```

## Data Models

Aucune modification des modèles de données n'est nécessaire. Les types `Contact` existants restent inchangés :

```typescript
interface Contact {
  prenom: string; // Conserve les accents originaux
  nom: string;    // Conserve les accents originaux
  // ... autres propriétés
}
```

## Error Handling

### Gestion des cas limites

1. **Chaînes vides ou nulles** : La fonction `removeAccents` retournera une chaîne vide
2. **Caractères non-accentués** : Seront préservés tels quels
3. **Caractères spéciaux** : Seront préservés (espaces, tirets, apostrophes)
4. **Casse** : Sera préservée pour tous les caractères

### Stratégie de fallback

Si la normalisation échoue pour une raison quelconque, la fonction utilisera la chaîne originale pour maintenir la fonctionnalité existante.

## Testing Strategy

### Tests unitaires pour `removeAccents`

1. **Test des accents français courants**
   - Input: "José Müller" → Output: "Jose Muller"
   - Input: "François Cœur" → Output: "Francois Coeur"
   - Input: "Amélie Noël" → Output: "Amelie Noel"

2. **Test des cas limites**
   - Input: "" → Output: ""
   - Input: null/undefined → Output: ""
   - Input: "John Smith" → Output: "John Smith" (inchangé)

3. **Test de préservation de la casse**
   - Input: "JOSÉ" → Output: "JOSE"
   - Input: "josé" → Output: "jose"
   - Input: "José" → Output: "Jose"

### Tests d'intégration pour `searchLinkedIn`

1. **Test avec accents**
   - Vérifier que l'URL générée ne contient pas d'accents
   - Vérifier que la fenêtre LinkedIn s'ouvre correctement

2. **Test sans accents**
   - Vérifier que le comportement reste identique à l'existant

3. **Test de régression**
   - Vérifier que les autres fonctions (searchGoogle, openDirectLink) ne sont pas affectées

## Implementation Details

### Approche technique pour la suppression d'accents

Utilisation de la méthode JavaScript native `normalize()` avec `NFD` (Normalization Form Decomposed) suivie d'une expression régulière pour supprimer les diacritiques :

```typescript
export const removeAccents = (str: string): string => {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};
```

Cette approche :
- Décompose les caractères accentués en caractère de base + diacritique
- Supprime uniquement les diacritiques (plage Unicode \u0300-\u036f)
- Préserve tous les autres caractères (casse, espaces, ponctuation)
- Est compatible avec tous les accents européens

### Intégration dans searchLinkedIn

```typescript
export const searchLinkedIn = (prenom: string, nom: string): void => {
  // Normaliser les accents avant de créer la requête
  const normalizedPrenom = removeAccents(prenom);
  const normalizedNom = removeAccents(nom);
  
  const query = filterAndJoin(normalizedPrenom, normalizedNom);
  if (!query) {
    console.warn('Aucune valeur valide pour la recherche LinkedIn');
    return;
  }
  const url = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
  openLinkedInWindow(url);
};
```

### Points d'attention

1. **Performance** : La normalisation est très rapide et n'aura pas d'impact perceptible
2. **Compatibilité** : La méthode `normalize()` est supportée par tous les navigateurs modernes
3. **Maintenabilité** : La fonction `removeAccents` est réutilisable pour d'autres cas d'usage futurs
4. **Non-régression** : Aucune modification des interfaces existantes