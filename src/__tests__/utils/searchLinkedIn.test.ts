import { searchLinkedIn } from '../../lib/utils';

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

describe('searchLinkedIn', () => {
  beforeEach(() => {
    mockWindowOpen.mockClear();
    mockConsoleWarn.mockClear();
  });

  describe('Génération d\'URL avec accents', () => {
    test('devrait supprimer les accents du prénom dans l\'URL', () => {
      searchLinkedIn('José', 'Martin');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.linkedin.com/search/results/people/?keywords=Jose%20Martin',
        'dimicall-linkedin-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });

    test('devrait supprimer les accents du nom dans l\'URL', () => {
      searchLinkedIn('Jean', 'Müller');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.linkedin.com/search/results/people/?keywords=Jean%20Muller',
        'dimicall-linkedin-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });

    test('devrait supprimer les accents du prénom et du nom dans l\'URL', () => {
      searchLinkedIn('François', 'Cœur');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.linkedin.com/search/results/people/?keywords=Francois%20Coeur',
        'dimicall-linkedin-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });

    test('devrait gérer les noms complexes avec plusieurs accents', () => {
      searchLinkedIn('Amélie', 'Noël-Müller');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.linkedin.com/search/results/people/?keywords=Amelie%20Noel-Muller',
        'dimicall-linkedin-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });

    test('devrait préserver la casse lors de la suppression d\'accents', () => {
      searchLinkedIn('JOSÉ', 'müller');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.linkedin.com/search/results/people/?keywords=JOSE%20muller',
        'dimicall-linkedin-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });
  });

  describe('Comportement sans accents (régression)', () => {
    test('devrait fonctionner normalement avec des noms sans accents', () => {
      searchLinkedIn('John', 'Smith');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.linkedin.com/search/results/people/?keywords=John%20Smith',
        'dimicall-linkedin-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });

    test('devrait préserver les caractères spéciaux non-accentués', () => {
      searchLinkedIn('Jean-Pierre', 'O\'Connor');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.linkedin.com/search/results/people/?keywords=Jean-Pierre%20O\'Connor',
        'dimicall-linkedin-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });

    test('devrait gérer les espaces correctement', () => {
      searchLinkedIn('Marie Claire', 'Van Der Berg');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.linkedin.com/search/results/people/?keywords=Marie%20Claire%20Van%20Der%20Berg',
        'dimicall-linkedin-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });
  });

  describe('Utilisation correcte d\'encodeURIComponent', () => {
    test('devrait encoder correctement les caractères spéciaux', () => {
      searchLinkedIn('Jean Pierre', 'Martin & Co');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.linkedin.com/search/results/people/?keywords=Jean%20Pierre%20Martin%20%26%20Co',
        'dimicall-linkedin-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });

    test('devrait encoder correctement les espaces', () => {
      searchLinkedIn('Jean  Pierre', 'Martin');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.linkedin.com/search/results/people/?keywords=Jean%20%20Pierre%20Martin',
        'dimicall-linkedin-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });
  });

  describe('Gestion des cas limites', () => {
    test('devrait afficher un warning et ne pas ouvrir de fenêtre pour des valeurs vides', () => {
      searchLinkedIn('', '');
      
      expect(mockConsoleWarn).toHaveBeenCalledWith('Aucune valeur valide pour la recherche LinkedIn');
      expect(mockWindowOpen).not.toHaveBeenCalled();
    });

    test('devrait afficher un warning pour des valeurs null/undefined', () => {
      searchLinkedIn(null as any, undefined as any);
      
      expect(mockConsoleWarn).toHaveBeenCalledWith('Aucune valeur valide pour la recherche LinkedIn');
      expect(mockWindowOpen).not.toHaveBeenCalled();
    });

    test('devrait fonctionner avec seulement un prénom', () => {
      searchLinkedIn('José', '');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.linkedin.com/search/results/people/?keywords=Jose',
        'dimicall-linkedin-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });

    test('devrait fonctionner avec seulement un nom', () => {
      searchLinkedIn('', 'Müller');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.linkedin.com/search/results/people/?keywords=Muller',
        'dimicall-linkedin-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });
  });

  describe('Paramètres de fenêtre', () => {
    test('devrait utiliser les bons paramètres de fenêtre', () => {
      searchLinkedIn('Jean', 'Martin');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.any(String),
        'dimicall-linkedin-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });

    test('devrait utiliser le bon nom de fenêtre pour la réutilisation', () => {
      searchLinkedIn('Jean', 'Martin');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.any(String),
        'dimicall-linkedin-window',
        expect.any(String)
      );
    });
  });
});