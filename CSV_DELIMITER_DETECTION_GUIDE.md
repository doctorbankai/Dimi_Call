# 🔍 Guide de Détection Automatique des Délimiteurs CSV

## 📋 Vue d'ensemble

DimiCall détecte maintenant automatiquement le délimiteur utilisé dans vos fichiers CSV, qu'il s'agisse de :
- **Virgule (`,`)** - Format CSV standard international
- **Point-virgule (`;`)** - Format CSV européen (Excel France)
- **Tabulation (`\t`)** - Format TSV

## ✨ Améliorations apportées

### 1. Détection Intelligente Multi-Lignes
- Analyse des **3 premières lignes** au lieu d'une seule
- Calcul de la **cohérence** des délimiteurs (variance faible = bon délimiteur)
- **Score de confiance** pour évaluer la fiabilité de la détection

### 2. Gestion des Guillemets
- Support des champs entre guillemets contenant des délimiteurs
- Exemple : `"Dupont, Jean"` ne sera pas séparé en deux colonnes
- Configuration Papa Parse optimisée :
  ```typescript
  quoteChar: '"',
  escapeChar: '"',
  newline: '' // Auto-détection
  ```

### 3. Feedback Utilisateur
- Toast informatif affichant le délimiteur détecté
- Indication du niveau de confiance :
  - ✅ **Confiance élevée** (>70%) : Détection fiable
  - ℹ️ **Confiance moyenne** (30-70%) : Vérification recommandée
  - ⚠️ **Confiance faible** (<30%) : Fichier potentiellement mal formaté

### 4. Logs Détaillés
Console logs pour le débogage :
```
🔍 Détection du délimiteur CSV:
  ✅ Délimiteur détecté: point-virgule (;)
  📊 Confiance: 85%
  📈 Moyenne d'occurrences: 6.3
  📉 Variance: 0.47
```

## 🧪 Comment Tester

### Méthode 1 : Fichier HTML de Test
1. Ouvrez `test-csv-delimiters.html` dans votre navigateur
2. Générez des fichiers de test avec différents délimiteurs
3. Testez l'importation et vérifiez la détection

### Méthode 2 : Test Manuel
1. Créez un fichier CSV avec des virgules :
   ```csv
   Prénom,Nom,Téléphone,Mail
   Jean,Dupont,0612345678,jean@example.com
   ```

2. Créez un fichier CSV avec des point-virgules :
   ```csv
   Prénom;Nom;Téléphone;Mail
   Jean;Dupont;0612345678;jean@example.com
   ```

3. Importez chaque fichier dans DimiCall et vérifiez :
   - Le toast de notification
   - Les logs dans la console
   - Les données importées correctement

## 📊 Algorithme de Détection

### Étape 1 : Comptage
Pour chaque ligne analysée, compte les occurrences de chaque délimiteur potentiel (en ignorant ceux entre guillemets).

### Étape 2 : Calcul du Score
```typescript
score = moyenne_occurrences / (√variance + 1)
```
- **Moyenne élevée** = beaucoup de colonnes
- **Variance faible** = cohérence entre les lignes
- **Score élevé** = bon délimiteur

### Étape 3 : Sélection
Le délimiteur avec le score le plus élevé est sélectionné.

### Étape 4 : Confiance
```typescript
confiance = min(100, (score_meilleur / score_second) * 50)
```

## 🔧 Configuration Technique

### Fichier Modifié
- `src/services/dataService.ts`

### Fonctions Ajoutées/Modifiées
1. **`detectDelimiter(file: File)`**
   - Retourne : `{ delimiter: string, confidence: number }`
   - Analyse les 2048 premiers caractères
   - Calcule les scores de cohérence

2. **`importContactsFromFile()`**
   - Appelle `detectDelimiter()` avant le parsing
   - Affiche un toast avec le résultat
   - Configure Papa Parse avec les bons paramètres

### Paramètres Papa Parse
```typescript
{
  header: true,
  skipEmptyLines: true,
  delimiter: delimiter,      // Délimiteur détecté
  quoteChar: '"',           // Gestion des guillemets
  escapeChar: '"',          // Échappement
  newline: '',              // Auto-détection
  chunkSize: 1024 * 512     // Chunks de 512KB
}
```

## 📝 Cas d'Usage Supportés

### ✅ Formats Supportés
- CSV standard (virgules)
- CSV européen (point-virgules)
- TSV (tabulations)
- CSV avec guillemets
- CSV avec champs multi-lignes
- Fichiers avec BOM UTF-8

### ✅ Cas Spéciaux Gérés
- Champs contenant le délimiteur : `"Dupont, Jean"`
- Champs avec guillemets : `"Il a dit ""bonjour"""`
- Lignes vides (ignorées)
- Espaces autour des valeurs (trimés)
- Différents encodages (UTF-8 prioritaire)

### ⚠️ Limitations
- Fichiers > 50MB : Rejetés pour éviter les crashes
- Fichiers 20-50MB : Traitement avec précautions
- Confiance < 30% : Vérification manuelle recommandée

## 🐛 Débogage

### Problème : Mauvais Délimiteur Détecté
**Causes possibles :**
1. Fichier mal formaté (colonnes incohérentes)
2. Mélange de délimiteurs dans le fichier
3. Trop de délimiteurs dans les données elles-mêmes

**Solutions :**
1. Vérifier le fichier source dans un éditeur de texte
2. Nettoyer les données (supprimer les délimiteurs parasites)
3. Utiliser des guillemets pour les champs problématiques

### Problème : Confiance Faible
**Causes possibles :**
1. Nombre de colonnes variable entre les lignes
2. Fichier avec peu de colonnes (< 3)
3. Données très irrégulières

**Solutions :**
1. Vérifier la structure du fichier
2. S'assurer que toutes les lignes ont le même nombre de colonnes
3. Ajouter des colonnes vides si nécessaire

## 📚 Ressources

### Documentation Papa Parse
- [Papa Parse Documentation](https://www.papaparse.com/docs)
- [Configuration Options](https://www.papaparse.com/docs#config)

### Standards CSV
- [RFC 4180](https://tools.ietf.org/html/rfc4180) - CSV Standard
- [CSV sur Wikipedia](https://fr.wikipedia.org/wiki/Comma-separated_values)

## 🎯 Prochaines Améliorations Possibles

1. **Détection de l'encodage** (UTF-8, ISO-8859-1, etc.)
2. **Prévisualisation avant import** avec correction manuelle
3. **Sauvegarde des préférences** par source de fichier
4. **Support des formats Excel natifs** (.xls, .xlsx) - Déjà implémenté ✅
5. **Validation des données** pendant l'import
6. **Mapping automatique des colonnes** basé sur l'historique

## ✅ Checklist de Test

- [ ] Import CSV avec virgules
- [ ] Import CSV avec point-virgules
- [ ] Import TSV avec tabulations
- [ ] Import CSV avec guillemets
- [ ] Import CSV avec champs multi-lignes
- [ ] Vérification du toast de notification
- [ ] Vérification des logs console
- [ ] Test avec fichier > 20MB
- [ ] Test avec fichier mal formaté
- [ ] Test avec fichier vide

## 📞 Support

En cas de problème avec l'importation :
1. Vérifier les logs dans la console (F12)
2. Tester avec le fichier HTML de test
3. Vérifier le format du fichier source
4. Consulter ce guide pour les cas spéciaux

---

**Dernière mise à jour :** 2025-01-20  
**Version :** 1.0.0  
**Auteur :** DimiCall Team
