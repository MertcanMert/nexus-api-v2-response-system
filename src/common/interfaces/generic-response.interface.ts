/**
 * Standard success response interface for all API responses.
 * Provides consistent response structure across the entire application.
 */
export interface IGenericResponse<T> {
  /** Always true for successful responses */
  success: boolean;

  /** HTTP status code */
  statusCode: number;

  /** Metadata about the request and response context */
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

    /** Request processing duration */
    duration: string;

    /** Success message */
    message: string;

    /** ISO timestamp of response */
    timestamp: string;
  };

  /** Response payload */
  data: T;
}
