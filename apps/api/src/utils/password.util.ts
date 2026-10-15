import { Logger } from '@nestjs/common';
import argon2 from 'argon2';

const logger = new Logger('PasswordUtil');

export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await argon2.hash(password);
  } catch (err) {
    logger.error(
      'Failed to hash password',
      err instanceof Error ? err.stack : err,
    );
    throw new Error('Can not hash password.', { cause: err });
  }
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  try {
    return await argon2.verify(hashedPassword, password);
  } catch (err) {
    logger.error(
      'Failed to verify password',
      err instanceof Error ? err.stack : err,
    );
    return false;
  }
};
