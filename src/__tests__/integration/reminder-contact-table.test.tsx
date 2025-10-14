import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactTable } from '../../components/ContactTable';
import { Contact, ContactStatus, Theme } from '../../types';

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

// Mock du service de données
jest.mock('../../services/dataService', () => ({
  formatPhoneNumber: jest.fn((phone) => phone)
}));

const mockDateCalculationService = require('../../services/dateCalculationService').DateCalculationService;

describe('ContactTable Reminder Integration', () => {
  const mockContacts: Contact[] = [
    {
      id: '1',
      numeroLigne: 1,
      prenom: 'Jean',
      nom: 'Dupont',
      telephone: '0123456789',
      email: 'jean@example.com',
      source: 'Test',
      statut: ContactStatus.ARappeler,
      commentaire: 'Test comment',
      dateRappel: '',
      heureRappel: '',
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
      telephone: '0987654321',
      email: 'marie@example.com',
      source: 'Test',
      statut: ContactStatus.NonDefini,
      commentaire: '',
      dateRappel: '2024-01-20',
      heureRappel: '14:30',
      dateRDV: '',
      heureRDV: '',
      dateAppel: '',
      heureAppel: '',
      dureeAppel: ''
    }
  ];

  const defaultProps = {
    contacts: mockContacts,
    callStates: {},
    onSelectContact: jest.fn(),
    selectedContactId: null,
    onUpdateContact: jest.fn(),
    onDeleteContact: jest.fn(),
    activeCallContactId: null,
    theme: Theme.Light,
    visibleColumns: {
      '#': true,
      'Prénom': true,
      'Nom': true,
      'Téléphone': true,
      'Mail': true,
      'Statut': true,
      'Commentaire': true,
      'Date Rappel': true,
      'Heure Rappel': true
    },
    columnHeaders: ['#', 'Prénom', 'Nom', 'Téléphone', 'Mail', 'Statut', 'Commentaire', 'Date Rappel', 'Heure Rappel'],
    contactDataKeys: ['numeroLigne', 'prenom', 'nom', 'telephone', 'email', 'statut', 'commentaire', 'dateRappel', 'heureRappel'],
    onToggleColumnVisibility: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configuration par défaut des mocks
    mockDateCalculationService.validateDateRange.mockReturnValue({ isValid: true });
    mockDateCalculationService.isValidTimeFormat.mockReturnValue(true);
    mockDateCalculationService.isValidDateFormat.mockReturnValue(true);
    mockDateCalculationService.calculateFutureDate.mockReturnValue('2024-01-25');
    mockDateCalculationService.getPreviewText.mockReturnValue('Dans 5 jours');
    mockDateCalculationService.formatDateForDisplay.mockReturnValue('jeudi 25 janvier 2024');
    mockDateCalculationService.isValidQuantity.mockReturnValue(true);
  });

  it('should render reminder buttons next to reminder date', () => {
    render(<ContactTable {...defaultProps} />);
    
    // Vérifier que les boutons de rappel sont présents
    const reminderButtons = screen.getAllByTitle('Programmer un rappel');
    expect(reminderButtons).toHaveLength(2); // Un pour chaque contact
  });

  it('should open reminder dialog when reminder button is clicked', async () => {
    const user = userEvent.setup();
    render(<ContactTable {...defaultProps} />);
    
    // Cliquer sur le premier bouton de rappel
    const reminderButtons = screen.getAllByTitle('Programmer un rappel');
    await user.click(reminderButtons[0]);
    
    // Vérifier que le dialog s'ouvre
    await waitFor(() => {
      expect(screen.getByText('Programmer un Rappel')).toBeInTheDocument();
      expect(screen.getByText('Contact: Jean Dupont')).toBeInTheDocument();
    });
  });

  it('should populate dialog with existing reminder data', async () => {
    const user = userEvent.setup();
    render(<ContactTable {...defaultProps} />);
    
    // Cliquer sur le bouton de rappel du deuxième contact (qui a déjà des données)
    const reminderButtons = screen.getAllByTitle('Programmer un rappel');
    await user.click(reminderButtons[1]);
    
    await waitFor(() => {
      const dateInput = screen.getByLabelText('Date du rappel') as HTMLInputElement;
      const timeInput = screen.getByLabelText('Heure du rappel') as HTMLInputElement;
      
      expect(dateInput.value).toBe('2024-01-20');
      expect(timeInput.value).toBe('14:30');
    });
  });

  it('should save reminder data when dialog is submitted', async () => {
    const user = userEvent.setup();
    const mockOnUpdateContact = jest.fn();
    
    render(<ContactTable {...defaultProps} onUpdateContact={mockOnUpdateContact} />);
    
    // Ouvrir le dialog pour le premier contact
    const reminderButtons = screen.getAllByTitle('Programmer un rappel');
    await user.click(reminderButtons[0]);
    
    // Remplir le formulaire
    await waitFor(() => {
      expect(screen.getByText('Programmer un Rappel')).toBeInTheDocument();
    });
    
    const dateInput = screen.getByLabelText('Date du rappel');
    const timeInput = screen.getByLabelText('Heure du rappel');
    
    await user.type(dateInput, '2024-01-25');
    await user.type(timeInput, '15:00');
    
    // Sauvegarder
    const saveButton = screen.getByText('Sauvegarder');
    await user.click(saveButton);
    
    // Vérifier que onUpdateContact a été appelé avec les bonnes données
    expect(mockOnUpdateContact).toHaveBeenCalledWith({
      id: '1',
      dateRappel: '2024-01-25',
      heureRappel: '15:00'
    });
  });

  it('should close dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<ContactTable {...defaultProps} />);
    
    // Ouvrir le dialog
    const reminderButtons = screen.getAllByTitle('Programmer un rappel');
    await user.click(reminderButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Programmer un Rappel')).toBeInTheDocument();
    });
    
    // Cliquer sur Annuler
    const cancelButton = screen.getByText('Annuler');
    await user.click(cancelButton);
    
    // Le dialog devrait se fermer
    await waitFor(() => {
      expect(screen.queryByText('Programmer un Rappel')).not.toBeInTheDocument();
    });
  });

  it('should use relative date selector in dialog', async () => {
    const user = userEvent.setup();
    render(<ContactTable {...defaultProps} />);
    
    // Ouvrir le dialog
    const reminderButtons = screen.getAllByTitle('Programmer un rappel');
    await user.click(reminderButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Sélection rapide')).toBeInTheDocument();
    });
    
    // Utiliser le sélecteur relatif
    const quantityInput = screen.getByPlaceholderText('1');
    await user.type(quantityInput, '7');
    
    // Vérifier que le calcul a été fait
    expect(mockDateCalculationService.calculateFutureDate).toHaveBeenCalledWith(7, 'days');
    
    // La date manuelle devrait être mise à jour
    const dateInput = screen.getByLabelText('Date du rappel') as HTMLInputElement;
    await waitFor(() => {
      expect(dateInput.value).toBe('2024-01-25');
    });
  });

  it('should handle multiple contacts independently', async () => {
    const user = userEvent.setup();
    const mockOnUpdateContact = jest.fn();
    
    render(<ContactTable {...defaultProps} onUpdateContact={mockOnUpdateContact} />);
    
    // Ouvrir le dialog pour le premier contact
    const reminderButtons = screen.getAllByTitle('Programmer un rappel');
    await user.click(reminderButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Contact: Jean Dupont')).toBeInTheDocument();
    });
    
    // Fermer le dialog
    const cancelButton = screen.getByText('Annuler');
    await user.click(cancelButton);
    
    // Ouvrir le dialog pour le deuxième contact
    await user.click(reminderButtons[1]);
    
    await waitFor(() => {
      expect(screen.getByText('Contact: Marie Martin')).toBeInTheDocument();
    });
    
    // Vérifier que les données du deuxième contact sont chargées
    const dateInput = screen.getByLabelText('Date du rappel') as HTMLInputElement;
    const timeInput = screen.getByLabelText('Heure du rappel') as HTMLInputElement;
    
    expect(dateInput.value).toBe('2024-01-20');
    expect(timeInput.value).toBe('14:30');
  });

  it('should maintain table functionality while dialog is open', async () => {
    const user = userEvent.setup();
    const mockOnSelectContact = jest.fn();
    
    render(<ContactTable {...defaultProps} onSelectContact={mockOnSelectContact} />);
    
    // Ouvrir le dialog
    const reminderButtons = screen.getAllByTitle('Programmer un rappel');
    await user.click(reminderButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Programmer un Rappel')).toBeInTheDocument();
    });
    
    // Essayer de sélectionner un contact (cliquer sur une ligne)
    const contactRow = screen.getByText('Jean');
    await user.click(contactRow);
    
    // La sélection devrait toujours fonctionner
    expect(mockOnSelectContact).toHaveBeenCalled();
  });

  it('should render call buttons alongside reminder buttons', () => {
    render(<ContactTable {...defaultProps} />);
    
    // Vérifier que les boutons d'appel sont aussi présents
    const callButtons = screen.getAllByTitle('Appeler');
    expect(callButtons).toHaveLength(2);
    
    // Vérifier que les boutons de rappel sont présents
    const reminderButtons = screen.getAllByTitle('Programmer un rappel');
    expect(reminderButtons).toHaveLength(2);
  });

  it('should handle dialog errors gracefully', async () => {
    const user = userEvent.setup();
    mockDateCalculationService.validateDateRange.mockReturnValue({
      isValid: false,
      errorMessage: 'Date invalide'
    });
    
    render(<ContactTable {...defaultProps} />);
    
    // Ouvrir le dialog
    const reminderButtons = screen.getAllByTitle('Programmer un rappel');
    await user.click(reminderButtons[0]);
    
    // Saisir une date invalide
    const dateInput = screen.getByLabelText('Date du rappel');
    await user.type(dateInput, '2020-01-01');
    
    // Vérifier que l'erreur s'affiche
    await waitFor(() => {
      expect(screen.getByText('Date invalide')).toBeInTheDocument();
    });
    
    // Le bouton de sauvegarde devrait être désactivé
    const saveButton = screen.getByText('Sauvegarder');
    expect(saveButton).toBeDisabled();
  });
});

