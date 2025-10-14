# Instructions pour Corriger le Scroll Automatique

## Fichier 1: src/components/ContactTable.tsx

### Étape 1: Ajouter le ref (ligne ~549, après `const scrollContainerRef`)
```typescript
// Ref pour tracker si le scroll doit être automatique (uniquement au clic)
const shouldAutoScrollRef = useRef(false);
```

### Étape 2: Modifier l'useEffect (ligne ~690)
**Remplacer:**
```typescript
// Scroll automatique quand le contact sélectionné change
useEffect(() => {
  if (selectedContactId) {
    // Délai pour laisser le temps au DOM de se mettre à jour
    const timeoutId = setTimeout(() => {
      scrollToContact(selectedContactId);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }
}, [selectedContactId, scrollToContact]);
```

**Par:**
```typescript
// Scroll automatique uniquement lors d'un clic sur une ligne
useEffect(() => {
  if (selectedContactId && shouldAutoScrollRef.current) {
    // Délai pour laisser le temps au DOM de se mettre à jour
    const timeoutId = setTimeout(() => {
      scrollToContact(selectedContactId);
      // Réinitialiser le flag après le scroll
      shouldAutoScrollRef.current = false;
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }
}, [selectedContactId, scrollToContact]);
```

### Étape 3: Modifier le onClick (ligne ~1463)
**Remplacer:**
```typescript
onClick={() => onSelectContact(contact)}
```

**Par:**
```typescript
onClick={() => {
  shouldAutoScrollRef.current = true;
  onSelectContact(contact);
}}
```

---

## Fichier 2: src/components/AppelsCardsView.tsx

### Étape 1: Ajouter le ref (ligne ~240, après les autres useState)
```typescript
// Ref pour tracker si le scroll doit être automatique (uniquement au clic)
const shouldAutoScrollRef = useRef(false);
```

### Étape 2: Modifier l'useEffect du scroll (ligne ~1100)
**Chercher:**
```typescript
// Scroll automatique vers le contact sélectionné
useEffect(() => {
  if (!selectedContactId) return
```

**Remplacer tout le useEffect par:**
```typescript
// Scroll automatique uniquement lors d'un clic sur une card
useEffect(() => {
  if (!selectedContactId || !shouldAutoScrollRef.current) return
  
  // Petit délai pour laisser le DOM se mettre à jour
  const timeoutId = setTimeout(() => {
    const node = scrollRef.current?.querySelector<HTMLDivElement>(`[data-contact-card="${selectedContactId}"]`)
    
    // Si le contact n'est pas dans le DOM, il faut charger plus de contacts
    if (!node) {
      const contactIndex = filteredContacts.findIndex(c => c.id === selectedContactId)
      if (contactIndex !== -1 && contactIndex >= visibleCount) {
        // Charger jusqu'à ce contact + quelques autres
        setVisibleCount(contactIndex + 20)
        // Réessayer après le render
        setTimeout(() => {
          const retryNode = scrollRef.current?.querySelector<HTMLDivElement>(`[data-contact-card="${selectedContactId}"]`)
          if (retryNode) {
            retryNode.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 200)
      }
      // Réinitialiser le flag
      shouldAutoScrollRef.current = false;
      return
    }
    
    // Vérifier si le contact est déjà visible
    const container = scrollRef.current
    if (!container) {
      shouldAutoScrollRef.current = false;
      return
    }
    
    const containerRect = container.getBoundingClientRect()
    const nodeRect = node.getBoundingClientRect()
    
    const isVisible = 
      nodeRect.top >= containerRect.top &&
      nodeRect.bottom <= containerRect.bottom
    
    // Scroller uniquement si pas visible
    if (!isVisible) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    
    // Réinitialiser le flag après le scroll
    shouldAutoScrollRef.current = false;
  }, 100)
  
  return () => clearTimeout(timeoutId)
}, [selectedContactId, visibleCount, filteredContacts])
```

### Étape 3: Trouver le onClick sur les cards et le modifier
**Chercher dans le JSX une Card avec:**
```typescript
onClick={() => onSelectContact(contact)}
```

**Remplacer par:**
```typescript
onClick={() => {
  shouldAutoScrollRef.current = true;
  onSelectContact(contact);
}}
```

### Étape 4: Ajouter le bouton "Premier sans statut"
**Dans la barre d'outils (après le bouton Autocall), ajouter:**

```typescript
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button 
        size="sm"
        onClick={() => {
          // Trouver le premier contact sans statut ou avec statut "Non défini"
          const firstWithoutStatus = filteredContacts.find(c => 
            !c.statut || c.statut === ContactStatus.NonDefini
          );
          
          if (firstWithoutStatus) {
            shouldAutoScrollRef.current = true;
            onSelectContact(firstWithoutStatus);
            toast.info('Retour au premier contact sans statut');
          } else {
            toast.info('Aucun contact sans statut trouvé');
          }
        }}
        className="h-9 bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
        disabled={!filteredContacts.some(c => !c.statut || c.statut === ContactStatus.NonDefini)}
      >
        <ChevronUp className="mr-2 h-4 w-4" />
        Premier sans statut
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom">
      <p>Revenir au premier contact sans statut</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

**Ajouter l'import si nécessaire:**
```typescript
import { ChevronUp } from 'lucide-react';
```

---

## Test Final

1. ✅ Cliquer sur un contact → doit centrer la ligne
2. ✅ Scroller manuellement → ne doit PAS revenir automatiquement
3. ✅ Cliquer sur "Premier sans statut" → doit revenir au premier contact sans statut
4. ✅ Tester en mode table ET en mode cards
