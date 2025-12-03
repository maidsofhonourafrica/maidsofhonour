import { db } from "../db";
import {
  serviceProviders,
  serviceProviderSkills,
  users,
  spPayouts,
  escrowTransactions,
  placements,
 ratings,
} from "../db/schema";
import { eq, and, gte, sql, desc, asc, or, inArray } from "drizzle-orm";
import type {
  CreateSpProfileInput,
  UpdateSpProfileInput,
  SearchSpsInput,
  RequestPayoutInput,
} from "../validation/service-provider.schemas";

/**
 * Service Provider Service
 * Handles SP profiles, search, dashboard, and payouts
 */
export class ServiceProviderService {
  /**
   * Create or update SP profile
   */
  async createOrUpdateProfile(userId: string, input: CreateSpProfileInput | UpdateSpProfileInput) {
    // 1. Get user and verify they're an SP
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.userType !== "service_provider") {
      throw new Error("Only service providers can create SP profiles");
    }

    // 2. Check if profile exists
    const existing = await db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.userId, userId),
    });

    const { skills, ...inputWithoutSkills } = input;
    const profileData: any = {
      ...inputWithoutSkills,
      latitude: input.latitude?.toString(),
      longitude: input.longitude?.toString(),
      updatedAt: new Date(),
    };
    
    // Handle dateOfBirth conversion
    if (input.dateOfBirth) {
      profileData.dateOfBirth = new Date(input.dateOfBirth).toISOString().split('T')[0];
    } else if (!existing) {
      // For new profiles, dateOfBirth is required - this should be validated at the route level
      // For now, throw error if missing
      throw new Error('Date of birth is required for new service provider profiles');
    }

    let spProfile;

    if (existing) {
      // Update existing profile
      [spProfile] = await db
        .update(serviceProviders)
        .set(profileData)
        .where(eq(serviceProviders.id, existing.id))
        .returning();
    } else {
      // Create new profile
      [spProfile] = await db
        .insert(serviceProviders)
        .values({
          userId,
          ...profileData,
        })
        .returning();
    }

    // 3. Update skills if provided
    if (input.skills && input.skills.length > 0) {
      // Delete existing skills
      await db
        .delete(serviceProviderSkills)
        .where(eq(serviceProviderSkills.serviceProviderId, spProfile.id));

      // Insert new skills
      await db.insert(serviceProviderSkills).values(
        input.skills.map((skill) => ({
          serviceProviderId: spProfile.id,
          categoryId: skill.categoryId,
          experienceYears: skill.experienceYears,
          proficiencyLevel: skill.proficiencyLevel,
        }))
      );
    }

    return spProfile;
  }

  /**
   * Get SP own profile (private view)
   */
  async getOwnProfile(userId: string) {
    const spProfile = await db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.userId, userId),
      with: {
        user: true,
        skills: {
          with: {
            serviceCategory: true,
          },
        },
      },
    });

    if (!spProfile) {
      throw new Error("Service provider profile not found");
    }

    return spProfile;
  }

  /**
   * Get public SP profile
   */
  async getPublicProfile(spId: string) {
    const spProfile = await db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.id, spId),
      with: {
        skills: {
          with: {
            serviceCategory: true,
          },
        },
      },
    });

    if (!spProfile) {
      throw new Error("Service provider not found");
    }

    // Get ratings (join with placements to filter by SP)
    const ratingsWithPlacements = await db
      .select()
      .from(ratings)
      .innerJoin(placements, eq(ratings.placementId, placements.id))
      .where(eq(placements.serviceProviderId, spId))
      .orderBy(desc(ratings.createdAt))
      .limit(10);

    const spRatings = ratingsWithPlacements.map(r => r.ratings);

    return {
      ...spProfile,
      ratings: spRatings,
    };
  }

  /**
   * Search service providers
   */
  async searchSps(input: SearchSpsInput) {
    const {
      category,
      county,
      minRating,
      maxDistance,
      userLat,
      userLng,
      workType,
      minExperience,
      available = true,
      page = 1,
      limit = 20,
    } = input;

    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions: any[] = [];

    if (available) {
      conditions.push(eq(serviceProviders.availableForPlacement, true));
      conditions.push(eq(serviceProviders.currentlyPlaced, false));
    }

    if (county) {
      conditions.push(eq(serviceProviders.county, county));
    }

    if (minRating) {
      conditions.push(gte(serviceProviders.averageRating, minRating.toString()));
    }

    if (workType) {
      conditions.push(
        or(
          eq(serviceProviders.preferredWorkType, workType),
          eq(serviceProviders.preferredWorkType, "both")
        )
      );
    }

    if (minExperience) {
      conditions.push(gte(serviceProviders.yearsOfExperience, minExperience));
    }

    // If category filter, join with skills
    let query;
    if (category) {
      query = db
        .selectDistinct({
          sp: serviceProviders,
        })
        .from(serviceProviders)
        .innerJoin(
          serviceProviderSkills,
          eq(serviceProviders.id, serviceProviderSkills.serviceProviderId)
        )
        .where(
          and(
            eq(serviceProviderSkills.categoryId, category),
            eq(serviceProviders.vettingStatus, "approved"),
            ...conditions
          )
        )
        .limit(limit)
        .offset(offset);
    } else {
      query = db
        .select()
        .from(serviceProviders)
        .where(and(eq(serviceProviders.vettingStatus, "approved"), ...conditions))
        .limit(limit)
        .offset(offset);
    }

    const results = await query;

    // If distance filter and user location provided, calculate distances
    if (maxDistance && userLat && userLng) {
      const filtered = results
        .map((item: any) => {
          const sp = item.sp || item;
          if (!sp.latitude || !sp.longitude) return null;

          const distance = this.calculateDistance(
            userLat,
            userLng,
            parseFloat(sp.latitude),
            parseFloat(sp.longitude)
          );

          return { ...(item.sp || item), distance };
        })
        .filter((sp) => sp && sp.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance);

      return filtered;
    }

    return results.map((item: any) => item.sp || item);
  }

  /**
   * Get SP dashboard data
   */
  async getDashboard(userId: string) {
    const spProfile = await db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.userId, userId),
    });

    if (!spProfile) {
      throw new Error("Service provider profile not found");
    }

    // Get active placements
    const activePlacements = await db.query.placements.findMany({
      where: and(
        eq(placements.serviceProviderId, spProfile.id),
        inArray(placements.status, ["in_progress", "accepted", "payment_received"])
      ),
    });

    // Calculate balance (from escrow releases minus payouts)
    const escrowReleases = await db
      .select({
        total: sql<number>`COALESCE(SUM(${escrowTransactions.spPayout}), 0)`,
      })
      .from(escrowTransactions)
      .where(
        and(
          eq(escrowTransactions.serviceProviderId, spProfile.id),
          eq(escrowTransactions.status, "released")
        )
      );

    const totalPayouts = await db
      .select({
        total: sql<number>`COALESCE(SUM(${spPayouts.netAmount}), 0)`,
      })
      .from(spPayouts)
      .where(
        and(
          eq(spPayouts.serviceProviderId, spProfile.id),
          inArray(spPayouts.status, ["paid", "processing"])
        )
      );

    const balance =
      parseFloat(escrowReleases[0]?.total?.toString() || "0") -
      parseFloat(totalPayouts[0]?.total?.toString() || "0");

    return {
      profile: spProfile,
      activePlacements: activePlacements.length,
      totalPlacements: spProfile.totalPlacements,
      successfulPlacements: spProfile.successfulPlacements,
      averageRating: spProfile.averageRating,
      totalRatings: spProfile.totalRatings,
      balance: balance.toFixed(2),
      vettingStatus: spProfile.vettingStatus,
      availableForPlacement: spProfile.availableForPlacement,
    };
  }

  /**
   * Get current balance
   */
  async getBalance(userId: string) {
    const spProfile = await db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.userId, userId),
    });

    if (!spProfile) {
      throw new Error("Service provider profile not found");
    }

    // Calculate balance
    const escrowReleases = await db
      .select({
        total: sql<number>`COALESCE(SUM(${escrowTransactions.spPayout}), 0)`,
      })
      .from(escrowTransactions)
      .where(
        and(
          eq(escrowTransactions.serviceProviderId, spProfile.id),
          eq(escrowTransactions.status, "released")
        )
      );

    const totalPayouts = await db
      .select({
        total: sql<number>`COALESCE(SUM(${spPayouts.netAmount}), 0)`,
      })
      .from(spPayouts)
      .where(
        and(
          eq(spPayouts.serviceProviderId, spProfile.id),
          inArray(spPayouts.status, ["paid", "processing"])
        )
      );

    const balance =
      parseFloat(escrowReleases[0]?.total?.toString() || "0") -
      parseFloat(totalPayouts[0]?.total?.toString() || "0");

    return {
      availableBalance: balance.toFixed(2),
      totalEarned: escrowReleases[0]?.total?.toString() || "0",
      totalWithdrawn: totalPayouts[0]?.total?.toString() || "0",
    };
  }

  /**
   * Request payout
   */
  async requestPayout(userId: string, input: RequestPayoutInput) {
    const MIN_PAYOUT = parseFloat(process.env.MIN_PAYOUT_AMOUNT || "1000");

    const spProfile = await db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.userId, userId),
    });

    if (!spProfile) {
      throw new Error("Service provider profile not found");
    }

    // Check balance
    const balanceData = await this.getBalance(userId);
    const availableBalance = parseFloat(balanceData.availableBalance);

    if (input.amount > availableBalance) {
      throw new Error(`Insufficient balance. Available: KES ${availableBalance}`);
    }

    if (input.amount < MIN_PAYOUT) {
      throw new Error(`Minimum payout amount is KES ${MIN_PAYOUT}`);
    }

    // Get user for phone number
    const spUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    // Create payout request
    const [payout] = await db
      .insert(spPayouts)
      .values({
        serviceProviderId: spProfile.id,
        amount: input.amount.toString(),
        netAmount: input.amount.toString(),
        paymentNumber: input.phoneNumber || spUser?.phoneNumber || '',
        paymentNetwork: input.network,
        status: "requested",
        requestedAt: new Date(),
      })
      .returning();

    return {
      id: payout.id,
      amount: payout.amount,
      status: payout.status,
      message: "Payout request submitted. Admin will process within 24 hours.",
    };
  }

  /**
   * List payout history
   */
  async listPayouts(userId: string, page: number = 1, limit: number = 20) {
    const spProfile = await db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.userId, userId),
    });

    if (!spProfile) {
      throw new Error("Service provider profile not found");
    }

    const offset = (page - 1) * limit;

    const payouts = await db.query.spPayouts.findMany({
      where: eq(spPayouts.serviceProviderId, spProfile.id),
      orderBy: [desc(spPayouts.createdAt)],
      limit,
      offset,
    });

    return payouts;
  }

  /**
   * Get payout details
   */
  async getPayoutDetails(userId: string, payoutId: string) {
    const spProfile = await db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.userId, userId),
    });

    if (!spProfile) {
      throw new Error("Service provider profile not found");
    }

    const payout = await db.query.spPayouts.findFirst({
      where: and(
        eq(spPayouts.id, payoutId),
        eq(spPayouts.serviceProviderId, spProfile.id)
      ),
    });

    if (!payout) {
      throw new Error("Payout not found");
    }

    return payout;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of Earth in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
