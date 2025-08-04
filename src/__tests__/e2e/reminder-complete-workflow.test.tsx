import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactTable } from '../../components/ContactTable';
import { Contact, ContactStatus, Theme } from '../../types';

// Mock du service de calcul de dates avec implémentation réelle
jest.mock('../../services/dateCalculationService', () => {
  const originalModule = jest.requireActual('../../services/dateCalculationService');
  return {
    ...originalModule,
    DateCalculationService: {
      ...originalModule.DateCalculationService,
      getCurrentDateISO: jest.fn(() => '2024-01-15'),
    }
  };
});

// Mock du service de données
jest.mock('../../services/dataService', () => ({
  formatPhoneNumber: jest.fn((phone) => phone)
}));

describe('Reminder Complete User Workflows E2E', () => {
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
      commentaire: 'Premier contact',
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
      commentaire: 'Deuxième contact',
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
      'Heure Rappel': true,
      'Actions': true
    },
    columnHeaders: ['#', 'Prénom', 'Nom', 'Téléphone', 'Mail', 'Statut', 'Commentaire', 'Date Rappel', 'Heure Rappel', 'Actions'],
    contactDataKeys: ['numeroLigne', 'prenom', 'nom', 'telephone', 'email', 'statut', 'commentaire', 'dateRappel', 'heureRappel', 'actions'],
    onToggleColumnVisibility: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock la date actuelle pour des tests prévisibles
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Complete Reminder Scheduling Workflow', () => {
    it('should complete full workflow: open dialog → manual date selection → save → verify update', async () => {
      const user = userEvent.setup();
      const mockOnUpdateContact = jest.fn();
      
      render(<ContactTable {...defaultProps} onUpdateContact={mockOnUpdateContact} />);
      
      // Étape 1: Ouvrir le dialog de rappel pour le premier contact
      const reminderButtons = screen.getAllByTitle('Programmer un rappel');
      await user.click(reminderButtons[0]);
      
      // Vérifier que le dialog s'ouvre avec les bonnes informations
      await waitFor(() => {
        expect(screen.getByText('Programmer un Rappel')).toBeInTheDocument();
        expect(screen.getByText('Contact: Jean Dupont')).toBeInTheDocument();
      });
      
      // Étape 2: Saisir une date et une heure manuellement
      const dateInput = screen.getByLabelText('Date du rappel');
      const timeInput = screen.getByLabelText('Heure du rappel');
      
      await user.type(dateInput, '2024-01-25');
      await user.type(timeInput, '15:30');
      
      // Vérifier que les champs sont remplis
      expect(dateInput).toHaveValue('2024-01-25');
      expect(timeInput).toHaveValue('15:30');
      
      // Étape 3: Sauvegarder
      const saveButton = screen.getByText('Sauvegarder');
      expect(saveButton).not.toBeDisabled();
      
      await user.click(saveButton);
      
      // Étape 4: Vérifier que la mise à jour a été appelée avec les bonnes données
      expect(mockOnUpdateContact).toHaveBeenCalledWith({
        id: '1',
        dateRappel: '2024-01-25',
        heureRappel: '15:30'
      });
      
      // Étape 5: Vérifier que le dialog se ferme
      await waitFor(() => {
        expect(screen.queryByText('Programmer un Rappel')).not.toBeInTheDocument();
      });
    });

    it('should complete full workflow: open dialog → relative date selection → save → verify update', async () => {
      const user = userEvent.setup();
      const mockOnUpdateContact = jest.fn();
      
      render(<ContactTable {...defaultProps} onUpdateContact={mockOnUpdateContact} />);
      
      // Étape 1: Ouvrir le dialog
      const reminderButtons = screen.getAllByTitle('Programmer un rappel');
      await user.click(reminderButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Sélection rapide')).toBeInTheDocument();
      });
      
      // Étape 2: Utiliser le sélecteur relatif
      const quantityInput = screen.getByPlaceholderText('1');
      await user.type(quantityInput, '7');
      
      // Vérifier que la prévisualisation apparaît
      await waitFor(() => {
        expect(screen.getByText(/Dans 7 jours/)).toBeInTheDocument();
      });
      
      // Vérifier que la date manuelle a été mise à jour
      const dateInput = screen.getByLabelText('Date du rappel') as HTMLInputElement;
      await waitFor(() => {
        expect(dateInput.value).toBe('2024-01-22'); // 15 janvier + 7 jours
      });
      
      // Étape 3: Ajouter une heure
      const timeInput = screen.getByLabelText('Heure du rappel');
      await user.type(timeInput, '10:00');
      
      // Étape 4: Sauvegarder
      const saveButton = screen.getByText('Sauvegarder');
      await user.click(saveButton);
      
      // Étape 5: Vérifier la mise à jour
      expect(mockOnUpdateContact).toHaveBeenCalledWith({
        id: '1',
        dateRappel: '2024-01-22',
        heureRappel: '10:00'
      });
    });

    it('should handle workflow with existing reminder data', async () => {
      const user = userEvent.setup();
      const mockOnUpdateContact = jest.fn();
      
      render(<ContactTable {...defaultProps} onUpdateContact={mockOnUpdateContact} />);
      
      // Ouvrir le dialog pour le contact qui a déjà des données de rappel
      const reminderButtons = screen.getAllByTitle('Programmer un rappel');
      await user.click(reminderButtons[1]); // Marie Martin
      
      await waitFor(() => {
        expect(screen.getByText('Contact: Marie Martin')).toBeInTheDocument();
      });
      
      // Vérifier que les données existantes sont chargées
      const dateInput = screen.getByLabelText('Date du rappel') as HTMLInputElement;
      const timeInput = screen.getByLabelText('Heure du rappel') as HTMLInputElement;
      
      expect(dateInput.value).toBe('2024-01-20');
      expect(timeInput.value).toBe('14:30');
      
      // Modifier les données
      await user.clear(dateInput);
      await user.type(dateInput, '2024-01-30');
      
      await user.clear(timeInput);
      await user.type(timeInput, '16:00');
      
      // Sauvegarder
      const saveButton = screen.getByText('Sauvegarder');
      await user.click(saveButton);
      
      // Vérifier la mise à jour
      expect(mockOnUpdateContact).toHaveBeenCalledWith({
        id: '2',
        dateRappel: '2024-01-30',
        heureRappel: '16:00'
      });
    });
  });

  describe('Workflow with Validation Errors', () => {
    it('should handle workflow with validation errors and recovery', async () => {
      const user = userEvent.setup();
      const mockOnUpdateContact = jest.fn();
      
      render(<ContactTable {...defaultProps} onUpdateContact={mockOnUpdateContact} />);
      
      // Ouvrir le dialog
      const reminderButtons = screen.getAllByTitle('Programmer un rappel');
      await user.click(reminderButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Programmer un Rappel')).toBeInTheDocument();
      });
      
      // Saisir une date dans le passé (erreur)
      const dateInput = screen.getByLabelText('Date du rappel');
      const timeInput = screen.getByLabelText('Heure du rappel');
      
      await user.type(dateInput, '2020-01-01');
      await user.type(timeInput, '10:00');
      
      // Vérifier que l'erreur apparaît
      await waitFor(() => {
        expect(screen.getByText('La date ne peut pas être dans le passé')).toBeInTheDocument();
      });
      
      // Le bouton de sauvegarde devrait être désactivé
      const saveButton = screen.getByText('Sauvegarder');
      expect(saveButton).toBeDisabled();
      
      // Corriger l'erreur
      await user.clear(dateInput);
      await user.type(dateInput, '2024-01-25');
      
      // L'erreur devrait disparaître
      await waitFor(() => {
        expect(screen.queryByText('La date ne peut pas être dans le passé')).not.toBeInTheDocument();
      });
      
      // Le bouton devrait être réactivé
      expect(saveButton).not.toBeDisabled();
      
      // Sauvegarder
      await user.click(saveButton);
      
      expect(mockOnUpdateContact).toHaveBeenCalledWith({
        id: '1',
        dateRappel: '2024-01-25',
        heureRappel: '10:00'
      });
    });

    it('should prevent save with incomplete data', async () => {
      const user = userEvent.setup();
      const mockOnUpdateContact = jest.fn();
      
      render(<ContactTable {...defaultProps} onUpdateContact={mockOnUpdateContact} />);
      
      // Ouvrir le dialog
      const reminderButtons = screen.getAllByTitle('Programmer un rappel');
      await user.click(reminderButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Programmer un Rappel')).toBeInTheDocument();
      });
      
      // Saisir seulement la date, pas l'heure
      const dateInput = screen.getByLabelText('Date du rappel');
      await user.type(dateInput, '2024-01-25');
      
      // Le bouton de sauvegarde devrait être désactivé
      const saveButton = screen.getByText('Sauvegarder');
      expect(saveButton).toBeDisabled();
      
      // Essayer de cliquer quand même
      await user.click(saveButton);
      
      // Aucune mise à jour ne devrait avoir lieu
      expect(mockOnUpdateContact).not.toHaveBeenCalled();
      
      // Le dialog devrait rester ouvert
      expect(screen.getByText('Programmer un Rappel')).toBeInTheDocument();
    });
  });

  describe('Workflow Interruption and Recovery', () => {
    it('should handle dialog cancellation without saving', async () => {
      const user = userEvent.setup();
      const mockOnUpdateContact = jest.fn();
      
      render(<ContactTable {...defaultProps} onUpdateContact={mockOnUpdateContact} />);
      
      // Ouvrir le dialog
      const reminderButtons = screen.getAllByTitle('Programmer un rappel');
      await user.click(reminderButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Programmer un Rappel')).toBeInTheDocument();
      });
      
      // Saisir des données
      const dateInput = screen.getByLabelText('Date du rappel');
      const timeInput = screen.getByLabelText('Heure du rappel');
      
      await user.type(dateInput, '2024-01-25');
      await user.type(timeInput, '15:30');
      
      // Annuler
      const cancelButton = screen.getByText('Annuler');
      await user.click(cancelButton);
      
      // Vérifier que le dialog se ferme sans sauvegarder
      await waitFor(() => {
        expect(screen.queryByText('Programmer un Rappel')).not.toBeInTheDocument();
      });
      
      expect(mockOnUpdateContact).not.toHaveBeenCalled();
    });

    it('should handle dialog reopening after cancellation', async () => {
      const user = userEvent.setup();
      const mockOnUpdateContact = jest.fn();
      
      render(<ContactTable {...defaultProps} onUpdateContact={mockOnUpdateContact} />);
      
      const reminderButtons = screen.getAllByTitle('Programmer un rappel');
      
      // Premier cycle: ouvrir, saisir, annuler
      await user.click(reminderButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Programmer un Rappel')).toBeInTheDocument();
      });
      
      const dateInput = screen.getByLabelText('Date du rappel');
      await user.type(dateInput, '2024-01-25');
      
      const cancelButton = screen.getByText('Annuler');
      await user.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Programmer un Rappel')).not.toBeInTheDocument();
      });
      
      // Deuxième cycle: rouvrir le dialog
      await user.click(reminderButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Programmer un Rappel')).toBeInTheDocument();
      });
      
      // Les champs devraient être vides (réinitialisés)
      const newDateInput = screen.getByLabelText('Date du rappel') as HTMLInputElement;
      const newTimeInput = screen.getByLabelText('Heure du rappel') as HTMLInputElement;
      
      expect(newDateInput.value).toBe('');
      expect(newTimeInput.value).toBe('');
    });
  });

  describe('Multi-Contact Workflow', () => {
    it('should handle scheduling reminders for multiple contacts in sequence', async () => {
      const user = userEvent.setup();
      const mockOnUpdateContact = jest.fn();
      
      render(<ContactTable {...defaultProps} onUpdateContact={mockOnUpdateContact} />);
      
      const reminderButtons = screen.getAllByTitle('Programmer un rappel');
      
      // Premier contact
      await user.click(reminderButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Contact: Jean Dupont')).toBeInTheDocument();
      });
      
      let dateInput = screen.getByLabelText('Date du rappel');
      let timeInput = screen.getByLabelText('Heure du rappel');
      
      await user.type(dateInput, '2024-01-25');
      await user.type(timeInput, '10:00');
      
      let saveButton = screen.getByText('Sauvegarder');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Programmer un Rappel')).not.toBeInTheDocument();
      });
      
      expect(mockOnUpdateContact).toHaveBeenCalledWith({
        id: '1',
        dateRappel: '2024-01-25',
        heureRappel: '10:00'
      });
      
      // Deuxième contact
      await user.click(reminderButtons[1]);
      
      await waitFor(() => {
        expect(screen.getByText('Contact: Marie Martin')).toBeInTheDocument();
      });
      
      // Utiliser le sélecteur relatif cette fois
      const quantityInput = screen.getByPlaceholderText('1');
      await user.type(quantityInput, '14');
      
      await waitFor(() => {
        expect(screen.getByText(/Dans 14 jours/)).toBeInTheDocument();
      });
      
      timeInput = screen.getByLabelText('Heure du rappel');
      await user.clear(timeInput); // Effacer l'heure existante
      await user.type(timeInput, '16:00');
      
      saveButton = screen.getByText('Sauvegarder');
      await user.click(saveButton);
      
      expect(mockOnUpdateContact).toHaveBeenCalledWith({
        id: '2',
        dateRappel: '2024-01-29', // 15 janvier + 14 jours
        heureRappel: '16:00'
      });
      
      // Vérifier que les deux appels ont été faits
      expect(mockOnUpdateContact).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility Workflow', () => {
    it('should complete workflow using only keyboard navigation', async () => {
      const user = userEvent.setup();
      const mockOnUpdateContact = jest.fn();
      
      render(<ContactTable {...defaultProps} onUpdateContact={mockOnUpdateContact} />);
      
      // Naviguer jusqu'au premier bouton de rappel avec Tab
      // (En réalité, il faudrait plusieurs Tab selon la structure)
      const reminderButton = screen.getAllByTitle('Programmer un rappel')[0];
      reminderButton.focus();
      
      // Ouvrir avec Enter
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('Programmer un Rappel')).toBeInTheDocument();
      });
      
      // Naviguer dans le formulaire avec Tab
      await user.tab(); // Date
      const dateInput = screen.getByLabelText('Date du rappel');
      expect(dateInput).toHaveFocus();
      
      await user.type(dateInput, '2024-01-25');
      
      await user.tab(); // Heure
      const timeInput = screen.getByLabelText('Heure du rappel');
      expect(timeInput).toHaveFocus();
      
      await user.type(timeInput, '14:30');
      
      // Naviguer jusqu'au bouton de sauvegarde
      await user.tab(); // Quantité
      await user.tab(); // Unité
      await user.tab(); // Annuler
      await user.tab(); // Sauvegarder
      
      const saveButton = screen.getByText('Sauvegarder');
      expect(saveButton).toHaveFocus();
      
      // Sauvegarder avec Enter
      await user.keyboard('{Enter}');
      
      expect(mockOnUpdateContact).toHaveBeenCalledWith({
        id: '1',
        dateRappel: '2024-01-25',
        heureRappel: '14:30'
      });
    });

    it('should close dialog with Escape key', async () => {
      const user = userEvent.setup();
      const mockOnUpdateContact = jest.fn();
      
      render(<ContactTable {...defaultProps} onUpdateContact={mockOnUpdateContact} />);
      
      // Ouvrir le dialog
      const reminderButtons = screen.getAllByTitle('Programmer un rappel');
      await user.click(reminderButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Programmer un Rappel')).toBeInTheDocument();
      });
      
      // Saisir des données
      const dateInput = screen.getByLabelText('Date du rappel');
      await user.type(dateInput, '2024-01-25');
      
      // Fermer avec Escape
      await user.keyboard('{Escape}');
      
      // Le dialog devrait se fermer sans sauvegarder
      await waitFor(() => {
        expect(screen.queryByText('Programmer un Rappel')).not.toBeInTheDocument();
      });
      
      expect(mockOnUpdateContact).not.toHaveBeenCalled();
    });
  });

  describe('Data Persistence Workflow', () => {
    it('should verify data persistence across dialog sessions', async () => {
      const user = userEvent.setup();
      let savedData: any = null;
      
      const mockOnUpdateContact = jest.fn((data) => {
        savedData = data;
      });
      
      // Simuler des contacts avec les données sauvegardées
      const updatedContacts = [...mockContacts];
      
      const { rerender } = render(
        <ContactTable {...defaultProps} onUpdateContact={mockOnUpdateContact} />
      );
      
      // Programmer un rappel
      const reminderButtons = screen.getAllByTitle('Programmer un rappel');
      await user.click(reminderButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Programmer un Rappel')).toBeInTheDocument();
      });
      
      const dateInput = screen.getByLabelText('Date du rappel');
      const timeInput = screen.getByLabelText('Heure du rappel');
      
      await user.type(dateInput, '2024-01-25');
      await user.type(timeInput, '15:30');
      
      const saveButton = screen.getByText('Sauvegarder');
      await user.click(saveButton);
      
      expect(mockOnUpdateContact).toHaveBeenCalledWith({
        id: '1',
        dateRappel: '2024-01-25',
        heureRappel: '15:30'
      });
      
      // Simuler la mise à jour des données
      updatedContacts[0] = {
        ...updatedContacts[0],
        dateRappel: '2024-01-25',
        heureRappel: '15:30'
      };
      
      // Re-render avec les nouvelles données
      rerender(
        <ContactTable 
          {...defaultProps} 
          contacts={updatedContacts}
          onUpdateContact={mockOnUpdateContact} 
        />
      );
      
      // Rouvrir le dialog pour vérifier que les données sont persistées
      const newReminderButtons = screen.getAllByTitle('Programmer un rappel');
      await user.click(newReminderButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Programmer un Rappel')).toBeInTheDocument();
      });
      
      // Vérifier que les données sauvegardées sont chargées
      const newDateInput = screen.getByLabelText('Date du rappel') as HTMLInputElement;
      const newTimeInput = screen.getByLabelText('Heure du rappel') as HTMLInputElement;
      
      expect(newDateInput.value).toBe('2024-01-25');
      expect(newTimeInput.value).toBe('15:30');
    });
  });
});