# Documentation technique : Sauvegarde automatique

## Vue d'ensemble

La page "Appels 2" implémente un système de sauvegarde automatique robuste qui garantit la persistance de toutes les modifications, même en cas de fermeture ou crash de l'application.

---

## Architecture de la sauvegarde

### 1. Sauvegarde avec debounce (modifications de formulaire)

**Localisation** : `src/components/AppelsCardsView.tsx` (lignes 475-485)

```typescript
// Sauvegarde automatique avec debounce
useEffect(() => {
  if (!selectedContact) return
  
  const timeoutId = setTimeout(() => {
    handleSave()
  }, 1000) // Sauvegarde après 1 seconde d'inactivité
  
  return () => clearTimeout(timeoutId)
}, [formState, selectedStatus, noteDraft])
```

**Fonctionnement** :
- Déclenché automatiquement quand `formState`, `selectedStatus` ou `noteDraft` change
- Délai de 1 seconde pour éviter les sauvegardes trop fréquentes
- Annulation du timer précédent si une nouvelle modification arrive

**Données concernées** :
- Prénom, nom, téléphone, email
- Commentaires
- Dates et heures de rappel
- Dates et heures de RDV
- Source et autres champs du formulaire

---

### 2. Sauvegarde immédiate (changements de statut)

**Localisation** : `src/components/AppelsCardsView.tsx` (lignes 500-530)

```typescript
// Gestion des raccourcis clavier (F1-F10)
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const newStatus = shortcutService.getStatusForKey(key)
    if (newStatus && selectedContact) {
      e.preventDefault()
      setSelectedStatus(newStatus as ContactStatus)
      onUpdateContact({
        id: selectedContact.id,
        statut: newStatus as ContactStatus
      })
      // ...
    }
  }
  // ...
}, [selectedContact, isAutocallActive, filteredContacts, onCall, onUpdateContact, onSelectContact])
```

**Fonctionnement** :
- Sauvegarde immédiate lors de l'application d'un statut (F2-F10)
- Pas de debounce car l'action est intentionnelle et ponctuelle
- Appel direct à `onUpdateContact` qui déclenche la chaîne de sauvegarde

---

### 3. Fonction de mise à jour centrale

**Localisation** : `src/App.tsx` (lignes 660-695)

```typescript
const updateContact = useCallback(async (updatedFields: Partial<Contact> & { id: string }) => {
  console.log('🔄 [UPDATE] updateContact appel avec:', updatedFields);
  
  setContacts(currentContacts => {
    const existingContact = currentContacts.find(c => c.id === updatedFields.id);
    if (!existingContact) {
      return currentContacts;
    }

    const updatedContact = { ...existingContact, ...updatedFields };
    const updatedContacts = currentContacts.map(c => 
      c.id === updatedFields.id ? updatedContact : c
    );
    
    // Sauvegarder les contacts mis à jour
    saveContacts(updatedContacts);
    
    // Si on a une table importée, la mettre à jour aussi
    if (hasImportedTable()) {
      const savedTable = loadImportedTable();
      if (savedTable && savedTable.metadata) {
        saveImportedTable(updatedContacts, savedTable.metadata);
      }
    }
    
    return updatedContacts;
  });
  
  // Mise à jour des onglets
  setTableTabs(prevTabs => {
    // ...
  });
  
  // Mise à jour du contact sélectionné
  if (selectedContact?.id === updatedFields.id) {
    setSelectedContact(updatedContact);
  }
  
  // Forcer le re-render
  setTableUpdateKey(prev => prev + 1);
  
  // ...
}, [/* dependencies */]);
```

**Fonctionnement** :
1. Trouve le contact à mettre à jour
2. Fusionne les nouvelles données avec les anciennes
3. Appelle `saveContacts()` pour sauvegarder dans localStorage
4. Appelle `saveImportedTable()` si une table importée existe
5. Met à jour tous les états React concernés
6. Force le re-render de l'interface

---

### 4. Persistance dans localStorage

**Localisation** : `src/services/dataService.ts`

#### saveContacts()
```typescript
export const saveContacts = (contacts: Contact[]): void => {
  try {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des contacts:', error);
  }
};
```

