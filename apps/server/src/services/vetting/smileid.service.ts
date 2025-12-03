import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { eq, and } from 'drizzle-orm';
import { pool } from '../../db';
import { serviceProviders, spVettingProgress, vettingSteps } from '../../db/schema';
import { logger, safeLogger } from '../../utils/logger';
import { env } from '../../config/env';
import type { SmileIDKYCRequest, SmileIDKYCResult } from './types';

interface SmileIDConfig {
  partnerId: string;
  apiKey: string;
  callbackUrl: string;
  useSandbox: boolean;
  prodLambdaUrl: string;
  testLambdaUrl: string;
}

export class SmileIDService {
  private readonly config: SmileIDConfig;
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  constructor() {
    this.config = {
      partnerId: env.SMILE_ID_PARTNER_ID || '',
      apiKey: env.SMILE_ID_API_KEY || '',
      callbackUrl: env.SMILE_ID_CALLBACK_URL || '',
      useSandbox: env.SMILE_ID_SANDBOX === 'true',
      prodLambdaUrl: env.SMILE_ID_PROD_LAMBDA_URL || '',
      testLambdaUrl: env.SMILE_ID_TEST_LAMBDA_URL || '',
    };

    this.baseUrl = this.config.useSandbox ? this.config.testLambdaUrl : this.config.prodLambdaUrl;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config) => {
      const timestamp = new Date().toISOString();
      config.headers['smileid-partner-id'] = this.config.partnerId;
      config.headers['smileid-timestamp'] = timestamp;
      config.headers['smileid-request-signature'] = this.generateSignature(timestamp, this.config.partnerId);
      config.headers['smileid-source-sdk'] = 'rest_api';
      config.headers['smileid-source-sdk-version'] = '1.0.0';
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        safeLogger.error({ error: error.message, response: error.response?.data, status: error.response?.status }, 'Smile ID API error');
        throw error;
      }
    );
  }

  private generateSignature(timestamp: string, partnerId: string, requestBody?: string): string {
    const message = timestamp + partnerId + (requestBody || '');
    return crypto.createHmac('sha256', this.config.apiKey).update(message).digest('base64');
  }

  async getJobStatus(jobId: string): Promise<any> {
    const response = await this.client.get('/v2/job-status', { params: { job_id: jobId } });
    safeLogger.info({ jobId, complete: response.data.job_complete }, 'Job status checked');
    return response.data;
  }

  async pollJobStatus(jobId: string, maxAttempts: number = 10): Promise<SmileIDKYCResult> {
    let attempts = 0;
    let delay = 1000;

    while (attempts < maxAttempts) {
      attempts++;
      const status = await this.getJobStatus(jobId);

      if (status.job_complete) {
        if (status.job_success && status.result) {
          safeLogger.info({ jobId, attempts }, 'Job completed successfully');
          return {
            success: true,
            jobId,
            userId: status.result.partner_params?.user_id || '',
            code: status.result.code,
            message: status.result.message,
            matchedFields: status.result.matched_fields,
            selfieImage: status.result.selfie_image,
            livenessImages: status.result.liveness_images,
            idDocumentImages: status.result.id_document_images,
          };
        } else {
          throw new Error(`Job failed: ${status.error || status.code}`);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, 30000);
    }

    throw new Error(`Job polling timed out after ${maxAttempts} attempts`);
  }

  verifyCallbackSignature(payload: string, signature: string, timestamp: string): boolean {
    const expectedSignature = this.generateSignature(timestamp, this.config.partnerId, payload);
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch {
      return false;
    }
  }

  async processCallback(payload: any): Promise<{ success: boolean; message: string }> {
    const jobId = payload.job_id;
    const result: SmileIDKYCResult = {
      success: payload.job_success,
      jobId,
      userId: payload.partner_params?.user_id || '',
      code: payload.result?.code || '',
      message: payload.result?.message || '',
      matchedFields: payload.result?.matched_fields,
      selfieImage: payload.result?.selfie_image,
      livenessImages: payload.result?.liveness_images,
    };

    const shouldFlag = this.shouldFlagForReview(result);
    await this.updateVettingProgress(result.userId, result, shouldFlag);

    safeLogger.info({ jobId, code: result.code }, 'Callback processed');
    return { success: true, message: 'Callback processed' };
  }

  private shouldFlagForReview(result: SmileIDKYCResult): boolean {
    const flaggableCodes = ['1021', '1022', '1023'];
    return flaggableCodes.includes(result.code);
  }

  private async updateVettingProgress(userId: string, result: SmileIDKYCResult, shouldFlag: boolean): Promise<void> {
    const db = await import('../../db').then(m => m.db);

    const vettingStep = await db.query.vettingSteps.findFirst({
      where: eq(vettingSteps.stepName, 'biometric_verification'),
    });

    if (!vettingStep) {
      throw new Error('Biometric verification step not found');
    }

    const sp = await db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.userId, userId),
    });

    if (!sp) {
      throw new Error('Service provider not found');
    }

    await db.update(spVettingProgress)
      .set({
        status: result.code === '1020' ? 'completed' : 'failed',
        completedAt: new Date(),
        resultData: {
          jobId: result.jobId,
          code: result.code,
          message: result.message,
          matchedFields: result.matchedFields,
        },
        flagged: shouldFlag,
        flaggedReason: shouldFlag ? `Biometric verification: ${result.message}` : null,
        updatedAt: new Date(),
      })
      .where(and(
        eq(spVettingProgress.vettingStepId, vettingStep.id),
        eq(spVettingProgress.serviceProviderId, sp.id)
      ));

    await this.updateOverallVettingStatus(sp.id);
  }

  private async updateOverallVettingStatus(serviceProviderId: string): Promise<void> {
    const db = await import('../../db').then(m => m.db);

    const progress = await db.query.spVettingProgress.findMany({
      where: eq(spVettingProgress.serviceProviderId, serviceProviderId),
    });

    const allCompleted = progress.every((p) => p.status === 'completed');
    const anyFlagged = progress.some((p) => p.flagged);

    let overallStatus: string = 'incomplete';
    if (anyFlagged) overallStatus = 'manual_review_pending';
    else if (allCompleted) overallStatus = 'approved';

    await db.update(serviceProviders)
      .set({ vettingStatus: overallStatus as any })
      .where(eq(serviceProviders.id, serviceProviderId));
  }
}

export const smileIdService = new SmileIDService();
