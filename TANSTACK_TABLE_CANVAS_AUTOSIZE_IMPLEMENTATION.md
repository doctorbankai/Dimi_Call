# 🎯 Implémentation TanStack Table + Canvas Autosize (Excel-like)

## 📋 Analyse du Problème Actuel

### Constat
Le système actuel utilise :
- ❌ **Pas de TanStack Table** pour le sizing des colonnes (seulement `@tanstack/react-virtual` pour les lignes)
- ❌ **Calcul maison** `calculateResponsiveWidths` avec heuristique chars→px imprécise
- ❌ **Bornes statiques** trop restrictives (min/preferred * 1.5)
- ❌ **Pas de mesure réelle** du contenu → truncate systématique

### Résultat
Les cellules sont **systématiquement tronquées** car les largeurs calculées ne correspondent pas au contenu réel.

## ✅ Solution : TanStack Table v8 + Canvas measureText

### Principe (comme Excel)
1. **Mesurer** le texte réel avec Canvas API (précision pixel-perfect)
2. **Piloter** les largeurs via TanStack Table `columnSizing` state
3. **Distribuer** l'espace disponible intelligemment
4. **Recalculer** automatiquement sur resize/data change

## 🔧 Plan d'Implémentation Détaillé

### Étape 1 : Créer l'utilitaire de mesure Canvas

**Fichier** : `src/utils/measureText.ts` (nouveau)

```typescript
/**
 * Utilitaire de mesure de texte précis via Canvas API
 * Équivalent à Excel AutoFit
 */

export interface TextMeasurer {
  measure: (text: string) => number;
  clearCache: () => void;
}

export function createTextMeasurer(
  font = '12px Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
): TextMeasurer {
  // Créer canvas hors-DOM pour mesures
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context not available');
  }
  
  ctx.font = font;
  
  // Cache pour éviter mesures répétées
  const cache = new Map<string, number>();
  
  return {
    measure: (text: string): number => {
      const key = text || '';
      
      if (cache.has(key)) {
        return cache.get(key)!;
      }
      
      const width = Math.ceil(ctx.measureText(key).width);
      cache.set(key, width);
      
      return width;
    },
    
    clearCache: () => {
      cache.clear();
    }
  };
}

/**
 * Mesure la largeur optimale pour une colonne
 * @param texts - Échantillon de textes à mesurer
 * @param measurer - Instance de TextMeasurer
 * @param padding - Padding cellulaire (px-3 = 16px)
 * @param widgetPadding - Espace pour widgets (boutons, icônes)
 * @param minSize - Largeur minimale
 * @param maxSize - Largeur maximale
 */
export function measureColumnWidth(
  texts: string[],
  measurer: TextMeasurer,
  options: {
    padding?: number;
    widgetPadding?: number;
    minSize?: number;
    maxSize?: number;
  } = {}
): number {
  const {
    padding = 24,        // px-3 = 12px * 2 + marge
    widgetPadding = 0,
    minSize = 80,
    maxSize = 800
  } = options;
  
  if (texts.length === 0) {
    return minSize;
  }
  
  // Mesurer tous les textes
  const widths = texts.map(text => measurer.measure(text));
  
  // Prendre le maximum
  const maxTextWidth = Math.max(...widths, 0);
  
  // Ajouter padding + widgets
  const totalWidth = maxTextWidth + padding + widgetPadding;
  
  // Clamp entre min et max
  return Math.floor(Math.max(minSize, Math.min(totalWidth, maxSize)));
}
```

### Étape 2 : Créer le hook d'autosize

**Fichier** : `src/hooks/useColumnAutosize.ts` (nouveau)

