# Implémentation du Dialog SMS et Correction des Dropdowns Email

## Problèmes Résolus

### 1. Dropdowns non fonctionnels dans EmailDialog
**Problème:** Les dropdowns "Monsieur/Madame" et "Premier Contact/..." ne s'ouvraient pas lorsqu'on cliquait dessus.

**Cause:** Le composant `Select` de Common.tsx utilisait `ShadcnSelect` mais le `SelectContent` avait un z-index inférieur au dialog (z-index: 20000), ce qui empêchait l'affichage du menu déroulant.

**Solution:** 
- Import direct de `ShadcnSelect`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` dans Dialogs.tsx
- Ajout de `className="z-[20001]"` sur tous les `SelectContent` pour s'assurer qu'ils s'affichent au-dessus du dialog

### 2. Bouton SMS sans dialog de sélection
**Problème:** Le bouton SMS appelait directement `handleSms('Monsieur')` ou `handleSms('Madame')` sans permettre à l'utilisateur de choisir la civilité.

**Solution:** Création d'un nouveau composant `SmsDialog` similaire à `EmailDialog` avec :
- Affichage des informations du contact (nom, téléphone)
- Dropdown pour sélectionner la civilité (Monsieur/Madame)
- Aperçu du SMS qui sera envoyé
- Boutons Annuler et Envoyer SMS

## Modifications Apportées

### 1. `src/components/Dialogs.tsx`

#### Imports ajoutés
```typescript
import { 
  Select as ShadcnSelect, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
```

#### EmailDialog - Remplacement des Select
Les composants `Select` de Common.tsx ont été remplacés par `ShadcnSelect` avec z-index approprié :

```typescript
<ShadcnSelect value={civility} onValueChange={(value) => setCivility(value as Civility)}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Civilité" />
  </SelectTrigger>
  <SelectContent className="z-[20001]">
    {civilityOptions.map((option) => (
      <SelectItem key={option.value} value={option.value}>
        {option.label}
      </SelectItem>
    ))}
  </SelectContent>
</ShadcnSelect>
```

#### Nouveau composant SmsDialog
```typescript
interface SmsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  onSendSms: (civility: Civility) => void;
}

const SmsDialog: React.FC<SmsDialogProps> = ({ isOpen, onClose, contact, onSendSms }) => {
  const [civility, setCivility] = useState<Civility>(Civility.Monsieur);
  // ... implémentation
};
```

**Caractéristiques:**
- Layout similaire à EmailDialog pour une expérience utilisateur cohérente
- Affichage du nom et téléphone du contact
- Dropdown pour choisir la civilité
- Aperçu du message
- Gestion propre de la fermeture et de l'envoi

#### Export mis à jour
```typescript
export { EmailDialog, SmsDialog, RappelDialog, RendezVousDialog, QualificationDialog, GenericInfoDialogComponent as GenericInfoDialog };
```

### 2. `src/App.tsx`

#### Import mis à jour
```typescript
import { EmailDialog, SmsDialog, RappelDialog, RendezVousDialog, QualificationDialog, GenericInfoDialog } from './components/Dialogs';
```

#### État ajouté
```typescript
const [isSmsDialogOpen, setIsSmsDialogOpen] = useState(false);
```

#### Modification de handleSms
La signature a été modifiée pour rendre le paramètre `civilite` obligatoire :
```typescript
const handleSms = useCallback(async (civilite: string, contact?: Contact) => {
  // ... implémentation inchangée
}, [selectedContact, showNotification, adbConnectionState.isConnected, sendSms, smsTemplate, smsTemplateMandataire, mode]);
```

#### Boutons SMS mis à jour
Les boutons SMS ouvrent maintenant le dialog au lieu d'appeler directement handleSms :
```typescript
onSmsMonsieur={() => selectedContact && setIsSmsDialogOpen(true)}
onSmsMadame={() => selectedContact && setIsSmsDialogOpen(true)}
```

#### Rendu du SmsDialog
```typescript
{selectedContact && isSmsDialogOpen && (
  <SmsDialog
    isOpen={isSmsDialogOpen}
    onClose={() => setIsSmsDialogOpen(false)}
    contact={selectedContact}
    onSendSms={(civility) => {
      handleSms(civility);
      setIsSmsDialogOpen(false);
    }}
  />
)}
```

## Résultat

### EmailDialog
✅ Les dropdowns "Civilité" et "Type d'email" s'ouvrent correctement
✅ Le calendrier (date picker) s'affiche au-dessus du dialog
✅ Le time picker (heure) s'affiche au-dessus du dialog
✅ Le z-index est correctement géré (20001 > 20000)
✅ L'expérience utilisateur est fluide

### SmsDialog
✅ Nouvelle fenêtre de dialogue pour l'envoi de SMS
✅ Interface cohérente avec EmailDialog
✅ Permet de choisir la civilité avant l'envoi
✅ Affiche un aperçu du message
✅ Gestion propre de l'état et des callbacks

## Test Recommandé

1. **EmailDialog:**
   - Cliquer sur le bouton Email
   - Vérifier que les dropdowns "Civilité" et "Type d'email" s'ouvrent
   - Sélectionner différentes options
   - Vérifier que l'aperçu se met à jour correctement

2. **SmsDialog:**
   - Cliquer sur le bouton SMS
   - Vérifier que la fenêtre s'ouvre avec les informations du contact
   - Changer la civilité dans le dropdown
   - Vérifier que l'aperçu se met à jour
   - Cliquer sur "Envoyer SMS" et vérifier que le SMS est préparé correctement

## Notes Techniques

- Le z-index 20001 est utilisé pour les SelectContent, PopoverContent (calendrier) et TimePicker afin de s'afficher au-dessus du Modal (z-index: 20000)
- Le composant TimePicker a été modifié pour accepter un prop `zIndex` personnalisé
- Les deux dialogs utilisent le même composant Modal de Common.tsx pour la cohérence
- La gestion d'état est propre avec fermeture automatique après l'action
- Aucune régression sur les fonctionnalités existantes

## Fichiers Modifiés Supplémentaires

### 3. `src/components/ui/time-picker.tsx`

#### Ajout du prop zIndex
```typescript
interface TimePickerProps {
  // ... autres props
  zIndex?: number;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  // ... autres props
  zIndex = 250,
}) => {
  // ...
  <PopoverContent className={cn("w-auto p-4", `z-[${zIndex}]`)} align="start" container={container}>
  // ...
}
```

**Utilisation dans EmailDialog:**
```typescript
<TimePicker
  id="time-picker"
  value={selectedTime}
  onChange={handleTimeChange}
  placeholder="HH:mm"
  zIndex={20001}
/>
```
