# Design Document

## Overview

Cette fonctionnalité améliore la fonction `formatPhoneNumber` existante dans `src/services/dataService.ts` pour gérer correctement tous les formats de numéros de téléphone français problématiques identifiés. L'approche consiste à étendre la logique de formatage actuelle avec des règles supplémentaires pour traiter les cas edge spécifiques tout en maintenant la compatibilité avec les formats déjà supportés.

## Architecture

### Composants Impactés

1. **src/services/dataService.ts** - Fonction `formatPhoneNumber` principale
2. **src/components/ContactTable.tsx** - Affichage des numéros formatés
3. **Tests unitaires** - Validation des nouveaux cas de formatage

### Flux de Traitement

```
Numéro d'entrée → Nettoyage → Détection du format → Application des règles → Formatage final
```

## Components and Interfaces

### Enhanced formatPhoneNumber Function

```typescript
export const formatPhoneNumber = (phoneStr: string): string => {
  // 1. Validation d'entrée
  // 2. Nettoyage des caractères non numériques
  // 3. Normalisation des préfixes
  // 4. Détection et correction des formats problématiques
  // 5. Application du formatage standard français
  // 6. Gestion des cas edge et fallback
}
```

### Nouvelles Règles de Formatage

#### 1. Gestion des Numéros Tronqués
- **Problème**: Numéros comme '061410014' (9 chiffres au lieu de 10)
- **Solution**: Détecter les numéros de 9 chiffres commençant par 06/07 et les traiter comme des mobiles tronqués
- **Formatage**: Ajouter le préfixe +33 et formater avec le dernier chiffre isolé

#### 2. Correction des Préfixes +033
- **Problème**: Numéros comme '+033610291377' (033 au lieu de 33)
- **Solution**: Détecter le pattern +033 et le remplacer par +33
- **Formatage**: Appliquer le formatage standard après correction

#### 3. Gestion des Numéros avec Chiffres Supplémentaires
- **Problème**: Numéros comme '06551215174' (11 chiffres au lieu de 10)
- **Solution**: Détecter les numéros de 11 chiffres et tronquer le dernier chiffre
- **Formatage**: Appliquer le formatage standard sur les 10 premiers chiffres

#### 4. Normalisation des Préfixes + Malformés
- **Problème**: Numéros comme '+06028208067' (+ suivi directement de 0)
- **Solution**: Détecter le pattern +0 et le traiter comme un numéro français standard
- **Formatage**: Remplacer +0 par +33 et formater normalement

## Data Models

### Input Patterns à Gérer

```typescript
interface PhoneNumberPattern {
  pattern: RegExp;
  handler: (match: RegExpMatchArray) => string;
  description: string;
}

const PHONE_PATTERNS: PhoneNumberPattern[] = [
  // Numéros tronqués (9 chiffres)
  {
    pattern: /^0([67]\d{7})$/,
    handler: (match) => formatTruncatedMobile(match[1]),
    description: "Mobile tronqué commençant par 06/07"
  },
  
  // Préfixe +033 malformé
  {
    pattern: /^\+033(\d{9})$/,
    handler: (match) => formatStandardFrench(match[1]),
    description: "Préfixe +033 au lieu de +33"
  },
  
  // Numéros avec chiffre supplémentaire
  {
    pattern: /^0([67]\d{9})$/,
    handler: (match) => formatStandardFrench(match[1].slice(0, 9)),
    description: "Mobile avec chiffre supplémentaire"
  },
  
  // Préfixe + malformé
  {
    pattern: /^\+0([67]\d{8})$/,
    handler: (match) => formatStandardFrench(match[1]),
    description: "Préfixe +0 au lieu de +33"
  }
];
```

## Error Handling

### Stratégie de Gestion d'Erreurs

1. **Validation d'Entrée**
   - Vérifier que l'entrée n'est pas null/undefined
   - Retourner une chaîne vide pour les entrées invalides

