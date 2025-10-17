# Design Document

## Overview

Cette fonctionnalité corrige le problème des options d'export Google (Contacts Google et Agenda Google) qui sont désactivées de manière permanente dans le composant `AppelsCardsView`. La solution consiste à implémenter la même logique de calcul dynamique des compteurs que celle utilisée dans le composant principal `App.tsx`.

Le problème actuel est que les options "Contacts Google" et "Agenda Google" sont codées en dur avec `disabled={true}` aux lignes 893 et 903 du fichier `AppelsCardsView.tsx`, alors qu'elles devraient être activées dynamiquement en fonction du nombre de contacts éligibles.

## Architecture

### Composants affectés

1. **AppelsCardsView.tsx** (src/components/AppelsCardsView.tsx)
   - Composant principal à modifier
   - Contient le menu d'export avec les options désactivées
   - Reçoit déjà la liste des contacts en props

### Flux de données

```
contacts (props) 
    ↓
useMemo hooks (calcul des compteurs)
    ↓
googleContactsCount & calendarRemindersCount
    ↓
DropdownMenuCheckboxItem (disabled & affichage du compteur)
```

## Components and Interfaces

### Hooks React à ajouter

#### 1. Hook `googleContactsCount`

```typescript
const googleContactsCount = useMemo(() => {
  const filteredContacts = contacts.filter(contact =>
    contact.statut === ContactStatus.ARappeler ||
    contact.statut === ContactStatus.DO ||
    contact.statut === ContactStatus.RO ||
    contact.statut === ContactStatus.A0
  );
  return filteredContacts.length;
}, [contacts]);
```

**Responsabilité**: Calculer le nombre de contacts éligibles pour l'export Google Contacts
**Dépendances**: Liste des contacts
**Critères de filtrage**: Contacts avec statut "À rappeler", "DO", "RO", ou "A0"

#### 2. Hook `calendarRemindersCount`

```typescript
const calendarRemindersCount = useMemo(() => {
  const filteredContacts = contacts.filter(contact =>
    contact.dateRappel && contact.dateRappel.trim() !== ''
  );
  return filteredContacts.length;
}, [contacts]);
```

**Responsabilité**: Calculer le nombre de contacts avec des rappels valides
**Dépendances**: Liste des contacts
**Critères de filtrage**: Contacts avec un champ `dateRappel` non vide

### Modifications du menu d'export

#### Option "Contacts Google" (ligne ~893)

**Avant**:
```typescript
<DropdownMenuCheckboxItem
  checked={exportOptions.contacts}
  onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, contacts: checked }))}
  onSelect={(e) => e.preventDefault()}
  disabled={true}  // ❌ Codé en dur
  className="cursor-pointer"
>
  <Users className="mr-2 h-4 w-4" />
  <span>Contacts Google</span>
</DropdownMenuCheckboxItem>
```

**Après**:
```typescript
<DropdownMenuCheckboxItem
  checked={exportOptions.contacts}
  onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, contacts: checked }))}
  onSelect={(e) => e.preventDefault()}
  disabled={googleContactsCount === 0}  // ✅ Dynamique
  className="cursor-pointer"
>
  <Users className="mr-2 h-4 w-4" />
  <span>Contacts Google</span>
  {googleContactsCount > 0 && (
    <span className="ml-auto text-xs text-muted-foreground">({googleContactsCount})</span>
  )}
</DropdownMenuCheckboxItem>
```

#### Option "Agenda Google" (ligne ~903)

**Avant**:
```typescript
<DropdownMenuCheckboxItem
  checked={exportOptions.agenda}
  onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, agenda: checked }))}
  onSelect={(e) => e.preventDefault()}
  disabled={true}  // ❌ Codé en dur
  className="cursor-pointer"
>
  <Calendar className="mr-2 h-4 w-4" />
  <span>Agenda Google</span>
</DropdownMenuCheckboxItem>
```

