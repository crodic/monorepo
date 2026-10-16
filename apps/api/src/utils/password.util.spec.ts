import { Logger } from '@nestjs/common';
import argon2 from 'argon2';
import { hashPassword, verifyPassword } from './password.util';

jest.mock('argon2');

describe('Password Utility Functions', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('hashPassword', () => {
    it('should return a hashed password', async () => {
      const password = 'testPassword';
      const hashedPassword = 'hashedPassword';
      (argon2.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(argon2.hash).toHaveBeenCalledWith(password);
    });

    it('should throw an error when hashing fails', async () => {
      const password = 'testPassword';
      (argon2.hash as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

      await expect(hashPassword(password)).rejects.toThrow(
        'Can not hash password.',
      );
      expect(argon2.hash).toHaveBeenCalledWith(password);
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testPassword';
      const hashedPassword = 'hashedPassword';
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await verifyPassword(password, hashedPassword);

      expect(result).toBe(true);
      expect(argon2.verify).toHaveBeenCalledWith(hashedPassword, password);
    });

    it('should return false for incorrect password', async () => {
      const password = 'testPassword';
      const hashedPassword = 'hashedPassword';
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      const result = await verifyPassword(password, hashedPassword);

      expect(result).toBe(false);
      expect(argon2.verify).toHaveBeenCalledWith(hashedPassword, password);
    });

    it('should return false when verification fails with an error', async () => {
      const password = 'testPassword';
      const hashedPassword = 'hashedPassword';
      (argon2.verify as jest.Mock).mockRejectedValue(
        new Error('Verification failed'),
      );

      const result = await verifyPassword(password, hashedPassword);

      expect(result).toBe(false);
      expect(argon2.verify).toHaveBeenCalledWith(hashedPassword, password);
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });
});
