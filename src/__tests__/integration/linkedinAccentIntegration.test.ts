import { searchLinkedIn, removeAccents } from '../../lib/utils';

// Mock window.open pour les tests
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  writable: true,
  value: mockWindowOpen,
});

// Mock console.warn pour les tests
const mockConsoleWarn = jest.fn();
Object.defineProperty(console, 'warn', {
  writable: true,
  value: mockConsoleWarn,
});

describe('Intégration complète LinkedIn avec gestion des accents', () => {
  beforeEach(() => {
    mockWindowOpen.mockClear();
    mockConsoleWarn.mockClear();
  });

  describe('Simulation d\'utilisation dans l\'application', () => {
    test('devrait gérer un contact avec accents comme dans l\'application réelle', () => {
      // Simulation d'un contact avec accents comme il apparaîtrait dans l'application
      const contact = {
        id: '1',
        prenom: 'José',
        nom: 'Müller',
        telephone: '0123456789',
        email: 'jose.muller@example.com'
      };

      // Simulation de l'appel depuis handleLinkedInSearch dans App.tsx
      searchLinkedIn(contact.prenom, contact.nom);

      // Vérifier que l'URL générée ne contient pas d'accents
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.linkedin.com/search/results/people/?keywords=Jose%20Muller',
        'dimicall-linkedin-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );

      // Vérifier que les données originales du contact ne sont pas modifiées
      expect(contact.prenom).toBe('José'); // Doit conserver l'accent
      expect(contact.nom).toBe('Müller'); // Doit conserver l'accent
    });

    test('devrait gérer la recherche automatique LinkedIn avec accents', () => {
      // Simulation d'un contact sélectionné avec accents
      const selectedContact = {
        id: '2',
        prenom: 'François',
        nom: 'Cœur',
        telephone: '0987654321',
        email: 'francois.coeur@example.com'
      };

      // Simulation de la recherche automatique (autoSearchMode === 'linkedin')
      searchLinkedIn(selectedContact.prenom, selectedContact.nom);

      // Vérifier que l'URL générée ne contient pas d'accents
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.linkedin.com/search/results/people/?keywords=Francois%20Coeur',
        'dimicall-linkedin-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );

      // Vérifier que les données originales restent intactes
      expect(selectedContact.prenom).toBe('François');
      expect(selectedContact.nom).toBe('Cœur');
    });

    test('devrait gérer les noms complexes français typiques', () => {
      const contacts = [
        { prenom: 'Jean-François', nom: 'Müller-Cœur' },
        { prenom: 'Marie-Amélie', nom: 'Noël' },
        { prenom: 'Pierre-Yves', nom: 'Château' },
        { prenom: 'Anne-Laure', nom: 'Bégué' }
      ];

      const expectedUrls = [
        'https://www.linkedin.com/search/results/people/?keywords=Jean-Francois%20Muller-Coeur',
        'https://www.linkedin.com/search/results/people/?keywords=Marie-Amelie%20Noel',
        'https://www.linkedin.com/search/results/people/?keywords=Pierre-Yves%20Chateau',
        'https://www.linkedin.com/search/results/people/?keywords=Anne-Laure%20Begue'
      ];

      contacts.forEach((contact, index) => {
        mockWindowOpen.mockClear();
        searchLinkedIn(contact.prenom, contact.nom);
        
        expect(mockWindowOpen).toHaveBeenCalledWith(
          expectedUrls[index],
          'dimicall-linkedin-window',
          'width=1200,height=800,scrollbars=yes,resizable=yes'
        );
      });
    });
  });

  describe('Vérification que l\'affichage conserve les accents', () => {
    test('devrait confirmer que removeAccents ne modifie pas les données source', () => {
      const originalData = {
        prenom: 'José',
        nom: 'Müller',
        email: 'josé.müller@example.com'
      };

      // Utiliser removeAccents comme dans searchLinkedIn
      const normalizedPrenom = removeAccents(originalData.prenom);
      const normalizedNom = removeAccents(originalData.nom);

      // Vérifier que les données normalisées sont sans accents
      expect(normalizedPrenom).toBe('Jose');
      expect(normalizedNom).toBe('Muller');

      // Vérifier que les données originales sont intactes
      expect(originalData.prenom).toBe('José');
      expect(originalData.nom).toBe('Müller');
      expect(originalData.email).toBe('josé.müller@example.com');
    });

    test('devrait simuler l\'affichage dans l\'interface utilisateur', () => {
      const contact = {
        id: '3',
        prenom: 'Amélie',
        nom: 'Noël',
        telephone: '0123456789'
      };

      // Simulation de l'affichage dans ContactTable
      const displayName = `${contact.prenom} ${contact.nom}`;
      expect(displayName).toBe('Amélie Noël'); // Doit conserver les accents pour l'affichage

      // Simulation de la recherche LinkedIn
      searchLinkedIn(contact.prenom, contact.nom);

      // Vérifier que l'URL est sans accents
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.linkedin.com/search/results/people/?keywords=Amelie%20Noel',
        'dimicall-linkedin-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );

      // Vérifier que l'affichage conserve toujours les accents
      const displayNameAfter = `${contact.prenom} ${contact.nom}`;
      expect(displayNameAfter).toBe('Amélie Noël');
    });
  });

  describe('Simulation des cas d\'usage réels', () => {
    test('devrait gérer un bouton LinkedIn manuel avec accents', () => {
      // Simulation du clic sur le bouton LinkedIn dans l'interface
      const selectedContact = {
        prenom: 'Éléonore',
        nom: 'Château-Müller'
      };

      // Simulation de handleLinkedInSearch()
      searchLinkedIn(selectedContact.prenom, selectedContact.nom);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.linkedin.com/search/results/people/?keywords=Eleonore%20Chateau-Muller',
        'dimicall-linkedin-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });

    test('devrait gérer la recherche automatique lors d\'un appel', () => {
      // Simulation d'un appel avec recherche automatique LinkedIn activée
      const targetContact = {
        prenom: 'Sébastien',
        nom: 'Bégué'
      };

      // Simulation du code dans makeCall avec autoSearchMode === 'linkedin'
      searchLinkedIn(targetContact.prenom, targetContact.nom);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.linkedin.com/search/results/people/?keywords=Sebastien%20Begue',
        'dimicall-linkedin-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });

    test('devrait gérer les contacts importés avec accents', () => {
      // Simulation de contacts importés depuis un fichier CSV/Excel
      const importedContacts = [
        { prenom: 'Cécile', nom: 'Müller' },
        { prenom: 'Jérôme', nom: 'Château' },
        { prenom: 'Anaïs', nom: 'Bégué' }
      ];

      importedContacts.forEach((contact, index) => {
        mockWindowOpen.mockClear();
        searchLinkedIn(contact.prenom, contact.nom);
        
        // Vérifier que chaque recherche fonctionne sans accents
        expect(mockWindowOpen).toHaveBeenCalledTimes(1);
        
        const calledUrl = mockWindowOpen.mock.calls[0][0];
        // Vérifier que l'URL ne contient pas d'accents encodés
        expect(calledUrl).not.toMatch(/%C3%/); // Pas d'accents UTF-8 encodés
        expect(calledUrl).toMatch(/^https:\/\/www\.linkedin\.com\/search\/results\/people\/\?keywords=/);
      });
    });
  });

  describe('Vérification de la compatibilité avec l\'existant', () => {
    test('devrait maintenir la compatibilité avec les appels existants', () => {
      // Test que les appels existants dans le code continuent de fonctionner
      const testCases = [
        ['Jean', 'Martin'],
        ['', 'Dupont'],
        ['Pierre', ''],
        ['Marie-Claire', 'Van Der Berg']
      ];

      testCases.forEach(([prenom, nom]) => {
        mockWindowOpen.mockClear();
        mockConsoleWarn.mockClear();
        
        searchLinkedIn(prenom, nom);
        
        if (prenom || nom) {
          expect(mockWindowOpen).toHaveBeenCalledTimes(1);
          expect(mockConsoleWarn).not.toHaveBeenCalled();
        } else {
          expect(mockWindowOpen).not.toHaveBeenCalled();
          expect(mockConsoleWarn).toHaveBeenCalledWith('Aucune valeur valide pour la recherche LinkedIn');
        }
      });
    });
  });
});