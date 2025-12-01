import { describe, it, expect, beforeEach, vi } from "vitest";
import { ServiceProviderService } from "../../services/service-provider.service";

vi.mock("../../db", () => ({
  db: {
    query: {
      serviceProviders: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      users: {
        findFirst: vi.fn(),
      },
      spPayouts: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      placements: {
        findMany: vi.fn(),
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
        where: vi.fn(),
      })),
    })),
    selectDistinct: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn(),
            })),
          })),
        })),
      })),
    })),
  },
}));

describe("ServiceProviderService", () => {
  let service: ServiceProviderService;

  beforeEach(() => {
    service = new ServiceProviderService();
    vi.clearAllMocks();
  });

  describe("searchServiceProviders", () => {
    it("should search SPs with filters", async () => {
      const mockSPs = [
        {
          id: "sp-1",
          serviceCategory: "childcare",
          county: "Nairobi",
          averageRating: 4.5,
          user: { id: "user-1" },
        },
      ];

      const { db } = await import("../../db");
      
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockSPs),
      };
      
      vi.mocked(db.selectDistinct).mockReturnValue(mockQuery as any);

      const result = await service.searchSps({
        category: "childcare",
        county: "Nairobi",
        available: true,
        page: 1,
        limit: 10,
      });

      expect(result).toHaveLength(1);
      expect(result[0].serviceCategory).toBe("childcare");
    });
  });

  describe("requestPayout", () => {
    it("should create payout request for SP", async () => {
      const mockSP = { id: "sp-123", userId: "user-123", user: { phoneNumber: "254712345678" } };
      const input = {
        amount: 5000,
        network: "mpesa" as const,
        phoneNumber: "254712345678",
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.serviceProviders.findFirst).mockResolvedValue(mockSP as any);

      // Mock balance check: 1st call (earnings) = 10000, 2nd call (payouts) = 0
      const mockWhere = vi.fn()
        .mockResolvedValueOnce([{ total: 10000 }]) // Earnings
        .mockResolvedValueOnce([{ total: 0 }]);    // Payouts
      
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: mockWhere,
        })),
      }));
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: "payout-123",
              serviceProviderId: mockSP.id,
              amount: input.amount,
              status: "requested",
            },
          ]),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      const result = await service.requestPayout("user-123", input);

      expect(result.amount).toBe(5000);
      expect(result.status).toBe("requested");
    });

    it("should throw error if insufficient balance", async () => {
      const mockSP = { id: "sp-123", userId: "user-123" };

      const { db } = await import("../../db");
      vi.mocked(db.query.serviceProviders.findFirst).mockResolvedValue(mockSP as any);

      // Mock balance check: 1st call (earnings) = 1000, 2nd call (payouts) = 0
      const mockWhere = vi.fn()
        .mockResolvedValueOnce([{ total: 1000 }])
        .mockResolvedValueOnce([{ total: 0 }]);

      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: mockWhere,
        })),
      }));
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      await expect(
        service.requestPayout("user-123", { amount: 5000 } as any)
      ).rejects.toThrow("Insufficient balance");
    });
  });

  describe("getDashboard", () => {
    it("should return SP dashboard data", async () => {
      const mockSP = {
        id: "sp-123",
        userId: "user-123",
        averageRating: 4.5,
        totalRatings: 10,
        totalPlacements: 5,
        successfulPlacements: 4,
        vettingStatus: "approved",
        availableForPlacement: true,
      };

      const mockPlacements = [
        { id: "p1", status: "active" },
        { id: "p2", status: "completed" },
      ];

      const { db } = await import("../../db");
      vi.mocked(db.query.serviceProviders.findFirst).mockResolvedValue(mockSP as any);
      vi.mocked(db.query.placements.findMany).mockResolvedValue(mockPlacements as any);

      // Mock balance check: 1st call (earnings) = 25000, 2nd call (payouts) = 20000
      // Balance = 5000
      const mockWhere = vi.fn()
        .mockResolvedValueOnce([{ total: 25000 }])
        .mockResolvedValueOnce([{ total: 20000 }]);

      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: mockWhere,
        })),
      }));
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const result = await service.getDashboard("user-123");

      expect(result.profile).toEqual(mockSP);
      expect(result.balance).toBe("5000.00");
    });
  });
});
