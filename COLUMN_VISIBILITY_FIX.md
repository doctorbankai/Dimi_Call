# Correction du bouton "Masquer les colonnes optionnelles"

## Problème identifié

Le bouton "Masquer les colonnes optionnelles" dans le menu de gestion des colonnes ne fonctionnait pas correctement car :
1. Il n'y avait aucune indication de quelles colonnes étaient essentielles vs optionnelles
2. Le code ne chargeait pas la configuration des colonnes depuis les paramètres

## Solution implémentée

### Dans `src/components/AppelsCardsView.tsx`

1. **Ajout d'une fonction pour charger les colonnes essentielles** :
   ```typescript
   const getEssentialColumns = (): string[] => {
     const saved = localStorage.getItem('dimicall_column_config');
     if (saved) {
       try {
         const config = JSON.parse(saved);
         return Object.keys(config).filter(key => config[key] === true);
       } catch (error) {
         console.error('Erreur lors du chargement de la config des colonnes:', error);
       }
     }
     // Configuration par défaut si rien n'est sauvegardé
     return ['#', 'Prénom', 'Nom', 'Commentaire'];
   };
   ```

2. **Modification du bouton "Masquer les colonnes optionnelles"** :
   - Le `checked` vérifie maintenant si seules les colonnes essentielles sont visibles
   - Le `onCheckedChange` masque uniquement les colonnes optionnelles (non essentielles)
   - Les colonnes essentielles restent toujours visibles

### Dans `src/App.tsx`

Le code était déjà correct car il utilisait déjà :
- La fonction `getSavedColumnConfig()` importée depuis `SettingsDialog`
- Un état `essentialColumns` qui se recharge depuis les paramètres
- Une logique correcte pour masquer uniquement les colonnes optionnelles

## Configuration des colonnes

La configuration est stockée dans `localStorage` avec la clé `'dimicall_column_config'` et peut être modifiée dans les **Paramètres > Gestion des Colonnes**.

### Colonnes essentielles par défaut :
- `#` (Numéro de ligne)
- `Prénom`
- `Nom`
- `Commentaire`

### Colonnes optionnelles par défaut :
- Téléphone
- Mail
- Statut
- Date Rappel
- Heure Rappel
- Date RDV
- Heure RDV
- Date Appel
- Heure Appel
- Durée Appel
- Source
- Type
- Qualité
- Lien
- Sexe
- Don
- Date
- UID
- Actions

## Comportement attendu

1. **"Afficher toutes les colonnes disponibles"** : Affiche toutes les colonnes (essentielles + optionnelles)
2. **"Masquer les colonnes optionnelles"** : Masque uniquement les colonnes optionnelles, garde les essentielles visibles

## Test

Pour tester :
1. Ouvrir la page Appels 2
2. Cliquer sur le bouton de gestion des colonnes (⚙️)
3. Cliquer sur "Masquer les colonnes optionnelles"
4. Vérifier que seules les 4 colonnes essentielles restent visibles : #, Prénom, Nom, Commentaire
5. Cliquer sur "Afficher toutes les colonnes disponibles"
6. Vérifier que toutes les colonnes sont maintenant visibles
