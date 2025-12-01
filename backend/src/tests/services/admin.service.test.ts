import { describe, it, expect, beforeEach, vi } from "vitest";
import { AdminService } from "../../services/admin.service";

vi.mock("../../db", () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
      serviceProviders: {
        findMany: vi.fn(),
      },
      placements: {
        findMany: vi.fn(),
      },
      adminAuditLogs: {
        findMany: vi.fn(),
      },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        limit: vi.fn(() => ({
          offset: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(),
            })),
            orderBy: vi.fn(),
          })),
        })),
        where: vi.fn(),
        groupBy: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
  },
}));

describe("AdminService", () => {
  let service: AdminService;

  beforeEach(() => {
    service = new AdminService();
    vi.clearAllMocks();
  });

  describe("listUsers", () => {
    it("should list users with pagination", async () => {
      const mockUsers = [
        { id: "user-1", email: "user1@test.com", userType: "client" },
        { id: "user-2", email: "user2@test.com", userType: "service_provider" },
      ];

      const { db } = await import("../../db");
      const mockSelect = vi.fn()
        .mockReturnValueOnce({ // First call: list users
          from: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn(() => ({
                where: vi.fn(() => ({ // Add where just in case, though not used in first test
                  orderBy: vi.fn().mockResolvedValue(mockUsers),
                })),
                orderBy: vi.fn().mockResolvedValue(mockUsers),
              })),
            })),
          })),
        })
        .mockReturnValueOnce({ // Second call: count users
          from: vi.fn().mockResolvedValue([{ count: 2 }]),
        });
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const result = await service.listUsers(1, 20);

      expect(result.users).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("should filter users by userType", async () => {
      const mockUsers = [
        { id: "user-1", email: "sp@test.com", userType: "service_provider" },
      ];

      const { db } = await import("../../db");
      const mockSelect = vi.fn()
        .mockReturnValueOnce({ // First call: list users
          from: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn(() => ({
                where: vi.fn(() => ({
                  orderBy: vi.fn().mockResolvedValue(mockUsers),
                })),
              })),
            })),
          })),
        })
        .mockReturnValueOnce({ // Second call: count users
          from: vi.fn().mockResolvedValue([{ count: 1 }]),
        });
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const result = await service.listUsers(1, 20, { userType: "service_provider" });

      expect(result.users).toHaveLength(1);
      expect(result.users[0].userType).toBe("service_provider");
    });
  });

  describe("updateUserStatus", () => {
    it("should update user status and log action", async () => {
      const userId = "user-123";
      const adminId = "admin-123";
      const statusUpdate = {
        status: "suspended" as const,
        reason: "Violates terms",
      };

      const { db } = await import("../../db");
      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              {
                id: userId,
                status: "suspended",
              },
            ]),
          })),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const mockInsert = vi.fn(() => ({
        values: vi.fn().mockResolvedValue(undefined),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      const result = await service.updateUserStatus(userId, statusUpdate, adminId);

      expect(result).toEqual({
        id: userId,
        status: "suspended",
      });
      expect(db.insert).toHaveBeenCalled(); // Audit log
    });
  });

  describe("getDashboard", () => {
    it("should return platform dashboard KPIs", async () => {
      const mockUserCounts = [
        { userType: "client", count: 100 },
        { userType: "service_provider", count: 50 },
      ];

      const mockPlacementCounts = [
        { status: "active", count: 30 },
        { status: "completed", count: 70 },
      ];

      const { db } = await import("../../db");
      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          from: vi.fn(() => ({
            groupBy: vi.fn().mockResolvedValue(mockUserCounts),
          })),
        })
        .mockReturnValueOnce({
          from: vi.fn(() => ({
            groupBy: vi.fn().mockResolvedValue(mockPlacementCounts),
          })),
        })
        .mockReturnValueOnce({
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([
              { totalRevenue: 100000, totalTransactions: 150 },
            ]),
          })),
        });

      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const result = await service.getDashboard();

      expect(result.users).toEqual(mockUserCounts);
      expect(result.placements).toEqual(mockPlacementCounts);
      expect(result.revenue).toBeDefined();
    });
  });

  describe("deleteUser", () => {
    it("should delete user and log action", async () => {
      const userId = "user-123";
      const adminId = "admin-123";

      const { db } = await import("../../db");
      const mockDelete = vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      }));
      vi.mocked(db.delete).mockImplementation(mockDelete as any);

      const mockInsert = vi.fn(() => ({
        values: vi.fn().mockResolvedValue(undefined),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      const result = await service.deleteUser(userId, adminId);

      expect(result.success).toBe(true);
      expect(db.delete).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled(); // Audit log
    });
  });
});
