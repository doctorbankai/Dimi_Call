import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../App';
import { Contact, ContactStatus } from '../../types';
import * as dataService from '../../services/dataService';
import Papa from 'papaparse';

// Mock des services et dépendances
jest.mock('../../services/dataService');
jest.mock('papaparse');

// Mock des hooks
jest.mock('../../hooks/useAdb', () => ({
  useAdb: () => ({
    connectionState: { isConnected: false },
    isConnecting: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    getLogs: jest.fn(),
    setAutoDetection: jest.fn(),
    restartAdbServer: jest.fn(),
    makeCall: jest.fn(),
    endCall: jest.fn(),
    sendSms: jest.fn(),
    getCurrentCallState: jest.fn(),
    getLastCallNumber: jest.fn(),
    checkCallState: jest.fn(),
    onCallEnd: jest.fn(),
  }),
}));

jest.mock('../../hooks/useAutoUpdate', () => ({
  useAutoUpdate: () => ({
    updateState: { status: 'idle' },
    installUpdate: jest.fn(),
  }),
}));

jest.mock('../../lib/auth-client', () => ({
  useSupabaseAuth: () => ({
    isAuthenticated: true,
    user: { email: 'test@example.com' },
    signIn: jest.fn(),
    signOut: jest.fn(),
  }),
}));

// Mock DOM APIs
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
  writable: true
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
  writable: true
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
  writable: true
});

Object.defineProperty(URL, 'createObjectURL', {
  value: mockCreateObjectURL,
  writable: true
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL,
  writable: true
});

