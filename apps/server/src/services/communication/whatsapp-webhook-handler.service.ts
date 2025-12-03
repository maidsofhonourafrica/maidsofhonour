/**
 * WhatsApp Webhook Message Handler
 *
 * Processes incoming WhatsApp messages and integrates with:
 * - Database (store messages, update verification status)
 * - AI Agent (LangGraph for adaptive questioning)
 * - WhatsApp Service (send responses)
 */

import { whatsappService } from './whatsapp.service';

interface IncomingWhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
  button?: {
    text: string;
    payload: string;
  };
}

interface MessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{
    code: number;
    title: string;
    message: string;
  }>;
}

export class WhatsAppWebhookHandler {
  /**
   * Handle incoming message from employer
   *
   * Flow:
   * 1. Find verification by phone number
   * 2. Update conversation window (employer messaged us = FREE window)
   * 3. Store message in database
   * 4. Forward to AI agent for processing
   * 5. AI generates next question or completes assessment
   * 6. Send AI response back via WhatsApp
   * 7. Mark message as read
   */
  async handleIncomingMessage(message: IncomingWhatsAppMessage): Promise<void> {
    try {
      console.log('Processing incoming WhatsApp message', {
        from: message.from,
        messageId: message.id,
        type: message.type
      });

      // Extract message text
      const messageText = message.text?.body || message.button?.text || '';

      if (!messageText) {
        console.warn('No text in message, ignoring', { messageId: message.id });
        return;
      }

      // TODO: Step 1 - Find verification by phone number
      // const verification = await db.query.formerEmployerVerifications.findFirst({
      //   where: eq(formerEmployerVerifications.employerPhone, message.from)
      // });

      // if (!verification) {
      //   console.warn('No verification found for phone number', { from: message.from });
      //   return;
      // }

      // TODO: Step 2 - Update conversation window (employer messaged = FREE window)
      // await db.update(formerEmployerVerifications)
      //   .set({
      //     lastEmployerMessageAt: new Date(parseInt(message.timestamp) * 1000),
      //     conversationWindowActive: true,
      //     conversationWindowStartedAt: verification.conversationWindowStartedAt || new Date()
      //   })
      //   .where(eq(formerEmployerVerifications.id, verification.id));

      // TODO: Step 3 - Store message in whatsapp_messages table
      // await db.insert(whatsappMessages).values({
      //   messageId: message.id,
      //   wamid: message.id,
      //   fromNumber: message.from,
      //   toNumber: process.env.WHATSAPP_PHONE_NUMBER_ID!,
      //   messageType: 'text',
      //   messageBody: messageText,
      //   verificationId: verification.id,
      //   status: 'read',
      //   readAt: new Date()
      // });

      // TODO: Step 4 - Forward to AI agent
      // const aiResponse = await aiAgentService.processEmployerMessage({
      //   verificationId: verification.id,
      //   serviceProviderId: verification.serviceProviderId,
      //   employerMessage: messageText,
      //   conversationId: verification.conversationId
      // });

      // TODO: Step 5 - AI returns next question or assessment complete
      // if (aiResponse.completed) {
      //   // Assessment complete - generate assessment record
      //   await this.generateAssessment(verification.id, aiResponse.assessment);
      // } else {
      //   // Send next question
      //   await this.sendAIQuestion(message.from, aiResponse.nextQuestion, verification.id);
      // }

      // TODO: Step 6 - Mark message as read
      await whatsappService.markMessageAsRead(message.id);

      console.log('Message processed successfully', { messageId: message.id });

    } catch (error: any) {
      console.error('Error handling incoming WhatsApp message', {
        error: error.message,
        stack: error.stack,
        messageId: message.id
      });
      throw error;
    }
  }

  /**
   * Send AI-generated question to employer
   */
  private async sendAIQuestion(
    employerPhone: string,
    question: string,
    verificationId: string
  ): Promise<void> {
    try {
      // Check if we can send (within 24-hour window)
      // TODO: Get verification data
      // const verification = await db.query.formerEmployerVerifications.findFirst({
      //   where: eq(formerEmployerVerifications.id, verificationId)
      // });

      // const canSend = whatsappService.canSendMessage({
      //   windowStartedAt: verification.conversationWindowStartedAt,
      //   lastUserMessageAt: verification.lastEmployerMessageAt
      // });

      // if (!canSend.canSend) {
      //   console.warn('Cannot send message - outside conversation window', {
      //     verificationId,
      //     reason: canSend.reason
      //   });
      //   return;
      // }

      // Send message
      const result = await whatsappService.sendTextMessage({
        to: employerPhone,
        text: question
      });

      console.log('AI question sent to employer', {
        verificationId,
        messageId: result.messageId
      });

      // TODO: Store sent message
      // await db.insert(whatsappMessages).values({
      //   messageId: result.messageId,
      //   wamid: result.wamid,
      //   fromNumber: process.env.WHATSAPP_PHONE_NUMBER_ID!,
      //   toNumber: employerPhone,
      //   messageType: 'text',
      //   messageBody: question,
      //   verificationId,
      //   status: 'sent',
      //   sentAt: new Date()
      // });

    } catch (error: any) {
      console.error('Error sending AI question', {
        error: error.message,
        verificationId
      });
      throw error;
    }
  }

