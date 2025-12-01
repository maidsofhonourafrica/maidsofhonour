import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { sasaPayService } from '../services/sasapay';
import { db } from '../db';
import { transactions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';

interface RequestPaymentBody {
  phoneNumber: string;
  amount: string;
  networkCode: string; // 0=SasaPay, 63902=MPesa, 63903=Airtel, 63907=TKash
  accountReference: string;
  transactionDesc: string;
  userId?: string;
}

interface ProcessPaymentBody {
  checkoutRequestId: string;
  verificationCode: string;
}

interface StatusParams {
  checkoutRequestId: string;
}

export async function paymentRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/payments/request
   * Initiate a C2B payment request
   */
  /**
   * POST /api/payments/request
   * Initiate a C2B payment request
   */
  fastify.post('/request', {
    schema: {
      body: z.object({
        phoneNumber: z.string(),
        amount: z.string(),
        networkCode: z.string(),
        accountReference: z.string(),
        transactionDesc: z.string(),
        userId: z.string().optional(),
      }),
    },
  }, async (
    request: FastifyRequest<{ Body: RequestPaymentBody }>,
    reply: FastifyReply
  ) => {
    try {
      const { phoneNumber, amount, networkCode, accountReference, transactionDesc, userId } = request.body;

      // Validate required fields
      if (!phoneNumber || !amount || !networkCode || !accountReference) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required fields: phoneNumber, amount, networkCode, accountReference',
        });
      }

      // Use callback URL from environment or build from API_URL
      const callbackUrl = process.env.SASAPAY_CALLBACK_URL || `${process.env.API_URL}/api/callback`;

      // Request payment from SasaPay
      const response = await sasaPayService.requestPayment({
        phoneNumber,
        amount,
        networkCode,
        accountReference,
        transactionDesc: transactionDesc || 'Payment',
        callbackUrl,
      });

      // Save transaction to database
      const [transaction] = await db.insert(transactions).values({
        merchantRequestId: response.MerchantRequestID,
        checkoutRequestId: response.CheckoutRequestID,
        phoneNumber,
        amount,
        networkCode,
        transactionType: 'other', // Default transaction type
        status: response.ResponseCode === '0' ? 'processing' : 'failed',
        userId: userId || null,
        callbackData: {
          transactionReference: response.TransactionReference,
          accountReference,
          transactionDesc,
          paymentGateway: response.PaymentGateway,
          responseCode: response.ResponseCode,
          responseDescription: response.ResponseDescription,
          customerMessage: response.CustomerMessage,
        },
      }).returning();

      return reply.send({
        success: true,
        message: response.detail,
        data: {
          checkoutRequestId: response.CheckoutRequestID,
          merchantRequestId: response.MerchantRequestID,
          transactionReference: response.TransactionReference,
          paymentGateway: response.PaymentGateway,
          customerMessage: response.CustomerMessage,
          requiresOtp: networkCode === '0', // SasaPay requires OTP
          transactionId: transaction.id,
        },
      });
    } catch (error: any) {
      fastify.log.error('Payment request error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to request payment',
      });
    }
  });

  /**
   * POST /api/payments/process
   * Process SasaPay payment with OTP
   */
  fastify.post('/process', {
    schema: {
      body: z.object({
        checkoutRequestId: z.string(),
        verificationCode: z.string(),
      }),
    },
  }, async (
    request: FastifyRequest<{ Body: ProcessPaymentBody }>,
    reply: FastifyReply
  ) => {
    try {
      const { checkoutRequestId, verificationCode } = request.body;

      // Validate required fields
      if (!checkoutRequestId || !verificationCode) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required fields: checkoutRequestId, verificationCode',
        });
      }

      // Process payment with SasaPay
      const response = await sasaPayService.processPayment({
        checkoutRequestId,
        verificationCode,
      });

      // Update transaction status
      await db
        .update(transactions)
        .set({
          status: 'processing',
          updatedAt: new Date(),
        })
        .where(eq(transactions.checkoutRequestId, checkoutRequestId));

      return reply.send({
        success: true,
        message: response.detail,
      });
    } catch (error: any) {
      fastify.log.error('Process payment error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to process payment',
      });
    }
  });

  /**
   * GET /api/payments/status/:checkoutRequestId
   * Poll transaction status
   */
  fastify.get('/status/:checkoutRequestId', {
    schema: {
      params: z.object({
        checkoutRequestId: z.string(),
      }),
    },
  }, async (
    request: FastifyRequest<{ Params: StatusParams }>,
    reply: FastifyReply
  ) => {
    try {
      const { checkoutRequestId } = request.params;

      // First check our database
      const [dbTransaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.checkoutRequestId, checkoutRequestId))
        .limit(1);

      if (!dbTransaction) {
        return reply.status(404).send({
          success: false,
          error: 'Transaction not found',
        });
      }

      // If we already have callback results, return them
      if (dbTransaction.callbackReceivedAt) {
        return reply.send({
          success: true,
          status: dbTransaction.status,
          data: {
            checkoutRequestId: dbTransaction.checkoutRequestId,
            merchantRequestId: dbTransaction.merchantRequestId,
            amount: dbTransaction.amount,
            phoneNumber: dbTransaction.phoneNumber,
            resultCode: dbTransaction.resultCode,
            resultDesc: dbTransaction.resultDesc,
            callbackReceivedAt: dbTransaction.callbackReceivedAt,
            callbackData: dbTransaction.callbackData,
          },
        });
      }

      // Otherwise, query SasaPay API for latest status
      try {
        const apiStatus = await sasaPayService.queryTransactionStatus(checkoutRequestId);

        // Update database if we got results
        if (apiStatus.ResultCode !== undefined) {
          await db
            .update(transactions)
            .set({
              resultCode: apiStatus.ResultCode,
              resultDesc: apiStatus.ResultDesc,
              status: apiStatus.ResultCode === '0' ? 'completed' : 'failed',
              callbackReceivedAt: new Date(),
              callbackData: apiStatus, // Store full API response
              updatedAt: new Date(),
            })
            .where(eq(transactions.checkoutRequestId, checkoutRequestId));
        }

        return reply.send({
          success: true,
          status: apiStatus.ResultCode === '0' ? 'completed' : 'failed',
          data: {
            checkoutRequestId: dbTransaction.checkoutRequestId,
            merchantRequestId: dbTransaction.merchantRequestId,
            amount: dbTransaction.amount,
            phoneNumber: dbTransaction.phoneNumber,
            resultCode: apiStatus.ResultCode,
            resultDesc: apiStatus.ResultDesc,
            apiResponse: apiStatus,
          },
        });
      } catch (apiError) {
        // If API query fails, return database status
        return reply.send({
          success: true,
          status: dbTransaction.status,
          message: 'Returning cached status (API query failed)',
          data: {
            checkoutRequestId: dbTransaction.checkoutRequestId,
            merchantRequestId: dbTransaction.merchantRequestId,
            amount: dbTransaction.amount,
            phoneNumber: dbTransaction.phoneNumber,
            status: dbTransaction.status,
            resultCode: dbTransaction.resultCode,
            resultDesc: dbTransaction.resultDesc,
          },
        });
      }
    } catch (error: any) {
      fastify.log.error('Status query error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to query transaction status',
      });
    }
  });

  /**
   * GET /api/payments/transactions
   * List all transactions (with optional filters)
   */
  fastify.get('/transactions', async (request, reply) => {
    try {
      const allTransactions = await db.select().from(transactions).orderBy(transactions.createdAt);

      return reply.send({
        success: true,
        count: allTransactions.length,
        data: allTransactions,
      });
    } catch (error: any) {
      fastify.log.error('List transactions error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to list transactions',
      });
    }
  });
}
