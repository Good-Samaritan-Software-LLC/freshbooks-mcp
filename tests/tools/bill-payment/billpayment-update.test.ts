/**
 * Tests for billpayment_update tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { billpaymentUpdateTool } from '../../../src/tools/bill-payment/billpayment-update.js';
import { createMockClientWrapper } from '../../mocks/client.js';
import {
  mockBillPaymentUpdateResponse,
  mockBillPaymentNotFoundError,
  mockBillPaymentValidationError,
} from '../../mocks/responses/bill-payment.js';
import {
  mockUnauthorizedError,
  mockRateLimitError,
  mockServerError,
  mockNetworkTimeoutError,
} from '../../mocks/errors/freshbooks-errors.js';

describe('billpayment_update tool', () => {
  let mockClient: ReturnType<typeof createMockClientWrapper>;

  const validInput = {
    accountId: 'ABC123',
    billPaymentId: 12345,
    amount: { amount: '600.00', code: 'USD' },
  };

  beforeEach(() => {
    mockClient = createMockClientWrapper();
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should update bill payment amount', async () => {
      const mockResponse = mockBillPaymentUpdateResponse(12345, {
        amount: { amount: '600.00', code: 'USD' },
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billpaymentUpdateTool.execute(validInput, mockClient as any);

      expect(result.id).toBe(12345);
      expect(result.amount.amount).toBe('600.00');
    });

    it('should update bill payment type', async () => {
      const mockResponse = mockBillPaymentUpdateResponse(12345, {
        paymentType: 'bank_transfer',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billpaymentUpdateTool.execute(
        { accountId: 'ABC123', billPaymentId: 12345, paymentType: 'bank_transfer' as const },
        mockClient as any
      );

      expect(result.paymentType).toBe('bank_transfer');
    });

    it('should update bill payment date', async () => {
      const mockResponse = mockBillPaymentUpdateResponse(12345, {
        paidDate: '2024-02-15T00:00:00Z',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billpaymentUpdateTool.execute(
        { accountId: 'ABC123', billPaymentId: 12345, paidDate: '2024-02-15' },
        mockClient as any
      );

      // API returns full datetime, but input accepts YYYY-MM-DD
      expect(result.paidDate).toBe('2024-02-15T00:00:00Z');
    });

    it('should update bill payment note', async () => {
      const mockResponse = mockBillPaymentUpdateResponse(12345, {
        note: 'Updated payment note',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billpaymentUpdateTool.execute(
        { accountId: 'ABC123', billPaymentId: 12345, note: 'Updated payment note' },
        mockClient as any
      );

      expect(result.note).toBe('Updated payment note');
    });

    it('should update multiple fields at once', async () => {
      const mockResponse = mockBillPaymentUpdateResponse(12345, {
        amount: { amount: '750.00', code: 'USD' },
        paymentType: 'credit',
        note: 'Changed to credit card',
      });

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            update: vi.fn().mockResolvedValue(mockResponse),
          },
        };
        return apiCall(client);
      });

      const result = await billpaymentUpdateTool.execute(
        {
          accountId: 'ABC123',
          billPaymentId: 12345,
          amount: { amount: '750.00', code: 'USD' },
          paymentType: 'credit' as const,
          note: 'Changed to credit card',
        },
        mockClient as any
      );

      expect(result.amount.amount).toBe('750.00');
      expect(result.paymentType).toBe('credit');
      expect(result.note).toBe('Changed to credit card');
    });

    it('should call API with correct parameters', async () => {
      const mockResponse = mockBillPaymentUpdateResponse(12345, {});
      const updateFn = vi.fn().mockResolvedValue(mockResponse);

      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            update: updateFn,
          },
        };
        return apiCall(client);
      });

      await billpaymentUpdateTool.execute(validInput, mockClient as any);

      expect(updateFn).toHaveBeenCalledWith({ amount: { amount: '600.00', code: 'USD' } }, 'ABC123', 12345);
    });
  });

  describe('error handling', () => {
    it('should handle not found error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            update: vi.fn().mockResolvedValue(mockBillPaymentNotFoundError(99999)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billpaymentUpdateTool.execute(
          { accountId: 'ABC123', billPaymentId: 99999, note: 'test' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should handle unauthorized error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            update: vi.fn().mockResolvedValue(mockUnauthorizedError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billpaymentUpdateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle rate limit error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            update: vi.fn().mockResolvedValue(mockRateLimitError(60)),
          },
        };
        return apiCall(client);
      });

      await expect(
        billpaymentUpdateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            update: vi.fn().mockResolvedValue(mockServerError()),
          },
        };
        return apiCall(client);
      });

      await expect(
        billpaymentUpdateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle network timeout', async () => {
      mockClient.executeWithRetry.mockRejectedValueOnce(mockNetworkTimeoutError());

      await expect(
        billpaymentUpdateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });

    it('should handle validation error for invalid amount', async () => {
      mockClient.executeWithRetry.mockImplementation(async (operation, apiCall) => {
        const client = {
          billPayments: {
            update: vi.fn().mockResolvedValue(
              mockBillPaymentValidationError('amount', 'Invalid amount format')
            ),
          },
        };
        return apiCall(client);
      });

      await expect(
        billpaymentUpdateTool.execute(validInput, mockClient as any)
      ).rejects.toThrow();
    });
  });

  describe('input validation', () => {
    it('should require accountId', async () => {
      await expect(
        billpaymentUpdateTool.execute(
          { billPaymentId: 12345, note: 'test' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should require billPaymentId', async () => {
      await expect(
        billpaymentUpdateTool.execute(
          { accountId: 'ABC123', note: 'test' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject non-numeric billPaymentId', async () => {
      await expect(
        billpaymentUpdateTool.execute(
          { accountId: 'ABC123', billPaymentId: 'invalid', note: 'test' } as any,
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject invalid date format', async () => {
      await expect(
        billpaymentUpdateTool.execute(
          { accountId: 'ABC123', billPaymentId: 12345, paidDate: 'invalid-date' },
          mockClient as any
        )
      ).rejects.toThrow();
    });

    it('should reject invalid payment type', async () => {
      await expect(
        billpaymentUpdateTool.execute(
          { accountId: 'ABC123', billPaymentId: 12345, paymentType: 'invalid_type' as any },
          mockClient as any
        )
      ).rejects.toThrow();
    });
  });
});