```typescript
import { useMemo, useLayoutEffect, useState, useRef } from 'react';
import { Contact } from '../types';
import { createTextMeasurer, measureColumnWidth } from '../utils/measureText';

export interface ColumnSizeConfig {
  id: string;
  label: string;
  minSize: number;
  maxSize: number;
  widgetPadding: number;
}

export interface UseColumnAutosizeOptions {
  data: Contact[];
  columns: ColumnSizeConfig[];
  sampleSize?: number;
  enabled?: boolean;
}

export interface ColumnSizes {
  [columnId: string]: number;
}

export function useColumnAutosize({
  data,
  columns,
  sampleSize = 50,
  enabled = true
}: UseColumnAutosizeOptions): ColumnSizes {
  const [sizes, setSizes] = useState<ColumnSizes>({});
  const measurerRef = useRef(createTextMeasurer());
  
  useLayoutEffect(() => {
    if (!enabled || data.length === 0 || columns.length === 0) {
      return;
    }
    
    const measurer = measurerRef.current;
    const newSizes: ColumnSizes = {};
    
    // Échantillonner les données
    const sample = data.slice(0, Math.min(sampleSize, data.length));
    
    // Mesurer chaque colonne
    for (const col of columns) {
      const texts: string[] = [];
      
      // Ajouter le header
      texts.push(col.label);
      
      // Extraire les textes de l'échantillon
      for (const row of sample) {
        let text = '';
        
        switch (col.id) {
          case 'index':
            text = String(data.indexOf(row) + 1);
            break;
          case 'prenom':
            text = row.prenom || 'N/A';
            break;
          case 'nom':
            text = row.nom || 'N/A';
            break;
          case 'telephone':
            text = row.telephone || 'N/A';
            break;
          case 'email':
            // Limiter à 50 chars pour mesure
            text = (row.email || 'N/A').substring(0, 50);
            break;
          case 'source':
            text = row.source || 'N/A';
            break;
          case 'commentaire':
            // Limiter à 100 chars pour mesure
            text = (row.commentaire || 'Commentaire...').substring(0, 100);
            break;
          case 'lien':
            // Limiter à 80 chars pour mesure
            text = (row.lien || 'N/A').substring(0, 80);
            break;
          case 'statut':
            text = row.statut || 'Non défini';
            break;
          case 'dateRappel':
          case 'dateRDV':
          case 'dateAppel':
            text = row[col.id as keyof Contact] as string || '00/00/00';
            break;
          case 'heureRappel':
          case 'heureRDV':
          case 'heureAppel':
            text = row[col.id as keyof Contact] as string || '00:00';
            break;
          case 'dureeAppel':
            text = row.dureeAppel || '0s';
            break;
          default:
            text = String((row as any)[col.id] || 'N/A');
        }
        
        texts.push(text);
      }
      
      // Mesurer la largeur optimale
      const width = measureColumnWidth(texts, measurer, {
        padding: 24,
        widgetPadding: col.widgetPadding,
        minSize: col.minSize,
        maxSize: col.maxSize
      });
      
      newSizes[col.id] = width;
    }
    
    setSizes(newSizes);
    
    // Cleanup
    return () => {
      measurer.clearCache();
    };
  }, [data, columns, sampleSize, enabled]);
  
  return sizes;
}
```

### Étape 3 : Intégrer TanStack Table dans VirtualizedContactTable

**Modifications dans** : `src/components/VirtualizedContactTable.tsx`

#### 3.1 Imports

```typescript
// Ajouter ces imports
import { useReactTable, getCoreRowModel, ColumnDef } from '@tanstack/react-table';
import { useColumnAutosize } from '../hooks/useColumnAutosize';
```

#### 3.2 Définir les colonnes TanStack

```typescript
// Remplacer la section dynamicColumns par :
const tanstackColumns = useMemo<ColumnDef<Contact>[]>(() => {
  return dynamicColumns.map(col => ({
    id: col.id,
    header: col.label,
    accessorKey: col.key === 'index' ? undefined : col.key,
    accessorFn: col.key === 'index' 
      ? (row) => contacts.indexOf(row) + 1
      : undefined,
    enableResizing: true,
    minSize: COLUMN_RESIZE_CONFIG.fixed[col.label as keyof typeof COLUMN_RESIZE_CONFIG.fixed] 
      || COLUMN_RESIZE_CONFIG.flexible[col.label as keyof typeof COLUMN_RESIZE_CONFIG.flexible]?.min 
      || 80,
    maxSize: 800,
    size: undefined, // Laisse TanStack décider
    meta: {
      label: col.label,
      icon: col.icon,
      canSort: col.canSort
    }
  }));
}, [dynamicColumns, contacts]);
```

