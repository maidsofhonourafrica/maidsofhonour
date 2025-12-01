import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { escrowService } from '../services/escrow.service';
import { db } from '../db';
import { escrowTransactions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { z } from 'zod/v4';

interface ReleaseBody {
  escrowId: string;
}

interface RefundBody {
  escrowId: string;
  reason: string;
}

interface StatusParams {
  placementId: string;
}

export async function escrowRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/escrow/release
   * Release funds to Service Provider
   * Admin only
   */
  fastify.post('/release', {
    preHandler: [requireAuth, requireAdmin],
    schema: {
      body: z.object({
        escrowId: z.string(),
      }),
    },
  }, async (
    request,
    reply
  ) => {
    try {
      const { escrowId } = request.body as ReleaseBody;
      const adminUserId = (request as any).user.id;

      if (!escrowId) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required field: escrowId'
        });
      }

      const result = await escrowService.releaseEscrow(escrowId, adminUserId);

      return reply.send({
        success: true,
        message: 'Escrow funds released successfully',
        data: result
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to release escrow funds';
      return reply.status(500).send({
        success: false,
        error: message
      });
    }
  });

  /**
   * POST /api/escrow/refund
   * Refund funds to Client
   * Admin only
   */
  fastify.post('/refund', {
    preHandler: [requireAuth, requireAdmin],
    schema: {
      body: z.object({
        escrowId: z.string(),
        reason: z.string(),
      }),
    },
  }, async (
    request,
    reply
  ) => {
    try {
      const { escrowId, reason } = request.body as RefundBody;
      const adminUserId = (request as any).user.id;

      if (!escrowId || !reason) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required fields: escrowId, reason'
        });
      }

      const result = await escrowService.refundEscrow(escrowId, adminUserId, reason);

      return reply.send({
        success: true,
        message: 'Escrow funds refunded successfully',
        data: result
      });
    } catch (error: any) {
      fastify.log.error('Escrow refund error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to refund escrow funds'
      });
    }
  });

  /**
   * GET /api/escrow/:placementId
   * Get escrow status for a placement
   */
  fastify.get<{ Params: StatusParams }>('/:placementId', {
    preHandler: [requireAuth],
    schema: {
      params: z.object({
        placementId: z.string(),
      }),
    },
  }, async (
    request,
    reply
  ) => {
    try {
      const { placementId } = request.params;

      const escrow = await db.query.escrowTransactions.findFirst({
        where: eq(escrowTransactions.placementId, placementId),
        with: {
          ledgerEntries: true
        }
      });

      if (!escrow) {
        return reply.status(404).send({
          success: false,
          error: 'Escrow transaction not found for this placement'
        });
      }

      return reply.send({
        success: true,
        data: escrow
      });
    } catch (error: any) {
      fastify.log.error('Escrow status error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get escrow status'
      });
    }
  });
}
