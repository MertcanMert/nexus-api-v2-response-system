/**
 * Utility functions for masking sensitive data in logs.
 * Prevents sensitive information from being exposed in log files.
 */

/** Default list of sensitive field names that should be masked */
const DEFAULT_SENSITIVE_FIELDS = [
    'password',
    'passwordConfirm',
    'currentPassword',
    'newPassword',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'api_key',
    'authorization',
    'creditCard',
    'credit_card',
    'cardNumber',
    'card_number',
    'cvv',
    'ssn',
    'socialSecurityNumber',
    'pin',
    'otp',
    'verificationCode',
    'privateKey',
    'private_key',
];

/** The mask string to replace sensitive values with */
const MASK_STRING = '***MASKED***';

/**
 * Recursively masks sensitive fields in an object.
 * @param data - The object to mask
 * @param sensitiveFields - Array of field names to mask (case-insensitive)
 * @returns A new object with sensitive fields masked
 */
export function maskSensitiveData<T extends Record<string, unknown>>(
    data: T,
    sensitiveFields: string[] = DEFAULT_SENSITIVE_FIELDS,
): T {
    if (data === null || data === undefined) {
        return data;
    }

    if (typeof data !== 'object') {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map((item) =>
            typeof item === 'object' && item !== null
                ? maskSensitiveData(item as Record<string, unknown>, sensitiveFields)
                : item,
        ) as unknown as T;
    }

    const maskedData: Record<string, unknown> = {};
    const lowerSensitiveFields = sensitiveFields.map((f) => f.toLowerCase());

    for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();

        if (lowerSensitiveFields.includes(lowerKey)) {
            // Mask the sensitive field
            maskedData[key] = MASK_STRING;
        } else if (typeof value === 'object' && value !== null) {
            // Recursively mask nested objects
            maskedData[key] = maskSensitiveData(
                value as Record<string, unknown>,
                sensitiveFields,
            );
        } else {
            maskedData[key] = value;
        }
    }

    return maskedData as T;
}

/**
 * Masks a string value partially, showing only first and last characters.
 * Useful for masking tokens, IDs, etc. while still allowing identification.
 * @param value - The string to mask
 * @param visibleStart - Number of characters to show at start (default: 4)
 * @param visibleEnd - Number of characters to show at end (default: 4)
 * @returns The partially masked string
 */
export function partialMask(
    value: string,
    visibleStart = 4,
    visibleEnd = 4,
): string {
    if (!value || typeof value !== 'string') {
        return MASK_STRING;
    }

    if (value.length <= visibleStart + visibleEnd) {
        return MASK_STRING;
    }

    const start = value.substring(0, visibleStart);
    const end = value.substring(value.length - visibleEnd);
    const maskLength = Math.min(value.length - visibleStart - visibleEnd, 8);
    const mask = '*'.repeat(maskLength);

    return `${start}${mask}${end}`;
}

/**
 * Masks email addresses, showing only part of the username and domain.
 * Example: john.doe@example.com -> j***e@e***.com
 * @param email - The email to mask
 * @returns The masked email
 */
export function maskEmail(email: string): string {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return MASK_STRING;
    }

    const [username, domain] = email.split('@');
    const maskedUsername =
        username.length > 2
            ? `${username[0]}***${username[username.length - 1]}`
            : '***';

    const domainParts = domain.split('.');
    const maskedDomain =
        domainParts.length > 1
            ? `${domainParts[0][0]}***.${domainParts[domainParts.length - 1]}`
            : '***';

    return `${maskedUsername}@${maskedDomain}`;
}

/**
 * Masks IP addresses for privacy, showing only the first segment.
 * Example: 192.168.1.100 -> 192.***.***
 * @param ip - The IP address to mask
 * @returns The masked IP
 */
export function maskIpAddress(ip: string): string {
    if (!ip || typeof ip !== 'string') {
        return MASK_STRING;
    }

    // IPv4
    if (ip.includes('.') && !ip.includes(':')) {
        const parts = ip.split('.');
        return `${parts[0]}.***.***`;
    }

    // IPv6
    if (ip.includes(':')) {
        const parts = ip.split(':');
        return `${parts[0]}:****:****`;
    }

    return MASK_STRING;
}
