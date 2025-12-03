/**
 * WhatsApp Cloud API Service
 *
 * For former employer verification via WhatsApp
 * Sends verification links and tracks message delivery
 */

import axios, { AxiosInstance } from 'axios';

interface WhatsAppMessageResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string; // WhatsApp message ID
  }>;
}

interface WhatsAppTemplateMessage {
  to: string;
  template: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
}

export class WhatsAppService {
  private client: AxiosInstance;
  private phoneNumberId: string;
  private accessToken: string;
  private apiVersion: string;

  // 24-hour conversation window in milliseconds
  private readonly CONVERSATION_WINDOW_MS = 24 * 60 * 60 * 1000;

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;
    this.apiVersion = process.env.WHATSAPP_CLOUD_API_VERSION || 'v21.0';

    if (!this.phoneNumberId || !this.accessToken) {
      throw new Error('WhatsApp Cloud API credentials not configured');
    }

    this.client = axios.create({
      baseURL: `https://graph.facebook.com/${this.apiVersion}`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Send text message
   */
  async sendTextMessage(params: {
    to: string;
    text: string;
  }): Promise<{ messageId: string; wamid: string }> {
    try {
      const response = await this.client.post<WhatsAppMessageResponse>(
        `/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: this.formatPhoneNumber(params.to),
          type: 'text',
          text: {
            preview_url: true, // Enable link previews
            body: params.text
          }
        }
      );

      return {
        messageId: response.data.messages[0].id,
        wamid: response.data.messages[0].id
      };
    } catch (error: any) {
      console.error('WhatsApp send message error:', error.response?.data || error.message);
      throw new Error(`Failed to send WhatsApp message: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Send template message (pre-approved by Meta)
   */
  async sendTemplateMessage(params: {
    to: string;
    templateName: string;
    languageCode?: string;
    components?: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text: string;
      }>;
    }>;
  }): Promise<{ messageId: string; wamid: string }> {
    try {
      const response = await this.client.post<WhatsAppMessageResponse>(
        `/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(params.to),
          type: 'template',
          template: {
            name: params.templateName,
            language: {
              code: params.languageCode || 'en'
            },
            components: params.components || []
          }
        }
      );

      return {
        messageId: response.data.messages[0].id,
        wamid: response.data.messages[0].id
      };
    } catch (error: any) {
      console.error('WhatsApp send template error:', error.response?.data || error.message);
      throw new Error(`Failed to send WhatsApp template: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Send former employer verification message
   *
   * Example message:
   * "Hello [Employer Name],
   *
   * My name is Shiko from Maids of Honour-Africa. [SP Name] has
   * indicated you as their former employer. Please verify and
   * provide a brief reference:
   *
   * 👉 Click here to complete verification: [LINK]
   *
   * Thank you 🙏🏽"
   */
  async sendEmployerVerificationRequest(params: {
    employerPhone: string;
    employerName: string;
    serviceProviderName: string;
    verificationLink: string;
  }): Promise<{ messageId: string; wamid: string }> {
    const message = `Hello ${params.employerName},

My name is Shiko from Maids of Honour-Africa. ${params.serviceProviderName} has indicated you as their former employer. Please verify and provide a brief reference:

👉 ${params.verificationLink}

Thank you 🙏🏽`;

    return await this.sendTextMessage({
      to: params.employerPhone,
      text: message
    });
  }

  /**
   * Format phone number to international format
   * Kenyan numbers: 0722000000 → 254722000000
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any spaces, dashes, or special characters
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // If starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    }

    // If doesn't start with 254, add it
    if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }

    return cleaned;
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await this.client.post(`/${this.phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      });
    } catch (error: any) {
      console.error('WhatsApp mark read error:', error.response?.data || error.message);
      // Don't throw - this is not critical
    }
  }

  /**
   * Check if within 24-hour conversation window
   *
   * @param windowStartedAt - When the conversation window started
   * @returns true if within window, false if expired
   */
  isWithinConversationWindow(windowStartedAt: Date | null): boolean {
    if (!windowStartedAt) return false;

    const now = Date.now();
    const windowStart = windowStartedAt.getTime();
    const elapsed = now - windowStart;

    return elapsed < this.CONVERSATION_WINDOW_MS;
  }

  /**
   * Get remaining time in conversation window (in milliseconds)
   */
  getRemainingWindowTime(windowStartedAt: Date | null): number {
    if (!windowStartedAt) return 0;

    const now = Date.now();
    const windowStart = windowStartedAt.getTime();
    const elapsed = now - windowStart;
    const remaining = this.CONVERSATION_WINDOW_MS - elapsed;

    return Math.max(0, remaining);
  }

  /**
   * Check if we can send a message
   *
   * Rules:
   * - If no window started → Can send (will start new window)
   * - If within window → Can send
   * - If outside window → CANNOT send (must wait for user to message us)
   *
   * @param windowStartedAt - When conversation window started
   * @param lastUserMessageAt - When user last messaged us
   * @returns { canSend: boolean, reason?: string }
   */
  canSendMessage(params: {
    windowStartedAt: Date | null;
    lastUserMessageAt: Date | null;
  }): { canSend: boolean; reason?: string } {
    const { windowStartedAt, lastUserMessageAt } = params;

    // No window started yet → Can send (will open new window)
    if (!windowStartedAt) {
      return { canSend: true };
    }

    // Within 24-hour window → Can send
    if (this.isWithinConversationWindow(windowStartedAt)) {
      const remainingMs = this.getRemainingWindowTime(windowStartedAt);
      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
      const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

      return {
        canSend: true,
        reason: `Within conversation window (${remainingHours}h ${remainingMinutes}m remaining)`
      };
    }

    // Window expired → Check if user messaged us (which opens new FREE window)
    if (lastUserMessageAt && lastUserMessageAt > windowStartedAt) {
      // User messaged after window expired → New window opened (FREE)
      return {
        canSend: true,
        reason: 'User-initiated conversation window (FREE)'
      };
    }

    // Window expired and user hasn't messaged → CANNOT send
    return {
      canSend: false,
      reason: '24-hour window expired. Wait for employer to message first (opens FREE window)'
    };
  }
}

export const whatsappService = new WhatsAppService();
