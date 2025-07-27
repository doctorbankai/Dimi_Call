import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from '../../App';
import { Contact, ContactStatus } from '../../types';

// Mock des services
const mockContacts: Contact[] = [
  {
    id: '1',
    numeroLigne: 1,
    prenom: 'John',
    nom: 'Doe',
    telephone: '0123456789',
    email: 'john@example.com',
    source: 'Test',
    statut: ContactStatus.ARappeler,
    commentaire: 'Contact avec lien',
    dateRappel: '',
    heureRappel: '',
    dateRDV: '',
    heureRDV: '',
    dateAppel: '',
    heureAppel: '',
    dureeAppel: '',
    lien: 'https://linkedin.com/in/johndoe'
  },
  {
    id: '2',
    numeroLigne: 2,
    prenom: 'Jane',
    nom: 'Smith',
    telephone: '0987654321',
    email: 'jane@example.com',
    source: 'Test',
    statut: ContactStatus.DO,
    commentaire: 'Contact sans lien',
    dateRappel: '',
    heureRappel: '',
    dateRDV: '',
    heureRDV: '',
    dateAppel: '',
    heureAppel: '',
    dureeAppel: '',
    lien: undefined
  },
  {
    id: '3',
    numeroLigne: 3,
    prenom: 'Bob',
    nom: 'Wilson',
    telephone: '0555666777',
    email: 'bob@example.com',
    source: 'Test',
    statut: ContactStatus.RO,
    commentaire: 'Contact avec lien invalide',
    dateRappel: '',
    heureRappel: '',
    dateRDV: '',
    heureRDV: '',
    dateAppel: '',
    heureAppel: '',
    dureeAppel: '',
    lien: 'www.example.com'
  }
];

jest.mock('../../../services/dataService', () => ({
  loadContacts: jest.fn(() => mockContacts),
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

describe('Link User Experience End-to-End', () => {
  beforeEach(() => {
    mockWindowOpen.mockClear();
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'auto-search-mode') return 'linkedin';
      if (key === 'dimiCallContacts') return JSON.stringify(mockContacts);
      return null;
    });
  });

  test('complete user workflow: select contact with link and open it', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // 1. Attendre que l'application se charge
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    // 2. Sélectionner un contact avec lien
    await user.click(screen.getByText('John'));

    // 3. Vérifier que le bouton Lien est activé
    const linkButton = screen.getByText('Lien');
    expect(linkButton.closest('button')).not.toBeDisabled();

    // 4. Cliquer sur le bouton Lien
    await user.click(linkButton);

    // 5. Vérifier que le lien s'ouvre
    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://linkedin.com/in/johndoe',
      'dimicall-link-window',
      'width=1200,height=800,scrollbars=yes,resizable=yes'
    );

    // 6. Vérifier qu'une notification de succès apparaît
    await waitFor(() => {
      expect(screen.getByText('Lien ouvert avec succès')).toBeInTheDocument();
    });
  });

  test('user workflow: select contact without link shows disabled button', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Jane')).toBeInTheDocument();
    });

    // Sélectionner un contact sans lien
    await user.click(screen.getByText('Jane'));

    // Vérifier que le bouton Lien est désactivé
    const linkButton = screen.getByText('Lien');
    expect(linkButton.closest('button')).toBeDisabled();

    // Essayer de cliquer (ne devrait rien faire)
    await user.click(linkButton);
    expect(mockWindowOpen).not.toHaveBeenCalled();
  });

  test('user workflow: change auto search mode to Auto-Lien', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // 1. Trouver le bouton dropdown de recherche automatique
    const dropdownButton = screen.getByText('Auto-LinkedIn').closest('button');
    expect(dropdownButton).toBeInTheDocument();
    
    // 2. Ouvrir le dropdown
    await user.click(dropdownButton!);

    // 3. Vérifier que l'option Auto-Lien est présente
    await waitFor(() => {
      expect(screen.getByText('Auto-Lien')).toBeInTheDocument();
    });

    // 4. Sélectionner Auto-Lien
    const autoLinkOption = screen.getByText('Auto-Lien');
    await user.click(autoLinkOption);

    // 5. Vérifier que le mode a changé
    await waitFor(() => {
      expect(screen.getByText('Auto-Lien')).toBeInTheDocument();
    });

    // 6. Vérifier que localStorage a été mis à jour
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auto-search-mode', 'link');
  });

  test('user workflow: auto-link mode behavior', async () => {
    // Configurer le mode auto-link
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'auto-search-mode') return 'link';
      if (key === 'dimiCallContacts') return JSON.stringify(mockContacts);
      return null;
    });

    const user = userEvent.setup();
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    // Vérifier que le mode Auto-Lien est affiché
    expect(screen.getByText('Auto-Lien')).toBeInTheDocument();

    // Sélectionner un contact avec lien
    await user.click(screen.getByText('John'));

    // Dans un vrai scénario, la recherche automatique se déclencherait à la fin d'un appel
    // Ici nous testons juste que le mode est correctement configuré
    expect(screen.getByText('Auto-Lien')).toBeInTheDocument();
  });

  test('user workflow: visual consistency across different modes', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Tester le basculement entre différents modes
    const modes = ['Désactivé', 'Auto-LinkedIn', 'Auto-Google', 'Auto-Lien'];
    
    for (const mode of modes) {
      // Ouvrir le dropdown
      const currentButton = screen.getByText(/Auto-|Désactivé/).closest('button');
      await user.click(currentButton!);

      // Sélectionner le mode
      if (screen.queryByText(mode)) {
        await user.click(screen.getByText(mode));
        
        // Vérifier que le mode est affiché
        await waitFor(() => {
          expect(screen.getByText(mode)).toBeInTheDocument();
        });
      }
    }
  });

  test('user workflow: error handling for invalid links', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    // Sélectionner un contact avec lien sans protocole
    await user.click(screen.getByText('Bob'));

    // Le bouton devrait être activé car le lien existe
    const linkButton = screen.getByText('Lien');
    expect(linkButton.closest('button')).not.toBeDisabled();

    // Cliquer sur le bouton
    await user.click(linkButton);

    // Vérifier que le lien s'ouvre avec le protocole ajouté automatiquement
    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://www.example.com',
      'dimicall-link-window',
      'width=1200,height=800,scrollbars=yes,resizable=yes'
    );
  });

  test('user workflow: tooltip and accessibility', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    // Sélectionner un contact avec lien
    await user.click(screen.getByText('John'));

    // Vérifier que le bouton Lien est accessible
    const linkButton = screen.getByText('Lien');
    expect(linkButton).toBeInTheDocument();
    expect(linkButton.closest('button')).toHaveAttribute('type', 'button');

    // Vérifier la structure du bouton (icône + texte)
    const buttonElement = linkButton.closest('button');
    expect(buttonElement).toContainHTML('svg'); // Icône ExternalLink
    expect(buttonElement).toHaveTextContent('Lien');
  });

  test('user workflow: keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    // Sélectionner un contact avec lien
    await user.click(screen.getByText('John'));

    // Naviguer vers le bouton Lien avec Tab
    const linkButton = screen.getByText('Lien').closest('button');
    linkButton?.focus();

    // Vérifier que le bouton a le focus
    expect(linkButton).toHaveFocus();

    // Activer avec Entrée
    await user.keyboard('{Enter}');

    // Vérifier que le lien s'ouvre
    expect(mockWindowOpen).toHaveBeenCalled();
  });
});