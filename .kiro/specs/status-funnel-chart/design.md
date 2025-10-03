# Design Document

## Overview

Cette fonctionnalité ajoute un nouveau graphique de type pie chart (camembert) au composant `ChartDashboard` pour visualiser l'entonnoir de conversion des contacts. Le graphique agrège les statuts individuels en quatre catégories hiérarchiques (Contacté, Décroché, Argumenté, Pris) et s'intègre avec le système de filtrage de dates existant.

Le design s'appuie sur l'architecture existante du composant `ChartDashboard.tsx`, utilise les mêmes sources de données (`localEvents`), et respecte les patterns UI établis avec shadcn/ui et Recharts.

## Architecture

### Composant Structure

Le nouveau graphique sera intégré directement dans le composant `ChartDashboard` existant, suivant le même pattern que les autres graphiques de la page :

```
ChartDashboard
├── État et hooks existants (startDate, endDate, localEvents)
├── Graphique "Répartition des statuts" (existant)
├── **Nouveau: Graphique "Entonnoir de conversion"** (pie chart)
├── KPIs (4 cards existantes)
└── Graphique "Nombre d'événements par jour" (existant)
```

### Data Flow

```
localEvents (from electron API)
    ↓
useMemo: funnelData calculation
    ↓ (agrégation selon règles métier)
[
  { category: "Contacté", value: X, fill: "var(--chart-1)" },
  { category: "Décroché", value: Y, fill: "var(--chart-2)" },
  { category: "Argumenté", value: Z, fill: "var(--chart-3)" },
  { category: "Pris", value: W, fill: "var(--chart-4)" }
]
    ↓
PieChart (Recharts) + ChartContainer (shadcn)
    ↓
Rendered UI
```

## Components and Interfaces

### 1. Logique d'agrégation des données

**Hook useMemo: `funnelData`**

```typescript
const funnelData = useMemo(() => {
  // Définition des règles d'agrégation
  const statusMapping = {
    'Contacté': ['Mauvais num', 'Répondeur', 'À rappeler', 'Pas intéressé', 'Argumenté', 'D0', 'R0'],
    'Décroché': ['À rappeler', 'Pas intéressé', 'Argumenté', 'D0', 'R0'],
    'Argumenté': ['Argumenté', 'D0', 'R0'],
    'Pris': ['D0', 'R0']
  };

  // Initialisation des compteurs
  const counts = {
    'Contacté': 0,
    'Décroché': 0,
    'Argumenté': 0,
    'Pris': 0
  };

  // Parcours des événements locaux
  localEvents.forEach((event) => {
    const status = String(event.new_status || event.newStatus || '');
    
    // Comptage pour chaque catégorie applicable
    Object.entries(statusMapping).forEach(([category, statuses]) => {
      if (statuses.includes(status)) {
        counts[category]++;
      }
    });
  });

  // Transformation en format pour Recharts
  return [
    { category: 'Contacté', value: counts['Contacté'], fill: 'var(--chart-1)' },
    { category: 'Décroché', value: counts['Décroché'], fill: 'var(--chart-2)' },
    { category: 'Argumenté', value: counts['Argumenté'], fill: 'var(--chart-3)' },
    { category: 'Pris', value: counts['Pris'], fill: 'var(--chart-4)' }
  ];
}, [localEvents]);
```

**Dépendances:** `localEvents` (déjà disponible dans le composant)

**Rationale:** 
- Utilisation de `useMemo` pour optimiser les performances et éviter les recalculs inutiles
- Un événement peut contribuer à plusieurs catégories (ex: un statut "D0" compte dans les 4 catégories)
- Normalisation des noms de propriétés (`new_status` ou `newStatus`) pour gérer les variations de la base de données

### 2. Configuration du graphique

**ChartConfig pour le pie chart:**

```typescript
const funnelConfig = {
  value: { label: 'Événements' },
  'Contacté': { label: 'Contacté', color: 'var(--chart-1)' },
  'Décroché': { label: 'Décroché', color: 'var(--chart-2)' },
  'Argumenté': { label: 'Argumenté', color: 'var(--chart-3)' },
  'Pris': { label: 'Pris', color: 'var(--chart-4)' }
} as const;
```

