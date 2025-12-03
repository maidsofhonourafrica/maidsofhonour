import { describe, it, expect, beforeEach, vi } from "vitest";
import { ClientService } from "../../services/client.service";

vi.mock("../../db", () => ({
  db: {
    query: {
      clients: {
        findFirst: vi.fn(),
      },
      users: {
        findFirst: vi.fn(),
      },
      placements: {
        findMany: vi.fn(),
      },
      subscriptions: {
        findMany: vi.fn(),
      },
      transactions: {
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

describe("ClientService", () => {
  let service: ClientService;

  beforeEach(() => {
    service = new ClientService();
    vi.clearAllMocks();
  });

  describe("createOrUpdateProfile", () => {
    it("should create new client profile", async () => {
      const userId = "user-123";
      const input = {
        firstName: "John",
        lastName: "Doe",
        county: "Nairobi",
        address: "123 Main St",
        latitude: 1.23,
        longitude: 36.7,
      };

      const mockUser = { id: userId, email: "john@test.com", userType: "client" };

      const { db } = await import("../../db");
      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser as any);
      vi.mocked(db.query.clients.findFirst).mockResolvedValue(undefined);

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: "client-123",
              userId,
              ...input,
            },
          ]),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      const result = await service.createOrUpdateProfile(userId, input);

      expect(result.userId).toBe(userId);
      expect(result.firstName).toBe("John");
    });

    it("should update existing client profile", async () => {
      const userId = "user-123";
      const existingClient = { id: "client-123", userId, firstName: "John" };

      const { db } = await import("../../db");
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: userId, userType: "client" } as any);
      vi.mocked(db.query.clients.findFirst).mockResolvedValue(existingClient as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              { ...existingClient, lastName: "Smith" },
            ]),
          })),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const result = await service.createOrUpdateProfile(userId, {
        lastName: "Smith",
        latitude: 1.23,
        longitude: 36.7,
      } as any);

      expect(result.lastName).toBe("Smith");
    });
  });

  describe("getDashboard", () => {
    it("should return client dashboard data", async () => {
      const mockClient = {
        id: "client-123",
        userId: "user-123",
        firstName: "John",
      };

      const mockPlacements = [
        { id: "p1", status: "active" },
        { id: "p2", status: "completed" },
      ];

      const mockSubscriptions = [
        { id: "sub-1", status: "active" },
      ];

      const { db } = await import("../../db");
      vi.mocked(db.query.clients.findFirst).mockResolvedValue(mockClient as any);
      vi.mocked(db.query.placements.findMany).mockResolvedValue(mockPlacements as any);
      vi.mocked(db.query.subscriptions.findMany).mockResolvedValue(
        mockSubscriptions as any
      );
      vi.mocked(db.query.transactions.findMany).mockResolvedValue([
        { id: "tx-1", status: "pending" },
      ] as any);

      const result = await service.getDashboard("user-123");

      expect(result.profile).toEqual(mockClient);
      expect(result.activePlacements).toHaveLength(2);
      expect(result.activeSubscriptions).toEqual(mockSubscriptions);
      expect(result.pendingPayments).toBe(1);
    });
  });
});
