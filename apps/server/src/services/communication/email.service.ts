import { Resend } from 'resend';
import { logger } from '../../utils/logger';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

// Initialize Resend client
// We use a lazy initialization or check in the methods to allow for missing keys in dev
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

interface SendVerificationCodeInput {
  email: string;
  code: string;
}

export const emailService = {
  /**
   * Send generic email
   */
  async sendEmail(input: SendEmailInput): Promise<{ success: boolean; id?: string }> {
    if (!resend) {
      logger.warn('RESEND_API_KEY not found. Email sending skipped.');
      return { success: false };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
      });

      if (error) {
        logger.error({ error }, 'Failed to send email via Resend');
        throw new Error(error.message);
      }

      logger.info({ id: data?.id, to: input.to }, 'Email sent successfully');
      return { success: true, id: data?.id };
    } catch (error) {
      logger.error({ error }, 'Error sending email');
      throw error;
    }
  },

  /**
   * Send verification code (OTP)
   */
  async sendVerificationCode(input: SendVerificationCodeInput): Promise<{ success: boolean }> {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify your email</h2>
        <p>Your verification code for Maids of Honour is:</p>
        <h1 style="color: #CF2680; letter-spacing: 5px; font-size: 32px;">${input.code}</h1>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `;

    return this.sendEmail({
      to: input.email,
      subject: 'Your Verification Code - Maids of Honour',
      html,
    });
  },
};
