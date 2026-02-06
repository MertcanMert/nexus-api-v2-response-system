import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { map, Observable } from 'rxjs';
import { IGenericResponse } from 'src/common/interfaces/generic-response.interface';
import { IRequestWithRequestId } from '../interfaces/request.interface';
import { getClientIpInfo } from '../utils/ip.util';
import {
  getRequestMetaData,
  SLOW_REQUEST_THRESHOLD_MS,
} from '../config/winston.config';
import { maskSensitiveData } from '../utils/mask.util';

/**
 * Transform interceptor that wraps all successful responses in a standard format.
 *
 * Features:
 * - Consistent response structure with IGenericResponse
 * - Request/response timing and slow request alerting
 * - IP enrichment (IPv4 and IPv6)
 * - Correlation ID propagation
 * - i18n language tracking
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, IGenericResponse<T>> {
  private readonly logger = new Logger('HTTP');

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IGenericResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<IRequestWithRequestId>();
    const response = ctx.getResponse<Response>();

    const i18n = I18nContext.current(context);
    const lang: string = i18n?.lang ?? 'tr';

    // Record start time if not already set by middleware
    const startTime = request.startTime || Date.now();

    // Get IP and request metadata
    const ipInfo = getClientIpInfo(request);
    const requestMeta = getRequestMetaData(request);

    return next.handle().pipe(
      map((data: unknown): IGenericResponse<T> => {
        const isObject = data !== null && typeof data === 'object';
        const dataObj = isObject ? (data as Record<string, unknown>) : {};

        const rawMessage: unknown = dataObj['message'];
        const messageString = this.formatMessage(rawMessage);

        const duration = Date.now() - startTime;
        const durationStr = `${duration}ms`;

        const requestId = request.requestId || 'N/A';
        const correlationId = request.correlationId || requestId;

        // Extract data without message field
        let finalData = data;
        if (isObject && 'message' in dataObj) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { message: _, ...rest } = dataObj;
          finalData = rest;
        }

        // Log successful request
        const shouldLogBody = ['POST', 'PUT', 'PATCH'].includes(request.method);
        const maskedBody =
          shouldLogBody && request.body && typeof request.body === 'object'
            ? maskSensitiveData(request.body as Record<string, unknown>)
            : undefined;

        this.logSuccess(
          request,
          response,
          duration,
          requestId,
          correlationId,
          ipInfo,
          requestMeta,
          maskedBody,
        );

        // Alert for slow requests
        if (duration > SLOW_REQUEST_THRESHOLD_MS) {
          this.logger.warn(
            `⏰ SLOW REQUEST: ${request.method} ${request.url} took ${duration}ms (threshold: ${SLOW_REQUEST_THRESHOLD_MS}ms)`,
            {
              requestId,
              correlationId,
              duration: durationStr,
              alertType: 'SLOW_REQUEST',
              ...requestMeta,
            },
          );
        }

        return {
          success: true,
          statusCode: response.statusCode,
          meta: {
            requestId,
            correlationId,
            path: request.url,
            method: request.method,
            lang,
            ipv4: ipInfo.ipv4,
            ipv6: ipInfo.ipv6,
            duration: durationStr,
            message: messageString,
            timestamp: new Date().toISOString(),
          },
          data: finalData as T,
        };
      }),
    );
  }

  /**
   * Log successful requests with structured format.
   */
  private logSuccess(
    request: IRequestWithRequestId,
    response: Response,
    duration: number,
    requestId: string,
    correlationId: string,
    ipInfo: { ipv4: string; ipv6: string; display: string },
    requestMeta: Record<string, unknown>,
    maskedBody?: Record<string, unknown>,
  ): void {
    const hasBody = maskedBody && Object.keys(maskedBody).length > 0;
    const bodyLog = hasBody
      ? `\n║ Body          : ${JSON.stringify(maskedBody)}`
      : '';

    const logMessage = `
  ╔══════════════════════════════════════════════════════════════╗
  ║ ✅ ${request.method} ${request.url}
  ╠══════════════════════════════════════════════════════════════╣
  ║ Request ID    : ${requestId}
  ║ Correlation ID: ${correlationId}
  ║ Status        : ${response.statusCode}
  ║ Duration      : ${duration}ms
  ║ IPv4          : ${ipInfo.ipv4 || 'N/A'}
  ║ IPv6          : ${ipInfo.ipv6 || 'N/A'}
  ║ User Agent    : ${requestMeta.userAgent || 'Unknown'}${bodyLog}
  ╚══════════════════════════════════════════════════════════════╝`;

    this.logger.log(logMessage, {
      requestId,
      correlationId,
      status: response.statusCode,
      duration: `${duration}ms`,
      ipv4: ipInfo.ipv4,
      ipv6: ipInfo.ipv6,
      ...(hasBody ? { requestBody: maskedBody } : {}),
      ...requestMeta,
    });
  }

  /**
   * Format message to string regardless of input type.
   */
  private formatMessage(message: unknown): string {
    if (message === null || message === undefined) {
      return 'Request successful';
    }

    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    // Safe conversion for primitive types
    if (
      typeof message === 'number' ||
      typeof message === 'boolean' ||
      typeof message === 'bigint'
    ) {
      return String(message);
    }

    if (typeof message === 'symbol') {
      return message.toString();
    }

    // Stringify objects to avoid [object Object]
    if (typeof message === 'object' || typeof message === 'function') {
      try {
        return JSON.stringify(message);
      } catch {
        return 'Request successful';
      }
    }

    return 'Request successful';
  }
}
