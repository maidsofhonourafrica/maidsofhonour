import { describe, it, expect, beforeEach, vi } from "vitest";
import { RatingService } from "../../services/rating.service";

vi.mock("../../db", () => ({
  db: {
    query: {
      ratings: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      placements: {
        findFirst: vi.fn(),
      },
      clients: {
        findFirst: vi.fn(),
      },
      serviceProviders: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(),
          orderBy: vi.fn(),
          limit: vi.fn(),
          offset: vi.fn(),
        })),
      })),
    })),
  },
}));

describe("RatingService", () => {
  let service: RatingService;

  beforeEach(() => {
    service = new RatingService();
    vi.clearAllMocks();
  });

  describe("createRating", () => {
    it("should create rating and update SP average", async () => {
      const userId = "client-user-123";
      const input = {
        placementId: "placement-123",
        serviceProviderId: "sp-123",
        rating: 5,
        categories: {
          punctuality: 5,
          professionalism: 5,
          quality: 5,
          communication: 5,
        },
        review: "Excellent service!",
      };

      const mockClient = {
        id: "client-123",
        userId: userId,
      };

      const mockPlacement = {
        id: "placement-123",
        clientId: "client-123",
        serviceProviderId: "sp-123",
        status: "completed",
      };

      const { db } = await import("../../db");

      // Mock client lookup
      vi.mocked(db.query.clients.findFirst).mockResolvedValue(mockClient as any);

      // Mock placement lookup
      vi.mocked(db.query.placements.findFirst).mockResolvedValue(mockPlacement as any);

      // Mock existing rating check (none exists)
      vi.mocked(db.query.ratings.findFirst).mockResolvedValue(undefined);

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: "rating-123",
              placementId: input.placementId,
              raterType: "client",
              rating: input.rating,
              reviewText: input.review,
            },
          ]),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      // Mock average calculation (select with innerJoin)
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([
              { avgRating: 4.8, count: 10 },
            ]),
          })),
        })),
      }));
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([{}]),
          })),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const result = await service.createRating(userId, input);

      expect(result.rating).toBe(5);
      expect(result.reviewText).toBe("Excellent service!");
    });

    it("should throw error if placement not completed", async () => {
      const userId = "client-user-123";

      const mockClient = {
        id: "client-123",
        userId: userId,
      };

      const mockPlacement = {
        id: "placement-123",
        clientId: "client-123",
        status: "in_progress",
      };

      const { db } = await import("../../db");

      // Mock client lookup
      vi.mocked(db.query.clients.findFirst).mockResolvedValue(mockClient as any);

      // Mock placement lookup
      vi.mocked(db.query.placements.findFirst).mockResolvedValue(mockPlacement as any);

      await expect(
        service.createRating(userId, { placementId: "placement-123" } as any)
      ).rejects.toThrow("Placement must be completed before rating");
    });
  });

  describe("getSpRatings", () => {
    it("should return all ratings for SP", async () => {
      const mockRatingsWithPlacements = [
        {
          ratings: {
            id: "rating-1",
            rating: 5,
            reviewText: "Great!",
            placementId: "placement-1",
            raterType: "client",
          },
          placements: {
            id: "placement-1",
            serviceProviderId: "sp-123",
          },
        },
        {
          ratings: {
            id: "rating-2",
            rating: 4,
            reviewText: "Good",
            placementId: "placement-2",
            raterType: "client",
          },
          placements: {
            id: "placement-2",
            serviceProviderId: "sp-123",
          },
        },
      ];

      const { db } = await import("../../db");

      // Mock the select().from().innerJoin().where().orderBy().limit().offset() chain
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn(() => ({
                  offset: vi.fn().mockResolvedValue(mockRatingsWithPlacements),
                })),
              })),
            })),
          })),
        })),
      }));
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const result = await service.getSpRatings("sp-123");

      expect(result).toHaveLength(2);
      expect(result[0].rating).toBe(5);
    });
  });
});