**Rationale:**
- Utilisation des variables CSS de thème (`--chart-1` à `--chart-4`) pour cohérence avec le design system
- Configuration statique car les catégories sont fixes (contrairement au graphique de répartition qui est dynamique)

### 3. Structure JSX du graphique

```tsx
<Card className="w-full mt-4">
  <CardHeader className="items-center pb-0">
    <CardTitle>Entonnoir de conversion</CardTitle>
    <CardDescription>Progression des contacts par étape</CardDescription>
  </CardHeader>
  <CardContent className="flex-1 pb-0">
    <ChartContainer config={funnelConfig} className="mx-auto aspect-square max-h-[400px]">
      <PieChart>
        <ChartTooltip 
          cursor={false}
          content={<ChartTooltipContent hideLabel />} 
        />
        <Pie
          data={funnelData}
          dataKey="value"
          nameKey="category"
          innerRadius={60}
          strokeWidth={5}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                const total = funnelData.reduce((acc, d) => acc + d.value, 0);
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-3xl font-bold"
                    >
                      {total.toLocaleString()}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground"
                    >
                      Événements
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
    <ChartLegendContent 
      payload={funnelData.map((item) => ({
        value: item.category,
        type: 'rect',
        color: item.fill
      }))}
      className="flex-wrap gap-2 mt-4"
    />
  </CardContent>
</Card>
```

**Rationale:**
- Utilisation d'un donut chart (innerRadius={60}) plutôt qu'un pie chart plein pour afficher le total au centre
- Label central affichant le nombre total d'événements pour contexte immédiat
- Légende personnalisée en dessous du graphique pour clarté
- `aspect-square` et `max-h-[400px]` pour un dimensionnement responsive et cohérent

## Data Models

### Input Data Structure

```typescript
// Structure des événements locaux (déjà existante)
interface LocalEvent {
  new_status?: string;      // Nouveau statut appliqué
  newStatus?: string;       // Variante du nom de propriété
  applied_at?: string;      // Timestamp de l'événement
  dateRDV?: string;         // Date de RDV (pour KPIs)
  dateRappel?: string;      // Date de rappel (pour KPIs)
  dureeAppel?: string;      // Durée d'appel (pour KPIs)
}
```

### Output Data Structure

```typescript
interface FunnelDataPoint {
  category: 'Contacté' | 'Décroché' | 'Argumenté' | 'Pris';
  value: number;           // Nombre d'événements dans cette catégorie
  fill: string;            // Couleur CSS (var(--chart-X))
}

type FunnelData = FunnelDataPoint[];
```

## Error Handling

### Cas limites gérés

1. **Aucun événement disponible:**
   ```typescript
   if (localEvents.length === 0) {
     return (
       <Card className="w-full mt-4">
         <CardHeader className="items-center pb-0">
           <CardTitle>Entonnoir de conversion</CardTitle>
           <CardDescription>Progression des contacts par étape</CardDescription>
         </CardHeader>
         <CardContent className="flex items-center justify-center py-12">
           <p className="text-muted-foreground">Aucune donnée disponible</p>
         </CardContent>
       </Card>
     );
   }
   ```

