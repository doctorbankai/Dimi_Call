import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReminderDialog } from '../../components/ReminderDialog';
import { RelativeDateSelector } from '../../components/RelativeDateSelector';
import { Contact, ContactStatus } from '../../types';

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

describe('Reminder Validation and Error Handling', () => {
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

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    contact: mockContact,
    onSave: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configuration par défaut des mocks
    mockDateCalculationService.validateDateRange.mockReturnValue({ isValid: true });
    mockDateCalculationService.isValidTimeFormat.mockReturnValue(true);
    mockDateCalculationService.isValidDateFormat.mockReturnValue(true);
    mockDateCalculationService.calculateFutureDate.mockReturnValue('2024-01-20');
    mockDateCalculationService.getPreviewText.mockReturnValue('Dans 5 jours');
    mockDateCalculationService.formatDateForDisplay.mockReturnValue('samedi 20 janvier 2024');
    mockDateCalculationService.isValidQuantity.mockReturnValue(true);
  });

  describe('ReminderDialog Validation', () => {
    it('should show required field errors when trying to save empty form', async () => {
      const user = userEvent.setup();
      render(<ReminderDialog {...defaultProps} />);
      
      const saveButton = screen.getByText('Sauvegarder');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('La date est obligatoire')).toBeInTheDocument();
        expect(screen.getByText('L\'heure est obligatoire')).toBeInTheDocument();
      });
    });

    it('should validate date format on manual input', async () => {
      const user = userEvent.setup();
      mockDateCalculationService.isValidDateFormat.mockReturnValue(false);
      
      render(<ReminderDialog {...defaultProps} />);
      
      const dateInput = screen.getByLabelText('Date du rappel');
      const saveButton = screen.getByText('Sauvegarder');
      
      await user.type(dateInput, 'invalid-date');
      await user.type(screen.getByLabelText('Heure du rappel'), '14:30');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Format de date invalide')).toBeInTheDocument();
      });
    });

    it('should validate time format on manual input', async () => {
      const user = userEvent.setup();
      mockDateCalculationService.isValidTimeFormat.mockReturnValue(false);
      
      render(<ReminderDialog {...defaultProps} />);
      
      const timeInput = screen.getByLabelText('Heure du rappel');
      const saveButton = screen.getByText('Sauvegarder');
      
      await user.type(screen.getByLabelText('Date du rappel'), '2024-01-20');
      await user.type(timeInput, '25:00');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Format d\'heure invalide (HH:mm)')).toBeInTheDocument();
      });
    });

    it('should validate date range and show error', async () => {
      const user = userEvent.setup();
      mockDateCalculationService.validateDateRange.mockReturnValue({
        isValid: false,
        errorMessage: 'La date ne peut pas être dans le passé'
      });
      
      render(<ReminderDialog {...defaultProps} />);
      
      const dateInput = screen.getByLabelText('Date du rappel');
      await user.type(dateInput, '2020-01-01');
      
      await waitFor(() => {
        expect(screen.getByText('La date ne peut pas être dans le passé')).toBeInTheDocument();
      });
    });

    it('should disable save button when form is invalid', async () => {
      const user = userEvent.setup();
      mockDateCalculationService.validateDateRange.mockReturnValue({
        isValid: false,
        errorMessage: 'Date invalide'
      });
      
      render(<ReminderDialog {...defaultProps} />);
      
      const dateInput = screen.getByLabelText('Date du rappel');
      const timeInput = screen.getByLabelText('Heure du rappel');
      const saveButton = screen.getByText('Sauvegarder');
      
      await user.type(dateInput, '2020-01-01');
      await user.type(timeInput, '14:30');
      
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when form becomes valid', async () => {
      const user = userEvent.setup();
      render(<ReminderDialog {...defaultProps} />);
      
      const dateInput = screen.getByLabelText('Date du rappel');
      const timeInput = screen.getByLabelText('Heure du rappel');
      const saveButton = screen.getByText('Sauvegarder');
      
      // Initialement désactivé
      expect(saveButton).toBeDisabled();
      
      // Remplir le formulaire
      await user.type(dateInput, '2024-01-20');
      await user.type(timeInput, '14:30');
      
      // Maintenant activé
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe('RelativeDateSelector Validation', () => {
    const relativeSelectorProps = {
      onDateChange: jest.fn(),
      currentDate: '2024-01-15'
    };

    it('should validate quantity input range', async () => {
      const user = userEvent.setup();
      mockDateCalculationService.isValidQuantity.mockReturnValue(false);
      
      render(<RelativeDateSelector {...relativeSelectorProps} />);
      
      const quantityInput = screen.getByPlaceholderText('1');
      await user.type(quantityInput, '0');
      
      await waitFor(() => {
        expect(screen.getByText('Veuillez saisir un nombre entre 1 et 999')).toBeInTheDocument();
      });
    });

    it('should show error for dates too far in future', async () => {
      const user = userEvent.setup();
      mockDateCalculationService.validateDateRange.mockReturnValue({
        isValid: false,
        errorMessage: 'La date ne peut pas dépasser 10 ans dans le futur'
      });
      
      render(<RelativeDateSelector {...relativeSelectorProps} />);
      
      const quantityInput = screen.getByPlaceholderText('1');
      await user.type(quantityInput, '999');
      
      await waitFor(() => {
        expect(screen.getByText('La date ne peut pas dépasser 10 ans dans le futur')).toBeInTheDocument();
      });
    });

    it('should show warning for dates very far in future', async () => {
      const user = userEvent.setup();
      mockDateCalculationService.validateDateRange.mockReturnValue({
        isValid: true,
        warningMessage: 'Cette date est très éloignée dans le futur'
      });
      
      render(<RelativeDateSelector {...relativeSelectorProps} />);
      
      const quantityInput = screen.getByPlaceholderText('1');
      await user.type(quantityInput, '100');
      
      await waitFor(() => {
        expect(screen.getByText('Cette date est très éloignée dans le futur')).toBeInTheDocument();
      });
    });

    it('should handle calculation errors gracefully', async () => {
      const user = userEvent.setup();
      mockDateCalculationService.calculateFutureDate.mockImplementation(() => {
        throw new Error('Calculation error');
      });
      
      render(<RelativeDateSelector {...relativeSelectorProps} />);
      
      const quantityInput = screen.getByPlaceholderText('1');
      await user.type(quantityInput, '5');
      
      await waitFor(() => {
        expect(screen.getByText('Erreur lors du calcul de la date')).toBeInTheDocument();
      });
    });

    it('should ignore non-numeric input in quantity field', async () => {
      const user = userEvent.setup();
      render(<RelativeDateSelector {...relativeSelectorProps} />);
      
      const quantityInput = screen.getByPlaceholderText('1');
      await user.type(quantityInput, 'abc');
      
      // L'input ne devrait pas avoir changé
      expect(quantityInput).toHaveValue(null);
      expect(mockDateCalculationService.calculateFutureDate).not.toHaveBeenCalled();
    });

    it('should clear preview and errors when quantity is cleared', async () => {
      const user = userEvent.setup();
      render(<RelativeDateSelector {...relativeSelectorProps} />);
      
      const quantityInput = screen.getByPlaceholderText('1');
      
      // Saisir une quantité valide
      await user.type(quantityInput, '5');
      
      // Vérifier que la prévisualisation apparaît
      await waitFor(() => {
        expect(screen.getByText(/Dans.*jours/)).toBeInTheDocument();
      });
      
      // Effacer la quantité
      await user.clear(quantityInput);
      
      // La prévisualisation devrait disparaître
      await waitFor(() => {
        expect(screen.queryByText(/Dans.*jours/)).not.toBeInTheDocument();
      });
    });

    it('should validate quantity limits (1-999)', async () => {
      const user = userEvent.setup();
      
      // Test pour 0
      mockDateCalculationService.isValidQuantity.mockImplementation((qty) => qty >= 1 && qty <= 999);
      
      render(<RelativeDateSelector {...relativeSelectorProps} />);
      
      const quantityInput = screen.getByPlaceholderText('1');
      
      // Test quantité trop petite
      await user.type(quantityInput, '0');
      await waitFor(() => {
        expect(screen.getByText('Veuillez saisir un nombre entre 1 et 999')).toBeInTheDocument();
      });
      
      // Effacer et tester quantité trop grande
      await user.clear(quantityInput);
      await user.type(quantityInput, '1000');
      await waitFor(() => {
        expect(screen.getByText('Veuillez saisir un nombre entre 1 et 999')).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery', () => {
    it('should clear errors when switching from manual to relative input', async () => {
      const user = userEvent.setup();
      mockDateCalculationService.validateDateRange.mockReturnValue({
        isValid: false,
        errorMessage: 'Date invalide'
      });
      
      render(<ReminderDialog {...defaultProps} />);
      
      // Créer une erreur avec la saisie manuelle
      const dateInput = screen.getByLabelText('Date du rappel');
      await user.type(dateInput, '2020-01-01');
      
      await waitFor(() => {
        expect(screen.getByText('Date invalide')).toBeInTheDocument();
      });
      
      // Utiliser le sélecteur relatif
      mockDateCalculationService.validateDateRange.mockReturnValue({ isValid: true });
      const quantityInput = screen.getByPlaceholderText('1');
      await user.type(quantityInput, '5');
      
      // L'erreur devrait disparaître
      await waitFor(() => {
        expect(screen.queryByText('Date invalide')).not.toBeInTheDocument();
      });
    });

    it('should maintain time validation independently of date validation', async () => {
      const user = userEvent.setup();
      mockDateCalculationService.isValidTimeFormat.mockReturnValue(false);
      
      render(<ReminderDialog {...defaultProps} />);
      
      const dateInput = screen.getByLabelText('Date du rappel');
      const timeInput = screen.getByLabelText('Heure du rappel');
      
      // Saisir une date valide et une heure invalide
      await user.type(dateInput, '2024-01-20');
      await user.type(timeInput, '25:00');
      
      await waitFor(() => {
        expect(screen.getByText('Format d\'heure invalide (HH:mm)')).toBeInTheDocument();
      });
      
      // Utiliser le sélecteur relatif pour la date
      const quantityInput = screen.getByPlaceholderText('1');
      await user.type(quantityInput, '5');
      
      // L'erreur d'heure devrait persister
      expect(screen.getByText('Format d\'heure invalide (HH:mm)')).toBeInTheDocument();
    });
  });
});