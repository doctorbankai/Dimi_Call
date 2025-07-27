# Design Document

## Overview

Cette fonctionnalité ajoute un bouton d'export spécialisé pour Google Contacts qui filtre automatiquement les contacts avec les statuts "À rappeler", "DO", et "RO" et génère un fichier CSV compatible avec l'importation Google Contacts. Le design s'intègre dans l'interface existante de l'application DimiCall.

## Architecture

### Composants Impliqués

1. **Interface Utilisateur**
   - Nouveau bouton "Export Google Contacts" dans la barre d'outils principale
   - Notification toast pour le feedback utilisateur
   - Tooltip informatif sur le bouton

2. **Service d'Export**
   - Extension du service `dataService.ts` existant
   - Nouvelle fonction `exportGoogleContactsCSV`
   - Utilisation de la bibliothèque Papa Parse pour la génération CSV

3. **Logique de Filtrage**
   - Filtrage basé sur l'enum `ContactStatus` existant
   - Statuts ciblés : `ContactStatus.ARappeler`, `ContactStatus.DO`, `ContactStatus.RO`

## Components and Interfaces

### 1. Nouveau Bouton d'Export

**Localisation :** Intégré comme 4ème bouton dans l'ensemble de boutons ribbon existant (après Importer, Export, Supprimer).

**Design :**
```tsx
<button
  onClick={handleGoogleContactsExport}
  disabled={filteredContactsCount === 0}
  className="whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:text-accent-foreground dark:hover:bg-accent/50 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 flex flex-col items-center justify-center min-w-[80px] max-w-[80px] h-12 ribbon-button-modern relative overflow-hidden transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:shadow-primary/20 group cursor-pointer border border-transparent hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10 hover:border-primary/30"
  title={`Exporter ${filteredContactsCount} contacts (À rappeler, DO, RO) vers Google Contacts`}
>
  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
  </div>
  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-xl"></div>
  <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
    <div className="w-4 h-4 mb-1 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
      <Users className="w-4 h-4" />
    </div>
    <span className="text-[10px] leading-tight w-full transition-all duration-300 group-hover:font-semibold text-center">
      Google
    </span>
    {filteredContactsCount > 0 && (
      <Badge variant="secondary" className="absolute -top-1 -right-1 text-[8px] h-4 w-4 p-0 flex items-center justify-center">
        {filteredContactsCount}
      </Badge>
    )}
  </div>
</button>
```

**États du bouton :**
- Actif : Quand des contacts correspondent aux critères (statuts "À rappeler", "DO", "RO")
- Désactivé : Quand aucun contact ne correspond aux critères
- Badge : Petit badge en coin supérieur droit affichant le nombre de contacts à exporter
- Tooltip : Affiche le nombre exact de contacts et les statuts concernés

### 2. Service d'Export Google Contacts

**Fichier :** `services/dataService.ts`

