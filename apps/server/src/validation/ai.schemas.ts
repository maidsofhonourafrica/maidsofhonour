import { z } from 'zod/v4';

/**
 * AI Chat Message Schema
 */
export const aiChatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional(),
  context: z.object({
    userType: z.enum(["client", "service_provider"]).optional(),
    placementId: z.string().uuid().optional(),
  }).optional(),
});

export type AIChatMessageInput = z.infer<typeof aiChatMessageSchema>;
