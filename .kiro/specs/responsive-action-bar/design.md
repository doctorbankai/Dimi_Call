# Design Document - Barre d'Actions Responsive

## Overview

Ce document décrit la conception technique pour rendre la barre d'actions des contacts ultra responsive avec support du scroll horizontal. La barre d'actions est actuellement affichée dans le panneau latéral lorsqu'un contact est sélectionné et contient :
- Avatar du contact
- Nom et téléphone
- Sélecteur de statut
- Boutons d'action (Appel, SMS, Email, Qualification, Rappel, RDV, Cal.com)

La solution proposée utilise une approche progressive avec des breakpoints CSS, un conteneur scrollable horizontal avec indicateurs visuels, et une hiérarchie de priorité pour les éléments.

## Architecture

### Structure des Composants

```
ContactActionBar (nouveau composant)
├── ScrollableContainer
│   ├── ContactInfo (avatar + nom + téléphone)
│   ├── StatusSelector (sélecteur de statut)
│   └── ActionButtons (boutons d'action)
└── ScrollIndicators (gradients gauche/droite)
```

### Hiérarchie de Priorité

1. **Toujours visible** : Avatar + Nom
2. **Haute priorité** : Téléphone + Statut
3. **Moyenne priorité** : Boutons Appel + SMS
4. **Basse priorité** : Autres boutons (Email, Qualification, Rappel, RDV, Cal.com)

## Components and Interfaces

### 1. ContactActionBar Component

Composant principal qui encapsule toute la logique de la barre d'actions responsive.

```typescript
interface ContactActionBarProps {
  contact: Contact;
  onCall: (contact: Contact) => void;
  onSms: (contact: Contact) => void;
  onEmail: (contact: Contact) => void;
  onQualify: (contact: Contact) => void;
  onReminder: (contact: Contact) => void;
  onAppointment: (contact: Contact) => void;
  onCalcom: (contact: Contact) => void;
  onStatusChange: (contactId: string, newStatus: ContactStatus) => void;
  callDisabled?: boolean;
  emailDisabled?: boolean;
  className?: string;
}

export const ContactActionBar: React.FC<ContactActionBarProps> = ({
  contact,
  onCall,
  onSms,
  onEmail,
  onQualify,
  onReminder,
  onAppointment,
  onCalcom,
  onStatusChange,
  callDisabled = false,
  emailDisabled = false,
  className = ''
}) => {
  // Logique du composant
}
```

### 2. ScrollableContainer Component

Conteneur avec scroll horizontal et détection de débordement.

```typescript
interface ScrollableContainerProps {
  children: React.ReactNode;
  className?: string;
  onScrollChange?: (hasScrollLeft: boolean, hasScrollRight: boolean) => void;
}

const ScrollableContainer: React.FC<ScrollableContainerProps> = ({
  children,
  className,
  onScrollChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    hasScrollLeft: false,
    hasScrollRight: false,
    isScrollable: false
  });

  // Détection du débordement et mise à jour des indicateurs
  useEffect(() => {
    const checkScroll = () => {
      if (!containerRef.current) return;
      
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      const hasScrollLeft = scrollLeft > 0;
      const hasScrollRight = scrollLeft < scrollWidth - clientWidth - 1;
      const isScrollable = scrollWidth > clientWidth;
      
      setScrollState({ hasScrollLeft, hasScrollRight, isScrollable });
      onScrollChange?.(hasScrollLeft, hasScrollRight);
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);
    
    return () => window.removeEventListener('resize', checkScroll);
  }, [onScrollChange]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "overflow-x-auto overflow-y-hidden",
        "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent",
        "scroll-smooth",
        className
      )}
      onScroll={() => {
        // Mise à jour en temps réel pendant le scroll
        if (containerRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
          setScrollState({
            hasScrollLeft: scrollLeft > 0,
            hasScrollRight: scrollLeft < scrollWidth - clientWidth - 1,
            isScrollable: scrollWidth > clientWidth
          });
        }
      }}
    >
      {children}
    </div>
  );
};
```

### 3. ScrollIndicators Component

Indicateurs visuels (gradients) pour montrer qu'il y a du contenu caché.

