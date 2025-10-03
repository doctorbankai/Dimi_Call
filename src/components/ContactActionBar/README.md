# ContactActionBar - Barre d'Actions Responsive

## Vue d'ensemble

Le composant `ContactActionBar` est une barre d'actions ultra responsive qui affiche les informations d'un contact et permet d'effectuer diverses actions (appel, SMS, email, etc.). Il s'adapte automatiquement à toutes les tailles d'écran et active un scroll horizontal fluide lorsque nécessaire.

## Fonctionnalités

✅ **Ultra Responsive** - S'adapte à 4 breakpoints (xs, sm, md, lg)  
✅ **Scroll Horizontal** - Support natif du trackpad, souris (Shift+Molette) et tactile  
✅ **Indicateurs Visuels** - Gradients pour montrer le contenu caché  
✅ **Performant** - Optimisé avec React.memo, useMemo et useCallback  
✅ **Accessible** - Navigation clavier, ARIA labels, lecteurs d'écran  
✅ **GPU Accelerated** - Animations fluides à 60fps  

## Installation

Le composant est déjà intégré dans le projet. Aucune installation supplémentaire n'est nécessaire.

## Utilisation

### Import

```typescript
import { ContactActionBar } from './components/ContactActionBar';
```

### Exemple de base

```typescript
<ContactActionBar
  contact={selectedContact}
  onCall={handleCall}
  onSms={handleSms}
  onEmail={handleEmail}
  onQualify={handleQualify}
  onReminder={handleReminder}
  onAppointment={handleAppointment}
  onCalcom={handleCalcom}
  onStatusChange={(contactId, newStatus) => {
    updateContact({ id: contactId, statut: newStatus });
  }}
  callDisabled={!adbConnected}
  emailDisabled={!selectedContact.email}
/>
```

### Dans un panneau latéral

```typescript
{selectedContact && (
  <div className="w-80 border-l bg-background flex flex-col">
    <div className="p-4 border-b">
      <ContactActionBar
        contact={selectedContact}
        // ... props
      />
    </div>
    
    <div className="flex-1 overflow-auto p-4">
      {/* Autres informations du contact */}
    </div>
  </div>
)}
```

## Props

| Prop | Type | Requis | Description |
|------|------|--------|-------------|
| `contact` | `Contact` | ✅ | Objet contact contenant toutes les informations |
| `onCall` | `(contact: Contact) => void` | ✅ | Callback appelé lors du clic sur le bouton d'appel |
| `onSms` | `(contact: Contact) => void` | ✅ | Callback appelé lors du clic sur le bouton SMS |
| `onEmail` | `(contact: Contact) => void` | ✅ | Callback appelé lors du clic sur le bouton email |
| `onQualify` | `(contact: Contact) => void` | ✅ | Callback appelé lors du clic sur le bouton qualification |
| `onReminder` | `(contact: Contact) => void` | ✅ | Callback appelé lors du clic sur le bouton rappel |
| `onAppointment` | `(contact: Contact) => void` | ✅ | Callback appelé lors du clic sur le bouton RDV |
| `onCalcom` | `(contact: Contact) => void` | ✅ | Callback appelé lors du clic sur le bouton Cal.com |
| `onStatusChange` | `(contactId: string, newStatus: ContactStatus) => void` | ✅ | Callback appelé lors du changement de statut |
| `callDisabled` | `boolean` | ❌ | Désactive le bouton d'appel (défaut: `false`) |
| `emailDisabled` | `boolean` | ❌ | Désactive le bouton email (défaut: `false`) |
| `className` | `string` | ❌ | Classes CSS additionnelles |

## Breakpoints Responsive

### Extra Small (<480px)
- Avatar: 32px
- Nom: Tronqué à 15 caractères
- Téléphone: Masqué
- Statut: Badge compact
- Boutons: 32px

### Small (480px-768px)
- Avatar: 36px
- Nom: Tronqué à 20 caractères
- Téléphone: Version courte
- Statut: Badge avec label
- Boutons: 36px

### Medium (768px-1024px)
- Avatar: 40px
- Nom: Complet
- Téléphone: Complet
- Statut: Sélecteur complet
- Boutons: 40px

### Large (>1024px)
- Tous les éléments à taille normale
- Espacement généreux
- Pas de scroll nécessaire

## Scroll Horizontal

Le scroll horizontal s'active automatiquement quand le contenu déborde. Il supporte:

- **Trackpad**: Geste de scroll horizontal naturel
- **Souris**: Shift + Molette
- **Tactile**: Swipe horizontal
- **Clavier**: Flèches gauche/droite

### Indicateurs Visuels

