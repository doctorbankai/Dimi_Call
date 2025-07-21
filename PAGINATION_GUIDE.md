# Guide d'utilisation du système de pagination

Ce guide explique comment utiliser le système de pagination moderne et ergonomique créé avec les composants shadcn/ui.

## Composants disponibles

### 1. `TablePagination` - Composant de pagination principal

Composant de pagination complet avec sélection de limite de lignes par page.

**Fonctionnalités :**
- Navigation par pages avec boutons Précédent/Suivant
- Boutons Première/Dernière page
- Sélection du nombre de lignes par page (25, 50)
- Affichage des informations de pagination
- Points de suspension (...) pour les grandes listes
- Design moderne avec shadcn/ui

**Props :**
```typescript
interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  pageSizeOptions?: number[]; // Par défaut: [25, 50]
  showFirstLast?: boolean; // Par défaut: true
  showPageInfo?: boolean; // Par défaut: true
  className?: string;
}
```

### 2. `usePagination` - Hook personnalisé

Hook React qui gère toute la logique de pagination.

**Fonctionnalités :**
- Calcul automatique des pages
- Extraction des données paginées
- Navigation entre les pages
- Changement du nombre d'éléments par page
- Maintien de la position lors du changement de taille

**Utilisation :**
```typescript
const {
  currentPage,
  totalPages,
  itemsPerPage,
  paginatedData,
  totalItems,
  goToPage,
  setItemsPerPage,
  canGoNext,
  canGoPrevious,
} = usePagination({
  data: yourDataArray,
  initialItemsPerPage: 25,
  initialPage: 1,
});
```

### 3. `PaginatedContactTable` - Intégration avec ContactTable

Composant qui combine la table de contacts existante avec la pagination.

## Exemples d'utilisation

### Exemple simple avec une table basique

```tsx
import React, { useState } from 'react';
import { TablePagination } from './components/TablePagination';
import { usePagination } from './hooks/usePagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const MyTable = () => {
  const [data] = useState(yourDataArray);
  
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedData,
    totalItems,
    goToPage,
    setItemsPerPage,
  } = usePagination({
    data,
    initialItemsPerPage: 25,
  });

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            {/* Autres colonnes */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.email}</TableCell>
              {/* Autres cellules */}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={goToPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </div>
  );
};
```

### Exemple avec la table de contacts existante

```tsx
import { PaginatedContactTable } from './components/PaginatedContactTable';

const App = () => {
  return (
    <PaginatedContactTable
      contacts={contacts}
      callStates={callStates}
      onSelectContact={handleRowSelection}
      selectedContactId={selectedContact?.id || null}
      onUpdateContact={updateContact}
      onDeleteContact={handleDeleteContact}
      activeCallContactId={activeCallContactId}
      theme={theme}
      visibleColumns={visibleColumns}
      columnHeaders={availableColumns}
      contactDataKeys={availableDataKeys}
      onToggleColumnVisibility={handleToggleColumnVisibility}
      initialItemsPerPage={25}
      pageSizeOptions={[25, 50]}
    />
  );
};
```

## Personnalisation

### Options de taille de page

Vous pouvez personnaliser les options de taille de page :

```tsx
<TablePagination
  // ... autres props
  pageSizeOptions={[10, 25, 50, 100, 200]}
/>
```

### Masquer certains éléments

```tsx
<TablePagination
  // ... autres props
  showFirstLast={false} // Masquer les boutons première/dernière page
  showPageInfo={false}  // Masquer les informations "X-Y sur Z"
/>
```

### Styling personnalisé

```tsx
<TablePagination
  // ... autres props
  className="my-custom-pagination-class"
/>
```

## Intégration dans l'application existante

Pour intégrer la pagination dans votre application :

1. **Remplacer la table existante :**
   ```tsx
   // Avant
   <ContactTable {...props} />
   
   // Après
   <PaginatedContactTable {...props} initialItemsPerPage={25} />
   ```

2. **Ou utiliser les composants séparément :**
   ```tsx
   const MyComponent = () => {
     const pagination = usePagination({ data: myData });
     
     return (
       <div>
         <MyTable data={pagination.paginatedData} />
         <TablePagination {...pagination} />
       </div>
     );
   };
   ```

## Avantages

- **Performance :** Seules les lignes visibles sont rendues
- **UX moderne :** Interface intuitive avec sélection de taille de page
- **Responsive :** S'adapte aux différentes tailles d'écran
- **Accessible :** Conforme aux standards d'accessibilité
- **Personnalisable :** Facile à adapter selon vos besoins
- **Type-safe :** Entièrement typé avec TypeScript

## Notes techniques

- Le hook `usePagination` maintient automatiquement la position lors du changement de taille de page
- La pagination gère automatiquement les cas limites (pages vides, données manquantes)
- Les composants utilisent les styles shadcn/ui pour une cohérence visuelle
- Compatible avec les thèmes sombre/clair
- **Header sticky** : Le header de la table reste fixe lors du scroll (corrigé dans ContactTable.tsx)
- **Performance optimisée** : Seules les données de la page courante sont rendues