2. **Statuts inconnus ou invalides:**
   - Les statuts non reconnus sont simplement ignorés (pas d'incrémentation)
   - Pas d'erreur levée pour maintenir la robustesse

3. **Valeurs nulles ou undefined:**
   - Utilisation de `String(event.new_status || event.newStatus || '')` pour normalisation
   - Vérification de chaîne vide avant traitement

4. **Catégories avec valeur 0:**
   - Toutes les catégories sont toujours affichées, même avec valeur 0
   - Permet de voir l'entonnoir complet même sans données dans certaines étapes

## Testing Strategy

### Tests unitaires (optionnels)

1. **Test de la logique d'agrégation:**
   - Vérifier que chaque statut est correctement mappé aux catégories
   - Vérifier qu'un événement "D0" incrémente les 4 catégories
   - Vérifier qu'un événement "Mauvais num" incrémente uniquement "Contacté"

2. **Test des cas limites:**
   - Tableau vide d'événements
   - Événements avec statuts null/undefined
   - Événements avec statuts inconnus

### Tests d'intégration

1. **Intégration avec les filtres de dates:**
   - Vérifier que le graphique se met à jour quand `localEvents` change
   - Vérifier que les filtres de dates affectent correctement les données

2. **Rendu visuel:**
   - Vérifier que le graphique s'affiche correctement
   - Vérifier que les tooltips fonctionnent
   - Vérifier que la légende est correcte

### Tests manuels

1. Appliquer différents filtres de dates et vérifier la cohérence
2. Vérifier le responsive design sur différentes tailles d'écran
3. Tester en mode clair et sombre
4. Vérifier les interactions (hover, tooltips)

## Design Decisions and Rationales

### 1. Choix du Pie Chart (Donut)

**Décision:** Utiliser un donut chart plutôt qu'un bar chart ou autre visualisation.

**Rationale:**
- Demande explicite de l'utilisateur pour un pie chart
- Le donut permet d'afficher le total au centre, donnant un contexte immédiat
- Visualisation intuitive des proportions relatives
- Cohérent avec les patterns de visualisation de données de conversion

### 2. Agrégation cumulative

**Décision:** Un même événement peut contribuer à plusieurs catégories (ex: "D0" compte dans les 4).

**Rationale:**
- Reflète la nature d'entonnoir: chaque étape inclut les étapes suivantes
- Permet de voir la progression: Contacté ≥ Décroché ≥ Argumenté ≥ Pris
- Facilite le calcul de taux de conversion entre étapes

### 3. Positionnement après "Répartition des statuts"

**Décision:** Placer le nouveau graphique juste après le graphique de répartition existant.

**Rationale:**
- Les deux graphiques traitent des statuts, donc logique de les grouper
- Permet une comparaison visuelle entre la vue détaillée (répartition) et la vue agrégée (entonnoir)
- Maintient les KPIs et le graphique temporel ensemble en bas

### 4. Utilisation de useMemo

**Décision:** Calculer `funnelData` dans un `useMemo` avec dépendance sur `localEvents`.

**Rationale:**
- Optimisation des performances: évite les recalculs à chaque render
- `localEvents` change uniquement quand les filtres changent ou au chargement initial
- Pattern cohérent avec les autres calculs du composant (radialData, eventsByDay, etc.)

### 5. Couleurs fixes

**Décision:** Utiliser des couleurs fixes (--chart-1 à --chart-4) plutôt que dynamiques.

**Rationale:**
- Les catégories sont fixes (toujours 4)
- Cohérence visuelle: même catégorie = même couleur à chaque affichage
- Simplifie la configuration et la maintenance

## Integration Points

### 1. Avec le système de filtrage de dates

- **Point d'intégration:** `localEvents` state variable
- **Mécanisme:** Le graphique réagit automatiquement aux changements de `localEvents` via `useMemo`
- **Événement écouté:** `dimicall-date-filter` (déjà géré par le composant parent)

### 2. Avec shadcn/ui

- **Composants utilisés:**
  - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
  - `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegendContent`
- **Variables CSS:** `--chart-1` à `--chart-4`, `--foreground`, `--muted-foreground`

### 3. Avec Recharts

- **Composants utilisés:**
  - `PieChart`, `Pie`, `Label`, `Cell`
- **Props clés:**
  - `data`: funnelData
  - `dataKey`: "value"
  - `nameKey`: "category"
  - `innerRadius`: 60 (pour effet donut)

## Performance Considerations

1. **Memoization:** Utilisation de `useMemo` pour éviter les recalculs inutiles
2. **Données limitées:** Les catégories sont fixes (4 éléments), donc pas de problème de scalabilité
3. **Pas de requêtes supplémentaires:** Utilise les données déjà chargées (`localEvents`)
4. **Rendu conditionnel:** Affichage d'un message si pas de données plutôt que de rendre un graphique vide

## Accessibility Considerations

1. **Tooltips:** Informations accessibles au survol et au focus clavier
2. **Contraste:** Utilisation des variables de thème qui respectent les ratios de contraste
3. **Labels:** Texte clair et descriptif pour le titre et la description
4. **Légende:** Permet de comprendre le graphique sans dépendre uniquement des couleurs
5. **Label central:** Affiche le total pour contexte même sans interaction

## Future Enhancements (hors scope)

1. Affichage des taux de conversion entre étapes (ex: "Décroché: 75% de Contacté")
2. Animation lors du changement de données
3. Export des données d'entonnoir en CSV
4. Comparaison avec période précédente
5. Drill-down: clic sur une catégorie pour voir les statuts détaillés
