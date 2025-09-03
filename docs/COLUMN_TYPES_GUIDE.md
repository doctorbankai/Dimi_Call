# Guide des Types de Colonnes

Ce guide explique comment utiliser le système de gestion des types de colonnes pour l'import de contacts.

## Vue d'ensemble

Le système de types de colonnes permet de :
- **Détecter automatiquement** le type de données de chaque colonne
- **Valider** que les colonnes requises sont présentes
- **Corriger manuellement** les types détectés si nécessaire
- **Assurer la qualité** des données importées

## Composants disponibles

### 1. ColumnTypeSelector

Sélecteur de type de données pour chaque colonne.

```tsx
import { ColumnTypeSelector } from './components/ColumnTypeSelector';

<ColumnTypeSelector
  columnId="telephone"
  columnLabel="Téléphone"
  currentType="phone"
  onTypeChange={(columnId, newType) => {
    // Gérer le changement de type
  }}
/>
```

**Types supportés :**
- `text` - Texte (noms, commentaires)
- `number` - Numéros (ID, quantités)
- `phone` - Numéros de téléphone
- `email` - Adresses email
- `date` - Dates (RDV, rappels)
- `time` - Heures
- `duration` - Durées
- `comment` - Commentaires
- `status` - Statuts
- `unknown` - Non reconnu

### 2. useColumnTypes Hook

Hook personnalisé pour gérer les types de colonnes.

```tsx
import { useColumnTypes } from './hooks/useColumnTypes';

const {
  columnTypes,
  getColumnType,
  updateColumnType,
  resetColumnTypes,
  hasValidType,
  getValidTypeCount
} = useColumnTypes();
```

**Fonctionnalités :**
- Détection automatique basée sur les noms de colonnes
- Persistance dans le localStorage
- Validation des types requis
- Gestion des types inconnus

### 3. ColumnTypesOverview

Vue d'ensemble des types de colonnes détectés.

```tsx
import { ColumnTypesOverview } from './components/ColumnTypesOverview';

<ColumnTypesOverview />
```

**Fonctionnalités :**
- Résumé des types détectés
- Statistiques de validation
- Bouton de réinitialisation
- Conseils d'import

### 4. ColumnTypeValidation

Validation des types pour l'import de contacts.

```tsx
import { ColumnTypeValidation } from './components/ColumnTypeValidation';

<ColumnTypeValidation
  onValidationComplete={(isValid) => {
    // Gérer le résultat de validation
  }}
/>
```

**Critères de validation :**
- ✅ **Requis** : Colonne téléphone + colonne nom/prénom
- 🟡 **Recommandé** : Email, dates, commentaires, statuts
- 📊 **Score** : Calculé de 0 à 100

## Intégration dans ContactTable

### Modification des en-têtes

Les en-têtes de colonnes ont été modifiés pour inclure le sélecteur de type :

```tsx
<TableHead className="h-16">
  <div className="flex flex-col items-center justify-center gap-1 min-h-[40px]">
    {/* Ligne supérieure : Grip + Label + Indicateurs de tri */}
    <div className="flex items-center justify-center gap-1 w-full">
      <GripVertical className="w-3 h-3" />
      <span className="truncate flex-1 text-center text-xs font-medium">
        {column.label}
      </span>
      {/* Indicateurs de tri */}
    </div>
    
    {/* Ligne inférieure : Sélecteur de type */}
    <div className="flex items-center justify-center">
      <ColumnTypeSelector
        columnId={column.id}
        columnLabel={column.label}
        currentType={getColumnType(column.id, column.label)}
        onTypeChange={updateColumnType}
        className="h-5 px-1.5 text-xs"
      />
    </div>
  </div>
</TableHead>
```

### Hauteur des en-têtes

La hauteur des en-têtes a été augmentée de `h-10` à `h-16` pour accommoder le sélecteur de type.

## Détection automatique

### Mapping des noms de colonnes

Le système détecte automatiquement les types basés sur les noms :

```typescript
const AUTO_TYPE_MAPPING = {
  'prenom': 'text',
  'nom': 'text',
  'telephone': 'phone',
  'email': 'email',
  'mail': 'email',
  'dateRappel': 'date',
  'heureRappel': 'time',
  'dureeAppel': 'duration',
  // ... etc
};
```

### Logique de détection

1. **Vérifier** si un type est déjà sauvegardé
2. **Comparer** le nom de la colonne avec le mapping automatique
3. **Retourner** le type détecté ou `'unknown'`

## Utilisation pratique

### 1. Import de données