Des gradients apparaissent automatiquement aux extrémités pour indiquer qu'il y a du contenu caché:
- Gradient gauche: Contenu caché à gauche
- Gradient droit: Contenu caché à droite

## Accessibilité

### Navigation Clavier

- **Tab**: Navigation entre les boutons
- **Flèche Gauche**: Scroll vers la gauche
- **Flèche Droite**: Scroll vers la droite
- **Enter/Space**: Activer le bouton focusé

### ARIA

Le composant utilise les attributs ARIA appropriés:
- `role="toolbar"`: Indique que c'est une barre d'outils
- `aria-label="Actions du contact"`: Label descriptif
- `aria-orientation="horizontal"`: Orientation horizontale
- Tous les boutons ont des `aria-label` descriptifs

### Lecteurs d'Écran

Le composant est compatible avec les lecteurs d'écran (NVDA, JAWS, VoiceOver).

### Préférences de Mouvement

Le composant respecte `prefers-reduced-motion` et désactive les animations si nécessaire.

## Performance

### Optimisations Implémentées

1. **React.memo**: Évite les re-renders inutiles
2. **useMemo**: Mémorise les calculs coûteux (initiales, nom formaté, téléphone)
3. **useCallback**: Mémorise les callbacks pour éviter les re-créations
4. **GPU Acceleration**: Utilise `transform: translateZ(0)` pour les animations
5. **Debouncing**: Limite la fréquence des événements resize
6. **Throttling**: Limite la fréquence des événements scroll

### Métriques de Performance

- **60fps** minimum pendant le scroll
- **< 16ms** par frame
- **Pas de lag** lors du redimensionnement
- **Pas de fuite mémoire** lors du scroll répété

## Personnalisation

### Classes CSS

Vous pouvez personnaliser l'apparence en surchargeant les classes CSS:

```css
/* Personnaliser la couleur du bouton d'appel */
.action-button-call {
  background-color: #10b981; /* Vert personnalisé */
}

/* Personnaliser la taille de l'avatar */
.contact-avatar {
  width: 48px;
  height: 48px;
}
```

### Styles Inline

Vous pouvez également passer des classes via la prop `className`:

```typescript
<ContactActionBar
  className="shadow-xl border-2"
  // ... autres props
/>
```

## Dépannage

### Le scroll horizontal ne fonctionne pas

1. Vérifiez que le contenu déborde réellement
2. Assurez-vous que le conteneur parent n'a pas `overflow: hidden`
3. Testez avec Shift+Molette si le trackpad ne fonctionne pas

### Les indicateurs de scroll ne s'affichent pas

1. Vérifiez que le contenu déborde
2. Assurez-vous que les gradients ne sont pas masqués par un z-index supérieur
3. Vérifiez que le thème (clair/sombre) est correctement configuré

### Les boutons sont trop petits sur mobile

C'est normal, ils s'adaptent à la taille de l'écran. Vous pouvez ajuster les breakpoints dans `contact-action-bar.css`.

### Performance dégradée

1. Vérifiez que vous n'avez pas de re-renders excessifs (React DevTools)
2. Assurez-vous que les callbacks sont mémorisés avec `useCallback`
3. Vérifiez que le GPU acceleration est activé (DevTools > Rendering)

## Composants Associés

- **ScrollableContainer**: Conteneur avec scroll horizontal
- **ScrollIndicators**: Indicateurs visuels de scroll
- **StatusSelect**: Sélecteur de statut

## Hooks Associés

- **useScrollState**: Détecte l'état du scroll
- **useDebouncedResize**: Optimise les événements resize
- **useThrottledScroll**: Optimise les événements scroll

## Fichiers

```
src/
├── components/
│   ├── ContactActionBar.tsx          # Composant principal
│   ├── ContactActionBarExample.tsx   # Exemple d'intégration
│   ├── ScrollableContainer.tsx       # Conteneur scrollable
│   └── ScrollIndicators.tsx          # Indicateurs visuels
├── hooks/
│   ├── useScrollState.ts             # Hook d'état du scroll
│   ├── useDebouncedResize.ts         # Hook de debouncing
│   └── useThrottledScroll.ts         # Hook de throttling
└── styles/
    └── contact-action-bar.css        # Styles responsive
```

## Support Navigateurs

- ✅ Chrome/Edge (dernières versions)
- ✅ Firefox (dernières versions)
- ✅ Safari (dernières versions)
- ✅ Electron (toutes versions récentes)

## Licence

Ce composant fait partie du projet DimiCall et suit la même licence.

## Auteur

Développé pour DimiCall - Application de gestion de contacts et d'appels.
