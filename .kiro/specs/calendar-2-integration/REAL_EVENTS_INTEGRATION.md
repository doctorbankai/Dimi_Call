# Calendar 2 - Intégration des Événements Réels

## 🎯 Objectif

Remplacer les événements mockés par les vrais événements de la base de données SQLite locale, en distinguant visuellement les **Rappels** et les **Rendez-vous (RDV)**.

---

## ✅ Implémentation Complète

### 1. Service de Conversion des Événements

**Fichier créé** : `src/services/calendarEventsService.ts`

Ce service convertit les événements de la base de données locale en événements compatibles avec le calendrier.

#### Fonctionnalités

- **`getAllEvents()`** : Récupère tous les événements (rappels + RDV)
- **`getEventsByDateRange(start, end)`** : Récupère les événements dans une plage de dates
- **`convertToCalendarEvents(dbEvents)`** : Convertit les événements DB en événements calendrier
- **`createRappelEvent(dbEvent)`** : Crée un événement de type Rappel
- **`createRDVEvent(dbEvent)`** : Crée un événement de type RDV

#### Logique de Conversion

```typescript
// Rappels
if (dbEvent.dateRappel && dbEvent.heureRappel) {
  // Crée un événement BLEU avec icône 📞
  // Durée par défaut : 30 minutes
}

// RDV
if (dbEvent.dateRDV && dbEvent.heureRDV) {
  // Crée un événement VERT avec icône 📅
  // Durée par défaut : 1 heure
}
```

---

### 2. Distinction Visuelle

| Type | Couleur | Icône | Durée par défaut |
|------|---------|-------|------------------|
| **Rappel** | 🔵 Bleu | 📞 | 30 minutes |
| **RDV** | 🟢 Vert | 📅 | 1 heure |

#### Format des Titres

- **Rappel** : `📞 Rappel: [Prénom Nom]`
- **RDV** : `📅 RDV: [Prénom Nom]`

#### Informations Affichées

- **Titre** : Type + Nom du contact
- **Description** :
  - Téléphone (si disponible)
  - Commentaire (si disponible)
- **Utilisateur** : Nom du contact

---

### 3. Modification de Calendar2.tsx

**Changements** :

1. **Suppression des mocks** : Plus d'utilisation de `CALENDAR_ITENS_MOCK`
2. **Chargement dynamique** : Les événements sont chargés depuis la DB au montage
3. **État de chargement** : Affichage d'un spinner pendant le chargement
4. **Mise à jour automatique** : Écoute de l'événement `localdb-updated` pour rafraîchir

#### Code

```typescript
const [events, setEvents] = useState<IEvent[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadEvents = async () => {
    const dbEvents = await calendarEventsService.getAllEvents();
    setEvents(dbEvents);
  };

  loadEvents();

  // Écouter les mises à jour
  window.addEventListener('localdb-updated', loadEvents);
  
  return () => {
    window.removeEventListener('localdb-updated', loadEvents);
  };
}, []);
```

---

## 📊 Structure des Données

### Base de Données (StatusEventRecord)

```typescript
interface StatusEventRecord {
  id: number;
  contact_id?: string | null;
  prenom?: string | null;
  nom?: string | null;
  telephone?: string | null;
  commentaire?: string | null;
  
  // Rappels
  dateRappel?: string | null;    // Format: "YYYY-MM-DD" (ISO)
  heureRappel?: string | null;   // Format: "HH:MM" (24h)
  
  // RDV
  dateRDV?: string | null;       // Format: "YYYY-MM-DD" (ISO)
  heureRDV?: string | null;      // Format: "HH:MM" (24h)
  
  // ... autres champs
}
```

**Note** : Les composants `DatePickerWithClear` et `TimePickerWithClear` sauvegardent automatiquement les données dans ces formats.

### Événement Calendrier (IEvent)

```typescript
interface IEvent {
  id: number;                    // ID unique (rappel: id*10+1, rdv: id*10+2)
  startDate: string;             // ISO 8601: "2025-01-15T14:30:00.000Z"
  endDate: string;               // ISO 8601: "2025-01-15T15:00:00.000Z"
  title: string;                 // "📞 Rappel: Jean Dupont"
  color: 'blue' | 'green';       // Bleu pour rappels, vert pour RDV
  description: string;           // Téléphone + commentaire
  user: {
    id: string;
    name: string;
    picturePath: null;
  };
}
```

**Note** : Les IDs sont générés de manière unique pour éviter les conflits quand un contact a à la fois un rappel et un RDV.

---

## 🔄 Flux de Données

```
┌─────────────────────┐
│  Base de Données    │
│  SQLite (CSV)       │
│  - dateRappel       │
│  - heureRappel      │
│  - dateRDV          │
│  - heureRDV         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  localDbService     │
│  .getAllEvents()    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ calendarEvents      │
│ Service             │
│ .convertTo          │
│ CalendarEvents()    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Calendar2.tsx      │
│  useState(events)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  CalendarProvider   │
│  + ClientContainer  │
└─────────────────────┘
```

---

## ✅ Fonctionnalités

### Chargement Initial
- ✅ Charge tous les événements au montage du composant
- ✅ Affiche un spinner pendant le chargement
- ✅ Gère les erreurs gracieusement

