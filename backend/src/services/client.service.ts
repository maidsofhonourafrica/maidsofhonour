import { db } from "../db";
import { clients, users, placements, subscriptions, transactions } from "../db/schema";
import { eq, and, inArray } from "drizzle-orm";
import type {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from "../validation/client.schemas";

/**
 * Client Service
 * Handles client profiles and dashboard
 */
export class ClientService {
  /**
   * Create or update client profile
   */
  async createOrUpdateProfile(
    userId: string,
    input: CreateClientProfileInput | UpdateClientProfileInput
  ) {
    // 1. Get user and verify they're a client
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.userType !== "client") {
      throw new Error("Only clients can create client profiles");
    }

    // 2. Check if profile exists
    const existing = await db.query.clients.findFirst({
      where: eq(clients.userId, userId),
    });

    const profileData = {
      ...input,
      latitude: input.latitude?.toString(),
      longitude: input.longitude?.toString(),
      updatedAt: new Date(),
    };

    let clientProfile;

    if (existing) {
      // Update existing profile
      [clientProfile] = await db
        .update(clients)
        .set(profileData)
        .where(eq(clients.id, existing.id))
        .returning();
    } else {
      // Create new profile
      [clientProfile] = await db
        .insert(clients)
        .values({
          userId,
          ...profileData,
          latitude: input.latitude?.toString(),
          longitude: input.longitude?.toString(),
        } as any)
        .returning();
    }

    return clientProfile;
  }

  /**
   * Get own client profile
   */
  async getOwnProfile(userId: string) {
    const clientProfile = await db.query.clients.findFirst({
      where: eq(clients.userId, userId),
      with: {
        user: true,
      },
    });

    if (!clientProfile) {
      throw new Error("Client profile not found");
    }

    return clientProfile;
  }

  /**
   * Get client dashboard
   */
  async getDashboard(userId: string) {
    const clientProfile = await db.query.clients.findFirst({
      where: eq(clients.userId, userId),
    });

    if (!clientProfile) {
      throw new Error("Client profile not found");
    }

    // Get active placements
    const activePlacements = await db.query.placements.findMany({
      where: and(
        eq(placements.clientId, clientProfile.id),
        inArray(placements.status, [
          "in_progress",
          "accepted",
          "payment_pending",
          "payment_received",
        ])
      ),
      with: {
        serviceProvider: true,
      },
    });

    // Get active subscriptions
    const activeSubscriptions = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.clientId, clientProfile.id),
        eq(subscriptions.status, "active")
      ),
      with: {
        placement: true,
      },
    });

    // Get pending payments
    const pendingPayments = await db.query.transactions.findMany({
      where: and(
        eq(transactions.userId, userId),
        eq(transactions.status, "pending")
      ),
    });

    return {
      profile: clientProfile,
      activePlacements,
      activeSubscriptions,
      pendingPayments: pendingPayments.length,
      totalPlacements: clientProfile.totalPlacements || 0,
    };
  }
}
