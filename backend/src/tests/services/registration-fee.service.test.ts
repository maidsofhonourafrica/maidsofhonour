import { describe, it, expect, beforeEach, vi } from "vitest";
import { RegistrationFeeService } from "../../services/registration-fee.service";

// Mock database
vi.mock("../../db", () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
  },
}));

// Mock SasaPay service
const { mockRequestPayment, mockQueryTransactionStatus } = vi.hoisted(() => ({
  mockRequestPayment: vi.fn(),
  mockQueryTransactionStatus: vi.fn(),
}));

vi.mock("../../services/sasapay", () => ({
  SasaPayService: class {
    requestPayment = mockRequestPayment;
    queryTransactionStatus = mockQueryTransactionStatus;
  },
}));

describe("RegistrationFeeService", () => {
  let service: RegistrationFeeService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RegistrationFeeService();
  });

  describe("initiateSPRegistrationFeePayment", () => {
    it("should initiate SP registration fee payment", async () => {
      const userId = "user-123";
      const phoneNumber = "254712345678";

      const mockUser = {
        id: userId,
        phoneNumber,
        registrationFeePaid: false,
        userType: "service_provider",
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser as any);

      mockRequestPayment.mockResolvedValue({
        status: true,
        detail: "Success",
        PaymentGateway: "SasaPay",
        MerchantRequestID: "req-123",
        CheckoutRequestID: "checkout-123",
        TransactionReference: "ref-123",
        ResponseCode: "0",
        ResponseDescription: "Success",
        CustomerMessage: "Success",
      } as any);

      const result = await service.paySpRegistrationFee(userId, { phoneNumber, network: "mpesa" });

      expect(result).toEqual({
        checkoutRequestId: "checkout-123",
        merchantRequestId: "req-123",
        amount: 500,
        message: "STK push sent. Please complete payment on your phone.",
      });
      expect(mockRequestPayment).toHaveBeenCalledWith({
        amount: "500",
        phoneNumber,
        networkCode: "63902",
        accountReference: expect.stringContaining("SP-REG-"),
        transactionDesc: "Service Provider Registration Fee",
        callbackUrl: expect.any(String),
      });
    });

    it("should throw error if user not found", async () => {
      const { db } = await import("../../db");
      vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

      await expect(
        service.paySpRegistrationFee("invalid-user", { phoneNumber: "254712345678", network: "mpesa" })
      ).rejects.toThrow("User not found");
    });

    it("should throw error if registration fee already paid", async () => {
      const mockUser = {
        id: "user-123",
        phoneNumber: "254712345678",
        registrationFeePaid: true,
        userType: "service_provider",
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser as any);

      await expect(
        service.paySpRegistrationFee("user-123", { phoneNumber: "254712345678", network: "mpesa" })
      ).rejects.toThrow("Registration fee already paid");
    });
  });

  describe("getRegistrationFeeStatus", () => {
    it("should return registration fee payment status", async () => {
      const mockUser = {
        id: "user-123",
        registrationFeePaid: true,
      };

      const { db } = await import("../../db");
      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser as any);

      const result = await service.getRegistrationFeeStatus("user-123");

      expect(result).toEqual({
        paid: true,
        amount: 200, // Default client fee
        paidAt: undefined,
        transactionId: undefined,
      });
    });

    it("should throw error if user not found", async () => {
      const { db } = await import("../../db");
      vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

      await expect(
        service.getRegistrationFeeStatus("invalid-user")
      ).rejects.toThrow("User not found");
    });
  });
});
