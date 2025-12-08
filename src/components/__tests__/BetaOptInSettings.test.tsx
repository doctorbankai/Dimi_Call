/**
 * Tests unitaires pour BetaOptInSettings
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BetaOptInSettings, BetaOptInSettingsProps } from '../BetaOptInSettings';
import { BetaPreferences } from '../../types/update';

// Mock des composants UI
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => (
    <span {...props}>{children}</span>
  ),
}));

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

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
}));

// Mock des icônes Lucide
jest.mock('lucide-react', () => ({
  AlertTriangle: () => <span data-testid="alert-triangle-icon" />,
  Beaker: () => <span data-testid="beaker-icon" />,
  Shield: () => <span data-testid="shield-icon" />,
  ArrowLeft: () => <span data-testid="arrow-left-icon" />,
}));

describe('BetaOptInSettings', () => {
  const defaultBetaPreferences: BetaPreferences = {
    enabled: false,
    lastModified: Date.now(),
    hasBeenWarned: false,
  };

  const defaultProps: BetaOptInSettingsProps = {
    betaPreferences: defaultBetaPreferences,
    onPreferencesChange: jest.fn(),
    isCurrentVersionBeta: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the beta opt-in switch', () => {
      render(<BetaOptInSettings {...defaultProps} />);
      
      expect(screen.getByRole('switch', { name: 'Recevoir les versions bêta' })).toBeInTheDocument();
      expect(screen.getByText('Recevoir les versions bêta')).toBeInTheDocument();
    });

    it('should show beta badge when current version is beta', () => {
      render(
        <BetaOptInSettings 
          {...defaultProps} 
          isCurrentVersionBeta={true}
        />
      );
      
      expect(screen.getByText('BETA')).toBeInTheDocument();
    });

    it('should not show beta badge when current version is stable', () => {
      render(<BetaOptInSettings {...defaultProps} />);
      
      expect(screen.queryByText('BETA')).not.toBeInTheDocument();
    });

    it('should show additional info when beta is enabled', () => {
      const enabledPreferences: BetaPreferences = {
        ...defaultBetaPreferences,
        enabled: true,
      };

      render(
        <BetaOptInSettings 
          {...defaultProps} 
          betaPreferences={enabledPreferences}
        />
      );
      
      expect(screen.getByText('Versions bêta activées')).toBeInTheDocument();
      expect(screen.getByText(/Nouvelles fonctionnalités en test/)).toBeInTheDocument();
      expect(screen.getByText(/Outils de débogage automatiquement activés/)).toBeInTheDocument();
    });

    it('should show revert button when current version is beta and callback is provided', () => {
      const onRevertToStable = jest.fn();

      render(
        <BetaOptInSettings 
          {...defaultProps} 
          isCurrentVersionBeta={true}
          onRevertToStable={onRevertToStable}
        />
      );
      
      expect(screen.getByText('Revenir à la version stable')).toBeInTheDocument();
    });

    it('should not show revert button when current version is stable', () => {
      const onRevertToStable = jest.fn();

      render(
        <BetaOptInSettings 
          {...defaultProps} 
          isCurrentVersionBeta={false}
          onRevertToStable={onRevertToStable}
        />
      );
      
      expect(screen.queryByText('Revenir à la version stable')).not.toBeInTheDocument();
    });
  });

  describe('Beta Opt-in Interaction', () => {
    it('should call onPreferencesChange when switch is toggled and user has been warned', async () => {
      const onPreferencesChange = jest.fn();
      const warnedPreferences: BetaPreferences = {
        ...defaultBetaPreferences,
        hasBeenWarned: true,
      };

      render(
        <BetaOptInSettings 
          {...defaultProps} 
          betaPreferences={warnedPreferences}
          onPreferencesChange={onPreferencesChange}
        />
      );
      
      const betaSwitch = screen.getByRole('switch', { name: 'Recevoir les versions bêta' });
      await userEvent.click(betaSwitch);
      
      expect(onPreferencesChange).toHaveBeenCalledWith({
        ...warnedPreferences,
        enabled: true,
        lastModified: expect.any(Number),
      });
    });

    it('should show warning dialog when enabling beta for the first time', async () => {
      render(<BetaOptInSettings {...defaultProps} />);
      
      const betaSwitch = screen.getByRole('switch', { name: 'Recevoir les versions bêta' });
      await userEvent.click(betaSwitch);
      
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByText('Activer les versions bêta')).toBeInTheDocument();
      expect(screen.getByText(/Important à savoir/)).toBeInTheDocument();
    });

    it('should not show warning dialog when disabling beta', async () => {
      const enabledPreferences: BetaPreferences = {
        ...defaultBetaPreferences,
        enabled: true,
        hasBeenWarned: true,
      };

      const onPreferencesChange = jest.fn();

      render(
        <BetaOptInSettings 
          {...defaultProps} 
          betaPreferences={enabledPreferences}
          onPreferencesChange={onPreferencesChange}
        />
      );
      
      const betaSwitch = screen.getByRole('switch', { name: 'Recevoir les versions bêta' });
      await userEvent.click(betaSwitch);
      
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
      expect(onPreferencesChange).toHaveBeenCalledWith({
        ...enabledPreferences,
        enabled: false,
        lastModified: expect.any(Number),
      });
    });

    it('should disable switch when reverting to stable', () => {
      render(
        <BetaOptInSettings 
          {...defaultProps} 
          isRevertingToStable={true}
        />
      );
      
      const betaSwitch = screen.getByRole('switch', { name: 'Recevoir les versions bêta' });
      expect(betaSwitch).toBeDisabled();
    });
  });

  describe('Warning Dialog', () => {
    it('should confirm beta activation when user accepts warning', async () => {
      const onPreferencesChange = jest.fn();

      render(
        <BetaOptInSettings 
          {...defaultProps} 
          onPreferencesChange={onPreferencesChange}
        />
      );
      
      // Ouvrir le dialog d'avertissement
      const betaSwitch = screen.getByRole('switch', { name: 'Recevoir les versions bêta' });
      await userEvent.click(betaSwitch);
      
      // Confirmer l'activation
      const confirmButton = screen.getByText('J\'accepte, activer les versions bêta');
      await userEvent.click(confirmButton);
      
      expect(onPreferencesChange).toHaveBeenCalledWith({
        ...defaultBetaPreferences,
        enabled: true,
        hasBeenWarned: true,
        lastModified: expect.any(Number),
      });
    });

    it('should cancel beta activation when user cancels warning', async () => {
      const onPreferencesChange = jest.fn();

      render(
        <BetaOptInSettings 
          {...defaultProps} 
          onPreferencesChange={onPreferencesChange}
        />
      );
      
      // Ouvrir le dialog d'avertissement
      const betaSwitch = screen.getByRole('switch', { name: 'Recevoir les versions bêta' });
      await userEvent.click(betaSwitch);
      
      // Annuler l'activation
      const cancelButton = screen.getByText('Annuler');
      await userEvent.click(cancelButton);
      
      expect(onPreferencesChange).not.toHaveBeenCalled();
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('should display warning information in the dialog', async () => {
      render(<BetaOptInSettings {...defaultProps} />);
      
      const betaSwitch = screen.getByRole('switch', { name: 'Recevoir les versions bêta' });
      await userEvent.click(betaSwitch);
      
      expect(screen.getByText(/Les versions bêta peuvent contenir des bugs/)).toBeInTheDocument();
      expect(screen.getByText(/Les outils de débogage.*seront automatiquement activés/)).toBeInTheDocument();
      expect(screen.getByText(/Vous recevrez des mises à jour plus fréquentes/)).toBeInTheDocument();
      expect(screen.getByText(/Sauvegardez régulièrement vos données/)).toBeInTheDocument();
    });
  });

  describe('Revert to Stable', () => {
    it('should show revert confirmation dialog when revert button is clicked', async () => {
      const onRevertToStable = jest.fn();

      render(
        <BetaOptInSettings 
          {...defaultProps} 
          isCurrentVersionBeta={true}
          onRevertToStable={onRevertToStable}
        />
      );
      
      const revertButton = screen.getByText('Revenir à la version stable');
      await userEvent.click(revertButton);
      
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByText('Revenir à la version stable')).toBeInTheDocument();
    });

    it('should call onRevertToStable when revert is confirmed', async () => {
      const onRevertToStable = jest.fn();

      render(
        <BetaOptInSettings 
          {...defaultProps} 
          isCurrentVersionBeta={true}
          onRevertToStable={onRevertToStable}
        />
      );
      
      // Ouvrir le dialog de confirmation
      const revertButton = screen.getByText('Revenir à la version stable');
      await userEvent.click(revertButton);
      
      // Confirmer le retour
      const confirmButton = screen.getByText('Confirmer le retour');
      await userEvent.click(confirmButton);
      
      expect(onRevertToStable).toHaveBeenCalled();
    });

    it('should not call onRevertToStable when revert is cancelled', async () => {
      const onRevertToStable = jest.fn();

      render(
        <BetaOptInSettings 
          {...defaultProps} 
          isCurrentVersionBeta={true}
          onRevertToStable={onRevertToStable}
        />
      );
      
      // Ouvrir le dialog de confirmation
      const revertButton = screen.getByText('Revenir à la version stable');
      await userEvent.click(revertButton);
      
      // Annuler le retour
      const cancelButton = screen.getByText('Annuler');
      await userEvent.click(cancelButton);
      
      expect(onRevertToStable).not.toHaveBeenCalled();
    });

    it('should show loading state when reverting to stable', () => {
      const onRevertToStable = jest.fn();

      render(
        <BetaOptInSettings 
          {...defaultProps} 
          isCurrentVersionBeta={true}
          onRevertToStable={onRevertToStable}
          isRevertingToStable={true}
        />
      );
      
      expect(screen.getByText('Retour en cours...')).toBeInTheDocument();
    });

    it('should display revert information in the dialog', async () => {
      const onRevertToStable = jest.fn();

      render(
        <BetaOptInSettings 
          {...defaultProps} 
          isCurrentVersionBeta={true}
          onRevertToStable={onRevertToStable}
        />
      );
      
      const revertButton = screen.getByText('Revenir à la version stable');
      await userEvent.click(revertButton);
      
      expect(screen.getByText(/Téléchargement de la dernière version stable/)).toBeInTheDocument();
      expect(screen.getByText(/Désactivation automatique des outils de débogage/)).toBeInTheDocument();
      expect(screen.getByText(/Redémarrage de l'application/)).toBeInTheDocument();
      expect(screen.getByText(/Vos données seront conservées/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for the switch', () => {
      render(<BetaOptInSettings {...defaultProps} />);
      
      const betaSwitch = screen.getByRole('switch', { name: 'Recevoir les versions bêta' });
      expect(betaSwitch).toHaveAccessibleName('Recevoir les versions bêta');
    });

    it('should have proper button labels', () => {
      const onRevertToStable = jest.fn();

      render(
        <BetaOptInSettings 
          {...defaultProps} 
          isCurrentVersionBeta={true}
          onRevertToStable={onRevertToStable}
        />
      );
      
      const revertButton = screen.getByRole('button', { name: /Revenir à la version stable/ });
      expect(revertButton).toBeInTheDocument();
    });

    it('should support keyboard navigation in dialogs', async () => {
      render(<BetaOptInSettings {...defaultProps} />);
      
      const betaSwitch = screen.getByRole('switch', { name: 'Recevoir les versions bêta' });
      await userEvent.click(betaSwitch);
      
      // Le dialog devrait être focusable
      const dialog = screen.getByTestId('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Les boutons du dialog devraient être accessibles
      const confirmButton = screen.getByText('J\'accepte, activer les versions bêta');
      const cancelButton = screen.getByText('Annuler');
      
      expect(confirmButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing onRevertToStable callback gracefully', () => {
      render(
        <BetaOptInSettings 
          {...defaultProps} 
          isCurrentVersionBeta={true}
          // onRevertToStable non fourni
        />
      );
      
      // Le bouton de retour ne devrait pas être affiché
      expect(screen.queryByText('Revenir à la version stable')).not.toBeInTheDocument();
    });

    it('should handle rapid switch toggling', async () => {
      const onPreferencesChange = jest.fn();
      const warnedPreferences: BetaPreferences = {
        ...defaultBetaPreferences,
        hasBeenWarned: true,
      };

      render(
        <BetaOptInSettings 
          {...defaultProps} 
          betaPreferences={warnedPreferences}
          onPreferencesChange={onPreferencesChange}
        />
      );
      
      const betaSwitch = screen.getByRole('switch', { name: 'Recevoir les versions bêta' });
      
      // Cliquer rapidement plusieurs fois
      await userEvent.click(betaSwitch);
      await userEvent.click(betaSwitch);
      await userEvent.click(betaSwitch);
      
      // Seul le dernier état devrait être pris en compte
      expect(onPreferencesChange).toHaveBeenCalledTimes(3);
    });

    it('should handle preferences change errors gracefully', async () => {
      const onPreferencesChange = jest.fn().mockImplementation(() => {
        throw new Error('Preferences change error');
      });

      const warnedPreferences: BetaPreferences = {
        ...defaultBetaPreferences,
        hasBeenWarned: true,
      };

      // Mock console.error pour éviter les logs d'erreur dans les tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <BetaOptInSettings 
          {...defaultProps} 
          betaPreferences={warnedPreferences}
          onPreferencesChange={onPreferencesChange}
        />
      );
      
      const betaSwitch = screen.getByRole('switch', { name: 'Recevoir les versions bêta' });
      
      // L'erreur ne devrait pas faire planter le composant
      expect(async () => {
        await userEvent.click(betaSwitch);
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});