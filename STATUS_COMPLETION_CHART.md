# Graphique de Complétion des Statuts

## Vue d'ensemble

Un graphique radial a été ajouté pour afficher le pourcentage de complétion des statuts dans la page "Appels". Ce graphique montre visuellement combien de contacts ont un statut défini (différent de "Non défini").

## Composant créé

### `StatusCompletionChart.tsx`

Un composant React réutilisable qui :
- Calcule automatiquement le pourcentage de contacts avec un statut défini
- Affiche un graphique radial avec le pourcentage au centre
- Supporte deux modes d'affichage : compact et complet
- Utilise les composants shadcn/ui pour un design cohérent

#### Props

```typescript
interface StatusCompletionChartProps {
  contacts: Contact[]      // Liste des contacts à analyser
  className?: string       // Classes CSS personnalisées
  compact?: boolean        // Mode compact (true) ou complet (false)
}
```

#### Modes d'affichage

**Mode compact** (`compact={true}`) :
- Graphique plus petit (120px max)
- Affiche uniquement le pourcentage
- Idéal pour les barres d'outils

**Mode complet** (`compact={false}`) :
- Graphique plus grand (200px max)
- Affiche le pourcentage et le ratio (ex: 45/100)
- Inclut un footer avec des statistiques détaillées
- Affiche dans une Card avec titre et description

## Intégration

Le graphique a été intégré dans deux emplacements de la page "Appels" :

### 1. Vue Cards (Mode Cartes)

**Emplacement** : Barre d'en-tête principale, à gauche des onglets de mode de recherche

```tsx
<div className="flex flex-wrap items-center gap-2">
  <StatusCompletionChart contacts={contacts} compact className="flex-shrink-0" />
  {/* Autres boutons... */}
</div>
```

### 2. Vue Table (Mode Tableau)

**Emplacement** : Barre de contrôle du tableau, à gauche des autres contrôles

```tsx
<div className="flex items-center gap-2 flex-1 min-w-0">
  <StatusCompletionChart contacts={contacts} compact className="flex-shrink-0" />
  {/* Autres contrôles... */}
</div>
```

## Calcul du pourcentage

Le pourcentage est calculé comme suit :

```typescript
const withStatus = contacts.filter(
  (c) => c.statut && c.statut !== ContactStatus.NonDefini
).length

const percentage = Math.round((withStatus / total) * 100)
```

**Statuts considérés comme "définis"** :
- Mauvais num
- Répondeur
- À rappeler
- Pas intéressé
- Argumenté
- DO
- RO
- Liste noire
- Prématuré
- A0

**Statut considéré comme "non défini"** :
- Non défini

## Fonctionnalités

✅ Mise à jour automatique en temps réel
✅ Calcul dynamique basé sur la liste de contacts actuelle
✅ Design responsive et adaptatif
✅ Support du mode sombre
✅ Animation fluide du graphique radial
✅ Affichage des statistiques détaillées

## Utilisation

Le graphique se met à jour automatiquement lorsque :
- Un contact change de statut
- Des contacts sont ajoutés ou supprimés
- La liste de contacts est filtrée

Aucune action utilisateur n'est requise, le graphique reflète toujours l'état actuel de la liste.

## Design

Le graphique utilise :
- **Couleur primaire** : `hsl(var(--primary))` pour la barre de progression
- **Couleur de fond** : `muted` pour la partie non complétée
- **Typographie** : Police système avec tailles adaptatives
- **Icônes** : Lucide React (TrendingUp)

## Exemple visuel

```
┌─────────────────┐
│      75%        │  ← Pourcentage au centre
│   ◐◐◐◐◐◐◐◐◐    │  ← Graphique radial
│   45/60         │  ← Ratio (mode complet uniquement)
└─────────────────┘
```

## Fichiers modifiés

1. **Nouveau fichier** : `src/components/StatusCompletionChart.tsx`
2. **Modifié** : `src/components/AppelsCardsView.tsx`
   - Import du nouveau composant
   - Ajout dans la vue Cards
   - Ajout dans la vue Table

## Notes techniques

- Le composant utilise `useMemo` pour optimiser les performances
- Le calcul est effectué uniquement lorsque la liste de contacts change
- Le graphique utilise Recharts via les composants shadcn/ui
- Compatible avec TypeScript strict mode
