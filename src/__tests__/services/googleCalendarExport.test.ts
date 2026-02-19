import { exportGoogleCalendarICS } from '../../services/dataService';
import { Contact, ContactStatus } from '../../types';

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

describe('exportGoogleCalendarICS', () => {
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
      statut: ContactStatus.D0,
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
      statut: ContactStatus.R0,
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
  });

  test('should export contacts with reminders successfully in ICS format', () => {
    let blobContent = '';
    global.Blob = jest.fn((content) => {
      blobContent = content[0];
      return {};
    }) as any;

    exportGoogleCalendarICS(mockContacts);

    expect(blobContent).toContain('BEGIN:VCALENDAR');
    expect(blobContent).toContain('VERSION:2.0');
    expect(blobContent).toContain('BEGIN:VEVENT');
    expect(blobContent).toContain('SUMMARY:Rappel: Jean Dupont');
    expect(blobContent).toContain('SUMMARY:Rappel: Marie Martin');
    expect(blobContent).toContain('TRANSP:TRANSPARENT'); // Validates "Free" status
    // Check local time format for Jean
    expect(blobContent).toContain('DTSTART:20240115T143000');
    // Check all-day format for Marie
    expect(blobContent).toContain('DTSTART;VALUE=DATE:20240116');
    expect(blobContent).toContain('DTEND;VALUE=DATE:20240117');
    expect(blobContent).not.toContain('SUMMARY:Rappel: Pierre Durand');
  });

  test('should create and download file with correct filename format', () => {
    global.Blob = jest.fn() as any;
    const mockDate = new Date('2024-01-15T10:30:45.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    exportGoogleCalendarICS(mockContacts);

    expect(mockCreateElement).toHaveBeenCalledWith('a');

    const mockLink = mockCreateElement.mock.results[0].value;
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'blob:mock-url');
    // Extension should be .ics
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'google-calendar-export-2024-01-15-10-30-45.ics');
  });

  test('should throw error when no contacts have reminders', () => {
    const contactsWithoutReminders = mockContacts.filter(c => !c.dateRappel);

    expect(() => {
      exportGoogleCalendarICS(contactsWithoutReminders);
    }).toThrow('Aucun rappel à exporter');
  });
});