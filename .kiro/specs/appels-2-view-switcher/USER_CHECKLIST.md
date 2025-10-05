# Checklist de vérification - ViewSwitcher dans Appels 2

## ✅ Checklist pour l'utilisateur

Utilisez cette checklist pour vérifier que tout fonctionne correctement après l'implémentation.

### 🎯 Tests de base

- [ ] **Compilation** : L'application compile sans erreur
- [ ] **Démarrage** : L'application démarre correctement
- [ ] **Navigation** : La page "Appels 2" s'affiche correctement

### 🔄 ViewSwitcher

- [ ] **Visibilité** : Le ViewSwitcher est visible dans la navbar
- [ ] **Position** : Le ViewSwitcher est positionné entre les Tabs et le bouton Autocall
- [ ] **Bouton Cards** : Le bouton "Cards" affiche l'icône LayoutGrid et le texte "Cards"
- [ ] **Bouton Table** : Le bouton "Table" affiche l'icône Table2 et le texte "Table"
- [ ] **État actif** : Le bouton de la vue active est mis en surbrillance
- [ ] **Clic Cards** : Cliquer sur "Cards" affiche la vue cards
- [ ] **Clic Table** : Cliquer sur "Table" affiche la vue table
- [ ] **Transition** : Le changement de vue est instantané (< 100ms)

### 📋 Vue Cards (existante)

- [ ] **Affichage** : La vue cards s'affiche correctement
- [ ] **Liste contacts** : La liste des contacts est visible
- [ ] **Recherche** : La recherche fonctionne
- [ ] **Sélection** : La sélection d'un contact fonctionne
- [ ] **Détails** : Les détails du contact s'affichent
- [ ] **Édition** : L'édition des champs fonctionne
- [ ] **Historique** : L'historique des appels s'affiche
- [ ] **Actions** : Toutes les actions (Appel, SMS, Email, etc.) fonctionnent

### 📊 Vue Table (nouvelle)

