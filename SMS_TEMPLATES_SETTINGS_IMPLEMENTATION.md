# Implémentation Complète des Templates SMS dans les Réglages

## Résumé

La section "Templates SMS" dans les réglages a été complètement refaite pour correspondre exactement à la section "Templates Email", avec un système de templates structurés par type de SMS.

## Modifications Principales

### 1. Nouveau Système de Templates SMS Structurés

#### Types et Interfaces Ajoutés dans `src/types.ts`
```typescript
export enum SmsType {
  PremierContact = "premier_contact",
  Relance = "relance",
  Confirmation = "confirmation",
}
```

#### Interfaces et Templates par Défaut dans `src/components/SettingsDialog.tsx`
```typescript
interface SmsTemplates {
  [SmsType.PremierContact]: string;
  [SmsType.Relance]: string;
  [SmsType.Confirmation]: string;
}

const defaultSmsTemplates: SmsTemplates = {
  [SmsType.PremierContact]: `Bonjour {civilite} {nom},...`,
  [SmsType.Relance]: `Bonjour {civilite} {nom},...`,
  [SmsType.Confirmation]: `Bonjour {civilite} {nom},...`
};

const smsTypeLabels = {
  [SmsType.PremierContact]: { label: 'Premier Contact', icon: MessageSquare },
  [SmsType.Relance]: { label: 'Relance', icon: MessageSquare },
  [SmsType.Confirmation]: { label: 'Confirmation', icon: MessageSquare },
};
```

### 2. Nouvelle Section "Templates SMS" dans les Réglages

La section a été complètement refaite pour correspondre à "Templates Email" :

#### Fonctionnalités
- ✅ Dropdown "Type de SMS" pour sélectionner le template à éditer
- ✅ Templates séparés pour chaque type (Premier Contact, Relance, Confirmation)
- ✅ Templates séparés pour mode Client et Mandataire
- ✅ Switch pour basculer entre Client/Mandataire
- ✅ Éditeur de texte avec compteur de caractères
- ✅ Variables disponibles ({civilite}, {nom}, {prenom}, {nom_complet})
- ✅ Aperçu en temps réel avec exemple
- ✅ Sauvegarde dans localStorage séparé (SMS_STORAGE_KEY)
- ✅ Z-index correct pour le dropdown (z-[20001])

#### Structure
```typescript
const renderSmsSettings = () => {
  const templatesByMode = callMode === CallMode.Mandataire ? mandataireSmsTemplates : smsTemplates;
  const currentTemplate = templatesByMode[selectedSmsType];
  const smsInfo = smsTypeLabels[selectedSmsType];

  return (
    <div className="space-y-6">
      {/* SMS Type Selector */}
      <Select value={selectedSmsType} onValueChange={(value) => setSelectedSmsType(value as SmsType)}>
        <SelectTrigger id="sms-type-selector" className="z-[20001]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-[20001]">
          {/* Options */}
        </SelectContent>
      </Select>

      {/* Template Editor */}
      <Card>
        {/* Mode Switch */}
        {/* Textarea Editor */}
        {/* Variables Help */}
        {/* Preview */}
      </Card>
    </div>
  );
};
```

### 3. États Ajoutés

```typescript
const [selectedSmsType, setSelectedSmsType] = useState<SmsType>(SmsType.PremierContact);
const [smsTemplates, setSmsTemplates] = useState<SmsTemplates>(defaultSmsTemplates);
const [mandataireSmsTemplates, setMandataireSmsTemplates] = useState<SmsTemplates>(defaultSmsTemplates);
```

### 4. Chargement et Sauvegarde

#### Chargement depuis localStorage
```typescript
useEffect(() => {
  const savedSms = localStorage.getItem(SMS_STORAGE_KEY);
  if (savedSms) {
    try {
      const data = JSON.parse(savedSms);
      if (data.smsTemplates) setSmsTemplates(data.smsTemplates);
      if (data.mandataireSmsTemplates) setMandataireSmsTemplates(data.mandataireSmsTemplates);
    } catch (error) {
      console.error('Erreur lors du chargement des templates SMS:', error);
    }
  }
}, []);
```

