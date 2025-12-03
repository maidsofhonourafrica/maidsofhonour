/**
 * PII Redaction Utility
 *
 * Redacts personally identifiable information from logs to comply with Kenya DPA.
 * Use this utility before logging any user data.
 */

const PII_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'phoneNumber',
  'phone',
  'email',
  'nationalId',
  'idNumber',
  'passport',
  'bankAccount',
  'mpesaNumber',
  'authorization',
  'cookie',
  'secret',
  'apiKey',
  'api_key',
];

/**
 * Redacts PII from an object recursively
 */
export function redactPII(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactPII(item));
  }

  const redacted: any = {};

  for (const [key, value] of Object.entries(obj)) {
    // Check if field name contains PII
    const isPII = PII_FIELDS.some(field =>
      key.toLowerCase().includes(field.toLowerCase())
    );

    if (isPII) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      // Recursively redact nested objects
      redacted[key] = redactPII(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Redacts PII from a string (phone numbers, emails)
 */
export function redactPIIFromString(str: string): string {
  // Redact email addresses
  str = str.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');

  // Redact phone numbers (Kenyan format)
  str = str.replace(/\b(254|0)[17]\d{8}\b/g, '[PHONE_REDACTED]');

  // Redact credit card numbers
  str = str.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD_REDACTED]');

  // Redact national IDs (Kenyan format - 8 digits)
  str = str.replace(/\b\d{8}\b/g, '[ID_REDACTED]');

  return str;
}

/**
 * Masks part of a string (useful for displaying partial info)
 * Example: maskString('254722299179', 4, 4) => '2547****9179'
 */
export function maskString(str: string, showStart: number = 4, showEnd: number = 4): string {
  if (str.length <= showStart + showEnd) {
    return '*'.repeat(str.length);
  }

  const start = str.substring(0, showStart);
  const end = str.substring(str.length - showEnd);
  const masked = '*'.repeat(str.length - showStart - showEnd);

  return `${start}${masked}${end}`;
}
