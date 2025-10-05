# Design Document

## Overview

Cette fonctionnalité ajoute un système de vue switchable à la page Annuaire, permettant aux utilisateurs de basculer entre une vue en cards (existante) et une vue en table (inspirée de PaginatedEventTable). Le design privilégie la réutilisation de code existant, la cohérence avec l'interface actuelle, et une transition fluide entre les vues.

## Architecture

### Structure des composants

```
AnnuairePage (modifié)
├── ViewSwitcher (nouveau composant)
│   ├── Button (Cards)
│   └── Button (Table)
├── Navbar (existant)
├── Filters & Actions (existant)
└── Content Area
    ├── CardsView (code existant refactorisé)
    └── TableView (nouveau composant)
        └── AnnuaireTable (nouveau composant)
```

### Flux de données

1. **État de la vue** : Géré dans `AnnuairePage` via `useState`
2. **Persistance** : Sauvegarde automatique dans `localStorage` à chaque changement
3. **Données partagées** : Les deux vues utilisent les mêmes états (`filteredContacts`, `selectedContactIds`, etc.)
4. **Synchronisation** : Aucun rechargement de données nécessaire lors du switch

## Components and Interfaces

### 1. ViewSwitcher Component

**Fichier** : `src/components/ViewSwitcher.tsx`

**Props** :
```typescript
interface ViewSwitcherProps {
  currentView: 'cards' | 'table';
  onViewChange: (view: 'cards' | 'table') => void;
  className?: string;
}
```

**Responsabilités** :
- Afficher deux boutons pour sélectionner la vue
- Indiquer visuellement la vue active
- Émettre l'événement de changement de vue

**Design** :
- Utiliser `ToggleGroup` de shadcn/ui pour un look moderne
- Icônes : `LayoutGrid` pour cards, `Table2` pour table
- Positionnement : Dans la navbar, à droite du titre "Annuaire"

### 2. AnnuaireTable Component

**Fichier** : `src/components/AnnuaireTable.tsx`

**Props** :
```typescript
interface AnnuaireTableProps {
  contacts: DirectoryContact[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean | 'indeterminate') => void;
  onContactClick: (contact: DirectoryContact) => void;
  loading: boolean;
  theme?: 'dark' | 'light';
}
```

**Responsabilités** :
- Afficher les contacts dans une table avec colonnes triables
- Gérer la sélection multiple via checkboxes
- Permettre l'édition inline (double-clic sur cellule)
- Afficher un état de chargement

**Colonnes** :
1. Checkbox (sélection)
2. # (numéro de ligne)
3. Prénom
4. Nom
5. Téléphone
6. Email
7. Statut (avec badge coloré)
8. Commentaire
9. Date Rappel
10. Heure Rappel
11. Date RDV
12. Heure RDV
13. Date Appel
14. Heure Appel
15. Durée Appel

**Tri** :
- Clic sur en-tête de colonne pour trier
- Indicateur visuel (flèche) pour la colonne active
- Alternance asc/desc

**Édition inline** :
- Double-clic sur une cellule pour éditer
- Enter pour valider, Escape pour annuler
- Mise à jour immédiate dans `localDbService`

### 3. Modifications de AnnuairePage

**Nouveaux états** :
```typescript
const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
  try {
    const saved = localStorage.getItem('annuaire-view-mode');
    return saved === 'table' ? 'table' : 'cards';
  } catch {
    return 'cards';
  }
});
```

**Refactorisation du rendu** :
```typescript
// Contenu principal
<div className="flex-1 overflow-auto space-y-6">
  {viewMode === 'cards' ? (
    <CardsView
      contacts={filteredContacts}
      selectedIds={selectedContactIds}
      onToggleSelection={toggleContactSelection}
      onContactClick={handleContactClick}
      loading={loading}
    />
  ) : (
    <AnnuaireTable
      contacts={filteredContacts}
      selectedIds={selectedContactIds}
      onToggleSelection={toggleContactSelection}
      onToggleSelectAll={handleToggleSelectAll}
      onContactClick={handleContactClick}
      loading={loading}
      theme={theme}
    />
  )}
</div>
```

**Persistance** :
```typescript
useEffect(() => {
  try {
    localStorage.setItem('annuaire-view-mode', viewMode);
  } catch {}
}, [viewMode]);
```

## Data Models

### DirectoryContact (existant)

Aucune modification nécessaire. Le type `DirectoryContact` existant contient toutes les données nécessaires pour les deux vues.

```typescript
interface DirectoryContact {
  id: string;
  fullName: string;
  prenom: string;
  nom: string;
  telephone: string;
  email?: string;
  status: string;
  previousStatus?: string;
  commentaire?: string;
  reminder?: { date?: string; time?: string; label: string };
  rdv?: { date?: string; time?: string; label: string };
  lastCall?: { date?: string; time?: string; duration?: string; label: string };
  history: ContactHistoryItem[];
  events: StatusEventRecord[];
  lastUpdatedAt?: string | null;
  lastUpdatedLabel?: string;
  totalEvents: number;
  numeroLigne: number;
}
```

