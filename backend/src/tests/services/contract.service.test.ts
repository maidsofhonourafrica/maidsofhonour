import { describe, it, expect, beforeEach, vi } from "vitest";
import { ContractService } from "../../services/contract.service";

vi.mock("../../db", () => ({
  db: {
    query: {
      placements: {
        findFirst: vi.fn(),
      },
      contractTemplates: {
        findFirst: vi.fn(),
      },
      contracts: {
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

describe("ContractService", () => {
  let service: ContractService;

  beforeEach(() => {
    service = new ContractService();
    vi.clearAllMocks();
  });

  describe("generateContract", () => {
    it("should generate contract from template", async () => {
      const userId = "client-123";
      const input = {
        placementId: "placement-123",
        templateId: "template-123",
      };

      const mockPlacement = {
        id: "placement-123",
        client: { userId, firstName: "John", lastName: "Doe" },
        serviceProvider: { firstName: "Jane", lastName: "Smith" },
        placementType: "live_in",
        startDate: new Date("2025-01-01"),
      };

      const mockTemplate = {
        id: "template-123",
        name: "Standard Contract",
        templateHtml: "<p>Contract for {{clientName}} and {{spName}}</p>",
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.placements.findFirst).mockResolvedValue(mockPlacement as any);
      vi.mocked(db.query.contractTemplates.findFirst).mockResolvedValue(
        mockTemplate as any
      );

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: "contract-123",
              placementId: input.placementId,
              contractHtml: "<p>Contract for John Doe and Jane Smith</p>",
            },
          ]),
        })),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      const result = await service.generateContract(userId, input);

      expect(result.placementId).toBe("placement-123");
      expect(result.contractHtml).toContain("John Doe");
    });

    it("should throw error if placement not found", async () => {
      const { db } = await import("../../db");
      vi.mocked(db.query.placements.findFirst).mockResolvedValue(undefined);

      await expect(
        service.generateContract("user-123", {} as any)
      ).rejects.toThrow("Placement not found");
    });
  });

  describe("signContract", () => {
    it("should allow client to sign contract", async () => {
      const mockContract = {
        id: "contract-123",
        placement: {
          client: { userId: "client-123" },
        },
        client: { userId: "client-123" },
        clientSigned: false,
        spSigned: false,
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.contracts.findFirst).mockResolvedValue(mockContract as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              {
                ...mockContract,
                clientSigned: true,
                clientSignedAt: new Date(),
              },
            ]),
          })),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const result = await service.signContract("contract-123", "client-123", { signature: "John Doe" });

      expect(result.clientSigned).toBe(true);
    });

    it("should mark contract as fully executed when both sign", async () => {
      const mockContract = {
        id: "contract-123",
        placement: {
          client: { userId: "client-123" },
          serviceProvider: { userId: "sp-123" },
        },
        client: { userId: "client-123" },
        serviceProvider: { userId: "sp-123" },
        clientSigned: true,
        spSigned: false,
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.contracts.findFirst).mockResolvedValue(mockContract as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              {
                ...mockContract,
                spSigned: true,
                fullyExecuted: true,
                status: "active",
              },
            ]),
          })),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const result = await service.signContract("contract-123", "sp-123", { signature: "Jane Smith" });

      expect(result.status).toBe("active");
    });
  });
});
