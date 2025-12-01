import type { FastifyInstance } from "fastify";
import { z } from "zod/v4";
import { CertificateService } from "../services/certificate.service";
import { requireAuth } from "../middleware/auth";

export async function certificateRoutes(app: FastifyInstance) {
  const certificateService = new CertificateService();

  /**
   * POST /api/v1/certificates/generate
   * Generate certificate for completed course
   */
  app.post(
    "/api/v1/certificates/generate",
    {
      preHandler: [requireAuth],
      schema: {
        body: z.object({
          courseId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const { courseId } = request.body as { courseId: string };
        const certificate = await certificateService.generateCertificate(userId, courseId);
        return reply.status(201).send(certificate);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/certificates
   * List my certificates
   */
  app.get(
    "/api/v1/certificates",
    {
      preHandler: [requireAuth],
      schema: {
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const certificates = await certificateService.getMyCertificates(userId);
        return reply.status(200).send({ certificates });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/certificates/verify/:certificateNumber
   * Verify certificate by number (public endpoint)
   */
  app.get(
    "/api/v1/certificates/verify/:certificateNumber",
    {
      schema: {
        params: z.object({
          certificateNumber: z.string(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { certificateNumber } = request.params as { certificateNumber: string };
        const result = await certificateService.verifyCertificate(certificateNumber);
        return reply.status(200).send(result);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/certificates/:id
   * Get certificate details
   */
  app.get(
    "/api/v1/certificates/:id",
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
        const certificate = await certificateService.getCertificateDetails(id, userId);
        return reply.status(200).send(certificate);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(404).send({ error: error.message });
      }
    }
  );
}
