import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { IRequestWithRequestId } from '../interfaces/request.interface';

/**
 * HTTP Logging Interceptor - Minimal version.
 *
 * Note: Most logging is now handled by TransformInterceptor (for success)
 * and AllExceptionsFilter (for errors). This interceptor can be used for
 * additional logging if needed, but is kept minimal to avoid duplicate logs.
 *
 * The interceptor ensures startTime is set if not already done by middleware.
 */
@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<IRequestWithRequestId>();

    // Ensure startTime is set (fallback if middleware didn't run)
    if (!request.startTime) {
      request.startTime = Date.now();
    }

    return next.handle();
  }
}