2. **Fallback Gracieux**
   - Si aucun pattern ne correspond, retourner le numéro original
   - Éviter les exceptions pour maintenir la stabilité de l'interface

3. **Logging (Optionnel)**
   - Logger les formats non reconnus pour amélioration future
   - Mode debug pour tracer les transformations

### Cas Edge Spécifiques

```typescript
// Gestion des numéros ambigus
const handleAmbiguousNumbers = (cleaned: string): string => {
  // Numéros de 8 chiffres ou moins - probablement invalides
  if (cleaned.length < 9) return cleaned;
  
  // Numéros de plus de 12 chiffres - probablement invalides
  if (cleaned.length > 12) return cleaned;
  
  // Numéros ne commençant pas par des préfixes français valides
  const validPrefixes = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  if (!validPrefixes.includes(cleaned[0])) return cleaned;
};
```

## Testing Strategy

### Tests Unitaires

1. **Tests de Régression**
   - Vérifier que tous les formats actuellement supportés continuent de fonctionner
   - Tester avec les exemples existants dans le code

2. **Tests des Nouveaux Formats**
   - Tester chaque format problématique identifié
   - Vérifier le formatage attendu pour chaque cas

3. **Tests de Performance**
   - Mesurer le temps d'exécution avec des datasets importants
   - Vérifier qu'il n'y a pas de régression de performance

4. **Tests Edge Cases**
   - Entrées null/undefined
   - Chaînes vides
   - Caractères spéciaux
   - Numéros très longs ou très courts

### Structure des Tests

```typescript
describe('formatPhoneNumber - Enhanced', () => {
  describe('Truncated Numbers', () => {
    test('should format 9-digit mobile numbers', () => {
      expect(formatPhoneNumber('061410014')).toBe('+33 6 14 10 01 4');
    });
  });

  describe('Malformed +033 Prefix', () => {
    test('should correct +033 to +33', () => {
      expect(formatPhoneNumber('+033610291377')).toBe('+33 6 10 29 13 77');
    });
  });

  describe('Extra Digits', () => {
    test('should truncate 11-digit numbers', () => {
      expect(formatPhoneNumber('06551215174')).toBe('+33 6 55 12 15 17');
    });
  });

  describe('Malformed + Prefix', () => {
    test('should correct +0 to +33', () => {
      expect(formatPhoneNumber('+06028208067')).toBe('+33 6 02 82 08 06');
    });
  });
});
```

## Implementation Approach

### Phase 1: Extension de la Fonction Existante
- Ajouter les nouvelles règles de pattern matching
- Maintenir la compatibilité avec l'existant
- Implémenter les handlers pour chaque type de format problématique

### Phase 2: Optimisation et Refactoring
- Réorganiser la logique en patterns réutilisables
- Optimiser les expressions régulières pour la performance
- Ajouter des commentaires détaillés pour la maintenance

### Phase 3: Tests et Validation
- Créer une suite de tests complète
- Tester avec des données réelles
- Valider les performances sur de gros volumes

### Ordre d'Implémentation des Patterns

1. **Numéros tronqués** (priorité haute - cas fréquents)
2. **Préfixes +033 malformés** (priorité haute - cas fréquents)
3. **Numéros avec chiffres supplémentaires** (priorité moyenne)
4. **Préfixes + malformés** (priorité moyenne)
5. **Optimisations et edge cases** (priorité basse)

## Performance Considerations

### Optimisations Prévues

1. **Ordre des Patterns**
   - Placer les patterns les plus fréquents en premier
   - Utiliser des regex optimisées

2. **Early Returns**
   - Retourner rapidement pour les formats déjà corrects
   - Éviter les traitements inutiles

3. **Caching (si nécessaire)**
   - Considérer un cache simple pour les numéros fréquemment formatés
   - Évaluer l'impact mémoire vs gain de performance

### Métriques de Performance Cibles

- Temps d'exécution < 1ms par numéro
- Pas de régression sur les formats existants
- Mémoire stable (pas de fuites)