## Error Handling

### Gestion des erreurs de persistance

```typescript
const handleViewChange = (newView: 'cards' | 'table') => {
  setViewMode(newView);
  try {
    localStorage.setItem('annuaire-view-mode', newView);
  } catch (error) {
    console.warn('[Annuaire] Impossible de sauvegarder la préférence de vue', error);
    // L'application continue de fonctionner normalement
  }
};
```

### Gestion des erreurs d'édition inline

```typescript
const handleCellEdit = async (contactId: string, field: string, value: string) => {
  try {
    // Mise à jour optimiste
    setContacts(prev => prev.map(c => 
      c.id === contactId ? { ...c, [field]: value } : c
    ));
    
    // Mise à jour dans la base de données
    await localDbService.updateContact(contactId, { [field]: value });
  } catch (error) {
    console.error('[Annuaire] Erreur lors de la mise à jour', error);
    // Rollback de la mise à jour optimiste
    await fetchContacts(dateRange);
    // Afficher un toast d'erreur (optionnel)
  }
};
```

## Testing Strategy

### Tests unitaires

1. **ViewSwitcher Component**
   - Vérifie que le bouton actif est correctement mis en surbrillance
   - Vérifie que `onViewChange` est appelé avec la bonne valeur
   - Vérifie l'accessibilité (labels, keyboard navigation)

2. **AnnuaireTable Component**
   - Vérifie le rendu correct des colonnes
   - Vérifie le tri des données
   - Vérifie la sélection multiple
   - Vérifie l'édition inline

3. **AnnuairePage Integration**
   - Vérifie la persistance de la vue dans localStorage
   - Vérifie que les filtres sont préservés lors du switch
   - Vérifie que la sélection est préservée lors du switch

### Tests d'intégration

1. **Workflow complet**
   - Charger la page Annuaire
   - Appliquer des filtres (recherche, date)
   - Sélectionner des contacts
   - Changer de vue
   - Vérifier que tout est préservé

2. **Édition inline**
   - Double-cliquer sur une cellule
   - Modifier la valeur
   - Valider avec Enter
   - Vérifier la mise à jour dans la base de données

3. **Actions de masse**
   - Sélectionner plusieurs contacts en vue table
   - Exécuter une action (suppression, transfert)
   - Vérifier que l'action s'applique correctement

### Tests manuels

1. **Performance**
   - Tester avec 1000+ contacts
   - Vérifier que le switch de vue est instantané
   - Vérifier que le scroll est fluide

2. **Responsive**
   - Tester sur mobile (< 768px)
   - Tester sur tablette (768px - 1024px)
   - Tester sur desktop (> 1024px)

3. **Accessibilité**
   - Navigation au clavier (Tab, Enter, Escape)
   - Lecteur d'écran (NVDA, JAWS)
   - Contraste des couleurs

## Implementation Notes

### Réutilisation de code

- **PaginatedEventTable** : Utiliser comme référence pour la structure de la table, mais adapter pour `DirectoryContact`
- **Styles** : Réutiliser les classes Tailwind existantes pour la cohérence
- **Composants UI** : Utiliser les composants shadcn/ui existants (Table, Button, Checkbox, Badge)

### Optimisations

1. **Mémoïsation** : Utiliser `useMemo` pour les calculs coûteux (tri, filtrage)
2. **Callbacks stables** : Utiliser `useCallback` pour éviter les re-renders inutiles
3. **Virtualisation** : Pas nécessaire initialement, mais envisager si performance insuffisante avec > 1000 contacts

### Considérations UX

1. **Feedback visuel** : Transition subtile lors du changement de vue (fade in/out)
2. **État de chargement** : Skeleton loaders cohérents entre les deux vues
3. **Empty state** : Message cohérent quand aucun contact n'est trouvé
4. **Scroll position** : Réinitialiser au top lors du changement de vue

### Accessibilité

1. **Labels ARIA** : Ajouter des labels appropriés pour les boutons de vue
2. **Keyboard navigation** : Assurer que toutes les actions sont accessibles au clavier
3. **Focus management** : Gérer le focus lors du changement de vue
4. **Screen readers** : Annoncer le changement de vue

## Migration Path

### Phase 1 : Création des nouveaux composants
- Créer `ViewSwitcher.tsx`
- Créer `AnnuaireTable.tsx`

### Phase 2 : Refactorisation de AnnuairePage
- Extraire la vue cards dans un composant séparé (optionnel)
- Ajouter l'état `viewMode`
- Intégrer le `ViewSwitcher`
- Implémenter le rendu conditionnel

### Phase 3 : Tests et ajustements
- Tests unitaires
- Tests d'intégration
- Ajustements UX basés sur les retours

### Phase 4 : Déploiement
- Merge dans la branche principale
- Monitoring des performances
- Collecte de feedback utilisateur
