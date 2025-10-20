# 🧪 Guide de Test - Importation CSV

## 🎯 Objectif
Vérifier que l'importation CSV fonctionne correctement avec les délimiteurs **virgule (`,`)** et **point-virgule (`;`)**.

## 📋 Prérequis
- DimiCall installé et lancé
- Fichiers de test CSV (générés ou existants)
- Console développeur ouverte (F12) pour voir les logs

## 🚀 Méthode 1 : Test avec l'Interface HTML

### Étape 1 : Ouvrir le fichier de test
1. Ouvrez `test-csv-delimiters.html` dans votre navigateur
2. Vous verrez 3 sections :
   - Génération de fichiers de test
   - Test de détection
   - Résultats

### Étape 2 : Générer les fichiers de test
Cliquez sur les boutons pour générer :
- ✅ **CSV avec virgules** → `test-virgule.csv`
- ✅ **CSV avec point-virgules** → `test-point-virgule.csv`
- ✅ **TSV avec tabulations** → `test-tabulation.tsv`
- ✅ **CSV mixte avec guillemets** → `test-mixte-guillemets.csv`

### Étape 3 : Tester la détection
1. Cliquez sur "Choisir un fichier"
2. Sélectionnez un des fichiers générés
3. Cliquez sur "Analyser le fichier"
4. Vérifiez les résultats :
   - Délimiteur détecté
   - Niveau de confiance
   - Aperçu des données

### Étape 4 : Importer dans DimiCall
1. Ouvrez DimiCall
2. Allez dans la vue "Appels Cards" ou "Table"
3. Cliquez sur le bouton d'import (icône Upload)
4. Sélectionnez un des fichiers de test
5. Vérifiez :
   - ✅ Toast de notification avec le délimiteur détecté
   - ✅ Données importées correctement
   - ✅ Logs dans la console (F12)

## 🔍 Méthode 2 : Test Manuel avec Fichiers Réels

### Créer un CSV avec virgules
Créez un fichier `test-virgule.csv` :
```csv
Prénom,Nom,Téléphone,Mail,École/Source,Statut,Commentaire
Jean,Dupont,0612345678,jean.dupont@example.com,HEC Paris,À rappeler,Intéressé
Marie,Martin,0623456789,marie.martin@example.com,ESSEC,RDV fixé,RDV le 15/03
Pierre,Durand,0634567890,pierre.durand@example.com,Sciences Po,Non joignable,Rappeler demain
```

### Créer un CSV avec point-virgules
Créez un fichier `test-point-virgule.csv` :
```csv
Prénom;Nom;Téléphone;Mail;École/Source;Statut;Commentaire
Jean;Dupont;0612345678;jean.dupont@example.com;HEC Paris;À rappeler;Intéressé
Marie;Martin;0623456789;marie.martin@example.com;ESSEC;RDV fixé;RDV le 15/03
Pierre;Durand;0634567890;pierre.durand@example.com;Sciences Po;Non joignable;Rappeler demain
```

### Créer un CSV avec guillemets
Créez un fichier `test-guillemets.csv` :
```csv
Prénom,Nom,Téléphone,Mail,École/Source,Statut,Commentaire
Jean,Dupont,0612345678,jean.dupont@example.com,"HEC Paris, France",À rappeler,"Intéressé, mais occupé"
Marie,Martin,0623456789,marie.martin@example.com,"ESSEC Business School",RDV fixé,"RDV le 15/03, à 14h30"
```

### Importer dans DimiCall
1. Lancez DimiCall
2. Ouvrez la console (F12)
3. Importez chaque fichier un par un
4. Vérifiez les logs et les données

## ✅ Checklist de Validation

### Avant l'Import
- [ ] Fichier CSV créé avec le bon délimiteur
- [ ] Encodage UTF-8 (recommandé)
- [ ] En-têtes présents sur la première ligne
- [ ] Données cohérentes (même nombre de colonnes)

### Pendant l'Import
- [ ] Toast de notification affiché
- [ ] Délimiteur correct détecté
- [ ] Niveau de confiance > 70%
- [ ] Pas d'erreur dans la console

### Après l'Import
- [ ] Toutes les lignes importées
- [ ] Données correctement séparées en colonnes
- [ ] Numéros de téléphone formatés
- [ ] Champs avec guillemets correctement traités
- [ ] Pas de données manquantes

## 📊 Logs à Vérifier

### Console (F12)
Vous devriez voir :
```
📄 Traitement du fichier: test-virgule.csv (0.5MB)
🔍 Détection du délimiteur CSV:
  ✅ Délimiteur détecté: virgule (,)
  📊 Confiance: 95%
  📈 Moyenne d'occurrences: 6.0
  📉 Variance: 0.00
📊 Analyse des en-têtes:
En-têtes détectés: ["Prénom", "Nom", "Téléphone", ...]
Import CSV terminé: 3 contacts traités
```

