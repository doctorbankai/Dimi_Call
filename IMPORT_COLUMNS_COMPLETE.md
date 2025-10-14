# Ajout des colonnes manquantes dans le dialog d'import

## Problème identifié
Le dialog "Importer et mapper les colonnes" ne proposait pas toutes les colonnes disponibles dans l'application. Il manquait notamment :
- Don
- Date
- UID
- Actions

## Modifications apportées

### 1. ContactTable.tsx
Ajout des colonnes manquantes dans `expectedTargets` :
```typescript
{ label: 'Don', value: 'don' },
{ label: 'Date', value: 'date' },
{ label: 'UID', value: 'uid' },
{ label: 'Actions', value: 'actions' },
```

Réorganisation de l'ordre des colonnes pour correspondre à la liste demandée :
1. Prénom
2. Nom
3. Téléphone
4. Mail
5. Source
6. Type
7. Qualité
8. Lien
9. Date Rappel
10. Heure Rappel
11. Date Appel
12. Heure Appel
13. Statut
14. Commentaire
15. Date RDV
16. Heure RDV
17. Durée Appel
18. Sexe
19. Don
20. Date
21. UID
22. Actions

### 2. AppelsCardsView.tsx
Mise à jour de `EXPECTED_TARGETS` avec les mêmes colonnes et le même ordre.

### 3. AnnuairePage.tsx
Mise à jour de `expectedTargets` avec les mêmes colonnes et le même ordre.

### 4. dataService.ts
Ajout des mappings pour la normalisation automatique des en-têtes :

```typescript
// DON - toutes variantes
'don': 'don',
'donation': 'don',
'montant': 'don',
'amount': 'don',
'contribution': 'don',

// DATE - toutes variantes
'date': 'date',
'dategeneral': 'date',
'generaldate': 'date',

// UID - toutes variantes
'uid': 'uid',
'id': 'uid',
'identifier': 'uid',
'identifiant': 'uid',
'uniqueid': 'uid',

// ACTIONS - toutes variantes
'actions': 'actions',
'action': 'actions',
'activites': 'actions',
'activities': 'actions'
```

### 5. types.ts
Ajout du champ `actions` dans l'interface `Contact` :
```typescript
actions?: string; // Actions field for import purposes
```

Note : Les champs `don`, `date` et `uid` existaient déjà dans l'interface.

## Résultat
Le dialog d'import propose maintenant toutes les colonnes disponibles dans l'application, dans l'ordre demandé. L'auto-détection des en-têtes fonctionne également pour ces nouvelles colonnes grâce aux mappings ajoutés dans `dataService.ts`.

## Test recommandé
1. Ouvrir le dialog d'import
2. Vérifier que toutes les colonnes sont présentes dans les dropdowns
3. Tester l'import d'un fichier avec ces colonnes
4. Vérifier que les données sont correctement mappées
