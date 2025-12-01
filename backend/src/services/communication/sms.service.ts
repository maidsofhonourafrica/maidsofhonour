/**
 * SMS Service - Placeholder for Africa's Talking or Twilio integration
 *
 * Will be used for:
 * - Phone verification codes
 * - Critical notifications (payment received, escrow released)
 * - Employer verification links (backup to WhatsApp)
 * - Reminders (training deadline, placement upcoming)
 */

interface SendSMSInput {
  to: string; // Phone number in international format (254722000000)
  message: string;
}

interface SendVerificationCodeInput {
  phoneNumber: string;
  code: string;
}

export const smsService = {
  /**
   * Send SMS message
   * TODO: Integrate with Africa's Talking or Twilio
   */
  async sendSMS(input: SendSMSInput): Promise<{ success: boolean; messageId?: string }> {
    console.log('[SMS] Sending SMS:', {
      to: input.to,
      message: input.message,
    });

    // TODO: Implement actual SMS sending
    // Example for Africa's Talking:
    // const response = await africastalking.SMS.send({
    //   to: [input.to],
    //   message: input.message,
    // });

    // For now, just log
    return {
      success: true,
      messageId: `sms_${Date.now()}`,
    };
  },

  /**
   * Send phone verification code
   */
  async sendVerificationCode(input: SendVerificationCodeInput): Promise<{ success: boolean }> {
    const message = `Your Maids of Honour verification code is: ${input.code}. Valid for 5 minutes.`;

    return this.sendSMS({
      to: input.phoneNumber,
      message,
    });
  },

  /**
   * Send payment notification
   */
  async sendPaymentNotification(phoneNumber: string, amount: number): Promise<{ success: boolean }> {
    const message = `Payment of KES ${amount} received successfully. Thank you for using Maids of Honour.`;

    return this.sendSMS({
      to: phoneNumber,
      message,
    });
  },

  /**
   * Send employer verification link
   */
  async sendVerificationLink(phoneNumber: string, link: string): Promise<{ success: boolean }> {
    const message = `Maids of Honour: Please verify employment reference: ${link}`;

    return this.sendSMS({
      to: phoneNumber,
      message,
    });
  },

  /**
   * Format phone number to international format
   */
  formatPhoneNumber(phone: string): string {
    // Remove spaces, dashes, parentheses
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // If starts with 0, replace with 254 (Kenya)
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    }

    // If doesn't start with +, add it
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    return cleaned;
  },
};
