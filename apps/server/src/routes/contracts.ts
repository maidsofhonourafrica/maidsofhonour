import type { FastifyInstance } from "fastify";
import { z } from "zod/v4";
import { ContractService } from "../services/contract.service";
import {
  generateContractSchema,
  signContractSchema,
  type GenerateContractInput,
  type SignContractInput,
} from "../validation/contract.schemas";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validation";

export async function contractRoutes(app: FastifyInstance) {
  const contractService = new ContractService();

  /**
   * POST /api/v1/contracts/generate
   * Generate contract for placement
   */
  app.post<{
    Body: GenerateContractInput;
  }>(
    "/api/v1/contracts/generate",
    {
      preHandler: [requireAuth, validateBody(generateContractSchema)],
      schema: {
        body: generateContractSchema,
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const contract = await contractService.generateContract(userId, request.body);

        return reply.status(201).send(contract);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/contracts
   * List my contracts
   */
  app.get(
    "/api/v1/contracts",
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
        const userType = request.user!.userType;
        const { page, limit } = request.query as { page?: number; limit?: number };
        const contracts = await contractService.listContracts(userId, userType, page, limit);

        return reply.status(200).send({ contracts });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/contracts/:id
   * Get contract details
   */
  app.get(
    "/api/v1/contracts/:id",
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
        const contract = await contractService.getContractDetails(id, userId);

        return reply.status(200).send(contract);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(404).send({ error: error.message });
      }
    }
  );

  /**
   * POST /api/v1/contracts/:id/sign
   * Sign contract
   */
  app.post<{
    Body: SignContractInput;
    Params: { id: string };
  }>(
    "/api/v1/contracts/:id/sign",
    {
      preHandler: [requireAuth, validateBody(signContractSchema)],
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: signContractSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const userId = request.user!.id;
        const contract = await contractService.signContract(id, userId, request.body);

        return reply.status(200).send(contract);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );
}