**Après**:
```typescript
<DropdownMenuCheckboxItem
  checked={exportOptions.agenda}
  onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, agenda: checked }))}
  onSelect={(e) => e.preventDefault()}
  disabled={calendarRemindersCount === 0}  // ✅ Dynamique
  className="cursor-pointer"
>
  <Calendar className="mr-2 h-4 w-4" />
  <span>Agenda Google</span>
  {calendarRemindersCount > 0 && (
    <span className="ml-auto text-xs text-muted-foreground">({calendarRemindersCount})</span>
  )}
</DropdownMenuCheckboxItem>
```

## Data Models

Aucune modification des modèles de données n'est nécessaire. Les types existants sont suffisants :

- `Contact`: Type existant avec les propriétés `statut` et `dateRappel`
- `ContactStatus`: Enum existant avec les valeurs `ARappeler`, `DO`, `RO`, `A0`

## Error Handling

Cette fonctionnalité ne nécessite pas de gestion d'erreur spécifique car :

1. Les calculs de compteurs sont purement synchrones
2. Les filtres utilisent des opérateurs sûrs (`===`, `&&`, `trim()`)
3. Les valeurs par défaut sont gérées (liste vide = 0 contacts)

En cas de liste de contacts vide ou invalide, les compteurs retourneront simplement 0, ce qui désactivera les options d'export correspondantes.

## Testing Strategy

### Tests manuels

1. **Test avec contacts éligibles pour Google Contacts**
   - Créer des contacts avec statuts: À rappeler, DO, RO, A0
   - Vérifier que l'option "Contacts Google" est activée
   - Vérifier que le compteur affiche le bon nombre

2. **Test avec contacts ayant des rappels**
   - Créer des contacts avec des dates de rappel
   - Vérifier que l'option "Agenda Google" est activée
   - Vérifier que le compteur affiche le bon nombre

3. **Test sans contacts éligibles**
   - Utiliser uniquement des contacts avec d'autres statuts
   - Vérifier que l'option "Contacts Google" est désactivée
   - Vérifier qu'aucun compteur n'est affiché

4. **Test sans rappels**
   - Utiliser des contacts sans dates de rappel
   - Vérifier que l'option "Agenda Google" est désactivée
   - Vérifier qu'aucun compteur n'est affiché

5. **Test de cohérence**
   - Comparer le comportement avec la page principale (App.tsx)
   - Vérifier que les compteurs sont identiques
   - Vérifier que les options sont activées/désactivées de la même manière

### Scénarios de test

| Scénario | Contacts | Statuts | Rappels | Résultat attendu |
|----------|----------|---------|---------|------------------|
| 1 | 5 contacts | 3 "À rappeler", 2 "Appelé" | 2 avec rappel | Google Contacts: activé (3), Agenda: activé (2) |
| 2 | 10 contacts | Tous "Appelé" | 5 avec rappel | Google Contacts: désactivé, Agenda: activé (5) |
| 3 | 8 contacts | 4 "DO", 4 "RO" | Aucun | Google Contacts: activé (8), Agenda: désactivé |
| 4 | 0 contacts | - | - | Toutes les options désactivées |

## Performance Considerations

### Optimisation avec useMemo

Les hooks `useMemo` sont utilisés pour éviter les recalculs inutiles :
- Les compteurs ne sont recalculés que lorsque la liste des contacts change
- Les filtres sont simples et performants (O(n))
- Pas d'impact sur les performances même avec des listes de plusieurs centaines de contacts

### Impact mémoire

- Négligeable : seulement deux variables numériques supplémentaires
- Les listes filtrées sont temporaires et garbage-collectées immédiatement

## Implementation Notes

### Emplacement du code

Les hooks `useMemo` doivent être ajoutés dans le composant `AppelsCardsView`, après la déclaration de `exportOptions` (ligne ~328) et avant le premier `useEffect`.

### Imports nécessaires

Aucun import supplémentaire n'est nécessaire :
- `useMemo` est déjà importé
- `ContactStatus` est déjà importé
- Tous les composants UI sont déjà importés

### Cohérence avec App.tsx

La logique implémentée doit être strictement identique à celle de `App.tsx` (lignes 1290-1312) pour garantir la cohérence du comportement entre les deux pages.

### Logs de débogage

Les logs de débogage présents dans `App.tsx` peuvent être omis dans `AppelsCardsView` pour éviter la pollution de la console, sauf si nécessaire pour le débogage initial.