```tsx
// 1. Charger le fichier
const file = event.target.files[0];

// 2. Analyser les en-têtes
const headers = await parseHeaders(file);

// 3. Détecter automatiquement les types
headers.forEach(header => {
  const detectedType = getColumnType(header.id, header.label);
  // Le type sera automatiquement détecté
});

// 4. Valider avant import
const isValid = hasRequiredTypes();
if (isValid) {
  // Procéder à l'import
} else {
  // Demander à l'utilisateur de corriger les types
}
```

### 2. Correction manuelle

```tsx
// L'utilisateur peut corriger les types via l'interface
const handleTypeChange = (columnId: string, newType: ColumnDataType) => {
  updateColumnType(columnId, newType);
  // Le type est automatiquement sauvegardé
};
```

### 3. Validation continue

```tsx
// La validation se fait en temps réel
useEffect(() => {
  const score = getValidationScore();
  if (score >= 80) {
    setImportReady(true);
  } else {
    setImportReady(false);
  }
}, [columnTypes]);
```

## Personnalisation

### Ajouter de nouveaux types

```typescript
// Dans ColumnTypeSelector.tsx
export type ColumnDataType = 
  | 'text'
  | 'number'
  | 'phone'
  | 'email'
  | 'date'
  | 'time'
  | 'duration'
  | 'comment'
  | 'status'
  | 'unknown'
  | 'custom' // Nouveau type
  ;

// Ajouter dans TYPE_OPTIONS
const TYPE_OPTIONS = [
  // ... types existants
  { 
    value: 'custom', 
    label: 'Personnalisé', 
    icon: CustomIcon, 
    description: 'Type personnalisé' 
  },
];
```

### Modifier la détection automatique

```typescript
// Dans useColumnTypes.ts
const AUTO_TYPE_MAPPING = {
  // ... mapping existant
  'nouvelleColonne': 'custom',
  'autreColonne': 'text',
};
```

### Personnaliser la validation

```typescript
// Dans ColumnTypeValidation.tsx
const REQUIRED_TYPES = {
  'phone': ['phone'],
  'name': ['text'],
  'email': ['email'],
  'custom': ['custom'], // Nouveau type requis
};
```

## Bonnes pratiques

### 1. Noms de colonnes

- Utilisez des noms clairs et descriptifs
- Évitez les abréviations ambiguës
- Respectez la casse (camelCase recommandé)

**Exemples :**
- ✅ `telephone`, `dateRappel`, `heureRDV`
- ❌ `tel`, `date_rappel`, `heure_rdv`

### 2. Types de données

- **Téléphone** : Format international recommandé
- **Dates** : Format YYYY-MM-DD
- **Heures** : Format HH:MM
- **Emails** : Format standard

### 3. Validation

- Testez toujours avec un petit échantillon
- Vérifiez les types avant l'import final
- Utilisez les composants de validation

## Dépannage

### Types non détectés

Si une colonne n'est pas reconnue :

1. Vérifiez le nom de la colonne
2. Ajoutez un mapping personnalisé
3. Utilisez le sélecteur manuel

### Validation échoue

Si la validation échoue :

1. Vérifiez les types requis (téléphone + nom)
2. Corrigez les types incorrects
3. Utilisez l'aperçu pour identifier les problèmes

### Performance

Pour de grandes tables :

1. Limitez le nombre de colonnes visibles
2. Utilisez la virtualisation si nécessaire
3. Optimisez la détection automatique

## Exemples complets

### Composant de démonstration

Voir `ColumnTypesDemo.tsx` pour un exemple complet d'utilisation.

### Intégration dans une application

```tsx
import { ContactTable } from './components/ContactTable';
import { ColumnTypesOverview } from './components/ColumnTypesOverview';
import { ColumnTypeValidation } from './components/ColumnTypeValidation';

function App() {
  return (
    <div className="app">
      <header>
        <h1>Gestion des Contacts</h1>
      </header>
      
      <main>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table principale */}
          <div className="lg:col-span-2">
            <ContactTable {...tableProps} />
          </div>
          
          {/* Panneau latéral */}
          <div className="space-y-4">
            <ColumnTypesOverview />
            <ColumnTypeValidation />
          </div>
        </div>
      </main>
    </div>
  );
}
```

## Support et maintenance

### Mise à jour des composants

Les composants utilisent shadcn/ui et peuvent être mis à jour avec :

```bash
pnpm dlx shadcn@latest add [component-name]
```

### Tests

Testez toujours les composants avec :
- Différents types de données
- Noms de colonnes variés
- Cas d'erreur et edge cases

### Documentation

Maintenez cette documentation à jour lors des modifications des composants.
