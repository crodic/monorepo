import { stripHtmlTags } from './helpers';

describe('Helpers', () => {
  describe('stripHtmlTags', () => {
    it('should return empty string when input is undefined or empty', () => {
      expect(stripHtmlTags(undefined)).toBe('');
      expect(stripHtmlTags('')).toBe('');
    });

    it('should strip basic HTML tags', () => {
      expect(stripHtmlTags('<p>Hello <b>World</b>!</p>')).toBe('Hello World!');
    });

    it('should strip nested tags and trim whitespace', () => {
      expect(stripHtmlTags('   <div><span>Test text</span></div>   ')).toBe(
        'Test text',
      );
    });

    it('should handle strings with no HTML tags', () => {
      expect(stripHtmlTags('Simple text')).toBe('Simple text');
    });
  });
});
