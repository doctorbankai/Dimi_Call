# Design Document

## Overview

Cette fonctionnalité modifie l'ordre des colonnes dans l'export de données pour correspondre aux besoins métier spécifiés. Le système doit réorganiser les colonnes existantes et ajouter les colonnes manquantes tout en maintenant la compatibilité avec les formats d'import/export existants.

## Architecture

### Composants Affectés

1. **dataService.ts** - Service principal contenant la fonction `exportContactsToFile`
2. **types.ts** - Interface Contact (déjà contient les champs nécessaires)
3. **constants.tsx** - Mappings des colonnes et headers (pour cohérence)

### Flux de Données

```
User clicks Export → App.tsx handleExport → dataService.exportContactsToFile → File Download
```

## Components and Interfaces

### 1. Modification de la fonction exportContactsToFile

**Localisation**: `services/dataService.ts`

**Changements requis**:
- Réorganiser l'ordre des headers selon les spécifications
- Ajouter les colonnes manquantes (Sexe, Type, Qualité)
- Renommer certaines colonnes pour cohérence
- Mapper correctement les données vers les nouvelles colonnes

**Nouvel ordre des colonnes**:
```typescript
const headers = [
  'Date Rappel',      // contact.dateRappel
  'Heure Rappel',     // contact.heureRappel  
  'Sexe',             // contact.sexe
  'Prénom',           // contact.prenom
  'Nom',              // contact.nom
  'Numéro',           // contact.telephone (renommé de "Téléphone")
  'Mail',             // contact.email
  'Source',           // contact.source (renommé de "École/Source")
  'Type',             // contact.type
  'Qualité',          // contact.qualite
  'Date Appel',       // contact.dateAppel
  'Statut Appel',     // contact.statut (renommé de "Statut")
  'Commentaires Appel' // contact.commentaire (renommé de "Commentaire")
];
```

### 2. Mapping des données

**Nouveau mapping**:
```typescript
const data = contacts.map(contact => [
  contact.dateRappel || '',
  contact.heureRappel || '',
  contact.sexe || '',
  contact.prenom || '',
  contact.nom || '',
  contact.telephone || '',
  contact.email || '',
  contact.source || '', // Anciennement contact.ecole
  contact.type || '',
  contact.qualite || '',
  contact.dateAppel || '',
  contact.statut || '',
  contact.commentaire || ''
]);
```

### 3. Mise à jour de la fonction d'import avec détection flexible

**Localisation**: `services/dataService.ts` - fonction `normalizeHeader`

**Changements requis**:
- Implémenter une détection flexible et robuste des noms de colonnes
- Supporter de multiples variantes pour chaque type de colonne
- Gérer les accents, espaces, et variations linguistiques
- Maintenir la rétrocompatibilité avec tous les anciens formats

**Nouveau mapping flexible**:
```typescript
const mapping: Record<string, string> = {
  // Mappings pour Prénom
  'prénom': 'prenom',
  'prenom': 'prenom',
  'firstname': 'prenom',
  'first name': 'prenom',
  
  // Mappings pour Nom
  'nom': 'nom',
  'lastname': 'nom',
  'last name': 'nom',
  'surname': 'nom',
  
  // Mappings pour Téléphone/Numéro (très flexible)
  'téléphone': 'telephone',
  'telephone': 'telephone',
  'numéro': 'telephone',
  'numero': 'telephone',
  'phone': 'telephone',
  'tel': 'telephone',
  'mobile': 'telephone',
  'cellulaire': 'telephone',
  
  // Mappings pour Email
  'mail': 'email',
  'email': 'email',
  'e-mail': 'email',
  'courriel': 'email',
  
  // Mappings pour Source (très flexible)
  'source': 'source',
  'école': 'source',
  'ecole': 'source',
  'school': 'source',
  'origine': 'source',
  'provenance': 'source',
  
  // Mappings pour Statut (très flexible)
  'statut': 'statut',
  'statut appel': 'statut',
  'status': 'statut',
  'état': 'statut',
  'etat': 'statut',
  'call status': 'statut',
  
  // Mappings pour Commentaire (très flexible)
  'commentaire': 'commentaire',
  'commentaires': 'commentaire',
  'commentaires appel': 'commentaire',
  'comment': 'commentaire',
  'comments': 'commentaire',
  'note': 'commentaire',
  'notes': 'commentaire',
  'remarque': 'commentaire',
  'remarques': 'commentaire',
  
  // Mappings pour Sexe
  'sexe': 'sexe',
  'genre': 'sexe',
  'gender': 'sexe',
  'civilité': 'sexe',
  'civilite': 'sexe',
  
  // Mappings pour Type
  'type': 'type',
  'catégorie': 'type',
  'categorie': 'type',
  'category': 'type',
  
  // Mappings pour Qualité
  'qualité': 'qualite',
  'qualite': 'qualite',
  'quality': 'qualite',
  'niveau': 'qualite',
  
  // Mappings pour Date Rappel (très flexible)
  'date rappel': 'dateRappel',
  'date de rappel': 'dateRappel',
  'rappel date': 'dateRappel',
  'callback date': 'dateRappel',
  'daterappel': 'dateRappel',
  
  // Mappings pour Heure Rappel (très flexible)
  'heure rappel': 'heureRappel',
  'heure de rappel': 'heureRappel',
  'rappel heure': 'heureRappel',
  'callback time': 'heureRappel',
  'heurerappel': 'heureRappel',
  
  // Mappings pour Date Appel (très flexible)
  'date appel': 'dateAppel',
  'date d\'appel': 'dateAppel',
  'appel date': 'dateAppel',
  'call date': 'dateAppel',
  'dateappel': 'dateAppel',
  'date d appel': 'dateAppel'
};
```

