# Implémentation Complète du Dialog SMS avec Type de SMS

## Résumé des Modifications

Le SmsDialog a été mis à jour pour correspondre exactement à l'EmailDialog, avec l'ajout d'un dropdown "Type de SMS" similaire au dropdown "Type d'email".

## Nouveautés

### 1. Enum SmsType ajouté dans `src/types.ts`

```typescript
export enum SmsType {
  PremierContact = "premier_contact",
  Relance = "relance",
  Confirmation = "confirmation",
}
```

Cet enum définit les différents types de SMS disponibles, similaire à EmailType.

### 2. SmsDialog mis à jour dans `src/components/Dialogs.tsx`

#### Interface mise à jour
```typescript
interface SmsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  onSendSms: (civility: Civility, smsType: SmsType) => void;
}
```

#### État ajouté
```typescript
const [smsType, setSmsType] = useState<SmsType>(SmsType.PremierContact);
```

#### Options de type de SMS
```typescript
const smsTypeOptions = [
  { value: SmsType.PremierContact, label: 'Premier Contact' },
  { value: SmsType.Relance, label: 'Relance' },
  { value: SmsType.Confirmation, label: 'Confirmation' }
];
```

#### Layout mis à jour
Le SmsDialog affiche maintenant deux dropdowns côte à côte, exactement comme EmailDialog :
- Dropdown "Civilité" (Monsieur/Madame)
- Dropdown "Type de SMS" (Premier Contact/Relance/Confirmation)

```typescript
<div className="space-y-3">
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
  
  <ShadcnSelect value={smsType} onValueChange={(value) => setSmsType(value as SmsType)}>
    <SelectTrigger className="w-full">
      <SelectValue placeholder="Type de SMS" />
    </SelectTrigger>
    <SelectContent className="z-[20001]">
      {smsTypeOptions.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </ShadcnSelect>
</div>
```

#### Aperçu mis à jour
```typescript
<div className="bg-muted text-muted-foreground p-3 rounded text-sm">
  <strong>Aperçu:</strong> SMS {smsTypeOptions.find(opt => opt.value === smsType)?.label} pour {civilityOptions.find(opt => opt.value === civility)?.label} {contact.prenom} {contact.nom}
</div>
```

### 3. Fonction handleSms mise à jour dans `src/App.tsx`

```typescript
const handleSms = useCallback(async (civilite: string, smsType?: string, contact?: Contact) => {
  // ... implémentation
  // Le paramètre smsType est maintenant disponible pour une utilisation future
}, [selectedContact, showNotification, adbConnectionState.isConnected, sendSms, smsTemplate, smsTemplateMandataire, mode]);
```

### 4. Callback mis à jour dans App.tsx

```typescript
{selectedContact && isSmsDialogOpen && (
  <SmsDialog
    isOpen={isSmsDialogOpen}
    onClose={() => setIsSmsDialogOpen(false)}
    contact={selectedContact}
    onSendSms={(civility, smsType) => {
      handleSms(civility, smsType);
      setIsSmsDialogOpen(false);
    }}
  />
)}
```

### 5. Suppression de l'ancien menu dropdown SMS dans `src/components/AppelsCardsView.tsx`

**Avant:**
```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>
      <MessageSquare className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => selectedContact && onSmsMonsieur()}>
      SMS Monsieur
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => selectedContact && onSmsMadame()}>
      SMS Madame
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Après:**
```typescript
<Button
  size="icon"
  variant="outline"
  disabled={!selectedContact}
  onClick={() => selectedContact && onSmsMonsieur()}
  className="size-10 rounded-full transition-all duration-200 hover:scale-105 border-2 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
  aria-label="SMS"
>
  <MessageSquare className="h-4 w-4" />
</Button>
```

## Résultat Final

### SmsDialog - Interface Complète
✅ Dropdown "Civilité" fonctionnel (Monsieur/Madame)
✅ Dropdown "Type de SMS" fonctionnel (Premier Contact/Relance/Confirmation)
✅ Affichage des informations du contact (nom, téléphone)
✅ Aperçu dynamique du SMS avec civilité et type
✅ Interface identique à EmailDialog pour une cohérence parfaite
✅ Tous les dropdowns s'affichent correctement avec z-index: 20001

### Ancien Menu Dropdown Supprimé
✅ Le menu dropdown "SMS Monsieur / SMS Madame" a été remplacé par un simple bouton
✅ Le bouton ouvre maintenant le nouveau SmsDialog complet
✅ Expérience utilisateur cohérente avec le bouton Email

## Fichiers Modifiés

1. **src/types.ts** - Ajout de l'enum SmsType
2. **src/components/Dialogs.tsx** - Mise à jour complète du SmsDialog
3. **src/App.tsx** - Mise à jour de handleSms et du callback
4. **src/components/AppelsCardsView.tsx** - Suppression du dropdown, remplacement par un bouton simple

## Test Recommandé

1. Cliquer sur le bouton SMS
2. Vérifier que la fenêtre s'ouvre avec :
   - Les informations du contact (nom, téléphone)
   - Dropdown "Civilité" avec Monsieur/Madame
   - Dropdown "Type de SMS" avec Premier Contact/Relance/Confirmation
3. Changer les valeurs dans les dropdowns
4. Vérifier que l'aperçu se met à jour correctement
5. Cliquer sur "Envoyer SMS" et vérifier que le SMS est préparé

## Notes

- Le type de SMS est maintenant passé à handleSms mais n'est pas encore utilisé dans la logique d'envoi
- Vous pouvez facilement étendre la logique pour utiliser différents templates selon le type de SMS sélectionné
- L'interface est maintenant parfaitement cohérente entre EmailDialog et SmsDialog
