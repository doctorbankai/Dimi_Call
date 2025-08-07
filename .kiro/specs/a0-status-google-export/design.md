# Design Document

## Overview

Cette fonctionnalité étend l'export Google Contacts existant pour inclure le nouveau statut "A0". La modification est relativement simple car elle consiste principalement à ajouter le statut "A0" au filtre existant dans la fonction `exportGoogleContactsCSV`.

## Architecture

L'architecture existante reste inchangée. La modification se concentre sur :

1. **Service Layer** : Modification de la fonction `exportGoogleContactsCSV` dans `src/services/dataService.ts`
2. **UI Layer** : Mise à jour du calcul du compteur et du tooltip dans `src/App.tsx`
3. **Constants** : Aucune modification nécessaire car le statut "A0" existe déjà

## Components and Interfaces

### Service Layer (`src/services/dataService.ts`)

**Fonction modifiée :**
```typescript
export const exportGoogleContactsCSV = (contacts: Contact[]): void => {
  // Filtrer les contacts par statut (À rappeler, DO, RO, A0)
  const filteredContacts = contacts.filter(contact => 
    contact.statut === ContactStatus.ARappeler ||
    contact.statut === ContactStatus.DO ||
    contact.statut === ContactStatus.RO ||
    contact.statut === ContactStatus.A0  // NOUVEAU: Ajout du statut A0
  );
  
  // Le reste de la logique reste identique
  // ...
}
```

### UI Layer (`src/App.tsx`)

**Calcul du compteur Google Contacts :**
```typescript
const googleContactsCount = useMemo(() => {
  return contacts.filter(contact => 
    contact.statut === ContactStatus.ARappeler ||
    contact.statut === ContactStatus.DO ||
    contact.statut === ContactStatus.RO ||
    contact.statut === ContactStatus.A0  // NOUVEAU: Ajout du statut A0
  ).length;
}, [contacts]);
```

**Mise à jour du tooltip :**
```typescript
title={googleContactsCount > 0 
  ? `Exporter ${googleContactsCount} contacts (À rappeler, DO, RO, A0) vers Google Contacts` 
  : 'Aucun contact à exporter - Seuls les contacts avec les statuts "À rappeler", "DO", "RO" ou "A0" sont exportés'
}
```

## Data Models

Aucune modification des modèles de données n'est nécessaire. Le statut `ContactStatus.A0` existe déjà dans l'énumération `ContactStatus`.

## Error Handling

La gestion d'erreur existante reste appropriée :

1. **Aucun contact éligible** : Le message d'erreur existant "Aucun contact à exporter avec les statuts sélectionnés" reste valide
2. **Erreurs CSV** : La gestion existante des erreurs de génération CSV reste inchangée
3. **Erreurs de téléchargement** : La gestion existante reste appropriée

## Testing Strategy

### Tests Unitaires

1. **Service Tests** (`src/__tests__/services/dataService.test.ts`)
   - Tester que les contacts avec statut "A0" sont inclus dans l'export
   - Tester le mélange de contacts avec différents statuts incluant "A0"
   - Tester le cas où seuls des contacts "A0" existent

2. **Integration Tests**
   - Tester le calcul du compteur avec des contacts "A0"
   - Tester l'activation/désactivation du bouton avec des contacts "A0"
   - Tester le tooltip avec des contacts "A0"

### Tests d'Interface

1. **Compteur Badge** : Vérifier que le badge affiche le bon nombre incluant les contacts "A0"
2. **État du Bouton** : Vérifier que le bouton est activé quand il y a des contacts "A0"
3. **Tooltip** : Vérifier que le tooltip mentionne le statut "A0"

### Tests de Régression

1. **Compatibilité** : S'assurer que les anciens statuts (À rappeler, DO, RO) continuent de fonctionner
2. **Format CSV** : Vérifier que le format CSV généré reste compatible avec Google Contacts
3. **Performance** : S'assurer que l'ajout du filtre supplémentaire n'impacte pas les performances

## Implementation Notes

### Ordre de Priorité

1. **Critique** : Modification de la fonction `exportGoogleContactsCSV`
2. **Important** : Mise à jour du calcul du compteur
3. **Moyen** : Mise à jour du tooltip

### Considérations Techniques

1. **Backward Compatibility** : La modification est additive et ne casse pas la fonctionnalité existante
2. **Performance** : L'ajout d'une condition OR supplémentaire a un impact négligeable
3. **Maintenance** : Si de nouveaux statuts sont ajoutés à l'avenir, ils devront être explicitement ajoutés au filtre

### Points d'Attention

1. **Cohérence** : S'assurer que tous les endroits qui référencent les statuts exportables sont mis à jour
2. **Tests** : Mettre à jour tous les tests existants qui vérifient les statuts exportables
3. **Documentation** : Mettre à jour la documentation utilisateur si elle existe