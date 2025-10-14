# Fix du Scroll Automatique - Page Appels

## Problème
Dans la page Appels (mode table et cards), le scroll revient automatiquement à la ligne sélectionnée en permanence, empêchant de naviguer librement dans la liste.

## Solution
1. **Centrer uniquement au clic** - pas de verrouillage continu
2. **Ajouter un bouton** pour revenir rapidement à la dernière ligne sans statut
3. **Appliquer aux deux vues** - table et cards

## Modifications à Appliquer

### 1. ContactTable.tsx - Désactiver le scroll automatique permanent

**Localisation** : Ligne ~687 dans `src/components/ContactTable.tsx`

**Avant** :
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

**Après** :
```typescript
  // Ref pour tracker si le scroll doit être automatique (uniquement au clic)
  const shouldAutoScrollRef = useRef(false);

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

**Ensuite**, trouver le gestionnaire de clic sur les lignes (chercher `onClick` dans le TableRow) et ajouter :
```typescript
onClick={() => {
  shouldAutoScrollRef.current = true; // Activer le scroll pour ce clic
  onSelectContact(contact);
}}
```

### 2. AppelsCardsView.tsx - Même correction pour le mode cards

**Localisation** : Ligne ~1100 dans `src/components/AppelsCardsView.tsx`

**Avant** :
```typescript
  // Scroll automatique vers le contact sélectionné
  useEffect(() => {
    if (!selectedContactId) return
    
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
        return
      }
      
      // Vérifier si le contact est déjà visible
      const container = scrollRef.current
      if (!container) return
      
      const containerRect = container.getBoundingClientRect()
      const nodeRect = node.getBoundingClientRect()
      
      const isVisible = 
        nodeRect.top >= containerRect.top &&
        nodeRect.bottom <= containerRect.bottom
      
      // Scroller uniquement si pas visible
      if (!isVisible) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [selectedContactId, visibleCount, filteredContacts])
```

**Après** :
```typescript
  // Ref pour tracker si le scroll doit être automatique (uniquement au clic)
  const shouldAutoScrollRef = useRef(false);

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

**Ensuite**, trouver le gestionnaire de clic sur les cards (chercher `onClick` dans le Card) et ajouter :
```typescript
onClick={() => {
  shouldAutoScrollRef.current = true; // Activer le scroll pour ce clic
  onSelectContact(contact);
}}
```

### 3. Ajouter un bouton "Revenir à la dernière ligne sans statut"

**Dans AppelsCardsView.tsx**, ajouter ce bouton dans la barre d'outils (après les autres boutons) :

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
            shouldAutoScrollRef.current = true; // Activer le scroll
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

**Import nécessaire** :
```typescript
import { ChevronUp } from 'lucide-react';
```

### 4. Même bouton pour le mode Table

Dans le composant qui affiche la table (probablement dans `App.tsx` ou un composant parent), ajouter le même bouton avec la même logique.

## Résultat Attendu

✅ Le scroll ne se déclenche que lors d'un clic sur une ligne/card
✅ L'utilisateur peut naviguer librement dans la liste sans être ramené automatiquement
✅ Un bouton permet de revenir rapidement au premier contact sans statut
✅ Le comportement est cohérent entre le mode table et le mode cards

## Test

1. Ouvrir la page Appels
2. Cliquer sur un contact → doit centrer la ligne
3. Scroller manuellement vers le haut ou le bas → ne doit PAS revenir automatiquement
4. Cliquer sur le bouton "Premier sans statut" → doit revenir au premier contact sans statut
5. Tester en mode table et en mode cards
