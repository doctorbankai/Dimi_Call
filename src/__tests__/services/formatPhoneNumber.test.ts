import { formatPhoneNumber } from '../../services/dataService';

describe('formatPhoneNumber - Comprehensive Test Suite', () => {
  // Test existing functionality to ensure no regression
  describe('Existing Formats (Regression Tests)', () => {
    test('should handle empty/null inputs', () => {
      expect(formatPhoneNumber('')).toBe('');
      expect(formatPhoneNumber(null as any)).toBe('');
      expect(formatPhoneNumber(undefined as any)).toBe('');
    });

    test('should format standard 10-digit numbers starting with 0', () => {
      expect(formatPhoneNumber('0123456789')).toBe('+33 1 23 45 67 89');
      expect(formatPhoneNumber('0612345678')).toBe('+33 6 12 34 56 78');
      expect(formatPhoneNumber('0712345678')).toBe('+33 7 12 34 56 78');
    });

    test('should handle already formatted +33 numbers', () => {
      expect(formatPhoneNumber('+33123456789')).toBe('+33 1 23 45 67 89');
      expect(formatPhoneNumber('+33612345678')).toBe('+33 6 12 34 56 78');
    });

    test('should handle +33(0) format', () => {
      expect(formatPhoneNumber('+330123456789')).toBe('+33 1 23 45 67 89');
      expect(formatPhoneNumber('+330612345678')).toBe('+33 6 12 34 56 78');
    });

    test('should handle 33 prefix without +', () => {
      expect(formatPhoneNumber('33123456789')).toBe('+33 1 23 45 67 89');
      expect(formatPhoneNumber('33612345678')).toBe('+33 6 12 34 56 78');
    });

    test('should handle 9-digit mobile numbers (6/7 prefix)', () => {
      expect(formatPhoneNumber('612345678')).toBe('+33 6 12 34 56 78');
      expect(formatPhoneNumber('712345678')).toBe('+33 7 12 34 56 78');
    });

    test('should handle 9-digit fixed numbers (1-5 prefix)', () => {
      expect(formatPhoneNumber('123456789')).toBe('+33 1 23 45 67 89');
      expect(formatPhoneNumber('523456789')).toBe('+33 5 23 45 67 89');
    });

    test('should handle numbers with spaces and special characters', () => {
      expect(formatPhoneNumber('01 23 45 67 89')).toBe('+33 1 23 45 67 89');
      expect(formatPhoneNumber('01.23.45.67.89')).toBe('+33 1 23 45 67 89');
      expect(formatPhoneNumber('01-23-45-67-89')).toBe('+33 1 23 45 67 89');
    });
  });

  // Test new problematic formats
  describe('Truncated Numbers (9 digits starting with 0)', () => {
    test('should format truncated mobile numbers correctly', () => {
      expect(formatPhoneNumber('0069540063')).toBe('+33 6 95 40 06 3');
      expect(formatPhoneNumber('061410014')).toBe('+33 6 14 10 01 4');
      expect(formatPhoneNumber('077692322')).toBe('+33 7 76 92 32 2');
    });

    test('should handle truncated numbers with spaces', () => {
      expect(formatPhoneNumber('0 06 95 40 063')).toBe('+33 6 95 40 06 3');
      expect(formatPhoneNumber('0614 10014')).toBe('+33 6 14 10 01 4');
    });
  });

  describe('Malformed +033 Prefix', () => {
    test('should correct +033 to +33', () => {
      expect(formatPhoneNumber('+033610291377')).toBe('+33 6 10 29 13 77');
      expect(formatPhoneNumber('+033613417984')).toBe('+33 6 13 41 79 84');
      expect(formatPhoneNumber('+033622418387')).toBe('+33 6 22 41 83 87');
      expect(formatPhoneNumber('+033646040048')).toBe('+33 6 46 04 00 48');
      expect(formatPhoneNumber('+033652511146')).toBe('+33 6 52 51 11 46');
      expect(formatPhoneNumber('+033695598663')).toBe('+33 6 95 59 86 63');
      expect(formatPhoneNumber('+033762347191')).toBe('+33 7 62 34 71 91');
      expect(formatPhoneNumber('+033782825070')).toBe('+33 7 82 82 50 70');
    });
  });

  describe('Numbers with Extra Digits', () => {
    test('should truncate 11-digit numbers to 10 digits', () => {
      expect(formatPhoneNumber('06551215174')).toBe('+33 6 55 12 15 17');
      expect(formatPhoneNumber('06652823324')).toBe('+33 6 65 28 23 32');
      expect(formatPhoneNumber('06619086667')).toBe('+33 6 61 90 86 66');
      expect(formatPhoneNumber('06695811507')).toBe('+33 6 69 58 11 50');
    });

    test('should handle extra digits with +033 prefix', () => {
      expect(formatPhoneNumber('+03361029137')).toBe('+33 6 10 29 13 7');
    });
  });

  describe('Malformed + Prefix', () => {
    test('should correct +0 to +33', () => {
      expect(formatPhoneNumber('+06028208067')).toBe('+33 6 02 82 08 06');
      expect(formatPhoneNumber('+062062089')).toBe('+33 6 20 62 08 9');
      expect(formatPhoneNumber('+062662021')).toBe('+33 6 26 62 02 1');
      expect(formatPhoneNumber('+062815205')).toBe('+33 6 28 15 20 5');
      expect(formatPhoneNumber('+064975914')).toBe('+33 6 49 75 91 4');
      expect(formatPhoneNumber('+065937025')).toBe('+33 6 59 37 02 5');
      expect(formatPhoneNumber('+073367877')).toBe('+33 7 33 67 87 7');
      expect(formatPhoneNumber('+07802753506')).toBe('+33 7 80 27 53 50');
    });
  });

  describe('Numbers with Spaces', () => {
    test('should handle various space patterns', () => {
      expect(formatPhoneNumber('07 64 87 78 96')).toBe('+33 7 64 87 78 96');
      expect(formatPhoneNumber('06 64 87 78 96')).toBe('+33 6 64 87 78 96');
      expect(formatPhoneNumber(' 06 12 34 56 78 ')).toBe('+33 6 12 34 56 78');
      expect(formatPhoneNumber('06  12  34  56  78')).toBe('+33 6 12 34 56 78');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should return original for unrecognized formats', () => {
      expect(formatPhoneNumber('123')).toBe('123');
      expect(formatPhoneNumber('abcdefghij')).toBe('abcdefghij');
      expect(formatPhoneNumber('++33612345678')).toBe('++33612345678');
    });

    test('should handle very long numbers', () => {
      const longNumber = '0612345678901234567890';
      expect(formatPhoneNumber(longNumber)).toBe(longNumber);
    });

    test('should handle numbers with only special characters', () => {
      expect(formatPhoneNumber('---')).toBe('---');
      expect(formatPhoneNumber('...')).toBe('...');
      expect(formatPhoneNumber('+++')).toBe('+++');
    });

    test('should handle mixed valid/invalid characters', () => {
      expect(formatPhoneNumber('06abc12def34')).toBe('0612345678'); // Should clean and process if possible
    });
  });

  describe('Performance Tests', () => {
    test('should format numbers quickly', () => {
      const testNumbers = [
        '0612345678',
        '+33612345678',
        '061410014',
        '+033610291377',
        '06551215174',
        '+06028208067'
      ];

      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        testNumbers.forEach(num => formatPhoneNumber(num));
      }
      
      const endTime = performance.now();
      const avgTimePerCall = (endTime - startTime) / (1000 * testNumbers.length);
      
      // Should be less than 1ms per call
      expect(avgTimePerCall).toBeLessThan(1);
    });

    test('should handle large datasets without performance degradation', () => {
      const largeDataset = Array(10000).fill('0612345678');
      
      const startTime = performance.now();
      largeDataset.forEach(num => formatPhoneNumber(num));
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const avgTimePerCall = totalTime / largeDataset.length;
      
      expect(avgTimePerCall).toBeLessThan(1);
      expect(totalTime).toBeLessThan(5000); // Total should be less than 5 seconds
    });
  });
});