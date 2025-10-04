# 🧪 Guide de test - Appels 2 Feature Parity

## Checklist de test rapide

### ✅ 1. Boutons X pour effacer dates/heures
- [ ] Sélectionner une date de rappel
- [ ] Vérifier que le bouton X apparaît
- [ ] Cliquer sur X
- [ ] Vérifier que la date est effacée
- [ ] Répéter pour: heure rappel, date RDV, heure RDV, date appel, heure appel

**Résultat attendu**: Toutes les dates/heures peuvent être effacées avec le bouton X

---

### ✅ 2. Widget Zap pour commentaires rapides
- [ ] Ouvrir le champ Notes d'un contact
- [ ] Cliquer sur l'icône Zap (⚡)
- [ ] Sélectionner "Accompagné"
- [ ] Vérifier que le texte est ajouté
- [ ] Ajouter un autre commentaire rapide
- [ ] Vérifier qu'ils sont séparés par un espace

**Résultat attendu**: Les commentaires rapides s'ajoutent au texte existant

---

### ✅ 3. Recherche automatique dans navbar
- [ ] Localiser le bouton de recherche (🔍) dans la navbar
- [ ] Cliquer dessus
- [ ] Vérifier les options: LinkedIn, Google, Lien direct
- [ ] Vérifier la section "Mode automatique"
- [ ] Sélectionner "LinkedIn" en mode automatique
- [ ] Changer de contact
- [ ] Vérifier que LinkedIn s'ouvre automatiquement

**Résultat attendu**: La recherche automatique se déclenche au changement de contact

---

### ✅ 4. Filtres rapides fonctionnels
- [ ] Cliquer sur le bouton Filtre (🔽)
- [ ] Sélectionner "À rappeler aujourd'hui"
- [ ] Vérifier que seuls les contacts avec rappel aujourd'hui s'affichent
- [ ] Vérifier l'indicateur visuel sur le bouton
- [ ] Tester "Avec RDV planifié"
- [ ] Tester "Statut à vérifier"
- [ ] Revenir à "Tous les prospects"

**Résultat attendu**: Chaque filtre affiche les bons contacts

---

### ✅ 5. Import avec mapping de colonnes
- [ ] Préparer un fichier CSV avec des contacts
- [ ] Cliquer sur "Importer"
- [ ] Sélectionner le fichier
- [ ] Vérifier que le dialogue de mapping s'ouvre
- [ ] Vérifier que les headers sont détectés
- [ ] Vérifier la preview des 5 premières lignes
- [ ] Mapper les colonnes manuellement si nécessaire
- [ ] Cliquer sur "Confirmer"
- [ ] Vérifier la barre de progression

**Résultat attendu**: Le dialogue de mapping s'ouvre et permet de mapper les colonnes

---

### ✅ 6. Drag & Drop de fichiers
- [ ] Préparer un fichier CSV
- [ ] Glisser le fichier sur la page
- [ ] Vérifier que l'overlay apparaît
- [ ] Déposer le fichier
- [ ] Vérifier que le dialogue de mapping s'ouvre
- [ ] Essayer avec un fichier .txt (invalide)
- [ ] Vérifier le message d'erreur

**Résultat attendu**: Le drag & drop fonctionne et valide les types de fichiers

---

### ✅ 7. Barre de progression d'import
- [ ] Importer un fichier
- [ ] Confirmer le mapping
- [ ] Vérifier que la barre de progression apparaît en bas à droite
- [ ] Vérifier que le pourcentage augmente
- [ ] Vérifier le message de statut
- [ ] Attendre la fin (100%)
- [ ] Vérifier que la barre disparaît après 2 secondes

**Résultat attendu**: La barre de progression s'affiche et se masque automatiquement

---

### ✅ 8. Scroll automatique intelligent
- [ ] Avoir une liste de plus de 40 contacts
- [ ] Sélectionner un contact en bas de liste (non visible)
- [ ] Vérifier que la liste scroll automatiquement
- [ ] Vérifier que le contact est centré
- [ ] Sélectionner un contact déjà visible
- [ ] Vérifier qu'il n'y a pas de scroll inutile

**Résultat attendu**: Le scroll est fluide et intelligent

---

