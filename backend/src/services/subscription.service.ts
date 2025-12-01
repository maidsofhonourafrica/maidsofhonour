import { db } from "../db";
import { subscriptions, subscriptionPayments, placements, clients } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { CreateSubscriptionInput } from "../validation/subscription.schemas";

/**
 * Subscription Service
 * Handles recurring monthly payments for live-in placements
 */
export class SubscriptionService {
  /**
   * Create subscription for live-in placement
   */
  async createSubscription(userId: string, input: CreateSubscriptionInput) {
    const client = await db.query.clients.findFirst({
      where: eq(clients.userId, userId),
    });

    if (!client) {
      throw new Error("Client profile not found");
    }

    // Verify placement exists and belongs to client
    const placement = await db.query.placements.findFirst({
      where: and(
        eq(placements.id, input.placementId),
        eq(placements.clientId, client.id)
      ),
    });

    if (!placement) {
      throw new Error("Placement not found");
    }

    if (placement.placementType !== "live_in") {
      throw new Error("Subscriptions are only for live-in placements");
    }

    // Create subscription
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        clientId: client.id,
        placementId: input.placementId,
        monthlyAmount: input.monthlyAmount.toString(),
        periodMonths: input.durationMonths,
        startDate: new Date().toISOString().split('T')[0],
        endDate: this.calculateEndDate(input.durationMonths).toISOString().split('T')[0],
        nextPaymentDue: this.calculateNextPaymentDate(input.paymentDay).toISOString().split('T')[0],
        status: "active",
      })
      .returning();

    return subscription;
  }

  /**
   * List active subscriptions
   */
  async listSubscriptions(userId: string) {
    const client = await db.query.clients.findFirst({
      where: eq(clients.userId, userId),
    });

    if (!client) return [];

    return db.query.subscriptions.findMany({
      where: eq(subscriptions.clientId, client.id),
      orderBy: [desc(subscriptions.createdAt)],
      with: {
        placement: {
          with: {
            serviceProvider: true,
          },
        },
      },
    });
  }

  /**
   * Get subscription details
   */
  async getSubscriptionDetails(subscriptionId: string, userId: string) {
    const client = await db.query.clients.findFirst({
      where: eq(clients.userId, userId),
    });

    if (!client) {
      throw new Error("Client profile not found");
    }

    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.clientId, client.id)
      ),
      with: {
        placement: {
          with: {
            serviceProvider: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Get payment history
    const payments = await db.query.subscriptionPayments.findMany({
      where: eq(subscriptionPayments.subscriptionId, subscriptionId),
      orderBy: [desc(subscriptionPayments.dueDate)],
    });

    return { ...subscription, payments };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, userId: string) {
    const client = await db.query.clients.findFirst({
      where: eq(clients.userId, userId),
    });

    if (!client) {
      throw new Error("Client profile not found");
    }

    const [updated] = await db
      .update(subscriptions)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.clientId, client.id)
      ))
      .returning();

    if (!updated) {
      throw new Error("Subscription not found");
    }

    return updated;
  }

  /**
   * Get upcoming payment
   */
  async getUpcomingPayment(subscriptionId: string, userId: string) {
    const subscription = await this.getSubscriptionDetails(subscriptionId, userId);

    return {
      amount: subscription.monthlyAmount,
      dueDate: subscription.nextPaymentDue,
    };
  }

  /**
   * Calculate next payment date
   */
  private calculateNextPaymentDate(paymentDay: number): Date {
    const now = new Date();
    const nextPayment = new Date(now.getFullYear(), now.getMonth(), paymentDay);

    // If payment day has passed this month, set to next month
    if (nextPayment < now) {
      nextPayment.setMonth(nextPayment.getMonth() + 1);
    }

    return nextPayment;
  }

  private calculateEndDate(durationMonths: number): Date {
    const start = new Date();
    start.setMonth(start.getMonth() + durationMonths);
    return start;
  }
}
