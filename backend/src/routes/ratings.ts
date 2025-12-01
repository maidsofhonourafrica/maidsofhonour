import type { FastifyInstance } from "fastify";
import { z } from "zod/v4";
import { RatingService } from "../services/rating.service";
import { createRatingSchema, type CreateRatingInput } from "../validation/rating.schemas";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validation";

export async function ratingRoutes(app: FastifyInstance) {
  const ratingService = new RatingService();

  /**
   * POST /api/v1/ratings
   * Create rating
   */
  app.post<{
    Body: CreateRatingInput;
  }>(
    "/api/v1/ratings",
    {
      preHandler: [requireAuth, validateBody(createRatingSchema)],
      schema: {
        body: createRatingSchema,
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const rating = await ratingService.createRating(userId, request.body);

        return reply.status(201).send(rating);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/ratings/sp/:spId
   * Get SP ratings
   */
  app.get<{
    Params: { spId: string };
    Querystring: { page?: number; limit?: number };
  }>(
    "/api/v1/ratings/sp/:spId",
    {
      preHandler: [requireAuth],
      schema: {
        params: z.object({
          spId: z.string().uuid(),
        }),
        querystring: z.object({
          page: z.coerce.number().default(1),
          limit: z.coerce.number().default(20),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { spId } = request.params;
        const { page, limit } = request.query;
        const ratings = await ratingService.getSpRatings(spId, page, limit);

        return reply.status(200).send({ ratings });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/ratings/my-ratings
   * Get my ratings (as client)
   */
  app.get(
    "/api/v1/ratings/my-ratings",
    {
      preHandler: [requireAuth],
      schema: {
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const ratings = await ratingService.getMyRatings(userId);

        return reply.status(200).send({ ratings });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );
}
