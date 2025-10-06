# Correction de l'ordre des colonnes et navigation après import

## Modifications effectuées

### 1. Ordre automatique des colonnes après import ✅

**Fichier**: `src/services/dataService.ts`

Ajout de deux nouvelles fonctions pour réordonner automatiquement les colonnes après l'import:

```typescript
export const reorderContactColumns = (contact: Contact): Contact
export const reorderContactsColumns = (contacts: Contact[]): Contact[]
```

**Ordre des colonnes défini**:
1. # (numéro de ligne)
2. Prénom
3. Nom
4. Téléphone
5. Mail
6. Source
7. Type
8. Qualité
9. Lien
10. Date Rappel
11. Heure Rappel
12. Date Appel
13. Heure Appel
14. Statut
15. Commentaire
16. Date RDV
17. Heure RDV
18. Durée Appel
19. Sexe
20. Don
21. Date
22. UID
23. Actions
24. Le reste (colonnes non spécifiées conservent leur ordre original)

**Note**: Si une colonne n'existe pas dans les données importées, elle est simplement ignorée (skip).

### 2. Correction de la navigation après import ✅

**Fichier**: `src/App.tsx`

**Problème**: Lors de l'import depuis la page "Appels 2", l'application basculait automatiquement vers la page "Appels".

**Solution**: Modification de la logique dans **deux endroits** pour conserver la vue actuelle si on est déjà sur "Appels 2":

**Endroit 1** (ligne ~1193):
```typescript
// Maintenir les colonnes détectées en mettant aussi à jour le global
setContacts(updatedContacts);
// Ne pas changer de vue si on est déjà sur "Appels 2" (appels-cards)
if (viewMode !== 'appels-cards') {
  setViewMode('table');
}
```

**Endroit 2** (ligne ~1590):
```typescript
setContacts(updatedContacts) // maintenir la liste globale en cohérence
// Ne pas changer de vue si on est déjà sur "Appels 2" (appels-cards)
if (viewMode !== 'appels-cards') {
  setViewMode('table')
}
```

**Comportement**:
- Import depuis "Appels" → reste sur "Appels"
- Import depuis "Appels 2" → reste sur "Appels 2" ✨
- Import depuis toute autre page → bascule vers "Appels"

### 3. Ajout des badges "Preview" ✅

**Fichier**: `src/components/AppSidebar.tsx`

Ajout de badges "Preview" à côté des noms des pages suivantes dans la sidebar:
- **Appels 2** → Badge "Preview"
- **Calendrier 2** → Badge "Preview"
- **Annuaire** → Badge "Preview"

Les badges sont:
- Visibles en mode sidebar étendu
- Cachés en mode sidebar réduit (icon only)
- Style: variant "secondary", taille 10px, hauteur 4

## Intégration dans le flux d'import

Le réordonnancement des colonnes est appliqué automatiquement lors de l'événement `dimicall-imported-contacts`:

```typescript
// 1. Réception des contacts importés
const { contacts: newContacts, fileName, source } = e.detail;

// 2. Réordonnancement automatique des colonnes
const { reorderContactsColumns } = await import('./services/dataService');
const reorderedContacts = reorderContactsColumns(newContacts);

// 3. Traitement et sauvegarde
const updatedContacts = reorderedContacts.map((c, idx) => ({
  ...c,
  numeroLigne: idx + 1,
  id: c.id || uuidv4()
}));
```

## Tests recommandés

1. **Test d'import depuis Appels 2**:
   - Aller sur la page "Appels 2"
   - Importer un fichier CSV/Excel
   - Vérifier que la page reste sur "Appels 2"
   - Basculer en vue "Table" et vérifier l'ordre des colonnes

2. **Test d'ordre des colonnes**:
   - Importer un fichier avec toutes les colonnes
   - Vérifier que l'ordre est: Prénom, Nom, Numéro, Mail, Source, Type, Qualité, Lien, Date Rappel, Heure Rappel, Date Appel, Heure Appel, Statut, ...
   - Importer un fichier avec seulement quelques colonnes
   - Vérifier que les colonnes manquantes sont ignorées sans erreur

3. **Test des badges Preview**:
   - Vérifier que les badges "Preview" apparaissent à côté de "Appels 2", "Calendrier 2" et "Annuaire"
   - Réduire la sidebar et vérifier que les badges disparaissent
   - Étendre la sidebar et vérifier que les badges réapparaissent

## Notes techniques

- Le réordonnancement préserve toutes les données, il ne fait que réorganiser l'ordre des propriétés de l'objet
- Les colonnes non spécifiées dans l'ordre sont ajoutées à la fin dans leur ordre original
- La fonction est performante car elle utilise une seule passe sur les données
- Le code est compatible avec tous les formats d'import (CSV, TSV, Excel)


## 🔧 Correction finale: Système de versioning pour l'ordre des colonnes

### Problème identifié
Le tableau a une fonctionnalité de drag & drop qui sauvegarde l'ordre personnalisé des colonnes dans le localStorage (`dimicall-column-order`). Même après avoir modifié `COLUMN_HEADERS` dans `constants.tsx`, l'ancien ordre personnalisé persistait car il était chargé depuis le localStorage.

### Solution implémentée

**Fichier**: `src/components/ContactTable.tsx`

Ajout d'un système de versioning qui force la réinitialisation de l'ordre des colonnes quand la définition change:

```typescript
const COLUMN_ORDER_VERSION_KEY = 'dimicall-column-order-version';
const COLUMN_ORDER_VERSION = '2.0'; // Incrémenter pour forcer la réinitialisation
```

**Logique**:
1. Au chargement du composant, on vérifie la version sauvegardée
2. Si la version ne correspond pas à `COLUMN_ORDER_VERSION`, on:
   - Réinitialise l'ordre des colonnes selon `COLUMN_HEADERS`
   - Sauvegarde la nouvelle version
   - Supprime l'ancien ordre personnalisé

**Code ajouté**:
```typescript
// Vérifier la version de l'ordre des colonnes
const savedVersion = localStorage.getItem(COLUMN_ORDER_VERSION_KEY);

// Si la version a changé, réinitialiser l'ordre
if (savedVersion !== COLUMN_ORDER_VERSION) {
  console.log('[ContactTable] Version de l\'ordre des colonnes changée, réinitialisation...');
  localStorage.setItem(COLUMN_ORDER_VERSION_KEY, COLUMN_ORDER_VERSION);
  localStorage.removeItem(COLUMN_ORDER_STORAGE_KEY);
  setColumnOrder(dynamicColumns.map(col => col.id));
  return;
}
```

### Résultat
✅ Au prochain chargement de la page, l'ordre des colonnes sera automatiquement réinitialisé selon le nouvel ordre défini dans `COLUMN_HEADERS`:
- # → Prénom → Nom → Téléphone → Mail → Source → Type → Qualité → Lien → Date Rappel → Heure Rappel → Date Appel → Heure Appel → Statut → Commentaire → etc.

### Pour forcer une réinitialisation future
Si tu dois changer l'ordre des colonnes à nouveau, il suffit d'incrémenter `COLUMN_ORDER_VERSION` (par exemple `'2.1'`, `'3.0'`, etc.) dans `ContactTable.tsx`.
