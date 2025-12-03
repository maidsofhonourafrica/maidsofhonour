import type { FastifyInstance } from "fastify";
import { z } from "zod/v4";
import { PlacementService } from "../services/placement.service";
import {
  createPlacementSchema,
  acceptPlacementSchema,
  rejectPlacementSchema,
  cancelPlacementSchema,
  type CreatePlacementInput,
  type AcceptPlacementInput,
  type RejectPlacementInput,
  type CancelPlacementInput,
} from "../validation/placement.schemas";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validation";

export async function placementRoutes(app: FastifyInstance) {
  const placementService = new PlacementService();

  /**
   * POST /api/v1/placements
   * Create placement request
   */
  app.post<{
    Body: CreatePlacementInput;
  }>(
    "/api/v1/placements",
    {
      preHandler: [requireAuth, validateBody(createPlacementSchema)],
      schema: {
        body: createPlacementSchema,
      },
    },
    async (request, reply) => {
      try{
        const userId = request.user!.id;
        const placement = await placementService.createPlacement(userId, request.body);

        return reply.status(201).send(placement);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/placements
   * List my placements
   */
  app.get(
    "/api/v1/placements",
    {
      preHandler: [requireAuth],
      schema: {
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const userType = request.user!.userType;
        const placements = await placementService.listPlacements(userId, userType);

        return reply.status(200).send({ placements });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/placements/active
   * Get active placements
   */
  app.get(
    "/api/v1/placements/active",
    {
      preHandler: [requireAuth],
      schema: {
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const userType = request.user!.userType;
        const placements = await placementService.getActivePlacements(userId, userType);

        return reply.status(200).send({ placements });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/placements/history
   * Get placement history
   */
  app.get(
    "/api/v1/placements/history",
    {
      preHandler: [requireAuth],
      schema: {
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const userType = request.user!.userType;
        const placements = await placementService.getPlacementHistory(userId, userType);

        return reply.status(200).send({ placements });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/placements/:id
   * Get placement details
   */
  app.get(
    "/api/v1/placements/:id",
    {
      preHandler: [requireAuth],
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user!.id;
        const placement = await placementService.getPlacementDetails(id, userId);

        return reply.status(200).send(placement);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(404).send({ error: error.message });
      }
    }
  );

  /**
   * PATCH /api/v1/placements/:id/accept
   * SP accepts placement
   */
  app.patch<{
    Body: AcceptPlacementInput;
    Params: { id: string };
  }>(
    "/api/v1/placements/:id/accept",
    {
      preHandler: [requireAuth, validateBody(acceptPlacementSchema)],
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: acceptPlacementSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const userId = request.user!.id;
        const placement = await placementService.acceptPlacement(id, userId, request.body);

        return reply.status(200).send(placement);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * PATCH /api/v1/placements/:id/reject
   * SP rejects placement
   */
  app.patch<{
    Body: RejectPlacementInput;
    Params: { id: string };
  }>(
    "/api/v1/placements/:id/reject",
    {
      preHandler: [requireAuth, validateBody(rejectPlacementSchema)],
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: rejectPlacementSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const userId = request.user!.id;
        const placement = await placementService.rejectPlacement(id, userId, request.body);

        return reply.status(200).send(placement);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * PATCH /api/v1/placements/:id/complete
   * Mark placement as completed
   */
  app.patch(
    "/api/v1/placements/:id/complete",
    {
      preHandler: [requireAuth],
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user!.id;
        const placement = await placementService.completePlacement(id, userId);

        return reply.status(200).send(placement);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * POST /api/v1/placements/:id/cancel
   * Cancel placement
   */
  app.post<{
    Body: CancelPlacementInput;
    Params: { id: string };
  }>(
    "/api/v1/placements/:id/cancel",
    {
      preHandler: [requireAuth, validateBody(cancelPlacementSchema)],
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: cancelPlacementSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const userId = request.user!.id;
        const placement = await placementService.cancelPlacement(id, userId, request.body);

        return reply.status(200).send(placement);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );
}
