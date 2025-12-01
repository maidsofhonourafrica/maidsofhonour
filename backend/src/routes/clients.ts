import type { FastifyInstance } from "fastify";
import { ClientService } from "../services/client.service";
import {
  createClientProfileSchema,
  updateClientProfileSchema,
  type CreateClientProfileInput,
} from "../validation/client.schemas";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validation";

export async function clientRoutes(app: FastifyInstance) {
  const clientService = new ClientService();

  /**
   * PUT /api/v1/clients/profile
   * Create/update client profile
   */
  app.put<{
    Body: CreateClientProfileInput;
  }>(
    "/api/v1/clients/profile",
    {
      preHandler: [requireAuth, validateBody(createClientProfileSchema)],
      schema: {
        body: createClientProfileSchema,
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const profile = await clientService.createOrUpdateProfile(userId, request.body);

        return reply.status(200).send(profile);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/clients/me
   * Get own client profile
   */
  app.get(
    "/api/v1/clients/me",
    {
      preHandler: [requireAuth],
      schema: {
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const profile = await clientService.getOwnProfile(userId);

        return reply.status(200).send(profile);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(404).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/clients/dashboard
   * Get client dashboard
   */
  app.get(
    "/api/v1/clients/dashboard",
    {
      preHandler: [requireAuth],
      schema: {
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const dashboard = await clientService.getDashboard(userId);

        return reply.status(200).send(dashboard);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );
}
