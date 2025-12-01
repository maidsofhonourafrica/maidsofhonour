import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EscrowService } from './escrow.service';
import { sasaPayService } from './sasapay';
import { db } from '../db';

// Mock dependencies
vi.mock('../db', () => ({
  db: {
    transaction: vi.fn((callback) => callback(db)),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    query: {
      escrowTransactions: {
        findFirst: vi.fn(),
      },
      users: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

vi.mock('./sasapay', () => ({
  sasaPayService: {
    disburseFunds: vi.fn(),
  },
}));

describe('EscrowService', () => {
  let escrowService: EscrowService;

  beforeEach(() => {
    escrowService = new EscrowService();
    vi.clearAllMocks();
  });

  describe('createEscrowTransaction', () => {
    it('should calculate commission and create escrow record', async () => {
      const mockEscrow = { id: 'escrow-123', totalAmount: '1000', platformCommission: '100', spPayout: '900' };
      
      // Mock DB insert return
      const returningMock = vi.fn().mockResolvedValue([mockEscrow]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      (db.insert as any).mockReturnValue({ values: valuesMock });

      const result = await escrowService.createEscrowTransaction(
        'placement-1',
        'client-1',
        'sp-1',
        '1000',
        'tx-1'
      );

      expect(result).toEqual(mockEscrow);
      expect(db.insert).toHaveBeenCalledTimes(2); // Escrow + Ledger
      
      // Verify commission calculation (10%)
      // First insert is escrowTransactions
      expect(valuesMock).toHaveBeenNthCalledWith(1, expect.objectContaining({
        totalAmount: '1000',
        platformCommission: '100',
        spPayout: '900',
      }));
    });
  });

  describe('releaseEscrow', () => {
    it('should release funds to SP via SasaPay B2C', async () => {
      const mockEscrow = {
        id: 'escrow-123',
        placementId: 'placement-1',
        serviceProviderId: 'sp-1',
        spPayout: '900',
        totalAmount: '1000',
        platformCommission: '100',
        status: 'held',
        serviceProvider: { userId: 'user-sp' }
      };
      const mockSpUser = { phoneNumber: '254712345678' };
      const mockDisbursementResponse = {
        B2CRequestID: 'b2c-req-1',
        ConversationID: 'conv-1',
      };
      const mockDisbursement = { id: 'disb-1' };

      // Mock DB queries
      (db.query.escrowTransactions.findFirst as any).mockResolvedValue(mockEscrow);
      (db.query.users.findFirst as any).mockResolvedValue(mockSpUser);

      // Mock SasaPay
      (sasaPayService.disburseFunds as any).mockResolvedValue(mockDisbursementResponse);

      // Mock DB inserts/updates
      const returningMock = vi.fn().mockResolvedValue([mockDisbursement]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      (db.insert as any).mockReturnValue({ values: valuesMock });

      const result = await escrowService.releaseEscrow('escrow-123', 'admin-1');

      expect(sasaPayService.disburseFunds).toHaveBeenCalledWith(expect.objectContaining({
        amount: '900',
        receiverNumber: '254712345678',
      }));

      expect(db.update).toHaveBeenCalled();
      expect(result.escrow).toEqual(mockEscrow);
      expect(result.disbursement).toEqual(mockDisbursement);
    });

    it('should throw error if escrow not found or not held', async () => {
      (db.query.escrowTransactions.findFirst as any).mockResolvedValue(null);
      await expect(escrowService.releaseEscrow('invalid', 'admin')).rejects.toThrow('Escrow transaction not found');

      (db.query.escrowTransactions.findFirst as any).mockResolvedValue({ status: 'released' });
      await expect(escrowService.releaseEscrow('valid', 'admin')).rejects.toThrow('Cannot release funds');
    });
  });

  describe('refundEscrow', () => {
    it('should refund funds to Client via SasaPay B2C', async () => {
      const mockEscrow = {
        id: 'escrow-123',
        placementId: 'placement-1',
        clientId: 'client-1',
        totalAmount: '1000',
        status: 'held',
        client: { userId: 'user-client' }
      };
      const mockClientUser = { phoneNumber: '254787654321' };
      const mockDisbursementResponse = {
        B2CRequestID: 'b2c-req-2',
        ConversationID: 'conv-2',
      };
      const mockDisbursement = { id: 'disb-2' };

      (db.query.escrowTransactions.findFirst as any).mockResolvedValue(mockEscrow);
      (db.query.users.findFirst as any).mockResolvedValue(mockClientUser);
      (sasaPayService.disburseFunds as any).mockResolvedValue(mockDisbursementResponse);

      const returningMock = vi.fn().mockResolvedValue([mockDisbursement]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      (db.insert as any).mockReturnValue({ values: valuesMock });

      const result = await escrowService.refundEscrow('escrow-123', 'admin-1', 'Service not delivered');

      expect(sasaPayService.disburseFunds).toHaveBeenCalledWith(expect.objectContaining({
        amount: '1000',
        receiverNumber: '254787654321',
        reason: 'Refund: Service not delivered'
      }));

      expect(result.disbursement).toEqual(mockDisbursement);
    });
  });
});
