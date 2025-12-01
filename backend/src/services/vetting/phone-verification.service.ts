import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { eq, and } from 'drizzle-orm';
import { serviceProviders, spVettingProgress, vettingSteps } from '../../db/schema';
import { safeLogger } from '../../utils/logger';
import { env } from '../../config/env';
import type { PhoneVerificationRequest, PhoneVerificationResult } from './types';

export class PhoneVerificationService {
  private readonly client: AxiosInstance;
  private readonly partnerId: string;
  private readonly apiKey: string;
  private readonly callbackUrl: string;

  constructor() {
    this.partnerId = env.SMILE_ID_PARTNER_ID || '';
    this.apiKey = env.SMILE_ID_API_KEY || '';
    this.callbackUrl = env.PHONE_VERIFICATION_CALLBACK_URL || '';

    const baseUrl = env.SMILE_ID_SANDBOX === 'true' ? env.SMILE_ID_TEST_LAMBDA_URL : env.SMILE_ID_PROD_LAMBDA_URL;

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config) => {
      const timestamp = new Date().toISOString();
      config.headers['smileid-partner-id'] = this.partnerId;
      config.headers['smileid-timestamp'] = timestamp;
      config.headers['smileid-request-signature'] = this.generateSignature(timestamp);
      config.headers['smileid-source-sdk'] = 'rest_api';
      config.headers['smileid-source-sdk-version'] = '1.0.0';
      return config;
    });
  }

  private generateSignature(timestamp: string, requestBody?: string): string {
    const message = timestamp + this.partnerId + (requestBody || '');
    return crypto.createHmac('sha256', this.apiKey).update(message).digest('base64');
  }

  verifyCallbackSignature(payload: string, signature: string, timestamp: string): boolean {
    const expectedSignature = this.generateSignature(timestamp, payload);
    return signature === expectedSignature;
  }

  async submitPhoneVerification(request: PhoneVerificationRequest): Promise<{ success: boolean }> {
    const response = await this.client.post('/v2/async-verify-phone', {
      callback_url: request.callbackUrl || this.callbackUrl,
      country: request.country,
      phone_number: request.phoneNumber,
      match_fields: {
        first_name: request.matchFields.firstName,
        last_name: request.matchFields.lastName,
        other_name: request.matchFields.otherName,
        id_number: request.matchFields.idNumber,
      },
      operator: request.operator,
    });

    safeLogger.info({ phoneNumber: request.phoneNumber }, 'Phone verification submitted');
    return { success: response.data.success };
  }

  async processCallback(payload: any): Promise<{ success: boolean; message: string }> {
    const result: PhoneVerificationResult = {
      success: payload.job_success || false,
      code: payload.code || '',
      message: payload.message || '',
      jobId: payload.job_id,
      jobType: 'phone_number_verification',
      matchedFields: payload.matched_fields,
      timestamp: payload.timestamp,
    };

    const userId = payload.partner_params?.user_id;
    if (!userId) {
      throw new Error('User ID not found in callback');
    }

    const shouldFlag = this.shouldFlagForReview(result);
    await this.updateVettingProgress(userId, result, shouldFlag);

    safeLogger.info({ jobId: result.jobId, code: result.code }, 'Phone verification callback processed');
    return { success: true, message: 'Callback processed' };
  }

  private shouldFlagForReview(result: PhoneVerificationResult): boolean {
    const flaggableCodes = ['1021', '1022', '1023'];
    return flaggableCodes.includes(result.code);
  }

  private async updateVettingProgress(userId: string, result: PhoneVerificationResult, shouldFlag: boolean): Promise<void> {
    const db = await import('../../db').then(m => m.db);

    const vettingStep = await db.query.vettingSteps.findFirst({
      where: eq(vettingSteps.stepName, 'phone_verification'),
    });

    if (!vettingStep) {
      throw new Error('Phone verification step not found');
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
        flaggedReason: shouldFlag ? `Phone verification: ${result.message}` : null,
        updatedAt: new Date(),
      })
      .where(and(
        eq(spVettingProgress.vettingStepId, vettingStep.id),
        eq(spVettingProgress.serviceProviderId, sp.id)
      ));
  }
}

export const phoneVerificationService = new PhoneVerificationService();