```typescript
interface ScrollIndicatorsProps {
  showLeft: boolean;
  showRight: boolean;
}

const ScrollIndicators: React.FC<ScrollIndicatorsProps> = ({
  showLeft,
  showRight
}) => {
  return (
    <>
      {/* Gradient gauche */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-8 pointer-events-none z-10",
          "bg-gradient-to-r from-background to-transparent",
          "transition-opacity duration-300",
          showLeft ? "opacity-100" : "opacity-0"
        )}
      />
      
      {/* Gradient droit */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-8 pointer-events-none z-10",
          "bg-gradient-to-l from-background to-transparent",
          "transition-opacity duration-300",
          showRight ? "opacity-100" : "opacity-0"
        )}
      />
    </>
  );
};
```

## Data Models

### ScrollState

```typescript
interface ScrollState {
  hasScrollLeft: boolean;   // Y a-t-il du contenu caché à gauche ?
  hasScrollRight: boolean;  // Y a-t-il du contenu caché à droite ?
  isScrollable: boolean;    // Le contenu déborde-t-il ?
}
```

### ResponsiveBreakpoints

```typescript
const BREAKPOINTS = {
  xs: 320,   // Très petit mobile
  sm: 480,   // Petit mobile
  md: 768,   // Tablette
  lg: 1024,  // Desktop petit
  xl: 1280,  // Desktop large
  xxl: 1536  // Desktop très large
} as const;
```

## Responsive Design Strategy

### Breakpoints et Adaptations

#### Extra Small (<480px)
- Avatar : 32px (réduit)
- Nom : Tronqué à 15 caractères
- Téléphone : Masqué
- Statut : Badge compact uniquement (sans label)
- Séparateurs : Masqués
- Padding : Réduit à `p-2`
- Gap : Réduit à `gap-1.5`
- Boutons : Taille `size-8` (32px)

#### Small (480px-768px)
- Avatar : 36px
- Nom : Tronqué à 20 caractères
- Téléphone : Affiché en version courte
- Statut : Badge avec label court
- Séparateurs : Visibles
- Padding : `p-2.5`
- Gap : `gap-2`
- Boutons : Taille `size-9` (36px)

#### Medium (768px-1024px)
- Avatar : 40px (taille normale)
- Nom : Complet
- Téléphone : Complet
- Statut : Sélecteur complet
- Tous les éléments visibles
- Padding : `p-3`
- Gap : `gap-3`
- Boutons : Taille `size-10` (40px)

#### Large (>1024px)
- Tous les éléments à taille normale
- Espacement généreux
- Pas de scroll nécessaire dans la plupart des cas

### CSS Classes Responsive

```css
/* Conteneur principal */
.action-bar-container {
  @apply flex items-center bg-card rounded-lg shadow-sm border;
  @apply min-w-[280px] w-full mx-auto;
  @apply p-2 gap-1.5;
  @apply sm:p-2.5 sm:gap-2;
  @apply md:p-3 md:gap-3;
}

/* Zone scrollable */
.action-bar-scroll {
  @apply flex items-center gap-1.5;
  @apply sm:gap-2 md:gap-3;
  @apply overflow-x-auto overflow-y-hidden;
  @apply scroll-smooth;
  @apply scrollbar-thin scrollbar-thumb-muted;
}

/* Section info contact */
.contact-info-section {
  @apply flex items-center gap-1.5 flex-shrink-0;
  @apply sm:gap-2 md:gap-3;
}

/* Avatar responsive */
.contact-avatar {
  @apply size-8 flex-shrink-0;
  @apply sm:size-9 md:size-10;
}

/* Nom responsive */
.contact-name {
  @apply text-xs font-medium whitespace-nowrap;
  @apply sm:text-sm;
  @apply max-w-[120px] sm:max-w-[150px] md:max-w-none;
  @apply truncate;
}

/* Téléphone responsive */
.contact-phone {
  @apply text-[10px] text-muted-foreground whitespace-nowrap;
  @apply hidden xs:block;
  @apply sm:text-xs;
}

/* Séparateurs */
.action-bar-separator {
  @apply text-muted-foreground/50 text-sm;
  @apply hidden xs:block;
}

/* Boutons d'action */
.action-button {
  @apply size-8 rounded-full;
  @apply sm:size-9 md:size-10;
  @apply transition-all duration-200 hover:scale-105;
  @apply flex-shrink-0;
}

/* Sélecteur de statut responsive */
.status-selector {
  @apply w-[100px] sm:w-[120px] md:w-[140px];
  @apply text-[10px] sm:text-xs;
}
```

