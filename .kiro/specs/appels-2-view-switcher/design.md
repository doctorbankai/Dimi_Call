# Design Document

## Overview

Cette fonctionnalité ajoute un système de vue switchable à la page "Appels 2" (AppelsCardsView), permettant aux utilisateurs de basculer entre une vue en cards (existante) et une vue en table. Le design réutilise exactement les mêmes composants que la page Annuaire (ViewSwitcher et AnnuaireTable) pour garantir la cohérence de l'interface et éviter la duplication de code.

## Architecture

### Structure des composants

```
AppelsCardsView (modifié)
├── Navbar (existant)
│   ├── Tabs (Désactivé/LinkedIn/Google/Lien)
│   ├── ViewSwitcher (nouveau - réutilisé depuis Annuaire) ← AJOUT ICI
│   ├── Button Autocall
│   ├── ButtonGroup (Import/Export)
│   └── Button Supprimer
└── Content Area
    ├── CardsView (code existant - vue actuelle)
    └── TableView (nouveau)
        └── AnnuaireTable (réutilisé depuis Annuaire)
```

### Flux de données

1. **État de la vue** : Géré dans `AppelsCardsView` via `useState`
2. **Persistance** : Sauvegarde automatique dans `localStorage` avec la clé `'appels-2-view-mode'`
3. **Données partagées** : Les deux vues utilisent les mêmes données (`contacts`, `selectedContactId`, etc.)
4. **Synchronisation** : Aucun rechargement de données nécessaire lors du switch

## Components and Interfaces

### 1. ViewSwitcher Component (Réutilisé)

**Fichier** : `src/components/ViewSwitcher.tsx` (existant)

**Utilisation dans AppelsCardsView** :
```typescript
import { ViewSwitcher, ViewMode } from '@/components/ViewSwitcher';

// Dans le composant
const [viewMode, setViewMode] = useState<ViewMode>(() => {
  try {
    const saved = localStorage.getItem('appels-2-view-mode');
    return saved === 'table' ? 'table' : 'cards';
  } catch {
    return 'cards';
  }
});

// Dans le JSX (navbar)
<ViewSwitcher
  currentView={viewMode}
  onViewChange={setViewMode}
/>
```

**Positionnement** : Dans la navbar, après les Tabs et avant le bouton Autocall

### 2. AnnuaireTable Component (Réutilisé)

**Fichier** : `src/components/AnnuaireTable.tsx` (existant)

**Adaptation des données** :
Les contacts de AppelsCardsView utilisent le type `Contact`, qui doit être converti en `DirectoryContact` pour AnnuaireTable.

**Mapping des données** :
```typescript
const convertToDirectoryContact = (contact: Contact): DirectoryContact => {
  return {
    id: contact.id,
    fullName: `${contact.prenom || ''} ${contact.nom || ''}`.trim(),
    prenom: contact.prenom || '',
    nom: contact.nom || '',
    telephone: contact.telephone || '',
    email: contact.email || '',
    status: contact.statut || ContactStatus.NonDefini,
    previousStatus: contact.previousStatus,
    commentaire: contact.commentaire || '',
    reminder: contact.dateRappel || contact.heureRappel ? {
      date: contact.dateRappel,
      time: contact.heureRappel,
      label: contact.dateRappel ? `Rappel le ${formatDisplayDate(contact.dateRappel)}` : ''
    } : undefined,
    rdv: contact.dateRDV || contact.heureRDV ? {
      date: contact.dateRDV,
      time: contact.heureRDV,
      label: contact.dateRDV ? `RDV le ${formatDisplayDate(contact.dateRDV)}` : ''
    } : undefined,
    lastCall: contact.dateAppel || contact.heureAppel || contact.dureeAppel ? {
      date: contact.dateAppel,
      time: contact.heureAppel,
      duration: contact.dureeAppel,
      label: contact.dateAppel ? `Appel le ${formatDisplayDate(contact.dateAppel)}` : ''
    } : undefined,
    history: [], // Peut être construit à partir de l'historique si nécessaire
    events: [], // Peut être construit à partir des événements si nécessaire
    lastUpdatedAt: contact.lastUpdatedAt,
    lastUpdatedLabel: contact.lastUpdatedLabel,
    totalEvents: 0,
    numeroLigne: contact.numeroLigne || 0
  };
};

// Conversion des contacts
const directoryContacts = useMemo(
  () => contacts.map(convertToDirectoryContact),
  [contacts]
);
```

