import { DateCalculationService, TimeUnit } from '../../services/dateCalculationService';

describe('DateCalculationService', () => {
  beforeEach(() => {
    // Mock la date actuelle pour des tests prévisibles
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('calculateFutureDate', () => {
    it('should calculate future date for days', () => {
      const result = DateCalculationService.calculateFutureDate(5, 'days');
      expect(result).toBe('2024-01-20');
    });

    it('should calculate future date for weeks', () => {
      const result = DateCalculationService.calculateFutureDate(2, 'weeks');
      expect(result).toBe('2024-01-29');
    });

    it('should calculate future date for months', () => {
      const result = DateCalculationService.calculateFutureDate(3, 'months');
      expect(result).toBe('2024-04-15');
    });

    it('should calculate future date for years', () => {
      const result = DateCalculationService.calculateFutureDate(1, 'years');
      expect(result).toBe('2025-01-15');
    });

    it('should handle month-end dates correctly', () => {
      jest.setSystemTime(new Date('2024-01-31T10:00:00.000Z'));
      const result = DateCalculationService.calculateFutureDate(1, 'months');
      // JavaScript automatically adjusts to the last day of February
      expect(result).toBe('2024-02-29'); // 2024 is a leap year
    });

    it('should handle leap year calculations', () => {
      jest.setSystemTime(new Date('2024-02-29T10:00:00.000Z'));
      const result = DateCalculationService.calculateFutureDate(1, 'years');
      expect(result).toBe('2025-02-28'); // 2025 is not a leap year
    });

    it('should throw error for invalid quantity', () => {
      expect(() => DateCalculationService.calculateFutureDate(0, 'days')).toThrow('Quantité invalide');
      expect(() => DateCalculationService.calculateFutureDate(1000, 'days')).toThrow('Quantité invalide');
      expect(() => DateCalculationService.calculateFutureDate(-1, 'days')).toThrow('Quantité invalide');
    });

    it('should throw error for invalid unit', () => {
      expect(() => DateCalculationService.calculateFutureDate(1, 'invalid' as TimeUnit)).toThrow('Unité de temps invalide');
    });
  });

  describe('formatDateForDisplay', () => {
    it('should format date in French locale', () => {
      const result = DateCalculationService.formatDateForDisplay('2024-01-15');
      expect(result).toMatch(/lundi.*15.*janvier.*2024/i);
    });

    it('should handle invalid date gracefully', () => {
      const result = DateCalculationService.formatDateForDisplay('invalid-date');
      expect(result).toBe('invalid-date');
    });
  });

  describe('validateDateRange', () => {
    it('should validate future dates as valid', () => {
      const result = DateCalculationService.validateDateRange('2024-01-20');
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should reject past dates', () => {
      const result = DateCalculationService.validateDateRange('2024-01-10');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('La date ne peut pas être dans le passé');
    });

    it('should reject dates too far in the future', () => {
      const result = DateCalculationService.validateDateRange('2035-01-15');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('La date ne peut pas dépasser 10 ans dans le futur');
    });

    it('should warn for dates very far in the future', () => {
      const result = DateCalculationService.validateDateRange('2027-01-15');
      expect(result.isValid).toBe(true);
      expect(result.warningMessage).toBe('Cette date est très éloignée dans le futur');
    });

    it('should handle invalid date format', () => {
      const result = DateCalculationService.validateDateRange('invalid-date');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Format de date invalide');
    });

    it('should accept today as valid', () => {
      const result = DateCalculationService.validateDateRange('2024-01-15');
      expect(result.isValid).toBe(true);
    });
  });

  describe('getUnitLabel', () => {
    it('should return singular forms for quantity 1', () => {
      expect(DateCalculationService.getUnitLabel('days', 1)).toBe('jour');
      expect(DateCalculationService.getUnitLabel('weeks', 1)).toBe('semaine');
      expect(DateCalculationService.getUnitLabel('months', 1)).toBe('mois');
      expect(DateCalculationService.getUnitLabel('years', 1)).toBe('année');
    });

    it('should return plural forms for quantity > 1', () => {
      expect(DateCalculationService.getUnitLabel('days', 2)).toBe('jours');
      expect(DateCalculationService.getUnitLabel('weeks', 3)).toBe('semaines');
      expect(DateCalculationService.getUnitLabel('months', 2)).toBe('mois'); // Invariable
      expect(DateCalculationService.getUnitLabel('years', 5)).toBe('années');
    });
  });

  describe('getPreviewText', () => {
    it('should generate correct preview text', () => {
      expect(DateCalculationService.getPreviewText(1, 'days')).toBe('Dans 1 jour');
      expect(DateCalculationService.getPreviewText(2, 'days')).toBe('Dans 2 jours');
      expect(DateCalculationService.getPreviewText(1, 'weeks')).toBe('Dans 1 semaine');
      expect(DateCalculationService.getPreviewText(3, 'months')).toBe('Dans 3 mois');
      expect(DateCalculationService.getPreviewText(1, 'years')).toBe('Dans 1 année');
    });

    it('should return empty string for invalid quantity', () => {
      expect(DateCalculationService.getPreviewText(0, 'days')).toBe('');
      expect(DateCalculationService.getPreviewText(1000, 'days')).toBe('');
    });
  });

  describe('isValidQuantity', () => {
    it('should validate correct quantities', () => {
      expect(DateCalculationService.isValidQuantity(1)).toBe(true);
      expect(DateCalculationService.isValidQuantity(50)).toBe(true);
      expect(DateCalculationService.isValidQuantity(999)).toBe(true);
    });

    it('should reject invalid quantities', () => {
      expect(DateCalculationService.isValidQuantity(0)).toBe(false);
      expect(DateCalculationService.isValidQuantity(-1)).toBe(false);
      expect(DateCalculationService.isValidQuantity(1000)).toBe(false);
      expect(DateCalculationService.isValidQuantity(1.5)).toBe(false);
    });
  });

  describe('isValidDateFormat', () => {
    it('should validate correct ISO date format', () => {
      expect(DateCalculationService.isValidDateFormat('2024-01-15')).toBe(true);
      expect(DateCalculationService.isValidDateFormat('2024-12-31')).toBe(true);
    });

    it('should reject invalid date formats', () => {
      expect(DateCalculationService.isValidDateFormat('2024/01/15')).toBe(false);
      expect(DateCalculationService.isValidDateFormat('15-01-2024')).toBe(false);
      expect(DateCalculationService.isValidDateFormat('2024-1-15')).toBe(false);
      expect(DateCalculationService.isValidDateFormat('invalid')).toBe(false);
      expect(DateCalculationService.isValidDateFormat('2024-13-01')).toBe(false);
    });
  });

  describe('isValidTimeFormat', () => {
    it('should validate correct time format', () => {
      expect(DateCalculationService.isValidTimeFormat('09:30')).toBe(true);
      expect(DateCalculationService.isValidTimeFormat('23:59')).toBe(true);
      expect(DateCalculationService.isValidTimeFormat('00:00')).toBe(true);
    });

    it('should reject invalid time formats', () => {
      expect(DateCalculationService.isValidTimeFormat('9:30')).toBe(false);
      expect(DateCalculationService.isValidTimeFormat('24:00')).toBe(false);
      expect(DateCalculationService.isValidTimeFormat('09:60')).toBe(false);
      expect(DateCalculationService.isValidTimeFormat('invalid')).toBe(false);
    });
  });

  describe('getCurrentDateISO', () => {
    it('should return current date in ISO format', () => {
      const result = DateCalculationService.getCurrentDateISO();
      expect(result).toBe('2024-01-15');
    });
  });

  describe('getDaysDifference', () => {
    it('should calculate days difference correctly', () => {
      const diff = DateCalculationService.getDaysDifference('2024-01-15', '2024-01-20');
      expect(diff).toBe(5);
    });

    it('should handle reverse order dates', () => {
      const diff = DateCalculationService.getDaysDifference('2024-01-20', '2024-01-15');
      expect(diff).toBe(5);
    });
  });
});