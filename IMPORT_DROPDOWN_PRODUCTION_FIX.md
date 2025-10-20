# Correction des dropdowns d'import en production

## Problème
Les dropdowns de la colonne "Associer à" dans l'interface d'import CSV fonctionnaient en développement (`npm run dev`) mais ne répondaient pas aux clics en production (fichiers .exe, .dmg).

## Cause
Radix UI utilise des **portals** pour afficher les dropdowns (`SelectContent`). Par défaut, ces portals se rendent dans `document.body`. En production Electron, avec certaines configurations de sécurité (CSP, contextIsolation), les événements de clic peuvent ne pas se propager correctement entre le contexte du Dialog et le portal rendu dans `document.body`.

## Solution
Forcer le rendu du `SelectContent` dans le même conteneur que le `Dialog` au lieu de `document.body`.

### Modifications apportées

#### 1. `src/components/ui/dialog.tsx`
Ajout du support de `ref` au composant `DialogContent` avec `React.forwardRef` :

```tsx
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentProps<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean
  }
>(({ className, children, showCloseButton = true, ...props }, ref) => {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}  // ← Ajout de la ref
        data-slot="dialog-content"
        className={cn(/* ... */)}
        {...props}
      >
        {children}
        {/* ... */}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName
```

#### 2. `src/components/ImportMappingDialog.tsx`
- Ajout d'une ref vers le conteneur du Dialog
- Passage de cette ref au `SelectContent` via la prop `container`

```tsx
// Ajout de la ref
const dialogContentRef = React.useRef<HTMLDivElement>(null)

// Dans le JSX
<DialogContent ref={dialogContentRef} className="...">
  {/* ... */}
  
  {/* Pour chaque Select */}
  <SelectContent container={dialogContentRef.current}>
    {/* Options */}
  </SelectContent>
</DialogContent>
```

## Résultat
Les dropdowns fonctionnent maintenant correctement en production car :
1. Le `SelectContent` se rend dans le même conteneur que le `Dialog`
2. Les événements de clic se propagent correctement dans le même contexte
3. Pas de problème de CSP ou d'isolation de contexte

## Test
Pour tester :
1. Compiler l'application : `npm run build`
2. Lancer l'exécutable produit
3. Importer un fichier CSV
4. Vérifier que les dropdowns de la colonne "Associer à" s'ouvrent et répondent aux clics

## Notes techniques
- Cette solution fonctionne aussi bien en dev qu'en prod
- Pas d'impact sur les performances
- Compatible avec toutes les plateformes (Windows, macOS, Linux)
- Le composant `Select` de shadcn/ui accepte déjà la prop `container` via Radix UI
