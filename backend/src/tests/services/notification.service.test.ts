import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotificationService } from "../../services/notification.service";

vi.mock("../../db", () => ({
  db: {
    query: {
      notifications: {
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
  },
}));

describe("NotificationService", () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
    vi.clearAllMocks();
  });

  describe("getNotifications", () => {
    it("should return user notifications", async () => {
      const mockNotifications = [
        {
          id: "notif-1",
          userId: "user-123",
          type: "placement_update",
          title: "Placement Accepted",
          message: "Your placement has been accepted",
          read: false,
        },
      ];

      const { db } = await import("../../db");
      vi.mocked(db.query.notifications.findMany).mockResolvedValue(
        mockNotifications as any
      );

      const result = await service.getNotifications("user-123", 1, 10);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("placement_update");
    });
  });

  describe("getUnreadCount", () => {
    it("should return count of unread notifications", async () => {
      const { db } = await import("../../db");
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([
            { read: false },
            { read: false },
            { read: false },
            { read: false },
            { read: false },
          ]),
        })),
      }));
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const result = await service.getUnreadCount("user-123");

      expect(result).toBe(5);
    });
  });

  describe("markAsRead", () => {
    it.skip("should mark notification as read", async () => {
      const { db } = await import("../../db");
      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              {
                id: "notif-123",
                userId: "user-123",
                read: true,
              },
            ]),
          })),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const result = await service.markAsRead("user-123", "notif-123");

      expect(result.read).toBe(true);
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all user notifications as read", async () => {
      const { db } = await import("../../db");
      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([]),
          })),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const result = await service.markAllAsRead("user-123");

      expect(result.success).toBe(true);
    });
  });

  describe("createNotification", () => {
    it("should create notification for user", async () => {
      const { db } = await import("../../db");
      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: "notif-123",
              userId: "user-123",
              type: "test",
              title: "Test Notification",
              message: "This is a test",
            },
          ]),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      const result = await service.createNotification(
        "user-123",
        "test",
        "Test Notification",
        "This is a test"
      );

      expect(result.userId).toBe("user-123");
      expect(result.title).toBe("Test Notification");
    });
  });
});
