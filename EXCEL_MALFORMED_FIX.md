# Correction Automatique des Fichiers Excel Mal Formatés

## 🔍 Problème Identifié

Certains utilisateurs rencontrent un problème lors de l'importation de fichiers Excel où **toutes les colonnes sont regroupées dans une seule cellule** au lieu d'être séparées correctement.

### Symptômes

- Dans la boîte de dialogue de mapping, une seule colonne apparaît avec tous les en-têtes concaténés :
  ```
  "Date Rappel;Heure Rappel;Sexe;Prénom;Nom;Numéro;Mail;Source;Type;Qualité;Lien"
  ```
- Le mapping automatique ne fonctionne pas
- Les données ne sont pas importées correctement

### Cause

Le fichier Excel a été créé en copiant-collant du texte CSV dans une seule cellule au lieu de le répartir sur plusieurs colonnes. Cela arrive souvent quand :
- On copie du texte CSV depuis un éditeur de texte et on le colle dans Excel
- On ouvre un fichier CSV avec le mauvais encodage dans Excel
- On sauvegarde un fichier texte avec l'extension `.xlsx` sans conversion appropriée

## ✅ Solution Implémentée

### Détection Automatique

Le système détecte maintenant automatiquement ce problème en vérifiant si :
1. Il n'y a qu'une seule colonne dans le fichier Excel
2. Cette colonne contient des délimiteurs (`;`, `,`, ou `\t`)

### Correction Automatique

Quand le problème est détecté, le système :
1. **Identifie le délimiteur** utilisé (point-virgule, virgule, ou tabulation)
2. **Sépare automatiquement** les en-têtes en colonnes distinctes
3. **Corrige toutes les lignes de données** en appliquant le même délimiteur
4. **Affiche une notification** pour informer l'utilisateur de la correction

### Logs de Diagnostic

Les logs suivants apparaissent dans la console :
```
⚠️ Fichier Excel mal formaté détecté: tous les en-têtes dans une seule cellule
🔧 Correction automatique avec délimiteur ";": 11 colonnes détectées
```

Et un toast s'affiche :
```
⚠️ Fichier Excel corrigé automatiquement
Format CSV détecté dans une cellule unique. 11 colonnes extraites.
```

## 📝 Recommandations pour les Utilisateurs

### Pour Éviter ce Problème

1. **Ouvrir les fichiers CSV correctement dans Excel** :
   - Utiliser "Données" → "Importer depuis un fichier texte/CSV"
   - Spécifier le délimiteur correct (point-virgule pour les fichiers français)
   - Vérifier l'encodage (UTF-8)

2. **Créer des fichiers Excel natifs** :
   - Saisir les données directement dans Excel
   - Utiliser une colonne par champ
   - Sauvegarder au format `.xlsx`

3. **Vérifier avant l'import** :
   - Ouvrir le fichier dans Excel
   - Vérifier que chaque colonne est bien séparée
   - S'assurer que les en-têtes sont sur la première ligne

### Si le Problème Persiste

Si la correction automatique ne fonctionne pas :

1. **Convertir manuellement le fichier** :
   - Ouvrir le fichier dans Excel
   - Sélectionner la colonne contenant toutes les données
   - Utiliser "Données" → "Convertir" → "Délimité"
   - Choisir le délimiteur approprié
   - Sauvegarder le fichier

2. **Utiliser un fichier CSV** :
   - Sauvegarder au format `.csv` avec encodage UTF-8
   - Le système détectera automatiquement le délimiteur

## 🔧 Détails Techniques

### Code Modifié

Fichier : `src/services/dataService.ts`

```typescript
// 🔍 Détection et correction automatique des fichiers Excel mal formatés
if (originalHeaders.length === 1 && originalHeaders[0]) {
  const singleHeader = originalHeaders[0];
  const delimiters = [';', '\t', ','];
  
  for (const delimiter of delimiters) {
    if (singleHeader.includes(delimiter)) {
      const splitHeaders = singleHeader.split(delimiter).map(h => h.trim());
      
      if (splitHeaders.length > 1) {
        console.warn(`⚠️ Fichier Excel mal formaté détecté`);
        console.log(`🔧 Correction automatique: ${splitHeaders.length} colonnes`);
        
        originalHeaders = splitHeaders;
        
        // Corriger toutes les lignes de données
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (row.length === 1 && row[0] && typeof row[0] === 'string') {
            jsonData[i] = row[0].split(delimiter).map((cell: string) => cell.trim());
          }
        }
        
        break;
      }
    }
  }
}
```

### Ordre de Détection des Délimiteurs

1. **Point-virgule (`;`)** - Standard français
2. **Tabulation (`\t`)** - Fichiers TSV
3. **Virgule (`,`)** - Standard international

## 📊 Impact

- ✅ Correction automatique sans intervention utilisateur
- ✅ Support de tous les délimiteurs courants
- ✅ Notification claire pour l'utilisateur
- ✅ Logs détaillés pour le débogage
- ✅ Pas d'impact sur les fichiers correctement formatés

## 🧪 Tests

Pour tester la correction :

1. Créer un fichier Excel avec une seule colonne contenant :
   ```
   Date Rappel;Heure Rappel;Prénom;Nom;Téléphone
   06/10/2025;8:00 AM;Jean;Dupont;0601020304
   ```

2. Importer le fichier dans l'application

3. Vérifier les logs :
   - Message de détection
   - Nombre de colonnes extraites
   - Toast de notification

4. Vérifier le résultat :
   - Les colonnes sont correctement séparées
   - Le mapping automatique fonctionne
   - Les données sont importées correctement
