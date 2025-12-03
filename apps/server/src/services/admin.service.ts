import { db } from "../db";
import {
  users,
  serviceProviders,
  clients,
  placements,
  payoutRequests,
  transactions,
  escrowTransactions,
  adminAuditLogs,
} from "../db/schema";
import { eq, desc, sql, and, gte, lte, or, like } from "drizzle-orm";
import type {
  UpdateUserStatusInput,
  UpdateUserInput,
  ApprovePayoutInput,
  UpdateIssueInput,
  AnalyticsQueryInput,
} from "../validation/admin.schemas";

/**
 * Admin Service
 * Handles all administrative functions
 */
export class AdminService {
  // ==================== USER MANAGEMENT ====================

  /**
   * List all users (paginated, filtered)
   */
  async listUsers(
    page: number = 1,
    limit: number = 20,
    filters?: {
      userType?: string;
      status?: string;
      search?: string;
    }
  ) {
    const offset = (page - 1) * limit;

    let query = db.select().from(users).limit(limit).offset(offset);

    // Apply filters
    const conditions = [];
    if (filters?.userType) {
      conditions.push(eq(users.userType, filters.userType as any));
    }
    if (filters?.status) {
      conditions.push(eq(users.status, filters.status as any));
    }
    if (filters?.search) {
      conditions.push(
        or(
          like(users.email, `%${filters.search}%`),
          like(users.phoneNumber, `%${filters.search}%`)
        )!
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)!) as any;
    }

