import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  UnprocessableEntityException,
  ValidationError,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STATUS_CODES } from 'http';
import { I18nContext } from 'nestjs-i18n';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { constraintErrors } from '../common/constants/constraint-errors';
import { ErrorCode } from '../common/constants/error-code.constant';
import { ErrorDetailDto } from '../common/dto/error-detail.dto';
import { ErrorDto } from '../common/dto/error.dto';
import { ValidationException } from '../common/exceptions/validation.exception';
import { SentryExceptionCaptured } from '@sentry/nestjs';
import { AllConfigType } from '../config/config.type';
import { I18nTranslations } from '../generated/i18n.generated';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private i18n?: I18nContext<I18nTranslations>;
  private debug = false;
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  @SentryExceptionCaptured()
  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    if (response.headersSent) {
      this.logger.error(exception);
      return;
    }

    this.i18n =
      request?.i18nContext ||
      (typeof host?.getType === 'function'
        ? I18nContext.current<I18nTranslations>(host)
        : undefined);
    this.debug = Boolean(this.configService.get('app.debug', { infer: true }));

    let error: ErrorDto;

    if (exception instanceof UnprocessableEntityException) {
      error = this.handleUnprocessableEntityException(exception);
    } else if (exception instanceof ValidationException) {
      error = this.handleValidationException(exception);
    } else if (exception instanceof HttpException) {
      error = this.handleHttpException(exception);
    } else if (exception instanceof QueryFailedError) {
      error = this.handleQueryFailedError(exception);
    } else if (exception instanceof EntityNotFoundError) {
      error = this.handleEntityNotFoundError(exception);
    } else {
      error = this.handleError(exception);
    }

    if (this.debug) {
      error.stack = exception?.stack;
      error.trace = exception instanceof Error ? exception.stack : undefined;

      this.logger.debug(error);
    }

    response.status(error.statusCode).json(error);
  }

  private translate(key: string, defaultValue?: string): string {
    if (this.i18n) {
      try {
        const translated = this.i18n.t(key as any);
        if (translated && translated !== key) {
          return translated;
        }
      } catch {
        // ignore translation failure and use defaultValue
      }
    }
    return defaultValue || key;
  }

  /**
   * Handles UnprocessableEntityException:
   * Validation pipe errors with detailed field errors
   */
  private handleUnprocessableEntityException(
    exception: UnprocessableEntityException,
  ): ErrorDto {
    const r = exception.getResponse() as {
      message: ValidationError[] | string[];
    };
    const statusCode = exception.getStatus();

    const details =
      Array.isArray(r.message) && typeof r.message[0] === 'object'
        ? this.extractValidationErrorDetails(r.message as ValidationError[])
        : undefined;

    const errorRes: ErrorDto = {
      timestamp: new Date().toISOString(),
      statusCode,
      error: STATUS_CODES[statusCode] || 'Unprocessable Entity',
      message: 'Validation failed',
      details,
    };

    this.logger.debug(exception);

    return errorRes;
  }

  /**
   * Handles validation errors with business error codes
   */
  private handleValidationException(exception: ValidationException): ErrorDto {
    const r = exception.getResponse() as {
      errorCode: ErrorCode;
      message?: string;
    };
    const statusCode = exception.getStatus();

    const translatedMessage = r.errorCode
      ? this.translate(r.errorCode, r.message)
      : r.message;

    const errorCodeKey =
      Object.keys(ErrorCode)[Object.values(ErrorCode).indexOf(r.errorCode)];

    const errorRes: ErrorDto = {
      timestamp: new Date().toISOString(),
      statusCode,
      error: STATUS_CODES[statusCode] || 'Bad Request',
      errorCode: errorCodeKey,
      message: r.message || translatedMessage || 'Validation error',
    };

    this.logger.debug(exception);

    return errorRes;
  }

  /**
   * Handles standard HttpException
   */
  private handleHttpException(exception: HttpException): ErrorDto {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();
    let message = exception.message;

    if (
      typeof response === 'object' &&
      response !== null &&
      'message' in response
    ) {
      const responseMessage = (response as any).message;
      if (typeof responseMessage === 'string') {
        message = responseMessage;
      }
    }

    const errorRes: ErrorDto = {
      timestamp: new Date().toISOString(),
      statusCode,
      error: STATUS_CODES[statusCode] || 'Http Exception',
      message,
    };

    this.logger.debug(exception);

    return errorRes;
  }

  private resolveUniqueConstraintMessage(constraint?: string): string {
    if (constraint && constraintErrors[constraint]) {
      return this.translate(constraintErrors[constraint], constraint);
    }
    if (constraint && constraint.toLowerCase().includes('email')) {
      return this.translate('user.unique.email', 'Unique constraint violation');
    }
    return this.translate(
      'common.error.unique_constraint',
      'Unique constraint violation',
    );
  }

  /**
   * Handles QueryFailedError without leaking SQL details
   */
  private handleQueryFailedError(error: QueryFailedError): ErrorDto {
    const r = error as QueryFailedError & {
      constraint?: string;
      code?: string;
      detail?: string;
    };

    const isUniqueConstraint =
      r.code === '23505' || (r.constraint && r.constraint.startsWith('UQ'));

    const status = isUniqueConstraint
      ? HttpStatus.CONFLICT
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = isUniqueConstraint
      ? this.resolveUniqueConstraintMessage(r.constraint)
      : this.translate(
          'common.error.internal_server_error',
          'Has occurred an internal server error',
        );

    const errorRes: ErrorDto = {
      timestamp: new Date().toISOString(),
      statusCode: status,
      error: STATUS_CODES[status] || 'Database Error',
      message,
    };

    this.logger.error(error);

    return errorRes;
  }

  /**
   * Handles EntityNotFoundError when using findOrFail() or findOneOrFail()
   */
  private handleEntityNotFoundError(error: EntityNotFoundError): ErrorDto {
    const status = HttpStatus.NOT_FOUND;
    const errorRes: ErrorDto = {
      timestamp: new Date().toISOString(),
      statusCode: status,
      error: STATUS_CODES[status] || 'Not Found',
      message: this.translate(
        'common.error.entity_not_found',
        'Entity not found',
      ),
    };

    this.logger.debug(error);

    return errorRes;
  }

  /**
   * Handles generic uncaught errors
   */
  private handleError(error: Error): ErrorDto {
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    const errorRes: ErrorDto = {
      timestamp: new Date().toISOString(),
      statusCode,
      error: STATUS_CODES[statusCode] || 'Internal Server Error',
      message:
        this.debug && error?.message
          ? error.message
          : this.translate(
              'common.error.internal_server_error',
              'An unexpected error occurred',
            ),
    };

    this.logger.error(error);

    return errorRes;
  }

  /**
   * Extracts error details from ValidationError[]
   */
  private extractValidationErrorDetails(
    errors: ValidationError[],
  ): ErrorDetailDto[] {
    const extractErrors = (
      error: ValidationError,
      parentProperty = '',
    ): ErrorDetailDto[] => {
      const propertyPath = parentProperty
        ? `${parentProperty}.${error.property}`
        : error.property;

      const currentErrors: ErrorDetailDto[] = Object.entries(
        error.constraints || {},
      ).map(([code, message]) => ({
        property: propertyPath,
        code,
        message,
      }));

      const childErrors: ErrorDetailDto[] =
        error.children?.flatMap((childError) =>
          extractErrors(childError, propertyPath),
        ) || [];

      return [...currentErrors, ...childErrors];
    };

    return errors.flatMap((error) => extractErrors(error));
  }
}
