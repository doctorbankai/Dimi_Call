/**
 * Tests d'intégration pour le workflow DevTools
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BetaOptInSettings } from '../../components/BetaOptInSettings';
import { DevToolsService } from '../../services/devToolsService';
import { BetaPreferences } from '../../types/update';

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, disabled, id, ...props }: any) => (
    <input
      type="checkbox"
      role="switch"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      disabled={disabled}
      {...props}
    />
  ),
}));

// Mock du DevToolsService
jest.mock('../../services/devToolsService');
const mockDevToolsService = DevToolsService as jest.Mocked<typeof DevToolsService>;

// Mock de l'API Electron
const mockElectronAPI = {
  devTools: {
    enable: jest.fn(),
    disable: jest.fn(),
    isEnabled: jest.fn()
  }
};

(global as any).window = {
  electronAPI: mockElectronAPI
};

describe('DevTools Workflow Integration', () => {
  const mockBetaPreferences: BetaPreferences = {
    enabled: false,
    hasBeenWarned: false,
    lastModified: Date.now()
  };

  const mockProps = {
    betaPreferences: mockBetaPreferences,
    onPreferencesChange: jest.fn(),
    isCurrentVersionBeta: false,
    devToolsEnabled: false,
    onDevToolsToggle: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDevToolsService.enableDevTools.mockResolvedValue();
    mockDevToolsService.disableDevTools.mockResolvedValue();
    mockDevToolsService.isEnabled.mockReturnValue(false);
  });

  describe('DevTools Toggle Functionality', () => {
    it('should enable DevTools when switch is enabled', async () => {
      render(<BetaOptInSettings {...mockProps} />);
      
      const devToolsCheckbox = screen.getByLabelText(/Activer les outils de développement/);
      
      fireEvent.click(devToolsCheckbox);
      
      await waitFor(() => {
        expect(mockProps.onDevToolsToggle).toHaveBeenCalledWith(true);
      });
    });

    it('should disable DevTools when switch is disabled', async () => {
      const propsWithDevToolsEnabled = {
        ...mockProps,
        devToolsEnabled: true
      };
      
      render(<BetaOptInSettings {...propsWithDevToolsEnabled} />);
      
      const devToolsCheckbox = screen.getByLabelText(/Activer les outils de développement/);
      
      fireEvent.click(devToolsCheckbox);
      
      await waitFor(() => {
        expect(mockProps.onDevToolsToggle).toHaveBeenCalledWith(false);
      });
    });

    it('should show DevTools information when enabled', () => {
      const propsWithDevToolsEnabled = {
        ...mockProps,
        devToolsEnabled: true
      };
      
      render(<BetaOptInSettings {...propsWithDevToolsEnabled} />);
      
      expect(screen.getByText('DevTools activés')).toBeInTheDocument();
      expect(screen.getByText(/Accès à la console de développement/)).toBeInTheDocument();
    });
  });

  describe('Beta Version Integration', () => {
    it('should auto-enable DevTools when beta is activated for first time', async () => {
      render(<BetaOptInSettings {...mockProps} />);
      
      const betaCheckbox = screen.getByLabelText(/Recevoir les versions bêta/);
      
      fireEvent.click(betaCheckbox);
      
      // Confirmer dans le dialog d'avertissement
      const confirmButton = await screen.findByText(/J'accepte, activer les versions bêta/);
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockProps.onDevToolsToggle).toHaveBeenCalledWith(true);
      });
    });

    it('should auto-enable DevTools when beta is activated directly', async () => {
      const propsWithWarned = {
        ...mockProps,
        betaPreferences: {
          ...mockBetaPreferences,
          hasBeenWarned: true
        }
      };
      
      render(<BetaOptInSettings {...propsWithWarned} />);
      
      const betaCheckbox = screen.getByLabelText(/Recevoir les versions bêta/);
      
      fireEvent.click(betaCheckbox);
      
      await waitFor(() => {
        expect(mockProps.onDevToolsToggle).toHaveBeenCalledWith(true);
      });
    });

    it('should not auto-enable DevTools if already enabled', async () => {
      const propsWithDevToolsEnabled = {
        ...mockProps,
        devToolsEnabled: true,
        betaPreferences: {
          ...mockBetaPreferences,
          hasBeenWarned: true
        }
      };
      
      render(<BetaOptInSettings {...propsWithDevToolsEnabled} />);
      
      const betaCheckbox = screen.getByLabelText(/Recevoir les versions bêta/);
      
      fireEvent.click(betaCheckbox);
      
      // DevTools ne devrait pas être appelé car déjà activé
      expect(mockProps.onDevToolsToggle).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle DevTools enable errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockDevToolsService.enableDevTools.mockRejectedValue(new Error('Test error'));
      
      render(<BetaOptInSettings {...mockProps} />);
      
      const devToolsCheckbox = screen.getByLabelText(/Activer les outils de développement/);
      
      fireEvent.click(devToolsCheckbox);
      
      await waitFor(() => {
        expect(mockProps.onDevToolsToggle).toHaveBeenCalledWith(true);
      });
      
      consoleSpy.mockRestore();
    });

    it('should handle missing Electron API gracefully', async () => {
      (global as any).window.electronAPI = undefined;
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      render(<BetaOptInSettings {...mockProps} />);
      
      const devToolsCheckbox = screen.getByLabelText(/Activer les outils de développement/);
      
      fireEvent.click(devToolsCheckbox);
      
      await waitFor(() => {
        expect(mockProps.onDevToolsToggle).toHaveBeenCalledWith(true);
      });
      
      consoleSpy.mockRestore();
      
      // Restaurer l'API pour les autres tests
      (global as any).window.electronAPI = mockElectronAPI;
    });
  });

  describe('State Persistence', () => {
    it('should reflect DevTools state correctly in UI', () => {
      const propsWithDevToolsEnabled = {
        ...mockProps,
        devToolsEnabled: true
      };
      
      render(<BetaOptInSettings {...propsWithDevToolsEnabled} />);
      
      const devToolsCheckbox = screen.getByLabelText(/Activer les outils de développement/) as HTMLInputElement;
      
      expect(devToolsCheckbox.checked).toBe(true);
    });

    it('should show correct state when DevTools are disabled', () => {
      render(<BetaOptInSettings {...mockProps} />);
      
      const devToolsCheckbox = screen.getByLabelText(/Activer les outils de développement/) as HTMLInputElement;
      
      expect(devToolsCheckbox.checked).toBe(false);
      expect(screen.queryByText('DevTools activés')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcut Information', () => {
    it('should display keyboard shortcut information', () => {
      render(<BetaOptInSettings {...mockProps} />);
      
      expect(screen.getByText(/Ctrl\+Shift\+I/)).toBeInTheDocument();
    });

    it('should show shortcut in DevTools information when enabled', () => {
      const propsWithDevToolsEnabled = {
        ...mockProps,
        devToolsEnabled: true
      };
      
      render(<BetaOptInSettings {...propsWithDevToolsEnabled} />);
      
      expect(screen.getByText(/Ctrl\+Shift\+I/)).toBeInTheDocument();
    });
  });
});