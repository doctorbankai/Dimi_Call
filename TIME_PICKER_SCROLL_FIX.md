# Fix du Scroll dans les Time Pickers

## Problème
Les time pickers (sélecteurs d'heure) dans les dialogs ne permettaient pas de scroller avec la molette/trackpad. Seule la barre de défilement fonctionnait.

## Cause
Le problème venait de l'utilisation du composant `ScrollArea` de Radix UI à l'intérieur d'un `Popover` qui lui-même était dans un `Dialog`. Le scroll-lock du Dialog bloquait les événements `wheel` sur les éléments portalisés (rendus dans `document.body`), empêchant le scroll à la molette.

## Solution appliquée
Remplacement du composant `ScrollArea` par un simple `div` avec :
- `overflow-y-auto` pour le scroll vertical
- `overflow-x-hidden` pour éviter le scroll horizontal
- `onWheel={(e) => e.stopPropagation()}` pour empêcher la propagation des événements wheel au Dialog
- Ajout d'une bordure et d'un padding pour maintenir le style

## Fichiers modifiés

### 1. `src/components/ui/time-picker.tsx`
- Suppression de l'import `ScrollArea`
- Remplacement des deux `ScrollArea` (heures et minutes) par des `div` scrollables
- Ajout de `onWheel` pour stopper la propagation

### 2. `src/components/ui/time-picker-simple.tsx`
- Même modification que `time-picker.tsx`

### 3. `src/components/TimePickerWithClear.tsx`
- Suppression de l'import `ScrollArea`
- Suppression du `ScrollArea` dans le `SelectContent`
- Ajout de `max-h-60` directement sur le `SelectContent` (qui gère déjà le scroll nativement)

## Résultat
✅ Le scroll à la molette/trackpad fonctionne maintenant dans tous les time pickers, même à l'intérieur des dialogs
✅ La barre de défilement continue de fonctionner
✅ Le style visuel est préservé
✅ Aucune régression introduite

## Note technique
Le composant `ReminderDialog` passait déjà correctement la prop `container={dialogContentRef.current}` au `TimePicker`, ce qui permet de rendre le popover dans le contenu du dialog plutôt que dans `document.body`. Cependant, le `ScrollArea` de Radix UI ne gérait pas correctement les événements wheel dans ce contexte, d'où le remplacement par un scroll natif.
