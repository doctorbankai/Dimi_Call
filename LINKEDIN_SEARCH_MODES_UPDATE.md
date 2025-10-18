# Mise à jour des modes de recherche LinkedIn

## Résumé des modifications

Cette mise à jour remplace le composant Tabs en mode Cards par un dropdown (comme en mode Table) et ajoute deux nouvelles options de recherche LinkedIn pour offrir plus de flexibilité dans les recherches automatiques.

## Changements effectués

### 1. Nouveau type AutoSearchMode

**Fichier**: `src/types.ts`

Ajout d'un nouveau type exporté pour le mode de recherche automatique:

```typescript
export type AutoSearchMode = 'disabled' | 'linkedin' | 'linkedin-name' | 'linkedin-name-type' | 'google' | 'link';
```

### 2. Remplacement du composant Tabs par un Dropdown en mode Cards

**Fichier**: `src/components/AppelsCardsView.tsx`

- **Avant**: Composant `Tabs` avec 4 onglets (Désactivé, LinkedIn, Google, Lien)
- **Après**: Composant `DropdownMenu` avec 6 options organisées

Le dropdown affiche maintenant:
- Désactivé
- ---
- LinkedIn (Prénom + Nom)
- LinkedIn (Prénom + Nom + Type)
- LinkedIn (Complet)
- ---
- Google
- Lien

### 3. Nouvelles options LinkedIn

#### Option 1: LinkedIn (Prénom + Nom)
- **Mode**: `linkedin-name`
- **Comportement**: Recherche uniquement avec le prénom et le nom du contact
- **Utilisation**: Pour des recherches simples et ciblées

#### Option 2: LinkedIn (Prénom + Nom + Type)
- **Mode**: `linkedin-name-type`
- **Comportement**: Recherche avec prénom, nom et le champ Type (ou Source si Type n'existe pas)
- **Utilisation**: Pour affiner la recherche avec le type de contact

#### Option 3: LinkedIn (Complet) - Existant
- **Mode**: `linkedin`
- **Comportement**: Recherche avec prénom, nom, type ET source
- **Utilisation**: Pour la recherche la plus complète possible

### 4. Mise à jour de la logique de recherche automatique

**Fichiers modifiés**:
- `src/components/AutoSearchDropdown.tsx`
- `src/App.tsx`

La logique de déclenchement automatique a été mise à jour pour gérer les trois modes LinkedIn:

```typescript
switch (autoSearchMode) {
  case 'linkedin':
    // Mode complet: Prénom + Nom + Type + Source
    searchLinkedIn(prenom, nom, type, source);
    break;
  case 'linkedin-name':
    // Mode simple: Prénom + Nom uniquement
    searchLinkedIn(prenom, nom);
    break;
  case 'linkedin-name-type':
    // Mode intermédiaire: Prénom + Nom + Type (ou Source)
    searchLinkedIn(prenom, nom, typeOrSource);
    break;
}
```

### 5. Mise à jour des dropdowns existants

Tous les dropdowns de sélection du mode automatique ont été mis à jour:
- Dropdown en mode Cards (nouveau)
- Dropdown en mode Table
- Dropdown dans le menu principal de App.tsx
- Composant AutoSearchDropdown

### 6. Persistance du mode sélectionné

Le mode sélectionné est automatiquement sauvegardé dans le localStorage avec la clé `dimicall-auto-search-mode` et reste actif même après un rechargement de l'application.

## Avantages

1. **Interface unifiée**: Le mode Cards utilise maintenant le même type de contrôle (dropdown) que le mode Table
2. **Plus de flexibilité**: Les utilisateurs peuvent choisir le niveau de détail de leurs recherches LinkedIn
3. **Meilleure organisation**: Les options sont regroupées logiquement avec des séparateurs
4. **Rétrocompatibilité**: L'ancien mode "linkedin" est toujours disponible sous le nom "LinkedIn (Complet)"

## Utilisation

1. Cliquer sur le bouton avec l'icône correspondant au mode actuel
2. Sélectionner le mode de recherche souhaité dans le dropdown
3. Le mode est automatiquement appliqué et sauvegardé
4. Lors de la sélection d'un contact, la recherche automatique s'effectue selon le mode choisi

## Tests recommandés

- [ ] Vérifier que le dropdown s'affiche correctement en mode Cards
- [ ] Vérifier que le dropdown s'affiche correctement en mode Table
- [ ] Tester chaque mode de recherche LinkedIn:
  - [ ] LinkedIn (Prénom + Nom)
  - [ ] LinkedIn (Prénom + Nom + Type)
  - [ ] LinkedIn (Complet)
- [ ] Vérifier que le mode sélectionné persiste après rechargement
- [ ] Vérifier que l'icône du bouton change selon le mode sélectionné
- [ ] Tester la recherche automatique lors du changement de contact
