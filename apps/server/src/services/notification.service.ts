import { db } from "../db";
import { notifications } from "../db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Notification Service
 * Handles in-app notifications
 */
export class NotificationService {
  /**
   * Get notifications for user
   */
  async getNotifications(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    return db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)],
      limit,
      offset,
    });
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));

    return result.filter((n) => !n.read).length;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const [updated] = await db
      .update(notifications)
      .set({ read: true, readAt: new Date() })
      .where(eq(notifications.id, notificationId))
      .returning();

    if (!updated || updated.userId !== userId) {
      throw new Error("Notification not found");
    }

    return updated;
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(userId: string) {
    await db
      .update(notifications)
      .set({ read: true, readAt: new Date() })
      .where(eq(notifications.userId, userId));

    return { success: true };
  }

  /**
   * Create notification (internal use)
   */
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string
  ) {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        type: type as any,
        title,
        body: message,
      })
      .returning();

    return notification;
  }
}