## Error Handling

### Gestion des Erreurs de Scroll

```typescript
const handleScrollError = (error: Error) => {
  console.error('[ContactActionBar] Erreur de scroll:', error);
  // Fallback : désactiver le scroll et afficher tous les éléments en mode wrap
  setScrollEnabled(false);
};
```

### Gestion des Erreurs de Resize

```typescript
const handleResizeError = (error: Error) => {
  console.error('[ContactActionBar] Erreur de redimensionnement:', error);
  // Utiliser les valeurs par défaut
  setScrollState({
    hasScrollLeft: false,
    hasScrollRight: false,
    isScrollable: false
  });
};
```

### Fallback pour Navigateurs Non Supportés

```typescript
// Détection du support du scroll horizontal
const supportsHorizontalScroll = () => {
  try {
    const testDiv = document.createElement('div');
    testDiv.style.overflowX = 'auto';
    return testDiv.style.overflowX === 'auto';
  } catch {
    return false;
  }
};

// Si non supporté, utiliser un layout alternatif
if (!supportsHorizontalScroll()) {
  return <ContactActionBarFallback {...props} />;
}
```

## Testing Strategy

### Tests Unitaires

1. **Composant ContactActionBar**
   - Rendu correct avec toutes les props
   - Gestion des callbacks d'action
   - Adaptation responsive aux différentes tailles

2. **Composant ScrollableContainer**
   - Détection correcte du débordement
   - Mise à jour des indicateurs de scroll
   - Gestion du scroll horizontal

3. **Composant ScrollIndicators**
   - Affichage/masquage selon l'état du scroll
   - Transitions fluides

### Tests d'Intégration

1. **Interaction avec le Contact**
   - Sélection d'un contact affiche la barre
   - Changement de statut met à jour le contact
   - Actions (appel, SMS, etc.) fonctionnent correctement

2. **Responsive Behavior**
   - Adaptation correcte à chaque breakpoint
   - Scroll horizontal activé quand nécessaire
   - Indicateurs visuels corrects

### Tests de Performance

1. **Scroll Performance**
   - 60fps minimum pendant le scroll
   - Pas de lag lors du redimensionnement
   - Utilisation optimale du GPU

2. **Memory Leaks**
   - Pas de fuite mémoire lors du scroll répété
   - Nettoyage correct des event listeners
   - Pas d'accumulation de refs

### Tests Manuels

1. **Trackpad/Souris**
   - Scroll horizontal fluide au trackpad
   - Shift+Molette fonctionne
   - Momentum scrolling supporté

2. **Touch Devices**
   - Swipe horizontal fonctionne
   - Pas de conflit avec le scroll vertical
   - Feedback tactile approprié

3. **Keyboard Navigation**
   - Tab navigation fonctionne
   - Focus visible
   - Scroll automatique vers l'élément focusé

4. **Accessibilité**
   - Screen readers fonctionnent
   - Contraste suffisant
   - Tooltips informatifs

## Performance Optimizations

### 1. Debouncing du Resize

```typescript
const useDebouncedResize = (callback: () => void, delay: number = 150) => {
  useEffect(() => {
    const handler = debounce(callback, delay);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('resize', handler);
      handler.cancel();
    };
  }, [callback, delay]);
};
```

### 2. Throttling du Scroll

```typescript
const useThrottledScroll = (callback: () => void, delay: number = 16) => {
  const throttledCallback = useCallback(
    throttle(callback, delay),
    [callback, delay]
  );
  
  return throttledCallback;
};
```

### 3. Virtualisation (si nécessaire)