#### 3.3 Configuration du sizing

```typescript
// Préparer la config pour autosize
const columnSizeConfigs = useMemo(() => {
  return visibleOrderedColumns.map(col => ({
    id: col.id,
    label: col.label,
    minSize: COLUMN_RESIZE_CONFIG.fixed[col.label as keyof typeof COLUMN_RESIZE_CONFIG.fixed]
      || COLUMN_RESIZE_CONFIG.flexible[col.label as keyof typeof COLUMN_RESIZE_CONFIG.flexible]?.min
      || 80,
    maxSize: 800,
    widgetPadding: 
      col.id === 'statut' ? 120 :
      col.id === 'dateRappel' ? 32 : // Bouton Bell
      col.id === 'commentaire' ? 32 : // Bouton Zap
      col.id.includes('date') ? 16 :
      col.id.includes('heure') ? 16 :
      0
  }));
}, [visibleOrderedColumns]);

// Calculer les tailles automatiques
const autoSizes = useColumnAutosize({
  data: sortedContacts,
  columns: columnSizeConfigs,
  sampleSize: 50,
  enabled: true
});
```

#### 3.4 State TanStack Table

```typescript
// State pour column sizing
const [columnSizing, setColumnSizing] = useState<Record<string, number>>({});

// Instancier TanStack Table
const table = useReactTable({
  data: sortedContacts,
  columns: tanstackColumns,
  state: {
    columnSizing
  },
  onColumnSizingChange: setColumnSizing,
  columnResizeMode: 'onChange',
  getCoreRowModel: getCoreRowModel(),
  // On n'utilise pas le rowModel interne (on garde virtualizer)
  enableRowSelection: false,
  enableSorting: false // On garde notre tri custom
});
```

#### 3.5 Appliquer les autoSizes

```typescript
// Synchroniser autoSizes avec columnSizing
useLayoutEffect(() => {
  if (Object.keys(autoSizes).length > 0) {
    setColumnSizing(prev => ({
      ...prev,
      ...autoSizes
    }));
  }
}, [autoSizes]);
```

#### 3.6 Utiliser les tailles dans le rendu

```typescript
// Dans le rendu des headers et cellules, remplacer :
// style={{ width: column.calculatedWidth, ... }}

// Par :
const tanstackCol = table.getColumn(column.id);
const colSize = tanstackCol?.getSize() ?? 100;

style={{
  width: `${colSize}px`,
  minWidth: `${colSize}px`,
  maxWidth: `${colSize}px`,
  flexShrink: 0
}}
```

### Étape 4 : Configuration des largeurs par colonne

**Mise à jour** : `COLUMN_RESIZE_CONFIG`

```typescript
// Ajuster les min/max pour être plus permissifs
const COLUMN_RESIZE_CONFIG = {
  fixed: {
    '#': 50,
    'Statut': 120,
    'Date Rappel': 110,
    'Heure Rappel': 80,
    'Date RDV': 110,
    'Heure RDV': 80,
    'Date Appel': 110,
    'Heure Appel': 80,
    'Durée Appel': 70,
    'Sexe': 60,
    'Don': 60,
    'Type': 80,
    'Qualité': 80,
    'Date': 100,
    'UID': 100
  },
  
  flexible: {
    'Prénom': { min: 100, max: 250 },
    'Nom': { min: 100, max: 250 },
    'Téléphone': { min: 120, max: 200 },
    'Mail': { min: 180, max: 500 },      // ✅ Augmenté max
    'Source': { min: 100, max: 250 },
    'Commentaire': { min: 250, max: 600 }, // ✅ Augmenté max
    'Lien': { min: 140, max: 400 }        // ✅ Augmenté max
  }
} as const;
```

## 📊 Résultats Attendus

### Avant (Heuristique)
```
Mail: louis.franchois@gmail.com
  → Largeur: 250px (statique)
  → Affichage: "louis.franch..." ❌

Commentaire: "Commentaire long et détaillé..."
  → Largeur: 350px (statique)
  → Affichage: "Commentaire l..." ❌
```

