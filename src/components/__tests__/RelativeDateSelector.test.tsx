import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RelativeDateSelector } from '../RelativeDateSelector';

// Mock du service de calcul de dates
jest.mock('../../services/dateCalculationService', () => ({
  DateCalculationService: {
    calculateFutureDate: jest.fn(),
    validateDateRange: jest.fn(),
    getPreviewText: jest.fn(),
    formatDateForDisplay: jest.fn(),
    isValidQuantity: jest.fn(),
  }
}));

const mockDateCalculationService = require('../../services/dateCalculationService').DateCalculationService;

describe('RelativeDateSelector', () => {
  const mockOnDateChange = jest.fn();
  const defaultProps = {
    onDateChange: mockOnDateChange,
    currentDate: '2024-01-15'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configuration par défaut des mocks
    mockDateCalculationService.isValidQuantity.mockReturnValue(true);
    mockDateCalculationService.calculateFutureDate.mockReturnValue('2024-01-20');
    mockDateCalculationService.validateDateRange.mockReturnValue({ isValid: true });
    mockDateCalculationService.getPreviewText.mockReturnValue('Dans 5 jours');
    mockDateCalculationService.formatDateForDisplay.mockReturnValue('samedi 20 janvier 2024');
  });

  it('should render with default state', () => {
    render(<RelativeDateSelector {...defaultProps} />);
    
    expect(screen.getByText('Sélection rapide')).toBeInTheDocument();
    expect(screen.getByText('Dans')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jour(s)')).toBeInTheDocument();
  });

  it('should calculate date when quantity is entered', async () => {
    const user = userEvent.setup();
    render(<RelativeDateSelector {...defaultProps} />);
    
    const quantityInput = screen.getByPlaceholderText('1');
    await user.type(quantityInput, '5');
    
    await waitFor(() => {
      expect(mockDateCalculationService.calculateFutureDate).toHaveBeenCalledWith(5, 'days');
      expect(mockOnDateChange).toHaveBeenCalledWith('2024-01-20');
    });
  });

  it('should update unit and recalculate', async () => {
    const user = userEvent.setup();
    render(<RelativeDateSelector {...defaultProps} />);
    
    // Saisir une quantité d'abord
    const quantityInput = screen.getByPlaceholderText('1');
    await user.type(quantityInput, '2');
    
    // Changer l'unité
    const unitSelect = screen.getByDisplayValue('jour(s)');
    await user.click(unitSelect);
    await user.click(screen.getByText('semaine(s)'));
    
    await waitFor(() => {
      expect(mockDateCalculationService.calculateFutureDate).toHaveBeenCalledWith(2, 'weeks');
    });
  });

  it('should display preview text when calculation is successful', async () => {
    const user = userEvent.setup();
    render(<RelativeDateSelector {...defaultProps} />);
    
    const quantityInput = screen.getByPlaceholderText('1');
    await user.type(quantityInput, '3');
    
    await waitFor(() => {
      expect(screen.getByText('Dans 3 jours (samedi 20 janvier 2024)')).toBeInTheDocument();
    });
  });

  it('should display error for invalid quantity', async () => {
    const user = userEvent.setup();
    mockDateCalculationService.isValidQuantity.mockReturnValue(false);
    
    render(<RelativeDateSelector {...defaultProps} />);
    
    const quantityInput = screen.getByPlaceholderText('1');
    await user.type(quantityInput, '0');
    
    await waitFor(() => {
      expect(screen.getByText('Veuillez saisir un nombre entre 1 et 999')).toBeInTheDocument();
    });
  });

  it('should display error for invalid date range', async () => {
    const user = userEvent.setup();
    mockDateCalculationService.validateDateRange.mockReturnValue({
      isValid: false,
      errorMessage: 'Date trop éloignée'
    });
    
    render(<RelativeDateSelector {...defaultProps} />);
    
    const quantityInput = screen.getByPlaceholderText('1');
    await user.type(quantityInput, '100');
    
    await waitFor(() => {
      expect(screen.getByText('Date trop éloignée')).toBeInTheDocument();
    });
  });

  it('should display warning for dates far in future', async () => {
    const user = userEvent.setup();
    mockDateCalculationService.validateDateRange.mockReturnValue({
      isValid: true,
      warningMessage: 'Cette date est très éloignée dans le futur'
    });
    
    render(<RelativeDateSelector {...defaultProps} />);
    
    const quantityInput = screen.getByPlaceholderText('1');
    await user.type(quantityInput, '50');
    
    await waitFor(() => {
      expect(screen.getByText('Cette date est très éloignée dans le futur')).toBeInTheDocument();
    });
  });

  it('should clear state when empty quantity is entered', async () => {
    const user = userEvent.setup();
    render(<RelativeDateSelector {...defaultProps} />);
    
    const quantityInput = screen.getByPlaceholderText('1');
    await user.type(quantityInput, '5');
    await user.clear(quantityInput);
    
    await waitFor(() => {
      expect(screen.queryByText(/Dans.*jours/)).not.toBeInTheDocument();
    });
  });

  it('should ignore non-numeric input', async () => {
    const user = userEvent.setup();
    render(<RelativeDateSelector {...defaultProps} />);
    
    const quantityInput = screen.getByPlaceholderText('1');
    await user.type(quantityInput, 'abc');
    
    // L'input ne devrait pas avoir changé
    expect(quantityInput).toHaveValue(null);
    expect(mockDateCalculationService.calculateFutureDate).not.toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<RelativeDateSelector {...defaultProps} disabled={true} />);
    
    const quantityInput = screen.getByPlaceholderText('1');
    const unitSelect = screen.getByDisplayValue('jour(s)');
    
    expect(quantityInput).toBeDisabled();
    expect(unitSelect).toBeDisabled();
  });

  it('should reset when currentDate changes externally', () => {
    const { rerender } = render(<RelativeDateSelector {...defaultProps} />);
    
    // Simuler une sélection
    const quantityInput = screen.getByPlaceholderText('1');
    fireEvent.change(quantityInput, { target: { value: '5' } });
    
    // Changer la date externe (sélection manuelle)
    rerender(<RelativeDateSelector {...defaultProps} currentDate="2024-02-01" />);
    
    // Les sélecteurs devraient être réinitialisés
    expect(quantityInput).toHaveValue(null);
  });

  it('should have proper accessibility attributes', () => {
    render(<RelativeDateSelector {...defaultProps} />);
    
    const quantityInput = screen.getByLabelText('Quantité');
    const unitSelect = screen.getByLabelText('Unité de temps');
    
    expect(quantityInput).toBeInTheDocument();
    expect(unitSelect).toBeInTheDocument();
  });

  it('should handle calculation errors gracefully', async () => {
    const user = userEvent.setup();
    mockDateCalculationService.calculateFutureDate.mockImplementation(() => {
      throw new Error('Calculation error');
    });
    
    render(<RelativeDateSelector {...defaultProps} />);
    
    const quantityInput = screen.getByPlaceholderText('1');
    await user.type(quantityInput, '5');
    
    await waitFor(() => {
      expect(screen.getByText('Erreur lors du calcul de la date')).toBeInTheDocument();
    });
  });

  it('should render all time unit options', async () => {
    const user = userEvent.setup();
    render(<RelativeDateSelector {...defaultProps} />);
    
    const unitSelect = screen.getByDisplayValue('jour(s)');
    await user.click(unitSelect);
    
    expect(screen.getByText('jour(s)')).toBeInTheDocument();
    expect(screen.getByText('semaine(s)')).toBeInTheDocument();
    expect(screen.getByText('mois')).toBeInTheDocument();
    expect(screen.getByText('année(s)')).toBeInTheDocument();
  });
});