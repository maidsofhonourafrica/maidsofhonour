import { db } from "../db";
import { conversations as aiConversations, messages as aiChatMessages } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { AIChatMessageInput } from "../validation/ai.schemas";

/**
 * AI Agent Service
 * Handles AI-powered chat assistant
 */
export class AIAgentService {
  /**
   * Send message to AI agent
   */
  async sendMessage(userId: string, input: AIChatMessageInput) {
    let conversationId = input.conversationId;

    // Create conversation if not exists
    if (!conversationId) {
      const threadId = `thread_${userId}_${Date.now()}`;
      const [conversation] = await db
        .insert(aiConversations)
        .values({
          userId,
          threadId,
          messages: [],
          conversationType: input.context?.userType === "client"
            ? "client_search"
            : "general_support",
          placementId: input.context?.placementId,
        })
        .returning();

      conversationId = conversation.id;
    }

      // Save user message
      const [userMessage] = await db
        .insert(aiChatMessages)
        .values({
          ...(input.context?.placementId && { placementId: input.context.placementId }),
          senderId: userId,
          recipientId: userId, // AI messages are self-addressed
          messageText: input.message,
        })
        .returning();

      // Generate AI response
      const aiResponse = this.generateSimpleResponse(input.message);

      // Save AI response message
      const [aiMessage] = await db
        .insert(aiChatMessages)
        .values({
          ...(input.context?.placementId && { placementId: input.context.placementId }),
          senderId: userId, // System/AI sender
          recipientId: userId,
          messageText: aiResponse,
        })
        .returning();

    return {
      conversationId,
      userMessage,
      aiMessage,
    };
  }

  /**
   * Get conversation history
   */
  async getConversation(conversationId: string, userId: string) {
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(aiConversations.id, conversationId),
        eq(aiConversations.userId, userId)
      ),
      with: {
        messages: {
          orderBy: [desc(aiChatMessages.createdAt)],
        },
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    return conversation;
  }

  /**
   * List my conversations
   */
  async listConversations(userId: string) {
    return db.query.conversations.findMany({
      where: eq(aiConversations.userId, userId),
      orderBy: [desc(aiConversations.lastMessageAt)],
    });
  }

  /**
   * End conversation
   */
  async endConversation(conversationId: string, userId: string) {
    const [conversation] = await db
      .update(aiConversations)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(and(
        eq(aiConversations.id, conversationId),
        eq(aiConversations.userId, userId)
      ))
      .returning();

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    return conversation;
  }

  /**
   * Simple response generator (placeholder for actual AI)
   */
  private generateSimpleResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("help") || lowerMessage.includes("find")) {
      return "I'm here to help you find the perfect service provider! Could you tell me what type of service you're looking for? For example: childcare, elderly care, housekeeping, etc.";
    }

    if (lowerMessage.includes("price") || lowerMessage.includes("cost")) {
      return "Our pricing varies based on the service type and duration. One-off services start at KES 500/hour, while live-in placements have custom pricing. Would you like me to help you find suitable service providers?";
    }

    if (lowerMessage.includes("thank")) {
      return "You're welcome! Is there anything else I can help you with?";
    }

    return "I understand. How can I assist you with finding a service provider or managing your placements today?";
  }
}
