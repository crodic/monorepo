import { BadRequestException } from '@nestjs/common';
import { ParseUploadSessionIdPipe } from './upload-session-id.pipe';

describe('ParseUploadSessionIdPipe', () => {
  let pipe: ParseUploadSessionIdPipe;

  beforeEach(() => {
    pipe = new ParseUploadSessionIdPipe();
  });

  it('should accept valid alphanumeric session IDs', () => {
    expect(pipe.transform('abc123DEF')).toBe('abc123DEF');
    expect(pipe.transform('session-1_test')).toBe('session-1_test');
    expect(pipe.transform('c57e1b52d2f740e69123456789abcdef')).toBe(
      'c57e1b52d2f740e69123456789abcdef',
    );
  });

  it('should reject path traversal attempts and special characters', () => {
    expect(() => pipe.transform('../etc/passwd')).toThrow(BadRequestException);
    expect(() => pipe.transform('..\\windows\\system32')).toThrow(
      BadRequestException,
    );
    expect(() => pipe.transform('session/sub')).toThrow(BadRequestException);
    expect(() => pipe.transform('session;rm -rf')).toThrow(BadRequestException);
    expect(() => pipe.transform('')).toThrow(BadRequestException);
    expect(() => pipe.transform('a'.repeat(65))).toThrow(BadRequestException);
  });
});
