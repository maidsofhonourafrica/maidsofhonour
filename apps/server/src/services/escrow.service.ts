import { db } from '../db';
import { 
  escrowTransactions, 
  escrowLedger, 
  disbursements, 
  users
} from '../db/schema';
import { eq } from 'drizzle-orm';
import { sasaPayService } from './sasapay';

export class EscrowService {
  /**
   * Create an escrow transaction (Hold funds)
   * Called when a client pays for a placement
   */
  async createEscrowTransaction(
    placementId: string,
    clientId: string,
    serviceProviderId: string,
    amount: string,
    paymentTransactionId: string
  ) {
    // Calculate platform commission (e.g., 10%)
    const totalAmount = parseFloat(amount);
    const commissionRate = 0.10;
    const platformCommission = totalAmount * commissionRate;
    const spPayout = totalAmount - platformCommission;

    return await db.transaction(async (tx) => {
      // 1. Create escrow record
      const [escrow] = await tx.insert(escrowTransactions).values({
        placementId,
        clientId,
        serviceProviderId,
        totalAmount: totalAmount.toString(),
        platformCommission: platformCommission.toString(),
        spPayout: spPayout.toString(),
        paymentTransactionId,
        paymentReceivedAt: new Date(),
        status: 'held',
        heldAt: new Date(),
      }).returning();

      // 2. Create ledger entry
      await tx.insert(escrowLedger).values({
        escrowTransactionId: escrow.id,
        eventType: 'held',
        amount: amount,
        balanceAfter: amount,
        reason: 'Initial payment held in escrow',
      });

      return escrow;
    });
  }

  /**
   * Release escrow funds to Service Provider
   * Triggered by Admin
   */
  async releaseEscrow(escrowId: string, adminUserId: string) {
    return await db.transaction(async (tx) => {
      // 1. Get escrow record with SP details
      const escrow = await tx.query.escrowTransactions.findFirst({
        where: eq(escrowTransactions.id, escrowId),
        with: {
          serviceProvider: true,
        }
      });

      if (!escrow) throw new Error('Escrow transaction not found');
      if (escrow.status !== 'held') throw new Error(`Cannot release funds. Current status: ${escrow.status}`);

      // 2. Get SP phone number for B2C
      const spUser = await tx.query.users.findFirst({
        where: eq(users.id, escrow.serviceProvider.userId)
      });
      
      const receiverNumber = spUser?.phoneNumber; 
      if (!receiverNumber) throw new Error('Service Provider phone number not found');

      // 3. Initiate B2C Disbursement
      const reference = `REL-${escrowId.substring(0, 8)}`;
      const disbursementResponse = await sasaPayService.disburseFunds({
        merchantTransactionReference: reference,
        amount: escrow.spPayout,
        receiverNumber: receiverNumber,
        reason: `Escrow release for placement ${escrow.placementId}`,
        callbackUrl: `${process.env.API_URL}/api/sasapay/callback/b2c`,
      });

      // 4. Create Disbursement record
      const [disbursement] = await tx.insert(disbursements).values({
        disbursementType: 'escrow_release',
        placementId: escrow.placementId,
        b2cRequestId: disbursementResponse.B2CRequestID,
        amount: escrow.spPayout,
        receiverNumber: receiverNumber,
        status: 'pending', // Will be updated via callback
        initiatedBy: adminUserId,
      }).returning();

      // 5. Update Escrow status
      await tx.update(escrowTransactions)
        .set({
          status: 'released',
          releasedAt: new Date(),
          releasedBy: adminUserId,
        })
        .where(eq(escrowTransactions.id, escrowId));

      // 6. Update Ledger
      await tx.insert(escrowLedger).values({
        escrowTransactionId: escrow.id,
        eventType: 'released',
        amount: escrow.spPayout,
        balanceBefore: escrow.totalAmount,
        balanceAfter: escrow.platformCommission, // Remaining is commission
        performedBy: adminUserId,
        reason: 'Funds released to Service Provider',
      });

      return { escrow, disbursement };
    });
  }

  /**
   * Refund escrow funds to Client
   * Triggered by Admin
   */
  async refundEscrow(escrowId: string, adminUserId: string, reason: string) {
    return await db.transaction(async (tx) => {
      const escrow = await tx.query.escrowTransactions.findFirst({
        where: eq(escrowTransactions.id, escrowId),
        with: {
          client: true,
        }
      });

      if (!escrow) throw new Error('Escrow transaction not found');
      if (escrow.status !== 'held') throw new Error(`Cannot refund funds. Current status: ${escrow.status}`);

      // Get Client phone number
      const clientUser = await tx.query.users.findFirst({
        where: eq(users.id, escrow.client.userId)
      });
      const receiverNumber = clientUser?.phoneNumber;
      if (!receiverNumber) throw new Error('Client phone number not found');

      // Initiate B2C Refund
      const reference = `REF-${escrowId.substring(0, 8)}`;
      const disbursementResponse = await sasaPayService.disburseFunds({
        merchantTransactionReference: reference,
        amount: escrow.totalAmount, // Refund full amount
        receiverNumber: receiverNumber,
        reason: `Refund: ${reason}`,
        callbackUrl: `${process.env.API_URL}/api/sasapay/callback/b2c`,
      });

      // Create Disbursement record
      const [disbursement] = await tx.insert(disbursements).values({
        disbursementType: 'refund',
        placementId: escrow.placementId,
        b2cRequestId: disbursementResponse.B2CRequestID,
        amount: escrow.totalAmount,
        receiverNumber: receiverNumber,
        status: 'pending',
        initiatedBy: adminUserId,
        reason: reason,
      }).returning();

      // Update Escrow status
      await tx.update(escrowTransactions)
        .set({
          status: 'refunded',
          refundedAt: new Date(),
          refundedBy: adminUserId,
          refundAmount: escrow.totalAmount,
          refundReason: reason,
        })
        .where(eq(escrowTransactions.id, escrowId));

      // Update Ledger
      await tx.insert(escrowLedger).values({
        escrowTransactionId: escrow.id,
        eventType: 'refunded',
        amount: escrow.totalAmount,
        balanceBefore: escrow.totalAmount,
        balanceAfter: '0.00',
        performedBy: adminUserId,
        reason: `Refunded to client: ${reason}`,
      });

      return { escrow, disbursement };
    });
  }
}

export const escrowService = new EscrowService();
