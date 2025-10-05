# Design Document - Correction des boutons non fonctionnels dans Appels 2 (mode Table)

## Overview

Ce document décrit l'architecture et la conception technique pour activer et connecter tous les boutons de la page "Appels 2" en mode table. L'objectif est d'atteindre une parité fonctionnelle complète avec la page "Appels" originale en réutilisant les mêmes handlers et composants.

Le problème actuel est que le composant `PaginatedContactTable` utilisé en mode table dans `AppelsCardsView` ne reçoit pas les handlers nécessaires pour les actions (appel, SMS, email, etc.) et les boutons de la navbar sont désactivés en mode table.

## Architecture

### Composants concernés

1. **AppelsCardsView** (`src/components/AppelsCardsView.tsx`)
   - Composant parent qui gère les deux modes (cards/table)
   - Reçoit tous les handlers en props depuis App.tsx
   - Doit transmettre ces handlers au composant table

2. **PaginatedContactTable** (`src/components/PaginatedContactTable.tsx`)
   - Wrapper autour de ContactTable qui ajoute la pagination
   - Doit recevoir et transmettre les handlers d'action

3. **ContactTable** (`src/components/ContactTable.tsx`)
   - Composant de table réutilisable
   - Doit afficher les boutons d'action et les connecter aux handlers

### Flux de données

```
App.tsx
  ↓ (handlers en props)
AppelsCardsView
  ↓ (mode === 'table')
PaginatedContactTable
  ↓ (handlers en props)
ContactTable
  ↓ (boutons d'action)
Actions utilisateur
```

## Components and Interfaces

### 1. Mise à jour de l'interface PaginatedContactTable

Le composant `PaginatedContactTable` doit accepter de nouveaux props pour les handlers d'action :

```typescript
interface PaginatedContactTableProps {
  // Props existants
  contacts: Contact[];
  selectedContactId: string | null;
  onSelectContact: (contact: Contact | null) => void;
  onUpdateContact: (updates: Partial<Contact> & { id: string }) => void;
  onDeleteContact: (contactId: string) => void;
  callStates: CallStates;
  activeCallContactId: string | null;
  theme: Theme;
  visibleColumns: Record<string, boolean>;
  columnHeaders: string[];
  contactDataKeys: (keyof Contact | null)[];
  onToggleColumnVisibility: (header: string) => void;
  
  // Nouveaux props pour les actions
  onCall?: () => void | Promise<void>;
  onHangUp?: () => void | Promise<void>;
  onEmail?: () => void;
  onSmsMonsieur?: () => void;
  onSmsMadame?: () => void;
  onRappel?: () => void;
  onRendezVous?: () => void;
  onCalCom?: () => void;
  onQualification?: () => void;
  onLinkedInSearch?: () => void;
  onGoogleSearch?: () => void;
  onDirectLink?: () => void;
  adbConnected?: boolean;
}
```

### 2. Mise à jour de l'interface ContactTable

Le composant `ContactTable` doit également accepter ces handlers :

```typescript
interface ContactTableProps {
  // Props existants
  contacts: Contact[];
  callStates: CallStates;
  onSelectContact: (contact: Contact | null) => void;
  selectedContactId: string | null;
  onUpdateContact: (contact: Partial<Contact> & { id: string }) => void;
  onDeleteContact: (contactId: string) => void;
  activeCallContactId: string | null;
  theme: Theme;
  visibleColumns: Record<string, boolean>;
  columnHeaders: string[];
  contactDataKeys: (keyof Contact | null)[];
  onToggleColumnVisibility: (header: string) => void;
  availableColumns?: string[];
  onFileImport?: (file: File) => Promise<void>;
  
  // Nouveaux props pour les actions
  onCall?: () => void | Promise<void>;
  onHangUp?: () => void | Promise<void>;
  onEmail?: () => void;
  onSmsMonsieur?: () => void;
  onSmsMadame?: () => void;
  onRappel?: () => void;
  onRendezVous?: () => void;
  onCalCom?: () => void;
  onQualification?: () => void;
  onLinkedInSearch?: () => void;
  onGoogleSearch?: () => void;
  onDirectLink?: () => void;
  adbConnected?: boolean;
}
```

### 3. Ajout d'une colonne "Actions" dans ContactTable

Une nouvelle colonne "Actions" doit être ajoutée à la table avec les boutons suivants :

```typescript
// Configuration de la colonne Actions
const actionsColumn: ColumnConfig = {
  id: 'actions',
  key: 'actions',
  label: 'Actions',
  icon: Settings2,
  width: '200px',
  minWidth: '200px',
  canHide: false,
  canSort: false,
  defaultVisible: true,
};
```

Le rendu de cette colonne inclura :

