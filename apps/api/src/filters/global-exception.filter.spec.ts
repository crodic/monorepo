import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  UnprocessableEntityException,
  ValidationError,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { GlobalExceptionFilter } from './global-exception.filter';
import { ErrorCode } from '../common/constants/error-code.constant';
import { ValidationException } from '../common/exceptions/validation.exception';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let configService: ConfigService;
  let mockResponse: {
    status: jest.Mock;
    json: jest.Mock;
    headersSent: boolean;
  };
  let mockRequest: {
    i18nContext?: {
      t: jest.Mock;
    };
  };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue(false),
      getOrThrow: jest.fn().mockReturnValue(false),
    } as unknown as ConfigService;

    filter = new GlobalExceptionFilter(configService as any);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false,
    };

    mockRequest = {
      i18nContext: {
        t: jest.fn((key: string) => `translated:${key}`),
      },
    };

    mockHost = {
      getType: jest.fn().mockReturnValue('http'),
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should ignore if response headers are already sent', () => {
    mockResponse.headersSent = true;
    filter.catch(new Error('fail'), mockHost);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should handle UnprocessableEntityException with validation details', () => {
    const validationError: ValidationError = {
      property: 'email',
      constraints: {
        isEmail: 'email must be an email',
      },
      children: [],
    };

    const exception = new UnprocessableEntityException([validationError]);
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'Validation failed',
        details: [
          {
            property: 'email',
            code: 'isEmail',
            message: 'email must be an email',
          },
        ],
      }),
    );
  });

  it('should handle ValidationException with ErrorCode and translation', () => {
    const exception = new ValidationException(ErrorCode.V001);
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: 'V001',
        message: 'translated:user.validation.is_empty',
      }),
    );
  });

  it('should handle HttpException correctly', () => {
    const exception = new HttpException(
      'Forbidden access',
      HttpStatus.FORBIDDEN,
    );
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Forbidden access',
      }),
    );
  });

  it('should handle EntityNotFoundError with 404 and translated message', () => {
    const exception = new EntityNotFoundError('User', { id: 1 });
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'translated:common.error.entity_not_found',
      }),
    );
  });

  it('should handle QueryFailedError with unique constraint violation (409 Conflict)', () => {
    const error = new QueryFailedError(
      'SELECT 1',
      [],
      new Error('duplicate key'),
    );
    (error as any).code = '23505';
    (error as any).constraint = 'UQ_user_email';

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        message: 'translated:error.unique.email',
      }),
    );
  });

  it('should handle QueryFailedError with general DB error without leaking SQL (500)', () => {
    const error = new QueryFailedError(
      'SELECT secret_password FROM users',
      [],
      new Error('connection lost'),
    );

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    const jsonCall = mockResponse.json.mock.calls[0][0];
    expect(jsonCall.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonCall.message).toBe(
      'translated:common.error.internal_server_error',
    );
    expect(jsonCall.message).not.toContain('secret_password');
  });

  it('should include stack trace when debug is enabled', () => {
    (configService.get as jest.Mock).mockReturnValue(true);
    const exception = new Error('Test debug error');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    const jsonCall = mockResponse.json.mock.calls[0][0];
    expect(jsonCall.stack).toBeDefined();
    expect(jsonCall.trace).toBeDefined();
  });
});