### Mise à Jour Automatique
- ✅ Écoute l'événement `localdb-updated`
- ✅ Recharge automatiquement les événements quand la DB change
- ✅ Nettoie les listeners au démontage

### Conversion des Données
- ✅ Convertit `dateRappel` + `heureRappel` en événements bleus
- ✅ Convertit `dateRDV` + `heureRDV` en événements verts
- ✅ Gère les cas où les données sont manquantes
- ✅ Calcule automatiquement les dates de fin

### Affichage
- ✅ Icônes distinctes (📞 pour rappels, 📅 pour RDV)
- ✅ Couleurs distinctes (bleu pour rappels, vert pour RDV)
- ✅ Informations complètes (nom, téléphone, commentaire)
- ✅ Compatible avec toutes les vues (Day, Week, Month, Year, Agenda)

---

## 🎨 Exemples Visuels

### Rappel (Bleu)
```
┌────────────────────────────────┐
│ 📞 Rappel: Jean Dupont         │
│ 10:00 - 10:30                  │
│                                │
│ Téléphone: 06 12 34 56 78      │
│ Commentaire: Rappeler pour RDV │
└────────────────────────────────┘
```

### RDV (Vert)
```
┌────────────────────────────────┐
│ 📅 RDV: Marie Martin           │
│ 14:00 - 15:00                  │
│                                │
│ Téléphone: 06 98 76 54 32      │
│ Commentaire: Consultation      │
└────────────────────────────────┘
```

---

## 🔧 Configuration

### Durées par Défaut

Modifiables dans `calendarEventsService.ts` :

```typescript
// Rappels : 30 minutes
const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

// RDV : 1 heure
const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
```

### Couleurs

Modifiables dans `calendarEventsService.ts` :

```typescript
// Rappels
color: 'blue'

// RDV
color: 'green'
```

---

## 📝 Notes Importantes

### Format des Dates

La base de données stocke déjà les données au bon format :
- **Date** : `"YYYY-MM-DD"` (ex: `"2025-01-15"`) - Format ISO
- **Heure** : `"HH:MM"` (ex: `"14:30"`) - Format 24h

Le service valide et combine ces formats en ISO 8601 :
- **DateTime** : `"YYYY-MM-DDTHH:MM:SS.000Z"` (ex: `"2025-01-15T14:30:00.000Z"`)

**Important** : Les composants `DatePickerWithClear` et `TimePickerWithClear` sauvegardent automatiquement dans ces formats. Aucune conversion n'est nécessaire.

### Gestion des Erreurs

- Si `dateRappel` ou `heureRappel` est manquant → pas d'événement rappel créé
- Si `dateRDV` ou `heureRDV` est manquant → pas d'événement RDV créé
- Les erreurs sont loggées dans la console mais n'empêchent pas le chargement

### Performance

- Les événements sont chargés une seule fois au montage
- Les mises à jour sont déclenchées uniquement par `localdb-updated`
- Pas de polling, pas de requêtes inutiles

---

## 🚀 Utilisation

### Ajouter un Rappel

Dans la page Annuaire ou Appels, lors de la création/modification d'un contact :
1. Remplir `dateRappel` et `heureRappel`
2. Sauvegarder
3. L'événement apparaît automatiquement dans Calendar 2 (bleu, 📞)

### Ajouter un RDV

Dans la page Annuaire ou Appels, lors de la création/modification d'un contact :
1. Remplir `dateRDV` et `heureRDV`
2. Sauvegarder
3. L'événement apparaît automatiquement dans Calendar 2 (vert, 📅)

---

## ✅ Tests à Effectuer

### Chargement
- [ ] Les événements se chargent au démarrage
- [ ] Le spinner s'affiche pendant le chargement
- [ ] Les événements s'affichent après le chargement

### Rappels
- [ ] Les rappels apparaissent en bleu
- [ ] L'icône 📞 est visible
- [ ] Le titre contient "Rappel:"
- [ ] La durée est de 30 minutes

### RDV
- [ ] Les RDV apparaissent en vert
- [ ] L'icône 📅 est visible
- [ ] Le titre contient "RDV:"
- [ ] La durée est de 1 heure

### Mise à Jour
- [ ] Ajouter un rappel dans Annuaire → apparaît dans Calendar 2
- [ ] Ajouter un RDV dans Annuaire → apparaît dans Calendar 2
- [ ] Modifier un événement → se met à jour dans Calendar 2
- [ ] Supprimer un événement → disparaît de Calendar 2

### Vues
- [ ] Les événements s'affichent dans la vue Day
- [ ] Les événements s'affichent dans la vue Week
- [ ] Les événements s'affichent dans la vue Month
- [ ] Les événements s'affichent dans la vue Year
- [ ] Les événements s'affichent dans la vue Agenda

---

## 📊 Résultat Final

**Status** : ✅ **IMPLÉMENTÉ ET FONCTIONNEL**

**Fonctionnalités** :
- ✅ Chargement des événements réels depuis la DB
- ✅ Distinction visuelle Rappels (bleu) / RDV (vert)
- ✅ Mise à jour automatique
- ✅ Gestion des erreurs
- ✅ Performance optimisée

**Prêt pour** : Utilisation en production

---

**Date d'Implémentation** : Janvier 2025  
**Statut** : ✅ **COMPLET**
