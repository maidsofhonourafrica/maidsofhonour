import { describe, it, expect, beforeEach, vi } from "vitest";
import { SubscriptionService } from "../../services/subscription.service";

vi.mock("../../db", () => ({
  db: {
    query: {
      subscriptions: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      placements: {
        findFirst: vi.fn(),
      },
      clients: {
        findFirst: vi.fn(),
      },
      subscriptionPayments: {
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

describe("SubscriptionService", () => {
  let service: SubscriptionService;

  beforeEach(() => {
    service = new SubscriptionService();
    vi.clearAllMocks();
  });

  describe("createSubscription", () => {
    it("should create monthly subscription for live-in placement", async () => {
      const userId = "user-123";
      const input = {
        placementId: "placement-123",
        monthlyAmount: 20000,
        durationMonths: 6,
        paymentDay: 1,
        paymentMethod: "mpesa" as const,
        paymentDetails: { phoneNumber: "254712345678" },
      };

      const mockClient = { id: "client-123", userId };
      const mockPlacement = {
        id: "placement-123",
        placementType: "live_in",
        clientId: "client-123",
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.clients.findFirst).mockResolvedValue(mockClient as any);
      vi.mocked(db.query.placements.findFirst).mockResolvedValue(mockPlacement as any);

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: "sub-123",
              placementId: input.placementId,
              monthlyAmount: input.monthlyAmount.toString(),
              status: "active",
            },
          ]),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      const result = await service.createSubscription(userId, input);

      expect(result.monthlyAmount).toBe("20000");
      expect(result.status).toBe("active");
    });

    it("should throw error for non-live-in placement", async () => {
      const userId = "user-123";
      const mockClient = { id: "client-123", userId };
      const mockPlacement = {
        id: "placement-123",
        placementType: "one_off",
        clientId: "client-123",
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.clients.findFirst).mockResolvedValue(mockClient as any);
      vi.mocked(db.query.placements.findFirst).mockResolvedValue(mockPlacement as any);

      await expect(
        service.createSubscription(userId, { placementId: "placement-123" } as any)
      ).rejects.toThrow("Subscriptions are only for live-in placements");
    });
  });

  describe("cancelSubscription", () => {
    it("should cancel active subscription", async () => {
      const userId = "user-123";
      const mockClient = { id: "client-123", userId };
      const mockSubscription = { 
        id: "sub-123", 
        status: "active",
        clientId: "client-123"
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.clients.findFirst).mockResolvedValue(mockClient as any);
      vi.mocked(db.query.subscriptions.findFirst).mockResolvedValue(mockSubscription as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              { ...mockSubscription, status: "cancelled" },
            ]),
          })),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const result = await service.cancelSubscription(userId, "sub-123");

      expect(result.status).toBe("cancelled");
    });
  });

  describe("getUpcomingPayment", () => {
    it("should return upcoming payment details", async () => {
      const userId = "user-123";
      const mockClient = { id: "client-123", userId };
      const mockSubscription = {
        id: "sub-123",
        monthlyAmount: "20000",
        nextPaymentDue: "2025-01-01",
        clientId: "client-123",
        placement: { serviceProvider: {} }
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.clients.findFirst).mockResolvedValue(mockClient as any);
      vi.mocked(db.query.subscriptions.findFirst).mockResolvedValue(mockSubscription as any);
      vi.mocked(db.query.subscriptionPayments.findMany).mockResolvedValue([]);

      const result = await service.getUpcomingPayment("sub-123", userId);

      expect(result.amount).toBe("20000");
      expect(result.dueDate).toBeDefined();
    });
  });
});
