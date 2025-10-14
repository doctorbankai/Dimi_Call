# Correction du z-index du Dialog de Connexion

## Problème
À l'écran de connexion, la sidebar restait visible au premier plan alors qu'elle devrait être cachée derrière le dialog de connexion.

## Cause
- Le dialog de connexion utilisait un `z-index` de `z-[200]`
- La sidebar utilisait un `z-index` de `z-[10001]`
- Résultat : la sidebar était au-dessus du dialog

## Solution Appliquée

### 1. Modification du composant Dialog (src/components/ui/dialog.tsx)
- **DialogOverlay** : `z-[200]` → `z-[20000]`
- **DialogContent** : `z-[200]` → `z-[20000]`

Cela garantit que tous les dialogs de l'application (y compris le dialog de connexion) s'affichent au-dessus de la sidebar.

### 2. Augmentation du z-index de la TitleBar (src/components/TitleBar.tsx)
- **TitleBar** : `z-[10]` → `z-[30000]`

Pour que la TitleBar reste accessible au-dessus des dialogs.

### 3. Bouton de fermeture dans le dialog de connexion (src/components/AuthModal.tsx)
Ajout d'un bouton X en haut à droite du dialog de connexion qui ferme directement l'application :
- Position : coin supérieur droit du dialog
- Style : icône X grise qui devient rouge au survol
- Action : ferme complètement l'application via `window.electronAPI.closeApp()`

Le bouton de fermeture existe aussi dans la TitleBar :
- Pour Windows/Linux : bouton rouge en haut à droite de la fenêtre
- Pour macOS : utilise les traffic lights natifs

## Hiérarchie des z-index

```
z-[30000] - TitleBar (toujours accessible, même pendant les dialogs)
z-[20000] - Dialogs (overlay + content)
z-[10001] - Sidebar
```

## Fichiers Modifiés
1. `src/components/ui/dialog.tsx` - Augmentation du z-index global des dialogs
2. `src/components/TitleBar.tsx` - Augmentation du z-index pour rester accessible pendant les dialogs
3. `src/components/AuthModal.tsx` - Ajout d'un bouton de fermeture de l'application dans le dialog

## Test
1. Déconnectez-vous de l'application
2. Le dialog de connexion devrait s'afficher au premier plan
3. La sidebar devrait être cachée derrière l'overlay noir semi-transparent
4. **Deux façons de fermer l'application** :
   - **Bouton X dans le dialog** : en haut à droite du dialog de connexion (icône grise qui devient rouge au survol)
   - **TitleBar** (si accessible) : bouton X rouge en haut à droite de la fenêtre (Windows/Linux) ou traffic lights (macOS)

## Notes
- Cette modification affecte tous les dialogs de l'application, pas seulement le dialog de connexion
- La sidebar reste accessible après connexion avec son comportement normal (expand/collapse au survol)
- **La TitleBar reste toujours accessible** (z-index le plus élevé) pour permettre de fermer l'application à tout moment, même pendant l'écran de connexion ou n'importe quel dialog
