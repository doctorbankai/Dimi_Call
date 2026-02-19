import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../App';
import { Contact, ContactStatus } from '../../types';
import * as dataService from '../../services/dataService';

// Mock des services
jest.mock('../../services/dataService', () => ({
  ...jest.requireActual('../../services/dataService'),
  loadContacts: jest.fn(),
  saveContacts: jest.fn(),
  loadCallStates: jest.fn(),
  saveCallStates: jest.fn(),
  exportGoogleCalendarICS: jest.fn(),
  hasImportedTable: jest.fn(() => false),
}));

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

describe('Google Calendar Export UI Integration', () => {
  const mockContactsWithReminders: Contact[] = [
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
      heureRappel: '',
      dateRDV: '',
      heureRDV: '',
      dateAppel: '',
      heureAppel: '',
      dureeAppel: ''
    }
  ];

  const mockContactsWithoutReminders: Contact[] = [
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
      dateRappel: '',
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
    (dataService.loadCallStates as jest.Mock).mockReturnValue({});
    (dataService.saveContacts as jest.Mock).mockImplementation(() => {});
    (dataService.saveCallStates as jest.Mock).mockImplementation(() => {});
  });

  test('should display Agenda button when contacts have reminders', async () => {
    (dataService.loadContacts as jest.Mock).mockReturnValue(mockContactsWithReminders);

    render(<App />);

    await waitFor(() => {
      const agendaButton = screen.getByRole('button', { name: /agenda/i });
      expect(agendaButton).toBeInTheDocument();
      expect(agendaButton).not.toBeDisabled();
    });
  });

  test('should show correct badge count for reminders', async () => {
    (dataService.loadContacts as jest.Mock).mockReturnValue(mockContactsWithReminders);

    render(<App />);

    await waitFor(() => {
      const badge = screen.getByText('2'); // 2 contacts avec rappels
      expect(badge).toBeInTheDocument();
    });
  });

  test('should disable Agenda button when no reminders are available', async () => {
    (dataService.loadContacts as jest.Mock).mockReturnValue(mockContactsWithoutReminders);

    render(<App />);

    await waitFor(() => {
      const agendaButton = screen.getByRole('button', { name: /agenda/i });
      expect(agendaButton).toBeInTheDocument();
      expect(agendaButton).toBeDisabled();
    });
  });

  test('should show correct tooltip when reminders are available', async () => {
    (dataService.loadContacts as jest.Mock).mockReturnValue(mockContactsWithReminders);

    render(<App />);

    await waitFor(() => {
      const agendaButton = screen.getByRole('button', { name: /agenda/i });
      expect(agendaButton).toHaveAttribute('title', 'Exporter 2 rappels vers Google Agenda');
    });
  });

  test('should show correct tooltip when no reminders are available', async () => {
    (dataService.loadContacts as jest.Mock).mockReturnValue(mockContactsWithoutReminders);

    render(<App />);

    await waitFor(() => {
      const agendaButton = screen.getByRole('button', { name: /agenda/i });
      expect(agendaButton).toHaveAttribute('title', 'Aucun rappel à exporter - Seuls les contacts avec date de rappel sont exportés');
    });
  });

  test('should trigger export when Agenda button is clicked', async () => {
    (dataService.loadContacts as jest.Mock).mockReturnValue(mockContactsWithReminders);
    (dataService.exportGoogleCalendarICS as jest.Mock).mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      const agendaButton = screen.getByRole('button', { name: /agenda/i });
      fireEvent.click(agendaButton);
    });

    expect(dataService.exportGoogleCalendarICS).toHaveBeenCalledWith(mockContactsWithReminders);
  });

  test('should not trigger export when Agenda button is disabled', async () => {
    (dataService.loadContacts as jest.Mock).mockReturnValue(mockContactsWithoutReminders);

    render(<App />);

    await waitFor(() => {
      const agendaButton = screen.getByRole('button', { name: /agenda/i });
      fireEvent.click(agendaButton);
    });

    expect(dataService.exportGoogleCalendarICS).not.toHaveBeenCalled();
  });

  test('should update badge count when contacts change', async () => {
    const { rerender } = render(<App />);
    
    // Initialement sans rappels
    (dataService.loadContacts as jest.Mock).mockReturnValue(mockContactsWithoutReminders);
    rerender(<App />);

    await waitFor(() => {
      const agendaButton = screen.getByRole('button', { name: /agenda/i });
      expect(agendaButton).toBeDisabled();
    });

    // Puis avec rappels
    (dataService.loadContacts as jest.Mock).mockReturnValue(mockContactsWithReminders);
    rerender(<App />);

    await waitFor(() => {
      const agendaButton = screen.getByRole('button', { name: /agenda/i });
      expect(agendaButton).not.toBeDisabled();
      const badge = screen.getByText('2');
      expect(badge).toBeInTheDocument();
    });
  });

  test('should handle export errors gracefully', async () => {
    (dataService.loadContacts as jest.Mock).mockReturnValue(mockContactsWithReminders);
    (dataService.exportGoogleCalendarICS as jest.Mock).mockImplementation(() => {
      throw new Error('Export failed');
    });

    // Mock console.error pour éviter les logs d'erreur dans les tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      const agendaButton = screen.getByRole('button', { name: /agenda/i });
      fireEvent.click(agendaButton);
    });

    expect(dataService.exportGoogleCalendarICS).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Erreur lors de l\'export Google Calendar:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  test('should maintain visual consistency with Contacts button', async () => {
    (dataService.loadContacts as jest.Mock).mockReturnValue(mockContactsWithReminders);

    render(<App />);

    await waitFor(() => {
      const contactsButton = screen.getByRole('button', { name: /contacts/i });
      const agendaButton = screen.getByRole('button', { name: /agenda/i });

      // Vérifier que les deux boutons ont des classes similaires
      expect(contactsButton.className).toContain('ribbon-button-modern');
      expect(agendaButton.className).toContain('ribbon-button-modern');
      
      expect(contactsButton.className).toContain('min-w-[80px] max-w-[80px] h-12');
      expect(agendaButton.className).toContain('min-w-[80px] max-w-[80px] h-12');
    });
  });

  test('should show badge only when reminders are available', async () => {
    // Test avec rappels
    (dataService.loadContacts as jest.Mock).mockReturnValue(mockContactsWithReminders);
    const { rerender } = render(<App />);

    await waitFor(() => {
      const badge = screen.getByText('2');
      expect(badge).toBeInTheDocument();
    });

    // Test sans rappels
    (dataService.loadContacts as jest.Mock).mockReturnValue(mockContactsWithoutReminders);
    rerender(<App />);

    await waitFor(() => {
      expect(screen.queryByText('2')).not.toBeInTheDocument();
    });
  });
});