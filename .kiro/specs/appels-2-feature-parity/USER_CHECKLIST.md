# ✅ Checklist utilisateur : Page "Appels 2"

## Guide de vérification rapide

Utilisez cette checklist pour vérifier que toutes les fonctionnalités fonctionnent correctement.

---

## 📥 Import de fichiers

### Test 1 : Import Excel
- [ ] Cliquer sur le bouton "Importer"
- [ ] Sélectionner un fichier `.xlsx` ou `.xls`
- [ ] Mapper les colonnes si nécessaire
- [ ] Cliquer sur "Valider"
- [ ] **Résultat attendu** : La liste des contacts s'affiche immédiatement

### Test 2 : Import CSV
- [ ] Cliquer sur le bouton "Importer"
- [ ] Sélectionner un fichier `.csv`
- [ ] Mapper les colonnes si nécessaire
- [ ] Cliquer sur "Valider"
- [ ] **Résultat attendu** : La liste des contacts s'affiche immédiatement

### Test 3 : Drag & Drop
- [ ] Glisser-déposer un fichier Excel/CSV sur la page
- [ ] Mapper les colonnes si nécessaire
- [ ] Cliquer sur "Valider"
- [ ] **Résultat attendu** : La liste des contacts s'affiche immédiatement

---

## 🔍 Recherche automatique

### Test 4 : Option "Désactivé"
- [ ] Sélectionner l'onglet "Désactivé"
- [ ] Sélectionner un contact
- [ ] Appuyer sur F1 pour appeler
- [ ] **Résultat attendu** : Aucune recherche automatique ne se lance

### Test 5 : Option "LinkedIn"
- [ ] Sélectionner l'onglet "LinkedIn"
- [ ] Sélectionner un contact
- [ ] Appuyer sur F1 pour appeler
- [ ] **Résultat attendu** : Recherche LinkedIn s'ouvre automatiquement

### Test 6 : Option "Google"
- [ ] Sélectionner l'onglet "Google"
- [ ] Sélectionner un contact
- [ ] Appuyer sur F1 pour appeler
- [ ] **Résultat attendu** : Recherche Google s'ouvre automatiquement

### Test 7 : Option "Lien"
- [ ] Sélectionner l'onglet "Lien"
- [ ] Sélectionner un contact avec un lien
- [ ] Appuyer sur F1 pour appeler
- [ ] **Résultat attendu** : Le lien s'ouvre automatiquement

---

## 🎨 Interface et accessibilité

### Test 8 : Tooltip Autocall (mode clair)
- [ ] Passer en mode clair (si en mode sombre)
- [ ] Survoler le bouton "Autocall"
- [ ] **Résultat attendu** : Tooltip lisible avec texte noir sur fond clair

### Test 9 : Tooltip Autocall (mode sombre)
- [ ] Passer en mode sombre (si en mode clair)
- [ ] Survoler le bouton "Autocall"
- [ ] **Résultat attendu** : Tooltip lisible avec texte clair sur fond sombre

---

## 📱 Responsivité

### Test 10 : Mobile (< 768px)
- [ ] Réduire la fenêtre à moins de 768px de largeur
- [ ] **Résultat attendu** : 
  - Liste des contacts visible en haut (max 300px de hauteur)
  - Détails du contact en dessous
  - Scroll fonctionne dans la liste

### Test 11 : Tablet (768-1024px)
- [ ] Ajuster la fenêtre entre 768px et 1024px
- [ ] **Résultat attendu** : 
  - Liste des contacts visible en haut
  - Détails du contact en dessous
  - Interface adaptée à la taille

### Test 12 : Desktop (> 1024px)
- [ ] Agrandir la fenêtre à plus de 1024px
- [ ] **Résultat attendu** : 
  - Liste des contacts sur le côté gauche
  - Détails du contact sur la droite
  - Layout horizontal

---

## 📊 Export

### Test 13 : Export Excel
- [ ] Cliquer sur le bouton "Exporter"
- [ ] Cliquer sur "Exporter (Excel uniquement)"
- [ ] Choisir l'emplacement de sauvegarde
- [ ] **Résultat attendu** : 
  - Fichier Excel téléchargé
  - Toutes les colonnes présentes
  - Toutes les données correctes

---

## 💾 Sauvegarde automatique