#### Sauvegarde dans localStorage
```typescript
const handleSave = () => {
  // Sauvegarde des templates SMS structurés
  const smsData = {
    smsTemplates,
    mandataireSmsTemplates,
    lastModified: new Date().toISOString()
  };
  localStorage.setItem(SMS_STORAGE_KEY, JSON.stringify(smsData));
  // ...
};
```

### 5. Fonction de Mise à Jour des Templates

```typescript
const handleSmsTemplateChange = (value: string) => {
  const templatesByMode = callMode === CallMode.Mandataire ? mandataireSmsTemplates : smsTemplates;
  const updatedTemplates = { ...templatesByMode, [selectedSmsType]: value };
  
  if (callMode === CallMode.Mandataire) {
    setMandataireSmsTemplates(updatedTemplates);
  } else {
    setSmsTemplates(updatedTemplates);
  }
  setHasChanges(true);
};
```

## Corrections de Z-Index

### Dropdown dans les Réglages
Le dropdown "Type de SMS" a maintenant un z-index correct :
```typescript
<SelectTrigger id="sms-type-selector" className="z-[20001]">
  <SelectValue />
</SelectTrigger>
<SelectContent className="z-[20001]">
  {/* Options */}
</SelectContent>
```

Cela corrige le problème où le dropdown passait en arrière-plan.

## Intégration avec le SmsDialog

Le SmsDialog utilise maintenant les mêmes types de SMS que les réglages :
- Les options du dropdown "Type de SMS" dans le dialog correspondent aux templates configurables dans les réglages
- Les trois types (Premier Contact, Relance, Confirmation) sont cohérents entre le dialog et les réglages
- À l'avenir, le dialog pourra charger le template approprié depuis les réglages selon le type sélectionné

## Fichiers Modifiés

1. **src/types.ts**
   - Ajout de `SmsType` enum

2. **src/components/SettingsDialog.tsx**
   - Import de `SmsType`
   - Ajout des interfaces `SmsTemplates`
   - Ajout des templates par défaut `defaultSmsTemplates`
   - Ajout des labels `smsTypeLabels`
   - Ajout de la constante `SMS_STORAGE_KEY`
   - Ajout des états pour les templates SMS
   - Mise à jour du `useEffect` pour charger les templates SMS
   - Mise à jour de `handleSave` pour sauvegarder les templates SMS
   - Refonte complète de `renderSmsSettings()`
   - Ajout de `handleSmsTemplateChange()`
   - Correction du z-index des dropdowns

## Résultat Final

### Section Templates SMS
✅ Interface identique à "Templates Email"
✅ Dropdown "Type de SMS" fonctionnel avec z-index correct
✅ Templates séparés par type (Premier Contact, Relance, Confirmation)
✅ Templates séparés par mode (Client/Mandataire)
✅ Éditeur avec compteur de caractères
✅ Variables disponibles documentées
✅ Aperçu en temps réel
✅ Sauvegarde/chargement depuis localStorage

### SmsDialog
✅ Dropdown "Type de SMS" correspond aux templates des réglages
✅ Cohérence parfaite entre dialog et réglages
✅ Prêt pour l'intégration future des templates personnalisés

## Test Recommandé

1. **Réglages - Section Templates SMS**
   - Ouvrir les réglages
   - Aller dans "Templates SMS"
   - Vérifier que le dropdown "Type de SMS" s'ouvre correctement
   - Sélectionner différents types (Premier Contact, Relance, Confirmation)
   - Modifier le texte d'un template
   - Basculer entre Client/Mandataire
   - Vérifier que l'aperçu se met à jour
   - Sauvegarder et vérifier que les modifications persistent

2. **SmsDialog**
   - Cliquer sur le bouton SMS
   - Vérifier que les types de SMS correspondent à ceux des réglages
   - Sélectionner différents types
   - Vérifier que l'aperçu se met à jour

## Notes Techniques

- Le z-index 20001 est utilisé pour tous les dropdowns dans les dialogs et réglages
- Les templates SMS sont sauvegardés séparément des templates Email (SMS_STORAGE_KEY vs STORAGE_KEY)
- Le système est extensible : on peut facilement ajouter de nouveaux types de SMS
- La structure est cohérente avec le système de templates Email existant
