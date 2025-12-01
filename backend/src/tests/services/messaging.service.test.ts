import { describe, it, expect, beforeEach, vi } from "vitest";
import { MessagingService } from "../../services/messaging.service";

vi.mock("../../db", () => ({
  db: {
    query: {
      directConversations: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      directMessages: {
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

describe("MessagingService", () => {
  let service: MessagingService;

  beforeEach(() => {
    service = new MessagingService();
    vi.clearAllMocks();
  });

  describe("sendMessage", () => {
    it("should create conversation and send message if conversation doesn't exist", async () => {
      const userId = "user-123";
      const input = {
        recipientId: "recipient-123",
        content: "Hello, interested in your services!",
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.directConversations.findFirst).mockResolvedValue(undefined);

      // Mock conversation creation
      const mockInsert = vi.fn()
        .mockReturnValueOnce({ // First call - create conversation
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              { id: "conv-123", user1Id: userId, user2Id: input.recipientId },
            ]),
          })),
        })
        .mockReturnValueOnce({ // Second call - create message
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              {
                id: "msg-123",
                conversationId: "conv-123",
                senderId: userId,
                content: input.content,
              },
            ]),
          })),
        });

      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      const result = await service.sendMessage(userId, input);

      expect(result.content).toBe(input.content);
      expect(result.senderId).toBe(userId);
    });

    it("should use existing conversation if available", async () => {
      const userId = "user-123";
      const existingConversation = {
        id: "conv-123",
        user1Id: userId,
        user2Id: "recipient-123",
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.directConversations.findFirst).mockResolvedValue(
        existingConversation as any
      );

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([
            { id: "msg-123", conversationId: "conv-123", content: "Hello" },
          ]),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      await service.sendMessage(userId, {
        recipientId: "recipient-123",
        content: "Hello",
      });

      // Should only insert message, not create new conversation
      expect(db.insert).toHaveBeenCalledTimes(1);
    });
  });

  describe("markConversationAsRead", () => {
    it("should mark conversation as read for user", async () => {
      const mockConversation = {
        id: "conv-123",
        user1Id: "user-123",
        user2Id: "user-456",
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.directConversations.findFirst).mockResolvedValue(
        mockConversation as any
      );

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              { ...mockConversation, user1LastRead: new Date() },
            ]),
          })),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const result = await service.markConversationAsRead("user-123", "conv-123");

      expect(result.id).toBe("conv-123");
    });
  });
});
