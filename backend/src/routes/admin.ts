import type { FastifyInstance } from "fastify";
import { z } from "zod/v4";
import { AdminService } from "../services/admin.service";
import {
  updateUserStatusSchema,
  updateUserSchema,
  approvePayoutSchema,
  updateIssueSchema,
  type UpdateUserStatusInput,
  type UpdateUserInput,
  type ApprovePayoutInput,
} from "../validation/admin.schemas";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validation";

export async function adminRoutes(app: FastifyInstance) {
  const adminService = new AdminService();

  // Middleware to check admin role
  const requireAdmin = async (request: any, reply: any) => {
    if (request.user?.userType !== "admin") {
      return reply.status(403).send({ error: "Admin access required" });
    }
  };

  // ==================== USER MANAGEMENT ====================

  /**
   * GET /api/v1/admin/users
   * List all users
   */
  app.get(
    "/api/v1/admin/users",
    {
      preHandler: [requireAuth, requireAdmin],
      schema: {
        querystring: z.object({
          page: z.coerce.number().default(1),
          limit: z.coerce.number().default(20),
          userType: z.string().optional(),
          status: z.string().optional(),
          search: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { page, limit, userType, status, search } = request.query as any;
        const result = await adminService.listUsers(page, limit, {
          userType,
          status,
          search,
        });
        return reply.status(200).send(result);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/admin/users/:id
   * Get user details
   */
  app.get(
    "/api/v1/admin/users/:id",
    {
      preHandler: [requireAuth, requireAdmin],
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = await adminService.getUserDetails(id);
        return reply.status(200).send(user);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(404).send({ error: error.message });
      }
    }
  );

  /**
   * PATCH /api/v1/admin/users/:id/status
   * Update user status
   */
  app.patch<{
    Body: UpdateUserStatusInput;
    Params: { id: string };
  }>(
    "/api/v1/admin/users/:id/status",
    {
      preHandler: [requireAuth, requireAdmin, validateBody(updateUserStatusSchema)],
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: updateUserStatusSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const adminId = request.user!.id;
        const user = await adminService.updateUserStatus(id, request.body, adminId);
        return reply.status(200).send(user);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * PATCH /api/v1/admin/users/:id
   * Update user details
   */
  app.patch<{
    Body: UpdateUserInput;
    Params: { id: string };
  }>(
    "/api/v1/admin/users/:id",
    {
      preHandler: [requireAuth, requireAdmin, validateBody(updateUserSchema)],
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: updateUserSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const adminId = request.user!.id;
        const user = await adminService.updateUser(id, request.body, adminId);
        return reply.status(200).send(user);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * DELETE /api/v1/admin/users/:id
   * Delete user
   */
  app.delete(
    "/api/v1/admin/users/:id",
    {
      preHandler: [requireAuth, requireAdmin],
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const adminId = request.user!.id;
        const result = await adminService.deleteUser(id, adminId);
        return reply.status(200).send(result);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // ==================== SERVICE PROVIDER MANAGEMENT ====================

  /**
   * GET /api/v1/admin/service-providers
   * List all service providers
   */
  app.get(
    "/api/v1/admin/service-providers",
    {
      preHandler: [requireAuth, requireAdmin],
      schema: {
        querystring: z.object({
          page: z.coerce.number().default(1),
          limit: z.coerce.number().default(20),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { page, limit } = request.query as any;
        const result = await adminService.listServiceProviders(page, limit);
        return reply.status(200).send(result);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * PATCH /api/v1/admin/service-providers/:id/vetting-status
   * Update SP vetting status manually
   */
  app.patch(
    "/api/v1/admin/service-providers/:id/vetting-status",
    {
      preHandler: [requireAuth, requireAdmin],
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          status: z.string(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { status } = request.body as { status: string };
        const adminId = request.user!.id;
        const sp = await adminService.updateSpVettingStatus(id, status, adminId);
        return reply.status(200).send(sp);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // ==================== PLACEMENT MANAGEMENT ====================

  /**
   * GET /api/v1/admin/placements
   * List all placements
   */
  app.get(
    "/api/v1/admin/placements",
    {
      preHandler: [requireAuth, requireAdmin],
      schema: {
        querystring: z.object({
          page: z.coerce.number().default(1),
          limit: z.coerce.number().default(20),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { page, limit } = request.query as any;
        const placements = await adminService.listPlacements(page, limit);
        return reply.status(200).send({ placements });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * PATCH /api/v1/admin/placements/:id/status
   * Update placement status
   */
  app.patch(
    "/api/v1/admin/placements/:id/status",
    {
      preHandler: [requireAuth, requireAdmin],
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          status: z.string(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { status } = request.body as { status: string };
        const adminId = request.user!.id;
        const placement = await adminService.updatePlacementStatus(id, status, adminId);
        return reply.status(200).send(placement);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * POST /api/v1/admin/placements/:id/cancel
   * Cancel placement (admin override)
   */
  app.post(
    "/api/v1/admin/placements/:id/cancel",
    {
      preHandler: [requireAuth, requireAdmin],
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          reason: z.string(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { reason } = request.body as { reason: string };
        const adminId = request.user!.id;
        const placement = await adminService.cancelPlacement(id, reason, adminId);
        return reply.status(200).send(placement);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // ==================== PAYOUT MANAGEMENT ====================

  /**
   * GET /api/v1/admin/payouts
   * List all payout requests
   */
  app.get(
    "/api/v1/admin/payouts",
    {
      preHandler: [requireAuth, requireAdmin],
      schema: {
        querystring: z.object({
          page: z.coerce.number().default(1),
          limit: z.coerce.number().default(20),
          status: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { page, limit, status } = request.query as any;
        const payouts = await adminService.listPayoutRequests(page, limit, status);
        return reply.status(200).send({ payouts });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * POST /api/v1/admin/payouts/:id/approve
   * Approve/reject payout
   */
  app.post<{
    Body: ApprovePayoutInput;
    Params: { id: string };
  }>(
    "/api/v1/admin/payouts/:id/approve",
    {
      preHandler: [requireAuth, requireAdmin, validateBody(approvePayoutSchema)],
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: approvePayoutSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const adminId = request.user!.id;
        const payout = await adminService.approvePayout(id, request.body, adminId);
        return reply.status(200).send(payout);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/admin/revenue
   * Get platform revenue
   */
  app.get(
    "/api/v1/admin/revenue",
    {
      preHandler: [requireAuth, requireAdmin],
      schema: {
        querystring: z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { startDate, endDate } = request.query as any;
        const revenue = await adminService.getPlatformRevenue(
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        );
        return reply.status(200).send(revenue);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // ==================== ANALYTICS & REPORTS ====================

  /**
   * GET /api/v1/admin/dashboard
   * Platform dashboard
   */
  app.get(
    "/api/v1/admin/dashboard",
    {
      preHandler: [requireAuth, requireAdmin],
      schema: {
      },
    },
    async (request, reply) => {
      try {
        const dashboard = await adminService.getDashboard();
        return reply.status(200).send(dashboard);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/admin/analytics/growth
   * User growth metrics
   */
  app.get(
    "/api/v1/admin/analytics/growth",
    {
      preHandler: [requireAuth, requireAdmin],
      schema: {
        querystring: z.object({
          days: z.coerce.number().default(30),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { days } = request.query as { days?: number };
        const growth = await adminService.getUserGrowth(days);
        return reply.status(200).send({ growth });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  /**
   * GET /api/v1/admin/audit-logs
   * Get audit logs
   */
  app.get(
    "/api/v1/admin/audit-logs",
    {
      preHandler: [requireAuth, requireAdmin],
      schema: {
        querystring: z.object({
          page: z.coerce.number().default(1),
          limit: z.coerce.number().default(50),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { page, limit } = request.query as any;
        const logs = await adminService.getAuditLogs(page, limit);
        return reply.status(200).send({ logs });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );
}