```tsx
<TableCell className="px-2 py-1.5">
  <div className="flex items-center gap-2">
    <TooltipProvider>
      {/* Bouton Appeler */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="size-10 rounded-full bg-green-500 hover:bg-green-600 text-white"
            onClick={(e) => {
              e.stopPropagation();
              onSelectContact(contact);
              onCall?.();
            }}
            disabled={!selectedContactId || !adbConnected}
            aria-label="Appeler"
          >
            <Phone className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {!selectedContactId ? 'Sélectionnez un contact' : !adbConnected ? 'ADB non connecté' : 'Appeler'}
        </TooltipContent>
      </Tooltip>

      {/* Bouton SMS avec dropdown */}
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="size-10 rounded-full"
                disabled={!selectedContactId}
                aria-label="SMS"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onSmsMonsieur?.()}>
                SMS Monsieur
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSmsMadame?.()}>
                SMS Madame
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>SMS</TooltipContent>
      </Tooltip>

      {/* Bouton Email */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="size-10 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onSelectContact(contact);
              onEmail?.();
            }}
            disabled={!selectedContactId}
            aria-label="Email"
          >
            <Mail className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Email</TooltipContent>
      </Tooltip>

      {/* Bouton Qualification */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="size-10 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onSelectContact(contact);
              onQualification?.();
            }}
            disabled={!selectedContactId}
            aria-label="Qualification"
          >
            <FileCheck className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Qualifier le contact</TooltipContent>
      </Tooltip>

      {/* Bouton Rappel */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="size-10 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onSelectContact(contact);
              onRappel?.();
            }}
            disabled={!selectedContactId}
            aria-label="Rappel"
          >
            <Bell className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Programmer un rappel</TooltipContent>
      </Tooltip>

      {/* Bouton Rendez-vous */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="size-10 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onSelectContact(contact);
              onRendezVous?.();
            }}
            disabled={!selectedContactId}
            aria-label="Rendez-vous"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Programmer un rendez-vous</TooltipContent>
      </Tooltip>

      {/* Bouton Cal.com */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="size-10 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onSelectContact(contact);
              onCalCom?.();
            }}
            disabled={!selectedContactId}
            aria-label="Cal.com"
          >
            <CalendarSearch className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Ouvrir Cal.com</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</TableCell>
```

### 4. Activation des boutons de la navbar en mode table

Dans `AppelsCardsView`, les boutons de la navbar doivent être activés en mode table :

```tsx
<div className="flex flex-wrap items-center gap-2">
  {/* Supprimer la condition viewMode === 'cards' pour activer en mode table aussi */}
  <Tabs value={autoSearchMode} onValueChange={(value) => setAutoSearchMode(value as any)} className="w-auto">
    {/* ... */}
  </Tabs>
  
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          size="sm"
          onClick={() => {
            setIsAutocallActive(!isAutocallActive)
            toast.info(isAutocallActive ? 'Autocall désactivé' : 'Autocall activé')
          }}
          className={cn("h-9", /* ... */)}
        >
          <PhoneCall className="mr-2 h-4 w-4" />
          Autocall
        </Button>
      </TooltipTrigger>
      {/* ... */}
    </Tooltip>
  </TooltipProvider>
  
  <ButtonGroup>
    <Button 
      size="sm"
      className="h-9 bg-neutral-900 hover:bg-black text-white border-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-900"
      onClick={() => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.csv,.tsv,.xlsx,.xls'
        input.onchange = async (e) => {
          const files = (e.target as HTMLInputElement).files
          if (files && files.length > 0) {
            await analyzeAndOpenMappingDialog(files[0])
          }
        }
        input.click()
      }}
      title="Importer un fichier CSV/Excel"
    >
      <Upload className="h-4 w-4 mr-2" />
      Importer
    </Button>
    
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          size="sm" 
          className="h-9 bg-neutral-900 hover:bg-black text-white border-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-900"
          title="Exporter les données"
        >
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Exporter les données</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onExportDialog}>
          <Download className="mr-2 h-4 w-4" />
          Exporter (Excel uniquement)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </ButtonGroup>
  
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button 
        size="sm"
        className="h-9 bg-red-500 hover:bg-red-600 text-white border-red-500 dark:bg-red-600 dark:hover:bg-red-700"
      >
        <Trash2 className="mr-2 h-4 w-4" /> Supprimer
      </Button>
    </AlertDialogTrigger>
    {/* ... */}
  </AlertDialog>
</div>
```

## Data Models

Aucune modification des modèles de données n'est nécessaire. Les types existants (`Contact`, `CallStates`, etc.) sont suffisants.

## Error Handling

### Gestion des erreurs d'action

Chaque handler d'action doit gérer ses propres erreurs. Le composant table se contente d'appeler les handlers fournis en props.