describe('Google Calendar Export E2E', () => {
  const mockContactsWithMixedReminders: Contact[] = [
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
      heureRappel: '14:30', // Avec heure
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
      heureRappel: '', // Sans heure (toute la journée)
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
    },
    {
      id: '4',
      numeroLigne: 4,
      prenom: 'Sophie',
      nom: 'Leroy',
      telephone: '',
      email: 'sophie.leroy@example.com',
      source: 'Salon',
      statut: ContactStatus.Premature,
      commentaire: 'À recontacter plus tard',
      dateRappel: '2024-01-20',
      heureRappel: '09:00', // Contact minimal avec rappel
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
    
    // Setup service mocks
    (dataService.loadCallStates as jest.Mock).mockReturnValue({});
    (dataService.saveContacts as jest.Mock).mockImplementation(() => {});
    (dataService.saveCallStates as jest.Mock).mockImplementation(() => {});
    (dataService.hasImportedTable as jest.Mock).mockReturnValue(false);
    
    // Mock Papa.unparse
    (Papa.unparse as jest.Mock).mockReturnValue('Subject,Start Date,Start Time\nTest Event,01/15/2024,2:30 PM');
  });

  test('should complete full export flow with mixed reminder types', async () => {
    (dataService.loadContacts as jest.Mock).mockReturnValue(mockContactsWithMixedReminders);

    // Mock the actual export function to use real implementation
    const realExportFunction = jest.requireActual('../../services/dataService').exportGoogleCalendarCSV;
    (dataService.exportGoogleCalendarCSV as jest.Mock).mockImplementation(realExportFunction);

    render(<App />);

    // Vérifier que le bouton est activé avec le bon compteur
    await waitFor(() => {
      const agendaButton = screen.getByRole('button', { name: /agenda/i });
      expect(agendaButton).not.toBeDisabled();
      expect(screen.getByText('3')).toBeInTheDocument(); // 3 contacts avec rappels
    });

    // Déclencher l'export
    const agendaButton = screen.getByRole('button', { name: /agenda/i });
    fireEvent.click(agendaButton);

    // Vérifier que Papa.unparse a été appelé avec les bonnes données
    await waitFor(() => {
      expect(Papa.unparse).toHaveBeenCalled();
    });

    const calledData = (Papa.unparse as jest.Mock).mock.calls[0][0];
    
    // Vérifier que seuls les contacts avec rappels sont inclus
    expect(calledData).toHaveLength(3);
    
    // Vérifier les données de Jean (avec heure)
    const jeanEvent = calledData.find((event: any) => event.Subject === 'Rappel: Jean Dupont');
    expect(jeanEvent).toBeDefined();
    expect(jeanEvent['Start Date']).toBe('01/15/2024');
    expect(jeanEvent['Start Time']).toBe('2:30 PM');
    expect(jeanEvent['End Time']).toBe('2:30 PM');
    expect(jeanEvent['All Day Event']).toBe('False');
    
    // Vérifier les données de Marie (toute la journée)
    const marieEvent = calledData.find((event: any) => event.Subject === 'Rappel: Marie Martin');
    expect(marieEvent).toBeDefined();
    expect(marieEvent['Start Date']).toBe('01/16/2024');
    expect(marieEvent['Start Time']).toBe('');
    expect(marieEvent['End Time']).toBe('');
    expect(marieEvent['All Day Event']).toBe('True');
    
    // Vérifier les données de Sophie (contact minimal)
    const sophieEvent = calledData.find((event: any) => event.Subject === 'Rappel: Sophie Leroy');
    expect(sophieEvent).toBeDefined();
    expect(sophieEvent['Start Date']).toBe('01/20/2024');
    expect(sophieEvent['Start Time']).toBe('9:00 AM');
  });

  test('should generate correct CSV format for Google Calendar import', async () => {
    (dataService.loadContacts as jest.Mock).mockReturnValue([mockContactsWithMixedReminders[0]]);

    // Use real export function
    const realExportFunction = jest.requireActual('../../services/dataService').exportGoogleCalendarCSV;
    (dataService.exportGoogleCalendarCSV as jest.Mock).mockImplementation(realExportFunction);

    render(<App />);

    const agendaButton = screen.getByRole('button', { name: /agenda/i });
    fireEvent.click(agendaButton);

    await waitFor(() => {
      expect(Papa.unparse).toHaveBeenCalled();
    });

    const calledData = (Papa.unparse as jest.Mock).mock.calls[0][0];
    const event = calledData[0];

    // Vérifier tous les champs requis pour Google Calendar
    expect(event).toHaveProperty('Subject');
    expect(event).toHaveProperty('Start Date');
    expect(event).toHaveProperty('Start Time');
    expect(event).toHaveProperty('End Date');
    expect(event).toHaveProperty('End Time');
    expect(event).toHaveProperty('All Day Event');
    expect(event).toHaveProperty('Description');
    expect(event).toHaveProperty('Location');
    expect(event).toHaveProperty('Private');

    // Vérifier les valeurs
    expect(event.Subject).toBe('Rappel: Jean Dupont');
    expect(event['Start Date']).toBe('01/15/2024');
    expect(event['Start Time']).toBe('2:30 PM');
    expect(event['End Date']).toBe('01/15/2024');
    expect(event['End Time']).toBe('2:30 PM');
    expect(event['All Day Event']).toBe('False');
    expect(event.Description).toContain('Téléphone: +33 6 12 34 56 78');
    expect(event.Location).toBe('');
    expect(event.Private).toBe('False');
  });

  test('should handle file download process correctly', async () => {
    (dataService.loadContacts as jest.Mock).mockReturnValue([mockContactsWithMixedReminders[0]]);

    // Mock Date pour un timestamp prévisible
    const mockDate = new Date('2024-01-15T10:30:45.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    jest.spyOn(mockDate, 'getFullYear').mockReturnValue(2024);
    jest.spyOn(mockDate, 'getMonth').mockReturnValue(0);
    jest.spyOn(mockDate, 'getDate').mockReturnValue(15);
    jest.spyOn(mockDate, 'getHours').mockReturnValue(10);
    jest.spyOn(mockDate, 'getMinutes').mockReturnValue(30);
    jest.spyOn(mockDate, 'getSeconds').mockReturnValue(45);

    // Use real export function
    const realExportFunction = jest.requireActual('../../services/dataService').exportGoogleCalendarCSV;
    (dataService.exportGoogleCalendarCSV as jest.Mock).mockImplementation(realExportFunction);

    render(<App />);

    const agendaButton = screen.getByRole('button', { name: /agenda/i });
    fireEvent.click(agendaButton);

    await waitFor(() => {
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
  });

  test('should handle empty contact list gracefully', async () => {
    (dataService.loadContacts as jest.Mock).mockReturnValue([]);

    render(<App />);

    await waitFor(() => {
      const agendaButton = screen.getByRole('button', { name: /agenda/i });
      expect(agendaButton).toBeDisabled();
      expect(agendaButton).toHaveAttribute('title', 'Aucun rappel à exporter - Seuls les contacts avec date de rappel sont exportés');
    });

    // Vérifier qu'aucun badge n'est affiché
    expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
  });

  test('should handle contacts without reminders', async () => {
    const contactsWithoutReminders = mockContactsWithMixedReminders.filter(c => !c.dateRappel);
    (dataService.loadContacts as jest.Mock).mockReturnValue(contactsWithoutReminders);

    render(<App />);

    await waitFor(() => {
      const agendaButton = screen.getByRole('button', { name: /agenda/i });
      expect(agendaButton).toBeDisabled();
    });

    // Cliquer sur le bouton désactivé ne devrait rien faire
    fireEvent.click(screen.getByRole('button', { name: /agenda/i }));
    expect(dataService.exportGoogleCalendarCSV).not.toHaveBeenCalled();
  });

  test('should handle export errors and show appropriate notifications', async () => {
    (dataService.loadContacts as jest.Mock).mockReturnValue([mockContactsWithMixedReminders[0]]);
    (dataService.exportGoogleCalendarCSV as jest.Mock).mockImplementation(() => {
      throw new Error('Export failed');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    const agendaButton = screen.getByRole('button', { name: /agenda/i });
    fireEvent.click(agendaButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Erreur lors de l\'export Google Calendar:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  test('should update UI when contacts are modified', async () => {
    const { rerender } = render(<App />);

    // Initialement sans rappels
    (dataService.loadContacts as jest.Mock).mockReturnValue([mockContactsWithMixedReminders[2]]);
    rerender(<App />);

    await waitFor(() => {
      const agendaButton = screen.getByRole('button', { name: /agenda/i });
      expect(agendaButton).toBeDisabled();
    });

    // Ajouter des contacts avec rappels
    (dataService.loadContacts as jest.Mock).mockReturnValue(mockContactsWithMixedReminders);
    rerender(<App />);

    await waitFor(() => {
      const agendaButton = screen.getByRole('button', { name: /agenda/i });
      expect(agendaButton).not.toBeDisabled();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  test('should build correct event descriptions with all contact information', async () => {
    (dataService.loadContacts as jest.Mock).mockReturnValue([mockContactsWithMixedReminders[0]]);

    // Use real export function
    const realExportFunction = jest.requireActual('../../services/dataService').exportGoogleCalendarCSV;
    (dataService.exportGoogleCalendarCSV as jest.Mock).mockImplementation(realExportFunction);

    render(<App />);

    const agendaButton = screen.getByRole('button', { name: /agenda/i });
    fireEvent.click(agendaButton);

    await waitFor(() => {
      expect(Papa.unparse).toHaveBeenCalled();
    });

    const calledData = (Papa.unparse as jest.Mock).mock.calls[0][0];
    const event = calledData[0];

    expect(event.Description).toContain('Téléphone: +33 6 12 34 56 78');
    expect(event.Description).toContain('Email: jean.dupont@example.com');
    expect(event.Description).toContain('Statut: À rappeler');
    expect(event.Description).toContain('Source: LinkedIn');
    expect(event.Description).toContain('Commentaire: Contact intéressant');
  });
});