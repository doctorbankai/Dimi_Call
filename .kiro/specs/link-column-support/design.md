# Design Document

## Overview

Cette fonctionnalité ajoute le support d'une colonne "Lien" dans l'application de gestion de contacts, permettant aux utilisateurs de stocker et d'ouvrir directement des liens internet. La fonctionnalité s'intègre dans l'architecture existante des boutons d'action rapide (LinkedIn, Google) et du système de recherche automatique.

## Architecture

### Composants Affectés

1. **Interface Contact** (`src/types.ts`)
   - Ajout du champ optionnel `lien?: string`

2. **Utilitaires de recherche** (`src/lib/utils.ts`)
   - Nouvelle fonction `openDirectLink(url: string)`
   - Fonction de validation d'URL `isValidUrl(url: string)`

3. **Composant principal** (`src/App.tsx`)
   - Nouveau bouton "Lien" dans la section des actions rapides
   - Extension du type `autoSearchMode` pour inclure 'link'
   - Nouvelle option "Auto-Lien" dans le dropdown menu

4. **Service de données** (`services/dataService.ts`)
   - Support de la colonne "Lien" lors de l'importation
   - Validation des URLs lors du traitement des données

## Components and Interfaces

### 1. Extension du Type Contact

```typescript
export interface Contact {
  // ... champs existants
  lien?: string; // URL du lien internet associé au contact
}
```

### 2. Extension du Mode de Recherche Automatique

```typescript
type AutoSearchMode = 'disabled' | 'linkedin' | 'google' | 'link';
```

### 3. Nouvelles Fonctions Utilitaires

```typescript
// Validation d'URL
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Ouverture de lien direct avec gestion de fenêtre dédiée
let linkWindowRef: Window | null = null;

export const openDirectLink = (url: string): void => {
  if (!isValidUrl(url)) {
    console.warn('URL invalide:', url);
    return;
  }

  // Assurer que l'URL a un protocole
  const fullUrl = url.startsWith('http') ? url : `https://${url}`;

  // Réutiliser la fenêtre existante ou en créer une nouvelle
  if (linkWindowRef && !linkWindowRef.closed) {
    try {
      linkWindowRef.location.href = fullUrl;
      linkWindowRef.focus();
    } catch (error) {
      linkWindowRef = window.open(fullUrl, 'dimicall-link-window', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    }
  } else {
    linkWindowRef = window.open(fullUrl, 'dimicall-link-window', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  }
};
```

### 4. Composant Bouton Lien

Le bouton "Lien" suivra le même pattern que les boutons LinkedIn et Google existants :

```typescript
<RibbonButton 
  onClick={() => handleDirectLink()} 
  icon={<ExternalLink />} 
  label="Lien" 
  disabled={!selectedContact || !selectedContact.lien}
  className="min-w-[80px] max-w-[80px] h-12"
/>
```

### 5. Extension du Dropdown Menu

Ajout de l'option "Auto-Lien" dans le menu déroulant :

```typescript
<DropdownMenuItem 
  onClick={() => setAutoSearchMode('link')}
  className="cursor-pointer"
>
  <ExternalLink className="mr-2 h-4 w-4 text-purple-500" />
  <span>Auto-Lien</span>
  {autoSearchMode === 'link' && <span className="ml-auto text-xs opacity-70">Actuel</span>}
</DropdownMenuItem>
```

## Data Models

### Extension du Modèle Contact

La colonne "Lien" sera ajoutée comme champ optionnel dans l'interface Contact. Cette approche permet :

1. **Rétrocompatibilité** : Les contacts existants sans lien continuent de fonctionner
2. **Flexibilité** : Les utilisateurs peuvent choisir d'utiliser ou non cette fonctionnalité
3. **Validation** : Les URLs seront validées lors de l'importation et de l'utilisation

### Mapping des Colonnes d'Importation

Le système d'importation sera étendu pour reconnaître les colonnes suivantes comme "Lien" :
- "lien"
- "link" 
- "url"
- "site"
- "website"

## Error Handling

### 1. Validation des URLs

- **Lors de l'importation** : URLs invalides génèrent un avertissement mais n'empêchent pas l'importation
- **Lors de l'ouverture** : URLs invalides affichent une notification d'erreur
- **Format automatique** : URLs sans protocole sont automatiquement préfixées avec "https://"

### 2. Gestion des Erreurs de Fenêtre

- **Popup bloqué** : Notification informant l'utilisateur d'autoriser les popups
- **Fenêtre fermée** : Création automatique d'une nouvelle fenêtre
- **URL inaccessible** : Gestion par le navigateur (page d'erreur standard)

### 3. États d'Erreur

```typescript
const handleDirectLink = useCallback((contact?: Contact) => {
  const target = contact || selectedContact;
  if (!target) {
    showNotification('info', "Sélectionnez un contact pour ouvrir le lien.");
    return;
  }
  
  if (!target.lien) {
    showNotification('warning', "Ce contact n'a pas de lien associé.");
    return;
  }

  try {
    openDirectLink(target.lien);
    showNotification('success', 'Lien ouvert avec succès', 2000);
  } catch (error) {
    showNotification('error', 'Erreur lors de l\'ouverture du lien');
  }
}, [selectedContact, showNotification]);
```

## Testing Strategy

### 1. Tests Unitaires

- **Validation d'URL** : Test de `isValidUrl()` avec différents formats d'URL
- **Ouverture de lien** : Mock de `window.open()` pour tester `openDirectLink()`
- **Gestion d'erreurs** : Test des cas d'erreur (URL invalide, fenêtre bloquée)

### 2. Tests d'Intégration

- **Importation de données** : Test d'importation avec colonne "Lien"
- **Interface utilisateur** : Test des interactions bouton/dropdown
- **Mode automatique** : Test du mode "Auto-Lien" lors des appels

### 3. Tests End-to-End

- **Workflow complet** : Importation → Sélection → Ouverture de lien
- **Modes de recherche** : Basculement entre les différents modes automatiques
- **Validation visuelle** : États activé/désactivé des boutons

### 4. Tests de Validation

```typescript
describe('URL Validation', () => {
  test('should validate correct URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://test.org')).toBe(true);
    expect(isValidUrl('www.site.fr')).toBe(false); // Nécessite protocole
  });

  test('should handle malformed URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl('javascript:alert(1)')).toBe(true); // Techniquement valide mais à surveiller
  });
});
```

## Visual Design

### 1. Icône et Couleur

- **Icône** : `ExternalLink` de Lucide React (cohérent avec l'écosystème existant)
- **Couleur** : Violet/Purple (`text-purple-500`) pour se distinguer du bleu LinkedIn et vert Google
- **Style** : Même format que les boutons existants avec animations identiques

### 2. États Visuels

- **Actif** : Bouton normal avec hover effects
- **Désactivé** : Opacité réduite, cursor not-allowed
- **Mode Auto** : Indicateur visuel dans le dropdown avec icône distinctive

### 3. Feedback Utilisateur

- **Tooltip** : "Ouvrir le lien associé" au survol du bouton
- **Notifications** : Messages de succès/erreur cohérents avec le système existant
- **Indicateur de mode** : Affichage clair du mode "Auto-Lien" sélectionné