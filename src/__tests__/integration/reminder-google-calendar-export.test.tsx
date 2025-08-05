import { exportGoogleCalendarCSV } from '../../services/dataService';
import { Contact, ContactStatus } from '../../types';
import Papa from 'papaparse';

// Mock Papa.unparse
jest.mock('papaparse', () => ({
  unparse: jest.fn()
}));

// Mock DOM APIs
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'blob:mock-url'),
    revokeObjectURL: jest.fn()
  }
});

Object.defineProperty(global, 'Blob', {
  value: jest.fn(() => ({}))
});

Object.defineProperty(global, 'document', {
  value: {
    createElement: jest.fn(() => ({
      setAttribute: jest.fn(),
      click: jest.fn(),
      style: {}
    })),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn()
    }
  }
});

describe('Reminder Google Calendar Export with Optional Time', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Papa.unparse as jest.Mock).mockReturnValue('mock-csv-content');
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

  it('should export reminder with time as timed event', () => {
    exportGoogleCalendarCSV([contactWithTime]);

    const calledData = (Papa.unparse as jest.Mock).mock.calls[0][0];
    expect(calledData).toHaveLength(1);
    
    const event = calledData[0];
    expect(event).toEqual({
      'Subject': 'Rappel: Jean Dupont',
      'Start Date': '01/20/2024',
      'Start Time': '2:30 PM',
      'End Date': '01/20/2024',
      'End Time': '3:00 PM', // 30 minutes plus tard
      'All Day Event': 'False', // Événement avec heure
      'Description': expect.stringContaining('Jean Dupont'),
      'Location': '',
      'Private': 'False'
    });
  });

  it('should export reminder without time as all-day event', () => {
    exportGoogleCalendarCSV([contactWithoutTime]);

    const calledData = (Papa.unparse as jest.Mock).mock.calls[0][0];
    expect(calledData).toHaveLength(1);
    
    const event = calledData[0];
    expect(event).toEqual({
      'Subject': 'Rappel: Marie Martin',
      'Start Date': '01/25/2024',
      'Start Time': '', // Pas d'heure de début
      'End Date': '01/25/2024',
      'End Time': '', // Pas d'heure de fin
      'All Day Event': 'True', // Événement toute la journée
      'Description': expect.stringContaining('Marie Martin'),
      'Location': '',
      'Private': 'False'
    });
  });

  it('should export mixed reminders (with and without time) correctly', () => {
    exportGoogleCalendarCSV([contactWithTime, contactWithoutTime]);

    const calledData = (Papa.unparse as jest.Mock).mock.calls[0][0];
    expect(calledData).toHaveLength(2);
    
    // Premier événement avec heure
    const timedEvent = calledData[0];
    expect(timedEvent['All Day Event']).toBe('False');
    expect(timedEvent['Start Time']).toBe('2:30 PM');
    expect(timedEvent['End Time']).toBe('3:00 PM');
    
    // Deuxième événement sans heure (toute la journée)
    const allDayEvent = calledData[1];
    expect(allDayEvent['All Day Event']).toBe('True');
    expect(allDayEvent['Start Time']).toBe('');
    expect(allDayEvent['End Time']).toBe('');
  });

  it('should handle contact with whitespace-only time as all-day event', () => {
    const contactWithWhitespaceTime: Contact = {
      ...contactWithoutTime,
      heureRappel: '   ' // Espaces seulement
    };

    exportGoogleCalendarCSV([contactWithWhitespaceTime]);

    const calledData = (Papa.unparse as jest.Mock).mock.calls[0][0];
    const event = calledData[0];
    
    expect(event['All Day Event']).toBe('True');
    expect(event['Start Time']).toBe('');
    expect(event['End Time']).toBe('');
  });

  it('should still require date for export', () => {
    const contactWithoutDate: Contact = {
      ...contactWithTime,
      dateRappel: '' // Pas de date
    };

    expect(() => {
      exportGoogleCalendarCSV([contactWithoutDate]);
    }).toThrow('Aucun rappel à exporter');
  });

  it('should create proper event descriptions for all-day events', () => {
    exportGoogleCalendarCSV([contactWithoutTime]);

    const calledData = (Papa.unparse as jest.Mock).mock.calls[0][0];
    const event = calledData[0];
    
    expect(event['Description']).toContain('Marie Martin');
    expect(event['Description']).toContain('Contact sans heure');
    expect(event['Description']).toContain('0987654321');
    expect(event['Description']).toContain('marie@example.com');
  });

  it('should generate correct filename for export', () => {
    // Mock Date pour un timestamp prévisible
    const mockDate = new Date('2024-01-15T10:30:45.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    jest.spyOn(mockDate, 'getFullYear').mockReturnValue(2024);
    jest.spyOn(mockDate, 'getMonth').mockReturnValue(0); // Janvier = 0
    jest.spyOn(mockDate, 'getDate').mockReturnValue(15);
    jest.spyOn(mockDate, 'getHours').mockReturnValue(10);
    jest.spyOn(mockDate, 'getMinutes').mockReturnValue(30);
    jest.spyOn(mockDate, 'getSeconds').mockReturnValue(45);

    const mockCreateElement = jest.spyOn(document, 'createElement');
    
    exportGoogleCalendarCSV([contactWithoutTime]);

    const mockLink = mockCreateElement.mock.results[0].value;
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'google-calendar-export-2024-01-15-10-30-45.csv');
  });
});