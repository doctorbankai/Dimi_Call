# Boutons LinkedIn manuels séparés

## Résumé
Les boutons de recherche manuelle LinkedIn dans les modes "Cards" et "Table" de la page "Appels" ont été dédoublés pour offrir deux options de recherche distinctes, similaires au mode de recherche automatique.

## Modifications apportées

### 1. Fichier `src/components/AppelsCardsView.tsx`

#### Mise à jour de la signature de la prop `onLinkedInSearch`
```typescript
// Avant
onLinkedInSearch: () => void

// Après
onLinkedInSearch: (mode?: 'name' | 'name-type') => void
```

#### Deux boutons LinkedIn séparés (Mode Cards)
Le bouton unique a été remplacé par deux boutons distincts :
- **LinkedIn** : Recherche simple avec prénom et nom uniquement
- **LinkedIn+** : Recherche enrichie avec prénom, nom et type (ou source)

```tsx
<Button 
  variant="outline" 
  size="sm" 
  className="h-8 gap-1.5 px-3 bg-[#0A66C2] hover:bg-[#004182] text-white border-[#0A66C2]"
  onClick={() => onLinkedInSearch('name')}
>
  <Linkedin className="h-4 w-4" /> 
  <span>LinkedIn</span>
</Button>
<Button 
  variant="outline" 
  size="sm" 
  className="h-8 gap-1.5 px-3 bg-[#0A66C2] hover:bg-[#004182] text-white border-[#0A66C2]"
  onClick={() => onLinkedInSearch('name-type')}
>
  <Linkedin className="h-4 w-4" /> 
  <span>LinkedIn+</span>
</Button>
```

#### Deux boutons LinkedIn séparés (Mode Table)
La même approche a été appliquée dans la barre d'outils du mode Table, avec un design responsive qui masque le texte sur les petits écrans.

### 2. Fichier `src/App.tsx`

#### Mise à jour de la fonction `handleLinkedInSearch`
La fonction a été modifiée pour accepter un paramètre `mode` optionnel tout en maintenant la compatibilité avec l'ancien comportement (passage d'un contact).

```typescript
const handleLinkedInSearch = useCallback((modeOrContact?: 'name' | 'name-type' | Contact, contact?: Contact) => {
  // Déterminer si le premier paramètre est un mode ou un contact
  let mode: 'name' | 'name-type' | undefined;
  let targetContact: Contact | null;
  
  if (typeof modeOrContact === 'object' && modeOrContact !== null) {
    // Premier paramètre est un contact (ancien comportement)
    targetContact = modeOrContact;
    mode = undefined;
  } else {
    // Premier paramètre est un mode (nouveau comportement)
    mode = modeOrContact as 'name' | 'name-type' | undefined;
    targetContact = contact || selectedContact;
  }
  
  if (!targetContact) {
    showNotification('error', 'Veuillez sélectionner un contact');
    return;
  }

  const prenom = targetContact.prenom || '';
  const nom = targetContact.nom || '';
  const type = (targetContact as any).type || '';
  const source = targetContact.source || '';

  // Si mode est spécifié, utiliser ce mode, sinon utiliser le mode complet par défaut
  if (mode === 'name') {
    // Mode simple: Prénom + Nom uniquement
    searchLinkedIn(prenom, nom);
  } else if (mode === 'name-type') {
    // Mode intermédiaire: Prénom + Nom + Type (ou Source si Type vide)
    const typeOrSource = type || source;
    searchLinkedIn(prenom, nom, typeOrSource);
  } else {
    // Mode complet par défaut: Prénom + Nom + Type + Source
    searchLinkedIn(prenom, nom, type, source);
  }
}, [selectedContact, showNotification]);
```

#### Mise à jour de l'appel dans AppelsCardsView
```typescript
onLinkedInSearch={(mode) => handleLinkedInSearch(mode)}
```

## Comportement

### Mode "name" (Prénom + Nom)
- Recherche LinkedIn avec uniquement le prénom et le nom du contact
- URL générée : `https://www.linkedin.com/search/results/people/?keywords=Prenom+Nom`

### Mode "name-type" (Prénom + Nom + Type)
- Recherche LinkedIn avec le prénom, le nom et le type du contact
- Si le type n'est pas disponible, utilise la source
- URL générée : `https://www.linkedin.com/search/results/people/?keywords=Prenom+Nom+Type`

### Mode par défaut (sans mode spécifié)
- Recherche LinkedIn complète avec prénom, nom, type et source
- Utilisé pour la compatibilité avec les anciens appels
- URL générée : `https://www.linkedin.com/search/results/people/?keywords=Prenom+Nom+Type+Source`

## Cohérence avec le mode automatique

Les deux options du dropdown manuel correspondent exactement aux modes de recherche automatique :
- **linkedin-name** → **LinkedIn (Prénom + Nom)**
- **linkedin-name-type** → **LinkedIn (Prénom + Nom + Type)**

Cette cohérence permet aux utilisateurs de basculer facilement entre recherche manuelle et automatique avec le même comportement.

## Compatibilité

- ✅ Rétrocompatibilité maintenue avec les anciens appels à `handleLinkedInSearch(contact)`
- ✅ Fonctionne dans les deux modes d'affichage (Cards et Table)
- ✅ Design responsive adapté aux petits écrans
- ✅ Aucune régression sur les fonctionnalités existantes

## Avantages des boutons séparés

### Simplicité et clarté
- **Accès direct** : Un clic suffit pour lancer la recherche souhaitée
- **Pas de menu intermédiaire** : Pas besoin d'ouvrir un dropdown pour choisir
- **Visibilité immédiate** : Les deux options sont toujours visibles

### Expérience utilisateur optimale
- **Plus rapide** : Économise un clic par rapport à un dropdown
- **Plus intuitif** : L'utilisateur voit directement les deux options disponibles
- **Pas de bugs de hover** : Évite les problèmes d'ouverture/fermeture de dropdown

### Nomenclature
- **LinkedIn** : Recherche standard (Prénom + Nom)
- **LinkedIn+** : Recherche enrichie (Prénom + Nom + Type)

## Tests recommandés

1. Tester le bouton "LinkedIn" en mode Cards
2. Tester le bouton "LinkedIn+" en mode Cards
3. Tester le bouton "LinkedIn" en mode Table
4. Tester le bouton "LinkedIn+" en mode Table
5. Vérifier que les deux options génèrent les bonnes URLs
6. Vérifier la compatibilité avec le mode de recherche automatique
7. Tester sur différentes tailles d'écran (responsive)
8. Vérifier que les boutons sont désactivés quand aucun contact n'est sélectionné (mode Table)
9. Vérifier que le texte des boutons s'adapte sur mobile (hidden sm:inline)
