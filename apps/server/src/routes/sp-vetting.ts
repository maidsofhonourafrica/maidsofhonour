/**
 * Service Provider Vetting Routes
 *
 * Endpoints for service providers to complete their vetting process.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  biometricSubmissionSchema,
  phoneVerificationSchema,
  documentUploadSchema,
  videoUploadSchema,
  profileSetupSchema,
  documentTypeParamSchema,
  type BiometricSubmissionInput,
  type PhoneVerificationInput,
  type DocumentUploadInput,
  type VideoUploadInput,
  type ProfileSetupInput,
} from '../validation/vetting.schemas';
import { SmileIDService } from '../services/vetting/smileid.service';
import { PhoneVerificationService } from '../services/vetting/phone-verification.service';
import { VettingProgressService } from '../services/vetting/vetting-progress.service';
import { DocumentUploadService } from '../services/vetting/document-upload.service';
import { VideoUploadService } from '../services/vetting/video-upload.service';
import { db } from '../db';
import { serviceProviders, serviceProviderSkills, vettingSteps } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function spVettingRoutes(fastify: FastifyInstance) {
  const smileIdService = new SmileIDService();
  const phoneVerificationService = new PhoneVerificationService();
  const vettingProgressService = new VettingProgressService();
  const documentUploadService = new DocumentUploadService();
  const videoUploadService = new VideoUploadService();

  /**
   * POST /api/v1/sp/vetting/start
   * Initialize vetting process for a service provider
   */
  fastify.post(
    '/api/v1/sp/vetting/start',
    {
      preHandler: [requireAuth],
      schema: {},
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as any).id;

      // Check if user is a service provider
      const [sp] = await db
        .select({ id: serviceProviders.id })
        .from(serviceProviders)
        .where(eq(serviceProviders.userId, userId))
        .limit(1);

      if (!sp) {
        return reply.code(404).send({ error: 'Service provider profile not found' });
      }

      // Initialize vetting progress
      await vettingProgressService.startVetting(sp.id);

      return reply.code(200).send({
        success: true,
        message: 'Vetting process started',
        serviceProviderId: sp.id,
      });
    }
  );

  /**
   * POST /api/v1/sp/vetting/biometric
   * Submit biometric verification result
   */
  fastify.post<{ Body: BiometricSubmissionInput }>(
    '/api/v1/sp/vetting/biometric',
    {
      preHandler: [requireAuth, validateBody(biometricSubmissionSchema)],
      schema: {
        body: biometricSubmissionSchema,
      },
    },
    async (request: FastifyRequest<{ Body: BiometricSubmissionInput }>, reply: FastifyReply) => {
      const userId = (request.user as any).id;
      const { jobId, country, idType, idNumber } = request.body;

      // Get service provider
      const [sp] = await db
        .select({ id: serviceProviders.id })
        .from(serviceProviders)
        .where(eq(serviceProviders.userId, userId))
        .limit(1);

      if (!sp) {
        return reply.code(404).send({ error: 'Service provider profile not found' });
      }

      // Poll Smile ID for job status
      try {
        const result = await smileIdService.pollJobStatus(jobId);

        return reply.code(200).send({
          success: result.success,
          message: 'Biometric verification processed',
          result,
        });
      } catch (error: any) {
        return reply.code(500).send({
          error: 'Failed to verify biometric data',
          message: error.message,
        });
      }
    }
  );

  /**
   * POST /api/v1/sp/vetting/phone
   * Submit phone verification request
   */
  fastify.post<{ Body: PhoneVerificationInput }>(
    '/api/v1/sp/vetting/phone',
    {
      preHandler: [requireAuth, validateBody(phoneVerificationSchema)],
      schema: {
        body: phoneVerificationSchema,
      },
    },
    async (request: FastifyRequest<{ Body: PhoneVerificationInput }>, reply: FastifyReply) => {
      const userId = (request.user as any).id;
      const { country, phoneNumber, firstName, lastName, otherName, idNumber, operator } = request.body;

      // Get service provider
      const [sp] = await db
        .select({ id: serviceProviders.id })
        .from(serviceProviders)
        .where(eq(serviceProviders.userId, userId))
        .limit(1);

      if (!sp) {
        return reply.code(404).send({ error: 'Service provider profile not found' });
      }

      // Submit phone verification
      try {
        const result = await phoneVerificationService.submitPhoneVerification({
          country,
          phoneNumber,
          matchFields: {
            firstName,
            lastName,
            otherName,
            idNumber,
          },
          operator,
        });

        return reply.code(200).send({
          success: result.success,
          message: 'Phone verification request submitted. You will receive a callback when complete.',
        });
      } catch (error: any) {
        return reply.code(500).send({
          error: 'Failed to submit phone verification',
          message: error.message,
        });
      }
    }
  );

  /**
   * POST /api/v1/sp/vetting/documents/:type
   * Upload a KYC document
   */
  fastify.post<{ Params: { type: string } }>(
    '/api/v1/sp/vetting/documents/:type',
    {
      preHandler: [requireAuth, validateParams(documentTypeParamSchema)],
      schema: {
        params: documentTypeParamSchema,
      },
    },
    async (request: FastifyRequest<{ Params: { type: string } }>, reply: FastifyReply) => {
      const userId = (request.user as any).id;
      const documentType = request.params.type as any;

      // Get service provider
      const [sp] = await db
        .select({ id: serviceProviders.id })
        .from(serviceProviders)
        .where(eq(serviceProviders.userId, userId))
        .limit(1);

      if (!sp) {
        return reply.code(404).send({ error: 'Service provider profile not found' });
      }

      // Get file from multipart form data
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      // Convert stream to buffer
      const buffer = await data.toBuffer();

      // Upload document
      try {
        const result = await documentUploadService.uploadDocument({
          serviceProviderId: sp.id,
          documentType,
          file: {
            buffer,
            originalName: data.filename,
            mimeType: data.mimetype,
          },
        });

        return reply.code(200).send({
          success: true,
          message: 'Document uploaded successfully',
          document: result,
        });
      } catch (error: any) {
        return reply.code(500).send({
          error: 'Failed to upload document',
          message: error.message,
        });
      }
    }
  );

  /**
   * POST /api/v1/sp/vetting/video-introduction
   * Upload video introduction
   */
  fastify.post(
    '/api/v1/sp/vetting/video-introduction',
    {
      preHandler: [requireAuth],
      schema: {},
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as any).id;

      // Get service provider
      const [sp] = await db
        .select({ id: serviceProviders.id })
        .from(serviceProviders)
        .where(eq(serviceProviders.userId, userId))
        .limit(1);

      if (!sp) {
        return reply.code(404).send({ error: 'Service provider profile not found' });
      }

      // Get file from multipart form data
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      // Validate video file type
      if (!data.mimetype.startsWith('video/')) {
        return reply.code(400).send({ error: 'File must be a video' });
      }

      // Convert stream to buffer
      const buffer = await data.toBuffer();

      // Upload video
      try {
        const result = await videoUploadService.uploadVideo({
          serviceProviderId: sp.id,
          videoType: 'self_introduction',
          file: {
            buffer,
            originalName: data.filename,
            mimeType: data.mimetype,
          },
        });

        return reply.code(200).send({
          success: true,
          message: 'Video uploaded successfully',
          video: result,
        });
      } catch (error: any) {
        return reply.code(500).send({
          error: 'Failed to upload video',
          message: error.message,
        });
      }
    }
  );

  /**
   * POST /api/v1/sp/vetting/profile
   * Complete profile setup
   */
  fastify.post<{ Body: ProfileSetupInput }>(
    '/api/v1/sp/vetting/profile',
    {
      preHandler: [requireAuth, validateBody(profileSetupSchema)],
      schema: {
        body: profileSetupSchema,
      },
    },
    async (request: FastifyRequest<{ Body: ProfileSetupInput }>, reply: FastifyReply) => {
      const userId = (request.user as any).id;
      const profileData = request.body;

      // Get service provider
      const [sp] = await db
        .select({ id: serviceProviders.id })
        .from(serviceProviders)
        .where(eq(serviceProviders.userId, userId))
        .limit(1);

      if (sp) {
        // Update existing profile
        await db
          .update(serviceProviders)
          .set({
            firstName: profileData.firstName,
            middleName: profileData.middleName || null,
            lastName: profileData.lastName,
            dateOfBirth: profileData.dateOfBirth,
            gender: profileData.gender || null,
            nationalId: profileData.nationalId,
            county: profileData.county,
            subCounty: profileData.subCounty || null,
            ward: profileData.ward || null,
            specificLocation: profileData.specificLocation || null,
            bio: profileData.bio || null,
            yearsOfExperience: profileData.yearsOfExperience || null,
            languagesSpoken: profileData.languagesSpoken || null,
            educationLevel: profileData.educationLevel || null,
            willingToRelocate: profileData.willingToRelocate || false,
            preferredWorkType: profileData.preferredWorkType || null,
            childrenCount: profileData.childrenCount || null,
            maritalStatus: profileData.maritalStatus || null,
            socialMediaLinks: profileData.socialMediaLinks || null,
            smsNotificationsConsent: profileData.smsNotificationsConsent,
            updatedAt: new Date(),
          })
          .where(eq(serviceProviders.id, sp.id));
      } else {
        // Create new profile
        await db.insert(serviceProviders).values({
          userId,
          firstName: profileData.firstName,
          middleName: profileData.middleName || null,
          lastName: profileData.lastName,
          dateOfBirth: profileData.dateOfBirth,
          gender: profileData.gender || null,
          nationalId: profileData.nationalId,
          county: profileData.county,
          subCounty: profileData.subCounty || null,
          ward: profileData.ward || null,
          specificLocation: profileData.specificLocation || null,
          bio: profileData.bio || null,
          yearsOfExperience: profileData.yearsOfExperience || null,
          languagesSpoken: profileData.languagesSpoken || null,
          educationLevel: profileData.educationLevel || null,
          willingToRelocate: profileData.willingToRelocate || false,
          preferredWorkType: profileData.preferredWorkType || null,
          childrenCount: profileData.childrenCount || null,
          maritalStatus: profileData.maritalStatus || null,
          socialMediaLinks: profileData.socialMediaLinks || null,
          smsNotificationsConsent: profileData.smsNotificationsConsent,
          vettingStatus: 'incomplete',
          profileCompletionPercentage: 0,
          availableForPlacement: false,
          currentlyPlaced: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Get updated SP
      const [updatedSp] = await db
        .select({ id: serviceProviders.id })
        .from(serviceProviders)
        .where(eq(serviceProviders.userId, userId))
        .limit(1);

      // Update skills
      if (profileData.skills && profileData.skills.length > 0) {
        // Delete existing skills
        await db.delete(serviceProviderSkills).where(eq(serviceProviderSkills.serviceProviderId, updatedSp.id));

        // Insert new skills
        await db.insert(serviceProviderSkills).values(
          profileData.skills.map((skill) => ({
            serviceProviderId: updatedSp.id,
            categoryId: skill.categoryId,
            experienceYears: skill.experienceYears || null,
            proficiencyLevel: skill.proficiencyLevel,
            certified: skill.certified,
            createdAt: new Date(),
          }))
        );
      }

      return reply.code(200).send({
        success: true,
        message: 'Profile updated successfully',
        serviceProviderId: updatedSp.id,
      });
    }
  );

  /**
   * GET /api/v1/sp/vetting/status
   * Get vetting progress
   */
  fastify.get(
    '/api/v1/sp/vetting/status',
    {
      preHandler: [requireAuth],
      schema: {},
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as any).id;

      // Get service provider
      const [sp] = await db
        .select({ id: serviceProviders.id })
        .from(serviceProviders)
        .where(eq(serviceProviders.userId, userId))
        .limit(1);

      if (!sp) {
        return reply.code(404).send({ error: 'Service provider profile not found' });
      }

      // Get progress
      try {
        const progress = await vettingProgressService.getProgress(sp.id);

        return reply.code(200).send({
          success: true,
          progress,
        });
      } catch (error: any) {
        return reply.code(500).send({
          error: 'Failed to get vetting progress',
          message: error.message,
        });
      }
    }
  );

  /**
   * GET /api/v1/sp/vetting/steps
   * Get all vetting steps
   */
  fastify.get(
    '/api/v1/sp/vetting/steps',
    {
      preHandler: [requireAuth],
      schema: {},
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Get all active vetting steps for service providers
      const steps = await db
        .select({
          id: vettingSteps.id,
          stepName: vettingSteps.stepName,
          stepDescription: vettingSteps.stepDescription,
          stepOrder: vettingSteps.stepOrder,
          isRequired: vettingSteps.isRequired,
        })
        .from(vettingSteps)
        .where(eq(vettingSteps.isActive, true))
        .orderBy(vettingSteps.stepOrder);

      return reply.code(200).send({
        success: true,
        steps,
      });
    }
  );
}
