# Localisation des boutons LinkedIn/Google/Lien

## 📍 Où trouver les boutons ?

### Page "Appels 2" - Mode Table

Les trois nouveaux boutons sont situés dans la **barre d'outils supérieure** de la table, entre les onglets de recherche automatique et les boutons Import/Export.

```
┌─────────────────────────────────────────────────────────────────────┐
│ [⚙️ Colonnes] [Désactivé|LinkedIn|Google|Lien]                      │
│                                                                      │
│     👉 [LinkedIn] [Google] [Lien direct] 👈  [📤] [📥] [🗑️]        │
│                                                                      │
│     ↑ NOUVEAUX BOUTONS ICI ↑                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Structure visuelle

```
Barre d'outils
├── Gauche
│   ├── Bouton "Gestion des colonnes" (⚙️ avec badge)
│   └── Onglets de recherche automatique
│       ├── Désactivé
│       ├── LinkedIn (bleu)
│       ├── Google (vert)
│       └── Lien (violet)
│
├── Centre (NOUVEAUX BOUTONS) ⭐
│   ├── Bouton LinkedIn (bleu #0A66C2)
│   ├── Bouton Google (bleu #4285F4)
│   └── Bouton Lien direct (outline)
│
└── Droite
    ├── Bouton Import (📤)
    ├── Bouton Export (📥)
    ├── Bouton Supprimer (🗑️)
    └── Dropdown Onglets
```

## 🎨 Apparence des boutons

### Bouton LinkedIn
```
┌──────────────┐
│ 🔗 LinkedIn  │  ← Fond bleu LinkedIn (#0A66C2)
└──────────────┘
```

### Bouton Google
```
┌──────────────┐
│ 🌐 Google    │  ← Fond bleu Google (#4285F4)
└──────────────┘
```

### Bouton Lien direct
```
┌──────────────┐
│ 👁️ Lien direct│  ← Style outline (bordure)
└──────────────┘
```

## 🔄 États des boutons

### Aucun contact sélectionné
- ❌ Tous les boutons sont **désactivés** (grisés)
- Impossible de cliquer

### Contact sélectionné SANS lien
- ✅ Bouton LinkedIn : **activé**
- ✅ Bouton Google : **activé**
- ❌ Bouton Lien direct : **désactivé**

### Contact sélectionné AVEC lien
- ✅ Bouton LinkedIn : **activé**
- ✅ Bouton Google : **activé**
- ✅ Bouton Lien direct : **activé**

## 🎯 Comment utiliser

1. **Sélectionner un contact** dans la table
2. **Cliquer sur un bouton** :
   - **LinkedIn** : Ouvre une recherche LinkedIn avec "Prénom Nom Type Source"
   - **Google** : Ouvre une recherche Google avec "Prénom Nom Type Source"
   - **Lien direct** : Ouvre le lien du contact dans une fenêtre dédiée

## 🔍 Différence avec les onglets

### Onglets de recherche automatique (Désactivé/LinkedIn/Google/Lien)
- **Fonction** : Recherche **automatique** lors de la sélection d'un contact
- **Activation** : Cliquer sur un onglet pour activer le mode
- **Comportement** : La recherche s'ouvre automatiquement à chaque sélection

### Boutons de recherche manuelle (LinkedIn/Google/Lien direct)
- **Fonction** : Recherche **manuelle** sur demande
- **Activation** : Cliquer sur le bouton quand vous voulez faire une recherche
- **Comportement** : La recherche s'ouvre uniquement quand vous cliquez

## 💡 Astuce

Vous pouvez combiner les deux :
1. Activer l'onglet "LinkedIn" pour la recherche automatique
2. Utiliser le bouton "Google" pour une recherche manuelle supplémentaire

## 🐛 Dépannage

### Je ne vois pas les boutons
1. Vérifiez que vous êtes bien dans la page **"Appels 2"**
2. Vérifiez que vous êtes en **mode Table** (pas en mode Cards)
3. Rechargez la page (Ctrl+R ou F5)

### Les boutons sont grisés
- C'est normal ! Sélectionnez un contact dans la table pour les activer

### Le bouton "Lien direct" reste grisé
- Le contact sélectionné n'a pas de lien défini
- Ajoutez un lien dans la colonne "Lien" du contact

## 📸 Capture d'écran de référence

```
┌────────────────────────────────────────────────────────────────────────┐
│ Appels                                                    [Cards|Table] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ [⚙️23] [Désactivé|LinkedIn|Google|Lien]                                │
│                                                                         │
│        [🔗 LinkedIn] [🌐 Google] [👁️ Lien direct]  [📤][📥][🗑️] [▼]  │
│        ↑ NOUVEAUX BOUTONS ↑                                            │
├────────────────────────────────────────────────────────────────────────┤
│ # │ Prénom │ Nom │ Téléphone │ Email │ ... │                          │
├───┼────────┼─────┼───────────┼───────┼─────┤                          │
│ 1 │ Jean   │ ... │ ...       │ ...   │ ... │ ← Sélectionner un contact│
│ 2 │ Marie  │ ... │ ...       │ ...   │ ... │                          │
└────────────────────────────────────────────────────────────────────────┘
```
