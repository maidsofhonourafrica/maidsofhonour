import type { FastifyInstance } from "fastify";
import { z } from "zod/v4";
import { TrainingService } from "../services/training.service";
import { enrollCourseSchema, submitAssessmentSchema, type EnrollCourseInput, type SubmitAssessmentInput } from "../validation/training.schemas";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validation";

export async function trainingRoutes(app: FastifyInstance) {
  const trainingService = new TrainingService();

  /**
   * GET /api/v1/training/courses
   * List all courses
   */
  app.get(
    "/api/v1/training/courses",
    {
      preHandler: [requireAuth],
      schema: {
      },
    },
    async (request, reply) => {
      try {
        const courses = await trainingService.listCourses();
        return reply.status(200).send({ courses });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/training/courses/:id
   * Get course details
   */
  app.get(
    "/api/v1/training/courses/:id",
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
        const course = await trainingService.getCourseDetails(id);
        return reply.status(200).send(course);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(404).send({ error: error.message });
      }
    }
  );

  /**
   * POST /api/v1/training/enroll
   * Enroll in course
   */
  app.post<{
    Body: EnrollCourseInput;
  }>(
    "/api/v1/training/enroll",
    {
      preHandler: [requireAuth, validateBody(enrollCourseSchema)],
      schema: {
        body: enrollCourseSchema,
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const enrollment = await trainingService.enrollCourse(userId, request.body);
        return reply.status(201).send(enrollment);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/training/my-courses
   * Get my enrolled courses
   */
  app.get(
    "/api/v1/training/my-courses",
    {
      preHandler: [requireAuth],
      schema: {
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const courses = await trainingService.getMyCourses(userId);
        return reply.status(200).send({ courses });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/training/courses/:id/progress
   * Get course progress
   */
  app.get(
    "/api/v1/training/courses/:id/progress",
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
        const progress = await trainingService.getProgress(userId, id);
        return reply.status(200).send(progress);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(404).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/training/courses/:id/assessment
   * Get course assessment
   */
  app.get(
    "/api/v1/training/courses/:id/assessment",
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
        const assessment = await trainingService.getAssessment(id);
        return reply.status(200).send(assessment);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(404).send({ error: error.message });
      }
    }
  );

  /**
   * POST /api/v1/training/assessments/submit
   * Submit assessment
   */
  app.post<{
    Body: SubmitAssessmentInput;
  }>(
    "/api/v1/training/assessments/submit",
    {
      preHandler: [requireAuth, validateBody(submitAssessmentSchema)],
      schema: {
        body: submitAssessmentSchema,
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const result = await trainingService.submitAssessment(userId, request.body);
        return reply.status(201).send(result);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/training/assessments/:id/results
   * Get assessment results
   */
  app.get(
    "/api/v1/training/assessments/:id/results",
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
        const results = await trainingService.getAssessmentResults(userId, id);
        return reply.status(200).send({ results });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );
}
