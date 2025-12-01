import type { FastifyInstance } from "fastify";
import { z } from "zod/v4";
import { SubscriptionService } from "../services/subscription.service";
import { createSubscriptionSchema, type CreateSubscriptionInput } from "../validation/subscription.schemas";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validation";

export async function subscriptionRoutes(app: FastifyInstance) {
  const subscriptionService = new SubscriptionService();

  /**
   * POST /api/v1/subscriptions
   * Create subscription
   */
  app.post<{
    Body: CreateSubscriptionInput;
  }>(
    "/api/v1/subscriptions",
    {
      preHandler: [requireAuth, validateBody(createSubscriptionSchema)],
      schema: {
        body: createSubscriptionSchema,
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const subscription = await subscriptionService.createSubscription(userId, request.body);

        return reply.status(201).send(subscription);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/subscriptions
   * List my subscriptions
   */
  app.get(
    "/api/v1/subscriptions",
    {
      preHandler: [requireAuth],
      schema: {
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const subscriptions = await subscriptionService.listSubscriptions(userId);

        return reply.status(200).send({ subscriptions });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/subscriptions/:id
   * Get subscription details
   */
  app.get(
    "/api/v1/subscriptions/:id",
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
        const subscription = await subscriptionService.getSubscriptionDetails(id, userId);

        return reply.status(200).send(subscription);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(404).send({ error: error.message });
      }
    }
  );

  /**
   * PATCH /api/v1/subscriptions/:id/cancel
   * Cancel subscription
   */
  app.patch(
    "/api/v1/subscriptions/:id/cancel",
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
        const subscription = await subscriptionService.cancelSubscription(id, userId);

        return reply.status(200).send(subscription);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/subscriptions/:id/upcoming-payment
   * Get upcoming payment
   */
  app.get(
    "/api/v1/subscriptions/:id/upcoming-payment",
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
        const payment = await subscriptionService.getUpcomingPayment(id, userId);

        return reply.status(200).send(payment);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );
}
