# 🧪 Guide de Test - Import CSV Point-Virgule

## 🎯 Objectif
Vérifier que l'import de fichiers CSV avec point-virgule (`;`) fonctionne correctement.

## 📋 Étapes de Test

### Option 1 : Test dans l'Application

1. **Lancer l'application**
   ```bash
   npm run dev
   ```

2. **Importer ton fichier CSV**
   - Cliquer sur le bouton d'import
   - Sélectionner ton fichier `Rappels.2025-10-15.xlsx` (ou le CSV problématique)
   - Observer les logs dans la console du navigateur (F12)

3. **Vérifier les logs**
   Tu devrais voir :
   ```
   🔍 Détection du délimiteur CSV:
     ✅ Délimiteur détecté: point-virgule (;)
     📊 Confiance: XX%
   ```

4. **Cas de succès Papa Parse**
   Si Papa Parse fonctionne :
   ```
   📊 Analyse des en-têtes:
   En-têtes détectés: ["Date Rappel", "Heure Rappel", "Sexe", ...]
   ```

5. **Cas de fallback manuel**
   Si Papa Parse échoue, tu verras :
   ```
   ❌ Erreur de parsing CSV: délimiteur non reconnu par Papa Parse
   🔧 Tentative de correction manuelle...
   ✅ En-têtes extraits manuellement: ["Date Rappel", "Heure Rappel", ...]
   ✅ Import CSV manuel terminé: XX contacts
   ```

### Option 2 : Test HTML Standalone

1. **Ouvrir le fichier de test**
   - Double-cliquer sur `test-csv-semicolon-fix.html`
   - Ou ouvrir dans un navigateur

2. **Sélectionner ton fichier CSV**
   - Cliquer sur "Choisir un fichier"
   - Sélectionner ton CSV avec point-virgule

3. **Cliquer sur "Tester l'import"**

4. **Vérifier les résultats**
   - ✅ Délimiteur détecté : point-virgule
   - ✅ Confiance : >50%
   - ✅ Colonnes détectées : 11 (ou le nombre attendu)
   - ✅ Tableau avec toutes les colonnes visibles

## ✅ Critères de Réussite

### Import Réussi
- [ ] Le délimiteur point-virgule est détecté automatiquement
- [ ] Toutes les colonnes sont séparées correctement
- [ ] Les données apparaissent dans des colonnes distinctes (pas tout sur une ligne)
- [ ] Le mapping des colonnes fonctionne
- [ ] Les 99 contacts (ou le nombre attendu) sont importés

### Affichage Correct
- [ ] Chaque colonne a son propre en-tête
- [ ] Les données sont alignées sous les bons en-têtes
- [ ] Pas de colonne unique contenant "Date Rappel;Heure Rappel;..."

## 🐛 Si ça ne fonctionne pas

### Vérifier l'encodage du fichier
```bash
# Sur Windows avec PowerShell
Get-Content test-semicolon-import.csv -Encoding UTF8 | Select-Object -First 3
```

### Vérifier les caractères de fin de ligne
Ouvrir le fichier dans un éditeur de texte et vérifier :
- Windows : `\r\n` (CRLF)
- Unix/Mac : `\n` (LF)

### Logs de débogage
Ouvrir la console du navigateur (F12) et chercher :
- Messages d'erreur en rouge
- Warnings en jaune
- Messages de succès en vert

## 📊 Exemple de Résultat Attendu

### Avant la correction ❌
```
Colonne 1: "Date Rappel;Heure Rappel;Sexe;Prénom;Nom;Numéro;Mail;Source;Type;Qualité;Lien"
```

### Après la correction ✅
```
Colonne 1: "Date Rappel"
Colonne 2: "Heure Rappel"
Colonne 3: "Sexe"
Colonne 4: "Prénom"
Colonne 5: "Nom"
Colonne 6: "Numéro"
Colonne 7: "Mail"
Colonne 8: "Source"
Colonne 9: "Type"
Colonne 10: "Qualité"
Colonne 11: "Lien"
```

## 🔄 Prochaines Actions

1. Tester avec ton fichier réel
2. Vérifier que toutes les données sont correctement importées
3. Confirmer que le mapping fonctionne
4. Si tout est OK, tu peux supprimer les fichiers de test :
   - `test-csv-semicolon-fix.html`
   - `test-semicolon-import.csv`
   - `TEST_CSV_SEMICOLON.md`
   - `CSV_SEMICOLON_FIX.md`
