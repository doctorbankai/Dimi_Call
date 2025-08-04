# Guide de Débogage - Dialog de Rappel

## 🔍 Problème : Le dialog de rappel ne s'affiche pas

Le HTML que vous montrez ne contient que les champs de base (date et heure) mais pas les nouveaux sélecteurs relatifs. Voici comment diagnostiquer et résoudre le problème.

## ✅ Vérifications Préliminaires

### 1. Vérifier que les fichiers existent
Tous ces fichiers doivent être présents :
- ✅ `src/services/dateCalculationService.ts`
- ✅ `src/components/RelativeDateSelector.tsx`
- ✅ `src/components/ReminderDialog.tsx`
- ✅ Intégration dans `src/components/ContactTable.tsx`

### 2. Vérifier la compilation
```bash
# L'application doit compiler sans erreur
npm run dev
# ou
yarn dev
```

## 🔧 Étapes de Débogage

### Étape 1: Vérifier la colonne Actions
1. Ouvrez votre application
2. Regardez le tableau de contacts
3. **Vérifiez qu'il y a une colonne "Actions" visible**
4. **Cherchez l'icône 🔔 (Bell) dans cette colonne**

Si la colonne Actions n'est pas visible :
- Vérifiez que `'Actions'` est dans `columnHeaders`
- Vérifiez que `visibleColumns.Actions` est `true`

### Étape 2: Vérifier les erreurs JavaScript
1. Ouvrez les DevTools (F12)
2. Allez dans l'onglet **Console**
3. Rechargez la page
4. **Cherchez des erreurs en rouge**

Erreurs communes :
- `Cannot resolve module './RelativeDateSelector'`
- `DateCalculationService is not defined`
- `ReminderDialog is not defined`

### Étape 3: Tester le bouton de rappel
1. Cliquez sur l'icône 🔔 dans la colonne Actions
2. **Le dialog devrait s'ouvrir**
3. Vérifiez dans les DevTools → Elements que le dialog apparaît dans le DOM

### Étape 4: Vérifier le contenu du dialog
Le dialog devrait contenir :
- ✅ Titre : "Programmer un Rappel"
- ✅ "Contact: [Nom du contact]"
- ✅ Section "Sélection manuelle" avec champs date/heure
- ✅ Séparateur "ou"
- ✅ Section "Sélection rapide" avec :
  - Texte "Dans"
  - Champ numérique pour la quantité
  - Sélecteur d'unité (jour(s), semaine(s), mois, année(s))
- ✅ Boutons "Annuler" et "Sauvegarder"

## 🚨 Solutions aux Problèmes Courants

### Problème 1: Colonne Actions manquante
**Solution :** Vérifiez la configuration des colonnes dans votre composant parent :

```typescript
const columnHeaders = [
  '#', 'Prénom', 'Nom', 'Téléphone', 'Mail', 'Statut', 'Commentaire', 
  'Actions' // ← Assurez-vous que c'est présent
];

const visibleColumns = {
  // ... autres colonnes
  'Actions': true // ← Doit être true
};
```

### Problème 2: Erreurs d'import
**Solution :** Vérifiez que tous les imports sont corrects dans `ContactTable.tsx` :

```typescript
import { ReminderDialog } from './ReminderDialog';
import { Bell } from 'lucide-react';
```

### Problème 3: Dialog ne s'ouvre pas
**Solution :** Vérifiez que l'état du dialog est correctement géré :

```typescript
// Dans ContactTable.tsx, ces éléments doivent être présents :
const [reminderDialog, setReminderDialog] = useState({
  isOpen: false,
  contact: null
});

const handleOpenReminderDialog = (contact) => {
  setReminderDialog({
    isOpen: true,
    contact: contact
  });
};
```

### Problème 4: Sélecteurs relatifs manquants
**Solution :** Vérifiez que `RelativeDateSelector` est bien importé et utilisé dans `ReminderDialog.tsx` :

```typescript
import { RelativeDateSelector } from './RelativeDateSelector';

// Dans le JSX :
<RelativeDateSelector
  onDateChange={handleRelativeDateChange}
  currentDate={state.selectedDate}
  disabled={false}
/>
```

## 🧪 Test Rapide

Pour tester rapidement, ajoutez ce composant temporaire dans votre application :

```typescript
// Ajoutez ceci dans votre App.tsx ou autre composant principal
import { TestReminderButton } from './components/TestReminderButton';

// Dans le JSX :
<TestReminderButton />
```

Ce composant de test devrait ouvrir le dialog directement.

## 📞 Si le Problème Persiste

1. **Vérifiez la console** pour des erreurs JavaScript
2. **Vérifiez les imports** dans tous les fichiers
3. **Redémarrez le serveur de développement**
4. **Vérifiez que la colonne Actions est visible**

## 🎯 Résultat Attendu

Quand tout fonctionne, vous devriez voir :

1. Une icône 🔔 dans la colonne Actions de chaque ligne
2. Un clic sur cette icône ouvre un dialog
3. Le dialog contient deux sections :
   - **Sélection manuelle** : champs date/heure classiques
   - **Sélection rapide** : "Dans [X] [unité]" avec prévisualisation

Le HTML final devrait ressembler à ceci :

```html
<div role="dialog">
  <h2>Programmer un Rappel</h2>
  <p>Contact: <strong>Gérard G</strong></p>
  
  <!-- Sélection manuelle -->
  <div>
    <div>Sélection manuelle</div>
    <input type="date" />
    <input type="time" />
  </div>
  
  <!-- Séparateur -->
  <div>ou</div>
  
  <!-- Sélection rapide -->
  <div>
    <div>Sélection rapide</div>
    <span>Dans</span>
    <input type="number" placeholder="1" />
    <select>
      <option>jour(s)</option>
      <option>semaine(s)</option>
      <option>mois</option>
      <option>année(s)</option>
    </select>
  </div>
  
  <button>Annuler</button>
  <button>Sauvegarder</button>
</div>
```

Si vous ne voyez que la partie "Sélection manuelle", c'est que le `RelativeDateSelector` ne se charge pas correctement.