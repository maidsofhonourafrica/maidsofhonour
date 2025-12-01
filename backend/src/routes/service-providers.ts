import type { FastifyInstance } from "fastify";
import { z } from "zod/v4";
import { ServiceProviderService } from "../services/service-provider.service";
import {
  createSpProfileSchema,
  updateSpProfileSchema,
  searchSpsSchema,
  requestPayoutSchema,
  type CreateSpProfileInput,
  type RequestPayoutInput,
} from "../validation/service-provider.schemas";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validation";

export async function serviceProviderRoutes(app: FastifyInstance) {
  const spService = new ServiceProviderService();

  /**
   * PUT /api/v1/service-providers/profile
   * Create/update SP profile
   */
  app.put<{
    Body: CreateSpProfileInput;
  }>(
    "/api/v1/service-providers/profile",
    {
      preHandler: [requireAuth, validateBody(createSpProfileSchema)],
      schema: {
        body: createSpProfileSchema,
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const profile = await spService.createOrUpdateProfile(userId, request.body);

        return reply.status(200).send(profile);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/service-providers/me
   * Get own SP profile (private view)
   */
  app.get(
    "/api/v1/service-providers/me",
    {
      preHandler: [requireAuth],
      schema: {
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const profile = await spService.getOwnProfile(userId);

        return reply.status(200).send(profile);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(404).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/service-providers/search
   * Search service providers
   */
  app.get(
    "/api/v1/service-providers/search",
    {
      preHandler: [requireAuth],
      schema: {
        querystring: searchSpsSchema,
      },
    },
    async (request, reply) => {
      try {
        const results = await spService.searchSps(request.query as any);

        return reply.status(200).send({ results, count: results.length });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/service-providers/:id
   * Get public SP profile
   */
  app.get(
    "/api/v1/service-providers/:id",
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
        const profile = await spService.getPublicProfile(id);

        return reply.status(200).send(profile);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(404).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/service-providers/dashboard
   * Get SP dashboard data
   */
  app.get(
    "/api/v1/service-providers/dashboard",
    {
      preHandler: [requireAuth],
      schema: {
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const dashboard = await spService.getDashboard(userId);

        return reply.status(200).send(dashboard);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/service-providers/balance
   * Get current balance
   */
  app.get(
    "/api/v1/service-providers/balance",
    {
      preHandler: [requireAuth],
      schema: {
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const balance = await spService.getBalance(userId);

        return reply.status(200).send(balance);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * POST /api/v1/service-providers/payout/request
   * Request payout
   */
  app.post<{
    Body: RequestPayoutInput;
  }>(
    "/api/v1/service-providers/payout/request",
    {
      preHandler: [requireAuth, validateBody(requestPayoutSchema)],
      schema: {
        body: requestPayoutSchema,
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const result = await spService.requestPayout(userId, request.body);

        return reply.status(200).send(result);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/service-providers/payouts
   * List payout history
   */
  app.get(
    "/api/v1/service-providers/payouts",
    {
      preHandler: [requireAuth],
      schema: {
        querystring: z.object({
          page: z.coerce.number().default(1),
          limit: z.coerce.number().default(20),
        }),
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const { page, limit } = request.query as { page?: number; limit?: number };
        const payouts = await spService.listPayouts(userId, page, limit);

        return reply.status(200).send({ payouts });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/service-providers/payouts/:id
   * Get payout details
   */
  app.get(
    "/api/v1/service-providers/payouts/:id",
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
        const userId = request.user!.id;
        const { id } = request.params as { id: string };
        const payout = await spService.getPayoutDetails(userId, id);

        return reply.status(200).send(payout);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(404).send({ error: error.message });
      }
    }
  );
}
