# Amélioration des recherches LinkedIn et Google

## Résumé des modifications

Les recherches LinkedIn et Google via DimiCall ont été améliorées pour inclure automatiquement les champs **Type** et **Source** du contact (si disponibles) dans la requête de recherche.

## Modifications apportées

### 1. Fichier `src/lib/utils.ts`

#### Fonction `searchLinkedIn`
- **Avant** : Recherche uniquement avec "Prénom + Nom"
- **Après** : Recherche avec "Prénom + Nom + Type + Source" (si disponibles)

```typescript
export const searchLinkedIn = (prenom: string, nom: string, type?: string, source?: string): void => {
  const normalizedPrenom = removeAccents(prenom);
  const normalizedNom = removeAccents(nom);
  const normalizedType = type ? removeAccents(type) : '';
  const normalizedSource = source ? removeAccents(source) : '';
  
  const query = filterAndJoin(normalizedPrenom, normalizedNom, normalizedType, normalizedSource);
  // ...
}
```

#### Fonction `searchGoogle`
- **Avant** : Recherche uniquement avec "Prénom + Nom"
- **Après** : Recherche avec "Prénom + Nom + Type + Source" (si disponibles)

```typescript
export const searchGoogle = (prenom: string, nom: string, type?: string, source?: string): void => {
  const query = filterAndJoin(prenom, nom, type, source);
  // ...
}
```

### 2. Fichier `src/App.tsx`

Ajout de trois nouveaux handlers pour gérer les recherches :

#### `handleLinkedInSearch`
```typescript
const handleLinkedInSearch = useCallback((contact?: Contact) => {
  const targetContact = contact || selectedContact;
  if (!targetContact) {
    showNotification('error', 'Veuillez sélectionner un contact');
    return;
  }
  
  const prenom = targetContact.prenom || '';
  const nom = targetContact.nom || '';
  const type = (targetContact as any).type || '';
  const source = targetContact.source || '';
  
  searchLinkedIn(prenom, nom, type, source);
}, [selectedContact, showNotification]);
```

#### `handleGoogleSearch`
```typescript
const handleGoogleSearch = useCallback((contact?: Contact) => {
  const targetContact = contact || selectedContact;
  if (!targetContact) {
    showNotification('error', 'Veuillez sélectionner un contact');
    return;
  }
  
  const prenom = targetContact.prenom || '';
  const nom = targetContact.nom || '';
  const type = (targetContact as any).type || '';
  const source = targetContact.source || '';
  
  searchGoogle(prenom, nom, type, source);
}, [selectedContact, showNotification]);
```

#### `handleDirectLink`
```typescript
const handleDirectLink = useCallback((contact?: Contact) => {
  const targetContact = contact || selectedContact;
  if (!targetContact) {
    showNotification('error', 'Veuillez sélectionner un contact');
    return;
  }
  
  const lien = targetContact.lien || '';
  if (!lien) {
    showNotification('error', 'Ce contact n\'a pas de lien défini');
    return;
  }
  
  openDirectLink(lien);
}, [selectedContact, showNotification]);
```

## Comportement

### Recherche LinkedIn
Lorsque vous cliquez sur le bouton LinkedIn (ou que le mode automatique LinkedIn est activé), la recherche inclura :
- **Prénom** du contact
- **Nom** du contact
- **Type** du contact (si disponible)
- **Source** du contact (si disponible)

**Exemple** :
- Contact : Jean Dupont, Type: "Étudiant", Source: "HEC Paris"
- Recherche LinkedIn : `Jean Dupont Etudiant HEC Paris`

### Recherche Google
Même comportement que LinkedIn, mais avec Google Search.

### Lien direct
Ouvre le lien défini dans le champ `lien` du contact dans une fenêtre dédiée.

## Onglets de recherche automatique

Les onglets de recherche automatique dans la zone "Appels 2" permettent de configurer le comportement lors de la sélection d'un contact :

- **Désactivé** : Aucune recherche automatique
- **LinkedIn** : Ouvre automatiquement LinkedIn avec les informations du contact
- **Google** : Ouvre automatiquement Google avec les informations du contact
- **Lien** : Ouvre automatiquement le lien direct du contact (si disponible)

## Interface utilisateur

### Boutons de recherche dans "Appels 2" (mode table)

Trois nouveaux boutons ont été ajoutés dans la barre d'outils de la page "Appels 2" en mode table :

1. **Bouton LinkedIn** (bleu #0A66C2)
   - Icône : LinkedIn
   - Texte : "LinkedIn"
   - Désactivé si aucun contact n'est sélectionné
   - Lance une recherche LinkedIn avec les informations du contact

2. **Bouton Google** (bleu #4285F4)
   - Icône : Globe
   - Texte : "Google"
   - Désactivé si aucun contact n'est sélectionné
   - Lance une recherche Google avec les informations du contact

3. **Bouton Lien direct** (style par défaut)
   - Icône : Eye
   - Texte : "Lien direct"
   - Désactivé si aucun contact n'est sélectionné OU si le contact n'a pas de lien
   - Ouvre le lien direct du contact dans une fenêtre dédiée

Ces boutons sont positionnés juste avant les boutons d'import/export dans la barre d'outils.

## Notes techniques

- Les accents sont automatiquement normalisés pour améliorer les résultats de recherche
- Les valeurs vides, nulles ou "N/A" sont automatiquement filtrées
- Les fenêtres de recherche sont réutilisées (une fenêtre dédiée pour LinkedIn, une pour Google, une pour les liens)
- Les handlers sont optimisés avec `useCallback` pour éviter les re-renders inutiles
- Les boutons sont désactivés automatiquement quand aucun contact n'est sélectionné
- Le bouton "Lien direct" est également désactivé si le contact sélectionné n'a pas de lien défini