- [ ] **Affichage** : La vue table s'affiche correctement
- [ ] **Colonnes** : Toutes les colonnes sont visibles (#, Prénom, Nom, Téléphone, Email, Statut, Commentaire, Date Rappel, Heure Rappel, Date RDV, Heure RDV, Date Appel, Heure Appel, Durée Appel)
- [ ] **Données** : Les données correspondent aux contacts de la vue cards
- [ ] **Tri** : Cliquer sur un en-tête de colonne trie les données
- [ ] **Tri inversé** : Cliquer à nouveau inverse le tri
- [ ] **Indicateur tri** : Une flèche indique la colonne triée et la direction
- [ ] **Sélection** : Cliquer sur une ligne sélectionne le contact
- [ ] **Mise en surbrillance** : La ligne sélectionnée est mise en surbrillance
- [ ] **Checkbox** : Les checkboxes de sélection fonctionnent
- [ ] **Checkbox all** : La checkbox "Tout sélectionner" fonctionne
- [ ] **Édition inline** : Double-cliquer sur une cellule permet l'édition
- [ ] **Validation Enter** : Appuyer sur Enter valide l'édition
- [ ] **Annulation Escape** : Appuyer sur Escape annule l'édition
- [ ] **Mise à jour** : Les modifications sont sauvegardées

### 💾 Persistance

- [ ] **Sauvegarde** : Changer de vue sauvegarde la préférence
- [ ] **Restauration** : Recharger la page restaure la vue sélectionnée
- [ ] **localStorage** : La clé 'appels-2-view-mode' existe dans localStorage
- [ ] **Valeur** : La valeur est 'cards' ou 'table'

### 🔄 Préservation du contexte

- [ ] **Filtres tabs** : Les tabs (Désactivé/LinkedIn/Google/Lien) sont préservés lors du changement de vue
- [ ] **Recherche** : Le texte de recherche est préservé
- [ ] **Sélection** : Le contact sélectionné est préservé
- [ ] **Scroll** : Le scroll est réinitialisé au top lors du changement de vue
- [ ] **Pas de rechargement** : Aucun rechargement de données n'est visible

### 🎨 Fonctionnalités communes

- [ ] **Import** : Le bouton Import fonctionne dans les deux vues
- [ ] **Export** : Le bouton Export fonctionne dans les deux vues
- [ ] **Supprimer** : Le bouton Supprimer fonctionne dans les deux vues
- [ ] **Autocall** : Le bouton Autocall fonctionne dans les deux vues
- [ ] **Tabs** : Les tabs de recherche automatique fonctionnent dans les deux vues

### ⌨️ Raccourcis clavier

- [ ] **F1** : Appeler le contact sélectionné (dans les deux vues)
- [ ] **F2-F10** : Appliquer un statut (dans les deux vues)
- [ ] **Tab** : Naviguer entre les éléments
- [ ] **Enter** : Activer le ViewSwitcher
- [ ] **Escape** : Annuler l'édition inline (vue table)

### 📱 Responsive

#### Desktop (> 1024px)
- [ ] **ViewSwitcher** : Visible et accessible
- [ ] **Vue cards** : Affichage correct
- [ ] **Vue table** : Toutes les colonnes visibles
- [ ] **Scroll** : Pas de scroll horizontal nécessaire

#### Tablette (768px - 1024px)
- [ ] **ViewSwitcher** : Visible et accessible
- [ ] **Vue cards** : Affichage correct
- [ ] **Vue table** : Scroll horizontal disponible
- [ ] **Colonnes** : Toutes les colonnes accessibles

#### Mobile (< 768px)
- [ ] **ViewSwitcher** : Visible et accessible
- [ ] **Texte** : Le texte "Cards" et "Table" peut être masqué (hidden sm:inline)
- [ ] **Icônes** : Les icônes restent visibles
- [ ] **Vue cards** : Affichage correct
- [ ] **Vue table** : Scroll horizontal disponible

### ♿ Accessibilité

- [ ] **Labels ARIA** : Les boutons ont des labels appropriés
- [ ] **Navigation clavier** : Tous les éléments sont accessibles au clavier
- [ ] **Focus** : Le focus est visible
- [ ] **Contraste** : Le contraste des couleurs est suffisant
- [ ] **Lecteur d'écran** : Les annonces sont appropriées (si testé)

### 🐛 Tests de régression

- [ ] **Aucune régression** : Toutes les fonctionnalités existantes fonctionnent toujours
- [ ] **Performance** : Aucun ralentissement visible
- [ ] **Mémoire** : Pas de fuite mémoire (vérifier avec DevTools)
- [ ] **Console** : Pas d'erreur dans la console
- [ ] **Warnings** : Seulement des warnings pour variables non utilisées (normaux)

### 🧪 Tests avec données

#### Avec 0 contact
- [ ] **Vue cards** : Message "Aucun contact"
- [ ] **Vue table** : Message "Aucun contact à afficher"

#### Avec 1 contact
- [ ] **Vue cards** : Le contact s'affiche
- [ ] **Vue table** : Le contact s'affiche dans la table

#### Avec 10 contacts
- [ ] **Vue cards** : Tous les contacts s'affichent
- [ ] **Vue table** : Tous les contacts s'affichent
- [ ] **Tri** : Le tri fonctionne correctement

#### Avec 100+ contacts
- [ ] **Vue cards** : Scroll fluide
- [ ] **Vue table** : Scroll fluide
- [ ] **Performance** : Changement de vue instantané
- [ ] **Tri** : Le tri reste rapide

### 🎯 Tests de cas limites

- [ ] **Contact sans nom** : Affiche "Sans nom"
- [ ] **Contact sans email** : Affiche une cellule vide
- [ ] **Contact sans dates** : Affiche des cellules vides
- [ ] **Caractères spéciaux** : Les caractères spéciaux s'affichent correctement
- [ ] **Numéros longs** : Les numéros de téléphone longs s'affichent correctement
- [ ] **Emails longs** : Les emails longs sont tronqués avec ellipse

### 📸 Captures d'écran suggérées

Pour documenter l'implémentation, prendre des captures d'écran de :
1. [ ] Vue cards avec ViewSwitcher visible
2. [ ] Vue table avec tous les contacts
3. [ ] ViewSwitcher en état actif (Cards)
4. [ ] ViewSwitcher en état actif (Table)
5. [ ] Édition inline dans la vue table
6. [ ] Tri des colonnes (avec flèche visible)
7. [ ] Sélection de contact dans la vue table
8. [ ] Vue responsive sur mobile

## 📊 Résumé

- **Total de tests** : 100+
- **Tests critiques** : 30
- **Tests de régression** : 10
- **Tests responsive** : 12
- **Tests accessibilité** : 5

## ✅ Validation finale

Une fois tous les tests cochés :
- [ ] **Tous les tests passent** : Tous les tests de la checklist sont validés
- [ ] **Aucune régression** : Aucune fonctionnalité existante n'est cassée
- [ ] **Performance OK** : Aucun ralentissement visible
- [ ] **Prêt pour production** : L'implémentation est prête à être déployée

## 🎉 Félicitations !

Si tous les tests sont validés, l'implémentation est **100% fonctionnelle** et prête pour la production ! 🚀

## 📝 Notes

Utilisez cette section pour noter tout problème rencontré ou suggestion d'amélioration :

```
[Vos notes ici]
```
