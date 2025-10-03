# Correction de l'importation des dates et heures Excel

## Problème identifié

Lors de l'importation de fichiers Excel, les colonnes "Date Rappel" et "Heure Rappel" affichaient des valeurs incorrectes :

### Valeurs attendues (dans Excel)
- **Date Rappel** : `10/03/2025`, `10/02/2025`, `9/16/2025`, etc.
- **Heure Rappel** : `8:55 AM`, `9:00 AM`, `10:00 AM`, `12:30 PM`, etc.

### Valeurs affichées (dans l'application)
- **Date Rappel** : `01/01/45726X`, `01/01/45698X`, etc.
- **Heure Rappel** : `0.371527777777778`, `0.375`, `0.416666666666667`, etc.

## Cause du problème

Excel stocke les dates et heures sous forme de **numéros de série** :
- **Dates** : Nombre entier représentant les jours depuis le 1er janvier 1900
  - Exemple : `45726` = 10/03/2025
- **Heures** : Fraction décimale représentant la portion du jour
  - Exemple : `0.371527777777778` = 8:55 AM (8.916667 heures / 24)

Le code d'importation convertissait ces numéros en texte avec `.toString()` au lieu de les convertir en dates/heures lisibles.

## Solution implémentée

### 1. Fonction de conversion des dates Excel
```typescript
const excelSerialToDate = (serial: number): Date => {
  const excelEpoch = new Date(1899, 11, 30); // 30 décembre 1899
  const days = Math.floor(serial);
  const milliseconds = Math.round((serial - days) * 86400000);
  return new Date(excelEpoch.getTime() + days * 86400000 + milliseconds);
};
```

### 2. Fonction de formatage des dates
```typescript
const formatExcelDate = (serial: number | string): string => {
  // Détecte si c'est un numéro de série Excel (entre 1 et 100000)
  // Convertit en format MM/DD/YYYY
  // Exemple : 45726 → "10/03/2025"
}
```

### 3. Fonction de formatage des heures
```typescript
const formatExcelTime = (serial: number | string): string => {
  // Détecte si c'est une fraction (entre 0 et 1)
  // Convertit en format HH:MM AM/PM
  // Exemple : 0.371527777777778 → "8:55 AM"
}
```

### 4. Application lors de l'importation
Le code d'importation Excel a été modifié pour appliquer automatiquement ces conversions :

```typescript
// Conversion spéciale pour les dates et heures Excel
if (normalizedField === 'dateRappel' || normalizedField === 'dateAppel' || normalizedField === 'dateRDV') {
  cellValue = formatExcelDate(cellValue);
} else if (normalizedField === 'heureRappel' || normalizedField === 'heureAppel' || normalizedField === 'heureRDV') {
  cellValue = formatExcelTime(cellValue);
}
```

## Résultat

Après cette correction, les valeurs importées depuis Excel s'affichent correctement :

| Avant | Après |
|-------|-------|
| `01/01/45726X` | `10/03/2025` |
| `0.371527777777778` | `8:55 AM` |
| `0.375` | `9:00 AM` |
| `0.416666666666667` | `10:00 AM` |
| `0.520833333333334` | `12:30 PM` |

## Compatibilité

Les fonctions de conversion sont intelligentes et gèrent plusieurs cas :
- ✅ Numéros de série Excel (dates et heures)
- ✅ Dates déjà formatées en texte (MM/DD/YYYY)
- ✅ Heures déjà formatées en texte (HH:MM AM/PM)
- ✅ Valeurs invalides (retournées telles quelles)

## Fichiers modifiés

- `src/services/dataService.ts` : Ajout des fonctions de conversion et modification de la logique d'importation Excel

## Test

Pour tester la correction :
1. Importer un fichier Excel contenant des colonnes "Date Rappel" et "Heure Rappel"
2. Vérifier que les dates s'affichent au format `MM/DD/YYYY`
3. Vérifier que les heures s'affichent au format `HH:MM AM/PM`
