/**
 * Vetting Progress Service
 *
 * Tracks service provider progress through vetting steps.
 * Manages step status, completion tracking, and admin flagging.
 */

import { db } from '../../db';
import { serviceProviders, vettingSteps, spVettingProgress } from '../../db/schema';
import { eq, and, or } from 'drizzle-orm';
import type { VettingStepStatus, VettingStatus } from './types';

interface VettingProgressItem {
  stepId: string;
  stepName: string;
  stepDescription: string | null;
  stepOrder: number;
  isRequired: boolean;
  status: VettingStepStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  resultData: any;
  flagged: boolean;
  flaggedReason: string | null;
  adminReviewed: boolean;
}

interface VettingOverview {
  serviceProviderId: string;
  vettingStatus: VettingStatus;
  completionPercentage: number;
  totalSteps: number;
  completedSteps: number;
  flaggedSteps: number;
  steps: VettingProgressItem[];
}

export class VettingProgressService {
  /**
   * Initialize vetting progress for a new service provider
   * Creates progress records for all active required steps
   */
  async startVetting(serviceProviderId: string): Promise<void> {
    // Get all active vetting steps for service providers
    const steps = await db
      .select()
      .from(vettingSteps)
      .where(
        and(
          eq(vettingSteps.isActive, true),
          or(
            eq(vettingSteps.applicableTo, 'service_provider'),
            eq(vettingSteps.applicableTo, 'both')
          )
        )
      )
      .orderBy(vettingSteps.stepOrder);

    if (steps.length === 0) {
      throw new Error('No active vetting steps found');
    }

    // Create progress records for each step
    const progressRecords = steps.map((step) => ({
      serviceProviderId,
      vettingStepId: step.id,
      status: 'not_started' as VettingStepStatus,
      resultData: null,
      flagged: false,
      adminReviewed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(spVettingProgress).values(progressRecords);

    // Update service provider vetting status
    await db
      .update(serviceProviders)
      .set({
        vettingStatus: 'incomplete',
        profileCompletionPercentage: 0,
        updatedAt: new Date(),
      })
      .where(eq(serviceProviders.id, serviceProviderId));
  }

  /**
   * Get vetting progress for a service provider
   */
  async getProgress(serviceProviderId: string): Promise<VettingOverview> {
    // Get all progress records with step details
    const progressData = await db
      .select({
        stepId: vettingSteps.id,
        stepName: vettingSteps.stepName,
        stepDescription: vettingSteps.stepDescription,
        stepOrder: vettingSteps.stepOrder,
        isRequired: vettingSteps.isRequired,
        status: spVettingProgress.status,
        startedAt: spVettingProgress.startedAt,
        completedAt: spVettingProgress.completedAt,
        resultData: spVettingProgress.resultData,
        flagged: spVettingProgress.flagged,
        flaggedReason: spVettingProgress.flaggedReason,
        adminReviewed: spVettingProgress.adminReviewed,
      })
      .from(spVettingProgress)
      .innerJoin(vettingSteps, eq(spVettingProgress.vettingStepId, vettingSteps.id))
      .where(eq(spVettingProgress.serviceProviderId, serviceProviderId))
      .orderBy(vettingSteps.stepOrder);

    if (progressData.length === 0) {
      throw new Error('No vetting progress found for service provider');
    }

    // Get current SP vetting status
    const [sp] = await db
      .select({
        vettingStatus: serviceProviders.vettingStatus,
      })
      .from(serviceProviders)
      .where(eq(serviceProviders.id, serviceProviderId))
      .limit(1);

    if (!sp) {
      throw new Error('Service provider not found');
    }

    // Calculate metrics
    const totalSteps = progressData.length;
    const completedSteps = progressData.filter((s) => s.status === 'completed').length;
    const flaggedSteps = progressData.filter((s) => s.flagged).length;
    const completionPercentage = Math.round((completedSteps / totalSteps) * 100);

    return {
      serviceProviderId,
      vettingStatus: sp.vettingStatus as VettingStatus,
      completionPercentage,
      totalSteps,
      completedSteps,
      flaggedSteps,
      steps: progressData as VettingProgressItem[],
    };
  }

  /**
   * Update a specific vetting step status
   */
  async updateStepStatus(
    serviceProviderId: string,
    vettingStepId: string,
    status: VettingStepStatus,
    resultData?: any
  ): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'in_progress' && !updateData.startedAt) {
      updateData.startedAt = new Date();
    }

    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    if (resultData) {
      updateData.resultData = resultData;
    }

    await db
      .update(spVettingProgress)
      .set(updateData)
      .where(
        and(
          eq(spVettingProgress.serviceProviderId, serviceProviderId),
          eq(spVettingProgress.vettingStepId, vettingStepId)
        )
      );

    // Recalculate overall vetting status
    await this.updateOverallVettingStatus(serviceProviderId);
  }

  /**
   * Flag a vetting step for admin review
   */
  async flagForReview(
    serviceProviderId: string,
    vettingStepId: string,
    reason: string
  ): Promise<void> {
    await db
      .update(spVettingProgress)
      .set({
        flagged: true,
        flaggedReason: reason,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(spVettingProgress.serviceProviderId, serviceProviderId),
          eq(spVettingProgress.vettingStepId, vettingStepId)
        )
      );

    // Update overall status to manual_review_pending
    await db
      .update(serviceProviders)
      .set({
        vettingStatus: 'manual_review_pending',
        updatedAt: new Date(),
      })
      .where(eq(serviceProviders.id, serviceProviderId));
  }

  /**
   * Check if vetting is complete and update overall status
   */
  async checkCompletion(serviceProviderId: string): Promise<boolean> {
    const progress = await this.getProgress(serviceProviderId);

    // Check if all required steps are completed
    const allRequiredCompleted = progress.steps
      .filter((s) => s.isRequired)
      .every((s) => s.status === 'completed' || s.status === 'skipped');

    // Check if any steps are flagged
    const hasFlaggedSteps = progress.flaggedSteps > 0;

    if (hasFlaggedSteps) {
      // Don't auto-complete if there are flagged steps
      return false;
    }

    if (allRequiredCompleted) {
      // All required steps done, update to approved (or pending manual review)
      await db
        .update(serviceProviders)
        .set({
          vettingStatus: 'approved',
          vettingCompletedAt: new Date(),
          profileCompletionPercentage: 100,
          availableForPlacement: true,
          updatedAt: new Date(),
        })
        .where(eq(serviceProviders.id, serviceProviderId));

      return true;
    }

    return false;
  }

  /**
   * Calculate and update overall vetting status based on step completion
   */
  private async updateOverallVettingStatus(serviceProviderId: string): Promise<void> {
    const progress = await this.getProgress(serviceProviderId);

    let newStatus: VettingStatus = 'incomplete';

    // Check for flagged steps
    if (progress.flaggedSteps > 0) {
      newStatus = 'manual_review_pending';
    } else {
      // Determine status based on which steps are complete
      const hasDocuments = progress.steps.some(
        (s) => s.stepName.toLowerCase().includes('document') && s.status === 'completed'
      );
      const hasAIInterview = progress.steps.some(
        (s) => s.stepName.toLowerCase().includes('interview') && s.status === 'completed'
      );
      const hasEmployerVerification = progress.steps.some(
        (s) => s.stepName.toLowerCase().includes('employer') && s.status === 'completed'
      );

      // Logic to determine status
      if (!hasDocuments) {
        newStatus = 'documents_pending';
      } else if (!hasAIInterview) {
        newStatus = 'ai_interview_pending';
      } else if (!hasEmployerVerification) {
        newStatus = 'employer_verification_pending';
      } else {
        // All major steps done
        const allRequiredCompleted = progress.steps
          .filter((s) => s.isRequired)
          .every((s) => s.status === 'completed' || s.status === 'skipped');

        if (allRequiredCompleted) {
          newStatus = 'approved';
        } else {
          newStatus = 'incomplete';
        }
      }
    }

    // Update service provider status
    await db
      .update(serviceProviders)
      .set({
        vettingStatus: newStatus,
        profileCompletionPercentage: progress.completionPercentage,
        updatedAt: new Date(),
      })
      .where(eq(serviceProviders.id, serviceProviderId));
  }

  /**
   * Admin review a flagged step (approve or reject)
   */
  async reviewFlaggedStep(
    serviceProviderId: string,
    vettingStepId: string,
    approved: boolean,
    adminNotes: string,
    reviewedBy: string
  ): Promise<void> {
    await db
      .update(spVettingProgress)
      .set({
        adminReviewed: true,
        adminNotes,
        reviewedBy,
        reviewedAt: new Date(),
        status: approved ? 'completed' : 'failed',
        flagged: !approved, // Clear flag if approved
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(spVettingProgress.serviceProviderId, serviceProviderId),
          eq(spVettingProgress.vettingStepId, vettingStepId)
        )
      );

    // Recalculate overall status
    await this.updateOverallVettingStatus(serviceProviderId);
  }
}
