import type { FastifyInstance } from "fastify";
import { z } from "zod/v4";
import { NotificationService } from "../services/notification.service";
import { requireAuth } from "../middleware/auth";

export async function notificationRoutes(app: FastifyInstance) {
  const notificationService = new NotificationService();

  /**
   * GET /api/v1/notifications
   * Get notifications
   */
  app.get(
    "/api/v1/notifications",
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
        const notifications = await notificationService.getNotifications(userId, page, limit);

        return reply.status(200).send({ notifications });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/notifications/unread-count
   * Get unread count
   */
  app.get(
    "/api/v1/notifications/unread-count",
    {
      preHandler: [requireAuth],
      schema: {
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const count = await notificationService.getUnreadCount(userId);

        return reply.status(200).send({ unreadCount: count });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * PATCH /api/v1/notifications/:id/read
   * Mark notification as read
   */
  app.patch(
    "/api/v1/notifications/:id/read",
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
        const notification = await notificationService.markAsRead(id, userId);

        return reply.status(200).send(notification);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * PATCH /api/v1/notifications/read-all
   * Mark all as read
   */
  app.patch(
    "/api/v1/notifications/read-all",
    {
      preHandler: [requireAuth],
      schema: {
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const result = await notificationService.markAllAsRead(userId);

        return reply.status(200).send(result);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );
}
