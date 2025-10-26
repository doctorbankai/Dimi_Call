# 🐛 Debug - Attachements de fichiers aux contacts

## ✅ Correction majeure appliquée

### Problème identifié
Les IDs de fichiers étaient générés avec `uuidv4()` à chaque appel, ce qui créait un **nouvel ID différent** à chaque fois. Résultat : impossible de retrouver les fichiers attachés !

### Solution implémentée
Remplacement par un **ID stable basé sur le hash MD5 du chemin du fichier** :
```typescript
function generateFileId(filePath: string): string {
  return crypto.createHash('md5').update(filePath).digest('hex');
}
```

Maintenant, le même fichier aura **toujours le même ID**, peu importe quand on le charge.

## 🔍 Comment tester

### 1. Ouvrir la console du navigateur (F12)

### 2. Attacher un fichier à un contact
1. Aller dans **Files**
2. Clic droit sur un fichier
3. **"Attach to Contact"**
4. Choisir un contact
5. Cliquer **"Attach"**

**Dans la console, vous devriez voir :**
```
📎 [ATTACHMENT] Attaching file abc123... to contact contact-456...
✅ [ATTACHMENT] File attached successfully. Total files for contact: 1
📋 [ATTACHMENT] All attachments: { contacts: { ... }, calls: { ... } }
```

### 3. Vérifier dans l'annuaire
1. Aller dans **Annuaire**
2. Cliquer sur le contact
3. Aller dans l'onglet **"Fichiers"**

**Dans la console, vous devriez voir :**
```
🔄 [ContactFiles] Loading files for contact: contact-456...
📂 [ATTACHMENT] Getting attachments for contact contact-456...: 1 files
📋 [ATTACHMENT] File IDs: ["abc123..."]
🔍 [FILE] Searching for file with ID: abc123...
✅ [FILE] Found file: mon-document.pdf
✅ [ContactFiles] Loaded 1 valid files
```

### 4. Vérifier le localStorage
Dans la console du navigateur :
```javascript
JSON.parse(localStorage.getItem('dimicall-file-attachments'))
```

Vous devriez voir :
```json
{
  "contacts": {
    "contact-id-123": ["file-id-abc", "file-id-def"],
    "contact-id-456": ["file-id-xyz"]
  },
  "calls": {}
}
```

## 🔧 Si ça ne fonctionne toujours pas

### Étape 1 : Nettoyer le cache
```javascript
// Dans la console du navigateur
localStorage.removeItem('dimicall-file-attachments');
// Puis recharger la page
```

### Étape 2 : Vérifier que l'application Electron est bien redémarrée
- Fermez complètement l'application
- Relancez-la
- Les nouveaux handlers avec IDs stables doivent être chargés

### Étape 3 : Tester avec un nouveau fichier
- Créez un nouveau fichier de test dans `C:\DimiCall`
- Attachez-le à un contact
- Vérifiez dans l'annuaire

## 📊 Logs détaillés

### Lors de l'attachement
```
📎 [ATTACHMENT] Attaching file <fileId> to contact <contactId>
✅ [ATTACHMENT] File attached successfully. Total files for contact: X
📋 [ATTACHMENT] All attachments: {...}
```

### Lors du chargement dans l'annuaire
```
🔄 [ContactFiles] Loading files for contact: <contactId>
📂 [ATTACHMENT] Getting attachments for contact <contactId>: X files
📋 [ATTACHMENT] File IDs: [...]
🔍 [FILE] Searching for file with ID: <fileId>
✅ [FILE] Found file: <fileName>
✅ [ContactFiles] Loaded X valid files
```

### Si un fichier n'est pas trouvé
```
🔍 [FILE] Searching for file with ID: <fileId>
⚠️ [FILE] File not found with ID: <fileId>
```

Cela peut arriver si :
- Le fichier a été supprimé du disque
- Le fichier a été déplacé
- L'ID a été généré avec l'ancien système (avant la correction)

## 🎯 Solution si les anciens attachements ne fonctionnent pas

Les fichiers attachés **avant** cette correction ont des IDs invalides. Pour les réattacher :

1. **Nettoyer les anciens attachements :**
```javascript
localStorage.removeItem('dimicall-file-attachments');
```

2. **Réattacher les fichiers** avec le nouveau système

## ✅ Vérification finale

Pour confirmer que tout fonctionne :

1. ✅ Attacher un fichier → Toast "Attached to contact"
2. ✅ Voir les logs dans la console
3. ✅ Ouvrir l'annuaire → Onglet Fichiers
4. ✅ Le fichier apparaît dans la liste
5. ✅ Cliquer sur "Ouvrir" → Le fichier s'ouvre
6. ✅ Cliquer sur "Afficher dans le dossier" → L'explorateur s'ouvre
7. ✅ Cliquer sur "Détacher" → Le fichier disparaît de la liste

## 📝 Changements techniques

### Fichiers modifiés
- `electron/handlers/fileHandlers.ts` : IDs stables avec MD5
- `src/services/fileAttachmentService.ts` : Logs de debug
- `src/components/contacts/ContactFiles.tsx` : Logs de debug

### Avant (❌ Problème)
```typescript
id: uuidv4()  // Nouveau ID à chaque fois !
```

### Après (✅ Solution)
```typescript
id: crypto.createHash('md5').update(filePath).digest('hex')  // Toujours le même ID
```
