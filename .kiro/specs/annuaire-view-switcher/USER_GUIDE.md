# Guide utilisateur - Annuaire View Switcher

## 🎯 Qu'est-ce que c'est ?

La page Annuaire dispose maintenant de deux modes d'affichage :
- **Vue Cards** : Affichage en cartes avec avatar et informations principales
- **Vue Table** : Affichage tabulaire compact avec toutes les colonnes

## 🚀 Comment l'utiliser ?

### Changer de vue

1. Ouvrez la page **Annuaire** dans l'application
2. Dans la barre de navigation en haut, vous verrez deux boutons :
   - 🔲 **Cards** : Vue en cartes (par défaut)
   - 📊 **Table** : Vue en tableau
3. Cliquez sur le bouton de votre choix
4. La vue change instantanément
5. Votre préférence est sauvegardée automatiquement

### Vue Cards (🔲)

**Avantages :**
- Visuel et facile à parcourir
- Avatar avec initiales
- Informations principales en un coup d'œil
- Idéal pour une vue d'ensemble

**Fonctionnalités :**
- Cliquez sur une carte pour voir tous les détails
- Cochez la case pour sélectionner un contact
- Utilisez les filtres en haut pour affiner la recherche

### Vue Table (📊)

**Avantages :**
- Affichage compact de toutes les informations
- Tri par colonne
- Idéal pour comparer plusieurs contacts
- Meilleur pour les exports et analyses

**Fonctionnalités :**
- **Tri** : Cliquez sur un en-tête de colonne pour trier
- **Sélection** : Cochez les cases pour sélectionner plusieurs contacts
- **Détails** : Cliquez sur une ligne pour voir tous les détails
- **Scroll horizontal** : Sur petits écrans, faites défiler horizontalement

## 📋 Colonnes disponibles (Vue Table)

1. ☑️ **Sélection** : Checkbox pour sélectionner
2. **#** : Numéro de ligne
3. **Prénom** : Prénom du contact
4. **Nom** : Nom du contact
5. **Téléphone** : Numéro formaté
6. **Email** : Adresse email
7. **Statut** : Badge coloré selon le statut
8. **Commentaire** : Dernière note
9. **Date Rappel** : Date du prochain rappel
10. **Heure Rappel** : Heure du prochain rappel
11. **Date RDV** : Date du rendez-vous
12. **Heure RDV** : Heure du rendez-vous
13. **Date Appel** : Date du dernier appel
14. **Heure Appel** : Heure du dernier appel
15. **Durée Appel** : Durée du dernier appel

## 🎨 Fonctionnalités communes

Les deux vues partagent les mêmes fonctionnalités :

### Recherche et filtres
- 🔍 Barre de recherche globale
- 📅 Filtres de date (Tout, Aujourd'hui, Cette semaine, Ce mois, Personnalisé)
- 🔄 Bouton de rafraîchissement

### Actions de sélection
- ☑️ Sélection multiple
- 🗑️ Suppression des contacts sélectionnés
- 📤 Transfert vers Appels
- ☁️ Partage Supabase

### Import/Export
- 📥 Import CSV ou Excel
- 📤 Export CSV ou Excel

## 💡 Astuces

### Vue Cards
- Utilisez la recherche pour trouver rapidement un contact
- Les badges de statut sont colorés pour une identification rapide
- Le nombre d'événements est affiché sur chaque carte

### Vue Table
- Cliquez plusieurs fois sur un en-tête pour alterner entre tri croissant/décroissant
- Utilisez Ctrl+Clic (ou Cmd+Clic sur Mac) pour sélectionner plusieurs lignes
- Sur mobile, faites défiler horizontalement pour voir toutes les colonnes

## ⌨️ Raccourcis clavier

- **Tab** : Naviguer entre les boutons de vue
- **Enter** : Activer le bouton sélectionné
- **Espace** : Cocher/décocher une checkbox

## 📱 Responsive

### Sur ordinateur
- Vue Cards : 3 colonnes
- Vue Table : Toutes les colonnes visibles

### Sur tablette
- Vue Cards : 2 colonnes
- Vue Table : Scroll horizontal

### Sur mobile
- Vue Cards : 1 colonne
- Vue Table : Scroll horizontal
- Texte des boutons caché (icônes uniquement)

## ❓ FAQ

### Ma préférence de vue est-elle sauvegardée ?
Oui ! Votre choix entre Cards et Table est automatiquement sauvegardé. La prochaine fois que vous ouvrirez la page Annuaire, vous retrouverez la vue que vous aviez choisie.

### Puis-je éditer les contacts dans la vue Table ?
Pas encore. L'édition inline est prévue mais nécessite une mise à jour du backend. Pour l'instant, cliquez sur une ligne pour ouvrir les détails et modifier.

### Les filtres sont-ils préservés quand je change de vue ?
Oui ! Tous vos filtres (recherche, date, sélection) sont préservés quand vous basculez entre les vues.

### Quelle vue est la meilleure ?
Cela dépend de votre usage :
- **Cards** : Pour parcourir et avoir une vue d'ensemble
- **Table** : Pour analyser, comparer et exporter des données

### Puis-je masquer certaines colonnes dans la vue Table ?
Pas encore, mais c'est prévu dans une future mise à jour.

## 🐛 Problèmes connus

Aucun problème majeur connu. Si vous rencontrez un bug, veuillez le signaler.

## 🎉 Profitez de votre nouvelle vue !

N'hésitez pas à basculer entre les deux vues selon vos besoins. C'est instantané et sans perte de données !