**Nouvelle fonction :**
```typescript
export const exportGoogleContactsCSV = (contacts: Contact[]): void => {
  // Filtrer les contacts par statut
  const filteredContacts = contacts.filter(contact => 
    contact.statut === ContactStatus.ARappeler ||
    contact.statut === ContactStatus.DO ||
    contact.statut === ContactStatus.RO
  );

  if (filteredContacts.length === 0) {
    throw new Error('Aucun contact à exporter avec les statuts sélectionnés');
  }

  // Mapping vers le format Google Contacts
  const googleContactsData = filteredContacts.map(contact => ({
    'Given Name': contact.prenom || '',
    'Family Name': contact.nom || '',
    'Phone 1 - Value': contact.telephone || '',
    'E-mail 1 - Value': contact.email || '',
    'Notes': buildNotesField(contact)
  }));

  // Génération du CSV avec encodage UTF-8 BOM
  const csvContent = Papa.unparse(googleContactsData);
  const bom = '\uFEFF'; // UTF-8 BOM pour la compatibilité Google Contacts
  const blob = new Blob([bom + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  // Téléchargement du fichier
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `google-contacts-export-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
```

**Fonction auxiliaire pour les notes :**
```typescript
const buildNotesField = (contact: Contact): string => {
  const notes = [];
  
  if (contact.commentaire) {
    notes.push(`Commentaire: ${contact.commentaire}`);
  }
  
  if (contact.source) {
    notes.push(`Source: ${contact.source}`);
  }
  
  if (contact.dateRappel) {
    notes.push(`Date rappel: ${contact.dateRappel}`);
    if (contact.heureRappel) {
      notes.push(`Heure rappel: ${contact.heureRappel}`);
    }
  }
  
  if (contact.dateRDV) {
    notes.push(`Date RDV: ${contact.dateRDV}`);
    if (contact.heureRDV) {
      notes.push(`Heure RDV: ${contact.heureRDV}`);
    }
  }
  
  notes.push(`Statut: ${contact.statut}`);
  
  return notes.join(' | ');
};
```

### 3. Intégration dans App.tsx

**Handler d'export :**
```typescript
const handleGoogleContactsExport = useCallback(() => {
  try {
    exportGoogleContactsCSV(contacts);
    const filteredCount = contacts.filter(contact => 
      contact.statut === ContactStatus.ARappeler ||
      contact.statut === ContactStatus.DO ||
      contact.statut === ContactStatus.RO
    ).length;
    
    showNotification('success', `${filteredCount} contacts exportés vers Google Contacts`);
  } catch (error) {
    showNotification('error', error instanceof Error ? error.message : 'Erreur lors de l\'export');
  }
}, [contacts, showNotification]);
```

**Calcul du nombre de contacts filtrés :**
```typescript
const googleContactsCount = useMemo(() => {
  return contacts.filter(contact => 
    contact.statut === ContactStatus.ARappeler ||
    contact.statut === ContactStatus.DO ||
    contact.statut === ContactStatus.RO
  ).length;
}, [contacts]);
```

## Data Models

### Format Google Contacts CSV

Le fichier CSV généré respecte le format d'importation Google Contacts avec les colonnes suivantes :

| Colonne | Description | Source DimiCall |
|---------|-------------|-----------------|
| `Given Name` | Prénom | `contact.prenom` |
| `Family Name` | Nom de famille | `contact.nom` |
| `Phone 1 - Value` | Numéro de téléphone principal | `contact.telephone` |
| `E-mail 1 - Value` | Adresse email principale | `contact.email` |
| `Notes` | Notes et informations supplémentaires | Combinaison de `commentaire`, `source`, dates, et `statut` |

### Exemple de sortie CSV

```csv
Given Name,Family Name,Phone 1 - Value,E-mail 1 - Value,Notes
Jean,Dupont,+33 1 23 45 67 89,jean.dupont@email.com,Commentaire: Intéressé par nos services | Source: LinkedIn | Date rappel: 2024-01-15 | Heure rappel: 14:30 | Statut: À rappeler
Marie,Martin,+33 6 98 76 54 32,marie.martin@email.com,Source: Site web | Date RDV: 2024-01-20 | Heure RDV: 10:00 | Statut: DO
```

## Error Handling

### Cas d'Erreur Gérés

1. **Aucun contact correspondant aux critères**
   - Message : "Aucun contact à exporter avec les statuts sélectionnés"
   - Action : Désactiver le bouton et afficher un tooltip informatif

2. **Erreur de génération CSV**
   - Message : "Erreur lors de la génération du fichier CSV"
   - Action : Notification d'erreur avec détails techniques

3. **Erreur de téléchargement**
   - Message : "Erreur lors du téléchargement du fichier"
   - Action : Notification d'erreur et suggestion de réessayer

### Validation des Données

- Vérification que les contacts ont au minimum un prénom ou un nom
- Nettoyage des caractères spéciaux dans les champs texte
- Gestion des champs vides avec des chaînes vides plutôt que null/undefined

## Testing Strategy

### Tests Unitaires

1. **Service d'Export**
   - Test du filtrage par statut
   - Test de la génération du format CSV
   - Test de la construction du champ Notes
   - Test de la gestion des champs vides

2. **Composant Bouton**
   - Test de l'état activé/désactivé selon les données
   - Test du compteur de contacts
   - Test du tooltip informatif

### Tests d'Intégration

1. **Flux Complet d'Export**
   - Test de l'export avec différents jeux de données
   - Test de la compatibilité avec Google Contacts
   - Test de l'encodage UTF-8 avec BOM

2. **Interface Utilisateur**
   - Test de l'intégration dans la barre d'outils
   - Test des notifications de succès/erreur
   - Test de la réactivité du bouton aux changements de données

### Tests de Compatibilité

1. **Google Contacts**
   - Vérification de l'importation réussie dans Google Contacts
   - Test de l'affichage correct des caractères spéciaux
   - Test de la préservation des données dans le champ Notes

2. **Navigateurs**
   - Test du téléchargement de fichier sur Chrome, Firefox, Safari
   - Test de l'encodage UTF-8 sur différentes plateformes

## Performance Considerations

### Optimisations

1. **Filtrage Efficace**
   - Utilisation de `Array.filter()` avec conditions optimisées
   - Mise en cache du compteur de contacts filtrés avec `useMemo`

2. **Génération CSV**
   - Utilisation de Papa Parse pour une génération optimisée
   - Gestion mémoire efficace pour les gros volumes de données

3. **Interface Utilisateur**
   - Calcul réactif du nombre de contacts à exporter
   - Mise à jour en temps réel de l'état du bouton

### Limites

- Recommandation de ne pas exporter plus de 10 000 contacts à la fois
- Gestion gracieuse des timeouts de téléchargement
- Feedback visuel pour les exports volumineux

## Integration Points

### Avec l'Interface Existante

1. **Ensemble de Boutons Ribbon**
   - Positionnement comme 4ème bouton dans l'ensemble : Importer → Export → Supprimer → **Google**
   - Utilisation du même style `ribbon-button-modern` que les autres boutons
   - Cohérence visuelle parfaite avec les boutons existants
   - Responsive design intégré avec les contraintes `min-w-[80px] max-w-[80px]`

2. **Système de Notifications**
   - Utilisation du système `showNotification` existant
   - Messages cohérents avec le reste de l'application
   - Durée d'affichage adaptée au type de message

### Avec les Services Existants

1. **DataService**
   - Extension du service existant sans modification des fonctions actuelles
   - Réutilisation des utilitaires de formatage existants
   - Cohérence avec les patterns d'export existants

2. **État de l'Application**
   - Utilisation de l'état `contacts` existant
   - Réactivité aux changements de données en temps réel
   - Intégration avec le système de filtrage existant