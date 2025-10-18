# Correction de la gestion des onglets dans la page Appels (mode Table)

## Problème identifié

Dans la page Appels en mode Table, le sélecteur d'onglets affichait des notifications "non disponible dans cette vue" pour :
- L'ajout d'onglet
- L'édition d'onglet
- La suppression d'onglet

Ces fonctionnalités étaient pourtant bien implémentées dans `App.tsx` mais n'étaient pas connectées au composant `AppelsCardsView.tsx`.

## Solution implémentée

### 1. Ajout du type TableTab dans AppelsCardsView.tsx

```typescript
export type TableTab = {
  id: string
  name: string
  color?: string
  contacts: Contact[]
}
```

### 2. Extension de l'interface AppelsCardsViewProps

Ajout des props pour la gestion des onglets :
```typescript
// Props pour la gestion des onglets
tableTabs?: TableTab[]
activeTableTabId?: string
onSetActiveTableTabId?: (id: string) => void
onAddTab?: () => void
onEditTab?: (tab: TableTab) => void
onDeleteTab?: (tabId: string) => void
```

### 3. Création des fonctions de gestion dans App.tsx

```typescript
const handleAddTab = () => {
  if (tableTabs.length >= 5) return
  const id = crypto.randomUUID()
  setTableTabs(prev => [...prev, { id, name: `Onglet ${prev.length + 1}`, contacts: [] }])
  setActiveTableTabId(id)
}

const handleDeleteTab = (tabId: string) => {
  setTableTabs(prev => {
    const next = prev.filter(t => t.id !== tabId)
    
    // Si c'était le dernier onglet, créer un nouvel onglet vide
    if (next.length === 0) {
      const newTabId = crypto.randomUUID()
      const newTab = { id: newTabId, name: 'Nouveau', contacts: [] }
      setActiveTableTabId(newTabId)
      return [newTab]
    }
    
    // Sinon, passer à l'onglet suivant
    if (resolvedActiveTabId === tabId) {
      setActiveTableTabId(next[0]?.id || '')
    }
    return next
  })
}
```

### 4. Remplacement du dropdown statique par un dropdown dynamique

Le dropdown affiche maintenant :
- La liste de tous les onglets avec leur nom et couleur
- Un bouton d'édition pour chaque onglet
- Un bouton de suppression pour chaque onglet
- Un bouton d'ajout d'onglet (limité à 5 onglets)
- Le bouton de suppression complète des données

### 5. Passage des props au composant AppelsCardsView

```typescript
<AppelsCardsView
  // ... autres props
  tableTabs={tableTabs}
  activeTableTabId={resolvedActiveTabId}
  onSetActiveTableTabId={setActiveTableTabId}
  onAddTab={handleAddTab}
  onEditTab={handleEditTab}
  onDeleteTab={handleDeleteTab}
/>
```

## Résultat

Les fonctionnalités de gestion des onglets sont maintenant pleinement fonctionnelles dans la page Appels :

### Mode Table (vue principale)
- ✅ Ajout d'onglet
- ✅ Édition d'onglet (nom et couleur)
- ✅ Suppression d'onglet
- ✅ Changement d'onglet actif
- ✅ Affichage du nom et de la couleur de l'onglet actif

### Mode Cards (panneau latéral)
- ✅ Ajout d'onglet
- ✅ Édition d'onglet (nom et couleur)
- ✅ Suppression d'onglet
- ✅ Changement d'onglet actif
- ✅ Affichage du nom et de la couleur de l'onglet actif dans le header du panneau

Les deux vues (Cards et Table) partagent le même état et les mêmes fonctionnalités de gestion des onglets.

## Fichiers modifiés

- `src/components/AppelsCardsView.tsx` : Ajout du type TableTab, des props et remplacement du dropdown
- `src/App.tsx` : Création des fonctions handleAddTab et handleDeleteTab, passage des props