**Utilisation dans AppelsCardsView** :
```typescript
import { AnnuaireTable } from '@/components/AnnuaireTable';

// Dans le JSX
{viewMode === 'table' ? (
  <AnnuaireTable
    contacts={directoryContacts}
    selectedIds={new Set(selectedContactId ? [selectedContactId] : [])}
    onToggleSelection={(id, checked) => {
      // Gérer la sélection
      if (checked) {
        const contact = contacts.find(c => c.id === id);
        if (contact) onSelectContact(contact);
      } else {
        onSelectContact(null);
      }
    }}
    onToggleSelectAll={(checked) => {
      // Gérer la sélection de tous
      if (checked === true && contacts.length > 0) {
        onSelectContact(contacts[0]);
      } else {
        onSelectContact(null);
      }
    }}
    onContactClick={(contact) => {
      // Trouver le contact original et le sélectionner
      const originalContact = contacts.find(c => c.id === contact.id);
      if (originalContact) onSelectContact(originalContact);
    }}
    loading={false}
  />
) : (
  // Vue cards existante
  <div className="flex h-full w-full gap-4 overflow-hidden flex-col lg:flex-row">
    {/* Code existant de la vue cards */}
  </div>
)}
```

### 3. Modifications de AppelsCardsView

**Nouveaux imports** :
```typescript
import { ViewSwitcher, ViewMode } from '@/components/ViewSwitcher';
import { AnnuaireTable } from '@/components/AnnuaireTable';
import type { DirectoryContact } from '@/types'; // Si le type existe
```

**Nouveaux états** :
```typescript
const [viewMode, setViewMode] = useState<ViewMode>(() => {
  try {
    const saved = localStorage.getItem('appels-2-view-mode');
    return saved === 'table' ? 'table' : 'cards';
  } catch {
    return 'cards';
  }
});
```

**Persistance** :
```typescript
useEffect(() => {
  try {
    localStorage.setItem('appels-2-view-mode', viewMode);
  } catch (error) {
    console.warn('[Appels 2] Impossible de sauvegarder la préférence de vue', error);
  }
}, [viewMode]);
```

**Refactorisation du JSX** :

La navbar reste identique, avec l'ajout du ViewSwitcher :
```typescript
<div className="flex flex-wrap items-center gap-2">
  <Tabs value={autoSearchMode} onValueChange={(value) => setAutoSearchMode(value as any)} className="w-auto">
    {/* Tabs existants */}
  </Tabs>
  
  {/* NOUVEAU : ViewSwitcher */}
  <ViewSwitcher
    currentView={viewMode}
    onViewChange={setViewMode}
  />
  
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button /* Autocall button */}>
          {/* ... */}
        </Button>
      </TooltipTrigger>
    </Tooltip>
  </TooltipProvider>
  
  {/* Reste des boutons existants */}
</div>
```

Le contenu principal devient conditionnel :
```typescript
{/* Après la navbar */}
{viewMode === 'cards' ? (
  // Vue cards existante (tout le code actuel)
  <div className="flex h-full w-full gap-4 overflow-hidden flex-col lg:flex-row">
    {/* Colonne de gauche avec la liste des contacts */}
    <div className="flex w-full lg:w-[320px] xl:w-[360px] 2xl:w-[420px] flex-col rounded-xl border bg-card/70 backdrop-blur-sm shadow-sm max-h-[300px] lg:max-h-none">
      {/* ... code existant ... */}
    </div>
    
    {/* Colonne de droite avec les détails */}
    <div className="flex flex-1 flex-col gap-4 overflow-hidden">
      {/* ... code existant ... */}
    </div>
  </div>
) : (
  // Vue table (nouveau)
  <div className="flex-1 flex overflow-hidden min-h-0">
    <AnnuaireTable
      contacts={directoryContacts}
      selectedIds={new Set(selectedContactId ? [selectedContactId] : [])}
      onToggleSelection={handleToggleSelection}
      onToggleSelectAll={handleToggleSelectAll}
      onContactClick={handleContactClick}
      loading={false}
    />
  </div>
)}
```

## Data Models

### Contact (existant dans AppelsCardsView)

```typescript
interface Contact {
  id: string;
  prenom?: string;
  nom?: string;
  telephone: string;
  email?: string;
  statut?: ContactStatus;
  previousStatus?: string;
  commentaire?: string;
  dateRappel?: string;
  heureRappel?: string;
  dateRDV?: string;
  heureRDV?: string;
  dateAppel?: string;
  heureAppel?: string;
  dureeAppel?: string;
  source?: string;
  numeroLigne?: number;
  lastUpdatedAt?: string;
  lastUpdatedLabel?: string;
  // ... autres champs
}
```

