/**
 * Vetting Callback Routes
 *
 * Webhook endpoints for Smile ID callbacks.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { validateBody } from '../middleware/validation';
import {
  smileIdCallbackSchema,
  phoneVerificationCallbackSchema,
  type SmileIdCallbackInput,
  type PhoneVerificationCallbackInput,
} from '../validation/vetting.schemas';
import { SmileIDService } from '../services/vetting/smileid.service';
import { PhoneVerificationService } from '../services/vetting/phone-verification.service';

export async function vettingCallbackRoutes(fastify: FastifyInstance) {
  const smileIdService = new SmileIDService();
  const phoneVerificationService = new PhoneVerificationService();

  /**
   * POST /api/v1/callbacks/smileid
   * Smile ID biometric verification callback
   */
  fastify.post<{ Body: SmileIdCallbackInput }>(
    '/api/v1/callbacks/smileid',
    {
      preHandler: [validateBody(smileIdCallbackSchema)],
      schema: {
        body: smileIdCallbackSchema,
      },
    },
    async (request: FastifyRequest<{ Body: SmileIdCallbackInput }>, reply: FastifyReply) => {
      const payload = request.body;

      // Extract signature and timestamp from headers
      const signature = request.headers['x-signature'] as string;
      const timestamp = request.headers['x-timestamp'] as string;

      if (!signature || !timestamp) {
        return reply.code(400).send({
          error: 'Missing signature or timestamp headers',
        });
      }

      // Verify callback signature
      const payloadString = JSON.stringify(payload);
      const isValid = smileIdService.verifyCallbackSignature(payloadString, signature, timestamp);

      if (!isValid) {
        return reply.code(401).send({
          error: 'Invalid signature',
        });
      }

      // Process callback
      try {
        const result = await smileIdService.processCallback(payload);

        return reply.code(200).send({
          success: result.success,
          message: result.message,
        });
      } catch (error: any) {
        fastify.log.error('Error processing Smile ID callback:', error);

        return reply.code(500).send({
          error: 'Failed to process callback',
          message: error.message,
        });
      }
    }
  );

  /**
   * POST /api/v1/callbacks/phone-verification
   * Phone verification callback
   */
  fastify.post<{ Body: PhoneVerificationCallbackInput }>(
    '/api/v1/callbacks/phone-verification',
    {
      preHandler: [validateBody(phoneVerificationCallbackSchema)],
      schema: {
        body: phoneVerificationCallbackSchema,
      },
    },
    async (request: FastifyRequest<{ Body: PhoneVerificationCallbackInput }>, reply: FastifyReply) => {
      const payload = request.body;

      // Extract signature and timestamp from headers
      const signature = request.headers['x-signature'] as string;
      const timestamp = request.headers['x-timestamp'] as string;

      if (!signature || !timestamp) {
        return reply.code(400).send({
          error: 'Missing signature or timestamp headers',
        });
      }

      // Verify callback signature
      const payloadString = JSON.stringify(payload);
      const isValid = phoneVerificationService.verifyCallbackSignature(
        payloadString,
        signature,
        timestamp
      );

      if (!isValid) {
        return reply.code(401).send({
          error: 'Invalid signature',
        });
      }

      // Process callback
      try {
        const result = await phoneVerificationService.processCallback(payload);

        return reply.code(200).send({
          success: result.success,
          message: result.message,
        });
      } catch (error: any) {
        fastify.log.error('Error processing phone verification callback:', error);

        return reply.code(500).send({
          error: 'Failed to process callback',
          message: error.message,
        });
      }
    }
  );
}
