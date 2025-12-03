/**
 * Webhook Signature Verification
 *
 * Verifies signatures from third-party webhook providers to prevent
 * forged callbacks that could trigger fraudulent transactions.
 */

import crypto from 'crypto';
import { logger } from './logger';

/**
 * Verify SasaPay webhook signature
 *
 * TODO: Check SasaPay documentation for signature algorithm
 * This is a placeholder implementation
 */
export function verifySasaPaySignature(
  payload: any,
  signature: string,
  secret: string
): boolean {
  try {
    // TODO: Confirm with SasaPay docs:
    // - Header name for signature
    // - Hash algorithm (SHA256, SHA512, etc.)
    // - Signature format (hex, base64, etc.)
    // - Whether to hash raw body or JSON.stringify

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    logger.error({ error }, 'Error verifying SasaPay signature');
    return false;
  }
}

/**
 * Verify WhatsApp webhook signature
 *
 * WhatsApp uses X-Hub-Signature-256 header with SHA256 HMAC
 */
export function verifyWhatsAppSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    // WhatsApp signature format: sha256=<signature>
    if (!signature.startsWith('sha256=')) {
      return false;
    }

    const signatureHash = signature.substring(7); // Remove 'sha256='

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signatureHash),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    logger.error({ error }, 'Error verifying WhatsApp signature');
    return false;
  }
}

/**
 * Generic HMAC signature verification
 */
export function verifyHmacSignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac(algorithm, secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    logger.error({ error, algorithm }, 'Error verifying HMAC signature');
    return false;
  }
}
