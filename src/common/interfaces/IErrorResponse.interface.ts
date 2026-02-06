import { ErrorCategory } from '../enums/error-category.enum';

/**
 * Standard error response interface for all API errors.
 * Provides consistent error structure across the entire application.
 */
export interface IErrorResponse {
  /** Always false for error responses */
  success: boolean;

  /** HTTP status code */
  statusCode: number;

  /** Metadata about the error and request context */
  meta: {
    /** Unique identifier for this specific request */
    requestId: string;

    /** Correlation ID for distributed tracing */
    correlationId: string;

    /** Request path/URL */
    path: string;

    /** HTTP method (GET, POST, etc.) */
    method: string;

    /** Response language */
    lang: string;

    /** Client IPv4 address */
    ipv4: string;

    /** Client IPv6 address */
    ipv6: string;

    /** Error message(s) */
    message: string | string[];

    /** ISO timestamp of when error occurred */
    timestamp: string;

    /** Categorized error type for analytics */
    errorCategory: ErrorCategory;

    /** Structured validation errors for form fields */
    errors?: Record<string, string[]>;
  };
}
