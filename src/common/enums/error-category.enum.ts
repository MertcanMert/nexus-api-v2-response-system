/**
 * Error categories for structured error handling and monitoring.
 * These categories help in:
 * - Grouping errors for analytics
 * - Setting up targeted alerts
 * - Filtering logs by error type
 */
export enum ErrorCategory {
    /** Input validation failures (e.g., invalid email format, missing required fields) */
    VALIDATION = 'VALIDATION',

    /** Authentication failures (e.g., invalid credentials, expired token) */
    AUTHENTICATION = 'AUTHENTICATION',

    /** Authorization failures (e.g., insufficient permissions, forbidden resource) */
    AUTHORIZATION = 'AUTHORIZATION',

    /** Resource not found (e.g., user not found, endpoint not found) */
    NOT_FOUND = 'NOT_FOUND',

    /** Database-related errors (e.g., connection failed, query timeout) */
    DATABASE = 'DATABASE',

    /** External service errors (e.g., third-party API failure, timeout) */
    EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',

    /** Rate limiting errors (e.g., too many requests) */
    RATE_LIMIT = 'RATE_LIMIT',

    /** Business logic errors (e.g., insufficient balance, duplicate entry) */
    BUSINESS_LOGIC = 'BUSINESS_LOGIC',

    /** Internal server errors (e.g., unexpected exceptions, system failures) */
    INTERNAL = 'INTERNAL',

    /** Unknown/uncategorized errors */
    UNKNOWN = 'UNKNOWN',
}

/**
 * Maps HTTP status codes to error categories.
 * @param statusCode - The HTTP status code
 * @param errorMessage - Optional error message for more specific categorization
 * @returns The corresponding error category
 */
export function getErrorCategory(
    statusCode: number,
    errorMessage?: string,
): ErrorCategory {
    // First, map by status code (priority)
    switch (statusCode) {
        case 400:
            return ErrorCategory.VALIDATION;
        case 401:
            return ErrorCategory.AUTHENTICATION;
        case 403:
            return ErrorCategory.AUTHORIZATION;
        case 404:
            return ErrorCategory.NOT_FOUND;
        case 429:
            return ErrorCategory.RATE_LIMIT;
        case 422:
            return ErrorCategory.BUSINESS_LOGIC;
    }

    // For 5xx errors, check message for more specific categorization
    if (statusCode >= 500 && errorMessage) {
        const lowerMessage = errorMessage.toLowerCase();

        if (
            lowerMessage.includes('database') ||
            lowerMessage.includes('prisma') ||
            lowerMessage.includes('sql') ||
            lowerMessage.includes('connection')
        ) {
            return ErrorCategory.DATABASE;
        }

        if (
            lowerMessage.includes('timeout') ||
            lowerMessage.includes('external service') ||
            lowerMessage.includes('third-party') ||
            lowerMessage.includes('upstream')
        ) {
            return ErrorCategory.EXTERNAL_SERVICE;
        }
    }

    // Default mappings for ranges
    if (statusCode >= 400 && statusCode < 500) {
        return ErrorCategory.VALIDATION;
    }

    if (statusCode >= 500) {
        return ErrorCategory.INTERNAL;
    }

    return ErrorCategory.UNKNOWN;
}