Si le nombre de boutons devient très important, utiliser une virtualisation :

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: actionButtons.length,
  getScrollElement: () => containerRef.current,
  estimateSize: () => 40, // Taille estimée d'un bouton
  horizontal: true,
  overscan: 2
});
```

### 4. CSS Containment

```css
.action-bar-container {
  contain: layout style paint;
  will-change: scroll-position;
}
```

### 5. GPU Acceleration

```css
.action-bar-scroll {
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
```

## Accessibility Considerations

### 1. ARIA Labels

```typescript
<div
  role="toolbar"
  aria-label="Actions du contact"
  aria-orientation="horizontal"
>
  {/* Contenu */}
</div>
```

### 2. Keyboard Navigation

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
    const direction = e.key === 'ArrowLeft' ? -1 : 1;
    scrollBy(direction * 100);
  }
};
```

### 3. Focus Management

```typescript
const handleFocus = (e: React.FocusEvent) => {
  const target = e.target as HTMLElement;
  if (containerRef.current) {
    // Scroll pour rendre l'élément focusé visible
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }
};
```

### 4. Reduced Motion

```typescript
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';
```

## Integration Points

### 1. Intégration dans App.tsx

La barre d'actions sera affichée dans le panneau latéral droit lorsqu'un contact est sélectionné :

```typescript
{selectedContact && splitPanelOpen && (
  <div className="w-80 border-l bg-background flex flex-col">
    {/* Barre d'actions en haut */}
    <div className="p-4 border-b">
      <ContactActionBar
        contact={selectedContact}
        onCall={handleCall}
        onSms={handleSms}
        onEmail={handleEmail}
        onQualify={handleQualify}
        onReminder={handleReminder}
        onAppointment={handleAppointment}
        onCalcom={handleCalcom}
        onStatusChange={updateContact}
        callDisabled={!adbConnectionState.connected}
        emailDisabled={!selectedContact.email}
      />
    </div>
    
    {/* Reste du contenu du panneau */}
    <div className="flex-1 overflow-auto p-4">
      {/* Informations détaillées du contact */}
    </div>
  </div>
)}
```

### 2. Hooks Personnalisés

```typescript
// Hook pour gérer l'état du scroll
export const useScrollState = (containerRef: RefObject<HTMLDivElement>) => {
  const [scrollState, setScrollState] = useState<ScrollState>({
    hasScrollLeft: false,
    hasScrollRight: false,
    isScrollable: false
  });

  useEffect(() => {
    const checkScroll = () => {
      if (!containerRef.current) return;
      
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setScrollState({
        hasScrollLeft: scrollLeft > 0,
        hasScrollRight: scrollLeft < scrollWidth - clientWidth - 1,
        isScrollable: scrollWidth > clientWidth
      });
    };

    checkScroll();
    const resizeObserver = new ResizeObserver(checkScroll);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [containerRef]);

  return scrollState;
};
```

## Migration Strategy

### Phase 1 : Création du Composant
- Créer `ContactActionBar.tsx` avec la structure de base
- Implémenter le layout responsive
- Ajouter les styles CSS

### Phase 2 : Scroll Horizontal
- Implémenter `ScrollableContainer`
- Ajouter la détection de débordement
- Implémenter les indicateurs visuels

### Phase 3 : Intégration
- Remplacer l'ancien code dans le panneau latéral
- Connecter les callbacks d'action
- Tester l'intégration

### Phase 4 : Optimisation
- Ajouter le debouncing/throttling
- Optimiser les performances
- Tests de performance

### Phase 5 : Accessibilité
- Ajouter les ARIA labels
- Implémenter la navigation clavier
- Tests d'accessibilité

## Dependencies

### Nouvelles Dépendances
Aucune nouvelle dépendance externe requise. Utilisation des bibliothèques existantes :
- React (déjà présent)
- Tailwind CSS (déjà présent)
- Framer Motion (déjà présent) - pour les animations si nécessaire
- Lucide React (déjà présent) - pour les icônes

### Utilitaires Requis
- `cn()` - déjà disponible dans `lib/utils`
- `debounce` et `throttle` - à implémenter ou utiliser lodash (déjà présent)

## Future Enhancements

1. **Mode Compact Configurable**
   - Permettre à l'utilisateur de choisir entre mode normal et compact
   - Sauvegarder la préférence dans localStorage

2. **Personnalisation des Boutons**
   - Permettre de réorganiser les boutons
   - Masquer/afficher certains boutons selon les besoins

3. **Raccourcis Clavier**
   - Ajouter des raccourcis pour les actions fréquentes
   - Afficher les raccourcis dans les tooltips

4. **Animations Avancées**
   - Animations de transition entre les états
   - Feedback visuel lors des actions

5. **Mode Tablette Optimisé**
   - Layout spécifique pour les tablettes
   - Gestes tactiles avancés
