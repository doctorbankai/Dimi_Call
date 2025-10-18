# Correction du Bouton SMS dans la Page Appels

## Problème Identifié

Le bouton SMS dans la page "Appels" (mode Cards et Table) ouvrait le dialogue SMS correctement, mais lorsqu'on cliquait sur "Envoyer SMS", rien ne se passait. L'application SMS sur le téléphone ne s'ouvrait pas via ADB.

## Cause du Problème

1. **Double fermeture du dialogue** : Le dialogue se fermait immédiatement après le clic, avant que l'action asynchrone d'envoi du SMS ne soit complétée.
   - `handleSendSms` dans `SmsDialog` appelait `onClose()` immédiatement après `onSendSms()`
   - Le callback dans `App.tsx` appelait aussi `setIsSmsDialogOpen(false)`

2. **Problème de type** : Le paramètre `civility` était de type `Civility` (enum) mais `handleSms` attendait une `string`.

## Corrections Apportées

### 1. Modification de `src/components/Dialogs.tsx`

**Avant :**
```typescript
const handleSendSms = () => {
  onSendSms(civility, smsType);
  onClose();
};
```

**Après :**
```typescript
const handleSendSms = () => {
  onSendSms(civility, smsType);
};
```

La fermeture du dialogue est maintenant gérée uniquement par le callback dans `App.tsx` après l'envoi du SMS.

### 2. Modification de `src/App.tsx`

**Avant :**
```typescript
onSendSms={(civility, smsType) => {
  handleSms(civility, smsType);
  setIsSmsDialogOpen(false);
}}
```

**Après :**
```typescript
onSendSms={async (civility, smsType) => {
  await handleSms(civility as string, smsType);
  setIsSmsDialogOpen(false);
}}
```

Changements :
- Ajout de `async/await` pour attendre la fin de l'envoi du SMS
- Cast de `civility` en `string` pour correspondre au type attendu par `handleSms`
- La fermeture du dialogue se fait maintenant après l'envoi du SMS

## Flux Corrigé

1. L'utilisateur clique sur le bouton SMS (icône MessageSquare)
2. Le dialogue SMS s'ouvre avec les options de civilité et type de SMS
3. L'utilisateur sélectionne les options et clique sur "Envoyer SMS"
4. `handleSendSms` appelle `onSendSms(civility, smsType)`
5. Le callback dans `App.tsx` :
   - Appelle `handleSms` de manière asynchrone
   - Attend la fin de l'envoi du SMS
   - Ferme le dialogue uniquement après le succès/échec de l'envoi
6. L'application SMS s'ouvre sur le téléphone via ADB avec le message pré-rempli

## Test

Pour tester la correction :

1. Connecter un téléphone Android via ADB
2. Aller dans la page "Appels" (mode Cards ou Table)
3. Sélectionner un contact avec un numéro de téléphone
4. Cliquer sur le bouton SMS
5. Sélectionner la civilité et le type de SMS
6. Cliquer sur "Envoyer SMS"
7. Vérifier que l'application SMS s'ouvre sur le téléphone avec le message pré-rempli

## Fichiers Modifiés

- `src/components/Dialogs.tsx` : Suppression de l'appel à `onClose()` dans `handleSendSms`
- `src/App.tsx` : Ajout de `async/await` et cast de type dans le callback `onSendSms`
