# Diagnostic du Sticky Header - Guide de Dépannage

## 🔍 Problème persistant

Malgré les corrections apportées, le header ne reste pas sticky. Voici un guide de diagnostic complet.

## 📋 Checklist de diagnostic

### 1. Vérifier les styles CSS appliqués

Ouvrez les DevTools (F12) et inspectez le `<thead>` :

```css
/* Ces styles DOIVENT être présents */
position: sticky;
top: 0px;
z-index: 101;
background-color: hsl(var(--background));
```

### 2. Vérifier le conteneur parent

Le conteneur de scroll doit avoir :

```css
/* Conteneur de scroll */
position: relative;
overflow: auto; /* ou overflow-y: auto */
height: /* une hauteur définie */
```

### 3. Vérifier la hiérarchie DOM

Structure attendue :
```html
<div class="contact-table-container"> <!-- height: 100% -->
  <div> <!-- overflow: auto, height: 100% -->
    <table> <!-- position: relative -->
      <thead> <!-- position: sticky, top: 0 -->
        <tr>
          <th> <!-- position: sticky, top: 0 -->
```

## 🛠️ Solutions de dépannage

### Solution 1: CSS forcé

Ajoutez ce CSS dans votre fichier global :

```css
/* Importez src/styles/sticky-header.css */
@import './src/styles/sticky-header.css';
```

### Solution 2: Composant de debug

Ajoutez le composant de debug dans votre table :

```tsx
import { StickyHeaderDebug, useStickyHeaderDebug } from './StickyHeaderDebug';

const YourComponent = () => {
  const { enabled } = useStickyHeaderDebug();
  
  return (
    <>
      <PaginatedContactTable {...props} />
      <StickyHeaderDebug enabled={enabled} />
    </>
  );
};
```

Utilisez `Ctrl + Shift + D` pour activer le debug.

### Solution 3: Test manuel dans la console

```javascript
// Copiez-collez dans la console du navigateur
const container = document.querySelector('.contact-table-container');
const scrollContainer = container?.querySelector('div');
const thead = container?.querySelector('thead');

console.log('Container:', container);
console.log('Scroll container:', scrollContainer);
console.log('Thead:', thead);

if (thead) {
  const styles = window.getComputedStyle(thead);
  console.log('Position:', styles.position);
  console.log('Top:', styles.top);
  console.log('Z-index:', styles.zIndex);
}

// Test de scroll
if (scrollContainer) {
  scrollContainer.scrollTop = 200;
  console.log('Scrolled to:', scrollContainer.scrollTop);
}
```

## 🚨 Problèmes courants

### 1. Conteneur parent sans hauteur définie
**Symptôme :** Le sticky ne fonctionne pas du tout
**Solution :** Assurez-vous que tous les conteneurs parents ont une hauteur définie

### 2. Overflow hidden sur un parent
**Symptôme :** Le header disparaît lors du scroll
**Solution :** Vérifiez qu'aucun parent n'a `overflow: hidden`

### 3. Transform sur un parent
**Symptôme :** Le sticky se comporte bizarrement
**Solution :** Les transforms créent un nouveau contexte de positionnement

### 4. Flexbox interfère
**Symptôme :** Le sticky ne fonctionne que partiellement
**Solution :** Utilisez `align-self: flex-start` sur la table

## 🔧 Solution alternative : Header fixe

Si le sticky ne fonctionne toujours pas, voici une solution avec position fixed :

```tsx
// Dans ContactTable.tsx
const [headerHeight, setHeaderHeight] = useState(0);
const headerRef = useRef<HTMLTableSectionElement>(null);

useEffect(() => {
  if (headerRef.current) {
    setHeaderHeight(headerRef.current.offsetHeight);
  }
}, []);

// Remplacer le TableHeader par :
<>
  <TableHeader 
    ref={headerRef}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 101,
      backgroundColor: 'hsl(var(--background))',
    }}
  >
    {/* Contenu du header */}
  </TableHeader>
  
  {/* Spacer pour compenser le header fixe */}
  <div style={{ height: headerHeight }} />
</>
```

## 📞 Support

Si aucune solution ne fonctionne :

1. **Vérifiez la version des navigateurs** - Sticky est supporté depuis :
   - Chrome 56+
   - Firefox 32+
   - Safari 13+

2. **Testez dans un autre navigateur** pour isoler le problème

3. **Créez un exemple minimal** sans les autres composants

4. **Vérifiez les CSS globaux** qui pourraient interférer

## 🎯 Test final

Après avoir appliqué les corrections :

1. Ouvrez l'application
2. Faites défiler la table vers le bas
3. Le header doit rester visible en haut
4. Testez le tri - le header doit rester fixe
5. Testez le redimensionnement de la fenêtre

Si le test échoue, utilisez le composant de debug pour identifier le problème exact.