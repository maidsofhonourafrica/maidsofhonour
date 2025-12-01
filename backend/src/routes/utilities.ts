import type { FastifyInstance } from "fastify";
import { z } from "zod/v4";
import { UtilityService } from "../services/utility.service";
import { requireAuth } from "../middleware/auth";

export async function utilityRoutes(app: FastifyInstance) {
  const utilityService = new UtilityService();

  /**
   * GET /api/v1/categories
   * List service categories
   */
  app.get(
    "/api/v1/categories",
    {
      schema: {
      },
    },
    async (request, reply) => {
      try {
        const categories = await utilityService.listCategories();
        return reply.status(200).send({ categories });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/counties
   * List Kenya counties
   */
  app.get(
    "/api/v1/counties",
    {
      schema: {
      },
    },
    async (request, reply) => {
      try {
        const counties = utilityService.getCounties();
        return reply.status(200).send({ counties });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/health
   * Health check
   */
  app.get(
    "/api/v1/health",
    {
      schema: {
      },
    },
    async (request, reply) => {
      const health = await utilityService.healthCheck();
      const status = health.status === "healthy" ? 200 : 503;
      return reply.status(status).send(health);
    }
  );

  /**
   * POST /api/v1/upload-url
   * Get presigned S3 upload URL
   */
  app.post(
    "/api/v1/upload-url",
    {
      preHandler: [requireAuth],
      schema: {
        body: z.object({
          fileName: z.string(),
          fileType: z.string(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { fileName, fileType } = request.body as { fileName: string; fileType: string };
        const result = await utilityService.getUploadUrl(fileName, fileType);
        return reply.status(200).send(result);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );
}
