import { normalizeEmail, normalizeUserAgent } from './normalize.util';

describe('Normalize Utilities', () => {
  describe('normalizeUserAgent', () => {
    it('should return undefined when input is undefined', () => {
      expect(normalizeUserAgent(undefined)).toBeUndefined();
    });

    it('should return string unchanged when input is string', () => {
      expect(normalizeUserAgent('Mozilla/5.0')).toBe('Mozilla/5.0');
    });

    it('should join array with comma when input is string[]', () => {
      expect(normalizeUserAgent(['Mozilla/5.0', 'CustomAgent/1.0'])).toBe(
        'Mozilla/5.0, CustomAgent/1.0',
      );
    });
  });

  describe('normalizeEmail', () => {
    it('should trim and lowercase email', () => {
      expect(normalizeEmail('  John.Doe@Example.COM  ')).toBe(
        'john.doe@example.com',
      );
    });

    it('should handle already trimmed and lowercase email', () => {
      expect(normalizeEmail('test@example.com')).toBe('test@example.com');
    });
  });
});
