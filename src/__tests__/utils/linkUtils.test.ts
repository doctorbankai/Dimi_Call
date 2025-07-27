import { isValidUrl, openDirectLink } from '../../lib/utils';

// Mock window.open
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  writable: true,
  value: mockWindowOpen,
});

describe('Link Utilities', () => {
  beforeEach(() => {
    mockWindowOpen.mockClear();
  });

  describe('isValidUrl', () => {
    test('should validate correct URLs with protocol', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://test.org')).toBe(true);
      expect(isValidUrl('https://www.google.com/search?q=test')).toBe(true);
      expect(isValidUrl('https://linkedin.com/in/profile')).toBe(true);
    });

    test('should validate URLs without protocol', () => {
      expect(isValidUrl('example.com')).toBe(true);
      expect(isValidUrl('www.test.org')).toBe(true);
      expect(isValidUrl('subdomain.example.com')).toBe(true);
    });

    test('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('   ')).toBe(false);
      expect(isValidUrl('just text')).toBe(false);
    });

    test('should handle null and undefined', () => {
      expect(isValidUrl(null as any)).toBe(false);
      expect(isValidUrl(undefined as any)).toBe(false);
    });

    test('should handle special cases', () => {
      expect(isValidUrl('localhost:3000')).toBe(true);
      expect(isValidUrl('192.168.1.1')).toBe(true);
      expect(isValidUrl('ftp://files.example.com')).toBe(true);
    });
  });

  describe('openDirectLink', () => {
    test('should open valid URL with https prefix', () => {
      openDirectLink('example.com');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://example.com',
        'dimicall-link-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });

    test('should open URL that already has protocol', () => {
      openDirectLink('https://example.com');
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://example.com',
        'dimicall-link-window',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
    });

    test('should not open invalid URLs', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      openDirectLink('invalid-url');
      
      expect(mockWindowOpen).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('URL invalide:', 'invalid-url');
      
      consoleSpy.mockRestore();
    });

    test('should handle empty or null URLs', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      openDirectLink('');
      openDirectLink(null as any);
      openDirectLink(undefined as any);
      
      expect(mockWindowOpen).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledTimes(3);
      
      consoleSpy.mockRestore();
    });

    test('should handle window.open returning null', () => {
      mockWindowOpen.mockReturnValueOnce(null);
      
      openDirectLink('https://example.com');
      
      expect(mockWindowOpen).toHaveBeenCalled();
    });
  });
});