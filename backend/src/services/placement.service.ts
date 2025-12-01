import { db } from "../db";
import {
  placements,
  clients,
  serviceProviders,
  escrowTransactions,
  contracts,
  users,
} from "../db/schema";
import { eq, and, or, inArray, desc } from "drizzle-orm";
import type {
  CreatePlacementInput,
  AcceptPlacementInput,
  RejectPlacementInput,
  CancelPlacementInput,
} from "../validation/placement.schemas";

const PLATFORM_COMMISSION_PERCENT = 10; // 10% platform fee

/**
 * Placement Service
 * Handles placement creation, matching, lifecycle management
 */
export class PlacementService {
  /**
   * Create placement request
   */
  async createPlacement(userId: string, input: CreatePlacementInput) {
    // 1. Get client
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || user.userType !== "client") {
      throw new Error("Only clients can create placements");
    }

    const client = await db.query.clients.findFirst({
      where: eq(clients.userId, userId),
    });

    if (!client) {
      throw new Error("Client profile not found");
    }

    // 2. Calculate fees
    const totalFee = input.placementType === "one_off" 
      ? this.calculateOneOffFee(input.estimatedHours || 8)
      : this.calculateLiveInFee(input.monthlySalary || 15000);

    const platformCommission = (totalFee * PLATFORM_COMMISSION_PERCENT) / 100;
    const spPayout = totalFee - platformCommission;

    // 3. Find SP if AI matching or use preferred SP
    let serviceProviderId = input.preferredSpId;

    if (input.useAiMatching && !serviceProviderId) {
      // Simple matching algorithm (can be enhanced with AI later)
      serviceProviderId = (await this.findBestMatch(input)) || undefined;
    }

    // 4. Create placement
    const [placement] = await db
      .insert(placements)
      .values({
        clientId: client.id,
        serviceProviderId: serviceProviderId || undefined,
        serviceCategoryId: input.serviceCategoryId,
        placementType: input.placementType,
        durationMonths: input.durationMonths,
        startDate: new Date(input.startDate),
        endDate: input.durationMonths
          ? this.calculateEndDate(input.startDate, input.durationMonths)
          : null,
        monthlySalary: input.monthlySalary?.toString(),
        serviceDate: input.serviceDate ? new Date(input.serviceDate) : null,
        estimatedHours: input.estimatedHours?.toString(),
        expectationsResponsibilities: input.expectationsResponsibilities,
        tasksList: input.tasksList,
        kidsCount: input.kidsCount,
        disabledCareRequired: input.disabledCareRequired,
        offDays: input.offDays,
        totalFee: totalFee.toString(),
        platformCommission: platformCommission.toString(),
        spPayout: spPayout.toString(),
        status: serviceProviderId ? "pending_sp_acceptance" : "ai_search",
      } as any)
      .returning();