### Toast de Notification
```
ℹ️ Délimiteur détecté: virgule (,)
   Confiance élevée
```

## 🐛 Problèmes Courants

### Problème 1 : Mauvais Délimiteur Détecté
**Symptômes :**
- Toutes les données dans une seule colonne
- Confiance < 30%

**Solutions :**
1. Vérifier le fichier dans un éditeur de texte
2. S'assurer que le délimiteur est cohérent
3. Vérifier qu'il n'y a pas de mélange de délimiteurs

### Problème 2 : Données Mal Séparées
**Symptômes :**
- Colonnes fusionnées
- Données dans les mauvaises colonnes

**Solutions :**
1. Utiliser des guillemets pour les champs contenant le délimiteur
2. Exemple : `"Dupont, Jean"` au lieu de `Dupont, Jean`
3. Vérifier l'encodage du fichier (UTF-8 recommandé)

### Problème 3 : Caractères Bizarres
**Symptômes :**
- Accents mal affichés (é → Ã©)
- Caractères spéciaux corrompus

**Solutions :**
1. Sauvegarder le fichier en UTF-8 avec BOM
2. Dans Excel : "Enregistrer sous" → "CSV UTF-8"
3. Dans Notepad++ : "Encodage" → "UTF-8 avec BOM"

### Problème 4 : Lignes Manquantes
**Symptômes :**
- Moins de lignes importées que dans le fichier
- Certains contacts absents

**Solutions :**
1. Vérifier qu'il n'y a pas de lignes vides
2. S'assurer que toutes les lignes ont le même nombre de colonnes
3. Vérifier les logs pour voir les lignes rejetées

## 📈 Cas de Test Avancés

### Test 1 : CSV avec Champs Vides
```csv
Prénom,Nom,Téléphone,Mail,École/Source,Statut,Commentaire
Jean,Dupont,0612345678,,,À rappeler,
Marie,,0623456789,marie@example.com,ESSEC,,
```
**Résultat attendu :** Import réussi, champs vides = chaînes vides

### Test 2 : CSV avec Guillemets Échappés
```csv
Prénom,Nom,Commentaire
Jean,Dupont,"Il a dit ""bonjour"""
Marie,Martin,"Adresse: ""Paris, France"""
```
**Résultat attendu :** Guillemets internes préservés

### Test 3 : CSV avec Sauts de Ligne dans les Champs
```csv
Prénom,Nom,Commentaire
Jean,Dupont,"Ligne 1
Ligne 2
Ligne 3"
```
**Résultat attendu :** Champ multi-lignes correctement importé

### Test 4 : Gros Fichier (10 000 lignes)
**Résultat attendu :**
- Import progressif par chunks
- Pas de blocage de l'interface
- Temps < 5 secondes

## 🎯 Critères de Succès

### Fonctionnel
- ✅ CSV avec virgules importé correctement
- ✅ CSV avec point-virgules importé correctement
- ✅ TSV avec tabulations importé correctement
- ✅ Champs avec guillemets gérés
- ✅ Délimiteur détecté automatiquement

### Performance
- ✅ Détection < 10ms
- ✅ Import 1000 lignes < 500ms
- ✅ Import 10000 lignes < 5s
- ✅ Pas de blocage de l'UI

### UX
- ✅ Toast informatif affiché
- ✅ Logs détaillés dans la console
- ✅ Niveau de confiance visible
- ✅ Pas d'erreur utilisateur

## 📝 Rapport de Test

### Template
```
Date: ___________
Testeur: ___________

Fichier testé: ___________
Délimiteur: ___________
Nombre de lignes: ___________

Résultats:
- Délimiteur détecté: ___________
- Confiance: ___________
- Lignes importées: ___________
- Erreurs: ___________

Commentaires:
___________________________________________
___________________________________________

Statut: ☐ Réussi  ☐ Échoué  ☐ Partiel
```

## 🔄 Tests de Régression

Après chaque modification du code d'import :
1. ✅ Tester les 4 types de fichiers (virgule, point-virgule, tab, mixte)
2. ✅ Vérifier les logs de détection
3. ✅ Valider les données importées
4. ✅ Tester avec un gros fichier (> 1000 lignes)
5. ✅ Vérifier la performance

## 📞 Support

En cas de problème :
1. Consulter `CSV_DELIMITER_DETECTION_GUIDE.md`
2. Vérifier les logs dans la console (F12)
3. Tester avec `test-csv-delimiters.html`
4. Vérifier le format du fichier source

---

**Dernière mise à jour :** 2025-01-20  
**Version :** 1.0.0
