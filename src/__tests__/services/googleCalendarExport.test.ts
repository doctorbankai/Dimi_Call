import { exportGoogleCalendarCSV } from '../../services/dataService';
import { Contact, ContactStatus } from '../../types';
import Papa from 'papaparse';

// Mock Papa.unparse
jest.mock('papaparse', () => ({
  unparse: jest.fn()
}));

// Mock DOM methods
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild
});

Object.defineProperty(URL, 'createObjectURL', {
  value: mockCreateObjectURL
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL
});

describe('exportGoogleCalendarCSV', () => {
  const mockContacts: Contact[] = [
    {
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
    },
    {
      id: '2',
      numeroLigne: 2,
      prenom: 'Marie',
      nom: 'Martin',
      telephone: '+33 6 98 76 54 32',
      email: 'marie.martin@example.com',
      source: 'École Commerce',
      statut: ContactStatus.DO,
      commentaire: 'Très intéressée',
      dateRappel: '2024-01-16',
      heureRappel: '', // Événement toute la journée
      dateRDV: '',
      heureRDV: '',
      dateAppel: '',
      heureAppel: '',
      dureeAppel: ''
    },
    {
      id: '3',
      numeroLigne: 3,
      prenom: 'Pierre',
      nom: 'Durand',
      telephone: '+33 6 11 22 33 44',
      email: 'pierre.durand@example.com',
      source: 'Référence',
      statut: ContactStatus.RO,
      commentaire: '',
      dateRappel: '', // Pas de rappel
      heureRappel: '',
      dateRDV: '',
      heureRDV: '',
      dateAppel: '',
      heureAppel: '',
      dureeAppel: ''
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup DOM mocks
    const mockLink = {
      setAttribute: jest.fn(),
      click: mockClick,
      style: { visibility: '' }
    };
    
    mockCreateElement.mockReturnValue(mockLink);
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
    (Papa.unparse as jest.Mock).mockReturnValue('mocked,csv,content');
  });

  test('should export contacts with reminders successfully', () => {
    exportGoogleCalendarCSV(mockContacts);

    // Vérifier que Papa.unparse a été appelé
    expect(Papa.unparse).toHaveBeenCalled();
    
    const calledData = (Papa.unparse as jest.Mock).mock.calls[0][0];
    
    // Vérifier que seuls les contacts avec rappels sont inclus
    expect(calledData).toHaveLength(2); // Jean et Marie seulement
    
    // Vérifier le format des données pour Jean (avec heure)
    const jeanEvent = calledData.find((event: any) => event.Subject === 'Rappel: Jean Dupont');
    expect(jeanEvent).toBeDefined();
    expect(jeanEvent['Start Date']).toBe('01/15/2024');
    expect(jeanEvent['Start Time']).toBe('2:30 PM');
    expect(jeanEvent['End Time']).toBe('2:30 PM');
    expect(jeanEvent['All Day Event']).toBe('False');
    expect(jeanEvent.Description).toContain('Téléphone: +33 6 12 34 56 78');
    
    // Vérifier le format des données pour Marie (toute la journée)
    const marieEvent = calledData.find((event: any) => event.Subject === 'Rappel: Marie Martin');
    expect(marieEvent).toBeDefined();
    expect(marieEvent['Start Date']).toBe('01/16/2024');
    expect(marieEvent['Start Time']).toBe('');
    expect(marieEvent['End Time']).toBe('');
    expect(marieEvent['All Day Event']).toBe('True');
  });

  test('should create and download file with correct filename format', () => {
    // Mock Date pour avoir un timestamp prévisible
    const mockDate = new Date('2024-01-15T10:30:45.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    jest.spyOn(mockDate, 'getFullYear').mockReturnValue(2024);
    jest.spyOn(mockDate, 'getMonth').mockReturnValue(0); // Janvier = 0
    jest.spyOn(mockDate, 'getDate').mockReturnValue(15);
    jest.spyOn(mockDate, 'getHours').mockReturnValue(10);
    jest.spyOn(mockDate, 'getMinutes').mockReturnValue(30);
    jest.spyOn(mockDate, 'getSeconds').mockReturnValue(45);

    exportGoogleCalendarCSV(mockContacts);

    // Vérifier la création du lien de téléchargement
    expect(mockCreateElement).toHaveBeenCalledWith('a');
    
    const mockLink = mockCreateElement.mock.results[0].value;
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'blob:mock-url');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'google-calendar-export-2024-01-15-10-30-45.csv');
    
    // Vérifier le processus de téléchargement
    expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  test('should include UTF-8 BOM in CSV content', () => {
    exportGoogleCalendarCSV(mockContacts);

    // Vérifier que le Blob est créé avec le BOM UTF-8
    const blobConstructorCall = jest.mocked(global.Blob).mock.calls[0];
    expect(blobConstructorCall[0][0]).toMatch(/^\uFEFF/); // Commence par le BOM
    expect(blobConstructorCall[1]).toEqual({ type: 'text/csv;charset=utf-8;' });
  });

  test('should throw error when no contacts have reminders', () => {
    const contactsWithoutReminders = mockContacts.filter(c => !c.dateRappel);
    
    expect(() => {
      exportGoogleCalendarCSV(contactsWithoutReminders);
    }).toThrow('Aucun rappel à exporter');
  });

  test('should throw error for empty contact list', () => {
    expect(() => {
      exportGoogleCalendarCSV([]);
    }).toThrow('Aucun rappel à exporter');
  });

  test('should handle contacts with invalid date format', () => {
    const contactsWithInvalidDate = [{
      ...mockContacts[0],
      dateRappel: 'invalid-date'
    }];

    expect(() => {
      exportGoogleCalendarCSV(contactsWithInvalidDate);
    }).toThrow(/Erreur de formatage pour le contact Jean Dupont/);
  });

  test('should handle contacts with invalid time format', () => {
    const contactsWithInvalidTime = [{
      ...mockContacts[0],
      heureRappel: '25:70' // Heure invalide
    }];

    expect(() => {
      exportGoogleCalendarCSV(contactsWithInvalidTime);
    }).toThrow(/Erreur de formatage pour le contact Jean Dupont/);
  });

  test('should build correct event descriptions', () => {
    exportGoogleCalendarCSV(mockContacts);

    const calledData = (Papa.unparse as jest.Mock).mock.calls[0][0];
    const jeanEvent = calledData.find((event: any) => event.Subject === 'Rappel: Jean Dupont');
    
    expect(jeanEvent.Description).toContain('Téléphone: +33 6 12 34 56 78');
    expect(jeanEvent.Description).toContain('Email: jean.dupont@example.com');
    expect(jeanEvent.Description).toContain('Statut: À rappeler');
    expect(jeanEvent.Description).toContain('Source: LinkedIn');
    expect(jeanEvent.Description).toContain('Commentaire: Contact intéressant');
  });

  test('should handle contacts with minimal information', () => {
    const minimalContact: Contact = {
      id: '4',
      numeroLigne: 4,
      prenom: 'Test',
      nom: 'User',
      telephone: '',
      email: '',
      source: '',
      statut: ContactStatus.NonDefini,
      commentaire: '',
      dateRappel: '2024-01-17',
      heureRappel: '09:00',
      dateRDV: '',
      heureRDV: '',
      dateAppel: '',
      heureAppel: '',
      dureeAppel: ''
    };

    exportGoogleCalendarCSV([minimalContact]);

    const calledData = (Papa.unparse as jest.Mock).mock.calls[0][0];
    expect(calledData).toHaveLength(1);
    
    const event = calledData[0];
    expect(event.Subject).toBe('Rappel: Test User');
    expect(event['Start Date']).toBe('01/17/2024');
    expect(event['Start Time']).toBe('9:00 AM');
    expect(event.Description).toBe('Statut: Non défini'); // Seul le statut devrait être présent
  });
});