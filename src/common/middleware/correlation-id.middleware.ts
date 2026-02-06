import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { IRequestWithRequestId } from '../interfaces/request.interface';

/**
 * Correlation ID Header name - Standard header for distributed tracing.
 * Also checks for X-Request-ID for backwards compatibility.
 */
export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Middleware that handles request correlation/tracing IDs.
 *
 * Features:
 * - Generates a unique requestId for each request
 * - Accepts incoming X-Correlation-ID header for distributed tracing
 * - Attaches both IDs to the request object and response headers
 * - Records request start time for duration calculation
 *
 * Usage in distributed systems:
 * - Frontend sends X-Correlation-ID to trace user sessions
 * - Backend generates requestId for individual request tracking
 * - Both IDs are included in logs for complete traceability
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
    use(req: IRequestWithRequestId, res: Response, next: NextFunction): void {
        // Generate unique request ID for this specific request
        const requestId = uuidv4();

        // Check for incoming correlation ID (from upstream services or frontend)
        const incomingCorrelationId =
            req.headers[CORRELATION_ID_HEADER] || req.headers[REQUEST_ID_HEADER];

        // Use incoming correlation ID if present, otherwise use request ID
        const correlationId =
            typeof incomingCorrelationId === 'string'
                ? incomingCorrelationId
                : Array.isArray(incomingCorrelationId)
                    ? incomingCorrelationId[0]
                    : requestId;

        // Attach IDs to request object
        req.requestId = requestId;
        req.correlationId = correlationId;
        req.startTime = Date.now();

        // Set response headers for client tracking
        res.setHeader(REQUEST_ID_HEADER, requestId);
        res.setHeader(CORRELATION_ID_HEADER, correlationId);

        next();
    }
}
