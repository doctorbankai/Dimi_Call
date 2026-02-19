import { exportGoogleCalendarICS } from '../../services/dataService';
import { Contact, ContactStatus } from '../../types';

// Mock DOM APIs
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'blob:mock-url'),
    revokeObjectURL: jest.fn()
  }
});

describe('Reminder Google Calendar Export with Optional Time', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const contactWithTime: Contact = {
    id: '1',
    numeroLigne: 1,
    prenom: 'Jean',
    nom: 'Dupont',
    telephone: '0123456789',
    email: 'jean@example.com',
    source: 'Test',
    statut: ContactStatus.ARappeler,
    commentaire: 'Contact avec heure',
    dateRappel: '2024-01-20',
    heureRappel: '14:30', // Avec heure
    dateRDV: '',
    heureRDV: '',
    dateAppel: '',
    heureAppel: '',
    dureeAppel: ''
  };

  const contactWithoutTime: Contact = {
    id: '2',
    numeroLigne: 2,
    prenom: 'Marie',
    nom: 'Martin',
    telephone: '0987654321',
    email: 'marie@example.com',
    source: 'Test',
    statut: ContactStatus.ARappeler,
    commentaire: 'Contact sans heure',
    dateRappel: '2024-01-25',
    heureRappel: '', // Sans heure
    dateRDV: '',
    heureRDV: '',
    dateAppel: '',
    heureAppel: '',
    dureeAppel: ''
  };

  it('should export reminder with time as timed event in ICS', () => {
    let blobContent = '';
    global.Blob = jest.fn((content) => {
      blobContent = content[0];
      return {};
    }) as any;

    exportGoogleCalendarICS([contactWithTime]);

    expect(blobContent).toContain('BEGIN:VEVENT');
    expect(blobContent).toContain('SUMMARY:Rappel: Jean Dupont');
    expect(blobContent).toContain('DTSTART:20240120T143000');
    expect(blobContent).toContain('DTEND:20240120T143000');
    expect(blobContent).not.toContain('VALUE=DATE');
  });

  it('should export reminder without time as all-day event in ICS', () => {
    let blobContent = '';
    global.Blob = jest.fn((content) => {
      blobContent = content[0];
      return {};
    }) as any;

    exportGoogleCalendarICS([contactWithoutTime]);

    expect(blobContent).toContain('BEGIN:VEVENT');
    expect(blobContent).toContain('SUMMARY:Rappel: Marie Martin');
    expect(blobContent).toContain('DTSTART;VALUE=DATE:20240125');
    expect(blobContent).toContain('DTEND;VALUE=DATE:20240126');
  });

  it('should export mixed reminders (with and without time) correctly', () => {
    let blobContent = '';
    global.Blob = jest.fn((content) => {
      blobContent = content[0];
      return {};
    }) as any;

    exportGoogleCalendarICS([contactWithTime, contactWithoutTime]);

    expect(blobContent).toContain('SUMMARY:Rappel: Jean Dupont');
    expect(blobContent).toContain('DTSTART:20240120T143000');
    expect(blobContent).toContain('SUMMARY:Rappel: Marie Martin');
    expect(blobContent).toContain('DTSTART;VALUE=DATE:20240125');
  });

  it('should handle contact with whitespace-only time as all-day event', () => {
    const contactWithWhitespaceTime: Contact = {
      ...contactWithoutTime,
      heureRappel: '   ' // Espaces seulement
    };

    let blobContent = '';
    global.Blob = jest.fn((content) => {
      blobContent = content[0];
      return {};
    }) as any;

    exportGoogleCalendarICS([contactWithWhitespaceTime]);

    expect(blobContent).toContain('DTSTART;VALUE=DATE:20240125');
  });

  it('should still require date for export', () => {
    const contactWithoutDate: Contact = {
      ...contactWithTime,
      dateRappel: '' // Pas de date
    };

    expect(() => {
      exportGoogleCalendarICS([contactWithoutDate]);
    }).toThrow('Aucun rappel à exporter');
  });

  it('should create proper event descriptions for all-day events', () => {
    let blobContent = '';
    global.Blob = jest.fn((content) => {
      blobContent = content[0];
      return {};
    }) as any;

    exportGoogleCalendarICS([contactWithoutTime]);

    expect(blobContent).toContain('DESCRIPTION:Téléphone: 0987654321\\nEmail: marie@example.com\\nStatut: À rappeler\\nSource: Test\\nCommentaire: Contact sans heure');
  });
});