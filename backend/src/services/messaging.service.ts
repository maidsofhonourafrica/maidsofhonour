import { db } from "../db";
import { directConversations, directMessages } from "../db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import type { SendMessageInput } from "../validation/message.schemas";

/**
 * Messaging Service
 * Handles real-time chat between clients and service providers
 */
export class MessagingService {
  /**
   * Send a message to another user
   */
  async sendMessage(userId: string, input: SendMessageInput) {
    // Get or create conversation
    const conversation = await this.getOrCreateConversation(userId, input.recipientId);

    // Create the message
    const [message] = await db
      .insert(directMessages)
      .values({
        conversationId: conversation.id,
        senderId: userId,
        content: input.content,
        attachmentUrl: input.attachmentUrl,
      })
      .returning();

    // Update conversation's last message timestamp
    await db
      .update(directConversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(directConversations.id, conversation.id));

    return message;
  }

  /**
   * Get all conversations for a user
   */
  async getConversations(userId: string) {
    return db.query.directConversations.findMany({
      where: or(
        eq(directConversations.user1Id, userId),
        eq(directConversations.user2Id, userId)
      ),
      orderBy: [desc(directConversations.lastMessageAt)],
    });
  }

  /**
   * Get messages in a specific conversation
   */
  async getMessages(conversationId: string, userId: string) {
    // Verify user is part of this conversation
    const conversation = await db.query.directConversations.findFirst({
      where: and(
        eq(directConversations.id, conversationId),
        or(
          eq(directConversations.user1Id, userId),
          eq(directConversations.user2Id, userId)
        )
      ),
    });

    if (!conversation) {
      throw new Error("Conversation not found or unauthorized");
    }

    // Fetch messages
    return db.query.directMessages.findMany({
      where: eq(directMessages.conversationId, conversationId),
      orderBy: [desc(directMessages.createdAt)],
    });
  }

  /**
   * Mark conversation as read for current user
   */
  async markConversationAsRead(userId: string, conversationId: string) {
    const conversation = await db.query.directConversations.findFirst({
      where: and(
        eq(directConversations.id, conversationId),
        or(
          eq(directConversations.user1Id, userId),
          eq(directConversations.user2Id, userId)
        )
      ),
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Determine which user's timestamp to update
    const updateField = conversation.user1Id === userId ? "user1LastRead" : "user2LastRead";

    const [updated] = await db
      .update(directConversations)
      .set({ [updateField]: new Date() })
      .where(eq(directConversations.id, conversationId))
      .returning();

    return updated;
  }

  /**
   * Get or create a conversation between two users
   */
  private async getOrCreateConversation(userId: string, recipientId: string) {
    // Check if conversation already exists (in either direction)
    const existing = await db.query.directConversations.findFirst({
      where: or(
        and(
          eq(directConversations.user1Id, userId),
          eq(directConversations.user2Id, recipientId)
        ),
        and(
          eq(directConversations.user1Id, recipientId),
          eq(directConversations.user2Id, userId)
        )
      ),
    });

    if (existing) {
      return existing;
    }

    // Create new conversation
    const [conversation] = await db
      .insert(directConversations)
      .values({
        user1Id: userId,
        user2Id: recipientId,
      })
      .returning();

    return conversation;
  }
}
