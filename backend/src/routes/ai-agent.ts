import type { FastifyInstance } from "fastify";
import { z } from "zod/v4";
import { AIAgentService } from "../services/ai-agent.service";
import { aiChatMessageSchema, type AIChatMessageInput } from "../validation/ai.schemas";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validation";

export async function aiAgentRoutes(app: FastifyInstance) {
  const aiAgentService = new AIAgentService();

  /**
   * POST /api/v1/ai/chat
   * Send message to AI agent
   */
  app.post<{
    Body: AIChatMessageInput;
  }>(
    "/api/v1/ai/chat",
    {
      preHandler: [requireAuth, validateBody(aiChatMessageSchema)],
      schema: {
        body: aiChatMessageSchema,
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const result = await aiAgentService.sendMessage(userId, request.body);
        return reply.status(201).send(result);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/ai/conversations
   * List my AI conversations
   */
  app.get(
    "/api/v1/ai/conversations",
    {
      preHandler: [requireAuth],
      schema: {
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const conversations = await aiAgentService.listConversations(userId);
        return reply.status(200).send({ conversations });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/ai/conversations/:id
   * Get conversation history
   */
  app.get(
    "/api/v1/ai/conversations/:id",
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
        const conversation = await aiAgentService.getConversation(id, userId);
        return reply.status(200).send(conversation);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(404).send({ error: error.message });
      }
    }
  );

  /**
   * POST /api/v1/ai/conversations/:id/end
   * End AI conversation
   */
  app.post(
    "/api/v1/ai/conversations/:id/end",
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
        const conversation = await aiAgentService.endConversation(id, userId);
        return reply.status(200).send(conversation);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );
}
