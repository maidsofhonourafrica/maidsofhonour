import { z } from 'zod/v4';

/**
 * Send Message Schema
 */
export const sendMessageSchema = z.object({
  recipientId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  attachmentUrl: z.string().url().optional(),
});

/**
 * Mark as Read Schema
 */
export const markAsReadSchema = z.object({
  conversationId: z.string().uuid(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;
