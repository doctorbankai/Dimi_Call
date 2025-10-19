# Mise à jour des statuts DO/RO vers D0/R0

## Résumé
Tous les statuts "DO" et "RO" ont été remplacés par "D0" (D zéro) et "R0" (R zéro) dans toute l'application, y compris dans les messages utilisateur, tooltips, commentaires et tests.

## Fichiers modifiés

### Fichiers de types et constantes
- ✅ `src/types.ts` - Enum ContactStatus (DO → D0, RO → R0)
- ✅ `constants.tsx` - STATUS_COLORS et autres constantes
- ✅ `src/constants.tsx` - STATUS_COLORS_V2

### Services
- ✅ `src/services/supabaseService.ts` - Mapping des statuts
- ✅ `src/services/statusConfigService.ts` - Configuration des statuts
- ✅ `src/services/shortcutService.ts` - Raccourcis clavier (F8 → D0, F9 → R0)
- ✅ `src/services/dataService.ts` - Filtres d'export Google Contacts
- ✅ `services/supabaseService.ts` - Mapping des statuts (copie)
- ✅ `services/dataService.ts` - Filtres d'export (copie)

### Composants
- ✅ `src/App.tsx` - Filtres de contacts
- ✅ `src/components/AppelsCardsView.tsx` - Filtres de contacts
- ✅ `src/components/ChartDashboard.tsx` - Graphiques et statistiques
- ✅ `src/components/ClientFilesPanel.tsx` - Configuration des statuts
- ✅ `src/components/ShortcutConfigDialog.tsx` - Configuration des raccourcis
- ✅ `src/components/SupabaseDataDialog.tsx` - Import Supabase
- ✅ `src/components/AnnuairePage.tsx` - Mapping des clés de statuts

### Scripts de test
- ✅ `scripts/test-google-export-filename.js`
- ✅ `scripts/test-google-contacts-export.js`
- ✅ `scripts/test-export-import.js`

### Tests unitaires et d'intégration
- ✅ `src/__tests__/constants/StatusA0.test.ts`
- ✅ `src/__tests__/services/googleCalendarExport.test.ts`
- ✅ `src/__tests__/services/dataService.test.ts`
- ✅ `src/__tests__/integration/google-calendar-ui.test.tsx`
- ✅ `src/__tests__/integration/export-import-flow.test.ts`
- ✅ `src/__tests__/e2e/link-user-experience.test.tsx`
- ✅ `src/__tests__/e2e/google-calendar-export.test.tsx`
- ✅ `src/__tests__/e2e/a0-status-google-export.test.tsx`

## Changements effectués

### 1. Enum ContactStatus (src/types.ts)
```typescript
// AVANT
DO = "DO",
RO = "RO",

// APRÈS
D0 = "D0",
R0 = "R0",
```

### 2. Raccourcis clavier
- F8 : DO → D0
- F9 : RO → R0

### 3. Filtres d'export Google Contacts
Tous les filtres qui utilisaient `ContactStatus.DO` et `ContactStatus.RO` ont été mis à jour vers `ContactStatus.D0` et `ContactStatus.R0`.

### 4. Graphiques et statistiques
Les graphiques dans ChartDashboard utilisent maintenant les bons noms de statuts :
- Ordre des statuts : [..., 'D0', 'R0', ...]
- Mapping d'agrégation : 'Pris': ['D0', 'R0']

### 5. Configuration des couleurs
Toutes les configurations de couleurs pour les statuts ont été mises à jour dans :
- STATUS_COLORS
- STATUS_COLORS_V2
- statusConfigService
- ClientFilesPanel

## Vérification
✅ Aucune erreur de compilation détectée
✅ Tous les fichiers TypeScript sont valides
✅ Les tests ont été mis à jour en conséquence

## Notes importantes
- Les valeurs d'affichage restent "D0" et "R0" (avec zéro)
- Les EmailType et SmsType utilisent toujours les formats en minuscules : "d0_visio", "r0_interne", "r0_externe"
- Tous les mappings de statuts depuis Supabase ont été mis à jour


## Modifications supplémentaires (messages utilisateur)

### Messages toast et notifications
- ✅ `src/App.tsx` - Message de notification "Aucun contact à exporter" (DO/RO → D0/R0)
- ✅ `src/components/AppelsCardsView.tsx` - Message toast d'export (DO/RO → D0/R0)

### Commentaires dans le code
- ✅ `src/services/dataService.ts` - Commentaire de fonction (DO/RO → D0/R0)
- ✅ `src/components/ChartDashboard.tsx` - Commentaires des graphiques (DO → D0)

### Tests - Messages et commentaires
- ✅ `src/__tests__/services/dataService.test.ts` - Commentaires et assertions (DO/RO → D0/R0)
- ✅ `src/__tests__/integration/export-import-flow.test.ts` - Commentaires (DO/RO → D0/R0)
- ✅ `src/__tests__/e2e/a0-status-google-export.test.tsx` - Commentaires et regex de test (DO/RO → D0/R0)

## Vérification finale
✅ Aucune erreur de compilation
✅ Tous les fichiers TypeScript sont valides
✅ Tous les messages utilisateur mis à jour
✅ Tous les commentaires de code mis à jour
✅ Tous les tests mis à jour

## Occurrences restantes (non problématiques)
Les seules occurrences de "DO" et "RO" restantes sont :
- Commentaires TODO dans le code (non liés aux statuts)
- Texte Lorem ipsum dans les mocks
- Commentaires de code non liés aux statuts (ex: "do data-state")

Ces occurrences ne concernent pas les statuts de contacts et n'ont pas besoin d'être modifiées.


## Normalisation des données existantes

Pour gérer les contacts existants dans la base de données qui ont encore les anciens statuts "DO" et "RO", nous avons ajouté une normalisation automatique dans tous les composants qui affichent les données :

### Composants avec normalisation automatique
- ✅ `src/components/ChartDashboard.tsx` - Normalisation dans radialData, funnelData et averageDuration
- ✅ `src/components/PaginatedEventTable.tsx` - Normalisation dans l'affichage du tableau et l'export
- ✅ `src/components/LocalDBViewer.tsx` - Normalisation dans l'affichage du tableau et les détails

### Logique de normalisation
```typescript
// Normaliser les anciens statuts DO/RO vers D0/R0
if (status === 'DO') status = 'D0';
if (status === 'RO') status = 'R0';
```

Cette normalisation garantit que :
1. Les nouveaux contacts créés utilisent "D0" et "R0"
2. Les anciens contacts affichent "D0" et "R0" même si la base contient "DO" et "RO"
3. Les graphiques et statistiques affichent les bons labels
4. Les exports CSV utilisent les nouveaux noms

## Vérification finale complète
✅ Aucune erreur de compilation
✅ Tous les fichiers TypeScript sont valides
✅ Tous les messages utilisateur mis à jour
✅ Tous les commentaires de code mis à jour
✅ Tous les tests mis à jour
✅ Normalisation automatique des données existantes
✅ Graphiques et légendes affichent D0/R0
✅ Exports et imports utilisent D0/R0

## Migration des données
Les données existantes dans la base de données locale (SQLite) qui contiennent "DO" et "RO" sont automatiquement normalisées à l'affichage. Aucune migration de base de données n'est nécessaire car la normalisation est faite au niveau de l'interface utilisateur.
