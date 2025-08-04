# Design Document - Export Google Agenda

## Overview

Cette fonctionnalité ajoute un bouton "Agenda" à côté du bouton "Contacts" existant pour permettre l'export des rappels de contacts vers Google Calendar. Le design s'inspire de l'implémentation existante du bouton "Contacts" pour assurer la cohérence de l'interface utilisateur.

## Architecture

### 1. **Interface Utilisateur**
   - Nouveau bouton "Agenda" dans la barre d'outils principale
   - Positionnement à côté du bouton "Contacts" existant
   - Style identique au bouton "Contacts" avec icône calendrier
   - Badge dynamique affichant le nombre de rappels disponibles

### 2. **Service d'Export**
   - Extension du service `dataService.ts` existant
   - Nouvelle fonction `exportGoogleCalendarCSV`
   - Filtrage des contacts ayant des dates/heures de rappel
   - Génération CSV compatible Google Calendar

### 3. **Gestion d'État**
   - Nouveau compteur `calendarRemindersCount` dans l'état principal
   - Calcul dynamique basé sur les contacts avec rappels
   - Mise à jour automatique lors des changements de données

## Components and Interfaces

### Bouton Agenda UI

```tsx
<button
  onClick={handleGoogleCalendarExport}
  size="sm"
  disabled={calendarRemindersCount === 0}
  className="whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:text-accent-foreground dark:hover:bg-accent/50 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 flex flex-col items-center justify-center min-w-[80px] max-w-[80px] h-12 ribbon-button-modern relative overflow-hidden transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:shadow-primary/20 group cursor-pointer border border-transparent hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10 hover:border-primary/30"
  title={calendarRemindersCount > 0 
    ? `Exporter ${calendarRemindersCount} rappels vers Google Agenda` 
    : 'Aucun rappel à exporter - Seuls les contacts avec date/heure de rappel sont exportés'
  }
>
  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
  </div>
  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-xl"></div>
  <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
    <div className="w-4 h-4 mb-1 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
      <CalendarIcon />
    </div>
    <span className="text-[10px] leading-tight w-full transition-all duration-300 group-hover:font-semibold text-center">Agenda</span>
    {calendarRemindersCount > 0 && (
      <span className="rounded-md border font-medium whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90 absolute -top-1 -right-1 text-[8px] h-4 w-4 p-0 flex items-center justify-center">
        {calendarRemindersCount}
      </span>
    )}
  </div>
</button>
```

### Service d'Export

**Nouvelle fonction :**
```typescript
export const exportGoogleCalendarCSV = (contacts: Contact[]): void => {
  // Filtrer les contacts ayant des dates de rappel
  const contactsWithReminders = contacts.filter(contact => 
    contact.dateRappel && contact.dateRappel.trim() !== ''
  );

  if (contactsWithReminders.length === 0) {
    throw new Error('Aucun rappel à exporter');
  }

  // Mapping vers le format Google Calendar
  const calendarEvents = contactsWithReminders.map(contact => {
    const startDate = formatDateForGoogleCalendar(contact.dateRappel);
    const startTime = contact.heureRappel ? formatTimeForGoogleCalendar(contact.heureRappel) : '';
    const endTime = contact.heureRappel ? calculateEndTime(contact.heureRappel) : '';
    const isAllDay = !contact.heureRappel || contact.heureRappel.trim() === '';

    return {
      'Subject': `Rappel: ${contact.prenom} ${contact.nom}`,
      'Start Date': startDate,
      'Start Time': startTime,
      'End Date': startDate,
      'End Time': endTime,
      'All Day Event': isAllDay ? 'True' : 'False',
      'Description': buildReminderDescription(contact),
      'Location': '',
      'Private': 'False'
    };
  });

  // Génération du CSV avec encodage UTF-8 BOM
  const csvContent = Papa.unparse(calendarEvents);
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  // Téléchargement du fichier
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `google-calendar-export-${timestamp}.csv`;
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(link.href);
};
```

**Fonctions utilitaires :**
```typescript
const formatDateForGoogleCalendar = (dateStr: string): string => {
  // Convertir YYYY-MM-DD vers MM/DD/YYYY
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}/${year}`;
};

