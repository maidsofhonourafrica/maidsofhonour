import { describe, it, expect, beforeEach, vi } from "vitest";
import { AIAgentService } from "../../services/ai-agent.service";

vi.mock("../../db", () => ({
  db: {
    query: {
      aiConversations: {
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

describe("AIAgentService", () => {
  let service: AIAgentService;

  beforeEach(() => {
    service = new AIAgentService();
    vi.clearAllMocks();
  });

  describe("sendMessage", () => {
    it("should create conversation and send AI response", async () => {
      const userId = "user-123";
      const input = {
        message: "I need help finding a nanny",
        context: {
          userType: "client" as const,
        },
      };

      const { db } = await import("../../db");
      const mockInsert = vi.fn()
        .mockReturnValueOnce({ // Create conversation
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              {
                id: "conv-123",
                userId,
                conversationType: "client_search",
              },
            ]),
          })),
        })
        .mockReturnValueOnce({ // User message
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              {
                id: "msg-1",
                conversationId: "conv-123",
                role: "user",
                messageText: input.message,
              },
            ]),
          })),
        })
        .mockReturnValueOnce({ // AI message
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              {
                id: "msg-2",
                conversationId: "conv-123",
                role: "assistant",
                messageText: expect.any(String),
              },
            ]),
          })),
        });

      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      const result = await service.sendMessage(userId, input);

      expect(result.conversationId).toBe("conv-123");
      expect(result.userMessage.messageText).toBe(input.message);
      expect((result.aiMessage as any).messageText).toBeDefined();
    });

    it("should use existing conversation if provided", async () => {
      const input = {
        message: "Follow-up question",
        conversationId: "existing-conv-123",
      };

      const { db } = await import("../../db");
      const mockInsert = vi.fn()
        .mockReturnValueOnce({ // User message
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              { id: "msg-1", role: "user", messageText: input.message },
            ]),
          })),
        })
        .mockReturnValueOnce({ // AI message
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              { id: "msg-2", role: "assistant", messageText: "AI response" },
            ]),
          })),
        });

      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      const result = await service.sendMessage("user-123", input);

      expect(result.conversationId).toBe("existing-conv-123");
    });
  });

  describe("endConversation", () => {
    it("should mark conversation as completed", async () => {
      const mockConversation = {
        id: "conv-123",
        userId: "user-123",
        status: "active",
      };

      const { db } = await import("../../db");
      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              {
                ...mockConversation,
                status: "completed",
              },
            ]),
          })),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const result = await service.endConversation("conv-123", "user-123");

      expect(result.status).toBe("completed");
    });
  });

  describe("Simple response generator", () => {
    it("should generate help response for help queries", () => {
      const response = (service as any).generateSimpleResponse("I need help");

      expect(response).toContain("help");
    });

    it("should generate pricing response for price queries", () => {
      const response = (service as any).generateSimpleResponse("How much does it cost?");

      expect(response).toMatch(/price|pricing|KES/);
    });

    it("should generate default response for generic queries", () => {
      const response = (service as any).generateSimpleResponse("Random question");

      expect(response).toBeTruthy();
      expect(typeof response).toBe("string");
    });
  });
});
