import type { FastifyInstance } from "fastify";
import { z } from "zod/v4";
import { IssueService } from "../services/issue.service";
import { reportIssueSchema, type ReportIssueInput } from "../validation/issue.schemas";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validation";

export async function issueRoutes(app: FastifyInstance) {
  const issueService = new IssueService();

  /**
   * POST /api/v1/issues
   * Report issue
   */
  app.post<{
    Body: ReportIssueInput;
  }>(
    "/api/v1/issues",
    {
      preHandler: [requireAuth, validateBody(reportIssueSchema)],
      schema: {
        body: reportIssueSchema,
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const issue = await issueService.reportIssue(userId, request.body);

        return reply.status(201).send(issue);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/issues
   * Get my issues
   */
  app.get(
    "/api/v1/issues",
    {
      preHandler: [requireAuth],
      schema: {
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const issues = await issueService.getMyIssues(userId);

        return reply.status(200).send({ issues });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/issues/:id
   * Get issue details
   */
  app.get<{
    Params: { id: string };
  }>(
    "/api/v1/issues/:id",
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
        const issue = await issueService.getIssueDetails(id, userId);

        return reply.status(200).send(issue);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(404).send({ error: error.message });
      }
    }
  );
}
