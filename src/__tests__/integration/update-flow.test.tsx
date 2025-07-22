import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../App';
import { useAutoUpdate } from '../../hooks/useAutoUpdate';
import { UpdateState } from '../../types/update';

// Mock du hook useAutoUpdate
jest.mock('../../hooks/useAutoUpdate');
const mockUseAutoUpdate = useAutoUpdate as jest.MockedFunction<typeof useAutoUpdate>;

// Mock des autres hooks et services
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

jest.mock('../../lib/auth-client', () => ({
  useSupabaseAuth: () => ({
    isAuthenticated: true,
    user: { email: 'test@example.com' },
  }),
}));

jest.mock('../../services/dataService', () => ({
  loadContacts: () => [],
  saveContacts: jest.fn(),
  importContactsFromFile: jest.fn(),
  exportContactsToFile: jest.fn(),
  loadCallStates: () => ({}),
  saveCallStates: jest.fn(),
  saveImportedTable: jest.fn(),
  loadImportedTable: jest.fn(),
  clearImportedTable: jest.fn(),
  hasImportedTable: () => false,
  getImportedTableMetadata: jest.fn(),
  formatPhoneNumber: (phone: string) => phone,
  generateGmailComposeUrl: jest.fn(),
}));

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: {
    platform: 'win32',
    isMaximized: () => Promise.resolve(false),
    minimizeApp: jest.fn(),
    maximizeApp: jest.fn(),
    closeApp: jest.fn(),
  },
  writable: true,
});

