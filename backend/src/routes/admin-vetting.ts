/**
 * Admin Vetting Routes
 *
 * Endpoints for admins to manage service provider vetting.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  adminReviewSchema,
  adminStepReviewSchema,
  vettingStepUpdateSchema,
  vettingStepCreateSchema,
  vettingFilterSchema,
  spIdParamSchema,
  stepIdParamSchema,
  type AdminReviewInput,
  type AdminStepReviewInput,
  type VettingStepUpdateInput,
  type VettingStepCreateInput,
  type VettingFilterInput,
} from '../validation/vetting.schemas';
import { VettingProgressService } from '../services/vetting/vetting-progress.service';
import { db } from '../db';
import { serviceProviders, spVettingProgress, vettingSteps, users } from '../db/schema';
import { eq, and, or, count } from 'drizzle-orm';

export async function adminVettingRoutes(fastify: FastifyInstance) {
  const vettingProgressService = new VettingProgressService();

  /**
   * GET /api/v1/admin/vetting/pending
   * List pending service providers (paginated)
   */
  fastify.get<{ Querystring: VettingFilterInput }>(
    '/api/v1/admin/vetting/pending',
    {
      preHandler: [requireAuth, requireRole('admin'), validateQuery(vettingFilterSchema)],
      schema: {
        querystring: vettingFilterSchema,
      },
    },
    async (request: FastifyRequest<{ Querystring: VettingFilterInput }>, reply: FastifyReply) => {
      const { page, limit, status, flagged } = request.query;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions: any[] = [];

      if (status) {
        conditions.push(eq(serviceProviders.vettingStatus, status));
      } else {
        // Default: show all non-approved/rejected
        conditions.push(
          or(
            eq(serviceProviders.vettingStatus, 'incomplete'),
            eq(serviceProviders.vettingStatus, 'documents_pending'),
            eq(serviceProviders.vettingStatus, 'ai_interview_pending'),
            eq(serviceProviders.vettingStatus, 'employer_verification_pending'),
            eq(serviceProviders.vettingStatus, 'manual_review_pending')
          )!
        );
      }

      // Get total count
      const [{ value: total }] = await db
        .select({ value: count() })
        .from(serviceProviders)
        .where(and(...conditions));

      // Get service providers
      const sps = await db
        .select({
          id: serviceProviders.id,
          userId: serviceProviders.userId,
          firstName: serviceProviders.firstName,
          lastName: serviceProviders.lastName,
          county: serviceProviders.county,
          vettingStatus: serviceProviders.vettingStatus,
          profileCompletionPercentage: serviceProviders.profileCompletionPercentage,
          createdAt: serviceProviders.createdAt,
          email: users.email,
          phoneNumber: users.phoneNumber,
        })
        .from(serviceProviders)
        .innerJoin(users, eq(serviceProviders.userId, users.id))
        .where(and(...conditions))
        .limit(limit)
        .offset(offset)
        .orderBy(serviceProviders.createdAt);

      return reply.code(200).send({
        success: true,
        data: sps,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
  );

  /**
   * GET /api/v1/admin/vetting/flagged
   * List flagged service providers
   */
  fastify.get<{ Querystring: VettingFilterInput }>(
    '/api/v1/admin/vetting/flagged',
    {
      preHandler: [requireAuth, requireRole('admin'), validateQuery(vettingFilterSchema)],
      schema: {
        querystring: vettingFilterSchema,
      },
    },
    async (request: FastifyRequest<{ Querystring: VettingFilterInput }>, reply: FastifyReply) => {
      const { page, limit } = request.query;
      const offset = (page - 1) * limit;

      // Get total count of flagged SPs
      const [{ value: total }] = await db
        .select({ value: count() })
        .from(serviceProviders)
        .where(eq(serviceProviders.vettingStatus, 'manual_review_pending'));

      // Get flagged service providers
      const sps = await db
        .select({
          id: serviceProviders.id,
          userId: serviceProviders.userId,
          firstName: serviceProviders.firstName,
          lastName: serviceProviders.lastName,
          county: serviceProviders.county,
          vettingStatus: serviceProviders.vettingStatus,
          profileCompletionPercentage: serviceProviders.profileCompletionPercentage,
          createdAt: serviceProviders.createdAt,
          email: users.email,
          phoneNumber: users.phoneNumber,
        })
        .from(serviceProviders)
        .innerJoin(users, eq(serviceProviders.userId, users.id))
        .where(eq(serviceProviders.vettingStatus, 'manual_review_pending'))
        .limit(limit)
        .offset(offset)
        .orderBy(serviceProviders.createdAt);

      return reply.code(200).send({
        success: true,
        data: sps,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
  );

  /**
   * GET /api/v1/admin/vetting/:spId
   * Get detailed vetting information for a service provider
   */
  fastify.get<{ Params: { spId: string } }>(
    '/api/v1/admin/vetting/:spId',
    {
      preHandler: [requireAuth, requireRole('admin'), validateParams(spIdParamSchema)],
      schema: {
        params: spIdParamSchema,
      },
    },
    async (request: FastifyRequest<{ Params: { spId: string } }>, reply: FastifyReply) => {
      const { spId } = request.params;

      // Get service provider details
      const [sp] = await db
        .select()
        .from(serviceProviders)
        .where(eq(serviceProviders.id, spId))
        .limit(1);

      if (!sp) {
        return reply.code(404).send({ error: 'Service provider not found' });
      }

      // Get user details
      const [user] = await db
        .select({
          email: users.email,
          phoneNumber: users.phoneNumber,
          phoneVerified: users.phoneVerified,
        })
        .from(users)
        .where(eq(users.id, sp.userId))
        .limit(1);

      // Get vetting progress
      const progress = await vettingProgressService.getProgress(spId);

      return reply.code(200).send({
        success: true,
        serviceProvider: {
          ...sp,
          ...user,
        },
        vettingProgress: progress,
      });
    }
  );

  /**
   * POST /api/v1/admin/vetting/:spId/approve
   * Approve a service provider
   */
  fastify.post<{ Params: { spId: string }; Body: AdminReviewInput }>(
    '/api/v1/admin/vetting/:spId/approve',
    {
      preHandler: [requireAuth, requireRole('admin'), validateParams(spIdParamSchema), validateBody(adminReviewSchema)],
      schema: {
        params: spIdParamSchema,
        body: adminReviewSchema,
      },
    },
    async (request: FastifyRequest<{ Params: { spId: string }; Body: AdminReviewInput }>, reply: FastifyReply) => {
      const { spId } = request.params;
      const { notes } = request.body;
      const adminId = (request.user as any).id;

      // Update service provider status
      await db
        .update(serviceProviders)
        .set({
          vettingStatus: 'approved',
          vettingCompletedAt: new Date(),
          vettingNotes: notes || null,
          approvedAt: new Date(),
          approvedBy: adminId,
          availableForPlacement: true,
          updatedAt: new Date(),
        })
        .where(eq(serviceProviders.id, spId));

      return reply.code(200).send({
        success: true,
        message: 'Service provider approved successfully',
      });
    }
  );

  /**
   * POST /api/v1/admin/vetting/:spId/reject
   * Reject a service provider
   */
  fastify.post<{ Params: { spId: string }; Body: AdminReviewInput }>(
    '/api/v1/admin/vetting/:spId/reject',
    {
      preHandler: [requireAuth, requireRole('admin'), validateParams(spIdParamSchema), validateBody(adminReviewSchema)],
      schema: {
        params: spIdParamSchema,
        body: adminReviewSchema,
      },
    },
    async (request: FastifyRequest<{ Params: { spId: string }; Body: AdminReviewInput }>, reply: FastifyReply) => {
      const { spId } = request.params;
      const { notes } = request.body;

      // Update service provider status
      await db
        .update(serviceProviders)
        .set({
          vettingStatus: 'rejected',
          vettingNotes: notes || null,
          availableForPlacement: false,
          updatedAt: new Date(),
        })
        .where(eq(serviceProviders.id, spId));

      return reply.code(200).send({
        success: true,
        message: 'Service provider rejected',
      });
    }
  );

  /**
   * POST /api/v1/admin/vetting/:spId/steps/:stepId/review
   * Review a specific flagged vetting step
   */
  fastify.post<{ Params: { spId: string; stepId: string }; Body: AdminStepReviewInput }>(
    '/api/v1/admin/vetting/:spId/steps/:stepId/review',
    {
      preHandler: [
        requireAuth,
        requireRole('admin'),
        validateParams(
          spIdParamSchema.merge(stepIdParamSchema)
        ),
        validateBody(adminStepReviewSchema),
      ],
      schema: {
        params: spIdParamSchema.merge(stepIdParamSchema),
        body: adminStepReviewSchema,
      },
    },
    async (
      request: FastifyRequest<{ Params: { spId: string; stepId: string }; Body: AdminStepReviewInput }>,
      reply: FastifyReply
    ) => {
      const { spId, stepId } = request.params;
      const { approved, adminNotes } = request.body;
      const adminId = (request.user as any).id;

      // Review the flagged step
      await vettingProgressService.reviewFlaggedStep(spId, stepId, approved, adminNotes, adminId);

      return reply.code(200).send({
        success: true,
        message: approved ? 'Step approved' : 'Step rejected',
      });
    }
  );

  /**
   * PATCH /api/v1/admin/vetting/steps/:stepId
   * Update a vetting step
   */
  fastify.patch<{ Params: { stepId: string }; Body: VettingStepUpdateInput }>(
    '/api/v1/admin/vetting/steps/:stepId',
    {
      preHandler: [requireAuth, requireRole('admin'), validateParams(stepIdParamSchema), validateBody(vettingStepUpdateSchema)],
      schema: {
        params: stepIdParamSchema,
        body: vettingStepUpdateSchema,
      },
    },
    async (request: FastifyRequest<{ Params: { stepId: string }; Body: VettingStepUpdateInput }>, reply: FastifyReply) => {
      const { stepId } = request.params;
      const updateData = request.body;
      const adminId = (request.user as any).id;

      // Update vetting step
      await db
        .update(vettingSteps)
        .set({
          ...updateData,
          lastModifiedBy: adminId,
          updatedAt: new Date(),
        })
        .where(eq(vettingSteps.id, stepId));

      return reply.code(200).send({
        success: true,
        message: 'Vetting step updated successfully',
      });
    }
  );

  /**
   * POST /api/v1/admin/vetting/steps
   * Create a new vetting step
   */
  fastify.post<{ Body: VettingStepCreateInput }>(
    '/api/v1/admin/vetting/steps',
    {
      preHandler: [requireAuth, requireRole('admin'), validateBody(vettingStepCreateSchema)],
      schema: {
        body: vettingStepCreateSchema,
      },
    },
    async (request: FastifyRequest<{ Body: VettingStepCreateInput }>, reply: FastifyReply) => {
      const stepData = request.body;
      const adminId = (request.user as any).id;

      // Create vetting step
      const [step] = await db
        .insert(vettingSteps)
        .values({
          ...stepData,
          createdBy: adminId,
          lastModifiedBy: adminId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return reply.code(201).send({
        success: true,
        message: 'Vetting step created successfully',
        step,
      });
    }
  );
}
