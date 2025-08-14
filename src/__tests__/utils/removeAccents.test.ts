import { removeAccents } from '../../lib/utils';

describe('removeAccents', () => {
  describe('Accents français courants', () => {
    test('devrait supprimer les accents aigus', () => {
      expect(removeAccents('José')).toBe('Jose');
      expect(removeAccents('Amélie')).toBe('Amelie');
      expect(removeAccents('André')).toBe('Andre');
    });

    test('devrait supprimer les accents graves', () => {
      expect(removeAccents('François')).toBe('Francois');
      expect(removeAccents('Michèle')).toBe('Michele');
      expect(removeAccents('Agnès')).toBe('Agnes');
    });

    test('devrait supprimer les accents circonflexes', () => {
      expect(removeAccents('Jérôme')).toBe('Jerome');
      expect(removeAccents('Gaëlle')).toBe('Gaelle');
      expect(removeAccents('Noël')).toBe('Noel');
    });

    test('devrait supprimer les trémas', () => {
      expect(removeAccents('Müller')).toBe('Muller');
      expect(removeAccents('Zoë')).toBe('Zoe');
      expect(removeAccents('Anaïs')).toBe('Anais');
    });

    test('devrait supprimer les cédilles', () => {
      expect(removeAccents('François')).toBe('Francois');
      expect(removeAccents('Garçon')).toBe('Garcon');
    });

    test('devrait gérer les ligatures françaises', () => {
      expect(removeAccents('Cœur')).toBe('Coeur');
      expect(removeAccents('Œuvre')).toBe('Oeuvre');
      expect(removeAccents('Æsop')).toBe('Aesop');
      expect(removeAccents('æther')).toBe('aether');
    });

    test('devrait gérer les noms complets avec plusieurs accents', () => {
      expect(removeAccents('José Müller')).toBe('Jose Muller');
      expect(removeAccents('François Cœur')).toBe('Francois Coeur');
      expect(removeAccents('Amélie Noël')).toBe('Amelie Noel');
    });
  });

  describe('Préservation de la casse', () => {
    test('devrait préserver les majuscules', () => {
      expect(removeAccents('JOSÉ')).toBe('JOSE');
      expect(removeAccents('FRANÇOIS')).toBe('FRANCOIS');
      expect(removeAccents('AMÉLIE')).toBe('AMELIE');
    });

    test('devrait préserver les minuscules', () => {
      expect(removeAccents('josé')).toBe('jose');
      expect(removeAccents('françois')).toBe('francois');
      expect(removeAccents('amélie')).toBe('amelie');
    });

    test('devrait préserver la casse mixte', () => {
      expect(removeAccents('José')).toBe('Jose');
      expect(removeAccents('François')).toBe('Francois');
      expect(removeAccents('Amélie')).toBe('Amelie');
    });
  });

  describe('Cas limites', () => {
    test('devrait retourner une chaîne vide pour une chaîne vide', () => {
      expect(removeAccents('')).toBe('');
    });

    test('devrait retourner une chaîne vide pour null', () => {
      expect(removeAccents(null as any)).toBe('');
    });

    test('devrait retourner une chaîne vide pour undefined', () => {
      expect(removeAccents(undefined as any)).toBe('');
    });

    test('devrait retourner une chaîne vide pour un type non-string', () => {
      expect(removeAccents(123 as any)).toBe('');
      expect(removeAccents({} as any)).toBe('');
      expect(removeAccents([] as any)).toBe('');
    });
  });

  describe('Chaînes sans accents', () => {
    test('devrait retourner la chaîne inchangée si pas d\'accents', () => {
      expect(removeAccents('John Smith')).toBe('John Smith');
      expect(removeAccents('Marie Martin')).toBe('Marie Martin');
      expect(removeAccents('Pierre Dupont')).toBe('Pierre Dupont');
    });

    test('devrait préserver les espaces', () => {
      expect(removeAccents('John Smith')).toBe('John Smith');
      expect(removeAccents('  Jean  Paul  ')).toBe('  Jean  Paul  ');
    });
  });

  describe('Préservation des caractères spéciaux non-accentués', () => {
    test('devrait préserver les tirets', () => {
      expect(removeAccents('Jean-Pierre')).toBe('Jean-Pierre');
      expect(removeAccents('Marie-Claire')).toBe('Marie-Claire');
    });

    test('devrait préserver les apostrophes', () => {
      expect(removeAccents('O\'Connor')).toBe('O\'Connor');
      expect(removeAccents('D\'Artagnan')).toBe('D\'Artagnan');
    });

    test('devrait préserver les points', () => {
      expect(removeAccents('Dr. Martin')).toBe('Dr. Martin');
      expect(removeAccents('J.P. Dupont')).toBe('J.P. Dupont');
    });

    test('devrait préserver les chiffres', () => {
      expect(removeAccents('Jean2')).toBe('Jean2');
      expect(removeAccents('Marie123')).toBe('Marie123');
    });

    test('devrait préserver les caractères spéciaux mixtes', () => {
      expect(removeAccents('Jean-Pierre O\'Connor 123')).toBe('Jean-Pierre O\'Connor 123');
    });
  });

  describe('Accents européens étendus', () => {
    test('devrait gérer les accents allemands', () => {
      expect(removeAccents('Müller')).toBe('Muller');
      expect(removeAccents('Schäfer')).toBe('Schafer');
      expect(removeAccents('Köln')).toBe('Koln');
    });

    test('devrait gérer les accents espagnols', () => {
      expect(removeAccents('José')).toBe('Jose');
      expect(removeAccents('Peña')).toBe('Pena');
      expect(removeAccents('Niño')).toBe('Nino');
    });

    test('devrait gérer les accents italiens', () => {
      expect(removeAccents('Perché')).toBe('Perche');
      expect(removeAccents('Più')).toBe('Piu');
    });
  });
});