### DirectoryContact (utilisé par AnnuaireTable)

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

### Fonction de conversion

```typescript
const convertToDirectoryContact = (contact: Contact): DirectoryContact => {
  return {
    id: contact.id,
    fullName: `${contact.prenom || ''} ${contact.nom || ''}`.trim(),
    prenom: contact.prenom || '',
    nom: contact.nom || '',
    telephone: contact.telephone || '',
    email: contact.email || '',
    status: contact.statut || ContactStatus.NonDefini,
    previousStatus: contact.previousStatus,
    commentaire: contact.commentaire || '',
    reminder: contact.dateRappel || contact.heureRappel ? {
      date: contact.dateRappel,
      time: contact.heureRappel,
      label: contact.dateRappel ? `Rappel le ${formatDisplayDate(contact.dateRappel)}` : ''
    } : undefined,
    rdv: contact.dateRDV || contact.heureRDV ? {
      date: contact.dateRDV,
      time: contact.heureRDV,
      label: contact.dateRDV ? `RDV le ${formatDisplayDate(contact.dateRDV)}` : ''
    } : undefined,
    lastCall: contact.dateAppel || contact.heureAppel || contact.dureeAppel ? {
      date: contact.dateAppel,
      time: contact.heureAppel,
      duration: contact.dureeAppel,
      label: contact.dateAppel ? `Appel le ${formatDisplayDate(contact.dateAppel)}` : ''
    } : undefined,
    history: [],
    events: [],
    lastUpdatedAt: contact.lastUpdatedAt,
    lastUpdatedLabel: contact.lastUpdatedLabel,
    totalEvents: 0,
    numeroLigne: contact.numeroLigne || 0
  };
};
```

## Error Handling

### Gestion des erreurs de persistance

```typescript
const handleViewChange = (newView: ViewMode) => {
  setViewMode(newView);
  try {
    localStorage.setItem('appels-2-view-mode', newView);
  } catch (error) {
    console.warn('[Appels 2] Impossible de sauvegarder la préférence de vue', error);
    // L'application continue de fonctionner normalement
  }
};
```

### Gestion des erreurs de conversion

```typescript
const directoryContacts = useMemo(() => {
  try {
    return contacts.map(convertToDirectoryContact);
  } catch (error) {
    console.error('[Appels 2] Erreur lors de la conversion des contacts', error);
    return [];
  }
}, [contacts]);
```

## Testing Strategy

### Tests unitaires

1. **ViewSwitcher Integration**
   - Vérifie que le ViewSwitcher est correctement affiché dans la navbar
   - Vérifie que le changement de vue fonctionne
   - Vérifie la persistance dans localStorage

2. **Data Conversion**
   - Vérifie que `convertToDirectoryContact` convertit correctement les données
   - Vérifie la gestion des champs optionnels
   - Vérifie la gestion des valeurs nulles/undefined

3. **Table View Integration**
   - Vérifie que AnnuaireTable reçoit les bonnes props
   - Vérifie que la sélection fonctionne
   - Vérifie que les callbacks sont correctement appelés

### Tests d'intégration

1. **Workflow complet**
   - Charger la page Appels 2
   - Appliquer des filtres (tabs, recherche)
   - Sélectionner un contact
   - Changer de vue
   - Vérifier que tout est préservé

2. **Actions dans la vue table**
   - Sélectionner un contact dans la table
   - Vérifier que les détails s'affichent correctement
   - Modifier un contact
   - Vérifier la mise à jour

3. **Persistance**
   - Changer de vue
   - Recharger la page
   - Vérifier que la vue est restaurée

### Tests manuels

1. **Performance**
   - Tester avec 100+ contacts
   - Vérifier que le switch de vue est instantané
   - Vérifier que le scroll est fluide

2. **Responsive**
   - Tester sur mobile (< 768px)
   - Tester sur tablette (768px - 1024px)
   - Tester sur desktop (> 1024px)

3. **Accessibilité**
   - Navigation au clavier (Tab, Enter)
   - Lecteur d'écran
   - Contraste des couleurs

## Implementation Notes

### Réutilisation de code

- **ViewSwitcher** : Utiliser exactement le même composant que la page Annuaire
- **AnnuaireTable** : Utiliser exactement le même composant que la page Annuaire
- **Styles** : Réutiliser les classes Tailwind existantes pour la cohérence
- **Conversion de données** : Créer une fonction utilitaire réutilisable

### Optimisations

