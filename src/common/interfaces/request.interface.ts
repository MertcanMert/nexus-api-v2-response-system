import { Request } from 'express';

/**
 * Extended Request interface with tracking and tracing properties.
 *
 * @property requestId - Unique identifier for this specific request (generated per request)
 * @property correlationId - Trace ID for distributed tracing (may be received from upstream)
 * @property startTime - Unix timestamp when request was received (for duration calculation)
 */
export interface IRequestWithRequestId extends Request {
  /** Unique identifier generated for each incoming request */
  requestId?: string;

  /**
   * Correlation ID for distributed tracing.
   * If X-Correlation-ID header is present, it will be used.
   * Otherwise, falls back to requestId.
   */
  correlationId?: string;

  /** Request start timestamp in milliseconds (Date.now()) */
  startTime?: number;
}