```typescript
const handleActionClick = async (action: () => void | Promise<void>, contact: Contact) => {
  try {
    // Sélectionner le contact avant l'action
    onSelectContact(contact);
    
    // Exécuter l'action
    await action();
  } catch (error) {
    console.error('Erreur lors de l\'exécution de l\'action:', error);
    toast.error('Erreur', {
      description: 'Une erreur est survenue lors de l\'exécution de l\'action'
    });
  }
};
```

### Validation des props

Les composants doivent vérifier que les handlers nécessaires sont fournis :

```typescript
// Dans ContactTable
useEffect(() => {
  if (!onCall || !onEmail || !onSmsMonsieur || !onSmsMadame) {
    console.warn('[ContactTable] Certains handlers d\'action ne sont pas fournis');
  }
}, [onCall, onEmail, onSmsMonsieur, onSmsMadame]);
```

## Testing Strategy

### Tests unitaires

1. **PaginatedContactTable**
   - Vérifier que les handlers sont correctement transmis à ContactTable
   - Vérifier que la pagination fonctionne avec les nouveaux props

2. **ContactTable**
   - Vérifier que les boutons d'action sont rendus
   - Vérifier que les boutons sont désactivés quand aucun contact n'est sélectionné
   - Vérifier que les handlers sont appelés avec les bons paramètres
   - Vérifier que le contact est sélectionné avant l'exécution de l'action

3. **AppelsCardsView**
   - Vérifier que les handlers sont transmis en mode table
   - Vérifier que les boutons de la navbar sont activés en mode table
   - Vérifier que le sélecteur d'onglet fonctionne en mode table

### Tests d'intégration

1. **Flux complet d'appel**
   - Sélectionner un contact en mode table
   - Cliquer sur le bouton "Appeler"
   - Vérifier que l'appel est initié

2. **Flux complet d'import**
   - Basculer en mode table
   - Cliquer sur "Importer"
   - Sélectionner un fichier
   - Vérifier que le dialogue de mapping s'ouvre
   - Confirmer l'import
   - Vérifier que les contacts sont ajoutés

3. **Flux complet d'export**
   - Basculer en mode table
   - Cliquer sur "Exporter"
   - Sélectionner un format
   - Vérifier que le fichier est téléchargé

### Tests manuels

1. Vérifier visuellement que tous les boutons sont activés en mode table
2. Tester chaque action individuellement
3. Vérifier les tooltips et messages d'erreur
4. Tester le basculement entre modes cards et table
5. Vérifier la cohérence avec la page "Appels" originale

## Performance Considerations

### Optimisations

1. **Mémoïsation des handlers**
   - Utiliser `useCallback` pour les handlers dans AppelsCardsView
   - Éviter les re-renders inutiles de ContactTable

2. **Lazy loading des composants**
   - Les dialogues (Rappel, RDV, Qualification) ne doivent être montés que quand nécessaire

3. **Virtualisation**
   - La pagination existante dans PaginatedContactTable gère déjà la performance pour les grandes listes

### Métriques

- Temps de rendu initial : < 100ms
- Temps de réponse au clic : < 50ms
- Mémoire utilisée : pas d'augmentation significative par rapport à l'existant

## Security Considerations

Aucune considération de sécurité spécifique. Les handlers d'action sont fournis par le composant parent (App.tsx) qui gère déjà la sécurité et les permissions.

## Migration Strategy

### Phase 1 : Mise à jour des interfaces
1. Ajouter les nouveaux props aux interfaces de PaginatedContactTable et ContactTable
2. Rendre ces props optionnels pour ne pas casser l'existant

### Phase 2 : Transmission des handlers
1. Mettre à jour AppelsCardsView pour transmettre les handlers à PaginatedContactTable
2. Mettre à jour PaginatedContactTable pour transmettre les handlers à ContactTable

### Phase 3 : Ajout de la colonne Actions
1. Ajouter la configuration de la colonne Actions dans ContactTable
2. Implémenter le rendu des boutons d'action

### Phase 4 : Activation de la navbar
1. Supprimer les conditions qui désactivent les boutons en mode table
2. Tester tous les boutons de la navbar

### Phase 5 : Tests et validation
1. Exécuter tous les tests
2. Validation manuelle
3. Correction des bugs éventuels

## Dependencies

- Aucune nouvelle dépendance externe requise
- Utilisation des composants UI existants (shadcn/ui)
- Réutilisation des handlers existants

## Conclusion

Cette conception permet d'activer tous les boutons de la page "Appels 2" en mode table en réutilisant l'architecture existante et en transmettant simplement les handlers appropriés à travers la hiérarchie des composants. L'approche est minimale, non invasive et garantit la cohérence avec la page "Appels" originale.
