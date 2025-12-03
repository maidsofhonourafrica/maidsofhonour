import type { FastifyInstance } from "fastify";
import { z } from "zod/v4";
import { MessagingService } from "../services/messaging.service";
import { sendMessageSchema, type SendMessageInput } from "../validation/message.schemas";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validation";

export async function messagingRoutes(app: FastifyInstance) {
  const messagingService = new MessagingService();

  /**
   * POST /api/v1/messages
   * Send message
   */
  app.post<{
    Body: SendMessageInput;
  }>(
    "/api/v1/messages",
    {
      preHandler: [requireAuth, validateBody(sendMessageSchema)],
      schema: {
        body: sendMessageSchema,
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const message = await messagingService.sendMessage(userId, request.body);

        return reply.status(201).send(message);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/messages/conversations
   * Get conversations
   */
  app.get(
    "/api/v1/messages/conversations",
    {
      preHandler: [requireAuth],
      schema: {
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const conversations = await messagingService.getConversations(userId);

        return reply.status(200).send({ conversations });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/messages/conversations/:id
   * Get messages in conversation
   */
  app.get<{
    Params: { id: string };
  }>(
    "/api/v1/messages/conversations/:id",
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
        const { id } = request.params;
        const userId = request.user!.id;
        const messages = await messagingService.getMessages(id, userId);

        return reply.status(200).send({ messages });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * PATCH /api/v1/messages/conversations/:id/read
   * Mark conversation as read
   */
  app.patch<{
    Params: { id: string };
  }>(
    "/api/v1/messages/conversations/:id/read",
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
        const { id } = request.params;
        const userId = request.user!.id;
        const result = await messagingService.markConversationAsRead(userId, id);

        return reply.status(200).send(result);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );
}
