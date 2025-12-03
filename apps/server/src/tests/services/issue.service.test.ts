import { describe, it, expect, beforeEach, vi } from "vitest";
import { IssueService } from "../../services/issue.service";

vi.mock("../../db", () => ({
  db: {
    query: {
      placements: {
        findFirst: vi.fn(),
      },
      complaints: {
        findMany: vi.fn(),
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
  },
}));

describe("IssueService", () => {
  let service: IssueService;

  beforeEach(() => {
    service = new IssueService();
    vi.clearAllMocks();
  });

  describe("reportIssue", () => {
    it("should allow client to report issue", async () => {
      const userId = "user-123";
      const input = {
        placementId: "placement-123",
        issueType: "service_quality" as const,
        priority: "high" as const,
        description: "Service provider was late",
        evidenceUrls: ["https://example.com/photo.jpg"],
      };

      const mockClient = { id: "client-123", userId };
      const mockPlacement = {
        id: "placement-123",
        clientId: "client-123",
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.clients.findFirst).mockResolvedValue(mockClient as any);
      vi.mocked(db.query.serviceProviders.findFirst).mockResolvedValue(undefined);
      vi.mocked(db.query.placements.findFirst).mockResolvedValue(mockPlacement as any);

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: "issue-123",
              placementId: input.placementId,
              reportedBy: userId,
              reporterType: "client",
              complaintType: input.issueType,
              status: "open",
            },
          ]),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      const result = await service.reportIssue(userId, input) as any;

      expect(result.reporterType).toBe("client");
      expect(result.complaintType).toBe("service_quality");
      expect(result.status).toBe("open");
    });

    it("should allow SP to report issue", async () => {
      const userId = "sp-user-123";
      const mockSP = { id: "sp-123", userId };

      const { db } = await import("../../db");
      vi.mocked(db.query.clients.findFirst).mockResolvedValue(undefined);
      vi.mocked(db.query.serviceProviders.findFirst).mockResolvedValue(mockSP as any);
      vi.mocked(db.query.placements.findFirst).mockResolvedValue({ id: "p-123" } as any);

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: "issue-123",
              reporterType: "service_provider",
            },
          ]),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      const result = await service.reportIssue(userId, {
        placementId: "p-123",
        issueType: "payment_dispute",
        priority: "medium",
        description: "Payment not received",
      } as any);

      expect(result.reporterType).toBe("service_provider");
    });
  });

  describe("getMyIssues", () => {
    it("should return user's reported issues", async () => {
      const mockIssues = [
        {
          id: "issue-1",
          reportedBy: "user-123",
          complaintType: "payment_dispute",
         status: "open",
        },
      ];

      const { db } = await import("../../db");
      vi.mocked(db.query.complaints.findMany).mockResolvedValue(mockIssues as any);

      const result = await service.getMyIssues("user-123");

      expect(result).toHaveLength(1);
      expect(result[0].complaintType).toBe("payment_dispute");
    });
  });
});