### ✅ 9. Toast notifications de sauvegarde
- [ ] Modifier un champ d'un contact
- [ ] Cliquer sur "Sauvegarder"
- [ ] Vérifier que le bouton affiche un loader
- [ ] Vérifier que le toast de succès apparaît
- [ ] Vérifier le message "Contact sauvegardé"

**Résultat attendu**: Toast de confirmation après sauvegarde

---

### ✅ 10. Bouton Sauvegarder visible
- [ ] Ouvrir les détails d'un contact
- [ ] Localiser le bouton "Sauvegarder" en bas du formulaire
- [ ] Vérifier qu'il est bien visible
- [ ] Modifier un champ
- [ ] Cliquer sur "Sauvegarder"
- [ ] Vérifier le loader pendant la sauvegarde

**Résultat attendu**: Bouton visible et fonctionnel avec loader

---

### ✅ 11. Gestion d'erreurs
- [ ] Essayer de glisser un fichier .pdf
- [ ] Vérifier le toast d'erreur
- [ ] Vérifier le message "Format de fichier non supporté"
- [ ] Essayer d'importer un fichier corrompu
- [ ] Vérifier la gestion d'erreur

**Résultat attendu**: Messages d'erreur clairs et descriptifs

---

### ✅ 12. Persistance localStorage
- [ ] Activer le mode automatique LinkedIn
- [ ] Rafraîchir la page (F5)
- [ ] Vérifier que le mode est toujours actif
- [ ] Changer pour Google
- [ ] Rafraîchir
- [ ] Vérifier la persistance

**Résultat attendu**: Les préférences sont sauvegardées entre les sessions

---

## 🎯 Tests de régression

### Fonctionnalités existantes à vérifier
- [ ] La recherche par texte fonctionne toujours
- [ ] Les cartes de contacts s'affichent correctement
- [ ] Le CallControl fonctionne
- [ ] Les boutons LinkedIn/Google/Lien dans le panneau fonctionnent
- [ ] L'historique des appels s'affiche
- [ ] Le changement de statut fonctionne
- [ ] Le bouton "Supprimer" fonctionne
- [ ] Le bouton "Exporter" fonctionne

**Résultat attendu**: Aucune régression sur les fonctionnalités existantes

---

## 🚀 Tests de performance

### Avec 1000+ contacts
- [ ] Charger 1000+ contacts
- [ ] Vérifier que seuls 40 sont affichés initialement
- [ ] Scroller et cliquer sur "Afficher plus"
- [ ] Vérifier que 40 contacts supplémentaires se chargent
- [ ] Appliquer un filtre
- [ ] Vérifier que le filtrage est instantané
- [ ] Changer de contact rapidement
- [ ] Vérifier qu'il n'y a pas de lag

**Résultat attendu**: Performance fluide même avec beaucoup de contacts

---

## 📱 Tests de responsivité

### Sur différentes tailles d'écran
- [ ] Tester sur desktop (1920x1080)
- [ ] Tester sur laptop (1366x768)
- [ ] Tester sur tablet (768x1024)
- [ ] Vérifier que tous les boutons sont accessibles
- [ ] Vérifier que les dialogues sont bien centrés
- [ ] Vérifier que le texte est lisible

**Résultat attendu**: Interface responsive sur toutes les tailles

---

## ♿ Tests d'accessibilité

### Navigation au clavier
- [ ] Naviguer avec Tab entre les éléments
- [ ] Ouvrir les dropdowns avec Entrée
- [ ] Fermer avec Échap
- [ ] Vérifier les focus visibles
- [ ] Vérifier les labels ARIA

**Résultat attendu**: Navigation au clavier fluide

---

## 🎨 Tests visuels

### Thème dark/light
- [ ] Vérifier en mode dark
- [ ] Vérifier en mode light
- [ ] Vérifier les contrastes
- [ ] Vérifier les couleurs des badges
- [ ] Vérifier les icônes

**Résultat attendu**: Cohérence visuelle dans les deux thèmes

---

## ✅ Validation finale

Une fois tous les tests passés:
- [ ] Aucune erreur dans la console
- [ ] Aucun warning TypeScript
- [ ] Aucune régression
- [ ] Performance acceptable
- [ ] UX fluide

**Status**: ✅ PRÊT POUR LA PRODUCTION
