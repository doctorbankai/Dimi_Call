# Mise à jour du Dropdown Menu et Visibilité des Pages

## Résumé des modifications

### 1. Amélioration du Dropdown Menu "Colonnes visibles" (Appels 2 - Mode Table)

#### Changements apportés:
- **Réduction du padding**: Le `ml-16` a été remplacé par `w-64` pour un meilleur alignement
- **Ajout d'une icône**: L'icône Eye a été ajoutée au label "Gestion des colonnes"
- **Nouvelles options**:
  - ✅ **Afficher toutes les colonnes disponibles**: Permet d'activer toutes les colonnes d'un coup
  - ❌ **Masquer les colonnes optionnelles**: Permet de désactiver toutes les colonnes d'un coup

#### Fichier modifié:
- `src/components/AppelsCardsView.tsx`

#### Détails techniques:
```tsx
<DropdownMenuContent align="start" side="bottom" sideOffset={5} className="w-64">
  <DropdownMenuLabel className="flex items-center gap-2">
    <Eye className="h-4 w-4" />
    Gestion des colonnes
  </DropdownMenuLabel>
  <DropdownMenuSeparator />
  {/* Liste des colonnes individuelles */}
  <DropdownMenuSeparator />
  {/* Options globales */}
</DropdownMenuContent>
```

### 2. Gestion de la Visibilité des Pages dans la Sidebar

#### Nouvelles fonctionnalités:
- Les pages "Appels" (ancienne version) et "Données" sont maintenant **masquées par défaut**
- Une nouvelle section "Visibilité des pages" a été ajoutée dans les **Paramètres**
- Les utilisateurs peuvent activer/désactiver ces pages via des switches

#### Fichiers modifiés:
1. **`src/components/SettingsDialog.tsx`**:
   - Ajout du type `'pages-visibility'` dans `SettingsCategory`
   - Ajout de l'import de l'icône `Eye`
   - Création de la fonction `renderPagesVisibilitySettings()`
   - Ajout de l'état `pagesVisibility` et `pagesVisibilityChanged`
   - Sauvegarde dans localStorage sous la clé `'dimicall_pages_visibility'`

2. **`src/components/AppSidebar.tsx`**:
   - Ajout de l'état `pagesVisibility` qui lit depuis localStorage
   - Conditionnement de l'affichage des pages "Appels" et "Données"
   - Ajout d'un listener pour les changements de localStorage

#### Structure de données:
```typescript
{
  showAppelsPage: boolean,    // false par défaut
  showDonneesPage: boolean     // false par défaut
}
```

#### Interface utilisateur:
Dans **Paramètres > Visibilité des pages**, l'utilisateur trouve:
- Un switch pour "Page Appels" (ancienne version)
- Un switch pour "Page Données"
- Une note explicative sur l'utilisation de ces pages

### 3. Imports ajoutés

#### AppelsCardsView.tsx:
```typescript
import { Eye, EyeOff } from "lucide-react"
```

#### SettingsDialog.tsx:
```typescript
import { Eye } from "lucide-react"
```

## Comportement

### Au premier lancement:
- Les pages "Appels" et "Données" sont **masquées**
- Seules les pages "Appels 2", "Calendrier", "Graphiques" et "Annuaire" sont visibles

### Pour activer les pages masquées:
1. Ouvrir les **Paramètres** (icône engrenage)
2. Aller dans la section **"Visibilité des pages"**
3. Activer les switches pour les pages souhaitées
4. Cliquer sur **"Enregistrer les modifications"**
5. Les pages apparaissent immédiatement dans la sidebar

### Persistance:
- Les préférences sont sauvegardées dans `localStorage`
- Elles persistent entre les sessions
- Les changements sont appliqués en temps réel

## Tests recommandés

1. ✅ Vérifier que le dropdown menu des colonnes s'affiche correctement
2. ✅ Tester l'option "Afficher toutes les colonnes disponibles"
3. ✅ Tester l'option "Masquer les colonnes optionnelles"
4. ✅ Vérifier que les pages "Appels" et "Données" sont masquées par défaut
5. ✅ Activer les pages depuis les paramètres et vérifier qu'elles apparaissent
6. ✅ Désactiver les pages et vérifier qu'elles disparaissent
7. ✅ Vérifier la persistance après rechargement de l'application

## Notes importantes

- Les modifications sont **rétrocompatibles**
- Aucune donnée utilisateur n'est perdue
- Les préférences peuvent être réinitialisées en supprimant la clé localStorage
- Le design suit les conventions de l'application existante
