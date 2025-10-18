# Fix SMS : Apostrophes typographiques, sauts de ligne et caractères spéciaux

## Problème identifié

Les modèles SMS "Premier contact", "R0 interne" et "R0 externe" ne fonctionnaient pas, alors que "D0 Visio" fonctionnait parfaitement.

### Causes racines

1. **Sauts de ligne (`\n`)** : Dans `exec("adb shell ... --es sms_body "...")`, les retours à la ligne coupent la commande côté shell → le guillemet de fin n'arrive jamais → erreur "no closing quote"
   - ✅ D0 Visio : sur une seule ligne → fonctionne
   - ❌ Autres modèles : contiennent des lignes vides → cassent

2. **Apostrophes typographiques** (`'` U+2019) : Provoquent de la mojibake et perturbent le quoting shell

3. **Caractères spéciaux dans URLs** : Les `:`, `/`, `?`, `=` dans les URLs causent des erreurs avec `input text` Android → `NullPointerException`

4. **Encodage URI avec `%`** : Dans les URI `?body=`, cmd.exe tente d'expanser `%...%` → chaîne altérée

## Solution appliquée

### 1. Normalisation systématique avant envoi

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

### 2. Retour à `exec` avec normalisation

Après tests, `spawn` pose des problèmes avec les chemins Windows contenant des parenthèses (ex: `platform-tools (4)`).

**Solution finale** : Utiliser `exec` avec :
- Normalisation du message AVANT de construire la commande
- Chemin ADB entre guillemets doubles : `"${adbPath}"`
- Message normalisé (une seule ligne, apostrophes standards)
- Échappement minimal (guillemets doubles uniquement pour `--es sms_body`)

### 3. Méthodes d'envoi SMS (dans l'ordre de tentative)

1. Intent VIEW avec `smsto:` + body dans l'URI
2. Intent SENDTO avec `smsto:` + body dans l'URI
3. Intent SENDTO avec `smsto:` + `--es sms_body`
4. Intent VIEW avec `smsto:` + `--es sms_body`
5. **Fallback** : Ouvrir l'app SMS sans message (l'utilisateur saisit manuellement)

### 4. Suppression du fallback `input text`

L'ancien fallback avec `input text` a été retiré car :
- Ne supporte pas les caractères spéciaux (`:`, `/`, `?`, `=`)
- Cause des `NullPointerException` sur Android
- Peu fiable pour les messages longs

### Fichiers modifiés

1. **electron/main.ts**
   - `ipcMain.handle('adb:sms')` : Normalisation du message ajoutée
   - `ipcMain.handle('adb:send-sms')` : Normalisation + échappement minimal
   - Chemin ADB entre guillemets : `"${adbPath}"`
   - Fallback simplifié : ouverture SMS sans message pré-rempli
   - Suppression de la fonction `spawnAdb()` (problèmes avec chemins Windows)

2. **apps/web/hooks/useSmsAction.ts**
   - Réécriture complète pour utiliser l'API Electron IPC
   - Suppression de l'appel `fetch('/api/sms')` (Next.js inexistant)
   - Utilisation de `window.electron.adb.sendSms()` à la place
   - Remplacement de `react-toastify` par `sonner`
   - Gestion des warnings (message non pré-rempli)

3. **apps/web/types/electron.d.ts**
   - ✅ Nouveau fichier créé
   - Déclaration complète de l'interface `ElectronAPI`
   - Déclaration globale `window.electron`
   - Typage complet des méthodes ADB, DevTools, LocalDB, etc.

4. **src/types.ts**
   - Mise à jour de l'interface `ElectronAPI` (synchronisation avec preload)
   - Ajout de la déclaration globale `window.electron`

5. **apps/web/app/api/sms/route.ts**
   - ❌ Fichier supprimé (résidu Next.js incompatible avec Electron)

## Résultat

### Problème découvert après premier fix
- ✅ D0 Visio fonctionne (pas d'URL)
- ❌ Premier contact, R0 interne, R0 externe ne fonctionnent pas (contiennent des URLs)

**Cause** : `encodeURIComponent()` encode les URLs (`https://` → `https%3A%2F%2F`), ce qui empêche Android de les décoder correctement dans `?body=`

### Solution finale
1. **Inverser l'ordre des méthodes** : Essayer `--es sms_body` EN PREMIER
2. **`--es sms_body` passe le texte brut** sans encodage URI → les URLs restent intactes
3. **Échappement minimal** : Seulement backslashes et guillemets doubles
4. **Logs améliorés** : Afficher quelle méthode réussit réellement

### Résultat attendu
✅ Tous les modèles SMS devraient maintenant fonctionner :
- Premier contact (avec URLs)
- D0 Visio
- R0 interne (avec adresse)
- R0 externe (avec placeholder)

✅ Les caractères accentués (à, é, ô...) ne posent aucun problème

✅ Les URLs avec caractères spéciaux sont correctement gérées

## Note technique

Ce ne sont pas des "caractères interdits dans un SMS", mais des problèmes de :
1. Quoting shell lors du passage de la commande à `adb shell` via `exec()`
2. Limitations de `input text` Android pour les caractères spéciaux

La solution avec `spawn` + normalisation résout ces deux problèmes de manière élégante et fiable.
