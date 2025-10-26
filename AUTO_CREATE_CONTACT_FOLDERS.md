# Création Automatique des Dossiers de Contacts

## Problème Résolu

Auparavant, le dialog d'attachement de fichiers affichait tous les contacts de la base de données, alors que l'annuaire n'affichait que les contacts ayant des événements. Cela créait une incohérence.

## Solution Implémentée

### 1. Création Automatique de Dossiers

Dès qu'un contact apparaît dans l'annuaire, un dossier personnel lui est automatiquement créé dans `C:\DimiCall\`.

**Format du nom de dossier :**
- Si le contact a un prénom et/ou nom : `Prenom_Nom_Telephone`
- Sinon : `Telephone` (numéro normalisé sans espaces ni tirets)

**Exemple :**
- Contact : Jean Dupont, +33 6 12 34 56 78
- Dossier créé : `C:\DimiCall\Jean_Dupont_33612345678\`

### 2. Fonctions Ajoutées

#### Dans `src/services/fileManagerService.ts` :

```typescript
// Génère un nom de dossier pour un contact
generateContactFolderName(contact): string

// Crée un dossier pour un contact s'il n'existe pas
ensureContactFolder(contact): Promise<{success, path?, error?}>

// Crée des dossiers pour plusieurs contacts en batch
ensureContactFolders(contacts): Promise<{success, created, errors}>
```

#### Dans `src/components/AnnuairePage.tsx` :

La fonction `fetchContacts` a été modifiée pour appeler automatiquement `ensureContactFolders` après le chargement des contacts. Cette opération se fait en arrière-plan sans bloquer l'interface.

### 3. Synchronisation avec FilesPage

Le `FilesPage` a été modifié pour charger les contacts depuis la même source que l'annuaire (base de données SQLite), garantissant ainsi la cohérence entre les deux vues.

## Avantages

1. **Automatique** : Aucune action manuelle requise
2. **Cohérent** : Les mêmes contacts apparaissent dans l'annuaire et le dialog d'attachement
3. **Organisé** : Chaque contact a son propre dossier dès sa création
4. **Non-bloquant** : La création des dossiers se fait en arrière-plan
5. **Performant** : Traitement par batch de 10 contacts à la fois

## Comportement

- Les dossiers sont créés automatiquement lors du chargement de l'annuaire
- Si un dossier existe déjà, il n'est pas recréé
- Les erreurs de création sont loggées mais n'affectent pas l'interface
- Le processus est silencieux pour ne pas perturber l'utilisateur

## Fichiers Modifiés

1. `src/services/fileManagerService.ts` - Ajout des fonctions de création automatique
2. `src/components/AnnuairePage.tsx` - Appel automatique lors du chargement
3. `src/pages/FilesPage.tsx` - Synchronisation avec la base de données

## Tests Recommandés

1. Ouvrir l'annuaire et vérifier que les dossiers sont créés dans `C:\DimiCall\`
2. Vérifier que les noms de dossiers correspondent au format attendu
3. Vérifier que le dialog d'attachement affiche les mêmes contacts que l'annuaire
4. Tester avec un grand nombre de contacts pour vérifier les performances
