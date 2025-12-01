import type { FastifyInstance } from "fastify";
import { RegistrationFeeService } from "../services/registration-fee.service";
import { payRegistrationFeeSchema, type PayRegistrationFeeInput } from "../validation/registration-fee.schemas";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validation";

export async function registrationFeeRoutes(app: FastifyInstance) {
  const registrationFeeService = new RegistrationFeeService();

  /**
   * POST /api/v1/service-providers/registration-fee/pay
   * Pay SP registration fee (KES 500)
   */
  app.post<{
    Body: PayRegistrationFeeInput;
  }>(
    "/api/v1/service-providers/registration-fee/pay",
    {
      preHandler: [requireAuth, validateBody(payRegistrationFeeSchema)],
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const result = await registrationFeeService.paySpRegistrationFee(
          userId,
          request.body
        );

        return reply.status(200).send(result);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({
          error: error.message || "Failed to initiate registration fee payment",
        });
      }
    }
  );

  /**
   * GET /api/v1/service-providers/registration-fee/status
   * Check SP registration fee status
   */
  app.get(
    "/api/v1/service-providers/registration-fee/status",
    {
      preHandler: [requireAuth],
      schema: {},
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const status = await registrationFeeService.getRegistrationFeeStatus(userId);

        return reply.status(200).send(status);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({
          error: error.message || "Failed to get registration fee status",
        });
      }
    }
  );

  /**
   * POST /api/v1/clients/registration-fee/pay
   * Pay client registration fee
   */
  app.post<{
    Body: PayRegistrationFeeInput;
  }>(
    "/api/v1/clients/registration-fee/pay",
    {
      preHandler: [requireAuth, validateBody(payRegistrationFeeSchema)],
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const result = await registrationFeeService.payClientRegistrationFee(
          userId,
          request.body
        );

        return reply.status(200).send(result);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({
          error: error.message || "Failed to initiate registration fee payment",
        });
      }
    }
  );

  /**
   * GET /api/v1/clients/registration-fee/status
   * Check client registration fee status
   */
  app.get(
    "/api/v1/clients/registration-fee/status",
    {
      preHandler: [requireAuth],
      schema: {},
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const status = await registrationFeeService.getRegistrationFeeStatus(userId);

        return reply.status(200).send(status);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({
          error: error.message || "Failed to get registration fee status",
        });
      }
    }
  );
}
