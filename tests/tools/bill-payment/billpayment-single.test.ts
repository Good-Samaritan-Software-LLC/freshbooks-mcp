/**
 * Tests for billpayment_single tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { billpaymentSingleTool } from '../../../src/tools/bill-payment/billpayment-single.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockBillPaymentSingleResponse,
  createMockBillPayment,
  mockBillPaymentNotFoundError,
} from '../../mocks/responses/bill-payment.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('billpayment_single tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should retrieve a bill payment by ID', async () => {
      const mockResponse = mockBillPaymentSingleResponse({ id: 12345 });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billpaymentSingleTool.execute(
        { accountId: 'ABC123', billPaymentId: 12345 },
        mockClient as any
      );

      expect(result.id).toBe(12345);
    });

    it('should return complete bill payment details', async () => {
      const mockResponse = mockBillPaymentSingleResponse({
        id: 12345,
        billId: 5001,
        paymentType: 'check',
        note: 'January payment',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billpaymentSingleTool.execute(
        { accountId: 'ABC123', billPaymentId: 12345 },
        mockClient as any
      );

      expect(result.id).toBe(12345);
      expect(result.billId).toBe(5001);
      expect(result.paymentType).toBe('check');
      expect(result.note).toBe('January payment');
    });

    it('should return bill payment with amount details', async () => {
      const mockResponse = mockBillPaymentSingleResponse({
        amount: { amount: '500.00', code: 'USD' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billpaymentSingleTool.execute(
        { accountId: 'ABC123', billPaymentId: 12345 },
        mockClient as any
      );

      expect(result.amount.amount).toBe('500.00');
      expect(result.amount.code).toBe('USD');
    });

    it('should return bill payment with date details', async () => {
      const mockResponse = mockBillPaymentSingleResponse({
        paidDate: '2024-01-20T00:00:00Z',
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-01-20T10:00:00Z',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billpaymentSingleTool.execute(
        { accountId: 'ABC123', billPaymentId: 12345 },
        mockClient as any
      );

      expect(result.paidDate).toBe('2024-01-20T00:00:00Z');
    });

    it('should handle all payment types', async () => {
      const paymentTypes = ['check', 'credit', 'cash', 'bank_transfer', 'debit', 'other'];

      for (const paymentType of paymentTypes) {
        const mockResponse = mockBillPaymentSingleResponse({ paymentType });

        mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
          const client = {
            billPayments: {
              single: vi.fn().mockResolvedValue(mockResponse),
            },
          };
          return apiCall(client);
        });

        const result = await billpaymentSingleTool.execute(
          { accountId: 'ABC123', billPaymentId: 12345 },
          mockClient as any
        );

        expect(result.paymentType).toBe(paymentType);
      }
    });

    it('should handle bill payment with matchedWithExpense flag', async () => {
      const mockResponse = mockBillPaymentSingleResponse({
        matchedWithExpense: true,
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            single: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billpaymentSingleTool.execute(
        { accountId: 'ABC123', billPaymentId: 12345 },
        mockClient as any
      );

      expect(result.matchedWithExpense).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            single: vi.fn().mockResolvedValue(mockBillPaymentNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billpaymentSingleTool.execute(
          { accountId: 'ABC123', billPaymentId: 99999 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            single: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billpaymentSingleTool.execute(
          { accountId: 'ABC123', billPaymentId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            single: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billpaymentSingleTool.execute(
          { accountId: 'ABC123', billPaymentId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            single: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billpaymentSingleTool.execute(
          { accountId: 'ABC123', billPaymentId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        billpaymentSingleTool.execute(
          { accountId: 'ABC123', billPaymentId: 12345 },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        billpaymentSingleTool.execute({ billPaymentId: 12345 } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should require billPaymentId', async () => {
      await expect(
        billpaymentSingleTool.execute({ accountId: 'ABC123' } as any, mockClient as any)
      ).rejects.toThrow();
    });

    it('should reject non-numeric billPaymentId', async () => {
      await expect(
        billpaymentSingleTool.execute(
          { accountId: 'ABC123', billPaymentId: 'invalid' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
