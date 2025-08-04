import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReminderDialog } from '../ReminderDialog';
import { Contact, ContactStatus } from '../../types';

// Mock du service de calcul de dates
jest.mock('../../services/dateCalculationService', () => ({
  DateCalculationService: {
    validateDateRange: jest.fn(),
    isValidTimeFormat: jest.fn(),
  }
}));

// Mock du composant RelativeDateSelector
jest.mock('../RelativeDateSelector', () => ({
  RelativeDateSelector: ({ onDateChange, currentDate }: any) => (
    <div data-testid="relative-date-selector">
      <button onClick={() => onDateChange('2024-01-20')}>
        Set Relative Date
      </button>
      <span>Current: {currentDate}</span>
    </div>
  )
}));

const mockDateCalculationService = require('../../services/dateCalculationService').DateCalculationService;

describe('ReminderDialog', () => {
  const mockContact: Contact = {
    id: '1',
    numeroLigne: 1,
    prenom: 'Gérard',
    nom: 'Dupont',
    telephone: '0123456789',
    email: 'gerard@example.com',
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
    mockDateCalculationService.validateDateRange.mockReturnValue({ isValid: true });
    mockDateCalculationService.isValidTimeFormat.mockReturnValue(true);
  });

  it('should render dialog with contact information', () => {
    render(<ReminderDialog {...defaultProps} />);
    
    expect(screen.getByText('Programmer un Rappel')).toBeInTheDocument();
    expect(screen.getByText('Contact: Gérard Dupont')).toBeInTheDocument();
  });

  it('should render manual date and time inputs', () => {
    render(<ReminderDialog {...defaultProps} />);
    
    expect(screen.getByLabelText('Date du rappel')).toBeInTheDocument();
    expect(screen.getByLabelText('Heure du rappel')).toBeInTheDocument();
  });

  it('should render RelativeDateSelector component', () => {
    render(<ReminderDialog {...defaultProps} />);
    
    expect(screen.getByTestId('relative-date-selector')).toBeInTheDocument();
  });

  it('should initialize with provided initial values', () => {
    render(
      <ReminderDialog 
        {...defaultProps} 
        initialDate="2024-01-15"
        initialTime="10:30"
      />
    );
    
    const dateInput = screen.getByLabelText('Date du rappel') as HTMLInputElement;
    const timeInput = screen.getByLabelText('Heure du rappel') as HTMLInputElement;
    
    expect(dateInput.value).toBe('2024-01-15');
    expect(timeInput.value).toBe('10:30');
  });

  it('should handle manual date change', async () => {
    const user = userEvent.setup();
    render(<ReminderDialog {...defaultProps} />);
    
    const dateInput = screen.getByLabelText('Date du rappel');
    await user.type(dateInput, '2024-01-20');
    
    expect(mockDateCalculationService.validateDateRange).toHaveBeenCalledWith('2024-01-20');
  });

  it('should handle manual time change', async () => {
    const user = userEvent.setup();
    render(<ReminderDialog {...defaultProps} />);
    
    const timeInput = screen.getByLabelText('Heure du rappel');
    await user.type(timeInput, '14:30');
    
    expect(mockDateCalculationService.isValidTimeFormat).toHaveBeenCalledWith('14:30');
  });

  it('should handle relative date change', async () => {
    const user = userEvent.setup();
    render(<ReminderDialog {...defaultProps} />);
    
    const relativeDateButton = screen.getByText('Set Relative Date');
    await user.click(relativeDateButton);
    
    // Vérifier que la date a été mise à jour
    expect(screen.getByText('Current: 2024-01-20')).toBeInTheDocument();
  });

  it('should display date validation errors', async () => {
    const user = userEvent.setup();
    mockDateCalculationService.validateDateRange.mockReturnValue({
      isValid: false,
      errorMessage: 'Date invalide'
    });
    
    render(<ReminderDialog {...defaultProps} />);
    
    const dateInput = screen.getByLabelText('Date du rappel');
    await user.type(dateInput, '2020-01-01');
    
    await waitFor(() => {
      expect(screen.getByText('Date invalide')).toBeInTheDocument();
    });
  });

  it('should display time validation errors', async () => {
    const user = userEvent.setup();
    mockDateCalculationService.isValidTimeFormat.mockReturnValue(false);
    
    render(<ReminderDialog {...defaultProps} />);
    
    const timeInput = screen.getByLabelText('Heure du rappel');
    await user.type(timeInput, '25:00');
    
    await waitFor(() => {
      expect(screen.getByText('Format d\'heure invalide (HH:mm)')).toBeInTheDocument();
    });
  });

  it('should disable save button when form is invalid', () => {
    render(<ReminderDialog {...defaultProps} />);
    
    const saveButton = screen.getByText('Sauvegarder');
    expect(saveButton).toBeDisabled();
  });

  it('should enable save button when form is valid', async () => {
    const user = userEvent.setup();
    render(<ReminderDialog {...defaultProps} />);
    
    const dateInput = screen.getByLabelText('Date du rappel');
    const timeInput = screen.getByLabelText('Heure du rappel');
    
    await user.type(dateInput, '2024-01-20');
    await user.type(timeInput, '14:30');
    
    const saveButton = screen.getByText('Sauvegarder');
    expect(saveButton).not.toBeDisabled();
  });

  it('should call onSave with correct values when save is clicked', async () => {
    const user = userEvent.setup();
    const mockOnSave = jest.fn();
    
    render(<ReminderDialog {...defaultProps} onSave={mockOnSave} />);
    
    const dateInput = screen.getByLabelText('Date du rappel');
    const timeInput = screen.getByLabelText('Heure du rappel');
    
    await user.type(dateInput, '2024-01-20');
    await user.type(timeInput, '14:30');
    
    const saveButton = screen.getByText('Sauvegarder');
    await user.click(saveButton);
    
    expect(mockOnSave).toHaveBeenCalledWith('2024-01-20', '14:30');
  });

  it('should call onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();
    
    render(<ReminderDialog {...defaultProps} onClose={mockOnClose} />);
    
    const cancelButton = screen.getByText('Annuler');
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();
    
    render(<ReminderDialog {...defaultProps} onClose={mockOnClose} />);
    
    const closeButton = screen.getByLabelText('Fermer');
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should reset state when dialog opens', () => {
    const { rerender } = render(
      <ReminderDialog {...defaultProps} isOpen={false} />
    );
    
    // Ouvrir le dialog avec des valeurs initiales
    rerender(
      <ReminderDialog 
        {...defaultProps} 
        isOpen={true}
        initialDate="2024-01-15"
        initialTime="10:30"
      />
    );
    
    const dateInput = screen.getByLabelText('Date du rappel') as HTMLInputElement;
    const timeInput = screen.getByLabelText('Heure du rappel') as HTMLInputElement;
    
    expect(dateInput.value).toBe('2024-01-15');
    expect(timeInput.value).toBe('10:30');
  });

  it('should not render when isOpen is false', () => {
    render(<ReminderDialog {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Programmer un Rappel')).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<ReminderDialog {...defaultProps} />);
    
    const dateInput = screen.getByLabelText('Date du rappel');
    const timeInput = screen.getByLabelText('Heure du rappel');
    const closeButton = screen.getByLabelText('Fermer');
    
    expect(dateInput).toBeInTheDocument();
    expect(timeInput).toBeInTheDocument();
    expect(closeButton).toBeInTheDocument();
  });

  it('should clear date errors when using relative selector', async () => {
    const user = userEvent.setup();
    mockDateCalculationService.validateDateRange.mockReturnValue({
      isValid: false,
      errorMessage: 'Date invalide'
    });
    
    render(<ReminderDialog {...defaultProps} />);
    
    // Créer une erreur de date
    const dateInput = screen.getByLabelText('Date du rappel');
    await user.type(dateInput, '2020-01-01');
    
    await waitFor(() => {
      expect(screen.getByText('Date invalide')).toBeInTheDocument();
    });
    
    // Utiliser le sélecteur relatif
    const relativeDateButton = screen.getByText('Set Relative Date');
    await user.click(relativeDateButton);
    
    // L'erreur devrait disparaître
    await waitFor(() => {
      expect(screen.queryByText('Date invalide')).not.toBeInTheDocument();
    });
  });
});