  /**
   * Generate verification assessment from AI analysis
   */
  private async generateAssessment(
    verificationId: string,
    aiAssessment: any
  ): Promise<void> {
    try {
      console.log('Generating verification assessment', { verificationId });

      // TODO: Create verification_assessments record
      // await db.insert(verificationAssessments).values({
      //   verificationId,
      //   serviceProviderId: aiAssessment.serviceProviderId,
      //   employmentConfirmed: aiAssessment.employmentConfirmed,
      //   employmentPeriodMatches: aiAssessment.employmentPeriodMatches,
      //   roleMatchesClaim: aiAssessment.roleMatchesClaim,
      //   salaryMatchesClaim: aiAssessment.salaryMatchesClaim,
      //   conductRating: aiAssessment.conductRating,
      //   skillRating: aiAssessment.skillRating,
      //   attitudeRating: aiAssessment.attitudeRating,
      //   overallRating: aiAssessment.overallRating,
      //   wouldRehire: aiAssessment.wouldRehire,
      //   wouldRecommend: aiAssessment.wouldRecommend,
      //   recommendationStrength: aiAssessment.recommendationStrength,
      //   sentimentScore: aiAssessment.sentimentScore,
      //   confidenceScore: aiAssessment.confidenceScore,
      //   grammarQuality: aiAssessment.grammarQuality,
      //   responseDetailLevel: aiAssessment.responseDetailLevel,
      //   specificExamplesProvided: aiAssessment.specificExamplesProvided,
      //   inconsistencies: aiAssessment.inconsistencies,
      //   redFlags: aiAssessment.redFlags,
      //   greenFlags: aiAssessment.greenFlags,
      //   flaggedForReview: aiAssessment.redFlags.length > 0,
      //   flaggedReason: aiAssessment.redFlags.length > 0
      //     ? `${aiAssessment.redFlags.length} red flags detected`
      //     : null,
      //   flagSeverity: this.calculateFlagSeverity(aiAssessment.redFlags)
      // });

      // TODO: Update verification status
      // await db.update(formerEmployerVerifications)
      //   .set({
      //     status: 'responded',
      //     responded: true,
      //     respondedAt: new Date()
      //   })
      //   .where(eq(formerEmployerVerifications.id, verificationId));

      console.log('Assessment generated', { verificationId });

    } catch (error: any) {
      console.error('Error generating assessment', {
        error: error.message,
        verificationId
      });
      throw error;
    }
  }

  /**
   * Calculate flag severity based on red flags
   */
  private calculateFlagSeverity(
    redFlags: Array<{ type: string; severity: string }>
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (redFlags.length === 0) return 'low';

    const hasCritical = redFlags.some((f) => f.severity === 'critical');
    const hasHigh = redFlags.some((f) => f.severity === 'high');
    const hasMedium = redFlags.some((f) => f.severity === 'medium');

    if (hasCritical) return 'critical';
    if (hasHigh) return 'high';
    if (hasMedium) return 'medium';
    return 'low';
  }

  /**
   * Handle message status update (sent, delivered, read, failed)
   */
  async handleStatusUpdate(status: MessageStatus): Promise<void> {
    try {
      console.log('Processing WhatsApp status update', {
        messageId: status.id,
        status: status.status
      });

      // TODO: Update whatsapp_messages table
      // await db.update(whatsappMessages)
      //   .set({
      //     status: status.status,
      //     deliveredAt: status.status === 'delivered'
      //       ? new Date(parseInt(status.timestamp) * 1000)
      //       : undefined,
      //     readAt: status.status === 'read'
      //       ? new Date(parseInt(status.timestamp) * 1000)
      //       : undefined,
      //     errorCode: status.errors?.[0]?.code?.toString(),
      //     errorMessage: status.errors?.[0]?.message
      //   })
      //   .where(eq(whatsappMessages.messageId, status.id));

      // If message failed, update verification status
      if (status.status === 'failed') {
        console.error('WhatsApp message failed', {
          messageId: status.id,
          errors: status.errors
        });

        // TODO: Update verification status to 'failed'
        // TODO: Notify admins
      }

    } catch (error: any) {
      console.error('Error handling status update', {
        error: error.message,
        messageId: status.id
      });
      // Don't throw - status updates are not critical
    }
  }
}

export const whatsappWebhookHandler = new WhatsAppWebhookHandler();