### Après (Canvas Measure)
```
Mail: louis.franchois@gmail.com
  → Mesure Canvas: 285px
  → Largeur: 285px (précise)
  → Affichage: "louis.franchois@gmail.com" ✅

Commentaire: "Commentaire long et détaillé..."
  → Mesure Canvas: 420px
  → Largeur: 420px (précise)
  → Affichage: "Commentaire long et détaillé..." ✅
```

## 🎯 Checklist d'Implémentation

### Phase 1 : Utilitaires (30 min)
- [ ] Créer `src/utils/measureText.ts`
- [ ] Créer `src/hooks/useColumnAutosize.ts`
- [ ] Tester la mesure Canvas avec quelques exemples

### Phase 2 : Intégration TanStack (1h)
- [ ] Ajouter imports TanStack Table
- [ ] Créer `tanstackColumns` definition
- [ ] Configurer `useReactTable` avec columnSizing
- [ ] Créer `columnSizeConfigs` pour autosize
- [ ] Appeler `useColumnAutosize` hook

### Phase 3 : Rendu (30 min)
- [ ] Remplacer `column.calculatedWidth` par `table.getColumn().getSize()`
- [ ] Appliquer dans headers
- [ ] Appliquer dans body cells
- [ ] Vérifier alignement pixel-perfect

### Phase 4 : Tests (30 min)
- [ ] Tester avec emails longs
- [ ] Tester avec commentaires longs
- [ ] Tester avec liens longs
- [ ] Vérifier performance (< 50ms)
- [ ] Tester resize window
- [ ] Tester changement de données

## 🚀 Performance

### Optimisations Incluses
- ✅ **Cache Canvas** : Évite mesures répétées
- ✅ **Échantillonnage** : Max 50 lignes mesurées
- ✅ **useLayoutEffect** : Pas de flash visuel
- ✅ **Memoization** : Recalcul seulement si data/columns changent
- ✅ **Debouncing** : Resize events débounced (déjà implémenté)

### Métriques Attendues
- **Temps de calcul** : < 50ms pour 50 lignes
- **Précision** : ±2px (précision Canvas)
- **Mémoire** : Cache ~1-2MB max
- **FPS** : 60fps maintenu

## 📝 Notes Importantes

### Widgets à Prendre en Compte
```typescript
widgetPadding:
  - StatusSelect: 120px (badge + padding)
  - DateRappel: 32px (bouton Bell)
  - Commentaire: 32px (bouton Zap)
  - Date/Heure: 16px (icône calendrier/horloge)
```

### Police à Utiliser
```typescript
font = '12px Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
```

### Limites de Texte pour Mesure
```typescript
- Email: 50 chars max
- Commentaire: 100 chars max
- Lien: 80 chars max
```

## 🔄 Alternative Simplifiée (Si TanStack trop complexe)

Si l'intégration TanStack Table est trop lourde, tu peux :

1. **Garder** le système actuel `calculateResponsiveWidths`
2. **Remplacer** l'heuristique chars→px par mesure Canvas
3. **Utiliser** `useColumnAutosize` pour calculer les largeurs
4. **Appliquer** directement dans `calculatedWidth`

```typescript
// Dans calculateResponsiveWidths
const autoSizes = useColumnAutosize({ data, columns, sampleSize: 50 });

return visibleCols.map(col => ({
  ...col,
  calculatedWidth: `${autoSizes[col.id] || 100}px`
}));
```

## ✅ Résultat Final

Avec cette implémentation, tu auras :
- ✅ **Mesure précise** comme Excel (Canvas API)
- ✅ **Pas de truncate** inutile
- ✅ **Performance** maintenue (< 50ms)
- ✅ **Responsive** automatique
- ✅ **Maintenable** (TanStack Table standard)

**La table sera enfin parfaite !** 🎉

---

**Temps d'implémentation estimé** : 2-3 heures  
**Complexité** : Moyenne  
**Impact** : Majeur (résout le problème définitivement)
