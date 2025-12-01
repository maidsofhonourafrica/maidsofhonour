import { db } from "../db";
import { users, transactions } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { SasaPayService } from "./sasapay";
import type { PayRegistrationFeeInput } from "../validation/registration-fee.schemas";

const SP_REGISTRATION_FEE = parseFloat(process.env.SP_REGISTRATION_FEE || "500");
const CLIENT_REGISTRATION_FEE = parseFloat(process.env.CLIENT_REGISTRATION_FEE || "200");

export class RegistrationFeeService {
  private sasaPayService: SasaPayService;

  constructor() {
    this.sasaPayService = new SasaPayService();
  }

  /**
   * Initiate registration fee payment for Service Provider
   */
  async paySpRegistrationFee(userId: string, input: PayRegistrationFeeInput) {
    // 1. Check if user exists and is a service provider
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.userType !== "service_provider") {
      throw new Error("Only service providers can pay SP registration fee");
    }

    // 2. Check if already paid
    if (user.registrationFeePaid) {
      throw new Error("Registration fee already paid");
    }

    // 3. Initiate SasaPay payment
    const paymentResult = await this.sasaPayService.requestPayment({
      networkCode: '63902', // M-PESA code
      phoneNumber: input.phoneNumber,
      amount: SP_REGISTRATION_FEE.toString(),
      accountReference: `SP-REG-${user.id.substring(0, 8)}`,
      callbackUrl: `${process.env.API_URL}/api/v1/sasapay/callback`,
      transactionDesc: "Service Provider Registration Fee",
    });

    // 4. Create transaction record
    await db.insert(transactions).values({
      userId,
      checkoutRequestId: paymentResult.CheckoutRequestID,
      merchantRequestId: paymentResult.MerchantRequestID,
      amount: SP_REGISTRATION_FEE.toString(),
      phoneNumber: input.phoneNumber,
      networkCode: input.network,
      transactionType: "registration_fee",
      status: "pending",
    });

    return {
      checkoutRequestId: paymentResult.CheckoutRequestID,
      merchantRequestId: paymentResult.MerchantRequestID,
      amount: SP_REGISTRATION_FEE,
      message: "STK push sent. Please complete payment on your phone.",
    };
  }

  /**
   * Initiate registration fee payment for Client
   */
  async payClientRegistrationFee(userId: string, input: PayRegistrationFeeInput) {
    // 1. Check if user exists and is a client
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.userType !== "client") {
      throw new Error("Only clients can pay client registration fee");
    }

    // 2. Check if already paid
    if (user.registrationFeePaid) {
      throw new Error("Registration fee already paid");
    }

    // 3. Initiate SasaPay payment
    const paymentResult = await this.sasaPayService.requestPayment({
      networkCode: '63902', // M-PESA code
      phoneNumber: input.phoneNumber,
      amount: CLIENT_REGISTRATION_FEE.toString(),
      accountReference: `CL-REG-${user.id.substring(0, 8)}`,
      callbackUrl: `${process.env.API_URL}/api/v1/sasapay/callback`,
      transactionDesc: "Client Registration Fee",
    });

    // 4. Create transaction record
    await db.insert(transactions).values({
      userId,
      checkoutRequestId: paymentResult.CheckoutRequestID,
      merchantRequestId: paymentResult.MerchantRequestID,
      amount: CLIENT_REGISTRATION_FEE.toString(),
      phoneNumber: input.phoneNumber,
      networkCode: input.network,
      transactionType: "registration_fee",
      status: "pending",
    });

    return {
      checkoutRequestId: paymentResult.CheckoutRequestID,
      merchantRequestId: paymentResult.MerchantRequestID,
      amount: CLIENT_REGISTRATION_FEE,
      message: "STK push sent. Please complete payment on your phone.",
    };
  }

  /**
   * Check registration fee payment status
   */
  async getRegistrationFeeStatus(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error("User not found");
    }

    const amount =
      user.userType === "service_provider"
        ? SP_REGISTRATION_FEE
        : CLIENT_REGISTRATION_FEE;

    return {
      paid: user.registrationFeePaid || false,
      amount,
      paidAt: user.registrationCompletedAt,
      transactionId: user.registrationFeeTransactionId,
    };
  }

  /**
   * Mark registration fee as paid (called by payment callback)
   * This is called internally by the SasaPay callback handler
   */
  async markRegistrationFeePaid(userId: string, transactionId: string) {
    await db
      .update(users)
      .set({
        registrationFeePaid: true,
        registrationFeeTransactionId: transactionId,
        registrationCompletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { success: true };
  }
}
