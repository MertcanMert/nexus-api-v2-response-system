import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { Response } from 'express';
import {
  getSystemMetaData,
  getRequestMetaData,
  SLOW_REQUEST_THRESHOLD_MS,
} from '../config/winston.config';
import { I18nService, I18nContext } from 'nestjs-i18n';
import type { IErrorResponse } from '../interfaces/IErrorResponse.interface';
import { IRequestWithRequestId } from '../interfaces/request.interface';
import { getClientIpInfo } from '../utils/ip.util';
import { maskSensitiveData } from '../utils/mask.util';
import {
  ErrorCategory,
  getErrorCategory,
} from '../enums/error-category.enum';

/**
 * Global exception filter that catches all exceptions thrown in the application.
 *
 * Features:
 * - Structured error responses with i18n support
 * - Comprehensive logging with error categorization
 * - Request body masking for sensitive data
 * - Log enrichment with system and request metadata
 * - Slow request alerting
 * - Correlation ID support for distributed tracing
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  constructor(private readonly i18n: I18nService) { }

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<IRequestWithRequestId>();
    const i18n = I18nContext.current<Record<string, unknown>>(host);

    // Extract request identifiers
    const lang: string = i18n?.lang ?? 'tr';
    const requestId = request.requestId || 'N/A';
    const correlationId = request.correlationId || requestId;

    // Calculate request duration
    const duration = request.startTime ? Date.now() - request.startTime : 0;

    // Get IP information
    const ipInfo = getClientIpInfo(request);

    // Get enriched metadata
    const requestMeta = getRequestMetaData(request);
    const systemMeta = getSystemMetaData();

    // Mask sensitive data in request body
    const maskedBody =
      request.body && typeof request.body === 'object'
        ? maskSensitiveData(request.body as Record<string, unknown>)
        : undefined;

    // Determine status and message
    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = await this.i18n.translate(
      'common.INTERNAL_SERVER_ERROR',
      { lang },
    );
    let errorName = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorName = exception.name;
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const resBody = res as { message?: string | string[]; error?: string };
        message = resBody.message ?? resBody.error ?? 'Error';
      } else if (typeof res === 'string') {
        message = res;
      }
    } else if (exception instanceof Error) {
      errorName = exception.name;
      // In production, raw Error messages can be a security risk
      // but acceptable during development
      message = exception.message;
    }

    // Determine error category
    const messageStr = Array.isArray(message) ? message.join(', ') : message;
    const errorCategory = getErrorCategory(status, messageStr);

    // Build error response
    const errorResponse: IErrorResponse = {
      success: false,
      statusCode: status,
      meta: {
        requestId,
        correlationId,
        path: request.url,
        method: request.method,
        lang,
        message,
        timestamp: new Date().toISOString(),
        ipv4: ipInfo.ipv4,
        ipv6: ipInfo.ipv6,
        errorCategory,
        // Extract structured errors if it's a validation error
        ...(errorCategory === ErrorCategory.VALIDATION && Array.isArray(message)
          ? { errors: this.structureValidationErrors(message) }
          : {}),
      },
    };

    // Build log context object
    const logContext = {
      requestId,
      correlationId,
      errorCategory,
      errorName,
      duration: `${duration}ms`,
      lang,
      ...requestMeta,
      ipv4: ipInfo.ipv4,
      ipv6: ipInfo.ipv6,
      ...(maskedBody && Object.keys(maskedBody).length > 0
        ? { requestBody: maskedBody }
        : {}),
      ...systemMeta,
    };

    // Format log message
    const logMessage = `
╔══════════════════════════════════════════════════════════════╗
║ ${this.getStatusEmoji(status)} ${request.method} ${request.url}
╠══════════════════════════════════════════════════════════════╣
║ Request ID    : ${requestId}
║ Correlation ID: ${correlationId}
║ Category      : ${errorCategory}
║ Status        : ${status} (${errorName})
║ Duration      : ${duration}ms
║ IPv4          : ${ipInfo.ipv4 || 'N/A'}
║ IPv6          : ${ipInfo.ipv6 || 'N/A'}
║ User Agent    : ${requestMeta.userAgent}
║ Message       : ${messageStr}
╚══════════════════════════════════════════════════════════════╝`;

    // Log based on status code and category
    this.logByCategory(status, errorCategory, logMessage, exception, logContext);

    // Alert for slow requests
    if (duration > SLOW_REQUEST_THRESHOLD_MS) {
      this.logger.warn(
        `⏰ SLOW REQUEST ALERT: ${request.method} ${request.url} took ${duration}ms (threshold: ${SLOW_REQUEST_THRESHOLD_MS}ms)`,
        {
          ...logContext,
          alertType: 'SLOW_REQUEST',
        },
      );
    }

    response.status(status).json(errorResponse);
  }

  /**
   * Get appropriate emoji based on HTTP status code.
   */
  private getStatusEmoji(status: number): string {
    if (status >= 500) return '🆘 CRITICAL ERROR';
    if (status === 404) return '🔍 NOT FOUND';
    if (status === 401) return '🔐 UNAUTHORIZED';
    if (status === 403) return '🚫 FORBIDDEN';
    if (status === 429) return '⏳ RATE LIMITED';
    if (status >= 400) return '⚠️ CLIENT ERROR';
    return '❓ UNKNOWN';
  }

  /**
   * Log with appropriate level based on status and category.
   */
  private logByCategory(
    status: number,
    category: ErrorCategory,
    logMessage: string,
    exception: unknown,
    context: Record<string, unknown>,
  ): void {
    const stack = exception instanceof Error ? exception.stack : undefined;

    // 5xx - Server Errors (Critical)
    if (status >= 500) {
      this.logger.error(logMessage, {
        ...context,
        stack,
      });
      return;
    }

    // 404 - Not Found
    if (status === 404) {
      this.logger.warn(logMessage, context);
      return;
    }

    // 401/403 - Auth Errors (Security concern)
    if (status === 401 || status === 403) {
      this.logger.warn(logMessage, {
        ...context,
        securityAlert: true,
      });
      return;
    }

    // 429 - Rate Limit
    if (status === 429) {
      this.logger.warn(logMessage, {
        ...context,
        rateLimitAlert: true,
      });
      return;
    }

    // 400-499 - Client Errors
    if (status >= 400) {
      // Log validation errors at info level (expected behavior)
      if (category === ErrorCategory.VALIDATION) {
        this.logger.log(logMessage, context);
        return;
      }

      // Other client errors as warnings
      this.logger.warn(logMessage, context);
      return;
    }

    // Fallback
    this.logger.log(logMessage, context);
  }

  /**
   * Transforms flat validation error messages into a structured object.
   * Example: ["email must be an email", "password is too short"]
   * -> { email: ["email must be an email"], password: ["password is too short"] }
   */
  private structureValidationErrors(
    messages: string[],
  ): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    messages.forEach((msg) => {
      // Logic to find the field name. Usually it's the first word.
      // This is a simple heuristic; I18nValidationPipe might provide better structure
      // but if we only have the string array, we try to guess the field.
      const field = msg.split(' ')[0] || 'general';
      if (!errors[field]) {
        errors[field] = [];
      }
      errors[field].push(msg);
    });

    return errors;
  }
}
