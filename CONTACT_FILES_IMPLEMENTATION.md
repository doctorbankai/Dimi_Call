# Implémentation de l'affichage des fichiers attachés aux contacts

## ✅ Fonctionnalités implémentées

### 1. Composant ContactFiles
**Fichier:** `src/components/contacts/ContactFiles.tsx`

- Affiche la liste des fichiers attachés à un contact
- Récupère les IDs des fichiers via `getContactAttachments(contactId)`
- Charge les métadonnées des fichiers via `getFileById()`
- Affiche les icônes appropriées selon le type de fichier
- Actions disponibles :
  - **Ouvrir** : Ouvre le fichier avec l'application par défaut
  - **Afficher dans le dossier** : Ouvre l'explorateur de fichiers
  - **Détacher** : Retire le fichier du contact

### 2. Service getFileById
**Fichier:** `src/services/fileManagerService.ts`

- Nouvelle fonction `getFileById(fileId: string)` pour récupérer un fichier par son ID
- Utilise un cache localStorage pour améliorer les performances
- Fallback sur le cache si l'API Electron n'est pas disponible

### 3. Handlers Electron
**Fichier:** `electron/handlers/fileHandlers.ts`

Trois nouveaux handlers IPC :

#### `file:get-file-by-id`
- Recherche récursive dans le répertoire de stockage
- Retourne les métadonnées complètes du fichier

#### `file:open-file`
- Ouvre un fichier avec l'application par défaut du système
- Utilise `shell.openPath()`

#### `file:show-in-folder`
- Affiche le fichier dans l'explorateur de fichiers
- Utilise `shell.showItemInFolder()`

### 4. Preload API
**Fichier:** `electron/preload.ts`

Exposition des nouvelles APIs :
```typescript
getFileById: (fileId: string) => Promise<{ success: boolean; file?: any; error?: any }>

files: {
  openFile: (path: string) => Promise<{ success: boolean; error?: string }>
  showInFolder: (path: string) => Promise<{ success: boolean; error?: string }>
}
```

### 5. Intégration dans les dialogs de contact

#### ContactDetailSheet (mode cards)
**Fichier:** `src/components/contacts/ContactDetailSheet.tsx`
- Onglet "Fichiers" maintenant fonctionnel
- Utilise le composant `ContactFiles`

#### AnnuairePage (mode table/dialog)
**Fichier:** `src/components/AnnuairePage.tsx`
- Onglet "Fichiers" dans le dialog principal
- Utilise le composant `ContactFiles`

### 6. Types TypeScript
**Fichier:** `src/types.ts`

Ajout des types pour les nouvelles APIs :
```typescript
files?: {
  openFile: (path: string) => Promise<{ success: boolean; error?: string }>;
  showInFolder: (path: string) => Promise<{ success: boolean; error?: string }>;
};

getFileById?: (fileId: string) => Promise<{ success: boolean; file?: any; error?: any }>;
```

## 🎯 Flux d'utilisation

### Attacher un fichier à un contact
1. Aller dans la page **Files**
2. Clic droit sur un fichier
3. Sélectionner **"Attach to Contact"**
4. Choisir le contact dans la liste
5. Cliquer sur **"Attach"**

### Voir les fichiers d'un contact
1. Aller dans la page **Annuaire**
2. Cliquer sur un contact
3. Aller dans l'onglet **"Fichiers"**
4. La liste des fichiers attachés s'affiche

### Actions sur les fichiers
- **Ouvrir** : Ouvre le fichier (PDF, image, document, etc.)
- **Afficher dans le dossier** : Ouvre l'explorateur Windows au bon emplacement
- **Détacher** : Retire le lien entre le fichier et le contact (le fichier n'est pas supprimé)

## 📁 Structure des fichiers modifiés/créés

```
src/
├── components/
│   ├── contacts/
│   │   ├── ContactFiles.tsx          [NOUVEAU]
│   │   └── ContactDetailSheet.tsx    [MODIFIÉ]
│   └── AnnuairePage.tsx              [MODIFIÉ]
├── services/
│   ├── fileManagerService.ts         [MODIFIÉ]
│   └── fileAttachmentService.ts      [EXISTANT]
└── types.ts                          [MODIFIÉ]

electron/
├── handlers/
│   └── fileHandlers.ts               [MODIFIÉ]
└── preload.ts                        [MODIFIÉ]
```

## 🔧 Stockage des données

Les associations fichier-contact sont stockées dans **localStorage** :
- Clé : `dimicall-file-attachments`
- Format :
```json
{
  "contacts": {
    "contact-id-1": ["file-id-1", "file-id-2"],
    "contact-id-2": ["file-id-3"]
  },
  "calls": {
    "call-id-1": ["file-id-4"]
  }
}
```

Le cache des métadonnées de fichiers :
- Clé : `file-cache-{fileId}`
- Contient les métadonnées complètes du fichier

## ⚡ Performances

- **Cache localStorage** : Évite de rechercher les fichiers à chaque affichage
- **Recherche récursive optimisée** : Parcourt uniquement le répertoire de stockage
- **Chargement asynchrone** : Les fichiers sont chargés en parallèle

## 🎨 Interface utilisateur

- **État vide** : Message clair quand aucun fichier n'est attaché
- **Icônes par type** : Chaque type de fichier a son icône (PDF, image, vidéo, etc.)
- **Informations** : Taille du fichier et date de modification
- **Actions rapides** : Boutons d'action accessibles directement

## 🚀 Prochaines améliorations possibles

1. **Drag & Drop** : Glisser-déposer des fichiers directement dans l'onglet
2. **Prévisualisation** : Aperçu des images/PDF dans le dialog
3. **Filtres** : Filtrer par type de fichier
4. **Recherche** : Rechercher dans les fichiers attachés
5. **Statistiques** : Nombre total de fichiers, espace utilisé
6. **Export** : Exporter tous les fichiers d'un contact

## ✅ Tests à effectuer

- [ ] Attacher un fichier à un contact depuis la page Files
- [ ] Voir les fichiers dans l'onglet Fichiers du contact (mode cards)
- [ ] Voir les fichiers dans l'onglet Fichiers du contact (mode table/dialog)
- [ ] Ouvrir un fichier PDF
- [ ] Ouvrir une image
- [ ] Afficher un fichier dans l'explorateur
- [ ] Détacher un fichier d'un contact
- [ ] Vérifier que le fichier n'est pas supprimé après détachement
- [ ] Attacher plusieurs fichiers au même contact
- [ ] Vérifier le cache localStorage

## 📝 Notes

- Les fichiers ne sont jamais supprimés du disque, seul le lien est retiré
- Le système fonctionne avec n'importe quel type de fichier
- Compatible avec le gestionnaire de fichiers existant
- Pas de limite sur le nombre de fichiers attachés
