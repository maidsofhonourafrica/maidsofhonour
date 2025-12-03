import { db } from "../db";
import { ratings, serviceProviders, clients, placements } from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { CreateRatingInput } from "../validation/rating.schemas";

/**
 * Rating Service
 * Handles SP ratings and reviews
 */
export class RatingService {
  /**
   * Create rating for SP
   */
  async createRating(userId: string, input: CreateRatingInput) {
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

    // Verify placement is completed
    if (placement.status !== "completed") {
      throw new Error("Placement must be completed before rating");
    }

    // Determine rater type based on placement
    const raterType = placement.clientId === client.id ? "client" : "service_provider";

    // Check if already rated
    const existing = await db.query.ratings.findFirst({
      where: and(
        eq(ratings.placementId, input.placementId),
        eq(ratings.raterType, raterType)
      ),
    });

    if (existing) {
      throw new Error("You have already rated this placement");
    }

    // Create rating
    const [rating] = await db
      .insert(ratings)
      .values({
        placementId: input.placementId,
        raterType,
        rating: input.rating,
        reviewText: input.review || "",
        punctualityRating: input.categories?.punctuality,
        qualityRating: input.categories?.skillLevel,
        communicationRating: input.categories?.communication,
        professionalismRating: input.categories?.professionalism,
      })
      .returning();

    // Update SP average rating
    await this.updateSpAverageRating(placement.serviceProviderId!);

    return rating;
  }

  /**
   * Get SP ratings
   */
  async getSpRatings(spId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    // Get all placements for this SP, then join with ratings
    const ratingsWithPlacements = await db
      .select()
      .from(ratings)
      .innerJoin(placements, eq(ratings.placementId, placements.id))
      .where(eq(placements.serviceProviderId, spId))
      .orderBy(desc(ratings.createdAt))
      .limit(limit)
      .offset(offset);

    return ratingsWithPlacements.map(r => r.ratings);
  }

  /**
   * Get my ratings (as client)
   */
  async getMyRatings(userId: string) {
    const client = await db.query.clients.findFirst({
      where: eq(clients.userId, userId),
    });

    if (!client) return [];

    // Get all placements for this client, then join with ratings
    const ratingsWithPlacements = await db
      .select()
      .from(ratings)
      .innerJoin(placements, eq(ratings.placementId, placements.id))
      .where(and(
        eq(placements.clientId, client.id),
        eq(ratings.raterType, "client")
      ))
      .orderBy(desc(ratings.createdAt));

    return ratingsWithPlacements.map(r => ({ ...r.ratings, placement: r.placements }));
  }

  /**
   * Update SP average rating
   */
  private async updateSpAverageRating(spId: string) {
    // Join ratings with placements to filter by SP
    const result = await db
      .select({
        avgRating: sql<number>`AVG(${ratings.rating})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(ratings)
      .innerJoin(placements, eq(ratings.placementId, placements.id))
      .where(eq(placements.serviceProviderId, spId));

    const { avgRating, count } = result[0];

    await db
      .update(serviceProviders)
      .set({
        averageRating: avgRating?.toString(),
        totalRatings: Number(count),
        updatedAt: new Date(),
      })
      .where(eq(serviceProviders.id, spId));
  }
}
