import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { FileStorageAccessGuard } from './file-storage-access.guard';

describe('FileStorageAccessGuard', () => {
  const createContext = () =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    }) as any;

  it('attaches the user without requiring an active CLS context', () => {
    const cls = {
      isActive: jest.fn(() => false),
      set: jest.fn(),
    };
    const guard = new FileStorageAccessGuard({} as any, cls as any);
    const user = { id: '1' };

    expect(() =>
      guard.handleRequest(null, user, null, createContext()),
    ).not.toThrow();
    expect(cls.set).not.toHaveBeenCalled();
  });

  it('throws unauthorized when private media has no authenticated user', () => {
    const guard = new FileStorageAccessGuard({} as any, {} as any);

    expect(() =>
      guard.handleRequest(
        null,
        null,
        { message: 'Unauthorized' },
        createContext(),
      ),
    ).toThrow(UnauthorizedException);
  });

  it('maps media query token to an authorization header for this request only', () => {
    const guard = new FileStorageAccessGuard({} as any, {} as any);
    const request = {
      query: { token: 'media-access-token' },
      headers: {},
    };

    (guard as any).applyMediaQueryToken(request);

    expect(request.headers).toEqual({
      authorization: 'Bearer media-access-token',
    });
  });

  it('does not override an existing authorization header with query token', () => {
    const guard = new FileStorageAccessGuard({} as any, {} as any);
    const request = {
      query: { token: 'media-access-token' },
      headers: { authorization: 'Bearer existing-token' },
    };

    (guard as any).applyMediaQueryToken(request);

    expect(request.headers.authorization).toBe('Bearer existing-token');
  });

  describe('temporary signed URLs', () => {
    const publicId = 'test_pub_123';
    const secret = 'test-secret-key-32';
    const configService = {
      get: jest.fn(() => secret),
    };

    const makeSignedUrlGuard = () =>
      new FileStorageAccessGuard(
        {} as any,
        {} as any,
        undefined,
        configService as any,
      );

    const makeContext = (params: any, query: any) =>
      ({
        switchToHttp: () => ({
          getRequest: () => ({ params, query }),
        }),
      }) as any;

    it('allows access when temporary URL signature is valid and not expired', async () => {
      const guard = makeSignedUrlGuard();
      const futureExpires = Math.floor(Date.now() / 1000) + 900;
      const signature = createHmac('sha256', secret)
        .update(`${publicId}:${futureExpires}`)
        .digest('hex');

      const context = makeContext(
        { publicId },
        { expires: String(futureExpires), signature },
      );

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('throws ForbiddenException when temporary URL is expired', async () => {
      const guard = makeSignedUrlGuard();
      const pastExpires = Math.floor(Date.now() / 1000) - 10; // expired 10s ago
      const signature = createHmac('sha256', secret)
        .update(`${publicId}:${pastExpires}`)
        .digest('hex');

      const context = makeContext(
        { publicId },
        { expires: String(pastExpires), signature },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws UnauthorizedException when temporary URL signature is invalid', async () => {
      const guard = makeSignedUrlGuard();
      const futureExpires = Math.floor(Date.now() / 1000) + 900;

      const context = makeContext(
        { publicId },
        { expires: String(futureExpires), signature: 'bad-signature-hex' },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws BadRequestException when only one temporary URL parameter is passed', async () => {
      const guard = makeSignedUrlGuard();
      const context = makeContext(
        { publicId },
        { expires: '1729680000' }, // missing signature
      );

      await expect(guard.canActivate(context)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
