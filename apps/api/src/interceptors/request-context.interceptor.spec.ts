import { CallHandler, ExecutionContext } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { of, throwError } from 'rxjs';
import { RequestContextInterceptor } from './request-context.interceptor';

describe('RequestContextInterceptor', () => {
  let interceptor: RequestContextInterceptor;
  let clsService: jest.Mocked<ClsService>;

  beforeEach(() => {
    clsService = {
      isActive: jest.fn().mockReturnValue(true),
      set: jest.fn(),
    } as unknown as jest.Mocked<ClsService>;

    interceptor = new RequestContextInterceptor(clsService);
  });

  it('should set request context in ClsService when active', (done) => {
    const mockRequest = {
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'Jest-Agent',
        'x-request-id': 'req-xyz',
      },
      method: 'POST',
      originalUrl: '/api/v1/test',
      body: { name: 'test' },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: () => of({ success: true }),
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({ success: true });
        expect(clsService.set).toHaveBeenCalledWith('ip', '127.0.0.1');
        expect(clsService.set).toHaveBeenCalledWith('userAgent', 'Jest-Agent');
        expect(clsService.set).toHaveBeenCalledWith('requestId', 'req-xyz');
        expect(clsService.set).toHaveBeenCalledWith('method', 'POST');
        expect(clsService.set).toHaveBeenCalledWith('endpoint', '/api/v1/test');
        expect(clsService.set).toHaveBeenCalledWith('body', { name: 'test' });
        done();
      },
    });
  });

  it('should not set context if cls is inactive', (done) => {
    clsService.isActive.mockReturnValue(false);

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: () => of(true),
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      next: () => {
        expect(clsService.set).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('should forward errors cleanly', (done) => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    } as unknown as ExecutionContext;

    const testError = new Error('Handled error');
    const mockCallHandler: CallHandler = {
      handle: () => throwError(() => testError),
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      error: (err) => {
        expect(err).toBe(testError);
        done();
      },
    });
  });
});