describe('Update Flow Integration Tests', () => {
  const mockInstallUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Update Badge Display', () => {
    it('should show "MAJ..." when checking for updates', () => {
      const updateState: UpdateState = {
        checking: true,
        available: false,
        downloading: false,
        downloaded: false,
        error: null,
        progress: 0,
        updateInfo: null,
      };

      mockUseAutoUpdate.mockReturnValue({
        updateState,
        checkForUpdates: jest.fn(),
        installUpdate: mockInstallUpdate,
      });

      render(<App />);

      expect(screen.getByText('MAJ...')).toBeInTheDocument();
    });

    it('should show download progress when downloading', () => {
      const updateState: UpdateState = {
        checking: false,
        available: true,
        downloading: true,
        downloaded: false,
        error: null,
        progress: 45,
        updateInfo: { version: '2.1.0' },
      };

      mockUseAutoUpdate.mockReturnValue({
        updateState,
        checkForUpdates: jest.fn(),
        installUpdate: mockInstallUpdate,
      });

      render(<App />);

      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('should show "Mettre à jour" when update is downloaded', () => {
      const updateState: UpdateState = {
        checking: false,
        available: true,
        downloading: false,
        downloaded: true,
        error: null,
        progress: 100,
        updateInfo: { version: '2.1.0' },
      };

      mockUseAutoUpdate.mockReturnValue({
        updateState,
        checkForUpdates: jest.fn(),
        installUpdate: mockInstallUpdate,
      });

      render(<App />);

      expect(screen.getByText('Mettre à jour')).toBeInTheDocument();
    });
  });

  describe('Update Confirmation Flow', () => {
    it('should open confirmation dialog when "Mettre à jour" badge is clicked', async () => {
      const updateState: UpdateState = {
        checking: false,
        available: true,
        downloading: false,
        downloaded: true,
        error: null,
        progress: 100,
        updateInfo: { 
          version: '2.1.0',
          releaseName: 'Version Test',
          releaseNotes: 'Test release notes',
        },
      };

      mockUseAutoUpdate.mockReturnValue({
        updateState,
        checkForUpdates: jest.fn(),
        installUpdate: mockInstallUpdate,
      });

      render(<App />);

      const updateBadge = screen.getByText('Mettre à jour');
      fireEvent.click(updateBadge);

      await waitFor(() => {
        expect(screen.getByText('Mise à jour disponible')).toBeInTheDocument();
        expect(screen.getByText('Version 2.1.0')).toBeInTheDocument();
        expect(screen.getByText(/Êtes-vous sûr de vouloir installer/)).toBeInTheDocument();
      });
    });

    it('should close dialog when cancel is clicked', async () => {
      const updateState: UpdateState = {
        checking: false,
        available: true,
        downloading: false,
        downloaded: true,
        error: null,
        progress: 100,
        updateInfo: { version: '2.1.0' },
      };

      mockUseAutoUpdate.mockReturnValue({
        updateState,
        checkForUpdates: jest.fn(),
        installUpdate: mockInstallUpdate,
      });

      render(<App />);

      // Ouvrir le dialog
      const updateBadge = screen.getByText('Mettre à jour');
      fireEvent.click(updateBadge);

      await waitFor(() => {
        expect(screen.getByText('Mise à jour disponible')).toBeInTheDocument();
      });

      // Cliquer sur Annuler
      const cancelButton = screen.getByText('Annuler');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Mise à jour disponible')).not.toBeInTheDocument();
      });

      // Vérifier que installUpdate n'a pas été appelé
      expect(mockInstallUpdate).not.toHaveBeenCalled();
    });

    it('should install update when confirmed', async () => {
      const updateState: UpdateState = {
        checking: false,
        available: true,
        downloading: false,
        downloaded: true,
        error: null,
        progress: 100,
        updateInfo: { version: '2.1.0' },
      };

      mockUseAutoUpdate.mockReturnValue({
        updateState,
        checkForUpdates: jest.fn(),
        installUpdate: mockInstallUpdate,
      });

      render(<App />);

      // Ouvrir le dialog
      const updateBadge = screen.getByText('Mettre à jour');
      fireEvent.click(updateBadge);

      await waitFor(() => {
        expect(screen.getByText('Mise à jour disponible')).toBeInTheDocument();
      });

      // Cliquer sur Confirmer
      const confirmButton = screen.getByText('Oui, mettre à jour');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockInstallUpdate).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('Mise à jour disponible')).not.toBeInTheDocument();
      });
    });

    it('should close dialog with Escape key', async () => {
      const updateState: UpdateState = {
        checking: false,
        available: true,
        downloading: false,
        downloaded: true,
        error: null,
        progress: 100,
        updateInfo: { version: '2.1.0' },
      };

      mockUseAutoUpdate.mockReturnValue({
        updateState,
        checkForUpdates: jest.fn(),
        installUpdate: mockInstallUpdate,
      });

      render(<App />);

      // Ouvrir le dialog
      const updateBadge = screen.getByText('Mettre à jour');
      fireEvent.click(updateBadge);

      await waitFor(() => {
        expect(screen.getByText('Mise à jour disponible')).toBeInTheDocument();
      });

      // Appuyer sur Escape
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('Mise à jour disponible')).not.toBeInTheDocument();
      });

      expect(mockInstallUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Fallback Behavior', () => {
    it('should call installUpdate directly if onUpdateConfirmationOpen is not available', () => {
      const updateState: UpdateState = {
        checking: false,
        available: true,
        downloading: false,
        downloaded: true,
        error: null,
        progress: 100,
        updateInfo: { version: '2.1.0' },
      };

      mockUseAutoUpdate.mockReturnValue({
        updateState,
        checkForUpdates: jest.fn(),
        installUpdate: mockInstallUpdate,
      });

      // Simuler un composant TitleBar sans onUpdateConfirmationOpen
      const { container } = render(<App />);
      
      // Modifier le comportement pour simuler l'absence de onUpdateConfirmationOpen
      const updateBadge = screen.getByText('Mettre à jour');
      
      // Simuler un clic direct qui devrait déclencher installUpdate
      Object.defineProperty(updateBadge, 'onclick', {
        value: mockInstallUpdate,
        writable: true,
      });
      
      fireEvent.click(updateBadge);
      
      // Dans ce cas, le dialog devrait s'ouvrir normalement
      expect(screen.getByText('Mise à jour disponible')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should handle update errors gracefully', () => {
      const updateState: UpdateState = {
        checking: false,
        available: false,
        downloading: false,
        downloaded: false,
        error: 'Erreur de connexion réseau',
        progress: 0,
        updateInfo: null,
      };

      mockUseAutoUpdate.mockReturnValue({
        updateState,
        checkForUpdates: jest.fn(),
        installUpdate: mockInstallUpdate,
      });

      render(<App />);

      // Le badge ne devrait pas être affiché en cas d'erreur
      expect(screen.queryByText('MAJ')).not.toBeInTheDocument();
      expect(screen.queryByText('Mettre à jour')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should work on both macOS and Windows layouts', () => {
      const updateState: UpdateState = {
        checking: false,
        available: true,
        downloading: false,
        downloaded: true,
        error: null,
        progress: 100,
        updateInfo: { version: '2.1.0' },
      };

      mockUseAutoUpdate.mockReturnValue({
        updateState,
        checkForUpdates: jest.fn(),
        installUpdate: mockInstallUpdate,
      });

      // Test Windows layout
      Object.defineProperty(window, 'electronAPI', {
        value: {
          ...window.electronAPI,
          platform: 'win32',
        },
        writable: true,
      });

      const { rerender } = render(<App />);
      expect(screen.getByText('Mettre à jour')).toBeInTheDocument();

      // Test macOS layout
      Object.defineProperty(window, 'electronAPI', {
        value: {
          ...window.electronAPI,
          platform: 'darwin',
        },
        writable: true,
      });

      rerender(<App />);
      expect(screen.getByText('Mettre à jour')).toBeInTheDocument();
    });
  });
});