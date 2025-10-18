# Fix SMS : Apostrophes typographiques et sauts de ligne

## Problème identifié

Les modèles SMS "Premier contact", "R0 interne" et "R0 externe" ne fonctionnaient pas, alors que "D0 Visio" fonctionnait parfaitement.

### Causes racines

1. **Sauts de ligne (`\n`)** : Dans `exec("adb shell ... --es sms_body "...")`, les retours à la ligne coupent la commande côté shell → le guillemet de fin n'arrive jamais → erreur "no closing quote"
   - ✅ D0 Visio : sur une seule ligne → fonctionne
   - ❌ Autres modèles : contiennent des lignes vides → cassent

2. **Apostrophes typographiques** (`'` U+2019) : Provoquent de la mojibake et perturbent le quoting shell

3. **Encodage URI avec `%`** : Dans les URI `?body=`, cmd.exe tente d'expanser `%...%` → chaîne altérée

## Solution appliquée

### Normalisation systématique avant envoi

Tous les messages SMS sont maintenant normalisés AVANT d'être passés à ADB :

```typescript
const normalizedMessage = message
  .replace(/\r?\n+/g, ' ')           // Sauts de ligne → espaces
  .replace(/\u2019/g, "'")           // ' → '
  .replace(/\u2018/g, "'")           // ' → '
  .replace(/\u201C/g, '"')           // " → "
  .replace(/\u201D/g, '"')           // " → "
  .trim();
```

### Fichiers modifiés

1. **electron/main.ts**
   - `ipcMain.handle('adb:sms')` : Normalisation ajoutée
   - `ipcMain.handle('adb:send-sms')` : Fonction `escapeShellArg()` améliorée
   - Fallback avec saisie simulée : Normalisation ajoutée

2. **apps/web/app/api/sms/route.ts**
   - Normalisation avant `encodeURIComponent()`
   - Normalisation avant échappement shell
   - Suppression des `.replace(/\r?\n/g, ' ')` redondants

3. **apps/web/hooks/useSmsAction.ts**
   - Normalisation dans `handleBackupMethod()`
   - Commandes console.info corrigées

## Résultat

✅ Tous les modèles SMS fonctionnent maintenant :
- Premier contact
- D0 Visio
- R0 interne
- R0 externe

Les caractères accentués (à, é, ô...) ne posent aucun problème. C'est uniquement le quoting + newlines + apostrophes typographiques qui causaient les échecs.

## Note technique

Ce ne sont pas des "caractères interdits dans un SMS", mais des problèmes de quoting shell lors du passage de la commande à `adb shell` via `exec()`.
