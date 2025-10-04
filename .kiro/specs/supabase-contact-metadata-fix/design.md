# Design Document

## Overview

Cette conception vise à corriger le problème de synchronisation des métadonnées de contacts (`prenom`, `nom`, `source`) vers les tables Supabase `shared_phone_numbers` et `shared_blacklist_numbers`. Actuellement, le service `supabaseShareService.ts` collecte ces informations dans l'objet `sample` mais ne les inclut pas dans le payload final envoyé à Supabase.

La solution consiste à modifier les fonctions `syncSharedPhoneNumbers` et `syncSharedBlacklistNumbers` pour inclure les métadonnées dans le payload d'upsert, tout en ajoutant une extraction appropriée du champ `source` qui n'est actuellement pas collecté.

## Architecture

### Composants affectés

1. **supabaseShareService.ts** - Service principal de synchronisation
   - Fonction `syncSharedPhoneNumbers()` - Synchronisation des numéros partagés
   - Fonction `syncSharedBlacklistNumbers()` - Synchronisation de la liste noire
   - Fonction `extractString()` - Extraction de chaînes depuis les événements (existante, pas de modification)
   - Nouvelle logique pour extraire le champ `source`

### Flux de données

```
Événements locaux (SQLite)
    ↓
Extraction des données (telephone, prenom, nom, source, statut)
    ↓
Agrégation par numéro normalisé
    ↓
Sélection du meilleur échantillon (priorité de statut)
    ↓
Construction du payload avec métadonnées
    ↓
Upsert vers Supabase (shared_phone_numbers / shared_blacklist_numbers)
```

## Components and Interfaces

### 1. Structure de l'objet `sample` (existant, à enrichir)

```typescript
interface ContactSample {
  contactId?: string
  prenom?: string
  nom?: string
  source?: string  // ← À ajouter
  statut?: string
  commentaire?: string
}
```

### 2. Structure de l'agrégation (existant, à enrichir)

```typescript
interface AggregatedContact {
  phoneNumber: string
  normalized: string
  occurrences: number
  sample: ContactSample
}
```

### 3. Payload pour shared_phone_numbers (à modifier)

**Avant:**
```typescript
{
  phone_number: string
  normalized_phone: string
  updated_at: string
}
```

**Après:**
```typescript
{
  phone_number: string
  normalized_phone: string
  prenom: string | null
  nom: string | null
  source: string | null
  updated_at: string
}
```

### 4. Payload pour shared_blacklist_numbers (à modifier)

**Avant:**
```typescript
{
  phone_number: string
  normalized_phone: string
  updated_at: string
}
```

**Après:**
```typescript
{
  phone_number: string
  normalized_phone: string
  prenom: string | null
  nom: string | null
  source: string | null
  updated_at: string
}
```

## Data Models

### Extraction du champ `source`

Le champ `source` doit être extrait depuis les événements locaux en utilisant les clés possibles suivantes (par ordre de priorité):
1. `source`
2. `origine`
3. `provenance`

Si aucune valeur n'est trouvée, utiliser `'Données'` comme valeur par défaut.

### Logique de sélection du meilleur échantillon

Pour `syncSharedPhoneNumbers`:
- Conserver la logique existante basée sur `isHigherPriorityStatus()`
- Lors du remplacement de l'échantillon, toutes les métadonnées (prenom, nom, source) sont remplacées ensemble

Pour `syncSharedBlacklistNumbers`:
- Conserver la logique existante basée sur la longueur du commentaire
- Lors du remplacement de l'échantillon, toutes les métadonnées sont remplacées ensemble

### Gestion des valeurs NULL

- Si un champ (`prenom`, `nom`, `source`) est `undefined` ou une chaîne vide dans l'échantillon, envoyer `null` à Supabase
- Utiliser l'opérateur `||` pour fournir `null` comme valeur par défaut

## Error Handling

### Validation des données

1. **Champs manquants**: Si `prenom`, `nom` ou `source` sont absents, envoyer `null` plutôt que de bloquer la synchronisation
2. **Erreurs Supabase**: Conserver la gestion d'erreur existante dans `chunkedUpsert()`
3. **Logging**: Ajouter des logs pour indiquer le nombre de contacts avec métadonnées complètes vs partielles

### Stratégie de récupération

- En cas d'échec de l'upsert, l'erreur est propagée et gérée par le mécanisme existant dans `runSync()`
- Les métadonnées manquantes ne doivent pas empêcher la synchronisation du numéro de téléphone

## Testing Strategy

### Tests unitaires

1. **Extraction du champ source**
   - Vérifier l'extraction depuis différentes clés (`source`, `origine`, `provenance`)
   - Vérifier la valeur par défaut `'Données'` quand aucune clé n'est trouvée
   - Vérifier le comportement avec des valeurs null/undefined

2. **Construction du payload**
   - Vérifier que `prenom`, `nom`, `source` sont inclus dans le payload
   - Vérifier que les valeurs `undefined` sont converties en `null`
   - Vérifier que les valeurs vides sont converties en `null`

3. **Agrégation avec métadonnées**
   - Vérifier que les métadonnées du meilleur échantillon sont conservées
   - Vérifier le comportement avec plusieurs événements pour le même numéro

### Tests d'intégration

1. **Synchronisation complète vers shared_phone_numbers**
   - Créer des événements locaux avec métadonnées complètes
   - Déclencher la synchronisation
   - Vérifier que les colonnes Supabase contiennent les bonnes valeurs

2. **Synchronisation complète vers shared_blacklist_numbers**
   - Créer des événements de liste noire avec métadonnées
   - Déclencher la synchronisation
   - Vérifier que les colonnes Supabase contiennent les bonnes valeurs

3. **Synchronisation avec métadonnées partielles**
   - Créer des événements avec seulement `prenom` ou seulement `nom`
   - Vérifier que les champs manquants sont NULL dans Supabase

### Tests manuels

1. Vérifier dans l'interface Supabase que les colonnes sont remplies après synchronisation
2. Tester avec des données réelles de production
3. Vérifier les logs de synchronisation pour les statistiques de métadonnées

## Implementation Notes

### Modifications minimales

Pour minimiser les risques de régression:
1. Ne pas modifier la logique d'agrégation existante
2. Ne pas modifier la logique de normalisation des numéros
3. Ajouter uniquement l'extraction de `source` et l'inclusion des métadonnées dans le payload

### Compatibilité

- Les tables Supabase ont déjà les colonnes `prenom`, `nom`, `source` (nullable)
- Aucune migration de base de données n'est nécessaire
- Les enregistrements existants avec métadonnées NULL seront mis à jour lors de la prochaine synchronisation

### Performance

- L'ajout de 3 champs dans le payload n'a pas d'impact significatif sur les performances
- La logique d'agrégation reste identique (pas de requêtes supplémentaires)
- Le chunking existant (500 enregistrements par batch) reste approprié
