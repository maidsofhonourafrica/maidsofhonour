import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod/v4';
import { db } from '../db';
import { transactions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { validateSasaPayCallback, SasaPayCallback, sasapayCallbackSchema } from '../validation/sasapay.schemas';
import { idempotencyService } from '../services/idempotency.service';
import { ZodError } from 'zod/v4';

/**
 * Dedicated SasaPay Callback Routes
 * Handles payment callbacks from SasaPay with:
 * - Idempotency protection (prevent double-processing)
 * - Comprehensive validation
 * - Atomic database updates
 * - Detailed logging and error handling
 */

export async function sasapayCallbackRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/sasapay/callback
   * SasaPay C2B payment callback endpoint
   *
   * This endpoint is called by SasaPay when a payment is completed.
   * It must be:
   * - Fast (respond quickly to avoid timeouts)
   * - Idempotent (handle duplicate callbacks gracefully)
   * - Reliable (process payments correctly every time)
   */
  fastify.post('/callback', {
    schema: {
      body: sasapayCallbackSchema,
    },
  }, async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const startTime = Date.now();
    const requestId = request.id;

    // Log incoming callback (basic info)
    fastify.log.info({
      msg: '📥 SasaPay callback received',
      requestId,
      ip: request.ip,
      headers: request.headers,
    });

    try {
      // Step 1: Validate callback structure
      let callbackData: SasaPayCallback;
      try {
        callbackData = validateSasaPayCallback(request.body);
      } catch (error) {
        if (error instanceof ZodError) {
          fastify.log.error({
            msg: '❌ Invalid callback structure',
            requestId,
            errors: error.issues,
            body: request.body,
          });

          return reply.status(400).send({
            success: false,
            error: 'Invalid callback data',
            details: error.issues.map((e: any) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          });
        }
        throw error;
      }

      const { CheckoutRequestID, MerchantRequestID, ResultCode, ResultDesc } = callbackData;

      // Log validated callback data
      fastify.log.info({
        msg: '✅ Callback validation passed',
        requestId,
        checkoutRequestId: CheckoutRequestID,
        merchantRequestId: MerchantRequestID,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
      });

      // Step 2: Check idempotency - has this callback been processed before?
      const idempotencyKey = `sasapay:callback:${CheckoutRequestID}`;
      const alreadyProcessed = await idempotencyService.isProcessed(idempotencyKey);

      if (alreadyProcessed) {
        const processingTime = Date.now() - startTime;
        fastify.log.warn({
          msg: '⚠️  Duplicate callback detected (idempotency check)',
          requestId,
          checkoutRequestId: CheckoutRequestID,
          processingTime: `${processingTime}ms`,
        });

        // Return success for duplicate - we already processed this
        return reply.status(200).send({
          success: true,
          message: 'Callback already processed (duplicate)',
          checkoutRequestId: CheckoutRequestID,
          duplicate: true,
        });
      }

      // Step 3: Atomic check-and-set for idempotency
      const canProcess = await idempotencyService.tryAcquire(idempotencyKey, 86400); // 24h TTL

      if (!canProcess) {
        // Another request is processing this callback right now
        const processingTime = Date.now() - startTime;
        fastify.log.warn({
          msg: '⚠️  Concurrent callback detected (race condition prevented)',
          requestId,
          checkoutRequestId: CheckoutRequestID,
          processingTime: `${processingTime}ms`,
        });

        return reply.status(200).send({
          success: true,
          message: 'Callback being processed by another request',
          checkoutRequestId: CheckoutRequestID,
          concurrent: true,
        });
      }

      // Step 4: Verify transaction exists in database
      const [existingTransaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.checkoutRequestId, CheckoutRequestID))
        .limit(1);

      if (!existingTransaction) {
        fastify.log.error({
          msg: '❌ Transaction not found in database',
          requestId,
          checkoutRequestId: CheckoutRequestID,
        });

        return reply.status(404).send({
          success: false,
          error: 'Transaction not found',
          checkoutRequestId: CheckoutRequestID,
        });
      }

      // Check if transaction was already updated by callback
      if (existingTransaction.callbackReceivedAt) {
        fastify.log.warn({
          msg: '⚠️  Transaction already has callback data (database check)',
          requestId,
          checkoutRequestId: CheckoutRequestID,
          existingStatus: existingTransaction.status,
        });

        return reply.status(200).send({
          success: true,
          message: 'Transaction already updated',
          checkoutRequestId: CheckoutRequestID,
          existingStatus: existingTransaction.status,
        });
      }

      // Step 5: Determine payment status
      const isSuccess = ResultCode === '0';
      const newStatus = isSuccess ? 'completed' : 'failed';

      // Step 6: Update transaction atomically
      const [updatedTransaction] = await db
        .update(transactions)
        .set({
          resultCode: ResultCode,
          resultDesc: ResultDesc,
          status: newStatus,
          callbackReceivedAt: new Date(),
          callbackData: callbackData,
          updatedAt: new Date(),
        })
        .where(eq(transactions.checkoutRequestId, CheckoutRequestID))
        .returning();

      // Step 6.5: If registration fee payment succeeded, mark user as paid
      if (isSuccess && existingTransaction.transactionType === 'registration_fee' && existingTransaction.userId) {
        const { users } = await import('../db/schema');
        await db
          .update(users)
          .set({
            registrationFeePaid: true,
            registrationFeeTransactionId: updatedTransaction.id,
            registrationCompletedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingTransaction.userId));

        fastify.log.info({
          msg: '✅ Registration fee marked as paid',
          userId: existingTransaction.userId,
          transactionId: updatedTransaction.id,
        });
      }

      // Step 7: Mark as processed in idempotency store
      await idempotencyService.markProcessed(idempotencyKey, {
        checkoutRequestId: CheckoutRequestID,
        resultCode: ResultCode,
        status: newStatus,
        processedAt: new Date().toISOString(),
      });

      const processingTime = Date.now() - startTime;

      // Step 8: Log successful processing
      fastify.log.info({
        msg: `✅ Payment callback processed successfully`,
        requestId,
        checkoutRequestId: CheckoutRequestID,
        status: newStatus,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        processingTime: `${processingTime}ms`,
      });

      // Step 9: Return success response to SasaPay
      return reply.status(200).send({
        success: true,
        message: 'Callback processed successfully',
        checkoutRequestId: CheckoutRequestID,
        status: newStatus,
        processingTime: `${processingTime}ms`,
      });

    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      // Log error with full context
      fastify.log.error({
        msg: '❌ Callback processing failed',
        requestId,
        error: error.message,
        stack: error.stack,
        body: request.body,
        processingTime: `${processingTime}ms`,
      });

      // Return 500 so SasaPay retries the callback
      return reply.status(500).send({
        success: false,
        error: 'Internal server error processing callback',
        message: 'Payment callback will be retried by SasaPay',
      });
    }
  });

  /**
   * GET /api/sasapay/callback/test
   * Test endpoint to verify callback route is accessible
   */
  /**
   * GET /api/sasapay/callback/test
   * Test endpoint to verify callback route is accessible
   */
  fastify.get('/callback/test', {
    schema: {
      response: {
        200: z.object({
          success: z.boolean(),
          message: z.string(),
          timestamp: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    return reply.send({
      success: true,
      message: 'SasaPay callback endpoint is accessible',
      timestamp: new Date().toISOString(),
    });
  });
}