    return placement;
  }

  /**
   * List placements (client or SP view)
   */
  async listPlacements(userId: string, userType: string) {
    if (userType === "client") {
      const client = await db.query.clients.findFirst({
        where: eq(clients.userId, userId),
      });

      if (!client) return [];

      return db.query.placements.findMany({
        where: eq(placements.clientId, client.id),
        orderBy: [desc(placements.createdAt)],
        with: {
          serviceProvider: true,
          contract: true,
        },
      });
    } else if (userType === "service_provider") {
      const sp = await db.query.serviceProviders.findFirst({
        where: eq(serviceProviders.userId, userId),
      });

      if (!sp) return [];

      return db.query.placements.findMany({
        where: eq(placements.serviceProviderId, sp.id),
        orderBy: [desc(placements.createdAt)],
        with: {
          client: true,
          contract: true,
        },
      });
    }

    return [];
  }

  /**
   * Get active placements
   */
  async getActivePlacements(userId: string, userType: string) {
    const allPlacements = await this.listPlacements(userId, userType);
    return allPlacements.filter((p: any) =>
      ["in_progress", "accepted", "payment_received"].includes(p.status)
    );
  }

  /**
   * Get placement history
   */
  async getPlacementHistory(userId: string, userType: string) {
    const allPlacements = await this.listPlacements(userId, userType);
    return allPlacements.filter((p: any) =>
      ["completed", "cancelled"].includes(p.status)
    );
  }

  /**
   * Get placement details
   */
  async getPlacementDetails(placementId: string, userId: string) {
    const placement = await db.query.placements.findFirst({
      where: eq(placements.id, placementId),
      with: {
        client: { with: { user: true } },
        serviceProvider: { with: { user: true } },
        contract: true,
      },
    });

    if (!placement) {
      throw new Error("Placement not found");
    }

    // Verify user has access
    const hasAccess =
      placement.client?.userId === userId ||
      placement.serviceProvider?.userId === userId;

    if (!hasAccess) {
      throw new Error("Unauthorized to view this placement");
    }

    return placement;
  }

  /**
   * SP accepts placement
   */
  async acceptPlacement(
    placementId: string,
    userId: string,
    input: AcceptPlacementInput
  ) {
    const sp = await db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.userId, userId),
    });

    if (!sp) {
      throw new Error("Service provider profile not found");
    }

    const placement = await db.query.placements.findFirst({
      where: eq(placements.id, placementId),
    });

    if (!placement) {
      throw new Error("Placement not found");
    }

    if (placement.serviceProviderId !== sp.id) {
      throw new Error("This placement is not assigned to you");
    }

    if (placement.status !== "pending_sp_acceptance") {
      throw new Error("Placement cannot be accepted in current status");
    }

    // Update placement
    const [updated] = await db
      .update(placements)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(placements.id, placementId))
      .returning();

    return updated;
  }

  /**
   * SP rejects placement
   */
  async rejectPlacement(
    placementId: string,
    userId: string,
    input: RejectPlacementInput
  ) {
    const sp = await db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.userId, userId),
    });

    if (!sp) {
      throw new Error("Service provider profile not found");
    }

    const placement = await db.query.placements.findFirst({
      where: eq(placements.id, placementId),
    });

    if (!placement || placement.serviceProviderId !== sp.id) {
      throw new Error("Unauthorized");
    }

    // Set back to AI search to find another SP
    const [updated] = await db
      .update(placements)
      .set({
        status: "ai_search",
        serviceProviderId: null,
        updatedAt: new Date(),
      })
      .where(eq(placements.id, placementId))
      .returning();

    return updated;
  }

  /**
   * Mark placement as completed
   */
  async completePlacement(placementId: string, userId: string) {
    const client = await db.query.clients.findFirst({
      where: eq(clients.userId, userId),
    });

    if (!client) {
      throw new Error("Client profile not found");
    }

    const placement = await db.query.placements.findFirst({
      where: eq(placements.id, placementId),
    });

    if (!placement || placement.clientId !== client.id) {
      throw new Error("Unauthorized");
    }

    const [updated] = await db
      .update(placements)
      .set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(placements.id, placementId))
      .returning();

    // TODO: Trigger escrow release

    return updated;
  }

  /**
   * Cancel placement
   */
  async cancelPlacement(
    placementId: string,
    userId: string,
    input: CancelPlacementInput
  ) {
    const placement = await db.query.placements.findFirst({
      where: eq(placements.id, placementId),
      with: {
        client: true,
        serviceProvider: true,
      },
    });

    if (!placement) {
      throw new Error("Placement not found");
    }

    // Verify user can cancel
    const canCancel =
      placement.client?.userId === userId ||
      placement.serviceProvider?.userId === userId;

    if (!canCancel) {
      throw new Error("Unauthorized");
    }

    const [updated] = await db
      .update(placements)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(placements.id, placementId))
      .returning();

    // TODO: Trigger refund logic

    return updated;
  }

  /**
   * Simple AI matching algorithm (can be enhanced with LLM)
   */
  private async findBestMatch(input: CreatePlacementInput): Promise<string | null> {
    // Find SPs with matching category, available, and approved
    const matches = await db.query.serviceProviders.findMany({
      where: and(
        eq(serviceProviders.vettingStatus, "approved"),
        eq(serviceProviders.availableForPlacement, true),
        eq(serviceProviders.currentlyPlaced, false)
      ),
      with: {
        skills: true,
      },
      limit: 10,
    });

    // Filter by category
    const categoryMatches = matches.filter((sp) =>
      sp.skills.some((skill) => skill.categoryId === input.serviceCategoryId)
    );

    if (categoryMatches.length === 0) return null;

    // Simple scoring: highest rated, most experience
    const scored = categoryMatches.map((sp) => ({
      id: sp.id,
      score:
        (parseFloat(sp.averageRating?.toString() || "0") || 0) * 10 +
        (sp.yearsOfExperience || 0),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored[0]?.id || null;
  }

  /**
   * Calculate one-off fee based on hours
   */
  private calculateOneOffFee(hours: number): number {
    const HOURLY_RATE = 500; // KES 500 per hour
    return hours * HOURLY_RATE;
  }

  /**
   * Calculate live-in fee (first month + commission)
   */
  private calculateLiveInFee(monthlySalary: number): number {
    return monthlySalary; // Client pays first month
  }

  /**
   * Calculate end date from start date and duration
   */
  private calculateEndDate(startDate: string, durationMonths: number): Date {
    const start = new Date(startDate);
    start.setMonth(start.getMonth() + durationMonths);
    return start;
  }
}
