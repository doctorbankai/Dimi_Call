import { 
  formatDateForGoogleCalendar, 
  formatTimeForGoogleCalendar, 
  calculateEndTime, 
  buildReminderDescription 
} from '../../services/dataService';
import { Contact, ContactStatus } from '../../types';

describe('Google Calendar Utilities', () => {
  describe('formatDateForGoogleCalendar', () => {
    test('should convert YYYY-MM-DD to MM/DD/YYYY', () => {
      expect(formatDateForGoogleCalendar('2024-01-15')).toBe('01/15/2024');
      expect(formatDateForGoogleCalendar('2024-12-31')).toBe('12/31/2024');
      expect(formatDateForGoogleCalendar('2023-07-04')).toBe('07/04/2023');
    });

    test('should handle single digit months and days', () => {
      expect(formatDateForGoogleCalendar('2024-01-05')).toBe('01/05/2024');
      expect(formatDateForGoogleCalendar('2024-09-01')).toBe('09/01/2024');
    });

    test('should throw error for invalid date format', () => {
      expect(() => formatDateForGoogleCalendar('')).toThrow('Date invalide pour le formatage Google Calendar');
      expect(() => formatDateForGoogleCalendar('2024-01')).toThrow('Format de date invalide');
      expect(() => formatDateForGoogleCalendar('invalid-date')).toThrow('Format de date invalide');
    });
  });

  describe('formatTimeForGoogleCalendar', () => {
    test('should convert 24h format to 12h AM/PM format', () => {
      expect(formatTimeForGoogleCalendar('09:30')).toBe('9:30 AM');
      expect(formatTimeForGoogleCalendar('14:45')).toBe('2:45 PM');
      expect(formatTimeForGoogleCalendar('00:00')).toBe('12:00 AM');
      expect(formatTimeForGoogleCalendar('12:00')).toBe('12:00 PM');
      expect(formatTimeForGoogleCalendar('23:59')).toBe('11:59 PM');
    });

    test('should handle edge cases', () => {
      expect(formatTimeForGoogleCalendar('01:05')).toBe('1:05 AM');
      expect(formatTimeForGoogleCalendar('13:00')).toBe('1:00 PM');
    });

    test('should return empty string for empty input', () => {
      expect(formatTimeForGoogleCalendar('')).toBe('');
      expect(formatTimeForGoogleCalendar('   ')).toBe('');
    });

    test('should throw error for invalid time format', () => {
      expect(() => formatTimeForGoogleCalendar('25:00')).toThrow('Heure invalide');
      expect(() => formatTimeForGoogleCalendar('12:60')).toThrow('Heure invalide');
      expect(() => formatTimeForGoogleCalendar('invalid')).toThrow('Format d\'heure invalide');
    });
  });

  describe('calculateEndTime', () => {
    test('should add 30 minutes to start time', () => {
      expect(calculateEndTime('09:30')).toBe('10:00 AM');
      expect(calculateEndTime('14:45')).toBe('3:15 PM');
      expect(calculateEndTime('23:45')).toBe('12:15 AM'); // Next day
    });

    test('should handle midnight and noon correctly', () => {
      expect(calculateEndTime('23:30')).toBe('12:00 AM');
      expect(calculateEndTime('11:30')).toBe('12:00 PM');
    });

    test('should return empty string for empty input', () => {
      expect(calculateEndTime('')).toBe('');
      expect(calculateEndTime('   ')).toBe('');
    });

    test('should throw error for invalid time format', () => {
      expect(() => calculateEndTime('invalid')).toThrow('Format d\'heure invalide');
    });
  });

  describe('buildReminderDescription', () => {
    const mockContact: Contact = {
      id: '1',
      numeroLigne: 1,
      prenom: 'Jean',
      nom: 'Dupont',
      telephone: '+33 6 12 34 56 78',
      email: 'jean.dupont@example.com',
      source: 'LinkedIn',
      statut: ContactStatus.ARappeler,
      commentaire: 'Contact intéressant',
      dateRappel: '2024-01-15',
      heureRappel: '14:30',
      dateRDV: '',
      heureRDV: '',
      dateAppel: '',
      heureAppel: '',
      dureeAppel: ''
    };

    test('should build complete description with all fields', () => {
      const description = buildReminderDescription(mockContact);
      
      expect(description).toContain('Téléphone: +33 6 12 34 56 78');
      expect(description).toContain('Email: jean.dupont@example.com');
      expect(description).toContain('Statut: À rappeler');
      expect(description).toContain('Source: LinkedIn');
      expect(description).toContain('Commentaire: Contact intéressant');
    });

    test('should handle missing optional fields', () => {
      const contactWithMissingFields: Contact = {
        ...mockContact,
        telephone: '',
        email: '',
        commentaire: ''
      };

      const description = buildReminderDescription(contactWithMissingFields);
      
      expect(description).not.toContain('Téléphone:');
      expect(description).not.toContain('Email:');
      expect(description).not.toContain('Commentaire:');
      expect(description).toContain('Statut: À rappeler');
      expect(description).toContain('Source: LinkedIn');
    });

    test('should return empty string when no fields are present', () => {
      const emptyContact: Contact = {
        ...mockContact,
        telephone: '',
        email: '',
        statut: '' as any,
        source: '',
        commentaire: ''
      };

      const description = buildReminderDescription(emptyContact);
      expect(description).toBe('');
    });
  });
});