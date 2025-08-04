import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReminderDialog } from '../../components/ReminderDialog';
import { Contact, ContactStatus } from '../../types';

// Mock du service de calcul de dates
jest.mock('../../services/dateCalculationService', () => ({
  DateCalculationService: {
    calculateFutureDate: jest.fn(),
    validateDateRange: jest.fn(),
    isValidTimeFormat: jest.fn(),
    getPreviewText: jest.fn(),
    formatDateForDisplay: jest.fn(),
    isValidQuantity: jest.fn(),
  }
}));

const mockDateCalculationService = require('../../services/dateCalculationService').DateCalculationService;

describe('Reminder Dialog Synchronization', () => {
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
    mockDateCalculationService.calculateFutureDate.mockReturnValue('2024-01-20');
    mockDateCalculationService.getPreviewText.mockReturnValue('Dans 5 jours');
    mockDateCalculationService.formatDateForDisplay.mockReturnValue('samedi 20 janvier 2024');
    mockDateCalculationService.isValidQuantity.mockReturnValue(true);
  });

  it('should reset relative selectors when manual date is changed', async () => {
    const user = userEvent.setup();
    render(<ReminderDialog {...defaultProps} />);
    
    // D'abord, utiliser le sélecteur relatif
    const quantityInput = screen.getByPlaceholderText('1');
    await user.type(quantityInput, '5');
    
    // Vérifier que le calcul a été fait
    expect(mockDateCalculationService.calculateFutureDate).toHaveBeenCalledWith(5, 'days');
    
    // Maintenant, changer la date manuellement
    const dateInput = screen.getByLabelText('Date du rappel');
    await user.clear(dateInput);
    await user.type(dateInput, '2024-02-01');
    
    // Le sélecteur relatif devrait être réinitialisé
    await waitFor(() => {
      expect(quantityInput).toHaveValue(null);
    });
  });

  it('should update manual date when relative selector is used', async () => {
    const user = userEvent.setup();
    render(<ReminderDialog {...defaultProps} />);
    
    const dateInput = screen.getByLabelText('Date du rappel') as HTMLInputElement;
    const quantityInput = screen.getByPlaceholderText('1');
    
    // Utiliser le sélecteur relatif
    await user.type(quantityInput, '7');
    
    // La date manuelle devrait être mise à jour
    await waitFor(() => {
      expect(dateInput.value).toBe('2024-01-20');
    });
  });

  it('should maintain consistency between both input methods', async () => {
    const user = userEvent.setup();
    render(<ReminderDialog {...defaultProps} />);
    
    const dateInput = screen.getByLabelText('Date du rappel') as HTMLInputElement;
    const quantityInput = screen.getByPlaceholderText('1');
    
    // Étape 1: Utiliser le sélecteur relatif
    await user.type(quantityInput, '3');
    
    await waitFor(() => {
      expect(dateInput.value).toBe('2024-01-20');
    });
    
    // Étape 2: Changer la date manuellement
    await user.clear(dateInput);
    await user.type(dateInput, '2024-01-25');
    
    // Le sélecteur relatif devrait être réinitialisé
    await waitFor(() => {
      expect(quantityInput).toHaveValue(null);
    });
    
    // Étape 3: Utiliser à nouveau le sélecteur relatif
    await user.type(quantityInput, '10');
    
    // La date devrait être recalculée
    await waitFor(() => {
      expect(dateInput.value).toBe('2024-01-20');
    });
  });

  it('should clear relative selectors when manual date is cleared', async () => {
    const user = userEvent.setup();
    render(<ReminderDialog {...defaultProps} />);
    
    const dateInput = screen.getByLabelText('Date du rappel');
    const quantityInput = screen.getByPlaceholderText('1');
    
    // Utiliser le sélecteur relatif
    await user.type(quantityInput, '5');
    
    // Effacer la date manuelle
    await user.clear(dateInput);
    
    // Le sélecteur relatif devrait être réinitialisé
    await waitFor(() => {
      expect(quantityInput).toHaveValue(null);
    });
  });

  it('should handle unit changes while maintaining synchronization', async () => {
    const user = userEvent.setup();
    render(<ReminderDialog {...defaultProps} />);
    
    const dateInput = screen.getByLabelText('Date du rappel') as HTMLInputElement;
    const quantityInput = screen.getByPlaceholderText('1');
    const unitSelect = screen.getByDisplayValue('jour(s)');
    
    // Saisir une quantité
    await user.type(quantityInput, '2');
    
    // Changer l'unité
    await user.click(unitSelect);
    await user.click(screen.getByText('semaine(s)'));
    
    // La date devrait être recalculée avec la nouvelle unité
    expect(mockDateCalculationService.calculateFutureDate).toHaveBeenCalledWith(2, 'weeks');
    
    await waitFor(() => {
      expect(dateInput.value).toBe('2024-01-20');
    });
  });

  it('should preserve time when switching between date input methods', async () => {
    const user = userEvent.setup();
    render(<ReminderDialog {...defaultProps} />);
    
    const timeInput = screen.getByLabelText('Heure du rappel') as HTMLInputElement;
    const dateInput = screen.getByLabelText('Date du rappel');
    const quantityInput = screen.getByPlaceholderText('1');
    
    // Saisir une heure
    await user.type(timeInput, '14:30');
    
    // Utiliser le sélecteur relatif pour la date
    await user.type(quantityInput, '5');
    
    // L'heure devrait être préservée
    expect(timeInput.value).toBe('14:30');
    
    // Changer la date manuellement
    await user.clear(dateInput);
    await user.type(dateInput, '2024-02-01');
    
    // L'heure devrait toujours être préservée
    expect(timeInput.value).toBe('14:30');
  });

  it('should handle calculation errors gracefully during synchronization', async () => {
    const user = userEvent.setup();
    mockDateCalculationService.calculateFutureDate.mockImplementation(() => {
      throw new Error('Calculation error');
    });
    
    render(<ReminderDialog {...defaultProps} />);
    
    const quantityInput = screen.getByPlaceholderText('1');
    
    // Essayer d'utiliser le sélecteur relatif
    await user.type(quantityInput, '5');
    
    // Le composant devrait gérer l'erreur sans planter
    await waitFor(() => {
      expect(screen.getByText('Erreur lors du calcul de la date')).toBeInTheDocument();
    });
  });

  it('should reset state when dialog is reopened', () => {
    const { rerender } = render(
      <ReminderDialog {...defaultProps} isOpen={false} />
    );
    
    // Ouvrir le dialog
    rerender(<ReminderDialog {...defaultProps} isOpen={true} />);
    
    const dateInput = screen.getByLabelText('Date du rappel') as HTMLInputElement;
    const timeInput = screen.getByLabelText('Heure du rappel') as HTMLInputElement;
    const quantityInput = screen.getByPlaceholderText('1');
    
    // Tous les champs devraient être vides
    expect(dateInput.value).toBe('');
    expect(timeInput.value).toBe('');
    expect(quantityInput).toHaveValue(null);
  });

  it('should maintain form validation state during synchronization', async () => {
    const user = userEvent.setup();
    mockDateCalculationService.validateDateRange.mockReturnValue({
      isValid: false,
      errorMessage: 'Date invalide'
    });
    
    render(<ReminderDialog {...defaultProps} />);
    
    const dateInput = screen.getByLabelText('Date du rappel');
    const saveButton = screen.getByText('Sauvegarder');
    
    // Saisir une date invalide manuellement
    await user.type(dateInput, '2020-01-01');
    
    // Le bouton de sauvegarde devrait être désactivé
    expect(saveButton).toBeDisabled();
    
    // Utiliser le sélecteur relatif (qui produit une date valide)
    mockDateCalculationService.validateDateRange.mockReturnValue({ isValid: true });
    const quantityInput = screen.getByPlaceholderText('1');
    await user.type(quantityInput, '5');
    
    // Le bouton de sauvegarde devrait maintenant être activé (si l'heure est aussi valide)
    const timeInput = screen.getByLabelText('Heure du rappel');
    await user.type(timeInput, '14:30');
    
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });
});