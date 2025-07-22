# 🔧 Guide de Test - Notifications de Mise à Jour

## Comment tester les nouvelles notifications de mise à jour

### 🚀 Démarrage Rapide

1. **Lancez l'application en mode développement**
2. **Appuyez sur `Ctrl+Shift+D`** pour simuler les différents états de mise à jour
3. **Observez le badge dans la barre de titre** qui change selon l'état
4. **Testez le dialog de confirmation** quand le badge affiche "Mettre à jour"

### 🎯 États de Test Disponibles

Chaque pression de `Ctrl+Shift+D` fait passer à l'état suivant :

#### 1. **Aucune mise à jour** (État initial)
- Aucun badge affiché
- État normal de l'application

#### 2. **Vérification en cours**
- Badge : `MAJ...` avec icône de chargement
- Animation de rotation

#### 3. **Téléchargement 25%**
- Badge : `25%` avec icône de téléchargement
- Couleur orange, animation bounce

#### 4. **Téléchargement 75%**
- Badge : `75%` avec icône de téléchargement
- Progression visible

#### 5. **Prêt à installer** ⭐ (État principal à tester)
- Badge : `Mettre à jour` avec icône de refresh
- Couleur bleue avec animation pulse
- **Cliquez ici pour tester le dialog !**

### 🎨 Interface de Debug

En mode développement, vous verrez un panneau de debug en bas à droite avec :
- Raccourci clavier affiché
- État actuel surligné
- Liste de tous les états disponibles
- Bouton pour masquer/afficher les détails

### 🧪 Scénarios de Test

#### Test 1 : Badge "Mettre à jour"
1. Appuyez 5 fois sur `Ctrl+Shift+D` pour arriver à l'état "Prêt à installer"
2. Vérifiez que le badge affiche "Mettre à jour" (et non "MAJ")
3. Vérifiez l'animation pulse bleue
4. Survolez pour voir le tooltip : "Cliquer pour installer la mise à jour"

#### Test 2 : Dialog de Confirmation
1. Avec le badge "Mettre à jour" visible, cliquez dessus
2. Le dialog doit s'ouvrir avec :
   - Titre : "Mise à jour disponible"
   - Badge version : "Version 2.1.0"
   - Message d'avertissement avec icône
   - Informations détaillées (nom, date, notes)
   - Boutons "Annuler" et "Oui, mettre à jour"

#### Test 3 : Actions du Dialog
- **Cliquer "Annuler"** → Dialog se ferme, rien ne se passe
- **Appuyer Échap** → Dialog se ferme, rien ne se passe
- **Cliquer "Oui, mettre à jour"** → Simulation d'installation + alert de confirmation

#### Test 4 : Responsive et Thèmes
1. Testez en mode sombre et clair
2. Redimensionnez la fenêtre
3. Vérifiez que le dialog reste centré et lisible

### 🎨 Détails Visuels à Vérifier

#### Badge de Mise à Jour
- **Position** : Dans la barre de titre, à côté du badge ADB
- **Taille** : Compacte, hauteur 6 (24px)
- **Couleurs** :
  - Vérification : Gris avec animation spin
  - Téléchargement : Orange avec animation bounce
  - Prêt : Bleu avec animation pulse
- **Texte** : "Mettre à jour" (pas "MAJ") quand prêt

#### Dialog de Confirmation
- **Taille** : Max 500px de largeur, hauteur adaptative
- **Position** : Centré sur l'écran
- **Overlay** : Arrière-plan sombre semi-transparent
- **Contenu** :
  - Icône de téléchargement bleue
  - Badge de version
  - Zone d'avertissement jaune/ambre
  - Sections d'informations avec icônes
  - Boutons alignés à droite

### 🐛 Points d'Attention

#### Vérifications Importantes
- [ ] Le badge n'apparaît que dans les bons états
- [ ] "Mettre à jour" s'affiche seulement quand `downloaded: true`
- [ ] Le dialog s'ouvre au clic sur "Mettre à jour"
- [ ] Les autres états (MAJ..., %) fonctionnent normalement
- [ ] Le dialog se ferme avec Échap
- [ ] La confirmation lance bien l'installation simulée
- [ ] L'annulation ne fait rien
- [ ] Le design respecte le thème actuel

#### Cas d'Erreur à Tester
- Informations de mise à jour manquantes
- Date de release invalide
- Notes de version vides
- Erreur lors de l'ouverture du dialog

### 🔄 Cycle de Test Complet

1. **Démarrage** → Aucun badge
2. **Ctrl+Shift+D** → "MAJ..." (vérification)
3. **Ctrl+Shift+D** → "25%" (téléchargement)
4. **Ctrl+Shift+D** → "75%" (téléchargement)
5. **Ctrl+Shift+D** → "Mettre à jour" (prêt) ⭐
6. **Clic sur badge** → Dialog s'ouvre
7. **Test des actions** → Annuler/Confirmer
8. **Ctrl+Shift+D** → Retour à l'état initial

### 📱 Test sur Différentes Plateformes

Le système fonctionne sur :
- **Windows** : Layout avec contrôles de fenêtre
- **macOS** : Layout avec traffic lights
- **Linux** : Layout Windows

### 🎉 Résultat Attendu

Après les tests, vous devriez avoir :
- ✅ Badge "Mettre à jour" clair et visible
- ✅ Dialog élégant et informatif
- ✅ Avertissement de sauvegarde bien visible
- ✅ Expérience utilisateur fluide et intuitive
- ✅ Gestion d'erreur gracieuse

### 💡 Conseils de Debug

- **Console** : Ouvrez les DevTools pour voir les logs de debug
- **État** : Le panneau de debug montre l'état actuel
- **Reset** : Rechargez la page pour remettre à zéro
- **Production** : Le mode debug n'est actif qu'en développement

---

**Prêt à tester ? Lancez l'app et appuyez sur `Ctrl+Shift+D` ! 🚀**