## Data Models

### Interface Contact (Existante)

L'interface Contact dans `types.ts` contient déjà tous les champs nécessaires :

```typescript
export interface Contact {
  // Champs existants utilisés
  dateRappel: string;
  heureRappel: string;
  sexe?: string;        // Optionnel, sera inclus dans l'export
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  source: string;       // Anciennement ecole
  type?: string;        // Optionnel, sera inclus dans l'export
  qualite?: string;     // Optionnel, sera inclus dans l'export
  dateAppel: string;
  statut: ContactStatus;
  commentaire: string;
  // ... autres champs non utilisés dans l'export
}
```

## Error Handling

### Gestion des Colonnes Manquantes

- Les champs optionnels (sexe, type, qualite) seront traités avec des valeurs par défaut vides
- Utilisation de l'opérateur `||` pour fournir des chaînes vides si les valeurs sont undefined/null

### Rétrocompatibilité

- La fonction `normalizeHeader` sera étendue pour supporter les nouveaux noms de colonnes
- Les anciens noms de colonnes continueront de fonctionner lors de l'import
- Les fichiers exportés avec l'ancien format pourront toujours être importés

### Validation des Données

- Aucune validation supplémentaire requise car les champs sont déjà typés
- Les valeurs vides seront exportées comme chaînes vides

## Testing Strategy

### Tests Unitaires

1. **Test de l'ordre des colonnes**
   - Vérifier que les headers sont dans le bon ordre
   - Vérifier que les données correspondent aux headers

2. **Test des colonnes manquantes**
   - Tester l'export avec des contacts ayant des champs optionnels vides
   - Vérifier que les colonnes sont créées même si vides

3. **Test de rétrocompatibilité**
   - Tester l'import d'un fichier exporté avec l'ancien format
   - Tester l'import d'un fichier exporté avec le nouveau format
   - Vérifier que les mappings fonctionnent correctement

### Tests d'Intégration

1. **Test du flux complet Export/Import**
   - Exporter des données avec le nouveau format
   - Réimporter le fichier exporté
   - Vérifier l'intégrité des données

2. **Test des formats multiples**
   - Tester l'export en CSV et Excel
   - Vérifier que l'ordre des colonnes est cohérent entre les formats

### Tests Manuels

1. **Test de l'interface utilisateur**
   - Vérifier que le bouton Export fonctionne correctement
   - Vérifier que le fichier téléchargé a le bon format
   - Ouvrir le fichier dans Excel/LibreOffice pour validation visuelle

## Implementation Notes

### Ordre de Priorité

1. Modifier la fonction `exportContactsToFile` avec le nouvel ordre
2. Mettre à jour la fonction `normalizeHeader` pour la rétrocompatibilité
3. Tester les deux formats (CSV et Excel)
4. Valider la rétrocompatibilité avec les imports existants

### Considérations Techniques

- Les champs optionnels (sexe, type, qualite) sont déjà définis dans l'interface Contact
- Le champ `source` remplace `ecole` dans la logique métier
- Aucune migration de données nécessaire car les champs existent déjà
- La fonction existante gère déjà les formats CSV et Excel
- **Détection flexible** : Le système doit reconnaître "Numéro" = "Téléphone", "Statut Appel" = "Statut", etc.
- **Normalisation** : Suppression des accents, espaces, et conversion en minuscules pour la détection
- **Fallback** : Si aucun mapping n'est trouvé, utiliser le nom de colonne tel quel

### Impact sur les Performances

- Impact minimal car seul l'ordre des colonnes change
- Aucune nouvelle logique de traitement des données
- Pas d'impact sur la taille des fichiers exportés