1. **Mémoïsation** : Utiliser `useMemo` pour la conversion des contacts
2. **Callbacks stables** : Utiliser `useCallback` pour les handlers
3. **Lazy loading** : Pas nécessaire initialement

### Considérations UX

1. **Feedback visuel** : Transition subtile lors du changement de vue
2. **État de chargement** : Pas nécessaire car les données sont déjà chargées
3. **Empty state** : Réutiliser l'empty state de AnnuaireTable
4. **Scroll position** : Réinitialiser au top lors du changement de vue

### Accessibilité

1. **Labels ARIA** : Déjà gérés par ViewSwitcher
2. **Keyboard navigation** : Déjà gérée par ViewSwitcher et AnnuaireTable
3. **Focus management** : Gérer le focus lors du changement de vue
4. **Screen readers** : Annoncer le changement de vue

## Migration Path

### Phase 1 : Préparation
- Vérifier que ViewSwitcher et AnnuaireTable sont bien exportés
- Créer la fonction de conversion `convertToDirectoryContact`

### Phase 2 : Intégration du ViewSwitcher
- Ajouter l'état `viewMode` dans AppelsCardsView
- Ajouter le ViewSwitcher dans la navbar
- Implémenter la persistance

### Phase 3 : Intégration de la vue table
- Ajouter la conversion des contacts
- Intégrer AnnuaireTable
- Implémenter le rendu conditionnel

### Phase 4 : Tests et ajustements
- Tests unitaires
- Tests d'intégration
- Ajustements UX basés sur les retours

### Phase 5 : Déploiement
- Merge dans la branche principale
- Monitoring des performances
- Collecte de feedback utilisateur

## Positionnement exact du ViewSwitcher

Le ViewSwitcher doit être positionné dans la navbar de la manière suivante :

```
[Titre "Appels"] | [Tabs: Désactivé/LinkedIn/Google/Lien] [ViewSwitcher: Cards/Table] [Autocall] [Import/Export] [Supprimer]
```

**Code exact** :
```typescript
<div className="flex flex-wrap items-center gap-2">
  {/* Tabs existants */}
  <Tabs value={autoSearchMode} onValueChange={(value) => setAutoSearchMode(value as any)} className="w-auto">
    <TabsList className="h-9">
      <TabsTrigger value="disabled" className="text-xs data-[state=active]:bg-neutral-900 data-[state=active]:text-white dark:data-[state=active]:bg-neutral-100 dark:data-[state=active]:text-neutral-900">
        Désactivé
      </TabsTrigger>
      <TabsTrigger value="linkedin" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-500">
        <Linkedin className="h-3.5 w-3.5 mr-1.5" />
        LinkedIn
      </TabsTrigger>
      <TabsTrigger value="google" className="text-xs data-[state=active]:bg-green-600 data-[state=active]:text-white dark:data-[state=active]:bg-green-500">
        <Globe className="h-3.5 w-3.5 mr-1.5" />
        Google
      </TabsTrigger>
      <TabsTrigger value="link" className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white dark:data-[state=active]:bg-purple-500">
        <Eye className="h-3.5 w-3.5 mr-1.5" />
        Lien
      </TabsTrigger>
    </TabsList>
  </Tabs>
  
  {/* NOUVEAU : ViewSwitcher */}
  <ViewSwitcher
    currentView={viewMode}
    onViewChange={setViewMode}
  />
  
  {/* Reste des boutons existants */}
  <TooltipProvider>
    {/* ... Autocall button ... */}
  </TooltipProvider>
  <ButtonGroup>
    {/* ... Import/Export buttons ... */}
  </ButtonGroup>
  <AlertDialog>
    {/* ... Supprimer button ... */}
  </AlertDialog>
</div>
```

## Considérations spécifiques à Appels 2

### Filtres actifs

Les filtres suivants doivent être préservés lors du changement de vue :
- **Tabs** : Désactivé, LinkedIn, Google, Lien (via `autoSearchMode`)
- **Recherche** : Texte de recherche (via `searchQuery`)
- **Filtre actif** : all, rappel, rdv, status (via `activeFilter`)

### Sélection de contact

- En vue cards : Un seul contact peut être sélectionné à la fois
- En vue table : Même comportement (sélection unique)
- La sélection doit être préservée lors du changement de vue

### Actions disponibles

Toutes les actions de la navbar doivent rester fonctionnelles dans les deux vues :
- Autocall
- Import
- Export
- Supprimer
- Tabs de recherche automatique

### Raccourcis clavier

Les raccourcis clavier (F1-F10) doivent continuer de fonctionner dans la vue table.