### Test 14 : Sauvegarde commentaire (debounce)
- [ ] Sélectionner un contact
- [ ] Modifier le commentaire
- [ ] Attendre 1 seconde (ne rien faire)
- [ ] Fermer l'application
- [ ] Rouvrir l'application
- [ ] Sélectionner le même contact
- [ ] **Résultat attendu** : Le commentaire modifié est toujours là

### Test 15 : Sauvegarde statut (immédiate)
- [ ] Sélectionner un contact
- [ ] Appuyer sur F2 (ou autre touche F2-F10)
- [ ] Fermer immédiatement l'application (sans attendre)
- [ ] Rouvrir l'application
- [ ] Sélectionner le même contact
- [ ] **Résultat attendu** : Le statut appliqué est toujours là

### Test 16 : Sauvegarde dates
- [ ] Sélectionner un contact
- [ ] Modifier la date de rappel
- [ ] Attendre 1 seconde
- [ ] Fermer l'application
- [ ] Rouvrir l'application
- [ ] Sélectionner le même contact
- [ ] **Résultat attendu** : La date de rappel est toujours là

### Test 17 : Crash simulé
- [ ] Importer un fichier avec plusieurs contacts
- [ ] Modifier plusieurs contacts (statuts, commentaires, dates)
- [ ] Fermer brutalement l'application (Alt+F4 ou Cmd+Q)
- [ ] Rouvrir l'application
- [ ] **Résultat attendu** : 
  - Tous les contacts importés sont là
  - Toutes les modifications sont présentes
  - Aucune perte de données

### Test 18 : Rechargement page
- [ ] Modifier plusieurs contacts
- [ ] Recharger la page (F5 ou Ctrl+R)
- [ ] **Résultat attendu** : 
  - Tous les contacts sont toujours là
  - Toutes les modifications sont présentes

---

## 🎯 Fonctionnalités avancées

### Test 19 : Mode Autocall
- [ ] Activer le mode Autocall (cliquer sur le bouton)
- [ ] Sélectionner un contact
- [ ] Appuyer sur F1 pour appeler
- [ ] Appuyer sur F2 (ou autre statut)
- [ ] **Résultat attendu** : 
  - Le statut est appliqué
  - Le contact suivant est automatiquement sélectionné
  - L'appel du contact suivant démarre automatiquement

### Test 20 : Raccourcis clavier
- [ ] Sélectionner un contact
- [ ] Tester F1 : Appeler
- [ ] Tester F2-F10 : Appliquer différents statuts
- [ ] **Résultat attendu** : Tous les raccourcis fonctionnent

---

## 📋 Résumé des résultats

| Test | Statut | Notes |
|------|--------|-------|
| 1. Import Excel | ⬜ |  |
| 2. Import CSV | ⬜ |  |
| 3. Drag & Drop | ⬜ |  |
| 4. Désactivé | ⬜ |  |
| 5. LinkedIn | ⬜ |  |
| 6. Google | ⬜ |  |
| 7. Lien | ⬜ |  |
| 8. Tooltip clair | ⬜ |  |
| 9. Tooltip sombre | ⬜ |  |
| 10. Mobile | ⬜ |  |
| 11. Tablet | ⬜ |  |
| 12. Desktop | ⬜ |  |
| 13. Export Excel | ⬜ |  |
| 14. Sauvegarde commentaire | ⬜ |  |
| 15. Sauvegarde statut | ⬜ |  |
| 16. Sauvegarde dates | ⬜ |  |
| 17. Crash simulé | ⬜ |  |
| 18. Rechargement page | ⬜ |  |
| 19. Mode Autocall | ⬜ |  |
| 20. Raccourcis clavier | ⬜ |  |

---

## 🐛 Signalement de bugs

Si un test échoue, noter :
1. **Numéro du test** : Test X
2. **Comportement attendu** : Ce qui devrait se passer
3. **Comportement observé** : Ce qui se passe réellement
4. **Étapes pour reproduire** : Comment reproduire le problème
5. **Logs console** : Copier les messages d'erreur de la console (F12)

---

## ✅ Validation finale

Une fois tous les tests passés :
- [ ] Tous les tests sont ✅
- [ ] Aucun bug critique détecté
- [ ] L'application est prête pour la production

**Date de validation** : _______________

**Validé par** : _______________

**Signature** : _______________
