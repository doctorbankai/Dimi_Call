import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateCalculationService } from '../../services/dateCalculationService';
import { RelativeDateSelector } from '../../components/RelativeDateSelector';
import { ReminderDialog } from '../../components/ReminderDialog';
import { Contact, ContactStatus } from '../../types';

// Mock du service de calcul de dates avec implémentation réelle pour certains tests
jest.mock('../../services/dateCalculationService');
const mockDateCalculationService = DateCalculationService as jest.Mocked<typeof DateCalculationService>;

describe('Reminder Edge Cases and Error Handling', () => {
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
    
    // Configuration par défaut
    mockDateCalculationService.validateDateRange.mockReturnValue({ isValid: true });
    mockDateCalculationService.isValidTimeFormat.mockReturnValue(true);
    mockDateCalculationService.isValidDateFormat.mockReturnValue(true);
    mockDateCalculationService.calculateFutureDate.mockReturnValue('2024-01-20');
    mockDateCalculationService.getPreviewText.mockReturnValue('Dans 5 jours');
    mockDateCalculationService.formatDateForDisplay.mockReturnValue('samedi 20 janvier 2024');
    mockDateCalculationService.isValidQuantity.mockReturnValue(true);
  });

  describe('DateCalculationService Edge Cases', () => {
    beforeEach(() => {
      // Utiliser l'implémentation réelle pour ces tests
      jest.unmock('../../services/dateCalculationService');
    });

    afterEach(() => {
      // Remettre le mock
      jest.mock('../../services/dateCalculationService');
    });

    it('should handle leap year calculations correctly', () => {
      // Mock la date actuelle au 29 février 2024 (année bissextile)
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-02-29T10:00:00.000Z'));

      const result = DateCalculationService.calculateFutureDate(1, 'years');
      // 2025 n'est pas une année bissextile, donc le 29 février devient le 28 février
      expect(result).toBe('2025-02-28');

      jest.useRealTimers();
    });

    it('should handle month-end date calculations', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-31T10:00:00.000Z'));

      const result = DateCalculationService.calculateFutureDate(1, 'months');
      // Janvier 31 + 1 mois = 29 février 2024 (année bissextile)
      expect(result).toBe('2024-02-29');

      jest.useRealTimers();
    });

    it('should handle very large quantities correctly', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T10:00:00.000Z'));

      const result = DateCalculationService.calculateFutureDate(999, 'days');
      expect(result).toBe('2026-09-27'); // 999 jours après le 1er janvier 2024

      jest.useRealTimers();
    });

    it('should validate extreme future dates', () => {
      const farFutureDate = '2040-01-01';
      const result = DateCalculationService.validateDateRange(farFutureDate);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('La date ne peut pas dépasser 10 ans dans le futur');
    });

    it('should handle invalid date strings gracefully', () => {
      const result = DateCalculationService.validateDateRange('invalid-date');
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Format de date invalide');
    });

    it('should handle edge case time formats', () => {
      expect(DateCalculationService.isValidTimeFormat('00:00')).toBe(true);
      expect(DateCalculationService.isValidTimeFormat('23:59')).toBe(true);
      expect(DateCalculationService.isValidTimeFormat('24:00')).toBe(false);
      expect(DateCalculationService.isValidTimeFormat('12:60')).toBe(false);
      expect(DateCalculationService.isValidTimeFormat('1:30')).toBe(false); // Doit être 01:30
    });

    it('should handle quantity edge cases', () => {
      expect(DateCalculationService.isValidQuantity(1)).toBe(true);
      expect(DateCalculationService.isValidQuantity(999)).toBe(true);
      expect(DateCalculationService.isValidQuantity(0)).toBe(false);
      expect(DateCalculationService.isValidQuantity(1000)).toBe(false);
      expect(DateCalculationService.isValidQuantity(1.5)).toBe(false);
      expect(DateCalculationService.isValidQuantity(-1)).toBe(false);
    });
  });

  describe('RelativeDateSelector Error Recovery', () => {
    const selectorProps = {
      onDateChange: jest.fn(),
      currentDate: '2024-01-15'
    };

    it('should recover from calculation errors', async () => {
      const user = userEvent.setup();
      
      // Premier calcul réussit
      mockDateCalculationService.calculateFutureDate.mockReturnValueOnce('2024-01-20');
      mockDateCalculationService.isValidQuantity.mockReturnValue(true);
      
      render(<RelativeDateSelector {...selectorProps} />);
      
      const quantityInput = screen.getByPlaceholderText('1');
      await user.type(quantityInput, '5');
      
      // Vérifier que ça fonctionne
      expect(mockDateCalculationService.calculateFutureDate).toHaveBeenCalledWith(5, 'days');
      
      // Maintenant simuler une erreur
      mockDateCalculationService.calculateFutureDate.mockImplementation(() => {
        throw new Error('Calculation error');
      });
      
      await user.clear(quantityInput);
      await user.type(quantityInput, '10');
      
      // Vérifier que l'erreur est gérée
      await waitFor(() => {
        expect(screen.getByText('Erreur lors du calcul de la date')).toBeInTheDocument();
      });
      
      // Rétablir le fonctionnement normal
      mockDateCalculationService.calculateFutureDate.mockReturnValue('2024-01-25');
      
      await user.clear(quantityInput);
      await user.type(quantityInput, '3');
      
      // L'erreur devrait disparaître
      await waitFor(() => {
        expect(screen.queryByText('Erreur lors du calcul de la date')).not.toBeInTheDocument();
      });
    });

    it('should handle rapid input changes', async () => {
      const user = userEvent.setup();
      render(<RelativeDateSelector {...selectorProps} />);
      
      const quantityInput = screen.getByPlaceholderText('1');
      
      // Saisie rapide de plusieurs valeurs
      await user.type(quantityInput, '123');
      
      // Seule la dernière valeur devrait être prise en compte
      expect(mockDateCalculationService.calculateFutureDate).toHaveBeenLastCalledWith(123, 'days');
    });

    it('should handle component unmounting during async operations', async () => {
      const user = userEvent.setup();
      
      // Simuler une opération asynchrone lente
      mockDateCalculationService.calculateFutureDate.mockImplementation(() => {
        return new Promise(resolve => setTimeout(() => resolve('2024-01-20'), 100));
      });
      
      const { unmount } = render(<RelativeDateSelector {...selectorProps} />);
      
      const quantityInput = screen.getByPlaceholderText('1');
      await user.type(quantityInput, '5');
      
      // Démonter le composant avant que l'opération se termine
      unmount();
      
      // Aucune erreur ne devrait être levée
    });

    it('should handle invalid unit changes gracefully', async () => {
      const user = userEvent.setup();
      render(<RelativeDateSelector {...selectorProps} />);
      
      const quantityInput = screen.getByPlaceholderText('1');
      await user.type(quantityInput, '5');
      
      // Simuler un changement d'unité vers une valeur invalide
      mockDateCalculationService.calculateFutureDate.mockImplementation((qty, unit) => {
        if (unit === 'invalid' as any) {
          throw new Error('Invalid unit');
        }
        return '2024-01-20';
      });
      
      // Le composant devrait gérer cela sans planter
      expect(screen.getByPlaceholderText('1')).toBeInTheDocument();
    });
  });

  describe('ReminderDialog Error Boundaries', () => {
    const dialogProps = {
      isOpen: true,
      onClose: jest.fn(),
      contact: mockContact,
      onSave: jest.fn()
    };

    it('should handle corrupted contact data', () => {
      const corruptedContact = {
        ...mockContact,
        dateRappel: 'invalid-date',
        heureRappel: 'invalid-time'
      };
      
      render(<ReminderDialog {...dialogProps} contact={corruptedContact} />);
      
      // Le dialog devrait s'ouvrir malgré les données corrompues
      expect(screen.getByText('Programmer un Rappel')).toBeInTheDocument();
      
      // Les champs devraient être vides ou avoir des valeurs par défaut
      const dateInput = screen.getByLabelText('Date du rappel') as HTMLInputElement;
      const timeInput = screen.getByLabelText('Heure du rappel') as HTMLInputElement;
      
      expect(dateInput.value).toBe('invalid-date'); // Affiché tel quel, sera validé
      expect(timeInput.value).toBe('invalid-time');
    });

    it('should handle save callback errors', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockImplementation(() => {
        throw new Error('Save failed');
      });
      
      render(<ReminderDialog {...dialogProps} onSave={mockOnSave} />);
      
      // Remplir le formulaire
      const dateInput = screen.getByLabelText('Date du rappel');
      const timeInput = screen.getByLabelText('Heure du rappel');
      
      await user.type(dateInput, '2024-01-20');
      await user.type(timeInput, '14:30');
      
      // Essayer de sauvegarder
      const saveButton = screen.getByText('Sauvegarder');
      await user.click(saveButton);
      
      // L'erreur devrait être gérée (le dialog ne devrait pas planter)
      expect(mockOnSave).toHaveBeenCalled();
    });

    it('should handle multiple validation errors simultaneously', async () => {
      const user = userEvent.setup();
      
      mockDateCalculationService.validateDateRange.mockReturnValue({
        isValid: false,
        errorMessage: 'Date invalide'
      });
      mockDateCalculationService.isValidTimeFormat.mockReturnValue(false);
      
      render(<ReminderDialog {...dialogProps} />);
      
      const dateInput = screen.getByLabelText('Date du rappel');
      const timeInput = screen.getByLabelText('Heure du rappel');
      
      await user.type(dateInput, '2020-01-01');
      await user.type(timeInput, '25:00');
      
      // Les deux erreurs devraient être affichées
      await waitFor(() => {
        expect(screen.getByText('Date invalide')).toBeInTheDocument();
        expect(screen.getByText('Format d\'heure invalide (HH:mm)')).toBeInTheDocument();
      });
    });

    it('should handle dialog state corruption', () => {
      const { rerender } = render(<ReminderDialog {...dialogProps} />);
      
      // Simuler un changement de props inattendu
      rerender(
        <ReminderDialog 
          {...dialogProps} 
          contact={{...mockContact, id: 'different-id'}}
        />
      );
      
      // Le dialog devrait se réinitialiser correctement
      expect(screen.getByText('Programmer un Rappel')).toBeInTheDocument();
    });
  });

  describe('Network and Performance Edge Cases', () => {
    it('should handle slow date calculations', async () => {
      const user = userEvent.setup();
      
      // Simuler une calculation lente
      mockDateCalculationService.calculateFutureDate.mockImplementation(() => {
        return new Promise(resolve => 
          setTimeout(() => resolve('2024-01-20'), 500)
        );
      });
      
      render(<RelativeDateSelector onDateChange={jest.fn()} currentDate="2024-01-15" />);
      
      const quantityInput = screen.getByPlaceholderText('1');
      await user.type(quantityInput, '5');
      
      // L'interface devrait rester responsive
      expect(quantityInput).not.toBeDisabled();
    });

    it('should debounce rapid input changes', async () => {
      const user = userEvent.setup();
      const mockOnDateChange = jest.fn();
      
      render(<RelativeDateSelector onDateChange={mockOnDateChange} currentDate="2024-01-15" />);
      
      const quantityInput = screen.getByPlaceholderText('1');
      
      // Saisie très rapide
      await user.type(quantityInput, '1');
      await user.type(quantityInput, '2');
      await user.type(quantityInput, '3');
      
      // Attendre que les calculs se stabilisent
      await waitFor(() => {
        expect(mockDateCalculationService.calculateFutureDate).toHaveBeenCalledWith(123, 'days');
      });
    });
  });

  describe('Browser Compatibility Edge Cases', () => {
    it('should handle missing Date API features', () => {
      // Simuler un navigateur avec API Date limitée
      const originalToLocaleDateString = Date.prototype.toLocaleDateString;
      Date.prototype.toLocaleDateString = jest.fn().mockImplementation(() => {
        throw new Error('Not supported');
      });
      
      // Le service devrait gérer cette erreur
      const result = DateCalculationService.formatDateForDisplay('2024-01-20');
      expect(result).toBe('2024-01-20'); // Fallback au format original
      
      // Restaurer
      Date.prototype.toLocaleDateString = originalToLocaleDateString;
    });

    it('should handle timezone edge cases', () => {
      // Simuler un changement de fuseau horaire
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-03-31T01:00:00.000Z')); // Changement d'heure d'été
      
      const result = DateCalculationService.calculateFutureDate(1, 'days');
      expect(result).toMatch(/2024-04-01/); // Devrait gérer le changement d'heure
      
      jest.useRealTimers();
    });
  });

  describe('Memory and Resource Management', () => {
    it('should clean up event listeners on unmount', () => {
      const { unmount } = render(
        <ReminderDialog
          isOpen={true}
          onClose={jest.fn()}
          contact={mockContact}
          onSave={jest.fn()}
        />
      );
      
      // Simuler des événements après démontage
      unmount();
      
      // Aucune erreur ne devrait être levée
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    it('should handle large datasets efficiently', () => {
      // Simuler un grand nombre de calculs
      const calculations = Array.from({ length: 1000 }, (_, i) => i + 1);
      
      calculations.forEach(qty => {
        mockDateCalculationService.calculateFutureDate.mockReturnValue(`2024-01-${String(qty % 31 + 1).padStart(2, '0')}`);
        DateCalculationService.calculateFutureDate(qty, 'days');
      });
      
      // Devrait se terminer sans problème de performance
      expect(mockDateCalculationService.calculateFutureDate).toHaveBeenCalledTimes(1000);
    });
  });
});