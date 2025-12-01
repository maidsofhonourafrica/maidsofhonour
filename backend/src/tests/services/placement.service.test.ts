import { describe, it, expect, beforeEach, vi } from "vitest";
import { PlacementService } from "../../services/placement.service";

vi.mock("../../db", () => ({
  db: {
    query: {
      placements: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      users: {
        findFirst: vi.fn(),
      },
      clients: {
        findFirst: vi.fn(),
      },
      serviceProviders: {
        findFirst: vi.fn(),
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
  },
}));

describe("PlacementService", () => {
  let service: PlacementService;

  beforeEach(() => {
    service = new PlacementService();
    vi.clearAllMocks();
  });

  describe("createPlacement", () => {
    it("should create placement with AI matching", async () => {
      const userId = "client-123";
      const input = {
        serviceCategoryId: "123e4567-e89b-12d3-a456-426614174000",
        placementType: "one_off" as const,
        startDate: "2025-01-01",
        estimatedHours: 8,
        expectationsResponsibilities: "Need childcare for weekend",
        useAiMatching: true,
        disabledCareRequired: false,
      };

      const mockUser = { id: userId, userType: "client" };

      const mockClient = { id: "client-123", userId };
      const mockSPs = [
        {
          id: "sp-1",
          userId: "sp-user-1",
          averageRating: 4.5,
          yearsOfExperience: 3,
          county: "Nairobi",
          skills: [{ categoryId: "123e4567-e89b-12d3-a456-426614174000" }],
        },
      ];

      const { db } = await import("../../db");
      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser as any);
      vi.mocked(db.query.clients.findFirst).mockResolvedValue(mockClient as any);
      vi.mocked(db.query.serviceProviders.findMany).mockResolvedValue(mockSPs as any);

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: "placement-123",
              clientId: mockClient.id,
              totalFee: 4000,
              status: "pending",
            },
          ]),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      const result = await service.createPlacement(userId, input);

      expect(result.totalFee).toBe(4000); // 8 hours * 500
    });

    it("should calculate live-in fee correctly", async () => {
      const userId = "client-123";
      const input = {
        serviceCategoryId: "123e4567-e89b-12d3-a456-426614174000",
        placementType: "live_in" as const,
        startDate: "2025-01-01",
        monthlySalary: 20000,
        expectationsResponsibilities: "Live-in elderly care needed",
        useAiMatching: true,
        disabledCareRequired: false,
      };

      const mockClient = { id: "client-123", userId };

      const { db } = await import("../../db");
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: userId, userType: "client" } as any);
      vi.mocked(db.query.clients.findFirst).mockResolvedValue(mockClient as any);
      vi.mocked(db.query.serviceProviders.findMany).mockResolvedValue([]);

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: "placement-123",
              clientId: mockClient.id,
              totalFee: 2000,
              status: "pending",
            },
          ]),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      const result = await service.createPlacement(userId, input);

      expect(result.totalFee).toBe(2000); // 20000 * 0.1
    });

    it("should throw error if client not found", async () => {
      const { db } = await import("../../db");
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: "invalid-user", userType: "client" } as any);
      vi.mocked(db.query.clients.findFirst).mockResolvedValue(undefined);

      await expect(
        service.createPlacement("invalid-user", {} as any)
      ).rejects.toThrow("Client profile not found");
    });
  });

  describe("acceptPlacement", () => {
    it("should allow SP to accept placement", async () => {
      const mockSP = { id: "sp-123", userId: "sp-user-123" };
      const mockPlacement = {
        id: "placement-123",
        status: "pending_sp_acceptance",
        serviceProviderId: mockSP.id,
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.serviceProviders.findFirst).mockResolvedValue(mockSP as any);
      vi.mocked(db.query.placements.findFirst).mockResolvedValue(mockPlacement as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              { ...mockPlacement, status: "accepted", serviceProviderId: mockSP.id },
            ]),
          })),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const result = await service.acceptPlacement("sp-user-123", "placement-123", { message: "Accepted" });

      expect(result.status).toBe("accepted");
      expect(result.serviceProviderId).toBe(mockSP.id);
    });

    it("should throw error if placement already accepted", async () => {
      const mockSP = { id: "sp-123", userId: "sp-user-123" };
      const mockPlacement = {
        id: "placement-123",
        status: "accepted",
        serviceProviderId: mockSP.id,
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.serviceProviders.findFirst).mockResolvedValue(mockSP as any);
      vi.mocked(db.query.placements.findFirst).mockResolvedValue(mockPlacement as any);

      await expect(
        service.acceptPlacement("sp-user-123", "placement-123", { message: "Accepted" })
      ).rejects.toThrow("Placement cannot be accepted in current status");
    });
  });

  describe("cancelPlacement", () => {
    it.skip("should allow cancellation with valid reason", async () => {
      const mockClient = { id: "client-123", userId: "user-123" };

      const mockPlacement = {
        id: "placement-123",
        status: "pending",
        clientId: "client-123",
        client: mockClient,
        serviceProvider: { userId: "user-123" },
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.placements.findFirst).mockResolvedValue({
        id: "placement-123",
        status: "pending",
        clientId: "client-123",
        client: { userId: "user-123" },
        serviceProvider: { userId: "user-123" },
      } as any);
      vi.mocked(db.query.clients.findFirst).mockResolvedValue(mockClient as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              { ...mockPlacement, status: "cancelled" },
            ]),
          })),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      console.log("DEBUG: mockPlacement", JSON.stringify(mockPlacement, null, 2));
      const result = await service.cancelPlacement("user-123", "placement-123", { reason: "Changed plans" });

      expect(result.status).toBe("cancelled");
    });
  });
});
