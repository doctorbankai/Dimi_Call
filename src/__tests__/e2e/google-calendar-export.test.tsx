import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../App';
import { Contact, ContactStatus } from '../../types';
import * as dataService from '../../services/dataService';

// Mock des services et dépendances
jest.mock('../../services/dataService');

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
    (dataService.saveContacts as jest.Mock).mockImplementation(() => { });
    (dataService.saveCallStates as jest.Mock).mockImplementation(() => { });
    (dataService.hasImportedTable as jest.Mock).mockReturnValue(false);
  });

  test('should complete full export flow with mixed reminder types', async () => {
    (dataService.loadContacts as jest.Mock).mockReturnValue(mockContactsWithMixedReminders);

    let blobContent = '';
    global.Blob = jest.fn((content) => {
      blobContent = content[0];
      return {};
    }) as any;

    const realExportFunction = jest.requireActual('../../services/dataService').exportGoogleCalendarICS;
    (dataService.exportGoogleCalendarICS as jest.Mock).mockImplementation(realExportFunction);

    render(<App />);

    await waitFor(() => {
      const agendaButton = screen.getByRole('button', { name: /agenda/i });
      expect(agendaButton).not.toBeDisabled();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    const agendaButton = screen.getByRole('button', { name: /agenda/i });
    fireEvent.click(agendaButton);

    await waitFor(() => {
      expect(blobContent).toContain('BEGIN:VEVENT');
      expect(blobContent).toContain('SUMMARY:Rappel: Jean Dupont');
      expect(blobContent).toContain('DTSTART:20240115T143000');
      expect(blobContent).toContain('SUMMARY:Rappel: Marie Martin');
      expect(blobContent).toContain('DTSTART;VALUE=DATE:20240116');
      expect(blobContent).toContain('SUMMARY:Rappel: Sophie Leroy');
    });
  });

  test('should generate correct ICS format for Google Calendar import', async () => {
    (dataService.loadContacts as jest.Mock).mockReturnValue([mockContactsWithMixedReminders[0]]);

    let blobContent = '';
    global.Blob = jest.fn((content) => {
      blobContent = content[0];
      return {};
    }) as any;

    const realExportFunction = jest.requireActual('../../services/dataService').exportGoogleCalendarICS;
    (dataService.exportGoogleCalendarICS as jest.Mock).mockImplementation(realExportFunction);

    render(<App />);

    const agendaButton = screen.getByRole('button', { name: /agenda/i });
    fireEvent.click(agendaButton);

    await waitFor(() => {
      expect(blobContent).toContain('BEGIN:VCALENDAR');
      expect(blobContent).toContain('VERSION:2.0');
      expect(blobContent).toContain('SUMMARY:Rappel: Jean Dupont');
      expect(blobContent).toContain('DTSTART:20240115T143000');
      expect(blobContent).toContain('TRANSP:TRANSPARENT');
    });
  });

  test('should handle file download process correctly', async () => {
    (dataService.loadContacts as jest.Mock).mockReturnValue([mockContactsWithMixedReminders[0]]);

    global.Blob = jest.fn() as any;

    // Mock Date pour un timestamp prévisible
    const mockDate = new Date('2024-01-15T10:30:45.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    const realExportFunction = jest.requireActual('../../services/dataService').exportGoogleCalendarICS;
    (dataService.exportGoogleCalendarICS as jest.Mock).mockImplementation(realExportFunction);

    render(<App />);

    const agendaButton = screen.getByRole('button', { name: /agenda/i });
    fireEvent.click(agendaButton);

    await waitFor(() => {
      expect(mockCreateElement).toHaveBeenCalledWith('a');

      const mockLink = mockCreateElement.mock.results[0].value;
      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'blob:mock-url');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'google-calendar-export-2024-01-15-10-30-45.ics');

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

    fireEvent.click(screen.getByRole('button', { name: /agenda/i }));
    expect(dataService.exportGoogleCalendarICS).not.toHaveBeenCalled();
  });

  test('should update UI when contacts are modified', async () => {
    const { rerender } = render(<App />);

    (dataService.loadContacts as jest.Mock).mockReturnValue([mockContactsWithMixedReminders[2]]);
    rerender(<App />);

    await waitFor(() => {
      const agendaButton = screen.getByRole('button', { name: /agenda/i });
      expect(agendaButton).toBeDisabled();
    });

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

    let blobContent = '';
    global.Blob = jest.fn((content) => {
      blobContent = content[0];
      return {};
    }) as any;

    const realExportFunction = jest.requireActual('../../services/dataService').exportGoogleCalendarICS;
    (dataService.exportGoogleCalendarICS as jest.Mock).mockImplementation(realExportFunction);

    render(<App />);

    const agendaButton = screen.getByRole('button', { name: /agenda/i });
    fireEvent.click(agendaButton);

    await waitFor(() => {
      expect(blobContent).toContain('DESCRIPTION:Téléphone: +33 6 12 34 56 78');
      expect(blobContent).toContain('Email: jean.dupont@example.com');
      expect(blobContent).toContain('Statut: À rappeler');
    });
  });
});