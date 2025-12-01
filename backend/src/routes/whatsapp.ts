/**
 * WhatsApp Cloud API Webhook Routes
 *
 * Handles:
 * 1. Webhook verification (GET)
 * 2. Incoming messages (POST)
 * 3. Message status updates (POST)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod/v4';

interface WebhookVerificationRequest {
  'hub.mode': string;
  'hub.verify_token': string;
  'hub.challenge': string;
}

interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: {
            body: string;
          };
          button?: {
            text: string;
            payload: string;
          };
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
          errors?: Array<{
            code: number;
            title: string;
            message: string;
          }>;
        }>;
      };
      field: string;
    }>;
  }>;
}

export async function whatsappRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/whatsapp/callback
   *
   * Webhook verification endpoint
   * Meta will call this to verify the webhook
   */
  /**
   * GET /api/whatsapp/callback
   *
   * Webhook verification endpoint
   * Meta will call this to verify the webhook
   */
  fastify.get('/whatsapp/callback', {
    schema: {
      querystring: z.object({
        'hub.mode': z.string(),
        'hub.verify_token': z.string(),
        'hub.challenge': z.string(),
      }),
    },
  }, async (
    request: FastifyRequest<{
      Querystring: WebhookVerificationRequest;
    }>,
    reply: FastifyReply
  ) => {
    const mode = request.query['hub.mode'];
    const token = request.query['hub.verify_token'];
    const challenge = request.query['hub.challenge'];

    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (!verifyToken) {
      fastify.log.error('WHATSAPP_WEBHOOK_VERIFY_TOKEN not configured');
      return reply.code(500).send({ error: 'Webhook not configured' });
    }

    // Check if mode and token are valid
    if (mode === 'subscribe' && token === verifyToken) {
      fastify.log.info('WhatsApp webhook verified successfully');
      // Respond with the challenge token
      return reply.code(200).send(challenge);
    } else {
      fastify.log.warn({
        mode,
        tokenMatch: token === verifyToken
      }, 'WhatsApp webhook verification failed');
      return reply.code(403).send({ error: 'Verification failed' });
    }
  });

  /**
   * POST /api/whatsapp/callback
   *
   * Receives incoming messages and status updates
   */
  fastify.post('/whatsapp/callback', {
    schema: {
      body: z.object({
        object: z.string(),
        entry: z.array(z.any()),
      }),
    },
  }, async (
    request: FastifyRequest<{
      Body: WhatsAppWebhookPayload;
    }>,
    reply: FastifyReply
  ) => {
    try {
      const payload = request.body;

      // Log the webhook for debugging
      fastify.log.info({
        object: payload.object,
        entryCount: payload.entry?.length
      }, 'WhatsApp webhook received');

      // Verify it's a WhatsApp webhook
      if (payload.object !== 'whatsapp_business_account') {
        fastify.log.warn({ object: payload.object }, 'Invalid webhook object type');
        return reply.code(400).send({ error: 'Invalid webhook object' });
      }

      // Process each entry
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          // Handle incoming messages
          if (value.messages) {
            for (const message of value.messages) {
              await handleIncomingMessage(fastify, message, value.metadata);
            }
          }

          // Handle status updates (sent, delivered, read, failed)
          if (value.statuses) {
            for (const status of value.statuses) {
              await handleStatusUpdate(fastify, status);
            }
          }
        }
      }

      // Always return 200 OK to acknowledge receipt
      return reply.code(200).send({ status: 'ok' });

    } catch (error: any) {
      fastify.log.error({
        error: error.message,
        stack: error.stack
      }, 'Error processing WhatsApp webhook');

      // Still return 200 to prevent retries
      return reply.code(200).send({ status: 'error', message: error.message });
    }
  });
}

/**
 * Handle incoming message from WhatsApp
 */
async function handleIncomingMessage(
  fastify: FastifyInstance,
  message: any,
  metadata: any
) {
  fastify.log.info({
    from: message.from,
    messageId: message.id,
    type: message.type
  }, 'Incoming WhatsApp message');

  // TODO: Store message in database
  // TODO: If it's a response to verification questionnaire, process it
  // TODO: Mark message as read

  // Example of what to do:
  // 1. Find verification by phone number
  // 2. If found, forward message to AI agent for processing
  // 3. AI agent responds with next question or completion
  // 4. Send response back via WhatsApp
  // 5. Mark message as read
}

/**
 * Handle message status update
 */
async function handleStatusUpdate(
  fastify: FastifyInstance,
  status: any
) {
  fastify.log.info({
    messageId: status.id,
    status: status.status,
    recipient: status.recipient_id
  }, 'WhatsApp message status update');

  // TODO: Update whatsapp_messages table with status
  // status: 'sent' | 'delivered' | 'read' | 'failed'

  if (status.status === 'failed' && status.errors) {
    fastify.log.error({
      messageId: status.id,
      errors: status.errors
    }, 'WhatsApp message failed');

    // TODO: Update verification status to 'failed'
    // TODO: Notify admins
  }

  // Example implementation:
  // await db.update(whatsappMessages)
  //   .set({
  //     status: status.status,
  //     deliveredAt: status.status === 'delivered' ? new Date(parseInt(status.timestamp) * 1000) : null,
  //     readAt: status.status === 'read' ? new Date(parseInt(status.timestamp) * 1000) : null,
  //     errorCode: status.errors?.[0]?.code?.toString(),
  //     errorMessage: status.errors?.[0]?.message
  //   })
  //   .where(eq(whatsappMessages.messageId, status.id));
}
