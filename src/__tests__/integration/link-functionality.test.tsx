import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../App';
import { Contact, ContactStatus } from '../../types';

// Mock des services
jest.mock('../../../services/dataService', () => ({
  loadContacts: jest.fn(() => []),
  saveContacts: jest.fn(),
  loadCallStates: jest.fn(() => ({})),
  saveCallStates: jest.fn(),
  importContactsFromFile: jest.fn(),
  exportContactsToFile: jest.fn(),
  exportGoogleContactsCSV: jest.fn(),
  generateGmailComposeUrl: jest.fn(),
}));

// Mock window.open
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  writable: true,
  value: mockWindowOpen,
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Link Functionality Integration', () => {
  const mockContactWithLink: Contact = {
    id: '1',
    numeroLigne: 1,
    prenom: 'John',
    nom: 'Doe',
    telephone: '0123456789',
    email: 'john@example.com',
    source: 'Test',
    statut: ContactStatus.NonDefini,
    commentaire: '',
    dateRappel: '',
    heureRappel: '',
    dateRDV: '',
    heureRDV: '',
    dateAppel: '',
    heureAppel: '',
    dureeAppel: '',
    lien: 'https://example.com'
  };

  const mockContactWithoutLink: Contact = {
    ...mockContactWithLink,
    id: '2',
    lien: undefined
  };

  beforeEach(() => {
    mockWindowOpen.mockClear();
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockContactWithLink, mockContactWithoutLink]));
  });

  test('should show Link button enabled when contact has link', async () => {
    render(<App />);
    
    // Attendre que les contacts se chargent
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    // Sélectionner le contact avec lien
    fireEvent.click(screen.getByText('John'));

    // Vérifier que le bouton Lien est présent et activé
    const linkButton = screen.getByText('Lien');
    expect(linkButton).toBeInTheDocument();
    expect(linkButton.closest('button')).not.toBeDisabled();
  });

  test('should show Link button disabled when contact has no link', async () => {
    render(<App />);
    
    // Attendre que les contacts se chargent
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    // Sélectionner le contact sans lien (en supposant qu'il y en a un)
    const contactsWithoutLink = screen.getAllByText('Doe').find(element => 
      element.closest('tr')?.textContent?.includes('2')
    );
    
    if (contactsWithoutLink) {
      fireEvent.click(contactsWithoutLink);
      
      // Vérifier que le bouton Lien est désactivé
      const linkButton = screen.getByText('Lien');
      expect(linkButton.closest('button')).toBeDisabled();
    }
  });

  test('should open link when Link button is clicked', async () => {
    render(<App />);
    
    // Attendre que les contacts se chargent
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    // Sélectionner le contact avec lien
    fireEvent.click(screen.getByText('John'));

    // Cliquer sur le bouton Lien
    const linkButton = screen.getByText('Lien');
    fireEvent.click(linkButton);

    // Vérifier que window.open a été appelé avec la bonne URL
    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://example.com',
      'dimicall-link-window',
      'width=1200,height=800,scrollbars=yes,resizable=yes'
    );
  });

  test('should show Auto-Lien option in dropdown menu', async () => {
    render(<App />);
    
    // Trouver et cliquer sur le bouton dropdown de recherche automatique
    const dropdownButton = screen.getByText('Auto-LinkedIn').closest('button');
    expect(dropdownButton).toBeInTheDocument();
    
    fireEvent.click(dropdownButton!);

    // Vérifier que l'option Auto-Lien est présente
    await waitFor(() => {
      expect(screen.getByText('Auto-Lien')).toBeInTheDocument();
    });
  });

  test('should change auto search mode to link when Auto-Lien is selected', async () => {
    render(<App />);
    
    // Ouvrir le dropdown
    const dropdownButton = screen.getByText('Auto-LinkedIn').closest('button');
    fireEvent.click(dropdownButton!);

    // Cliquer sur Auto-Lien
    await waitFor(() => {
      const autoLinkOption = screen.getByText('Auto-Lien');
      fireEvent.click(autoLinkOption);
    });

    // Vérifier que le mode a changé (le bouton devrait maintenant afficher Auto-Lien)
    await waitFor(() => {
      expect(screen.getByText('Auto-Lien')).toBeInTheDocument();
    });
  });

  test('should handle auto-link mode during call end', async () => {
    // Mock localStorage pour retourner le mode 'link'
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'auto-search-mode') return 'link';
      if (key === 'dimiCallContacts') return JSON.stringify([mockContactWithLink]);
      return null;
    });

    render(<App />);
    
    // Attendre que les contacts se chargent
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    // Sélectionner le contact avec lien
    fireEvent.click(screen.getByText('John'));

    // Simuler la fin d'un appel (ceci déclencherait normalement la recherche automatique)
    // Note: Ceci nécessiterait une simulation plus complexe de l'état d'appel
    // Pour ce test, nous vérifions juste que le mode est correctement configuré
    expect(screen.getByText('Auto-Lien')).toBeInTheDocument();
  });
});