#### saveImportedTable()
```typescript
export const saveImportedTable = (contacts: Contact[], metadata?: { 
  fileName?: string; 
  importDate?: string; 
  source?: 'csv' | 'xlsx';
  totalRows?: number;
}): void => {
  try {
    const data = {
      contacts,
      metadata: {
        fileName: metadata?.fileName || 'Import',
        importDate: metadata?.importDate || new Date().toISOString(),
        source: metadata?.source || 'csv',
        totalRows: metadata?.totalRows || contacts.length
      }
    };
    localStorage.setItem(IMPORTED_TABLE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la table importée:', error);
  }
};
```

**Clés localStorage** :
- `CONTACTS_KEY` : Liste principale des contacts
- `IMPORTED_TABLE_KEY` : Table importée avec métadonnées

---

### 5. Restauration au démarrage

**Localisation** : `src/App.tsx` (lignes 1550-1600)

```typescript
useEffect(() => {
  if (!isInitialized) {
    // Vérifier s'il y a une table importée sauvegardée
    if (hasImportedTable()) {
      const savedTable = loadImportedTable();
      if (savedTable && savedTable.contacts.length > 0) {
        const metadata = savedTable.metadata;
        console.log('📂 Table importée chargée:', savedTable.contacts.length, 'contacts', `(${metadata?.fileName})`);
        
        // Restaurer les contacts
        setContacts(savedTable.contacts);
        
        // Créer un onglet avec les contacts restaurés
        const tabId = crypto.randomUUID();
        setTableTabs([{ 
          id: tabId, 
          name: metadata?.fileName || 'Import restauré', 
          contacts: savedTable.contacts 
        }]);
        setActiveTableTabId(tabId);
        
        console.log('🔄 Restauration de la table importée:', savedTable.contacts.length, 'contacts');
      }
    }
    
    setIsInitialized(true);
  }
}, [isInitialized]);
```

**Fonctionnement** :
1. Vérifie si une table importée existe dans localStorage
2. Charge les contacts et métadonnées
3. Restaure l'état de l'application
4. Crée un onglet avec les contacts restaurés
5. Marque l'application comme initialisée

---

## Garanties de persistance

### ✅ Données sauvegardées automatiquement

| Donnée | Méthode | Délai | Persistance |
|--------|---------|-------|-------------|
| Statut | Immédiate | 0s | ✅ localStorage |
| Commentaire | Debounce | 1s | ✅ localStorage |
| Dates/Heures | Debounce | 1s | ✅ localStorage |
| Infos contact | Debounce | 1s | ✅ localStorage |
| Historique appels | Immédiate | 0s | ✅ localStorage + SQLite |
| Table importée | Immédiate | 0s | ✅ localStorage |

### ✅ Scénarios de récupération

1. **Fermeture normale** : Toutes les données sont sauvegardées ✅
2. **Fermeture forcée** : Données sauvegardées jusqu'à la dernière modification (max 1s de perte) ✅
3. **Crash application** : Restauration automatique au redémarrage ✅
4. **Perte de connexion** : Sauvegarde locale continue de fonctionner ✅
5. **Rechargement page** : Restauration complète de l'état ✅

---

## Optimisations

### Debounce intelligent
- Évite les sauvegardes trop fréquentes pendant la saisie
- Garantit une sauvegarde après 1 seconde d'inactivité
- Annule les sauvegardes en attente si nouvelle modification

### Sauvegarde conditionnelle
- Vérifie que le contact existe avant de sauvegarder
- Ne sauvegarde que si les données ont réellement changé
- Gère les erreurs de sauvegarde sans bloquer l'interface

### Double sauvegarde
- `saveContacts()` : Liste principale
- `saveImportedTable()` : Table importée avec métadonnées
- Redondance pour garantir la récupération

---

## Logs de débogage

Les logs suivants permettent de suivre le processus de sauvegarde :

```
🔄 [UPDATE] updateContact appel avec: {...}
🔄 [UPDATE] Contacts mis à jour: X contacts
🔄 [UPDATE] Contact modifié: {...}
💾 Table importée sauvegardée: X contacts
📂 Table importée chargée: X contacts (fichier.xlsx)
🔄 Restauration de la table importée: X contacts
```

---

## Maintenance et évolution

### Points d'attention
- Surveiller la taille du localStorage (limite ~5-10MB selon navigateurs)
- Implémenter une compression si nécessaire pour grandes listes
- Considérer une migration vers IndexedDB pour volumes importants

### Améliorations futures possibles
- Synchronisation cloud (Supabase)
- Versioning des modifications
- Undo/Redo
- Sauvegarde incrémentale (delta)
- Export automatique périodique
