# Synchronisation de la vue Cards entre Annuaire et Appels 2

## Résumé des modifications

Ce document décrit les modifications apportées pour synchroniser le design de la vue "Cards" entre les pages "Annuaire" et "Appels 2", ainsi que le renommage de "Appels 2" en "Appels" dans la sidebar.

## Modifications effectuées

### 1. Nouveau composant `AnnuaireCardsView.tsx`

**Fichier créé :** `src/components/AnnuaireCardsView.tsx`

Un nouveau composant a été créé pour la vue Cards de l'Annuaire, basé sur le design d'`AppelsCardsView.tsx`. Ce composant offre :

- **Layout en deux colonnes** :
  - Colonne gauche : Liste scrollable des contacts avec recherche intégrée
  - Colonne droite : Détails du contact sélectionné

- **Design des cartes de contact** :
  - Avatar avec initiales
  - Nom complet et téléphone
  - Badge de statut avec couleurs appropriées
  - Indicateur de sélection (bordure primary)
  - Hover effects

- **Détails du contact** :
  - Informations principales (prénom, nom, téléphone, email, statut)
  - Section Rappels & Rendez-vous
  - Section Historique
  - Layout responsive en grille

### 2. Mise à jour de `AnnuairePage.tsx`

**Fichier modifié :** `src/components/AnnuairePage.tsx`

- **Import du nouveau composant** :
  ```typescript
  import { AnnuaireCardsView } from './AnnuaireCardsView';
  ```

- **Intégration dans le rendu** :
  - Ajout d'une condition pour afficher `AnnuaireCardsView` quand `viewMode === 'cards'`
  - Passage des props nécessaires (contacts, selectedContactId, callbacks, etc.)

- **Refonte des boutons d'action** :
  Les boutons ont été redessinés pour correspondre au style d'Appels 2 :
  
  **Avant** :
  - Boutons séparés avec icônes uniquement
  - Dropdowns simples
  
  **Après** :
  - Bouton "Importer" avec icône et texte (style dark)
  - Bouton "Exporter" avec dropdown et compteur de contacts
  - Bouton "Supprimer" (outline)
  - Style uniforme : `bg-neutral-900 hover:bg-black text-white`

### 3. Renommage dans la Sidebar

**Fichier modifié :** `src/components/AppSidebar.tsx`

- **Changement du label** :
  ```typescript
  // Avant
  <span>Appels 2</span>
  
  // Après
  <span>Appels</span>
  ```

Le badge "Preview" est conservé pour indiquer que c'est une fonctionnalité en prévisualisation.

## Détails techniques

### Structure du layout Cards

```
┌─────────────────────────────────────────────────────────┐
│  Navbar (titre, ViewSwitcher, recherche, filtres)      │
├─────────────────────────────────────────────────────────┤
│  Actions (filtres rapides, boutons import/export)      │
├──────────────────┬──────────────────────────────────────┤
│  Liste contacts  │  Détails du contact sélectionné     │
│  (scrollable)    │  (scrollable)                        │
│  ┌────────────┐  │  ┌────────────────────────────────┐ │
│  │ Contact 1  │  │  │ Avatar + Nom                   │ │
│  ├────────────┤  │  ├────────────────────────────────┤ │
│  │ Contact 2  │  │  │ Informations principales       │ │
│  ├────────────┤  │  ├────────────────────────────────┤ │
│  │ Contact 3  │  │  │ Rappels & Rendez-vous          │ │
│  └────────────┘  │  ├────────────────────────────────┤ │
│                  │  │ Historique                     │ │
│                  │  └────────────────────────────────┘ │
└──────────────────┴──────────────────────────────────────┘
```

### Couleurs des statuts

Les couleurs des badges de statut sont cohérentes entre les deux vues :

- **Non défini** : Gris
- **Mauvais numéro** : Rouge
- **Répondeur** : Orange
- **À rappeler** : Jaune
- **Pas intéressé** : Slate
- **Argumenté** : Bleu
- **DO/RO** : Vert
- **Liste noire** : Rouge
- **Prématuré** : Violet
- **A0** : Indigo

### Responsive Design

- **Mobile** : Layout en colonne unique avec hauteur limitée pour la liste
- **Desktop** : Layout en deux colonnes (320-420px pour la liste, reste pour les détails)
- **Breakpoints** :
  - `lg:` pour le passage en deux colonnes
  - `xl:` et `2xl:` pour ajuster la largeur de la liste

## Fonctionnalités

### Vue Cards - Annuaire

✅ Recherche intégrée dans la liste
✅ Scroll automatique vers le contact sélectionné
✅ Chargement progressif des contacts (40 initiaux, +20 au scroll)
✅ Indicateur visuel du contact sélectionné
✅ Affichage des détails complets du contact
✅ Compteur de contacts dans l'en-tête
✅ Badges de statut colorés
✅ Responsive design

### Boutons d'action

✅ Import CSV/Excel avec style uniforme
✅ Export avec dropdown et options multiples
✅ Suppression avec confirmation
✅ Compteurs de contacts dans les menus
✅ États disabled appropriés

## Tests recommandés

1. **Navigation** :
   - Basculer entre vue Table et vue Cards
   - Vérifier la persistance de la sélection

2. **Recherche** :
   - Taper dans le champ de recherche
   - Vérifier le filtrage en temps réel

3. **Sélection** :
   - Cliquer sur un contact
   - Vérifier l'affichage des détails
   - Vérifier le scroll automatique

4. **Actions** :
   - Tester l'import de fichiers
   - Tester l'export CSV et Excel
   - Tester la suppression

5. **Responsive** :
   - Tester sur mobile
   - Tester sur tablette
   - Tester sur desktop

## Fichiers modifiés

- ✅ `src/components/AnnuaireCardsView.tsx` (créé)
- ✅ `src/components/AnnuairePage.tsx` (modifié)
- ✅ `src/components/AppSidebar.tsx` (modifié)

## Notes

- Le composant `AnnuaireCardsView` est autonome et réutilisable
- Les types TypeScript sont correctement définis et cohérents
- Le design est aligné avec celui d'Appels 2
- La performance est optimisée avec le chargement progressif
- L'accessibilité est préservée (aria-labels, keyboard navigation)

## Prochaines étapes possibles

- [ ] Ajouter des actions rapides dans les cartes (appel, email, etc.)
- [ ] Implémenter la sélection multiple dans la vue Cards
- [ ] Ajouter des filtres avancés
- [ ] Améliorer l'affichage de l'historique avec timeline