    const results = await query.orderBy(desc(users.createdAt));

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    return {
      users: results,
      total: Number(countResult[0].count),
      page,
      limit,
    };
  }

  /**
   * Get user details
   */
  async getUserDetails(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get related data
    let profileData = null;
    if (user.userType === "service_provider") {
      profileData = await db.query.serviceProviders.findFirst({
        where: eq(serviceProviders.userId, userId),
      });
    } else if (user.userType === "client") {
      profileData = await db.query.clients.findFirst({
        where: eq(clients.userId, userId),
      });
    }

    return { user, profile: profileData };
  }

  /**
   * Update user status (suspend/activate/ban)
   */
  async updateUserStatus(userId: string, input: UpdateUserStatusInput, adminId: string) {
    const [updated] = await db
      .update(users)
      .set({
        status: input.status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    // Log action
    await this.logAdminAction(adminId, "user_status_update", {
      userId,
      newStatus: input.status,
      reason: input.reason,
    });

    return updated;
  }

  /**
   * Update user details
   */
  async updateUser(userId: string, input: UpdateUserInput, adminId: string) {
    const [updated] = await db
      .update(users)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    await this.logAdminAction(adminId, "user_update", { userId, updates: input });

    return updated;
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string, adminId: string) {
    await db.delete(users).where(eq(users.id, userId));

    await this.logAdminAction(adminId, "user_delete", { userId });

    return { success: true };
  }

  // ==================== SERVICE PROVIDER MANAGEMENT ====================

  /**
   * List all service providers
   */
  async listServiceProviders(page: number = 1, limit: number = 20, filters?: any) {
    const offset = (page - 1) * limit;

    const results = await db.query.serviceProviders.findMany({
      limit,
      offset,
      orderBy: [desc(serviceProviders.createdAt)],
      with: {
        user: true,
      },
    });

    return {
      serviceProviders: results,
      page,
      limit,
    };
  }

  /**
   * Update SP vetting status manually
   */
  async updateSpVettingStatus(spId: string, status: string, adminId: string) {
    const [updated] = await db
      .update(serviceProviders)
      .set({
        vettingStatus: status as any,
        updatedAt: new Date(),
      })
      .where(eq(serviceProviders.id, spId))
      .returning();

    await this.logAdminAction(adminId, "sp_vetting_update", { spId, status });

    return updated;
  }

  // ==================== PLACEMENT MANAGEMENT ====================

  /**
   * List all placements
   */
  async listPlacements(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    return db.query.placements.findMany({
      limit,
      offset,
      orderBy: [desc(placements.createdAt)],
      with: {
        client: { with: { user: true } },
        serviceProvider: { with: { user: true } },
      },
    });
  }

  /**
   * Update placement status
   */
  async updatePlacementStatus(placementId: string, status: string, adminId: string) {
    const [updated] = await db
      .update(placements)
      .set({
        status: status as any,
        updatedAt: new Date(),
      })
      .where(eq(placements.id, placementId))
      .returning();

    await this.logAdminAction(adminId, "placement_status_update", {
      placementId,
      status,
    });

    return updated;
  }

  /**
   * Cancel placement (admin override)
   */
  async cancelPlacement(placementId: string, reason: string, adminId: string) {
    const [updated] = await db
      .update(placements)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(placements.id, placementId))
      .returning();

    await this.logAdminAction(adminId, "placement_cancel", {
      placementId,
      reason,
    });

    return updated;
  }

  // ==================== PAYMENT & PAYOUT MANAGEMENT ====================

  /**
   * List all payout requests
   */
  async listPayoutRequests(page: number = 1, limit: number = 20, status?: string) {
    const offset = (page - 1) * limit;

    let query = db.query.payoutRequests.findMany({
      limit,
      offset,
      orderBy: [desc(payoutRequests.createdAt)],
      with: {
        serviceProvider: { with: { user: true } },
      },
    });

    if (status) {
      query = db.query.payoutRequests.findMany({
        where: eq(payoutRequests.status, status as any),
        limit,
        offset,
        orderBy: [desc(payoutRequests.createdAt)],
        with: {
          serviceProvider: { with: { user: true } },
        },
      });
    }

    return query;
  }

  /**
   * Approve/reject payout request
   */
  async approvePayout(payoutId: string, input: ApprovePayoutInput, adminId: string) {
    const [updated] = await db
      .update(payoutRequests)
      .set({
        status: input.approved ? "approved" : "rejected",
        processedBy: adminId,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payoutRequests.id, payoutId))
      .returning();

    await this.logAdminAction(adminId, "payout_decision", {
      payoutId,
      approved: input.approved,
      notes: input.notes,
    });

    return updated;
  }

  /**
   * View platform revenue
   */
  async getPlatformRevenue(startDate?: Date, endDate?: Date) {
    const conditions = [];
    if (startDate) {
      conditions.push(gte(transactions.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(transactions.createdAt, endDate));
    }

    const result = await db
      .select({
        totalRevenue: sql<number>`SUM(CAST(${transactions.amount} AS NUMERIC))`,
        totalTransactions: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(and(...conditions));

    return result[0] || { totalRevenue: 0, totalTransactions: 0 };
  }

  // ==================== ANALYTICS & REPORTS ====================

  /**
   * Platform dashboard (KPIs)
   */
  async getDashboard() {
    // Get user counts
    const userCounts = await db
      .select({
        userType: users.userType,
        count: sql<number>`COUNT(*)`,
      })
      .from(users)
      .groupBy(users.userType);

    // Get placement counts
    const placementCounts = await db
      .select({
        status: placements.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(placements)
      .groupBy(placements.status);

    // Get revenue (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueData = await this.getPlatformRevenue(thirtyDaysAgo, new Date());

    return {
      users: userCounts,
      placements: placementCounts,
      revenue: revenueData,
      timestamp: new Date(),
    };
  }

  /**
   * User growth metrics
   */
  async getUserGrowth(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const growth = await db
      .select({
        date: sql<string>`DATE(${users.createdAt})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(users)
      .where(gte(users.createdAt, startDate))
      .groupBy(sql`DATE(${users.createdAt})`);

    return growth;
  }

  // ==================== AUDIT LOGGING ====================

  /**
   * Log admin action
   */
  private async logAdminAction(adminId: string, action: string, details: any) {
    await db.insert(adminAuditLogs).values({
      adminId,
      action,
      changes: details,
      ipAddress: "127.0.0.1", // TODO: Get actual IP
    });
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(page: number = 1, limit: number = 50) {
    const offset = (page - 1) * limit;

    return db.query.adminAuditLogs.findMany({
      limit,
      offset,
      orderBy: [desc(adminAuditLogs.createdAt)],
      with: {
        admin: true,
      },
    });
  }
}