const formatTimeForGoogleCalendar = (timeStr: string): string => {
  // Convertir HH:mm vers HH:MM AM/PM
  const [hours, minutes] = timeStr.split(':');
  const hour24 = parseInt(hours, 10);
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes} ${ampm}`;
};

const calculateEndTime = (startTime: string): string => {
  // Ajouter 30 minutes à l'heure de début
  const [hours, minutes] = startTime.split(':');
  const startMinutes = parseInt(hours, 10) * 60 + parseInt(minutes, 10);
  const endMinutes = startMinutes + 30;
  const endHours = Math.floor(endMinutes / 60) % 24;
  const endMins = endMinutes % 60;
  
  const endTimeStr = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  return formatTimeForGoogleCalendar(endTimeStr);
};

const buildReminderDescription = (contact: Contact): string => {
  const details = [];
  
  if (contact.telephone) details.push(`Téléphone: ${contact.telephone}`);
  if (contact.email) details.push(`Email: ${contact.email}`);
  if (contact.statut) details.push(`Statut: ${contact.statut}`);
  if (contact.source) details.push(`Source: ${contact.source}`);
  if (contact.commentaire) details.push(`Commentaire: ${contact.commentaire}`);
  
  return details.join('\n');
};
```

## Data Models

### Format Google Calendar CSV

Le fichier CSV exporté respecte le format officiel Google Calendar :

| Champ | Description | Exemple |
|-------|-------------|---------|
| Subject | Titre de l'événement | "Rappel: Jean Dupont" |
| Start Date | Date de début (MM/DD/YYYY) | "01/15/2024" |
| Start Time | Heure de début (HH:MM AM/PM) | "2:30 PM" |
| End Date | Date de fin (MM/DD/YYYY) | "01/15/2024" |
| End Time | Heure de fin (HH:MM AM/PM) | "3:00 PM" |
| All Day Event | Événement toute la journée | "False" |
| Description | Description de l'événement | "Téléphone: 0123456789..." |
| Location | Lieu (optionnel) | "" |
| Private | Événement privé | "False" |

### Logique de Filtrage

```typescript
// Critères d'inclusion pour l'export
const isEligibleForCalendarExport = (contact: Contact): boolean => {
  return contact.dateRappel && contact.dateRappel.trim() !== '';
};
```

## Error Handling

### Gestion des Erreurs d'Export

```typescript
const handleGoogleCalendarExport = useCallback(() => {
  try {
    if (calendarRemindersCount === 0) {
      showNotification('warning', 'Aucun rappel à exporter');
      return;
    }
    
    exportGoogleCalendarCSV(contacts);
    showNotification('success', `${calendarRemindersCount} rappels exportés vers Google Agenda`);
  } catch (error) {
    console.error('Erreur lors de l\'export Google Calendar:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Aucun rappel à exporter')) {
        showNotification('warning', 'Aucun rappel à exporter');
      } else if (error.message.includes('CSV')) {
        showNotification('error', 'Erreur lors de la génération du fichier CSV');
      } else if (error.message.includes('téléchargement')) {
        showNotification('error', 'Erreur lors du téléchargement du fichier');
      } else {
        showNotification('error', `Erreur lors de l'export: ${error.message}`);
      }
    } else {
      showNotification('error', 'Erreur inconnue lors de l\'export');
    }
  }
}, [contacts, calendarRemindersCount, showNotification]);
```

### Validation des Données

- Vérification de la présence de `dateRappel`
- Validation du format de date (YYYY-MM-DD)
- Validation du format d'heure (HH:mm) si présent
- Gestion des cas où seule la date est définie (événement toute la journée)

## Testing Strategy

### Tests Unitaires

1. **Service d'Export**
   - Test de filtrage des contacts avec rappels
   - Test de formatage des dates et heures
   - Test de génération du contenu CSV
   - Test de gestion des erreurs

2. **Fonctions Utilitaires**
   - Test de conversion de format de date
   - Test de conversion de format d'heure
   - Test de calcul de l'heure de fin
   - Test de construction de la description

### Tests d'Intégration

1. **Interface Utilisateur**
   - Test d'activation/désactivation du bouton
   - Test de mise à jour du badge de comptage
   - Test de déclenchement de l'export
   - Test d'affichage des notifications

2. **Flux Complet**
   - Test d'export avec différents types de rappels
   - Test d'export avec contacts sans rappels
   - Test de téléchargement du fichier
   - Test de compatibilité avec Google Calendar

### Tests E2E

1. **Scénarios Utilisateur**
   - Export de rappels mixtes (avec/sans heure)
   - Import du fichier généré dans Google Calendar
   - Vérification de la cohérence des données importées