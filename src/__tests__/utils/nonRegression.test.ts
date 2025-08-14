import { searchGoogle, openDirectLink, filterAndJoin } from '../../lib/utils';

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

// Mock URL constructor pour les tests openDirectLink
const mockURL = jest.fn();
Object.defineProperty(global, 'URL', {
  writable: true,
  value: mockURL,
});

describe('Non-régression des autres fonctions', () => {
  beforeEach(() => {
    mockWindowOpen.mockClear();
    mockConsoleWarn.mockClear();
    mockURL.mockClear();
  });

  describe('searchGoogle', () => {
    test('devrait fonctionner normalement avec des accents (pas de modification)', () => {
      searchGoogle('José', 'Müller');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.google.com/search?q=Jos%C3%A9%20M%C3%BCller',
        'dimicall-google-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });

    test('devrait fonctionner normalement sans accents', () => {
      searchGoogle('John', 'Smith');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.google.com/search?q=John%20Smith',
        'dimicall-google-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });

    test('devrait afficher un warning pour des valeurs vides', () => {
      searchGoogle('', '');
      
      expect(mockConsoleWarn).toHaveBeenCalledWith('Aucune valeur valide pour la recherche Google');
      expect(mockWindowOpen).not.toHaveBeenCalled();
    });

    test('devrait utiliser les bons paramètres de fenêtre Google', () => {
      searchGoogle('Jean', 'Martin');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.any(String),
        'dimicall-google-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });
  });

  describe('openDirectLink', () => {
    beforeEach(() => {
      // Mock URL constructor pour qu'il ne lance pas d'erreur
      mockURL.mockImplementation((url) => ({ href: url }));
    });

    test('devrait fonctionner normalement avec des URLs valides', () => {
      openDirectLink('https://example.com');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://example.com',
        'dimicall-link-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });

    test('devrait ajouter https:// aux URLs sans protocole', () => {
      openDirectLink('example.com');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://example.com',
        'dimicall-link-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });

    test('devrait afficher un warning pour des URLs invalides', () => {
      // Mock URL constructor pour lancer une erreur
      mockURL.mockImplementation(() => {
        throw new Error('Invalid URL');
      });

      openDirectLink('invalid-url');
      
      expect(mockConsoleWarn).toHaveBeenCalledWith('URL invalide:', 'invalid-url');
      expect(mockWindowOpen).not.toHaveBeenCalled();
    });

    test('devrait utiliser les bons paramètres de fenêtre Link', () => {
      openDirectLink('https://example.com');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.any(String),
        'dimicall-link-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });
  });

  describe('filterAndJoin', () => {
    test('devrait fonctionner normalement avec des accents (pas de modification)', () => {
      const result = filterAndJoin('José', 'Müller');
      expect(result).toBe('José Müller');
    });

    test('devrait fonctionner normalement sans accents', () => {
      const result = filterAndJoin('John', 'Smith');
      expect(result).toBe('John Smith');
    });

    test('devrait filtrer les valeurs vides', () => {
      const result = filterAndJoin('Jean', '', 'Martin');
      expect(result).toBe('Jean Martin');
    });

    test('devrait filtrer les valeurs null et undefined', () => {
      const result = filterAndJoin('Jean', null, undefined, 'Martin');
      expect(result).toBe('Jean Martin');
    });

    test('devrait filtrer les valeurs N/A', () => {
      const result = filterAndJoin('Jean', 'N/A', 'Martin');
      expect(result).toBe('Jean Martin');
    });

    test('devrait filtrer les valeurs "null" et "undefined" en string', () => {
      const result = filterAndJoin('Jean', 'null', 'undefined', 'Martin');
      expect(result).toBe('Jean Martin');
    });

    test('devrait retourner une chaîne vide si toutes les valeurs sont filtrées', () => {
      const result = filterAndJoin('', null, undefined, 'N/A');
      expect(result).toBe('');
    });

    test('devrait trimmer les espaces en début et fin', () => {
      const result = filterAndJoin('  Jean  ', '  Martin  ');
      expect(result).toBe('Jean Martin');
    });

    test('devrait préserver les espaces internes', () => {
      const result = filterAndJoin('Jean Pierre', 'Van Der Berg');
      expect(result).toBe('Jean Pierre Van Der Berg');
    });
  });

  describe('Vérification que les autres fonctions utilitaires restent intactes', () => {
    test('filterAndJoin devrait toujours préserver les accents', () => {
      const testCases = [
        ['José', 'Müller', 'José Müller'],
        ['François', 'Cœur', 'François Cœur'],
        ['Amélie', 'Noël', 'Amélie Noël'],
        ['JOSÉ', 'müller', 'JOSÉ müller']
      ];

      testCases.forEach(([prenom, nom, expected]) => {
        const result = filterAndJoin(prenom, nom);
        expect(result).toBe(expected);
      });
    });

    test('searchGoogle devrait toujours préserver les accents dans l\'URL', () => {
      searchGoogle('José', 'Müller');
      
      // Vérifier que l'URL contient les accents encodés
      const expectedUrl = 'https://www.google.com/search?q=Jos%C3%A9%20M%C3%BCller';
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expectedUrl,
        'dimicall-google-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });
  });
});