import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UpdateConfirmationDialog } from '../UpdateConfirmationDialog';
import { UpdateInfo } from '../../types/update';

// Mock des composants UI
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => 
    open ? <div data-testid="dialog" onClick={() => onOpenChange(false)}>{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, className }: any) => (
    <button 
      onClick={onClick} 
      data-testid={variant === 'outline' ? 'cancel-button' : 'confirm-button'}
      className={className}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}));

describe('UpdateConfirmationDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
  };

  const mockUpdateInfo: UpdateInfo = {
    version: '2.1.0',
    releaseDate: '2024-01-15T10:00:00Z',
    releaseName: 'Version Majeure',
    releaseNotes: 'Nouvelles fonctionnalités:\n- Amélioration des performances\n- Correction de bugs',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<UpdateConfirmationDialog {...defaultProps} />);
      
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Mise à jour disponible');
    });

    it('should not render when isOpen is false', () => {
      render(<UpdateConfirmationDialog {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('should display update version badge when updateInfo is provided', () => {
      render(<UpdateConfirmationDialog {...defaultProps} updateInfo={mockUpdateInfo} />);
      
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('Version 2.1.0');
    });

    it('should display warning message', () => {
      render(<UpdateConfirmationDialog {...defaultProps} />);
      
      expect(screen.getByText(/Êtes-vous sûr de vouloir installer la mise à jour/)).toBeInTheDocument();
      expect(screen.getByText(/Il est recommandé de sauvegarder votre travail/)).toBeInTheDocument();
    });
  });

  describe('Update Information Display', () => {
    it('should display release name when provided', () => {
      render(<UpdateConfirmationDialog {...defaultProps} updateInfo={mockUpdateInfo} />);
      
      expect(screen.getByText('Nom de la version')).toBeInTheDocument();
      expect(screen.getByText('Version Majeure')).toBeInTheDocument();
    });

    it('should display formatted release date when provided', () => {
      render(<UpdateConfirmationDialog {...defaultProps} updateInfo={mockUpdateInfo} />);
      
      expect(screen.getByText('Date de publication')).toBeInTheDocument();
      expect(screen.getByText('15 janvier 2024')).toBeInTheDocument();
    });

    it('should display release notes when provided', () => {
      render(<UpdateConfirmationDialog {...defaultProps} updateInfo={mockUpdateInfo} />);
      
      expect(screen.getByText('Notes de version')).toBeInTheDocument();
      expect(screen.getByText(/Nouvelles fonctionnalités/)).toBeInTheDocument();
      expect(screen.getByText(/Amélioration des performances/)).toBeInTheDocument();
    });

    it('should handle missing update info gracefully', () => {
      render(<UpdateConfirmationDialog {...defaultProps} updateInfo={null} />);
      
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
      expect(screen.queryByText('Nom de la version')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when cancel button is clicked', () => {
      render(<UpdateConfirmationDialog {...defaultProps} />);
      
      const cancelButton = screen.getByTestId('cancel-button');
      fireEvent.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onConfirm and onClose when confirm button is clicked', () => {
      render(<UpdateConfirmationDialog {...defaultProps} />);
      
      const confirmButton = screen.getByTestId('confirm-button');
      fireEvent.click(confirmButton);
      
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when dialog overlay is clicked', () => {
      render(<UpdateConfirmationDialog {...defaultProps} />);
      
      const dialog = screen.getByTestId('dialog');
      fireEvent.click(dialog);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should call onClose when Escape key is pressed', async () => {
      render(<UpdateConfirmationDialog {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call onClose when Escape is pressed and dialog is closed', async () => {
      render(<UpdateConfirmationDialog {...defaultProps} isOpen={false} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });

    it('should handle other keys without calling onClose', async () => {
      render(<UpdateConfirmationDialog {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });
      
      await waitFor(() => {
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button labels', () => {
      render(<UpdateConfirmationDialog {...defaultProps} />);
      
      expect(screen.getByTestId('cancel-button')).toHaveTextContent('Annuler');
      expect(screen.getByTestId('confirm-button')).toHaveTextContent('Oui, mettre à jour');
    });

    it('should have proper dialog structure', () => {
      render(<UpdateConfirmationDialog {...defaultProps} />);
      
      expect(screen.getByTestId('dialog-header')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-footer')).toBeInTheDocument();
    });
  });

  describe('Theme Compatibility', () => {
    it('should apply proper CSS classes for styling', () => {
      render(<UpdateConfirmationDialog {...defaultProps} />);
      
      const confirmButton = screen.getByTestId('confirm-button');
      expect(confirmButton).toHaveClass('bg-blue-600', 'hover:bg-blue-700');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid release date gracefully', () => {
      const invalidUpdateInfo = {
        ...mockUpdateInfo,
        releaseDate: 'invalid-date',
      };
      
      render(<UpdateConfirmationDialog {...defaultProps} updateInfo={invalidUpdateInfo} />);
      
      expect(screen.getByText('invalid-date')).toBeInTheDocument();
    });

    it('should handle empty release notes', () => {
      const emptyNotesUpdateInfo = {
        ...mockUpdateInfo,
        releaseNotes: '',
      };
      
      render(<UpdateConfirmationDialog {...defaultProps} updateInfo={emptyNotesUpdateInfo} />);
      
      expect(screen.queryByText('Notes de version')).not.toBeInTheDocument();
    });
  });
});