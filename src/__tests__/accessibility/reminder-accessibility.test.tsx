import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ReminderDialog } from '../../components/ReminderDialog';
import { RelativeDateSelector } from '../../components/RelativeDateSelector';
import { Contact, ContactStatus } from '../../types';

// Étendre Jest avec les matchers d'accessibilité
expect.extend(toHaveNoViolations);

// Mock du service de calcul de dates
jest.mock('../../services/dateCalculationService', () => ({
  DateCalculationService: {
    calculateFutureDate: jest.fn(),
    validateDateRange: jest.fn(),
    isValidTimeFormat: jest.fn(),
    isValidDateFormat: jest.fn(),
    getPreviewText: jest.fn(),
    formatDateForDisplay: jest.fn(),
    isValidQuantity: jest.fn(),
  }
}));

const mockDateCalculationService = require('../../services/dateCalculationService').DateCalculationService;

describe('Reminder Components Accessibility', () => {
  const mockContact: Contact = {
    id: '1',
    numeroLigne: 1,
    prenom: 'Test',
    nom: 'User',
    telephone: '0123456789',
    email: 'test@example.com',
    source: 'Test',
    statut: ContactStatus.ARappeler,
    commentaire: '',
    dateRappel: '',
    heureRappel: '',
    dateRDV: '',
    heureRDV: '',
    dateAppel: '',
    heureAppel: '',
    dureeAppel: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDateCalculationService.validateDateRange.mockReturnValue({ isValid: true });
    mockDateCalculationService.isValidTimeFormat.mockReturnValue(true);
    mockDateCalculationService.isValidDateFormat.mockReturnValue(true);
    mockDateCalculationService.calculateFutureDate.mockReturnValue('2024-01-20');
    mockDateCalculationService.getPreviewText.mockReturnValue('Dans 5 jours');
    mockDateCalculationService.formatDateForDisplay.mockReturnValue('samedi 20 janvier 2024');
    mockDateCalculationService.isValidQuantity.mockReturnValue(true);
  });

  describe('ReminderDialog Accessibility', () => {
    const dialogProps = {
      isOpen: true,
      onClose: jest.fn(),
      contact: mockContact,
      onSave: jest.fn()
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<ReminderDialog {...dialogProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper dialog structure', () => {
      render(<ReminderDialog {...dialogProps} />);
      
      // Vérifier la présence du dialog
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Vérifier le titre
      expect(screen.getByRole('heading', { name: 'Programmer un Rappel' })).toBeInTheDocument();
      
      // Vérifier la description
      expect(dialog).toHaveAttribute('aria-describedby', 'reminder-description');
      expect(screen.getByText('Contact: Test User')).toHaveAttribute('id', 'reminder-description');
    });

    it('should have properly labeled form inputs', () => {
      render(<ReminderDialog {...dialogProps} />);
      
      // Vérifier les labels des champs
      expect(screen.getByLabelText('Date du rappel')).toBeInTheDocument();
      expect(screen.getByLabelText('Heure du rappel')).toBeInTheDocument();
    });

    it('should have proper error associations', async () => {
      const user = userEvent.setup();
      mockDateCalculationService.validateDateRange.mockReturnValue({
        isValid: false,
        errorMessage: 'Date invalide'
      });
      
      render(<ReminderDialog {...dialogProps} />);
      
      const dateInput = screen.getByLabelText('Date du rappel');
      await user.type(dateInput, '2020-01-01');
      
      // Vérifier que l'erreur est associée au champ
      expect(dateInput).toHaveAttribute('aria-describedby', 'date-error');
      expect(dateInput).toHaveAttribute('aria-invalid', 'true');
      
      const errorMessage = screen.getByText('Date invalide');
      expect(errorMessage).toHaveAttribute('id', 'date-error');
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ReminderDialog {...dialogProps} />);
      
      // Tester la navigation avec Tab
      await user.tab();
      expect(screen.getByLabelText('Date du rappel')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText('Heure du rappel')).toHaveFocus();
      
      // Continuer jusqu'aux boutons
      await user.tab(); // Quantité
      await user.tab(); // Unité
      await user.tab(); // Annuler
      expect(screen.getByText('Annuler')).toHaveFocus();
      
      await user.tab(); // Sauvegarder
      expect(screen.getByText('Sauvegarder')).toHaveFocus();
    });

    it('should close with Escape key', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();
      
      render(<ReminderDialog {...dialogProps} onClose={mockOnClose} />);
      
      await user.keyboard('{Escape}');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should have proper button states', () => {
      render(<ReminderDialog {...dialogProps} />);
      
      const saveButton = screen.getByText('Sauvegarder');
      const cancelButton = screen.getByText('Annuler');
      
      // Le bouton de sauvegarde devrait être désactivé initialement
      expect(saveButton).toBeDisabled();
      expect(cancelButton).not.toBeDisabled();
    });
  });

  describe('RelativeDateSelector Accessibility', () => {
    const selectorProps = {
      onDateChange: jest.fn(),
      currentDate: '2024-01-15'
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<RelativeDateSelector {...selectorProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have properly labeled inputs', () => {
      render(<RelativeDateSelector {...selectorProps} />);
      
      // Vérifier les labels
      expect(screen.getByLabelText('Quantité pour le calcul de date relative')).toBeInTheDocument();
      expect(screen.getByLabelText('Unité de temps pour le calcul de date relative')).toBeInTheDocument();
    });

    it('should have proper help text associations', () => {
      render(<RelativeDateSelector {...selectorProps} />);
      
      const quantityInput = screen.getByLabelText('Quantité pour le calcul de date relative');
      expect(quantityInput).toHaveAttribute('aria-describedby', 'quantity-help');
      
      const helpText = screen.getByText(/Saisissez un nombre entre 1 et 999/);
      expect(helpText).toHaveAttribute('id', 'quantity-help');
    });

    it('should announce preview changes', async () => {
      const user = userEvent.setup();
      render(<RelativeDateSelector {...selectorProps} />);
      
      const quantityInput = screen.getByLabelText('Quantité pour le calcul de date relative');
      await user.type(quantityInput, '5');
      
      // Vérifier que la prévisualisation a les attributs ARIA appropriés
      const preview = screen.getByText(/Dans.*jours/);
      expect(preview).toHaveAttribute('role', 'status');
      expect(preview).toHaveAttribute('aria-live', 'polite');
    });

    it('should announce errors assertively', async () => {
      const user = userEvent.setup();
      mockDateCalculationService.isValidQuantity.mockReturnValue(false);
      
      render(<RelativeDateSelector {...selectorProps} />);
      
      const quantityInput = screen.getByLabelText('Quantité pour le calcul de date relative');
      await user.type(quantityInput, '0');
      
      const errorMessage = screen.getByText('Veuillez saisir un nombre entre 1 et 999');
      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
    });

    it('should support mobile input modes', () => {
      render(<RelativeDateSelector {...selectorProps} />);
      
      const quantityInput = screen.getByLabelText('Quantité pour le calcul de date relative');
      expect(quantityInput).toHaveAttribute('inputMode', 'numeric');
      expect(quantityInput).toHaveClass('touch-manipulation');
    });

    it('should have proper select accessibility', async () => {
      const user = userEvent.setup();
      render(<RelativeDateSelector {...selectorProps} />);
      
      const unitSelect = screen.getByLabelText('Unité de temps pour le calcul de date relative');
      expect(unitSelect).toHaveAttribute('aria-describedby', 'unit-help');
      
      // Ouvrir le select
      await user.click(unitSelect);
      
      // Vérifier que les options sont accessibles
      expect(screen.getByText('semaine(s)')).toBeInTheDocument();
      expect(screen.getByText('mois')).toBeInTheDocument();
      expect(screen.getByText('année(s)')).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      // Simuler un écran mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
    });

    it('should adapt dialog layout for mobile', () => {
      render(
        <ReminderDialog
          isOpen={true}
          onClose={jest.fn()}
          contact={mockContact}
          onSave={jest.fn()}
        />
      );
      
      // Vérifier que le dialog a une largeur adaptée au mobile
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('w-[95vw]');
    });

    it('should stack form elements on mobile', () => {
      render(
        <ReminderDialog
          isOpen={true}
          onClose={jest.fn()}
          contact={mockContact}
          onSave={jest.fn()}
        />
      );
      
      // Vérifier que les champs de date/heure sont empilés sur mobile
      const dateTimeContainer = screen.getByLabelText('Date du rappel').closest('.grid');
      expect(dateTimeContainer).toHaveClass('grid-cols-1');
      expect(dateTimeContainer).toHaveClass('sm:grid-cols-2');
    });

    it('should stack action buttons on mobile', () => {
      render(
        <ReminderDialog
          isOpen={true}
          onClose={jest.fn()}
          contact={mockContact}
          onSave={jest.fn()}
        />
      );
      
      const saveButton = screen.getByText('Sauvegarder');
      const cancelButton = screen.getByText('Annuler');
      
      // Vérifier que les boutons ont les classes appropriées pour mobile
      expect(saveButton).toHaveClass('w-full');
      expect(saveButton).toHaveClass('sm:w-auto');
      expect(cancelButton).toHaveClass('w-full');
      expect(cancelButton).toHaveClass('sm:w-auto');
    });

    it('should have touch-friendly controls', () => {
      render(<RelativeDateSelector onDateChange={jest.fn()} currentDate="2024-01-15" />);
      
      const quantityInput = screen.getByLabelText('Quantité pour le calcul de date relative');
      const unitSelect = screen.getByLabelText('Unité de temps pour le calcul de date relative');
      
      expect(quantityInput).toHaveClass('touch-manipulation');
      expect(unitSelect).toHaveClass('touch-manipulation');
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide meaningful region labels', () => {
      render(<RelativeDateSelector onDateChange={jest.fn()} currentDate="2024-01-15" />);
      
      const helpRegion = screen.getByRole('region');
      expect(helpRegion).toHaveAttribute('aria-label', 'Aide pour la sélection de date relative');
    });

    it('should provide hidden help text for complex controls', () => {
      render(<RelativeDateSelector onDateChange={jest.fn()} currentDate="2024-01-15" />);
      
      const hiddenHelp = screen.getByText('Choisissez l\'unité de temps : jours, semaines, mois ou années');
      expect(hiddenHelp).toHaveClass('sr-only');
      expect(hiddenHelp).toHaveAttribute('id', 'unit-help');
    });

    it('should announce dynamic content changes', async () => {
      const user = userEvent.setup();
      render(<RelativeDateSelector onDateChange={jest.fn()} currentDate="2024-01-15" />);
      
      const quantityInput = screen.getByLabelText('Quantité pour le calcul de date relative');
      await user.type(quantityInput, '7');
      
      // La prévisualisation devrait être annoncée
      const preview = screen.getByRole('status');
      expect(preview).toHaveAttribute('aria-live', 'polite');
      expect(preview).toHaveAttribute('aria-label', 'Aperçu de la date calculée');
    });
  });
});